import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingRecord, UserProfile } from "../lib/storage";

const originalMongoUri = process.env.MONGODB_URI;
const originalAdminEmail = process.env.ADMIN_EMAIL;
const originalSuperAdmin = process.env.SUPER_ADMIN_EMAILS;

beforeAll(() => {
  process.env.TTP_STORE = "memory";
  delete process.env.MONGODB_URI;
  process.env.ADMIN_EMAIL = "superadmin@thetemplepuja.com";
  process.env.SUPER_ADMIN_EMAILS = "superadmin@thetemplepuja.com,lead_approver@thetemplepuja.com";
});

afterAll(() => {
  delete process.env.TTP_STORE;
  if (originalMongoUri) process.env.MONGODB_URI = originalMongoUri;
  else delete process.env.MONGODB_URI;
  if (originalAdminEmail) process.env.ADMIN_EMAIL = originalAdminEmail;
  else delete process.env.ADMIN_EMAIL;
  if (originalSuperAdmin) process.env.SUPER_ADMIN_EMAILS = originalSuperAdmin;
  else delete process.env.SUPER_ADMIN_EMAILS;
});

let refundService: typeof import("../lib/refund-service");
let serverStore: typeof import("../lib/server-store");
let razorpayModule: typeof import("../lib/razorpay");

const mockUser: UserProfile = {
  id: "USR_TEST_1",
  name: "Rajesh Sharma",
  phone: "9876543210",
  email: "rajesh@example.com",
  gotra: "Kashyap",
  city: "Varanasi",
  address: "Ghat Road",
  createdAt: "2026-10-01T10:00:00.000Z",
  bookings: [
    {
      bookingId: "BK_RAZORPAY_1",
      poojaSlug: "rudrabhishek",
      poojaTitle: "Maha Rudrabhishek",
      date: "2026-10-25",
      time: "08:00 AM",
      panditName: "Acharya Shastri",
      amount: 2100,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      currency: "INR",
      status: "confirmed",
      paymentMethod: "razorpay",
      razorpayPaymentId: "pay_test_razorpay_999",
      createdAt: "2026-10-01T10:00:00.000Z",
    },
    {
      bookingId: "BK_UPI_1",
      poojaSlug: "satyanarayan",
      poojaTitle: "Satyanarayan Katha",
      date: "2026-10-26",
      time: "10:00 AM",
      panditName: "Acharya Shastri",
      amount: 1101,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      currency: "INR",
      status: "confirmed",
      paymentMethod: "upi_qr",
      upiTransactionId: "UPI987654321012",
      createdAt: "2026-10-02T10:00:00.000Z",
    },
  ],
};

beforeEach(async () => {
  vi.resetModules();
  process.env.TTP_STORE = "memory";
  serverStore = await import("../lib/server-store");
  refundService = await import("../lib/refund-service");
  razorpayModule = await import("../lib/razorpay");

  // Seed user
  await serverStore.withFallback((s) => s.saveUser(JSON.parse(JSON.stringify(mockUser))));
});

describe("Approval-Based Refund Workflow", () => {
  describe("Role & Permissions Checking", () => {
    it("identifies super_admin vs standard admin correctly", () => {
      expect(refundService.getAdminRole("superadmin@thetemplepuja.com")).toBe("super_admin");
      expect(refundService.getAdminRole("lead_approver@thetemplepuja.com")).toBe("super_admin");
      expect(refundService.getAdminRole("staff_admin@thetemplepuja.com")).toBe("admin");

      expect(refundService.canApproveRefunds("superadmin@thetemplepuja.com")).toBe(true);
      expect(refundService.canApproveRefunds("staff_admin@thetemplepuja.com")).toBe(false);
      expect(refundService.canRequestRefunds("staff_admin@thetemplepuja.com")).toBe(true);
    });
  });

  describe("Step 1: Refund Request Submission", () => {
    it("submits a refund request without changing booking or financial status", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee family emergency",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      expect(req.id).toMatch(/^ref_req_/);
      expect(req.status).toBe("pending_approval");
      expect(req.requestedAmount).toBe(2100);
      expect(req.requestedBy).toBe("staff_admin@thetemplepuja.com");
      expect(req.auditTrail).toHaveLength(1);
      expect(req.auditTrail[0].action).toBe("requested");

      // Verify the original booking status is UNCHANGED
      const users = await serverStore.withFallback((s) => s.getUsers());
      const b = users[0].bookings.find((x) => x.bookingId === "BK_RAZORPAY_1");
      expect(b?.status).toBe("confirmed");
      expect(b?.refundedAt).toBeUndefined();
    });

    it("rejects invalid amounts <= 0", async () => {
      await expect(
        refundService.createRefundRequest({
          bookingId: "BK_RAZORPAY_1",
          requestedAmount: 0,
          reason: "Testing zero",
          requestedBy: "staff_admin@thetemplepuja.com",
        })
      ).rejects.toThrow("Requested refund amount must be greater than zero.");
    });

    it("rejects refund amounts exceeding remaining refundable balance", async () => {
      await expect(
        refundService.createRefundRequest({
          bookingId: "BK_RAZORPAY_1",
          requestedAmount: 5000,
          reason: "Too high",
          requestedBy: "staff_admin@thetemplepuja.com",
        })
      ).rejects.toThrow(/exceeds the remaining refundable amount/);
    });

    it("rejects duplicate active requests for the same booking", async () => {
      await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 1000,
        reason: "First request",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await expect(
        refundService.createRefundRequest({
          bookingId: "BK_RAZORPAY_1",
          requestedAmount: 500,
          reason: "Second concurrent request",
          requestedBy: "staff_admin@thetemplepuja.com",
        })
      ).rejects.toThrow(/An active refund request .* is already pending approval/);
    });
  });

  describe("Step 2 & 3: Review, Separation of Duties, and Approval / Rejection", () => {
    it("enforces separation of duties: requesting admin CANNOT approve their own request", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee requested refund",
        requestedBy: "superadmin@thetemplepuja.com",
      });

      // superadmin submitted it, so superadmin must NOT be allowed to self-approve
      await expect(
        refundService.approveRefundRequest({
          requestId: req.id,
          approverEmail: "superadmin@thetemplepuja.com",
        })
      ).rejects.toThrow(
        /Separation of duties violation: An administrator cannot approve their own refund request/
      );
    });

    it("rejects approval attempts by unauthorized standard admin", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee requested refund",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await expect(
        refundService.approveRefundRequest({
          requestId: req.id,
          approverEmail: "staff_admin@thetemplepuja.com",
        })
      ).rejects.toThrow(/Only an authorized approver .* can approve refund requests/);
    });

    it("allows a different super admin to approve successfully", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee cancellation",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      const approved = await refundService.approveRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      expect(approved.status).toBe("approved");
      expect(approved.decidedBy).toBe("superadmin@thetemplepuja.com");
      expect(approved.auditTrail.some((a) => a.action === "approved")).toBe(true);
    });

    it("requires a clear rejection reason when rejecting a request", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee cancellation",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await expect(
        refundService.rejectRefundRequest({
          requestId: req.id,
          approverEmail: "superadmin@thetemplepuja.com",
          rejectionReason: "   ",
        })
      ).rejects.toThrow("A clear rejection reason is mandatory when rejecting a refund request.");

      const rejected = await refundService.rejectRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
        rejectionReason: "Puja sankalp already completed by Panditji in morning muhurat.",
      });

      expect(rejected.status).toBe("rejected");
      expect(rejected.rejectionReason).toBe(
        "Puja sankalp already completed by Panditji in morning muhurat."
      );
      expect(rejected.auditTrail.some((a) => a.action === "rejected")).toBe(true);
    });
  });

  describe("Step 4: Execution of Approved Refunds", () => {
    it("executes an approved Razorpay refund via authoritative gateway", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee cancellation",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await refundService.approveRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      // Mock Razorpay gateway API response
      vi.spyOn(razorpayModule, "createRazorpayRefund").mockResolvedValue({
        id: "rfnd_razorpay_success_123",
        entity: "refund",
        amount: 210000,
        currency: "INR",
        payment_id: "pay_test_razorpay_999",
        status: "processed",
        created_at: 1729000000,
      });

      const executed = await refundService.executeApprovedRefund({
        requestId: req.id,
        executorEmail: "superadmin@thetemplepuja.com",
      });

      expect(executed.status).toBe("completed");
      expect(executed.providerRefundId).toBe("rfnd_razorpay_success_123");
      expect(executed.providerStatus).toBe("processed");

      // Verify the booking is now marked refunded
      const users = await serverStore.withFallback((s) => s.getUsers());
      const b = users[0].bookings.find((x) => x.bookingId === "BK_RAZORPAY_1");
      expect(b?.status).toBe("refunded");
      expect(b?.refundedAt).toBeDefined();
    });

    it("handles Razorpay execution failures without marking booking as refunded", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee cancellation",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await refundService.approveRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      // Mock gateway failure
      vi.spyOn(razorpayModule, "createRazorpayRefund").mockRejectedValue(
        new Error("BAD_REQUEST_ERROR: Payment already settled or insufficient merchant balance")
      );

      await expect(
        refundService.executeApprovedRefund({
          requestId: req.id,
          executorEmail: "superadmin@thetemplepuja.com",
        })
      ).rejects.toThrow(/Payment gateway refund execution failed/);

      const refreshedReq = await refundService.findRefundRequestById(req.id);
      expect(refreshedReq?.status).toBe("failed");
      expect(refreshedReq?.executionError).toContain("insufficient merchant balance");

      // Booking status must NOT be modified
      const users = await serverStore.withFallback((s) => s.getUsers());
      const b = users[0].bookings.find((x) => x.bookingId === "BK_RAZORPAY_1");
      expect(b?.status).toBe("confirmed");
      expect(b?.refundedAt).toBeUndefined();
    });

    it("requires manual payout UTR for UPI QR refunds and records audit trail", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_UPI_1",
        requestedAmount: 1101,
        reason: "Devotee request",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await refundService.approveRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      // Attempting execution without manual settlement reference must fail
      await expect(
        refundService.executeApprovedRefund({
          requestId: req.id,
          executorEmail: "superadmin@thetemplepuja.com",
        })
      ).rejects.toThrow(/Automated refund is unavailable .* Manual settlement required/);

      // Now execute with valid settlement UTR reference
      const executed = await refundService.executeApprovedRefund({
        requestId: req.id,
        executorEmail: "superadmin@thetemplepuja.com",
        manualSettlement: {
          settlementReference: "BANK_UTR_202610150999",
          executionNotes: "Transferred back to devotee's GPay VPA via ICICI NetBanking",
        },
      });

      expect(executed.status).toBe("completed");
      expect(executed.providerRefundId).toBe("BANK_UTR_202610150999");
      expect(executed.providerStatus).toBe("manual_settled");
      expect(executed.executionNotes).toContain("GPay VPA");

      const users = await serverStore.withFallback((s) => s.getUsers());
      const b = users[0].bookings.find((x) => x.bookingId === "BK_UPI_1");
      expect(b?.status).toBe("refunded");
    });

    it("supports partial refunds and accurately tracks remaining refundable amount", async () => {
      // Original amount is 2100. Request partial refund of 600.
      const req1 = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 600,
        reason: "Partial price adjustment",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await refundService.approveRefundRequest({
        requestId: req1.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      vi.spyOn(razorpayModule, "createRazorpayRefund").mockResolvedValue({
        id: "rfnd_part_1",
        entity: "refund",
        amount: 60000,
        currency: "INR",
        payment_id: "pay_test_razorpay_999",
        status: "processed",
        created_at: 1729000000,
      });

      await refundService.executeApprovedRefund({
        requestId: req1.id,
        executorEmail: "superadmin@thetemplepuja.com",
      });

      // Partial refund executed: booking status remains confirmed, but refundedAt is set
      let users = await serverStore.withFallback((s) => s.getUsers());
      let b = users[0].bookings.find((x) => x.bookingId === "BK_RAZORPAY_1");
      expect(b?.status).toBe("confirmed");
      expect(b?.refundedAt).toBeDefined();

      // Now, try requesting more than remaining 1500 (e.g. 1600) -> must fail!
      await expect(
        refundService.createRefundRequest({
          bookingId: "BK_RAZORPAY_1",
          requestedAmount: 1600,
          reason: "Excess partial",
          requestedBy: "staff_admin@thetemplepuja.com",
        })
      ).rejects.toThrow(/exceeds the remaining refundable amount of ₹1500/);

      // Request exact remaining 1500 -> must succeed
      const req2 = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 1500,
        reason: "Remaining balance",
        requestedBy: "staff_admin@thetemplepuja.com",
      });
      expect(req2.remainingRefundableAmount).toBe(1500);
      expect(req2.previouslyRefundedAmount).toBe(600);
    });
  });

  describe("Idempotency & Re-execution Protection", () => {
    it("prevents duplicate execution of completed refunds", async () => {
      const req = await refundService.createRefundRequest({
        bookingId: "BK_RAZORPAY_1",
        requestedAmount: 2100,
        reason: "Devotee cancellation",
        requestedBy: "staff_admin@thetemplepuja.com",
      });

      await refundService.approveRefundRequest({
        requestId: req.id,
        approverEmail: "superadmin@thetemplepuja.com",
      });

      vi.spyOn(razorpayModule, "createRazorpayRefund").mockResolvedValue({
        id: "rfnd_idem_1",
        entity: "refund",
        amount: 210000,
        currency: "INR",
        payment_id: "pay_test_razorpay_999",
        status: "processed",
        created_at: 1729000000,
      });

      await refundService.executeApprovedRefund({
        requestId: req.id,
        executorEmail: "superadmin@thetemplepuja.com",
      });

      // Second execution attempt must be blocked
      await expect(
        refundService.executeApprovedRefund({
          requestId: req.id,
          executorEmail: "superadmin@thetemplepuja.com",
        })
      ).rejects.toThrow("This refund has already been completed and executed.");
    });
  });
});

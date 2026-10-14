/**
 * Core business logic and security controls for approval-based refund workflow.
 */

import { withFallback } from "./server-store";
import type { BookingRecord, UserProfile } from "./storage";
import type { AdminRole, RefundAuditLog, RefundRequest, RefundRequestStatus } from "./refund-types";
import { createRazorpayRefund } from "./razorpay";
import { broadcastRealtime } from "./realtime";
import { getBookingDevoteeDisplay } from "./booking-export";

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Determine the administrative role based on admin email.
 */
export function getAdminRole(email: string): AdminRole {
  const normalized = email.trim().toLowerCase();
  const defaultEmail = (process.env.ADMIN_EMAIL || "admin@thetemplepuja.com").trim().toLowerCase();

  if (SUPER_ADMIN_EMAILS.includes(normalized) || normalized === defaultEmail) {
    return "super_admin";
  }
  return "admin";
}

export function canApproveRefunds(email: string): boolean {
  return getAdminRole(email) === "super_admin";
}

export function canRequestRefunds(email: string): boolean {
  // Both standard admin and super admin can submit refund requests
  return Boolean(email && email.trim());
}

/**
 * Retrieve all refund requests, sorted newest first.
 */
export async function listAllRefundRequests(): Promise<RefundRequest[]> {
  const list = await withFallback((s) => s.getRefundRequests());
  return list.sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

/**
 * Find a refund request by ID.
 */
export async function findRefundRequestById(
  id: string
): Promise<RefundRequest | undefined> {
  return withFallback((s) => s.findRefundRequestById(id));
}

/**
 * Submit a refund request (Step 1).
 * Validates refundable limits, captures audit record, and sets status to pending_approval.
 * Does NOT alter the financial transaction or the order status.
 */
export async function createRefundRequest(input: {
  bookingId: string;
  orderId?: string;
  requestedAmount: number;
  reason: string;
  requestedBy: string; // admin email
}): Promise<RefundRequest> {
  const reqEmail = input.requestedBy.trim().toLowerCase();
  if (!reqEmail) {
    throw new Error("Requesting administrator email is required.");
  }
  if (!input.reason || !input.reason.trim()) {
    throw new Error("A clear reason for the refund request is required.");
  }
  if (typeof input.requestedAmount !== "number" || input.requestedAmount <= 0) {
    throw new Error("Requested refund amount must be greater than zero.");
  }

  // Find user and booking
  const users = await withFallback((s) => s.getUsers());
  let foundUser: UserProfile | undefined;
  let foundBooking: BookingRecord | undefined;

  for (const u of users) {
    const b = u.bookings.find(
      (x) => x.bookingId.toUpperCase() === input.bookingId.trim().toUpperCase()
    );
    if (b) {
      foundUser = u;
      foundBooking = b;
      break;
    }
  }

  if (!foundUser || !foundBooking) {
    throw new Error(`Booking ${input.bookingId} not found.`);
  }

  if (foundBooking.status === "failed" || foundBooking.status === "cancelled") {
    throw new Error(
      `Cannot request refund for booking with status "${foundBooking.status}".`
    );
  }

  // Calculate previously completed/approved refunds for this booking
  const allRequests = await withFallback((s) => s.getRefundRequests());
  const existingForBooking = allRequests.filter(
    (r) => r.bookingId === foundBooking!.bookingId
  );

  // Check for any active pending request
  const activePending = existingForBooking.find(
    (r) => r.status === "pending_approval" || r.status === "approved" || r.status === "processing"
  );
  if (activePending) {
    throw new Error(
      `An active refund request (${activePending.id}) is already ${activePending.status.replace("_", " ")} for this booking.`
    );
  }

  const previouslyRefundedAmount = existingForBooking
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.requestedAmount, 0);

  const remainingRefundableAmount = Math.max(
    0,
    foundBooking.amount - previouslyRefundedAmount
  );

  if (remainingRefundableAmount <= 0) {
    throw new Error("This booking has already been fully refunded.");
  }

  if (input.requestedAmount > remainingRefundableAmount) {
    throw new Error(
      `Requested amount (₹${input.requestedAmount}) exceeds the remaining refundable amount of ₹${remainingRefundableAmount}.`
    );
  }

  const devoteeInfo = getBookingDevoteeDisplay(foundBooking, foundUser);
  const paymentMethod =
    foundBooking.paymentMethod ||
    (foundBooking.razorpayPaymentId
      ? "razorpay"
      : foundBooking.upiTransactionId
      ? "upi_qr"
      : "simulated");

  const now = new Date().toISOString();
  const requestId =
    "ref_req_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const newRequest: RefundRequest = {
    id: requestId,
    orderId: input.orderId || foundBooking.bookingId,
    bookingId: foundBooking.bookingId,
    userId: foundUser.id,
    customerName: devoteeInfo.primaryName || foundUser.name,
    customerPhone: foundUser.phone,
    customerEmail: foundUser.email || undefined,
    poojaTitle: foundBooking.poojaTitle,
    paymentMethod,
    paymentReference:
      foundBooking.razorpayPaymentId ||
      foundBooking.upiTransactionId ||
      undefined,
    originalAmount: foundBooking.amount,
    currency: foundBooking.currency || "INR",
    requestedAmount: Math.round(input.requestedAmount),
    previouslyRefundedAmount,
    remainingRefundableAmount,
    reason: input.reason.trim(),
    requestedBy: reqEmail,
    requestedAt: now,
    status: "pending_approval",
    auditTrail: [
      {
        action: "requested",
        performedBy: reqEmail,
        timestamp: now,
        details: `Submitted refund request for ₹${input.requestedAmount} (${foundBooking.currency || "INR"}). Reason: ${input.reason.trim()}`,
      },
    ],
  };

  await withFallback((s) => s.saveRefundRequest(newRequest));
  broadcastRealtime({ type: "catalog_updated", section: "poojas" });

  return newRequest;
}

/**
 * Approve a pending refund request (Step 3).
 * Enforces:
 * 1. Approver role requirement (super_admin / authorized approver).
 * 2. Separation of duties: requesting admin cannot approve their own request.
 */
export async function approveRefundRequest(input: {
  requestId: string;
  approverEmail: string;
}): Promise<RefundRequest> {
  const approver = input.approverEmail.trim().toLowerCase();
  if (!canApproveRefunds(approver)) {
    throw new Error(
      "Unauthorized: Only an authorized approver (Super Admin) can approve refund requests."
    );
  }

  const req = await findRefundRequestById(input.requestId);
  if (!req) {
    throw new Error(`Refund request ${input.requestId} not found.`);
  }

  if (req.status !== "pending_approval") {
    throw new Error(
      `Cannot approve request in "${req.status}" state. Only pending requests can be approved.`
    );
  }

  // Enforce separation of duties
  if (req.requestedBy.toLowerCase() === approver) {
    throw new Error(
      "Separation of duties violation: An administrator cannot approve their own refund request. Another authorized approver must review it."
    );
  }

  const now = new Date().toISOString();
  req.status = "approved";
  req.decidedBy = approver;
  req.decidedAt = now;
  req.auditTrail.push({
    action: "approved",
    performedBy: approver,
    timestamp: now,
    details: `Refund request approved by ${approver}. Ready for gateway or payout execution.`,
  });

  await withFallback((s) => s.saveRefundRequest(req));
  broadcastRealtime({ type: "catalog_updated", section: "poojas" });

  return req;
}

/**
 * Reject a pending refund request (Step 3).
 * Requires an explicit rejection reason.
 */
export async function rejectRefundRequest(input: {
  requestId: string;
  approverEmail: string;
  rejectionReason: string;
}): Promise<RefundRequest> {
  const approver = input.approverEmail.trim().toLowerCase();
  if (!canApproveRefunds(approver)) {
    throw new Error(
      "Unauthorized: Only an authorized approver (Super Admin) can reject refund requests."
    );
  }

  if (!input.rejectionReason || !input.rejectionReason.trim()) {
    throw new Error("A clear rejection reason is mandatory when rejecting a refund request.");
  }

  const req = await findRefundRequestById(input.requestId);
  if (!req) {
    throw new Error(`Refund request ${input.requestId} not found.`);
  }

  if (req.status !== "pending_approval") {
    throw new Error(
      `Cannot reject request in "${req.status}" state. Only pending requests can be rejected.`
    );
  }

  const now = new Date().toISOString();
  req.status = "rejected";
  req.decidedBy = approver;
  req.decidedAt = now;
  req.rejectionReason = input.rejectionReason.trim();
  req.auditTrail.push({
    action: "rejected",
    performedBy: approver,
    timestamp: now,
    details: `Refund request rejected by ${approver}. Reason: ${input.rejectionReason.trim()}`,
  });

  await withFallback((s) => s.saveRefundRequest(req));
  broadcastRealtime({ type: "catalog_updated", section: "poojas" });

  return req;
}

/**
 * Execute an approved refund through the payment gateway or manual settlement (Step 4).
 * Idempotent, audited, updates devotee booking status only upon verified success.
 */
export async function executeApprovedRefund(input: {
  requestId: string;
  executorEmail: string;
  manualSettlement?: {
    settlementReference?: string;
    executionNotes?: string;
  };
}): Promise<RefundRequest> {
  const executor = input.executorEmail.trim().toLowerCase();
  if (!canApproveRefunds(executor)) {
    throw new Error(
      "Unauthorized: Only an authorized administrator can execute approved refunds."
    );
  }

  const req = await findRefundRequestById(input.requestId);
  if (!req) {
    throw new Error(`Refund request ${input.requestId} not found.`);
  }

  if (req.status === "completed") {
    throw new Error("This refund has already been completed and executed.");
  }

  if (req.status !== "approved") {
    throw new Error(
      `Cannot execute refund in "${req.status}" state. Only approved requests can be executed.`
    );
  }

  // Concurrency & idempotency guard
  const idempotencyKey = `idem_${req.id}_${Date.now()}`;
  req.status = "processing";
  req.idempotencyKey = idempotencyKey;
  req.auditTrail.push({
    action: "execution_attempted",
    performedBy: executor,
    timestamp: new Date().toISOString(),
    details: `Initiated execution for ₹${req.requestedAmount} (${req.paymentMethod}).`,
  });
  await withFallback((s) => s.saveRefundRequest(req));

  // Find associated booking
  const users = await withFallback((s) => s.getUsers());
  let targetUser: UserProfile | undefined;
  let targetBooking: BookingRecord | undefined;

  for (const u of users) {
    const b = u.bookings.find((x) => x.bookingId === req.bookingId);
    if (b) {
      targetUser = u;
      targetBooking = b;
      break;
    }
  }

  const now = new Date().toISOString();

  // Execution path 1: Razorpay authoritative API
  if (req.paymentMethod === "razorpay" && targetBooking?.razorpayPaymentId) {
    try {
      const razorpayRes = await createRazorpayRefund({
        paymentId: targetBooking.razorpayPaymentId,
        amount: req.requestedAmount,
        notes: {
          refundRequestId: req.id,
          bookingId: req.bookingId,
          reason: req.reason,
        },
      });

      req.status = "completed";
      req.providerRefundId = razorpayRes.id;
      req.providerStatus = razorpayRes.status;
      req.executedBy = executor;
      req.executedAt = now;
      req.auditTrail.push({
        action: "completed",
        performedBy: executor,
        timestamp: now,
        details: `Gateway refund confirmed by Razorpay. Refund ID: ${razorpayRes.id}, Status: ${razorpayRes.status}.`,
      });

      // Update booking
      if (targetUser && targetBooking) {
        targetBooking.refundedAt = now;
        if (req.requestedAmount >= targetBooking.amount - req.previouslyRefundedAmount) {
          targetBooking.status = "refunded";
        }
        await withFallback((s) => s.saveUser(targetUser!));
      }

      await withFallback((s) => s.saveRefundRequest(req));
      broadcastRealtime({ type: "devotee_updated", target: req.userId });
      broadcastRealtime({ type: "catalog_updated", section: "poojas" });
      return req;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      req.status = "failed";
      req.executionError = errorMsg;
      req.auditTrail.push({
        action: "failed",
        performedBy: executor,
        timestamp: now,
        details: `Razorpay refund execution failed: ${errorMsg}`,
      });
      await withFallback((s) => s.saveRefundRequest(req));
      throw new Error(`Payment gateway refund execution failed: ${errorMsg}`);
    }
  }

  // Execution path 2: UPI QR / Offline / Simulated payment
  // Requires manual provider settlement confirmation (e.g. payout UTR)
  const settlementRef = input.manualSettlement?.settlementReference?.trim();
  if (!settlementRef) {
    req.status = "approved"; // Revert from processing back to approved
    await withFallback((s) => s.saveRefundRequest(req));
    throw new Error(
      `Automated refund is unavailable for ${req.paymentMethod.toUpperCase()} payments. Manual settlement required: Please provide the devotee bank/UPI transfer reference (UTR) to record completed refund.`
    );
  }

  req.status = "completed";
  req.providerRefundId = settlementRef;
  req.providerStatus = "manual_settled";
  req.executionNotes = input.manualSettlement?.executionNotes?.trim();
  req.executedBy = executor;
  req.executedAt = now;
  req.auditTrail.push({
    action: "completed",
    performedBy: executor,
    timestamp: now,
    details: `Manual refund settlement confirmed. Reference/UTR: ${settlementRef}. Notes: ${req.executionNotes || "None"}`,
  });

  // Update booking
  if (targetUser && targetBooking) {
    targetBooking.refundedAt = now;
    if (req.requestedAmount >= targetBooking.amount - req.previouslyRefundedAmount) {
      targetBooking.status = "refunded";
    }
    await withFallback((s) => s.saveUser(targetUser!));
  }

  await withFallback((s) => s.saveRefundRequest(req));
  broadcastRealtime({ type: "devotee_updated", target: req.userId });
  broadcastRealtime({ type: "catalog_updated", section: "poojas" });

  return req;
}

/**
 * Types and interfaces for the approval-based refund workflow.
 */

export type RefundRequestStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "failed";

export type AdminRole = "admin" | "super_admin";

export interface RefundAuditLog {
  action:
    | "requested"
    | "approved"
    | "rejected"
    | "execution_attempted"
    | "completed"
    | "failed";
  performedBy: string; // admin email
  timestamp: string; // ISO
  details?: string;
}

export interface RefundRequest {
  id: string; // e.g. "ref_req_abc123"
  orderId: string; // e.g. "BK-123456"
  bookingId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  poojaTitle: string;
  paymentMethod: "razorpay" | "upi_qr" | "simulated";
  paymentReference?: string; // razorpayPaymentId, upiTransactionId, etc.
  originalAmount: number;
  currency: string;
  requestedAmount: number;
  previouslyRefundedAmount: number;
  remainingRefundableAmount: number;
  reason: string;
  requestedBy: string; // email of requesting admin
  requestedAt: string; // ISO

  status: RefundRequestStatus;

  // Decision
  decidedBy?: string; // approver admin email
  decidedAt?: string; // ISO
  rejectionReason?: string;

  // Execution
  idempotencyKey?: string;
  executedBy?: string;
  executedAt?: string; // ISO
  providerRefundId?: string; // Razorpay refund ID or manual settlement reference
  providerStatus?: string; // "processed", "pending", "manual_settled", etc.
  executionError?: string;
  executionNotes?: string;

  auditTrail: RefundAuditLog[];
}

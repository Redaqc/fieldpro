/**
 * AUDIT FIX: High Priority Issue #6 - Status Constants/Enums
 *
 * Centralized status definitions for all entities
 * Prevents inconsistent status values across the application
 *
 * Usage:
 *   import { JOB_STATUS, INVOICE_STATUS } from '@/constants/statuses';
 *   status: JOB_STATUS.TODO
 */

// ============================================================================
// JOB STATUSES
// ============================================================================

export const JOB_STATUS = {
  NEW: 'new',
  TODO: 'todo',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  REVIEW: 'review',
  COMPLETED: 'completed',
  INVOICED: 'invoiced',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled'
};

export const JOB_STATUS_LABELS = {
  [JOB_STATUS.NEW]: 'New',
  [JOB_STATUS.TODO]: 'To Do',
  [JOB_STATUS.SCHEDULED]: 'Scheduled',
  [JOB_STATUS.IN_PROGRESS]: 'In Progress',
  [JOB_STATUS.ON_HOLD]: 'On Hold',
  [JOB_STATUS.REVIEW]: 'Under Review',
  [JOB_STATUS.COMPLETED]: 'Completed',
  [JOB_STATUS.INVOICED]: 'Invoiced',
  [JOB_STATUS.ARCHIVED]: 'Archived',
  [JOB_STATUS.CANCELLED]: 'Cancelled'
};

export const JOB_STATUS_COLORS = {
  [JOB_STATUS.NEW]: 'bg-cyan-100 text-cyan-700',
  [JOB_STATUS.TODO]: 'bg-slate-100 text-slate-700',
  [JOB_STATUS.SCHEDULED]: 'bg-indigo-100 text-indigo-700',
  [JOB_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [JOB_STATUS.ON_HOLD]: 'bg-orange-100 text-orange-700',
  [JOB_STATUS.REVIEW]: 'bg-purple-100 text-purple-700',
  [JOB_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
  [JOB_STATUS.INVOICED]: 'bg-emerald-100 text-emerald-700',
  [JOB_STATUS.ARCHIVED]: 'bg-gray-100 text-gray-700',
  [JOB_STATUS.CANCELLED]: 'bg-red-100 text-red-700'
};

// ============================================================================
// SERVICE CALL STATUSES
// ============================================================================

export const SERVICE_CALL_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CONVERTED: 'converted'  // When converted to Job
};

export const SERVICE_CALL_STATUS_LABELS = {
  [SERVICE_CALL_STATUS.NEW]: 'New',
  [SERVICE_CALL_STATUS.IN_PROGRESS]: 'In Progress',
  [SERVICE_CALL_STATUS.REVIEW]: 'Under Review',
  [SERVICE_CALL_STATUS.COMPLETED]: 'Completed',
  [SERVICE_CALL_STATUS.CANCELLED]: 'Cancelled',
  [SERVICE_CALL_STATUS.CONVERTED]: 'Converted to Job'
};

export const SERVICE_CALL_STATUS_COLORS = {
  [SERVICE_CALL_STATUS.NEW]: 'bg-yellow-100 text-yellow-700',
  [SERVICE_CALL_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [SERVICE_CALL_STATUS.REVIEW]: 'bg-purple-100 text-purple-700',
  [SERVICE_CALL_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
  [SERVICE_CALL_STATUS.CANCELLED]: 'bg-red-100 text-red-700',
  [SERVICE_CALL_STATUS.CONVERTED]: 'bg-indigo-100 text-indigo-700'
};

// ============================================================================
// INVOICE STATUSES
// ============================================================================

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PARTIAL: 'partial',  // Partially paid
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.VIEWED]: 'Viewed',
  [INVOICE_STATUS.PARTIAL]: 'Partially Paid',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled',
  [INVOICE_STATUS.REFUNDED]: 'Refunded'
};

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: 'bg-slate-100 text-slate-700',
  [INVOICE_STATUS.SENT]: 'bg-blue-100 text-blue-700',
  [INVOICE_STATUS.VIEWED]: 'bg-purple-100 text-purple-700',
  [INVOICE_STATUS.PARTIAL]: 'bg-yellow-100 text-yellow-700',
  [INVOICE_STATUS.PAID]: 'bg-green-100 text-green-700',
  [INVOICE_STATUS.OVERDUE]: 'bg-red-100 text-red-700',
  [INVOICE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-700',
  [INVOICE_STATUS.REFUNDED]: 'bg-orange-100 text-orange-700'
};

// ============================================================================
// QUOTATION STATUSES
// ============================================================================

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted'  // When converted to Invoice/Job
};

export const QUOTATION_STATUS_LABELS = {
  [QUOTATION_STATUS.DRAFT]: 'Draft',
  [QUOTATION_STATUS.SENT]: 'Sent',
  [QUOTATION_STATUS.VIEWED]: 'Viewed',
  [QUOTATION_STATUS.ACCEPTED]: 'Accepted',
  [QUOTATION_STATUS.REJECTED]: 'Rejected',
  [QUOTATION_STATUS.EXPIRED]: 'Expired',
  [QUOTATION_STATUS.CONVERTED]: 'Converted'
};

export const QUOTATION_STATUS_COLORS = {
  [QUOTATION_STATUS.DRAFT]: 'bg-slate-100 text-slate-700',
  [QUOTATION_STATUS.SENT]: 'bg-blue-100 text-blue-700',
  [QUOTATION_STATUS.VIEWED]: 'bg-purple-100 text-purple-700',
  [QUOTATION_STATUS.ACCEPTED]: 'bg-green-100 text-green-700',
  [QUOTATION_STATUS.REJECTED]: 'bg-red-100 text-red-700',
  [QUOTATION_STATUS.EXPIRED]: 'bg-orange-100 text-orange-700',
  [QUOTATION_STATUS.CONVERTED]: 'bg-indigo-100 text-indigo-700'
};

// ============================================================================
// PAYMENT STATUSES
// ============================================================================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelled'
};

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-700',
  [PAYMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
  [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-700',
  [PAYMENT_STATUS.REFUNDED]: 'bg-orange-100 text-orange-700',
  [PAYMENT_STATUS.CANCELLED]: 'bg-gray-100 text-gray-700'
};

// ============================================================================
// TIME ENTRY STATUSES
// ============================================================================

export const TIME_ENTRY_STATUS = {
  ACTIVE: 'active',        // Currently clocked in
  COMPLETED: 'completed',  // Clocked out
  APPROVED: 'approved',    // Approved by manager
  REJECTED: 'rejected',    // Rejected by manager
  INVOICED: 'invoiced'     // Already included in invoice
};

export const TIME_ENTRY_STATUS_LABELS = {
  [TIME_ENTRY_STATUS.ACTIVE]: 'Active',
  [TIME_ENTRY_STATUS.COMPLETED]: 'Completed',
  [TIME_ENTRY_STATUS.APPROVED]: 'Approved',
  [TIME_ENTRY_STATUS.REJECTED]: 'Rejected',
  [TIME_ENTRY_STATUS.INVOICED]: 'Invoiced'
};

export const TIME_ENTRY_STATUS_COLORS = {
  [TIME_ENTRY_STATUS.ACTIVE]: 'bg-blue-100 text-blue-700',
  [TIME_ENTRY_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
  [TIME_ENTRY_STATUS.APPROVED]: 'bg-green-100 text-green-700',
  [TIME_ENTRY_STATUS.REJECTED]: 'bg-red-100 text-red-700',
  [TIME_ENTRY_STATUS.INVOICED]: 'bg-purple-100 text-purple-700'
};

// ============================================================================
// MATERIAL STATUSES
// ============================================================================

export const MATERIAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

export const MATERIAL_STATUS_LABELS = {
  [MATERIAL_STATUS.ACTIVE]: 'Active',
  [MATERIAL_STATUS.INACTIVE]: 'Inactive',
  [MATERIAL_STATUS.OUT_OF_STOCK]: 'Out of Stock',
  [MATERIAL_STATUS.DISCONTINUED]: 'Discontinued'
};

export const MATERIAL_STATUS_COLORS = {
  [MATERIAL_STATUS.ACTIVE]: 'bg-green-100 text-green-700',
  [MATERIAL_STATUS.INACTIVE]: 'bg-gray-100 text-gray-700',
  [MATERIAL_STATUS.OUT_OF_STOCK]: 'bg-red-100 text-red-700',
  [MATERIAL_STATUS.DISCONTINUED]: 'bg-orange-100 text-orange-700'
};

// ============================================================================
// CUSTOMER STATUSES
// ============================================================================

export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  VIP: 'vip'
};

export const CUSTOMER_STATUS_LABELS = {
  [CUSTOMER_STATUS.ACTIVE]: 'Active',
  [CUSTOMER_STATUS.INACTIVE]: 'Inactive',
  [CUSTOMER_STATUS.SUSPENDED]: 'Suspended',
  [CUSTOMER_STATUS.VIP]: 'VIP'
};

export const CUSTOMER_STATUS_COLORS = {
  [CUSTOMER_STATUS.ACTIVE]: 'bg-green-100 text-green-700',
  [CUSTOMER_STATUS.INACTIVE]: 'bg-gray-100 text-gray-700',
  [CUSTOMER_STATUS.SUSPENDED]: 'bg-red-100 text-red-700',
  [CUSTOMER_STATUS.VIP]: 'bg-purple-100 text-purple-700'
};

// ============================================================================
// TECHNICIAN STATUSES
// ============================================================================

export const TECHNICIAN_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  ON_BREAK: 'on_break',
  ON_JOB: 'on_job',
  OFF_DUTY: 'off_duty',
  OFFLINE: 'offline',
  INACTIVE: 'inactive'
};

export const TECHNICIAN_STATUS_LABELS = {
  [TECHNICIAN_STATUS.AVAILABLE]: 'Available',
  [TECHNICIAN_STATUS.BUSY]: 'Busy',
  [TECHNICIAN_STATUS.ON_BREAK]: 'On Break',
  [TECHNICIAN_STATUS.ON_JOB]: 'On Job',
  [TECHNICIAN_STATUS.OFF_DUTY]: 'Off Duty',
  [TECHNICIAN_STATUS.OFFLINE]: 'Offline',
  [TECHNICIAN_STATUS.INACTIVE]: 'Inactive'
};

export const TECHNICIAN_STATUS_COLORS = {
  [TECHNICIAN_STATUS.AVAILABLE]: 'bg-green-100 text-green-700',
  [TECHNICIAN_STATUS.BUSY]: 'bg-amber-100 text-amber-700',
  [TECHNICIAN_STATUS.ON_BREAK]: 'bg-yellow-100 text-yellow-700',
  [TECHNICIAN_STATUS.ON_JOB]: 'bg-blue-100 text-blue-700',
  [TECHNICIAN_STATUS.OFF_DUTY]: 'bg-slate-100 text-slate-700',
  [TECHNICIAN_STATUS.OFFLINE]: 'bg-gray-100 text-gray-700',
  [TECHNICIAN_STATUS.INACTIVE]: 'bg-red-100 text-red-700'
};

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const PRIORITY_LABELS = {
  [PRIORITY.LOW]: 'Low',
  [PRIORITY.MEDIUM]: 'Medium',
  [PRIORITY.HIGH]: 'High',
  [PRIORITY.URGENT]: 'Urgent'
};

export const PRIORITY_COLORS = {
  [PRIORITY.LOW]: 'bg-slate-100 text-slate-700',
  [PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [PRIORITY.HIGH]: 'bg-orange-100 text-orange-700',
  [PRIORITY.URGENT]: 'bg-red-100 text-red-700'
};

// ============================================================================
// STATE MACHINE HELPERS
// ============================================================================

/**
 * Valid status transitions for Jobs
 * Used for state machine validation
 */
export const JOB_STATUS_TRANSITIONS = {
  [JOB_STATUS.TODO]: [JOB_STATUS.IN_PROGRESS, JOB_STATUS.CANCELLED],
  [JOB_STATUS.IN_PROGRESS]: [JOB_STATUS.REVIEW, JOB_STATUS.TODO, JOB_STATUS.CANCELLED],
  [JOB_STATUS.REVIEW]: [JOB_STATUS.COMPLETED, JOB_STATUS.IN_PROGRESS, JOB_STATUS.CANCELLED],
  [JOB_STATUS.COMPLETED]: [JOB_STATUS.ARCHIVED],
  [JOB_STATUS.ARCHIVED]: [],
  [JOB_STATUS.CANCELLED]: [JOB_STATUS.TODO]
};

/**
 * Valid status transitions for Service Calls
 */
export const SERVICE_CALL_STATUS_TRANSITIONS = {
  [SERVICE_CALL_STATUS.NEW]: [SERVICE_CALL_STATUS.IN_PROGRESS, SERVICE_CALL_STATUS.CANCELLED, SERVICE_CALL_STATUS.CONVERTED],
  [SERVICE_CALL_STATUS.IN_PROGRESS]: [SERVICE_CALL_STATUS.REVIEW, SERVICE_CALL_STATUS.NEW, SERVICE_CALL_STATUS.CANCELLED, SERVICE_CALL_STATUS.CONVERTED],
  [SERVICE_CALL_STATUS.REVIEW]: [SERVICE_CALL_STATUS.COMPLETED, SERVICE_CALL_STATUS.IN_PROGRESS, SERVICE_CALL_STATUS.CANCELLED],
  [SERVICE_CALL_STATUS.COMPLETED]: [],
  [SERVICE_CALL_STATUS.CANCELLED]: [SERVICE_CALL_STATUS.NEW],
  [SERVICE_CALL_STATUS.CONVERTED]: []
};

/**
 * Valid status transitions for Invoices
 */
export const INVOICE_STATUS_TRANSITIONS = {
  [INVOICE_STATUS.DRAFT]: [INVOICE_STATUS.SENT, INVOICE_STATUS.CANCELLED],
  [INVOICE_STATUS.SENT]: [INVOICE_STATUS.VIEWED, INVOICE_STATUS.PARTIAL, INVOICE_STATUS.PAID, INVOICE_STATUS.OVERDUE, INVOICE_STATUS.CANCELLED],
  [INVOICE_STATUS.VIEWED]: [INVOICE_STATUS.PARTIAL, INVOICE_STATUS.PAID, INVOICE_STATUS.OVERDUE, INVOICE_STATUS.CANCELLED],
  [INVOICE_STATUS.PARTIAL]: [INVOICE_STATUS.PAID, INVOICE_STATUS.OVERDUE, INVOICE_STATUS.CANCELLED],
  [INVOICE_STATUS.PAID]: [INVOICE_STATUS.REFUNDED],
  [INVOICE_STATUS.OVERDUE]: [INVOICE_STATUS.PARTIAL, INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED],
  [INVOICE_STATUS.CANCELLED]: [],
  [INVOICE_STATUS.REFUNDED]: []
};

/**
 * Validate if a status transition is allowed
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Proposed new status
 * @param {object} transitions - Transition map (e.g., JOB_STATUS_TRANSITIONS)
 * @returns {boolean} - Whether transition is valid
 */
export function isValidStatusTransition(currentStatus, newStatus, transitions) {
  if (!currentStatus || !newStatus) return false;
  if (currentStatus === newStatus) return true; // Allow staying in same status

  const allowedTransitions = transitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed next statuses for current status
 * @param {string} currentStatus - Current status
 * @param {object} transitions - Transition map
 * @returns {string[]} - Array of allowed next statuses
 */
export function getAllowedStatusTransitions(currentStatus, transitions) {
  return transitions[currentStatus] || [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get label for a status value
 * @param {string} status - Status value
 * @param {object} labels - Labels map
 * @returns {string} - Human-readable label
 */
export function getStatusLabel(status, labels) {
  return labels[status] || status;
}

/**
 * Get Tailwind CSS classes for a status
 * @param {string} status - Status value
 * @param {object} colors - Colors map
 * @returns {string} - Tailwind CSS classes
 */
export function getStatusColor(status, colors) {
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Check if status is a final state (no further transitions)
 * @param {string} status - Status value
 * @param {object} transitions - Transition map
 * @returns {boolean} - Whether status is final
 */
export function isFinalStatus(status, transitions) {
  const allowedTransitions = transitions[status] || [];
  return allowedTransitions.length === 0;
}

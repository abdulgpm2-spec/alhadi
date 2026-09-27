export type UserRole = "ADMIN" | "EMPLOYEE" | "AGENT";

export type WorkStatus =
  | "NEW"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENTS_RECEIVED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_PROCESS"
  | "COMPLETED"
  | "DELIVERED"
  | "ON_HOLD"
  | "CANCELLED";

export type WorkPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DocumentState = "REQUIRED" | "UPLOADED" | "VERIFIED" | "REJECTED";

export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";

export type PaymentStatus = "PAID" | "PARTIAL" | "REFUNDED";

export type NotificationType =
  | "NEW_CUSTOMER"
  | "NEW_WORK"
  | "PAYMENT_RECEIVED"
  | "PENDING_PAYMENT"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENT_UPLOADED"
  | "WORK_COMPLETED"
  | "NEW_AGENT_SUBMISSION"
  | "EXPENSE_ADDED"
  | "SYSTEM";

export type WhatsAppStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  organizationId: string;
  branchId?: string | null;
  branchName?: string | null;
  permissions: string[];
  agentId?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface StatKpi {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName?: string;
  description?: string;
}

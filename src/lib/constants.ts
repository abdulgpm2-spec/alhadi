import { WorkStatus, PaymentMethod } from "@/types";

export const APP_NAME = "AL-HADI ENTERPRISE";
export const APP_TAGLINE = "CSC & Citizen Service Center ERP / CRM";

export const PERMISSIONS = {
  // Customers
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  // Services
  SERVICES_VIEW: "services.view",
  SERVICES_CREATE: "services.create",
  SERVICES_UPDATE: "services.update",
  SERVICES_DELETE: "services.delete",

  // Work
  WORK_VIEW: "work.view",
  WORK_CREATE: "work.create",
  WORK_UPDATE: "work.update",
  WORK_STATUS_UPDATE: "work.status_update",
  WORK_DELETE: "work.delete",
  // Work application & tracking enhancements
  WORK_TRACKING_UPDATE: "work.tracking_update",
  WORK_DATES_UPDATE: "work.dates_update",
  WORK_SERVICE_RECEIPTS_UPLOAD: "work.service_receipts_upload",
  WORK_SERVICE_RECEIPTS_DELETE: "work.service_receipts_delete",
  WORK_CERTIFICATES_UPLOAD: "work.certificates_upload",
  WORK_CERTIFICATES_DELETE: "work.certificates_delete",

  // Documents
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_UPLOAD: "documents.upload",
  DOCUMENTS_VERIFY: "documents.verify",
  DOCUMENTS_REJECT: "documents.reject",
  DOCUMENTS_DELETE: "documents.delete",

  // Payments & Receipts
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_REFUND: "payments.refund",
  RECEIPTS_VIEW: "receipts.view",
  RECEIPTS_CREATE: "receipts.create",
  RECEIPTS_PRINT: "receipts.print",

  // Finance
  INCOME_VIEW: "income.view",
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_UPDATE: "expenses.update",
  EXPENSES_DELETE: "expenses.delete",

  // Reports
  REPORTS_VIEW: "reports.view",

  // Users & Staff
  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_CREATE: "employees.create",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_DEACTIVATE: "employees.deactivate",

  AGENTS_VIEW: "agents.view",
  AGENTS_CREATE: "agents.create",
  AGENTS_UPDATE: "agents.update",
  AGENTS_DEACTIVATE: "agents.deactivate",

  // WhatsApp & Notifications
  WHATSAPP_VIEW: "whatsapp.view",
  WHATSAPP_SEND: "whatsapp.send",
  WHATSAPP_TEMPLATES: "whatsapp.templates",
  NOTIFICATIONS_VIEW: "notifications.view",

  // Settings & System
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  BRANCHES_VIEW: "branches.view",
  BRANCHES_CREATE: "branches.create",
  BRANCHES_UPDATE: "branches.update",
  AUDIT_VIEW: "audit.view",
} as const;

export const DEFAULT_ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_EMPLOYEE_PERMISSIONS = [
  PERMISSIONS.CUSTOMERS_VIEW,
  PERMISSIONS.CUSTOMERS_CREATE,
  PERMISSIONS.CUSTOMERS_UPDATE,
  PERMISSIONS.SERVICES_VIEW,
  PERMISSIONS.WORK_VIEW,
  PERMISSIONS.WORK_CREATE,
  PERMISSIONS.WORK_UPDATE,
  PERMISSIONS.WORK_STATUS_UPDATE,
  PERMISSIONS.WORK_TRACKING_UPDATE,
  PERMISSIONS.WORK_DATES_UPDATE,
  PERMISSIONS.WORK_SERVICE_RECEIPTS_UPLOAD,
  PERMISSIONS.WORK_SERVICE_RECEIPTS_DELETE,
  PERMISSIONS.WORK_CERTIFICATES_UPLOAD,
  PERMISSIONS.WORK_CERTIFICATES_DELETE,
  PERMISSIONS.DOCUMENTS_VIEW,
  PERMISSIONS.DOCUMENTS_UPLOAD,
  PERMISSIONS.DOCUMENTS_VERIFY,
  PERMISSIONS.DOCUMENTS_REJECT,
  PERMISSIONS.PAYMENTS_VIEW,
  PERMISSIONS.PAYMENTS_CREATE,
  PERMISSIONS.RECEIPTS_VIEW,
  PERMISSIONS.RECEIPTS_CREATE,
  PERMISSIONS.RECEIPTS_PRINT,
  PERMISSIONS.WHATSAPP_VIEW,
  PERMISSIONS.WHATSAPP_SEND,
  PERMISSIONS.NOTIFICATIONS_VIEW,
];

export const DEFAULT_AGENT_PERMISSIONS = [
  PERMISSIONS.CUSTOMERS_VIEW,
  PERMISSIONS.CUSTOMERS_CREATE,
  PERMISSIONS.SERVICES_VIEW,
  PERMISSIONS.WORK_VIEW,
  PERMISSIONS.WORK_CREATE,
  PERMISSIONS.WORK_CERTIFICATES_UPLOAD,
  PERMISSIONS.WORK_CERTIFICATES_DELETE,
  PERMISSIONS.DOCUMENTS_VIEW,
  PERMISSIONS.DOCUMENTS_UPLOAD,
  PERMISSIONS.PAYMENTS_VIEW,
  PERMISSIONS.RECEIPTS_VIEW,
  PERMISSIONS.RECEIPTS_PRINT,
  PERMISSIONS.NOTIFICATIONS_VIEW,
];

// Grouped, human-readable permission catalog used by the Admin permission-grant UI and
// by role management. Each entry: { key: PERMISSIONS.X, label }
export const PERMISSION_GROUPS: { group: string; icon?: string; items: { key: string; label: string }[] }[] = [
  {
    group: "Customers",
    items: [
      { key: PERMISSIONS.CUSTOMERS_VIEW, label: "View customers" },
      { key: PERMISSIONS.CUSTOMERS_CREATE, label: "Create customers" },
      { key: PERMISSIONS.CUSTOMERS_UPDATE, label: "Edit customers" },
      { key: PERMISSIONS.CUSTOMERS_DELETE, label: "Delete customers" },
    ],
  },
  {
    group: "Services Catalog",
    items: [
      { key: PERMISSIONS.SERVICES_VIEW, label: "View services" },
      { key: PERMISSIONS.SERVICES_CREATE, label: "Create services" },
      { key: PERMISSIONS.SERVICES_UPDATE, label: "Edit services" },
      { key: PERMISSIONS.SERVICES_DELETE, label: "Delete services" },
    ],
  },
  {
    group: "Work Orders",
    items: [
      { key: PERMISSIONS.WORK_VIEW, label: "View work orders" },
      { key: PERMISSIONS.WORK_CREATE, label: "Create work orders" },
      { key: PERMISSIONS.WORK_UPDATE, label: "Edit work orders" },
      { key: PERMISSIONS.WORK_STATUS_UPDATE, label: "Update work status" },
      { key: PERMISSIONS.WORK_DELETE, label: "Delete work orders" },
      { key: PERMISSIONS.WORK_TRACKING_UPDATE, label: "Edit tracking / reference number" },
      { key: PERMISSIONS.WORK_DATES_UPDATE, label: "Edit service dates" },
      { key: PERMISSIONS.WORK_SERVICE_RECEIPTS_UPLOAD, label: "Upload / replace service receipts" },
      { key: PERMISSIONS.WORK_SERVICE_RECEIPTS_DELETE, label: "Delete service receipts" },
      { key: PERMISSIONS.WORK_CERTIFICATES_UPLOAD, label: "Upload / replace certificates" },
      { key: PERMISSIONS.WORK_CERTIFICATES_DELETE, label: "Delete certificates" },
    ],
  },
  {
    group: "Documents",
    items: [
      { key: PERMISSIONS.DOCUMENTS_VIEW, label: "View documents" },
      { key: PERMISSIONS.DOCUMENTS_UPLOAD, label: "Upload documents" },
      { key: PERMISSIONS.DOCUMENTS_VERIFY, label: "Verify documents" },
      { key: PERMISSIONS.DOCUMENTS_REJECT, label: "Reject documents" },
      { key: PERMISSIONS.DOCUMENTS_DELETE, label: "Delete documents" },
    ],
  },
  {
    group: "Payments & Receipts",
    items: [
      { key: PERMISSIONS.PAYMENTS_VIEW, label: "View payments" },
      { key: PERMISSIONS.PAYMENTS_CREATE, label: "Record payments" },
      { key: PERMISSIONS.PAYMENTS_UPDATE, label: "Edit payments" },
      { key: PERMISSIONS.PAYMENTS_REFUND, label: "Process refunds" },
      { key: PERMISSIONS.RECEIPTS_VIEW, label: "View receipts" },
      { key: PERMISSIONS.RECEIPTS_CREATE, label: "Create receipts" },
      { key: PERMISSIONS.RECEIPTS_PRINT, label: "Print / share receipts" },
    ],
  },
  {
    group: "Finance",
    items: [
      { key: PERMISSIONS.INCOME_VIEW, label: "View income" },
      { key: PERMISSIONS.EXPENSES_VIEW, label: "View expenses" },
      { key: PERMISSIONS.EXPENSES_CREATE, label: "Add expenses" },
      { key: PERMISSIONS.EXPENSES_UPDATE, label: "Edit expenses" },
      { key: PERMISSIONS.EXPENSES_DELETE, label: "Delete expenses" },
    ],
  },
  {
    group: "Reports",
    items: [{ key: PERMISSIONS.REPORTS_VIEW, label: "View reports" }],
  },
  {
    group: "Staff & Agents",
    items: [
      { key: PERMISSIONS.EMPLOYEES_VIEW, label: "View employees" },
      { key: PERMISSIONS.EMPLOYEES_CREATE, label: "Create employees" },
      { key: PERMISSIONS.EMPLOYEES_UPDATE, label: "Edit employees" },
      { key: PERMISSIONS.EMPLOYEES_DEACTIVATE, label: "Deactivate employees" },
      { key: PERMISSIONS.AGENTS_VIEW, label: "View agents" },
      { key: PERMISSIONS.AGENTS_CREATE, label: "Create agents" },
      { key: PERMISSIONS.AGENTS_UPDATE, label: "Edit agents" },
      { key: PERMISSIONS.AGENTS_DEACTIVATE, label: "Deactivate agents" },
    ],
  },
  {
    group: "WhatsApp & Notifications",
    items: [
      { key: PERMISSIONS.WHATSAPP_VIEW, label: "View WhatsApp" },
      { key: PERMISSIONS.WHATSAPP_SEND, label: "Send WhatsApp" },
      { key: PERMISSIONS.WHATSAPP_TEMPLATES, label: "Manage WhatsApp templates" },
      { key: PERMISSIONS.NOTIFICATIONS_VIEW, label: "View notifications" },
    ],
  },
  {
    group: "Settings & System",
    items: [
      { key: PERMISSIONS.SETTINGS_VIEW, label: "View settings" },
      { key: PERMISSIONS.SETTINGS_UPDATE, label: "Update settings" },
      { key: PERMISSIONS.BRANCHES_VIEW, label: "View branches" },
      { key: PERMISSIONS.BRANCHES_CREATE, label: "Create branches" },
      { key: PERMISSIONS.BRANCHES_UPDATE, label: "Edit branches" },
      { key: PERMISSIONS.AUDIT_VIEW, label: "View audit logs" },
    ],
  },
];

export const WORK_STATUS_LABELS: Record<WorkStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  NEW: { label: "New Order", variant: "outline" },
  DOCUMENTS_REQUIRED: { label: "Docs Required", variant: "warning" },
  DOCUMENTS_RECEIVED: { label: "Docs Received", variant: "info" },
  IN_PROGRESS: { label: "In Progress", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "info" },
  UNDER_PROCESS: { label: "Under Process", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  DELIVERED: { label: "Delivered", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const WORK_STATUS_FLOW: Record<WorkStatus, WorkStatus[]> = {
  NEW: ["DOCUMENTS_REQUIRED", "DOCUMENTS_RECEIVED", "IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  DOCUMENTS_REQUIRED: ["DOCUMENTS_RECEIVED", "ON_HOLD", "CANCELLED"],
  DOCUMENTS_RECEIVED: ["IN_PROGRESS", "DOCUMENTS_REQUIRED", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "UNDER_PROCESS", "COMPLETED", "DOCUMENTS_REQUIRED", "ON_HOLD", "CANCELLED"],
  SUBMITTED: ["UNDER_PROCESS", "COMPLETED", "DOCUMENTS_REQUIRED", "ON_HOLD", "CANCELLED"],
  UNDER_PROCESS: ["COMPLETED", "DOCUMENTS_REQUIRED", "ON_HOLD", "CANCELLED"],
  COMPLETED: ["DELIVERED", "UNDER_PROCESS"],
  DELIVERED: [],
  ON_HOLD: ["NEW", "DOCUMENTS_REQUIRED", "DOCUMENTS_RECEIVED", "IN_PROGRESS", "SUBMITTED", "UNDER_PROCESS", "CANCELLED"],
  CANCELLED: ["NEW"],
};

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Internet",
  "Printing",
  "Stationery",
  "Salary",
  "Travel",
  "Maintenance",
  "Software",
  "Marketing",
  "Other",
] as const;

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"];

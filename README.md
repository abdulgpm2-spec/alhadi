# 🚀 AL-HADI ENTERPRISE — CSC Center ERP / CRM

Production-ready, commercial-grade internal ERP/CRM system designed specifically for **AL-HADI ENTERPRISE** (CSC / Citizen Service Center).

The system manages the complete customer journey:
**Customer Registration → Service Selection → Work Creation → Document Collection & Verification → Employee/Agent Assignment → Work Processing → Payment Collection → Receipt Generation → Status Updates → Customer Notifications & WhatsApp → Work Completion → Delivery & Full History**.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Radix UI / shadcn/ui tokens, Lucide React, Recharts
- **Backend**: Next.js Server Actions & API routes with Layered Service Architecture
- **Database & ORM**: **PostgreSQL 18** with Prisma ORM (all tables, relations, and data dynamic directly from PostgreSQL)
- **Authentication**: Secure HTTP-only Cookie Sessions with JWT (`jose`), `bcryptjs` password hashing, and granular Permission Architecture
- **File Storage**: Abstracted `FileStorageService` (Local provider + Cloud adapter ready interfaces)
- **Messaging**: Provider-independent `WhatsAppService` with templating and direct click-to-chat web integration

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **System Admin** | `admin@alhadi.local` | `Admin@123456` | Full oversight across all modules, branches, users, and financials |
| **Operator / Employee** | `employee@alhadi.local` | `Employee@123456` | Operational access for customers, work processing, documents, and payments |
| **Partner Agent** | `agent@alhadi.local` | `Agent@123456` | Isolated agent portal strictly for their own customers and referred work |

*Note: For convenience, the Login page includes 1-click demo credential autofill buttons.*

---

## 📦 Key System Modules

### 1. Operations Dashboard
- **Real-Time KPIs**: Total Customers, Pending Applications, Today's & Monthly Collections, Monthly Expenses, and Net Profit (`Income - Expense`).
- **Interactive Visualizations (Recharts)**:
  - 7-Day Income vs. Expense Area Trend Chart
  - Service Revenue Breakdown (Donut)
  - Work Order Status Distribution
  - Monthly Expenses Breakdown by Category
- **Live Activity Feed**: Real-time audit stream of actions across the center.

### 2. Customer Directory & Profiles
- Unique auto-generated IDs: `CUS-2026-XXXXX`
- Debounced search across Name, 10-Digit Mobile, and Customer ID.
- Soft Delete policy (`isDeleted`, `deletedAt`) to preserve historical audit trails.
- Comprehensive Customer Workspace with tabs:
  - **Overview**: Personal info, residence, and financial balance.
  - **Work Orders**: All applications with live status badges.
  - **Payments & Receipts**: Financial history and links to official receipts.
  - **Audit Timeline**: Chronological log of customer events.
  - **Direct Actions**: "Create Work", "Record Payment", "Send WhatsApp", "Export to CSV".

### 3. CSC Services Catalog
- Categorized services: PAN Services, Aadhaar Services, Passport Services, Voter ID, Driving Licence, Income/Caste Certificates, Gazette Name Change, Insurance, Banking, and Ticket Booking.
- Configuration for Customer Price, Agent Price, Estimated Processing Time (Days), and Required Documents checklist.

### 4. Work Order Processing & State Machine Engine
- Unique auto-generated IDs: `WORK-2026-XXXXX`
- **Validated Status State Machine**:
  `NEW` → `DOCUMENTS_REQUIRED` → `DOCUMENTS_RECEIVED` → `IN_PROGRESS` → `SUBMITTED` → `UNDER_PROCESS` → `COMPLETED` → `DELIVERED` *(with exceptional states `ON_HOLD` and `CANCELLED`)*.
- Transition validation blocks illegal status skips (e.g. `NEW` jumping directly to `DELIVERED`).
- Automated `WorkStatusHistory` and `ActivityLog` logging on every transition.

### 5. Document Management & File Storage Abstraction
- Abstracted `IFileStorageService` with local disk storage and cloud adapter hooks.
- Drag & Drop upload with 10MB limit, MIME-type checks, and randomized storage keys.
- Document lifecycle states: `REQUIRED` → `UPLOADED` → `VERIFIED` / `REJECTED`.

### 6. Payments & Dual-Format Receipt System
- Unique IDs: `PAY-2026-XXXXX` and `REC-2026-XXXXX`.
- Atomic database transactions ensure work balances and receipts are updated synchronously.
- Server-side validation blocks overpayments exceeding pending balances.
- **Printable Receipts**:
  - **A4 Standard Format**: Official invoice layout with terms, logo, customer info, and signature line.
  - **Thermal 80mm POS Format**: Compact receipt slip optimized for receipt printers.
  - One-click WhatsApp share link (`wa.me`) with pre-filled payment confirmation.

### 7. Expense Tracking & Net Profit Engine
- Categorized expense tracking (Shop Rent, Electricity, Paper & Printing, Toners, Salary, Internet, Refreshments, Maintenance).
- Authoritative Net Profit calculation: `Total Income - Total Expenses = Net Profit`.

### 8. Multi-Dimensional Reporting Engine
- **Financial P&L Report**: Inflows vs. Outflows, breakdown by payment mode, transaction registers.
- **Work Report**: Status breakdown, completion rates, and turnaround metrics.
- **Customer Intelligence**: New vs. returning customers and spending analysis.
- Instant CSV export and printable reports.

### 9. Staff & Agent Management with Data Isolation
- Employee performance tracking: Assigned orders, Completed orders, and Cash collections.
- Agent Partner portal with commission rate configuration (e.g. 15%) and revenue tracking.
- **Strict Server-Side Agent Isolation**: Agents can query and manage strictly their own referred records.

### 10. WhatsApp Alerts & In-App Notification Center
- Built-in templates for `WORK_CREATED`, `PAYMENT_RECEIVED`, `DOCUMENTS_REQUIRED`, `WORK_COMPLETED` with dynamic variable substitution (`{customer_name}`, `{service_name}`, `{work_id}`, `{amount}`, `{receipt_number}`).
- Real-time in-app notification bell with unread badge and deep links.

### 11. Global Command Palette
- Instant `Ctrl+K` / `⌘K` search shortcut across Customers, Work items, Payments, Receipts, and Services.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm

### 2. Installation & Setup
```bash
# Clone or navigate to the project directory
cd d:\alhadi

# Install dependencies
npm install

# Push Prisma database schema
npx prisma db push

# Seed realistic CSC data (20+ customers, 30+ works, payments, expenses)
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

### 5. Run Automated Test Suite
```bash
node scripts/test-e2e.js
```

---

## 🔒 Security & Data Integrity Highlights

1. **Server-Side Authorization**: Roles and permissions are strictly enforced on API routes; client-side manipulation cannot bypass backend checks.
2. **Branch & Agent Scoping**: Every sensitive query verifies `organizationId` and enforces `agentId = user.id` for agent sessions.
3. **Financial Safety**: Payments use atomic transactions; negative numbers and overpayments are rejected by backend rules.
4. **Soft Delete**: Customers and expenses are soft-deleted with timestamps to preserve financial audits.
5. **No Binary Blobs in DB**: Uploaded documents are stored outside PostgreSQL and tracked via `FileAsset` metadata.

---

## 📄 License
Proprietary software developed for **AL-HADI ENTERPRISE**. All rights reserved.

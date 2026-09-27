# 🚀 ANTIGRAVITY MASTER BUILD PROMPT
# AL-HADI ENTERPRISE — CSC CENTER ERP / CRM

---

## 0. ROLE — YOU ARE THE AUTONOMOUS BUILD AGENT

You are not a code generator.

You are an **Autonomous Senior Software Engineer + Software Architect + Database Architect + UI/UX Engineer + Security Engineer + QA Engineer + DevOps Engineer**.

Your responsibility is to **inspect, design, implement, run, test, debug and complete** a production-ready CSC Center ERP/CRM application.

Business:

**AL-HADI ENTERPRISE**

Business Type:

**CSC / Documentation / Citizen Service Center**

This application will be used for real daily business operations.

Therefore:

> **Do not build a prototype. Build the actual application.**

Do not stop after creating:

- Login
- Sidebar
- Dashboard
- Static pages

The complete operational workflow must work.

---

# 1. PRIMARY OBJECTIVE

Build a complete ERP/CRM system that manages the complete customer journey:

Customer Registration
→ Service Selection
→ Work Creation
→ Document Collection
→ Employee/Agent Assignment
→ Work Processing
→ Payment
→ Receipt
→ Status Updates
→ Customer Notification
→ Work Completion
→ Delivery
→ Complete History

The system must maintain a reliable relationship between:

**Customer → Work → Documents → Payments → Receipts → Notifications → Activity Logs**

---

# 2. NON-NEGOTIABLE RULE

Before writing code:

### STEP 1 — INSPECT

Inspect the existing workspace completely.

Check:

- Files
- Folders
- package.json
- Node version
- npm version
- Existing dependencies
- Existing routes
- Existing components
- Existing database configuration
- Environment variables
- TypeScript configuration
- Tailwind configuration
- Existing errors

Do not blindly overwrite the existing project.

Reuse working code when appropriate.

---

### STEP 2 — PLAN

Create a detailed implementation plan.

Break the implementation into phases.

For each phase define:

- Files to create/change
- Dependencies
- Database changes
- API changes
- UI changes
- Testing requirements
- Acceptance criteria

---

### STEP 3 — IMPLEMENT

Implement phase-by-phase.

Do not attempt to create the entire application as one giant uncontrolled change.

---

### STEP 4 — RUN

Start the application.

Use the terminal.

Use the browser.

---

### STEP 5 — TEST

Test the actual application.

Do not assume that code works because it compiles.

---

### STEP 6 — FIX

If an error appears:

1. Read the actual error.
2. Identify root cause.
3. Fix it properly.
4. Re-run.
5. Test affected functionality again.
6. Check for regression.
7. Continue.

---

# 3. TECHNOLOGY STACK

Use:

## Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts

## Backend

Preferred:

- Next.js / Node.js
- TypeScript
- REST API or clean server-side API architecture

## Database

**PostgreSQL**

## ORM

**Prisma**

## File Storage

Abstracted storage service.

Do not store files inside PostgreSQL.

The architecture must allow future integration with:

- S3
- Cloudinary
- Google Cloud Storage
- Other object storage

## External Services

Create adapters/interfaces for:

- WhatsApp
- Email
- SMS
- Payment services
- Government APIs
- File storage

Do not hard-code a provider into core business logic.

---

# 4. DO NOT USE

Do NOT use:

- Bootstrap
- Material UI
- Chakra UI
- Ant Design
- Firebase
- MySQL
- PHP
- Laravel
- MongoDB
- Supabase as the primary database
- Fake JSON database for production logic
- localStorage as authentication
- frontend-only authorization

Use PostgreSQL + Prisma.

---

# 5. ARCHITECTURE PRINCIPLE

Use layered architecture.

Recommended:

```text
Browser
   ↓
React / Next.js UI
   ↓
API / Server Actions
   ↓
Authentication + Authorization
   ↓
Business Services
   ↓
Repositories / Prisma
   ↓
PostgreSQL
```

External integrations:

```text
Business Services
      ↓
Integration Interfaces
      ↓
WhatsApp / Email / Storage / SMS / Payment APIs
```

Do not tightly couple the UI directly to external providers.

---

# 6. MULTI-TENANT / MULTI-BRANCH FOUNDATION

Design the database from day one for:

```text
Organization
    ↓
Branches
    ↓
Users
    ↓
Customers
    ↓
Services
    ↓
Work
    ↓
Payments
    ↓
Expenses
```

Every relevant record should contain the required organization/branch relationship.

Current deployment may use one organization and one branch.

But adding:

```text
Branch 2
Branch 3
Branch 4
```

must NOT require rewriting the database.

---

# 7. AUTHENTICATION SYSTEM

Implement secure authentication.

Roles:

```text
ADMIN
EMPLOYEE
AGENT
```

Authentication must support:

- Login
- Logout
- Session
- Password hashing
- Remember Me
- Forgot Password architecture
- Account active/inactive
- Protected routes
- Unauthorized page
- User profile

Never trust role information sent from the browser.

Server must determine:

```text
Who is the user?
What role do they have?
Which branch can they access?
Which records can they access?
Which actions are allowed?
```

---

# 8. PERMISSION SYSTEM

Do not create only three hardcoded frontend roles.

Create a permission architecture.

Example permissions:

```text
customers.view
customers.create
customers.update
customers.delete

services.view
services.create
services.update
services.delete

work.view
work.create
work.update
work.status_update

payments.view
payments.create
payments.update
payments.refund

expenses.view
expenses.create
expenses.update

reports.view

employees.view
employees.create
employees.update

agents.view
agents.create
agents.update

documents.upload
documents.verify
documents.reject

whatsapp.view
whatsapp.send

settings.view
settings.update
```

ADMIN:

Full permissions.

EMPLOYEE:

Operational permissions according to configuration.

AGENT:

Only permitted agent-related records.

---

# 9. DATABASE MODEL

Create Prisma models at minimum for:

```text
Organization
Branch
User
Role / Permission architecture
Customer
ServiceCategory
Service
Work
WorkDocument
Payment
Receipt
Expense
Notification
WhatsAppMessage
ActivityLog
```

Recommended supporting models:

```text
PasswordResetToken
Session
ServiceRequiredDocument
WorkStatusHistory
PaymentAllocation
ExpenseCategory
NotificationPreference
WhatsAppTemplate
FileAsset
AuditMetadata
```

Only add supporting tables when useful.

Do not over-engineer.

---

# 10. DATABASE RULES

Every model must have appropriate:

- Primary key
- Foreign keys
- Relations
- Indexes
- Unique constraints
- createdAt
- updatedAt

Use UUIDs or another safe identifier strategy where appropriate.

Human-readable IDs must be separate where necessary.

Examples:

```text
CUS-2026-00001
WORK-2026-00001
PAY-2026-00001
REC-2026-00001
EXP-2026-00001
```

Human-readable IDs must be unique.

Generate them server-side.

Avoid race conditions during ID generation.

---

# 11. CUSTOMER MODULE

Create complete customer management.

Fields:

```text
Customer ID
Full Name
Mobile
Alternate Mobile
Email
Date of Birth
Gender
Address
Area
City
State
Pincode
Notes
Created Date
Created By
Branch
```

Features:

- Create
- View
- Edit
- Soft Delete
- Search
- Filter
- Sort
- Pagination
- Export
- WhatsApp
- Create Work
- Add Payment

Search:

```text
Name
Mobile
Customer ID
```

Use debounced search.

---

# 12. CUSTOMER PROFILE

Customer profile should become the central customer workspace.

Tabs/sections:

### Overview

Basic information.

### Work

All work associated with customer.

### Documents

Documents associated with customer/work.

### Payments

Payment history.

### Receipts

Receipt history.

### Services

Services used.

### Activity

Complete activity timeline.

Example:

```text
Customer Created
↓
Service Selected
↓
Work Created
↓
Documents Required
↓
Documents Received
↓
Payment Received
↓
Work Submitted
↓
Under Process
↓
Completed
↓
Customer Notified
↓
Delivered
```

---

# 13. SERVICE MANAGEMENT

Admin can manage services.

Fields:

```text
Service ID
Service Name
Category
Description
Customer Price
Agent Price
Estimated Completion Time
Required Documents
Active/Inactive
```

Categories:

```text
PAN Services
Aadhaar Services
Passport Services
Voter Services
Driving Licence
Certificates
Gazette
Banking
Insurance
Ticket Booking
Other
```

Admin can:

- Create
- Edit
- Activate
- Deactivate
- Configure pricing
- Configure required documents

---

# 14. WORK MANAGEMENT

Work is the central operational entity.

Work fields:

```text
Work ID
Customer
Service
Agent
Assigned Employee
Branch
Created Date
Due Date
Priority
Total Amount
Paid Amount
Pending Amount
Status
Notes
```

Work ID example:

```text
WORK-2026-00001
```

Rules:

- Customer required
- Service required
- Branch required
- Total amount cannot be negative
- Paid amount cannot be negative
- Pending amount calculated server-side
- Unauthorized users cannot modify work

---

# 15. WORK STATUS ENGINE

Statuses:

```text
NEW
DOCUMENTS_REQUIRED
DOCUMENTS_RECEIVED
IN_PROGRESS
SUBMITTED
UNDER_PROCESS
COMPLETED
DELIVERED
ON_HOLD
CANCELLED
```

Create a proper status transition system.

Do not allow random invalid transitions.

Example:

```text
NEW
 ↓
DOCUMENTS_REQUIRED
 ↓
DOCUMENTS_RECEIVED
 ↓
IN_PROGRESS
 ↓
SUBMITTED
 ↓
UNDER_PROCESS
 ↓
COMPLETED
 ↓
DELIVERED
```

Allow:

```text
ON_HOLD
CANCELLED
```

according to permission/business rules.

Every status change creates:

```text
WorkStatusHistory
ActivityLog
```

Store:

- Previous status
- New status
- User
- Date/time
- Note

---

# 16. DOCUMENT MANAGEMENT

Each service can define required documents.

Examples:

```text
Aadhaar
PAN
Photo
Address Proof
ID Proof
Signature
Other
```

Document states:

```text
REQUIRED
UPLOADED
VERIFIED
REJECTED
```

Features:

- Drag & drop
- Upload
- Preview
- File name
- File size
- Progress
- Delete
- Download
- Verify
- Reject

Security:

- Validate MIME type
- Validate extension
- Validate file size
- Generate safe storage names
- Never trust original filename
- Never expose private files publicly without authorization

---

# 17. FILE STORAGE ABSTRACTION

Create:

```text
FileStorageService
```

Interface should support:

```text
upload()
download()
delete()
getUrl()
```

Current implementation can be local/cloud adapter depending on environment.

Future implementation:

```text
S3StorageService
CloudinaryStorageService
GoogleCloudStorageService
```

Core application must not care which provider is used.

---

# 18. PAYMENT SYSTEM

Payment fields:

```text
Payment ID
Customer
Work ID
Service
Amount
Payment Method
Transaction ID
Date
Collected By
Branch
Notes
Status
```

Methods:

```text
CASH
UPI
BANK_TRANSFER
CARD
OTHER
```

Statuses:

```text
PAID
PARTIAL
PENDING
REFUNDED
```

Rules:

```text
Payment amount > 0
Payment cannot exceed payable amount
unless explicit authorized override exists.
```

Do all financial validation server-side.

---

# 19. FINANCIAL TRANSACTIONS

Use database transactions for operations such as:

```text
Create Payment
↓
Update Work Paid Amount
↓
Create Receipt
↓
Create ActivityLog
↓
Create Notification
```

If one critical operation fails, rollback appropriately.

Never create inconsistent financial records.

---

# 20. RECEIPT SYSTEM

Receipt contains:

```text
Business Logo
AL-HADI ENTERPRISE
Address
Contact
Receipt Number
Date
Customer
Mobile
Work ID
Service
Total Amount
Paid Amount
Pending Amount
Payment Method
Transaction ID
Received By
Notes
```

Actions:

- Print
- Download
- Share
- WhatsApp

Support:

```text
A4
Thermal receipt
```

Create print CSS.

Receipt must look professional even when printed.

---

# 21. INCOME MODULE

Show:

```text
Today's Income
Weekly Income
Monthly Income
Yearly Income
Pending Payments
Total Collected
```

Filters:

- Date
- Service
- Employee
- Agent
- Payment method
- Branch

Use actual payment records.

---

# 22. EXPENSE MODULE

Fields:

```text
Expense ID
Date
Category
Description
Amount
Payment Method
Added By
Branch
Notes
```

Categories:

```text
Rent
Electricity
Internet
Printing
Stationery
Salary
Travel
Maintenance
Software
Marketing
Other
```

Use soft-delete for financial records where appropriate.

---

# 23. PROFIT ENGINE

Calculate:

```text
TOTAL INCOME
-
TOTAL EXPENSE
=
NET PROFIT
```

Show:

- Daily
- Monthly
- Yearly

Never calculate financial totals only from frontend state.

Use server/database calculations.

---

# 24. DASHBOARD

Create premium Admin Dashboard.

KPIs:

```text
Total Customers
Today's Customers
Pending Work
Completed Work
Today's Income
Monthly Income
Pending Payments
Total Expenses
Net Profit
```

Dashboard must load real data.

Use skeleton loaders.

Handle:

- Empty state
- API errors
- Slow loading

---

# 25. DASHBOARD CHARTS

Use Recharts.

Charts:

### Income Overview

Line/Area chart.

Filters:

```text
Today
7 Days
This Month
Last Month
This Year
```

### Service Revenue

Pie/Donut.

### Work Status

Donut.

### Monthly Expenses

Bar chart.

### Revenue vs Expense

Comparison chart.

Charts must be responsive.

---

# 26. REPORTING ENGINE

Reports:

### Customer Report

- New
- Returning
- By Service
- By Branch

### Work Report

- New
- Pending
- In Progress
- Completed
- Cancelled

### Service Report

- Applications
- Revenue
- Completion Rate

### Income Report

- Daily
- Weekly
- Monthly
- Yearly

### Expense Report

- Category
- Monthly
- Yearly

### Profit Report

- Income vs Expense

### Employee Performance

- Assigned
- Completed
- Pending
- Payments Collected

### Agent Performance

- Customers
- Submitted Work
- Completed Work
- Revenue
- Commission

---

# 27. REPORT FILTER ARCHITECTURE

Reusable filters:

```text
Date Range
Branch
Service
Employee
Agent
Payment Method
Status
```

Use reusable DateRangePicker.

Do not duplicate filtering logic across every report.

---

# 28. EMPLOYEE MANAGEMENT

Admin only.

Fields:

```text
Employee ID
Name
Mobile
Email
Role
Branch
Joining Date
Status
```

Actions:

- View
- Edit
- Activate
- Deactivate
- Reset Password

Profile:

- Assigned Work
- Completed Work
- Pending Work
- Income Collected
- Performance

---

# 29. AGENT MANAGEMENT

Admin only.

Fields:

```text
Agent ID
Name
Business Name
Mobile
Email
Address
Commission
Branch
Status
```

Agent dashboard:

```text
Total Customers
Total Work
Pending Work
Completed Work
Revenue
Commission
```

Agent isolation is mandatory.

Agent A must never access:

- Agent B customers
- Agent B work
- Agent B commission
- Agent B private records

Enforce this server-side.

---

# 30. WHATSAPP ARCHITECTURE

Create:

```text
WhatsAppService
```

with provider abstraction.

Do NOT hard-code WhatsApp API credentials.

Templates:

```text
WORK_CREATED
PAYMENT_RECEIVED
WORK_IN_PROGRESS
DOCUMENTS_REQUIRED
WORK_COMPLETED
```

Support variables:

```text
{customer_name}
{service_name}
{work_id}
{amount}
{receipt_number}
```

Features:

- Template management
- Message preview
- Send
- Message history
- Delivery status architecture
- Retry architecture
- Failed message state

---

# 31. NOTIFICATION SYSTEM

Notifications:

```text
New Customer
New Work
Payment Received
Pending Payment
Documents Required
Work Completed
New Agent Submission
Expense Added
```

Notification center:

- Unread count
- Mark read
- Mark all read
- Timestamp
- Type
- Related record
- Navigation link

---

# 32. GLOBAL SEARCH

Use shadcn Command.

Search:

```text
Customer Name
Mobile
Customer ID
Work ID
Receipt Number
Payment ID
Service
```

Results should be grouped.

Example:

```text
CUSTOMERS
WORK
PAYMENTS
RECEIPTS
SERVICES
```

Keyboard accessible.

---

# 33. SETTINGS

## Business Settings

```text
Business Name
Logo
Address
Mobile
Email
GSTIN
Website
```

## Receipt Settings

```text
Receipt Prefix
Footer
Terms
Logo
```

## Service Settings

```text
Categories
Pricing
```

## WhatsApp Settings

```text
Templates
API Configuration Placeholder
```

## User Settings

```text
Profile
Password
Theme
```

---

# 34. SIDEBAR

ADMIN:

```text
Dashboard
Customers
Services
Work Management
Payments
Receipts
Income
Expenses
Reports
Employees
Agents
WhatsApp
Notifications
Settings
```

EMPLOYEE:

```text
Dashboard
Customers
My Work
Payments
Receipts
WhatsApp
Notifications
```

AGENT:

```text
Dashboard
Customers
Submit Work
My Work
Payments
Receipts
Notifications
```

Navigation must be generated from permission/role configuration where practical.

---

# 35. UI COMPONENT ARCHITECTURE

Create reusable components:

```text
PageHeader
StatCard
DataTable
StatusBadge
CustomerForm
CustomerCard
CustomerProfile
WorkForm
WorkTimeline
WorkStatusSelector
PaymentForm
ReceiptPreview
ExpenseForm
ServiceForm
FileUpload
SearchCommand
NotificationPanel
ConfirmDialog
EmptyState
LoadingSkeleton
ErrorState
DateRangePicker
PermissionGuard
```

Do not duplicate UI logic.

---

# 36. TABLE SYSTEM

Create reusable DataTable.

Features:

- Sorting
- Filtering
- Pagination
- Search
- Column visibility
- Row actions
- Loading
- Empty state
- Error state
- Responsive behavior

Desktop:

Normal table.

Mobile:

Use cards or responsive layout where necessary.

---

# 37. FORM SYSTEM

Forms must have:

- Proper labels
- Validation
- Error messages
- Loading state
- Disabled state
- Success state
- Confirmation where needed

Validate:

- Required fields
- Mobile
- Email
- Dates
- Amounts
- Duplicate records
- File uploads

Use a consistent validation architecture.

---

# 38. ERROR HANDLING

Create centralized error handling.

API errors should return structured responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mobile number is invalid"
  }
}
```

Do not expose:

- Stack traces
- Database credentials
- Internal secrets
- Sensitive implementation details

to users.

---

# 39. API ARCHITECTURE

Create clean API modules.

Example:

```text
/api/auth/*
/api/customers/*
/api/services/*
/api/work/*
/api/documents/*
/api/payments/*
/api/receipts/*
/api/income/*
/api/expenses/*
/api/reports/*
/api/employees/*
/api/agents/*
/api/notifications/*
/api/whatsapp/*
/api/settings/*
```

Every endpoint must verify:

```text
Authentication
+
Role
+
Permission
+
Organization
+
Branch
+
Record ownership
```

where applicable.

---

# 40. API RESPONSE STANDARD

Use consistent responses.

Success:

```text
{
  success: true,
  data: ...
}
```

Error:

```text
{
  success: false,
  error: {
    code: "...",
    message: "..."
  }
}
```

For lists:

```text
{
  success: true,
  data: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

# 41. AUDIT LOGGING

Track important actions.

Examples:

```text
CUSTOMER_CREATED
CUSTOMER_UPDATED

WORK_CREATED
WORK_UPDATED
WORK_STATUS_CHANGED

PAYMENT_CREATED
PAYMENT_UPDATED
PAYMENT_REFUNDED

RECEIPT_GENERATED

EXPENSE_CREATED

EMPLOYEE_CREATED
EMPLOYEE_UPDATED

AGENT_CREATED
AGENT_UPDATED

DOCUMENT_UPLOADED
DOCUMENT_VERIFIED
DOCUMENT_REJECTED

WHATSAPP_SENT
```

Store:

```text
User
Branch
Entity
Entity ID
Action
Timestamp
Metadata
Previous Value
New Value
```

Never silently modify important financial/business records.

---

# 42. SECURITY REQUIREMENTS

Implement:

- Password hashing
- Secure sessions
- Protected routes
- Server-side authorization
- Branch isolation
- Input validation
- File validation
- API protection
- Rate limiting where appropriate
- Secure environment variables
- No secrets in git
- No hard-coded passwords
- Audit logs
- Soft delete for sensitive financial/business records

Never rely on:

```text
localStorage role
```

as the security mechanism.

---

# 43. RESPONSIVE DESIGN

Verify at:

```text
1920px
1440px
1280px
1024px
768px
390px
```

Test:

- Sidebar
- Header
- Dashboard
- Tables
- Forms
- Dialogs
- Charts
- Customer profile
- Work timeline
- Receipt
- Reports

No broken layouts.

---

# 44. ACCESSIBILITY

Implement:

- Keyboard navigation
- Focus states
- Proper labels
- Accessible dialogs
- ARIA where necessary
- Good contrast
- Screen reader support
- Keyboard-accessible menus
- Keyboard-accessible tables
- Accessible form validation

---

# 45. PERFORMANCE

Use:

- Pagination
- Debounced search
- Lazy loading
- Efficient Prisma queries
- Database indexes
- Query optimization
- Memoization where useful
- Optimized charts
- Avoid unnecessary re-renders

Do not fetch thousands of records to render a 20-row table.

---

# 46. SEED DATA

Create realistic seed data.

Include:

### Organization

AL-HADI ENTERPRISE

### Branch

Main Branch

### Users

- Admin
- Employee
- Agent

### Customers

At least 20 realistic Indian customers.

### Services

At least 10 CSC services.

### Work

At least 30 realistic work records.

### Payments

At least 30 realistic payments.

### Expenses

At least 15 expenses.

### Notifications

Realistic notifications.

### Activity logs

Realistic history.

The dashboard should look meaningful immediately after seeding.

---

# 47. DEFAULT DEMO ACCOUNTS

Create development-only seed credentials.

Example:

```text
Admin
Email: admin@example.local
Password: CHANGE_ME_ADMIN

Employee
Email: employee@example.local
Password: CHANGE_ME_EMPLOYEE

Agent
Email: agent@example.local
Password: CHANGE_ME_AGENT
```

Clearly mark these as development credentials.

Do not use these credentials in production.

Never hard-code production passwords.

---

# 48. PROJECT STRUCTURE

Use a clean scalable architecture.

Example:

```text
src/
│
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── customers/
│   ├── services/
│   ├── work/
│   ├── payments/
│   ├── receipts/
│   ├── income/
│   ├── expenses/
│   ├── reports/
│   ├── employees/
│   ├── agents/
│   ├── whatsapp/
│   ├── notifications/
│   └── settings/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tables/
│   ├── forms/
│   ├── charts/
│   └── common/
│
├── features/
│   ├── auth/
│   ├── customers/
│   ├── services/
│   ├── work/
│   ├── payments/
│   ├── receipts/
│   ├── expenses/
│   ├── reports/
│   ├── employees/
│   ├── agents/
│   ├── whatsapp/
│   └── notifications/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── validation/
│   ├── storage/
│   ├── whatsapp/
│   └── utils/
│
├── services/
│
├── types/
│
└── hooks/
```

Adapt this structure to the actual framework after inspecting the workspace.

Do not blindly follow this if the existing project has a better established architecture.

---

# 49. TYPESCRIPT QUALITY

Use strict TypeScript.

Create reusable types.

Never use:

```text
any
```

as a shortcut.

Avoid unnecessary type assertions.

Type:

- API responses
- Forms
- Database service outputs
- Permissions
- Roles
- Statuses
- Tables
- Charts

---

# 50. BUSINESS LOGIC SEPARATION

Do NOT write:

```text
database query
+
business rules
+
UI
```

inside one component.

Bad:

```text
CustomerPage.tsx
```

containing everything.

Instead:

```text
UI
↓
Feature service
↓
API
↓
Business service
↓
Repository/Prisma
```

---

# 51. PHASED IMPLEMENTATION

## PHASE 0 — INSPECTION

Inspect workspace.

Output internally:

```text
Current stack
Current structure
Current dependencies
Current errors
Recommended changes
```

Then continue.

---

## PHASE 1 — FOUNDATION

Build:

- Project structure
- Theme
- Tailwind
- shadcn
- Sidebar
- Header
- Login UI
- Protected layout
- Role architecture
- Responsive layout

Acceptance:

- App runs
- Login screen works visually
- Dashboard layout loads
- No console errors

---

## PHASE 2 — DATABASE

Build:

- Prisma
- PostgreSQL connection
- Schema
- Migrations
- Seed
- Repository/services
- Authentication database

Acceptance:

- Migration succeeds
- Seed succeeds
- Data can be queried
- Relationships work

---

## PHASE 3 — AUTHENTICATION

Implement:

- Login
- Logout
- Session
- Protected routes
- Roles
- Permissions
- Unauthorized page

Acceptance:

Admin, Employee and Agent see appropriate access.

---

## PHASE 4 — CUSTOMER MANAGEMENT

Implement complete customer module.

Acceptance:

Create → Search → View → Edit → History works.

---

## PHASE 5 — SERVICE MANAGEMENT

Implement:

- Categories
- Services
- Pricing
- Required documents

Acceptance:

Service can be created and used when creating work.

---

## PHASE 6 — WORK MANAGEMENT

Implement:

- Work creation
- Assignment
- Status engine
- Timeline
- Documents

Acceptance:

Customer → Service → Work → Documents → Status works.

---

## PHASE 7 — FINANCE

Implement:

- Payments
- Partial payments
- Receipts
- Income
- Financial validation

Acceptance:

Payment changes work balance correctly.

---

## PHASE 8 — EXPENSES + PROFIT

Implement:

- Expenses
- Profit calculation
- Charts

Acceptance:

Income - Expense = Profit correctly.

---

## PHASE 9 — REPORTS

Implement all major reports.

Acceptance:

Filters and totals match database data.

---

## PHASE 10 — EMPLOYEES + AGENTS

Implement:

- Employee management
- Agent management
- Permissions
- Isolation

Acceptance:

Agent cannot access another agent's data.

---

## PHASE 11 — WHATSAPP + NOTIFICATIONS

Implement:

- Templates
- Adapter
- Message history
- Notifications

Acceptance:

Message creation architecture works without requiring a real provider.

---

## PHASE 12 — SETTINGS + POLISH

Implement:

- Business settings
- Receipt settings
- User settings
- Service settings
- WhatsApp settings

Then:

- UI polish
- Responsive fixes
- Performance
- Accessibility

---

# 52. TESTING STRATEGY

Test at three levels.

## UNIT

Test business logic:

- Payment calculation
- Pending amount
- Profit calculation
- Permission checks
- Status transitions
- ID generation

## API

Test:

- Authentication
- Authorization
- CRUD
- Validation
- Branch isolation
- Agent isolation

## BROWSER / E2E

Test real workflows:

### Workflow 1

Login

→ Dashboard

### Workflow 2

Create Customer

→ Create Work

→ Add Documents

### Workflow 3

Add Payment

→ Generate Receipt

### Workflow 4

Change Work Status

→ Notification

→ Activity Log

### Workflow 5

Agent Login

→ Only own records visible

### Workflow 6

Employee Login

→ Restricted access

---

# 53. BROWSER VERIFICATION

Use browser testing.

Check:

- Console
- Network errors
- Broken routes
- Forms
- Modals
- Tables
- Mobile layout
- Navigation
- Loading states
- Error states

Do not rely only on TypeScript compilation.

---

# 54. ACCEPTANCE CRITERIA

The project is NOT complete unless:

### Authentication

- Login works
- Logout works
- Sessions work
- Roles work
- Protected routes work

### Customers

- CRUD works
- Search works
- Filters work
- Profile works

### Services

- CRUD works
- Pricing works
- Required documents work

### Work

- Create works
- Assignment works
- Status workflow works
- Timeline works
- Documents work

### Payments

- Create works
- Partial payment works
- Overpayment validation works
- Receipt works

### Expenses

- Create works
- Profit updates correctly

### Reports

- Data is real
- Filters work
- Totals are accurate

### Agents

- Data isolation works

### Employees

- Permissions work

### Notifications

- Notification creation works

### WhatsApp

- Adapter architecture works

### UI

- Responsive
- Accessible
- Loading states
- Empty states
- Error states

### Technical

- TypeScript passes
- Build passes
- Database migrations pass
- Seed works
- No obvious console errors
- No dead navigation
- No dead buttons

---

# 55. DATA INTEGRITY CHECKS

Before completion, verify:

```text
Customer without branch = INVALID

Work without customer = INVALID

Work without service = INVALID

Payment without work = INVALID

Receipt without payment = INVALID

Negative payment = INVALID

Negative expense = INVALID

Unauthorized financial modification = INVALID

Agent accessing another agent's work = INVALID

Branch user accessing unauthorized branch = INVALID
```

---

# 56. SOFT DELETE POLICY

Do not hard-delete important historical records unnecessarily.

Prefer:

```text
deletedAt
deletedBy
```

for:

- Customers with history
- Financial records
- Services referenced by work
- Users with historical activity

Historical records must remain traceable.

---

# 57. CONCURRENCY / RACE CONDITIONS

Be careful with:

- Work ID generation
- Customer ID generation
- Receipt numbers
- Payment updates
- Concurrent status changes

Use database constraints/transactions rather than relying only on frontend logic.

---

# 58. FINANCIAL SAFETY

Money calculations must use appropriate database numeric/decimal types.

Do not use floating-point arithmetic carelessly for financial calculations.

Use server-side authoritative calculations.

Example:

```text
Total = ₹1000
Paid = ₹700
Pending = ₹300
```

If another payment of ₹400 is attempted:

Reject unless authorized overpayment handling exists.

---

# 59. UX RULES

The user should always know:

- What happened?
- What is loading?
- What failed?
- What should they do next?
- Was the action successful?

Use:

- Toasts
- Inline validation
- Confirmation dialogs
- Status badges
- Empty states
- Skeletons
- Clear error messages

Never show generic:

```text
Something went wrong
```

when a useful message can be provided.

---

# 60. NO FAKE FEATURES

If a button exists:

**it must work.**

If a module exists:

**it must have meaningful functionality.**

If an API exists:

**it must be connected to actual logic.**

If a chart exists:

**it must use actual data.**

If a table exists:

**it must use actual records.**

Do not create visual placeholders disguised as completed functionality.

---

# 61. NO PREMATURE COMPLETION

Do not stop because:

- Dashboard looks good
- Login works
- Build passes
- Basic CRUD works

Continue until the complete required modules are implemented.

---

# 62. ERROR RECOVERY PROTOCOL

When an error occurs:

```text
STOP
↓
READ ERROR
↓
TRACE ROOT CAUSE
↓
FIX ROOT CAUSE
↓
RUN TEST
↓
VERIFY
↓
CONTINUE
```

Do not:

- Disable type checking
- Delete functionality
- Comment out failing code
- Ignore console errors
- Replace real logic with fake data
- Hide API failures

---

# 63. ENVIRONMENT VARIABLES

Create `.env.example`.

Never commit secrets.

Example structure:

```text
DATABASE_URL=

AUTH_SECRET=

STORAGE_PROVIDER=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

WHATSAPP_PROVIDER=
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

EMAIL_PROVIDER=
EMAIL_API_KEY=

NEXT_PUBLIC_APP_URL=
```

Only include variables actually required by the implementation.

---

# 64. DOCUMENTATION

Create/update:

```text
README.md
.env.example
```

README must explain:

1. Requirements
2. Installation
3. Environment variables
4. PostgreSQL setup
5. Prisma migration
6. Seed command
7. Development server
8. Production build
9. Production start
10. Test commands
11. External integrations
12. Known limitations

---

# 65. FINAL SECURITY REVIEW

Before completion ask yourself:

- Can an agent access another agent's customer?
- Can an employee modify unauthorized payment?
- Can a branch user see another branch?
- Can someone fake a role from the browser?
- Can someone upload dangerous files?
- Can someone manipulate payment amounts from frontend?
- Can someone generate duplicate receipt numbers?
- Can someone bypass protected API routes?
- Are secrets exposed?
- Are deleted financial records still auditable?

Fix every issue discovered.

---

# 66. FINAL PERFORMANCE REVIEW

Check:

- Slow API queries
- Missing database indexes
- Large table queries
- Unnecessary frontend requests
- Chart performance
- Duplicate requests
- Excessive rendering
- Large file handling

Fix obvious performance problems.

---

# 67. FINAL UI REVIEW

The application should feel like:

**A serious commercial ERP/CRM product.**

Not:

- Student project
- Admin template
- Generic dashboard
- Colorful toy
- Bootstrap-style website

Visual language:

- Professional
- Clean
- Modern
- Dense but readable
- Consistent
- Practical
- Fast

---

# 68. FINAL PROJECT REPORT

Only after actual implementation and verification, provide:

```text
PROJECT STATUS

Built:
- ...

Database:
- ...

Authentication:
- ...

Roles:
- ...

Modules:
- ...

API:
- ...

File Storage:
- ...

WhatsApp:
- ...

Testing:
- ...

Environment Variables:
- ...

How to Run:
- ...

Known Limitations:
- ...

Remaining Integrations:
- ...
```

Clearly distinguish:

```text
IMPLEMENTED
```

from:

```text
ARCHITECTURE READY
```

and:

```text
NOT IMPLEMENTED
```

Do not falsely claim external integrations are live when only the adapter architecture exists.

---

# 69. FINAL COMMAND

## START NOW.

Do not ask me to manually create files unless absolutely necessary.

First inspect the workspace.

Then:

```text
INSPECT
→ PLAN
→ IMPLEMENT
→ DATABASE
→ AUTH
→ UI
→ API
→ BUSINESS LOGIC
→ TEST
→ DEBUG
→ VERIFY
→ CONTINUE
```

Use terminal.

Use browser.

Use the actual application.

Fix errors immediately.

Do not stop at the dashboard.

Do not stop at the login.

Do not stop at CRUD.

Build the complete **AL-HADI ENTERPRISE CSC CENTER ERP / CRM**.

The final application must be suitable as the foundation for real daily CSC center operations.
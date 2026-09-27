# ARCHITECTURE.md
# AL-HADI ENTERPRISE — CSC CENTER ERP / CRM

## 1. Purpose

This document defines the technical architecture for the AL-HADI ENTERPRISE CSC Center ERP/CRM.

The system is an internal operational platform for managing customers, CSC services, work/application processing, documents, payments, receipts, expenses, employees, agents, notifications, reports and future multi-branch operations.

The architecture is based on the supplied CSC Center Management System requirements: React + TypeScript + Tailwind + shadcn/ui + Lucide + Recharts, with a Node.js/Next.js-compatible backend, PostgreSQL and Prisma.

## 2. Architecture Goals

- Production-ready rather than demo-only
- Modular and maintainable
- Secure server-side authorization
- Multi-branch ready
- Transaction-safe financial workflows
- Strong TypeScript typing
- Reusable UI components
- External-service adapters
- Testable business logic
- Responsive desktop/tablet/mobile UI
- Easy future expansion

## 3. System Architecture

```text
Browser
  |
  v
React / Next.js UI
  |
  v
Route Protection + Session
  |
  v
API / Server Actions
  |
  v
Authorization + Permission Layer
  |
  v
Application / Business Services
  |
  +--------------------+
  |                    |
  v                    v
Prisma Repository   Integration Adapters
  |                    |
  v                    +--> WhatsApp
PostgreSQL             +--> Email
                       +--> File Storage
                       +--> SMS
                       +--> Payment APIs
                       +--> Government APIs
```

The UI must never be the authoritative source for permissions, money calculations, branch isolation or agent isolation.

## 4. Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts

### Backend
- Next.js / Node.js
- TypeScript
- REST API or clean server-side API architecture

### Database
- PostgreSQL

### ORM
- Prisma

### Validation
Use a consistent schema validation library such as Zod if the existing project does not already provide equivalent validation.

### Testing
Use the project's established testing tools. Prefer unit, API/integration and browser/E2E coverage.

## 5. Core Domain

```text
Organization
  |
  +-- Branch
       |
       +-- User
       +-- Customer
       +-- Work
       |    |
       |    +-- WorkDocument
       |    +-- WorkStatusHistory
       |    +-- Payment
       |         |
       |         +-- Receipt
       |
       +-- Expense
       +-- Notification
       +-- WhatsAppMessage
       +-- ActivityLog
```

Services and service categories are organization-aware and may be shared/configured according to business rules.

## 6. Multi-Branch Strategy

Every branch-sensitive record must be traceable to an Organization and, where operationally relevant, a Branch.

Current deployment may contain one branch. The schema must not require a rewrite when branches are added.

Server-side query scoping must enforce:

```text
organizationId = authenticatedUser.organizationId
AND
branchId IN authenticatedUser.allowedBranches
```

ADMIN may receive cross-branch permissions.

## 7. Identity Strategy

Use internal UUIDs or equivalent stable primary keys.

Use separate human-readable numbers:

- Customer: `CUS-YYYY-00001`
- Work: `WORK-YYYY-00001`
- Payment: `PAY-YYYY-00001`
- Receipt: `REC-YYYY-00001`
- Expense: `EXP-YYYY-00001`

Human-readable identifiers must be unique and generated server-side using transaction-safe logic.

## 8. Authentication

Authentication must use secure server-managed sessions.

Required:

- Login
- Logout
- Protected routes
- Session validation
- Password hashing
- Account active/inactive
- Password reset architecture
- Remember-me behavior where supported
- Unauthorized page

Never store a trusted role only in localStorage.

## 9. Authorization

Authorization is layered:

```text
Authentication
  -> Role
    -> Permission
      -> Organization
        -> Branch
          -> Record ownership
```

Example:

An AGENT can access only records explicitly belonging to that agent, even if a manipulated client request contains another agent's ID.

## 10. Roles

### ADMIN
Full access, including user management, services, finances, reports and branch management.

### EMPLOYEE
Operational access according to assigned permissions.

### AGENT
Restricted access to permitted customers/work and agent-specific information.

## 11. Permission Model

Recommended permission keys:

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

documents.view
documents.upload
documents.verify
documents.reject
documents.delete

payments.view
payments.create
payments.update
payments.refund

receipts.view
receipts.create
receipts.print

income.view
expenses.view
expenses.create
expenses.update

reports.view

employees.view
employees.create
employees.update
employees.deactivate

agents.view
agents.create
agents.update
agents.deactivate

whatsapp.view
whatsapp.send
whatsapp.templates

notifications.view

settings.view
settings.update

branches.view
branches.create
branches.update
```

## 12. Database Models

Minimum Prisma domain models:

- Organization
- Branch
- User
- Role/Permission architecture
- Customer
- ServiceCategory
- Service
- ServiceRequiredDocument
- Work
- WorkDocument
- WorkStatusHistory
- Payment
- Receipt
- Expense
- Notification
- WhatsAppTemplate
- WhatsAppMessage
- ActivityLog
- FileAsset

Optional support models:

- Session
- PasswordResetToken
- NotificationPreference

## 13. Financial Architecture

Money must use PostgreSQL Decimal/Numeric-compatible types.

Never rely on JavaScript floating-point arithmetic for authoritative financial totals.

Payment workflow:

```text
Validate user
  -> Validate work
  -> Calculate outstanding amount
  -> Validate payment amount
  -> Database transaction
      -> Create Payment
      -> Create Receipt
      -> Update required aggregates/state
      -> Create ActivityLog
      -> Create Notification
  -> Commit
```

If the transaction fails, critical changes must roll back.

## 14. Work State Machine

Primary states:

```text
NEW
DOCUMENTS_REQUIRED
DOCUMENTS_RECEIVED
IN_PROGRESS
SUBMITTED
UNDER_PROCESS
COMPLETED
DELIVERED
```

Additional states:

```text
ON_HOLD
CANCELLED
```

Transitions must be validated server-side and recorded in WorkStatusHistory.

## 15. Document Storage

Do not store PDF/JPG/PNG binary content in PostgreSQL.

Use:

```text
FileStorageService
  upload()
  download()
  delete()
  getUrl()
```

Store metadata in FileAsset/WorkDocument:

- Storage key
- Original filename
- MIME type
- Size
- Uploaded by
- Work
- Document type
- Verification state
- Created timestamp

Validate MIME type, extension and file size.

## 16. API Architecture

Recommended route groups:

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
/api/branches/*
```

Every protected endpoint must perform authentication and authorization.

## 17. API Response Contract

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mobile number is invalid"
  }
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 18. Feature Architecture

Keep presentation, business logic and persistence separate.

```text
Feature UI
  -> Feature Hook
  -> API Client
  -> Server Endpoint
  -> Business Service
  -> Repository/Prisma
```

Do not place database queries inside React components.

## 19. Recommended Folder Structure

```text
src/
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
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tables/
│   ├── forms/
│   └── charts/
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
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── validation/
│   ├── storage/
│   └── integrations/
├── services/
├── types/
├── hooks/
└── utils/
```

Adapt this to the existing repository rather than destroying an established architecture.

## 20. Integration Adapters

### WhatsApp
Expose a provider-independent interface:

```text
sendMessage()
sendTemplate()
getMessageStatus()
```

### Storage
Expose:

```text
upload()
download()
delete()
getUrl()
```

### Email/SMS
Use similar provider-independent interfaces.

External credentials belong only in environment variables.

## 21. Audit Architecture

ActivityLog records:

- actor
- organization
- branch
- action
- entity
- entityId
- timestamp
- metadata
- previous value when appropriate
- new value when appropriate

Track all important financial, access and status-changing actions.

## 22. Observability

Production logging must:

- avoid secrets
- avoid unnecessary personal data
- include request/action context
- make failures traceable
- distinguish validation, authorization, database and integration failures

## 23. Performance

- Paginate large lists
- Debounce search
- Add database indexes for common lookups
- Avoid N+1 queries
- Lazy-load heavy UI
- Optimize charts
- Avoid unnecessary React renders
- Do not load thousands of rows for a small table

## 24. Security

Required:

- secure password hashing
- server-side authorization
- input validation
- protected APIs
- file validation
- secret management
- branch isolation
- agent isolation
- audit logging
- safe error messages
- rate limiting where appropriate
- CSRF protection where applicable to chosen auth architecture

## 25. Deployment Architecture

Environments:

```text
Development
Staging
Production
```

Use separate environment variables and database credentials.

Never commit:

- database passwords
- auth secrets
- WhatsApp tokens
- cloud storage secrets
- email API keys

## 26. Architecture Acceptance Criteria

Architecture is accepted only when:

- PostgreSQL + Prisma works
- Authentication is server-backed
- Role and permission checks are server-side
- Branch isolation exists
- Agent isolation exists
- Financial operations are transaction-safe
- Files are stored outside PostgreSQL
- External providers are abstracted
- Major modules are independently testable
- The application can grow to multiple branches without redesigning the core schema

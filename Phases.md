# PHASES.md
# AL-HADI ENTERPRISE — CSC CENTER ERP / CRM IMPLEMENTATION ROADMAP

## Development Rule

Use this sequence:

```text
INSPECT
→ PLAN
→ BUILD
→ RUN
→ TEST
→ FIX
→ VERIFY
→ NEXT PHASE
```

Never mark a phase complete because files were created. A phase is complete only after its acceptance criteria pass.

---

# PHASE 0 — Workspace Inspection

## Tasks

- Inspect repository
- Inspect package.json
- Inspect framework
- Inspect TypeScript
- Inspect existing routes
- Inspect existing components
- Inspect environment files
- Identify current errors
- Identify reusable code
- Identify conflicts

## Deliverable

Create an implementation plan based on the actual repository.

## Acceptance

No major architectural decision is made without inspecting the existing project.

---

# PHASE 1 — Foundation

## Tasks

- Configure React/Next.js environment
- Configure TypeScript
- Configure Tailwind
- Configure shadcn/ui
- Install Lucide
- Install Recharts
- Create app shell
- Sidebar
- Header
- Mobile navigation
- Theme foundation
- Error boundary
- Loading states

## Acceptance

- App starts
- No obvious console errors
- Responsive shell works
- Navigation structure exists

---

# PHASE 2 — Database

## Tasks

Configure:

- PostgreSQL
- Prisma
- Migrations
- Seed system

Create:

- Organization
- Branch
- User
- Role/Permission
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

## Acceptance

- Migration works
- Seed works
- Relations work
- Indexes exist
- Unique identifiers work
- No broken foreign keys

---

# PHASE 3 — Authentication & Authorization

## Tasks

- Login
- Logout
- Session
- Password hashing
- Protected routes
- Unauthorized page
- User status
- Role checks
- Permission checks
- Organization scope
- Branch scope
- Agent ownership scope

## Acceptance

ADMIN:

Full authorized access.

EMPLOYEE:

Only assigned permissions.

AGENT:

Only permitted agent records.

Frontend manipulation cannot bypass server authorization.

---

# PHASE 4 — Dashboard

## Tasks

Create:

- KPI cards
- Income chart
- Service revenue chart
- Work status chart
- Expense chart
- Revenue vs expense
- Quick actions

## Acceptance

Dashboard uses database data.

No production KPI is hardcoded.

---

# PHASE 5 — Customer Management

## Tasks

- Customer CRUD
- Customer ID generation
- Search
- Filters
- Sorting
- Pagination
- Profile
- Work history
- Payment history
- Receipts
- Documents
- Activity timeline

## Acceptance

Create → Search → Open → Edit → History works.

---

# PHASE 6 — Service Management

## Tasks

- Categories
- Services
- Customer pricing
- Agent pricing
- Required documents
- Estimated completion
- Active/inactive

## Acceptance

A service can be created and selected when creating work.

---

# PHASE 7 — Work Management

## Tasks

- Work creation
- Work ID generation
- Customer selection
- Service selection
- Employee assignment
- Agent assignment
- Priority
- Due date
- Amount
- Notes
- Status engine
- Timeline
- Status history

## Acceptance

Complete workflow:

```text
Customer
→ Service
→ Work
→ Assignment
→ Documents
→ Processing
→ Completion
```

---

# PHASE 8 — Document Management

## Tasks

- Required document definitions
- Upload
- Preview
- Download
- Delete
- Verify
- Reject
- File metadata
- Storage abstraction
- File validation

## Acceptance

Documents are not stored as database blobs.

Unauthorized users cannot access private files.

---

# PHASE 9 — Payments

## Tasks

- Payment creation
- Partial payment
- Outstanding calculation
- Payment methods
- Transaction ID
- Payment history
- Refund architecture
- Financial validation
- Transaction-safe processing

## Acceptance

Example:

```text
Work Total = ₹1000
Paid = ₹700
Outstanding = ₹300
```

Attempting ₹400 payment is rejected unless an authorized override exists.

---

# PHASE 10 — Receipts

## Tasks

- Receipt number
- Receipt preview
- A4 print
- Thermal print
- Download
- Share
- Payment linkage

## Acceptance

Every receipt references a real payment.

No duplicate receipt numbers.

---

# PHASE 11 — Income / Expenses / Profit

## Tasks

Income:

- Daily
- Weekly
- Monthly
- Yearly

Expenses:

- CRUD
- Categories
- Filters

Profit:

```text
Income - Expenses = Net Profit
```

## Acceptance

Financial totals match database transactions.

---

# PHASE 12 — Reports

## Tasks

Create:

- Customer report
- Work report
- Service report
- Income report
- Expense report
- Profit report
- Employee performance
- Agent performance

Reusable filters:

- Date
- Branch
- Service
- Employee
- Agent
- Status
- Payment method

## Acceptance

Reports use real data and filters change results correctly.

---

# PHASE 13 — Employee Management

## Tasks

- Employee CRUD
- Role
- Branch
- Status
- Password reset
- Assigned work
- Performance

## Acceptance

Employee access follows permission rules.

---

# PHASE 14 — Agent Management

## Tasks

- Agent CRUD
- Business details
- Commission
- Branch
- Status
- Agent dashboard
- Agent work
- Agent revenue
- Agent commission

## Acceptance

Agent A cannot access Agent B's private records.

---

# PHASE 15 — Notifications

## Tasks

Notifications for:

- New customer
- New work
- Payment received
- Pending payment
- Documents required
- Work completed
- Agent submission
- Expense added

## Acceptance

Notification center works with unread/read state.

---

# PHASE 16 — WhatsApp Adapter

## Tasks

Create provider-independent architecture.

Templates:

- Work Created
- Payment Received
- Work In Progress
- Documents Required
- Work Completed

Features:

- Template management
- Preview
- Send
- History
- Delivery status architecture
- Failure state
- Retry architecture

## Acceptance

Core system works even if no WhatsApp provider is configured.

---

# PHASE 17 — Global Search

## Tasks

Use shadcn Command.

Search:

- Customer
- Mobile
- Customer ID
- Work ID
- Payment ID
- Receipt number
- Service

## Acceptance

Search returns real categorized records and opens the relevant screen.

---

# PHASE 18 — Settings

## Tasks

Business settings:

- Name
- Logo
- Address
- Mobile
- Email
- GSTIN
- Website

Receipt settings:

- Prefix
- Footer
- Terms
- Logo

Service settings.

WhatsApp settings.

User settings.

## Acceptance

Settings persist and affect relevant screens.

---

# PHASE 19 — Multi-Branch

## Tasks

- Branch management
- Branch selector
- Branch-scoped queries
- Branch-scoped reports
- Branch-scoped users
- Admin cross-branch access

## Acceptance

Branch A users cannot see Branch B records without permission.

---

# PHASE 20 — Audit / Security

## Tasks

Audit:

- Customer changes
- Work changes
- Status changes
- Payment changes
- Refunds
- Receipts
- Expenses
- Employee changes
- Agent changes
- Document verification
- WhatsApp actions

Security review:

- Auth
- Authorization
- IDOR protection
- Branch isolation
- Agent isolation
- File access
- Input validation
- Secrets
- Error exposure

## Acceptance

Unauthorized actions fail server-side.

---

# PHASE 21 — Performance

## Tasks

- Pagination
- Debounced search
- Database indexes
- Query optimization
- Lazy loading
- Chart optimization
- Render optimization

## Acceptance

No obvious N+1 queries or large unbounded list fetches.

---

# PHASE 22 — Accessibility

## Tasks

- Keyboard navigation
- Focus states
- Labels
- Dialog accessibility
- ARIA
- Contrast
- Screen-reader support

## Acceptance

Core workflows are keyboard usable.

---

# PHASE 23 — Full QA

## Browser tests

1. Login
2. Logout
3. Admin dashboard
4. Employee dashboard
5. Agent dashboard
6. Customer creation
7. Customer search
8. Service creation
9. Work creation
10. Document upload
11. Document verification
12. Status update
13. Payment
14. Partial payment
15. Overpayment rejection
16. Receipt
17. Expense
18. Reports
19. Notifications
20. Global search
21. Agent isolation
22. Branch isolation
23. Responsive UI

## Technical tests

- TypeScript
- Lint
- Build
- Unit tests
- API tests
- Browser/E2E tests
- Database migration
- Seed

## Acceptance

No obvious runtime/build/console errors remain.

---

# PHASE 24 — Production Readiness

## Tasks

- `.env.example`
- README
- Migration instructions
- Seed instructions
- Deployment instructions
- Security review
- Backup strategy documentation
- Logging documentation
- External integration documentation

## Acceptance

A new developer can understand and run the project from README.

---

# Definition of Done

The entire project is done only when:

- Authentication works
- Authorization works
- Customers work
- Services work
- Work workflow works
- Documents work
- Payments work
- Receipts work
- Income works
- Expenses work
- Profit works
- Reports work
- Employees work
- Agents work
- Notifications work
- WhatsApp adapter works
- Settings work
- Branch architecture works
- Audit logs work
- Responsive UI works
- Accessibility basics work
- Build passes
- Tests pass
- Browser verification passes
- No obvious dead buttons/routes exist

Do not declare completion before this checklist passes.

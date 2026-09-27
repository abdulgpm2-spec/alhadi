# DESIGN.md
# AL-HADI ENTERPRISE — CSC CENTER ERP / CRM UI/UX DESIGN SYSTEM

## 1. Design Direction

Create a premium, professional ERP interface for daily CSC center operations.

The UI must prioritize:

1. Speed
2. Clarity
3. Accuracy
4. Consistency
5. Accessibility
6. Responsive behavior

It should feel like a serious commercial business application, not a generic admin template.

## 2. Visual Language

Use:

- Clean light content background
- Professional dark sidebar
- White cards
- Subtle borders
- Soft shadows
- Rounded corners
- Clear typography
- Compact but readable spacing
- Professional status badges
- Minimal animation

Do not make the interface excessively colorful.

Use color mainly to communicate:

- Status
- Success/error
- Financial movement
- Warnings
- Important actions
- Charts

## 3. Layout

Desktop:

```text
+---------------- Sidebar ----------------+
|                                         |
|  Brand                                  |
|  Dashboard                              |
|  Customers                              |
|  Services                               |
|  Work                                   |
|  Payments                               |
|  ...                                     |
|                                         |
+----------------------+------------------+
                       |
                 Header / Topbar
                       |
                 Page Content
```

Sidebar requirements:

- Fixed or sticky on desktop
- Collapsible
- Active route indicator
- Permission-aware items
- Tooltips when collapsed
- Mobile drawer behavior

## 4. Header

Header should contain:

- Breadcrumb/page title
- Global search
- Notifications
- User menu
- Branch selector when authorized
- Responsive menu button

## 5. Login Screen

Brand:

**AL-HADI ENTERPRISE**

Include:

- Logo placeholder
- Email/mobile
- Password
- Show/hide password
- Remember Me
- Forgot Password
- Login
- Loading state
- Validation state
- Error state

Keep it clean and focused.

## 6. Typography

Use a highly readable modern sans-serif.

Hierarchy:

```text
Page title
Section title
Card title
Body
Secondary text
Caption
```

Avoid excessive font sizes.

Use strong contrast between primary and secondary information.

## 7. Spacing

Use a consistent spacing scale.

Recommended:

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px

Do not randomly mix spacing values.

## 8. Cards

Cards should use:

- White background
- Subtle border
- Small/medium radius
- Soft shadow only when useful
- Clear header
- Consistent internal padding

Avoid excessive nested cards.

## 9. Dashboard

Top KPI cards:

- Total Customers
- Today's Customers
- Pending Work
- Completed Work
- Today's Income
- Monthly Income
- Pending Payments
- Total Expenses
- Net Profit

KPI card anatomy:

```text
Label
Large value
Small trend/context
Optional icon
```

Financial values use Indian Rupee formatting.

Examples:

- ₹1,250
- ₹25,500
- ₹1,25,000

## 10. Charts

Use Recharts.

### Income Overview
Line/Area chart with:

- Today
- 7 Days
- This Month
- Last Month
- This Year

### Service Revenue
Donut/Pie.

### Work Status
Donut.

### Monthly Expenses
Bar.

### Revenue vs Expense
Comparison chart.

Every chart needs:

- Title
- Filter if applicable
- Legend when useful
- Tooltip
- Empty state
- Loading skeleton
- Error state

## 11. Quick Actions

Create prominent but controlled actions:

- New Customer
- New Work
- Add Payment
- New Expense
- Generate Receipt
- Add Service

Every action must open a real workflow.

## 12. Customer List

Use DataTable.

Columns:

- Customer ID
- Name
- Mobile
- Services/Work
- Pending Amount
- Created Date
- Status
- Actions

Features:

- Search
- Filter
- Sort
- Pagination
- Column visibility
- Export
- Row actions

On mobile, convert rows into readable cards.

## 13. Customer Profile

Header:

- Customer name
- Customer ID
- Mobile
- Status
- Primary actions

Tabs:

```text
Overview
Work
Documents
Payments
Receipts
Activity
```

The customer profile should allow staff to understand the customer's entire history without navigating through many unrelated screens.

## 14. Work Details

Header:

- Work ID
- Customer
- Service
- Status
- Priority
- Due date
- Amount

Sections:

1. Work Summary
2. Status Timeline
3. Required Documents
4. Payments
5. Notes
6. Activity

Status should be visually prominent.

## 15. Work Timeline

Display:

```text
NEW
↓
DOCUMENTS REQUIRED
↓
DOCUMENTS RECEIVED
↓
IN PROGRESS
↓
SUBMITTED
↓
UNDER PROCESS
↓
COMPLETED
↓
DELIVERED
```

Show:

- Date/time
- User
- Status
- Note

Use a clear vertical timeline.

## 16. Status Badges

Use consistent semantic states.

Examples:

- New
- Documents Required
- In Progress
- Submitted
- Under Process
- Completed
- Delivered
- On Hold
- Cancelled

Do not rely only on color. Include text/icon semantics.

## 17. Forms

Forms should:

- Use labels above inputs
- Group related fields
- Clearly mark required fields
- Validate inline
- Show helpful error messages
- Preserve input during recoverable errors
- Show loading state
- Prevent duplicate submissions

Long forms should be divided into logical sections.

## 18. Payment Form

Show:

```text
Customer
Work
Total Amount
Already Paid
Outstanding
Payment Amount
Payment Method
Transaction ID
Date
Notes
```

Make outstanding amount highly visible.

If payment exceeds outstanding, show a clear validation error.

## 19. Receipt Design

Receipt must be professional and print-ready.

Include:

- Logo
- AL-HADI ENTERPRISE
- Address
- Contact
- Receipt number
- Date
- Customer
- Work ID
- Service
- Total
- Paid
- Pending
- Payment method
- Transaction ID
- Received by
- Footer/terms

Provide:

- A4 print
- Thermal print
- Download
- Share
- WhatsApp action

## 20. Expense UI

Expense form:

- Date
- Category
- Description
- Amount
- Payment method
- Notes

Expense list:

- ID
- Date
- Category
- Amount
- Added by
- Branch
- Actions

## 21. Reports UI

Reports should have a reusable filter bar:

```text
Date Range | Branch | Service | Employee | Agent | Status | Apply
```

Use:

- Summary cards
- Charts
- Tables
- Export controls

Keep filters consistent across reports.

## 22. Employee Profile

Show:

- Employee details
- Role
- Branch
- Status
- Assigned work
- Completed work
- Pending work
- Collected income
- Performance charts

## 23. Agent Profile

Show:

- Agent details
- Business name
- Branch
- Commission
- Customers
- Work
- Revenue
- Commission
- Pending/completed metrics

Never display another agent's private records.

## 24. Notifications

Notification panel:

- Unread count
- Type
- Message
- Related record
- Time
- Read/unread state

Use meaningful icons.

## 25. Global Search

Use shadcn Command.

Search categories:

- Customers
- Work
- Payments
- Receipts
- Services

Show keyboard hint such as:

`Ctrl/Cmd + K`

where supported.

## 26. Dialogs

Use dialogs for:

- Confirm delete
- Confirm status change where needed
- Add payment
- Quick create
- Document verification
- Reject document

Do not use dialogs for large workflows that need a dedicated page.

## 27. Loading States

Every major page must have skeletons.

Avoid blank screens.

Example:

```text
Header skeleton
KPI skeletons
Table skeleton
Chart skeleton
```

## 28. Empty States

Empty states should explain:

- What is empty
- Why it may be empty
- What the user can do

Example:

“No customers yet. Add your first customer to start tracking CSC work.”

Include a useful action.

## 29. Error States

Show:

- Clear error message
- Retry action
- Context when available

Never expose stack traces.

## 30. Toasts

Use toasts for completed actions:

- Customer created
- Payment received
- Work updated
- Document verified
- Expense added

Do not use toasts as the only place for critical validation errors.

## 31. Mobile Design

Target:

- 390px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

Mobile requirements:

- Drawer sidebar
- Compact header
- Full-width forms
- Card-based tables where appropriate
- Sticky important actions when useful
- No accidental horizontal scrolling

## 32. Accessibility

Implement:

- Keyboard navigation
- Focus states
- Visible focus
- Labels
- Accessible dialogs
- ARIA where necessary
- Good contrast
- Screen-reader-friendly controls
- Non-color status communication

## 33. Interaction Principles

- Use short animations
- Avoid distracting motion
- Disable buttons while submitting
- Prevent accidental double-submit
- Give immediate feedback
- Keep important actions predictable
- Use consistent iconography

## 34. Responsive Data Tables

Desktop:

Full table.

Tablet:

Reduced columns.

Mobile:

Card/list representation with:

- Primary identity
- Key status
- Amount
- Date
- Actions

Do not force users to horizontally scroll giant tables on a phone.

## 35. Design Acceptance Criteria

The design is accepted only when:

- All pages share the same design language
- Sidebar/header are consistent
- Forms are consistent
- Tables are reusable
- Statuses are understandable
- Financial information is clear
- Mobile layouts are usable
- Loading/empty/error states exist
- Keyboard navigation works
- No dead UI controls exist

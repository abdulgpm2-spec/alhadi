# PRD.md
# PRODUCT REQUIREMENTS DOCUMENT
# AL-HADI ENTERPRISE — CSC CENTER ERP / CRM

## 1. Product Overview

AL-HADI ENTERPRISE needs a centralized CSC Center ERP/CRM for managing customer service operations.

The product replaces fragmented manual tracking with a single system for:

- Customer registration
- CSC service management
- Work/application tracking
- Document collection
- Employee/agent assignment
- Payments
- Receipts
- Income
- Expenses
- Profit
- Reports
- Notifications
- WhatsApp communication
- Audit history
- Future branch management

## 2. Product Vision

The system should let staff answer a simple question at any time:

> “What is happening with this customer's work, what documents have been received, how much has been paid, what is pending, who is responsible, and what happened previously?”

## 3. Primary Users

### ADMIN

Responsible for:

- Business configuration
- Users
- Employees
- Agents
- Services
- Financial oversight
- Reports
- Branches
- Permissions
- Audit

### EMPLOYEE

Responsible for day-to-day operations:

- Customers
- Work
- Documents
- Payments
- Receipts
- Notifications
- Assigned operational tasks

### AGENT

Restricted operational user who manages permitted customers/work.

Agent must not access another agent's private records.

## 4. Product Goals

### Goal 1 — Centralize customer information

Every customer should have a single profile containing their:

- Identity/basic information
- Work history
- Documents
- Payments
- Receipts
- Activity

### Goal 2 — Track every work item

Each service request gets a unique Work ID and a complete lifecycle.

### Goal 3 — Improve financial control

The system must accurately track:

```text
Total
Paid
Pending
Income
Expenses
Profit
```

### Goal 4 — Reduce missed follow-ups

Use status, due dates, notifications and activity history.

### Goal 5 — Prepare for scale

Support future multi-branch operations without redesigning the core system.

## 5. Core Workflow

```text
Customer Registration
        ↓
Select Service
        ↓
Create Work
        ↓
Required Documents
        ↓
Documents Received
        ↓
Assign Employee / Agent
        ↓
In Progress
        ↓
Submitted
        ↓
Under Process
        ↓
Completed
        ↓
Customer Notified
        ↓
Delivered
```

Payments and communication can happen at appropriate points in this workflow.

## 6. Customer Requirements

Customer fields:

- Customer ID
- Full Name
- Mobile
- Alternate Mobile
- Email
- Date of Birth
- Gender
- Address
- Area
- City
- State
- Pincode
- Notes
- Branch
- Created By
- Created Date

Requirements:

- Unique Customer ID
- Search by name/mobile/ID
- Edit
- View
- Soft delete where appropriate
- Create work from profile
- Payment history
- Document history
- Activity history

## 7. Service Requirements

Service fields:

- Service ID
- Name
- Category
- Description
- Customer price
- Agent price
- Estimated completion
- Required documents
- Active/inactive

Initial categories:

- PAN
- Aadhaar
- Passport
- Voter ID
- Driving Licence
- Certificates
- Gazette
- Banking
- Insurance
- Ticket Booking
- Other

## 8. Work Requirements

Each work item must contain:

- Work ID
- Customer
- Service
- Agent
- Employee
- Branch
- Created date
- Due date
- Priority
- Total amount
- Paid amount
- Pending amount
- Status
- Notes

Work ID example:

`WORK-2026-00001`

## 9. Work Status Requirements

Primary states:

- NEW
- DOCUMENTS_REQUIRED
- DOCUMENTS_RECEIVED
- IN_PROGRESS
- SUBMITTED
- UNDER_PROCESS
- COMPLETED
- DELIVERED

Additional:

- ON_HOLD
- CANCELLED

Every status change should create a history entry.

## 10. Document Requirements

Documents may include:

- Aadhaar
- PAN
- Photo
- Address Proof
- ID Proof
- Signature
- Other

Document states:

- Required
- Uploaded
- Verified
- Rejected

Features:

- Upload
- Preview
- Download
- Delete
- Verify
- Reject

Private documents require authorization.

## 11. Payment Requirements

Fields:

- Payment ID
- Customer
- Work
- Service
- Amount
- Payment method
- Transaction ID
- Date
- Collected by
- Branch
- Notes
- Status

Methods:

- Cash
- UPI
- Bank Transfer
- Card
- Other

Payment rules:

- Amount must be positive
- Payment cannot exceed outstanding unless authorized
- Financial changes must be audited
- Payment must belong to a valid work/customer context

## 12. Receipt Requirements

Receipt contains:

- Business logo
- Business name
- Address
- Contact
- Receipt number
- Date
- Customer
- Mobile
- Work ID
- Service
- Total
- Paid
- Pending
- Payment method
- Transaction ID
- Received by
- Notes

Output:

- A4
- Thermal

Actions:

- Print
- Download
- Share
- WhatsApp

## 13. Income Requirements

Views:

- Today
- Week
- Month
- Year

Filters:

- Date
- Service
- Employee
- Agent
- Payment method
- Branch

## 14. Expense Requirements

Fields:

- Expense ID
- Date
- Category
- Description
- Amount
- Payment method
- Added by
- Branch
- Notes

Categories:

- Rent
- Electricity
- Internet
- Printing
- Stationery
- Salary
- Travel
- Maintenance
- Software
- Marketing
- Other

## 15. Profit Requirements

Formula:

```text
Net Profit = Total Income - Total Expenses
```

Display:

- Daily
- Monthly
- Yearly

## 16. Dashboard Requirements

KPIs:

- Total Customers
- Today's Customers
- Pending Work
- Completed Work
- Today's Income
- Monthly Income
- Pending Payments
- Total Expenses
- Net Profit

Charts:

- Income Overview
- Service Revenue
- Work Status
- Monthly Expenses
- Revenue vs Expense

Quick actions:

- New Customer
- New Work
- Add Payment
- New Expense
- Generate Receipt
- Add Service

## 17. Employee Requirements

Admin can:

- Create
- Edit
- Activate
- Deactivate
- Reset password
- Assign role
- Assign branch

Employee profile should show:

- Assigned work
- Completed work
- Pending work
- Income collected
- Performance

## 18. Agent Requirements

Admin can:

- Create
- Edit
- Activate
- Deactivate
- Configure commission
- Assign branch

Agent dashboard:

- Customers
- Work
- Pending
- Completed
- Revenue
- Commission

Isolation is mandatory.

## 19. Notification Requirements

Generate notifications for:

- New customer
- New work
- Payment received
- Pending payment
- Documents required
- Work completed
- New agent submission
- Expense added

Notification center needs:

- Unread count
- Read/unread
- Timestamp
- Related record
- Navigation

## 20. WhatsApp Requirements

Create provider-independent communication architecture.

Templates:

### Work Created

Dear {customer_name},

Your {service_name} work has been created successfully.

Work ID: {work_id}

Thank you.

### Payment Received

Dear {customer_name},

Payment of ₹{amount} has been received.

Receipt No: {receipt_number}

Thank you.

### Work In Progress

Dear {customer_name},

Your {service_name} work is currently in progress.

Work ID: {work_id}

### Documents Required

Dear {customer_name},

Additional documents are required for your {service_name} work.

Work ID: {work_id}

### Work Completed

Dear {customer_name},

Your {service_name} work has been completed successfully.

Work ID: {work_id}

Features:

- Template management
- Preview
- Send
- History
- Delivery status architecture
- Failure/retry architecture

## 21. Global Search

Search:

- Customer name
- Mobile
- Customer ID
- Work ID
- Payment ID
- Receipt number
- Service

Use categorized results.

## 22. Settings

### Business

- Name
- Logo
- Address
- Mobile
- Email
- GSTIN
- Website

### Receipt

- Prefix
- Footer
- Terms
- Logo

### Services

- Categories
- Pricing

### WhatsApp

- Templates
- Provider configuration

### User

- Profile
- Password
- Theme

## 23. Reports

Required:

### Customer
- New customers
- Returning customers
- Service-wise
- Branch-wise

### Work
- New
- Pending
- In progress
- Completed
- Cancelled

### Service
- Applications
- Revenue
- Completion rate

### Income
- Daily
- Weekly
- Monthly
- Yearly

### Expense
- Category
- Monthly
- Yearly

### Profit
- Income vs expense

### Employee
- Assigned
- Completed
- Pending
- Collections

### Agent
- Customers
- Submitted
- Completed
- Revenue
- Commission

## 24. Security Requirements

Must include:

- Secure authentication
- Password hashing
- Protected routes
- Server-side authorization
- Permission checks
- Branch isolation
- Agent isolation
- Input validation
- Secure file uploads
- Secret management
- Audit logging
- Safe error handling

## 25. Non-Functional Requirements

### Performance

- Pagination
- Debounced search
- Indexed queries
- Efficient API/database access
- Optimized charts

### Responsive

Support:

- 390px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

### Accessibility

- Keyboard navigation
- Focus states
- Labels
- Accessible dialogs
- Good contrast
- Screen-reader-friendly controls

## 26. MVP Definition

The true operational MVP is:

1. Authentication
2. Customer management
3. Service management
4. Work management
5. Document management
6. Payments
7. Receipts
8. Basic dashboard
9. Basic notifications
10. Basic reports
11. Role-based access
12. Audit logging

The following can be phased after MVP:

- Advanced analytics
- Full WhatsApp provider integration
- Multi-branch administration
- Advanced commission engine
- Government API integrations
- SMS provider
- Advanced export/report builder

However, the architecture must be ready for these from the beginning.

## 27. Success Metrics

Measure:

- Time required to register a customer
- Time required to create work
- Percentage of work with complete document tracking
- Pending work count
- Pending payment count
- Receipt generation time
- Number of missed/overdue work items
- Daily/monthly income visibility
- Employee workload visibility
- Agent workload/revenue visibility

## 28. Edge Cases

The product must handle:

- Duplicate customers
- Same mobile used by multiple customers where business rules allow
- Partial payment
- Attempted overpayment
- Refund
- Cancelled work
- Work put on hold
- Rejected documents
- Missing documents
- Deleted/disabled services used by historical work
- Disabled employees with historical assignments
- Disabled agents with historical work
- Concurrent payments
- Concurrent status updates
- Duplicate receipt generation attempts
- Branch-restricted users
- Unauthorized record IDs
- Failed WhatsApp delivery
- Failed file upload
- Database/API failure during financial operation

## 29. Product Principles

1. Real data over fake UI.
2. Server-side rules over frontend assumptions.
3. Financial accuracy over convenience.
4. Auditability over destructive deletion.
5. Reusable components over duplicated code.
6. Clear workflows over complicated screens.
7. Mobile usability without sacrificing desktop productivity.
8. Build for today's single center while preserving tomorrow's multi-branch architecture.

## 30. Final Product Definition

The finished product is a commercial-grade internal ERP/CRM for AL-HADI ENTERPRISE that allows the business to manage the complete CSC customer journey from registration through service completion, payment, receipt, notification and historical tracking.

A feature is considered complete only when:

- UI exists
- API/business logic exists
- Database integration exists
- Validation exists
- Authorization exists
- Loading/error/empty states exist
- It has been tested in the browser
- No obvious runtime/build errors remain

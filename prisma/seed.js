const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Default permissions per role (must match src/lib/constants.ts)
const PERM = {
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",
  SERVICES_VIEW: "services.view",
  SERVICES_CREATE: "services.create",
  SERVICES_UPDATE: "services.update",
  SERVICES_DELETE: "services.delete",
  SERVICES_CATEGORY_CREATE: "services.category.create",
  SERVICES_CATEGORY_UPDATE: "services.category.update",
  WORK_VIEW: "work.view",
  WORK_CREATE: "work.create",
  WORK_UPDATE: "work.update",
  WORK_STATUS_UPDATE: "work.status_update",
  WORK_DELETE: "work.delete",
  WORK_TRACKING_UPDATE: "work.tracking_update",
  WORK_DATES_UPDATE: "work.dates_update",
  WORK_SERVICE_RECEIPTS_UPLOAD: "work.service_receipts_upload",
  WORK_SERVICE_RECEIPTS_DELETE: "work.service_receipts_delete",
  WORK_CERTIFICATES_UPLOAD: "work.certificates_upload",
  WORK_CERTIFICATES_DELETE: "work.certificates_delete",
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_UPLOAD: "documents.upload",
  DOCUMENTS_VERIFY: "documents.verify",
  DOCUMENTS_REJECT: "documents.reject",
  DOCUMENTS_DELETE: "documents.delete",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_REFUND: "payments.refund",
  RECEIPTS_VIEW: "receipts.view",
  RECEIPTS_CREATE: "receipts.create",
  RECEIPTS_PRINT: "receipts.print",
  INCOME_VIEW: "income.view",
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_UPDATE: "expenses.update",
  EXPENSES_DELETE: "expenses.delete",
  REPORTS_VIEW: "reports.view",
  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_CREATE: "employees.create",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_DEACTIVATE: "employees.deactivate",
  AGENTS_VIEW: "agents.view",
  AGENTS_CREATE: "agents.create",
  AGENTS_UPDATE: "agents.update",
  AGENTS_DEACTIVATE: "agents.deactivate",
  WHATSAPP_VIEW: "whatsapp.view",
  WHATSAPP_SEND: "whatsapp.send",
  WHATSAPP_TEMPLATES: "whatsapp.templates",
  NOTIFICATIONS_VIEW: "notifications.view",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  BRANCHES_VIEW: "branches.view",
  BRANCHES_CREATE: "branches.create",
  BRANCHES_UPDATE: "branches.update",
  AUDIT_VIEW: "audit.view",
};

const ALL_PERMISSIONS = Object.values(PERM);
const ADMIN_PERMISSIONS = ALL_PERMISSIONS;

const EMPLOYEE_PERMISSIONS = [
  PERM.CUSTOMERS_VIEW,
  PERM.CUSTOMERS_CREATE,
  PERM.CUSTOMERS_UPDATE,
  PERM.SERVICES_VIEW,
  PERM.SERVICES_CATEGORY_CREATE,
  PERM.SERVICES_CATEGORY_UPDATE,
  PERM.WORK_VIEW,
  PERM.WORK_CREATE,
  PERM.WORK_UPDATE,
  PERM.WORK_STATUS_UPDATE,
  PERM.WORK_TRACKING_UPDATE,
  PERM.WORK_DATES_UPDATE,
  PERM.WORK_SERVICE_RECEIPTS_UPLOAD,
  PERM.WORK_SERVICE_RECEIPTS_DELETE,
  PERM.WORK_CERTIFICATES_UPLOAD,
  PERM.WORK_CERTIFICATES_DELETE,
  PERM.DOCUMENTS_VIEW,
  PERM.DOCUMENTS_UPLOAD,
  PERM.DOCUMENTS_VERIFY,
  PERM.DOCUMENTS_REJECT,
  PERM.PAYMENTS_VIEW,
  PERM.PAYMENTS_CREATE,
  PERM.RECEIPTS_VIEW,
  PERM.RECEIPTS_CREATE,
  PERM.RECEIPTS_PRINT,
  PERM.WHATSAPP_VIEW,
  PERM.WHATSAPP_SEND,
  PERM.NOTIFICATIONS_VIEW,
];

const AGENT_PERMISSIONS = [
  PERM.CUSTOMERS_VIEW,
  PERM.CUSTOMERS_CREATE,
  PERM.SERVICES_VIEW,
  PERM.WORK_VIEW,
  PERM.WORK_CREATE,
  PERM.WORK_CERTIFICATES_UPLOAD,
  PERM.WORK_CERTIFICATES_DELETE,
  PERM.DOCUMENTS_VIEW,
  PERM.DOCUMENTS_UPLOAD,
  PERM.PAYMENTS_VIEW,
  PERM.RECEIPTS_VIEW,
  PERM.RECEIPTS_PRINT,
  PERM.NOTIFICATIONS_VIEW,
];

function permissionsForRole(role) {
  if (role === "ADMIN") return ADMIN_PERMISSIONS;
  if (role === "AGENT") return AGENT_PERMISSIONS;
  return EMPLOYEE_PERMISSIONS;
}

async function assignPermissions(userId, role) {
  for (const permission of permissionsForRole(role)) {
    await prisma.userPermission.create({ data: { userId, permission } });
  }
}

async function main() {
  console.log("🌱 Starting realistic seed for AL-HADI ENTERPRISE CSC ERP (Master Service Catalog Architecture)...");

  // Clean existing data in dependency order
  await prisma.activityLog.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.whatsAppTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.workDocument.deleteMany();
  await prisma.workStatusHistory.deleteMany();
  await prisma.work.deleteMany();
  await prisma.serviceRequiredDocument.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.businessSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: "AL-HADI ENTERPRISE",
      code: "ALHADI",
      address: "Shop No. 4 & 5, Al-Hadi Commercial Complex, Station Road, Center City",
      mobile: "+91 9823456789",
      email: "contact@alhadienterprise.com",
      gstin: "27AAAAA0000A1Z5",
      website: "https://alhadienterprise.com",
    },
  });

  // Business Settings
  await prisma.businessSetting.create({
    data: {
      organizationId: org.id,
      businessName: "AL-HADI ENTERPRISE",
      tagline: "CSC & Citizen Service Center ERP / CRM",
      address: "Shop No. 4 & 5, Al-Hadi Commercial Complex, Station Road, Center City",
      mobile: "+91 9823456789",
      email: "contact@alhadienterprise.com",
      gstin: "27AAAAA0000A1Z5",
      website: "https://alhadienterprise.com",
      receiptPrefix: "REC",
      receiptTerms: "1. Payments are non-refundable once application is submitted to Govt portal.\n2. Preserve this receipt for physical document collection.\n3. Turnaround times are subject to Govt server uptime.",
      receiptFooter: "Thank you for choosing AL-HADI ENTERPRISE. For support, call +91 9823456789.",
    },
  });

  // 2. Branches
  const mainBranch = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: "Main Branch - Station Road",
      code: "BRANCH-01",
      address: "Shop No. 4 & 5, Station Road, Center City",
      mobile: "+91 9823456789",
      email: "main@alhadienterprise.com",
      isMain: true,
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: "City Market Branch",
      code: "BRANCH-02",
      address: "Old Market Chowk, Near Post Office",
      mobile: "+91 9823456790",
      email: "market@alhadienterprise.com",
      isMain: false,
      isActive: true,
    },
  });

  // 3. Passwords & Users
  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  const employeePassword = await bcrypt.hash("Employee@123456", 10);
  const agentPassword = await bcrypt.hash("Agent@123456", 10);

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      name: "Abdul Majid (Admin)",
      email: "admin@alhadi.local",
      mobile: "9823456789",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  await assignPermissions(admin.id, "ADMIN");

  const employee = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      name: "Tariq Siddiqui (Operator)",
      email: "employee@alhadi.local",
      mobile: "9823456791",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
      isActive: true,
    },
  });
  await assignPermissions(employee.id, "EMPLOYEE");

  const employee2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branch2.id,
      name: "Sameer Deshmukh (Staff)",
      email: "sameer@alhadi.local",
      mobile: "9823456792",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
      isActive: true,
    },
  });
  await assignPermissions(employee2.id, "EMPLOYEE");

  const agent = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      name: "Irfan Merchant",
      email: "agent@alhadi.local",
      mobile: "9823456793",
      passwordHash: agentPassword,
      role: "AGENT",
      businessName: "Al-Barakah Digital Point",
      commissionRate: 15.0,
      isActive: true,
    },
  });
  await assignPermissions(agent.id, "AGENT");

  const agent2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      name: "Ramesh Sharma",
      email: "ramesh.agent@alhadi.local",
      mobile: "9823456794",
      passwordHash: agentPassword,
      role: "AGENT",
      businessName: "Sharma Online Center",
      commissionRate: 12.5,
      isActive: true,
    },
  });
  await assignPermissions(agent2.id, "AGENT");

  // 4. Service Categories
  const categoryData = [
    { name: "PAN Card", description: "UTIITSL and NSDL PAN applications, corrections & reprints", order: 1 },
    { name: "Aadhaar Card", description: "UIDAI updates, address changes, PVC prints", order: 2 },
    { name: "Passport", description: "Fresh passport, renewal, tatkal applications & PCC", order: 3 },
    { name: "Driving Licence", description: "Sarathi learning, permanent license, renewal, endorsements", order: 4 },
    { name: "Certificates", description: "Income, caste, domicile, non-creamy layer, birth/death", order: 5 },
    { name: "Gazette", description: "Government gazette name change, religion change notifications", order: 6 },
    { name: "Voter ID", description: "NVSP voter registration, correction, migration", order: 7 },
    { name: "Insurance", description: "Vehicle insurance, health, life insurance policy issuances", order: 8 },
    { name: "Banking", description: "AEPS, money transfer, micro-ATM, account opening", order: 9 },
    { name: "Ticket Booking", description: "IRCTC train tickets, flight bookings, bus passes", order: 10 },
    { name: "Other Services", description: "EPFO, scholarship, ration card, utility bill payments", order: 11 },
  ];

  const categoryMap = {};
  for (const cat of categoryData) {
    const created = await prisma.serviceCategory.create({ data: cat });
    categoryMap[cat.name] = created.id;
  }

  // 5. Authoritative Master Services with Options & Pricing Rules
  const masterServicesConfig = [
    // --- PAN Card Category ---
    {
      category: "PAN Card",
      serviceId: "PAN-NEW",
      name: "PAN New",
      subCategory: "Fresh Application",
      description: "New PAN Card Form 49A allotment for Indian citizens",
      customerPrice: 250,
      agentPrice: 200,
      estimatedDays: 7,
      displayOrder: 1,
      options: [],
      docs: ["Aadhaar Card", "Passport Size Photo", "Applicant Signature"],
    },
    {
      category: "PAN Card",
      serviceId: "PAN-CORRECTION",
      name: "PAN Correction",
      subCategory: "Corrections & Changes",
      description: "Changes / Correction in existing PAN details (Name, Father Name, DOB, Photo, Mobile, Email)",
      customerPrice: 250,
      agentPrice: 200,
      estimatedDays: 7,
      displayOrder: 2,
      options: [
        { name: "Name", code: "NAME", priceModifier: 0, isDefault: true },
        { name: "Father Name", code: "FATHER_NAME", priceModifier: 50, isDefault: false }, // Father Name special fee rule!
        { name: "DOB", code: "DOB", priceModifier: 0, isDefault: false },
        { name: "Mobile", code: "MOBILE", priceModifier: 0, isDefault: false },
        { name: "Email", code: "EMAIL", priceModifier: 0, isDefault: false },
      ],
      docs: ["Aadhaar Card", "Old PAN Card Copy", "Proof of Correction", "Passport Size Photo", "Applicant Signature"],
    },
    {
      category: "PAN Card",
      serviceId: "PAN-REPRINT",
      name: "PAN Reprint",
      subCategory: "Card Reprint",
      description: "Reprint of lost, damaged, or faded PAN Card without changes",
      customerPrice: 150,
      agentPrice: 120,
      estimatedDays: 3,
      displayOrder: 3,
      options: [],
      docs: ["Aadhaar Card", "Old PAN Number / Copy"],
    },
    {
      category: "PAN Card",
      serviceId: "PAN-E-INSTANT",
      name: "Instant e-PAN",
      subCategory: "Digital Instant",
      description: "Paperless instant digital e-PAN allotment via Aadhaar OTP",
      customerPrice: 150,
      agentPrice: 100,
      estimatedDays: 1,
      displayOrder: 4,
      options: [],
      docs: ["Aadhaar Card", "Aadhaar Linked Mobile OTP"],
    },

    // --- Passport Category ---
    {
      category: "Passport",
      serviceId: "PASS-FRESH",
      name: "Fresh Passport (Normal)",
      subCategory: "New Passport",
      description: "Standard 36-page normal fresh Indian passport booklet",
      customerPrice: 2000,
      agentPrice: 1800,
      estimatedDays: 15,
      displayOrder: 1,
      options: [],
      docs: ["Aadhaar Card", "PAN Card", "10th Passing Certificate / Birth Proof", "Bank Passbook"],
    },
    {
      category: "Passport",
      serviceId: "PASS-TATKAAL",
      name: "Fresh Passport (Tatkaal)",
      subCategory: "Urgent Express",
      description: "Fast-track urgent passport application and appointment slot",
      customerPrice: 4000,
      agentPrice: 3600,
      estimatedDays: 5,
      displayOrder: 2,
      options: [],
      docs: ["Aadhaar Card", "PAN Card", "10th Certificate", "Bank Passbook", "Annexure E / Verification Certificate"],
    },
    {
      category: "Passport",
      serviceId: "PASS-RENEW",
      name: "Passport Renewal / Re-issue",
      subCategory: "Renewal",
      description: "Renewal of expired passport or re-issue due to pages exhausted",
      customerPrice: 2000,
      agentPrice: 1800,
      estimatedDays: 15,
      displayOrder: 3,
      options: [
        { name: "Address Change", code: "ADDR_CHANGE", priceModifier: 0 },
        { name: "Spouse Name Addition", code: "SPOUSE_ADD", priceModifier: 0 },
      ],
      docs: ["Old Original Passport", "Aadhaar Card", "Address Proof"],
    },
    {
      category: "Passport",
      serviceId: "PASS-LOST",
      name: "Lost / Damaged Passport Re-issue",
      subCategory: "Lost / Damaged",
      description: "Re-issue of lost or damaged passport booklet with police report annexures",
      customerPrice: 3500,
      agentPrice: 3100,
      estimatedDays: 20,
      displayOrder: 4,
      options: [],
      docs: ["Police FIR Copy", "Lost Passport Photocopy", "Aadhaar Card", "Annexure F"],
    },
    {
      category: "Passport",
      serviceId: "PASS-PCC",
      name: "Police Clearance Certificate (PCC)",
      subCategory: "Clearance",
      description: "Police Clearance Certificate for overseas employment, immigration, or visa",
      customerPrice: 800,
      agentPrice: 700,
      estimatedDays: 7,
      displayOrder: 5,
      options: [],
      docs: ["Original Passport", "Aadhaar Card", "Employment / Visa Offer Letter"],
    },

    // --- Driving Licence Category ---
    {
      category: "Driving Licence",
      serviceId: "DL-LEARN",
      name: "Learner's Licence (LL)",
      subCategory: "Learner License",
      description: "Parivahan Sarathi online learner's licence application & test slot",
      customerPrice: 500,
      agentPrice: 450,
      estimatedDays: 3,
      displayOrder: 1,
      options: [],
      docs: ["Aadhaar Card", "10th Marksheet / Age Proof", "Passport Size Photo", "Signature"],
    },
    {
      category: "Driving Licence",
      serviceId: "DL-PERM",
      name: "Permanent Driving Licence (DL)",
      subCategory: "Permanent License",
      description: "Permanent driving licence application and RTO track test slot booking",
      customerPrice: 1200,
      agentPrice: 1050,
      estimatedDays: 10,
      displayOrder: 2,
      options: [],
      docs: ["Valid Learner's Licence", "Aadhaar Card", "Form 5 Driving School Certificate (if applicable)"],
    },
    {
      category: "Driving Licence",
      serviceId: "DL-RENEW",
      name: "DL Renewal",
      subCategory: "Renewal",
      description: "Renewal of expired driving licence with medical fitness certificate",
      customerPrice: 650,
      agentPrice: 550,
      estimatedDays: 5,
      displayOrder: 3,
      options: [
        { name: "Address Change", code: "DL_ADDR", priceModifier: 100 },
        { name: "Medical Certificate Form 1A", code: "DL_MED", priceModifier: 150 },
      ],
      docs: ["Original Driving Licence", "Aadhaar Card", "Form 1A Medical Certificate"],
    },
    {
      category: "Driving Licence",
      serviceId: "DL-DUP",
      name: "Duplicate Driving Licence",
      subCategory: "Duplicate",
      description: "Re-issue of lost, stolen, or damaged driving licence smart card",
      customerPrice: 450,
      agentPrice: 380,
      estimatedDays: 5,
      displayOrder: 4,
      options: [],
      docs: ["Police Complaint / LDR", "Aadhaar Card", "Old DL Number / Copy"],
    },

    // --- Certificates Category ---
    {
      category: "Certificates",
      serviceId: "CERT-INCOME",
      name: "Income Certificate",
      subCategory: "Revenue",
      description: "Tehsildar 1-year / 3-year official Income Certificate for scholarship/ration",
      customerPrice: 350,
      agentPrice: 300,
      estimatedDays: 5,
      displayOrder: 1,
      options: [],
      docs: ["Ration Card Copy", "Salary Slip / Income Affidavit", "Electricity Bill", "Aadhaar Card"],
    },
    {
      category: "Certificates",
      serviceId: "CERT-CASTE",
      name: "Caste Certificate",
      subCategory: "Social Welfare",
      description: "Sub-Divisional Officer (SDO) caste certificate issuance",
      customerPrice: 400,
      agentPrice: 350,
      estimatedDays: 7,
      displayOrder: 2,
      options: [],
      docs: ["School Leaving Certificate", "Father's Caste Proof / TC", "Aadhaar Card", "Ration Card"],
    },
    {
      category: "Certificates",
      serviceId: "CERT-DOMICILE",
      name: "Domicile & Nationality Certificate",
      subCategory: "Residence",
      description: "State residence and nationality certificate from Revenue Department",
      customerPrice: 350,
      agentPrice: 300,
      estimatedDays: 5,
      displayOrder: 3,
      options: [],
      docs: ["Continuous Residence Proof (10+ Years)", "Aadhaar Card", "School Leaving Certificate", "Light Bill"],
    },
    {
      category: "Certificates",
      serviceId: "CERT-NCL",
      name: "Non-Creamy Layer Certificate (NCL)",
      subCategory: "OBC / VJNT",
      description: "Non-Creamy Layer Certificate for OBC / VJNT / SBC category reservation",
      customerPrice: 450,
      agentPrice: 400,
      estimatedDays: 7,
      displayOrder: 4,
      options: [],
      docs: ["3 Years Income Proof / IT Returns", "Caste Certificate", "Aadhaar Card", "Ration Card"],
    },
    {
      category: "Certificates",
      serviceId: "CERT-BIRTH-DEATH",
      name: "Birth / Death Certificate Search & Extract",
      subCategory: "Civil Registration",
      description: "Municipal Corporation / Gram Panchayat birth or death record extract",
      customerPrice: 250,
      agentPrice: 200,
      estimatedDays: 3,
      displayOrder: 5,
      options: [],
      docs: ["Hospital Discharge Card", "Applicant Aadhaar Card", "Date & Place of Event Details"],
    },

    // --- Gazette Category ---
    {
      category: "Gazette",
      serviceId: "CERT-GAZETTE",
      name: "Gazette Name Change",
      subCategory: "Official Gazette",
      description: "State Government Official Gazette publication for complete name change",
      customerPrice: 1500,
      agentPrice: 1300,
      estimatedDays: 15,
      displayOrder: 1,
      options: [
        { name: "Religion Change", code: "RELIGION", priceModifier: 200 },
        { name: "Express Courier Delivery", code: "EXPRESS_COURIER", priceModifier: 100 },
      ],
      docs: ["Notarized Name Change Affidavit", "Newspaper Advertisement Copy", "Aadhaar Card", "Passport Photo"],
    },

    // --- Aadhaar Card Category ---
    {
      category: "Aadhaar Card",
      serviceId: "UID-ADDR",
      name: "Aadhaar Address Update",
      subCategory: "Demographic Update",
      description: "UIDAI online demographic address update with valid proof document",
      customerPrice: 100,
      agentPrice: 80,
      estimatedDays: 3,
      displayOrder: 1,
      options: [],
      docs: ["Aadhaar Card", "Valid Address Proof (Light bill, Rent agreement, etc.)", "Mobile OTP"],
    },
    {
      category: "Aadhaar Card",
      serviceId: "UID-PVC",
      name: "Aadhaar PVC Card Print",
      subCategory: "PVC Plastic Card",
      description: "Official speed-post delivered durable PVC plastic Aadhaar card",
      customerPrice: 80,
      agentPrice: 60,
      estimatedDays: 7,
      displayOrder: 2,
      options: [],
      docs: ["Aadhaar Number / Virtual ID", "Registered Mobile OTP"],
    },
    {
      category: "Aadhaar Card",
      serviceId: "UID-MOB",
      name: "Aadhaar Mobile Link / Update Token",
      subCategory: "Biometric & Mobile",
      description: "Aadhaar Seva Kendra appointment token booking for mobile/biometric update",
      customerPrice: 75,
      agentPrice: 50,
      estimatedDays: 1,
      displayOrder: 3,
      options: [],
      docs: ["Aadhaar Card", "New Mobile Number"],
    },

    // --- Voter ID Category ---
    {
      category: "Voter ID",
      serviceId: "VOTER-NEW",
      name: "New Voter ID (Form 6)",
      subCategory: "New Registration",
      description: "First-time voter registration (Form 6) with Election Commission of India",
      customerPrice: 100,
      agentPrice: 80,
      estimatedDays: 7,
      displayOrder: 1,
      options: [],
      docs: ["Passport Size Photo", "Age Proof (Aadhaar / 10th Certificate)", "Address Proof (Ration Card / Light Bill)"],
    },
    {
      category: "Voter ID",
      serviceId: "VOTER-CORR",
      name: "Voter ID Correction (Form 8)",
      subCategory: "Correction & Shifting",
      description: "Changes in Name, Photo, Age, Relative Name or address shifting",
      customerPrice: 100,
      agentPrice: 80,
      estimatedDays: 7,
      displayOrder: 2,
      options: [],
      docs: ["Existing Voter ID / EPIC", "Proof of Correction", "Aadhaar Card"],
    },

    // --- Insurance Category ---
    {
      category: "Insurance",
      serviceId: "INS-2W",
      name: "Two-Wheeler Comprehensive Insurance",
      subCategory: "Motor Insurance",
      description: "Instant digital policy renewal for motorcycle / scooter",
      customerPrice: 1450,
      agentPrice: 1300,
      estimatedDays: 1,
      displayOrder: 1,
      options: [],
      docs: ["Vehicle RC Book Copy", "Previous Year Insurance Policy", "Owner Aadhaar / PAN"],
    },
    {
      category: "Insurance",
      serviceId: "INS-4W",
      name: "Four-Wheeler Comprehensive Insurance",
      subCategory: "Motor Insurance",
      description: "Private car comprehensive and third-party policy issuance",
      customerPrice: 4800,
      agentPrice: 4400,
      estimatedDays: 1,
      displayOrder: 2,
      options: [],
      docs: ["Vehicle RC Book Copy", "Previous Year Policy", "Owner ID Proof"],
    },
    {
      category: "Insurance",
      serviceId: "INS-HEALTH",
      name: "Health Insurance Policy",
      subCategory: "Health Insurance",
      description: "Individual and family health cover policy issuance & renewal",
      customerPrice: 6500,
      agentPrice: 6000,
      estimatedDays: 1,
      displayOrder: 3,
      options: [],
      docs: ["Proposer & Insured Members Aadhaar", "PAN Card", "Medical History Self-Declaration"],
    },

    // --- Banking Category ---
    {
      category: "Banking",
      serviceId: "BANK-AEPS",
      name: "AEPS Cash Withdrawal",
      subCategory: "Aadhaar Banking",
      description: "Biometric Aadhaar Enabled Payment System cash withdrawal & balance enquiry",
      customerPrice: 20,
      agentPrice: 10,
      estimatedDays: 1,
      displayOrder: 1,
      options: [],
      docs: ["Bank Name", "Aadhaar Number", "Biometric Fingerprint"],
    },
    {
      category: "Banking",
      serviceId: "BANK-DMT",
      name: "Domestic Money Transfer (DMT)",
      subCategory: "Money Remittance",
      description: "Instant IMPS money transfer to any bank account across India",
      customerPrice: 50,
      agentPrice: 30,
      estimatedDays: 1,
      displayOrder: 2,
      options: [],
      docs: ["Sender Mobile Number", "Beneficiary Account Number & IFSC"],
    },
    {
      category: "Banking",
      serviceId: "BANK-ACCT",
      name: "Savings Account Opening",
      subCategory: "Account Opening",
      description: "Instant digital savings account opening with debit card & passbook",
      customerPrice: 150,
      agentPrice: 120,
      estimatedDays: 2,
      displayOrder: 3,
      options: [],
      docs: ["Aadhaar Card", "PAN Card", "Mobile OTP", "Passport Photo"],
    },

    // --- Ticket Booking Category ---
    {
      category: "Ticket Booking",
      serviceId: "TKT-TRAIN",
      name: "IRCTC Train Ticket Booking",
      subCategory: "Train Reservation",
      description: "Confirmed train reservation tickets (Tatkal / Premium / General)",
      customerPrice: 80,
      agentPrice: 50,
      estimatedDays: 1,
      displayOrder: 1,
      options: [],
      docs: ["Passenger Name, Age, Gender List", "Preferred Dates & Train"],
    },
    {
      category: "Ticket Booking",
      serviceId: "TKT-FLIGHT",
      name: "Flight Ticket Booking",
      subCategory: "Air Reservation",
      description: "Domestic and international airline flight tickets with web check-in",
      customerPrice: 250,
      agentPrice: 200,
      estimatedDays: 1,
      displayOrder: 2,
      options: [],
      docs: ["Passenger Government Photo ID / Passport", "Travel Dates"],
    },
    {
      category: "Ticket Booking",
      serviceId: "TKT-BUS",
      name: "Bus Ticket Booking",
      subCategory: "Bus Reservation",
      description: "Inter-state sleeper & Volvo AC bus reservation",
      customerPrice: 50,
      agentPrice: 30,
      estimatedDays: 1,
      displayOrder: 3,
      options: [],
      docs: ["Passenger Details", "Boarding & Dropping Points"],
    },

    // --- Other Services Category ---
    {
      category: "Other Services",
      serviceId: "OTH-EPFO",
      name: "EPFO PF Withdrawal Claim",
      subCategory: "Provident Fund",
      description: "UAN member portal online PF advance / full withdrawal filing",
      customerPrice: 500,
      agentPrice: 400,
      estimatedDays: 7,
      displayOrder: 1,
      options: [],
      docs: ["UAN Number & Password", "Cancelled Cheque / Bank Passbook", "Aadhaar Linked Mobile OTP"],
    },
    {
      category: "Other Services",
      serviceId: "OTH-NSP",
      name: "National Scholarship (NSP)",
      subCategory: "Education Scholarship",
      description: "Post-matric and minority scholarship online application filing",
      customerPrice: 300,
      agentPrice: 220,
      estimatedDays: 5,
      displayOrder: 2,
      options: [],
      docs: ["Income Certificate", "Caste Certificate", "Previous Year Marksheet", "Fee Receipt", "Bank Passbook"],
    },
  ];

  const serviceMap = {};

  for (const srvData of masterServicesConfig) {
    const service = await prisma.service.create({
      data: {
        organizationId: org.id,
        categoryId: categoryMap[srvData.category] || null,
        name: srvData.name,
        description: srvData.description,
        customerPrice: srvData.customerPrice,
        agentPrice: srvData.agentPrice || 0,
        estimatedDays: srvData.estimatedDays,
        isActive: true,
      },
    });

    serviceMap[srvData.serviceId] = service;
    serviceMap[srvData.name] = service;

    // Create Required Documents
    for (const docName of srvData.docs || []) {
      await prisma.serviceRequiredDocument.create({
        data: {
          serviceId: service.id,
          name: docName,
          isRequired: true,
        },
      });
    }
  }

  // 6. Expense Categories & Expenses
  const expCats = [
    "Shop Rent",
    "Electricity Bill",
    "High-Speed Internet",
    "Printing & Paper",
    "Staff Salary",
    "Printer Maintenance & Toners",
    "Software & Subscriptions",
    "Tea & Refreshments",
    "Marketing & Banners",
    "Miscellaneous",
  ];

  const expCatMap = {};
  for (const name of expCats) {
    const cat = await prisma.expenseCategory.create({ data: { name } });
    expCatMap[name] = cat.id;
  }

  const expensesData = [
    { cat: "Shop Rent", amount: 18000, desc: "Monthly shop rent for Station Road branch", method: "BANK_TRANSFER", daysAgo: 25 },
    { cat: "Electricity Bill", amount: 3450, desc: "MSEDCL commercial electricity bill", method: "UPI", daysAgo: 20 },
    { cat: "High-Speed Internet", amount: 1299, desc: "Airtel Xstream Fiber monthly bill", method: "UPI", daysAgo: 18 },
    { cat: "Printing & Paper", amount: 4800, desc: "10 Bundles of JK Copier 75 GSM A4 paper + Photo Glossy Sheets", method: "CASH", daysAgo: 15 },
    { cat: "Printer Maintenance & Toners", amount: 2600, desc: "Canon & HP LaserJet toner refills and roller servicing", method: "UPI", daysAgo: 12 },
    { cat: "Tea & Refreshments", amount: 1450, desc: "Staff daily tea and customer water dispenser jar refill", method: "CASH", daysAgo: 10 },
    { cat: "Software & Subscriptions", amount: 1999, desc: "Digital Signature Tokens and Morpho RD Service renew", method: "CARD", daysAgo: 8 },
    { cat: "Marketing & Banners", amount: 2200, desc: "CSC board printing and festival flex banner", method: "CASH", daysAgo: 6 },
    { cat: "Printing & Paper", amount: 1200, desc: "Thermal receipt rolls (pack of 20) and PVC blank cards", method: "UPI", daysAgo: 4 },
    { cat: "Staff Salary", amount: 15000, desc: "Operator Monthly Advance Payment", method: "BANK_TRANSFER", daysAgo: 3 },
    { cat: "Miscellaneous", amount: 650, desc: "Sanitizer, cleaning liquids and dusters for center", method: "CASH", daysAgo: 2 },
    { cat: "Electricity Bill", amount: 1850, desc: "City Market Branch electricity meter payment", method: "UPI", daysAgo: 1 },
  ];

  let expIndex = 1;
  for (const exp of expensesData) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - exp.daysAgo);

    await prisma.expense.create({
      data: {
        expenseId: `EXP-2026-${expIndex.toString().padStart(5, "0")}`,
        categoryId: expCatMap[exp.cat],
        branchId: mainBranch.id,
        addedByUserId: admin.id,
        amount: exp.amount,
        paymentMethod: exp.method,
        description: exp.desc,
        expenseDate: expDate,
      },
    });
    expIndex++;
  }

  // 7. Customers (22 realistic Indian citizen profiles)
  const customersData = [
    { name: "Mohammad Farhan Shaikh", mobile: "9820112233", email: "farhan.shaikh@gmail.com", gender: "Male", area: "Gulshan Colony", city: "Center City", pincode: "400001", agentId: null },
    { name: "Rahul Jagdish Sharma", mobile: "9820223344", email: "rahul.sharma88@yahoo.com", gender: "Male", area: "Shivaji Nagar", city: "Center City", pincode: "400002", agentId: null },
    { name: "Fatima Bano Siddiqui", mobile: "9820334455", email: "fatima.bano@outlook.com", gender: "Female", area: "Madina Chowk", city: "Center City", pincode: "400001", agentId: agent.id },
    { name: "Vikram Suresh Patel", mobile: "9820445566", email: "vikram.patel@gmail.com", gender: "Male", area: "Navpada", city: "Center City", pincode: "400003", agentId: null },
    { name: "Ayesha Parveen Khan", mobile: "9820556677", email: "ayesha.khan94@gmail.com", gender: "Female", area: "Rehmat Nagar", city: "Center City", pincode: "400001", agentId: agent.id },
    { name: "Amit Ravindra Kumar", mobile: "9820667788", email: "amit.kumar@rediffmail.com", gender: "Male", area: "Station Road", city: "Center City", pincode: "400001", agentId: null },
    { name: "Shabana Begum Ansari", mobile: "9820778899", email: "shabana.ansari@gmail.com", gender: "Female", area: "Mominpura", city: "Center City", pincode: "400004", agentId: agent.id },
    { name: "Deepak Santosh Verma", mobile: "9820889900", email: "deepak.verma@gmail.com", gender: "Male", area: "Gandhi Ward", city: "Center City", pincode: "400002", agentId: agent2.id },
    { name: "Zoya Arshad Akhtar", mobile: "9820990011", email: "zoya.akhtar@gmail.com", gender: "Female", area: "Noor Baug", city: "Center City", pincode: "400001", agentId: null },
    { name: "Sanjay Baliram Singh", mobile: "9820001122", email: "sanjay.singh99@gmail.com", gender: "Male", area: "Ram Nagar", city: "Center City", pincode: "400005", agentId: agent2.id },
    { name: "Naseem Ahmed Qureshi", mobile: "9821112233", email: "naseem.qureshi@gmail.com", gender: "Male", area: "Qureshi Mohalla", city: "Center City", pincode: "400001", agentId: null },
    { name: "Priya Vinod Joshi", mobile: "9821223344", email: "priya.joshi92@gmail.com", gender: "Female", area: "Tilak Road", city: "Center City", pincode: "400003", agentId: null },
    { name: "Imran Rafiq Shaikh", mobile: "9821334455", email: "imran.shaikh@gmail.com", gender: "Male", area: "Millat Nagar", city: "Center City", pincode: "400004", agentId: agent.id },
    { name: "Anjali Prakash Mehta", mobile: "9821445566", email: "anjali.mehta@yahoo.com", gender: "Female", area: "Subhash Ward", city: "Center City", pincode: "400002", agentId: null },
    { name: "Bilal Zubair Siddiqui", mobile: "9821556677", email: "bilal.siddiqui@gmail.com", gender: "Male", area: "Bilal Nagar", city: "Center City", pincode: "400001", agentId: null },
    { name: "Pooja Ramesh Yadav", mobile: "9821667788", email: "pooja.yadav@gmail.com", gender: "Female", area: "Yadav Nagar", city: "Center City", pincode: "400005", agentId: agent2.id },
    { name: "Tariq Jameel Ali", mobile: "9821778899", email: "tariq.ali@gmail.com", gender: "Male", area: "Station Road", city: "Center City", pincode: "400001", agentId: null },
    { name: "Suresh Narayanan Nair", mobile: "9821889900", email: "suresh.nair@gmail.com", gender: "Male", area: "Shanti Park", city: "Center City", pincode: "400003", agentId: null },
    { name: "Mehreen Danish Sheikh", mobile: "9821990011", email: "mehreen.sheikh@gmail.com", gender: "Female", area: "Azad Colony", city: "Center City", pincode: "400001", agentId: agent.id },
    { name: "Arvind Mohan Gupta", mobile: "9822001122", email: "arvind.gupta@gmail.com", gender: "Male", area: "Market Yard", city: "Center City", pincode: "400002", agentId: null },
    { name: "Khadija Aslam Sayed", mobile: "9822112233", email: "khadija.sayed@gmail.com", gender: "Female", area: "Sayed Wada", city: "Center City", pincode: "400001", agentId: agent.id },
    { name: "Manoj Harish Sharma", mobile: "9822223344", email: "manoj.sharma@gmail.com", gender: "Male", area: "Ganesh Nagar", city: "Center City", pincode: "400005", agentId: null },
  ];

  const createdCustomers = [];
  let custIndex = 1;
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        customerId: `CUS-2026-${custIndex.toString().padStart(5, "0")}`,
        organizationId: org.id,
        branchId: mainBranch.id,
        createdById: admin.id,
        agentId: c.agentId,
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        gender: c.gender,
        area: c.area,
        city: c.city,
        state: "Maharashtra",
        pincode: c.pincode,
        address: `${c.area}, Near Landmark, ${c.city}`,
        notes: "Verified walk-in / referred customer",
      },
    });
    createdCustomers.push(cust);
    custIndex++;
  }

  // 8. Work Orders, Checklists, Status Histories, Payments & Receipts mapped to Authoritative Master Services
  const workPresets = [
    { srvCode: "PAN-NEW", options: [], status: "DELIVERED", priority: "HIGH", daysAgo: 28, paidFull: true, isAgent: false },
    { srvCode: "PASS-FRESH", options: [], status: "DELIVERED", priority: "URGENT", daysAgo: 25, paidFull: true, isAgent: false },
    { srvCode: "DL-LEARN", options: [], status: "COMPLETED", priority: "MEDIUM", daysAgo: 20, paidFull: true, isAgent: false },
    { srvCode: "CERT-INCOME", options: [], status: "COMPLETED", priority: "HIGH", daysAgo: 18, paidFull: true, isAgent: true },
    { srvCode: "CERT-CASTE", options: [], status: "UNDER_PROCESS", priority: "MEDIUM", daysAgo: 15, paidFull: false, paidRatio: 0.5, isAgent: false },
    { srvCode: "PAN-CORRECTION", options: ["Name", "Father Name"], status: "SUBMITTED", priority: "LOW", daysAgo: 14, paidFull: true, isAgent: false }, // Father Name option (+50)
    { srvCode: "UID-ADDR", options: [], status: "IN_PROGRESS", priority: "MEDIUM", daysAgo: 12, paidFull: true, isAgent: true },
    { srvCode: "CERT-GAZETTE", options: ["Religion Change"], status: "IN_PROGRESS", priority: "HIGH", daysAgo: 10, paidFull: false, paidRatio: 0.5, isAgent: false },
    { srvCode: "PASS-RENEW", options: ["Address Change"], status: "DOCUMENTS_RECEIVED", priority: "URGENT", daysAgo: 8, paidFull: false, paidRatio: 0.4, isAgent: false },
    { srvCode: "VOTER-NEW", options: [], status: "DOCUMENTS_REQUIRED", priority: "MEDIUM", daysAgo: 7, paidFull: false, paidRatio: 0, isAgent: true },
    { srvCode: "PAN-NEW", options: [], status: "NEW", priority: "MEDIUM", daysAgo: 5, paidFull: false, paidRatio: 0, isAgent: false },
    { srvCode: "INS-2W", options: [], status: "COMPLETED", priority: "HIGH", daysAgo: 4, paidFull: true, isAgent: false },
    { srvCode: "UID-PVC", options: [], status: "SUBMITTED", priority: "LOW", daysAgo: 4, paidFull: true, isAgent: false },
    { srvCode: "PASS-FRESH", options: [], status: "UNDER_PROCESS", priority: "URGENT", daysAgo: 3, paidFull: true, isAgent: true },
    { srvCode: "DL-LEARN", options: [], status: "IN_PROGRESS", priority: "MEDIUM", daysAgo: 3, paidFull: false, paidRatio: 0.5, isAgent: false },
    { srvCode: "CERT-INCOME", options: [], status: "NEW", priority: "LOW", daysAgo: 2, paidFull: false, paidRatio: 0, isAgent: false },
    { srvCode: "PAN-NEW", options: [], status: "DOCUMENTS_REQUIRED", priority: "HIGH", daysAgo: 2, paidFull: false, paidRatio: 0, isAgent: true },
    { srvCode: "CERT-CASTE", options: [], status: "IN_PROGRESS", priority: "MEDIUM", daysAgo: 2, paidFull: true, isAgent: false },
    { srvCode: "UID-ADDR", options: [], status: "COMPLETED", priority: "LOW", daysAgo: 1, paidFull: true, isAgent: false },
    { srvCode: "VOTER-NEW", options: [], status: "SUBMITTED", priority: "MEDIUM", daysAgo: 1, paidFull: true, isAgent: false },
    { srvCode: "PAN-CORRECTION", options: ["Name", "DOB"], status: "DOCUMENTS_RECEIVED", priority: "HIGH", daysAgo: 1, paidFull: false, paidRatio: 0.5, isAgent: false },
    { srvCode: "CERT-GAZETTE", options: [], status: "ON_HOLD", priority: "URGENT", daysAgo: 6, paidFull: true, isAgent: false },
    { srvCode: "PASS-FRESH", options: [], status: "IN_PROGRESS", priority: "HIGH", daysAgo: 0, paidFull: false, paidRatio: 0.5, isAgent: false },
    { srvCode: "PAN-REPRINT", options: [], status: "NEW", priority: "MEDIUM", daysAgo: 0, paidFull: false, paidRatio: 0, isAgent: false },
    { srvCode: "DL-RENEW", options: ["Address Change"], status: "UNDER_PROCESS", priority: "MEDIUM", daysAgo: 0, paidFull: true, isAgent: true },
    { srvCode: "CERT-INCOME", options: [], status: "COMPLETED", priority: "LOW", daysAgo: 0, paidFull: true, isAgent: false },
    { srvCode: "INS-2W", options: [], status: "DELIVERED", priority: "HIGH", daysAgo: 10, paidFull: true, isAgent: false },
    { srvCode: "PASS-RENEW", options: [], status: "SUBMITTED", priority: "URGENT", daysAgo: 5, paidFull: true, isAgent: false },
    { srvCode: "UID-PVC", options: [], status: "COMPLETED", priority: "LOW", daysAgo: 9, paidFull: true, isAgent: false },
    { srvCode: "CERT-CASTE", options: [], status: "CANCELLED", priority: "LOW", daysAgo: 12, paidFull: false, paidRatio: 0, isAgent: false },
  ];

  let workCounter = 1;
  let payCounter = 1;
  let recCounter = 1;

  for (let i = 0; i < workPresets.length; i++) {
    const preset = workPresets[i];
    const customer = createdCustomers[i % createdCustomers.length];
    const srv = serviceMap[preset.srvCode] || serviceMap["PAN-NEW"];

    const finalTotal = srv.customerPrice;

    let paidAmount = 0;
    if (preset.paidFull) {
      paidAmount = finalTotal;
    } else if (preset.paidRatio) {
      paidAmount = Math.round(finalTotal * preset.paidRatio);
    }
    const pendingAmount = Math.max(0, finalTotal - paidAmount);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - preset.daysAgo);

    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + srv.estimatedDays);

    const assignedTo = i % 2 === 0 ? employee.id : employee2.id;
    const taggedAgent = preset.isAgent ? (customer.agentId || agent.id) : null;

    const work = await prisma.work.create({
      data: {
        workId: `WORK-2026-${workCounter.toString().padStart(5, "0")}`,
        customerId: customer.id,
        serviceId: srv.id,
        selectedOptions: null,
        branchId: mainBranch.id,
        assignedUserId: assignedTo,
        agentId: taggedAgent,
        status: preset.status,
        priority: preset.priority,
        totalAmount: finalTotal,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        dueDate: dueDate,
        notes: `Application for ${srv.name}.`,
        createdAt: createdAt,
      },
    });
    workCounter++;

    // Populate required document checklist from Master Service
    const requiredDocs = await prisma.serviceRequiredDocument.findMany({ where: { serviceId: srv.id } });
    for (const doc of requiredDocs) {
      await prisma.workDocument.create({
        data: {
          workId: work.id,
          documentName: doc.name,
          state: preset.status === "DELIVERED" || preset.status === "COMPLETED" ? "VERIFIED" : "REQUIRED",
          verifiedByUserId: preset.status === "DELIVERED" || preset.status === "COMPLETED" ? admin.id : null,
          verifiedAt: preset.status === "DELIVERED" || preset.status === "COMPLETED" ? new Date() : null,
          createdAt: createdAt,
        },
      });
    }

    // Initial Status History
    await prisma.workStatusHistory.create({
      data: {
        workId: work.id,
        previousStatus: "NONE",
        newStatus: "NEW",
        changedByUserId: admin.id,
        notes: "Work order created in system",
        createdAt: createdAt,
      },
    });

    if (preset.status !== "NEW") {
      const stepDate = new Date(createdAt);
      stepDate.setHours(stepDate.getHours() + 2);
      await prisma.workStatusHistory.create({
        data: {
          workId: work.id,
          previousStatus: "NEW",
          newStatus: preset.status,
          changedByUserId: assignedTo,
          notes: `Status updated to ${preset.status} during standard processing flow`,
          createdAt: stepDate,
        },
      });
    }

    // Payment & Receipt
    if (paidAmount > 0) {
      const paymentDate = new Date(createdAt);
      paymentDate.setHours(paymentDate.getHours() + 1);

      const payment = await prisma.payment.create({
        data: {
          paymentId: `PAY-2026-${payCounter.toString().padStart(5, "0")}`,
          workId: work.id,
          customerId: customer.id,
          branchId: mainBranch.id,
          collectedByUserId: assignedTo,
          amount: paidAmount,
          paymentMethod: i % 3 === 0 ? "UPI" : i % 3 === 1 ? "CASH" : "BANK_TRANSFER",
          status: pendingAmount === 0 ? "PAID" : "PARTIAL",
          transactionId: i % 3 === 0 ? `UPI${Date.now().toString().slice(-8)}${i}` : null,
          notes: pendingAmount === 0 ? "Full payment received at counter" : "Initial partial advance paid",
          createdAt: paymentDate,
        },
      });
      payCounter++;

      await prisma.receipt.create({
        data: {
          receiptNumber: `REC-2026-${recCounter.toString().padStart(5, "0")}`,
          paymentId: payment.id,
          workId: work.id,
          customerId: customer.id,
          totalAmount: finalTotal,
          paidAmount: paidAmount,
          pendingAmount: pendingAmount,
          notes: "Official citizen receipt generated by AL-HADI ENTERPRISE system.",
          createdAt: paymentDate,
        },
      });
      recCounter++;
    }

    // Activity Log
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        branchId: mainBranch.id,
        userId: assignedTo,
        action: "WORK_CREATED",
        entity: "Work",
        entityId: work.id,
        metadata: JSON.stringify({ workId: work.workId, serviceName: srv.name, customerName: customer.name }),
        createdAt: createdAt,
      },
    });
  }

  // 9. WhatsApp Templates
  const templates = [
    {
      name: "Work Order Registered",
      code: "WORK_CREATED",
      body: "Hello {customer_name}, your application for {service_name} has been successfully registered at AL-HADI ENTERPRISE. Work Order ID: {work_id}. Target completion: {due_date}. Thank you!",
      variables: JSON.stringify(["customer_name", "service_name", "work_id", "due_date"]),
    },
    {
      name: "Payment Receipt Confirmation",
      code: "PAYMENT_RECEIVED",
      body: "Hello {customer_name}, we have received payment of ₹{amount} towards Work Order: {work_id}. Receipt No: {receipt_number}. Pending Balance: ₹{pending_amount}. Regards, AL-HADI ENTERPRISE.",
      variables: JSON.stringify(["customer_name", "amount", "work_id", "receipt_number", "pending_amount"]),
    },
    {
      name: "Application Completed / Ready for Collection",
      code: "WORK_COMPLETED",
      body: "Dear {customer_name}, your {service_name} ({work_id}) is now READY FOR COLLECTION at AL-HADI ENTERPRISE. Please visit our center with your original receipt. Helpline: +91 9823456789.",
      variables: JSON.stringify(["customer_name", "service_name", "work_id"]),
    },
  ];

  for (const t of templates) {
    await prisma.whatsAppTemplate.create({ data: t });
  }

  console.log("✅ Seed completed successfully!");
  console.log("📊 Summary:");
  console.log(`   - 1 Organization (AL-HADI ENTERPRISE)`);
  console.log(`   - 2 Branches (Main Branch & City Market)`);
  console.log(`   - 5 Users (Admin, 2 Staff, 2 Agents)`);
  console.log(`   - ${categoryData.length} Service Categories`);
  console.log(`   - ${masterServicesConfig.length} Authoritative Master Services with Options & Docs`);
  console.log(`   - ${customersData.length} Customers`);
  console.log(`   - ${workPresets.length} Work Orders (with dynamic option pricing & checklists)`);
  console.log(`   - ${expensesData.length} Expenses`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

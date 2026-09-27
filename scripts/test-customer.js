const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testCustomerCreationFlow() {
  console.log("Testing Customer creation with PostgreSQL 18...");
  const org = await prisma.organization.findFirst();
  const branch = await prisma.branch.findFirst();
  const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: org.id,
    branchId: branch.id,
    permissions: [],
  };

  const count = await prisma.customer.count();
  const customerId = `CUS-2026-${(count + 1).toString().padStart(5, "0")}`;

  const customer = await prisma.customer.create({
    data: {
      customerId,
      organizationId: sessionUser.organizationId,
      branchId: sessionUser.branchId,
      createdById: sessionUser.id,
      name: "Ahmad Raza Qureshi",
      mobile: "9876543210",
      gender: "Male",
      area: "Gulshan Nagar",
      city: "Center City",
      state: "Maharashtra",
    },
  });

  console.log("✅ Customer created successfully in PostgreSQL 18:", customer.customerId, customer.name);

  // Clean up
  await prisma.customer.delete({ where: { id: customer.id } });
  console.log("✅ Customer clean-up verified.");
}

testCustomerCreationFlow().finally(() => prisma.$disconnect());

import prisma from "@/lib/db";

const currentYear = new Date().getFullYear();

export async function generateCustomerId(): Promise<string> {
  const count = await prisma.customer.count();
  const nextNum = (count + 1).toString().padStart(5, "0");
  let customerId = `CUS-${currentYear}-${nextNum}`;
  
  // Guard against any collision
  let existing = await prisma.customer.findUnique({ where: { customerId } });
  let counter = 1;
  while (existing) {
    const fallbackNum = (count + 1 + counter).toString().padStart(5, "0");
    customerId = `CUS-${currentYear}-${fallbackNum}`;
    existing = await prisma.customer.findUnique({ where: { customerId } });
    counter++;
  }
  return customerId;
}

export async function generateWorkId(): Promise<string> {
  const count = await prisma.work.count();
  const nextNum = (count + 1).toString().padStart(5, "0");
  let workId = `WORK-${currentYear}-${nextNum}`;

  let existing = await prisma.work.findUnique({ where: { workId } });
  let counter = 1;
  while (existing) {
    const fallbackNum = (count + 1 + counter).toString().padStart(5, "0");
    workId = `WORK-${currentYear}-${fallbackNum}`;
    existing = await prisma.work.findUnique({ where: { workId } });
    counter++;
  }
  return workId;
}

export async function generatePaymentId(): Promise<string> {
  const count = await prisma.payment.count();
  const nextNum = (count + 1).toString().padStart(5, "0");
  let paymentId = `PAY-${currentYear}-${nextNum}`;

  let existing = await prisma.payment.findUnique({ where: { paymentId } });
  let counter = 1;
  while (existing) {
    const fallbackNum = (count + 1 + counter).toString().padStart(5, "0");
    paymentId = `PAY-${currentYear}-${fallbackNum}`;
    existing = await prisma.payment.findUnique({ where: { paymentId } });
    counter++;
  }
  return paymentId;
}

export async function generateReceiptNumber(prefix = "REC"): Promise<string> {
  const count = await prisma.receipt.count();
  const nextNum = (count + 1).toString().padStart(5, "0");
  let receiptNumber = `${prefix}-${currentYear}-${nextNum}`;

  let existing = await prisma.receipt.findUnique({ where: { receiptNumber } });
  let counter = 1;
  while (existing) {
    const fallbackNum = (count + 1 + counter).toString().padStart(5, "0");
    receiptNumber = `${prefix}-${currentYear}-${fallbackNum}`;
    existing = await prisma.receipt.findUnique({ where: { receiptNumber } });
    counter++;
  }
  return receiptNumber;
}

export async function generateExpenseId(): Promise<string> {
  const count = await prisma.expense.count();
  const nextNum = (count + 1).toString().padStart(5, "0");
  let expenseId = `EXP-${currentYear}-${nextNum}`;

  let existing = await prisma.expense.findUnique({ where: { expenseId } });
  let counter = 1;
  while (existing) {
    const fallbackNum = (count + 1 + counter).toString().padStart(5, "0");
    expenseId = `EXP-${currentYear}-${fallbackNum}`;
    existing = await prisma.expense.findUnique({ where: { expenseId } });
    counter++;
  }
  return expenseId;
}

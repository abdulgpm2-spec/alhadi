/**
 * Non-destructive backfill for the new "service receipt / certificate / tracking / dates"
 * permissions introduced with the Service Tracking + Receipts + Certificate enhancement.
 *
 * Adds the new permission rows to existing users based on role defaults (matching
 * src/lib/constants.ts). It NEVER deletes or alters existing permissions — it only
 * inserts missing rows, so it is safe to run multiple times and preserves all data.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const P = {
  WORK_TRACKING_UPDATE: "work.tracking_update",
  WORK_DATES_UPDATE: "work.dates_update",
  WORK_SERVICE_RECEIPTS_UPLOAD: "work.service_receipts_upload",
  WORK_SERVICE_RECEIPTS_DELETE: "work.service_receipts_delete",
  WORK_CERTIFICATES_UPLOAD: "work.certificates_upload",
  WORK_CERTIFICATES_DELETE: "work.certificates_delete",
};

// Must match DEFAULT_EMPLOYEE_PERMISSIONS / DEFAULT_AGENT_PERMISSIONS in constants.ts
const EMPLOYEE_WORK_PERMS = [
  P.WORK_TRACKING_UPDATE,
  P.WORK_DATES_UPDATE,
  P.WORK_SERVICE_RECEIPTS_UPLOAD,
  P.WORK_SERVICE_RECEIPTS_DELETE,
  P.WORK_CERTIFICATES_UPLOAD,
  P.WORK_CERTIFICATES_DELETE,
];

const AGENT_WORK_PERMS = [
  P.WORK_CERTIFICATES_UPLOAD,
  P.WORK_CERTIFICATES_DELETE,
];

function workPermsForRole(role) {
  if (role === "EMPLOYEE") return EMPLOYEE_WORK_PERMS;
  if (role === "AGENT") return AGENT_WORK_PERMS;
  return []; // ADMIN bypasses requirePermission, no rows needed
}

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "AGENT"] }, isActive: true },
    select: { id: true, role: true },
  });

  let added = 0;
  for (const user of users) {
    const perms = workPermsForRole(user.role);
    for (const perm of perms) {
      const exists = await prisma.userPermission.findUnique({
        where: { userId_permission: { userId: user.id, permission: perm } },
        select: { id: true },
      });
      if (!exists) {
        await prisma.userPermission.create({ data: { userId: user.id, permission: perm } });
        added++;
      }
    }
  }

  console.log(
    `Backfill complete: ${users.length} EMPLOYEE/AGENT user(s) checked, ${added} new permission row(s) added.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
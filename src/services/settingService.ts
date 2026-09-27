import prisma from "@/lib/db";
import { SessionUser } from "@/types";
import { logActivity } from "./auditService";

export async function getBusinessSettings(user: SessionUser) {
  let settings = await prisma.businessSetting.findFirst({
    where: { organizationId: user.organizationId },
  });

  if (!settings) {
    settings = await prisma.businessSetting.create({
      data: {
        organizationId: user.organizationId,
        businessName: "AL-HADI ENTERPRISE",
        tagline: "CSC & Citizen Service Center",
      },
    });
  }

  return settings;
}

export async function updateBusinessSettings(
  data: {
    businessName?: string;
    tagline?: string;
    logoUrl?: string;
    address?: string;
    mobile?: string;
    email?: string;
    gstin?: string;
    website?: string;
    receiptPrefix?: string;
    receiptTerms?: string;
    receiptFooter?: string;
  },
  user: SessionUser
) {
  const existing = await getBusinessSettings(user);

  const updated = await prisma.businessSetting.update({
    where: { id: existing.id },
    data: {
      businessName: data.businessName?.trim(),
      tagline: data.tagline?.trim(),
      logoUrl: data.logoUrl,
      address: data.address?.trim(),
      mobile: data.mobile?.trim(),
      email: data.email?.trim(),
      gstin: data.gstin?.trim(),
      website: data.website?.trim(),
      receiptPrefix: data.receiptPrefix?.trim(),
      receiptTerms: data.receiptTerms?.trim(),
      receiptFooter: data.receiptFooter?.trim(),
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "SETTINGS_UPDATED",
    entity: "BusinessSetting",
    entityId: updated.id,
    newValue: updated,
  });

  return updated;
}

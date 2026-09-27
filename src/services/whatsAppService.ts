import prisma from "@/lib/db";

export interface IWhatsAppService {
  sendMessage(toMobile: string, messageText: string, options?: { workId?: string; customerId?: string; sentByUserId?: string; templateCode?: string }): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendTemplate(toMobile: string, templateCode: string, variables: Record<string, string>, options?: { workId?: string; customerId?: string; sentByUserId?: string }): Promise<{ success: boolean; messageText: string; error?: string }>;
}

export class WhatsAppService implements IWhatsAppService {
  async sendMessage(
    toMobile: string,
    messageText: string,
    options?: { workId?: string; customerId?: string; sentByUserId?: string; templateCode?: string }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const cleanMobile = toMobile.replace(/\D/g, "");
      
      const msg = await prisma.whatsAppMessage.create({
        data: {
          recipientMobile: cleanMobile,
          messageBody: messageText,
          templateCode: options?.templateCode || null,
          status: "SENT",
          workId: options?.workId || null,
          customerId: options?.customerId || null,
          sentByUserId: options?.sentByUserId || null,
        },
      });

      return {
        success: true,
        messageId: msg.id,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || "Failed to dispatch message",
      };
    }
  }

  async sendTemplate(
    toMobile: string,
    templateCode: string,
    variables: Record<string, string>,
    options?: { workId?: string; customerId?: string; sentByUserId?: string }
  ) {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { code: templateCode },
    });

    let messageBody = template ? template.body : "";
    if (template) {
      for (const [k, v] of Object.entries(variables)) {
        messageBody = messageBody.replace(new RegExp(`{${k}}`, "g"), v || "");
      }
    } else {
      messageBody = `Notification from AL-HADI ENTERPRISE: ${JSON.stringify(variables)}`;
    }

    const res = await this.sendMessage(toMobile, messageBody, {
      templateCode,
      workId: options?.workId,
      customerId: options?.customerId,
      sentByUserId: options?.sentByUserId,
    });

    return {
      success: res.success,
      messageText: messageBody,
      error: res.error,
    };
  }

  generateClickToChatUrl(mobile: string, message: string): string {
    const cleanNumber = mobile.replace(/\D/g, "");
    const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  }
}

export const whatsAppService = new WhatsAppService();

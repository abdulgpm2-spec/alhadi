"use client";

import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export default function WhatsAppPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form State
  const [recipientMobile, setRecipientMobile] = useState("");
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [clickToChatLink, setClickToChatLink] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tplRes, histRes] = await Promise.all([
        fetch("/api/whatsapp/templates"),
        fetch("/api/whatsapp/history"),
      ]);
      const tplJson = await tplRes.json();
      const histJson = await histRes.json();

      if (tplJson.success) setTemplates(tplJson.data || []);
      if (histJson.success) setHistory(histJson.data || []);
    } catch (e) {
      toast.error("Failed to load WhatsApp data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTemplateChange = (code: string) => {
    setSelectedTemplateCode(code);
    const tpl = templates.find((t) => t.code === code);
    if (tpl) {
      setCustomMessage(tpl.body);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientMobile || !customMessage) {
      toast.error("Please enter recipient mobile and message text");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: recipientMobile,
          message: customMessage,
          templateCode: selectedTemplateCode || undefined,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to send message");
      }

      toast.success("WhatsApp message dispatched successfully!");
      if (json.data?.clickToChatUrl) {
        setClickToChatLink(json.data.clickToChatUrl);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Customer Notifications"
        subtitle="Dispatch automated application updates, payment receipts, and collection alerts directly to customer WhatsApp"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Message Dispatcher (1 Col) */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Send WhatsApp Alert</CardTitle>
              <CardDescription className="text-xs">Select a verified template or draft a direct message</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Recipient 10-Digit Mobile *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9820112233"
                    value={recipientMobile}
                    onChange={(e) => setRecipientMobile(e.target.value.replace(/\D/g, ""))}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Choose Template (Optional)</label>
                  <Select value={selectedTemplateCode} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Custom Message" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM">Custom Message</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.code} value={t.code}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Message Body *</label>
                  <textarea
                    required
                    rows={5}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter message text..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {sending ? "Dispatching..." : "Send WhatsApp Alert"}
                </Button>
              </form>

              {/* Direct WhatsApp Web Click-to-chat preview */}
              {clickToChatLink && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Message queued!
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    You can also open WhatsApp Web directly to chat with the customer:
                  </p>
                  <a
                    href={clickToChatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                  >
                    Open in WhatsApp Web <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Templates & Sent History (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pre-built Templates Library */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800">Pre-configured System Templates</CardTitle>
              <CardDescription className="text-xs">Standard operational templates with dynamic variables</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-3.5 text-xs space-y-1 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{tpl.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {tpl.code}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed italic bg-slate-50/70 p-2 rounded border border-slate-100">
                      &ldquo;{tpl.body}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sent Messages History */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800">Recent Dispatch History</CardTitle>
              <CardDescription className="text-xs">Log of automated and manual WhatsApp alerts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No message history</div>
                ) : (
                  history.map((msg) => (
                    <div key={msg.id} className="p-3.5 text-xs space-y-1 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 font-mono">
                          +91 {msg.recipientMobile} {msg.customer ? `(${msg.customer.name})` : ""}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">
                        {msg.messageBody}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                        <span className="text-emerald-700 font-semibold uppercase">{msg.status}</span>
                        {msg.templateCode && <span>• Template: {msg.templateCode}</span>}
                        {msg.sentByUser && <span>• By {msg.sentByUser.name}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

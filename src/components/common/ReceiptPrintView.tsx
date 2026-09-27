"use client";

import React, { useState, useEffect } from "react";
import { Printer, MessageCircle, Download, FileText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ReceiptPrintViewProps {
  receipt: any;
  businessSettings?: any;
}

export function ReceiptPrintView({ receipt, businessSettings }: ReceiptPrintViewProps) {
  const [format, setFormat] = useState<"A4" | "THERMAL">("A4");

  // Toggle a body class so the correct @page size + paper profile is used at print time
  useEffect(() => {
    document.body.classList.remove("print-a4", "print-thermal");
    document.body.classList.add(format === "A4" ? "print-a4" : "print-thermal");
    return () => document.body.classList.remove("print-a4", "print-thermal");
  }, [format]);

  const business = businessSettings || {
    businessName: "AL-HADI ENTERPRISE",
    tagline: "CSC & Citizen Service Center",
    address: "Shop No. 4 & 5, Al-Hadi Commercial Complex, Station Road, Center City",
    mobile: "+91 9823456789",
    email: "contact@alhadienterprise.com",
    gstin: "27AAAAA0000A1Z5",
    receiptTerms: "1. Payments are non-refundable once submitted to Govt portal.\n2. Preserve this receipt for physical document collection.",
    receiptFooter: "Thank you for choosing AL-HADI ENTERPRISE.",
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Render a printable copy of the current format behind the scene and trigger print via download fallback.
    // Simplest cross-format export: open print dialog (A4 → PDF saved as "Save as PDF").
    window.print();
  };

  const generateWhatsAppUrl = () => {
    const mobile = receipt.customer?.mobile || "";
    const message = `*PAYMENT RECEIPT - AL-HADI ENTERPRISE*\n\nDear ${receipt.customer?.name},\nThank you for your payment.\n\n*Receipt No:* ${receipt.receiptNumber}\n*Work ID:* ${receipt.work?.workId}\n*Service:* ${receipt.work?.service?.name}\n*Amount Paid:* ${formatCurrency(receipt.paidAmount)}\n*Balance Pending:* ${formatCurrency(receipt.pendingAmount)}\n\nThank you,\n${business.businessName}`;
    const cleanMobile = mobile.replace(/\D/g, "");
    const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    return `https://wa.me/${fullMobile}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-xs no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Receipt Format:</span>
          <div className="flex rounded-md bg-slate-100 p-0.5">
            <button
              onClick={() => setFormat("A4")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                format === "A4" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> A4 Standard
            </button>
            <button
              onClick={() => setFormat("THERMAL")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                format === "THERMAL" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Thermal 80mm
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 text-xs text-slate-700 border-slate-300 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Save PDF
          </Button>
          <Button size="sm" onClick={handlePrint} className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="flex justify-center">
        {format === "A4" ? (
          /* A4 Standard Receipt Template */
          <div className="printable-receipt w-full max-w-3xl bg-white border border-slate-300 shadow-md p-8 md:p-12 text-slate-900 rounded-sm">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{business.businessName}</h2>
                <p className="text-xs font-semibold text-emerald-700">{business.tagline}</p>
                <p className="text-xs text-slate-600 mt-1.5 max-w-md">{business.address}</p>
                <p className="text-xs text-slate-600">Mobile: {business.mobile} | Email: {business.email}</p>
                {business.gstin && <p className="text-xs text-slate-500 font-mono mt-0.5">GSTIN: {business.gstin}</p>}
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase tracking-widest">
                  Payment Receipt
                </span>
                <p className="text-sm font-bold text-slate-900 mt-3 font-mono">{receipt.receiptNumber}</p>
                <p className="text-xs text-slate-600">Date: {formatDateTime(receipt.createdAt)}</p>
              </div>
            </div>

            {/* Customer & Work Meta */}
            <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-md bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Customer Details</span>
                <p className="text-sm font-bold text-slate-900">{receipt.customer?.name}</p>
                <p className="text-slate-600">Mobile: {receipt.customer?.mobile}</p>
                <p className="text-slate-600">Customer ID: {receipt.customer?.customerId}</p>
                {receipt.customer?.area && <p className="text-slate-600">Area: {receipt.customer?.area}</p>}
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Work / Service Details</span>
                <p className="text-sm font-bold text-slate-900">{receipt.work?.service?.name}</p>
                <p className="text-slate-600">Work ID: <span className="font-mono font-bold text-emerald-800">{receipt.work?.workId}</span></p>
                <p className="text-slate-600">Payment Mode: <span className="font-semibold">{receipt.payment?.paymentMethod}</span></p>
                {receipt.payment?.transactionId && (
                  <p className="text-slate-600 font-mono text-[11px]">Txn ID: {receipt.payment?.transactionId}</p>
                )}
                <p className="text-slate-600">Received By: <span className="font-semibold">{receipt.payment?.collectedByUser?.name || "AL-HADI Staff"}</span></p>
              </div>
            </div>

            {/* Financial Line Items Table */}
            <table className="w-full text-xs my-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-3 text-left font-bold uppercase">Description</th>
                  <th className="py-2.5 px-3 text-center font-bold uppercase">Rate</th>
                  <th className="py-2.5 px-3 text-right font-bold uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-800">{receipt.work?.service?.name}</p>
                    <p className="text-[11px] text-slate-500">Government / Portal Processing Fees & Service Charges</p>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">1</td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900">{formatCurrency(receipt.totalAmount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2 px-3 text-right font-bold text-slate-700">Total Billed:</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(receipt.totalAmount)}</td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-900 font-bold">
                  <td colSpan={2} className="py-2.5 px-3 text-right text-xs uppercase">Amount Paid (This Receipt):</td>
                  <td className="py-2.5 px-3 text-right text-sm">{formatCurrency(receipt.paidAmount)}</td>
                </tr>
                <tr className="text-slate-700 font-semibold">
                  <td colSpan={2} className="py-2 px-3 text-right">Balance Outstanding:</td>
                  <td className="py-2 px-3 text-right text-rose-600 font-bold">{formatCurrency(receipt.pendingAmount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Terms & Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-800 uppercase block mb-1">Terms & Conditions</span>
                <p className="text-slate-500 whitespace-pre-line leading-relaxed">{business.receiptTerms}</p>
              </div>
              <div className="flex flex-col justify-end items-end text-right">
                <div className="w-44 border-b border-slate-400 mb-1"></div>
                <span className="font-bold text-slate-800">Authorized Signature</span>
                <span className="text-slate-500 text-[10px]">{business.businessName}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[11px] text-slate-400 mt-8 pt-4 border-t border-slate-100">
              {business.receiptFooter}
            </div>
          </div>
        ) : (
          /* Thermal 80mm Receipt Template — strict 302px (80mm) slip for POS printers */
          <div className="printable-receipt w-[302px] bg-white p-3 text-slate-900 font-mono text-xs leading-snug rounded-sm">
            {/* Store header */}
            <div className="text-center pb-2">
              <h3 className="font-bold text-sm tracking-tight uppercase">{business.businessName}</h3>
              {business.tagline && <p className="text-[10px] text-slate-600">{business.tagline}</p>}
              {business.gstin && <p className="text-[10px] text-slate-500">GSTIN: {business.gstin}</p>}
            </div>
            <div className="text-center text-[10px] text-slate-600 pb-2">
              {business.address && <p>{business.address}</p>}
              <p>Ph: {business.mobile}{business.email ? ` | ${business.email}` : ""}</p>
            </div>
            <div className="border-t border-dashed border-slate-500 pt-2 pb-1 text-center tracking-widest text-slate-500">
              - - - - - - - - - - - - - - - - - - -
            </div>

            {/* Receipt meta */}
            <div className="py-2 space-y-1">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDateTime(receipt.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Work ID:</span>
                <span className="font-bold text-emerald-800">{receipt.work?.workId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Customer:</span>
                <span className="font-semibold text-right max-w-[170px]">{receipt.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile:</span>
                <span>{receipt.customer?.mobile}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 pt-2 pb-1 text-center tracking-widest text-slate-500">
              - - - - - - - - - - - - - - - - - - -
            </div>

            {/* Service line item */}
            <div className="py-2">
              <p className="font-bold text-emerald-900">{receipt.work?.service?.name}</p>
              <div className="flex justify-between mt-1">
                <span>Total Amount:</span>
                <span>{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 pt-2">
              <div className="flex justify-between text-xs">
                <span>Paid ({receipt.payment?.paymentMethod}):</span>
                <span className="font-bold">{formatCurrency(receipt.paidAmount)}</span>
              </div>
              {receipt.payment?.transactionId && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Txn ID:</span>
                  <span>{receipt.payment.transactionId}</span>
                </div>
              )}
              <div className={`flex justify-between text-xs mt-1 ${receipt.pendingAmount > 0 ? "text-rose-600 font-bold" : "text-slate-700 font-bold"}`}>
                <span>Balance Due:</span>
                <span>{formatCurrency(receipt.pendingAmount)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 mt-2 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
              <p>Collected by: {receipt.payment?.collectedByUser?.name || "AL-HADI Staff"}</p>
              <p className="text-slate-400">Preserve this slip for document collection.</p>
              <p className="font-bold text-slate-700 tracking-widest">*** THANK YOU ***</p>
              <p className="font-bold text-slate-600">{business.businessName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

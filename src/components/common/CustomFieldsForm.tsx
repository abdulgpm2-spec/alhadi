"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CustomFieldDef {
  fieldKey: string;
  label: string;
  labelMr?: string | null;
  fieldType: string;
  options?: string[] | string | null;
  isRequired?: boolean;
  marathiEnabled?: boolean;
  isActive?: boolean;
}

export interface CustomFieldValue {
  value: string;
  valueMr: string;
}

export function parseFieldOptions(field: CustomFieldDef): string[] {
  if (Array.isArray(field.options)) return field.options.filter((o) => typeof o === "string");
  if (typeof field.options === "string") {
    try {
      const parsed = JSON.parse(field.options);
      if (Array.isArray(parsed)) return parsed.filter((o) => typeof o === "string");
    } catch {
      return [];
    }
  }
  return [];
}

/** Client-side validation. Returns an error message or null when valid. */
export function validateCustomFieldValues(
  fields: CustomFieldDef[] | undefined | null,
  values: Record<string, CustomFieldValue>
): string | null {
  const active = (fields || []).filter((f) => f.isActive !== false);
  for (const f of active) {
    const v = values[f.fieldKey];
    const value = (v?.value || "").trim();
    const valueMr = (v?.valueMr || "").trim();
    if (f.isRequired && !value) return `"${f.label}" is required.`;
    if (f.isRequired && f.marathiEnabled && !valueMr) return `"${f.label}" Marathi value is required.`;
    if (value && f.fieldType === "PHONE" && !/^\d{10}$/.test(value.replace(/\D/g, ""))) {
      return `"${f.label}" must be a 10-digit number.`;
    }
    if (value && f.fieldType === "SELECT") {
      const options = parseFieldOptions(f);
      if (options.length > 0 && !options.includes(value)) return `"${f.label}" has an invalid selection.`;
    }
  }
  return null;
}

export function toCustomFieldPayload(
  fields: CustomFieldDef[] | undefined | null,
  values: Record<string, CustomFieldValue>
): Array<{ fieldKey: string; value: string; valueMr?: string }> {
  const active = (fields || []).filter((f) => f.isActive !== false);
  return active.map((f) => ({
    fieldKey: f.fieldKey,
    value: (values[f.fieldKey]?.value || "").trim(),
    valueMr: (values[f.fieldKey]?.valueMr || "").trim() || undefined,
  }));
}

interface Props {
  fields: CustomFieldDef[] | undefined | null;
  values: Record<string, CustomFieldValue>;
  onChange: (fieldKey: string, patch: Partial<CustomFieldValue>) => void;
  /** When this changes (e.g. service switched), auto-translate state resets. */
  resetKey?: string;
}

async function fetchMarathi(text: string): Promise<string> {
  try {
    const res = await fetch(`/api/transliterate?text=${encodeURIComponent(text)}`);
    const json = await res.json();
    if (json.success && typeof json.data?.text === "string") return json.data.text;
  } catch {
    /* ignore — operator types manually */
  }
  return "";
}

export const CustomFieldsForm = React.memo(function CustomFieldsForm({ fields, values, onChange, resetKey }: Props) {
  const active = (fields || []).filter((f) => f.isActive !== false);
  // Tracks fields whose Marathi box the operator edited by hand (stop auto-sync for those)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoBusy, setAutoBusy] = useState<Record<string, boolean>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setTouched({});
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setAutoBusy({});
  }, [resetKey]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const runAuto = useCallback(
    async (fieldKey: string, englishText: string) => {
      const text = (englishText || "").trim();
      if (!text) return;
      setAutoBusy((p) => ({ ...p, [fieldKey]: true }));
      try {
        const mr = await fetchMarathi(text);
        if (mr) onChange(fieldKey, { valueMr: mr });
      } finally {
        setAutoBusy((p) => {
          const next = { ...p };
          delete next[fieldKey];
          return next;
        });
      }
    },
    [onChange]
  );

  const scheduleAuto = useCallback(
    (fieldKey: string, englishText: string) => {
      const prev = timers.current.get(fieldKey);
      if (prev) clearTimeout(prev);
      timers.current.set(
        fieldKey,
        setTimeout(() => runAuto(fieldKey, englishText), 600)
      );
    },
    [runAuto]
  );

  if (active.length === 0) return null;

  const set = (fieldKey: string, patch: Partial<CustomFieldValue>, field?: CustomFieldDef) => {
    if (patch.valueMr !== undefined) {
      setTouched((p) => ({ ...p, [fieldKey]: true }));
      const prev = timers.current.get(fieldKey);
      if (prev) clearTimeout(prev);
    }
    if (patch.value !== undefined && field?.marathiEnabled && !touched[fieldKey]) {
      scheduleAuto(fieldKey, patch.value);
    }
    onChange(fieldKey, patch);
  };

  return (
    <div className="space-y-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200">
      <h4 className="text-xs font-bold text-slate-900">Applicant Details</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {active.map((f) => {
          const val = values[f.fieldKey] || { value: "", valueMr: "" };
          const options = parseFieldOptions(f);
          return (
            <div key={f.fieldKey} className={`space-y-1.5 ${f.fieldType === "TEXTAREA" ? "sm:col-span-2" : ""}`}>
              <label className="text-[11px] font-semibold text-slate-700">
                {f.label} {f.isRequired ? "*" : ""}
                {f.labelMr && <span className="font-normal text-slate-400"> ({f.labelMr})</span>}
              </label>
              {f.fieldType === "SELECT" ? (
                <Select value={val.value || ""} onValueChange={(v) => set(f.fieldKey, { value: v }, f)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder={`Select ${f.label}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.fieldType === "TEXTAREA" ? (
                <textarea
                  placeholder={`Enter ${f.label}...`}
                  value={val.value}
                  onChange={(e) => set(f.fieldKey, { value: e.target.value }, f)}
                  className="w-full min-h-[52px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <Input
                  type={f.fieldType === "DATE" ? "date" : f.fieldType === "PHONE" ? "tel" : "text"}
                  maxLength={f.fieldType === "PHONE" ? 10 : undefined}
                  placeholder={`Enter ${f.label}...`}
                  value={val.value}
                  onChange={(e) =>
                    set(
                      f.fieldKey,
                      f.fieldType === "PHONE"
                        ? { value: e.target.value.replace(/\D/g, "") }
                        : { value: e.target.value },
                      f
                    )
                  }
                  className="h-8 text-xs bg-white"
                />
              )}
              {f.marathiEnabled && (
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder={`${f.labelMr || f.label} (मराठीत लिहा)...`}
                    value={val.valueMr}
                    onChange={(e) => set(f.fieldKey, { valueMr: e.target.value }, f)}
                    className="h-8 text-xs bg-amber-50/60 border-amber-200 flex-1"
                  />
                  <button
                    type="button"
                    title={touched[f.fieldKey] ? "Auto-translate again" : "Auto-translate from English"}
                    onClick={() => {
                      setTouched((p) => {
                        const next = { ...p };
                        delete next[f.fieldKey];
                        return next;
                      });
                      runAuto(f.fieldKey, val.value);
                    }}
                    className="h-8 px-2 shrink-0 rounded-md border border-amber-300 bg-white text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                    disabled={!!autoBusy[f.fieldKey]}
                  >
                    {autoBusy[f.fieldKey] ? "..." : touched[f.fieldKey] ? "↻" : "Auto"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

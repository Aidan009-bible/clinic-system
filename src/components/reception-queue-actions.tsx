"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  visitId: string;
  patientName: string;
  symptoms: string[];
  inConsultation: boolean;
};

export function ReceptionQueueActions({ visitId, patientName, symptoms, inConsultation }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [symptomText, setSymptomText] = useState(symptoms.join(", "));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveChanges() {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-queue",
        symptoms: symptomText.split(",").map((value) => value.trim()).filter(Boolean),
      }),
    });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "Could not update this visit.");
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not connect. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteVisit() {
    const message = inConsultation
      ? `${patientName} is with the doctor. Delete this visit and cancel the consultation?`
      : `Remove ${patientName} from the waiting queue?`;

    if (!window.confirm(message)) return;

    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/visits/${visitId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete this visit.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not connect. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <button className="rounded-lg border border-[#cbd9e5] px-3 py-2 text-xs font-semibold text-[#0b2a5b] hover:bg-[#f2f7ff]" onClick={() => setIsEditing(true)} type="button">Edit</button>
        <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" disabled={isSaving} onClick={deleteVisit} type="button">Delete</button>
      </div>
      {error && !isEditing ? <p className="mt-2 text-xs text-red-700" role="alert">{error}</p> : null}
      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071b33]/45 p-4" role="dialog" aria-modal="true" aria-labelledby={`edit-${visitId}`}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Edit queue visit</p>
            <h3 className="mt-2 text-xl font-semibold text-[#071b33]" id={`edit-${visitId}`}>{patientName}</h3>
            <label className="mt-5 block text-sm font-semibold text-[#30445a]" htmlFor={`symptoms-${visitId}`}>Symptoms or reason for visit</label>
            <textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#cbd9e5] px-4 py-3 text-sm text-[#071b33] focus:border-[#2f80ed] focus:outline-none" id={`symptoms-${visitId}`} onChange={(event) => setSymptomText(event.target.value)} placeholder="Optional, separated by commas" value={symptomText} />
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-xl border border-[#cbd9e5] px-4 py-2.5 text-sm font-semibold text-[#30445a]" disabled={isSaving} onClick={() => { setError(""); setIsEditing(false); }} type="button">Cancel</button>
              <button className="rounded-xl bg-[#0b2a5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={saveChanges} type="button">{isSaving ? "Saving..." : "Save changes"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

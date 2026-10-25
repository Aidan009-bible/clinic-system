"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import type { Patient } from "@/lib/types";

export function PatientRowActions({ patient, disabled, onDeleted }: {
  patient: Patient;
  disabled: boolean;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) dialogRef.current?.showModal();
  }, [editing]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const fields = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fields.get("name"), age: Number(fields.get("age")), phone: fields.get("phone") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update patient.");
      setEditing(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${patient.name} from the existing-patient list? Visit and billing records will be kept. Existing queue entries are not cancelled.`)) return;
    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not delete patient.");
      onDeleted();
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-end gap-2">
        <button aria-label={`Edit ${patient.name}`} className="min-h-11 rounded-lg border border-[#d8e4ec] px-3 py-2 text-xs font-semibold text-[#0b2a5b] hover:bg-[#e7f0ff] disabled:opacity-50" disabled={disabled || pending} onClick={() => { setError(""); setEditing(true); }} type="button">Edit</button>
        <button aria-label={`Delete ${patient.name}`} className="min-h-11 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={disabled || pending} onClick={remove} type="button">{pending && !editing ? "Deleting..." : "Delete"}</button>
      </div>
      {!editing && error ? <p className="mt-2 max-w-48 text-xs text-rose-700" role="alert">{error}</p> : null}
      {editing ? createPortal(
        <dialog aria-labelledby={`edit-patient-${patient.id}`} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[20px] border border-[#d8e4ec] bg-white p-5 text-[#071b33] shadow-2xl backdrop:bg-[#071b33]/45 sm:p-6" onCancel={() => setEditing(false)} ref={dialogRef}>
          <form className="grid gap-4" onSubmit={save}>
            <div>
              <h3 className="text-xl font-semibold" id={`edit-patient-${patient.id}`}>Edit patient</h3>
              <p className="mt-1 text-sm text-[#61758a]">{patient.patientCode}</p>
            </div>
            <label className="grid gap-2 text-sm font-semibold">Name
              <input autoFocus className="min-h-11 min-w-0 rounded-xl border border-[#d8e4ec] px-3 py-2 text-base font-normal" defaultValue={patient.name} maxLength={120} name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Age
              <input className="min-h-11 min-w-0 rounded-xl border border-[#d8e4ec] px-3 py-2 text-base font-normal" defaultValue={patient.age} max={150} min={1} name="age" required step={1} type="number" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Phone number
              <input className="min-h-11 min-w-0 rounded-xl border border-[#d8e4ec] px-3 py-2 text-base font-normal" defaultValue={patient.phone} maxLength={40} name="phone" required type="tel" />
            </label>
            {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button className="min-h-11 rounded-xl border border-[#d8e4ec] px-4 py-2 text-sm font-semibold" disabled={pending} onClick={() => setEditing(false)} type="button">Cancel</button>
              <button className="min-h-11 rounded-xl bg-[#0b2a5b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </dialog>, document.body,
      ) : null}
    </div>
  );
}

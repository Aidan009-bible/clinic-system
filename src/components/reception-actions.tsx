"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";

import { MedicineStockTable } from "@/components/medicine-stock-table";
import type { Medicine, Patient, Visit } from "@/lib/types";

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function ReceptionPatientForm({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientType, setPatientType] = useState<"old" | "new">("old");
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const deferredPatientQuery = useDeferredValue(patientQuery);
  const normalizedPatientQuery = deferredPatientQuery.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) =>
    `${patient.patientCode} ${patient.name} ${patient.phone}`
      .toLowerCase()
      .includes(normalizedPatientQuery),
  );

  return (
    <form
      className="reception-checkin rounded-[20px] border border-[#d8e4ec] bg-white p-6 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
          let patientId = String(formData.get("patientId") ?? "");

          if (patientType === "old" && !patientId) {
            throw new Error("Please select an existing patient.");
          }

          if (patientType === "new") {
            const patientResponse = await fetch("/api/patients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: String(formData.get("name") ?? ""),
                age: Number(formData.get("age") ?? 0),
                phone: String(formData.get("phone") ?? ""),
                tags: "",
              }),
            });
            const patientResult = (await patientResponse.json()) as {
              error?: string;
              patient?: Patient;
            };

            if (!patientResponse.ok || !patientResult.patient) {
              throw new Error(patientResult.error ?? "Failed to create patient.");
            }

            patientId = patientResult.patient.id;
          }

          const visitResponse = await fetch("/api/visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              symptoms: String(formData.get("symptoms") ?? ""),
            }),
          });
          const visitResult = (await visitResponse.json()) as { error?: string };

          if (!visitResponse.ok) {
            throw new Error(visitResult.error ?? "Failed to add patient to the queue.");
          }

          form.reset();
          router.push("/reception/queue");
          router.refresh();
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Failed to create patient.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Patient check-in</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#071b33]">
        Add patient to queue
      </h3>
      <p className="mt-2 text-sm text-[#61758a]">Choose a returning patient or register someone new, then record the reason for this visit.</p>
      <div className="mt-5 grid max-w-lg grid-cols-2 gap-1 rounded-xl border border-[#d8e4ec] bg-[#f7fafc] p-1">
        {(["old", "new"] as const).map((type) => (
          <button
            aria-pressed={patientType === type}
            className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              patientType === type ? "bg-[#0b2a5b] text-white shadow-sm" : "text-[#61758a] hover:bg-[#e7f0ff]"
            }`}
            key={type}
            onClick={() => setPatientType(type)}
            type="button"
          >
            {type === "old" ? "Existing patient" : "New patient"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        {patientType === "old" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <input name="patientId" type="hidden" value={selectedPatientId} />
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="existing-patient-search">
                Choose existing patient
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                id="existing-patient-search"
                onChange={(event) => setPatientQuery(event.target.value)}
                placeholder="Search name, patient ID, or phone"
                type="search"
                value={patientQuery}
              />
              <p className="mt-2 text-xs text-slate-500">
                {filteredPatients.length} patient{filteredPatients.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div aria-label="Choose a patient; scroll for more records and columns" className="max-h-80 overflow-auto overscroll-contain" role="region" tabIndex={0}>
              <table className="w-full min-w-[420px] border-collapse text-left sm:min-w-[620px]">
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-[0.1em] text-slate-500 shadow-[0_1px_0_0_#e2e8f0]">
                  <tr>
                    <th className="w-14 px-4 py-3 font-semibold">Pick</th>
                    <th className="px-4 py-3 font-semibold">Patient</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Age</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Last visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((patient) => {
                    const selected = selectedPatientId === patient.id;

                    return (
                      <tr
                        className={`cursor-pointer transition ${selected ? "bg-[#e7f0ff]" : "hover:bg-[#f7fafc]"}`}
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Select ${patient.name}`}
                            checked={selected}
                            name="patient-choice"
                            onChange={() => setSelectedPatientId(patient.id)}
                            type="radio"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950">{patient.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{patient.patientCode}</p>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-slate-700 sm:table-cell">{patient.age}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{patient.phone}</td>
                        <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                          {formatDateTime(patient.lastVisitAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredPatients.length ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No patient matches “{patientQuery}”.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#d8e4ec] bg-[#fbfdff] p-5">
            <h4 className="mb-4 text-base font-semibold text-[#071b33]">Patient details</h4>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1fr)]">
              <label className="grid gap-2 text-sm font-medium text-[#071b33]">
                Patient name <span className="sr-only">(required)</span>
                <input className="rounded-xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm" name="name" placeholder="Full name" required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#071b33]">
                Age <span className="sr-only">(required)</span>
                <input className="rounded-xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm" min="1" name="age" placeholder="Years" required type="number" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#071b33]">
                Phone number <span className="sr-only">(required)</span>
                <input className="rounded-xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm" name="phone" placeholder="Contact number" required />
              </label>
            </div>
          </div>
        )}
        <label className="mt-1 grid gap-2 border-t border-[#e7eef3] pt-5">
          <span className="text-sm font-semibold text-[#071b33]">Reason for visit <span className="font-normal text-[#61758a]">(optional)</span></span>
          <textarea className="min-h-24 rounded-xl border border-[#d8e4ec] px-4 py-3 text-sm" name="symptoms" placeholder="Symptoms or reason for visit" />
        </label>
      </div>
      <button className="mt-5 min-h-11 rounded-xl bg-[#0b2a5b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#071b33] disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Adding to queue..." : "Add to queue"}
      </button>
      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}

export function ReceptionVisitForm({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
          const response = await fetch("/api/visits", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patientId: String(formData.get("patientId") ?? ""),
              symptoms: String(formData.get("symptoms") ?? ""),
            }),
          });

          const result = (await response.json()) as { error?: string };

          if (!response.ok) {
            throw new Error(result.error ?? "Failed to create visit.");
          }

          form.reset();
          router.refresh();
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Failed to create visit.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <p className="text-sm font-medium text-slate-500">Old patient new date</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        Open today&apos;s visit
      </h3>
      <div className="mt-5 grid gap-3">
        <select className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" name="patientId" required>
          <option value="">Choose patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.patientCode} - {patient.name}
            </option>
          ))}
        </select>
        <textarea className="min-h-28 rounded-2xl border border-slate-300 px-4 py-3 text-sm" name="symptoms" placeholder="Symptoms separated by comma (optional)" />
      </div>
      <button className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Creating..." : "Create visit"}
      </button>
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}

export function ReceptionBilling({
  visits,
}: {
  visits: Visit[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Billing counter</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#071b33]">Review and issue bill slips</h3>
          <p className="mt-2 text-sm text-[#61758a]">Check the prescription and final charges before completing each visit.</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          {visits.length} ready for billing
        </span>
      </div>
      {visits.map((visit) => (
        <article key={visit.id} className="reception-bill grid gap-5 rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_260px]">
          <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Patient / visit</p>
              <h4 className="mt-3 break-words text-lg font-semibold tracking-tight text-[#071b33]">
                {visit.patientName}
              </h4>
              <p className="mt-1 text-sm font-medium text-[#2f80ed]">{visit.patientCode}</p>
              <p className="mt-2 text-xs leading-5 text-[#61758a]">
                Checked in {formatDateTime(visit.createdAt)}
              </p>
            <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              Ready for billing
            </span>
          </div>

          <div className="min-w-0 xl:border-l xl:border-[#e7eef3] xl:pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Prescription</p>
            <div className="mt-3 divide-y divide-[#e7eef3]">
              {visit.prescription.map((item) => (
                <div key={`${visit.id}-${item.medicineId}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 text-sm">
                  <div className="min-w-0 break-words">
                    <p className="font-medium text-[#071b33]">{item.medicineName}</p>
                    <p className="mt-1 text-xs leading-5 text-[#61758a]">Quantity {item.quantity}{item.dosage ? ` · ${item.dosage}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-right tabular-nums text-[#071b33]">{item.lineTotal.toLocaleString()} MMK</span>
                </div>
              ))}
              {!visit.prescription.length ? <p className="rounded-xl bg-[#f7fafc] p-3 text-sm text-[#61758a]">No medicines prescribed.</p> : null}
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-[#dcebe2] bg-[#f2fbf6] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Billing summary</p>
            <div className="mt-4 grid gap-3 text-xs tabular-nums">
              <div className="flex items-baseline justify-between gap-2 text-[#61758a]">
                <span>Consultation</span>
                <span className="whitespace-nowrap text-[#071b33]">{visit.consultationFee.toLocaleString()} MMK</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[#61758a]">
                <span>Medicine</span>
                <span className="whitespace-nowrap text-[#071b33]">{visit.medicineCharge.toLocaleString()} MMK</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#cce8d8] pt-3 text-[#071b33]">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-semibold">{visit.totalCharge.toLocaleString()} MMK</span>
              </div>
            </div>
          <button
            className="mt-5 min-h-11 w-full rounded-xl bg-[#0b2a5b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#071b33] disabled:opacity-60"
            disabled={loadingId === visit.id}
            onClick={async () => {
              setError("");
              setLoadingId(visit.id);
              try {
                const response = await fetch(`/api/visits/${visit.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    action: "issue-bill",
                  }),
                });
                const result = (await response.json()) as { error?: string };

                if (!response.ok) {
                  throw new Error(result.error ?? "Failed to issue bill.");
                }

                router.refresh();
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Failed to issue bill.");
              } finally {
                setLoadingId(null);
              }
            }}
            type="button"
          >
            {loadingId === visit.id ? "Processing..." : "Issue bill slip"}
          </button>
            <p className="mt-3 text-xs leading-5 text-[#61758a]">Issuing the slip completes the visit and updates medicine stock.</p>
          </div>
        </article>
      ))}
      {!visits.length ? (
        <div className="rounded-[20px] border border-[#d8e4ec] bg-white px-6 py-12 text-center shadow-sm">
          <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m7 12 3 3 7-7M5 4h14v17l-3-2-4 2-4-2-3 2V4Z" /></svg>
          </span>
          <p className="mt-4 text-sm font-semibold text-[#071b33]">No visits ready for billing</p>
          <p className="mt-1 text-sm text-[#61758a]">Visits appear here when the doctor sends them to reception.</p>
        </div>
      ) : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

export function ReceptionStock({ medicines }: { medicines: Medicine[] }) {
  return (
    <MedicineStockTable
      description="Reception can check available stock before issuing bills and handing out medicine."
      medicines={medicines}
      title="Current counter stock"
    />
  );
}

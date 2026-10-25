import Link from "next/link";

import type { ClinicSnapshot, Visit } from "@/lib/types";

const LOW_STOCK_LIMIT = 20;

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function summarize(visits: Visit[], start: Date) {
  const periodVisits = visits.filter((visit) => new Date(visit.createdAt) >= start);
  const paidVisits = visits.filter(
    (visit) =>
      visit.status === "Completed" &&
      new Date(visit.receiptIssuedAt ?? visit.createdAt) >= start,
  );

  return {
    visits: periodVisits.length,
    patients: new Set(periodVisits.map((visit) => visit.patientId)).size,
    completed: paidVisits.length,
    medicineUnits: paidVisits.reduce(
      (sum, visit) =>
        sum + visit.prescription.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    ),
    revenue: paidVisits.reduce((sum, visit) => sum + visit.totalCharge, 0),
  };
}

function MetricIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  if (normalized.includes("waiting")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (normalized.includes("consulting") || normalized.includes("doctor")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        <rect x="4" y="4" width="16" height="16" rx="5" />
      </svg>
    );
  }

  if (normalized.includes("medicine") || normalized.includes("stock")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7l4-4Z" />
        <path strokeLinecap="round" d="m8 12 4 4" />
      </svg>
    );
  }

  if (normalized.includes("bill")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path strokeLinecap="round" d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
      <path strokeLinecap="round" d="M15 6.5a3 3 0 0 1 0 5.5M16 14c2.5.3 4 2 4.5 4.5" />
    </svg>
  );
}

export function PortalOverview({
  role,
  snapshot,
}: {
  role: "doctor" | "reception";
  snapshot: ClinicSnapshot;
}) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = startOfDay(now);
  monthStart.setDate(1);

  const waiting = snapshot.visits.filter((visit) => visit.status === "Waiting").length;
  const consulting = snapshot.visits.filter(
    (visit) => visit.status === "In Consultation",
  ).length;
  const billing = snapshot.visits.filter(
    (visit) => visit.status === "Ready for Billing",
  ).length;
  const lowStock = snapshot.medicines
    .filter((medicine) => medicine.stock <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.stock - b.stock);
  const today = summarize(snapshot.visits, todayStart);
  const periods = [
    { label: "Daily", detail: "Today", data: today, color: "border-[#cfe0ff] bg-[#f4f8ff]" },
    {
      label: "Weekly",
      detail: "Last 7 days",
      data: summarize(snapshot.visits, weekStart),
      color: "border-[#cce8d8] bg-[#f2fbf6]",
    },
    {
      label: "Monthly",
      detail: "Current month",
      data: summarize(snapshot.visits, monthStart),
      color: "border-[#f3ddb2] bg-[#fff8ea]",
    },
  ];
  const primaryCards =
    role === "doctor"
      ? [
          { label: "Waiting", value: waiting, detail: "Patients ready to see" },
          { label: "Consulting", value: consulting, detail: "Started consultations" },
          { label: "Today's patients", value: today.patients, detail: `${today.visits} visits today` },
          { label: "Medicines", value: snapshot.medicines.length, detail: `${lowStock.length} low-stock reminders` },
        ]
      : [
          { label: "Registered patients", value: snapshot.patients.filter((patient) => !patient.archivedAt).length, detail: "Total patient records" },
          { label: "Waiting", value: waiting, detail: "Active visits awaiting doctor" },
          { label: "Ready to bill", value: billing, detail: "Doctor finished" },
          { label: "Stock reminders", value: lowStock.length, detail: `At or below ${LOW_STOCK_LIMIT} units` },
        ];

  const workflowSection = (
    <section data-ui="workflow" className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-[24px] border border-[#d8e4ec] bg-white p-6 shadow-[0_16px_48px_rgba(8,42,96,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Current workflow</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">
          Active visits · all check-in dates
        </h3>
        <div className="mt-5 grid gap-3">
          {[
            ["Waiting", waiting, "bg-[#fff7e7] text-[#9a6200]"],
            ["With doctor", consulting, "bg-[#e7f0ff] text-[#0b2a5b]"],
            ["Ready for billing", billing, "bg-[#eefaf3] text-[#11703f]"],
          ].map(([label, value, badgeClass]) => (
            <div className="flex items-center justify-between rounded-2xl border border-[#d8e4ec] bg-[#f7fafc] p-4" key={label}>
              <span className="text-sm font-semibold text-[#071b33]">{label}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${badgeClass}`}>{value}</span>
            </div>
          ))}
        </div>
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#0b2a5b] px-4 text-sm font-semibold text-white transition hover:bg-[#071b33]"
          href={role === "doctor" ? "/doctor/queue" : "/reception/queue"}
        >
          Open patient queue
        </Link>
      </article>
      <article className="rounded-[24px] border border-[#d8e4ec] bg-white p-6 shadow-[0_16px_48px_rgba(8,42,96,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Stock reminder</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">Low medicines</h3>
        <div className="mt-5 grid gap-3">
          {lowStock.slice(0, 5).map((medicine) => (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f3ddb2] bg-[#fff7e7] p-4" key={medicine.id}>
              <div>
                <p className="text-sm font-semibold text-[#071b33]">{medicine.name}</p>
                <p className="mt-1 text-xs text-[#61758a]">Limit {LOW_STOCK_LIMIT}</p>
              </div>
              <span className="text-sm font-bold text-[#9a6200]">{medicine.stock} {medicine.unit}</span>
            </div>
          ))}
          {!lowStock.length ? (
            <p className="rounded-2xl border border-[#cce8d8] bg-[#eefaf3] p-4 text-sm font-medium text-[#11703f]">All medicine stock is healthy.</p>
          ) : null}
        </div>
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#d8e4ec] px-4 text-sm font-semibold text-[#0b2a5b] transition hover:bg-[#f7fafc]"
          href={`/${role}/stock`}
        >
          View medicine stock
        </Link>
      </article>
    </section>
  );

  return (
    <div className={role === "doctor" ? "doctor-overview" : "reception-overview"}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map((card) => (
          <article className="rounded-[24px] border border-[#d8e4ec] bg-white p-5 shadow-[0_16px_48px_rgba(8,42,96,0.08)]" key={card.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#61758a]">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#071b33]">{card.value}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f0ff] text-[#0b2a5b]">
                <MetricIcon label={card.label} />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#61758a]">{card.detail}</p>
          </article>
        ))}
      </section>

      {workflowSection}

      <section data-ui="activity" className="rounded-[24px] border border-[#d8e4ec] bg-white p-5 shadow-[0_16px_48px_rgba(8,42,96,0.08)]">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Clinic activity</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">
              Daily, weekly, monthly
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#61758a]">
            Visits and patients are grouped by check-in date. Paid totals and issued medicines follow completed billing.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {periods.map(({ label, detail, data, color }) => (
            <article className={`rounded-[22px] border p-5 ${color}`} key={label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-[#071b33]">{label}</p>
                  <p className="mt-1 text-sm text-[#61758a]">{detail}</p>
                </div>
                <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-semibold text-[#0b2a5b] shadow-sm">
                  {data.completed} completed
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Patients</p>
                  <p className="mt-2 text-2xl font-semibold text-[#071b33]">{data.patients}</p>
                  <p className="mt-1 text-xs text-[#61758a]">{data.visits} visits</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Medicine</p>
                  <p className="mt-2 text-2xl font-semibold text-[#071b33]">{data.medicineUnits}</p>
                  <p className="mt-1 text-xs text-[#61758a]">units issued</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Paid total</p>
                  <span data-ui="currency-unit" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    MMK
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">{data.revenue.toLocaleString()} MMK</p>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

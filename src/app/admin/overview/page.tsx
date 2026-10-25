import Link from "next/link";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/auth";
import { getClinicSnapshot } from "@/lib/clinic-server";
import type { Visit } from "@/lib/types";

const navItems = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/stock", label: "Medicine Stocks" },
];

const LOW_STOCK_LIMIT = 20;

export const dynamic = "force-dynamic";

function MetricIcon({ type }: { type: "patients" | "medicine" | "stock" | "alert" }) {
  if (type === "patients") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path strokeLinecap="round" d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
        <path strokeLinecap="round" d="M15 6.5a3 3 0 0 1 0 5.5M16 14c2.5.3 4 2 4.5 4.5" />
      </svg>
    );
  }

  if (type === "medicine") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7l4-4Z" />
        <path strokeLinecap="round" d="m8 12 4 4" />
      </svg>
    );
  }

  if (type === "stock") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M6 7v12h12V7M9 11h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.6 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.6a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildPeriodSummary(visits: Visit[], start: Date) {
  const periodVisits = visits.filter((visit) => new Date(visit.createdAt) >= start);
  const completedBills = visits.filter((visit) => {
    if (visit.status !== "Completed") {
      return false;
    }

    return new Date(visit.receiptIssuedAt ?? visit.createdAt) >= start;
  });

  return {
    visits: periodVisits.length,
    patients: new Set(periodVisits.map((visit) => visit.patientId)).size,
    completed: completedBills.length,
    medicineUnits: completedBills.reduce(
      (sum, visit) =>
        sum + visit.prescription.reduce((visitSum, item) => visitSum + item.quantity, 0),
      0,
    ),
    revenue: completedBills.reduce((sum, visit) => sum + visit.totalCharge, 0),
  };
}

export default async function AdminOverviewPage() {
  const session = await requireSession(["admin"]);
  const snapshot = await getClinicSnapshot();
  const now = new Date();
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = startOfDay(now);
  monthStart.setDate(1);

  const periods = [
    {
      label: "Daily",
      detail: "Today",
      summary: buildPeriodSummary(snapshot.visits, startOfDay(now)),
      accent: "border-[#cfe0ff] bg-[#f4f8ff]",
    },
    {
      label: "Weekly",
      detail: "Last 7 days",
      summary: buildPeriodSummary(snapshot.visits, weekStart),
      accent: "border-[#cce8d8] bg-[#f2fbf6]",
    },
    {
      label: "Monthly",
      detail: "Current month",
      summary: buildPeriodSummary(snapshot.visits, monthStart),
      accent: "border-[#f3ddb2] bg-[#fff8ea]",
    },
  ];

  const lowStockMedicines = snapshot.medicines
    .filter((medicine) => medicine.stock <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.stock - b.stock);
  const totalStock = snapshot.medicines.reduce((sum, medicine) => sum + medicine.stock, 0);
  const waitingCount = snapshot.visits.filter((visit) => visit.status === "Waiting").length;
  const consultingCount = snapshot.visits.filter(
    (visit) => visit.status === "In Consultation",
  ).length;
  const billingCount = snapshot.visits.filter(
    (visit) => visit.status === "Ready for Billing",
  ).length;

  return (
    <DashboardShell
      activeHref="/admin/overview"
      navItems={navItems}
      session={session}
      subtitle="Clinic performance, patient flow, billing revenue, and medicine readiness."
      title="Admin workspace"
    >
      <section data-ui="admin-summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link className="group rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2f80ed] hover:shadow-[0_18px_48px_rgba(8,42,96,0.12)] focus:outline-none focus:ring-4 focus:ring-[#d8e8ff]" href="/admin/patients">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ff] text-lg font-bold text-[#0b2a5b]">
            <MetricIcon type="patients" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#61758a]">Registered patients</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#071b33]">
            {snapshot.patients.filter((patient) => !patient.archivedAt).length}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#61758a]">
            <span>Total patient records</span>
            <span className="font-semibold text-[#2f80ed]">View patients</span>
          </div>
        </Link>
        <Link className="group rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2f80ed] hover:shadow-[0_18px_48px_rgba(8,42,96,0.12)] focus:outline-none focus:ring-4 focus:ring-[#d8e8ff]" href="/admin/stock">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ff] text-lg font-bold text-[#0b2a5b]">
            <MetricIcon type="medicine" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#61758a]">Medicines</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#071b33]">
            {snapshot.medicines.length}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#61758a]">
            <span>Medicine types in inventory</span>
            <span className="font-semibold text-[#2f80ed]">Manage</span>
          </div>
        </Link>
        <Link className="group rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2f80ed] hover:shadow-[0_18px_48px_rgba(8,42,96,0.12)] focus:outline-none focus:ring-4 focus:ring-[#d8e8ff]" href="/admin/stock">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ff] text-lg font-bold text-[#0b2a5b]">
            <MetricIcon type="stock" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#61758a]">Current stock</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#071b33]">
            {totalStock.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#61758a]">
            <span>Combined units available</span>
            <span className="font-semibold text-[#2f80ed]">View stock</span>
          </div>
        </Link>
        <Link href="/admin/stock?view=low" className={`group rounded-[20px] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(8,42,96,0.12)] focus:outline-none focus:ring-4 focus:ring-rose-100 ${
          lowStockMedicines.length
            ? "border-amber-200 bg-amber-50 shadow-amber-100/70"
            : "border-emerald-200 bg-emerald-50 shadow-emerald-100/70"
        }`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
            lowStockMedicines.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
          }`}>
            <MetricIcon type="alert" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">Stock reminders</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${
            lowStockMedicines.length ? "text-amber-800" : "text-emerald-700"
          }`}>
            {lowStockMedicines.length}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>{lowStockMedicines.length ? `At or below ${LOW_STOCK_LIMIT} units` : "All stock levels are healthy"}</span>
            <span className={`font-semibold ${lowStockMedicines.length ? "text-amber-800" : "text-emerald-700"}`}>Review</span>
          </div>
        </Link>
      </section>

      <section data-ui="admin-activity">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Clinic activity</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">
              Daily, weekly, monthly
            </h3>
          </div>
          <p className="rounded-full border border-[#d8e4ec] bg-white px-4 py-2 text-sm font-medium text-[#61758a]">Updated {now.toLocaleString()}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {periods.map(({ label, detail, summary, accent }) => (
            <article className={`rounded-[22px] border p-5 shadow-sm ${accent}`} key={label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-[#071b33]">{label}</p>
                  <p className="mt-1 text-sm text-[#61758a]">{detail}</p>
                </div>
                <span className="rounded-full bg-[#e7f0ff] px-3 py-1 text-xs font-semibold text-[#0b2a5b]">
                  {summary.completed} paid
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Patients</p>
                  <p className="mt-2 text-2xl font-semibold text-[#071b33]">{summary.patients}</p>
                  <p className="mt-1 text-xs text-[#61758a]">{summary.visits} visits</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61758a]">Medicine</p>
                  <p className="mt-2 text-2xl font-semibold text-[#071b33]">{summary.medicineUnits}</p>
                  <p className="mt-1 text-xs text-[#61758a]">units issued</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Completed revenue</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    MMK
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">{summary.revenue.toLocaleString()} MMK</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section data-ui="admin-workflow" className="grid gap-5 xl:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)]">
        <article className="rounded-[22px] border border-[#d8e4ec] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Live workflow</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">
            Patients right now
          </h3>
          <div className="mt-5 grid gap-3">
            {[
              ["Waiting", waitingCount, "bg-amber-100 text-amber-800"],
              ["With doctor", consultingCount, "bg-[#e7f0ff] text-[#0b2a5b]"],
              ["Ready for billing", billingCount, "bg-emerald-100 text-emerald-800"],
            ].map(([label, value, color]) => (
              <div className="flex items-center justify-between rounded-2xl border border-[#d8e4ec] bg-[#f7fafc] p-4" key={label}>
                <span className="text-sm font-semibold text-[#071b33]">{label}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </article>

        <article data-ui="admin-low-stock" className="min-w-0 overflow-hidden rounded-[22px] border border-[#d8e4ec] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e4ec] px-6 py-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Reminder</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">
                Low medicine stock
              </h3>
            </div>
            <Link className="rounded-full bg-[#0b2a5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08234c]" href="/admin/stock">
              Manage stock
            </Link>
          </div>
          {lowStockMedicines.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-[#f7fafc] text-xs uppercase tracking-[0.1em] text-[#61758a]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medicine</th>
                    <th className="px-4 py-4 font-semibold">Current</th>
                    <th className="px-4 py-4 font-semibold">Limit</th>
                    <th className="px-6 py-4 font-semibold">Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e4ec]">
                  {lowStockMedicines.map((medicine) => (
                    <tr key={medicine.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#071b33]">{medicine.name}</p>
                        <p className="mt-1 text-xs text-[#61758a]">Expires {medicine.expiry}</p>
                      </td>
                      <td className={`px-4 py-4 text-sm font-semibold tabular-nums ${medicine.stock === 0 ? "text-rose-700" : "text-amber-800"}`}>
                        {medicine.stock} {medicine.unit}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#61758a]">{LOW_STOCK_LIMIT}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          medicine.stock === 0
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {medicine.stock === 0 ? "Out of stock" : "Restock soon"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MetricIcon type="stock" />
              </div>
              <p className="mt-4 font-semibold text-[#071b33]">Stock levels look healthy</p>
              <p className="mt-1 text-sm text-[#61758a]">
                No low-stock reminders. Every medicine is above {LOW_STOCK_LIMIT} units.
              </p>
            </div>
          )}
        </article>
      </section>
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/dashboard-shell";
import { ReceptionQueueActions } from "@/components/reception-queue-actions";
import { requireSession } from "@/lib/auth";
import { getClinicSnapshot } from "@/lib/clinic-server";

const navItems = [
  { href: "/reception/overview", label: "Overview" },
  { href: "/reception/patients", label: "Patients" },
  { href: "/reception/queue", label: "Queue" },
  { href: "/reception/billing", label: "Billing" },
  { href: "/reception/stock", label: "Medicine Stock" },
];

export const dynamic = "force-dynamic";

export default async function ReceptionQueuePage() {
  const session = await requireSession(["reception"]);
  const snapshot = await getClinicSnapshot();
  const visits = snapshot.visits
    .filter((visit) => visit.status === "Waiting" || visit.status === "In Consultation")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <DashboardShell
      activeHref="/reception/queue"
      navItems={navItems}
      session={session}
      subtitle="Follow the active patient order and see who is waiting or with the doctor."
      title="Reception dashboard"
    >
      <section className="overflow-hidden rounded-[20px] border border-[#d8e4ec] bg-white shadow-sm">
        <div className="border-b border-[#d8e4ec] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Live queue</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#071b33]">
            {visits.length} active patient{visits.length === 1 ? "" : "s"}
          </h3>
          <p className="mt-2 text-sm text-[#61758a]">Active visits across all check-in dates, listed in check-in order.</p>
        </div>
        {visits.length ? <div aria-hidden="true" className="reception-queue-row bg-[#f7fafc] px-6 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#61758a]">
          <span>No.</span><span>Patient</span><span>Checked in</span><span>Status</span><span>Actions</span>
        </div> : null}
        <div className="divide-y divide-[#e7eef3]">
          {visits.map((visit, index) => (
            <article className="reception-queue-row px-6 py-4 transition-colors hover:bg-[#fbfdff]" key={visit.id}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e4ec] bg-[#f7fafc] text-sm font-semibold tabular-nums text-[#0b2a5b]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-[#071b33]">{visit.patientName}</p>
                <p className="mt-1 text-xs font-medium text-[#2f80ed]">{visit.patientCode}</p>
              </div>
              <p className="text-sm tabular-nums text-[#61758a]">{new Date(visit.createdAt).toLocaleString()}</p>
              <span className={`justify-self-start rounded-full px-3 py-1.5 text-xs font-semibold ${
                visit.status === "In Consultation"
                  ? "bg-[#e7f0ff] text-[#0b2a5b]"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {visit.status === "In Consultation" ? "With doctor" : "Waiting"}
              </span>
              <ReceptionQueueActions
                inConsultation={visit.status === "In Consultation"}
                patientName={visit.patientName}
                symptoms={visit.symptoms}
                visitId={visit.id}
              />
            </article>
          ))}
          {!visits.length ? (
            <div className="px-6 py-12 text-center">
              <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f0ff] text-[#0b2a5b]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 2" /></svg>
              </span>
              <p className="mt-4 text-sm font-semibold text-[#071b33]">No patients in the active queue</p>
              <p className="mt-1 text-sm text-[#61758a]">Patients appear here after check-in from Patients.</p>
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

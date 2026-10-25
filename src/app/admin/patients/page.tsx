import { DashboardShell } from "@/components/dashboard-shell";
import { PatientDirectory } from "@/components/patient-directory";
import { requireSession } from "@/lib/auth";
import { getClinicSnapshot } from "@/lib/clinic-server";

const navItems = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/stock", label: "Medicine Stocks" },
];

export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  const session = await requireSession(["admin"]);
  const snapshot = await getClinicSnapshot();

  return (
    <DashboardShell
      activeHref="/admin/patients"
      navItems={navItems}
      session={session}
      subtitle="Search, scan, and review registered clinic patient records."
      title="Admin workspace"
    >
      <PatientDirectory patients={snapshot.patients.filter((patient) => !patient.archivedAt)} />
    </DashboardShell>
  );
}

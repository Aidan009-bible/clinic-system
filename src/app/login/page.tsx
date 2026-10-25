import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { demoClinicSnapshot } from "@/lib/demo-data";
import { getRoleHome, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(getRoleHome(session.role));
  }

  const roleSummaries = demoClinicSnapshot.users.map((user) => ({
    ...user,
    label:
      user.role === "admin"
        ? "Admin"
        : user.role === "doctor"
          ? "Doctor"
          : "Reception",
  }));
  const workflowChips = [
    "Patient queue",
    "Consultation",
    "Billing counter",
    "Medicine stock",
    "Daily reports",
  ];
  const trustBadges = [
    ["Role-based access", "Admin, Doctor, Reception"],
    ["Connected workflow", "Check-in through billing"],
  ];
  return (
    <main className="min-h-screen bg-[#f2f6f9] text-[#071b33]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-7 lg:px-10">
        <section className="overflow-hidden rounded-[24px] border border-[#d8e4ec] bg-white shadow-[0_12px_48px_rgba(7,27,51,0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_440px]">
            <div className="relative order-2 flex flex-col justify-between overflow-hidden p-5 sm:p-9 lg:order-1 lg:p-10">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b2a5b] text-xl font-bold text-white">
                      +
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-[#071b33]">ClinicPro</p>
                      <p className="text-sm text-[#61758a]">Staff workflow system</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">
                    Clinical operations portal
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-[#082a60] xl:text-5xl">
                    Your clinic, organized clearly.
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#61758a]">
                    One workspace for patient check-in, consultations, billing, and medicine stock.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {workflowChips.map((chip) => (
                    <span
                      className="rounded-full border border-[#d8e4ec] bg-[#f7fafc] px-2.5 py-1.5 text-xs font-medium text-[#61758a]"
                      key={chip}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="mt-7 rounded-2xl border border-[#dce8f5] bg-[#f4f8ff] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#0b2a5b]">Connected clinic workflow</p>
                    <span className="rounded-full border border-[#d8e4ec] bg-white px-2.5 py-1 text-[11px] font-medium text-[#61758a]">Workflow preview</span>
                  </div>
                  <div className="mt-4 grid gap-0 divide-y divide-[#dce8f5]">
                    {[
                      ["01", "Check-in", "Reception registers the visit", "bg-amber-100 text-amber-800"],
                      ["02", "Consultation", "Doctor records care and prescriptions", "bg-[#e7f0ff] text-[#0b2a5b]"],
                      ["03", "Billing", "Reception reviews charges and issues the slip", "bg-emerald-100 text-emerald-800"],
                    ].map(([step, title, detail, tone]) => (
                      <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={step}>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tabular-nums ${tone}`}>{step}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#071b33]">{title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[#61758a]">{detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <aside className="order-1 flex min-w-0 items-center bg-[#f7fafc] p-3 sm:p-7 lg:order-2 lg:border-l lg:border-[#d8e4ec]">
              <div className="w-full min-w-0 rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">
                    Staff sign in
                  </span>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#071b33]">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#61758a]">
                    Sign in to your clinic workspace.
                  </p>
                </div>

                <LoginForm />

                <div className="mt-5 rounded-xl border border-[#d8e4ec] bg-[#f7fafc] p-4">
                  <p className="text-xs font-semibold text-[#071b33]">Demo accounts <span className="font-normal text-[#61758a]">· For this demo</span></p>
                  <div className="mt-3 grid gap-2">
                    {roleSummaries.map((user) => (
                      <div className="flex items-center justify-between gap-3 text-xs" key={user.username}>
                        <span className="font-medium text-[#0b2a5b]">{user.label}</span>
                        <span className="whitespace-nowrap font-mono text-[11px] text-[#61758a]">
                          {user.username} / {user.password}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e7eef3] pt-4">
                  {trustBadges.map(([title, detail]) => (
                    <div key={title}>
                      <p className="text-xs font-medium text-[#61758a]">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#61758a]">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

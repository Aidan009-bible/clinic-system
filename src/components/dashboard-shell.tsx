"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/components/logout-button";
import type { AuthSession, DashboardNavItem } from "@/lib/types";

function NavIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();

  if (normalized.includes("overview")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    );
  }

  if (normalized.includes("waiting") || normalized.includes("queue")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (normalized.includes("patient") || normalized.includes("history")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path strokeLinecap="round" d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
        <path strokeLinecap="round" d="M15 6.5a3 3 0 0 1 0 5.5M16 14c2.5.3 4 2 4.5 4.5" />
      </svg>
    );
  }

  if (normalized.includes("billing")) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path strokeLinecap="round" d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7l4-4Z" />
      <path strokeLinecap="round" d="m8 12 4 4" />
    </svg>
  );
}

function getRoleHome(role: AuthSession["role"]) {
  if (role === "admin") {
    return "/admin/overview";
  }

  if (role === "reception") {
    return "/reception/overview";
  }

  return "/doctor/overview";
}

export function DashboardShell({
  session,
  title,
  subtitle,
  navItems,
  activeHref,
  children,
}: {
  session: AuthSession;
  title: string;
  subtitle: string;
  navItems: DashboardNavItem[];
  activeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeItem = navItems.find((item) => item.href === activeHref) ?? navItems[0];

  return (
    <main data-ui="dashboard" className="min-h-screen bg-[#f2f6f9] text-[#071b33]">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className={`grid gap-5 transition-[grid-template-columns] duration-300 ${
          collapsed
            ? "lg:grid-cols-[88px_minmax(0,1fr)]"
            : "lg:grid-cols-[280px_minmax(0,1fr)]"
        }`}>
          <aside data-ui="sidebar" data-menu-open={mobileMenuOpen} className={`min-w-0 rounded-[24px] border border-[#d8e4ec] bg-white p-4 text-[#071b33] shadow-[0_16px_48px_rgba(8,42,96,0.08)] transition-all duration-300 lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)] lg:overflow-y-auto ${
            collapsed ? "lg:px-3" : ""
          }`}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "lg:hidden" : ""}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2a5b] text-xl font-bold text-white">
                    +
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#071b33]">ClinicPro</p>
                    <p className="truncate text-xs capitalize text-[#61758a]">{session.role} workspace</p>
                  </div>
                </div>
                <button
                  aria-controls="workspace-navigation"
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d8e4ec] bg-[#f7fafc] text-[#0b2a5b] lg:hidden"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d={mobileMenuOpen ? "M6 6l12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
                <button
                  aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
                  className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e4ec] bg-[#f7fafc] text-[#61758a] transition hover:border-[#2f80ed] hover:text-[#0b2a5b] lg:flex ${
                    collapsed ? "mx-auto" : ""
                  }`}
                  onClick={() => setCollapsed((current) => !current)}
                  title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
                  type="button"
                >
                  <svg aria-hidden="true" className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              </div>

              <div data-ui="account" className={`mt-5 rounded-2xl border border-[#d8e4ec] bg-[#f7fafc] px-3 py-2.5 ${collapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-xs text-[#61758a]">Signed in as</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#071b33]">{session.username}</p>
              </div>

              <nav aria-label="Workspace navigation" id="workspace-navigation" className="mt-6 flex flex-col gap-2">
                <p className={`px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca0b4] ${collapsed ? "lg:hidden" : ""}`}>
                  Navigation
                </p>
                {navItems.map((item) => {
                  const active = item.href === activeHref;

                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-12 items-center gap-3 rounded-xl border text-sm font-medium transition ${
                        collapsed ? "lg:justify-center lg:px-0" : "px-3"
                      } ${
                        active
                          ? "border-[#d8e4ec] bg-[#e7f0ff] text-[#0b2a5b]"
                          : "border-transparent text-[#61758a] hover:border-[#d8e4ec] hover:bg-[#f7fafc] hover:text-[#0b2a5b]"
                      }`}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      key={item.href}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && !collapsed ? (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#2f80ed]" />
                      ) : null}
                      <span className={active ? "shrink-0 text-[#2f80ed]" : "shrink-0"}><NavIcon label={item.label} /></span>
                      <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                      <span className="sr-only">{collapsed ? item.label : ""}</span>
                    </Link>
                  );
                })}
              </nav>

              <div data-ui="sidebar-footer" className="mt-auto flex flex-wrap gap-2 pt-6 lg:flex-col">
                <Link
                  className={`flex min-h-11 items-center gap-3 rounded-xl border border-[#d8e4ec] bg-white text-sm font-medium text-[#0b2a5b] transition hover:bg-[#f7fafc] ${
                    collapsed ? "lg:justify-center lg:px-0" : "px-3"
                  }`}
                  href="/"
                  title={collapsed ? "Home" : undefined}
                >
                  <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />
                  </svg>
                  <span className={collapsed ? "lg:hidden" : ""}>Home</span>
                </Link>
                <LogoutButton compact={collapsed} />
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <header data-ui="page-header" className="rounded-[24px] border border-[#d8e4ec] bg-white px-6 py-6 shadow-[0_16px_48px_rgba(8,42,96,0.08)]">
              <button
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8e4ec] bg-[#f7fafc] px-3 py-2 text-sm font-semibold text-[#0b2a5b] transition hover:border-[#2f80ed] hover:bg-[#e7f0ff]"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                    return;
                  }

                  router.push(getRoleHome(session.role));
                }}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
                </svg>
                Back
              </button>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2f80ed]">{title}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#071b33] sm:text-4xl">
                {activeItem?.label ?? title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#61758a]">{subtitle}</p>
            </header>

            <div className="mt-6 flex flex-col gap-6">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Global radar", note: "Opportunity feed" },
  { href: "/live", label: "Live monitor", note: "Auto-refresh leads" },
  { href: "/leads", label: "Leads", note: "CRM-ready export" },
  { href: "/settings", label: "Signal profiles", note: "Regions and targets" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--rule)] px-5 py-6">
      <div>
        <p className="kicker">Public-source intelligence</p>
        <h1 className="mt-2 text-2xl leading-tight">Global Opportunity Radar</h1>
      </div>
      <nav className="mt-10 flex flex-col gap-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-l px-3 py-2 transition ${
                active
                  ? "border-[var(--brass)] text-[var(--paper)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--rule)] hover:text-[var(--paper)]"
              }`}
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="kicker mt-1">{item.note}</div>
            </Link>
          );
        })}
      </nav>

      <div className="data-mono mt-12 border-t border-[var(--rule)] pt-6 text-[var(--muted)]">
        <div>grid: gb/us/eu</div>
        <div className="mt-2">mode: console</div>
      </div>
    </aside>
  );
}

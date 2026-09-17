"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Global Radar", note: "Live opportunity feed" },
  { href: "/live", label: "Live Monitor", note: "Auto-refresh prospects" },
  { href: "/settings", label: "Signal Profiles", note: "Brand and target setup" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--color-rule)] bg-[var(--color-panel)] p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">OSINT Opportunity AI</p>
        <h1 className="mt-2 text-2xl leading-tight">UK Market Intelligence</h1>
      </div>
      <nav className="mt-8 flex flex-col gap-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl border px-4 py-3 transition ${
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                  : "border-transparent hover:border-[var(--color-rule)]"
              }`}
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{item.note}</div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

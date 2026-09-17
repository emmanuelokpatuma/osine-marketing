"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Global Radar", note: "Opportunity feed" },
  { href: "/live", label: "Live Monitor", note: "Auto-refresh leads" },
  { href: "/settings", label: "Signal Profiles", note: "Regions and targets" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(27,35,25,0.98),rgba(45,58,34,0.96))] p-6 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Public-source intelligence</p>
        <h1 className="mt-2 text-2xl leading-tight text-white">Global Opportunity Radar</h1>
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
                  ? "border-[#a88a40] bg-[rgba(168,138,64,0.16)]"
                  : "border-transparent hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="mt-1 text-xs text-white/65">{item.note}</div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

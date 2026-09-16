"use client";

import { useEffect, useState } from "react";
import type { EntityRole, TrackedEntity, Workspace } from "@/types/osint";

type FormState = {
  name: string;
  role: EntityRole;
  keywords: string;
  countries: string;
  services: string;
  sector: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  role: "competitor",
  keywords: "",
  countries: "GB",
  services: "",
  sector: "",
};

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/entities", { cache: "no-store" });
    const data = (await response.json()) as Workspace;
    setWorkspace(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        role: form.role,
        keywords: form.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        countries: form.countries
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean),
        services: form.services
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        sector: form.sector.trim() || undefined,
      }),
    });

    setForm(EMPTY_FORM);
    setSaving(false);
    await load();
  }

  async function handleRemove(entity: TrackedEntity) {
    await fetch("/api/entities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entity.id }),
    });
    await load();
  }

  const entities = [
    ...(workspace?.brand ? [workspace.brand] : []),
    ...(workspace?.competitors ?? []),
  ];

  return (
    <div>
      <h2 className="text-3xl leading-tight">Signal Profiles</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Configure your brand and tracked entities. The opportunity engine uses these terms to match public signals.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid max-w-2xl gap-3 rounded-2xl border border-[var(--color-rule)] bg-white/85 p-5">
        <label className="grid gap-1 text-sm">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="Example: Harbor Retail Group"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Role
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as EntityRole })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
          >
            <option value="brand">Your Brand</option>
            <option value="competitor">Competitor / Target Account</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Services (comma-separated)
          <input
            value={form.services}
            onChange={(event) => setForm({ ...form, services: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="aws consulting, kubernetes, devsecops"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Keywords (comma-separated)
          <input
            value={form.keywords}
            onChange={(event) => setForm({ ...form, keywords: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="cloud migration, platform engineering"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Countries
            <input
              value={form.countries}
              onChange={(event) => setForm({ ...form, countries: event.target.value })}
              className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
              placeholder="GB"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Sector
            <input
              value={form.sector}
              onChange={(event) => setForm({ ...form, sector: event.target.value })}
              className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
              placeholder="Technology"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-fit rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <section className="mt-8">
        <h3 className="text-xl">Tracked Entities</h3>
        <div className="mt-3 rounded-2xl border border-[var(--color-rule)] bg-white/85">
          {entities.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-muted)]">No entities tracked yet.</p>
          ) : (
            entities.map((entity) => (
              <div key={entity.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-rule)] p-4 last:border-b-0">
                <div>
                  <div className="font-medium">{entity.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {entity.role} · {entity.countries.join(", ")} · {(entity.services ?? []).join(", ") || "no services"}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entity)}
                  className="text-xs font-medium text-[var(--color-danger)]"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

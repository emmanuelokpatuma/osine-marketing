"use client";

import { useState } from "react";
import type { ApiSourceDefinition, EntityRole, TrackedEntity, Workspace } from "@/types/osint";

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

export function SettingsClient({
  initialWorkspace,
  initialSources,
}: {
  initialWorkspace: Workspace;
  initialSources: ApiSourceDefinition[];
}) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [sources, setSources] = useState<ApiSourceDefinition[]>(initialSources);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function refreshSources(regions: string[]) {
    const response = await fetch(`/api/sources?regions=${encodeURIComponent(regions.join(","))}`);
    const data = (await response.json()) as { sources: ApiSourceDefinition[] };
    setSources(data.sources);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    const response = await fetch("/api/entities", {
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

    const data = (await response.json()) as Workspace;
    setWorkspace(data);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function handleRemove(entity: TrackedEntity) {
    const response = await fetch("/api/entities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entity.id }),
    });
    const data = (await response.json()) as Workspace;
    setWorkspace(data);
  }

  async function updateMonitorConfig(partial: Partial<Workspace["monitorConfig"]>) {
    const response = await fetch("/api/entities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monitorConfig: partial }),
    });
    const data = (await response.json()) as Workspace;
    setWorkspace(data);
    await refreshSources(data.monitorConfig.regions);
  }

  const entities = [
    ...(workspace.brand ? [workspace.brand] : []),
    ...workspace.competitors,
  ];

  return (
    <div>
      <h2 className="text-3xl leading-tight">Signal Profiles</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Define what you sell and where you sell it. The engine then hunts live public data for likely buyers.
      </p>

      <section className="mt-6 grid gap-4 rounded-2xl border border-[var(--color-rule)] bg-white/85 p-5 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          Refresh interval (seconds)
          <input
            type="number"
            min={15}
            value={workspace.monitorConfig.refreshSeconds}
            onChange={(event) => {
              const value = Number(event.target.value || "60");
              setWorkspace({ ...workspace, monitorConfig: { ...workspace.monitorConfig, refreshSeconds: value } });
            }}
            onBlur={() => updateMonitorConfig({ refreshSeconds: workspace.monitorConfig.refreshSeconds })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Min score threshold
          <input
            type="number"
            min={0}
            max={100}
            value={workspace.monitorConfig.minOpportunityScore}
            onChange={(event) => {
              const value = Number(event.target.value || "45");
              setWorkspace({ ...workspace, monitorConfig: { ...workspace.monitorConfig, minOpportunityScore: value } });
            }}
            onBlur={() => updateMonitorConfig({ minOpportunityScore: workspace.monitorConfig.minOpportunityScore })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Regions (CSV)
          <input
            value={workspace.monitorConfig.regions.join(",")}
            onChange={(event) => {
              const regions = event.target.value
                .split(",")
                .map((item) => item.trim().toUpperCase())
                .filter(Boolean);
              setWorkspace({ ...workspace, monitorConfig: { ...workspace.monitorConfig, regions } });
            }}
            onBlur={() => updateMonitorConfig({ regions: workspace.monitorConfig.regions })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
          />
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-rule)] bg-white/85 p-5">
        <h3 className="text-lg">Available Free APIs For Selected Regions</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {sources.map((source) => (
            <a
              key={source.key}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[var(--color-rule)] px-3 py-2 hover:bg-[var(--color-panel)]"
            >
              <div className="text-sm font-medium">{source.name}</div>
              <div className="text-xs text-[var(--color-muted)]">
                {source.category} · {source.access} · {source.status}
              </div>
            </a>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mt-8 grid max-w-2xl gap-3 rounded-2xl border border-[var(--color-rule)] bg-white/85 p-5">
        <label className="grid gap-1 text-sm">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="Example: Manchester Logistics Group"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Role
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as EntityRole })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
          >
            <option value="brand">Your Brand (used for prospect discovery)</option>
            <option value="competitor">Competitor / Named account monitor</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Services (comma-separated)
          <input
            value={form.services}
            onChange={(event) => setForm({ ...form, services: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="cybersecurity, tender writing, solar installation"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Buying keywords (comma-separated)
          <input
            value={form.keywords}
            onChange={(event) => setForm({ ...form, keywords: event.target.value })}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
            placeholder="cloud migration, aws jobs, procurement"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Countries
            <input
              value={form.countries}
              onChange={(event) => setForm({ ...form, countries: event.target.value })}
              className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-panel)] px-3 py-2"
              placeholder="GB,US"
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
          {saving ? "Saving..." : "Save Entity"}
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

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface OrgDetail {
  id: string;
  name: string;
  org_display_name: string | null;
  legal_name: string | null;
  website: string | null;
  org_type: string | null;
  mission_statement: string | null;
  plan_tier: string;
  brand_primary: string | null;
  brand_logo_url: string | null;
  users: {
    user_id: string;
    email: string;
    name: string | null;
    role: string;
    last_active: string | null;
  }[];
  projects: {
    id: string;
    name: string;
    status: string;
    project_type: string;
    updated_at: string;
  }[];
}

export default function AdminOrgDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/org/${orgId}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const { org: orgData, users, projects } = await res.json();
        setOrg({
          ...orgData,
          users: users ?? [],
          projects: projects ?? [],
        });
      } catch {
        // fetch failed
      }
      setLoading(false);
    }
    load();
  }, [orgId]);

  async function handlePlanChange(newTier: string) {
    if (!org) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change_plan",
        org_id: org.id,
        plan_tier: newTier,
      }),
    });
    if (res.ok) {
      setOrg({ ...org, plan_tier: newTier });
      setMessage("Plan updated.");
    } else {
      setMessage("Failed to update plan.");
    }
    setSaving(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !org) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite_user",
        org_id: org.id,
        email: inviteEmail.trim(),
      }),
    });
    if (res.ok) {
      setMessage(`Invite sent to ${inviteEmail}.`);
      setInviteEmail("");
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to send invite.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-[#EDE8DE]/50">Loading...</p>;
  }
  if (!org) {
    return <p className="text-[#EDE8DE]/50">Org not found.</p>;
  }

  return (
    <div>
      <Link
        href="/admin/orgs"
        className="text-[#3A6B8A] hover:text-[#5a8fad] text-sm mb-4 inline-block"
      >
        ← Back to Orgs
      </Link>

      <h1
        className="text-2xl text-[#E9C03A] mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
        }}
      >
        {org.org_display_name ?? org.name ?? "Organization"}
      </h1>

      {message && (
        <div className="mb-4 px-4 py-2 rounded bg-[#1D9E75]/20 text-[#1D9E75] text-sm">
          {message}
        </div>
      )}

      {/* Org Profile */}
      <div className="bg-[#0f1c27] rounded-lg p-6 border border-[#3A6B8A]/20 mb-6">
        <h2 className="text-[#EDE8DE] font-semibold text-sm mb-4">
          Org Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#EDE8DE]/50">Display Name</span>
            <p className="text-[#EDE8DE]">
              {org.org_display_name ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Legal Name</span>
            <p className="text-[#EDE8DE]">{org.legal_name ?? "—"}</p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Website</span>
            <p className="text-[#EDE8DE]">{org.website ?? "—"}</p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Org Type</span>
            <p className="text-[#EDE8DE]">{org.org_type ?? "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[#EDE8DE]/50">Mission Statement</span>
            <p className="text-[#EDE8DE]">
              {org.mission_statement ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#0f1c27] rounded-lg p-6 border border-[#3A6B8A]/20 mb-6">
        <h2 className="text-[#EDE8DE] font-semibold text-sm mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[#EDE8DE]/50 text-xs block mb-1">
              Plan Tier
            </label>
            <select
              value={org.plan_tier}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={saving}
              className="px-3 py-2 rounded bg-[#1B2B3A] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div>
            <label className="text-[#EDE8DE]/50 text-xs block mb-1">
              Invite User by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="px-3 py-2 rounded bg-[#1B2B3A] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm placeholder:text-[#EDE8DE]/30"
              />
              <button
                onClick={handleInvite}
                disabled={saving || !inviteEmail.trim()}
                className="px-4 py-2 rounded text-sm font-medium bg-[#E9C03A] text-[#1B2B3A] hover:bg-[#f5e08a] transition-colors disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Kit Summary */}
      <div className="bg-[#0f1c27] rounded-lg p-6 border border-[#3A6B8A]/20 mb-6">
        <h2 className="text-[#EDE8DE] font-semibold text-sm mb-4">
          Brand Kit
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#EDE8DE]/50">Primary Color:</span>
            {org.brand_primary ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-white/20"
                  style={{ backgroundColor: org.brand_primary }}
                />
                <span className="text-[#EDE8DE] font-mono text-xs">
                  {org.brand_primary}
                </span>
              </div>
            ) : (
              <span className="text-[#EDE8DE]/40">Not set</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#EDE8DE]/50">Logo:</span>
            <span className="text-[#EDE8DE]">
              {org.brand_logo_url ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Users in org */}
      <div className="bg-[#EDE8DE] rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#d8d2c4]">
          <h2 className="text-[#1B2B3A] font-semibold text-sm">Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {org.users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-center text-[#1B2B3A]/40"
                >
                  No users
                </td>
              </tr>
            ) : (
              org.users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/users/${u.user_id}`}
                      className="text-[#3A6B8A] hover:underline"
                    >
                      {u.email || u.user_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 capitalize text-[#1B2B3A]/70">
                    {u.role}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Projects */}
      <div className="bg-[#EDE8DE] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#d8d2c4]">
          <h2 className="text-[#1B2B3A] font-semibold text-sm">Projects</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Last Touched</th>
            </tr>
          </thead>
          <tbody>
            {org.projects.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-[#1B2B3A]/40"
                >
                  No projects
                </td>
              </tr>
            ) : (
              org.projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2 text-[#1B2B3A]">{p.name}</td>
                  <td className="px-4 py-2 capitalize text-[#1B2B3A]/70">
                    {p.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {p.project_type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/50">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

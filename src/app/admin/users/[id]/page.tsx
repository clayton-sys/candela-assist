"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  user_id: string;
  email: string;
  name: string | null;
  org_id: string;
  org_name: string;
  plan_tier: string;
  created_at: string;
  last_active: string | null;
  disabled: boolean;
  projects: {
    id: string;
    name: string;
    status: string;
    updated_at: string;
  }[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      // Get org_user
      const { data: orgUser } = await supabase
        .from("org_users")
        .select(
          "user_id, disabled, created_at, org_id, orgs(id, name, org_display_name, plan_tier)"
        )
        .eq("user_id", userId)
        .single();

      if (!orgUser) {
        setLoading(false);
        return;
      }

      const org = orgUser.orgs as unknown as {
        id: string;
        name: string;
        org_display_name: string | null;
        plan_tier: string;
      } | null;

      // Get user email via API
      let email = "";
      let name: string | null = null;
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: [userId] }),
        });
        if (res.ok) {
          const { emails } = await res.json();
          email = emails[userId]?.email ?? "";
          name = emails[userId]?.name ?? null;
        }
      } catch {
        // fallback
      }

      // Get projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, status, updated_at")
        .eq("org_id", org?.id ?? "")
        .order("updated_at", { ascending: false });

      const lastProject = projects?.[0];

      setUser({
        user_id: userId,
        email,
        name,
        org_id: org?.id ?? "",
        org_name: org?.org_display_name ?? org?.name ?? "—",
        plan_tier: org?.plan_tier ?? "starter",
        created_at: orgUser.created_at,
        last_active: lastProject?.updated_at ?? null,
        disabled: orgUser.disabled,
        projects: projects ?? [],
      });
      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  async function handlePlanChange(newTier: string) {
    if (!user) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change_plan",
        org_id: user.org_id,
        plan_tier: newTier,
      }),
    });
    if (res.ok) {
      setUser({ ...user, plan_tier: newTier });
      setMessage("Plan updated.");
    } else {
      setMessage("Failed to update plan.");
    }
    setSaving(false);
  }

  async function handleToggleDisable() {
    if (!user) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: user.disabled ? "enable_user" : "disable_user",
        user_id: user.user_id,
      }),
    });
    if (res.ok) {
      setUser({ ...user, disabled: !user.disabled });
      setMessage(user.disabled ? "User re-enabled." : "User disabled.");
    } else {
      setMessage("Failed to update user status.");
    }
    setSaving(false);
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "password_reset",
        email: user.email,
      }),
    });
    if (res.ok) {
      setMessage("Password reset email sent.");
    } else {
      setMessage("Failed to send password reset.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-[#EDE8DE]/50">Loading...</p>;
  }
  if (!user) {
    return <p className="text-[#EDE8DE]/50">User not found.</p>;
  }

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-[#3A6B8A] hover:text-[#5a8fad] text-sm mb-4 inline-block"
      >
        ← Back to Users
      </Link>

      <h1
        className="text-2xl text-[#E9C03A] mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
        }}
      >
        User Detail
      </h1>

      {message && (
        <div className="mb-4 px-4 py-2 rounded bg-[#1D9E75]/20 text-[#1D9E75] text-sm">
          {message}
        </div>
      )}

      {/* User info */}
      <div className="bg-[#0f1c27] rounded-lg p-6 border border-[#3A6B8A]/20 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#EDE8DE]/50">Email</span>
            <p className="text-[#EDE8DE]">{user.email || "—"}</p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Name</span>
            <p className="text-[#EDE8DE]">{user.name ?? "—"}</p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Supabase User ID</span>
            <p className="text-[#EDE8DE] font-mono text-xs break-all">
              {user.user_id}
            </p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Org</span>
            <p className="text-[#EDE8DE]">
              <Link
                href={`/admin/orgs/${user.org_id}`}
                className="text-[#3A6B8A] hover:underline"
              >
                {user.org_name}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Signup Date</span>
            <p className="text-[#EDE8DE]">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Last Active</span>
            <p className="text-[#EDE8DE]">
              {user.last_active
                ? new Date(user.last_active).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-[#EDE8DE]/50">Status</span>
            <p>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user.disabled
                    ? "bg-[#D85A30]/20 text-[#D85A30]"
                    : "bg-[#1D9E75]/20 text-[#1D9E75]"
                }`}
              >
                {user.disabled ? "Disabled" : "Active"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#0f1c27] rounded-lg p-6 border border-[#3A6B8A]/20 mb-6">
        <h2 className="text-[#EDE8DE] font-semibold text-sm mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Plan tier change */}
          <div>
            <label className="text-[#EDE8DE]/50 text-xs block mb-1">
              Plan Tier
            </label>
            <select
              value={user.plan_tier}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={saving}
              className="px-3 py-2 rounded bg-[#1B2B3A] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Disable / Enable */}
          <button
            onClick={handleToggleDisable}
            disabled={saving}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              user.disabled
                ? "bg-[#1D9E75] text-white hover:bg-[#1D9E75]/80"
                : "bg-[#D85A30] text-white hover:bg-[#D85A30]/80"
            }`}
          >
            {user.disabled ? "Re-enable Account" : "Disable Account"}
          </button>

          {/* Password reset */}
          <button
            onClick={handlePasswordReset}
            disabled={saving || !user.email}
            className="px-4 py-2 rounded text-sm font-medium bg-[#3A6B8A] text-white hover:bg-[#5a8fad] transition-colors disabled:opacity-50"
          >
            Send Password Reset
          </button>
        </div>
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
              <th className="px-4 py-2">Last Touched</th>
            </tr>
          </thead>
          <tbody>
            {user.projects.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-center text-[#1B2B3A]/40"
                >
                  No projects
                </td>
              </tr>
            ) : (
              user.projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2 text-[#1B2B3A]">{p.name}</td>
                  <td className="px-4 py-2 capitalize text-[#1B2B3A]/70">
                    {p.status.replace("_", " ")}
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

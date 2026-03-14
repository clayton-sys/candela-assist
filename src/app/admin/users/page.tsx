"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserRow {
  user_id: string;
  email: string;
  name: string | null;
  org_name: string;
  org_id: string;
  plan_tier: string;
  created_at: string;
  last_active: string | null;
  disabled: boolean;
}

interface OrgOption {
  id: string;
  label: string;
}

type SortKey = "created_at" | "last_active" | "org_name";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("created_at");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY! },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { users: data } = await res.json();
      setUsers(data ?? []);
    } catch {
      // fetch failed
    }
    setLoading(false);
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orgs", {
        headers: { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY! },
      });
      if (!res.ok) return;
      const { orgs: data } = await res.json();
      if (data) {
        setOrgs(
          data.map((o: { id: string; org_display_name: string | null; name: string | null }) => ({
            id: o.id,
            label: o.org_display_name ?? o.name ?? "Unnamed",
          }))
        );
      }
    } catch {
      // fetch failed
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrgs();
  }, [fetchUsers, fetchOrgs]);

  async function handleInvite() {
    if (!inviteEmail || !inviteOrgId) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite_user",
          email: inviteEmail,
          org_id: inviteOrgId,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite user");
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.org_name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "created_at")
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sortBy === "last_active") {
      const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
      const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
      return bTime - aTime;
    }
    return a.org_name.localeCompare(b.org_name);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl text-[#E9C03A]"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          All Users
        </h1>
        <button
          onClick={() => {
            setShowInvite(true);
            setInviteSuccess(null);
            setInviteError(null);
          }}
          className="px-4 py-2 rounded-lg bg-[#E9C03A] text-[#1B2B3A] text-sm font-semibold hover:bg-[#f5e08a] transition-colors"
        >
          Invite User
        </button>
      </div>

      {/* Invite User Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1B2B3A] rounded-lg border border-[#3A6B8A]/30 p-6 w-full max-w-md mx-4">
            <h2
              className="text-lg text-[#E9C03A] mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}
            >
              Invite User
            </h2>

            {inviteSuccess && (
              <div className="mb-4 px-3 py-2 rounded bg-[#1D9E75]/20 text-[#1D9E75] text-sm">
                {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div className="mb-4 px-3 py-2 rounded bg-[#D85A30]/20 text-[#D85A30] text-sm">
                {inviteError}
              </div>
            )}

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 mb-4 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm placeholder:text-[#EDE8DE]/30 focus:outline-none focus:border-[#E9C03A]/50"
            />

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Organization
            </label>
            <select
              value={inviteOrgId}
              onChange={(e) => setInviteOrgId(e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
            >
              <option value="">Select an org...</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
              className="w-full px-3 py-2 mb-6 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-lg border border-[#3A6B8A]/30 text-[#EDE8DE]/70 text-sm hover:bg-[#0f1c27] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail || !inviteOrgId}
                className="px-4 py-2 rounded-lg bg-[#E9C03A] text-[#1B2B3A] text-sm font-semibold hover:bg-[#f5e08a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by email or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm placeholder:text-[#EDE8DE]/30 focus:outline-none focus:border-[#E9C03A]/50"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
        >
          <option value="created_at">Sort: Signup Date</option>
          <option value="last_active">Sort: Last Active</option>
          <option value="org_name">Sort: Org Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#EDE8DE] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Signup</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-[#1B2B3A]/40"
                >
                  Loading...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-[#1B2B3A]/40"
                >
                  No users found
                </td>
              </tr>
            ) : (
              sorted.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2">{u.email || u.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">{u.org_name}</td>
                  <td className="px-4 py-2 capitalize text-[#1B2B3A]/70">
                    {u.plan_tier}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/50">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/50">
                    {u.last_active
                      ? new Date(u.last_active).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.disabled
                          ? "bg-[#D85A30]/20 text-[#D85A30]"
                          : "bg-[#1D9E75]/20 text-[#1D9E75]"
                      }`}
                    >
                      {u.disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <Link
                      href={`/admin/users/${u.user_id}`}
                      className="text-[#3A6B8A] hover:underline text-xs"
                    >
                      View
                    </Link>
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

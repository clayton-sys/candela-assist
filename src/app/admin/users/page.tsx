"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
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

type SortKey = "created_at" | "last_active" | "org_name";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("created_at");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Fetch org_users with org data
    const { data: orgUsers } = await supabase
      .from("org_users")
      .select(
        "user_id, disabled, created_at, orgs(id, name, org_display_name, plan_tier)"
      )
      .order("created_at", { ascending: false });

    if (!orgUsers) {
      setLoading(false);
      return;
    }

    // Build user rows
    const rows: UserRow[] = [];
    for (const ou of orgUsers) {
      const org = ou.orgs as unknown as {
        id: string;
        name: string;
        org_display_name: string | null;
        plan_tier: string;
      } | null;

      // Get last active project for this user's org
      let lastActive: string | null = null;
      if (org) {
        const { data: proj } = await supabase
          .from("projects")
          .select("updated_at")
          .eq("org_id", org.id)
          .eq("created_by", ou.user_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastActive = proj?.updated_at ?? null;
      }

      rows.push({
        user_id: ou.user_id,
        email: "", // Will be filled by API
        name: null,
        org_name: org?.org_display_name ?? org?.name ?? "—",
        org_id: org?.id ?? "",
        plan_tier: org?.plan_tier ?? "starter",
        created_at: ou.created_at,
        last_active: lastActive,
        disabled: ou.disabled,
      });
    }

    // Fetch emails from admin API
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: rows.map((r) => r.user_id) }),
      });
      if (res.ok) {
        const { emails } = await res.json();
        for (const row of rows) {
          if (emails[row.user_id]) {
            row.email = emails[row.user_id].email ?? "";
            row.name = emails[row.user_id].name ?? null;
          }
        }
      }
    } catch {
      // Emails will remain empty
    }

    setUsers(rows);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      <h1
        className="text-2xl text-[#E9C03A] mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
        }}
      >
        All Users
      </h1>

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

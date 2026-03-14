"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrgRow {
  id: string;
  name: string;
  org_display_name: string | null;
  legal_name: string | null;
  plan_tier: string;
  created_at: string;
  userCount: number;
  projectCount: number;
}

export default function AdminOrgsPage() {
  const router = useRouter();
  const [orgData, setOrgData] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createLegalName, setCreateLegalName] = useState("");
  const [createPlanTier, setCreatePlanTier] = useState("starter");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const { data: orgs } = await supabase
      .from("orgs")
      .select("id, name, org_display_name, legal_name, plan_tier, created_at")
      .order("created_at", { ascending: false });

    if (!orgs) {
      setLoading(false);
      return;
    }

    const rows: OrgRow[] = await Promise.all(
      orgs.map(async (org) => {
        const [{ count: userCount }, { count: projectCount }] =
          await Promise.all([
            supabase
              .from("org_users")
              .select("*", { count: "exact", head: true })
              .eq("org_id", org.id),
            supabase
              .from("projects")
              .select("*", { count: "exact", head: true })
              .eq("org_id", org.id),
          ]);
        return {
          ...org,
          userCount: userCount ?? 0,
          projectCount: projectCount ?? 0,
        };
      })
    );

    setOrgData(rows);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  async function handleCreateOrg() {
    if (!createDisplayName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_org",
          org_display_name: createDisplayName.trim(),
          legal_name: createLegalName.trim(),
          plan_tier: createPlanTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create org");
      router.push(`/admin/orgs/${data.org_id}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create org"
      );
      setCreating(false);
    }
  }

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
          All Organizations
        </h1>
        <button
          onClick={() => {
            setShowCreate(true);
            setCreateError(null);
            setCreateDisplayName("");
            setCreateLegalName("");
            setCreatePlanTier("starter");
          }}
          className="px-4 py-2 rounded-lg bg-[#E9C03A] text-[#1B2B3A] text-sm font-semibold hover:bg-[#f5e08a] transition-colors"
        >
          Create Org
        </button>
      </div>

      {/* Create Org Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1B2B3A] rounded-lg border border-[#3A6B8A]/30 p-6 w-full max-w-md mx-4">
            <h2
              className="text-lg text-[#E9C03A] mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
              }}
            >
              Create Organization
            </h2>

            {createError && (
              <div className="mb-4 px-3 py-2 rounded bg-[#D85A30]/20 text-[#D85A30] text-sm">
                {createError}
              </div>
            )}

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
              placeholder="Organization name"
              className="w-full px-3 py-2 mb-4 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm placeholder:text-[#EDE8DE]/30 focus:outline-none focus:border-[#E9C03A]/50"
            />

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Legal Name
            </label>
            <input
              type="text"
              value={createLegalName}
              onChange={(e) => setCreateLegalName(e.target.value)}
              placeholder="Legal entity name (optional)"
              className="w-full px-3 py-2 mb-4 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm placeholder:text-[#EDE8DE]/30 focus:outline-none focus:border-[#E9C03A]/50"
            />

            <label className="block text-[#EDE8DE]/70 text-xs uppercase tracking-wider mb-1">
              Plan Tier
            </label>
            <select
              value={createPlanTier}
              onChange={(e) => setCreatePlanTier(e.target.value)}
              className="w-full px-3 py-2 mb-6 rounded-lg bg-[#0f1c27] border border-[#3A6B8A]/30 text-[#EDE8DE] text-sm"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-[#3A6B8A]/30 text-[#EDE8DE]/70 text-sm hover:bg-[#0f1c27] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrg}
                disabled={creating || !createDisplayName.trim()}
                className="px-4 py-2 rounded-lg bg-[#E9C03A] text-[#1B2B3A] text-sm font-semibold hover:bg-[#f5e08a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Org"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#EDE8DE] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Legal Name</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[#1B2B3A]/40"
                >
                  Loading...
                </td>
              </tr>
            ) : orgData.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[#1B2B3A]/40"
                >
                  No organizations found
                </td>
              </tr>
            ) : (
              orgData.map((org) => (
                <tr
                  key={org.id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2 text-[#1B2B3A]">
                    {org.org_display_name ?? org.name ?? "Unnamed"}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {org.legal_name ?? "\u2014"}
                  </td>
                  <td className="px-4 py-2 capitalize text-[#1B2B3A]/70">
                    {org.plan_tier}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {org.userCount}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70">
                    {org.projectCount}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/50">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/orgs/${org.id}`}
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

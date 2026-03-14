import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();

  // Fetch summary stats
  const [
    { count: totalUsers },
    { count: totalOrgs },
    { count: recentUsers },
    { count: totalProjects },
  ] = await Promise.all([
    supabase.from("org_users").select("*", { count: "exact", head: true }),
    supabase.from("orgs").select("*", { count: "exact", head: true }),
    supabase
      .from("org_users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from("projects").select("*", { count: "exact", head: true }),
  ]);

  // Recent users and orgs
  const [{ data: recentUsersList }, { data: recentOrgsList }] =
    await Promise.all([
      supabase
        .from("org_users")
        .select(
          "user_id, role, created_at, orgs(id, name, org_display_name, plan_tier)"
        )
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orgs")
        .select("id, name, org_display_name, plan_tier, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Get user emails from auth (we need to fetch them separately)
  const userIds = recentUsersList?.map((u) => u.user_id) ?? [];
  const userEmails: Record<string, string> = {};
  if (userIds.length > 0) {
    for (const uid of userIds) {
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(uid);
      if (user) userEmails[uid] = user.email ?? "—";
    }
  }

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0 },
    { label: "Total Orgs", value: totalOrgs ?? 0 },
    { label: "Users (Last 7 Days)", value: recentUsers ?? 0 },
    { label: "Active Projects", value: totalProjects ?? 0 },
  ];

  return (
    <div>
      <h1
        className="text-2xl text-[#E9C03A] mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
        }}
      >
        Admin Dashboard
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#0f1c27] rounded-lg p-4 border border-[#3A6B8A]/20"
          >
            <p className="text-[#EDE8DE]/50 text-xs uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p className="text-[#E9C03A] text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-[#EDE8DE] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#d8d2c4]">
            <h2 className="text-[#1B2B3A] font-semibold text-sm">
              Recent Users
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Org</th>
                <th className="px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsersList ?? []).map((u) => {
                const org = u.orgs as unknown as {
                  id: string;
                  name: string;
                  org_display_name: string | null;
                } | null;
                return (
                  <tr
                    key={u.user_id}
                    className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/users/${u.user_id}`}
                        className="text-[#3A6B8A] hover:underline"
                      >
                        {userEmails[u.user_id] ?? u.user_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#1B2B3A]/70">
                      {org?.org_display_name ?? org?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-[#1B2B3A]/50">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {(!recentUsersList || recentUsersList.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-[#1B2B3A]/40"
                  >
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Orgs */}
        <div className="bg-[#EDE8DE] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#d8d2c4]">
            <h2 className="text-[#1B2B3A] font-semibold text-sm">
              Recent Orgs
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#1B2B3A]/50 text-xs uppercase tracking-wider">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrgsList ?? []).map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-[#d8d2c4]/50 hover:bg-[#d8d2c4]/30"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/orgs/${o.id}`}
                      className="text-[#3A6B8A] hover:underline"
                    >
                      {o.org_display_name ?? o.name ?? "Unnamed"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/70 capitalize">
                    {o.plan_tier}
                  </td>
                  <td className="px-4 py-2 text-[#1B2B3A]/50">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!recentOrgsList || recentOrgsList.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-[#1B2B3A]/40"
                  >
                    No orgs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

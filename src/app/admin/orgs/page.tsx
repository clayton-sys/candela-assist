import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminOrgsPage() {
  const supabase = createClient();

  const { data: orgs } = await supabase
    .from("orgs")
    .select("id, name, org_display_name, legal_name, plan_tier, created_at")
    .order("created_at", { ascending: false });

  // Get user counts and project counts per org
  const orgData = await Promise.all(
    (orgs ?? []).map(async (org) => {
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

  return (
    <div>
      <h1
        className="text-2xl text-[#E9C03A] mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
        }}
      >
        All Organizations
      </h1>

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
            {orgData.length === 0 ? (
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
                    {org.legal_name ?? "—"}
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

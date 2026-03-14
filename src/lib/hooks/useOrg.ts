"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type OrgData = {
  orgId: string | null;
  plan: string | null;
  loading: boolean;
};

export function useOrg(): OrgData {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!orgUser?.org_id) {
        setLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from("orgs")
        .select("plan")
        .eq("id", orgUser.org_id)
        .single();

      setOrgId(orgUser.org_id);
      setPlan(org?.plan ?? null);
      setLoading(false);
    }

    load();
  }, []);

  return { orgId, plan, loading };
}

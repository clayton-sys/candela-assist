"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import BrandKitForm from "@/components/grants-reporting-suite/BrandKitForm";

const DEFAULT_BRAND = {
  brandPrimary: "#1B2B3A",
  brandAccent: "#E9C03A",
  brandSuccess: "#3A6B8A",
  brandText: "#EDE8DE",
  logoUrl: null,
  orgDisplayName: "",
  removeCandelaFooter: false,
};

export default function BrandPage() {
  const router = useRouter();
  const { setBrandKit } = useGrantsWizard();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPlan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!orgUser) return;

      const { data: org } = await supabase
        .from("orgs")
        .select("plan")
        .eq("id", orgUser.org_id)
        .single();

      const userPlan = org?.plan ?? "starter";
      setPlan(userPlan);

      // Starter users skip brand — apply defaults and go to analysis
      if (userPlan === "starter") {
        setBrandKit(DEFAULT_BRAND);
        router.replace("/app/grants-reporting-suite/analysis");
        return;
      }

      setLoading(false);
    }
    checkPlan();
  }, [router, setBrandKit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cerulean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1
        className="text-2xl font-semibold text-midnight mb-1"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Brand Kit
      </h1>
      <p
        className="text-sm text-midnight/50 mb-6"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        Customize how your reports look. Your brand will be applied to all generated views.
      </p>

      <BrandKitForm
        isPro={plan === "pro"}
        onContinue={(kit) => {
          setBrandKit(kit);
          router.push("/app/grants-reporting-suite/analysis");
        }}
      />
    </div>
  );
}

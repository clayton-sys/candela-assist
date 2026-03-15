"use client";

import { GrantsWizardProvider } from "./context/GrantsWizardContext";
import StepIndicator from "@/components/impact-studio/StepIndicator";

export default function GrantsReportingSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GrantsWizardProvider>
      <div className="flex flex-col h-full">
        <StepIndicator />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </GrantsWizardProvider>
  );
}

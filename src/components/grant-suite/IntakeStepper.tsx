"use client";

import { Check } from "lucide-react";

interface IntakeStepperProps {
  steps: string[];
  currentStep: number;
}

export default function IntakeStepper({ steps, currentStep }: IntakeStepperProps) {
  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-0"
      style={{
        background: "#0f1c27",
        borderBottom: "0.5px solid rgba(237,232,222,0.06)",
        padding: "14px 32px",
      }}
    >
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={label} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : undefined }}>
            {/* Step indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isCompleted ? (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 20, height: 20, background: "#1D9E75" }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
              ) : (
                <span
                  className="flex items-center justify-center rounded-full font-['DM_Sans'] text-xs"
                  style={{
                    width: 20,
                    height: 20,
                    background: isActive ? "#E9C03A" : "transparent",
                    border: isActive ? "none" : "1px solid rgba(237,232,222,0.2)",
                    color: isActive ? "#1B2B3A" : "rgba(237,232,222,0.3)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span
                className="font-['DM_Sans'] whitespace-nowrap"
                style={{
                  fontSize: 12,
                  color: isCompleted
                    ? "rgba(237,232,222,0.6)"
                    : isActive
                    ? "#E9C03A"
                    : "rgba(237,232,222,0.3)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-3"
                style={{
                  height: 1,
                  background: "rgba(237,232,222,0.1)",
                  minWidth: 16,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

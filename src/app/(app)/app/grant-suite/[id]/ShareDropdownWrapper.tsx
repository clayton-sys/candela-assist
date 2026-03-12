"use client";

import { useState } from "react";
import ShareDropdown from "@/components/grant-suite/ShareDropdown";
import EmbedPreviewModal from "@/components/grant-suite/EmbedPreviewModal";

interface ShareDropdownWrapperProps {
  shareUrl: string;
  slug: string;
  programName: string;
}

export default function ShareDropdownWrapper({
  shareUrl,
  slug,
  programName,
}: ShareDropdownWrapperProps) {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <>
      <ShareDropdown
        shareUrl={shareUrl}
        slug={slug}
        variant="staff"
        onCopyEmbed={() => setShowEmbed(true)}
      />
      {showEmbed && (
        <EmbedPreviewModal
          slug={slug}
          programName={programName}
          onClose={() => setShowEmbed(false)}
        />
      )}
    </>
  );
}

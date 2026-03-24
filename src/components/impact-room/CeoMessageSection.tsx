"use client";

interface CeoMessageSectionProps {
  ceoMessage: string;
  ceoName?: string;
  ceoTitle?: string;
  ceoPhotoUrl?: string;
}

export default function CeoMessageSection({
  ceoMessage,
  ceoName,
  ceoTitle,
  ceoPhotoUrl,
}: CeoMessageSectionProps) {
  if (!ceoMessage) return null;

  return (
    <section
      id="section-ceo"
      className="w-full flex items-center justify-center"
      style={{ backgroundColor: "#1B2B3A", padding: "80px 24px" }}
    >
      <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
        {/* Message */}
        <p
          className="font-display"
          style={{
            fontSize: "clamp(1.6rem, 2.2vw, 2rem)",
            fontWeight: 300,
            lineHeight: 1.6,
            color: "#E9C03A",
            fontStyle: "italic",
            marginBottom: 32,
          }}
        >
          &ldquo;{ceoMessage}&rdquo;
        </p>

        {/* Photo + name block */}
        <div className="flex flex-col items-center gap-3">
          {ceoPhotoUrl && (
            <img
              src={ceoPhotoUrl}
              alt={ceoName ?? "CEO"}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          )}

          {ceoName && (
            <p
              className="font-jakarta"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {ceoName}
            </p>
          )}

          {ceoTitle && (
            <p
              className="font-jakarta"
              style={{
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "#c8c0b0",
              }}
            >
              {ceoTitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

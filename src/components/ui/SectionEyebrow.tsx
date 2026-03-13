interface SectionEyebrowProps {
  children: React.ReactNode;
  color?: 'gold' | 'cerulean';
}

export function SectionEyebrow({ children, color = 'cerulean' }: SectionEyebrowProps) {
  const styles: React.CSSProperties =
    color === 'gold'
      ? {
          color: '#E9C03A',
          background: 'rgba(233,192,58,0.1)',
          border: '0.5px solid rgba(233,192,58,0.3)',
        }
      : {
          color: '#5a8fad',
          background: 'rgba(58,107,138,0.1)',
          border: '0.5px solid rgba(58,107,138,0.3)',
        };

  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        padding: '4px 12px',
        borderRadius: 100,
        display: 'inline-block',
        ...styles,
      }}
    >
      {children}
    </span>
  );
}

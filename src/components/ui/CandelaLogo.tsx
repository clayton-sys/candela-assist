interface CandelaLogoProps {
  size?: number;
  className?: string;
}

export default function CandelaLogo({ size = 40, className }: CandelaLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      className={className}
    >
      <defs>
        <filter id="cl-ambientGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cl-arcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="cl-rayGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cl-capGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="cl-capGrad" cx="36%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="28%" stopColor="#f5e08a" />
          <stop offset="60%" stopColor="#E9C03A" />
          <stop offset="85%" stopColor="#b8741a" />
          <stop offset="100%" stopColor="#6a3a06" stopOpacity=".9" />
        </radialGradient>
        <linearGradient id="cl-arcGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e08a" />
          <stop offset="30%" stopColor="#E9C03A" />
          <stop offset="70%" stopColor="#d4a020" />
          <stop offset="100%" stopColor="#9a5c0a" />
        </linearGradient>
        <linearGradient id="cl-hlGrad" x1="100%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#fffbe0" stopOpacity=".65" />
          <stop offset="100%" stopColor="#E9C03A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cl-cerGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#5a8fad" stopOpacity=".8" />
          <stop offset="50%" stopColor="#3A6B8A" stopOpacity=".65" />
          <stop offset="100%" stopColor="#2a4e6a" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="cl-ray1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E9C03A" stopOpacity=".95" />
          <stop offset="100%" stopColor="#f5e08a" stopOpacity=".1" />
        </linearGradient>
        <linearGradient id="cl-ray2" x1="0%" y1="80%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E9C03A" stopOpacity=".85" />
          <stop offset="100%" stopColor="#f5e08a" stopOpacity=".08" />
        </linearGradient>
        <linearGradient id="cl-ray3" x1="20%" y1="100%" x2="80%" y2="0%">
          <stop offset="0%" stopColor="#E9C03A" stopOpacity=".85" />
          <stop offset="100%" stopColor="#f5e08a" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <circle cx="130" cy="120" r="90" fill="#E9C03A" opacity=".05" filter="url(#cl-ambientGlow)" />
      <g filter="url(#cl-rayGlow)">
        <line x1="152" y1="58" x2="192" y2="18" stroke="url(#cl-ray1)" strokeWidth="3" strokeLinecap="round" />
        <line x1="162" y1="72" x2="210" y2="52" stroke="url(#cl-ray2)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="140" y1="50" x2="148" y2="8" stroke="url(#cl-ray3)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M 154 170 A 56 56 0 1 1 154 70" stroke="url(#cl-cerGrad)" strokeWidth="6" strokeLinecap="round" fill="none" filter="url(#cl-rayGlow)" />
      <path d="M 162 180 A 68 68 0 1 1 162 60" stroke="#4a2200" strokeWidth="22" strokeLinecap="round" fill="none" opacity=".45" />
      <path d="M 162 180 A 68 68 0 1 1 162 60" stroke="url(#cl-arcGrad)" strokeWidth="16" strokeLinecap="round" fill="none" filter="url(#cl-arcGlow)" />
      <path d="M 158 178 A 72 72 0 1 1 166 62" stroke="url(#cl-hlGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".7" />
      <circle cx="162" cy="180" r="8" fill="url(#cl-capGrad)" filter="url(#cl-arcGlow)" />
      <circle cx="159" cy="177" r="2.5" fill="#fffbe0" opacity=".45" />
      <circle cx="162" cy="60" r="14" fill="#E9C03A" opacity=".12" filter="url(#cl-capGlow)" />
      <circle cx="162" cy="60" r="8" fill="url(#cl-capGrad)" filter="url(#cl-arcGlow)" />
      <circle cx="159" cy="57" r="2.5" fill="#fffbe0" opacity=".55" />
    </svg>
  );
}

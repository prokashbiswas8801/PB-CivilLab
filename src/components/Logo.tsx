import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
  height?: number | string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  height = 40,
  showTagline = true,
}) => {
  if (variant === 'icon') {
    return (
      <span
        className={`font-wood font-normal tracking-wide text-cyan-400 select-none inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          fontSize: typeof height === 'number' ? `${Math.max(14, height * 0.75)}px` : height,
          lineHeight: 1,
        }}
        aria-label="PB CivilLab"
      >
        PB
      </span>
    );
  }

  if (variant === 'wordmark' || !showTagline) {
    return (
      <span
        className={`font-wood font-normal text-slate-100 tracking-wide hover:text-cyan-300 transition-colors select-none whitespace-nowrap ${className}`}
        style={{
          fontSize: typeof height === 'number' ? `${Math.max(16, height * 0.65)}px` : height,
          lineHeight: 1.1,
        }}
      >
        PB CivilLab
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col justify-center leading-none select-none ${className}`}>
      <span
        className="font-wood font-normal text-slate-100 tracking-wide hover:text-cyan-300 transition-colors drop-shadow-sm whitespace-nowrap"
        style={{
          fontSize: typeof height === 'number' ? `${Math.max(16, height * 0.65)}px` : height,
          lineHeight: 1.1,
        }}
      >
        PB CivilLab
      </span>
      {showTagline && (
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-cyan-400 uppercase mt-1 whitespace-nowrap">
          Calculate Smarter. Build Better.
        </span>
      )}
    </div>
  );
};


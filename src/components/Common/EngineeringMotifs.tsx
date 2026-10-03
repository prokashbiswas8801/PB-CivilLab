import React from 'react';

interface MotifProps {
  className?: string;
  size?: number;
}

/**
 * 2D Technical Vector: Reinforced Concrete Beam-Column Joint with Anchor Hooks
 */
export const BeamColumnJointMotif: React.FC<MotifProps> = ({ className = 'text-cyan-500/20 dark:text-cyan-400/20 light:text-sky-600/25', size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none pointer-events-none ${className}`}
    aria-hidden="true"
  >
    {/* Column concrete bounds */}
    <rect x="36" y="5" width="28" height="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
    {/* Beam concrete bounds */}
    <rect x="5" y="32" width="90" height="26" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
    
    {/* Column vertical rebar with standard cover */}
    <line x1="41" y1="5" x2="41" y2="95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="59" y1="5" x2="59" y2="95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    
    {/* Column lateral ties / stirrups */}
    <line x1="39" y1="16" x2="61" y2="16" stroke="currentColor" strokeWidth="1.2" />
    <line x1="39" y1="24" x2="61" y2="24" stroke="currentColor" strokeWidth="1.2" />
    <line x1="39" y1="68" x2="61" y2="68" stroke="currentColor" strokeWidth="1.2" />
    <line x1="39" y1="78" x2="61" y2="78" stroke="currentColor" strokeWidth="1.2" />
    <line x1="39" y1="88" x2="61" y2="88" stroke="currentColor" strokeWidth="1.2" />

    {/* Beam top & bottom rebar with 90° seismic anchor hooks into column core */}
    <path d="M 95 38 L 47 38 L 47 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 38 L 47 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 95 52 L 53 52 L 53 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 5 52 L 53 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

    {/* Confinement stirrups inside joint core */}
    <line x1="39" y1="41" x2="61" y2="41" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
    <line x1="39" y1="49" x2="61" y2="49" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />

    {/* Dimension witness tick marks */}
    <circle cx="50" cy="45" r="2.5" fill="currentColor" opacity="0.8" />
  </svg>
);

/**
 * 2D Technical Vector: Rebar Cross Section with Closed Perimeter Stirrup and 135° Seismic Hooks
 */
export const RebarCrossSectionMotif: React.FC<MotifProps> = ({ className = 'text-cyan-500/20 dark:text-cyan-400/20 light:text-sky-600/25', size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none pointer-events-none ${className}`}
    aria-hidden="true"
  >
    {/* Concrete square section boundary */}
    <rect x="10" y="10" width="80" height="80" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
    
    {/* Outer clear cover clearance lines */}
    <rect x="20" y="20" width="60" height="60" rx="8" stroke="currentColor" strokeWidth="2" />
    
    {/* 135° seismic bend overlap in upper-left corner */}
    <path d="M 32 20 L 22 20 A 4 4 0 0 0 18 24 L 18 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 28 30 L 18 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

    {/* 4 Corner longitudinal main bars */}
    <circle cx="28" cy="28" r="5" fill="currentColor" />
    <circle cx="72" cy="28" r="5" fill="currentColor" />
    <circle cx="28" cy="72" r="5" fill="currentColor" />
    <circle cx="72" cy="72" r="5" fill="currentColor" />

    {/* Intermediate side bars */}
    <circle cx="50" cy="28" r="3.5" fill="currentColor" opacity="0.85" />
    <circle cx="50" cy="72" r="3.5" fill="currentColor" opacity="0.85" />
    <circle cx="28" cy="50" r="3.5" fill="currentColor" opacity="0.85" />
    <circle cx="72" cy="50" r="3.5" fill="currentColor" opacity="0.85" />

    {/* Centerline drafting crosshair */}
    <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 3 1 3" opacity="0.4" />
    <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 3 1 3" opacity="0.4" />
  </svg>
);

/**
 * 2D Technical Vector: Surveying Total Station / Theodolite Sight with Azimuth Compass Grid
 */
export const SurveyorOpticalMotif: React.FC<MotifProps> = ({ className = 'text-cyan-500/20 dark:text-cyan-400/20 light:text-sky-600/25', size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none pointer-events-none ${className}`}
    aria-hidden="true"
  >
    {/* Optical circular reticle */}
    <circle cx="50" cy="45" r="36" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="50" cy="45" r="24" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
    <circle cx="50" cy="45" r="3" stroke="currentColor" strokeWidth="1.5" />

    {/* Stadia crosshairs & distance ticks */}
    <line x1="14" y1="45" x2="86" y2="45" stroke="currentColor" strokeWidth="1.5" />
    <line x1="50" y1="9" x2="50" y2="81" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Upper and lower stadia lines (for optical distance tachymetry) */}
    <line x1="44" y1="33" x2="56" y2="33" stroke="currentColor" strokeWidth="1.5" />
    <line x1="44" y1="57" x2="56" y2="57" stroke="currentColor" strokeWidth="1.5" />

    {/* Tripod legs geometry below */}
    <line x1="50" y1="81" x2="20" y2="98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="50" y1="81" x2="50" y2="98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="50" y1="81" x2="80" y2="98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    {/* Optical plumb plumb-bob point */}
    <circle cx="50" cy="98" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * 2D Technical Vector: Warren Structural Truss with Node Gusset Pins
 */
export const StructuralTrussMotif: React.FC<MotifProps> = ({ className = 'text-cyan-500/20 dark:text-cyan-400/20 light:text-sky-600/25', size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none pointer-events-none ${className}`}
    aria-hidden="true"
  >
    {/* Bottom chord */}
    <line x1="10" y1="45" x2="110" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Top chord */}
    <line x1="30" y1="15" x2="90" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

    {/* Web diagonals */}
    <line x1="10" y1="45" x2="30" y2="15" stroke="currentColor" strokeWidth="1.8" />
    <line x1="30" y1="15" x2="50" y2="45" stroke="currentColor" strokeWidth="1.8" />
    <line x1="50" y1="45" x2="70" y2="15" stroke="currentColor" strokeWidth="1.8" />
    <line x1="70" y1="15" x2="90" y2="45" stroke="currentColor" strokeWidth="1.8" />
    <line x1="90" y1="15" x2="110" y2="45" stroke="currentColor" strokeWidth="1.8" />

    {/* Vertical struts */}
    <line x1="30" y1="15" x2="30" y2="45" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="70" y1="15" x2="70" y2="45" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />

    {/* Node pins */}
    <circle cx="10" cy="45" r="3" fill="currentColor" />
    <circle cx="50" cy="45" r="3" fill="currentColor" />
    <circle cx="90" cy="45" r="3" fill="currentColor" />
    <circle cx="110" cy="45" r="3" fill="currentColor" />
    <circle cx="30" cy="15" r="3" fill="currentColor" />
    <circle cx="70" cy="15" r="3" fill="currentColor" />
  </svg>
);

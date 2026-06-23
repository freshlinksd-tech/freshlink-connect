/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Custom FreshLink Connection vector logo matching visual guidelines.
 */

import React from 'react';

interface FreshLinkLogoProps {
  className?: string;
  size?: number | string;
}

export const FreshLinkLogo: React.FC<FreshLinkLogoProps> = ({ 
  className = 'w-10 h-10',
  size
}) => {
  const inlineStyle = size ? { width: size, height: size } : undefined;
  
  return (
    <svg
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={`${className} shrink-0 select-none`}
      style={inlineStyle}
      id="freshlink-vector-logo"
    >
      {/* Hex background #FF6B00 matches the vibrant orange hue */}
      <rect width="128" height="128" rx="36" fill="#F97316" id="logo-bg-rect" />
      
      {/* Scaled link icon inside */}
      <g transform="translate(64, 64) rotate(-45) translate(-64, -64)" strokeLinecap="round" id="logo-g-link">
        {/* Left loop chain piece */}
        <path
          d="M56 50 H44 C34 50 34 78 44 78 H56"
          stroke="white"
          strokeWidth="11"
          fill="none"
          id="logo-left-loop"
        />
        {/* Right loop chain piece */}
        <path
          d="M72 50 H84 C94 50 94 78 84 78 H72"
          stroke="white"
          strokeWidth="11"
          fill="none"
          id="logo-right-loop"
        />
        {/* Central connecting link pill bar */}
        <line
          x1="50"
          y1="64"
          x2="78"
          y2="64"
          stroke="white"
          strokeWidth="11"
          id="logo-middle-bar"
        />
      </g>
    </svg>
  );
};

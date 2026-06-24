/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Custom FreshLink Connection logo using the user-provided branding image.
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
    <img
      src="/logo.png"
      alt="FreshLink Logo"
      className={`${className} shrink-0 select-none object-contain rounded-xl`}
      style={inlineStyle}
      id="freshlink-image-logo"
      referrerPolicy="no-referrer"
    />
  );
};

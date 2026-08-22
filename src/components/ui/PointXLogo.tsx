import React from 'react';
import { useAuthStore } from '../../store/authStore';

export interface PointXLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
  forceTheme?: 'light' | 'dark';
  withShine?: boolean;
}

export const PointXLogo: React.FC<PointXLogoProps> = ({
  className = 'h-8 w-auto object-contain',
  imgClassName = 'w-full h-full object-contain',
  alt = 'PointX',
  forceTheme,
  withShine = false
}) => {
  const { theme } = useAuthStore();
  const activeTheme = forceTheme || theme || 'dark';
  const isDark = activeTheme === 'dark';
  const logoSrc = isDark ? '/brand/pointx-logo.png' : '/brand/pointx-logo-light.png';

  if (!withShine) {
    return (
      <img
        src={logoSrc}
        alt={alt}
        className={className}
        key={activeTheme}
      />
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className} select-none`}>
      {/* Base PNG Logo Image */}
      <img
        src={logoSrc}
        alt={alt}
        className={imgClassName}
        key={activeTheme}
      />

      {/* Alpha-Masked Precision Shine Layer:
          Uses CSS mask-image so the shine sweep ONLY illuminates the opaque pixels 
          of the PointX logo letters and icon, leaving all transparent 16:9 margins 100% untouched */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          WebkitMaskImage: `url("${logoSrc}")`,
          maskImage: `url("${logoSrc}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center'
        }}
        aria-hidden="true"
      >
        <div className="pointx-alpha-shine" />
      </div>
    </div>
  );
};


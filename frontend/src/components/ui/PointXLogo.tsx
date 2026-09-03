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
  alt = 'PointX Esports',
  forceTheme,
  withShine = false
}) => {
  const storeTheme = useAuthStore((s) => s.theme);
  const activeTheme = forceTheme || storeTheme || 'dark';
  const isDark = activeTheme === 'dark';

  return (
    <div className={`relative inline-flex items-center justify-center ${className} select-none`}>
      {/* Dark Mode Logo Layer */}
      <img
        src="/brand/pointx-logo.png"
        alt={alt}
        className={`${imgClassName} transition-opacity duration-200 ease-out pointer-events-none ${isDark ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        draggable={false}
      />

      {/* Light Mode Logo Layer (Stacked for instant GPU cross-fade without DOM destruction) */}
      <img
        src="/brand/pointx-logo-light.png"
        alt={alt}
        className={`absolute inset-0 ${imgClassName} transition-opacity duration-200 ease-out pointer-events-none ${!isDark ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        draggable={false}
      />

      {/* Optional Alpha-Masked Precision Shine Layer */}
      {withShine && (
        <div
          className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-0'}`}
          style={{
            WebkitMaskImage: 'url("/brand/pointx-logo.png")',
            maskImage: 'url("/brand/pointx-logo.png")',
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
      )}

      {withShine && (
        <div
          className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-200 ${!isDark ? 'opacity-100' : 'opacity-0'}`}
          style={{
            WebkitMaskImage: 'url("/brand/pointx-logo-light.png")',
            maskImage: 'url("/brand/pointx-logo-light.png")',
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
      )}
    </div>
  );
};


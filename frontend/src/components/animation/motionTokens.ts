/**
 * POINTX GLOBAL MOTION DESIGN SYSTEM TOKENS
 * Standardized spring physics, duration tokens, and reusable Motion variants.
 */

// Global Spring & Easing Presets
export const MOTION_SPRINGS = {
  // Snappy, highly responsive feedback for buttons, toggles, small icons
  snappy: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 32,
    mass: 0.6
  },
  // Smooth, organic motion for modals, drawers, dropdowns
  smooth: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 28,
    mass: 0.8
  },
  // Gentle motion for page transitions and large containers
  gentle: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 26,
    mass: 1
  },
  // Bouncy accent feedback
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 22
  }
};

export const MOTION_EASINGS = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outCubic: [0.22, 1, 0.36, 1] as const,
  inOutCubic: [0.65, 0, 0.35, 1] as const,
  sharp: [0.4, 0, 0.2, 1] as const
};

export const MOTION_DURATIONS = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.26,
  slow: 0.38,
  page: 0.32
};

// Reusable Motion Variants
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.sharp }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -6,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.sharp }
  }
};

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: MOTION_DURATIONS.fast } },
  exit: { opacity: 0, transition: { duration: MOTION_DURATIONS.fast } }
};

export const modalDialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 16
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.smooth
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.sharp }
  }
};

export const toastVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.smooth
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 10,
    transition: { duration: MOTION_DURATIONS.fast }
  }
};

export const mobileDrawerVariants = {
  hidden: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.sharp }
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...MOTION_SPRINGS.smooth,
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.sharp }
  }
};

export const mobileDrawerItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: MOTION_SPRINGS.snappy
  }
};

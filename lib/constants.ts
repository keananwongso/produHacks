// Physics tuning constants for the drift effect
export const PHYSICS_CONSTANTS = {
  SPRING_STRENGTH: 0.004,     // How strongly connected nodes attract
  SPRING_LENGTH: 150,         // Target distance between connected nodes
  REPULSION: 800,             // How strongly all nodes repel each other
  REPULSION_RADIUS: 500,      // Max distance for repulsion force
  DAMPING: 0.92,              // Velocity decay factor (higher = less friction)
  MAX_VELOCITY: 10,           // Clamp max speed
  SETTLE_THRESHOLD: 0.1,      // Physics pauses below this velocity
};

// Node styling by type
export const NODE_STYLES = {
  thought: {
    bg: 'bg-slate-900/60',
    border: 'border-slate-700/30',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]',
    text: 'text-slate-200',
  },
  ai_idea: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/20',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    text: 'text-purple-200',
  },
  research: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-500/20',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    text: 'text-blue-200',
    icon: '🔍',
  },
  document: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    text: 'text-emerald-200',
    icon: '📝',
  },
  mockup: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    text: 'text-amber-200',
    icon: '🎨',
  },
};

// Animation durations
export const ANIMATIONS = {
  NODE_FADE_IN: 300,
  CONNECTION_DRAW: 500,
  CLUSTER_LABEL_FADE: 400,
  PANEL_SLIDE: 250,
};

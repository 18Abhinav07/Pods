export const palette = {
  canvas: "#eeece5",
  paper: "#f8f7f2",
  surface: "#ffffff",
  soft: "#efeee8",
  ink: "#1f2348",
  muted: "#686b7e",
  line: "#dedee4",
  action: "#3b5ccc",
  actionSoft: "#e9ecfa",
  success: "#18795c",
  successSoft: "#e5f2ed",
  warning: "#956400",
  warningSoft: "#f7efd9",
  danger: "#b42318",
  dangerSoft: "#fae9e7",
  nim: "#d4a72c"
} as const;

export const typography = {
  sans: "Mulish",
  mono: "Fira Mono"
} as const;

export const motion = {
  immediate: 0,
  tactile: 140,
  state: 220,
  navigation: 280,
  milestone: 700,
  entrance: 900,
  stagger: 55,
  ambient: 6000,
  selectionSpring: {
    stiffness: 320,
    damping: 30,
    mass: 0.72
  }
} as const;

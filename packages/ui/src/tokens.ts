export const palette = {
  canvas: "#f3f1e9",
  paper: "#faf9f4",
  surface: "#fffdf8",
  soft: "#eeece4",
  ink: "#20241f",
  muted: "#686b64",
  line: "#dcddd5",
  success: "#18795c",
  successSoft: "#e5f2ed",
  warning: "#956400",
  warningSoft: "#f7efd9",
  danger: "#b42318",
  dangerSoft: "#fae9e7",
  nim: "#d4a72c",
  activities: {
    build: { accent: "#d9ed72", deep: "#252b24" },
    practice: { accent: "#efaa70", deep: "#3a2720" },
    fitness: { accent: "#fa7448", deep: "#12141c" },
    reading: { accent: "#aeb8f0", deep: "#34335a" },
    study: { accent: "#8fcfc1", deep: "#203a36" }
  }
} as const;

export const typography = {
  sans: "Mulish",
  mono: "Fira Mono",
  controlSize: 16
} as const;

export const rounded = {
  control: 14,
  panel: 20,
  media: 28,
  pill: 999
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const motion = {
  immediate: 0,
  tactile: 140,
  state: 220,
  navigation: 240,
  ease: [0.16, 1, 0.3, 1]
} as const;

export type CssVariableName = `--${string}`;
export type CssVariables = Readonly<Record<CssVariableName, string>>;

export const cssVariables = {
  "--color-canvas": palette.canvas,
  "--color-paper": palette.paper,
  "--color-surface": palette.surface,
  "--color-soft": palette.soft,
  "--color-ink": palette.ink,
  "--color-muted": palette.muted,
  "--color-line": palette.line,
  "--color-success": palette.success,
  "--color-success-soft": palette.successSoft,
  "--color-warning": palette.warning,
  "--color-warning-soft": palette.warningSoft,
  "--color-danger": palette.danger,
  "--color-danger-soft": palette.dangerSoft,
  "--color-nim": palette.nim,
  "--font-sans": `"${typography.sans} Variable", sans-serif`,
  "--font-mono": typography.mono,
  "--motion-immediate": `${motion.immediate}ms`,
  "--motion-tactile": `${motion.tactile}ms`,
  "--motion-state": `${motion.state}ms`,
  "--motion-navigation": `${motion.navigation}ms`,
  "--ease-premium": `cubic-bezier(${motion.ease.join(", ")})`,
  "--radius-control": `${rounded.control}px`,
  "--radius-panel": `${rounded.panel}px`,
  "--radius-media": `${rounded.media}px`,
  "--radius-pill": `${rounded.pill}px`,
  "--activity-build": palette.activities.build.accent,
  "--activity-build-deep": palette.activities.build.deep,
  "--activity-practice": palette.activities.practice.accent,
  "--activity-practice-deep": palette.activities.practice.deep,
  "--activity-fitness": palette.activities.fitness.accent,
  "--activity-fitness-deep": palette.activities.fitness.deep,
  "--activity-reading": palette.activities.reading.accent,
  "--activity-reading-deep": palette.activities.reading.deep,
  "--activity-study": palette.activities.study.accent,
  "--activity-study-deep": palette.activities.study.deep
} as const satisfies CssVariables;

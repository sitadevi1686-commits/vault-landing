const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  let size = value;
  let index = 0;
  while (size >= 1024 && index < UNITS.length - 1) {
    size /= 1024;
    index += 1;
  }
  const digits = size >= 100 || index === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${UNITS[index]}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

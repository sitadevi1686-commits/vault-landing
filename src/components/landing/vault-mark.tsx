import { cn } from "cn";

export function VaultMark({ id, className }: { id: string; className?: string }) {
  const gradientId = `vault-mark-${id}`;
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d1c" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 28 9.25v13.5L16 29.5 4 22.75V9.25z" fill={`url(#${gradientId})`} />
      <path
        d="M16 2.5 28 9.25 16 16 4 9.25zM16 16v13.5"
        fill="none"
        stroke="#0b0b0d"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VaultLogo({ id }: { id: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <VaultMark id={id} />
      <span className="font-heading text-lg font-semibold tracking-tight">Vault</span>
    </span>
  );
}

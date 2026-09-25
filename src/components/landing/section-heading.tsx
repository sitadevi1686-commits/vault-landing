import type { ReactNode } from "react";
import { cn } from "cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="font-mono text-xs tracking-[0.18em] text-ember-soft uppercase">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-3xl leading-tight font-bold tracking-[-0.03em] text-balance sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

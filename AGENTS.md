<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack

- Next.js App Router + TypeScript + Tailwind 4 + shadcn/ui (`base-nova`, Base UI primitives)
- Animation: `motion/react` with tokens from `src/lib/motion-tokens.ts`; do not add framer-motion
- Deploy on Vercel

## Copy

Follow [`PRODUCT_NARRATIVE.md`](PRODUCT_NARRATIVE.md): tie every section to a real-world failure, and never use fake customers, logos, or testimonials.

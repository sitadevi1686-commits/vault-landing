# Project narrative rule (Vault)

Always shape Vault work around **real-world usefulness**, not only systems jargon.

## Positioning

Vault solves: **keep important files available when disks, machines, or networks fail**, and **detect/repair silent corruption** — the same class of problem as Amazon S3 / backup stores / SaaS upload backends, runnable on a laptop for the hackathon.

## Every surface must answer “so what?”

| Surface | Must include |
|---------|----------------|
| Landing `/` | Who needs this (backups, media, ML datasets, SaaS uploads) + proof strip |
| `/console` | Live health framed as “your data is safe / at risk / repairing” |
| README / demos | Requirement → real failure → Vault behavior |
| Chaos scripts | Narrate as outage / bit-rot / recovery time (RTO) |
| Pitch | 30s: real problem → Vault → live kill-node demo |

## Do not

- Fake customers, logos, or testimonials
- Claim to replace AWS wholesale
- Ship pure tech with zero use-case framing

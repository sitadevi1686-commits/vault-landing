export const LINK_SERVERS = [
  { id: "a", name: "server-a", zone: "zone-a" },
  { id: "b", name: "server-b", zone: "zone-b" },
  { id: "c", name: "server-c", zone: "zone-c" },
] as const;

export type ServerId = (typeof LINK_SERVERS)[number]["id"];

export type LinkDemo = { down: readonly ServerId[] };

export function createLinkDemo(): LinkDemo {
  return { down: [] };
}

export function serverUp(state: LinkDemo, id: ServerId): boolean {
  return !state.down.includes(id);
}

export function setServer(state: LinkDemo, id: ServerId, up: boolean): LinkDemo {
  if (up) return { down: state.down.filter((item) => item !== id) };
  if (state.down.includes(id)) return state;
  return { down: [...state.down, id] };
}

export function linkHealth(state: LinkDemo) {
  const copies = LINK_SERVERS.filter((server) => serverUp(state, server.id)).length;
  const linkOpen = serverUp(state, "a") && serverUp(state, "b");
  return {
    copies,
    total: LINK_SERVERS.length,
    readable: copies > 0,
    linkOpen,
    label: copies === LINK_SERVERS.length ? "Every copy is reachable." : copies > 0 ? "A server is down. The file is still readable." : "Every copy is down.",
  };
}

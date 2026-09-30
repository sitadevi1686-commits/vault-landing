import http from "node:http";
import os from "node:os";

const FILE_NAME = "family-trip-2024.zip";
const HOST = "127.0.0.1";
const CONTROL_PORT = 4199;

const SERVERS = [
  { id: "a", name: "server-a", zone: "zone-a", port: 4101, peer: "b" },
  { id: "b", name: "server-b", zone: "zone-b", port: 4102, peer: "a" },
  { id: "c", name: "server-c", zone: "zone-c", port: 4103, peer: "a" },
];

const handles = new Map();
const peers = new Map();

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function healthBody(server) {
  const peer = peers.get(server.id) ?? null;
  return {
    id: server.id,
    name: server.name,
    zone: server.zone,
    host: os.hostname(),
    port: server.port,
    file: FILE_NAME,
    peer,
  };
}

function openServer(server) {
  if (handles.has(server.id)) return;
  const listener = http.createServer((req, res) => {
    if (req.url !== "/health") {
      send(res, 404, { ok: false });
      return;
    }
    send(res, 200, healthBody(server));
  });
  listener.listen(server.port, HOST);
  handles.set(server.id, listener);
}

function closeServer(id) {
  const listener = handles.get(id);
  if (!listener) return;
  handles.delete(id);
  listener.close();
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1000) reject(new Error("Body is too large"));
      else chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function checkPeer(server) {
  const peer = SERVERS.find((item) => item.id === server.peer);
  const started = Date.now();
  try {
    const response = await fetch(`http://${HOST}:${peer.port}/health`, {
      signal: AbortSignal.timeout(700),
    });
    peers.set(server.id, {
      id: peer.id,
      ok: response.ok,
      ms: Date.now() - started,
    });
  } catch {
    peers.set(server.id, { id: peer.id, ok: false, ms: null });
  }
}

const control = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/status") {
    send(res, 200, {
      host: os.hostname(),
      file: FILE_NAME,
      servers: SERVERS.map((server) => ({
        id: server.id,
        name: server.name,
        zone: server.zone,
        port: server.port,
        up: handles.has(server.id),
        peer: peers.get(server.id) ?? null,
      })),
    });
    return;
  }
  if (req.method === "POST" && req.url === "/toggle") {
    try {
      const body = await readJson(req);
      const server = SERVERS.find((item) => item.id === body.id);
      if (!server || typeof body.up !== "boolean") {
        send(res, 400, { ok: false, error: "Choose server a, b, or c." });
        return;
      }
      if (body.up) openServer(server);
      else closeServer(server.id);
      send(res, 200, { ok: true, id: server.id, up: handles.has(server.id) });
    } catch {
      send(res, 400, { ok: false, error: "That request was not valid JSON." });
    }
    return;
  }
  send(res, 404, { ok: false });
});

for (const server of SERVERS) openServer(server);
control.listen(CONTROL_PORT, HOST);
setInterval(() => {
  for (const server of SERVERS) {
    if (handles.has(server.id)) void checkPeer(server);
  }
}, 1000);

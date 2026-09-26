"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronRight, FolderOpen, HardDrive, RefreshCw, Search, ShieldCheck, Trash2, Upload } from "lucide-react";
import { VaultMark } from "@/components/console/dashboard-visuals";
import { formatBytes } from "@/lib/vault/format";
import {
  BUCKETS,
  DEMO_RECORDS,
  fileHealth,
  filesInBucket,
  healthDetail,
  healthLabel,
  librarySummary,
  type BucketId,
  type LibraryFile,
} from "@/lib/vault/library";
import { useLibrary } from "./use-library";
import "@/components/console/dashboard.css";
import "./library.css";

export function LibraryView() {
  const library = useLibrary();
  const [bucket, setBucket] = useState<BucketId | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [recordName, setRecordName] = useState("");
  const [recordBucket, setRecordBucket] = useState<BucketId>("uploads");
  const fileInput = useRef<HTMLInputElement>(null);
  const summary = librarySummary(library.state);
  const visible = filesInBucket(library.state, bucket, query);
  const selected = library.state.files.find((file) => file.id === selectedId) ?? null;
  const folder = bucket === "all" ? "All files" : BUCKETS.find((item) => item.id === bucket)?.label;

  function reveal(id: string | null) {
    if (!id) return;
    setBucket("all");
    setQuery("");
    setSelectedId(id);
    setConfirmId(null);
  }

  function onUpload(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    reveal(library.upload(file, recordBucket));
    if (fileInput.current) fileInput.current.value = "";
  }

  function saveRecord(event: FormEvent) {
    event.preventDefault();
    const id = library.addRecord({ name: recordName, bucket: recordBucket });
    if (!id) return;
    setRecordName("");
    reveal(id);
  }

  return (
    <div className="vault-dashboard">
      <div className="dashboard-shell">
        <aside className="dash-sidebar">
          <Link className="vault-brand" href="/" aria-label="Hydras home">
            <VaultMark />
            <span>Hydras<small>YOUR FILES</small></span>
          </Link>
          <div className="workspace-card">
            <div className="workspace-icon"><FolderOpen size={18} /></div>
            <div><strong>Personal library</strong><span>Copied across five machines</span></div>
          </div>
          <p className="nav-label">Folders</p>
          <nav aria-label="Folders">
            <button type="button" className={`nav-item ${bucket === "all" ? "active" : ""}`} aria-current={bucket === "all" ? "page" : undefined} onClick={() => setBucket("all")}>
              <FolderOpen size={19} /><span>All files</span>
            </button>
            {BUCKETS.map((item) => (
              <button key={item.id} type="button" className={`nav-item ${bucket === item.id ? "active" : ""}`} aria-current={bucket === item.id ? "page" : undefined} onClick={() => setBucket(item.id)}>
                <FolderOpen size={19} /><span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note"><ShieldCheck size={18} /><p>One disk can fail.<span>A file stays readable while any copy is online.</span></p></div>
            <Link className="tour-launch" href="/console"><HardDrive size={22} /><span><small>CLUSTER</small><strong>Open console</strong><span>See repairs and recovery time</span></span></Link>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-topbar">
            <div><FolderOpen size={19} /><span>Library</span><ChevronRight size={14} /><strong>{folder}</strong></div>
            <span className="connection-pill connected" role="status"><i />Demo · files stay in this browser</span>
          </header>
          <main className="dash-content" id="main-content">
            <section className="dash-welcome">
              <div>
                <p className="eyebrow">PHOTOS, BACKUPS, DATASETS</p>
                <h1>{summary.unavailable > 0 ? "Some files cannot be read." : summary.protected === summary.files ? "Your files have three ways home." : "A machine is down. Your files are still here."}</h1>
                <p>{summary.readable} of {summary.files} files can still be read. Stop a machine below and the copies on the other machines keep serving.</p>
              </div>
              <button className="secondary-button" type="button" onClick={library.reset}><RefreshCw size={15} />Reset sample files</button>
            </section>

            <section className="dash-card record-card" aria-label="Add a file">
              <div className="card-heading"><div><h2>Add a file for the demo</h2><p>Save a record, or upload a real file. Either way it is copied onto three machines.</p></div><Upload size={19} /></div>
              <form className="record-form" onSubmit={saveRecord}>
                <label className="search-field"><span className="sr-only">Record name</span><input aria-label="Record name" placeholder="wedding-album.zip" value={recordName} onChange={(event) => setRecordName(event.target.value)} /></label>
                <label><span className="sr-only">Folder</span>
                  <select aria-label="Folder" value={recordBucket} onChange={(event) => { if (isBucket(event.target.value)) setRecordBucket(event.target.value); }}>
                    {BUCKETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <button className="primary-button" type="submit">Save record</button>
                <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} />Upload a file</button>
                <input ref={fileInput} className="file-input" type="file" aria-label="Choose a file to store" onChange={(event) => onUpload(event.target.files)} />
              </form>
              <div className="record-chips">
                {DEMO_RECORDS.map((record) => (
                  <button key={record.name} className="secondary-button" type="button" onClick={() => reveal(library.addRecord(record))}>{record.label}</button>
                ))}
              </div>
            </section>

            <section className="stats-grid" aria-label="Library summary">
              <Metric label="Files" value={String(summary.files)} hint="Stored in this browser" />
              <Metric label="Fully protected" value={String(summary.protected)} hint="All three copies online" accent />
              <Metric label="Still readable" value={String(summary.readable)} hint="At least one copy is up" />
              <Metric label="Unavailable" value={String(summary.unavailable)} hint="Every copy of these files is down" />
            </section>

            <section aria-label="Storage machines">
              <div className="section-toolbar">
                <div><h2>Machines holding your copies</h2><p>Stop one. Files that lived there stay readable from the other two.</p></div>
              </div>
              <div className="library-machines">
                {library.state.machines.map((machine) => (
                  <button key={machine.id} type="button" className={machine.running ? "" : "is-down"} onClick={() => library.toggle(machine.id)}>
                    <strong>{machine.id}</strong>
                    <small>{machine.zone} · {machine.running ? "Serving · click to stop" : "Stopped · click to start"}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="dash-card repair-log">
              <div className="section-toolbar">
                <div><h2>Files <span className="count-badge">{visible.length}</span></h2><p>Each file is written to three machines in three zones.</p></div>
                <label className="search-field"><Search size={16} /><input aria-label="Search files" placeholder="Find a file…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              </div>
              {visible.length === 0 ? (
                <div className="dash-empty"><FolderOpen size={34} /><h3>No files in this folder</h3><p>Upload a file, or choose All files.</p></div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>File</th><th>Folder</th><th>Size</th><th>Copies</th></tr></thead>
                    <tbody>
                      {visible.map((file) => {
                        const health = fileHealth(file, library.state.machines);
                        return (
                          <tr key={file.id} className={`library-file ${selectedId === file.id ? "is-selected" : ""}`}>
                            <td><button type="button" className="library-open" onClick={() => setSelectedId(file.id)}>{file.name}</button><span>{new Date(file.addedAt).toLocaleDateString()}</span></td>
                            <td>{BUCKETS.find((item) => item.id === file.bucket)?.label}</td>
                            <td>{formatBytes(file.bytes)}</td>
                            <td><span className={`incident-status ${health.status === "protected" ? "resolved" : ""}`}>{healthLabel(health)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {selected && (
                <FileDetail
                  file={selected}
                  machines={library.state.machines}
                  canDownloadOriginal={Boolean(library.blobFor(selected.id))}
                  confirming={confirmId === selected.id}
                  onDownload={() => downloadFile(selected, library.state.machines, library.blobFor(selected.id))}
                  onAskRemove={() => setConfirmId(selected.id)}
                  onCancel={() => setConfirmId(null)}
                  onRemove={() => { library.remove(selected.id, selected.name); setSelectedId(null); setConfirmId(null); }}
                />
              )}
            </section>
            <footer className="dash-footer"><span><ShieldCheck size={14} />A dead disk should not erase the file.</span><span>Hydras / Library</span></footer>
          </main>
        </div>
      </div>
    </div>
  );
}

function isBucket(value: string | undefined): value is BucketId {
  return BUCKETS.some((bucket) => bucket.id === value);
}

function Metric({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return <div className={`metric-card ${accent ? "accent" : ""}`}><div><span>{label}</span><ShieldCheck size={20} /></div><strong>{value}</strong><p><span className="metric-dash" />{hint}</p></div>;
}

function FileDetail({
  file,
  machines,
  canDownloadOriginal,
  confirming,
  onDownload,
  onAskRemove,
  onCancel,
  onRemove,
}: {
  file: LibraryFile;
  machines: ReturnType<typeof useLibrary>["state"]["machines"];
  canDownloadOriginal: boolean;
  confirming: boolean;
  onDownload: () => void;
  onAskRemove: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const health = fileHealth(file, machines);
  return (
    <div className="library-detail">
      <strong>{file.name}</strong>
      <p>{healthDetail(health)}</p>
      <div className="library-copies">
        {file.replicas.map((id) => {
          const machine = machines.find((item) => item.id === id);
          const down = !machine?.running;
          return <span key={id} className={down ? "is-down" : ""}>{id} · {machine?.zone} · {down ? "stopped" : "online"}</span>;
        })}
      </div>
      <div className="library-actions">
        <button className="primary-button" type="button" disabled={!health.readable} onClick={onDownload}>{canDownloadOriginal ? "Download" : "Read a copy"}</button>
        {confirming ? (
          <>
            <button className="secondary-button" type="button" onClick={onRemove}><Trash2 size={15} />Remove from all machines</button>
            <button className="quiet-button" type="button" onClick={onCancel}>Cancel</button>
          </>
        ) : (
          <button className="secondary-button" type="button" onClick={onAskRemove}><Trash2 size={15} />Remove</button>
        )}
      </div>
    </div>
  );
}

function downloadFile(file: LibraryFile, machines: ReturnType<typeof useLibrary>["state"]["machines"], original: Blob | undefined) {
  const health = fileHealth(file, machines);
  if (!health.readable) return;
  const blob = original ?? new Blob(
    [`${file.name}\n\nThis sample file stays readable because ${health.copiesOnline} of 3 copies are still online.\nCopies: ${file.replicas.join(", ")}\n`],
    { type: "text/plain" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = original ? file.name : `${file.name}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

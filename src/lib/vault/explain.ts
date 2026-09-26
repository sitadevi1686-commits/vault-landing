export type CheckState = "pass" | "working" | "fail" | "idle";

export type ProofCheck = {
  id: string;
  title: string;
  state: CheckState;
  evidence: string;
};

export type ProofInput = {
  known: boolean;
  reachable: boolean;
  nodesUp: number;
  nodesTotal: number;
  objects: number;
  objectsSafe: number;
  unavailable: number;
  degraded: number;
  atRisk: number;
  openIncidents: number;
  resolvedIncidents: number;
  lastRecoveryMs: number;
};

export function proofChecks(input: ProofInput): ProofCheck[] {
  if (!input.known) {
    return [
      idle("reachable", "Vault is running", "Still asking the control panel."),
      idle("copies", "A dead disk does not erase the file", "Waiting until Vault answers."),
      idle("repair", "Repair time is measured", "Waiting until Vault answers."),
    ];
  }
  return [vaultAnswers(input), copiesSurvive(input), repairIsTimed(input)];
}

function idle(id: string, title: string, evidence: string): ProofCheck {
  return { id, title, state: "idle", evidence };
}

function vaultAnswers(input: ProofInput): ProofCheck {
  if (!input.reachable) {
    return {
      id: "reachable",
      title: "Vault is running",
      state: "fail",
      evidence: "This page cannot reach the control panel, so nothing below is live.",
    };
  }
  return {
    id: "reachable",
    title: "Vault is running",
    state: "pass",
    evidence: `The control panel answered. ${input.nodesUp} of ${input.nodesTotal} storage machines are serving files.`,
  };
}

function copiesSurvive(input: ProofInput): ProofCheck {
  if (!input.reachable) {
    return {
      id: "copies",
      title: "A dead disk does not erase the file",
      state: "idle",
      evidence: "Waiting for Vault before this can be judged.",
    };
  }
  if (input.unavailable > 0) {
    return {
      id: "copies",
      title: "A dead disk does not erase the file",
      state: "fail",
      evidence: `${input.unavailable} piece${input.unavailable === 1 ? "" : "s"} of data ha${input.unavailable === 1 ? "s" : "ve"} no healthy copy. A download of that file would fail.`,
    };
  }
  if (input.degraded > 0 || input.atRisk > 0 || input.openIncidents > 0) {
    return {
      id: "copies",
      title: "A dead disk does not erase the file",
      state: "working",
      evidence:
        "A machine is missing and Vault is copying data onto the ones that are still up. A download should still succeed.",
    };
  }
  if (input.objects === 0) {
    return {
      id: "copies",
      title: "A dead disk does not erase the file",
      state: "idle",
      evidence:
        "No files are stored yet. Upload one, or kill a disk after a scenario has written photos, then watch this line.",
    };
  }
  return {
    id: "copies",
    title: "A dead disk does not erase the file",
    state: "pass",
    evidence: `${input.objectsSafe} of ${input.objects} files still have every copy in place.`,
  };
}

function repairIsTimed(input: ProofInput): ProofCheck {
  if (!input.reachable) {
    return {
      id: "repair",
      title: "Repair time is measured",
      state: "idle",
      evidence: "Waiting for Vault before a recovery time can be shown.",
    };
  }
  if (input.openIncidents > 0) {
    return {
      id: "repair",
      title: "Repair time is measured",
      state: "working",
      evidence: `${input.openIncidents} repair${input.openIncidents === 1 ? " is" : "s are"} still open. The clock stops when every copy is back.`,
    };
  }
  if (input.resolvedIncidents === 0) {
    return {
      id: "repair",
      title: "Repair time is measured",
      state: "idle",
      evidence: "No failure yet. Kill one disk. This line then shows how many seconds the repair took.",
    };
  }
  const seconds =
    input.lastRecoveryMs >= 1000
      ? `${(input.lastRecoveryMs / 1000).toFixed(1)} seconds`
      : `${Math.round(input.lastRecoveryMs)} ms`;
  return {
    id: "repair",
    title: "Repair time is measured",
    state: "pass",
    evidence: `The last repair finished in ${seconds}. That number is the recovery time you can cite.`,
  };
}

const KIND_LABELS: Record<string, string> = {
  "node-loss": "A storage machine stopped",
  partition: "The network to a machine was cut",
  corruption: "A copy on disk failed its checksum",
  "under-replication": "A file had too few copies",
};

export function incidentKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export function incidentStatusLabel(status: string): string {
  if (status === "open") return "Repairing";
  if (status === "resolved") return "Repaired";
  return status;
}

export function nodeSituation(state: string, link: string): { label: string; meaning: string } {
  if (link === "partitioned") {
    return {
      label: "Network cut",
      meaning: "The program is still running, but Vault cannot reach it. This is a broken switch, not a dead disk.",
    };
  }
  if (link === "flaky") {
    return {
      label: "Dropping packets",
      meaning: "Some requests to this machine are lost on purpose, so you can see retries.",
    };
  }
  if (link === "slow") {
    return {
      label: "Slow link",
      meaning: "This machine answers, but each request is delayed.",
    };
  }
  if (state === "down") {
    return {
      label: "Stopped",
      meaning: "This disk is gone. Other copies should still serve the file.",
    };
  }
  if (state === "suspect") {
    return {
      label: "Not answering",
      meaning: "Heartbeats are missing. Vault is about to treat this machine as dead.",
    };
  }
  if (state === "starting") {
    return {
      label: "Starting",
      meaning: "The process is coming back and has not rejoined yet.",
    };
  }
  return {
    label: "Serving",
    meaning: "This machine can store files and return them.",
  };
}

export function checkMark(state: CheckState): string {
  if (state === "pass") return "Passed";
  if (state === "working") return "In progress";
  if (state === "fail") return "Failed";
  return "Not shown yet";
}

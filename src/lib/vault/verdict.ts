export type VerdictTone = "safe" | "repairing" | "risk" | "offline";

export type ClusterVerdict = {
  tone: VerdictTone;
  title: string;
  detail: string;
};

export type VerdictInput = {
  reachable: boolean;
  unavailable: number;
  degraded: number;
  atRisk: number;
  openIncidents: number;
  nodesUp: number;
  nodesTotal: number;
  objectsSafe: number;
  objects: number;
};

export function clusterVerdict(input: VerdictInput): ClusterVerdict {
  if (!input.reachable) {
    return {
      tone: "offline",
      title: "Control panel is not reachable",
      detail:
        "Start Hydras on this machine, then refresh. The console reads the local control panel.",
    };
  }
  if (input.unavailable > 0) {
    return {
      tone: "risk",
      title: "Some data cannot be read",
      detail: `${input.unavailable} chunk${input.unavailable === 1 ? "" : "s"} ha${input.unavailable === 1 ? "s" : "ve"} no healthy copy left.`,
    };
  }
  if (input.atRisk > 0 || input.degraded > 0 || input.openIncidents > 0) {
    const weak = input.atRisk + input.degraded;
    return {
      tone: "repairing",
      title: "Your data is repairing",
      detail:
        weak > 0
          ? `${weak} chunk${weak === 1 ? "" : "s"} ${weak === 1 ? "is" : "are"} below the replica target. Hydras is copying them back.`
          : `${input.openIncidents} incident${input.openIncidents === 1 ? "" : "s"} still open. Copies are being restored.`,
    };
  }
  const nodeLine =
    input.nodesTotal === 0
      ? "No storage machines are registered."
      : `${input.nodesUp} of ${input.nodesTotal} storage machines are serving files.`;
  const objectLine =
    input.objects === 0
      ? "No files are stored yet."
      : `${input.objectsSafe} of ${input.objects} files still have every copy.`;
  const missing = input.nodesTotal - input.nodesUp;
  if (missing > 0) {
    return {
      tone: "safe",
      title: input.objects === 0 ? "No files to lose. Some machines are down." : "Stored files still have every copy.",
      detail: `${objectLine} ${nodeLine} The others are stopped or cut off.`,
    };
  }
  return {
    tone: "safe",
    title: "Your data is safe",
    detail: `${objectLine} ${nodeLine}`,
  };
}

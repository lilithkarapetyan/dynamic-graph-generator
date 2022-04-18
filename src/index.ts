import Graph from "./Graph";
import { getRandomVertex, repeat } from "./utils";

export function createSnapshots({
  vertexCount,
  snapshotCount,
  probability,
  name,
}: {
  vertexCount: number,
  snapshotCount: number,
  probability?: '1/n' | '0.1/n' | '0.05/n' | 'logn/n' | '18logn/n' | 'random' | number;
  name?: string,
}) {
  const g = new Graph({ directed: false, name });

  repeat(() => g.addVertex(), vertexCount);

  repeat(() => {
    g.clearEdges();

    let p = () => 0.5;
    switch (probability) {
      case '1/n': p = () => 1 / vertexCount; break;
      case '0.1/n': p = () => 0.1 / vertexCount; break;
      case '0.05/n': p = () => 0.05 / vertexCount; break;
      case 'logn/n': p = () => Math.log(vertexCount) / vertexCount; break;
      case '18logn/n': p = () => 18 * Math.log(vertexCount) / vertexCount; break;
      case 'random': p = () => Math.random(); break;
      default: p = probability ? () => probability : p; break;
    }

    for (let i = 0; i < vertexCount; i++) {
      for (let j = 0; j < vertexCount; j++) {
        if (Math.random() <= p())
          g.addRandomEdge(i, j);
      }
    }
    g.takeSnapshot();
  }, snapshotCount);

  return {
    snapshots: g.getSnapshots(),
    snapshotStrings: g.snapshotsToString(),
    snapshotMatrices: g.getSnapshots(true),
    details: {
      name: g.getName(),
      probability,
      vertexCount,
      snapshotCount
    },
  };
}

export function createFromSnapshots(snapshots: any, name?: string) {
  const g = new Graph({
    data: snapshots.snapshots[0],
    snapshots: snapshots.snapshots,
    name: snapshots.details.name,
  });

  return {
    snapshots: g.getSnapshots(),
    snapshotStrings: g.snapshotsToString(),
    snapshotMatrices: g.getSnapshots(true),
    details: {
      name: g.getName()
    },
  };
}

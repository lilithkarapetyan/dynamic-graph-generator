import Graph from "./src/Graph";
import { getRandomVertex, repeat } from "./src/utils";

const g = new Graph({ directed: true });
const VERTEX_COUNT = 100;
const MAX_EDGE_COUNT = VERTEX_COUNT * VERTEX_COUNT;

repeat(() => g.addVertex(), VERTEX_COUNT);

repeat(() => g.addEdge(getRandomVertex(VERTEX_COUNT), getRandomVertex(VERTEX_COUNT)), Math.random() * MAX_EDGE_COUNT);

g.takeSnapshot();

repeat(() => {
  g.changeEdge(getRandomVertex(VERTEX_COUNT), getRandomVertex(VERTEX_COUNT));
  g.changeEdge(getRandomVertex(VERTEX_COUNT), getRandomVertex(VERTEX_COUNT));
  g.changeEdge(getRandomVertex(VERTEX_COUNT), getRandomVertex(VERTEX_COUNT));
  g.takeSnapshot();
}, 1000);

// g.printSnapshots();

export const snapshots = g.getSnapshots();

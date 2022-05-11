// @ts-nocheck
import fs from 'fs';
import path from "path";
import { createSnapshots } from "../src";

let csvStr = 'index,name,probability,kcast,infoGivingTimeout,originator,broadcastVerticesPMF,broadcastVerticesCDF,unicastVerticesPMF,unicastVerticesCDF,broadcastVerticesAll,unicastVerticesAll\n';

function generateVertexSnapshots({ distributionsData, snapshotsData, originator, castIndex, maxInfoGivingTime }) {
  let infoMap = {};
  let infoQueue = [];

  const storedSnapshots = snapshotsData.snapshots;

  const infoSnapshots = storedSnapshots.map(snapshot => (
    snapshot.vertices.map((vertex, index) => ({
      id: vertex,
      hasUnicastInfo: index === originator,
      hasBroadcastInfo: index === originator,
      broadcastTimer: 0,
      unicastTimer: 0,
    }))
  ));

  storedSnapshots.forEach((snapshot, index) => {
    const vertices = infoSnapshots[index];

    if (infoSnapshots[index - 1]) {
      vertices.forEach((vertex, vertexIndex) => {
        vertex.hasUnicastInfo = infoSnapshots[index - 1][vertexIndex].hasUnicastInfo;
        vertex.unicastTimer = infoSnapshots[index - 1][vertexIndex].unicastTimer;
        vertex.hasBroadcastInfo = infoSnapshots[index - 1][vertexIndex].hasBroadcastInfo;
        vertex.broadcastTimer = infoSnapshots[index - 1][vertexIndex].broadcastTimer;


        if(vertex.broadcastTimer > maxInfoGivingTime) {
          vertex.hasBroadcastInfo = false;
        }
        if(vertex.unicastTimer > maxInfoGivingTime) {
          vertex.hasUnicastInfo = false;
        }
      })
    }

    snapshot.edges.forEach(edge => {
      if (
        vertices[edge.s].hasBroadcastInfo &&
        !vertices[edge.t].hasBroadcastInfo
      ) {
        infoQueue.push(edge.t);
      }
      if (
        vertices[edge.t].hasBroadcastInfo &&
        !vertices[edge.s].hasBroadcastInfo
      ) {
        infoQueue.push(edge.s);
      }
      if (
        vertices[edge.t].hasUnicastInfo &&
        !vertices[edge.s].hasUnicastInfo
      ) {
        if (!Object.values(infoMap).filter(value =>  value?.has(edge.s)).length) {
          if(!infoMap[edge.t]){
            infoMap[edge.t] = new Set();
          }
          if(infoMap[edge.t].size < castIndex) {
            infoMap[edge.t].add(edge.s);
          }
        }
      }
      if (
        vertices[edge.s].hasUnicastInfo &&
        !vertices[edge.t].hasUnicastInfo
      ) {
        if (!Object.values(infoMap).filter(value => value.has(edge.t)).length) {
          if(!infoMap[edge.s]){
            infoMap[edge.s] = new Set();
          }
          if(infoMap[edge.s].size < castIndex) {
            infoMap[edge.s].add(edge.t);
          }
        }
      }
    });

    infoQueue.forEach(vertexIndex => {
      vertices[vertexIndex].hasBroadcastInfo = true;
      vertices[vertexIndex].broadcastTimer = 0;
    });
    Object.values(infoMap).forEach(vertexSet => vertexSet?.forEach(vertexIndex => {
      vertices[vertexIndex].hasUnicastInfo = true;
      vertices[vertexIndex].unicastTimer = 0;
    }));

    snapshot.vertices.forEach(vertex => {
      if (vertices[vertex].hasBroadcastInfo) {
        vertices[vertex].broadcastTimer++;
      }
      if (vertices[vertex].hasUnicastInfo) {
        vertices[vertex].unicastTimer++;
      }
    });

    const unicastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasUnicastInfo), 0);
    const broadcastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasBroadcastInfo), 0);

    const unicastVerticesAll = vertices.filter(vertex => vertex.unicastTimer !== 0).length;
    const broadcastVerticesAll = vertices.filter(vertex => vertex.broadcastTimer !== 0).length;

    distributionsData.info.push([ index, snapshotsData.details.name, snapshotsData.details.probability, castIndex, maxInfoGivingTime, originator, broadcastVertices - distributionsData.prevBroadcastVertices, broadcastVertices, unicastVertices - distributionsData.prevUnicastVertices, unicastVertices, broadcastVerticesAll, unicastVerticesAll]);
    distributionsData.prevUnicastVertices = unicastVertices;
    distributionsData.prevBroadcastVertices = broadcastVertices;

    infoMap = {};
    infoQueue = [];
  })
}

const distributionsData = {
  info: [],
  prevUnicastVertices: 0,
  prevBroadcastVertices: 0,
};

const VERTEX_COUNT = 100;
const SNAPSHOT_COUNT = 50;

const fileName = new Date().toLocaleString().replace(/\//g, ".");
fs.writeFile(path.join('.', 'data', `data_${fileName}.csv`), csvStr + distributionsData.info.map(row => row.toString()).join('\n'), console.log);

// v2 * snap * 10 * GRAPH_COUNT

// 10 * 2 * 25 * 10 * 100 ...
for(let p = 0.001; p <= 0.5; p *= 2) {
  for(let g = 0; g < 2; g++) {
    const snapshotsData = createSnapshots({
      vertexCount: VERTEX_COUNT,
      snapshotCount: SNAPSHOT_COUNT,
      probability: p
    });
    fs.writeFile(path.join('.', 'data', 'graphs', `${snapshotsData.details.name}.json`),  JSON.stringify(snapshotsData), console.log)

    for(let t = 2; t < SNAPSHOT_COUNT / 2; t++) {
      for (let k = 1; k < VERTEX_COUNT / 10; k++) {
        for (let i = 0; i < VERTEX_COUNT; i++) {
          distributionsData.prevBroadcastVertices = 0;
          distributionsData.prevUnicastVertices = 0;
          generateVertexSnapshots({
            distributionsData,
            snapshotsData,
            originator: i,
            castIndex: k,
            maxInfoGivingTime: t,
          });
        }
      }
      fs.appendFileSync(path.join('.', 'data', `data_${fileName}.csv`), distributionsData.info.map(row => row.toString()).join('\n') + '\n');
      distributionsData.info = [];
    }
  }
}

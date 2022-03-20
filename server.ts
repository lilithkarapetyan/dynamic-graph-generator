import express from "express";
import { createFromSnapshots, createSnapshots } from "./index";

const app = express()
const port = 3000;

let snapshotsData = createSnapshots({
  vertexCount: 200,
  snapshotCount: 200,
  densityIndex: 10,
});

// let infoSnapshots = createInfoSnapshots(snapshotsData);

app.use(express.json({limit: '50mb'}))

app.get('/snapshots', (req, res) => {
  res.json(snapshotsData.snapshots)
})

app.get('/snapshots-string', (req, res) => {
  res.json(snapshotsData.snapshotStrings)
})

app.get('/snapshots-matrix', (req, res) => {
  res.json(snapshotsData.snapshotMatrices)
})

app.post('/from-snapshots', (req, res) => {
  snapshotsData = createFromSnapshots(req.body.data);
  res.json(snapshotsData.snapshots)
})

app.post('/snapshots', (req, res) => {
  const { vertexCount, snapshotCount, densityIndex } = req.body;
  snapshotsData = createSnapshots({
    vertexCount,
    snapshotCount,
    densityIndex,
  });
  res.json(snapshotsData.snapshots);
})

app.get('/')

app.use(express.static('client'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

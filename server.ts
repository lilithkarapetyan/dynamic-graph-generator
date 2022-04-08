const express = require("express");
import { createFromSnapshots, createSnapshots } from "./src/index";

const app = express()
const port = 3000;

let snapshotsData = createSnapshots({
  vertexCount: 10,
  snapshotCount: 200,
});

app.use(express.json({ limit: '50mb' }))

app.get('/snapshots', (req: any, res: any) => {
  const { snapshots, details } = snapshotsData;
  res.json({ snapshots, details });
})

app.get('/snapshots-string', (req: any, res: any) => {
  res.json(snapshotsData.snapshotStrings)
})

app.get('/snapshots-matrix', (req: any, res: any) => {
  res.json(snapshotsData.snapshotMatrices)
})

app.post('/from-snapshots', (req: any, res: any) => {
  const { data, name } = req.body;
  const snapshotsData = createFromSnapshots(data, name);
  const { snapshots, details } = snapshotsData;
  res.json({ snapshots, details });
})

app.post('/snapshots', (req: any, res: any) => {
  const { vertexCount, snapshotCount, probability, name } = req.body;
  snapshotsData = createSnapshots({
    vertexCount,
    snapshotCount,
    probability,
    name,
  });
  const { snapshots, details } = snapshotsData;
  res.json({ snapshots, details });
})

app.get('/')

app.use(express.static('client'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

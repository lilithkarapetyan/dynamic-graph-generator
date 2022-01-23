import express from "express";
import { snapshots } from "./index";

const app = express()
const port = 3000;

app.use(express.json())

app.get('/snapshots', (req, res) => {
  res.json(snapshots)
})

app.use(express.static('client'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

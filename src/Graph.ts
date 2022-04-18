const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');


class Graph {
  private readonly data: number[][] = [];
  private readonly snapshots: Graph[] = [];
  private readonly directed: boolean;
  private readonly name: string = '';

  constructor({
    data,
    snapshots,
    directed,
    name,
  }: {
    data?: number[][],
    snapshots?: number[][][],
    directed?: boolean,
    name?: string;
  }) {
    this.directed = directed ?? false;
    this.name = name || uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

    if (data) {
      for (let i = 0; i < data.length; i++) {
        this.data.push([]);
        for (let j = 0; j < data[i].length; j++) {
          this.data[i].push(data[i][j]);
        }
      }
    }

    if (snapshots) {
      this.snapshots = snapshots.map((snapshot: number[][]) => new Graph({ data: snapshot }));
    }
  }

  addEdge(v1: number, v2: number, weight: number = 1) {
    this.data[v1][v2] = weight;
    if (!this.directed) {
      this.data[v2][v1] = weight;
    }
  }

  clearEdges() {
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        this.data[i][j] = 0;
      }
    }
  }
  addVertex() {
    this.data.forEach(row => row.push(0));
    this.data.push((new Array<number>(this.data.length + 1) as number[]).fill(0));

    return this.data.length - 1;
  }

  getEdges() {
    const result = [];

    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        if (!this.data[i][j]) continue;

        result.push({
          s: i,
          t: j,
        })
      }
    }

    return result;
  }

  getVertices() {
    return new Array(this.data.length).fill(0).map((item, index) => index);
  }

  changeEdge(v1: number, v2: number) {
    this.data[v1][v2] = +!this.data[v1][v2];
  }

  addRandomEdge(v1: number, v2: number) {
    this.data[v1][v2] = 1;
  }

  removeRandomEdge(v1: number, v2: number) {
    this.data[v1][v2] = 0;
  }

  takeSnapshot() {
    this.snapshots.push(new Graph({ data: this.data }));
  }

  getName() {
    return this.name;
  }
  getSnapshots(isMatrix?: boolean) {
    if (isMatrix) {
      return this.snapshots.map(item => item.data);
    }
    return this.snapshots.map(snapshot => ({
      vertices: snapshot.getVertices(),
      edges: snapshot.getEdges(),
    }))
  }

  print() {
    console.log(this.toString());
  }

  snapshotsToString() {
    return this.snapshots.map(snapshot => snapshot.toString());
  }

  toString() {
    const string = JSON.stringify(this.data);
    const spacing = 3;
    const rows = string
      .substring(1, string.length - 1)
      .split("],[")
      .map((row, index) => index + " ".repeat(3 * spacing - `${index}`.length) + row + "\n")

    const prettyString = rows.join("")
      .replace(/\[|]/g, "")
      .replace(/,/g, " ".repeat(spacing)) + "\n";

    const horizontalNumbering = " ".repeat(3 * spacing)
      + new Array(rows.length)
        .fill(0)
        .map((item, index) => index + " ".repeat(spacing + 1 - `${index}`.length))
        .join("")
      + "\n".repeat(spacing);
    return horizontalNumbering + prettyString;
  }

}

export default Graph;

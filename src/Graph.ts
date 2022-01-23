class Graph {
  private readonly data: number[][] = [];
  private readonly snapshots: Graph[] = [];
  private readonly directed: boolean;

  constructor({
    graph,
    directed
  } : {
    graph?: Graph,
    directed?: boolean,
  }) {
    this.directed = directed ?? false;
    if(graph?.data) {
      for(let  i = 0; i < graph.data.length; i++) {
        this.data.push([]);
        for(let j = 0; j < graph.data[i].length; j++) {
          this.data[i].push(graph.data[i][j]);
        }
      }
    }
  }

  addEdge(v1: number, v2: number, weight: number = 1) {
    this.data[v1][v2] = weight;
    if(!this.directed) {
      this.data[v2][v1] = weight;
    }
  }

  addVertex() {
    this.data.forEach(row => row.push(0));
    this.data.push((new Array<number>(this.data.length + 1) as number[]).fill(0));

    return this.data.length - 1;
  }

  getEdges() {
    const result = [];

    for(let i = 0; i < this.data.length; i++) {
      for(let j = 0; j < this.data[i].length; j++) {
        if(!this.data[i][j]) continue;

        result.push({
          source: i,
          target: j,
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

  takeSnapshot() {
    this.snapshots.push(new Graph({ graph: this }));
  }

  getSnapshots() {
    return this.snapshots.map(snapshot => ({
      vertices: snapshot.getVertices(),
      edges: snapshot.getEdges(),
    }))
  }

  print() {
    console.log(this.toString());
  }

  printSnapshots() {
    this.snapshots.forEach(snapshot => snapshot.print());
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

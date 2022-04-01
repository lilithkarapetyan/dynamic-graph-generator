export function getRandomVertex(vertexCount: number) {
  return Math.floor(Math.random() * vertexCount);
}

export function repeat(f: Function, n: number) {
  for (let i = 0; i < n; i++) {
    f(i, n);
  }
}

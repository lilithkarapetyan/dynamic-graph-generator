fetch("http://localhost:3000/snapshots").then(async data => {
  const snapshots = await data.json();
  let chart;
  let i = 0;

  chart && document.getElementById("scene").removeChild(chart);
  chart = ForceGraph({
    nodes: snapshots[i].vertices,
    links: snapshots[i].edges,
  }, {
    nodeId: d => d,
    nodeTitle: d => d,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  document.getElementById("scene").appendChild(chart);

  const interval = setInterval(() => {
    if(!snapshots[i]) {
      clearInterval(interval);
      return;
    }
    chart.update({
      nodes: snapshots[i].vertices,
      links: snapshots[i].edges,
    });
    i++;
  }, 20)

})

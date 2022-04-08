let drawInterval;
let storedSnapshots;
let storedDetails;
let lastSnapshotIndex = 0;
let previousSelectedTimelineItem;
let vertexSnapshots = [];
const playText = 'Play';
const pauseText = 'Pause';
const BASE_URL = 'http://localhost:3000';
const distributionsData = {
  info: [],
  prevUnicastVertices: 0,
  prevBroadcastVertices: 0,
};

function calculateIsolationPercentage(graph) {
  const arr = new Array(graph.vertices.length).fill(0);
  for (let i = 0; i < graph.edges.length; i++) {
    arr[graph.edges[i].source] = 1;
    arr[graph.edges[i].target] = 1;
  }

  return 100 - arr.reduce((acc, item) => acc + item, 0) / arr.length * 100;
}

function calculateDegrees(graph) {
  const arr = new Array(graph.vertices.length).fill(0).map((_, index) => ({ value: 0, index }));
  for (let i = 0; i < graph.edges.length; i++) {
    arr[graph.edges[i].source].value++;
    arr[graph.edges[i].target].value++;
  }

  return arr;
}

function setupTimeline(snapshots) {
  const timelineDiv = document.getElementById('timeline');

  if (timelineDiv.children.length === snapshots.length + 1) {
    return;
  }

  timelineDiv.innerHTML = '<hr />';

  const timelineItemClick = (e) => {
    lastSnapshotIndex = +e.target.getAttribute('data-index');

    if (previousSelectedTimelineItem) {
      previousSelectedTimelineItem.classList.remove('active');
    }
    previousSelectedTimelineItem = e.target;
    previousSelectedTimelineItem.classList.add('active');
    play();
    pause()
  }

  snapshots.forEach((_, index) => {
    const div = document.createElement('div');
    div.classList.add('timeline-item');
    div.innerHTML = index;
    div.setAttribute('data-index', index);
    div.onclick = timelineItemClick;
    timelineDiv.appendChild(div);
  })
}

function drawGraphDiff() {
  document.getElementById("snapshots").innerHTML = ''
  const [snapshot] = storedSnapshots;

  let chart = ForceGraph({
    nodes: snapshot.vertices,
    links: snapshot.edges,
  }, {
    nodeId: d => d,
    nodeTitle: d => d,
    width: window.innerWidth / 3 * 2,
    height: window.innerHeight / 3 * 2,
    nodeStrokeWidth: 2,
    linkStrokeWidth: 1,
    nodeStrength: -200,
    nodeRadius: 4,
  })
  chart.tick();

  document.getElementById("snapshots").appendChild(chart);

}

function drawGraph(newSnapshots, initialSnapshotIndex = 0) {
  let chart;
  let vertices;
  let snapshots = newSnapshots || storedSnapshots;
  let snapshotIndex = initialSnapshotIndex;

  if (snapshots) {
    storedSnapshots = snapshots;
    drawGraphDiff()
  }

  generateVertexSnapshots();

  document.getElementById('snapshotCountNumber').innerText = snapshots.length;
  document.getElementById('vertexCountNumber').innerText = snapshots[0].vertices.length;

  chart = ForceGraph({
    nodes: snapshots[snapshotIndex].vertices,
    links: snapshots[snapshotIndex].edges,
  }, {
    nodeId: d => d,
    nodeTitle: d => d,
    width: window.innerWidth / 3 * 2,
    height: window.innerHeight / 3 * 2,
    nodeStrokeWidth: 2,
    linkStrokeWidth: 1,
    nodeStrength: -200,
    withDrag: true
  });

  document.getElementById("scene").appendChild(chart);

  setupTimeline(snapshots);
  function a() {
    if (!snapshots[snapshotIndex] || !vertexSnapshots[snapshotIndex]) {
      pause();
      lastSnapshotIndex = 0;
      return;
    }

    vertices = vertexSnapshots[snapshotIndex];
    chart.update({
      links: snapshots[snapshotIndex].edges,
    });

    document.getElementById("snapshotId").innerHTML = `${snapshotIndex}`;
    document.getElementById("isolationPercentage").innerText = `${calculateIsolationPercentage(snapshots[snapshotIndex]).toFixed(2)}%`;

    const isUnicast = document.getElementById('unicastSwitcher').checked;
    vertices.forEach(vertex => {
      document.getElementById(`node-${vertex.id}`).setAttribute('fill', (isUnicast ? (vertex.hasUnicastInfo ? '#42aa9d' : 'black') : (vertex.hasBroadcastInfo ? '#425caa' : 'black')));
    })

    snapshotIndex++;
    lastSnapshotIndex = snapshotIndex;
    drawStats();

  }
  a()
  drawInterval = setInterval(() => a(), 500)
}

function clearGraph() {
  clearInterval(drawInterval);
  document.getElementById('connectedRoundsUnicast').innerText = ' - '
  document.getElementById('connectedRoundsBroadcast').innerText = ' - '
  document.getElementById('scene').innerHTML = '';
}

function setLoading(isShowing) {
  const loading = document.getElementById('loading');
  if (isShowing) {
    loading.classList.add('visible');
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
    loading.classList.remove('visible');
  }
}

function downloadInformed() {
  const element = document.createElement('a');
  element.setAttribute('href', generateStatsCSV());
  element.setAttribute('download', `informed_vertices_${document.getElementById('graphName').innerText}.csv`);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function uploadFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', handleFiles, false);

  function handleFiles() {
    setLoading(true);
    const fileList = this.files;

    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const dataURI = event.target.result;

      const json = atob(dataURI.substring(29)); // 29 = length of "data:application/json;base64,"
      const result = JSON.parse(json);

      fetch(`${BASE_URL}/from-snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: result })
      })
        .then(data => data.json())
        .then(snapshots => startNewGraph(snapshots))
        .finally(() => setLoading(false));
    });
    reader.readAsDataURL(fileList[0]);
  }

  input.click()
}

function play() {
  const playButton = document.getElementById('playToggle');
  clearGraph();
  drawGraph(undefined, lastSnapshotIndex);
  playButton.innerText = pauseText;
  playButton.classList.add('playing');
}

function pause() {
  const playButton = document.getElementById('playToggle');
  playButton.innerText = playText;
  clearInterval(drawInterval);
  drawStats()
  playButton.classList.remove('playing');
}

function drawStats() {
  document.getElementById('linechart-broadcast').innerHTML = '';
  document.getElementById('linechart-unicast').innerHTML = '';
  document.getElementById('linechart-isolated').innerHTML = '';
  document.getElementById('linechart-edges').innerHTML = '';

  const transformedData = distributionsData.info.map(each => {
    const [index, broadcastSingle, broadcast, unicastSingle, unicast, isolated, edges] = each;
    return {
      index,
      broadcastSingle,
      unicastSingle,
      isolated,
      edges,
    }
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-broadcast',
    xAxis: 'index',
    yAxis: 'broadcastSingle'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-unicast',
    xAxis: 'index',
    yAxis: 'unicastSingle'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-isolated',
    xAxis: 'index',
    yAxis: 'isolated'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-edges',
    xAxis: 'index',
    yAxis: 'edges'
  })
}

function playToggled() {
  const playButton = document.getElementById('playToggle');

  if (playButton.innerText === pauseText) pause();
  else play();
}

async function startNewGraph(snapshotsInfo) {
  clearGraph();
  lastSnapshotIndex = 0;
  document.getElementById('graphName').innerText = snapshotsInfo.details.name;
  storedDetails = snapshotsInfo.details;
  await drawGraph(snapshotsInfo.snapshots);
  play();
}

function generateNewGraph() {
  setLoading(true);

  const vertexCount = document.getElementById('vertexCount').value;
  const probability = document.getElementById('probability').value;
  const snapshotCount = document.getElementById('snapshotCount').value;

  localStorage.setItem('vertexCount', vertexCount);
  localStorage.setItem('probability', probability);
  localStorage.setItem('snapshotCount', snapshotCount);

  return fetch(`${BASE_URL}/snapshots`, {
    method: 'POST',
    body: JSON.stringify({
      vertexCount: +vertexCount,
      probability: probability.includes('n') ? probability : +probability,
      snapshotCount: +snapshotCount,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(data => data.json())
    .then(snapshotsInfo => startNewGraph(snapshotsInfo))
    .finally(() => setLoading(false));
}

function generateVertexSnapshots(startIndex = 0) {
  let infoMap = {};
  let infoQueue = [];
  distributionsData.info = [];
  distributionsData.prevUnicastVertices = 0;
  distributionsData.prevBroadcastVertices = 0;

  const infoSnapshots = storedSnapshots.map(snapshot => (
    snapshot.vertices.map((vertex, index) => ({
      id: vertex, hasUnicastInfo: index === startIndex, hasBroadcastInfo: index === startIndex
    }))
  ));

  storedSnapshots.forEach((snapshot, index) => {
    const vertices = infoSnapshots[index];

    if (infoSnapshots[index - 1]) {
      vertices.forEach((vertex, vertexIndex) => {
        vertex.hasUnicastInfo = infoSnapshots[index - 1][vertexIndex].hasUnicastInfo;
        vertex.hasBroadcastInfo = infoSnapshots[index - 1][vertexIndex].hasBroadcastInfo;
      })
    }

    snapshot.edges.forEach(edge => {
      if (vertices[edge.source].hasBroadcastInfo && !vertices[edge.target].hasBroadcastInfo) {
        infoQueue.push(edge.target);
      }
      if (vertices[edge.target].hasBroadcastInfo && !vertices[edge.source].hasBroadcastInfo) {
        infoQueue.push(edge.source);
      }
      if (vertices[edge.target].hasUnicastInfo && !vertices[edge.source].hasUnicastInfo) {
        if (!Object.values(infoMap).includes(edge.source))
          infoMap[edge.target] = edge.source;
      }
      if (vertices[edge.source].hasUnicastInfo && !vertices[edge.target].hasUnicastInfo) {
        if (!Object.values(infoMap).includes(edge.target))
          infoMap[edge.source] = edge.target;
      }
    });

    infoQueue.forEach(vertexIndex => vertices[vertexIndex].hasBroadcastInfo = true);
    Object.values(infoMap).forEach(vertexIndex => vertices[vertexIndex].hasUnicastInfo = true);

    const unicastVertices = vertices.reduce((acc, vertex) => acc + Number(vertex.hasUnicastInfo), 0);
    const broadcastVertices = vertices.reduce((acc, vertex) => acc + Number(vertex.hasBroadcastInfo), 0);

    if (unicastVertices == vertices.length && document.getElementById('connectedRoundsUnicast').innerText == '-') {
      document.getElementById('connectedRoundsUnicast').innerText = index;
    }

    if (broadcastVertices == vertices.length && document.getElementById('connectedRoundsBroadcast').innerText == '-') {
      document.getElementById('connectedRoundsBroadcast').innerText = index;
    }

    distributionsData.info.push([distributionsData.info.length, broadcastVertices - distributionsData.prevBroadcastVertices, broadcastVertices, unicastVertices - distributionsData.prevUnicastVertices, unicastVertices, calculateIsolationPercentage(snapshot), snapshot.edges.length / Math.pow(snapshot.vertices.length, 2) * 100]);
    distributionsData.prevUnicastVertices = unicastVertices;
    distributionsData.prevBroadcastVertices = broadcastVertices;

    infoMap = {};
    infoQueue = [];
  })

  vertexSnapshots = infoSnapshots;
}

function setup() {
  setLoading(true);
  fetch(`${BASE_URL}/snapshots`)
    .then(data => data.json())
    .then(snapshots => startNewGraph(snapshots))
    .finally(() => setLoading(false));

  drawStats();

  document.getElementById('vertexCount').value = localStorage.getItem('vertexCount');
  document.getElementById('probability').value = localStorage.getItem('probability');
  document.getElementById('snapshotCount').value = localStorage.getItem('snapshotCount');
}

setup();

function generateStatsCSV() {
  return 'data:text/json;charset=utf-8,index,broadcastSingle,broadcast,unicastSingle,unicast,isolated,edges\n' + encodeURIComponent(distributionsData.info.map(row => row.toString()).join('\n'));
}

function downloadCurrentGraph() {
  return fetch(`${BASE_URL}/snapshots-matrix`)
    .then(data => data.json())
    .then(snapshots => {
      const fileName = `Graph-${document.getElementById('graphName').innerText}.json`;
      const fileContent = JSON.stringify({ snapshots, details: storedDetails });

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(fileContent));
      element.setAttribute('download', fileName);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    })
}

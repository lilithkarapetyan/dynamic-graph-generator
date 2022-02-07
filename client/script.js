let drawInterval;
let storedSnapshots;
let lastSnapshotIndex = 0;
let previousSelectedTimelineItem;
const playText = 'Play';
const pauseText = 'Pause';
const BASE_URL = 'http://localhost:3000';

function calculateConnectionPercentage (graph) {
  const arr = new Array(graph.vertices.length).fill(0);
  for(let i = 0; i < graph.edges.length; i++) {
    arr[graph.edges[i].source] = 1;
    arr[graph.edges[i].target] = 1;
  }

  return arr.reduce((acc, item) => acc + item, 0) / arr.length * 100;
}

function calculateDegrees (graph) {
  const arr = new Array(graph.vertices.length).fill(0).map((_, index) => ({value: 0, index}));
  for(let  i = 0; i < graph.edges.length; i++) {
    arr[graph.edges[i].source].value++;
    arr[graph.edges[i].target].value++;
  }

  return arr;
}

function setupTimeline(snapshots) {
  const timelineDiv = document.getElementById('timeline');

  if(timelineDiv.children.length === snapshots.length + 1) {
    return;
  }

  timelineDiv.innerHTML = '<hr />';

  const timelineItemClick = (e) => {
    lastSnapshotIndex = +e.target.getAttribute('data-index');

    if(previousSelectedTimelineItem) {
      previousSelectedTimelineItem.classList.remove('active');
    }
    previousSelectedTimelineItem = e.target;
    previousSelectedTimelineItem.classList.add('active');
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

function drawGraph(newSnapshots, initialSnapshotIndex = 0) {
  let chart;
  let snapshots = newSnapshots || storedSnapshots;
  let snapshotIndex = initialSnapshotIndex;

  if(snapshots) {
    storedSnapshots = snapshots;
  }

  document.getElementById('snapshotCountNumber').innerText = snapshots.length;
  document.getElementById('vertexCountNumber').innerText = snapshots[0].vertices.length;

  chart && document.getElementById("scene").removeChild(chart);
  chart = ForceGraph({
    nodes: snapshots[snapshotIndex].vertices,
    links: snapshots[snapshotIndex].edges,
  }, {
    nodeId: d => d,
    nodeTitle: d => d,
    width: window.innerWidth / 3 * 2,
    height: window.innerHeight / 3 * 2,
  });

  const updateBarPlot = BarPlot(calculateDegrees(snapshots[snapshotIndex]));

  document.getElementById("scene").appendChild(chart);

  setupTimeline(snapshots);

  drawInterval = setInterval(() => {
    if(!snapshots[snapshotIndex]) {
      pause();
      lastSnapshotIndex = 0;
      return;
    }

    document.getElementById("snapshotId").innerHTML = `${snapshotIndex}`;
    document.getElementById("connectionPercentage").innerText = `${calculateConnectionPercentage(snapshots[snapshotIndex]).toFixed(2)}%`;

    chart.update({
      nodes: snapshots[snapshotIndex].vertices,
      links: snapshots[snapshotIndex].edges,
    });
    updateBarPlot(calculateDegrees(snapshots[snapshotIndex]));

    snapshotIndex++;
    lastSnapshotIndex = snapshotIndex;
  }, 200)
}

function clearGraph() {
  clearInterval(drawInterval);
  document.getElementById('scene').innerHTML = '';
  document.getElementById('degrees').innerHTML = '<svg width="700" height="400"></svg>'
}

function setLoading(isShowing) {
  const loading = document.getElementById('loading');
  if(isShowing) {
    loading.classList.add('visible');
    loading.classList.remove('hidden');
  }else{
    loading.classList.add('hidden');
    loading.classList.remove('visible');
  }
}

function downloadCurrentGraph() {
  return fetch(`${BASE_URL}/snapshots-matrix`)
    .then(data => data.json())
    .then(snapshots => {
      const fileName = `Graph - ${(new Date()).toLocaleString()}.json`;
      const fileContent = JSON.stringify(snapshots);

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(fileContent));
      element.setAttribute('download', fileName);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    })
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
        headers: {'Content-Type': 'application/json'},
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

function printCurrentGraph() {
  return fetch(`${BASE_URL}/snapshots-string`)
    .then(data => data.json())
    .then(snapshots => {
      snapshots.forEach((snapshot, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = 'snapshot-output';
          div.innerHTML = `<h4>${index}.</h4><pre>${snapshot}</pre>`;
          document.getElementById('output').appendChild(div);
        }, 0)
      })

      const lastPrintedDate = document.getElementById('lastPrintedDate');
      lastPrintedDate.classList.remove('outdated');
      lastPrintedDate.innerText = (new Date()).toLocaleString();
    })
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
  playButton.classList.remove('playing');
}

function playToggled() {
  const playButton = document.getElementById('playToggle');

  if(playButton.innerText === pauseText) pause();
  else play();
}

async function startNewGraph(snapshots) {
  clearGraph();
  lastSnapshotIndex = 0;
  await drawGraph(snapshots);
  play();
  document.getElementById('lastPrintedDate').classList.add('outdated');
}

function generateNewGraph() {
  setLoading(true);

  const vertexCount = document.getElementById('vertexCount').value;
  const densityIndex = document.getElementById('densityIndex').value;
  const snapshotCount = document.getElementById('snapshotCount').value;

  localStorage.setItem('vertexCount', vertexCount);
  localStorage.setItem('densityIndex', densityIndex);
  localStorage.setItem('snapshotCount', snapshotCount);

  return fetch(`${BASE_URL}/snapshots`, {
    method: 'POST',
    body: JSON.stringify({
      vertexCount: +vertexCount,
      densityIndex: +densityIndex,
      snapshotCount: +snapshotCount,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(data => data.json())
    .then(snapshots => startNewGraph(snapshots))
    .finally(() => setLoading(false));
}

function setup() {
  setLoading(true);
  fetch(`${BASE_URL}/snapshots`)
    .then(data => data.json())
    .then(snapshots => drawGraph(snapshots))
    .finally(() => setLoading(false));

  document.getElementById('vertexCount').value = localStorage.getItem('vertexCount');
  document.getElementById('densityIndex').value = localStorage.getItem('densityIndex');
  document.getElementById('snapshotCount').value = localStorage.getItem('snapshotCount');
}

setup();
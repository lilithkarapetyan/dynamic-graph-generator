let drawInterval;
let storedSnapshots;
let lastSnapshotIndex = 0;
let previousSelectedTimelineItem;
let vertices = [];
const playText = 'Play';
const pauseText = 'Pause';
const BASE_URL = 'http://localhost:3000';
const giveInfo = [];
const distributionsData = {
  infoGiving: [],
  prevInformedVertices: 0,
};


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

  distributionsData.infoGiving = [];
  distributionsData.prevInformedVertices = 0;
  document.getElementById('snapshotCountNumber').innerText = snapshots.length;
  document.getElementById('vertexCountNumber').innerText = snapshots[0].vertices.length;
  document.getElementById('informedVertices').innerText = '-';

  chart && document.getElementById("scene").removeChild(chart);
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
  });

  const updateBarPlot = BarPlot(calculateDegrees(snapshots[snapshotIndex]));

  document.getElementById("scene").appendChild(chart);

  setupTimeline(snapshots);

  vertices = snapshots[snapshotIndex].vertices.map(vertex => ({id: vertex, hasInfo: false}));
  vertices[0].hasInfo = true;


  let colorMap = {};
  drawInterval = setInterval(() => {
    if(!snapshots[snapshotIndex]) {
      pause();
      lastSnapshotIndex = 0;
      return;
    }


    //considering undirected graph
    snapshots[snapshotIndex].edges.forEach(edge => {
      // if(vertices[edge.source].hasInfo && !vertices[edge.target].hasInfo){
      //   giveInfo.push(edge.target);
      // }
      // if(vertices[edge.target].hasInfo && !vertices[edge.source].hasInfo) {
      //   giveInfo.push(edge.source);
      // }
      if(vertices[edge.target].hasInfo && !vertices[edge.source].hasInfo){
        if(!Object.values(colorMap).includes(edge.source))
          colorMap[edge.target] = edge.source;
      }
      if(vertices[edge.source].hasInfo && !vertices[edge.target].hasInfo){
        if(!Object.values(colorMap).includes(edge.target))
          colorMap[edge.source] = edge.target;
      }
    });

    document.getElementById("snapshotId").innerHTML = `${snapshotIndex}`;
    document.getElementById("connectionPercentage").innerText = `${calculateConnectionPercentage(snapshots[snapshotIndex]).toFixed(2)}%`;

    chart.update({
      nodes: snapshots[snapshotIndex].vertices,
      links: snapshots[snapshotIndex].edges,
    });
    updateBarPlot(calculateDegrees(snapshots[snapshotIndex]));


    // giveInfo.forEach(vertexIndex => vertices[vertexIndex].hasInfo = true);
    // giveInfo.length = 0;
    //////////
    // console.log(giveInfo);
    // while(giveInfo[0] && giveInfo[0].hasInfo) {
    //   giveInfo.shift();
    // }
    // if(vertices[giveInfo[0]]) {
    //   vertices[giveInfo[0]].hasInfo = true;
    //   giveInfo.shift();
    // }
    //////

    Object.values(colorMap).forEach(vertexIndex => vertices[vertexIndex].hasInfo = true);

    vertices.forEach(vertex => {
      document.getElementById(`node-${vertex.id}`).setAttribute('fill', vertex.hasInfo? '#42aa9d': 'black');
      // document.getElementById(`node-${vertex.id}`).setAttribute('fill', vertex.hasInfo? '#42aa9d': 'black');
      // document.getElementById(`node-${vertex.id}`).setAttribute('stroke', vertex.hasInfo? 'black': 'white');
    })

    const informedVertices = vertices.reduce((acc, vertex) => acc + Number(vertex.hasInfo), 0) ;
    const informationPercentage = informedVertices / vertices.length * 100;
    distributionsData.infoGiving.push([distributionsData.infoGiving.length, informedVertices - distributionsData.prevInformedVertices, informedVertices, calculateConnectionPercentage(snapshots[snapshotIndex]), snapshots[snapshotIndex].edges.length / Math.pow(snapshots[snapshotIndex].vertices.length, 2) * 100 ]);
    distributionsData.prevInformedVertices = informedVertices;
    document.getElementById('informedVertices').innerText = document.getElementById('informedVertices').innerText + ' ' + informationPercentage.toFixed(2) + '%';
    // document.getElementById('informedVerticesOne').innerText = +document.getElementById('informedVerticesOne').innerText.split(' ').pop()
    snapshotIndex++;
    colorMap = {};
    lastSnapshotIndex = snapshotIndex;
  }, 500)
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

function downloadInformed() {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/json;charset=utf-8,index,dist,informed,connectedness,edges\n' + encodeURIComponent(distributionsData.infoGiving.map(row => row.toString()).join('\n')));
  element.setAttribute('download', 'informed_vertices.csv');

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

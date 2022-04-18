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
    arr[graph.edges[i].s] = 1;
    arr[graph.edges[i].t] = 1;
  }

  return 100 - arr.reduce((acc, item) => acc + item, 0) / arr.length * 100;
}

function calculateDegrees(graph) {
  const arr = new Array(graph.vertices.length).fill(0).map((_, index) => ({ value: 0, index }));
  for (let i = 0; i < graph.edges.length; i++) {
    arr[graph.edges[i].s].value++;
    arr[graph.edges[i].t].value++;
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
// let diffGraph;
// function drawGraphDiff() {
//   document.getElementById("diff-result").innerHTML = '';
//
//   const firstSnapshotIndex = +document.getElementById("diff-graph-1").value || 0;
//   const secondSnapshotIndex = +document.getElementById("diff-graph-2").value || 1;
//   const width = window.innerWidth / 4;
//   const height = window.innerHeight /4 ;
//   const snapshot0 = storedSnapshots[firstSnapshotIndex];
//   const snapshot1 = storedSnapshots[secondSnapshotIndex];
//
//   // console.log(snapshot0, snapshot1)
//
//   if(!diffGraph) {
//     diffGraph = ForceGraph({
//       nodes: snapshot0.vertices,
//       links: [ ...snapshot0.edges, ...snapshot1.edges],
//       containerId: 'diff-result'
//     }, {
//       nodeId: d => d,
//       nodeTitle: d => d,
//       width,
//       height,
//       nodeStrokeWidth: 0,
//       linkStrokeWidth: 1,
//       nodeRadius: 4,
//     })
//   }
//
//   const {link} = diffGraph.update({
//     links: [ ...snapshot0.edges, ...snapshot1.edges]
//   });
//
//   link.style("stroke", d => {
//     const firstHas = snapshot0.edges.find(edge => edge.s === d.s.id && edge.t === d.t.id);
//     const secondHas = snapshot1.edges.find(edge => edge.s === d.s.id && edge.t === d.t.id);
//
//     if(firstHas && !secondHas) {
//       return "red";
//     }
//     if(!firstHas && secondHas){
//       return "green"
//     }
//     return "black"
//   })
//
//   document.getElementById("diff-result").appendChild(diffGraph);
// }

function drawGraph(newSnapshots, initialSnapshotIndex = 0) {
  let chart;
  let vertices;
  let snapshots = newSnapshots || storedSnapshots;
  let snapshotIndex = initialSnapshotIndex;

  if (snapshots) {
    storedSnapshots = snapshots;
    // drawGraphDiff()
  }

  generateVertexSnapshots();

  document.getElementById('snapshotCountNumber').innerText = snapshots.length;
  document.getElementById('vertexCountNumber').innerText = snapshots[0].vertices.length;

  chart = ForceGraph({
    nodes: snapshots[snapshotIndex].vertices,
    links: snapshots[snapshotIndex].edges.map(({s, t}) => ({source: s, target: t})),
    containerId: 'scene'
  }, {
    nodeId: d => d,
    nodeTitle: d => d,
    width: window.innerWidth / 3 * 2,
    height: window.innerHeight / 3 * 2,
    nodeStrokeWidth: 3,
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
      links: snapshots[snapshotIndex].edges.map(({s, t}) => ({source: s, target: t})),
    });

    document.getElementById("snapshotId").innerHTML = `${snapshotIndex}`;
    document.getElementById("isolationPercentage").innerText = `${calculateIsolationPercentage(snapshots[snapshotIndex]).toFixed(2)}%`;

    const isUnicast = document.getElementById('unicastSwitcher').checked;
    vertices.forEach(vertex => {
      document.getElementById(`node-${vertex.id}`).setAttribute('fill', (
        isUnicast ? (vertex.hasUnicastInfo ? '#fed683' : 'black') : (vertex.hasBroadcastInfo ? '#f6d1df' : 'black')
      ));
      document.getElementById(`node-${vertex.id}`).setAttribute('stroke', (
        isUnicast ? (!!vertex.unicastTimer ? '#67a2d8' : '#c4c4c4') : (!!vertex.broadcastTimer ? '#67a2d8' : '#c4c4c4')
      ));
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
  document.getElementById('connectedRoundsUnicast').innerText = '-'
  document.getElementById('connectedRoundsBroadcast').innerText = '-'
  document.getElementById('hadInfoRoundsBroadcast').innerText = '-'
  document.getElementById('hadInfoRoundsUnicast').innerText = '-'
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
    const [index, broadcastSingle, broadcast, unicastSingle, unicast, isolated, edges, broadcastSingleAll, unicastSingleAll] = each;
    return {
      index,
      broadcastSingle,
      broadcastSingleAll,
      unicastSingle,
      unicastSingleAll,
      broadcast,
      unicast,
      isolated,
      edges,
    }
  })
  // drawLineChart({
  //   data: transformedData,
  //   containerId: 'linechart-isolated',
  //   xAxis: 'index',
  //   yAxis: 'broadcastSingleAll',
  //   title: 'Had broadcastInfo'
  // })
  // drawLineChart({
  //   data: transformedData,
  //   containerId: 'linechart-edges',
  //   xAxis: 'index',
  //   yAxis: 'unicastSingleAll',
  //   title: 'Had unicastInfo'
  // })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-broadcast',
    xAxis: 'index',
    yAxis: 'broadcastSingle',
    title: 'hasBroadcastInfo PMF'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-unicast',
    xAxis: 'index',
    yAxis: 'unicastSingle',
    title: 'hasUnicastInfo PMF'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-broadcast',
    xAxis: 'index',
    yAxis: 'broadcast',
    title: 'hasBroadCastInfo CDF'
  })
  drawLineChart({
    data: transformedData,
    containerId: 'linechart-unicast',
    xAxis: 'index',
    yAxis: 'unicast',
    title: 'hasUnicastInfo CDF'
  })
}

function drawAllVertexOriginatorStats(allVerticesData) {
  document.getElementById('linechart-all-vertices-broadcast').innerHTML = '';
  document.getElementById('linechart-all-vertices-unicast').innerHTML = '';
  document.getElementById('linechart-all-vertices-broadcast-first').innerHTML = '';
  document.getElementById('linechart-all-vertices-unicast-first').innerHTML = '';

  BarPlot({
    data: allVerticesData,
    containerId: 'linechart-all-vertices-broadcast',
    xAxis: 'originator',
    yAxis: 'broadcastInfo',
    title: 'All vertices broadcast'
  })

  BarPlot({
    data: allVerticesData,
    containerId: 'linechart-all-vertices-unicast',
    xAxis: 'originator',
    yAxis: 'unicastInfo',
    title: 'All vertices unicast'
  })

  BarPlot({
    data: allVerticesData,
    containerId: 'linechart-all-vertices-broadcast-first',
    xAxis: 'originator',
    yAxis: 'firstBroadcastInfoWithTimer',
    title: 'All vertices broadcast with timer'
  })

  BarPlot({
    data: allVerticesData,
    containerId: 'linechart-all-vertices-unicast-first',
    xAxis: 'originator',
    yAxis: 'firstUnicastInfoWithTimer',
    title: 'All vertices unicast with timer'
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
  let castIndex = +localStorage.getItem('castIndex');
  let maxInfoGivingTime = +localStorage.getItem('maxInfoGivingTime');
  distributionsData.info = [];
  distributionsData.prevUnicastVertices = 0;
  distributionsData.prevBroadcastVertices = 0;

  if(document.getElementById('castIndex').value) {
    castIndex = +document.getElementById('castIndex').value;
    localStorage.setItem('castIndex', `${castIndex}`);
  }else {
    document.getElementById('castIndex').value = castIndex;
  }
  if(document.getElementById('maxInfoGivingTime').value) {
    maxInfoGivingTime = +document.getElementById('maxInfoGivingTime').value;
    localStorage.setItem('maxInfoGivingTime', `${maxInfoGivingTime}`);
  }else {
    document.getElementById('maxInfoGivingTime').value = maxInfoGivingTime;
  }

  const infoSnapshots = storedSnapshots.map(snapshot => (
    snapshot.vertices.map((vertex, index) => ({
      id: vertex,
      hasUnicastInfo: index === startIndex,
      hasBroadcastInfo: index === startIndex,
      broadcastTimer: 0,
      unicastTimer: 0,
    }))
  ));

  storedSnapshots.forEach((snapshot, index) => {
    const vertices = infoSnapshots[index];

    if (infoSnapshots[index - 1]) {
      vertices.forEach((vertex, vertexIndex) => {
        vertex.hasUnicastInfo = infoSnapshots[index - 1][vertexIndex].hasUnicastInfo;
        vertex.unicastTimer = infoSnapshots[index - 1][vertexIndex].unicastTimer;
        vertex.hasBroadcastInfo = infoSnapshots[index - 1][vertexIndex].hasBroadcastInfo;
        vertex.broadcastTimer = infoSnapshots[index - 1][vertexIndex].broadcastTimer;


        if(vertex.broadcastTimer > maxInfoGivingTime) {
          vertex.hasBroadcastInfo = false;
        }
        if(vertex.unicastTimer > maxInfoGivingTime) {
          vertex.hasUnicastInfo = false;
        }
      })
    }

    snapshot.edges.forEach(edge => {
      if (
        vertices[edge.s].hasBroadcastInfo &&
        !vertices[edge.t].hasBroadcastInfo
      ) {
        infoQueue.push(edge.t);
      }
      if (
        vertices[edge.t].hasBroadcastInfo &&
        !vertices[edge.s].hasBroadcastInfo
      ) {
        infoQueue.push(edge.s);
      }
      if (
        vertices[edge.t].hasUnicastInfo &&
        !vertices[edge.s].hasUnicastInfo
      ) {
        if (!Object.values(infoMap).filter(value =>  value?.has(edge.s)).length) {
          if(!infoMap[edge.t]){
            infoMap[edge.t] = new Set();
          }
          if(infoMap[edge.t].size < castIndex) {
            infoMap[edge.t].add(edge.s);
          }
        }
      }
      if (
        vertices[edge.s].hasUnicastInfo &&
        !vertices[edge.t].hasUnicastInfo
      ) {
        if (!Object.values(infoMap).filter(value => value.has(edge.t)).length) {
          if(!infoMap[edge.s]){
            infoMap[edge.s] = new Set();
          }
          if(infoMap[edge.s].size < castIndex) {
            infoMap[edge.s].add(edge.t);
          }
        }
      }
    });

    infoQueue.forEach(vertexIndex => {
      vertices[vertexIndex].hasBroadcastInfo = true;
      vertices[vertexIndex].broadcastTimer = 0;
    });
    Object.values(infoMap).forEach(vertexSet => vertexSet?.forEach(vertexIndex => {
      vertices[vertexIndex].hasUnicastInfo = true;
      vertices[vertexIndex].unicastTimer = 0;
    }));

    snapshot.vertices.forEach(vertex => {
      if (vertices[vertex].hasBroadcastInfo) {
        vertices[vertex].broadcastTimer++;
      }
      if (vertices[vertex].hasUnicastInfo) {
        vertices[vertex].unicastTimer++;
      }
    });

    const unicastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasUnicastInfo), 0);
    const broadcastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasBroadcastInfo), 0);

    const unicastVerticesAll = vertices.filter(vertex => vertex.unicastTimer !== 0).length;
    const broadcastVerticesAll = vertices.filter(vertex => vertex.broadcastTimer !== 0).length;

    if (unicastVerticesAll === vertices.length && document.getElementById('connectedRoundsUnicast').innerText === '-') {
      document.getElementById('connectedRoundsUnicast').innerText = index;
    }
    if (broadcastVerticesAll === vertices.length && document.getElementById('connectedRoundsBroadcast').innerText === '-') {
      document.getElementById('connectedRoundsBroadcast').innerText = index;
    }
    if (unicastVertices === vertices.length && document.getElementById('hadInfoRoundsUnicast').innerText === '-') {
      document.getElementById('hadInfoRoundsUnicast').innerText = index + 1;
    }
    if (broadcastVertices === vertices.length && document.getElementById('hadInfoRoundsBroadcast').innerText === '-') {
      document.getElementById('hadInfoRoundsBroadcast').innerText = index + 1;
    }

    distributionsData.info.push([distributionsData.info.length, broadcastVertices - distributionsData.prevBroadcastVertices, broadcastVertices, unicastVertices - distributionsData.prevUnicastVertices, unicastVertices, calculateIsolationPercentage(snapshot), snapshot.edges.length / Math.pow(snapshot.vertices.length, 2) * 100, broadcastVerticesAll, unicastVerticesAll]);
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

function calculateRoundsFromAllVertices() {
  const result = new Array(storedSnapshots[0].vertices.length).fill(1).map((_, index) => ({
    broadcastInfo: -1,
    unicastInfo: -1,
    firstBroadcastInfoWithTimer: -1,
    firstUnicastInfoWithTimer: -1,
    originator: index,
  }));

  let originator = 0;
  const calcInterval = setInterval(() => {
    if(originator >= storedSnapshots[0].vertices.length) {
      clearInterval(calcInterval);
      drawAllVertexOriginatorStats(result);
    }
    const infoSnapshots = storedSnapshots.map(snapshot => (
      snapshot.vertices.map((vertex, index) => ({
        id: vertex,
        hasUnicastInfo: index === originator,
        hasBroadcastInfo: index === originator,
        broadcastTimer: 0,
        unicastTimer: 0,
      }))
    ));

    storedSnapshots.forEach((snapshot, index) => {
      let infoMap = {};
      let infoQueue = [];
      let castIndex = +localStorage.getItem('castIndex');
      let maxInfoGivingTime = +localStorage.getItem('maxInfoGivingTime');
      const vertices = infoSnapshots[index];

      if (infoSnapshots[index - 1]) {
        vertices.forEach((vertex, vertexIndex) => {
          vertex.hasUnicastInfo = infoSnapshots[index - 1][vertexIndex].hasUnicastInfo;
          vertex.unicastTimer = infoSnapshots[index - 1][vertexIndex].unicastTimer;
          vertex.hasBroadcastInfo = infoSnapshots[index - 1][vertexIndex].hasBroadcastInfo;
          vertex.broadcastTimer = infoSnapshots[index - 1][vertexIndex].broadcastTimer;


          if(vertex.broadcastTimer > maxInfoGivingTime) {
            vertex.hasBroadcastInfo = false;
          }
          if(vertex.unicastTimer > maxInfoGivingTime) {
            vertex.hasUnicastInfo = false;
          }
        })
      }

      snapshot.edges.forEach(edge => {
        if (
          vertices[edge.s].hasBroadcastInfo &&
          !vertices[edge.t].hasBroadcastInfo
        ) {
          infoQueue.push(edge.t);
        }
        if (
          vertices[edge.t].hasBroadcastInfo &&
          !vertices[edge.s].hasBroadcastInfo
        ) {
          infoQueue.push(edge.s);
        }
        if (
          vertices[edge.t].hasUnicastInfo &&
          !vertices[edge.s].hasUnicastInfo
        ) {
          if (!Object.values(infoMap).filter(value =>  value?.has(edge.s)).length) {
            if(!infoMap[edge.t]){
              infoMap[edge.t] = new Set();
            }
            if(infoMap[edge.t].size < castIndex) {
              infoMap[edge.t].add(edge.s);
            }
          }
        }
        if (
          vertices[edge.s].hasUnicastInfo &&
          !vertices[edge.t].hasUnicastInfo
        ) {
          if (!Object.values(infoMap).filter(value => value.has(edge.t)).length) {
            if(!infoMap[edge.s]){
              infoMap[edge.s] = new Set();
            }
            if(infoMap[edge.s].size < castIndex) {
              infoMap[edge.s].add(edge.t);
            }
          }
        }
      });

      infoQueue.forEach(vertexIndex => {
        vertices[vertexIndex].hasBroadcastInfo = true;
        vertices[vertexIndex].broadcastTimer = 0;
      });
      Object.values(infoMap).forEach(vertexSet => vertexSet?.forEach(vertexIndex => {
        vertices[vertexIndex].hasUnicastInfo = true;
        vertices[vertexIndex].unicastTimer = 0;
      }));

      snapshot.vertices.forEach(vertex => {
        if (vertices[vertex].hasBroadcastInfo) {
          vertices[vertex].broadcastTimer++;
        }
        if (vertices[vertex].hasUnicastInfo) {
          vertices[vertex].unicastTimer++;
        }
      });

      const unicastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasUnicastInfo), 0);
      const broadcastVertices = vertices.reduce((acc, vertex) => acc + Number(!!vertex.hasBroadcastInfo), 0);

      const unicastVerticesAll = vertices.filter(vertex => vertex.unicastTimer !== 0).length;
      const broadcastVerticesAll = vertices.filter(vertex => vertex.broadcastTimer !== 0).length;

      if (unicastVerticesAll === vertices.length && result[originator].unicastInfo === -1) {
        result[originator].unicastInfo = index;
      }
      if (broadcastVerticesAll === vertices.length && result[originator].broadcastInfo === -1) {
        result[originator].broadcastInfo = index;
      }
      if (unicastVertices === vertices.length && result[originator].firstUnicastInfoWithTimer === -1) {
        result[originator].firstUnicastInfoWithTimer = index + 1;
      }
      if (broadcastVertices === vertices.length && result[originator].firstBroadcastInfoWithTimer === -1) {
        result[originator].firstBroadcastInfoWithTimer = index + 1;
      }

      infoMap = {};
      infoQueue = [];
    })

    originator++;
  })
}

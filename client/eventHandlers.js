document.getElementById('download').onclick = () => {
  setLoading(true);
  downloadCurrentGraph()
    .then(() => console.log('Successfully downloaded'))
    .catch(() => console.log('Download failed'))
    .finally(() => setLoading(false));
};

document.getElementById('unicastSwitcher').onchange = (event) => {
  const isUnicast = document.getElementById('unicastSwitcher').checked;
  vertexSnapshots[lastSnapshotIndex].forEach(vertex => {
    document.getElementById(`node-${vertex.id}`).setAttribute('fill', (
      isUnicast ? (vertex.hasUnicastInfo ? '#fed683' : 'black') : (vertex.hasBroadcastInfo ? '#f6d1df' : 'black')
    ));
    document.getElementById(`node-${vertex.id}`).setAttribute('stroke', (
      isUnicast ? (!!vertex.unicastTimer ? '#67a2d8' : '#c4c4c4') : (!!vertex.broadcastTimer ? '#67a2d8' : '#c4c4c4')
    ));
  });
}

document.getElementById('castIndex').onchange = play;

document.getElementById('maxInfoGivingTime').onchange = play;

document.getElementById('generate').onclick = () => {
  setLoading(true);
  generateNewGraph()
    .then(() => console.log('Successfully generated'))
    .catch(() => console.log('Generate failed'))
    .finally(() => setLoading(false));
}

document.getElementById('upload').onclick = () => {
  uploadFile();
}

document.getElementById('playToggle').onclick = () => {
  playToggled();
}

document.getElementById('downloadInformed').onclick = () => {
  downloadInformed();
}
document.getElementById('generateFromAllVertices').onclick = () => {
  calculateRoundsFromAllVertices();
}
// document.getElementById('calculateDiff').onclick = () => {
//   drawGraphDiff();
// }

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
    document.getElementById(`node-${vertex.id}`).setAttribute('fill', (isUnicast ? (vertex.hasUnicastInfo ? '#42aa9d' : 'black') : (vertex.hasBroadcastInfo ? '#425caa' : 'black')));
  });
}

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

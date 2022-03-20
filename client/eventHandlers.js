document.getElementById('download').onclick = () => {
  setLoading(true);
  downloadCurrentGraph()
    .then(() => console.log('Successfully downloaded'))
    .catch(() => console.log('Download failed'))
    .finally(() => setLoading(false));
};

document.getElementById('print').onclick = () => {
  setLoading(true);
  printCurrentGraph()
    .then(() => console.log('Successfully printed'))
    .catch(() => console.log('Print failed'))
    .finally(() => setLoading(false));
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

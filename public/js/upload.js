document.getElementById('csvFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type !== 'text/csv') {
      alert('Please upload a valid CSV file.');
      event.target.value = ''; // Clear invalid file
    }
  });
  
document.addEventListener('DOMContentLoaded', () => {
    if (window.savedCharts && window.savedCharts.length > 0) {
      window.savedCharts.forEach(({ elementId, config }) => {
        const canvas = document.getElementById(elementId);
  
        if (canvas) {
          const ctx = canvas.getContext('2d');
          new Chart(ctx, config); // Render the chart using Chart.js
        } else {
          console.error(`Canvas element with ID "${elementId}" not found.`);
        }
      });
    } else {
      console.error('No saved charts found to render.');
    }
  });
  
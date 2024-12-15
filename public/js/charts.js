document.addEventListener('DOMContentLoaded', () => {
    const dataset = window.dataset;

    console.log('Dataset Loaded:', dataset);
    console.log('Dataset ID:', dataset._id); // Log dataset ID

    if (!dataset || dataset.length === 0) {
        console.error('Dataset is empty or not defined');
        return;
    }

   
    const xColumnDropdown = document.getElementById('xColumn');
    const yColumnDropdown = document.getElementById('yColumn');
    const chartTypeDropdown = document.getElementById('chartType');
    const chartCanvas = document.getElementById('chart');
    const chartWarning = document.getElementById('chartWarning');
    const colorPicker = document.getElementById('colorPicker');
    const colorSchemeDropdown = document.getElementById('colorScheme');

    // Ensure the dataset has proper columns
    const columnNames = Object.keys(dataset[0] || {});
    if (columnNames.length === 0) {
        console.error('No columns detected in dataset');
        return;
    }

    // Populate dropdowns with column names
    columnNames.forEach(column => {
        const xOption = document.createElement('option');
        const yOption = document.createElement('option');
        xOption.value = column;
        yOption.value = column;
        xOption.textContent = column;
        yOption.textContent = column;
        xColumnDropdown.appendChild(xOption);
        yColumnDropdown.appendChild(yOption);
    });

    // Default dropdown selection
    const defaultX = columnNames[0];
    const defaultY = columnNames.length > 1 ? columnNames[1] : columnNames[0]; // Avoid duplicate selection if only one column exists
    let chart = new Chart(chartCanvas, createChartConfig(dataset, defaultX, defaultY, 'bar', colorPicker.value, 'single'));

    document.getElementById('generateChart').addEventListener('click', () => {
        const xColumn = xColumnDropdown.value;
        const yColumn = yColumnDropdown.value;
        const selectedChartType = chartTypeDropdown.value;
        const selectedColor = colorPicker.value;
        const selectedColorScheme = colorSchemeDropdown.value;

        // Check for valid Y-axis values for specific chart types
        if ((selectedChartType === 'pie' || selectedChartType === 'doughnut') && isNaN(dataset[0][yColumn])) {
            chartWarning.textContent = 'For Pie and Doughnut charts, select a numerical column for the Y-Axis.';
            chartWarning.classList.remove('hidden');
            return;
        } else {
            chartWarning.classList.add('hidden');
            chartWarning.textContent = '';
        }

        chart.destroy();
        chart = new Chart(chartCanvas, createChartConfig(dataset, xColumn, yColumn, selectedChartType, selectedColor, selectedColorScheme));
    });

    console.log('Dataset ID in window object:', dataset._id); // Debugging the dataset ID
    document.getElementById('saveChart').addEventListener('click', async () => {
        const chartConfig = getChartConfig(chart); // Serialize the chart configuration
        const chartType = chart.config.type; // Get the chart type (e.g., bar, line)
        const datasetId = dataset._id; // Use the dataset ID

        console.log('Sending chart data to backend:', { chartConfig, chartType, datasetId }); // Debugging log

        try {
            const response = await fetch('/save-chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chartConfig, chartType, datasetId }),
            });

            const result = await response.json();
            console.log('Response from backend:', result); // Debugging log

            if (result.success) {
                alert('Chart saved successfully!');
            } else {
                alert(`Failed to save chart. ${result.message || ''}`);
            }
        } catch (error) {
            console.error('Error saving chart:', error);
            alert('An error occurred. Please try again.');
        }
    });

      
});

// Helper function to extract chart configuration
function getChartConfig(chart) {
    return {
        type: chart.config.type,
        data: chart.config.data,
        options: chart.config.options,
    };
}

function createChartConfig(dataset, xColumn, yColumn, chartType = 'bar', color = 'rgba(75, 192, 192, 0.2)', colorScheme = 'single') {
    return {
        type: chartType,
        data: createChartData(dataset, xColumn, yColumn, chartType, color, colorScheme),
        options: {
            responsive: true,
            scales: chartType !== 'pie' && chartType !== 'doughnut' ? { y: { beginAtZero: true } } : undefined,
        },
    };
}

function createChartData(dataset, xColumn, yColumn, chartType, color, colorScheme) {
    const labels = dataset.map(row => row[xColumn] || ''); // Ensure labels exist
    const values = dataset.map(row => parseFloat(row[yColumn] || 0)); // Ensure numeric values exist

    let colors, borderColors;
    if (chartType === 'pie' || chartType === 'doughnut') {
        if (colorScheme === 'dynamic') {
            colors = labels.map(() => randomColor());
        } else if (colorScheme === 'pastel') {
            colors = generateColorPalette(labels.length, 'pastel');
        } else if (colorScheme === 'vivid') {
            colors = generateColorPalette(labels.length, 'vivid');
        } else {
            colors = Array(labels.length).fill(color);
        }
        borderColors = Array(labels.length).fill('rgba(0, 0, 0, 0.2)');
    } else {
        colors = Array(labels.length).fill(color);
        borderColors = Array(labels.length).fill(color);
    }

    return {
        labels,
        datasets: [{
            label: `${xColumn} vs ${yColumn}`,
            data: values,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1,
        }],
    };
}

function generateColorPalette(size, scheme) {
    const pastelPalette = ['#FFB5E8', '#FF9CEE', '#FEC8D8', '#FFC3A0', '#D5AAFF', '#85E3FF', '#B9FBC0', '#FFABAB'];
    const vividPalette = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#FF6D00', '#6FFF76', '#76D2FF'];

    const palette = scheme === 'pastel' ? pastelPalette : vividPalette;
    return Array.from({ length: size }, (_, i) => palette[i % palette.length]);
}

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
}

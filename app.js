// Prepare empty data arrays for the charts
let mq2Data = [];
let mq7Data = [];
let timeStamps = [];
let previousMq2Level = 0;
let previousMq7Level = 0;
let dataFetchInterval; // Variable to store the interval ID

// Function to show the warning banner with a combined message
function showWarning(message, solution) {
    const warningMessage = document.getElementById('warning-message');
    warningMessage.textContent = message;
    const warningBanner = document.getElementById('warning-banner');
    warningBanner.classList.add('show');
    const alertSound = document.getElementById('alert-sound');
    alertSound.currentTime = 0;
    alertSound.play();
}

// Function to hide the warning banner
document.getElementById('close-banner').onclick = function() {
    document.getElementById('warning-banner').classList.remove('show');
};

// Set up Chart.js configuration for the MQ2 chart
const mq2ChartCtx = document.getElementById('mq2Chart').getContext('2d');
const mq2Chart = new Chart(mq2ChartCtx, {
    type: 'line',
    data: {
        labels: timeStamps,
        datasets: [{
            label: 'Smoke & Flammable Gas Level',
            data: mq2Data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Smoke & Flammable Gas' } }
        }
    }
});

// Set up Chart.js configuration for the MQ7 chart
const mq7ChartCtx = document.getElementById('mq7Chart').getContext('2d');
const mq7Chart = new Chart(mq7ChartCtx, {
    type: 'line',
    data: {
        labels: timeStamps,
        datasets: [{
            label: 'Carbon Monoxide Level',
            data: mq7Data,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Carbon Monoxide' } }
        }
    }
});

// Function to fetch data from the server
async function fetchData() {
    try {
        const response = await fetch('https://gas-sensor-backend.onrender.com/get-helmet-data/H123');  // Replace with your actual server endpoint
        const data = await response.json();

        // Update the power status
        document.getElementById("power").innerText = data.status === "off" ? "Off" : "On";

        // Stop updates if the helmet is off
        if (data.status === "off") {
            clearInterval(dataFetchInterval); // Stop fetching data
            document.getElementById("status").style.color = "gray";
            document.getElementById('status').innerHTML = "Status: Off";
            return; // Exit the function to prevent further updates
        }
         // Restart the interval when power is back on
        if (data.status === "on" && !dataFetchInterval) {
            dataFetchInterval = setInterval(fetchData, 2000); // Restart the interval
        }

        // Update DOM elements with the latest data
        document.getElementById('helmet-id').textContent = data.helmetId;
        document.getElementById('mq2-level').textContent = data.mq2Level;
        document.getElementById('mq7-level').textContent = data.mq7Level;

        const currentTime = new Date().toLocaleTimeString();

        // Add new data points for the graphs
        mq2Data.push(data.mq2Level);
        mq7Data.push(data.mq7Level);
        timeStamps.push(currentTime);

        // Limit the number of data points to keep the chart readable
        if (mq2Data.length > 10) {
            mq2Data.shift();
            mq7Data.shift();
            timeStamps.shift();
        }

        // Update the charts with the new data
        mq2Chart.update();
        mq7Chart.update();

        let warningMessage = "";

        // Determine the status and warning message based on gas levels
        if (data.mq2Level > 1000 && data.mq7Level > 100) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Levels Of Carbon Monoxide & Flammable Gas detected! Move to a safe location and seek fresh air.';
        } else if (data.mq2Level > 1000) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Level Of Smoke Or Flammable Gas Detected! Move to a safe location.';
        } else if (data.mq2Level > 200 && data.mq2Level < 1000) {
            document.getElementById("status").style.color = "yellow";
            document.getElementById('status').innerHTML = "Status: Risky";
            warningMessage = 'Warning: Medium Level Of Smoke Or Flammable Gas Detected!';
        } else if (data.mq7Level > 100) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Level Of Carbon Monoxide Gas Detected! Seek fresh air.';
        } else if (data.mq2Level < 200 && data.mq7Level < 100) {
            document.getElementById("status").style.color = "green";
            document.getElementById('status').innerHTML = "Status: Safe";
        }

        // Show warning if there is a message
        if (warningMessage) {
            showWarning(warningMessage);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Start data fetching every 2 seconds and store interval ID
dataFetchInterval = setInterval(fetchData, 2000);

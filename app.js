 // Prepare empty data arrays for the charts
let mq2Data = [];
let mq7Data = [];
let timeStamps = [];
let previousMq2Level = 0;
let previousMq7Level = 0;
let isHelmetOn = true; 
// Define threshold values as variables
const MAX_MQ2_THRESHOLD = 1000;  // Max threshold for MQ2
const MEDIUM_MQ2_THRESHOLD = 200; // Medium threshold for MQ2
const MAX_MQ7_THRESHOLD = 100;    // Max threshold for MQ7
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

         // Update power status
        if (data.status === "off") {
            if (isHelmetOn) {
                isHelmetOn = false; // Update state
                document.getElementById('power').innerHTML  = "Off";
                document.getElementById('status').style.color = "gray";
                document.getElementById('status').innerHTML = "Status: Off";
                console.log('Helmet is off - no chart updates.');
            }
        } else {
            // If helmet is on, update the UI accordingly
            if (!isHelmetOn) {
                isHelmetOn = true; // Update state
                document.getElementById('power').innerHTML  = "On";
                document.getElementById('status').style.color = "green";
                document.getElementById('status').innerHTML = "Status: On";
                console.log('Helmet is on - starting chart updates.');
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
          // Force Chart.js to re-render with the new data
                mq2Chart.data.datasets[0].data = mq2Data;
                mq7Chart.data.datasets[0].data = mq7Data;
                mq2Chart.data.labels = timeStamps;
                mq7Chart.data.labels = timeStamps;


        // Update the charts with the new data
        mq2Chart.update();
        mq7Chart.update();

        let warningMessage = "";

        // Determine the status and warning message based on gas levels
        if (data.mq2Level > MAX_MQ2_THRESHOLD && data.mq7Level > MAX_MQ7_THRESHOLD) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Levels Of Carbon Monoxide & Flammable Gas detected! Move to a safe location and seek fresh air.';
            const alertMax = document.getElementById('alertMax');
                alertMax.currentTime = 0;
                alertMax.play();
        } 
            else if (data.mq7Level > MAX_MQ7_THRESHOLD) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Level Of Carbon Monoxide Gas Detected! Seek fresh air.';
            const alertMax = document.getElementById('alertMax');
                alertMax.currentTime = 0;
                alertMax.play();
        }
        else if (data.mq2Level > MAX_MQ2_THRESHOLD) {
            document.getElementById("status").style.color = "red";
            document.getElementById('status').innerHTML = "Status: Dangerous";
            warningMessage = 'Warning: High Level Of Smoke Or Flammable Gas Detected! Move to a safe location.';
            const alertMax = document.getElementById('alertMax');
                alertMax.currentTime = 0;
                alertMax.play();
        } else if (data.mq2Level > MEDIUM_MQ2_THRESHOLD  && data.mq2Level <= MAX_MQ2_THRESHOLD) {
            document.getElementById("status").style.color = "yellow";
            document.getElementById('status').innerHTML = "Status: Risky";
            warningMessage = 'Warning: Medium Level Of Smoke Or Flammable Gas Detected!';
            // Play the medium threshold alert sound
                const alertMedium = document.getElementById('alertMedium');
                alertMedium.currentTime = 0;
                alertMedium.play();
        }  else if (data.mq2Level < MEDIUM_MQ2_THRESHOLD  && data.mq7Level < MAX_MQ7_THRESHOLD) {
            document.getElementById("status").style.color = "green";
            document.getElementById('status').innerHTML = "Status: Safe";
        }

        // Show warning if there is a message
        if (warningMessage) {
            showWarning(warningMessage);
        }
     }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
   // Delay next update by 1 second
    setTimeout(() => requestAnimationFrame(fetchData), 1000);
}
// Start the update loop
fetchData();

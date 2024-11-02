import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDynvu6vPrQ0h-C0IWTEcuuDJn-hZE9v7U",
    authDomain: "typing-48a93.firebaseapp.com",
    projectId: "typing-48a93",
    storageBucket: "typing-48a93.firebasestorage.app",
    messagingSenderId: "576342094162",
    appId: "1:576342094162:web:7bf25644be82eda081ca8b",
    measurementId: "G-F2QLKESFNB"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let startTime, timerInterval;
let timerStarted = false;
let wpmData = [];
let wpmChart;

// Generate a random 20-word sentence
function generateSentence() {
    const words = ["amazing", "brilliant", "challenge", "delight", "explore", "fantastic", "gorgeous", "harmony", "inspire", "journey", "knowledge", "limitless", "marvelous", "notable", "optimistic", "potential", "quality", "remarkable", "success", "thriving"];
    let sentence = [];
    for (let i = 0; i < 20; i++) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        sentence.push(randomWord);
    }
    return sentence.join(" ");
}

// Store the sentence in Firestore
async function storeSentence() {
    const sentence = generateSentence();
    await setDoc(doc(db, "typingGame", "sentence"), {
        sentence: sentence,
        timestamp: serverTimestamp()
    });
    return sentence;
}

// Get the sentence from Firestore
async function getSentence() {
    const doc = await getDocs(collection(db, "typingGame"));
    if (doc.exists) {
        return doc.data().sentence;
    } else {
        return await storeSentence();
    }
}

// Reset the sentence at midnight
function resetSentenceAtMidnight() {
    const now = new Date();
    const millisUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;

    setTimeout(async function() {
        await storeSentence();
        resetSentenceAtMidnight();  // Schedule the next reset
    }, millisUntilMidnight);
}

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById('wpmChart').getContext('2d');
    wpmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Words Per Minute (WPM)',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                lineTension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'WPM',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Update the chart data
function updateWpmChart() {
    wpmChart.data.labels = wpmData.map(point => point.time);
    wpmChart.data.datasets[0].data = wpmData.map(point => point.wpm);
    wpmChart.update();
}

// Start the game
async function startGame() {
    const sentence = await getSentence();
    document.getElementById('typingInput').value = "";
    document.getElementById('typingInput').placeholder = sentence;
    document.getElementById('result').textContent = "";
    document.getElementById('timeDisplay').textContent = "0.0 seconds";
    document.getElementById('wpmDisplay').textContent = "";
    wpmData = [];
    document.getElementById('typingInput').focus();
    clearInterval(timerInterval); // Clear any previous timer intervals
    timerStarted = false; // Reset the timer flag
    wpmChart.clear(); // Clear the chart
    document.getElementById('wpmChart').style.display = "none"; // Hide the chart initially
}
document.getElementById('typingInput').addEventListener('input', function() {
    if (!timerStarted) {
        startTime = new Date(); // Start the timer on first input
        timerStarted = true;
        timerInterval = setInterval(updateTimeDisplayAndWpm, 100); // Update time and WPM display every 0.1 second
    }
    const sentence = document.getElementById('placeholder').textContent;
    const typedText = document.getElementById('typingInput').value;
    if (typedText === sentence) {
        clearInterval(timerInterval); // Stop the timer
        const endTime = new Date(); // End the timer
        const timeTaken = (endTime - startTime) / 1000; // Calculate the time in seconds
        document.getElementById('result').textContent = "Success! You typed the sentence correctly.";
        document.getElementById('timeDisplay').textContent = `${timeTaken.toFixed(1)} seconds`;

        const wordCount = sentence.split(" ").length;
        const minutes = timeTaken / 60;
        const wpm = wordCount / minutes;
        document.getElementById('wpmDisplay').textContent = `Words Per Minute (WPM): ${wpm.toFixed(1)}`;

        // Add final WPM data point
        wpmData.push({ time: timeTaken.toFixed(1), wpm: wpm.toFixed(1) });
        document.getElementById('wpmChart').style.display = "block"; // Show the chart
        updateWpmChart();
    } else {
        document.getElementById('result').textContent = "";
    }
});

function updateTimeDisplayAndWpm() {
    if (timerStarted) {
        const currentTime = new Date();
        const timeElapsed = (currentTime - startTime) / 1000;
        document.getElementById('timeDisplay').textContent = `${timeElapsed.toFixed(1)} seconds`;

        // Calculate WPM during typing
        const sentence = document.getElementById('placeholder').textContent;
        const typedText = document.getElementById('typingInput').value;
        const wordsTyped = typedText.split(" ").length;
        const minutesElapsed = timeElapsed / 60;
        const wpm = wordsTyped / minutesElapsed;

        // Add current WPM data point every 0.1 second
        wpmData.push({ time: timeElapsed.toFixed(1), wpm: wpm.toFixed(1) });
        updateWpmChart();
        alert(sentence);
    }
}

// Initialize chart and start game on page load
window.onload = function() {
    initializeChart();
    startGame();
    resetSentenceAtMidnight(); // Schedule the first reset
}

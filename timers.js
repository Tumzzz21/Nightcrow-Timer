const form = document.getElementById("timerForm");
const bossSelect = document.getElementById("bossName");
const mapSelect = document.getElementById("mapName");
const killHour = document.getElementById("killHour");
const killMinute = document.getElementById("killMinute");
const killAmPm = document.getElementById("killAmPm");
const intervalInput = document.getElementById("interval");
const varianceInput = document.getElementById("variance");
const channelSelect = document.getElementById("channel");
const bossGrid = document.getElementById("bossGrid");
const timersCard = document.getElementById("timersCard");

const bossMapOptions = {
  Kiaron: [
    "STONEGRAVE FIELD",
    "CONQUEST OF UNITY",
    "STONE PATH WILDERNESS",
    "CONQUEST OF BELLIGERENCE",
    "WIND PATH FLATLAND",
    "CONQUEST OF VICTORY",
    "UNKNOWN"
  ],
  Anggolt: [
    "TRAINING GROUNDS OF UNITY",
    "RALLY POINT OF UNITY",
    "TRAINING GROUNDS OF BELLIGERENCE",
    "RALLY POINT OF BELLIGERENCE",
    "TRAINING GROUNDS OF VICTORY",
    "RALLY POINT OF VICTORY",
    "UNKNOWN"
  ],
  Grish: [
    "ASSAULT POINT OF BELLIGERENCE",
    "ROCKY MOUNTAIN CLIFF",
    "ASSAULT POINT OF UNITY",
    "STONEGRAVE SUMMIT",
    "ASSAULT POINT OF VICTORY",
    "CLOUD PATH WATCHTOWER",
   "UNKNOWN"
  ],
  Inferno: [
    "HIGH GROUNDS SUMMIT",
    "SOURCE OF HEAVY COMBAT",
    "HORIZON PEAKS",
    "NEWBREEZE BORDER",
    "UNKNOWN"
  ]
};

let timers = JSON.parse(localStorage.getItem("timers") || "[]");

function saveTimers() {
  localStorage.setItem("timers", JSON.stringify(timers));
}

function renderTimers() {
  bossGrid.innerHTML = "";

  if (timers.length === 0) {
    timersCard.hidden = true;
    return;
  }

  timersCard.hidden = false;

  timers.forEach((timer, index) => {
    const card = document.createElement("div");
    card.className = "boss-card";

    const killTime = new Date(timer.killTime);
    const nextMin = new Date(timer.min);
    const nextMax = new Date(timer.max);

    const timeFormat = time => time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    card.innerHTML = `
      <h3>${timer.bossName}</h3>
      <span><strong>${timer.mapName}</strong></span>
      <span>Channel: ${timer.channel}</span>
      <span>Killed at: ${timeFormat(killTime)}</span>
      <span>Respawn: ${timeFormat(nextMin)} – ${timeFormat(nextMax)}</span>
      <button onclick="removeTimer(${index})">Remove</button>
    `;

    bossGrid.appendChild(card);
  });
}

function removeTimer(index) {
  timers.splice(index, 1);
  saveTimers();
  renderTimers();
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const bossName = bossSelect.value;
  const mapName = mapSelect.value;
  const hour = parseInt(killHour.value, 10);
  const minute = parseInt(killMinute.value, 10);
  const amPm = killAmPm.value;
  const interval = parseFloat(intervalInput.value);
  const variance = parseFloat(varianceInput.value);
  const channel = channelSelect.value;

  if (!channel) {
    alert("Please select a channel.");
    return;
  }

  let finalHour = hour % 12;
  if (amPm === "PM") finalHour += 12;

  const now = new Date();
  const killTime = new Date(now);
  killTime.setHours(finalHour, minute, 0, 0);

  const min = new Date(killTime.getTime() + interval * 60 * 60 * 1000);
  const max = new Date(min.getTime() + variance * 60 * 60 * 1000);

  timers.push({
    bossName,
    mapName,
    channel,
    killTime: killTime.toISOString(),
    interval,
    variance,
    min: min.toISOString(),
    max: max.toISOString()
  });

  saveTimers();
  renderTimers();
  form.reset();
  mapSelect.disabled = true;
  channelSelect.value = "";
});

bossSelect.addEventListener("change", () => {
  const selectedBoss = bossSelect.value;
  const maps = bossMapOptions[selectedBoss] || [];

  mapSelect.innerHTML = `<option value="" disabled selected>Select a map</option>`;
  maps.forEach(map => {
    const option = document.createElement("option");
    option.value = map;
    option.textContent = map;
    mapSelect.appendChild(option);
  });

  mapSelect.disabled = false;
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(timers, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "boss_timers.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    try {
      timers = JSON.parse(event.target.result);
      saveTimers();
      renderTimers();
    } catch (err) {
      alert("Failed to import timers. Invalid file format.");
    }
  };
  reader.readAsText(file);
});

renderTimers();

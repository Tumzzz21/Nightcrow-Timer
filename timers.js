document.addEventListener('DOMContentLoaded', () => {
  const bossMaps = {
    Kiaron: ["STONEGRAVE FIELD", "CONQUEST OF UNITY", "STONE PATH WILDERNESS", "CONQUEST OF BELLIGERENCE", "WIND PATH FLATLAND", "CONQUEST OF VICTORY"],
    Anggolt: ["TRAINING GROUNDS OF UNITY", "RALLY POINT OF UNITY", "TRAINING GROUNDS OF BELLIGERENCE", "RALLY POINT OF BELLIGERENCE", "TRAINING GROUNDS OF VICTORY", "RALLY POINT OF VICTORY"],
    Grish: ["ASSAULT POINT OF BELLIGERENCE", "ROCKY MOUNTAIN CLIFF", "ASSAULT POINT OF UNITY", "STONEGRAVE SUMMIT", "ASSAULT POINT OF VICTORY", "CLOUD PATH WATCHTOWER"],
    Inferno: ["HIGH GROUNDS SUMMIT", "SOURCE OF HEAVY COMBAT", "HORIZON PEAKS", "NEWBREEZE BORDER"]
  };

  const form = document.getElementById('timerForm');
  const bossSelect = document.getElementById('bossName');
  const mapSelect = document.getElementById('mapName');
  const bossGrid = document.getElementById('bossGrid');
  const timersCard = document.getElementById('timersCard');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  let timers = [];

  // Populate map dropdown based on boss selection
  function populateMaps(boss) {
    const maps = bossMaps[boss] || [];
    mapSelect.innerHTML = '<option value="" disabled selected>Select a map</option>' +
      maps.map(m => `<option value="${m}">${m}</option>`).join('') +
      '<option value="addNewMap" style="color:#aaa;">+ Add new map...</option>';
    mapSelect.disabled = maps.length === 0;
  }

  bossSelect.addEventListener('change', () => {
    populateMaps(bossSelect.value);
  });

  mapSelect.addEventListener('change', () => {
    if (mapSelect.value === 'addNewMap') {
      let newMap = prompt('Enter new map:');
      if (!newMap) {
        mapSelect.value = "";
        return;
      }
      newMap = newMap.trim();
      if (!newMap) {
        alert('Map name cannot be empty.');
        mapSelect.value = "";
        return;
      }
      const arr = bossMaps[bossSelect.value] || [];
      if (arr.some(m => m.toLowerCase() === newMap.toLowerCase())) {
        alert('Map already exists.');
        // Select existing map with case insensitive match
        const existing = arr.find(m => m.toLowerCase() === newMap.toLowerCase());
        mapSelect.value = existing;
        return;
      }
      arr.push(newMap);
      bossMaps[bossSelect.value] = arr;
      populateMaps(bossSelect.value);
      mapSelect.value = newMap;
    }
  });

  // Load timers from localStorage on page load
  window.onload = () => {
    const saved = localStorage.getItem('timers');
    if (saved) {
      timers = JSON.parse(saved);
      renderAll();
    }
  };

  // Handle form submit - add new timer
  form.addEventListener('submit', e => {
    e.preventDefault();
    const boss = bossSelect.value;
    const map = mapSelect.value;
    if (!boss || !map) {
      alert('Select boss and map');
      return;
    }
    const baseHrs = +document.getElementById('interval').value;
    const randHrs = +document.getElementById('variance').value;
    const hh = +document.getElementById('killHour').value;
    const mm = +document.getElementById('killMinute').value;
    const ampm = document.getElementById('killAmPm').value;

    if (
      isNaN(hh) || hh < 1 || hh > 12 ||
      isNaN(mm) || mm < 0 || mm > 59
    ) {
      alert("Please enter valid kill time");
      return;
    }

let h24 = hh % 12;
if (ampm === 'PM') h24 += 12;

const kill = new Date();
kill.setHours(h24, mm, 0, 0);

// Save the exact kill time as ISO string
const killTime = new Date(kill.getTime());

const min = new Date(kill.getTime() + baseHrs * 3600e3);
const max = new Date(min.getTime() + randHrs * 3600e3);

const timer = {
  id: Date.now(),
  boss,
  map,
  kill: killTime.toISOString(), // <--- store kill time
  min: min.toISOString(),
  max: max.toISOString()
};

    timers.push(timer);
    saveTimers();
    renderAll();

    form.reset();
    bossSelect.value = "";
    mapSelect.innerHTML = '<option value="" disabled selected>Select a map</option>';
    mapSelect.disabled = true;
  });

  // Save timers to localStorage
  function saveTimers() {
    localStorage.setItem('timers', JSON.stringify(timers));
  }

  // Render all timers grouped by boss
  function renderAll() {
    bossGrid.innerHTML = '';
    if (!timers.length) {
      timersCard.hidden = true;
      return;
    } else {
      timersCard.hidden = false;
    }

    const byBoss = {};
    timers.forEach(t => {
      if (!byBoss[t.boss]) byBoss[t.boss] = [];
      byBoss[t.boss].push(t);
    });

    Object.keys(byBoss).sort().forEach(boss => {
      const col = document.createElement('div');
      col.className = 'boss-col';

      const head = document.createElement('h3');
      head.textContent = boss;
      col.appendChild(head);

byBoss[boss].sort((a, b) => new Date(a.min) - new Date(b.min)).forEach(t => {
  const card = document.createElement('div');
  card.className = 'timer-card';
  card.dataset.id = t.id;
  card.innerHTML = `
    <span><strong>${t.map}</strong></span>
    <span id="w_${t.id}"></span>
    <span id="c_${t.id}"></span>
    <span style="font-size:.9em;color:#b6b6b6;">Kill time: ${fmtTime(new Date(t.kill || t.min))}</span>
    <button style="margin-top:.25rem;align-self:center;border-radius:50%;width:1.8rem;height:1.8rem;font-size:1rem;" aria-label="Remove timer" onclick="removeTimer(${t.id})">✕</button>
  `;
  col.appendChild(card);
});
      bossGrid.appendChild(col);
    });
    update();
  }

  // Remove a timer by id
  window.removeTimer = function(id) {
    const idx = timers.findIndex(t => t.id === id);
    if (idx > -1) {
      timers.splice(idx, 1);
      saveTimers();
      renderAll();
    }
  }

  // Update timer countdowns every second
  function update() {
    const now = new Date();
    timers.forEach(t => {
      const min = new Date(t.min);
      const max = new Date(t.max);
      const wSpan = document.getElementById(`w_${t.id}`);
      const cSpan = document.getElementById(`c_${t.id}`);
      if (!wSpan || !cSpan) return;

      wSpan.textContent = `${fmtTime(min)} — ${fmtTime(max)}`;

      if (now < min) {
        cSpan.style.color = '#f9f9f9';
        cSpan.textContent = `Earliest: ${fmtCD(min - now)}`;
      } else if (now <= max) {
        cSpan.style.color = 'red';
        cSpan.innerHTML = `Guaranteed: ${fmtCD(max - now)} <small style='font-size:.7em;color:#f44;'>SPAWN</small>`;
      } else {
        cSpan.style.color = 'red';
        cSpan.textContent = 'Spawn due';
      }
    });
  }
  setInterval(update, 1000);

  // Format time as h:mm AM/PM
  const fmtTime = d => {
    let h = d.getHours() % 12 || 12,
      m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  // Format countdown duration as hh:mm:ss
  function fmtCD(ms) {
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
  }

  // Export timers as JSON file
  exportBtn.onclick = () => {
    if (!timers.length) {
      alert('No timers to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(timers, null, 2)], { type: 'application/json' });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `night-crows-timers-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Import timers from JSON file
  importBtn.onclick = () => importFile.click();

  importFile.onchange = () => {
    const file = importFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      let imported;
      try {
        imported = JSON.parse(e.target.result);
      } catch {
        alert('Invalid file.');
        return;
      }

      if (!Array.isArray(imported)) {
        alert('Invalid timer file.');
        return;
      }

      const mode = confirm('Click OK to MERGE. Cancel to REPLACE.') ? 'merge' : 'replace';

      if (mode === 'replace') {
        timers = [];
      }

      imported.forEach(t => {
        // Only add new timers (no duplicates by id)
        if (!timers.some(x => x.id === t.id)) timers.push(t);
      });

      saveTimers();
      renderAll();
      alert(`Imported ${imported.length} timer(s).`);
      importFile.value = '';
    };
    reader.readAsText(file);
  };
});

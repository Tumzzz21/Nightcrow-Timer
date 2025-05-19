const baseHrs = parseFloat(document.getElementById('interval').value);
const randHrs = parseFloat(document.getElementById('variance').value);

// Only allow .0 or .5 values
if ((baseHrs * 10) % 5 !== 0 || (randHrs * 10) % 5 !== 0) {
  alert('Only .5-hour intervals are allowed (e.g. 11, 11.5, 12, etc.)');
  return;
}

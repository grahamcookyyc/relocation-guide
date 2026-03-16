#!/usr/bin/env node
// Run: node generate-neighbourhood-index.js Calgary_Neighbourhood_Index.csv
// Outputs: neighbourhood-index.json
//
// Only the fields used by the scoring rubric are kept to keep the file small.

const fs   = require('fs');
const path = require('path');

const csvPath  = process.argv[2] || 'Calgary_Neighbourhood_Index.csv';
const outPath  = path.join(path.dirname(csvPath), 'neighbourhood-index.json');

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// Parse header
const header = parseCSVLine(lines[0]);
const idx = (col) => {
  const i = header.indexOf(col);
  if (i === -1) throw new Error(`Column not found: "${col}"`);
  return i;
};

// Column index map — only what we need
const COLS = {
  name:           idx('name'),
  class:          idx('class'),
  amenitiesDomain:idx('Accessibility and Amenities Domain Score'),
  commuteTime:    idx('Commute to Work Time (minutes)'),
  transitScore:   idx('Transit Score'),
  walkScore:      idx('Walk Score'),
  transitPct:     idx('Commute to Work by Transit (%)'),
  landTemp:       idx('Land Surface Temperature'),
  parkArea:       idx('Share of Park Area (%)'),
  personCrime:    idx('Person Crime Rate'),
  physicalDisorder:idx('Physical Disorder Rate'),
  propertyCrime:  idx('Property Crime Rate'),
  proxChildcare:  idx('Proximity to Childcare'),
  proxGrocery:    idx('Proximity to Grocery Store'),
  proxHealthcare: idx('Proximity to Healthcare'),
  proxParks:      idx('Proximity to Neighbourhood Parks'),
  proxPharmacy:   idx('Proximity to Pharmacies'),
  proxPrimary:    idx('Proximity to Primary Education'),
  proxSecondary:  idx('Proximity to Secondary Education'),
  renterPct:      idx('Renter Households (%)'),
  belonging:      idx('Sense of Belonging to Local Community (%)'),
  socialDisorder: idx('Social Disorder Rate'),
  spatialEdu:     idx('Spatial Access to Primary and Secondary Education'),
  treeCanopy:     idx('Tree Canopy (%)'),
};

const result = {};
let kept = 0, skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (!row.length) continue;

  const name  = (row[COLS.name] || '').trim().toUpperCase();
  const cls   = (row[COLS.class] || '').trim();
  if (!name) continue;

  // Skip rows with no numeric data (fully empty Industrial/Residual rows)
  const transitScore = parseFloat(row[COLS.transitScore]);
  if (isNaN(transitScore)) { skipped++; continue; }

  const entry = {};
  for (const [key, colIdx] of Object.entries(COLS)) {
    if (key === 'name' || key === 'class') continue;
    const v = parseFloat(row[colIdx]);
    entry[key] = isNaN(v) ? null : v;
  }
  entry.class = cls;

  // Deduplicate — keep first occurrence (some comm codes share rows in the CSV)
  if (!result[name]) {
    result[name] = entry;
    kept++;
  }
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`✓ Written ${outPath}`);
console.log(`  ${kept} neighbourhoods kept, ${skipped} skipped (no data)`);

// ── CSV parser (handles quoted fields) ──────────────────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; continue; }
    cur += ch;
  }
  fields.push(cur);
  return fields;
}

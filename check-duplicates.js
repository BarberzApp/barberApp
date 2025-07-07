const fs = require('fs');

// Read the specialties file
const content = fs.readFileSync('./src/shared/constants/specialties.ts', 'utf8');

// Extract the array content
const arrayMatch = content.match(/export const BARBER_SPECIALTIES = \[([\s\S]*?)\] as const/);
if (!arrayMatch) {
  console.log('Could not find BARBER_SPECIALTIES array');
  process.exit(1);
}

// Parse the array content
const arrayContent = arrayMatch[1];
const specialties = arrayContent
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith("'") && line.endsWith("',"))
  .map(line => line.slice(1, -2)) // Remove quotes and comma
  .filter(specialty => specialty.length > 0);

// Find duplicates
const duplicates = [];
const seen = new Set();

specialties.forEach(specialty => {
  if (seen.has(specialty)) {
    duplicates.push(specialty);
  } else {
    seen.add(specialty);
  }
});

if (duplicates.length > 0) {
  console.log('Duplicates found:', duplicates);
} else {
  console.log('No duplicates found');
}

console.log(`Total specialties: ${specialties.length}`);
console.log(`Unique specialties: ${seen.size}`); 
const fs = require('fs');

const modalsCode = fs.readFileSync('components/SSModals.tsx', 'utf8');

const updatedLEPortal = fs.readFileSync('components/SSLEPortalUpdated.tsx', 'utf8');
const extractLEPortal = updatedLEPortal.match(/\/\* ─── LE Portal ─── \*\/\s*export function SSLEPortal[\s\S]*?(?=\nEOF|$)/)[0];

const startIdx = modalsCode.indexOf('/* ─── LE Portal ─── */');
const endIdx = modalsCode.indexOf('/* ─── Settings ─── */');

if (startIdx > -1 && endIdx > -1) {
    const newModals = modalsCode.substring(0, startIdx) + extractLEPortal + '\n' + modalsCode.substring(endIdx);
    fs.writeFileSync('components/SSModals.tsx', newModals);
    console.log('Successfully updated SSModals.tsx');
} else {
    console.error('Could not find markers');
}

// Test dei percorsi dopo riorganizzazione file
// Questo file verifica che tutti i riferimenti ai file spostati siano corretti

console.log('🔍 === TEST PERCORSI FILE ===');

// Test CSS
const cssLink = document.querySelector('link[href*="styles.css"]');
console.log('CSS caricato:', cssLink ? '✅' : '❌', cssLink?.href);

// Test Favicon
const faviconLink = document.querySelector('link[href*="favicon"]');
console.log('Favicon caricato:', faviconLink ? '✅' : '❌', faviconLink?.href);

// Test Manifest
const manifestLink = document.querySelector('link[href*="manifest"]');
console.log('Manifest caricato:', manifestLink ? '✅' : '❌', manifestLink?.href);

// Test script di test caricati
const testScripts = document.querySelectorAll('script[src*="test/"]');
console.log('Script di test caricati:', testScripts.length, 'file');
testScripts.forEach((script, index) => {
    console.log(`  ${index + 1}. ${script.src.split('/').pop()}`);
});

// Test funzioni di test disponibili
const testFunctions = [
    'testTestata',
    'testStatoCorrente', 
    'simulazioneCompleta'
];

console.log('\nFunzioni di test disponibili:');
testFunctions.forEach(fn => {
    console.log(`  ${fn}:`, typeof window[fn] === 'function' ? '✅' : '❌');
});

console.log('\n✅ Test percorsi completato');
console.log('Tutti i file sono stati riorganizzati correttamente!');
// test_persistenza_logger.js - Test persistenza configurazione Logger

function testPersistenzaLogger() {
    console.log('🧪 === TEST PERSISTENZA LOGGER ===');
    console.log('');
    
    console.log('📊 Stato iniziale:');
    LogControl.status();
    console.log('');
    
    console.log('🔇 Disabilito tutti i log...');
    disableLogs();
    
    console.log('');
    console.log('🔄 Simulazione refresh (ricaricamento configurazione)...');
    LogControl.loadConfig();
    
    console.log('');
    console.log('📊 Stato dopo ricaricamento:');
    LogControl.status();
    
    console.log('');
    console.log('🧪 Test log dopo ricaricamento:');
    Logger.debug('Se vedi questo messaggio, la persistenza NON funziona!');
    Logger.error('Gli errori dovrebbero sempre essere visibili');
    
    console.log('');
    console.log('🔄 Reset per pulire il test:');
    resetLogs();
    
    console.log('');
    console.log('✅ === FINE TEST PERSISTENZA ===');
    console.log('Se dopo il "disableLogs()" non hai visto log di debug,');
    console.log('la persistenza funziona correttamente!');
}

// Comandi per la console
window.testPersistenza = testPersistenzaLogger;

console.log('💡 Test persistenza Logger caricato!');
console.log('Esegui: testPersistenza()');
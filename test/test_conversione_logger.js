// test_conversione_logger.js - Test per verificare la conversione completa
// Eseguire questo script nella console del browser per testare il sistema

function testLoggerConversion() {
    console.log('🧪 === TEST CONVERSIONE LOGGER ===');
    console.log('');
    
    console.log('📊 Stato attuale del Logger:');
    LogControl.status();
    console.log('');
    
    console.log('🔍 Test delle varie categorie di log:');
    Logger.debug('Test log debug - dovrebbe apparire');
    Logger.save('Test log save - dovrebbe apparire'); 
    Logger.load('Test log load - dovrebbe apparire');
    Logger.ui('Test log UI - dovrebbe apparire');
    Logger.calc('Test log calc - dovrebbe apparire');
    Logger.test('Test log test - dovrebbe apparire');
    Logger.error('Test log error - dovrebbe apparire');
    Logger.log('Test log generico - dovrebbe apparire');
    console.log('');
    
    console.log('🔇 Test disabilitazione categoria DEBUG:');
    LogControl.disableCategory('debug');
    Logger.debug('Questo debug NON dovrebbe apparire');
    Logger.save('Questo save dovrebbe ancora apparire');
    console.log('');
    
    console.log('🔊 Test riabilitazione categoria DEBUG:');
    LogControl.enableCategory('debug');
    Logger.debug('Questo debug dovrebbe apparire di nuovo');
    console.log('');
    
    console.log('🏭 Test modalità produzione:');
    LogControl.productionMode();
    Logger.debug('Questo debug NON dovrebbe apparire');
    Logger.save('Questo save NON dovrebbe apparire');
    Logger.error('Questo errore DOVREBBE apparire');
    console.log('');
    
    console.log('🛠️ Test modalità sviluppo:');
    LogControl.developmentMode();
    Logger.debug('Tutti i log dovrebbero apparire di nuovo');
    Logger.save('Test save post-dev mode');
    console.log('');
    
    console.log('✅ === FINE TEST CONVERSIONE LOGGER ===');
    console.log('Se vedi tutti i messaggi attesi, la conversione è riuscita!');
}

// Comandi rapidi per la console
window.testLogger = testLoggerConversion;

console.log('💡 Test conversione Logger caricato!');
console.log('Esegui: testLogger()');
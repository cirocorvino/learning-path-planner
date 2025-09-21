// test_logger.js - Test del sistema di logging

function testLogger() {
    Logger.test('=== TEST SISTEMA LOGGING ===');
    
    // Test di tutte le categorie
    Logger.debug('Test messaggio DEBUG');
    Logger.save('Test messaggio SAVE');
    Logger.load('Test messaggio LOAD');
    Logger.ui('Test messaggio UI');
    Logger.calc('Test messaggio CALC');
    Logger.test('Test messaggio TEST');
    Logger.error('Test messaggio ERROR');
    Logger.log('Test messaggio LOG generico');
    
    Logger.test('Tutti i tipi di log testati');
}

function testLogControl() {
    Logger.test('=== TEST CONTROLLI LOGGING ===');
    
    // Test stato
    LogControl.status();
    
    // Test disabilitazione categoria
    Logger.test('Disabilitando categoria DEBUG...');
    LogControl.disableCategory('DEBUG');
    Logger.debug('Questo messaggio DEBUG NON dovrebbe apparire');
    Logger.test('Messaggio TEST dovrebbe ancora apparire');
    
    // Riabilita DEBUG
    LogControl.enableCategory('DEBUG');
    Logger.debug('Questo messaggio DEBUG dovrebbe apparire di nuovo');
    
    // Test modalità produzione
    Logger.test('Attivando modalità produzione...');
    LogControl.productionMode();
    Logger.debug('DEBUG - Non dovrebbe apparire');
    Logger.save('SAVE - Non dovrebbe apparire');
    Logger.error('ERROR - Dovrebbe apparire');
    
    // Ripristina modalità sviluppo
    LogControl.developmentMode();
    Logger.test('Modalità sviluppo ripristinata');
    
    Logger.test('Test controlli completato');
}

function demonstrateLoggerUsage() {
    console.log('🎓 === DEMO USO LOGGER ===');
    console.log('');
    console.log('COMANDI DISPONIBILI NELLA CONSOLE:');
    console.log('');
    console.log('📝 Test:');
    console.log('  testLogger()     - Test di tutti i tipi di log');
    console.log('  testLogControl() - Test dei controlli di logging');
    console.log('');
    console.log('🎛️ Controlli rapidi:');
    console.log('  disableLogs()    - Disabilita tutti i log');
    console.log('  enableLogs()     - Abilita tutti i log');
    console.log('  prodMode()       - Solo errori');
    console.log('  devMode()        - Tutti i log');
    console.log('  logStatus()      - Mostra stato logging');
    console.log('');
    console.log('📊 Controlli avanzati:');
    console.log('  LogControl.disableCategory("SAVE")  - Disabilita categoria');
    console.log('  LogControl.enableCategory("SAVE")   - Abilita categoria');
    console.log('');
    console.log('💡 Esempi uso nei file JS:');
    console.log('  Logger.save("Salvando piano...")    - Log di salvataggio');
    console.log('  Logger.load("Caricando dati...")    - Log di caricamento');
    console.log('  Logger.calc("Ricalcolando ore...")  - Log di calcoli');
    console.log('  Logger.ui("Aggiornando UI...")      - Log UI');
    console.log('  Logger.debug("Debug info...")       - Log debug');
    console.log('  Logger.error("Errore!")             - Log errori');
}

// Esponi le funzioni globalmente
window.testLogger = testLogger;
window.testLogControl = testLogControl;
window.demonstrateLoggerUsage = demonstrateLoggerUsage;

// Mostra la demo automaticamente
demonstrateLoggerUsage();
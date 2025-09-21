// convert_logs.js - Strumento per convertire tutti i console.log in Logger
// Questo file deve essere eseguito una volta per convertire tutti i log esistenti

/**
 * Mappatura dei pattern di log alle categorie del Logger
 */
const LOG_PATTERNS = [
    // Salvataggio
    { regex: /console\.log\('🚀.*SAVEPLAN/g, replacement: "Logger.save('" },
    { regex: /console\.log\('💾/g, replacement: "Logger.save('" },
    { regex: /console\.log\('💾/g, replacement: "Logger.save('" },
    
    // Caricamento  
    { regex: /console\.log\('📁/g, replacement: "Logger.load('" },
    { regex: /console\.log\('📥/g, replacement: "Logger.load('" },
    { regex: /console\.log\('📋/g, replacement: "Logger.load('" },
    
    // UI
    { regex: /console\.log\('🖥️/g, replacement: "Logger.ui('" },
    { regex: /console\.log\('🎯/g, replacement: "Logger.ui('" },
    
    // Calcoli
    { regex: /console\.log\('📊/g, replacement: "Logger.calc('" },
    { regex: /console\.log\('🔢/g, replacement: "Logger.calc('" },
    { regex: /console\.log\('📈/g, replacement: "Logger.calc('" },
    
    // Debug
    { regex: /console\.log\('🔍/g, replacement: "Logger.debug('" },
    { regex: /console\.log\('🔄/g, replacement: "Logger.debug('" },
    { regex: /console\.log\('⚠️/g, replacement: "Logger.debug('" },
    
    // Errori
    { regex: /console\.log\('❌/g, replacement: "Logger.error('" },
    { regex: /console\.error\(/g, replacement: "Logger.error(" },
    
    // Test
    { regex: /console\.log\('🧪/g, replacement: "Logger.test('" },
    { regex: /console\.log\('✅/g, replacement: "Logger.test('" },
    
    // Log generici (ultimi da applicare)
    { regex: /console\.log\(/g, replacement: "Logger.log(" }
];

/**
 * Funzione per convertire i log in un testo
 */
function convertLogsInText(text) {
    let convertedText = text;
    
    LOG_PATTERNS.forEach(pattern => {
        convertedText = convertedText.replace(pattern.regex, pattern.replacement);
    });
    
    return convertedText;
}

/**
 * Istruzioni per l'uso manuale
 */
function showConversionInstructions() {
    console.log('📝 === ISTRUZIONI CONVERSIONE LOG ===');
    console.log('');
    console.log('Per convertire i log nei file:');
    console.log('');
    console.log('1. PATTERN DI CONVERSIONE:');
    LOG_PATTERNS.forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern.regex} → ${pattern.replacement}`);
    });
    console.log('');
    console.log('2. FILE DA CONVERTIRE:');
    console.log('   - js/planManager.js');
    console.log('   - js/calculations.js');
    console.log('   - js/main.js');
    console.log('   - js/uiManager.js');
    console.log('   - js/ganttChart.js');
    console.log('   - js/courseDetail.js');
    console.log('   - js/modalManager.js');
    console.log('');
    console.log('3. ESEMPI DI CONVERSIONE:');
    console.log("   console.log('💾 Salvando...') → Logger.save('Salvando...')");
    console.log("   console.log('📊 Calcoli') → Logger.calc('Calcoli')");
    console.log("   console.log('🔍 Debug') → Logger.debug('Debug')");
    console.log('');
    console.log('4. COMANDI UTILI DOPO LA CONVERSIONE:');
    console.log('   disableLogs() - Disabilita tutti i log');
    console.log('   prodMode()    - Solo errori');
    console.log('   devMode()     - Tutti i log');
}

// Esponi la funzione globalmente
window.convertLogsInText = convertLogsInText;
window.showConversionInstructions = showConversionInstructions;

// Mostra le istruzioni automaticamente
showConversionInstructions();
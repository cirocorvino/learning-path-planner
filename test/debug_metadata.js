// debug_metadata.js - Debug specifico per i metadata

function debugMetadata() {
    console.log('🔍 === DEBUG METADATA ===');
    
    // Test getCurrentPlanData
    console.log('\n📊 Test getCurrentPlanData():');
    const data = getCurrentPlanData();
    console.log('  Risultato completo:', data);
    console.log('  Metadata:', data.metadata);
    
    // Verifica salvati
    console.log('\n💾 Piani salvati in localStorage:');
    const savedPlans = getSavedPlans();
    console.log('  Numero piani:', Object.keys(savedPlans).length);
    
    Object.keys(savedPlans).forEach(id => {
        const plan = savedPlans[id];
        console.log(`  Piano ${id}:`, {
            name: plan.metadata.name,
            description: plan.metadata.description,
            createdAt: plan.metadata.createdAt
        });
    });
    
    // Ultimo piano
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('\n🔄 Last used plan:', lastPlanId);
    
    if (lastPlanId && savedPlans[lastPlanId]) {
        console.log('  Dettagli ultimo piano:', savedPlans[lastPlanId].metadata);
    }
}

function clearAllSavedPlans() {
    console.log('🧹 Pulizia completa piani salvati...');
    localStorage.removeItem('saved-study-plans');
    localStorage.removeItem('last-used-plan');
    
    // Reset variabili
    currentPlanId = null;
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = 'Percorso completo di certificazione professionale - Ore Effettive Ricalcolate';
    
    updateCurrentPlanDisplay();
    console.log('✅ Pulizia completata');
}

function testSaveStep() {
    console.log('🧪 === TEST STEP BY STEP SALVATAGGIO ===');
    
    // Step 1: Stato pulito
    clearAllSavedPlans();
    
    // Step 2: Input test
    const testName = 'Piano Clean Test';
    const testDesc = 'Descrizione pulita test';
    
    document.getElementById('planName').value = testName;
    document.getElementById('planDescription').value = testDesc;
    
    console.log('Valori form impostati:', {
        nome: document.getElementById('planName').value,
        descrizione: document.getElementById('planDescription').value
    });
    
    // Step 3: Variabili prima del salvataggio
    console.log('Variabili PRIMA del salvataggio:', {
        currentPlanName,
        currentPlanDescription,
        currentPlanId
    });
    
    // Step 4: Test getCurrentPlanData prima del salvataggio
    const dataBefore = getCurrentPlanData();
    console.log('getCurrentPlanData PRIMA:', dataBefore.metadata);
    
    // Step 5: Salvataggio con log dettagliato
    console.log('Eseguendo savePlan...');
    
    // Disabilita alert
    const originalAlert = window.alert;
    window.alert = (msg) => console.log('[ALERT]', msg);
    
    savePlan();
    
    // Ripristina alert
    window.alert = originalAlert;
    
    // Step 6: Verifica completa
    console.log('DOPO salvataggio:');
    console.log('  Variabili globali:', {
        currentPlanName,
        currentPlanDescription,  
        currentPlanId
    });
    
    const dataAfter = getCurrentPlanData();
    console.log('  getCurrentPlanData DOPO:', dataAfter.metadata);
    
    // Step 7: localStorage
    debugMetadata();
    
    console.log('✅ Test step-by-step completato');
}

window.debugMetadata = debugMetadata;
window.clearAllSavedPlans = clearAllSavedPlans;
window.testSaveStep = testSaveStep;

setTimeout(() => {
    console.log('🔍 Debug metadata caricato');
    console.log('Comandi disponibili:');
    console.log('  debugMetadata() - Mostra metadata correnti');
    console.log('  clearAllSavedPlans() - Pulisce tutto');
    console.log('  testSaveStep() - Test completo step-by-step');
}, 2500);
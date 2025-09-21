// test_rapido.js - Test veloce per verificare il fix

function testRapidoSalvataggio() {
    console.log('⚡ === TEST RAPIDO SALVATAGGIO ===');
    
    // Stato iniziale
    console.log('Stato iniziale:');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    console.log('  Titolo app:', document.getElementById('appTitle').textContent);
    
    // Simula salvataggio veloce
    const testName = 'Piano Test Veloce';
    const testDesc = 'Test descrizione veloce';
    
    // Inserisci valori nel form
    document.getElementById('planName').value = testName;
    document.getElementById('planDescription').value = testDesc;
    
    // Disabilita alert per test
    const originalAlert = window.alert;
    window.alert = (msg) => console.log('ALERT:', msg);
    
    // Esegui salvataggio
    console.log('Eseguendo savePlan()...');
    savePlan();
    
    // Ripristina alert
    window.alert = originalAlert;
    
    // Verifica risultato
    console.log('Risultato:');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    console.log('  Titolo app:', document.getElementById('appTitle').textContent);
    console.log('  Descrizione app:', document.getElementById('appDescription').textContent);
    console.log('  Classe CSS titolo:', document.getElementById('appTitle').className);
    
    // Verifica localStorage
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('  Piano salvato in localStorage:', lastPlanId ? 'SÌ' : 'NO');
    
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        if (savedPlan) {
            console.log('  Nome salvato:', savedPlan.metadata.name);
            console.log('  Descrizione salvata:', savedPlan.metadata.description);
        }
    }
    
    console.log('\n✅ Test completato');
}

window.testRapidoSalvataggio = testRapidoSalvataggio;

setTimeout(() => {
    console.log('🔧 Test rapido caricato - esegui: testRapidoSalvataggio()');
}, 3000);
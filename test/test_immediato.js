// test_immediato.js - Test immediato per il bug

function testImmediato() {
    console.log('⚡ === TEST IMMEDIATO ===');
    
    console.log('Stato iniziale:');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    
    // Simula esattamente quello che fa l'utente
    document.getElementById('planName').value = 'Test Immediato';
    document.getElementById('planDescription').value = 'Descrizione test immediato';
    
    // Leggi i valori come fa savePlan()
    const name = document.getElementById('planName').value.trim();
    const description = document.getElementById('planDescription').value.trim();
    
    console.log('Valori letti dal form:', { name, description });
    
    // Aggiorna variabili come fa savePlan()
    currentPlanName = name;
    currentPlanDescription = description;
    
    console.log('Dopo aggiornamento variabili:', {
        currentPlanName,
        currentPlanDescription
    });
    
    // Test getCurrentPlanData()
    const planData = getCurrentPlanData();
    console.log('getCurrentPlanData() restituisce:', {
        metadataName: planData.metadata.name,
        metadataDescription: planData.metadata.description
    });
    
    // Verifica se i valori corrispondono
    console.log('Corrispondenze:');
    console.log('  Nome corretto:', planData.metadata.name === name);
    console.log('  Descrizione corretta:', planData.metadata.description === description);
    
    // Reset per non confondere
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = 'Percorso completo di certificazione professionale - Ore Effettive Ricalcolate';
    updateCurrentPlanDisplay();
}

function testSalvataggioVeloce() {
    console.log('💨 === TEST SALVATAGGIO VELOCE ===');
    
    // Pulisce tutto
    localStorage.removeItem('saved-study-plans');
    localStorage.removeItem('last-used-plan');
    
    // Imposta valori nel form
    document.getElementById('planName').value = 'Piano Veloce Test';
    document.getElementById('planDescription').value = 'Descrizione veloce test';
    
    // Disabilita alert
    const originalAlert = window.alert;
    window.alert = (msg) => console.log('[ALERT]', msg);
    
    // Chiama savePlan con tutti i log
    console.log('Chiamando savePlan()...');
    savePlan();
    
    // Ripristina alert
    window.alert = originalAlert;
    
    // Verifica subito il risultato
    const lastPlanId = localStorage.getItem('last-used-plan');
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        
        console.log('Piano salvato:', {
            id: lastPlanId,
            name: savedPlan?.metadata?.name,
            description: savedPlan?.metadata?.description
        });
        
        console.log('Risultato:', {
            nomeCorretto: savedPlan?.metadata?.name === 'Piano Veloce Test',
            descrizioneCorretta: savedPlan?.metadata?.description === 'Descrizione veloce test'
        });
    } else {
        console.log('❌ Nessun piano salvato trovato!');
    }
}

// Disponibili nella console
window.testImmediato = testImmediato;
window.testSalvataggioVeloce = testSalvataggioVeloce;

console.log('⚡ Test immediato caricato');
console.log('Esegui: testImmediato() o testSalvataggioVeloce()');
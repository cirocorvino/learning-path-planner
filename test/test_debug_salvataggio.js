// test_debug_salvataggio.js - Debug specifico per il problema di salvataggio

function debugSaveIssue() {
    console.log('🔍 === DEBUG PROBLEMA SALVATAGGIO ===\n');
    
    // Step 1: Controlla stato iniziale variabili
    console.log('📊 STEP 1: Stato variabili globali');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    console.log('  currentPlanId:', currentPlanId);
    
    // Step 2: Controlla elementi DOM
    console.log('\n🖥️ STEP 2: Elementi DOM testata');
    const appTitle = document.getElementById('appTitle');
    const appDescription = document.getElementById('appDescription');
    console.log('  appTitle exists:', appTitle !== null);
    console.log('  appTitle content:', appTitle ? appTitle.textContent : 'N/A');
    console.log('  appDescription exists:', appDescription !== null);
    console.log('  appDescription content:', appDescription ? appDescription.textContent : 'N/A');
    
    // Step 3: Test updateCurrentPlanDisplay
    console.log('\n🔄 STEP 3: Test updateCurrentPlanDisplay()');
    if (typeof updateCurrentPlanDisplay === 'function') {
        console.log('  Funzione disponibile: OK');
        
        // Test con piano personalizzato
        const originalName = currentPlanName;
        const originalDesc = currentPlanDescription;
        
        currentPlanName = 'Test Piano Debug';
        currentPlanDescription = 'Test descrizione debug';
        
        console.log('  Chiamando updateCurrentPlanDisplay...');
        updateCurrentPlanDisplay();
        
        console.log('  Dopo aggiornamento:');
        console.log('    - Titolo:', document.getElementById('appTitle').textContent);
        console.log('    - Descrizione:', document.getElementById('appDescription').textContent);
        console.log('    - Classe CSS titolo:', document.getElementById('appTitle').className);
        
        // Ripristina
        currentPlanName = originalName;
        currentPlanDescription = originalDesc;
        updateCurrentPlanDisplay();
        
    } else {
        console.log('  ❌ Funzione updateCurrentPlanDisplay NON disponibile');
    }
    
    // Step 4: Test modal
    console.log('\n🪟 STEP 4: Test modal salvataggio');
    const planNameField = document.getElementById('planName');
    const planDescField = document.getElementById('planDescription');
    
    console.log('  Campo nome esiste:', planNameField !== null);
    console.log('  Campo descrizione esiste:', planDescField !== null);
    
    if (planNameField && planDescField) {
        // Test showSaveModal
        if (typeof showSaveModal === 'function') {
            console.log('  Testando showSaveModal...');
            
            // Imposta valori di test
            currentPlanName = 'Piano Test Modal';
            currentPlanDescription = 'Descrizione test modal';
            
            showSaveModal();
            
            console.log('  Valori nel modal:');
            console.log('    - Nome:', planNameField.value);
            console.log('    - Descrizione:', planDescField.value);
            
            // Chiudi modal
            document.getElementById('savePlanModal').classList.remove('active');
        } else {
            console.log('  ❌ showSaveModal non disponibile');
        }
    }
    
    // Step 5: Test savePlan
    console.log('\n💾 STEP 5: Test processo salvataggio');
    
    if (planNameField && planDescField) {
        // Simula input utente
        planNameField.value = 'Piano Debug Test';
        planDescField.value = 'Descrizione Debug Test';
        
        console.log('  Valori impostati nel form:');
        console.log('    - Nome:', planNameField.value);
        console.log('    - Descrizione:', planDescField.value);
        
        // Test function savePlan senza eseguirla realmente
        if (typeof savePlan === 'function') {
            console.log('  Funzione savePlan disponibile: OK');
            
            // Simula solo la parte di lettura dal form
            const name = planNameField.value.trim();
            const description = planDescField.value.trim();
            
            console.log('  Valori che verrebbero salvati:');
            console.log('    - Nome letto:', name);
            console.log('    - Descrizione letta:', description);
            
            if (name) {
                console.log('  ✅ Validazione nome: PASS');
                
                // Simula aggiornamento variabili
                const oldName = currentPlanName;
                const oldDesc = currentPlanDescription;
                
                currentPlanName = name;
                currentPlanDescription = description;
                updateCurrentPlanDisplay();
                
                console.log('  Testata aggiornata:');
                console.log('    - Nuovo titolo:', document.getElementById('appTitle').textContent);
                console.log('    - Nuova descrizione:', document.getElementById('appDescription').textContent);
                
                // Ripristina
                currentPlanName = oldName;
                currentPlanDescription = oldDesc;
                updateCurrentPlanDisplay();
                
            } else {
                console.log('  ❌ Validazione nome: FAIL (vuoto)');
            }
        } else {
            console.log('  ❌ Funzione savePlan non disponibile');
        }
        
        // Reset form
        planNameField.value = '';
        planDescField.value = '';
    }
    
    console.log('\n🎯 CONCLUSIONI:');
    console.log('==============');
    
    // Controlla possibili problemi
    const problems = [];
    
    if (!document.getElementById('appTitle')) {
        problems.push('❌ Elemento appTitle non trovato');
    }
    
    if (!document.getElementById('appDescription')) {
        problems.push('❌ Elemento appDescription non trovato');
    }
    
    if (typeof updateCurrentPlanDisplay !== 'function') {
        problems.push('❌ Funzione updateCurrentPlanDisplay non disponibile');
    }
    
    if (typeof showSaveModal !== 'function') {
        problems.push('❌ Funzione showSaveModal non disponibile');
    }
    
    if (typeof savePlan !== 'function') {
        problems.push('❌ Funzione savePlan non disponibile');
    }
    
    if (!document.getElementById('planName')) {
        problems.push('❌ Campo input planName non trovato');
    }
    
    if (!document.getElementById('planDescription')) {
        problems.push('❌ Campo input planDescription non trovato');
    }
    
    if (problems.length === 0) {
        console.log('✅ Tutti i componenti sembrano presenti');
        console.log('🔍 Il problema potrebbe essere nell\'ordine di esecuzione o in errori JavaScript');
        console.log('💡 Controlla la console del browser per errori durante il salvataggio');
    } else {
        console.log('Problemi rilevati:');
        problems.forEach(p => console.log('  ' + p));
    }
}

// Test specifico per il flusso di salvataggio completo
function testSaveFlowComplete() {
    console.log('\n🔄 === TEST FLUSSO COMPLETO SALVATAGGIO ===');
    
    try {
        // Step 1: Prepara dati test
        const testName = 'Piano Test Completo ' + Date.now();
        const testDesc = 'Descrizione di test completa';
        
        console.log('1. Dati test preparati:', { testName, testDesc });
        
        // Step 2: Apri modal (simula click pulsante)
        console.log('2. Aprendo modal...');
        showSaveModal();
        
        // Step 3: Compila form
        console.log('3. Compilando form...');
        document.getElementById('planName').value = testName;
        document.getElementById('planDescription').value = testDesc;
        
        // Step 4: Simula salvataggio senza alert
        console.log('4. Simulando salvataggio...');
        const originalAlert = window.alert;
        window.alert = () => {}; // Disabilita alert temporaneamente
        
        savePlan();
        
        window.alert = originalAlert; // Ripristina alert
        
        // Step 5: Verifica risultato
        console.log('5. Verificando risultato...');
        console.log('  currentPlanName:', currentPlanName);
        console.log('  currentPlanDescription:', currentPlanDescription);
        console.log('  Titolo app:', document.getElementById('appTitle').textContent);
        console.log('  Descrizione app:', document.getElementById('appDescription').textContent);
        
        // Step 6: Verifica salvataggio localStorage
        console.log('6. Verificando localStorage...');
        const savedPlans = getSavedPlans();
        const lastPlanId = localStorage.getItem('last-used-plan');
        console.log('  ID ultimo piano:', lastPlanId);
        console.log('  Piano salvato:', savedPlans[lastPlanId] ? 'SÌ' : 'NO');
        
        if (savedPlans[lastPlanId]) {
            console.log('  Nome salvato:', savedPlans[lastPlanId].metadata.name);
            console.log('  Descrizione salvata:', savedPlans[lastPlanId].metadata.description);
        }
        
        console.log('✅ Test completato con successo');
        
    } catch (error) {
        console.error('❌ Errore durante test:', error);
    }
}

// Esporta per uso nella console
window.debugSaveIssue = debugSaveIssue;
window.testSaveFlowComplete = testSaveFlowComplete;

// Auto-esecuzione
window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('\n🔧 DEBUG SALVATAGGIO CARICATO');
        console.log('🔍 Esegui: debugSaveIssue() per diagnosticare il problema');
        console.log('🧪 Esegui: testSaveFlowComplete() per test completo');
    }, 2500);
});
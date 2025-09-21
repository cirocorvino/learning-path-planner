// test_bug_salvataggio.js - Test specifico per il bug del salvataggio

function testBugSalvataggio() {
    console.log('🐛 === TEST BUG SALVATAGGIO ===\n');
    
    // Step 1: Stato iniziale
    console.log('📋 STEP 1: Stato iniziale');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    console.log('  currentPlanId:', currentPlanId);
    
    // Step 2: Simula input utente
    const testName = 'Piano Test Bug ' + Date.now();
    const testDesc = 'Descrizione test per verificare il bug';
    
    console.log('\n✏️ STEP 2: Simulazione input utente');
    console.log('  Nome inserito:', testName);
    console.log('  Descrizione inserita:', testDesc);
    
    // Imposta i valori nel form
    document.getElementById('planName').value = testName;
    document.getElementById('planDescription').value = testDesc;
    
    console.log('  Valori nel form dopo impostazione:');
    console.log('    - planName.value:', document.getElementById('planName').value);
    console.log('    - planDescription.value:', document.getElementById('planDescription').value);
    
    // Step 3: Test getCurrentPlanData PRIMA del salvataggio
    console.log('\n🔍 STEP 3: getCurrentPlanData() PRIMA del salvataggio');
    const dataBefore = getCurrentPlanData();
    console.log('  Metadata prima del salvataggio:');
    console.log('    - name:', dataBefore.metadata.name);
    console.log('    - description:', dataBefore.metadata.description);
    console.log('    - id:', dataBefore.metadata.id);
    
    // Step 4: Esegui salvataggio
    console.log('\n💾 STEP 4: Esecuzione savePlan()');
    
    // Disabilita alert per il test
    const originalAlert = window.alert;
    window.alert = (msg) => console.log('  [ALERT]', msg);
    
    // Esegui il salvataggio
    savePlan();
    
    // Ripristina alert
    window.alert = originalAlert;
    
    // Step 5: Verifica dopo salvataggio
    console.log('\n✅ STEP 5: Verifica dopo salvataggio');
    console.log('  Variabili globali dopo salvataggio:');
    console.log('    - currentPlanName:', currentPlanName);
    console.log('    - currentPlanDescription:', currentPlanDescription);
    console.log('    - currentPlanId:', currentPlanId);
    
    // Step 6: Verifica localStorage
    console.log('\n🗄️ STEP 6: Verifica localStorage');
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('  last-used-plan ID:', lastPlanId);
    
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        
        if (savedPlan) {
            console.log('  Piano trovato in localStorage:');
            console.log('    - metadata.name:', savedPlan.metadata.name);
            console.log('    - metadata.description:', savedPlan.metadata.description);
            console.log('    - metadata.id:', savedPlan.metadata.id);
            
            // Confronto con input originale
            const nameMatch = savedPlan.metadata.name === testName;
            const descMatch = savedPlan.metadata.description === testDesc;
            
            console.log('  Confronto con input originale:');
            console.log('    - Nome corretto:', nameMatch ? '✅' : '❌');
            console.log('    - Descrizione corretta:', descMatch ? '✅' : '❌');
            
            if (!nameMatch) {
                console.log('    - Atteso nome:', testName);
                console.log('    - Nome salvato:', savedPlan.metadata.name);
            }
            
            if (!descMatch) {
                console.log('    - Attesa descrizione:', testDesc);
                console.log('    - Descrizione salvata:', savedPlan.metadata.description);
            }
            
        } else {
            console.log('  ❌ Piano non trovato nel localStorage!');
        }
    } else {
        console.log('  ❌ Nessun last-used-plan trovato!');
    }
    
    // Step 7: Verifica UI
    console.log('\n🖥️ STEP 7: Verifica aggiornamento UI');
    const appTitle = document.getElementById('appTitle').textContent;
    const appDesc = document.getElementById('appDescription').textContent;
    
    console.log('  Testata app:');
    console.log('    - Titolo:', appTitle);
    console.log('    - Descrizione:', appDesc);
    
    const titleCorrect = appTitle.includes(testName);
    const descCorrect = appDesc === testDesc;
    
    console.log('  Confronto testata:');
    console.log('    - Titolo contiene nome:', titleCorrect ? '✅' : '❌');
    console.log('    - Descrizione corretta:', descCorrect ? '✅' : '❌');
    
    // Step 8: Conclusioni
    console.log('\n🎯 CONCLUSIONI:');
    console.log('================');
    
    const allGood = currentPlanName === testName && 
                   currentPlanDescription === testDesc && 
                   titleCorrect && 
                   descCorrect;
    
    if (allGood) {
        console.log('✅ TUTTO OK - Il bug sembra essere risolto!');
    } else {
        console.log('❌ PROBLEMI RILEVATI:');
        if (currentPlanName !== testName) {
            console.log(`  - currentPlanName errato: "${currentPlanName}" invece di "${testName}"`);
        }
        if (currentPlanDescription !== testDesc) {
            console.log(`  - currentPlanDescription errato: "${currentPlanDescription}" invece di "${testDesc}"`);
        }
        if (!titleCorrect) {
            console.log(`  - Titolo app non aggiornato: "${appTitle}"`);
        }
        if (!descCorrect) {
            console.log(`  - Descrizione app non aggiornata: "${appDesc}"`);
        }
    }
    
    console.log('\n🧹 Test completato');
}

function testRefreshPersistence() {
    console.log('\n🔄 === TEST PERSISTENZA DOPO REFRESH ===');
    
    // Simula quello che succede dopo un refresh
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('Last plan ID:', lastPlanId);
    
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        
        if (savedPlan) {
            console.log('Piano trovato, simulando caricamento...');
            
            // Simula il caricamento (come fa loadLastPlan)
            currentPlanId = lastPlanId;
            currentPlanName = savedPlan.metadata.name;
            currentPlanDescription = savedPlan.metadata.description;
            
            console.log('Dopo simulazione caricamento:');
            console.log('  currentPlanName:', currentPlanName);
            console.log('  currentPlanDescription:', currentPlanDescription);
            
            updateCurrentPlanDisplay();
            
            console.log('Testata dopo aggiornamento:');
            console.log('  Titolo:', document.getElementById('appTitle').textContent);
            console.log('  Descrizione:', document.getElementById('appDescription').textContent);
        }
    }
}

// Esporta per uso nella console
window.testBugSalvataggio = testBugSalvataggio;
window.testRefreshPersistence = testRefreshPersistence;

// Auto-messaggio
setTimeout(() => {
    console.log('🐛 Test bug salvataggio caricato');
    console.log('Esegui: testBugSalvataggio() per verificare il problema');
    console.log('Esegui: testRefreshPersistence() per testare persistenza');
}, 2000);
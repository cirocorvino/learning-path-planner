// debug_salvataggio.js - Script di debug per il problema di salvataggio

function addDebugLogsToSave() {
    console.log('=== ADDING DEBUG LOGS TO SAVE FUNCTIONS ===');
    
    // Override della funzione savePlan per debug
    const originalSavePlan = window.savePlan;
    window.savePlan = function() {
        console.log('🔍 DEBUG: savePlan() chiamata');
        console.log('🔍 Current plan data prima del salvataggio:', getCurrentPlanData());
        console.log('🔍 currentPlanId:', currentPlanId);
        console.log('🔍 currentPlanName:', currentPlanName);
        
        const result = originalSavePlan.apply(this, arguments);
        
        // Verifica immediata dopo il salvataggio
        const savedPlans = getSavedPlans();
        console.log('🔍 Piani salvati dopo savePlan():', savedPlans);
        console.log('🔍 Last used plan:', localStorage.getItem('last-used-plan'));
        
        return result;
    };
    
    // Override della funzione loadLastPlan per debug
    const originalLoadLastPlan = window.loadLastPlan;
    window.loadLastPlan = function() {
        console.log('🔍 DEBUG: loadLastPlan() chiamata');
        const lastPlanId = localStorage.getItem('last-used-plan');
        console.log('🔍 Last plan ID dal localStorage:', lastPlanId);
        
        const savedPlans = getSavedPlans();
        console.log('🔍 Tutti i piani salvati:', savedPlans);
        
        if (lastPlanId && savedPlans[lastPlanId]) {
            console.log('🔍 Piano da caricare:', savedPlans[lastPlanId]);
        } else {
            console.log('🔍 PROBLEMA: Piano non trovato o ID non valido');
        }
        
        const result = originalLoadLastPlan.apply(this, arguments);
        
        console.log('🔍 Dopo loadLastPlan:');
        console.log('🔍 - currentPlanId:', currentPlanId);
        console.log('🔍 - currentPlanName:', currentPlanName);
        console.log('🔍 - courses:', courses);
        
        return result;
    };
    
    // Override della funzione init per debug
    const originalInit = window.init;
    window.init = function() {
        console.log('🔍 DEBUG: init() chiamata - INIZIO');
        console.log('🔍 localStorage disponibile:', typeof(Storage) !== "undefined");
        
        const result = originalInit.apply(this, arguments);
        
        console.log('🔍 DEBUG: init() completata - FINE');
        console.log('🔍 Stato finale dopo init:');
        console.log('🔍 - courses:', courses);
        console.log('🔍 - currentPlanId:', currentPlanId);
        console.log('🔍 - currentPlanName:', currentPlanName);
        
        return result;
    };
    
    console.log('Debug logs aggiunti! Ora prova a salvare e fare refresh.');
}

function testSaveLoadCycle() {
    console.log('\n=== TEST COMPLETO SAVE/LOAD CYCLE ===');
    
    // Stato prima del salvataggio
    console.log('1. STATO PRIMA DEL SALVATAGGIO:');
    console.log('   - courses.length:', courses ? courses.length : 'undefined');
    console.log('   - currentPlanId:', currentPlanId);
    console.log('   - currentPlanName:', currentPlanName);
    
    // Forza un salvataggio manuale
    if (typeof getCurrentPlanData === 'function') {
        const currentData = getCurrentPlanData();
        console.log('2. DATI CORRENTI DA SALVARE:', currentData);
        
        const testPlanId = 'debug-test-' + Date.now();
        if (typeof savePlanToStorage === 'function') {
            savePlanToStorage(testPlanId, currentData);
            console.log('3. SALVATAGGIO FORZATO COMPLETATO con ID:', testPlanId);
            
            // Verifica immediata
            const savedPlans = getSavedPlans();
            console.log('4. VERIFICA IMMEDIATA - piano salvato:', 
                       savedPlans[testPlanId] ? 'OK' : 'FALLITO');
            
            // Simula refresh caricando il piano
            console.log('5. SIMULAZIONE CARICAMENTO:');
            if (savedPlans[testPlanId]) {
                loadPlanFromData(savedPlans[testPlanId]);
                console.log('   - Piano ricaricato con successo');
                console.log('   - courses dopo reload:', courses);
            }
        }
    }
}

// Funzione per controllare lo stato localStorage
function checkLocalStorageState() {
    console.log('\n=== STATO LOCALSTORAGE ===');
    
    // Controlla se localStorage funziona
    try {
        localStorage.setItem('test-item', 'test-value');
        const testValue = localStorage.getItem('test-item');
        localStorage.removeItem('test-item');
        console.log('localStorage funzionante:', testValue === 'test-value');
    } catch (error) {
        console.error('ERRORE localStorage:', error);
        return;
    }
    
    // Controlla i dati salvati
    const savedPlansRaw = localStorage.getItem('saved-study-plans');
    console.log('Dati raw saved-study-plans:', savedPlansRaw);
    
    const lastPlan = localStorage.getItem('last-used-plan');
    console.log('Last used plan:', lastPlan);
    
    if (savedPlansRaw) {
        try {
            const savedPlans = JSON.parse(savedPlansRaw);
            console.log('Piani parsati:', savedPlans);
            console.log('Numero di piani:', Object.keys(savedPlans).length);
        } catch (error) {
            console.error('Errore parsing piani salvati:', error);
        }
    }
}

// Esegui automaticamente i controlli
window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('\n🔧 DEBUG SCRIPT CARICATO');
        addDebugLogsToSave();
        checkLocalStorageState();
    }, 1000);
});

// Rendi disponibili le funzioni
window.addDebugLogsToSave = addDebugLogsToSave;
window.testSaveLoadCycle = testSaveLoadCycle;
window.checkLocalStorageState = checkLocalStorageState;
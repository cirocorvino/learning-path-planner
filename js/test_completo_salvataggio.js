// test_completo_salvataggio.js - Test completo per debug del salvataggio

function runCompleteSaveTest() {
    console.log('\n🔧 === TEST COMPLETO SALVATAGGIO ===');
    
    // Test 1: Verifica stato iniziale
    console.log('\n📋 STEP 1: Stato iniziale dell\'applicazione');
    console.log('  courses:', courses);
    console.log('  courses con ore > 0:', courses ? courses.filter(c => c.hours > 0).length : 0);
    console.log('  currentPlanId:', currentPlanId);
    console.log('  currentPlanName:', currentPlanName);
    console.log('  weeklyHours:', weeklyHours);
    console.log('  globalStartDate:', globalStartDate);
    
    // Test 2: Verifica funzione di inizializzazione
    console.log('\n⚙️ STEP 2: Verifica inizializzazione ore');
    if (typeof initializeCourseHours === 'function') {
        console.log('  initializeCourseHours disponibile: OK');
        try {
            initializeCourseHours();
            console.log('  Ore dopo inizializzazione:', courses.map(c => ({name: c.name, hours: c.hours})));
        } catch (error) {
            console.error('  ERRORE durante inizializzazione:', error);
        }
    } else {
        console.log('  ❌ initializeCourseHours NON disponibile');
    }
    
    // Test 3: Verifica getCurrentPlanData
    console.log('\n📊 STEP 3: Test getCurrentPlanData');
    if (typeof getCurrentPlanData === 'function') {
        try {
            const planData = getCurrentPlanData();
            console.log('  Piano dati ottenuti:', planData);
            console.log('  Numero corsi nel piano:', planData.courses ? planData.courses.length : 0);
            console.log('  Ore totali nel piano:', planData.courses ? planData.courses.reduce((sum, c) => sum + c.hours, 0) : 0);
        } catch (error) {
            console.error('  ❌ ERRORE getCurrentPlanData:', error);
        }
    } else {
        console.log('  ❌ getCurrentPlanData NON disponibile');
    }
    
    // Test 4: Test salvataggio simulato
    console.log('\n💾 STEP 4: Test salvataggio simulato');
    const testPlanData = {
        courses: courses,
        weeklySchedules: weeklySchedules,
        courseTopics: courseTopics,
        weeklyHours: weeklyHours,
        globalStartDate: globalStartDate,
        metadata: {
            id: 'test-' + Date.now(),
            name: 'Test Completo Salvataggio',
            description: 'Test per debug',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        }
    };
    
    console.log('  Dati da salvare:', testPlanData);
    
    // Test salvataggio effettivo
    try {
        if (typeof savePlanToStorage === 'function') {
            savePlanToStorage(testPlanData.metadata.id, testPlanData);
            console.log('  ✅ Salvataggio completato');
            
            // Verifica immediata
            const savedPlans = getSavedPlans();
            const savedPlan = savedPlans[testPlanData.metadata.id];
            console.log('  Verifica piano salvato:', savedPlan ? 'OK' : 'FALLITO');
            if (savedPlan) {
                console.log('  Corsi nel piano salvato:', savedPlan.courses ? savedPlan.courses.length : 0);
            }
        }
    } catch (error) {
        console.error('  ❌ ERRORE salvataggio:', error);
    }
    
    // Test 5: Test caricamento
    console.log('\n📁 STEP 5: Test caricamento piano');
    try {
        if (typeof loadPlanFromData === 'function') {
            // Salva stato corrente
            const originalCourses = [...courses];
            const originalCurrentPlanId = currentPlanId;
            const originalCurrentPlanName = currentPlanName;
            
            // Carica il piano appena salvato
            loadPlanFromData(testPlanData);
            console.log('  ✅ Caricamento completato');
            console.log('  currentPlanId dopo caricamento:', currentPlanId);
            console.log('  currentPlanName dopo caricamento:', currentPlanName);
            console.log('  courses dopo caricamento:', courses.length, 'corsi');
            
            // Ripristina stato originale
            courses = originalCourses;
            currentPlanId = originalCurrentPlanId;
            currentPlanName = originalCurrentPlanName;
        }
    } catch (error) {
        console.error('  ❌ ERRORE caricamento:', error);
    }
    
    // Test 6: Test localStorage diretto
    console.log('\n🗄️ STEP 6: Test localStorage diretto');
    try {
        const testKey = 'test-direct-save';
        const testData = { test: 'valore', timestamp: Date.now() };
        
        localStorage.setItem(testKey, JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        
        console.log('  localStorage funziona:', JSON.stringify(retrieved) === JSON.stringify(testData));
        localStorage.removeItem(testKey);
    } catch (error) {
        console.error('  ❌ ERRORE localStorage:', error);
    }
    
    // Test 7: Controllo modal
    console.log('\n🪟 STEP 7: Test modal salvataggio');
    const planNameField = document.getElementById('planName');
    const planDescField = document.getElementById('planDescription');
    
    console.log('  Campo nome piano esistente:', planNameField !== null);
    console.log('  Campo descrizione esistente:', planDescField !== null);
    
    if (planNameField) {
        console.log('  Valore attuale campo nome:', planNameField.value);
    }
    
    // Test finale
    console.log('\n🎯 CONCLUSIONI:');
    console.log('==================');
    
    const problemi = [];
    
    if (!courses || courses.length === 0) {
        problemi.push('❌ Array courses vuoto o undefined');
    } else if (courses.every(c => c.hours === 0)) {
        problemi.push('⚠️ Tutti i corsi hanno 0 ore - problema inizializzazione');
    }
    
    if (!currentPlanName || currentPlanName === 'Piano Predefinito') {
        problemi.push('⚠️ Nome piano predefinito - potrebbe non essere impostato');
    }
    
    if (typeof getCurrentPlanData !== 'function') {
        problemi.push('❌ Funzione getCurrentPlanData non disponibile');
    }
    
    if (typeof savePlanToStorage !== 'function') {
        problemi.push('❌ Funzione savePlanToStorage non disponibile');
    }
    
    if (typeof loadLastPlan !== 'function') {
        problemi.push('❌ Funzione loadLastPlan non disponibile');
    }
    
    if (problemi.length === 0) {
        console.log('✅ Tutti i componenti sembrano funzionanti');
        console.log('🔍 Il problema potrebbe essere nel flusso di inizializzazione o timing');
    } else {
        console.log('Problemi rilevati:');
        problemi.forEach(p => console.log('  ' + p));
    }
    
    console.log('\n📝 SUGGERIMENTI:');
    console.log('1. Verifica che initializeCourseHours() venga chiamata correttamente all\'avvio');
    console.log('2. Controlla che init() venga chiamata dopo il caricamento di tutti i script');
    console.log('3. Verifica i log della console del browser durante salvataggio e refresh');
    console.log('4. Controlla se ci sono errori JavaScript che interrompono l\'esecuzione');
}

// Funzione per testare il flusso completo save/refresh/load
function testSaveRefreshFlow() {
    console.log('\n🔄 === TEST FLUSSO SAVE/REFRESH/LOAD ===');
    
    // Forza inizializzazione se necessario
    if (typeof initializeCourseHours === 'function') {
        initializeCourseHours();
    }
    
    // Crea dati di test realistici
    const testPlanData = {
        courses: courses.map(c => ({...c, hours: c.hours || 50})), // Assicura ore > 0
        weeklySchedules: weeklySchedules,
        courseTopics: courseTopics,
        weeklyHours: weeklyHours,
        globalStartDate: globalStartDate,
        metadata: {
            id: 'flow-test-' + Date.now(),
            name: 'Test Flow Save/Refresh',
            description: 'Test del flusso completo',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        }
    };
    
    console.log('1. Salvando piano di test...');
    savePlanToStorage(testPlanData.metadata.id, testPlanData);
    
    console.log('2. Piano salvato. Ora simula refresh...');
    
    // Simula reset dello stato come dopo un refresh
    currentPlanId = null;
    currentPlanName = 'Piano Predefinito';
    courses.forEach(c => c.hours = 0);
    
    console.log('3. Stato dopo "refresh" simulato:', {
        currentPlanId,
        currentPlanName,
        totalHours: courses.reduce((sum, c) => sum + c.hours, 0)
    });
    
    console.log('4. Chiamando loadLastPlan()...');
    loadLastPlan();
    
    console.log('5. Stato dopo loadLastPlan():', {
        currentPlanId,
        currentPlanName,
        totalHours: courses.reduce((sum, c) => sum + c.hours, 0)
    });
    
    // Verifica
    const success = currentPlanId === testPlanData.metadata.id && 
                   currentPlanName === testPlanData.metadata.name &&
                   courses.some(c => c.hours > 0);
    
    console.log('✅ Test completato:', success ? 'SUCCESSO' : 'FALLIMENTO');
    
    return success;
}

// Esporta le funzioni per uso nella console
window.runCompleteSaveTest = runCompleteSaveTest;
window.testSaveRefreshFlow = testSaveRefreshFlow;

// Esegui automaticamente quando la pagina è carica
window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('\n🚀 DEBUG COMPLETO CARICATO');
        console.log('Esegui: runCompleteSaveTest() per il test completo');
        console.log('Esegui: testSaveRefreshFlow() per testare il flusso save/refresh');
    }, 1500);
});
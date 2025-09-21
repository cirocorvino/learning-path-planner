// test_localStorage.js - Test per verificare il salvataggio localStorage

function testLocalStorageSave() {
    console.log('=== TEST LOCALSTORAGE SALVATAGGIO ===');
    
    // Test 1: Verifica se localStorage è disponibile
    console.log('1. localStorage disponibile:', typeof(Storage) !== "undefined");
    
    // Test 2: Salva dati di test
    const testData = {
        test: 'Dati di prova',
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('test-data', JSON.stringify(testData));
        console.log('2. Salvataggio test OK');
    } catch (error) {
        console.error('2. ERRORE salvataggio:', error);
        return;
    }
    
    // Test 3: Ricarica dati
    try {
        const loadedData = JSON.parse(localStorage.getItem('test-data'));
        console.log('3. Caricamento test:', loadedData);
        console.log('3. Dati corrispondenti:', JSON.stringify(loadedData) === JSON.stringify(testData));
    } catch (error) {
        console.error('3. ERRORE caricamento:', error);
    }
    
    // Test 4: Verifica piani salvati esistenti
    const savedPlans = localStorage.getItem('saved-study-plans');
    console.log('4. Piani salvati presenti:', savedPlans !== null);
    if (savedPlans) {
        try {
            const plans = JSON.parse(savedPlans);
            console.log('4. Numero piani salvati:', Object.keys(plans).length);
            console.log('4. ID piani:', Object.keys(plans));
        } catch (error) {
            console.error('4. ERRORE parsing piani salvati:', error);
        }
    }
    
    // Test 5: Verifica ultimo piano utilizzato
    const lastPlan = localStorage.getItem('last-used-plan');
    console.log('5. Ultimo piano ID:', lastPlan);
    
    // Test 6: Simula salvataggio di un piano
    console.log('\n=== SIMULAZIONE SALVATAGGIO PIANO ===');
    
    const mockPlanData = {
        courses: [
            { id: 1, name: 'Test Course', hours: 50, color: '#FF6B6B' }
        ],
        weeklySchedules: {},
        courseTopics: {},
        weeklyHours: 15,
        globalStartDate: '2025-09-21',
        metadata: {
            id: 'test-plan-123',
            name: 'Piano di Test',
            description: 'Test per debug',
            createdAt: new Date().toISOString()
        }
    };
    
    try {
        // Simula la logica di savePlanToStorage
        const savedPlans = JSON.parse(localStorage.getItem('saved-study-plans') || '{}');
        savedPlans['test-plan-123'] = mockPlanData;
        localStorage.setItem('saved-study-plans', JSON.stringify(savedPlans));
        localStorage.setItem('last-used-plan', 'test-plan-123');
        
        console.log('6. Piano test salvato con successo');
        
        // Verifica immediata
        const verificaSalvataggio = JSON.parse(localStorage.getItem('saved-study-plans'));
        console.log('6. Verifica: piano presente dopo salvataggio:', 
                   verificaSalvataggio['test-plan-123'] !== undefined);
        
    } catch (error) {
        console.error('6. ERRORE simulazione salvataggio:', error);
    }
    
    console.log('\n=== CLEANUP TEST ===');
    localStorage.removeItem('test-data');
    console.log('Test completato');
}

function debugCurrentSave() {
    console.log('\n=== DEBUG SALVATAGGIO CORRENTE ===');
    
    // Controlla se le funzioni esistono
    console.log('getSavedPlans exists:', typeof getSavedPlans === 'function');
    console.log('getCurrentPlanData exists:', typeof getCurrentPlanData === 'function');
    console.log('savePlanToStorage exists:', typeof savePlanToStorage === 'function');
    
    if (typeof getCurrentPlanData === 'function') {
        try {
            const currentData = getCurrentPlanData();
            console.log('Dati piano corrente:', currentData);
        } catch (error) {
            console.error('Errore get current data:', error);
        }
    }
    
    if (typeof getSavedPlans === 'function') {
        try {
            const saved = getSavedPlans();
            console.log('Piani attualmente salvati:', saved);
        } catch (error) {
            console.error('Errore get saved plans:', error);
        }
    }
}

// Esegui i test
testLocalStorageSave();

// Rendi disponibili le funzioni nella console del browser
window.testLocalStorageSave = testLocalStorageSave;
window.debugCurrentSave = debugCurrentSave;
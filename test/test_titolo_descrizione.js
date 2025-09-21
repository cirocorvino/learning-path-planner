// test_titolo_descrizione.js - Test per verificare il salvataggio del titolo e descrizione

function testTitleDescriptionDisplay() {
    console.log('🧪 === TEST TITOLO E DESCRIZIONE ===');
    
    // Test 1: Stato iniziale
    console.log('\n📋 STEP 1: Stato iniziale');
    console.log('  currentPlanName:', currentPlanName);
    console.log('  currentPlanDescription:', currentPlanDescription);
    console.log('  App title element:', document.getElementById('appTitle').textContent);
    console.log('  App description element:', document.getElementById('appDescription').textContent);
    
    // Test 2: Simula salvataggio con titolo e descrizione personalizzati
    console.log('\n💾 STEP 2: Test salvataggio personalizzato');
    
    // Simula valori del form
    const mockTitle = 'Test Piano Personalizzato';
    const mockDescription = 'Questo è un piano di test per verificare il salvataggio';
    
    // Simula il processo di salvataggio
    currentPlanName = mockTitle;
    currentPlanDescription = mockDescription;
    updateCurrentPlanDisplay();
    
    console.log('  Dopo aggiornamento:');
    console.log('  - App title:', document.getElementById('appTitle').textContent);
    console.log('  - App description:', document.getElementById('appDescription').textContent);
    
    // Test 3: Test reset al piano predefinito
    console.log('\n🔄 STEP 3: Test reset piano predefinito');
    
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = '';
    updateCurrentPlanDisplay();
    
    console.log('  Dopo reset:');
    console.log('  - App title:', document.getElementById('appTitle').textContent);
    console.log('  - App description:', document.getElementById('appDescription').textContent);
    
    // Test 4: Test con piano vuoto
    console.log('\n📝 STEP 4: Test piano personalizzato senza descrizione');
    
    currentPlanName = 'Piano Senza Descrizione';
    currentPlanDescription = '';
    updateCurrentPlanDisplay();
    
    console.log('  Con descrizione vuota:');
    console.log('  - App title:', document.getElementById('appTitle').textContent);
    console.log('  - App description:', document.getElementById('appDescription').textContent);
    
    // Ripristina stato originale
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = 'Percorso completo di certificazione professionale';
    updateCurrentPlanDisplay();
    
    console.log('\n✅ Test completato - stato originale ripristinato');
}

function testSaveFormIntegration() {
    console.log('\n🔗 === TEST INTEGRAZIONE FORM SALVATAGGIO ===');
    
    // Simula apertura modal con dati esistenti
    const planNameField = document.getElementById('planName');
    const planDescField = document.getElementById('planDescription');
    
    if (planNameField && planDescField) {
        // Simula showSaveModal()
        planNameField.value = currentPlanName || '';
        planDescField.value = currentPlanDescription || '';
        
        console.log('Modal form popolato:');
        console.log('  Nome campo:', planNameField.value);
        console.log('  Descrizione campo:', planDescField.value);
        
        // Simula modifica dei valori
        planNameField.value = 'Nuovo Piano Test';
        planDescField.value = 'Descrizione di test modificata';
        
        console.log('Valori modificati nel form:');
        console.log('  Nome:', planNameField.value);
        console.log('  Descrizione:', planDescField.value);
        
        // Reset form
        planNameField.value = '';
        planDescField.value = '';
        
        console.log('✅ Test integrazione form completato');
    } else {
        console.log('❌ Form elements non trovati');
    }
}

// Funzione per testare il flusso completo
function testCompleteFlow() {
    console.log('\n🎯 === TEST FLUSSO COMPLETO ===');
    
    const testData = {
        name: 'Piano Test Completo',
        description: 'Test del flusso completo di salvataggio e caricamento'
    };
    
    // Step 1: Simula salvataggio
    console.log('1. Simulando salvataggio...');
    currentPlanName = testData.name;
    currentPlanDescription = testData.description;
    updateCurrentPlanDisplay();
    
    // Verifica aggiornamento UI
    const titleUpdated = document.getElementById('appTitle').textContent.includes(testData.name);
    const descUpdated = document.getElementById('appDescription').textContent === testData.description;
    
    console.log('  Titolo aggiornato:', titleUpdated);
    console.log('  Descrizione aggiornata:', descUpdated);
    
    // Step 2: Simula caricamento piano
    console.log('2. Simulando caricamento piano...');
    const mockPlanData = {
        metadata: {
            name: 'Piano Caricato Test',
            description: 'Descrizione piano caricato'
        },
        courses: courses,
        weeklySchedules: {},
        courseTopics: {},
        weeklyHours: 15,
        globalStartDate: '2025-09-08'
    };
    
    // Simula loadPlan logic
    currentPlanName = mockPlanData.metadata.name;
    currentPlanDescription = mockPlanData.metadata.description;
    updateCurrentPlanDisplay();
    
    console.log('  Nuovo nome caricato:', currentPlanName);
    console.log('  Nuova descrizione caricata:', currentPlanDescription);
    console.log('  UI aggiornata:', document.getElementById('appTitle').textContent);
    
    // Reset
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = 'Percorso completo di certificazione professionale';
    updateCurrentPlanDisplay();
    
    console.log('✅ Test flusso completo terminato');
}

// Esporta funzioni per uso nella console
window.testTitleDescriptionDisplay = testTitleDescriptionDisplay;
window.testSaveFormIntegration = testSaveFormIntegration;
window.testCompleteFlow = testCompleteFlow;

// Auto-esecuzione
window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('🔧 Test titolo/descrizione caricato');
        console.log('Esegui: testTitleDescriptionDisplay() per testare la visualizzazione');
        console.log('Esegui: testCompleteFlow() per testare il flusso completo');
    }, 2000);
});
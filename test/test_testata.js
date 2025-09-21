// test_testata.js - Test specifico per la testata

function testTestata() {
    console.log('🎯 === TEST TESTATA PRINCIPALE ===');
    
    // Verifica elementi esistenti
    const appTitle = document.getElementById('appTitle');
    const appDescription = document.getElementById('appDescription');
    
    console.log('Elementi testata:');
    console.log('  appTitle exists:', appTitle !== null);
    console.log('  appDescription exists:', appDescription !== null);
    
    if (appTitle) {
        console.log('  appTitle current text:', `"${appTitle.textContent}"`);
        console.log('  appTitle classList:', appTitle.classList.toString());
    }
    
    if (appDescription) {
        console.log('  appDescription current text:', `"${appDescription.textContent}"`);
        console.log('  appDescription classList:', appDescription.classList.toString());
    }
    
    // Verifica variabili globali
    console.log('\nVariabili globali:');
    console.log('  currentPlanName:', `"${currentPlanName}"`);
    console.log('  currentPlanDescription:', `"${currentPlanDescription}"`);
    
    // Test manuale updateCurrentPlanDisplay
    console.log('\nTest manuale updateCurrentPlanDisplay:');
    
    // Imposta valori di test
    const testName = 'Piano Test Testata';
    const testDesc = 'Descrizione test testata';
    
    currentPlanName = testName;
    currentPlanDescription = testDesc;
    
    console.log('  Dopo impostazione variabili:');
    console.log('    currentPlanName:', `"${currentPlanName}"`);
    console.log('    currentPlanDescription:', `"${currentPlanDescription}"`);
    
    // Chiama updateCurrentPlanDisplay
    console.log('  Chiamando updateCurrentPlanDisplay()...');
    updateCurrentPlanDisplay();
    
    // Verifica risultato
    console.log('  Dopo updateCurrentPlanDisplay():');
    if (appTitle) {
        console.log('    appTitle text:', `"${appTitle.textContent}"`);
        console.log('    appTitle classList:', appTitle.classList.toString());
    }
    if (appDescription) {
        console.log('    appDescription text:', `"${appDescription.textContent}"`);
        console.log('    appDescription classList:', appDescription.classList.toString());
    }
    
    // Verifica se il cambio è avvenuto
    const titleChanged = appTitle && appTitle.textContent.includes(testName);
    const descChanged = appDescription && appDescription.textContent === testDesc;
    
    console.log('\nRisultati:');
    console.log('  Titolo cambiato:', titleChanged ? '✅' : '❌');
    console.log('  Descrizione cambiata:', descChanged ? '✅' : '❌');
    
    if (!titleChanged) {
        console.log('  ❌ PROBLEMA: Il titolo non è cambiato!');
        console.log('    Atteso che contenesse:', testName);
        console.log('    Trovato:', appTitle ? appTitle.textContent : 'null');
    }
    
    if (!descChanged) {
        console.log('  ❌ PROBLEMA: La descrizione non è cambiata!');
        console.log('    Attesa:', testDesc);
        console.log('    Trovata:', appDescription ? appDescription.textContent : 'null');
    }
    
    // Ripristina stato precedente
    currentPlanName = 'Piano Predefinito';
    currentPlanDescription = 'Percorso completo di certificazione professionale - Ore Effettive Ricalcolate';
    updateCurrentPlanDisplay();
    
    console.log('\n✅ Test testata completato');
}

function testStatoCorrente() {
    console.log('📊 === STATO CORRENTE APP ===');
    
    // Tutti gli elementi UI che dovrebbero mostrare il nome del piano
    const elements = {
        appTitle: document.getElementById('appTitle'),
        appDescription: document.getElementById('appDescription'),
        currentPlanName: document.getElementById('currentPlanName'),
        currentPlanDisplay: document.getElementById('currentPlanDisplay')
    };
    
    console.log('Elementi UI trovati:');
    Object.keys(elements).forEach(key => {
        const el = elements[key];
        console.log(`  ${key}:`, el !== null ? `"${el.textContent}"` : 'NOT FOUND');
    });
    
    console.log('\nVariabili globali:');
    console.log('  currentPlanName:', `"${currentPlanName}"`);
    console.log('  currentPlanDescription:', `"${currentPlanDescription}"`);
    console.log('  currentPlanId:', currentPlanId);
    
    // Check localStorage
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('\nLocalStorage:');
    console.log('  last-used-plan:', lastPlanId);
    
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        if (savedPlan) {
            console.log('  Piano salvato nome:', `"${savedPlan.metadata.name}"`);
            console.log('  Piano salvato desc:', `"${savedPlan.metadata.description}"`);
        }
    }
}

window.testTestata = testTestata;
window.testStatoCorrente = testStatoCorrente;

console.log('🎯 Test testata caricato');
console.log('Esegui: testTestata() per testare aggiornamento testata');
console.log('Esegui: testStatoCorrente() per vedere stato attuale');
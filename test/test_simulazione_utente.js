// test_simulazione_utente.js - Simula esattamente il comportamento utente

function simulaUtenteCompleto() {
    console.log('👤 === SIMULAZIONE UTENTE COMPLETA ===\n');
    
    // Step 1: Utente clicca "Salva Piano"
    console.log('1. 👆 Utente clicca "Salva Piano"');
    console.log('   (simulando showSaveModal())');
    showSaveModal();
    
    // Verifica che il modal sia aperto
    const modal = document.getElementById('savePlanModal');
    console.log('   Modal aperto:', modal.classList.contains('active'));
    
    // Step 2: Verifica valori precompilati nel modal
    const planNameField = document.getElementById('planName');
    const planDescField = document.getElementById('planDescription');
    
    console.log('2. 📋 Valori precompilati nel modal:');
    console.log('   Nome:', `"${planNameField.value}"`);
    console.log('   Descrizione:', `"${planDescField.value}"`);
    
    // Step 3: Utente inserisce i suoi dati
    const userInputName = 'Il Mio Piano Personalizzato';
    const userInputDesc = 'Questa è la mia descrizione personalizzata';
    
    console.log('3. ✏️ Utente inserisce dati:');
    console.log('   Nome inserito:', `"${userInputName}"`);
    console.log('   Descrizione inserita:', `"${userInputDesc}"`);
    
    planNameField.value = userInputName;
    planDescField.value = userInputDesc;
    
    // Verifica che i valori siano stati inseriti
    console.log('   Verifica valori nei campi:');
    console.log('   Campo nome contiene:', `"${planNameField.value}"`);
    console.log('   Campo descrizione contiene:', `"${planDescField.value}"`);
    
    // Step 4: Utente clicca "💾 Salva"
    console.log('4. 💾 Utente clicca "Salva"');
    console.log('   (simulando click su savePlan())');
    
    // Disabilita alert per vedere meglio i log
    const originalAlert = window.alert;
    window.alert = (msg) => console.log('   [ALERT utente vede]:', msg);
    
    // Questo dovrebbe chiamare la funzione savePlan() con i log dettagliati
    savePlan();
    
    // Ripristina alert
    window.alert = originalAlert;
    
    // Step 5: Verifica cosa vede l'utente dopo il salvataggio
    console.log('5. 👀 Cosa vede l\'utente dopo il salvataggio:');
    const appTitle = document.getElementById('appTitle').textContent;
    const appDesc = document.getElementById('appDescription').textContent;
    
    console.log('   Titolo nella testata:', `"${appTitle}"`);
    console.log('   Descrizione nella testata:', `"${appDesc}"`);
    
    // Step 6: Verifica cosa è stato effettivamente salvato
    console.log('6. 🔍 Cosa è stato salvato nel localStorage:');
    const lastPlanId = localStorage.getItem('last-used-plan');
    console.log('   ID ultimo piano:', lastPlanId);
    
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        const savedPlan = savedPlans[lastPlanId];
        
        if (savedPlan && savedPlan.metadata) {
            console.log('   Nome salvato:', `"${savedPlan.metadata.name}"`);
            console.log('   Descrizione salvata:', `"${savedPlan.metadata.description}"`);
            
            // Confronto con input utente
            const nomeCorretto = savedPlan.metadata.name === userInputName;
            const descCorretta = savedPlan.metadata.description === userInputDesc;
            
            console.log('7. ✅ Risultati confronto:');
            console.log('   Nome salvato correttamente:', nomeCorretto ? 'SÌ ✅' : 'NO ❌');
            console.log('   Descrizione salvata correttamente:', descCorretta ? 'SÌ ✅' : 'NO ❌');
            
            if (!nomeCorretto) {
                console.log('   ❌ PROBLEMA NOME:');
                console.log('      Atteso:', `"${userInputName}"`);
                console.log('      Salvato:', `"${savedPlan.metadata.name}"`);
            }
            
            if (!descCorretta) {
                console.log('   ❌ PROBLEMA DESCRIZIONE:');
                console.log('      Attesa:', `"${userInputDesc}"`);
                console.log('      Salvata:', `"${savedPlan.metadata.description}"`);
            }
            
            if (nomeCorretto && descCorretta) {
                console.log('   🎉 TUTTO PERFETTO! Il salvataggio funziona correttamente.');
            } else {
                console.log('   🐛 C\'È ANCORA UN BUG nel salvataggio.');
            }
        } else {
            console.log('   ❌ ERRORE: Piano salvato non ha metadata!');
        }
    } else {
        console.log('   ❌ ERRORE: Nessun piano è stato salvato!');
    }
    
    console.log('\n👤 === FINE SIMULAZIONE UTENTE ===');
}

function testUIDisplay() {
    console.log('\n🖥️ === TEST DISPLAY UI ===');
    
    // Test diretto delle variabili globali
    console.log('Variabili globali correnti:');
    console.log('  currentPlanName:', `"${currentPlanName}"`);
    console.log('  currentPlanDescription:', `"${currentPlanDescription}"`);
    
    // Test updateCurrentPlanDisplay
    console.log('Chiamando updateCurrentPlanDisplay()...');
    updateCurrentPlanDisplay();
    
    console.log('Elementi UI dopo aggiornamento:');
    console.log('  appTitle:', `"${document.getElementById('appTitle').textContent}"`);
    console.log('  appDescription:', `"${document.getElementById('appDescription').textContent}"`);
    console.log('  currentPlanName element:', `"${document.getElementById('currentPlanName').textContent}"`);
    console.log('  currentPlanDisplay element:', `"${document.getElementById('currentPlanDisplay').textContent}"`);
}

// Esporta funzioni
window.simulaUtenteCompleto = simulaUtenteCompleto;
window.testUIDisplay = testUIDisplay;

// Auto-messaggio
setTimeout(() => {
    console.log('\n👤 Simulazione utente caricata');
    console.log('🧪 Esegui: simulaUtenteCompleto() per simulare tutto il processo');
    console.log('🖥️ Esegui: testUIDisplay() per testare solo l\'aggiornamento UI');
}, 3000);
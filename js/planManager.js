// planManager.js - Gestione dei piani di studio (salvataggio, caricamento, esportazione)

// Genera ID univoco per un piano
function generatePlanId() {
    return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Ottieni tutti i piani salvati
function getSavedPlans() {
    const savedPlans = localStorage.getItem('saved-study-plans');
    return savedPlans ? JSON.parse(savedPlans) : {};
}

// Salva piano nel localStorage
function savePlanToStorage(planId, planData) {
    const savedPlans = getSavedPlans();
    savedPlans[planId] = planData;
    localStorage.setItem('saved-study-plans', JSON.stringify(savedPlans));
    localStorage.setItem('last-used-plan', planId);
}

// Carica l'ultimo piano utilizzato
function loadLastPlan() {
    const lastPlanId = localStorage.getItem('last-used-plan');
    if (lastPlanId) {
        const savedPlans = getSavedPlans();
        if (savedPlans[lastPlanId]) {
            Logger.load('Caricando piano salvato:', lastPlanId);
            loadPlanFromData(savedPlans[lastPlanId]);
            currentPlanId = lastPlanId;
            currentPlanName = savedPlans[lastPlanId].metadata.name;
            currentPlanDescription = savedPlans[lastPlanId].metadata.description || '';
            
            // Controlla se il piano ha metadata della testata personalizzata
            const hasHeaderData = savedPlans[lastPlanId].metadata.headerTitle || savedPlans[lastPlanId].metadata.headerDescription;
            Logger.load('Piano ha dati testata personalizzata:', hasHeaderData);
            
            if (hasHeaderData) {
                // Usa i dati della testata salvati
                currentPlanName = savedPlans[lastPlanId].metadata.headerTitle || currentPlanName;
                currentPlanDescription = savedPlans[lastPlanId].metadata.headerDescription || currentPlanDescription;
                updateCurrentPlanDisplay(); // Aggiorna tutto compresa la testata
            } else {
                // Solo aggiorna i display secondari, non la testata
                updateCurrentPlanDisplay(true); // skipHeaderUpdate = true
            }
            
            return true; // Piano caricato con successo
        }
    }
    Logger.load('Nessun piano salvato trovato, usando configurazione predefinita');
    return false; // Nessun piano caricato
    
    // Se non c'è un piano salvato, NON chiamare recalculateDates qui
    // perché le ore non sono ancora state calcolate
    // recalculateDates(); // RIMUOVI questa linea
}

// Carica dati del piano
function loadPlanFromData(planData) {
    Logger.load('Caricando dati piano:', {
        corsesCount: planData.courses ? planData.courses.length : 0,
        totalHours: planData.courses ? planData.courses.reduce((sum, c) => sum + c.hours, 0) : 0,
        weeklyHours: planData.weeklyHours,
        startDate: planData.globalStartDate,
        hasCalculationParams: !!planData.calculationParams
    });
    
    courses = planData.courses || courses;
    weeklySchedules = planData.weeklySchedules || {};
    courseTopics = planData.courseTopics || {};
    weeklyHours = planData.weeklyHours || 15;
    globalStartDate = planData.globalStartDate || '2025-09-08';
    
    // IMPORTANTE: Carica anche i parametri di calcolo
    if (planData.calculationParams) {
        Object.assign(calculationParams, planData.calculationParams);
        Logger.calc('Parametri di calcolo caricati:', calculationParams);
        updateCalculationDisplay(); // Aggiorna la visualizzazione
    }
    
    document.getElementById('weeklyHours').value = weeklyHours;
    document.getElementById('startDate').value = globalStartDate;
    
    updateStats();
    renderGantt();
    
    Logger.load('Dati piano caricati con successo');
}

// Ottieni dati del piano corrente
function getCurrentPlanData() {
    Logger.debug('getCurrentPlanData() chiamata con:', {
        currentPlanName,
        currentPlanDescription,
        currentPlanId
    });
    
    const result = {
        courses: courses,
        weeklySchedules: weeklySchedules,
        courseTopics: courseTopics,
        weeklyHours: weeklyHours,
        globalStartDate: globalStartDate,
        calculationParams: calculationParams, // IMPORTANTE: Includi parametri di calcolo
        metadata: {
            id: currentPlanId,
            name: currentPlanName,
            description: currentPlanDescription || '',
            createdAt: currentPlanId ? getSavedPlans()[currentPlanId]?.metadata?.createdAt : new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        }
    };
    
    Logger.debug('getCurrentPlanData() restituisce metadata:', result.metadata);
    
    return result;
}

// Aggiorna visualizzazione del piano corrente
function updateCurrentPlanDisplay(skipHeaderUpdate = false) {
    Logger.ui('updateCurrentPlanDisplay chiamata, skipHeaderUpdate:', skipHeaderUpdate);
    
    // Aggiorna il nome nei vari elementi della UI (sempre)
    document.getElementById('currentPlanName').textContent = `📋 ${currentPlanName}`;
    document.getElementById('currentPlanDisplay').textContent = currentPlanName;
    
    // Aggiorna la testata principale dell'app SOLO se richiesto
    if (!skipHeaderUpdate) {
        Logger.ui('  Aggiornando testata con:', currentPlanName, currentPlanDescription);
        const appTitle = document.getElementById('appTitle');
        const appDescription = document.getElementById('appDescription');
        
        // IMPORTANTE: Non aggiornare se gli elementi contengono input (modalità modifica attiva)
        const titleHasInput = appTitle && appTitle.querySelector('input');
        const descHasInput = appDescription && appDescription.querySelector('input');
        
        if (titleHasInput || descHasInput) {
            Logger.ui('  ⚠️ Modalità modifica attiva, salto aggiornamento testata');
            return;
        }
        
        if (currentPlanName !== 'Piano Predefinito') {
            // Aggiungi emoji solo se non c'è già
            const displayTitle = currentPlanName.startsWith('📊') ? currentPlanName : `📊 ${currentPlanName}`;
            appTitle.textContent = displayTitle;
            appDescription.textContent = currentPlanDescription || 'Piano di studio personalizzato';
            
            // Applica stili per piano personalizzato
            appTitle.classList.add('custom-plan');
            appDescription.classList.add('custom-plan');
        } else {
            appTitle.textContent = '📊 Piano di Studio AI Development';
            appDescription.textContent = 'Percorso completo di certificazione professionale - Ore Effettive Ricalcolate';
            
            // Rimuovi stili personalizzati
            appTitle.classList.remove('custom-plan');
            appDescription.classList.remove('custom-plan');
        }
    } else {
        Logger.ui('  Salto aggiornamento testata (skipHeaderUpdate=true)');
    }
}

// Salva piano
function savePlan() {
    Logger.save('=== INIZIO SAVEPLAN() ===');
    
    // Leggi valori dal form
    const planNameElement = document.getElementById('planName');
    const planDescElement = document.getElementById('planDescription');
    
    Logger.save('Elementi form trovati:', {
        planNameElement: planNameElement !== null,
        planDescElement: planDescElement !== null
    });
    
    if (!planNameElement || !planDescElement) {
        Logger.error('ERRORE: Elementi form non trovati!');
        alert('Errore: elementi del form non trovati');
        return;
    }
    
    const name = planNameElement.value.trim();
    const description = planDescElement.value.trim();
    
    Logger.save('Valori letti dal form:', {
        name: name,
        description: description,
        nameLength: name.length,
        descLength: description.length
    });

    if (!name) {
        Logger.error('Validazione fallita: nome vuoto');
        alert('Inserisci un nome per il piano di studio');
        return;
    }

    Logger.save('Dati dal form VALIDATI:', { name, description });
    
    // PRIMA aggiorna le variabili globali
    Logger.debug('Aggiornamento variabili globali...');
    Logger.debug('  PRIMA - currentPlanName:', currentPlanName);
    Logger.debug('  PRIMA - currentPlanDescription:', currentPlanDescription);
    Logger.debug('  PRIMA - currentPlanId:', currentPlanId);
    
    const planId = currentPlanId || generatePlanId();
    currentPlanId = planId;
    currentPlanName = name;
    currentPlanDescription = description;
    
    Logger.debug('  DOPO - currentPlanName:', currentPlanName);
    Logger.debug('  DOPO - currentPlanDescription:', currentPlanDescription);
    Logger.debug('  DOPO - currentPlanId:', currentPlanId);
    
    // POI ottieni i dati del piano (che ora hanno i valori corretti)
    Logger.debug('Chiamando getCurrentPlanData()...');
    const planData = getCurrentPlanData();
    
    Logger.debug('PlanData ottenuto:', {
        hasMetadata: planData.metadata !== undefined,
        metadataName: planData.metadata ? planData.metadata.name : 'undefined',
        metadataDescription: planData.metadata ? planData.metadata.description : 'undefined',
        metadataId: planData.metadata ? planData.metadata.id : 'undefined'
    });
    
    // Assicurati che i metadata siano corretti (doppia verifica)
    planData.metadata.name = name;
    planData.metadata.description = description;
    planData.metadata.id = planId;
    
    // IMPORTANTE: Salva anche i valori correnti della testata
    const currentTitleElement = document.getElementById('appTitle');
    const currentDescElement = document.getElementById('appDescription');
    if (currentTitleElement && currentDescElement) {
        planData.metadata.headerTitle = currentTitleElement.textContent;
        planData.metadata.headerDescription = currentDescElement.textContent;
        Logger.save('Salvando metadata testata:', {
            headerTitle: planData.metadata.headerTitle,
            headerDescription: planData.metadata.headerDescription
        });
    }
    
    if (!planId.includes('_')) { // Nuovo piano
        planData.metadata.createdAt = new Date().toISOString();
    } else {
        // Piano esistente - mantieni la data di creazione originale
        const savedPlans = getSavedPlans();
        const existingPlan = savedPlans[planId];
        if (existingPlan) {
            planData.metadata.createdAt = existingPlan.metadata.createdAt;
        }
    }
    planData.metadata.modifiedAt = new Date().toISOString();

    Logger.save('Dati finali da salvare:', {
        id: planId,
        name: planData.metadata.name,
        description: planData.metadata.description,
        corsesCount: planData.courses ? planData.courses.length : 0,
        totalHours: planData.courses ? planData.courses.reduce((sum, c) => sum + c.hours, 0) : 0
    });
    
    // Salva nel localStorage
    Logger.save('Salvando in localStorage...');
    savePlanToStorage(planId, planData);
    
    // Verifica immediata
    Logger.save('Verifica immediata localStorage...');
    const savedPlans = getSavedPlans();
    const justSaved = savedPlans[planId];
    if (justSaved) {
        Logger.save('Piano appena salvato:', {
            name: justSaved.metadata.name,
            description: justSaved.metadata.description,
            id: justSaved.metadata.id
        });
    } else {
        Logger.error('ERRORE: Piano non trovato dopo salvataggio!');
    }
    
    // Aggiorna UI (ma NON la testata, per preservare modifiche utente)
    Logger.ui('Aggiornando UI...');
    updateCurrentPlanDisplay(true); // skipHeaderUpdate = true
    closeSaveModal();
    
    Logger.save('Piano salvato con successo!');
    Logger.save('=== FINE SAVEPPLAN() ===\n');
    alert('Piano di studio salvato con successo!');
}

// Esporta piano in file JSON
function exportPlan() {
    const name = document.getElementById('planName').value.trim() || currentPlanName;
    const description = document.getElementById('planDescription').value.trim();
    
    const planData = getCurrentPlanData();
    planData.metadata.name = name;
    planData.metadata.description = description;
    planData.metadata.exportDate = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-studio-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    closeSaveModal();
}

// Carica piano specifico
function loadPlan(planId) {
    const savedPlans = getSavedPlans();
    const planData = savedPlans[planId];
    
    if (planData) {
        loadPlanFromData(planData);
        currentPlanId = planId;
        currentPlanName = planData.metadata.name;
        currentPlanDescription = planData.metadata.description || '';
        localStorage.setItem('last-used-plan', planId);
        updateCurrentPlanDisplay();
        closeLoadModal();
        
        if (selectedCourse) {
            renderCourseDetail();
        }
    }
}

// Elimina piano
function confirmDeletePlan() {
    if (!planToDeleteId) return;
    
    const savedPlans = getSavedPlans();
    delete savedPlans[planToDeleteId];
    localStorage.setItem('saved-study-plans', JSON.stringify(savedPlans));
    
    // Se stiamo eliminando il piano corrente, carica il predefinito
    if (planToDeleteId === currentPlanId) {
        currentPlanId = null;
        currentPlanName = 'Piano Predefinito';
        localStorage.removeItem('last-used-plan');
        updateCurrentPlanDisplay();
    }
    
    closeDeleteModal();
    renderSavedPlansList();
}

// Duplica piano
function duplicatePlan(planId) {
    const savedPlans = getSavedPlans();
    const originalPlan = savedPlans[planId];
    
    if (originalPlan) {
        const newPlanId = generatePlanId();
        const newPlan = JSON.parse(JSON.stringify(originalPlan));
        newPlan.metadata.id = newPlanId;
        newPlan.metadata.name = `${originalPlan.metadata.name} - Copia`;
        newPlan.metadata.createdAt = new Date().toISOString();
        newPlan.metadata.modifiedAt = new Date().toISOString();
        
        savePlanToStorage(newPlanId, newPlan);
        renderSavedPlansList();
    }
}

// Esporta piano salvato
function exportSavedPlan(planId) {
    const savedPlans = getSavedPlans();
    const planData = savedPlans[planId];
    
    if (planData) {
        const exportData = JSON.parse(JSON.stringify(planData));
        exportData.metadata.exportDate = new Date().toISOString();
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `piano-studio-${planData.metadata.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
}

// Auto-salvataggio (disabilitato per ora)
// Funzione auto-save rimossa - salvataggio solo manuale

// Carica dati da file
function loadData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Controlla se è un piano nuovo o esistente
                const isNewPlan = !data.metadata || !data.metadata.id;
                
                if (isNewPlan) {
                    // File vecchio formato o nuovo piano
                    courses = data.courses || courses;
                    weeklySchedules = data.weeklySchedules || {};
                    courseTopics = data.courseTopics || {};
                    weeklyHours = data.weeklyHours || 15;
                    globalStartDate = data.globalStartDate || '2025-09-08';
                    
                    // Crea un nuovo piano
                    currentPlanId = null;
                    currentPlanName = 'Piano Importato - ' + new Date().toLocaleDateString('it-IT');
                    currentPlanDescription = 'Piano importato da file JSON';
                } else {
                    // Piano esistente con metadati
                    loadPlanFromData(data);
                    currentPlanId = null; // Non sovrascrivere piani esistenti
                    currentPlanName = data.metadata.name + ' - Importato';
                    currentPlanDescription = (data.metadata.description || '') + ' (Importato)';
                }
                
                document.getElementById('weeklyHours').value = weeklyHours;
                document.getElementById('startDate').value = globalStartDate;
                
                updateStats();
                renderGantt();
                updateCurrentPlanDisplay();
                
                alert('Piano di studio importato con successo!');
            } catch (error) {
                alert('Errore nel caricamento del file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

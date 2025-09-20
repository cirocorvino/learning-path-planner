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
            console.log('📁 Caricando piano salvato:', lastPlanId);
            loadPlanFromData(savedPlans[lastPlanId]);
            currentPlanId = lastPlanId;
            currentPlanName = savedPlans[lastPlanId].metadata.name;
            updateCurrentPlanDisplay();
            return true; // Piano caricato con successo
        }
    }
    console.log('📋 Nessun piano salvato trovato, usando configurazione predefinita');
    return false; // Nessun piano caricato
    
    // Se non c'è un piano salvato, NON chiamare recalculateDates qui
    // perché le ore non sono ancora state calcolate
    // recalculateDates(); // RIMUOVI questa linea
}

// Carica dati del piano
function loadPlanFromData(planData) {
    console.log('📥 Caricando dati piano:', {
        corsesCount: planData.courses ? planData.courses.length : 0,
        totalHours: planData.courses ? planData.courses.reduce((sum, c) => sum + c.hours, 0) : 0,
        weeklyHours: planData.weeklyHours,
        startDate: planData.globalStartDate
    });
    
    courses = planData.courses || courses;
    weeklySchedules = planData.weeklySchedules || {};
    courseTopics = planData.courseTopics || {};
    weeklyHours = planData.weeklyHours || 15;
    globalStartDate = planData.globalStartDate || '2025-09-08';
    
    document.getElementById('weeklyHours').value = weeklyHours;
    document.getElementById('startDate').value = globalStartDate;
    
    updateStats();
    renderGantt();
    
    console.log('✅ Dati piano caricati con successo');
}

// Ottieni dati del piano corrente
function getCurrentPlanData() {
    return {
        courses: courses,
        weeklySchedules: weeklySchedules,
        courseTopics: courseTopics,
        weeklyHours: weeklyHours,
        globalStartDate: globalStartDate,
        metadata: {
            id: currentPlanId,
            name: currentPlanName,
            createdAt: currentPlanId ? getSavedPlans()[currentPlanId]?.metadata?.createdAt : new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            description: currentPlanId ? getSavedPlans()[currentPlanId]?.metadata?.description : ''
        }
    };
}

// Aggiorna visualizzazione del piano corrente
function updateCurrentPlanDisplay() {
    document.getElementById('currentPlanName').textContent = `📋 ${currentPlanName}`;
    document.getElementById('currentPlanDisplay').textContent = currentPlanName;
}

// Salva piano
function savePlan() {
    const name = document.getElementById('planName').value.trim();
    const description = document.getElementById('planDescription').value.trim();
    
    if (!name) {
        alert('Inserisci un nome per il piano di studio');
        return;
    }
    
    const planId = currentPlanId || generatePlanId();
    const planData = getCurrentPlanData();
    planData.metadata.name = name;
    planData.metadata.description = description;
    planData.metadata.id = planId;
    
    if (!currentPlanId) {
        planData.metadata.createdAt = new Date().toISOString();
    }
    
    console.log('💾 Salvando piano:', {
        id: planId,
        name: name,
        corsesCount: planData.courses ? planData.courses.length : 0,
        totalHours: planData.courses ? planData.courses.reduce((sum, c) => sum + c.hours, 0) : 0
    });
    
    savePlanToStorage(planId, planData);
    currentPlanId = planId;
    currentPlanName = name;
    updateCurrentPlanDisplay();
    closeSaveModal();
    
    console.log('✅ Piano salvato con successo!');
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
function autoSaveCurrentPlan() {
    // if (currentPlanId) {
    //     const planData = getCurrentPlanData();
    //     savePlanToStorage(currentPlanId, planData);
    // }
}

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
                } else {
                    // Piano esistente con metadati
                    loadPlanFromData(data);
                    currentPlanId = null; // Non sovrascrivere piani esistenti
                    currentPlanName = data.metadata.name + ' - Importato';
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

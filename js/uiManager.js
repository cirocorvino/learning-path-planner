// uiManager.js - Gestione interfaccia utente ed eventi

// Toggle modalità modifica
function toggleEditMode() {
    editMode = !editMode;
    document.getElementById('editBtnText').textContent = editMode ? 'Visualizza' : 'Modifica';
    
    // Gestisci i campi ore settimanali e data inizio
    const weeklyHoursInput = document.getElementById('weeklyHours');
    const startDateInput = document.getElementById('startDate');
    
    if (editMode) {
        weeklyHoursInput.removeAttribute('readonly');
        startDateInput.removeAttribute('readonly');
        weeklyHoursInput.style.background = 'white';
        startDateInput.style.background = 'white';
        makeHeaderEditable();
        makeCalculationParamsEditable();
    } else {
        weeklyHoursInput.setAttribute('readonly', 'readonly');
        startDateInput.setAttribute('readonly', 'readonly');
        weeklyHoursInput.style.background = '#f0f0f0';
        startDateInput.style.background = '#f0f0f0';
        makeHeaderReadonly();
        makeCalculationParamsReadonly();
    }
    
    renderGantt();
    if (selectedCourse) {
        renderCourseDetail();
    }
}

// Rendi header modificabile
function makeHeaderEditable() {
    const title = document.getElementById('appTitle');
    const description = document.getElementById('appDescription');
    
    if (title && !title.classList.contains('editing')) {
        title.classList.add('editing');
        title.contentEditable = true;
        title.style.border = '2px solid white';
        title.style.outline = 'none';
        title.setAttribute('data-original', title.textContent);
    }
    if (description && !description.classList.contains('editing')) {
        description.classList.add('editing');
        description.contentEditable = true;
        description.style.border = '2px solid white';
        description.style.outline = 'none';
        description.setAttribute('data-original', description.textContent);
    }
}

// Rendi header readonly
function makeHeaderReadonly() {
    const title = document.getElementById('appTitle');
    const description = document.getElementById('appDescription');
    
    if (title && title.classList.contains('editing')) {
        title.classList.remove('editing');
        title.contentEditable = false;
        title.style.border = 'none';
        title.style.outline = 'none';
        
        const newTitle = title.textContent;
        if (newTitle !== title.getAttribute('data-original')) {
            // Il testo è cambiato
            currentPlanName = newTitle;
            Logger.ui('makeHeaderReadonly - Titolo salvato:', currentPlanName);
            saveHeaderMetadata();
        }
        title.removeAttribute('data-original');
    }
    
    if (description && description.classList.contains('editing')) {
        description.classList.remove('editing');
        description.contentEditable = false;
        description.style.border = 'none';
        description.style.outline = 'none';
        
        const newDesc = description.textContent;
        if (newDesc !== description.getAttribute('data-original')) {
            // Il testo è cambiato
            currentPlanDescription = newDesc;
            Logger.ui('makeHeaderReadonly - Descrizione salvata:', currentPlanDescription);
            saveHeaderMetadata();
        }
        description.removeAttribute('data-original');
    }
}

// Salva i metadata della testata separatamente
function saveHeaderMetadata() {
    if (!currentPlanId) {
        Logger.debug('Nessun piano corrente, skip saveHeaderMetadata');
        return;
    }
    
    const savedPlans = getSavedPlans();
    if (savedPlans[currentPlanId]) {
        savedPlans[currentPlanId].metadata.headerTitle = currentPlanName;
        savedPlans[currentPlanId].metadata.headerDescription = currentPlanDescription;
        
        localStorage.setItem('saved-plans', JSON.stringify(savedPlans));
        Logger.save('Metadata testata salvati:', {
            headerTitle: currentPlanName,
            headerDescription: currentPlanDescription
        });
    }
}

// Rendi modificabili parametri calcolo
function makeCalculationParamsEditable() {
    const elements = {
        'theoryMultiplier': calculationParams.theoryMultiplier,
        'practiceMultiplier': calculationParams.practiceMultiplier,
        'exerciseHours': calculationParams.exerciseHours,
        'projectHours': calculationParams.projectHours
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.innerHTML = `<input type="number" step="0.1" value="${value}" style="width: 50px;" onchange="updateCalculationParam('${id}', this.value)">`;
        }
    });
}

// Rendi readonly parametri calcolo
function makeCalculationParamsReadonly() {
    updateCalculationDisplay();
}

// Update functions
function updateAppTitle(value) {
    Logger.ui('updateAppTitle chiamata con:', value);
    currentPlanName = value;
    Logger.ui('currentPlanName aggiornato a:', currentPlanName);
    
    // Salva anche nei metadata della testata
    saveHeaderMetadata();
    
}

function updateAppDescription(value) {
    Logger.ui('updateAppDescription chiamata con:', value);
    currentPlanDescription = value;
    Logger.ui('currentPlanDescription aggiornato a:', currentPlanDescription);
    
    // Salva anche nei metadata della testata
    saveHeaderMetadata();
    
}

// Cancella tutte le personalizzazioni delle settimane
function clearAllWeekCustomizations() {
    // Rimuovi tutti i moduli personalizzati
    Object.keys(courseTopics).forEach(key => {
        if (key.includes('_customModules')) {
            delete courseTopics[key];
        }
    });
    
    // Rimuovi tutti gli schedule personalizzati che dipendono dai moduli
    Object.keys(weeklySchedules).forEach(weekKey => {
        // Rigenera solo le sessioni di studio, mantieni altre attività
        regenerateStudySessionsForWeek(weekKey);
    });
}

// Rigenera solo le sessioni di studio per una settimana specifica
function regenerateStudySessionsForWeek(weekKey) {
    const schedule = weeklySchedules[weekKey];
    if (!schedule) return;
    
    // Per ogni giorno, rigenera solo le sessioni di tipo 'study'
    Object.keys(schedule).forEach(day => {
        schedule[day].forEach((session, index) => {
            if (session.type === 'study') {
                // Resetta a contenuto generico, verrà riempito da generateWeekSchedule
                schedule[day][index].content = `📚 Studio AI`;
            }
        });
    });
}

// Forza la rigenerazione completa del dettaglio settimana
function forceRegenerateWeekDetail() {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    
    // Rimuovi moduli personalizzati per questa settimana
    if (courseTopics[weekKey + '_customModules']) {
        delete courseTopics[weekKey + '_customModules'];
    }
    
    // Rigenera lo schedule da zero
    weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
    
    // Aggiorna la visualizzazione
    renderCourseDetail();
}
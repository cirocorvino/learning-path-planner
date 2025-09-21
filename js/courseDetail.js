// courseDetail.js - Gestione dettagli corso con sincronizzazione argomenti

// Mostra dettagli del corso
function showCourseDetail(courseId) {
    selectedCourse = courses.find(c => c.id === courseId);
    selectedWeek = 0;
    renderCourseDetail();
}

// Render dettagli del corso
function renderCourseDetail() {
    const detailSection = document.getElementById('scheduleDetail');
    detailSection.classList.add('active');
    
    const weeks = getWeeksForCourse(selectedCourse);
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    
    let weekTabsHtml = '';
    weeks.forEach((week, index) => {
        weekTabsHtml += `
            <button class="week-tab ${index === selectedWeek ? 'active' : ''}" 
                    onclick="selectWeek(${index})">
                ${formatWeekRange(week.start, week.end)}
            </button>
        `;
    });
    
    // IMPORTANTE: Genera sempre lo schedule prima di mostrare gli argomenti
    // per garantire coerenza tra lista e dettaglio giornaliero
    if (!weeklySchedules[weekKey] || shouldRegenerateSchedule(weekKey)) {
        weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
    }
    
    const modules = getWeekModules(selectedCourse.name, selectedWeek);
    
    detailSection.innerHTML = `
        <div class="week-header">
            <span class="week-title">${selectedCourse.name} - Settimana ${selectedWeek + 1}</span>
            <button class="close-btn" onclick="closeDetail()">✕</button>
        </div>
        
        <div class="week-tabs">
            ${weekTabsHtml}
        </div>
        
        ${modules.length > 0 ? `
            <div class="topics-box">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>Argomenti della settimana (ore effettive):</h3>
                    ${editMode ? `<button class="btn btn-success" style="padding: 5px 12px; font-size: 0.85em;" onclick="addWeekTopic()">+ Aggiungi</button>` : ''}
                </div>
                <div id="weekTopicsList">
                    ${renderWeekTopics(modules)}
                </div>
                <div style="margin-top: 10px; padding: 10px; background: #e8f4f8; border-radius: 5px; font-size: 0.9em; color: #666;">
                    <strong>Totale ore settimana:</strong> ${modules.reduce((sum, m) => sum + m.effectiveTime, 0).toFixed(1)}h / ${weeklyHours}h disponibili
                </div>
            </div>
        ` : ''}
        
        <div id="weekContent">
            ${renderWeekSchedule()}
        </div>
    `;
}

// Verifica se lo schedule deve essere rigenerato
function shouldRegenerateSchedule(weekKey) {
    // Rigenera se non ci sono moduli personalizzati e i parametri sono cambiati
    return !courseTopics[weekKey + '_customModules'] && courseTopics[weekKey + '_paramsVersion'] !== getParamsVersion();
}

// Ottieni versione parametri per tracking modifiche
function getParamsVersion() {
    return `${calculationParams.theoryMultiplier}-${calculationParams.practiceMultiplier}-${calculationParams.exerciseHours}-${calculationParams.projectHours}`;
}

// Ottieni settimane per un corso
function getWeeksForCourse(course) {
    const weeks = [];
    const startDate = new Date(course.startDate);
    const endDate = new Date(course.endDate);
    
    let currentWeekStart = new Date(startDate);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    
    while (currentWeekStart <= endDate) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        weeks.push({
            start: new Date(currentWeekStart),
            end: new Date(weekEnd)
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
}

// Formatta range settimana
function formatWeekRange(start, end) {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    
    if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth}`;
    } else {
        return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
    }
}

// Ottieni moduli per settimana con gestione cache migliorata
function getWeekModules(courseName, weekIndex) {
    const weekKey = `${selectedCourse?.id || 0}-${weekIndex}`;
    
    // Se ci sono moduli personalizzati, usali
    if (courseTopics[weekKey + '_customModules']) {
        return [...courseTopics[weekKey + '_customModules']];
    }
    
    // Altrimenti calcola dal curriculum
    const courseData = curriculum[courseName];
    if (!courseData) return [];
    
    const modules = courseData.modules;
    const hoursPerWeek = weeklyHours;
    let currentHour = 0;
    let weekModules = [];
    let currentWeek = 0;
    
    for (const module of modules) {
        const effectiveTime = calculateModuleEffectiveTime(module);
        let remainingTime = effectiveTime;
        
        while (remainingTime > 0) {
            const spaceInCurrentWeek = hoursPerWeek - currentHour;
            const timeForThisWeek = Math.min(remainingTime, spaceInCurrentWeek);
            
            if (currentWeek === weekIndex && timeForThisWeek > 0) {
                weekModules.push({
                    name: module.name,
                    time: module.time,
                    effectiveTime: timeForThisWeek
                });
            }
            
            currentHour += timeForThisWeek;
            remainingTime -= timeForThisWeek;
            
            if (currentHour >= hoursPerWeek) {
                currentWeek++;
                currentHour = 0;
            }
        }
    }
    
    // Salva la versione dei parametri usati
    courseTopics[weekKey + '_paramsVersion'] = getParamsVersion();
    
    return weekModules;
}

// Genera schedule settimanale con tracking degli argomenti distribuiti
function generateWeekSchedule(courseName, weekIndex) {
    const modules = getWeekModules(courseName, weekIndex);
    const schedule = JSON.parse(JSON.stringify(weekTemplate));
    const weekKey = `${selectedCourse?.id || 0}-${weekIndex}`;
    
    // Tracking degli argomenti effettivamente distribuiti nelle sessioni
    const distributedModules = [];
    
    // Prima aggiungi le icone e contenuti base per TUTTE le attività non-studio
    Object.keys(schedule).forEach(day => {
        schedule[day].forEach((session, i) => {
            if (session.type === 'prayer') {
                session.content = `${activityIcons.prayer} Lodi + Letture`;
            } else if (session.type === 'work') {
                session.content = `${activityIcons.work} Lavoro`;
            } else if (session.type === 'community') {
                session.content = `${activityIcons.community} Comunità Neocatecumenale`;
            } else if (session.type === 'gym') {
                if (day === 'Giovedì' && session.time.includes('18:15')) {
                    session.content = `${activityIcons.gym} Cardio`;
                } else {
                    session.content = `${activityIcons.gym} Pesi`;
                }
            } else if (session.type === 'study') {
                session.content = `${activityIcons.study} Studio AI`;
            }
        });
    });
    
    // Distribuisci i moduli nelle sessioni di studio
    let moduleQueue = [...modules];
    let currentModule = moduleQueue.shift();
    let currentModuleRemaining = currentModule ? currentModule.effectiveTime : 0;

    for (const day of Object.keys(studySchedule)) {
        const dayStudy = studySchedule[day];
        if (!dayStudy) continue;
        
        dayStudy.sessions.forEach(sessionInfo => {
            let sessionHours = sessionInfo.hours;
            let sessionModules = [];
            
            // Solo se ci sono ancora moduli da studiare
            while (sessionHours > 0 && currentModule) {
                const timeToUse = Math.min(currentModuleRemaining, sessionHours);
                
                if (!sessionModules.find(m => m.name === currentModule.name)) {
                    sessionModules.push({...currentModule});
                    if (!distributedModules.find(m => m.name === currentModule.name)) {
                        distributedModules.push({...currentModule});
                    }
                }
                
                sessionHours -= timeToUse;
                currentModuleRemaining -= timeToUse;
                
                if (currentModuleRemaining <= 0) {
                    currentModule = moduleQueue.shift();
                    currentModuleRemaining = currentModule ? currentModule.effectiveTime : 0;
                }
            }
            
            const sessionIndex = schedule[day].findIndex(s => 
                s.type === 'study' && s.time === sessionInfo.time
            );
            
            if (sessionIndex !== -1) {
                if (sessionModules.length > 0) {
                    // Salva i moduli nella sessione per riferimento
                    schedule[day][sessionIndex].modules = sessionModules;
                    
                    // Genera il contenuto visibile
                    if (sessionModules.length === 1) {
                        const mod = sessionModules[0];
                        if (mod.name.startsWith('Progetto:')) {
                            schedule[day][sessionIndex].content = `${activityIcons.study} ${mod.name}`;
                        } else {
                            schedule[day][sessionIndex].content = `${activityIcons.study} Studio AI - ${mod.name}`;
                        }
                    } else {
                        const moduleList = sessionModules.map(mod => {
                            if (mod.name.startsWith('Progetto:')) {
                                return mod.name;
                            }
                            return mod.name;
                        }).join('\n• ');
                        schedule[day][sessionIndex].content = `${activityIcons.study} Studio AI:\n• ${moduleList}`;
                    }
                } else {
                    schedule[day][sessionIndex].content = `${activityIcons.study} Studio libero`;
                }
            }
        });
    }
    
    // Salva i moduli effettivamente distribuiti per riferimento
    courseTopics[weekKey + '_distributed'] = distributedModules;
    
    return schedule;
}

// Renderizza lista argomenti modificabili con sync
function renderWeekTopics(modules) {
    let html = '';
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    
    modules.forEach((module, index) => {
        if (editMode) {
            html += `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 8px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;">
                    <input type="text" value="${module.name}" 
                           style="flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 3px;" 
                           onchange="updateModuleName(${index}, this.value)">
                    <input type="number" value="${module.effectiveTime}" 
                           style="width: 70px; padding: 5px; border: 1px solid #ddd; border-radius: 3px;" 
                           step="0.1" min="0"
                           onchange="updateModuleHours(${index}, this.value)">
                    <span style="font-size: 0.9em; color: #666; min-width: 15px;">h</span>
                    <button class="delete-btn" onclick="removeWeekTopic(${index})" style="padding: 3px 8px;">🗑️</button>
                </div>
            `;
        } else {
            // Verifica se il modulo è effettivamente distribuito nelle sessioni
            const distributed = courseTopics[weekKey + '_distributed'] || [];
            const isDistributed = distributed.some(d => d.name === module.name);
            const textColor = isDistributed ? '#000' : '#999';
            const suffix = isDistributed ? '' : ' (non programmato)';
            
            html += `<div style="line-height: 1.8; padding: 2px 0; color: ${textColor};">• ${module.name} (${module.effectiveTime.toFixed(1)}h effettive)${suffix}</div>`;
        }
    });
    
    return html;
}

// Render schedule settimanale
function renderWeekSchedule() {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    const schedule = weeklySchedules[weekKey] || generateWeekSchedule(selectedCourse.name, selectedWeek);
    
    const weeks = getWeeksForCourse(selectedCourse);
    const currentWeek = weeks[selectedWeek];
    const weekStart = currentWeek ? currentWeek.start : new Date();
    
    let html = '';
    
    weekDays.forEach((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + index);
        const dateStr = `${dayDate.getDate()} ${monthNames[dayDate.getMonth()]}`;
        
        const sessions = schedule[day] || [];
        html += `
            <div class="day-schedule">
                <div class="day-header">
                    <span class="day-name">${day} - ${dateStr}</span>
                </div>
                <div id="sessions-${day}">
        `;
        
        sessions.forEach((session, sessionIndex) => {
            if (editMode) {
                html += `
                    <div class="session ${session.type}">
                        <input class="session-input" value="${session.time}" 
                               onchange="updateSession('${day}', ${sessionIndex}, 'time', this.value)">
                        <input class="session-input" style="flex: 1;" value="${session.content}" 
                               onchange="updateSession('${day}', ${sessionIndex}, 'content', this.value)">
                        <select class="session-select" 
                                onchange="updateSession('${day}', ${sessionIndex}, 'type', this.value)">
                            ${Object.keys(activityLabels).map(type => 
                                `<option value="${type}" ${session.type === type ? 'selected' : ''}>${activityLabels[type]}</option>`
                            ).join('')}
                        </select>
                        <button class="delete-btn" onclick="removeSession('${day}', ${sessionIndex})">🗑️</button>
                    </div>
                `;
            } else {
                html += `
                    <div class="session ${session.type}">
                        <span class="session-time">${session.time}</span>
                        <span class="session-content">${session.content}</span>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    return html;
}

// Gestione argomenti settimana con sincronizzazione
function addWeekTopic() {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    
    let currentModules = getWeekModules(selectedCourse.name, selectedWeek);
    
    const newModule = {
        name: 'Nuovo argomento',
        time: 1,
        effectiveTime: 1
    };
    
    currentModules.push(newModule);
    
    // Salva i moduli personalizzati
    courseTopics[weekKey + '_customModules'] = currentModules;
    
    // Rigenera lo schedule per includere il nuovo modulo
    weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
    
    autoSaveCurrentPlan();
    renderCourseDetail();
}

function removeWeekTopic(index) {
    if (confirm('Sei sicuro di voler eliminare questo argomento?')) {
        const weekKey = `${selectedCourse.id}-${selectedWeek}`;
        let currentModules = getWeekModules(selectedCourse.name, selectedWeek);
        
        currentModules.splice(index, 1);
        courseTopics[weekKey + '_customModules'] = currentModules;
        
        // Rigenera lo schedule senza il modulo rimosso
        weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
        
        autoSaveCurrentPlan();
        renderCourseDetail();
    }
}

function updateModuleName(index, newName) {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    let currentModules = getWeekModules(selectedCourse.name, selectedWeek);
    
    if (currentModules[index]) {
        currentModules[index].name = newName;
        courseTopics[weekKey + '_customModules'] = currentModules;
        
        // Rigenera lo schedule per aggiornare i nomi nelle sessioni
        weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
        
        autoSaveCurrentPlan();
        renderCourseDetail();
    }
}

function updateModuleHours(index, newHours) {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    let currentModules = getWeekModules(selectedCourse.name, selectedWeek);
    
    if (currentModules[index]) {
        const hours = parseFloat(newHours) || 0;
        currentModules[index].effectiveTime = hours;
        currentModules[index].time = hours;
        courseTopics[weekKey + '_customModules'] = currentModules;
        
        // Rigenera lo schedule per ridistribuire le ore
        weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
        
        autoSaveCurrentPlan();
        renderCourseDetail();
    }
}

// Gestione sessioni
function updateSession(day, index, field, value) {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    if (!weeklySchedules[weekKey]) {
        weeklySchedules[weekKey] = generateWeekSchedule(selectedCourse.name, selectedWeek);
    }
    
    if (field === 'type') {
        const oldContent = weeklySchedules[weekKey][day][index].content;
        const hasCustomContent = oldContent && !Object.values(activityLabels).some(label => oldContent.includes(label));
        
        if (!hasCustomContent || oldContent === '' || oldContent.includes(activityIcons[weeklySchedules[weekKey][day][index].type])) {
            weeklySchedules[weekKey][day][index].content = `${activityIcons[value]} ${activityLabels[value]}`;
        }
    } else if (field === 'content') {
        const currentType = weeklySchedules[weekKey][day][index].type;
        if (value === '') {
            value = `${activityIcons[currentType]} ${activityLabels[currentType]}`;
        } else if (!value.includes(activityIcons[currentType])) {
            value = `${activityIcons[currentType]} ${value}`;
        }
    }
    
    weeklySchedules[weekKey][day][index][field] = value;
    
    if (field === 'time') {
        sortSessionsByTime(weekKey, day);
    }
    
    autoSaveCurrentPlan();
    
    if (editMode) {
        renderCourseDetail();
    }
}

function removeSession(day, index) {
    const weekKey = `${selectedCourse.id}-${selectedWeek}`;
    weeklySchedules[weekKey][day].splice(index, 1);
    autoSaveCurrentPlan();
    renderCourseDetail();
}

function sortSessionsByTime(weekKey, day) {
    if (!weeklySchedules[weekKey] || !weeklySchedules[weekKey][day]) return;
    
    weeklySchedules[weekKey][day].sort((a, b) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
    });
}

// Seleziona settimana
function selectWeek(weekIndex) {
    selectedWeek = weekIndex;
    renderCourseDetail();
}

// Chiudi dettaglio
function closeDetail() {
    document.getElementById('scheduleDetail').classList.remove('active');
    selectedCourse = null;
}

// Forza rigenerazione schedule quando cambiano i parametri
function regenerateAllSchedulesForCourse() {
    if (!selectedCourse) return;
    
    const weeks = getWeeksForCourse(selectedCourse);
    weeks.forEach((week, index) => {
        const weekKey = `${selectedCourse.id}-${index}`;
        
        // Rigenera solo se non ci sono moduli personalizzati
        if (!courseTopics[weekKey + '_customModules']) {
            delete weeklySchedules[weekKey];
            delete courseTopics[weekKey + '_distributed'];
            delete courseTopics[weekKey + '_paramsVersion'];
        }
    });
    
    renderCourseDetail();
}
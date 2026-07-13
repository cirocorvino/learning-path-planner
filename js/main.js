// main.js - Inizializzazione dell'organizer e adattamenti del planner esistente

(function () {
    'use strict';

    function parseLocalDate(value) {
        const [year, month, day] = String(value).split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    function toIsoLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function decorateSessionContent(session) {
        const icon = activityIcons[session.type] || activityIcons.other || '📌';
        const label = activityLabels[session.type] || activityLabels.other || 'Attività';
        const content = String(session.content || '').trim();

        if (content.startsWith(icon)) return content;
        return content ? `${icon} ${content}` : `${icon} ${label}`;
    }

    // Supporta moduli di pausa a ore zero ma con durata di calendario esplicita.
    window.recalculateDates = function () {
        const startDateInput = document.getElementById('startDate');
        if (startDateInput?.value) {
            globalStartDate = startDateInput.value;
        }

        let currentDate = parseLocalDate(globalStartDate);

        courses.forEach(course => {
            const hasExistingDates = Boolean(course.startDate && course.endDate);

            if (hasExistingDates && isCourseCompleted(course)) {
                currentDate = parseLocalDate(course.endDate);
                currentDate.setDate(currentDate.getDate() + 1);
                return;
            }

            course.startDate = toIsoLocalDate(currentDate);
            const calculatedWeeks = weeklyHours > 0
                ? Math.ceil(course.hours / weeklyHours)
                : 0;
            course.weeks = Number.isInteger(course.fixedWeeks)
                ? course.fixedWeeks
                : calculatedWeeks;

            const courseEndDate = new Date(currentDate);
            const durationDays = Math.max(course.weeks * 7, 1);
            courseEndDate.setDate(courseEndDate.getDate() + durationDays - 1);
            course.endDate = toIsoLocalDate(courseEndDate);

            currentDate.setDate(currentDate.getDate() + durationDays);
        });

        updateStats();
        renderGantt();
    };

    // Distribuisce soltanto le ore realmente previste per la settimana,
    // evitando di duplicare un modulo quando attraversa il confine settimanale.
    window.generateWeekSchedule = function (courseName, weekIndex) {
        const modules = getWeekModules(courseName, weekIndex);
        const schedule = JSON.parse(JSON.stringify(weekTemplate));
        const weekKey = `${selectedCourse?.id || 0}-${weekIndex}`;
        const course = courses.find(item => item.name === courseName);
        const distributedModules = [];

        Object.keys(schedule).forEach(day => {
            schedule[day].forEach(session => {
                if (session.type === 'study') {
                    session.content = `${activityIcons.study || '📚'} Studio`;
                } else {
                    session.content = decorateSessionContent(session);
                }
            });
        });

        if (course?.isBuffer) {
            Object.keys(schedule).forEach(day => {
                schedule[day] = schedule[day].filter(session => session.type !== 'study');
            });

            if (selectedCourse && canUpdateWeek(selectedCourse, weekIndex)) {
                courseTopics[weekKey + '_distributed'] = [];
            }

            return schedule;
        }

        let moduleQueue = [...modules];
        let currentModule = moduleQueue.shift();
        let currentModuleRemaining = currentModule
            ? (currentModule.weeklyHours ?? calculateModuleEffectiveTime(currentModule))
            : 0;

        for (const day of Object.keys(studySchedule)) {
            const dayStudy = studySchedule[day];
            if (!dayStudy) continue;

            dayStudy.sessions.forEach(sessionInfo => {
                let sessionHours = sessionInfo.hours;
                const sessionModules = [];

                while (sessionHours > 0 && currentModule) {
                    const timeToUse = Math.min(currentModuleRemaining, sessionHours);

                    if (!sessionModules.find(module => module.name === currentModule.name)) {
                        sessionModules.push({ ...currentModule });
                    }

                    if (!distributedModules.find(module => module.name === currentModule.name)) {
                        distributedModules.push({ ...currentModule });
                    }

                    sessionHours -= timeToUse;
                    currentModuleRemaining -= timeToUse;

                    if (currentModuleRemaining <= 0.0001) {
                        currentModule = moduleQueue.shift();
                        currentModuleRemaining = currentModule
                            ? (currentModule.weeklyHours ?? calculateModuleEffectiveTime(currentModule))
                            : 0;
                    }
                }

                const sessionIndex = schedule[day].findIndex(session =>
                    session.type === 'study' && session.time === sessionInfo.time
                );

                if (sessionIndex === -1) return;

                if (sessionModules.length === 0) {
                    schedule[day][sessionIndex].content = `${activityIcons.study || '📚'} Revisione libera`;
                    return;
                }

                schedule[day][sessionIndex].modules = sessionModules;
                const moduleList = sessionModules.map(module => module.name).join('\n• ');

                schedule[day][sessionIndex].content = sessionModules.length === 1
                    ? `${activityIcons.study || '📚'} ${sessionModules[0].name}`
                    : `${activityIcons.study || '📚'} ${courseName}:\n• ${moduleList}`;
            });
        }

        if (selectedCourse && canUpdateWeek(selectedCourse, weekIndex)) {
            courseTopics[weekKey + '_distributed'] = distributedModules;
        }

        return schedule;
    };

    window.regenerateStudySessionsForWeek = function (weekKey) {
        const schedule = weeklySchedules[weekKey];
        if (!schedule) return;

        Object.keys(schedule).forEach(day => {
            schedule[day].forEach(session => {
                if (session.type === 'study') {
                    session.content = `${activityIcons.study || '📚'} Studio`;
                }
            });
        });
    };

    // Il file JSON è la fonte ufficiale; la modifica della testata rende
    // semplicemente il database corrente da salvare.
    window.saveHeaderMetadata = function () {
        window.FileStore?.markDirty('Titolo o descrizione modificati');
    };
})();

window.refreshApplicationFromData = function () {
    const weeklyHoursInput = document.getElementById('weeklyHours');
    const startDateInput = document.getElementById('startDate');

    if (weeklyHoursInput) weeklyHoursInput.value = weeklyHours;
    if (startDateInput) startDateInput.value = globalStartDate;

    const weeklyHoursDisplay = document.getElementById('weeklyHoursDisplay');
    if (weeklyHoursDisplay) weeklyHoursDisplay.textContent = weeklyHours;

    initializeCourseHours();
    recalculateDates();
    updateCurrentPlanDisplay();
    updateCalculationDisplay();

    const detailSection = document.getElementById('scheduleDetail');
    if (detailSection) {
        detailSection.classList.remove('active');
        detailSection.innerHTML = '';
    }

    if (weeklyHoursInput) weeklyHoursInput.style.background = '#f0f0f0';
    if (startDateInput) startDateInput.style.background = '#f0f0f0';
};

async function init() {
    Logger.debug('Inizializzazione organizer locale...');

    document.title = 'Organizer locale e planner di studio';

    const ganttTitle = document.querySelector('.gantt-container h2');
    if (ganttTitle) {
        ganttTitle.textContent = 'Diagramma di Gantt - Programma di studio';
    }

    const planNameInput = document.getElementById('planName');
    const planDescriptionInput = document.getElementById('planDescription');
    if (planNameInput) planNameInput.placeholder = 'Nome del programma di studio';
    if (planDescriptionInput) planDescriptionInput.placeholder = 'Descrizione del programma';

    const loaded = await FileStore.loadDefaultDatabase({ refresh: false });
    if (!loaded) {
        FileStore.useEmptyDatabase({ refresh: false });
    }

    refreshApplicationFromData();

    document.addEventListener('change', event => {
        const ignoredIds = new Set(['databaseFileInput', 'studyProgramFileInput']);
        if (!ignoredIds.has(event.target?.id)) {
            FileStore.markDirty();
        }
    });

    Logger.debug('Organizer inizializzato:', {
        courses: courses.length,
        weeklyHours,
        startDate: globalStartDate,
        currentPlan: currentPlanName
    });
}

window.onload = function () {
    init().catch(error => {
        Logger.error('Errore fatale durante l\'inizializzazione:', error);
        const status = document.getElementById('databaseStatus');
        if (status) {
            status.textContent = `Errore di inizializzazione: ${error.message}`;
            status.style.color = '#dc3545';
        }
        alert(`Impossibile inizializzare l'applicazione: ${error.message}`);
    });
};

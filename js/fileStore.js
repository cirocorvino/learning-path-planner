// fileStore.js - Database JSON locale e importazione dei programmi di studio

(function () {
    'use strict';

    const DATABASE_KIND = 'organizer-database';
    const STUDY_PROGRAM_KIND = 'study-program';
    const SCHEMA_VERSION = 1;
    const DEFAULT_DATABASE_URL = 'data/organizer-data.json';
    const DEFAULT_FILE_NAME = 'organizer-data.json';
    const COLOR_PALETTE = [
        '#5B8FF9', '#61DDAA', '#65789B', '#7262FD', '#F6BD16',
        '#78D3F8', '#9661BC', '#F6903D', '#008685', '#F08BB4'
    ];

    let currentDatabase = null;
    let currentFileHandle = null;
    let currentFileName = DEFAULT_FILE_NAME;
    let dirty = false;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function createEmptyWeekTemplate() {
        return weekDays.reduce((result, day) => {
            result[day] = [];
            return result;
        }, {});
    }

    function createEmptyDatabase() {
        const today = new Date().toISOString().split('T')[0];

        return {
            kind: DATABASE_KIND,
            schemaVersion: SCHEMA_VERSION,
            metadata: {
                name: 'Organizer locale',
                createdAt: nowIso(),
                updatedAt: nowIso()
            },
            settings: {
                defaultSessionMinutes: 90,
                calculationParams: {
                    theoryMultiplier: 1,
                    practiceMultiplier: 1,
                    exerciseHours: 3,
                    projectHours: 8
                }
            },
            categories: [
                { id: 'study', label: 'Studio', icon: '📚' },
                { id: 'work', label: 'Lavoro', icon: '💼' },
                { id: 'fitness', label: 'Fitness', icon: '🏋️' },
                { id: 'personal', label: 'Personale', icon: '📌' },
                { id: 'other', label: 'Altro', icon: '📌' }
            ],
            weekTemplate: createEmptyWeekTemplate(),
            studyProgram: {
                kind: STUDY_PROGRAM_KIND,
                schemaVersion: SCHEMA_VERSION,
                id: 'new-study-program',
                title: 'Nuovo programma di studio',
                description: 'Importa un programma JSON per iniziare',
                startDate: today,
                weeklyHours: 10,
                courses: []
            },
            state: {
                weeklySchedules: {},
                courseTopics: {}
            }
        };
    }

    function setStatus(message, level = 'info') {
        const element = document.getElementById('databaseStatus');
        if (!element) return;

        const colors = {
            info: '#667eea',
            success: '#198754',
            warning: '#b7791f',
            error: '#dc3545'
        };

        element.textContent = message;
        element.style.color = colors[level] || colors.info;
        element.title = message;
    }

    function markDirty(message = 'Modifiche non salvate') {
        dirty = true;
        setStatus(`● ${message}`, 'warning');
    }

    function markSaved(message) {
        dirty = false;
        setStatus(`✓ ${message}`, 'success');
    }

    function parseTimeRange(timeRange) {
        if (typeof timeRange !== 'string' || !timeRange.includes('-')) return null;

        const [start, end] = timeRange.split('-').map(value => value.trim());
        const matchStart = /^(\d{1,2}):(\d{2})$/.exec(start);
        const matchEnd = /^(\d{1,2}):(\d{2})$/.exec(end);
        if (!matchStart || !matchEnd) return null;

        const startMinutes = Number(matchStart[1]) * 60 + Number(matchStart[2]);
        const endMinutes = Number(matchEnd[1]) * 60 + Number(matchEnd[2]);
        if (endMinutes <= startMinutes) return null;

        return {
            start,
            end,
            minutes: endMinutes - startMinutes,
            hours: (endMinutes - startMinutes) / 60
        };
    }

    function deriveStudySchedule(template) {
        const result = {};

        weekDays.forEach(day => {
            const sessions = (template[day] || [])
                .filter(session => session.type === 'study')
                .map(session => {
                    const parsed = parseTimeRange(session.time);
                    return parsed
                        ? { time: session.time, hours: parsed.hours }
                        : null;
                })
                .filter(Boolean);

            if (sessions.length > 0) {
                result[day] = { sessions };
            }
        });

        return result;
    }

    function calculateAvailableStudyHours(schedule) {
        return Object.values(schedule).reduce((total, day) => {
            return total + day.sessions.reduce((dayTotal, session) => dayTotal + Number(session.hours || 0), 0);
        }, 0);
    }

    function normalizeCategories(categories) {
        const normalized = Array.isArray(categories) && categories.length > 0
            ? categories
            : createEmptyDatabase().categories;

        return normalized.map((category, index) => ({
            id: String(category.id || `category-${index + 1}`),
            label: String(category.label || category.name || `Categoria ${index + 1}`),
            icon: String(category.icon || '📌')
        }));
    }

    function normalizeModule(module, index) {
        const name = module.name || module.title;
        if (!name) {
            throw new Error(`L'attività di studio ${index + 1} non ha un nome.`);
        }

        let time = Number(module.time ?? module.hours ?? module.estimatedHours);
        if (!Number.isFinite(time) && module.estimatedMinutes !== undefined) {
            time = Number(module.estimatedMinutes) / 60;
        }

        if (!Number.isFinite(time) || time < 0) {
            throw new Error(`Durata non valida per l'attività "${name}".`);
        }

        return {
            ...module,
            name: String(name),
            time: Math.round(time * 100) / 100
        };
    }

    function groupFlatUnits(units) {
        const grouped = new Map();

        units
            .map((unit, index) => ({ ...unit, __index: index }))
            .sort((left, right) => {
                const orderLeft = Number(left.order ?? left.__index);
                const orderRight = Number(right.order ?? right.__index);
                return orderLeft - orderRight;
            })
            .forEach(unit => {
                const moduleName = String(unit.module || unit.section || 'Programma');
                if (!grouped.has(moduleName)) {
                    grouped.set(moduleName, []);
                }
                grouped.get(moduleName).push(normalizeModule(unit, unit.__index));
            });

        return Array.from(grouped.entries()).map(([name, modules], index) => ({
            id: index + 1,
            name,
            color: COLOR_PALETTE[index % COLOR_PALETTE.length],
            modules
        }));
    }

    function normalizeStudyProgram(input) {
        const source = input && input.program ? input.program : input;
        if (!source || typeof source !== 'object') {
            throw new Error('Il programma di studio non contiene un oggetto valido.');
        }

        if (source.kind && source.kind !== STUDY_PROGRAM_KIND) {
            throw new Error(`Tipo file non supportato: ${source.kind}.`);
        }

        const rawCourses = Array.isArray(source.courses)
            ? source.courses
            : (Array.isArray(source.units) ? groupFlatUnits(source.units) : null);

        if (!rawCourses) {
            throw new Error('Il programma deve contenere "courses" oppure una lista piatta "units".');
        }

        const courses = rawCourses.map((course, courseIndex) => {
            const name = course.name || course.title;
            if (!name) {
                throw new Error(`Il modulo ${courseIndex + 1} non ha un nome.`);
            }

            let modules = Array.isArray(course.modules)
                ? course.modules.map(normalizeModule)
                : [];

            const declaredHours = Number(course.hours);
            if (modules.length === 0 && Number.isFinite(declaredHours) && declaredHours > 0) {
                modules = [{ name: `${name} - Attività`, time: declaredHours }];
            }

            const normalized = {
                id: Number(course.id) || courseIndex + 1,
                name: String(name),
                color: String(course.color || COLOR_PALETTE[courseIndex % COLOR_PALETTE.length]),
                modules
            };

            if (Number.isInteger(course.fixedWeeks) && course.fixedWeeks >= 0) {
                normalized.fixedWeeks = course.fixedWeeks;
            }
            if (course.isBuffer === true) {
                normalized.isBuffer = true;
            }

            return normalized;
        });

        const startDate = source.startDate || new Date().toISOString().split('T')[0];
        const weeklyTarget = Number(source.weeklyHours)
            || (Number(source.weeklyTargetMinutes) / 60)
            || 10;

        return {
            kind: STUDY_PROGRAM_KIND,
            schemaVersion: SCHEMA_VERSION,
            id: String(source.id || `study-program-${Date.now()}`),
            title: String(source.title || source.name || 'Programma di studio'),
            description: String(source.description || ''),
            startDate,
            weeklyHours: Math.round(weeklyTarget * 100) / 100,
            courses
        };
    }

    function normalizeWeekTemplate(template) {
        const result = createEmptyWeekTemplate();

        weekDays.forEach(day => {
            const sessions = template && Array.isArray(template[day]) ? template[day] : [];
            result[day] = sessions.map((session, index) => ({
                time: String(session.time || ''),
                content: String(session.content || ''),
                type: String(session.type || 'other'),
                id: session.id || `${day}-${index + 1}`
            }));
        });

        return result;
    }

    function normalizeDatabase(input) {
        if (!input || typeof input !== 'object') {
            throw new Error('Il database JSON non contiene un oggetto valido.');
        }

        if (input.kind && input.kind !== DATABASE_KIND) {
            throw new Error(`Il file selezionato non è un database organizer (${input.kind}).`);
        }

        const database = createEmptyDatabase();
        database.metadata = {
            ...database.metadata,
            ...(input.metadata || {}),
            updatedAt: input.metadata?.updatedAt || nowIso()
        };
        database.settings = {
            ...database.settings,
            ...(input.settings || {}),
            calculationParams: {
                ...database.settings.calculationParams,
                ...(input.settings?.calculationParams || {})
            }
        };
        database.categories = normalizeCategories(input.categories);
        database.weekTemplate = normalizeWeekTemplate(input.weekTemplate);
        database.studyProgram = normalizeStudyProgram(input.studyProgram || database.studyProgram);
        database.state = {
            weeklySchedules: clone(input.state?.weeklySchedules || {}),
            courseTopics: clone(input.state?.courseTopics || {})
        };

        return database;
    }

    function applyCategories(categories) {
        const icons = {};
        const labels = {};

        categories.forEach(category => {
            icons[category.id] = category.icon;
            labels[category.id] = category.label;
        });

        activityIcons = icons;
        activityLabels = labels;
    }

    function applyDatabase(input, options = {}) {
        const database = normalizeDatabase(input);
        const program = database.studyProgram;

        currentDatabase = database;
        applyCategories(database.categories);
        weekTemplate = clone(database.weekTemplate);
        studySchedule = deriveStudySchedule(weekTemplate);
        calculationParams = {
            ...calculationParams,
            ...database.settings.calculationParams
        };

        curriculum = {};
        courses = program.courses.map(course => {
            curriculum[course.name] = {
                modules: clone(course.modules)
            };

            const courseState = {
                id: course.id,
                name: course.name,
                hours: 0,
                color: course.color
            };

            if (Number.isInteger(course.fixedWeeks)) {
                courseState.fixedWeeks = course.fixedWeeks;
            }
            if (course.isBuffer === true) {
                courseState.isBuffer = true;
            }

            return courseState;
        });

        weeklySchedules = clone(database.state.weeklySchedules);
        courseTopics = clone(database.state.courseTopics);
        weeklyHours = Number(program.weeklyHours) || calculateAvailableStudyHours(studySchedule) || 10;
        globalStartDate = program.startDate;
        currentPlanId = program.id;
        currentPlanName = program.title;
        currentPlanDescription = program.description;
        selectedCourse = null;
        selectedWeek = 0;

        dirty = false;

        if (options.refresh !== false && typeof window.refreshApplicationFromData === 'function') {
            window.refreshApplicationFromData();
        }

        return database;
    }

    function buildDatabaseSnapshot() {
        const database = clone(currentDatabase || createEmptyDatabase());
        database.kind = DATABASE_KIND;
        database.schemaVersion = SCHEMA_VERSION;
        database.metadata = {
            ...(database.metadata || {}),
            name: database.metadata?.name || 'Organizer locale',
            createdAt: database.metadata?.createdAt || nowIso(),
            updatedAt: nowIso()
        };
        database.settings = {
            ...(database.settings || {}),
            calculationParams: clone(calculationParams)
        };
        database.categories = Object.keys(activityLabels).map(id => ({
            id,
            label: activityLabels[id],
            icon: activityIcons[id] || '📌'
        }));
        database.weekTemplate = clone(weekTemplate);
        database.studyProgram = {
            kind: STUDY_PROGRAM_KIND,
            schemaVersion: SCHEMA_VERSION,
            id: currentPlanId || database.studyProgram?.id || `study-program-${Date.now()}`,
            title: currentPlanName,
            description: currentPlanDescription,
            startDate: globalStartDate,
            weeklyHours,
            courses: courses.map(course => {
                let modules = clone(curriculum[course.name]?.modules || []);
                if (modules.length === 0 && Number(course.hours) > 0) {
                    modules = [{ name: `${course.name} - Attività`, time: Number(course.hours) }];
                }

                const snapshot = {
                    id: course.id,
                    name: course.name,
                    color: course.color,
                    modules
                };

                if (Number.isInteger(course.fixedWeeks)) snapshot.fixedWeeks = course.fixedWeeks;
                if (course.isBuffer === true) snapshot.isBuffer = true;
                return snapshot;
            })
        };
        database.state = {
            weeklySchedules: clone(weeklySchedules),
            courseTopics: clone(courseTopics)
        };

        currentDatabase = database;
        return database;
    }

    async function readJsonFile(file) {
        const text = await file.text();
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`JSON non valido nel file ${file.name}: ${error.message}`);
        }
    }

    async function loadDefaultDatabase(options = {}) {
        try {
            const response = await fetch(DEFAULT_DATABASE_URL, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            currentFileHandle = null;
            currentFileName = DEFAULT_FILE_NAME;
            applyDatabase(payload, options);
            markSaved(`Database predefinito caricato (${DEFAULT_DATABASE_URL})`);
            return true;
        } catch (error) {
            Logger.error('Impossibile caricare il database predefinito:', error);
            setStatus('Database predefinito non disponibile: usa “Apri database”', 'warning');
            return false;
        }
    }

    async function loadDatabaseFile(file, handle = null) {
        const payload = await readJsonFile(file);
        applyDatabase(payload);
        currentFileHandle = handle;
        currentFileName = file.name || DEFAULT_FILE_NAME;
        markSaved(`Aperto ${currentFileName}`);
    }

    async function openDatabase() {
        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    multiple: false,
                    types: [{
                        description: 'Database organizer JSON',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const file = await handle.getFile();
                await loadDatabaseFile(file, handle);
                return;
            }

            document.getElementById('databaseFileInput')?.click();
        } catch (error) {
            if (error.name !== 'AbortError') {
                Logger.error('Errore apertura database:', error);
                setStatus(error.message, 'error');
                alert(error.message);
            }
        }
    }

    async function handleDatabaseFileInput(event) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;

        try {
            await loadDatabaseFile(file, null);
        } catch (error) {
            Logger.error('Errore importazione database:', error);
            setStatus(error.message, 'error');
            alert(error.message);
        } finally {
            input.value = '';
        }
    }

    async function writeToHandle(handle, database) {
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(database, null, 2));
        await writable.close();
    }

    function downloadJson(database, fileName) {
        const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    async function saveDatabase() {
        const database = buildDatabaseSnapshot();

        try {
            if (currentFileHandle?.createWritable) {
                await writeToHandle(currentFileHandle, database);
                markSaved(`Salvato ${currentFileName}`);
                return;
            }

            if ('showSaveFilePicker' in window) {
                currentFileHandle = await window.showSaveFilePicker({
                    suggestedName: currentFileName || DEFAULT_FILE_NAME,
                    types: [{
                        description: 'Database organizer JSON',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                currentFileName = currentFileHandle.name || DEFAULT_FILE_NAME;
                await writeToHandle(currentFileHandle, database);
                markSaved(`Salvato ${currentFileName}`);
                return;
            }

            downloadJson(database, currentFileName || DEFAULT_FILE_NAME);
            markSaved(`Esportato ${currentFileName || DEFAULT_FILE_NAME}`);
        } catch (error) {
            if (error.name !== 'AbortError') {
                Logger.error('Errore salvataggio database:', error);
                setStatus(error.message, 'error');
                alert(error.message);
            }
        }
    }

    function selectStudyProgram() {
        document.getElementById('studyProgramFileInput')?.click();
    }

    async function importStudyProgramPayload(payload, fileName = 'programma JSON') {
        const program = normalizeStudyProgram(payload);
        const database = clone(currentDatabase || createEmptyDatabase());

        const currentHasContent = database.studyProgram?.courses?.length > 0;
        if (currentHasContent) {
            const confirmed = window.confirm(
                `Il programma “${program.title}” sostituirà quello attualmente visualizzato. Continuare?`
            );
            if (!confirmed) return false;
        }

        database.studyProgram = program;
        database.state = {
            weeklySchedules: {},
            courseTopics: {}
        };
        database.metadata.updatedAt = nowIso();

        applyDatabase(database);
        markDirty(`Programma importato da ${fileName}: salva il database`);
        return true;
    }

    async function handleStudyProgramFileInput(event) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;

        try {
            const payload = await readJsonFile(file);
            await importStudyProgramPayload(payload, file.name);
        } catch (error) {
            Logger.error('Errore importazione programma:', error);
            setStatus(error.message, 'error');
            alert(error.message);
        } finally {
            input.value = '';
        }
    }

    function useEmptyDatabase(options = {}) {
        currentFileHandle = null;
        currentFileName = DEFAULT_FILE_NAME;
        applyDatabase(createEmptyDatabase(), options);
        setStatus('Nuovo database in memoria: importare un programma e salvare', 'info');
    }

    function getInfo() {
        return {
            fileName: currentFileName,
            hasFileHandle: Boolean(currentFileHandle),
            dirty,
            database: clone(currentDatabase || createEmptyDatabase())
        };
    }

    window.FileStore = {
        DATABASE_KIND,
        STUDY_PROGRAM_KIND,
        SCHEMA_VERSION,
        applyDatabase,
        buildDatabaseSnapshot,
        createEmptyDatabase,
        getInfo,
        handleDatabaseFileInput,
        handleStudyProgramFileInput,
        importStudyProgramPayload,
        loadDefaultDatabase,
        markDirty,
        openDatabase,
        saveDatabase,
        selectStudyProgram,
        useEmptyDatabase
    };
})();

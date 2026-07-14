/* File generato da scripts/build-classic.mjs. Non modificare direttamente. */
(() => {
    'use strict';

    const modelApi = (() => {
        const DATABASE_KIND = 'learning-planner-database';
        const PLAN_KIND = 'learning-plan';
        const SCHEMA_VERSION = 2;

        const DAY_KEYS = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        ];

        const TOPIC_KINDS = ['theory', 'practice', 'exercise', 'project', 'other'];
        const CATEGORY_ROLES = ['focus', 'busy', 'neutral'];
        const MODULE_MODES = ['work', 'buffer'];

        const DEFAULT_COLORS = [
            '#2563eb',
            '#059669',
            '#7c3aed',
            '#db2777',
            '#ea580c',
            '#0891b2',
            '#4f46e5',
            '#65a30d'
        ];

        const LEGACY_DAY_MAP = {
            'Lunedì': 'monday',
            'Martedì': 'tuesday',
            'Mercoledì': 'wednesday',
            'Giovedì': 'thursday',
            'Venerdì': 'friday',
            'Sabato': 'saturday',
            'Domenica': 'sunday'
        };

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        function nowIso() {
            return new Date().toISOString();
        }

        function todayIso() {
            return nowIso().slice(0, 10);
        }

        function createId(prefix = 'item') {
            if (globalThis.crypto?.randomUUID) {
                return `${prefix}-${globalThis.crypto.randomUUID()}`;
            }
            return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }

        function createEmptyWeekTemplate() {
            return Object.fromEntries(DAY_KEYS.map(day => [day, []]));
        }

        function createEmptyDatabase() {
            const timestamp = nowIso();

            return {
                kind: DATABASE_KIND,
                schemaVersion: SCHEMA_VERSION,
                metadata: {
                    id: createId('database'),
                    name: 'Nuovo planner',
                    description: '',
                    locale: 'it-IT',
                    timeZone: 'Europe/Rome',
                    createdAt: timestamp,
                    updatedAt: timestamp
                },
                settings: {
                    weekStartsOn: 1,
                    planningMode: 'sequential',
                    estimationMultipliers: Object.fromEntries(TOPIC_KINDS.map(kind => [kind, 1])),
                    calendarExceptions: []
                },
                categories: [
                    { id: 'focus', label: 'Studio', icon: '📚', color: '#2563eb', role: 'focus' },
                    { id: 'other', label: 'Altro', icon: '📌', color: '#64748b', role: 'neutral' }
                ],
                weekTemplate: createEmptyWeekTemplate(),
                plan: {
                    kind: PLAN_KIND,
                    schemaVersion: SCHEMA_VERSION,
                    id: createId('plan'),
                    title: 'Nuovo percorso',
                    description: '',
                    startDate: todayIso(),
                    weeklyTargetMinutes: null,
                    modules: []
                },
                state: {
                    progress: {}
                }
            };
        }

        function databaseHasContent(database) {
            return Array.isArray(database?.plan?.modules) && database.plan.modules.length > 0;
        }

        function requireObject(value, path) {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error(`${path} deve essere un oggetto.`);
            }
            return value;
        }

        function requireArray(value, path) {
            if (!Array.isArray(value)) {
                throw new Error(`${path} deve essere una lista.`);
            }
            return value;
        }

        function requiredString(value, path, maxLength = 240) {
            const normalized = String(value ?? '').trim();
            if (!normalized) {
                throw new Error(`${path} è obbligatorio.`);
            }
            if (normalized.length > maxLength) {
                throw new Error(`${path} supera ${maxLength} caratteri.`);
            }
            return normalized;
        }

        function optionalString(value, maxLength = 2000) {
            return String(value ?? '').trim().slice(0, maxLength);
        }

        function validId(value, path) {
            const id = requiredString(value, path, 120);
            if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id)) {
                throw new Error(`${path} contiene caratteri non supportati.`);
            }
            return id;
        }

        function validColor(value, fallback) {
            const color = String(value || fallback).trim();
            return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
        }

        function validDate(value, path) {
            const date = String(value ?? '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new Error(`${path} deve usare il formato YYYY-MM-DD.`);
            }
            const [year, month, day] = date.split('-').map(Number);
            const parsed = new Date(Date.UTC(year, month - 1, day));
            if (
                parsed.getUTCFullYear() !== year
                || parsed.getUTCMonth() !== month - 1
                || parsed.getUTCDate() !== day
            ) {
                throw new Error(`${path} non contiene una data valida.`);
            }
            return date;
        }

        function validTime(value, path) {
            const time = String(value ?? '').trim();
            const match = /^(\d{2}):(\d{2})$/.exec(time);
            if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
                throw new Error(`${path} deve usare un orario HH:MM valido.`);
            }
            return time;
        }

        function timeToMinutes(value) {
            const [hours, minutes] = value.split(':').map(Number);
            return hours * 60 + minutes;
        }

        function finitePositive(value, path, { integer = false, allowNull = false } = {}) {
            if (allowNull && (value === null || value === undefined || value === '')) {
                return null;
            }
            const number = Number(value);
            if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isInteger(number))) {
                throw new Error(`${path} deve essere un numero positivo${integer ? ' intero' : ''}.`);
            }
            return number;
        }

        function uniqueIds(items, path) {
            const ids = new Set();
            items.forEach((item, index) => {
                if (ids.has(item.id)) {
                    throw new Error(`${path}[${index}].id è duplicato (${item.id}).`);
                }
                ids.add(item.id);
            });
        }

        function normalizeLocale(locale) {
            const value = optionalString(locale || 'it-IT', 40) || 'it-IT';
            try {
                new Intl.DateTimeFormat(value);
                return value;
            } catch {
                throw new Error(`Locale non supportato: ${value}.`);
            }
        }

        function normalizeTimeZone(timeZone) {
            const value = optionalString(timeZone || 'UTC', 80) || 'UTC';
            try {
                new Intl.DateTimeFormat('it-IT', { timeZone: value });
                return value;
            } catch {
                throw new Error(`Fuso orario non supportato: ${value}.`);
            }
        }

        function normalizeCategories(input) {
            const categories = requireArray(input, 'categories').map((category, index) => {
                requireObject(category, `categories[${index}]`);
                const role = String(category.role || 'neutral');
                if (!CATEGORY_ROLES.includes(role)) {
                    throw new Error(`categories[${index}].role non è supportato.`);
                }
                return {
                    id: validId(category.id, `categories[${index}].id`),
                    label: requiredString(category.label, `categories[${index}].label`, 80),
                    icon: optionalString(category.icon || '📌', 16) || '📌',
                    color: validColor(category.color, DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
                    role
                };
            });

            uniqueIds(categories, 'categories');
            if (!categories.some(category => category.role === 'focus')) {
                throw new Error('È necessaria almeno una categoria con ruolo focus.');
            }
            return categories;
        }

        function normalizeWeekTemplate(input, categoryIds) {
            const source = requireObject(input, 'weekTemplate');
            const result = createEmptyWeekTemplate();

            DAY_KEYS.forEach(day => {
                const sessions = Array.isArray(source[day]) ? source[day] : [];
                result[day] = sessions.map((session, index) => {
                    requireObject(session, `weekTemplate.${day}[${index}]`);
                    const start = validTime(session.start, `weekTemplate.${day}[${index}].start`);
                    const end = validTime(session.end, `weekTemplate.${day}[${index}].end`);
                    if (timeToMinutes(end) <= timeToMinutes(start)) {
                        throw new Error(`weekTemplate.${day}[${index}] deve terminare dopo l'inizio.`);
                    }
                    const categoryId = validId(session.categoryId, `weekTemplate.${day}[${index}].categoryId`);
                    if (!categoryIds.has(categoryId)) {
                        throw new Error(`Categoria sconosciuta in weekTemplate.${day}[${index}]: ${categoryId}.`);
                    }
                    return {
                        id: validId(session.id || createId('slot'), `weekTemplate.${day}[${index}].id`),
                        start,
                        end,
                        label: optionalString(session.label, 240),
                        categoryId
                    };
                }).sort((left, right) => left.start.localeCompare(right.start));
                uniqueIds(result[day], `weekTemplate.${day}`);
            });

            return result;
        }

        function normalizeMultipliers(input) {
            const source = input && typeof input === 'object' ? input : {};
            return Object.fromEntries(TOPIC_KINDS.map(kind => [
                kind,
                finitePositive(source[kind] ?? 1, `settings.estimationMultipliers.${kind}`)
            ]));
        }

        function normalizeExceptions(input) {
            const exceptions = Array.isArray(input) ? input : [];
            const result = exceptions.map((exception, index) => {
                requireObject(exception, `settings.calendarExceptions[${index}]`);
                return {
                    id: validId(exception.id || createId('exception'), `settings.calendarExceptions[${index}].id`),
                    date: validDate(exception.date, `settings.calendarExceptions[${index}].date`),
                    label: optionalString(exception.label || 'Indisponibile', 160) || 'Indisponibile',
                    focusAvailable: exception.focusAvailable === true
                };
            });
            uniqueIds(result, 'settings.calendarExceptions');
            return result.sort((left, right) => left.date.localeCompare(right.date));
        }

        function normalizeTopic(topic, path) {
            requireObject(topic, path);
            const kind = String(topic.kind || 'other');
            if (!TOPIC_KINDS.includes(kind)) {
                throw new Error(`${path}.kind non è supportato.`);
            }
            return {
                id: validId(topic.id || createId('topic'), `${path}.id`),
                title: requiredString(topic.title, `${path}.title`, 300),
                kind,
                estimatedMinutes: finitePositive(topic.estimatedMinutes, `${path}.estimatedMinutes`, { integer: true })
            };
        }

        function normalizePlan(input) {
            const source = requireObject(input, 'plan');
            if (source.kind !== PLAN_KIND) {
                throw new Error(`Tipo di piano non supportato: ${source.kind || '(mancante)'}.`);
            }
            if (Number(source.schemaVersion) !== SCHEMA_VERSION) {
                throw new Error(`Versione del piano non supportata: ${source.schemaVersion}.`);
            }

            const modules = requireArray(source.modules, 'plan.modules').map((module, index) => {
                const path = `plan.modules[${index}]`;
                requireObject(module, path);
                const mode = String(module.mode || 'work');
                if (!MODULE_MODES.includes(mode)) {
                    throw new Error(`${path}.mode non è supportato.`);
                }
                const topics = Array.isArray(module.topics)
                    ? module.topics.map((topic, topicIndex) => normalizeTopic(topic, `${path}.topics[${topicIndex}]`))
                    : [];
                uniqueIds(topics, `${path}.topics`);
                const normalized = {
                    id: validId(module.id || createId('module'), `${path}.id`),
                    title: requiredString(module.title, `${path}.title`, 240),
                    color: validColor(module.color, DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
                    mode,
                    topics
                };
                if (mode === 'buffer') {
                    normalized.fixedWeeks = finitePositive(module.fixedWeeks ?? 1, `${path}.fixedWeeks`, { integer: true });
                }
                return normalized;
            });
            uniqueIds(modules, 'plan.modules');

            const topicIds = new Set();
            modules.flatMap(module => module.topics).forEach(topic => {
                if (topicIds.has(topic.id)) {
                    throw new Error(`ID argomento duplicato nel piano: ${topic.id}.`);
                }
                topicIds.add(topic.id);
            });

            return {
                kind: PLAN_KIND,
                schemaVersion: SCHEMA_VERSION,
                id: validId(source.id || createId('plan'), 'plan.id'),
                title: requiredString(source.title, 'plan.title', 240),
                description: optionalString(source.description, 2000),
                startDate: validDate(source.startDate, 'plan.startDate'),
                weeklyTargetMinutes: finitePositive(
                    source.weeklyTargetMinutes,
                    'plan.weeklyTargetMinutes',
                    { integer: true, allowNull: true }
                ),
                modules
            };
        }

        function normalizeProgress(input, topicIds) {
            const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
            const result = {};
            Object.entries(source).forEach(([topicId, progress]) => {
                if (!topicIds.has(topicId) || !progress || typeof progress !== 'object') return;
                const completedMinutes = Math.max(0, Math.round(Number(progress.completedMinutes) || 0));
                result[topicId] = {
                    completedMinutes,
                    completed: progress.completed === true
                };
            });
            return result;
        }

        function normalizeV2Database(input) {
            const source = requireObject(input, 'database');
            if (source.kind !== DATABASE_KIND) {
                throw new Error(`Tipo di database non supportato: ${source.kind || '(mancante)'}.`);
            }
            if (Number(source.schemaVersion) !== SCHEMA_VERSION) {
                throw new Error(`Versione database non supportata: ${source.schemaVersion}.`);
            }

            const metadata = requireObject(source.metadata, 'metadata');
            const categories = normalizeCategories(source.categories);
            const categoryIds = new Set(categories.map(category => category.id));
            const plan = normalizePlan(source.plan);
            const topicIds = new Set(plan.modules.flatMap(module => module.topics).map(topic => topic.id));

            return {
                kind: DATABASE_KIND,
                schemaVersion: SCHEMA_VERSION,
                metadata: {
                    id: validId(metadata.id || createId('database'), 'metadata.id'),
                    name: requiredString(metadata.name, 'metadata.name', 160),
                    description: optionalString(metadata.description, 1000),
                    locale: normalizeLocale(metadata.locale),
                    timeZone: normalizeTimeZone(metadata.timeZone),
                    createdAt: optionalString(metadata.createdAt || nowIso(), 40),
                    updatedAt: optionalString(metadata.updatedAt || nowIso(), 40)
                },
                settings: {
                    weekStartsOn: Number(source.settings?.weekStartsOn) === 0 ? 0 : 1,
                    planningMode: 'sequential',
                    estimationMultipliers: normalizeMultipliers(source.settings?.estimationMultipliers),
                    calendarExceptions: normalizeExceptions(source.settings?.calendarExceptions)
                },
                categories,
                weekTemplate: normalizeWeekTemplate(source.weekTemplate, categoryIds),
                plan,
                state: {
                    progress: normalizeProgress(source.state?.progress, topicIds)
                }
            };
        }

        function inferLegacyKind(name) {
            const normalized = String(name || '').toLowerCase();
            if (normalized.startsWith('progetto:') || normalized.includes('progetto')) return 'project';
            if (normalized.includes('esercitazione') || normalized.includes('esercizio')) return 'exercise';
            if (normalized.includes('teoria')) return 'theory';
            if (normalized.includes('pratica') || normalized.includes('laboratorio')) return 'practice';
            return 'other';
        }

        function legacyEffectiveMinutes(module, params = {}) {
            const hours = Number(module.time ?? module.hours ?? module.estimatedHours ?? 0);
            const kind = inferLegacyKind(module.name || module.title);
            if (!Number.isFinite(hours) || hours < 0) return 0;
            if (kind === 'project') return Math.max(hours, Number(params.projectHours) || hours) * 60;
            if (kind === 'exercise') return (Number(params.exerciseHours) || hours) * 60;
            if (kind === 'theory') return hours * (Number(params.theoryMultiplier) || 1) * 60;
            return hours * (Number(params.practiceMultiplier) || 1) * 60;
        }

        function normalizeLegacyProgram(source, params = {}) {
            const rawCourses = Array.isArray(source.courses)
                ? source.courses
                : groupLegacyUnits(source.units || []);

            return {
                kind: PLAN_KIND,
                schemaVersion: SCHEMA_VERSION,
                id: validId(String(source.id || createId('plan')).replace(/[^a-zA-Z0-9._:-]/g, '-'), 'plan.id'),
                title: requiredString(source.title || source.name || 'Programma importato', 'plan.title', 240),
                description: optionalString(source.description, 2000),
                startDate: validDate(source.startDate || todayIso(), 'plan.startDate'),
                weeklyTargetMinutes: source.weeklyTargetMinutes
                    ? Math.round(finitePositive(source.weeklyTargetMinutes, 'plan.weeklyTargetMinutes'))
                    : (source.weeklyHours ? Math.round(finitePositive(source.weeklyHours, 'plan.weeklyHours') * 60) : null),
                modules: rawCourses.map((course, courseIndex) => {
                    const rawTopics = Array.isArray(course.modules) ? course.modules : [];
                    const topics = rawTopics.map((module, topicIndex) => {
                        const title = module.name || module.title || `Argomento ${topicIndex + 1}`;
                        const estimatedMinutes = module.estimatedMinutes !== undefined
                            ? Math.round(finitePositive(module.estimatedMinutes, `units[${topicIndex}].estimatedMinutes`))
                            : Math.max(1, Math.round(legacyEffectiveMinutes(module, params)));
                        return {
                            id: `topic-${courseIndex + 1}-${topicIndex + 1}`,
                            title: requiredString(title, `plan.modules[${courseIndex}].topics[${topicIndex}].title`, 300),
                            kind: inferLegacyKind(title),
                            estimatedMinutes
                        };
                    });

                    if (topics.length === 0 && Number(course.hours) > 0) {
                        topics.push({
                            id: `topic-${courseIndex + 1}-1`,
                            title: `${course.name || course.title} - Attività`,
                            kind: 'other',
                            estimatedMinutes: Math.round(Number(course.hours) * 60)
                        });
                    }

                    const mode = course.isBuffer === true ? 'buffer' : 'work';
                    const module = {
                        id: `module-${courseIndex + 1}`,
                        title: requiredString(course.name || course.title || `Modulo ${courseIndex + 1}`, `plan.modules[${courseIndex}].title`, 240),
                        color: validColor(course.color, DEFAULT_COLORS[courseIndex % DEFAULT_COLORS.length]),
                        mode,
                        topics
                    };
                    if (mode === 'buffer') {
                        module.fixedWeeks = Math.max(1, Math.round(Number(course.fixedWeeks) || 1));
                    }
                    return module;
                })
            };
        }

        function groupLegacyUnits(units) {
            const groups = new Map();
            requireArray(units, 'units')
                .map((unit, index) => ({ ...unit, index }))
                .sort((left, right) => Number(left.order ?? left.index) - Number(right.order ?? right.index))
                .forEach(unit => {
                    const name = String(unit.module || unit.section || 'Programma');
                    if (!groups.has(name)) groups.set(name, []);
                    groups.get(name).push({
                        name: unit.title || unit.name,
                        estimatedMinutes: unit.estimatedMinutes,
                        time: unit.time,
                        hours: unit.hours,
                        estimatedHours: unit.estimatedHours
                    });
                });
            return Array.from(groups.entries()).map(([name, modules]) => ({ name, modules }));
        }

        function migrateLegacyDatabase(input) {
            const warnings = [];
            const legacyCategories = Array.isArray(input.categories) && input.categories.length
                ? input.categories
                : [
                    { id: 'study', label: 'Studio', icon: '📚' },
                    { id: 'other', label: 'Altro', icon: '📌' }
                ];

            const categories = legacyCategories.map((category, index) => ({
                id: String(category.id || `category-${index + 1}`).replace(/[^a-zA-Z0-9._:-]/g, '-'),
                label: category.label || category.name || `Categoria ${index + 1}`,
                icon: category.icon || '📌',
                color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                role: String(category.id) === 'study' ? 'focus' : 'busy'
            }));
            if (!categories.some(category => category.role === 'focus')) {
                categories.unshift({ id: 'focus', label: 'Studio', icon: '📚', color: '#2563eb', role: 'focus' });
            }

            const weekTemplate = createEmptyWeekTemplate();
            Object.entries(input.weekTemplate || {}).forEach(([legacyDay, sessions]) => {
                const day = LEGACY_DAY_MAP[legacyDay];
                if (!day || !Array.isArray(sessions)) return;
                weekTemplate[day] = sessions.map((session, index) => {
                    const [start = '09:00', end = '10:00'] = String(session.time || '').split('-');
                    return {
                        id: `${day}-${index + 1}`,
                        start: start.trim(),
                        end: end.trim(),
                        label: session.content || '',
                        categoryId: session.type || 'other'
                    };
                });
            });

            const legacyStateHasContent = Object.keys(input.state?.weeklySchedules || {}).length
                || Object.keys(input.state?.courseTopics || {}).length;
            if (legacyStateHasContent) {
                warnings.push('Le personalizzazioni settimanali cache del formato v1 non sono state migrate; il piano è stato rigenerato.');
            }

            const timestamp = nowIso();
            const migrated = {
                kind: DATABASE_KIND,
                schemaVersion: SCHEMA_VERSION,
                metadata: {
                    id: 'migrated-database',
                    name: input.metadata?.name || 'Database migrato',
                    description: 'Migrato automaticamente dal formato organizer v1',
                    locale: 'it-IT',
                    timeZone: 'Europe/Rome',
                    createdAt: input.metadata?.createdAt || timestamp,
                    updatedAt: timestamp
                },
                settings: {
                    weekStartsOn: 1,
                    planningMode: 'sequential',
                    estimationMultipliers: Object.fromEntries(TOPIC_KINDS.map(kind => [kind, 1])),
                    calendarExceptions: []
                },
                categories,
                weekTemplate,
                plan: normalizeLegacyProgram(input.studyProgram || {}, input.settings?.calculationParams),
                state: { progress: {} }
            };

            return { database: normalizeV2Database(migrated), warnings };
        }

        function normalizeDatabase(input) {
            const source = clone(input);
            if (source?.kind === DATABASE_KIND) {
                return { database: normalizeV2Database(source), migrated: false, warnings: [] };
            }
            if (source?.kind === 'organizer-database' || source?.studyProgram) {
                const result = migrateLegacyDatabase(source);
                return { ...result, migrated: true };
            }
            throw new Error('Il file non è un database Learning Path Planner supportato.');
        }

        function normalizePlanInput(input) {
            const source = clone(input);
            if (source?.kind === PLAN_KIND) {
                return normalizePlan(source);
            }
            if (source?.kind === DATABASE_KIND) {
                return normalizeV2Database(source).plan;
            }
            if (source?.kind === 'organizer-database') {
                return migrateLegacyDatabase(source).database.plan;
            }
            if (source?.kind === 'study-program' || Array.isArray(source?.courses) || Array.isArray(source?.units)) {
                return normalizePlan(normalizeLegacyProgram(source));
            }
            throw new Error('Il file non contiene un programma di apprendimento supportato.');
        }

        function updateDatabase(database, updater) {
            const draft = clone(database);
            updater(draft);
            draft.metadata.updatedAt = nowIso();
            return normalizeV2Database(draft);
        }

        function snapshotDatabase(database) {
            const snapshot = clone(database);
            snapshot.metadata.updatedAt = nowIso();
            return normalizeV2Database(snapshot);
        }

        function replacePlan(database, planInput) {
            const plan = normalizePlanInput(planInput);
            return updateDatabase(database, draft => {
                draft.plan = plan;
                draft.state = { progress: {} };
            });
        }

        return { DATABASE_KIND, PLAN_KIND, SCHEMA_VERSION, DAY_KEYS, TOPIC_KINDS, CATEGORY_ROLES, MODULE_MODES, createId, createEmptyWeekTemplate, createEmptyDatabase, databaseHasContent, normalizeDatabase, normalizePlanInput, updateDatabase, snapshotDatabase, replacePlan };
    })();

    const plannerApi = (() => {
        const { DAY_KEYS, TOPIC_KINDS } = modelApi;

        const DAY_BY_UTC_INDEX = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];

        function parseIsoDate(value) {
            const [year, month, day] = String(value).split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        }

        function toIsoDate(date) {
            return [
                date.getUTCFullYear(),
                String(date.getUTCMonth() + 1).padStart(2, '0'),
                String(date.getUTCDate()).padStart(2, '0')
            ].join('-');
        }

        function addDays(date, days) {
            const result = new Date(date.getTime());
            result.setUTCDate(result.getUTCDate() + days);
            return result;
        }

        function daysBetween(start, end) {
            return Math.round((parseIsoDate(end) - parseIsoDate(start)) / 86_400_000);
        }

        function getTimelineMonths(startDate, endDate, locale = 'it-IT') {
            const start = parseIsoDate(startDate);
            const end = parseIsoDate(endDate);
            if (end < start) return [];

            const shortFormatter = new Intl.DateTimeFormat(locale, {
                month: 'short',
                timeZone: 'UTC'
            });
            const longFormatter = new Intl.DateTimeFormat(locale, {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
            const segments = [];
            let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

            while (cursor <= end) {
                const nextMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
                const visibleStart = cursor < start ? start : cursor;
                const monthEnd = addDays(nextMonth, -1);
                const visibleEnd = monthEnd > end ? end : monthEnd;
                const year = cursor.getUTCFullYear();
                const month = cursor.getUTCMonth() + 1;
                const label = shortFormatter.format(cursor).replace(/\.$/, '');

                segments.push({
                    id: `${year}-${String(month).padStart(2, '0')}`,
                    label,
                    displayLabel: month === 1 ? `${label} ${year}` : label,
                    fullLabel: longFormatter.format(cursor),
                    year,
                    month,
                    offsetDays: daysBetween(startDate, toIsoDate(visibleStart)),
                    durationDays: daysBetween(toIsoDate(visibleStart), toIsoDate(visibleEnd)) + 1
                });
                cursor = nextMonth;
            }

            return segments;
        }

        function minutesBetween(start, end) {
            const [startHours, startMinutes] = start.split(':').map(Number);
            const [endHours, endMinutes] = end.split(':').map(Number);
            return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        }

        function dayKeyForDate(date) {
            return DAY_BY_UTC_INDEX[date.getUTCDay()];
        }

        function focusCategoryIds(database) {
            return new Set(
                database.categories
                    .filter(category => category.role === 'focus')
                    .map(category => category.id)
            );
        }

        function categoryMap(database) {
            return new Map(database.categories.map(category => [category.id, category]));
        }

        function effectiveTopicMinutes(topic, multipliers = {}) {
            const kind = TOPIC_KINDS.includes(topic.kind) ? topic.kind : 'other';
            const multiplier = Number(multipliers[kind]) || 1;
            return Math.max(1, Math.round(Number(topic.estimatedMinutes) * multiplier));
        }

        function moduleEffectiveMinutes(module, multipliers = {}) {
            if (module.mode === 'buffer') return 0;
            return module.topics.reduce(
                (total, topic) => total + effectiveTopicMinutes(topic, multipliers),
                0
            );
        }

        function getWeeklyCapacity(database) {
            const focusIds = focusCategoryIds(database);
            return DAY_KEYS.reduce((total, day) => {
                return total + database.weekTemplate[day]
                    .filter(session => focusIds.has(session.categoryId))
                    .reduce((subtotal, session) => subtotal + minutesBetween(session.start, session.end), 0);
            }, 0);
        }

        function exceptionForDate(database, date) {
            const isoDate = toIsoDate(date);
            return database.settings.calendarExceptions.find(exception => exception.date === isoDate) || null;
        }

        function getWeekTemplateForStart(database, weekStart) {
            const focusIds = focusCategoryIds(database);
            const categories = categoryMap(database);

            return Array.from({ length: 7 }, (_, dayOffset) => {
                const date = addDays(weekStart, dayOffset);
                const dateKey = toIsoDate(date);
                const dayKey = dayKeyForDate(date);
                const exception = exceptionForDate(database, date);
                const sessions = (database.weekTemplate[dayKey] || []).map(session => {
                    const category = categories.get(session.categoryId);
                    const isFocus = focusIds.has(session.categoryId);
                    const blocked = Boolean(isFocus && exception && !exception.focusAvailable);
                    return {
                        ...session,
                        date: dateKey,
                        dayKey,
                        category,
                        isFocus,
                        blocked,
                        exceptionLabel: blocked ? exception.label : ''
                    };
                });

                return { date, dateKey, dayKey, exception, sessions };
            });
        }

        function getWeekCapacity(database, weekStart) {
            return getWeekTemplateForStart(database, weekStart)
                .flatMap(day => day.sessions)
                .filter(session => session.isFocus && !session.blocked)
                .reduce((total, session) => total + minutesBetween(session.start, session.end), 0);
        }

        function effectiveTargetForWeek(database, weekStart) {
            const availableMinutes = getWeekCapacity(database, weekStart);
            const requestedMinutes = database.plan.weeklyTargetMinutes ?? availableMinutes;
            return {
                availableMinutes,
                requestedMinutes,
                plannedMinutes: Math.min(availableMinutes, requestedMinutes)
            };
        }

        function allocateModuleWeeks(database, startDate, totalMinutes, warnings) {
            if (totalMinutes <= 0) return [];
            const baseCapacity = getWeeklyCapacity(database);
            if (baseCapacity <= 0) {
                warnings.push('Non esistono slot focus: gli argomenti non possono essere schedulati.');
                return [];
            }

            const capacities = [];
            let remainingMinutes = totalMinutes;
            let weekStart = startDate;
            let guard = 0;

            while (remainingMinutes > 0 && guard < 5200) {
                const capacity = effectiveTargetForWeek(database, weekStart).plannedMinutes;
                capacities.push(capacity);
                remainingMinutes -= capacity;
                weekStart = addDays(weekStart, 7);
                guard += 1;
            }

            if (remainingMinutes > 0) {
                warnings.push('La pianificazione supera il limite di sicurezza di 100 anni.');
            }
            return capacities;
        }

        function buildPlanSchedule(database) {
            const baseCapacityMinutes = getWeeklyCapacity(database);
            const requestedTargetMinutes = database.plan.weeklyTargetMinutes ?? baseCapacityMinutes;
            const warnings = [];

            if (baseCapacityMinutes === 0 && database.plan.modules.some(module => module.mode === 'work' && module.topics.length)) {
                warnings.push('Aggiungi almeno uno slot appartenente a una categoria focus.');
            }
            if (requestedTargetMinutes > baseCapacityMinutes && baseCapacityMinutes > 0) {
                warnings.push(
                    `Il target di ${formatDuration(requestedTargetMinutes)} supera la capacità settimanale di ${formatDuration(baseCapacityMinutes)}; viene usata la capacità reale.`
                );
            }

            let cursor = parseIsoDate(database.plan.startDate);
            const modules = database.plan.modules.map(module => {
                const totalMinutes = moduleEffectiveMinutes(module, database.settings.estimationMultipliers);
                const start = new Date(cursor.getTime());
                const weekCapacities = module.mode === 'buffer'
                    ? Array.from({ length: module.fixedWeeks }, () => 0)
                    : allocateModuleWeeks(database, start, totalMinutes, warnings);
                const weeks = weekCapacities.length;
                const durationDays = Math.max(weeks * 7, 1);
                const end = addDays(start, durationDays - 1);

                if (weeks > 0) {
                    cursor = addDays(start, weeks * 7);
                }

                return {
                    ...module,
                    totalMinutes,
                    weeks,
                    startDate: toIsoDate(start),
                    endDate: toIsoDate(end),
                    weekCapacities,
                    unscheduled: module.mode === 'work' && totalMinutes > 0 && weeks === 0
                };
            });

            const lastScheduled = [...modules].reverse().find(module => module.weeks > 0);
            const totalMinutes = modules.reduce((total, module) => total + module.totalMinutes, 0);
            const totalWeeks = modules.reduce((total, module) => total + module.weeks, 0);

            return {
                modules,
                totalMinutes,
                totalWeeks,
                baseCapacityMinutes,
                requestedTargetMinutes,
                effectiveWeeklyTargetMinutes: Math.min(requestedTargetMinutes, baseCapacityMinutes),
                startDate: database.plan.startDate,
                endDate: lastScheduled?.endDate || database.plan.startDate,
                warnings: [...new Set(warnings)]
            };
        }

        function getModuleWeekAllocations(database, moduleId, weekIndex) {
            const schedule = buildPlanSchedule(database);
            const scheduledModule = schedule.modules.find(module => module.id === moduleId);
            const sourceModule = database.plan.modules.find(module => module.id === moduleId);
            if (!scheduledModule || !sourceModule || sourceModule.mode === 'buffer') return [];
            if (weekIndex < 0 || weekIndex >= scheduledModule.weeks) return [];

            const startOffset = scheduledModule.weekCapacities
                .slice(0, weekIndex)
                .reduce((total, capacity) => total + capacity, 0);
            const endOffset = startOffset + scheduledModule.weekCapacities[weekIndex];
            let topicStart = 0;
            const allocations = [];

            sourceModule.topics.forEach(topic => {
                const topicMinutes = effectiveTopicMinutes(topic, database.settings.estimationMultipliers);
                const topicEnd = topicStart + topicMinutes;
                const overlapStart = Math.max(topicStart, startOffset);
                const overlapEnd = Math.min(topicEnd, endOffset);
                if (overlapEnd > overlapStart) {
                    allocations.push({
                        topicId: topic.id,
                        title: topic.title,
                        kind: topic.kind,
                        minutes: overlapEnd - overlapStart
                    });
                }
                topicStart = topicEnd;
            });

            return allocations;
        }

        function distributeAllocationsToSessions(days, allocations, isBuffer) {
            const queue = allocations.map(allocation => ({ ...allocation, remaining: allocation.minutes }));

            days.forEach(day => {
                day.sessions.forEach(session => {
                    session.assignments = [];
                    if (!session.isFocus) return;
                    if (session.blocked) return;
                    if (isBuffer) {
                        session.buffer = true;
                        return;
                    }

                    let remainingInSession = minutesBetween(session.start, session.end);
                    while (remainingInSession > 0 && queue.length > 0) {
                        const current = queue[0];
                        const minutes = Math.min(remainingInSession, current.remaining);
                        session.assignments.push({
                            topicId: current.topicId,
                            title: current.title,
                            kind: current.kind,
                            minutes
                        });
                        current.remaining -= minutes;
                        remainingInSession -= minutes;
                        if (current.remaining <= 0) queue.shift();
                    }
                    session.freeMinutes = remainingInSession;
                });
            });
        }

        function getWeekAgenda(database, moduleId, weekIndex) {
            const schedule = buildPlanSchedule(database);
            const module = schedule.modules.find(item => item.id === moduleId);
            if (!module || weekIndex < 0 || weekIndex >= module.weeks) return null;

            const weekStart = addDays(parseIsoDate(module.startDate), weekIndex * 7);
            const days = getWeekTemplateForStart(database, weekStart);
            const allocations = getModuleWeekAllocations(database, moduleId, weekIndex);
            distributeAllocationsToSessions(days, allocations, module.mode === 'buffer');

            return {
                module,
                weekIndex,
                weekNumber: weekIndex + 1,
                weekStart: toIsoDate(weekStart),
                weekEnd: toIsoDate(addDays(weekStart, 6)),
                plannedMinutes: module.weekCapacities[weekIndex],
                availableMinutes: getWeekCapacity(database, weekStart),
                allocations,
                days
            };
        }

        function formatDuration(minutes) {
            const value = Number(minutes) || 0;
            const hours = Math.floor(value / 60);
            const remainder = value % 60;
            if (hours === 0) return `${remainder} min`;
            if (remainder === 0) return `${hours} h`;
            return `${hours} h ${remainder} min`;
        }

        function formatDate(date, locale = 'it-IT', options = {}) {
            return new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'short',
                year: options.year ? 'numeric' : undefined,
                timeZone: 'UTC'
            }).format(parseIsoDate(date));
        }

        function formatDayName(date, locale = 'it-IT') {
            return new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC'
            }).format(date);
        }

        return { parseIsoDate, toIsoDate, addDays, daysBetween, getTimelineMonths, minutesBetween, effectiveTopicMinutes, moduleEffectiveMinutes, getWeeklyCapacity, getWeekTemplateForStart, getWeekCapacity, buildPlanSchedule, getModuleWeekAllocations, getWeekAgenda, formatDuration, formatDate, formatDayName };
    })();

    const configurationApi = (() => {
        const DATABASE_CONFIGURATION_KIND = 'learning-planner-db-configuration';
        const DATABASE_CONFIGURATION_VERSION = 1;
        const DATABASE_CONFIGURATION_FILE = 'db-configuration.json';
        const DATABASE_CONFIGURATION_URL = `data/user/${DATABASE_CONFIGURATION_FILE}`;
        const DEFAULT_DATABASE_PATH = 'data/user/organizer-data.json';

        function configurationError(message) {
            return new Error(`Configurazione database non valida: ${message}`);
        }

        function normalizeDatabasePath(value) {
            const path = String(value || '')
                .trim()
                .replace(/\\/g, '/')
                .replace(/^\.\//, '');

            if (!path) throw configurationError('il percorso del file è obbligatorio');
            if (path.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
                throw configurationError('il percorso deve essere relativo alla root del progetto');
            }

            const segments = path.split('/');
            if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
                throw configurationError('il percorso contiene segmenti non consentiti');
            }
            if (segments.some(segment => /[<>:"|?*#\u0000-\u001f]/.test(segment))) {
                throw configurationError('il percorso contiene caratteri non consentiti');
            }

            const fileName = segments.at(-1);
            if (!fileName.toLowerCase().endsWith('.json')) {
                throw configurationError('il file deve avere estensione .json');
            }
            if (fileName.toLowerCase() === DATABASE_CONFIGURATION_FILE) {
                throw configurationError(`${DATABASE_CONFIGURATION_FILE} è riservato alla configurazione`);
            }
            return segments.join('/');
        }

        function emptyDatabaseConfiguration() {
            return {
                kind: DATABASE_CONFIGURATION_KIND,
                schemaVersion: DATABASE_CONFIGURATION_VERSION
            };
        }

        function createDatabaseConfiguration(databasePath) {
            const configuration = emptyDatabaseConfiguration();
            if (!String(databasePath || '').trim()) return configuration;
            configuration.defaultDatabase = normalizeDatabasePath(databasePath);
            return configuration;
        }

        function normalizeDatabaseConfiguration(input) {
            if (!input || typeof input !== 'object' || Array.isArray(input)) {
                throw configurationError('il contenuto deve essere un oggetto JSON');
            }
            if (input.kind !== DATABASE_CONFIGURATION_KIND) {
                throw configurationError(`kind deve essere ${DATABASE_CONFIGURATION_KIND}`);
            }
            if (input.schemaVersion !== DATABASE_CONFIGURATION_VERSION) {
                throw configurationError(`schemaVersion deve essere ${DATABASE_CONFIGURATION_VERSION}`);
            }
            if (input.defaultDatabase === undefined || input.defaultDatabase === null || input.defaultDatabase === '') {
                return emptyDatabaseConfiguration();
            }
            if (typeof input.defaultDatabase !== 'string') {
                throw configurationError('defaultDatabase deve essere un percorso testuale');
            }
            return createDatabaseConfiguration(input.defaultDatabase);
        }

        function databaseUrlFromConfiguration(configuration) {
            const normalized = normalizeDatabaseConfiguration(configuration);
            if (!normalized.defaultDatabase) return null;
            return normalized.defaultDatabase
                .split('/')
                .map(segment => encodeURIComponent(segment))
                .join('/');
        }

        function databaseFileNameFromPath(databasePath) {
            return normalizeDatabasePath(databasePath).split('/').at(-1);
        }

        return { DATABASE_CONFIGURATION_KIND, DATABASE_CONFIGURATION_VERSION, DATABASE_CONFIGURATION_FILE, DATABASE_CONFIGURATION_URL, DEFAULT_DATABASE_PATH, normalizeDatabasePath, emptyDatabaseConfiguration, createDatabaseConfiguration, normalizeDatabaseConfiguration, databaseUrlFromConfiguration, databaseFileNameFromPath };
    })();

    const localDatabaseApi = (() => {
        const LOCAL_DATABASE_NAME = 'learning-path-planner';
        const LOCAL_DATABASE_VERSION = 1;
        const LOCAL_DATABASE_STORE = 'application-state';
        const LOCAL_DATABASE_KEY = 'active-database';
        const LOCAL_DATABASE_KIND = 'learning-planner-local-state';
        const LOCAL_DATABASE_SCHEMA_VERSION = 1;

        function storageError(message, cause) {
            return new Error(`Archivio locale non disponibile: ${message}`, { cause });
        }

        function requestResult(request) {
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || storageError('operazione IndexedDB non riuscita'));
            });
        }

        function transactionCompleted(transaction) {
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onabort = () => reject(transaction.error || storageError('transazione IndexedDB annullata'));
                transaction.onerror = () => reject(transaction.error || storageError('transazione IndexedDB non riuscita'));
            });
        }

        function isDirectFileMode() {
            return globalThis.location?.protocol === 'file:';
        }

        function createLocalDatabaseRecord({
            database,
            fileName,
            dirty,
            activeDatabasePath,
            databaseConfiguration
        }) {
            return {
                kind: LOCAL_DATABASE_KIND,
                schemaVersion: LOCAL_DATABASE_SCHEMA_VERSION,
                database,
                fileName,
                dirty: Boolean(dirty),
                activeDatabasePath,
                databaseConfiguration,
                savedAt: new Date().toISOString()
            };
        }

        function normalizeLocalDatabaseRecord(input) {
            if (input === undefined || input === null) return null;
            if (!input || typeof input !== 'object' || Array.isArray(input)) {
                throw storageError('il contenuto salvato non è un oggetto valido');
            }
            if (input.kind !== LOCAL_DATABASE_KIND || input.schemaVersion !== LOCAL_DATABASE_SCHEMA_VERSION) {
                throw storageError('formato della copia locale non supportato');
            }
            if (!input.database || typeof input.database !== 'object' || Array.isArray(input.database)) {
                throw storageError('database salvato mancante o non valido');
            }

            return {
                ...input,
                fileName: String(input.fileName || 'organizer-data.json'),
                dirty: Boolean(input.dirty)
            };
        }

        class IndexedDbDatabaseCache {
            #indexedDb;

            constructor(indexedDb = globalThis.indexedDB) {
                this.#indexedDb = indexedDb;
            }

            async #open() {
                if (!this.#indexedDb?.open) {
                    throw storageError('IndexedDB non è supportato o è stato disabilitato');
                }

                return new Promise((resolve, reject) => {
                    let request;
                    try {
                        request = this.#indexedDb.open(LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION);
                    } catch (error) {
                        reject(storageError(error.message, error));
                        return;
                    }

                    request.onupgradeneeded = () => {
                        const database = request.result;
                        if (!database.objectStoreNames.contains(LOCAL_DATABASE_STORE)) {
                            database.createObjectStore(LOCAL_DATABASE_STORE);
                        }
                    };
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(storageError(request.error?.message || 'apertura non riuscita', request.error));
                    request.onblocked = () => reject(storageError('aggiornamento bloccato da un’altra scheda aperta'));
                });
            }

            async load() {
                const database = await this.#open();
                try {
                    const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readonly');
                    return await requestResult(transaction.objectStore(LOCAL_DATABASE_STORE).get(LOCAL_DATABASE_KEY));
                } finally {
                    database.close();
                }
            }

            async save(record) {
                const database = await this.#open();
                try {
                    const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readwrite');
                    transaction.objectStore(LOCAL_DATABASE_STORE).put(record, LOCAL_DATABASE_KEY);
                    await transactionCompleted(transaction);
                } finally {
                    database.close();
                }
            }

            async clear() {
                const database = await this.#open();
                try {
                    const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readwrite');
                    transaction.objectStore(LOCAL_DATABASE_STORE).delete(LOCAL_DATABASE_KEY);
                    await transactionCompleted(transaction);
                } finally {
                    database.close();
                }
            }
        }

        return { LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION, LOCAL_DATABASE_STORE, LOCAL_DATABASE_KEY, LOCAL_DATABASE_KIND, LOCAL_DATABASE_SCHEMA_VERSION, isDirectFileMode, createLocalDatabaseRecord, normalizeLocalDatabaseRecord, IndexedDbDatabaseCache };
    })();

    const storeApi = (() => {
        const { createEmptyDatabase, normalizeDatabase, replacePlan, snapshotDatabase, updateDatabase } = modelApi;
        const { DATABASE_CONFIGURATION_FILE, DATABASE_CONFIGURATION_URL, DEFAULT_DATABASE_PATH, createDatabaseConfiguration, databaseFileNameFromPath, databaseUrlFromConfiguration, emptyDatabaseConfiguration, normalizeDatabaseConfiguration } = configurationApi;
        const { IndexedDbDatabaseCache, createLocalDatabaseRecord, isDirectFileMode, normalizeLocalDatabaseRecord } = localDatabaseApi;

        const USER_DATABASE_URL = DEFAULT_DATABASE_PATH;
        const EXAMPLE_DATABASE_URL = 'data/examples/organizer-example.json';
        const CONFIGURATION_WARNING_PREFIX = 'Configurazione database:';
        const LOCAL_DATABASE_WARNING_PREFIX = 'Archivio locale:';

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        function safeFileName(value, fallback = 'learning-planner.json') {
            const name = String(value || '')
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9._-]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase();
            return name ? `${name.replace(/\.json$/i, '')}.json` : fallback;
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

        async function readJsonFile(file) {
            const text = await file.text();
            try {
                return JSON.parse(text);
            } catch (error) {
                throw new Error(`JSON non valido in ${file.name}: ${error.message}`);
            }
        }

        async function fetchJson(url) {
            if (globalThis.location?.protocol === 'file:') {
                const error = new Error('lettura automatica non consentita in modalità file locale');
                error.status = 404;
                throw error;
            }

            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                throw error;
            }

            try {
                return await response.json();
            } catch (error) {
                throw new Error(`JSON non valido in ${url}: ${error.message}`);
            }
        }

        class PlannerStore {
            #database = null;
            #dirty = false;
            #fileName = 'learning-planner.json';
            #isDemo = false;
            #hasActiveDatabase = false;
            #databaseConfiguration = emptyDatabaseConfiguration();
            #activeDatabasePath = USER_DATABASE_URL;
            #listeners = new Set();
            #status = { message: 'Inizializzazione…', level: 'info' };
            #warnings = [];
            #localDatabaseCache;
            #localPersistenceQueue = Promise.resolve();

            constructor({ localDatabaseCache } = {}) {
                this.#localDatabaseCache = localDatabaseCache || new IndexedDbDatabaseCache();
            }

            get database() {
                return this.#database ? clone(this.#database) : null;
            }

            get dirty() {
                return this.#dirty;
            }

            get fileName() {
                return this.#fileName;
            }

            get isDemo() {
                return this.#isDemo;
            }

            get hasActiveDatabase() {
                return this.#hasActiveDatabase;
            }

            get databaseConfiguration() {
                return clone(this.#databaseConfiguration);
            }

            get usesLocalDatabase() {
                return isDirectFileMode();
            }

            get status() {
                return { ...this.#status, dirty: this.#dirty, warnings: [...this.#warnings] };
            }

            subscribe(listener) {
                this.#listeners.add(listener);
                return () => this.#listeners.delete(listener);
            }

            #emit() {
                const snapshot = {
                    database: this.database,
                    dirty: this.#dirty,
                    fileName: this.#fileName,
                    isDemo: this.#isDemo,
                    hasActiveDatabase: this.#hasActiveDatabase,
                    databaseConfiguration: this.databaseConfiguration,
                    status: this.status
                };
                this.#listeners.forEach(listener => listener(snapshot));
            }

            #setStatus(message, level = 'info') {
                this.#status = { message, level };
            }

            #removeLocalDatabaseWarnings() {
                this.#warnings = this.#warnings.filter(warning => !warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX));
            }

            #handleLocalDatabaseError(error) {
                this.#removeLocalDatabaseWarnings();
                this.#warnings.push(`${LOCAL_DATABASE_WARNING_PREFIX} ${error.message || String(error)}`);
                this.#setStatus('Copia locale non aggiornata; esporta un JSON per non perdere le modifiche', 'warning');
                this.#emit();
            }

            #localDatabaseRecord() {
                return createLocalDatabaseRecord({
                    database: this.#database,
                    fileName: this.#fileName,
                    dirty: this.#dirty,
                    activeDatabasePath: this.#activeDatabasePath,
                    databaseConfiguration: this.#databaseConfiguration
                });
            }

            #queueLocalPersistence() {
                if (!this.usesLocalDatabase || !this.#database) return Promise.resolve();
                const record = this.#localDatabaseRecord();
                this.#localPersistenceQueue = this.#localPersistenceQueue
                    .catch(() => undefined)
                    .then(() => this.#localDatabaseCache.save(record))
                    .then(() => {
                        const hadWarnings = this.#warnings.some(warning => warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX));
                        this.#removeLocalDatabaseWarnings();
                        if (hadWarnings) this.#emit();
                    })
                    .catch(error => this.#handleLocalDatabaseError(error));
                return this.#localPersistenceQueue;
            }

            async flushLocalPersistence() {
                await this.#localPersistenceQueue;
            }

            #useEmptyLocalDatabase(extraWarnings = []) {
                this.#database = createEmptyDatabase();
                this.#dirty = false;
                this.#fileName = 'organizer-data.json';
                this.#isDemo = false;
                this.#hasActiveDatabase = false;
                this.#databaseConfiguration = emptyDatabaseConfiguration();
                this.#activeDatabasePath = USER_DATABASE_URL;
                this.#warnings = [...extraWarnings];
                this.#setStatus('Nessun database locale: usa Apri database o Nuovo', extraWarnings.length ? 'warning' : 'info');
                this.#emit();
            }

            async #initializeLocalDatabase() {
                try {
                    const record = normalizeLocalDatabaseRecord(await this.#localDatabaseCache.load());
                    if (!record) {
                        this.#useEmptyLocalDatabase();
                        return;
                    }

                    const startupWarnings = [];
                    let databaseConfiguration = emptyDatabaseConfiguration();
                    try {
                        databaseConfiguration = normalizeDatabaseConfiguration(
                            record.databaseConfiguration || emptyDatabaseConfiguration()
                        );
                    } catch (error) {
                        startupWarnings.push(`${LOCAL_DATABASE_WARNING_PREFIX} configurazione ignorata (${error.message})`);
                    }

                    const activeDatabasePath = databaseConfiguration.defaultDatabase || USER_DATABASE_URL;
                    const result = this.#apply(record.database, {
                        fileName: record.fileName,
                        dirty: record.dirty,
                        message: 'Database locale ripristinato da IndexedDB',
                        level: startupWarnings.length ? 'warning' : (record.dirty ? 'warning' : 'success'),
                        isDemo: false,
                        extraWarnings: startupWarnings,
                        activeDatabasePath,
                        databaseConfiguration
                    });
                    if (result.migrated) await this.#queueLocalPersistence();
                } catch (error) {
                    this.#useEmptyLocalDatabase([`${LOCAL_DATABASE_WARNING_PREFIX} ${error.message || String(error)}`]);
                }
            }

            #apply(input, {
                fileName,
                dirty = false,
                message,
                level,
                isDemo = false,
                extraWarnings = [],
                activeDatabasePath,
                databaseConfiguration
            } = {}) {
                const result = normalizeDatabase(input);
                this.#database = result.database;
                this.#hasActiveDatabase = true;
                this.#warnings = [...(result.warnings || []), ...extraWarnings];
                this.#fileName = fileName || safeFileName(result.database.metadata.name);
                this.#isDemo = isDemo;
                this.#dirty = dirty || result.migrated;
                if (activeDatabasePath) this.#activeDatabasePath = activeDatabasePath;
                if (databaseConfiguration) this.#databaseConfiguration = databaseConfiguration;
                this.#setStatus(
                    message || (result.migrated
                        ? 'Database v1 migrato: salva una copia nel formato v2'
                        : `Aperto ${this.#fileName}`),
                    level || (this.#dirty || this.#warnings.length ? 'warning' : 'success')
                );
                this.#emit();
                return result;
            }

            async initialize() {
                if (this.usesLocalDatabase) {
                    await this.#initializeLocalDatabase();
                    return;
                }

                const startupWarnings = [];
                let configurationPayload = null;

                try {
                    configurationPayload = await fetchJson(DATABASE_CONFIGURATION_URL);
                } catch (error) {
                    this.#databaseConfiguration = emptyDatabaseConfiguration();
                    if (error.status !== 404) {
                        startupWarnings.push(
                            `${CONFIGURATION_WARNING_PREFIX} ${DATABASE_CONFIGURATION_URL} non utilizzabile (${error.message}); caricato il fallback successivo.`
                        );
                    }
                }

                if (configurationPayload) {
                    try {
                        this.#databaseConfiguration = normalizeDatabaseConfiguration(configurationPayload);
                    } catch (error) {
                        this.#databaseConfiguration = emptyDatabaseConfiguration();
                        startupWarnings.push(
                            `${CONFIGURATION_WARNING_PREFIX} ${error.message}; caricato il fallback successivo.`
                        );
                    }
                }

                const configuredDatabaseUrl = databaseUrlFromConfiguration(this.#databaseConfiguration);
                if (configuredDatabaseUrl) {
                    try {
                        const payload = await fetchJson(configuredDatabaseUrl);
                        this.#apply(payload, {
                            fileName: databaseFileNameFromPath(this.#databaseConfiguration.defaultDatabase),
                            message: `Database predefinito caricato: ${configuredDatabaseUrl}`,
                            extraWarnings: startupWarnings,
                            activeDatabasePath: this.#databaseConfiguration.defaultDatabase
                        });
                        return;
                    } catch (error) {
                        startupWarnings.push(
                            `${CONFIGURATION_WARNING_PREFIX} impossibile caricare ${configuredDatabaseUrl} (${error.message}); caricato il fallback successivo.`
                        );
                    }
                }

                await this.#loadFallbackDatabase(startupWarnings);
            }

            async #loadFallbackDatabase(startupWarnings) {
                let userDatabaseError;

                try {
                    const payload = await fetchJson(USER_DATABASE_URL);
                    this.#apply(payload, {
                        fileName: 'organizer-data.json',
                        extraWarnings: startupWarnings,
                        activeDatabasePath: USER_DATABASE_URL
                    });
                    return;
                } catch (error) {
                    userDatabaseError = error;
                }

                try {
                    const payload = await fetchJson(EXAMPLE_DATABASE_URL);
                    this.#apply(payload, {
                        fileName: 'learning-planner-example.json',
                        message: 'Nessun database utente: esempio generico caricato',
                        level: startupWarnings.length === 0 ? 'success' : 'warning',
                        isDemo: true,
                        extraWarnings: startupWarnings,
                        activeDatabasePath: USER_DATABASE_URL
                    });
                } catch (exampleError) {
                    this.#database = createEmptyDatabase();
                    this.#hasActiveDatabase = true;
                    this.#dirty = true;
                    this.#fileName = 'learning-planner.json';
                    this.#isDemo = false;
                    this.#activeDatabasePath = USER_DATABASE_URL;
                    this.#warnings = [
                        ...startupWarnings,
                        `Database fallback non disponibili: ${userDatabaseError.message}; ${exampleError.message}`
                    ];
                    this.#setStatus(
                        `Database utente ed esempio non disponibili: ${exampleError.message}`,
                        'warning'
                    );
                    this.#emit();
                }
            }

            #removeConfigurationWarnings() {
                this.#warnings = this.#warnings.filter(warning => !warning.startsWith(CONFIGURATION_WARNING_PREFIX));
            }

            setDefaultDatabaseConfiguration(databasePath) {
                const configuration = createDatabaseConfiguration(databasePath);
                this.#databaseConfiguration = configuration;
                this.#activeDatabasePath = configuration.defaultDatabase || USER_DATABASE_URL;
                this.#dirty = true;
                this.#removeConfigurationWarnings();
                this.#setStatus(
                    configuration.defaultDatabase
                        ? `Percorso database aggiornato: premi Salva per scaricare ${DATABASE_CONFIGURATION_FILE}`
                        : `Database convenzionale ripristinato: al salvataggio verrà scaricato organizer-data.json`,
                    'warning'
                );
                this.#emit();
                void this.#queueLocalPersistence();
            }

            useConventionalDatabaseFallback(reason) {
                const message = reason?.message || String(reason || 'percorso non valido');
                this.#databaseConfiguration = emptyDatabaseConfiguration();
                this.#activeDatabasePath = USER_DATABASE_URL;
                this.#dirty = true;
                this.#removeConfigurationWarnings();
                this.#warnings.push(
                    `${CONFIGURATION_WARNING_PREFIX} ${message}; verrà usato ${USER_DATABASE_URL}.`
                );
                this.#setStatus(
                    'Impostazioni applicate; percorso database non valido, fallback convenzionale attivo',
                    'warning'
                );
                this.#emit();
                void this.#queueLocalPersistence();
            }

            createNew() {
                this.#database = createEmptyDatabase();
                this.#hasActiveDatabase = true;
                this.#dirty = true;
                this.#fileName = 'organizer-data.json';
                this.#isDemo = false;
                this.#databaseConfiguration = emptyDatabaseConfiguration();
                this.#activeDatabasePath = USER_DATABASE_URL;
                this.#warnings = [];
                this.#setStatus(
                    this.usesLocalDatabase
                        ? 'Nuovo database conservato localmente; premi Salva per esportare il JSON'
                        : 'Nuovo database non ancora salvato',
                    'warning'
                );
                this.#emit();
                void this.#queueLocalPersistence();
            }

            openDatabase(fileInput) {
                fileInput.click();
            }

            async loadDatabaseFile(file) {
                const payload = await readJsonFile(file);
                const activeDatabasePath = file.name.toLowerCase() === 'organizer-data.json'
                    ? USER_DATABASE_URL
                    : `data/user/${file.name}`;
                const databaseConfiguration = activeDatabasePath === USER_DATABASE_URL
                    ? emptyDatabaseConfiguration()
                    : createDatabaseConfiguration(activeDatabasePath);
                this.#apply(payload, {
                    fileName: file.name,
                    message: this.usesLocalDatabase
                        ? `Aperto ${file.name} e impostato come database locale`
                        : undefined,
                    activeDatabasePath,
                    databaseConfiguration
                });
                await this.#queueLocalPersistence();
            }

            update(updater, message = 'Modifiche non salvate') {
                this.#database = updateDatabase(this.#database, updater);
                this.#hasActiveDatabase = true;
                this.#dirty = true;
                this.#warnings = this.#warnings.filter(warning =>
                    warning.startsWith(CONFIGURATION_WARNING_PREFIX)
                    || warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX)
                );
                this.#setStatus(
                    this.usesLocalDatabase ? `${message}; copia locale aggiornata automaticamente` : message,
                    'warning'
                );
                this.#emit();
                void this.#queueLocalPersistence();
            }

            async importPlanFile(file) {
                const payload = await readJsonFile(file);
                this.#database = replacePlan(this.#database, payload);
                this.#hasActiveDatabase = true;
                this.#dirty = true;
                this.#warnings = this.#warnings.filter(warning =>
                    warning.startsWith(CONFIGURATION_WARNING_PREFIX)
                    || warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX)
                );
                this.#setStatus(
                    this.usesLocalDatabase
                        ? `Programma importato da ${file.name} e salvato nella copia locale`
                        : `Programma importato da ${file.name}: salva il database`,
                    'warning'
                );
                this.#emit();
                await this.#queueLocalPersistence();
            }

            async save() {
                const snapshot = snapshotDatabase(this.#database);
                const targetPath = this.#activeDatabasePath || USER_DATABASE_URL;
                const targetName = databaseFileNameFromPath(targetPath);
                const usesConventionalDatabase = targetPath === USER_DATABASE_URL;

                downloadJson(snapshot, targetName);
                this.#databaseConfiguration = usesConventionalDatabase
                    ? emptyDatabaseConfiguration()
                    : createDatabaseConfiguration(targetPath);
                if (!this.usesLocalDatabase && !usesConventionalDatabase) {
                    downloadJson(this.#databaseConfiguration, DATABASE_CONFIGURATION_FILE);
                }

                this.#database = snapshot;
                this.#hasActiveDatabase = true;
                this.#fileName = targetName;
                this.#dirty = false;
                this.#isDemo = false;
                this.#removeConfigurationWarnings();
                this.#setStatus(
                    this.usesLocalDatabase
                        ? `Scaricato ${targetName}; la copia di lavoro resta salvata in IndexedDB`
                        : (usesConventionalDatabase
                            ? 'Scaricato organizer-data.json: copialo in data/user'
                            : `Scaricati ${targetName} e ${DATABASE_CONFIGURATION_FILE}: copiali nei percorsi configurati`),
                    'success'
                );
                this.#emit();
                await this.#queueLocalPersistence();
            }

            async clearLocalDatabase() {
                if (!this.usesLocalDatabase) return;
                await this.#localPersistenceQueue;
                await this.#localDatabaseCache.clear();
                this.#useEmptyLocalDatabase();
            }
        }

        const plannerStore = new PlannerStore();

        return { PlannerStore, plannerStore };
    })();

    (() => {
        const { CATEGORY_ROLES, DAY_KEYS, MODULE_MODES, TOPIC_KINDS, createId, databaseHasContent } = modelApi;
        const { buildPlanSchedule, daysBetween, formatDate, formatDayName, formatDuration, getModuleWeekAllocations, getTimelineMonths, getWeekAgenda } = plannerApi;
        const { normalizeDatabasePath } = configurationApi;
        const { plannerStore } = storeApi;

        const elements = Object.fromEntries([
            'appTitle',
            'appDescription',
            'demoEyebrow',
            'databaseStatus',
            'newDatabaseButton',
            'openDatabaseButton',
            'saveDatabaseButton',
            'importPlanButton',
            'settingsButton',
            'editPlanButton',
            'databaseFileInput',
            'planFileInput',
            'totalDuration',
            'totalWeeks',
            'moduleCount',
            'weeklyCapacity',
            'endDate',
            'plannerWarnings',
            'planPeriod',
            'ganttTable',
            'ganttRows',
            'ganttEmpty',
            'weekDetail',
            'settingsDialog',
            'settingsForm',
            'databaseNameInput',
            'planTitleInput',
            'planDescriptionInput',
            'planStartDateInput',
            'weeklyTargetInput',
            'localeInput',
            'timeZoneInput',
            'databaseStorageTitle',
            'databaseStorageDescription',
            'defaultDatabasePathLabel',
            'defaultDatabasePathInput',
            'defaultDatabasePathHint',
            'clearLocalDatabaseButton',
            'multiplierEditor',
            'categoryEditor',
            'addCategoryButton',
            'weekTemplateEditor',
            'exceptionsInput',
            'settingsError',
            'planDialog',
            'planForm',
            'moduleEditor',
            'addModuleButton',
            'planError'
        ].map(id => [id, document.getElementById(id)]));

        const KIND_LABELS = {
            theory: 'Teoria',
            practice: 'Pratica',
            exercise: 'Esercitazione',
            project: 'Progetto',
            other: 'Altro'
        };

        const ROLE_LABELS = {
            focus: 'Focus / pianificabile',
            busy: 'Impegno',
            neutral: 'Neutra'
        };

        let currentDatabase = null;
        let currentSchedule = null;
        let currentDatabaseConfiguration = null;
        let selectedModuleId = null;
        let selectedWeekIndex = 0;
        let settingsDraft = null;
        let planDraft = null;

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        function createElement(tag, options = {}, children = []) {
            const node = document.createElement(tag);
            if (options.className) node.className = options.className;
            if (options.text !== undefined) node.textContent = String(options.text);
            if (options.type) node.type = options.type;
            if (options.value !== undefined) node.value = String(options.value);
            if (options.title) node.title = options.title;
            if (options.dataset) Object.assign(node.dataset, options.dataset);
            if (options.attributes) {
                Object.entries(options.attributes).forEach(([name, value]) => {
                    if (value !== null && value !== undefined) node.setAttribute(name, String(value));
                });
            }
            const childList = Array.isArray(children) ? children : [children];
            childList.filter(Boolean).forEach(child => node.append(child));
            return node;
        }

        function clear(node) {
            node.replaceChildren();
        }

        function setHidden(node, hidden) {
            node.classList.toggle('hidden', hidden);
        }

        function showFormError(node, error) {
            node.textContent = error?.message || String(error);
            setHidden(node, false);
        }

        function clearFormError(node) {
            node.textContent = '';
            setHidden(node, true);
        }

        function reportError(error) {
            console.error(error);
            elements.databaseStatus.textContent = error?.message || String(error);
            elements.databaseStatus.dataset.level = 'error';
        }

        function confirmDiscard() {
            return !plannerStore.dirty || window.confirm('Ci sono modifiche non salvate. Continuare senza salvarle?');
        }

        function dayLabels(locale) {
            const monday = new Date(Date.UTC(2026, 0, 5));
            return Object.fromEntries(DAY_KEYS.map((day, index) => [
                day,
                new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
                    new Date(monday.getTime() + index * 86_400_000)
                )
            ]));
        }

        function renderStoreState(snapshot) {
            currentDatabase = snapshot.database;
            currentDatabaseConfiguration = snapshot.databaseConfiguration;
            if (!currentDatabase) return;
            currentSchedule = buildPlanSchedule(currentDatabase);

            elements.databaseStatus.textContent = `${snapshot.dirty ? '● ' : '✓ '}${snapshot.status.message}`;
            elements.databaseStatus.dataset.level = snapshot.status.level;
            setHidden(elements.demoEyebrow, !snapshot.isDemo);
            elements.newDatabaseButton.disabled = !snapshot.hasActiveDatabase || !databaseHasContent(currentDatabase);
            elements.saveDatabaseButton.disabled = false;

            renderOverview();
            renderGantt();
            renderSelectedWeek();
        }

        function renderOverview() {
            const locale = currentDatabase.metadata.locale;
            elements.appTitle.textContent = currentDatabase.plan.title;
            elements.appDescription.textContent = currentDatabase.plan.description
                || currentDatabase.metadata.description
                || 'Organizza moduli, argomenti e disponibilità in un percorso sostenibile.';
            document.title = `${currentDatabase.plan.title} · Learning Path Planner`;

            elements.totalDuration.textContent = formatDuration(currentSchedule.totalMinutes);
            elements.totalWeeks.textContent = `${currentSchedule.totalWeeks} sett.`;
            elements.moduleCount.textContent = String(currentSchedule.modules.length);
            elements.weeklyCapacity.textContent = formatDuration(currentSchedule.baseCapacityMinutes);
            elements.endDate.textContent = formatDate(currentSchedule.endDate, locale, { year: true });
            elements.planPeriod.textContent = `${formatDate(currentSchedule.startDate, locale, { year: true })} — ${formatDate(currentSchedule.endDate, locale, { year: true })}`;

            const warnings = [...currentSchedule.warnings, ...(plannerStore.status.warnings || [])];
            clear(elements.plannerWarnings);
            setHidden(elements.plannerWarnings, warnings.length === 0);
            if (warnings.length) {
                const list = createElement('ul');
                warnings.forEach(warning => list.append(createElement('li', { text: warning })));
                elements.plannerWarnings.append(list);
            }
        }

        function renderGantt() {
            clear(elements.ganttRows);
            const modules = currentSchedule.modules;
            const empty = modules.length === 0;
            setHidden(elements.ganttEmpty, !empty);
            setHidden(elements.ganttTable, empty);
            if (empty) return;

            const totalDays = Math.max(1, daysBetween(currentSchedule.startDate, currentSchedule.endDate) + 1);
            const locale = currentDatabase.metadata.locale;
            const months = getTimelineMonths(currentSchedule.startDate, currentSchedule.endDate, locale);

            modules.forEach(module => {
                const row = createElement('div', {
                    className: 'gantt__row',
                    attributes: { role: 'row' }
                });

                const identity = createElement('div', { attributes: { role: 'cell' } }, [
                    createElement('span', { className: 'gantt__module-title', text: module.title }),
                    createElement('span', {
                        className: 'gantt__module-meta',
                        text: module.mode === 'buffer' ? 'Pausa / buffer' : `${module.topics.length} argomenti`
                    })
                ]);

                const effort = createElement('div', { attributes: { role: 'cell' } }, [
                    createElement('strong', { text: module.mode === 'buffer' ? `${module.weeks} sett.` : formatDuration(module.totalMinutes) }),
                    createElement('div', {
                        className: 'gantt__module-meta',
                        text: `${module.weeks} ${module.weeks === 1 ? 'settimana' : 'settimane'}`
                    })
                ]);

                const period = createElement('div', { attributes: { role: 'cell' } }, [
                    createElement('span', { text: formatDate(module.startDate, locale) }),
                    createElement('span', { className: 'gantt__module-meta', text: ` → ${formatDate(module.endDate, locale)}` })
                ]);

                const track = createElement('div', {
                    className: 'gantt__track',
                    attributes: { role: 'cell' }
                });
                months.forEach(month => {
                    const label = createElement('span', {
                        className: 'gantt__month-label',
                        text: month.displayLabel,
                        attributes: { 'aria-hidden': 'true' }
                    });
                    label.style.left = `${month.offsetDays / totalDays * 100}%`;
                    label.style.width = `${month.durationDays / totalDays * 100}%`;
                    track.append(label);
                });
                months.slice(1).forEach(month => {
                    const line = createElement('span', {
                        className: 'gantt__month-line',
                        attributes: { 'aria-hidden': 'true' }
                    });
                    line.style.left = `${month.offsetDays / totalDays * 100}%`;
                    track.append(line);
                });
                if (module.weeks > 0) {
                    const left = daysBetween(currentSchedule.startDate, module.startDate) / totalDays * 100;
                    const width = (daysBetween(module.startDate, module.endDate) + 1) / totalDays * 100;
                    const bar = createElement('button', {
                        className: 'gantt__bar',
                        type: 'button',
                        title: `Apri ${module.title}`,
                        attributes: {
                            'aria-label': `Apri il dettaglio settimanale di ${module.title}`
                        }
                    });
                    bar.style.left = `${left}%`;
                    bar.style.width = `${Math.max(width, 1.2)}%`;
                    bar.style.background = module.color;
                    bar.addEventListener('click', () => {
                        selectedModuleId = module.id;
                        selectedWeekIndex = 0;
                        renderSelectedWeek();
                        elements.weekDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                    track.append(bar);
                }

                row.append(identity, effort, period, track);
                elements.ganttRows.append(row);
            });
        }

        function renderSelectedWeek() {
            clear(elements.weekDetail);
            if (!selectedModuleId) {
                setHidden(elements.weekDetail, true);
                return;
            }

            const module = currentSchedule.modules.find(item => item.id === selectedModuleId);
            if (!module || module.weeks === 0) {
                selectedModuleId = null;
                setHidden(elements.weekDetail, true);
                return;
            }
            selectedWeekIndex = Math.min(selectedWeekIndex, module.weeks - 1);
            const agenda = getWeekAgenda(currentDatabase, selectedModuleId, selectedWeekIndex);
            const locale = currentDatabase.metadata.locale;

            const heading = createElement('div', { className: 'section-heading' }, [
                createElement('div', {}, [
                    createElement('span', { className: 'eyebrow eyebrow--dark', text: `Settimana ${agenda.weekNumber} di ${module.weeks}` }),
                    createElement('h2', { text: module.title }),
                    createElement('p', {
                        className: 'muted',
                        text: `${formatDate(agenda.weekStart, locale, { year: true })} — ${formatDate(agenda.weekEnd, locale, { year: true })}`
                    })
                ]),
                createElement('button', {
                    className: 'icon-button',
                    type: 'button',
                    text: '×',
                    attributes: { 'aria-label': 'Chiudi dettaglio' }
                })
            ]);
            heading.querySelector('button').addEventListener('click', () => {
                selectedModuleId = null;
                renderSelectedWeek();
            });

            const tabs = createElement('div', { className: 'week-tabs', attributes: { 'aria-label': 'Settimane del modulo' } });
            for (let index = 0; index < module.weeks; index += 1) {
                const weekStart = new Date(Date.UTC(
                    Number(module.startDate.slice(0, 4)),
                    Number(module.startDate.slice(5, 7)) - 1,
                    Number(module.startDate.slice(8, 10)) + index * 7
                ));
                const button = createElement('button', {
                    className: 'week-tab',
                    type: 'button',
                    text: `${index + 1} · ${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(weekStart)}`,
                    attributes: { 'aria-pressed': index === selectedWeekIndex }
                });
                button.addEventListener('click', () => {
                    selectedWeekIndex = index;
                    renderSelectedWeek();
                });
                tabs.append(button);
            }

            const allocations = createElement('div', { className: 'allocation-list' });
            if (module.mode === 'buffer') {
                allocations.append(createElement('span', { className: 'allocation-pill', text: 'Settimana di recupero e consolidamento' }));
            } else if (agenda.allocations.length === 0) {
                allocations.append(createElement('span', { className: 'allocation-pill', text: 'Nessuna attività pianificata' }));
            } else {
                agenda.allocations.forEach(allocation => {
                    allocations.append(createElement('span', {
                        className: 'allocation-pill',
                        text: `${allocation.title} · ${formatDuration(allocation.minutes)}`
                    }));
                });
            }

            const agendaGrid = createElement('div', { className: 'agenda' });
            agenda.days.forEach(day => {
                const dayCard = createElement('article', { className: 'agenda-day' }, [
                    createElement('h3', { text: formatDayName(day.date, locale) })
                ]);
                if (day.sessions.length === 0) {
                    dayCard.append(createElement('p', { className: 'muted', text: 'Nessuna attività ricorrente.' }));
                }
                day.sessions.forEach(session => {
                    const sessionNode = createElement('div', {
                        className: `session${session.blocked ? ' session--blocked' : ''}`
                    });
                    sessionNode.style.setProperty('--session-color', session.category?.color || '#64748b');
                    sessionNode.append(createElement('div', {
                        className: 'session__time',
                        text: `${session.start}–${session.end}`
                    }));

                    const content = createElement('div');
                    const title = session.blocked
                        ? `⛔ ${session.exceptionLabel}`
                        : session.buffer
                            ? '↻ Recupero / pausa'
                            : `${session.category?.icon || '📌'} ${session.category?.label || 'Attività'}`;
                    content.append(createElement('div', { className: 'session__title', text: title }));
                    if (session.label && !session.blocked && !session.buffer) {
                        content.append(createElement('div', {
                            className: 'session__description',
                            text: session.label
                        }));
                    }
                    if (session.assignments?.length) {
                        const list = createElement('ul', { className: 'session__assignments' });
                        session.assignments.forEach(assignment => {
                            list.append(createElement('li', {
                                text: `${assignment.title} · ${formatDuration(assignment.minutes)}`
                            }));
                        });
                        content.append(list);
                    }
                    if (session.isFocus && !session.blocked && !session.buffer && session.freeMinutes > 0) {
                        content.append(createElement('div', {
                            className: 'session__free',
                            text: `Spazio focus libero · ${formatDuration(session.freeMinutes)}`
                        }));
                    }
                    sessionNode.append(content);
                    dayCard.append(sessionNode);
                });
                agendaGrid.append(dayCard);
            });

            elements.weekDetail.append(heading, tabs, allocations, agendaGrid);
            setHidden(elements.weekDetail, false);
        }

        function createInputLabel(labelText, input) {
            return createElement('label', {}, [document.createTextNode(labelText), input]);
        }

        function option(value, label, selectedValue) {
            const node = createElement('option', { text: label, value });
            node.selected = value === selectedValue;
            return node;
        }

        function openSettingsDialog() {
            settingsDraft = clone(currentDatabase);
            clearFormError(elements.settingsError);
            const isDirectFileMode = globalThis.location?.protocol === 'file:';
            elements.databaseNameInput.value = settingsDraft.metadata.name;
            elements.planTitleInput.value = settingsDraft.plan.title;
            elements.planDescriptionInput.value = settingsDraft.plan.description;
            elements.planStartDateInput.value = settingsDraft.plan.startDate;
            elements.weeklyTargetInput.value = settingsDraft.plan.weeklyTargetMinutes
                ? String(settingsDraft.plan.weeklyTargetMinutes / 60)
                : '';
            elements.localeInput.value = settingsDraft.metadata.locale;
            elements.timeZoneInput.value = settingsDraft.metadata.timeZone;
            elements.defaultDatabasePathInput.value = currentDatabaseConfiguration?.defaultDatabase || '';
            elements.defaultDatabasePathInput.disabled = isDirectFileMode;
            elements.defaultDatabasePathLabel.classList.toggle('field-disabled', isDirectFileMode);
            elements.databaseStorageTitle.textContent = isDirectFileMode ? 'Database locale' : 'Database predefinito';
            elements.databaseStorageDescription.textContent = isDirectFileMode
                ? 'La copia di lavoro viene salvata automaticamente in IndexedDB.'
                : 'Indica il percorso relativo da scrivere in db-configuration.json.';
            elements.defaultDatabasePathHint.textContent = isDirectFileMode
                ? 'Apri database importa un JSON nella copia locale. Salva esporta un backup JSON, ma non è necessario per conservare le modifiche nel browser.'
                : 'Lascia vuoto per usare il fallback convenzionale data/user/organizer-data.json. Il file di configurazione viene scaricato soltanto premendo Salva.';
            setHidden(elements.clearLocalDatabaseButton, !isDirectFileMode);
            elements.exceptionsInput.value = settingsDraft.settings.calendarExceptions
                .map(exception => `${exception.date} | ${exception.label}`)
                .join('\n');
            renderMultiplierEditor();
            renderCategoryEditor();
            renderWeekTemplateEditor();
            elements.settingsDialog.showModal();
        }

        function renderMultiplierEditor() {
            clear(elements.multiplierEditor);
            TOPIC_KINDS.forEach(kind => {
                const input = createElement('input', {
                    type: 'number',
                    value: settingsDraft.settings.estimationMultipliers[kind],
                    attributes: { min: '0.1', step: '0.1' }
                });
                input.addEventListener('input', () => {
                    settingsDraft.settings.estimationMultipliers[kind] = Number(input.value);
                });
                elements.multiplierEditor.append(createInputLabel(KIND_LABELS[kind], input));
            });
        }

        function renderCategoryEditor() {
            clear(elements.categoryEditor);
            settingsDraft.categories.forEach((category, index) => {
                const idInput = createElement('input', { value: category.id, attributes: { 'aria-label': 'ID categoria' } });
                const labelInput = createElement('input', { value: category.label, attributes: { 'aria-label': 'Nome categoria' } });
                const iconInput = createElement('input', { value: category.icon, className: 'compact', attributes: { 'aria-label': 'Icona categoria', maxlength: '16' } });
                const colorInput = createElement('input', { type: 'color', value: category.color, className: 'compact', attributes: { 'aria-label': 'Colore categoria' } });
                const roleSelect = createElement('select', { attributes: { 'aria-label': 'Ruolo categoria' } });
                CATEGORY_ROLES.forEach(role => roleSelect.append(option(role, ROLE_LABELS[role], category.role)));
                const remove = createElement('button', {
                    className: 'icon-button',
                    type: 'button',
                    text: '×',
                    attributes: { 'aria-label': `Elimina ${category.label}` }
                });

                idInput.addEventListener('change', () => {
                    const previous = category.id;
                    category.id = idInput.value.trim();
                    DAY_KEYS.forEach(day => settingsDraft.weekTemplate[day].forEach(session => {
                        if (session.categoryId === previous) session.categoryId = category.id;
                    }));
                    renderWeekTemplateEditor();
                });
                labelInput.addEventListener('input', () => { category.label = labelInput.value; });
                iconInput.addEventListener('input', () => { category.icon = iconInput.value; });
                colorInput.addEventListener('input', () => { category.color = colorInput.value; });
                roleSelect.addEventListener('change', () => { category.role = roleSelect.value; });
                remove.addEventListener('click', () => {
                    if (settingsDraft.categories.length === 1) return;
                    settingsDraft.categories.splice(index, 1);
                    const fallbackId = settingsDraft.categories[0].id;
                    DAY_KEYS.forEach(day => settingsDraft.weekTemplate[day].forEach(session => {
                        if (session.categoryId === category.id) session.categoryId = fallbackId;
                    }));
                    renderCategoryEditor();
                    renderWeekTemplateEditor();
                });

                elements.categoryEditor.append(createElement('div', { className: 'editor-row' }, [
                    createInputLabel('ID', idInput),
                    createInputLabel('Nome', labelInput),
                    createInputLabel('Icona', iconInput),
                    createInputLabel('Colore', colorInput),
                    createInputLabel('Ruolo', roleSelect),
                    remove
                ]));
            });
        }

        function renderWeekTemplateEditor() {
            clear(elements.weekTemplateEditor);
            const labels = dayLabels(settingsDraft.metadata.locale || 'it-IT');

            DAY_KEYS.forEach(day => {
                const sessionContainer = createElement('div');
                settingsDraft.weekTemplate[day].forEach((session, sessionIndex) => {
                    const start = createElement('input', { type: 'time', value: session.start, attributes: { 'aria-label': 'Inizio' } });
                    const end = createElement('input', { type: 'time', value: session.end, attributes: { 'aria-label': 'Fine' } });
                    const label = createElement('input', { value: session.label, attributes: { 'aria-label': 'Descrizione', placeholder: 'Descrizione' } });
                    const category = createElement('select', { attributes: { 'aria-label': 'Categoria' } });
                    settingsDraft.categories.forEach(item => category.append(option(item.id, `${item.icon} ${item.label}`, session.categoryId)));
                    const remove = createElement('button', {
                        className: 'icon-button',
                        type: 'button',
                        text: '×',
                        attributes: { 'aria-label': 'Elimina slot' }
                    });
                    start.addEventListener('input', () => { session.start = start.value; });
                    end.addEventListener('input', () => { session.end = end.value; });
                    label.addEventListener('input', () => { session.label = label.value; });
                    category.addEventListener('change', () => { session.categoryId = category.value; });
                    remove.addEventListener('click', () => {
                        settingsDraft.weekTemplate[day].splice(sessionIndex, 1);
                        renderWeekTemplateEditor();
                    });
                    sessionContainer.append(createElement('div', { className: 'slot-row' }, [start, end, label, category, remove]));
                });

                const add = createElement('button', {
                    className: 'button button--small button--ghost',
                    type: 'button',
                    text: 'Aggiungi slot'
                });
                add.addEventListener('click', () => {
                    settingsDraft.weekTemplate[day].push({
                        id: createId('slot'),
                        start: '18:00',
                        end: '19:00',
                        label: '',
                        categoryId: settingsDraft.categories[0]?.id || 'focus'
                    });
                    renderWeekTemplateEditor();
                });

                elements.weekTemplateEditor.append(createElement('section', { className: 'week-editor__day' }, [
                    createElement('div', { className: 'week-editor__day-header' }, [
                        createElement('h3', { text: labels[day] }),
                        add
                    ]),
                    sessionContainer
                ]));
            });
        }

        function parseExceptions(value) {
            return String(value || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean)
                .map((line, index) => {
                    const [date, ...labelParts] = line.split('|');
                    return {
                        id: `exception-${index + 1}-${date.trim()}`,
                        date: date.trim(),
                        label: labelParts.join('|').trim() || 'Indisponibile',
                        focusAvailable: false
                    };
                });
        }

        async function applySettings(event) {
            event.preventDefault();
            clearFormError(elements.settingsError);
            try {
                settingsDraft.metadata.name = elements.databaseNameInput.value;
                settingsDraft.metadata.locale = elements.localeInput.value;
                settingsDraft.metadata.timeZone = elements.timeZoneInput.value;
                settingsDraft.plan.title = elements.planTitleInput.value;
                settingsDraft.plan.description = elements.planDescriptionInput.value;
                settingsDraft.plan.startDate = elements.planStartDateInput.value;
                settingsDraft.plan.weeklyTargetMinutes = elements.weeklyTargetInput.value
                    ? Math.round(Number(elements.weeklyTargetInput.value) * 60)
                    : null;
                settingsDraft.settings.calendarExceptions = parseExceptions(elements.exceptionsInput.value);

                const isDirectFileMode = globalThis.location?.protocol === 'file:';
                const currentDefaultDatabase = currentDatabaseConfiguration?.defaultDatabase || '';
                const nextDefaultDatabase = isDirectFileMode
                    ? currentDefaultDatabase
                    : elements.defaultDatabasePathInput.value.trim();
                let databaseConfigurationError = null;
                if (!isDirectFileMode && nextDefaultDatabase) {
                    try {
                        normalizeDatabasePath(nextDefaultDatabase);
                    } catch (error) {
                        databaseConfigurationError = error;
                    }
                }

                plannerStore.update(draft => {
                    draft.metadata = settingsDraft.metadata;
                    draft.settings = settingsDraft.settings;
                    draft.categories = settingsDraft.categories;
                    draft.weekTemplate = settingsDraft.weekTemplate;
                    draft.plan.title = settingsDraft.plan.title;
                    draft.plan.description = settingsDraft.plan.description;
                    draft.plan.startDate = settingsDraft.plan.startDate;
                    draft.plan.weeklyTargetMinutes = settingsDraft.plan.weeklyTargetMinutes;
                }, 'Impostazioni aggiornate');
                if (databaseConfigurationError) {
                    plannerStore.useConventionalDatabaseFallback(databaseConfigurationError);
                } else if (!isDirectFileMode && nextDefaultDatabase !== currentDefaultDatabase) {
                    plannerStore.setDefaultDatabaseConfiguration(nextDefaultDatabase);
                }
                elements.settingsDialog.close();
            } catch (error) {
                showFormError(elements.settingsError, error);
            }
        }

        function openPlanDialog() {
            planDraft = clone(currentDatabase.plan);
            clearFormError(elements.planError);
            renderModuleEditor();
            elements.planDialog.showModal();
        }

        function renderModuleEditor() {
            clear(elements.moduleEditor);
            planDraft.modules.forEach((module, moduleIndex) => {
                const title = createElement('input', { value: module.title, attributes: { 'aria-label': 'Titolo modulo' } });
                const color = createElement('input', { type: 'color', value: module.color, attributes: { 'aria-label': 'Colore modulo' } });
                const mode = createElement('select', { attributes: { 'aria-label': 'Tipo modulo' } });
                MODULE_MODES.forEach(value => mode.append(option(value, value === 'work' ? 'Attivo' : 'Pausa / buffer', module.mode)));
                const fixedWeeks = createElement('input', {
                    type: 'number',
                    value: module.fixedWeeks || 1,
                    attributes: { min: '1', step: '1', 'aria-label': 'Settimane fisse' }
                });
                fixedWeeks.disabled = module.mode !== 'buffer';
                title.addEventListener('input', () => { module.title = title.value; });
                color.addEventListener('input', () => { module.color = color.value; });
                mode.addEventListener('change', () => {
                    module.mode = mode.value;
                    if (module.mode === 'buffer') {
                        module.fixedWeeks = module.fixedWeeks || 1;
                        module.topics = [];
                    } else {
                        delete module.fixedWeeks;
                    }
                    renderModuleEditor();
                });
                fixedWeeks.addEventListener('input', () => { module.fixedWeeks = Number(fixedWeeks.value); });

                const moveUp = createElement('button', { className: 'button button--small button--ghost', type: 'button', text: '↑', attributes: { 'aria-label': 'Sposta su' } });
                const moveDown = createElement('button', { className: 'button button--small button--ghost', type: 'button', text: '↓', attributes: { 'aria-label': 'Sposta giù' } });
                const removeModule = createElement('button', { className: 'button button--small button--danger', type: 'button', text: 'Elimina' });
                moveUp.disabled = moduleIndex === 0;
                moveDown.disabled = moduleIndex === planDraft.modules.length - 1;
                moveUp.addEventListener('click', () => {
                    [planDraft.modules[moduleIndex - 1], planDraft.modules[moduleIndex]] = [module, planDraft.modules[moduleIndex - 1]];
                    renderModuleEditor();
                });
                moveDown.addEventListener('click', () => {
                    [planDraft.modules[moduleIndex + 1], planDraft.modules[moduleIndex]] = [module, planDraft.modules[moduleIndex + 1]];
                    renderModuleEditor();
                });
                removeModule.addEventListener('click', () => {
                    planDraft.modules.splice(moduleIndex, 1);
                    renderModuleEditor();
                });

                const topicList = createElement('div', { className: 'topic-list' });
                if (module.mode === 'work') {
                    module.topics.forEach((topic, topicIndex) => {
                        const topicTitle = createElement('input', { value: topic.title, attributes: { 'aria-label': 'Titolo argomento' } });
                        const kind = createElement('select', { attributes: { 'aria-label': 'Tipo argomento' } });
                        TOPIC_KINDS.forEach(value => kind.append(option(value, KIND_LABELS[value], topic.kind)));
                        const minutes = createElement('input', {
                            type: 'number',
                            value: topic.estimatedMinutes,
                            attributes: { min: '1', step: '15', 'aria-label': 'Minuti stimati' }
                        });
                        const removeTopic = createElement('button', {
                            className: 'icon-button',
                            type: 'button',
                            text: '×',
                            attributes: { 'aria-label': `Elimina ${topic.title}` }
                        });
                        topicTitle.addEventListener('input', () => { topic.title = topicTitle.value; });
                        kind.addEventListener('change', () => { topic.kind = kind.value; });
                        minutes.addEventListener('input', () => { topic.estimatedMinutes = Number(minutes.value); });
                        removeTopic.addEventListener('click', () => {
                            module.topics.splice(topicIndex, 1);
                            renderModuleEditor();
                        });
                        topicList.append(createElement('div', { className: 'topic-row' }, [
                            createElement('div', { className: 'topic-row__title' }, [createInputLabel('Argomento', topicTitle)]),
                            createElement('div', { className: 'topic-row__kind' }, [createInputLabel('Tipo', kind)]),
                            createElement('div', { className: 'topic-row__minutes' }, [createInputLabel('Minuti', minutes)]),
                            removeTopic
                        ]));
                    });
                }

                const addTopic = createElement('button', {
                    className: 'button button--small button--secondary',
                    type: 'button',
                    text: 'Aggiungi argomento'
                });
                addTopic.disabled = module.mode === 'buffer';
                addTopic.addEventListener('click', () => {
                    module.topics.push({
                        id: createId('topic'),
                        title: 'Nuovo argomento',
                        kind: 'other',
                        estimatedMinutes: 60
                    });
                    renderModuleEditor();
                });

                const fields = createElement('div', { className: 'module-card__fields' }, [
                    createInputLabel('Titolo', title),
                    createInputLabel('Colore', color),
                    createInputLabel('Tipo', mode),
                    createInputLabel('Settimane', fixedWeeks)
                ]);
                const actions = createElement('div', { className: 'module-card__actions' }, [moveUp, moveDown, removeModule]);
                elements.moduleEditor.append(createElement('section', { className: 'module-card' }, [
                    createElement('div', { className: 'module-card__header' }, [fields, actions]),
                    topicList,
                    addTopic
                ]));
            });
        }

        function applyPlan(event) {
            event.preventDefault();
            clearFormError(elements.planError);
            try {
                plannerStore.update(draft => {
                    draft.plan = planDraft;
                    draft.state.progress = {};
                }, 'Piano aggiornato');
                selectedModuleId = null;
                elements.planDialog.close();
            } catch (error) {
                showFormError(elements.planError, error);
            }
        }

        function bindEvents() {
            elements.newDatabaseButton.addEventListener('click', () => {
                const message = plannerStore.usesLocalDatabase
                    ? 'Creare un nuovo database? Il database locale attivo verrà sostituito. Esporta prima un JSON se vuoi conservarne una copia.'
                    : 'Creare un nuovo database? Le eventuali modifiche non salvate verranno perse.';
                if (!window.confirm(message)) return;
                selectedModuleId = null;
                plannerStore.createNew();
            });

            elements.openDatabaseButton.addEventListener('click', async () => {
                if (!confirmDiscard()) return;
                try {
                    await plannerStore.openDatabase(elements.databaseFileInput);
                } catch (error) {
                    reportError(error);
                }
            });

            elements.databaseFileInput.addEventListener('change', async () => {
                const file = elements.databaseFileInput.files?.[0];
                elements.databaseFileInput.value = '';
                if (!file) return;
                try {
                    await plannerStore.loadDatabaseFile(file);
                } catch (error) {
                    reportError(error);
                }
            });

            elements.saveDatabaseButton.addEventListener('click', async () => {
                try {
                    await plannerStore.save();
                } catch (error) {
                    reportError(error);
                }
            });

            elements.importPlanButton.addEventListener('click', () => {
                if (window.confirm('Il programma importato sostituirà moduli, argomenti e progresso correnti. Continuare?')) {
                    elements.planFileInput.click();
                }
            });

            elements.planFileInput.addEventListener('change', async () => {
                const file = elements.planFileInput.files?.[0];
                elements.planFileInput.value = '';
                if (!file) return;
                try {
                    await plannerStore.importPlanFile(file);
                    selectedModuleId = null;
                } catch (error) {
                    reportError(error);
                }
            });

            elements.settingsButton.addEventListener('click', openSettingsDialog);
            elements.editPlanButton.addEventListener('click', openPlanDialog);
            elements.settingsForm.addEventListener('submit', applySettings);
            elements.planForm.addEventListener('submit', applyPlan);

            elements.clearLocalDatabaseButton.addEventListener('click', async () => {
                if (!window.confirm('Rimuovere il database locale? Esporta prima un JSON se vuoi conservarne una copia.')) return;
                try {
                    await plannerStore.clearLocalDatabase();
                    elements.settingsDialog.close();
                } catch (error) {
                    showFormError(elements.settingsError, error);
                }
            });

            elements.addCategoryButton.addEventListener('click', () => {
                settingsDraft.categories.push({
                    id: `category-${settingsDraft.categories.length + 1}`,
                    label: 'Nuova categoria',
                    icon: '📌',
                    color: '#64748b',
                    role: 'neutral'
                });
                renderCategoryEditor();
                renderWeekTemplateEditor();
            });

            elements.addModuleButton.addEventListener('click', () => {
                planDraft.modules.push({
                    id: createId('module'),
                    title: 'Nuovo modulo',
                    color: '#2563eb',
                    mode: 'work',
                    topics: []
                });
                renderModuleEditor();
            });

            document.querySelectorAll('[data-close-dialog]').forEach(button => {
                button.addEventListener('click', () => {
                    document.getElementById(button.dataset.closeDialog)?.close();
                });
            });

            window.addEventListener('beforeunload', event => {
                if (!plannerStore.dirty || plannerStore.usesLocalDatabase) return;
                event.preventDefault();
                event.returnValue = '';
            });
        }

        async function init() {
            bindEvents();
            plannerStore.subscribe(renderStoreState);
            await plannerStore.initialize();
        }

        init().catch(reportError);
    })();
})();

export const DATABASE_KIND = 'learning-planner-database';
export const PLAN_KIND = 'learning-plan';
export const SCHEMA_VERSION = 2;

export const DAY_KEYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

export const TOPIC_KINDS = ['theory', 'practice', 'exercise', 'project', 'other'];
export const CATEGORY_ROLES = ['focus', 'busy', 'neutral'];
export const MODULE_MODES = ['work', 'buffer'];

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

export function createId(prefix = 'item') {
    if (globalThis.crypto?.randomUUID) {
        return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyWeekTemplate() {
    return Object.fromEntries(DAY_KEYS.map(day => [day, []]));
}

export function createEmptyDatabase() {
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

export function databaseHasContent(database) {
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

export function normalizeDatabase(input) {
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

export function normalizePlanInput(input) {
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

export function updateDatabase(database, updater) {
    const draft = clone(database);
    updater(draft);
    draft.metadata.updatedAt = nowIso();
    return normalizeV2Database(draft);
}

export function snapshotDatabase(database) {
    const snapshot = clone(database);
    snapshot.metadata.updatedAt = nowIso();
    return normalizeV2Database(snapshot);
}

export function replacePlan(database, planInput) {
    const plan = normalizePlanInput(planInput);
    return updateDatabase(database, draft => {
        draft.plan = plan;
        draft.state = { progress: {} };
    });
}

export const DATABASE_KIND = 'learning-planner-database';
export const PLAN_KIND = 'learning-plan';
export const SCHEMA_VERSION = 2;
export const RELEASE_DATABASE_SCHEMA_VERSION = 3;
export const RELEASE_PLAN_SCHEMA_VERSION = 3;

const SUPPORTED_RELEASE_PLAN_SCHEMA_VERSIONS = [1, 2, RELEASE_PLAN_SCHEMA_VERSION];
const DELIVERY_DEPENDENCY_TYPES = [
    'required_before_start',
    'overlap_after_design',
    'required_at_final_gate',
    'required_at_paid_gate'
];

export const RELEASE_STATUSES = [
    'complete',
    'validation',
    'in_progress',
    'partial',
    'config_gated',
    'blocked',
    'not_started',
    'future',
    'superseded'
];

export const RELEASE_READINESS_STATUSES = [
    'ready',
    'not_ready',
    'partially_scheduled',
    'not_assessed'
];

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

function finiteNonNegative(value, path, { integer = false } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
        throw new Error(`${path} deve essere un numero non negativo${integer ? ' intero' : ''}.`);
    }
    return number;
}

function validPercentage(value, path) {
    const number = finiteNonNegative(value, path);
    if (number > 100) {
        throw new Error(`${path} deve essere compreso tra 0 e 100.`);
    }
    return Math.round(number * 10) / 10;
}

function optionalDate(value, path) {
    const normalized = String(value ?? '').trim();
    return normalized ? validDate(normalized, path) : '';
}

function validStatus(value, path) {
    const status = String(value || 'not_started');
    if (!RELEASE_STATUSES.includes(status)) {
        throw new Error(`${path} non è supportato.`);
    }
    return status;
}

function validReadinessStatus(value, path) {
    const status = String(value || 'not_assessed');
    if (!RELEASE_READINESS_STATUSES.includes(status)) {
        throw new Error(`${path} non è uno stato di readiness supportato.`);
    }
    return status;
}

function normalizeStringList(input, path, maxLength = 500) {
    const values = Array.isArray(input) ? input : [];
    return values.map((value, index) => requiredString(value, `${path}[${index}]`, maxLength));
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

function normalizeReleaseEvidence(input, path) {
    return (Array.isArray(input) ? input : []).map((item, index) => {
        const itemPath = `${path}[${index}]`;
        requireObject(item, itemPath);
        return {
            type: optionalString(item.type || 'repository', 60) || 'repository',
            reference: requiredString(item.reference, `${itemPath}.reference`, 240),
            summary: requiredString(item.summary, `${itemPath}.summary`, 1000),
            observedAt: optionalDate(item.observedAt, `${itemPath}.observedAt`)
        };
    });
}

function normalizeExternalLeadTimes(input, path) {
    return (Array.isArray(input) ? input : []).map((leadTime, index) => {
        const itemPath = `${path}[${index}]`;
        requireObject(leadTime, itemPath);
        const minimumWeeks = finiteNonNegative(leadTime.minimumWeeks, `${itemPath}.minimumWeeks`, { integer: true });
        const realisticWeeks = finiteNonNegative(leadTime.realisticWeeks, `${itemPath}.realisticWeeks`, { integer: true });
        const prudentWeeks = finiteNonNegative(leadTime.prudentWeeks, `${itemPath}.prudentWeeks`, { integer: true });
        if (minimumWeeks > realisticWeeks || realisticWeeks > prudentWeeks) {
            throw new Error(`${itemPath} deve rispettare minimo <= realistico <= prudenziale.`);
        }
        return {
            phase: requiredString(leadTime.phase, `${itemPath}.phase`, 240),
            minimumWeeks,
            realisticWeeks,
            prudentWeeks
        };
    });
}

function normalizeDeliveryEstimate(input, path, topicIds) {
    const source = requireObject(input, path);
    const sharedTopicIds = normalizeStringList(source.sharedTopicIds, `${path}.sharedTopicIds`, 120)
        .map((topicId, index) => validId(topicId, `${path}.sharedTopicIds[${index}]`));
    sharedTopicIds.forEach(topicId => {
        if (!topicIds.includes(topicId)) {
            throw new Error(`${path}.sharedTopicIds contiene il topic non associato ${topicId}.`);
        }
    });
    return {
        profile: requiredString(source.profile, `${path}.profile`, 80),
        estimateBasis: requiredString(source.estimateBasis, `${path}.estimateBasis`, 80),
        initialCoefficient: finitePositive(source.initialCoefficient, `${path}.initialCoefficient`),
        appliedCoefficient: finitePositive(source.appliedCoefficient, `${path}.appliedCoefficient`),
        confidence: requiredString(source.confidence, `${path}.confidence`, 40),
        originalPlannedHours: finiteNonNegative(source.originalPlannedHours, `${path}.originalPlannedHours`),
        remainingBaseHours: finiteNonNegative(source.remainingBaseHours, `${path}.remainingBaseHours`),
        correctedRemainingHours: finiteNonNegative(source.correctedRemainingHours, `${path}.correctedRemainingHours`),
        additiveAcrossWorkPackages: source.additiveAcrossWorkPackages === true,
        sharedTopicIds,
        externalLeadTimes: normalizeExternalLeadTimes(source.externalLeadTimes, `${path}.externalLeadTimes`),
        rationale: requiredString(source.rationale, `${path}.rationale`, 1500),
        calendarImpact: requiredString(source.calendarImpact, `${path}.calendarImpact`, 1000)
    };
}

function normalizeDependencyRules(input, path) {
    return (Array.isArray(input) ? input : []).map((rule, index) => {
        const itemPath = `${path}[${index}]`;
        requireObject(rule, itemPath);
        const type = requiredString(rule.type, `${itemPath}.type`, 80);
        if (!DELIVERY_DEPENDENCY_TYPES.includes(type)) {
            throw new Error(`${itemPath}.type non è supportato.`);
        }
        return {
            workPackageId: validId(rule.workPackageId, `${itemPath}.workPackageId`),
            type,
            rationale: requiredString(rule.rationale, `${itemPath}.rationale`, 1000)
        };
    });
}

function normalizeReleaseStatus(input, path, scopeIds) {
    const source = requireObject(input, path);
    const readiness = requireArray(source.readiness, `${path}.readiness`).map((item, index) => {
        const itemPath = `${path}.readiness[${index}]`;
        requireObject(item, itemPath);
        const scopeId = validId(item.scopeId, `${itemPath}.scopeId`);
        if (!scopeIds.has(scopeId)) throw new Error(`${itemPath}.scopeId è sconosciuto.`);
        return {
            scopeId,
            status: validReadinessStatus(item.status, `${itemPath}.status`),
            summary: requiredString(item.summary, `${itemPath}.summary`, 1000)
        };
    });
    return {
        asOf: validDate(source.asOf, `${path}.asOf`),
        headline: requiredString(source.headline, `${path}.headline`, 1000),
        functionalCompletionNote: requiredString(
            source.functionalCompletionNote,
            `${path}.functionalCompletionNote`,
            1500
        ),
        availableNow: normalizeStringList(source.availableNow, `${path}.availableNow`, 1000),
        partialOrDormant: normalizeStringList(source.partialOrDormant, `${path}.partialOrDormant`, 1000),
        nextGateBlockers: normalizeStringList(source.nextGateBlockers, `${path}.nextGateBlockers`, 1000),
        nextStep: requiredString(source.nextStep, `${path}.nextStep`, 1500),
        readiness
    };
}

function normalizeMetricSemantics(input, path) {
    const source = requireObject(input, path);
    const functionalCompletion = requireObject(source.functionalCompletion, `${path}.functionalCompletion`);
    const releaseReadiness = requireObject(source.releaseReadiness, `${path}.releaseReadiness`);
    const scheduleSnapshot = requireObject(source.scheduleSnapshot, `${path}.scheduleSnapshot`);
    const moduleAggregation = requireObject(source.moduleAggregation, `${path}.moduleAggregation`);

    return {
        functionalCompletion: {
            label: requiredString(functionalCompletion.label, `${path}.functionalCompletion.label`, 160),
            formula: requiredString(functionalCompletion.formula, `${path}.functionalCompletion.formula`, 1000),
            comparisonRule: requiredString(
                functionalCompletion.comparisonRule,
                `${path}.functionalCompletion.comparisonRule`,
                1500
            ),
            visionShareFormula: requiredString(
                functionalCompletion.visionShareFormula,
                `${path}.functionalCompletion.visionShareFormula`,
                1000
            ),
            visionShareStatus: requiredString(
                functionalCompletion.visionShareStatus,
                `${path}.functionalCompletion.visionShareStatus`,
                120
            ),
            decisionRequired: requiredString(
                functionalCompletion.decisionRequired,
                `${path}.functionalCompletion.decisionRequired`,
                1500
            )
        },
        releaseReadiness: {
            label: requiredString(releaseReadiness.label, `${path}.releaseReadiness.label`, 160),
            rule: requiredString(releaseReadiness.rule, `${path}.releaseReadiness.rule`, 1000),
            blockingRule: requiredString(
                releaseReadiness.blockingRule,
                `${path}.releaseReadiness.blockingRule`,
                1000
            )
        },
        scheduleSnapshot: {
            label: requiredString(scheduleSnapshot.label, `${path}.scheduleSnapshot.label`, 160),
            rule: requiredString(scheduleSnapshot.rule, `${path}.scheduleSnapshot.rule`, 1000)
        },
        moduleAggregation: {
            label: requiredString(moduleAggregation.label, `${path}.moduleAggregation.label`, 160),
            formula: requiredString(moduleAggregation.formula, `${path}.moduleAggregation.formula`, 1000),
            interpretation: requiredString(
                moduleAggregation.interpretation,
                `${path}.moduleAggregation.interpretation`,
                1000
            )
        }
    };
}

function normalizeDeliveryModel(input, path) {
    const source = requireObject(input, path);
    const classes = requireArray(source.classes, `${path}.classes`).map((item, index) => {
        const itemPath = `${path}.classes[${index}]`;
        requireObject(item, itemPath);
        const range = requireArray(item.range, `${itemPath}.range`);
        if (range.length !== 2) throw new Error(`${itemPath}.range deve contenere minimo e massimo.`);
        const minimum = finitePositive(range[0], `${itemPath}.range[0]`);
        const maximum = finitePositive(range[1], `${itemPath}.range[1]`);
        if (minimum > maximum) throw new Error(`${itemPath}.range è invertito.`);
        return {
            id: validId(item.id, `${itemPath}.id`),
            range: [minimum, maximum],
            meaning: requiredString(item.meaning, `${itemPath}.meaning`, 1000)
        };
    });
    uniqueIds(classes, `${path}.classes`);

    const calibrationInput = requireObject(source.calibration, `${path}.calibration`);
    const calibration = {
        minimumCompletedIssuesOverall: finitePositive(
            calibrationInput.minimumCompletedIssuesOverall,
            `${path}.calibration.minimumCompletedIssuesOverall`,
            { integer: true }
        ),
        minimumCompletedIssuesPerClass: finitePositive(
            calibrationInput.minimumCompletedIssuesPerClass,
            `${path}.calibration.minimumCompletedIssuesPerClass`,
            { integer: true }
        ),
        significantDeviationPercent: validPercentage(
            calibrationInput.significantDeviationPercent,
            `${path}.calibration.significantDeviationPercent`
        ),
        method: requiredString(calibrationInput.method, `${path}.calibration.method`, 1500),
        evidenceOwner: requiredString(calibrationInput.evidenceOwner, `${path}.calibration.evidenceOwner`, 500)
    };

    return {
        version: requiredString(source.version, `${path}.version`, 120),
        estimateInterpretation: requiredString(source.estimateInterpretation, `${path}.estimateInterpretation`, 1500),
        classes,
        reserveRule: requiredString(source.reserveRule, `${path}.reserveRule`, 1000),
        calibration
    };
}

function normalizeDeliveryTotals(input, path) {
    const source = requireObject(input, path);
    const originalInput = requireObject(source.originalBaseline, `${path}.originalBaseline`);
    const revisedInput = requireObject(source.revisedBaseline, `${path}.revisedBaseline`);
    return {
        asOf: validDate(source.asOf, `${path}.asOf`),
        originalBaseline: {
            activeHours: finiteNonNegative(originalInput.activeHours, `${path}.originalBaseline.activeHours`),
            operationalWeeksAtPlannedCapacity: finiteNonNegative(
                originalInput.operationalWeeksAtPlannedCapacity,
                `${path}.originalBaseline.operationalWeeksAtPlannedCapacity`
            ),
            explicitBufferWeeks: finiteNonNegative(
                originalInput.explicitBufferWeeks,
                `${path}.originalBaseline.explicitBufferWeeks`
            ),
            totalWeeksBeforeExternalGates: finiteNonNegative(
                originalInput.totalWeeksBeforeExternalGates,
                `${path}.originalBaseline.totalWeeksBeforeExternalGates`
            ),
            note: requiredString(originalInput.note, `${path}.originalBaseline.note`, 1000)
        },
        revisedBaseline: {
            activeHours: finiteNonNegative(revisedInput.activeHours, `${path}.revisedBaseline.activeHours`),
            completedRecordedHours: finiteNonNegative(
                revisedInput.completedRecordedHours,
                `${path}.revisedBaseline.completedRecordedHours`
            ),
            remainingActiveHours: finiteNonNegative(
                revisedInput.remainingActiveHours,
                `${path}.revisedBaseline.remainingActiveHours`
            ),
            totalOperationalWeeksAtPlannedCapacity: finiteNonNegative(
                revisedInput.totalOperationalWeeksAtPlannedCapacity,
                `${path}.revisedBaseline.totalOperationalWeeksAtPlannedCapacity`
            ),
            remainingOperationalWeeksAtPlannedCapacity: finiteNonNegative(
                revisedInput.remainingOperationalWeeksAtPlannedCapacity,
                `${path}.revisedBaseline.remainingOperationalWeeksAtPlannedCapacity`
            ),
            ganttCalendarWeeks: finiteNonNegative(
                revisedInput.ganttCalendarWeeks,
                `${path}.revisedBaseline.ganttCalendarWeeks`
            ),
            ganttEndDate: validDate(revisedInput.ganttEndDate, `${path}.revisedBaseline.ganttEndDate`),
            ganttRule: requiredString(revisedInput.ganttRule, `${path}.revisedBaseline.ganttRule`, 1000),
            explicitBufferWeeks: finiteNonNegative(
                revisedInput.explicitBufferWeeks,
                `${path}.revisedBaseline.explicitBufferWeeks`
            ),
            weeklyReserveHours: finiteNonNegative(
                revisedInput.weeklyReserveHours,
                `${path}.revisedBaseline.weeklyReserveHours`
            ),
            note: requiredString(revisedInput.note, `${path}.revisedBaseline.note`, 1000)
        },
        comparison: requiredString(source.comparison, `${path}.comparison`, 1500)
    };
}

function normalizeScheduleScope(input, path) {
    const source = requireObject(input, path);
    return {
        scheduledThrough: validId(source.scheduledThrough, `${path}.scheduledThrough`),
        statement: requiredString(source.statement, `${path}.statement`, 1000),
        unscheduledFuture: normalizeStringList(source.unscheduledFuture, `${path}.unscheduledFuture`, 500),
        decisionRequired: requiredString(source.decisionRequired, `${path}.decisionRequired`, 1000)
    };
}

export function calculateReleaseScopeProgress(releasePlan, scopeId) {
    const workPackages = Array.isArray(releasePlan?.workPackages) ? releasePlan.workPackages : [];
    const weightedProgress = workPackages.reduce((total, workPackage) => {
        const weight = Number(workPackage.weights?.[scopeId]) || 0;
        return total + weight * (Number(workPackage.completionPercent) || 0) / 100;
    }, 0);
    return Math.round(weightedProgress * 10) / 10;
}

export function releaseWorkPackagesForTopic(releasePlan, topicId) {
    const workPackages = Array.isArray(releasePlan?.workPackages) ? releasePlan.workPackages : [];
    return workPackages.filter(workPackage => workPackage.topicIds?.includes(topicId));
}

export function summarizeModuleWorkPackageSnapshot(workPackages, topicIds) {
    const topicIdSet = new Set(Array.isArray(topicIds) ? topicIds : []);
    const seenIds = new Set();
    const matchedWorkPackages = (Array.isArray(workPackages) ? workPackages : []).filter(workPackage => {
        if (seenIds.has(workPackage.id)) return false;
        if (!workPackage.topicIds?.some(topicId => topicIdSet.has(topicId))) return false;
        seenIds.add(workPackage.id);
        return true;
    });
    if (matchedWorkPackages.length === 0) {
        return {
            workPackages: [],
            averageCompletionPercent: null,
            minimumCompletionPercent: null,
            maximumCompletionPercent: null
        };
    }

    const completionValues = matchedWorkPackages.map(workPackage => Number(workPackage.completionPercent) || 0);
    const average = completionValues.reduce((total, value) => total + value, 0) / completionValues.length;
    return {
        workPackages: matchedWorkPackages,
        averageCompletionPercent: Math.round(average),
        minimumCompletionPercent: Math.min(...completionValues),
        maximumCompletionPercent: Math.max(...completionValues)
    };
}

export function summarizeScopeGateReadiness(releasePlan, scopeId) {
    const applicableGates = (Array.isArray(releasePlan?.gates) ? releasePlan.gates : [])
        .filter(gate => gate.requiredFor?.includes(scopeId));
    const passedGates = applicableGates.filter(gate => gate.status === 'complete');
    const declared = releasePlan?.releaseStatus?.readiness?.find(item => item.scopeId === scopeId) || null;
    const blockingGates = applicableGates.filter(gate => gate.status !== 'complete');
    const declaredStatus = declared?.status || 'not_assessed';
    const status = declaredStatus === 'ready' && (applicableGates.length === 0 || blockingGates.length > 0)
        ? 'not_ready'
        : declaredStatus;
    return {
        status,
        summary: declared?.summary || 'Readiness non valutata.',
        passedGateCount: passedGates.length,
        applicableGateCount: applicableGates.length,
        blockingGates
    };
}

function normalizeReleasePlan(input, topicIds) {
    const source = requireObject(input, 'releasePlan');
    const releasePlanSchemaVersion = Number(source.schemaVersion);
    if (!SUPPORTED_RELEASE_PLAN_SCHEMA_VERSIONS.includes(releasePlanSchemaVersion)) {
        throw new Error(`Versione release plan non supportata: ${source.schemaVersion}.`);
    }
    const hasAdaptiveDelivery = releasePlanSchemaVersion >= 2;
    const hasMetricSemantics = releasePlanSchemaVersion >= 3;

    const sourceSnapshotInput = requireObject(source.sourceSnapshot, 'releasePlan.sourceSnapshot');
    const sourceSnapshot = {
        assessedAt: validDate(sourceSnapshotInput.assessedAt, 'releasePlan.sourceSnapshot.assessedAt'),
        repository: requiredString(sourceSnapshotInput.repository, 'releasePlan.sourceSnapshot.repository', 240),
        branch: requiredString(sourceSnapshotInput.branch, 'releasePlan.sourceSnapshot.branch', 120),
        commit: requiredString(sourceSnapshotInput.commit, 'releasePlan.sourceSnapshot.commit', 80),
        canonicalProgressSource: requiredString(
            sourceSnapshotInput.canonicalProgressSource,
            'releasePlan.sourceSnapshot.canonicalProgressSource',
            300
        ),
        canonicalSnapshotAt: optionalDate(
            sourceSnapshotInput.canonicalSnapshotAt,
            'releasePlan.sourceSnapshot.canonicalSnapshotAt'
        ),
        githubStateAt: optionalDate(sourceSnapshotInput.githubStateAt, 'releasePlan.sourceSnapshot.githubStateAt'),
        productMandateAt: optionalDate(sourceSnapshotInput.productMandateAt, 'releasePlan.sourceSnapshot.productMandateAt'),
        publicationStatus: requiredString(
            sourceSnapshotInput.publicationStatus,
            'releasePlan.sourceSnapshot.publicationStatus',
            80
        ),
        notes: optionalString(sourceSnapshotInput.notes, 2000)
    };

    const capacityInput = requireObject(source.capacity, 'releasePlan.capacity');
    const capacity = {
        basis: requiredString(capacityInput.basis, 'releasePlan.capacity.basis', 160),
        effectiveFrom: validDate(capacityInput.effectiveFrom, 'releasePlan.capacity.effectiveFrom'),
        grossWeeklyMinutes: finitePositive(
            capacityInput.grossWeeklyMinutes,
            'releasePlan.capacity.grossWeeklyMinutes',
            { integer: true }
        ),
        plannedWeeklyMinutes: finitePositive(
            capacityInput.plannedWeeklyMinutes,
            'releasePlan.capacity.plannedWeeklyMinutes',
            { integer: true }
        ),
        reserveWeeklyMinutes: finiteNonNegative(
            capacityInput.reserveWeeklyMinutes,
            'releasePlan.capacity.reserveWeeklyMinutes',
            { integer: true }
        ),
        calibrationWindowWeeks: finitePositive(
            capacityInput.calibrationWindowWeeks,
            'releasePlan.capacity.calibrationWindowWeeks',
            { integer: true }
        ),
        officialLimitEvidence: requiredString(
            capacityInput.officialLimitEvidence,
            'releasePlan.capacity.officialLimitEvidence',
            500
        ),
        empiricalBaseline: requiredString(
            capacityInput.empiricalBaseline,
            'releasePlan.capacity.empiricalBaseline',
            1000
        ),
        assumptions: normalizeStringList(capacityInput.assumptions, 'releasePlan.capacity.assumptions', 1000)
    };
    if (capacity.plannedWeeklyMinutes + capacity.reserveWeeklyMinutes > capacity.grossWeeklyMinutes) {
        throw new Error('La capacità pianificata e la riserva superano la capacità settimanale lorda.');
    }

    const methodologyInput = requireObject(source.methodology, 'releasePlan.methodology');
    const methodology = {
        calculation: requiredString(methodologyInput.calculation, 'releasePlan.methodology.calculation', 1000),
        evidenceRule: requiredString(methodologyInput.evidenceRule, 'releasePlan.methodology.evidenceRule', 1000),
        denominatorRule: requiredString(methodologyInput.denominatorRule, 'releasePlan.methodology.denominatorRule', 1000),
        scale: normalizeStringList(methodologyInput.scale, 'releasePlan.methodology.scale', 500)
    };
    const metricSemantics = hasMetricSemantics
        ? normalizeMetricSemantics(source.metricSemantics, 'releasePlan.metricSemantics')
        : null;

    const scopes = requireArray(source.scopes, 'releasePlan.scopes').map((scope, index) => {
        const path = `releasePlan.scopes[${index}]`;
        requireObject(scope, path);
        return {
            id: validId(scope.id, `${path}.id`),
            label: requiredString(scope.label, `${path}.label`, 160),
            version: requiredString(scope.version, `${path}.version`, 80),
            denominatorVersion: requiredString(scope.denominatorVersion, `${path}.denominatorVersion`, 120),
            reportedCompletionPercent: validPercentage(
                scope.reportedCompletionPercent,
                `${path}.reportedCompletionPercent`
            ),
            lastReviewedAt: validDate(scope.lastReviewedAt, `${path}.lastReviewedAt`),
            status: requiredString(scope.status || 'provisional', `${path}.status`, 80),
            perimeter: requiredString(scope.perimeter, `${path}.perimeter`, 1200),
            canonicalSource: requiredString(scope.canonicalSource, `${path}.canonicalSource`, 300),
            notes: optionalString(scope.notes, 2000)
        };
    });
    uniqueIds(scopes, 'releasePlan.scopes');
    const scopeIds = new Set(scopes.map(scope => scope.id));
    const releaseStatus = hasAdaptiveDelivery
        ? normalizeReleaseStatus(source.releaseStatus, 'releasePlan.releaseStatus', scopeIds)
        : null;
    const deliveryModel = hasAdaptiveDelivery
        ? normalizeDeliveryModel(source.deliveryModel, 'releasePlan.deliveryModel')
        : null;
    const deliveryTotals = hasAdaptiveDelivery
        ? normalizeDeliveryTotals(source.deliveryTotals, 'releasePlan.deliveryTotals')
        : null;
    const scheduleScope = hasAdaptiveDelivery
        ? normalizeScheduleScope(source.scheduleScope, 'releasePlan.scheduleScope')
        : null;
    if (scheduleScope && !scopeIds.has(scheduleScope.scheduledThrough)) {
        throw new Error('releasePlan.scheduleScope.scheduledThrough contiene uno scope sconosciuto.');
    }

    const workPackages = requireArray(source.workPackages, 'releasePlan.workPackages').map((workPackage, index) => {
        const path = `releasePlan.workPackages[${index}]`;
        requireObject(workPackage, path);
        const weightsInput = workPackage.weights && typeof workPackage.weights === 'object'
            ? workPackage.weights
            : {};
        Object.keys(weightsInput).forEach(scopeId => {
            if (!scopeIds.has(scopeId)) {
                throw new Error(`${path}.weights contiene lo scope sconosciuto ${scopeId}.`);
            }
        });
        const mappedTopicIds = normalizeStringList(workPackage.topicIds, `${path}.topicIds`, 120)
            .map((topicId, topicIndex) => validId(topicId, `${path}.topicIds[${topicIndex}]`));
        mappedTopicIds.forEach(topicId => {
            if (!topicIds.has(topicId)) {
                throw new Error(`${path}.topicIds contiene l'argomento sconosciuto ${topicId}.`);
            }
        });
        const normalized = {
            id: validId(workPackage.id, `${path}.id`),
            title: requiredString(workPackage.title, `${path}.title`, 240),
            description: requiredString(workPackage.description, `${path}.description`, 1500),
            status: validStatus(workPackage.status, `${path}.status`),
            completionPercent: validPercentage(workPackage.completionPercent, `${path}.completionPercent`),
            weights: Object.fromEntries([...scopeIds].map(scopeId => [
                scopeId,
                finiteNonNegative(weightsInput[scopeId] ?? 0, `${path}.weights.${scopeId}`)
            ])),
            topicIds: mappedTopicIds,
            dependencies: normalizeStringList(workPackage.dependencies, `${path}.dependencies`, 120)
                .map((dependency, dependencyIndex) => validId(dependency, `${path}.dependencies[${dependencyIndex}]`)),
            issueRefs: normalizeStringList(workPackage.issueRefs, `${path}.issueRefs`, 120),
            criticalPath: workPackage.criticalPath === true,
            owner: requiredString(workPackage.owner, `${path}.owner`, 160),
            lastReviewedAt: validDate(workPackage.lastReviewedAt, `${path}.lastReviewedAt`),
            evidence: normalizeReleaseEvidence(workPackage.evidence, `${path}.evidence`),
            acceptanceSummary: requiredString(
                workPackage.acceptanceSummary,
                `${path}.acceptanceSummary`,
                1500
            )
        };
        if (hasAdaptiveDelivery) {
            Object.assign(normalized, {
                productOutcome: requiredString(workPackage.productOutcome, `${path}.productOutcome`, 1500),
                currentStateSummary: requiredString(
                    workPackage.currentStateSummary,
                    `${path}.currentStateSummary`,
                    1500
                ),
                remainingWorkSummary: requiredString(
                    workPackage.remainingWorkSummary,
                    `${path}.remainingWorkSummary`,
                    1500
                ),
                dependencySummary: requiredString(
                    workPackage.dependencySummary,
                    `${path}.dependencySummary`,
                    1500
                ),
                dependencyRules: normalizeDependencyRules(workPackage.dependencyRules, `${path}.dependencyRules`),
                deliveryEstimate: normalizeDeliveryEstimate(
                    workPackage.deliveryEstimate,
                    `${path}.deliveryEstimate`,
                    mappedTopicIds
                )
            });
        }
        return normalized;
    });
    uniqueIds(workPackages, 'releasePlan.workPackages');
    const workPackageIds = new Set(workPackages.map(workPackage => workPackage.id));
    workPackages.forEach((workPackage, index) => {
        workPackage.dependencies.forEach(dependency => {
            if (!workPackageIds.has(dependency)) {
                throw new Error(`releasePlan.workPackages[${index}] dipende dal work package sconosciuto ${dependency}.`);
            }
        });
        (workPackage.dependencyRules || []).forEach(rule => {
            if (!workPackageIds.has(rule.workPackageId)) {
                throw new Error(
                    `releasePlan.workPackages[${index}].dependencyRules usa il work package sconosciuto ${rule.workPackageId}.`
                );
            }
            if (!workPackage.dependencies.includes(rule.workPackageId)) {
                throw new Error(
                    `releasePlan.workPackages[${index}].dependencyRules non è coerente con dependencies.`
                );
            }
        });
    });

    scopes.forEach((scope, index) => {
        const totalWeight = workPackages.reduce((total, workPackage) => total + workPackage.weights[scope.id], 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error(`I pesi di releasePlan.scopes[${index}] sommano ${totalWeight}, atteso 100.`);
        }
        const calculated = calculateReleaseScopeProgress({ workPackages }, scope.id);
        if (Math.abs(calculated - scope.reportedCompletionPercent) > 0.05) {
            throw new Error(
                `La percentuale dichiarata per ${scope.id} (${scope.reportedCompletionPercent}) diverge dal calcolo (${calculated}).`
            );
        }
    });

    const gates = requireArray(source.gates, 'releasePlan.gates').map((gate, index) => {
        const path = `releasePlan.gates[${index}]`;
        requireObject(gate, path);
        const requiredFor = normalizeStringList(gate.requiredFor, `${path}.requiredFor`, 120)
            .map((scopeId, scopeIndex) => validId(scopeId, `${path}.requiredFor[${scopeIndex}]`));
        requiredFor.forEach(scopeId => {
            if (!scopeIds.has(scopeId)) throw new Error(`${path}.requiredFor contiene lo scope sconosciuto ${scopeId}.`);
        });
        return {
            id: validId(gate.id, `${path}.id`),
            title: requiredString(gate.title, `${path}.title`, 240),
            status: validStatus(gate.status, `${path}.status`),
            owner: requiredString(gate.owner, `${path}.owner`, 160),
            requiredFor,
            criteria: normalizeStringList(gate.criteria, `${path}.criteria`, 1000),
            evidence: normalizeStringList(gate.evidence, `${path}.evidence`, 1000),
            decision: optionalString(gate.decision, 1000),
            lastReviewedAt: validDate(gate.lastReviewedAt, `${path}.lastReviewedAt`)
        };
    });
    uniqueIds(gates, 'releasePlan.gates');
    const gateIds = new Set(gates.map(gate => gate.id));
    if (releaseStatus) {
        releaseStatus.readiness.forEach((item, index) => {
            if (item.status !== 'ready') return;
            const applicableGates = gates.filter(gate => gate.requiredFor.includes(item.scopeId));
            const blockingGates = applicableGates.filter(gate => gate.status !== 'complete');
            if (applicableGates.length === 0 || blockingGates.length > 0) {
                throw new Error(
                    `releasePlan.releaseStatus.readiness[${index}] non può essere ready: `
                    + 'tutti i gate applicabili devono esistere ed essere complete.'
                );
            }
        });
    }

    const forecasts = requireArray(source.forecasts, 'releasePlan.forecasts').map((forecast, index) => {
        const path = `releasePlan.forecasts[${index}]`;
        requireObject(forecast, path);
        const theoreticalDate = validDate(forecast.theoreticalDate, `${path}.theoreticalDate`);
        const realisticStart = validDate(forecast.realisticStart, `${path}.realisticStart`);
        const realisticEnd = validDate(forecast.realisticEnd, `${path}.realisticEnd`);
        const prudentStart = validDate(forecast.prudentStart, `${path}.prudentStart`);
        const prudentEnd = validDate(forecast.prudentEnd, `${path}.prudentEnd`);
        if (realisticStart > realisticEnd || prudentStart > prudentEnd) {
            throw new Error(`${path} contiene un intervallo invertito.`);
        }
        return {
            id: validId(forecast.id, `${path}.id`),
            label: requiredString(forecast.label, `${path}.label`, 160),
            theoreticalDate,
            realisticStart,
            realisticEnd,
            prudentStart,
            prudentEnd,
            commitmentStatus: requiredString(forecast.commitmentStatus, `${path}.commitmentStatus`, 120),
            assumptions: normalizeStringList(forecast.assumptions, `${path}.assumptions`, 1000)
        };
    });
    uniqueIds(forecasts, 'releasePlan.forecasts');
    const forecastIds = new Set(forecasts.map(forecast => forecast.id));

    const milestones = requireArray(source.milestones, 'releasePlan.milestones').map((milestone, index) => {
        const path = `releasePlan.milestones[${index}]`;
        requireObject(milestone, path);
        const forecastId = optionalString(milestone.forecastId, 120);
        if (forecastId && !forecastIds.has(forecastId)) {
            throw new Error(`${path}.forecastId contiene il forecast sconosciuto ${forecastId}.`);
        }
        const milestoneGateIds = normalizeStringList(milestone.gateIds, `${path}.gateIds`, 120)
            .map((gateId, gateIndex) => validId(gateId, `${path}.gateIds[${gateIndex}]`));
        milestoneGateIds.forEach(gateId => {
            if (!gateIds.has(gateId)) throw new Error(`${path}.gateIds contiene il gate sconosciuto ${gateId}.`);
        });
        return {
            id: validId(milestone.id, `${path}.id`),
            title: requiredString(milestone.title, `${path}.title`, 240),
            status: validStatus(milestone.status, `${path}.status`),
            kind: requiredString(milestone.kind, `${path}.kind`, 80),
            forecastId,
            gateIds: milestoneGateIds,
            description: requiredString(milestone.description, `${path}.description`, 1000)
        };
    });
    uniqueIds(milestones, 'releasePlan.milestones');

    const criticalPathInput = requireObject(source.criticalPath, 'releasePlan.criticalPath');
    const criticalWorkPackages = normalizeStringList(
        criticalPathInput.workPackageIds,
        'releasePlan.criticalPath.workPackageIds',
        120
    ).map((workPackageId, index) => validId(workPackageId, `releasePlan.criticalPath.workPackageIds[${index}]`));
    criticalWorkPackages.forEach(workPackageId => {
        if (!workPackageIds.has(workPackageId)) {
            throw new Error(`releasePlan.criticalPath contiene il work package sconosciuto ${workPackageId}.`);
        }
    });
    const criticalGates = normalizeStringList(
        criticalPathInput.gateIds,
        'releasePlan.criticalPath.gateIds',
        120
    ).map((gateId, index) => validId(gateId, `releasePlan.criticalPath.gateIds[${index}]`));
    criticalGates.forEach(gateId => {
        if (!gateIds.has(gateId)) throw new Error(`releasePlan.criticalPath contiene il gate sconosciuto ${gateId}.`);
    });
    const criticalPath = {
        summary: requiredString(criticalPathInput.summary, 'releasePlan.criticalPath.summary', 1500),
        workPackageIds: criticalWorkPackages,
        gateIds: criticalGates
    };
    if (hasAdaptiveDelivery) {
        const primaryChainWorkPackageIds = normalizeStringList(
            criticalPathInput.primaryChainWorkPackageIds,
            'releasePlan.criticalPath.primaryChainWorkPackageIds',
            120
        ).map((workPackageId, index) => validId(
            workPackageId,
            `releasePlan.criticalPath.primaryChainWorkPackageIds[${index}]`
        ));
        const parallelMandatoryWorkPackageIds = normalizeStringList(
            criticalPathInput.parallelMandatoryWorkPackageIds,
            'releasePlan.criticalPath.parallelMandatoryWorkPackageIds',
            120
        ).map((workPackageId, index) => validId(
            workPackageId,
            `releasePlan.criticalPath.parallelMandatoryWorkPackageIds[${index}]`
        ));
        [...primaryChainWorkPackageIds, ...parallelMandatoryWorkPackageIds].forEach(workPackageId => {
            if (!workPackageIds.has(workPackageId)) {
                throw new Error(`releasePlan.criticalPath usa il work package sconosciuto ${workPackageId}.`);
            }
        });
        const convergingBranches = requireArray(
            criticalPathInput.convergingBranches,
            'releasePlan.criticalPath.convergingBranches'
        ).map((branch, index) => {
            const path = `releasePlan.criticalPath.convergingBranches[${index}]`;
            requireObject(branch, path);
            const branchWorkPackageIds = normalizeStringList(branch.workPackageIds, `${path}.workPackageIds`, 120)
                .map((workPackageId, workPackageIndex) => validId(
                    workPackageId,
                    `${path}.workPackageIds[${workPackageIndex}]`
                ));
            branchWorkPackageIds.forEach(workPackageId => {
                if (!workPackageIds.has(workPackageId)) {
                    throw new Error(`${path} usa il work package sconosciuto ${workPackageId}.`);
                }
            });
            const joinsAt = validId(branch.joinsAt, `${path}.joinsAt`);
            if (!gateIds.has(joinsAt)) throw new Error(`${path}.joinsAt usa il gate sconosciuto ${joinsAt}.`);
            return {
                id: validId(branch.id, `${path}.id`),
                label: requiredString(branch.label, `${path}.label`, 240),
                workPackageIds: branchWorkPackageIds,
                joinsAt
            };
        });
        uniqueIds(convergingBranches, 'releasePlan.criticalPath.convergingBranches');
        Object.assign(criticalPath, {
            primaryChainWorkPackageIds,
            parallelMandatoryWorkPackageIds,
            convergingBranches
        });
    }

    const risks = requireArray(source.risks, 'releasePlan.risks').map((risk, index) => {
        const path = `releasePlan.risks[${index}]`;
        requireObject(risk, path);
        return {
            id: validId(risk.id, `${path}.id`),
            title: requiredString(risk.title, `${path}.title`, 240),
            level: requiredString(risk.level, `${path}.level`, 40),
            owner: requiredString(risk.owner, `${path}.owner`, 160),
            trigger: requiredString(risk.trigger, `${path}.trigger`, 1000),
            mitigation: requiredString(risk.mitigation, `${path}.mitigation`, 1500),
            decisionNeeded: optionalString(risk.decisionNeeded, 1000)
        };
    });
    uniqueIds(risks, 'releasePlan.risks');

    const changeHistory = requireArray(source.changeHistory, 'releasePlan.changeHistory').map((change, index) => {
        const path = `releasePlan.changeHistory[${index}]`;
        requireObject(change, path);
        return {
            date: validDate(change.date, `${path}.date`),
            kind: requiredString(change.kind, `${path}.kind`, 80),
            summary: requiredString(change.summary, `${path}.summary`, 1500),
            scopeIds: normalizeStringList(change.scopeIds, `${path}.scopeIds`, 120),
            from: optionalString(change.from, 500),
            to: optionalString(change.to, 500),
            evidence: optionalString(change.evidence, 1000)
        };
    });

    const scopeChanges = requireArray(source.scopeChanges, 'releasePlan.scopeChanges').map((change, index) => {
        const path = `releasePlan.scopeChanges[${index}]`;
        requireObject(change, path);
        const scopeId = validId(change.scopeId, `${path}.scopeId`);
        if (!scopeIds.has(scopeId)) throw new Error(`${path}.scopeId contiene lo scope sconosciuto ${scopeId}.`);
        return {
            date: validDate(change.date, `${path}.date`),
            scopeId,
            fromVersion: requiredString(change.fromVersion, `${path}.fromVersion`, 120),
            toVersion: requiredString(change.toVersion, `${path}.toVersion`, 120),
            change: requiredString(change.change, `${path}.change`, 1500),
            denominatorImpact: requiredString(change.denominatorImpact, `${path}.denominatorImpact`, 1000)
        };
    });

    return {
        schemaVersion: releasePlanSchemaVersion,
        sourceSnapshot,
        methodology,
        capacity,
        scopes,
        ...(hasMetricSemantics ? { metricSemantics } : {}),
        ...(hasAdaptiveDelivery ? { releaseStatus, deliveryModel, deliveryTotals, scheduleScope } : {}),
        workPackages,
        gates,
        milestones,
        forecasts,
        criticalPath,
        risks,
        changeHistory,
        scopeChanges
    };
}

function normalizeV2Database(input) {
    const source = requireObject(input, 'database');
    if (source.kind !== DATABASE_KIND) {
        throw new Error(`Tipo di database non supportato: ${source.kind || '(mancante)'}.`);
    }
    const databaseSchemaVersion = Number(source.schemaVersion);
    if (![SCHEMA_VERSION, RELEASE_DATABASE_SCHEMA_VERSION].includes(databaseSchemaVersion)) {
        throw new Error(`Versione database non supportata: ${source.schemaVersion}.`);
    }
    if (databaseSchemaVersion === RELEASE_DATABASE_SCHEMA_VERSION && !source.releasePlan) {
        throw new Error('Un database v3 deve contenere releasePlan.');
    }

    const metadata = requireObject(source.metadata, 'metadata');
    const categories = normalizeCategories(source.categories);
    const categoryIds = new Set(categories.map(category => category.id));
    const plan = normalizePlan(source.plan);
    const topicIds = new Set(plan.modules.flatMap(module => module.topics).map(topic => topic.id));

    const normalized = {
        kind: DATABASE_KIND,
        schemaVersion: databaseSchemaVersion,
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
    if (source.releasePlan) {
        normalized.releasePlan = normalizeReleasePlan(source.releasePlan, topicIds);
    }
    return normalized;
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
        if (draft.releasePlan) {
            delete draft.releasePlan;
            draft.schemaVersion = SCHEMA_VERSION;
        }
    });
}

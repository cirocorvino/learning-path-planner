import {
    DAY_KEYS,
    TOPIC_KINDS,
    calculateActualEntriesMetrics,
    calculateActualWorkMetrics,
    summarizeReconciliationEvidence
} from './model.js';

const DAY_BY_UTC_INDEX = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
];

export function parseIsoDate(value) {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export function toIsoDate(date) {
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
}

export function addDays(date, days) {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

export function daysBetween(start, end) {
    return Math.round((parseIsoDate(end) - parseIsoDate(start)) / 86_400_000);
}

export function getTimelineMonths(startDate, endDate, locale = 'it-IT') {
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

export function minutesBetween(start, end) {
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

function abstractReleaseCapacity(database) {
    return database.releasePlan?.capacity?.scheduleMode === 'abstract_weekly_capacity'
        ? Number(database.releasePlan.capacity.plannedWeeklyMinutes) || 0
        : null;
}

export function effectiveTopicMinutes(topic, multipliers = {}) {
    const kind = TOPIC_KINDS.includes(topic.kind) ? topic.kind : 'other';
    const multiplier = Number(multipliers[kind]) || 1;
    return Math.max(1, Math.round(Number(topic.estimatedMinutes) * multiplier));
}

export function moduleEffectiveMinutes(module, multipliers = {}) {
    if (module.mode === 'buffer') return 0;
    return module.topics.reduce(
        (total, topic) => total + effectiveTopicMinutes(topic, multipliers),
        0
    );
}

export function remainingTopicMinutes(topic, multipliers = {}, progress = {}) {
    const effectiveMinutes = effectiveTopicMinutes(topic, multipliers);
    const topicProgress = progress?.[topic.id];
    if (topicProgress?.completed === true) return 0;
    const multiplier = Number(multipliers[topic.kind]) || 1;
    const completedMinutes = Math.max(0, Math.round(Number(topicProgress?.completedMinutes) || 0));
    const effectiveCompletedMinutes = Math.round(completedMinutes * multiplier);
    return Math.max(0, effectiveMinutes - effectiveCompletedMinutes);
}

export function moduleRemainingMinutes(module, multipliers = {}, progress = {}) {
    if (module.mode === 'buffer') return 0;
    return module.topics.reduce(
        (total, topic) => total + remainingTopicMinutes(topic, multipliers, progress),
        0
    );
}

export function getWeeklyCapacity(database) {
    const abstractCapacity = abstractReleaseCapacity(database);
    if (abstractCapacity !== null) return abstractCapacity;
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

export function getWeekTemplateForStart(database, weekStart) {
    const hideClockCalendar = abstractReleaseCapacity(database) !== null;
    const focusIds = focusCategoryIds(database);
    const categories = categoryMap(database);

    return Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(weekStart, dayOffset);
        const dateKey = toIsoDate(date);
        const dayKey = dayKeyForDate(date);
        const exception = exceptionForDate(database, date);
        const sessions = (hideClockCalendar ? [] : (database.weekTemplate[dayKey] || [])).map(session => {
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

export function getWeekCapacity(database, weekStart) {
    const abstractCapacity = abstractReleaseCapacity(database);
    if (abstractCapacity !== null) return abstractCapacity;
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

export function getActualWorkWeeks(database) {
    const daily = calculateActualWorkMetrics(database.releasePlan).daily;
    if (daily.length === 0) return [];
    const planStart = parseIsoDate(database.plan.startDate);
    const weeks = new Map();

    daily.forEach(day => {
        const dayOffset = daysBetween(database.plan.startDate, day.date);
        const weekOffset = Math.floor(dayOffset / 7) * 7;
        const weekStart = addDays(planStart, weekOffset);
        const weekStartDate = toIsoDate(weekStart);
        if (!weeks.has(weekStartDate)) {
            weeks.set(weekStartDate, {
                id: `actual-week-${weekStartDate}`,
                startDate: weekStartDate,
                endDate: toIsoDate(addDays(weekStart, 6)),
                taskElapsedSeconds: 0,
                dailyUnionElapsedSeconds: 0,
                unplacedElapsedSeconds: 0,
                openEntryCount: 0,
                dayCount: 0
            });
        }
        const week = weeks.get(weekStartDate);
        week.taskElapsedSeconds += day.taskElapsedSeconds;
        week.dailyUnionElapsedSeconds += day.dailyUnionElapsedSeconds;
        week.unplacedElapsedSeconds += day.unplacedElapsedSeconds;
        week.openEntryCount += day.openEntryCount;
        week.dayCount += 1;
    });

    return [...weeks.values()].sort((left, right) => left.startDate.localeCompare(right.startDate));
}

export function getReconciledActualActivities(database) {
    const reconciliation = database.releasePlan?.scheduleReconciliation;
    const entries = database.releasePlan?.actualWorkLog?.entries || [];
    if (!reconciliation) return [];
    const entryById = new Map(entries.map(entry => [entry.id, entry]));
    return reconciliation.activities.map(activity => {
        const activityEntries = activity.entryIds
            .map(entryId => entryById.get(entryId))
            .filter(Boolean);
        const metrics = calculateActualEntriesMetrics(activityEntries);
        const evidence = summarizeReconciliationEvidence(database.releasePlan, activity);
        return {
            ...activity,
            evidenceVerified: evidence.verified,
            evidenceLabel: evidence.label,
            entryCount: metrics.entryCount,
            closedEntryCount: metrics.closedEntryCount,
            openEntryCount: metrics.openEntryCount,
            taskElapsedSeconds: metrics.taskElapsedSeconds,
            dailyUnionElapsedSeconds: metrics.dailyUnionElapsedSeconds,
            unplacedElapsedSeconds: metrics.attestedUnplacedSeconds
        };
    });
}

export function getVisibleGanttModules(schedule) {
    return (schedule?.modules || []).filter(module => module.weeks > 0);
}

export function getForecastStartDate(database) {
    const actualWeeks = getActualWorkWeeks(database);
    if (actualWeeks.length === 0) return database.plan.startDate;
    return toIsoDate(addDays(parseIsoDate(actualWeeks.at(-1).startDate), 7));
}

export function buildPlanSchedule(database) {
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

    const actualWeeks = getActualWorkWeeks(database);
    const actualActivities = getReconciledActualActivities(database);
    const forecastStartDate = actualWeeks.length
        ? toIsoDate(addDays(parseIsoDate(actualWeeks.at(-1).startDate), 7))
        : database.plan.startDate;
    let cursor = parseIsoDate(forecastStartDate);
    const modules = database.plan.modules.map(module => {
        const originalTotalMinutes = moduleEffectiveMinutes(module, database.settings.estimationMultipliers);
        const totalMinutes = moduleRemainingMinutes(
            module,
            database.settings.estimationMultipliers,
            database.state.progress
        );
        const remainingTopicCount = module.topics.filter(topic => remainingTopicMinutes(
            topic,
            database.settings.estimationMultipliers,
            database.state.progress
        ) > 0).length;
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
            originalTotalMinutes,
            completedMinutes: originalTotalMinutes - totalMinutes,
            totalMinutes,
            remainingTopicCount,
            completedTopicCount: module.topics.length - remainingTopicCount,
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
        forecastStartDate,
        endDate: lastScheduled?.endDate || database.plan.startDate,
        actualWeeks,
        actualActivities,
        warnings: [...new Set(warnings)]
    };
}

export function getModuleWeekAllocations(database, moduleId, weekIndex) {
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
        const topicMinutes = remainingTopicMinutes(
            topic,
            database.settings.estimationMultipliers,
            database.state.progress
        );
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

export function getWeekAgenda(database, moduleId, weekIndex) {
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
        placementMode: abstractReleaseCapacity(database) !== null
            ? 'abstract_weekly_capacity'
            : 'clock_slots',
        allocations,
        days
    };
}

export function formatDuration(minutes) {
    const value = Number(minutes) || 0;
    const hours = Math.floor(value / 60);
    const remainder = value % 60;
    if (hours === 0) return `${remainder} min`;
    if (remainder === 0) return `${hours} h`;
    return `${hours} h ${remainder} min`;
}

export function formatDate(date, locale = 'it-IT', options = {}) {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: options.year ? 'numeric' : undefined,
        timeZone: 'UTC'
    }).format(parseIsoDate(date));
}

export function formatDayName(date, locale = 'it-IT') {
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC'
    }).format(date);
}

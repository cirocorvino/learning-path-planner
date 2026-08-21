import {
    calculateActualEntriesMetrics,
    calculateActualWorkMetrics,
    releaseWorkPackagesForTopic,
    summarizeModuleWorkPackageSnapshot
} from './model.js';
import { formatDate, formatDayName, formatDuration, parseIsoDate } from './planner.js';

function contributorViewModel(workPackage, locale) {
    const snapshotDate = formatDate(workPackage.lastReviewedAt, locale, { year: true });
    return {
        id: workPackage.id,
        title: workPackage.title,
        completionPercent: workPackage.completionPercent,
        criticalPath: workPackage.criticalPath === true,
        snapshotDate,
        text: `${workPackage.title}: ${workPackage.completionPercent}% · snapshot ${snapshotDate}`
    };
}

export function formatElapsedSeconds(value) {
    const totalSeconds = Math.max(0, Math.round(Number(value) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours ? `${hours} h` : '',
        minutes ? `${minutes} min` : '',
        seconds || (!hours && !minutes) ? `${seconds} s` : ''
    ].filter(Boolean).join(' ');
}

function formatClock(timestamp, locale, timeZone) {
    return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone
    }).format(new Date(timestamp));
}

function formatClockMinute(timestamp, locale, timeZone) {
    return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone
    }).format(new Date(timestamp));
}

function formatOutputTimestamp(timestamp, locale, timeZone) {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone
    }).format(new Date(timestamp));
}

function dayTimingText(entry, dayDate, elapsedSeconds, locale) {
    const timing = entry.timing;
    if (timing.kind !== 'clock_interval') {
        return timing.kind === 'unplaced_duration'
            ? `Durata attestata non collocata · ${formatElapsedSeconds(elapsedSeconds)}`
            : `Dalle ${formatClock(timing.startAt, locale, timing.timeZone)} · in corso`;
    }

    const startDate = timing.startAt.slice(0, 10);
    const endDate = timing.endAt.slice(0, 10);
    const isSplit = startDate !== endDate;
    const startText = dayDate === startDate
        ? formatClock(timing.startAt, locale, timing.timeZone)
        : '00:00:00';
    const endText = dayDate === endDate
        ? formatClock(timing.endAt, locale, timing.timeZone)
        : '24:00:00';
    return `${startText}–${endText} · ${formatElapsedSeconds(elapsedSeconds)}${isSplit ? ' · quota del giorno' : ''}`;
}

function dayClockText(entry, dayDate, locale) {
    const timing = entry.timing;
    if (timing.kind === 'unplaced_duration') return 'Durata non collocata';
    if (timing.kind === 'open_interval') {
        return `Dalle ${formatClockMinute(timing.startAt, locale, timing.timeZone)} · in corso`;
    }
    const startDate = timing.startAt.slice(0, 10);
    const endDate = timing.endAt.slice(0, 10);
    const startText = dayDate === startDate
        ? formatClockMinute(timing.startAt, locale, timing.timeZone)
        : '00:00';
    const endText = dayDate === endDate
        ? formatClockMinute(timing.endAt, locale, timing.timeZone)
        : '24:00';
    return `${startText}–${endText}`;
}

function actualEntryViewModel(
    entry,
    sourceById,
    outputEvidenceById,
    workPackageById,
    locale,
    outputTimeZone,
    dayDate,
    dayElapsedSeconds
) {
    const timing = entry.timing;
    let timingText;
    let elapsedSeconds = 0;
    if (timing.kind === 'clock_interval') {
        elapsedSeconds = timing.actualClockElapsedSeconds;
        timingText = `${formatClock(timing.startAt, locale, timing.timeZone)}–${formatClock(timing.endAt, locale, timing.timeZone)} · ${formatElapsedSeconds(elapsedSeconds)}`;
    } else if (timing.kind === 'unplaced_duration') {
        elapsedSeconds = timing.attestedDurationSeconds;
        timingText = `Durata attestata non collocata · ${formatElapsedSeconds(elapsedSeconds)}`;
    } else {
        timingText = `Dalle ${formatClock(timing.startAt, locale, timing.timeZone)} · in corso`;
    }
    return {
        id: entry.id,
        roleTask: entry.roleTask,
        topicLabel: entry.topicLabel,
        description: entry.description,
        status: entry.status,
        timingKind: timing.kind,
        timingSortKey: timing.startAt || `${entry.date}T23:59:59Z`,
        timingText,
        elapsedSeconds,
        dayElapsedSeconds,
        dayElapsedText: formatElapsedSeconds(dayElapsedSeconds),
        dayTimingText: dayTimingText(entry, dayDate, dayElapsedSeconds, locale),
        dayClockText: dayClockText(entry, dayDate, locale),
        references: entry.references.map(reference => ({ ...reference })),
        referencesText: entry.references.map(reference => `${reference.kind.toUpperCase()} ${reference.reference}`).join(' · '),
        workPackagesText: entry.workPackageIds
            .map(workPackageId => workPackageById.get(workPackageId)?.title || workPackageId)
            .join(' · '),
        agentEffortText: entry.agentEffortEquivalentMinutes === null
            ? 'Effort agentico non attestato'
            : `Effort agentico: ${formatDuration(entry.agentEffortEquivalentMinutes)}`,
        source: sourceById.get(entry.timestampSourceId),
        outputEvidence: entry.outputEvidenceIds.map(evidenceId => {
            const evidence = outputEvidenceById.get(evidenceId);
            return {
                ...evidence,
                publishedText: formatOutputTimestamp(evidence.publishedAt, locale, outputTimeZone),
                finalizedText: formatOutputTimestamp(evidence.finalizedAt, locale, outputTimeZone),
                text: [
                    `${evidence.reference} · ${evidence.status}`,
                    `pubblicazione ${formatOutputTimestamp(evidence.publishedAt, locale, outputTimeZone)}`,
                    evidence.finalizedAt
                        ? `chiusura ${formatOutputTimestamp(evidence.finalizedAt, locale, outputTimeZone)}`
                        : '',
                    evidence.summary
                ].filter(Boolean).join(' · ')
            };
        })
    };
}

export function buildActualWorkLogPresentation(releasePlan, locale = 'it-IT', outputTimeZone = 'Europe/Rome') {
    const log = releasePlan?.actualWorkLog;
    if (!log) return null;
    const metrics = calculateActualWorkMetrics(releasePlan);
    const sourceById = new Map(log.sources.map(source => [source.id, source]));
    const outputEvidenceById = new Map(log.outputEvidence.map(item => [item.id, item]));
    const workPackageById = new Map(releasePlan.workPackages.map(workPackage => [workPackage.id, workPackage]));
    const entryById = new Map(log.entries.map(entry => [entry.id, entry]));
    const totals = items => items
        .filter(item => item.elapsedSeconds > 0)
        .sort((left, right) => right.elapsedSeconds - left.elapsedSeconds)
        .map(item => ({
            ...item,
            elapsedText: formatElapsedSeconds(item.elapsedSeconds),
            entryCount: item.entryIds.length
        }));

    return {
        empty: log.entries.length === 0,
        emptyText: 'Nessuna attività attestata registrata.',
        coverageNote: log.coverageNote,
        entryRule: log.entryRule,
        semantics: [
            { label: 'Effort agentico', text: log.semantics.agenticEffort },
            { label: 'Lead time umano', text: log.semantics.humanLeadTime },
            { label: 'Intervallo reale', text: log.semantics.observedClock }
        ],
        summary: {
            taskElapsedText: formatElapsedSeconds(metrics.taskElapsedSeconds),
            dailyUnionText: formatElapsedSeconds(metrics.dailyUnionElapsedSeconds),
            unplacedText: formatElapsedSeconds(metrics.attestedUnplacedSeconds),
            agentEffortText: metrics.agentEffortEquivalentMinutes === null
                ? 'Non attestato'
                : formatDuration(metrics.agentEffortEquivalentMinutes),
            closedEntryCount: metrics.closedEntryCount,
            openEntryCount: metrics.openEntryCount
        },
        days: metrics.daily.map(day => ({
            date: day.date,
            dateText: formatDate(day.date, locale, { year: true }),
            taskElapsedSeconds: day.taskElapsedSeconds,
            dailyUnionElapsedSeconds: day.dailyUnionElapsedSeconds,
            unplacedElapsedSeconds: day.unplacedElapsedSeconds,
            taskElapsedText: formatElapsedSeconds(day.taskElapsedSeconds),
            dailyUnionText: formatElapsedSeconds(day.dailyUnionElapsedSeconds),
            unplacedText: formatElapsedSeconds(day.unplacedElapsedSeconds),
            openEntryCount: day.openEntryCount,
            entries: day.entries.map(entry => actualEntryViewModel(
                entry,
                sourceById,
                outputEvidenceById,
                workPackageById,
                locale,
                outputTimeZone,
                day.date,
                day.entryElapsedSeconds[entry.id] || 0
            ))
        })),
        referenceTotals: totals(metrics.referenceTotals),
        workPackageTotals: totals(metrics.workPackageTotals).map(item => ({
            ...item,
            label: workPackageById.get(item.workPackageId)?.title || item.workPackageId
        })),
        sourceByEntry: new Map([...entryById].map(([entryId, entry]) => [
            entryId,
            sourceById.get(entry.timestampSourceId)
        ]))
    };
}

function referenceLabel(reference) {
    const kind = reference.kind === 'pr'
        ? 'PR'
        : reference.kind === 'issue'
            ? 'Issue'
            : reference.kind.toUpperCase();
    return `${kind} ${reference.reference}`;
}

function uniqueText(values) {
    return [...new Set(values.filter(Boolean))];
}

const RECONCILIATION_KIND_LABELS = {
    planned: 'Attività prevista',
    anticipated: 'Attività futura anticipata',
    added: 'Attività aggiunta al piano',
    added_and_anticipated: 'Attività aggiunta e anticipo'
};

function buildReconciliationActivities(releasePlan, locale) {
    const reconciliation = releasePlan?.scheduleReconciliation;
    if (!reconciliation) return [];
    const entryById = new Map(releasePlan.actualWorkLog.entries.map(entry => [entry.id, entry]));
    return reconciliation.activities.map(activity => {
        const entries = activity.entryIds.map(entryId => entryById.get(entryId)).filter(Boolean);
        const metrics = calculateActualEntriesMetrics(entries);
        const plannedSeconds = activity.baselinePlannedMinutes === null
            ? null
            : activity.baselinePlannedMinutes * 60;
        const varianceSeconds = plannedSeconds === null
            ? null
            : plannedSeconds - metrics.taskElapsedSeconds;
        let comparisonText = 'Non era presente come blocco autonomo nella baseline.';
        if (plannedSeconds !== null) {
            comparisonText = varianceSeconds >= 0
                ? `Stima del blocco ${formatDuration(activity.baselinePlannedMinutes)} · task attestati ${formatElapsedSeconds(metrics.taskElapsedSeconds)} · margine osservato ${formatElapsedSeconds(varianceSeconds)}`
                : `Stima del blocco ${formatDuration(activity.baselinePlannedMinutes)} · task attestati ${formatElapsedSeconds(metrics.taskElapsedSeconds)} · scostamento oltre stima ${formatElapsedSeconds(Math.abs(varianceSeconds))}`;
        }
        return {
            ...activity,
            kindLabel: RECONCILIATION_KIND_LABELS[activity.kind] || activity.kind,
            taskElapsedSeconds: metrics.taskElapsedSeconds,
            taskElapsedText: formatElapsedSeconds(metrics.taskElapsedSeconds),
            dailyUnionElapsedSeconds: metrics.dailyUnionElapsedSeconds,
            dailyUnionText: formatElapsedSeconds(metrics.dailyUnionElapsedSeconds),
            openEntryCount: metrics.openEntryCount,
            entryCount: metrics.entryCount,
            comparisonText,
            periodText: `${formatDate(activity.startDate, locale, { year: true })} — ${formatDate(activity.endDate, locale, { year: true })}`
        };
    });
}

function groupWeeklyEntries(entries, activityByEntryId) {
    const groups = new Map();
    entries.forEach(entry => {
        const activity = activityByEntryId.get(entry.id) || null;
        const deliveryReferences = entry.references.filter(reference => ['issue', 'pr'].includes(reference.kind));
        const referenceKey = deliveryReferences.length
            ? deliveryReferences.map(reference => `${reference.kind}:${reference.reference}`).sort().join('|')
            : `task:${entry.roleTask}`;
        const key = `${activity?.id || 'unclassified'}|${referenceKey}`;
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                activityId: activity?.id || '',
                activityTitle: activity?.title || entry.topicLabel,
                activityKindLabel: activity?.kindLabel || 'Attività attestata',
                activityColor: activity?.color || '#64748b',
                referenceText: deliveryReferences.length
                    ? deliveryReferences.map(referenceLabel).join(' · ')
                    : entry.roleTask,
                topics: [],
                descriptions: [],
                roles: [],
                workPackages: [],
                elapsedSeconds: 0,
                openEntryCount: 0,
                intervals: [],
                firstTimingKey: entry.timingSortKey
            });
        }
        const group = groups.get(key);
        group.topics.push(entry.topicLabel);
        group.descriptions.push(entry.description);
        group.roles.push(entry.roleTask);
        group.workPackages.push(entry.workPackagesText);
        group.elapsedSeconds += entry.dayElapsedSeconds;
        if (entry.timingKind === 'open_interval') group.openEntryCount += 1;
        group.intervals.push({
            id: entry.id,
            roleTask: entry.roleTask,
            timingText: entry.dayTimingText,
            clockText: entry.dayClockText,
            description: entry.description,
            status: entry.status
        });
    });

    return [...groups.values()].map(group => ({
        ...group,
        topicText: uniqueText(group.topics).join(' · '),
        descriptionText: uniqueText(group.descriptions).join(' '),
        rolesText: uniqueText(group.roles).join(' · '),
        workPackagesText: uniqueText(group.workPackages).join(' · '),
        elapsedText: formatElapsedSeconds(group.elapsedSeconds),
        timingLines: uniqueText(group.intervals.map(interval => interval.clockText))
    })).sort((left, right) => left.firstTimingKey.localeCompare(right.firstTimingKey));
}

export function buildWeeklyActualWorkPresentation(
    releasePlan,
    weekStart,
    weekEnd,
    locale = 'it-IT',
    outputTimeZone = 'Europe/Rome'
) {
    const actual = buildActualWorkLogPresentation(releasePlan, locale, outputTimeZone);
    if (!actual) return null;

    const reconciliationActivities = buildReconciliationActivities(releasePlan, locale)
        .filter(activity => activity.startDate <= weekEnd && activity.endDate >= weekStart);
    const activityByEntryId = new Map();
    reconciliationActivities.forEach(activity => {
        activity.entryIds.forEach(entryId => activityByEntryId.set(entryId, activity));
    });

    const days = actual.days
        .filter(day => day.date >= weekStart && day.date <= weekEnd)
        .map(day => ({
            ...day,
            dayName: formatDayName(parseIsoDate(day.date), locale),
            groups: groupWeeklyEntries(day.entries, activityByEntryId)
        }));
    const taskElapsedSeconds = days.reduce(
        (total, day) => total + day.entries.reduce((dayTotal, entry) => dayTotal + entry.dayElapsedSeconds, 0),
        0
    );
    const dailyUnionElapsedSeconds = days.reduce(
        (total, day) => total + day.dailyUnionElapsedSeconds,
        0
    );
    const unplacedElapsedSeconds = days.reduce(
        (total, day) => total + day.unplacedElapsedSeconds,
        0
    );
    const openEntryCount = days.reduce((total, day) => total + day.openEntryCount, 0);
    const placedTaskElapsedSeconds = Math.max(0, taskElapsedSeconds - unplacedElapsedSeconds);
    const parallelismFactor = dailyUnionElapsedSeconds > 0
        ? placedTaskElapsedSeconds / dailyUnionElapsedSeconds
        : null;
    const calendarOverlapSeconds = Math.max(0, placedTaskElapsedSeconds - dailyUnionElapsedSeconds);

    return {
        empty: days.length === 0,
        displayMode: days.length === 0 ? 'forecast' : 'actual',
        emptyText: 'Nessuna attività attestata in questa settimana. Le attività future restano nel forecast macro e non diventano appuntamenti inventati.',
        coverageText: 'Le attività svolte sono ricondotte al piano: previste, anticipate oppure aggiunte. Gli orari provengono dagli intervalli attestati; le sovrapposizioni parallele sono contate una sola volta nel tempo coperto.',
        activities: reconciliationActivities,
        summary: {
            dailyUnionText: formatElapsedSeconds(dailyUnionElapsedSeconds),
            taskElapsedText: formatElapsedSeconds(taskElapsedSeconds),
            unplacedText: formatElapsedSeconds(unplacedElapsedSeconds),
            parallelismText: parallelismFactor === null
                ? 'Non calcolabile'
                : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(parallelismFactor)}×`,
            calendarOverlapText: formatElapsedSeconds(calendarOverlapSeconds),
            openEntryCount
        },
        days,
        replanning: {
            label: 'Effetto sul piano',
            text: releasePlan.scheduleReconciliation?.forecastRule
                || 'Il lavoro previsto riduce il relativo residuo; quello anticipato viene tolto dalla sua collocazione futura; quello aggiunto consuma calendario e sposta le attività successive. Le percentuali funzionali cambiano soltanto per risultati verificati.'
        }
    };
}

export function buildAllocationClassNames(releasePlan) {
    if (!releasePlan) {
        return {
            listClassName: 'allocation-list',
            itemClassName: 'allocation-pill'
        };
    }

    return {
        listClassName: 'allocation-list allocation-list--release',
        itemClassName: 'allocation-pill allocation-pill--release'
    };
}

export function buildAllocationReleasePresentation(releasePlan, allocation, locale = 'it-IT') {
    const duration = formatDuration(allocation.minutes);
    if (!releasePlan) {
        return {
            mode: 'legacy',
            text: `${allocation.title} · ${duration}`
        };
    }

    const workPackages = releaseWorkPackagesForTopic(releasePlan, allocation.topicId);
    const contributors = workPackages.map(workPackage => contributorViewModel(workPackage, locale));
    let snapshotSummary;
    if (contributors.length === 1) {
        snapshotSummary = `${contributors[0].title} · ${contributors[0].completionPercent}% · snapshot ${contributors[0].snapshotDate}`;
    } else if (contributors.length > 1) {
        const completionValues = contributors.map(item => item.completionPercent);
        snapshotSummary = `${contributors.length} WP · intervallo ${Math.min(...completionValues)}-${Math.max(...completionValues)}%`;
    } else {
        snapshotSummary = 'Nessun WP collegato';
    }

    return {
        mode: 'release',
        title: allocation.title,
        plannedHoursText: `Ore pianificate: ${duration}`,
        snapshotSummaryText: `Stato WP oggi: ${snapshotSummary}`,
        contributors,
        emptyContributorsText: 'Questa attività non contribuisce a uno snapshot funzionale.',
        snapshotRule: releasePlan.metricSemantics?.scheduleSnapshot.rule
            || 'Lo stato WP è uno snapshot corrente: non misura il progresso della settimana e non cresce automaticamente nelle settimane future.'
    };
}

export function buildModuleWorkPackagePresentation(releasePlan, module, locale = 'it-IT') {
    if (!releasePlan) return null;
    const snapshot = summarizeModuleWorkPackageSnapshot(
        releasePlan.workPackages,
        module.topics.map(topic => topic.id)
    );
    if (snapshot.workPackages.length === 0) return null;

    return {
        averageCompletionPercent: snapshot.averageCompletionPercent,
        summaryText: `Stato medio dei WP collegati: ${snapshot.averageCompletionPercent}%`,
        explanationText: `${releasePlan.metricSemantics?.moduleAggregation.formula || 'Media aritmetica dei WP distinti collegati ai topic.'} ${releasePlan.metricSemantics?.moduleAggregation.interpretation || 'Non è avanzamento del modulo né forecast temporale.'}`,
        contributors: snapshot.workPackages.map(workPackage => contributorViewModel(workPackage, locale))
    };
}

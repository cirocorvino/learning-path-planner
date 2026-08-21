import {
    calculateActualWorkMetrics,
    releaseWorkPackagesForTopic,
    summarizeModuleWorkPackageSnapshot
} from './model.js';
import { formatDate, formatDuration } from './planner.js';

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

function actualEntryViewModel(entry, sourceById, outputEvidenceById, workPackageById, locale, outputTimeZone) {
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
        timingText,
        elapsedSeconds,
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
                outputTimeZone
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

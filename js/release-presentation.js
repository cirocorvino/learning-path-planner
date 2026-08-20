import {
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

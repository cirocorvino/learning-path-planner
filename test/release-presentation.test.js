import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildAllocationReleasePresentation,
    buildModuleWorkPackagePresentation
} from '../js/release-presentation.js';

const workPackages = [
    { id: 'product', title: 'Documento di Progetto', completionPercent: 78, lastReviewedAt: '2026-08-19', topicIds: ['baseline', 'handoff'] },
    { id: 'architecture', title: 'Architettura', completionPercent: 70, lastReviewedAt: '2026-08-18', topicIds: ['facade'] },
    { id: 'onboarding', title: 'Onboarding', completionPercent: 55, lastReviewedAt: '2026-08-19', topicIds: ['resume', 'profile', 'correction'] },
    { id: 'admin', title: 'Admin', completionPercent: 15, lastReviewedAt: '2026-08-17', topicIds: ['analytics'] },
    { id: 'provider', title: 'Provider', completionPercent: 25, lastReviewedAt: '2026-08-18', topicIds: ['smoke'] },
    { id: 'operations', title: 'Operations', completionPercent: 35, lastReviewedAt: '2026-08-19', topicIds: ['smoke', 'release'] },
    { id: 'accessibility', title: 'Accessibilità', completionPercent: 20, lastReviewedAt: '2026-08-16', topicIds: ['release'] }
];

const releasePlan = {
    workPackages,
    metricSemantics: {
        scheduleSnapshot: {
            rule: 'Snapshot corrente: non è progresso della settimana e non è forecast.'
        },
        moduleAggregation: {
            formula: 'Media aritmetica dei WP distinti.',
            interpretation: 'Non è avanzamento temporale del modulo.'
        }
    }
};

test('preserva il testo legacy quando il database non contiene releasePlan', () => {
    const presentation = buildAllocationReleasePresentation(null, {
        topicId: 'resume',
        title: 'Ripresa colloquio',
        minutes: 120
    });

    assert.deepEqual(presentation, { mode: 'legacy', text: 'Ripresa colloquio · 2 h' });
    assert.equal('snapshotSummaryText' in presentation, false);
});

test('separa ore e snapshot e presenta tutti i WP di un topic condiviso', () => {
    const presentation = buildAllocationReleasePresentation(releasePlan, {
        topicId: 'release',
        title: 'Release candidate',
        minutes: 90
    });

    assert.equal(presentation.mode, 'release');
    assert.equal(presentation.title, 'Release candidate');
    assert.equal(presentation.plannedHoursText, 'Ore pianificate: 1 h 30 min');
    assert.equal(presentation.snapshotSummaryText, 'Stato WP oggi: 2 WP · intervallo 20-35%');
    assert.deepEqual(presentation.contributors.map(item => item.id), ['operations', 'accessibility']);
    assert.match(presentation.contributors[0].text, /Operations: 35% · snapshot/);
    assert.match(presentation.contributors[1].text, /Accessibilità: 20% · snapshot/);
    assert.match(presentation.snapshotRule, /non è progresso.*non è forecast/i);
});

test('presenta 74, 55 e 24 come medie dei WP distinti, non come progresso modulo', () => {
    const onda = buildModuleWorkPackagePresentation(releasePlan, {
        topics: [{ id: 'baseline' }, { id: 'handoff' }, { id: 'facade' }]
    });
    const onboarding = buildModuleWorkPackagePresentation(releasePlan, {
        topics: [{ id: 'resume' }, { id: 'profile' }, { id: 'correction' }]
    });
    const instrumentation = buildModuleWorkPackagePresentation(releasePlan, {
        topics: [{ id: 'analytics' }, { id: 'smoke' }, { id: 'release' }]
    });

    assert.equal(onda.summaryText, 'Stato medio dei WP collegati: 74%');
    assert.equal(onboarding.summaryText, 'Stato medio dei WP collegati: 55%');
    assert.equal(instrumentation.summaryText, 'Stato medio dei WP collegati: 24%');
    assert.deepEqual(instrumentation.contributors.map(item => item.completionPercent), [15, 25, 35, 20]);
    assert.match(instrumentation.explanationText, /Non è avanzamento temporale/i);
});

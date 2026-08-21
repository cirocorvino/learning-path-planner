import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildActualWorkLogPresentation,
    buildAllocationClassNames,
    buildAllocationReleasePresentation,
    buildModuleWorkPackagePresentation
} from '../js/release-presentation.js';
import { readFileSync } from 'node:fs';

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

test('mantiene le classi legacy e applica i modificatori soltanto ai piani release', () => {
    assert.deepEqual(buildAllocationClassNames(null), {
        listClassName: 'allocation-list',
        itemClassName: 'allocation-pill'
    });
    assert.deepEqual(buildAllocationClassNames(releasePlan), {
        listClassName: 'allocation-list allocation-list--release',
        itemClassName: 'allocation-pill allocation-pill--release'
    });

    const css = readFileSync(new URL('../Style/styles.css', import.meta.url), 'utf8');
    assert.match(css, /\.allocation-list\s*\{\s*display: flex;\s*flex-wrap: wrap;/);
    assert.match(css, /\.allocation-pill\s*\{\s*padding: 0\.42rem 0\.65rem;\s*border-radius: 999px;/);
    assert.match(css, /\.allocation-list--release\s*\{\s*display: grid;/);
    assert.match(css, /\.allocation-pill--release\s*\{\s*display: grid;/);
});

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

test('presenta intervallo task, unione giornaliera, output GitHub ed effort agentico separati', () => {
    const plan = {
        workPackages: [{ id: 'security', title: 'Isolamento AI' }],
        actualWorkLog: {
            entryRule: 'Solo dati attestati.',
            coverageNote: 'Copertura task Codex, non timesheet umano.',
            semantics: {
                agenticEffort: 'Stima separata.',
                humanLeadTime: 'Attesa separata.',
                observedClock: 'Intervallo task.'
            },
            sources: [{
                id: 'handoff',
                reference: 'Handoff TL',
                summary: 'Timestamp verificati.'
            }],
            outputEvidence: [{
                id: 'issue-199',
                reference: '#199',
                status: 'open',
                publishedAt: '2026-08-21T17:05:49+02:00',
                summary: 'Issue aperta.'
            }],
            entries: [{
                id: 'entry-one',
                date: '2026-08-21',
                roleTask: 'Tech Lead',
                topicLabel: 'Issue security',
                workPackageIds: ['security'],
                description: 'Definizione confine.',
                status: 'complete',
                references: [{ kind: 'issue', reference: '#199' }],
                timing: {
                    kind: 'clock_interval',
                    startAt: '2026-08-21T17:00:57+02:00',
                    endAt: '2026-08-21T17:02:47+02:00',
                    timeZone: 'Europe/Rome',
                    actualClockElapsedSeconds: 110
                },
                agentEffortEquivalentMinutes: null,
                timestampSourceId: 'handoff',
                outputEvidenceIds: ['issue-199']
            }]
        }
    };

    const presentation = buildActualWorkLogPresentation(plan);

    assert.equal(presentation.summary.taskElapsedText, '1 min 50 s');
    assert.equal(presentation.summary.dailyUnionText, '1 min 50 s');
    assert.equal(presentation.summary.agentEffortText, 'Non attestato');
    assert.equal(presentation.days[0].entries[0].timingText, '17:00:57–17:02:47 · 1 min 50 s');
    assert.match(presentation.days[0].entries[0].source.reference, /Handoff TL/);
    assert.match(presentation.days[0].entries[0].outputEvidence[0].text, /#199.*Issue aperta/);
});

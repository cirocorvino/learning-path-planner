import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildActualWorkLogPresentation,
    buildAllocationClassNames,
    buildAllocationReleasePresentation,
    buildModuleWorkPackagePresentation,
    buildWeeklyActualWorkPresentation
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

test('presenta nella settimana solo attività attestate, raggruppate per issue e PR', () => {
    const plan = {
        workPackages: [
            { id: 'assessment', title: 'Assessment' },
            { id: 'lpd', title: 'LPD' },
            { id: 'security', title: 'Sicurezza AI' }
        ],
        actualWorkLog: {
            entryRule: 'Solo dati attestati.',
            coverageNote: 'Copertura task Codex.',
            semantics: {
                agenticEffort: 'Separato.',
                humanLeadTime: 'Separato.',
                observedClock: 'Intervallo osservato.'
            },
            sources: [{ id: 'handoff', reference: 'Handoff TL', summary: 'Timestamp attestati.' }],
            outputEvidence: [],
            entries: [
                {
                    id: 'assessment-one',
                    date: '2026-08-20',
                    roleTask: 'Coder assessment',
                    topicLabel: 'Prompt assessment',
                    workPackageIds: ['assessment'],
                    description: 'Foundation assessment consegnata.',
                    status: 'complete',
                    references: [
                        { kind: 'issue', reference: '#195' },
                        { kind: 'pr', reference: '#197' }
                    ],
                    timing: {
                        kind: 'clock_interval',
                        startAt: '2026-08-20T22:50:39+02:00',
                        endAt: '2026-08-20T23:36:05+02:00',
                        timeZone: 'Europe/Rome',
                        actualClockElapsedSeconds: 2726
                    },
                    agentEffortEquivalentMinutes: null,
                    timestampSourceId: 'handoff',
                    outputEvidenceIds: []
                },
                {
                    id: 'lpd-midnight',
                    date: '2026-08-20',
                    roleTask: 'Coder LPD',
                    topicLabel: 'Prompt LPD',
                    workPackageIds: ['lpd'],
                    description: 'Foundation LPD consegnata oltre la mezzanotte.',
                    status: 'complete',
                    references: [
                        { kind: 'issue', reference: '#196' },
                        { kind: 'pr', reference: '#198' }
                    ],
                    timing: {
                        kind: 'clock_interval',
                        startAt: '2026-08-20T22:51:03+02:00',
                        endAt: '2026-08-21T00:11:29+02:00',
                        timeZone: 'Europe/Rome',
                        actualClockElapsedSeconds: 4826
                    },
                    agentEffortEquivalentMinutes: null,
                    timestampSourceId: 'handoff',
                    outputEvidenceIds: []
                },
                {
                    id: 'security-unplaced',
                    date: '2026-08-21',
                    roleTask: 'Tech Lead security',
                    topicLabel: 'Issue security',
                    workPackageIds: ['security'],
                    description: 'Confine security definito.',
                    status: 'complete',
                    references: [{ kind: 'issue', reference: '#199' }],
                    timing: { kind: 'unplaced_duration', attestedDurationSeconds: 600 },
                    agentEffortEquivalentMinutes: null,
                    timestampSourceId: 'handoff',
                    outputEvidenceIds: []
                },
                {
                    id: 'security-open',
                    date: '2026-08-21',
                    roleTask: 'Release Plan security',
                    topicLabel: 'Piano security',
                    workPackageIds: ['security'],
                    description: 'Aggiornamento ancora in corso.',
                    status: 'in_progress',
                    references: [{ kind: 'issue', reference: '#199' }],
                    timing: {
                        kind: 'open_interval',
                        startAt: '2026-08-21T17:06:48+02:00',
                        timeZone: 'Europe/Rome'
                    },
                    agentEffortEquivalentMinutes: null,
                    timestampSourceId: 'handoff',
                    outputEvidenceIds: []
                }
            ]
        },
        scheduleReconciliation: {
            forecastRule: 'Il previsto riduce il residuo; l’anticipo viene tolto dal futuro; l’aggiunta sposta ciò che segue.',
            activities: [
                {
                    id: 'prompt-foundations',
                    title: 'Attività aggiunta - Fondazioni prompt-as-code',
                    kind: 'added_and_anticipated',
                    color: '#7c3aed',
                    status: 'config_gated',
                    startDate: '2026-08-17',
                    endDate: '2026-08-23',
                    sourceModuleIds: [],
                    sourceTopicIds: [],
                    entryIds: ['assessment-one', 'lpd-midnight'],
                    baselinePlannedMinutes: null,
                    summary: 'Fondazioni assessment e LPD.',
                    planImpact: 'Il residuo futuro è già stato ricalcolato.'
                },
                {
                    id: 'security-added',
                    title: 'Attività aggiunta - Sicurezza AI',
                    kind: 'added',
                    color: '#9f1239',
                    status: 'in_progress',
                    startDate: '2026-08-17',
                    endDate: '2026-08-23',
                    sourceModuleIds: [],
                    sourceTopicIds: [],
                    entryIds: ['security-unplaced', 'security-open'],
                    baselinePlannedMinutes: null,
                    summary: 'Definizione del confine security.',
                    planImpact: 'Aggiunge nuovo residuo senza avanzamento automatico.'
                }
            ]
        }
    };

    const presentation = buildWeeklyActualWorkPresentation(
        plan,
        '2026-08-17',
        '2026-08-23'
    );

    assert.equal(presentation.empty, false);
    assert.equal(presentation.displayMode, 'actual');
    assert.equal(presentation.summary.dailyUnionText, '1 h 20 min 50 s');
    assert.equal(presentation.summary.taskElapsedText, '2 h 15 min 52 s');
    assert.equal(presentation.summary.unplacedText, '10 min');
    assert.equal(presentation.summary.parallelismText, '1,56×');
    assert.equal(presentation.summary.calendarOverlapText, '45 min 2 s');
    assert.equal(presentation.summary.openEntryCount, 1);
    assert.deepEqual(presentation.activities.map(activity => activity.title), [
        'Attività aggiunta - Fondazioni prompt-as-code',
        'Attività aggiunta - Sicurezza AI'
    ]);
    assert.match(presentation.activities[0].comparisonText, /non era presente/i);
    assert.deepEqual(presentation.days.map(day => day.date), ['2026-08-20', '2026-08-21']);
    assert.deepEqual(
        presentation.days[0].groups.map(group => group.referenceText),
        ['Issue #195 · PR #197', 'Issue #196 · PR #198']
    );
    assert.equal(presentation.days[0].groups[1].elapsedText, '1 h 8 min 57 s');
    assert.equal(presentation.days[0].groups[1].activityTitle, 'Attività aggiunta - Fondazioni prompt-as-code');
    assert.equal(presentation.days[0].groups[1].timingLines[0], '22:51–24:00');
    assert.match(presentation.days[0].groups[1].intervals[0].timingText, /24:00:00.*quota del giorno/);
    assert.equal(presentation.days[1].groups[0].elapsedText, '11 min 29 s');
    assert.match(presentation.days[1].groups[0].intervals[0].timingText, /^00:00:00/);
    assert.equal(presentation.days[1].groups[1].referenceText, 'Issue #199');
    assert.match(presentation.replanning.text, /previsto riduce.*anticipo.*aggiunta sposta/i);

    const future = buildWeeklyActualWorkPresentation(plan, '2026-08-24', '2026-08-30');
    assert.equal(future.empty, true);
    assert.equal(future.displayMode, 'forecast');
    assert.deepEqual(future.days, []);
    assert.match(future.emptyText, /non diventano appuntamenti inventati/i);
});

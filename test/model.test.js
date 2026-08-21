import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    DATABASE_KIND,
    PLAN_KIND,
    calculateActualWorkMetrics,
    calculateReleaseScopeMetrics,
    calculateReleaseScopeProgress,
    createEmptyDatabase,
    databaseHasContent,
    normalizeDatabase,
    normalizePlanInput,
    releaseScopeInversionContributors,
    releaseWorkPackagesForTopic,
    summarizeModuleWorkPackageSnapshot,
    summarizeScopeGateReadiness,
    updateDatabase
} from '../js/model.js';

const exampleUrl = new URL('../data/examples/organizer-example.json', import.meta.url);
const example = JSON.parse(await readFile(exampleUrl, 'utf8'));

function releaseDatabase() {
    const database = structuredClone(example);
    database.schemaVersion = 3;
    database.releasePlan = {
        schemaVersion: 1,
        sourceSnapshot: {
            assessedAt: '2026-08-19',
            repository: 'owner/repository',
            branch: 'main',
            commit: 'abc1234',
            canonicalProgressSource: 'docs/current-state.md',
            canonicalSnapshotAt: '2026-08-19',
            githubStateAt: '2026-08-19',
            productMandateAt: '2026-08-19',
            publicationStatus: 'provisional',
            notes: ''
        },
        methodology: {
            calculation: 'Somma ponderata.',
            evidenceRule: 'Solo evidenze verificate.',
            denominatorRule: 'Ogni scope somma 100.',
            scale: ['0 = non iniziato', '100 = gate superato']
        },
        capacity: {
            basis: 'Proxy agentico da calibrare',
            effectiveFrom: '2026-08-24',
            grossWeeklyMinutes: 2400,
            plannedWeeklyMinutes: 1800,
            reserveWeeklyMinutes: 600,
            calibrationWindowWeeks: 2,
            officialLimitEvidence: 'OpenAI pricing 2026-08-19',
            empiricalBaseline: 'Una settimana osservata.',
            assumptions: ['Le attese esterne restano vincoli di calendario.']
        },
        scopes: [{
            id: 'pilot-v1',
            label: 'Pilot v1',
            version: '1.0',
            denominatorVersion: 'pilot-v1@2026-08-19',
            reportedCompletionPercent: 25,
            lastReviewedAt: '2026-08-19',
            status: 'provisional',
            perimeter: 'Perimetro di prova.',
            canonicalSource: 'docs/current-state.md',
            notes: ''
        }],
        workPackages: [{
            id: 'wp-one',
            title: 'Primo work package',
            description: 'Descrizione verificabile.',
            status: 'in_progress',
            completionPercent: 25,
            weights: { 'pilot-v1': 100 },
            topicIds: ['goals'],
            dependencies: [],
            issueRefs: ['#1'],
            criticalPath: true,
            owner: 'Tech Lead',
            lastReviewedAt: '2026-08-19',
            evidence: [{
                type: 'repository',
                reference: 'main@abc1234',
                summary: 'Implementazione parziale verificata.',
                observedAt: '2026-08-19'
            }],
            acceptanceSummary: 'Gate automatici e manuali superati.'
        }],
        gates: [{
            id: 'gate-one',
            title: 'Gate uno',
            status: 'not_started',
            owner: 'Tech Lead',
            requiredFor: ['pilot-v1'],
            criteria: ['Criterio verificabile'],
            evidence: [],
            decision: '',
            lastReviewedAt: '2026-08-19'
        }],
        forecasts: [{
            id: 'pilot',
            label: 'Pilot',
            theoreticalDate: '2027-01-01',
            realisticStart: '2027-02-01',
            realisticEnd: '2027-03-01',
            prudentStart: '2027-04-01',
            prudentEnd: '2027-05-01',
            commitmentStatus: 'Non impegnativo',
            assumptions: []
        }],
        milestones: [{
            id: 'milestone-one',
            title: 'Milestone uno',
            status: 'not_started',
            kind: 'pilot',
            forecastId: 'pilot',
            gateIds: ['gate-one'],
            description: 'Milestone descritta.'
        }],
        criticalPath: {
            summary: 'Percorso critico di prova.',
            workPackageIds: ['wp-one'],
            gateIds: ['gate-one']
        },
        risks: [{
            id: 'risk-one',
            title: 'Rischio uno',
            level: 'high',
            owner: 'PO',
            trigger: 'Evento osservabile.',
            mitigation: 'Azione concreta.',
            decisionNeeded: ''
        }],
        changeHistory: [{
            date: '2026-08-19',
            kind: 'baseline',
            summary: 'Nuova baseline.',
            scopeIds: ['pilot-v1'],
            from: '',
            to: 'pilot-v1',
            evidence: 'Mandato PO'
        }],
        scopeChanges: [{
            date: '2026-08-19',
            scopeId: 'pilot-v1',
            fromVersion: 'legacy',
            toVersion: 'pilot-v1@2026-08-19',
            change: 'Perimetro ricostruito.',
            denominatorImpact: 'Percentuali non confrontabili direttamente.'
        }]
    };
    return database;
}

function adaptiveReleaseDatabase() {
    const database = releaseDatabase();
    const releasePlan = database.releasePlan;
    releasePlan.schemaVersion = 2;
    Object.assign(releasePlan.workPackages[0], {
        productOutcome: 'Risultato concreto per l’utente.',
        currentStateSummary: 'Stato realmente verificato.',
        remainingWorkSummary: 'Lavoro ancora necessario.',
        dependencySummary: 'Nessuna dipendenza decisiva.',
        dependencyRules: [],
        deliveryEstimate: {
            profile: 'ui_user_flow',
            estimateBasis: 'base_technical',
            initialCoefficient: 1.5,
            appliedCoefficient: 1.5,
            confidence: 'medium',
            originalPlannedHours: 10,
            remainingBaseHours: 8,
            correctedRemainingHours: 12,
            additiveAcrossWorkPackages: true,
            sharedTopicIds: [],
            externalLeadTimes: [{
                phase: 'Sessioni utenti',
                minimumWeeks: 1,
                realisticWeeks: 2,
                prudentWeeks: 4
            }],
            rationale: 'Il flusso richiede anche QA browser.',
            calendarImpact: 'Le attese restano separate.'
        }
    });
    releasePlan.releaseStatus = {
        asOf: '2026-08-19',
        headline: 'Il prodotto non è ancora pronto al pilot.',
        functionalCompletionNote: 'Completezza e readiness sono misure distinte.',
        availableNow: ['Prototipo disponibile'],
        partialOrDormant: ['Provider non attivo'],
        nextGateBlockers: ['Gate qualità'],
        nextStep: 'Chiudere il gate.',
        readiness: [{ scopeId: 'pilot-v1', status: 'not_ready', summary: 'Mancano gate.' }]
    };
    releasePlan.deliveryModel = {
        version: 'adaptive-v1',
        estimateInterpretation: 'Coefficienti applicati solo alle stime base.',
        classes: [{ id: 'ui_user_flow', range: [1.4, 1.6], meaning: 'UI e journey.' }],
        reserveRule: 'Riserva separata.',
        calibration: {
            minimumCompletedIssuesOverall: 12,
            minimumCompletedIssuesPerClass: 3,
            significantDeviationPercent: 20,
            method: 'Confrontare previsto e reale.',
            evidenceOwner: 'Tech Lead'
        }
    };
    releasePlan.deliveryTotals = {
        asOf: '2026-08-19',
        originalBaseline: {
            activeHours: 20,
            operationalWeeksAtPlannedCapacity: 1,
            explicitBufferWeeks: 1,
            totalWeeksBeforeExternalGates: 2,
            note: 'Baseline precedente.'
        },
        revisedBaseline: {
            activeHours: 18,
            completedRecordedHours: 6,
            remainingActiveHours: 12,
            totalOperationalWeeksAtPlannedCapacity: 0.6,
            remainingOperationalWeeksAtPlannedCapacity: 0.4,
            ganttCalendarWeeks: 1,
            ganttEndDate: '2026-08-24',
            ganttRule: 'Blocchi settimanali conservativi.',
            explicitBufferWeeks: 0,
            weeklyReserveHours: 10,
            note: 'Baseline corretta.'
        },
        comparison: 'Attesa esterna separata.'
    };
    releasePlan.scheduleScope = {
        scheduledThrough: 'pilot-v1',
        statement: 'Il piano termina al pilot.',
        unscheduledFuture: ['Voce'],
        decisionRequired: 'Il PO decide il seguito.'
    };
    Object.assign(releasePlan.criticalPath, {
        primaryChainWorkPackageIds: ['wp-one'],
        parallelMandatoryWorkPackageIds: [],
        convergingBranches: [{
            id: 'quality',
            label: 'Qualità',
            workPackageIds: ['wp-one'],
            joinsAt: 'gate-one'
        }]
    });
    return database;
}

function semanticReleaseDatabase() {
    const database = adaptiveReleaseDatabase();
    database.releasePlan.schemaVersion = 3;
    database.releasePlan.metricSemantics = {
        functionalCompletion: {
            label: 'Avanzamento funzionale nello scope',
            formula: 'Σ(peso interno × completamento) / 100.',
            comparisonRule: 'Gli scope correnti non sono direttamente confrontabili.',
            visionShareFormula: 'avanzamento × ampiezza',
            visionShareStatus: 'blocked',
            decisionRequired: 'Il PO deve approvare pesi assoluti comuni.'
        },
        releaseReadiness: {
            label: 'Readiness di rilascio',
            rule: 'Mostrare gate superati e applicabili.',
            blockingRule: 'Un gate obbligatorio aperto mantiene NOT READY.'
        },
        scheduleSnapshot: {
            label: 'Stato WP oggi',
            rule: 'Snapshot corrente, non forecast.'
        },
        moduleAggregation: {
            label: 'Stato medio dei WP collegati',
            formula: 'Media aritmetica dei WP distinti.',
            interpretation: 'Non è avanzamento temporale del modulo.'
        }
    };
    return database;
}

function absoluteReleaseDatabase() {
    const database = semanticReleaseDatabase();
    const releasePlan = database.releasePlan;
    releasePlan.schemaVersion = 4;
    releasePlan.absoluteWeightModel = {
        version: 'absolute-functional-v1@2026-08-20',
        visionScopeId: 'known-vision',
        scopeOrder: ['pilot-v1', 'public-mvp-v1', 'known-vision'],
        sourceDenominatorVersion: 'known-vision@2026-08-19',
        derivationRule: 'Adotta senza modifiche i pesi del precedente scope Known Vision.'
    };
    releasePlan.metricSemantics.functionalCompletion = {
        label: 'Completamento nello scope',
        formula: 'Somma(peso × completamento) / somma(pesi inclusi).',
        comparisonRule: 'Lo stesso WP conserva lo stesso peso in ogni scope.',
        breadthLabel: 'Ampiezza della Visione',
        breadthFormula: 'Somma(pesi inclusi) / somma(pesi Known Vision).',
        weightRule: 'Un solo peso funzionale assoluto per WP.'
    };

    const pilotScope = releasePlan.scopes[0];
    Object.assign(pilotScope, {
        denominatorVersion: 'pilot-v1@absolute-v1-2026-08-20',
        workPackageIds: ['wp-one'],
        reportedCompletionPercent: 25,
        reportedBreadthPercent: 40
    });
    releasePlan.scopes = [
        pilotScope,
        {
            ...structuredClone(pilotScope),
            id: 'public-mvp-v1',
            label: 'MVP pubblico v1',
            denominatorVersion: 'public-mvp-v1@absolute-v1-2026-08-20',
            workPackageIds: ['wp-one', 'wp-two'],
            reportedCompletionPercent: 18.6,
            reportedBreadthPercent: 70
        },
        {
            ...structuredClone(pilotScope),
            id: 'known-vision',
            label: 'Known Vision',
            denominatorVersion: 'known-vision@absolute-v1-2026-08-20',
            workPackageIds: ['wp-one', 'wp-two', 'wp-three'],
            reportedCompletionPercent: 28,
            reportedBreadthPercent: 100
        }
    ];

    const firstWorkPackage = releasePlan.workPackages[0];
    delete firstWorkPackage.weights;
    Object.assign(firstWorkPackage, {
        functionalWeight: 4,
        functionalWeightOrigin: {
            sourceDenominatorVersion: 'known-vision@2026-08-19',
            sourceWeight: 4,
            rationale: 'Peso Known Vision precedente adottato invariato.'
        }
    });
    const secondWorkPackage = structuredClone(firstWorkPackage);
    Object.assign(secondWorkPackage, {
        id: 'wp-two',
        title: 'Secondo work package',
        completionPercent: 10,
        functionalWeight: 3,
        functionalWeightOrigin: {
            ...secondWorkPackage.functionalWeightOrigin,
            sourceWeight: 3
        },
        criticalPath: false,
        issueRefs: ['#2']
    });
    const thirdWorkPackage = structuredClone(firstWorkPackage);
    Object.assign(thirdWorkPackage, {
        id: 'wp-three',
        title: 'Funzione post-MVP',
        completionPercent: 50,
        functionalWeight: 3,
        functionalWeightOrigin: {
            ...thirdWorkPackage.functionalWeightOrigin,
            sourceWeight: 3
        },
        criticalPath: false,
        issueRefs: ['#3']
    });
    releasePlan.workPackages = [firstWorkPackage, secondWorkPackage, thirdWorkPackage];
    return database;
}

function actualWorkReleaseDatabase() {
    const database = absoluteReleaseDatabase();
    const releasePlan = database.releasePlan;
    releasePlan.schemaVersion = 5;
    Object.assign(releasePlan.capacity, {
        scheduleMode: 'abstract_weekly_capacity',
        effortUnit: 'agentic_equivalent_minutes'
    });
    releasePlan.actualWorkLog = {
        version: 'attested-actuals-v1',
        entryRule: 'Registrare soltanto timestamp o durate attestati.',
        coverageNote: 'Copertura delle task Codex disponibili, non timesheet umano esaustivo.',
        semantics: {
            agenticEffort: 'Stima separata e mai derivata dal wall-clock.',
            humanLeadTime: 'Attesa di calendario separata.',
            observedClock: 'Intervallo reale attestato della task.'
        },
        sources: [{
            id: 'handoff-one',
            type: 'tech-lead-handoff',
            reference: 'Thread Tech Lead',
            summary: 'Timestamp attestati.',
            observedAt: '2026-08-21'
        }],
        outputEvidence: [{
            id: 'pr-197-open',
            type: 'pull-request',
            reference: '#197',
            status: 'draft',
            publishedAt: '2026-08-20T23:34:52+02:00',
            finalizedAt: '',
            summary: 'Draft PR aperta.'
        }],
        entries: [
            {
                id: 'actual-a',
                date: '2026-08-20',
                roleTask: 'Coder #197',
                topicId: 'goals',
                topicLabel: 'Prompt assessment',
                workPackageIds: ['wp-one'],
                description: 'Implementazione iniziale.',
                status: 'complete',
                references: [{ kind: 'pr', reference: '#197' }],
                timing: {
                    kind: 'clock_interval',
                    startAt: '2026-08-20T22:50:39+02:00',
                    endAt: '2026-08-20T23:36:05+02:00',
                    timeZone: 'Europe/Rome',
                    actualClockElapsedSeconds: 2726
                },
                agentEffortEquivalentMinutes: null,
                timestampSourceId: 'handoff-one',
                outputEvidenceIds: ['pr-197-open']
            },
            {
                id: 'actual-b',
                date: '2026-08-20',
                roleTask: 'Coder #198',
                topicId: '',
                topicLabel: 'Prompt LPD',
                workPackageIds: [],
                description: 'Intervallo sovrapposto oltre mezzanotte.',
                status: 'complete',
                references: [{ kind: 'pr', reference: '#198' }],
                timing: {
                    kind: 'clock_interval',
                    startAt: '2026-08-20T22:51:03+02:00',
                    endAt: '2026-08-21T00:11:29+02:00',
                    timeZone: 'Europe/Rome',
                    actualClockElapsedSeconds: 4826
                },
                agentEffortEquivalentMinutes: null,
                timestampSourceId: 'handoff-one',
                outputEvidenceIds: []
            },
            {
                id: 'actual-unplaced',
                date: '2026-08-21',
                roleTask: 'Task attestata',
                topicId: '',
                topicLabel: 'Attività non collocata',
                workPackageIds: [],
                description: 'Durata senza fascia oraria.',
                status: 'complete',
                references: [{ kind: 'task', reference: 'task-1' }],
                timing: { kind: 'unplaced_duration', attestedDurationSeconds: 600 },
                agentEffortEquivalentMinutes: null,
                timestampSourceId: 'handoff-one',
                outputEvidenceIds: []
            },
            {
                id: 'actual-open',
                date: '2026-08-21',
                roleTask: 'Release Plan Expert',
                topicId: '',
                topicLabel: 'Registro orario',
                workPackageIds: [],
                description: 'Attività ancora aperta.',
                status: 'in_progress',
                references: [{ kind: 'task', reference: 'release-plan-task' }],
                timing: {
                    kind: 'open_interval',
                    startAt: '2026-08-21T17:06:48+02:00',
                    timeZone: 'Europe/Rome'
                },
                agentEffortEquivalentMinutes: null,
                timestampSourceId: 'handoff-one',
                outputEvidenceIds: []
            }
        ]
    };
    return database;
}

test('considera vuoto un database senza moduli', () => {
    assert.equal(databaseHasContent(createEmptyDatabase()), false);
    assert.equal(databaseHasContent(example), true);
});

test('normalizza il database dimostrativo v2', () => {
    const result = normalizeDatabase(example);

    assert.equal(result.migrated, false);
    assert.equal(result.database.kind, DATABASE_KIND);
    assert.equal(result.database.plan.kind, PLAN_KIND);
    assert.equal(result.database.categories.filter(category => category.role === 'focus').length, 1);
    assert.equal(result.database.plan.modules.length, 3);
});

test('normalizza il database v3 e calcola la percentuale ponderata', () => {
    const result = normalizeDatabase(releaseDatabase());

    assert.equal(result.database.schemaVersion, 3);
    assert.equal(result.database.releasePlan.workPackages[0].topicIds[0], 'goals');
    assert.equal(calculateReleaseScopeProgress(result.database.releasePlan, 'pilot-v1'), 25);
});

test('riepiloga Onda 1 usando due WP distinti e non tre topic', () => {
    const workPackages = [
        {
            id: 'product-document',
            title: 'Documento di Progetto',
            completionPercent: 78,
            lastReviewedAt: '2026-08-19',
            topicIds: ['baseline', 'handoff']
        },
        {
            id: 'architecture',
            title: 'Architettura',
            completionPercent: 70,
            lastReviewedAt: '2026-08-18',
            topicIds: ['facade']
        }
    ];

    const snapshot = summarizeModuleWorkPackageSnapshot(workPackages, ['baseline', 'handoff', 'facade']);

    assert.equal(snapshot.averageCompletionPercent, 74);
    assert.deepEqual(snapshot.workPackages.map(workPackage => workPackage.id), ['product-document', 'architecture']);
});

test('riepiloga Onboarding una sola volta quando tre topic condividono lo stesso WP', () => {
    const workPackages = [{
        id: 'onboarding',
        title: 'Onboarding',
        completionPercent: 55,
        lastReviewedAt: '2026-08-19',
        topicIds: ['resume', 'profile', 'correction']
    }];

    const snapshot = summarizeModuleWorkPackageSnapshot(workPackages, ['resume', 'profile', 'correction']);

    assert.equal(snapshot.averageCompletionPercent, 55);
    assert.equal(snapshot.workPackages.length, 1);
});

test('include tutti i contributi multi-WP nella Strumentazione pilot', () => {
    const workPackages = [
        { id: 'admin', title: 'Admin', completionPercent: 15, lastReviewedAt: '2026-08-17', topicIds: ['analytics'] },
        { id: 'provider', title: 'Provider', completionPercent: 25, lastReviewedAt: '2026-08-18', topicIds: ['smoke'] },
        { id: 'operations', title: 'Operations', completionPercent: 35, lastReviewedAt: '2026-08-19', topicIds: ['smoke', 'release'] },
        { id: 'accessibility', title: 'Accessibilità', completionPercent: 20, lastReviewedAt: '2026-08-16', topicIds: ['release'] }
    ];

    const snapshot = summarizeModuleWorkPackageSnapshot(workPackages, ['analytics', 'smoke', 'release']);
    const releaseContributors = releaseWorkPackagesForTopic({ workPackages }, 'release');

    assert.equal(snapshot.averageCompletionPercent, 24);
    assert.deepEqual(snapshot.workPackages.map(workPackage => workPackage.completionPercent), [15, 25, 35, 20]);
    assert.deepEqual(releaseContributors.map(workPackage => workPackage.id), ['operations', 'accessibility']);
});

test('normalizza il release plan adattivo v2 senza perdere stime e dipendenze temporali', () => {
    const result = normalizeDatabase(adaptiveReleaseDatabase());
    const releasePlan = result.database.releasePlan;

    assert.equal(releasePlan.schemaVersion, 2);
    assert.equal(releasePlan.releaseStatus.readiness[0].status, 'not_ready');
    assert.equal(releasePlan.workPackages[0].deliveryEstimate.correctedRemainingHours, 12);
    assert.equal(releasePlan.criticalPath.convergingBranches[0].joinsAt, 'gate-one');
});

test('normalizza le semantiche metriche v3 e separa la readiness dai valori funzionali', () => {
    const result = normalizeDatabase(semanticReleaseDatabase());
    const releasePlan = result.database.releasePlan;
    const readiness = summarizeScopeGateReadiness(releasePlan, 'pilot-v1');

    assert.equal(releasePlan.schemaVersion, 3);
    assert.equal(releasePlan.metricSemantics.functionalCompletion.label, 'Avanzamento funzionale nello scope');
    assert.equal(readiness.status, 'not_ready');
    assert.equal(readiness.passedGateCount, 0);
    assert.equal(readiness.applicableGateCount, 1);
});

test('normalizza il modello v4 con peso assoluto comune, membership e breadth', () => {
    const result = normalizeDatabase(absoluteReleaseDatabase());
    const releasePlan = result.database.releasePlan;
    const pilot = calculateReleaseScopeMetrics(releasePlan, 'pilot-v1');
    const publicMvp = calculateReleaseScopeMetrics(releasePlan, 'public-mvp-v1');
    const vision = calculateReleaseScopeMetrics(releasePlan, 'known-vision');

    assert.equal(releasePlan.schemaVersion, 4);
    assert.equal(releasePlan.workPackages[0].functionalWeight, 4);
    assert.equal('weights' in releasePlan.workPackages[0], false);
    assert.deepEqual(pilot, { completionPercent: 25, breadthPercent: 40, totalWeight: 4, visionTotalWeight: 10 });
    assert.deepEqual(publicMvp, { completionPercent: 18.6, breadthPercent: 70, totalWeight: 7, visionTotalWeight: 10 });
    assert.deepEqual(vision, { completionPercent: 28, breadthPercent: 100, totalWeight: 10, visionTotalWeight: 10 });
});

test('mostra i contributori esclusivi quando il post-MVP aumenta davvero il completamento', () => {
    const releasePlan = normalizeDatabase(absoluteReleaseDatabase()).database.releasePlan;
    const contributors = releaseScopeInversionContributors(releasePlan, 'known-vision', 'public-mvp-v1');

    assert.deepEqual(contributors.map(workPackage => workPackage.id), ['wp-three']);
    assert.equal(contributors[0].completedWeight, 1.5);
    assert.deepEqual(releaseScopeInversionContributors(releasePlan, 'public-mvp-v1', 'pilot-v1'), []);
});

test('mantiene stabile il round-trip del release plan v4', () => {
    const first = normalizeDatabase(absoluteReleaseDatabase()).database;
    const second = normalizeDatabase(JSON.parse(JSON.stringify(first))).database;

    assert.deepEqual(second, first);
});

test('normalizza il registro v5 e separa somma task, unione giornaliera ed effort agentico', () => {
    const normalized = normalizeDatabase(actualWorkReleaseDatabase()).database;
    const metrics = calculateActualWorkMetrics(normalized.releasePlan);

    assert.equal(normalized.releasePlan.schemaVersion, 5);
    assert.equal(normalized.releasePlan.capacity.scheduleMode, 'abstract_weekly_capacity');
    assert.equal(metrics.entryCount, 4);
    assert.equal(metrics.closedEntryCount, 3);
    assert.equal(metrics.openEntryCount, 1);
    assert.equal(metrics.actualClockElapsedSeconds, 7552);
    assert.equal(metrics.attestedUnplacedSeconds, 600);
    assert.equal(metrics.taskElapsedSeconds, 8152);
    assert.equal(metrics.dailyUnionElapsedSeconds, 4850);
    assert.equal(metrics.agentEffortEquivalentMinutes, null);
    assert.deepEqual(metrics.daily.map(day => [day.date, day.taskElapsedSeconds, day.dailyUnionElapsedSeconds]), [
        ['2026-08-20', 6863, 4161],
        ['2026-08-21', 1289, 689]
    ]);
});

test('mantiene stabile il round-trip del release plan v5', () => {
    const first = normalizeDatabase(actualWorkReleaseDatabase()).database;
    const second = normalizeDatabase(JSON.parse(JSON.stringify(first))).database;

    assert.deepEqual(second, first);
});

test('rifiuta durate, fonti e intervalli aperti inventati nel registro v5', () => {
    const wrongDuration = actualWorkReleaseDatabase();
    wrongDuration.releasePlan.actualWorkLog.entries[0].timing.actualClockElapsedSeconds = 1;
    assert.throws(() => normalizeDatabase(wrongDuration), /diverge dall'intervallo/i);

    const unplacedWithClock = actualWorkReleaseDatabase();
    unplacedWithClock.releasePlan.actualWorkLog.entries[2].timing.startAt = '2026-08-21T10:00:00+02:00';
    assert.throws(() => normalizeDatabase(unplacedWithClock), /durata non collocata/i);

    const closedOpenInterval = actualWorkReleaseDatabase();
    closedOpenInterval.releasePlan.actualWorkLog.entries[3].timing.endAt = '2026-08-21T18:00:00+02:00';
    assert.throws(() => normalizeDatabase(closedOpenInterval), /ancora aperto/i);

    const unknownSource = actualWorkReleaseDatabase();
    unknownSource.releasePlan.actualWorkLog.entries[0].timestampSourceId = 'invented';
    assert.throws(() => normalizeDatabase(unknownSource), /fonte sconosciuta/i);

    const reversedOutput = actualWorkReleaseDatabase();
    reversedOutput.releasePlan.actualWorkLog.outputEvidence[0].finalizedAt = '2026-08-20T20:00:00+02:00';
    assert.throws(() => normalizeDatabase(reversedOutput), /precede publishedAt/i);
});

test('rifiuta vettori per-scope nel modello v4', () => {
    const invalid = absoluteReleaseDatabase();
    invalid.releasePlan.workPackages[0].weights = { 'pilot-v1': 100 };

    assert.throws(() => normalizeDatabase(invalid), /un solo functionalWeight/i);
});

test('rifiuta membership non annidate nel modello v4', () => {
    const invalid = absoluteReleaseDatabase();
    invalid.releasePlan.scopes[1].workPackageIds = ['wp-two'];

    assert.throws(() => normalizeDatabase(invalid), /sottoinsieme/i);
});

test('rifiuta origine o breadth incoerenti nel modello v4', () => {
    const invalidOrigin = absoluteReleaseDatabase();
    invalidOrigin.releasePlan.workPackages[0].functionalWeightOrigin.sourceWeight = 5;
    assert.throws(() => normalizeDatabase(invalidOrigin), /diverge dal peso sorgente/i);

    const invalidBreadth = absoluteReleaseDatabase();
    invalidBreadth.releasePlan.scopes[0].reportedBreadthPercent = 41;
    assert.throws(() => normalizeDatabase(invalidBreadth), /ampiezza dichiarata/i);
});

test('rifiuta fail-closed una readiness ready con gate obbligatorio non completato', () => {
    const invalid = semanticReleaseDatabase();
    invalid.releasePlan.releaseStatus.readiness[0].status = 'ready';

    assert.throws(() => normalizeDatabase(invalid), /non può essere ready/i);
});

test('accetta ready soltanto quando tutti i gate applicabili sono completi', () => {
    const database = semanticReleaseDatabase();
    database.releasePlan.gates[0].status = 'complete';
    database.releasePlan.releaseStatus.readiness[0].status = 'ready';

    const releasePlan = normalizeDatabase(database).database.releasePlan;
    const readiness = summarizeScopeGateReadiness(releasePlan, 'pilot-v1');

    assert.equal(readiness.status, 'ready');
    assert.equal(readiness.passedGateCount, 1);
    assert.equal(readiness.applicableGateCount, 1);
    assert.equal(readiness.blockingGates.length, 0);
});

test('rifiuta stati di readiness fuori vocabolario', () => {
    const invalid = semanticReleaseDatabase();
    invalid.releasePlan.releaseStatus.readiness[0].status = 'almost_ready';

    assert.throws(() => normalizeDatabase(invalid), /readiness supportato/i);
});

test('rifiuta lead time adattivi con intervalli invertiti', () => {
    const invalid = adaptiveReleaseDatabase();
    invalid.releasePlan.workPackages[0].deliveryEstimate.externalLeadTimes[0].realisticWeeks = 5;

    assert.throws(() => normalizeDatabase(invalid), /minimo <= realistico <= prudenziale/i);
});

test('rifiuta percentuali di scope divergenti dai pesi', () => {
    const invalid = releaseDatabase();
    invalid.releasePlan.scopes[0].reportedCompletionPercent = 30;

    assert.throws(() => normalizeDatabase(invalid), /diverge dal calcolo/i);
});

test('rifiuta un database privo di categorie focus', () => {
    const invalid = structuredClone(example);
    invalid.categories.forEach(category => { category.role = 'neutral'; });

    assert.throws(() => normalizeDatabase(invalid), /categoria con ruolo focus/i);
});

test('rifiuta slot con orari invertiti', () => {
    const invalid = structuredClone(example);
    invalid.weekTemplate.tuesday[0].start = '21:00';

    assert.throws(() => normalizeDatabase(invalid), /terminare dopo l'inizio/i);
});

test('migra un database organizer v1 e segnala le cache scartate', () => {
    const legacy = {
        kind: 'organizer-database',
        metadata: { name: 'Legacy' },
        categories: [{ id: 'study', label: 'Focus' }],
        weekTemplate: {
            Lunedì: [{ time: '18:00-19:30', content: '', type: 'study' }]
        },
        settings: { calculationParams: { theoryMultiplier: 1.5 } },
        studyProgram: {
            kind: 'study-program',
            id: 'legacy-plan',
            title: 'Piano legacy',
            startDate: '2026-08-03',
            courses: [{ name: 'Modulo', modules: [{ name: 'Teoria: basi', time: 2 }] }]
        },
        state: { weeklySchedules: { cached: true }, courseTopics: {} }
    };

    const result = normalizeDatabase(legacy);

    assert.equal(result.migrated, true);
    assert.equal(result.database.weekTemplate.monday[0].categoryId, 'study');
    assert.equal(result.database.plan.modules[0].topics[0].estimatedMinutes, 180);
    assert.match(result.warnings[0], /non sono state migrate/i);
});

test('importa il precedente formato piatto study-program', () => {
    const plan = normalizePlanInput({
        kind: 'study-program',
        id: 'flat-plan',
        title: 'Piano piatto',
        startDate: '2026-08-03',
        units: [
            { module: 'Fondamenti', order: 2, title: 'Secondo tema', estimatedMinutes: 90 },
            { module: 'Fondamenti', order: 1, title: 'Primo tema', estimatedMinutes: 60 }
        ]
    });

    assert.equal(plan.kind, PLAN_KIND);
    assert.deepEqual(plan.modules[0].topics.map(topic => topic.title), ['Primo tema', 'Secondo tema']);
});

test('ogni aggiornamento viene rivalidato', () => {
    const database = normalizeDatabase(example).database;

    assert.throws(
        () => updateDatabase(database, draft => { draft.plan.modules[0].topics[0].estimatedMinutes = 0; }),
        /numero positivo/i
    );
});

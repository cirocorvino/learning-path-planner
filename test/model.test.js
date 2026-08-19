import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    DATABASE_KIND,
    PLAN_KIND,
    calculateReleaseScopeProgress,
    createEmptyDatabase,
    databaseHasContent,
    normalizeDatabase,
    normalizePlanInput,
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

test('normalizza il release plan adattivo v2 senza perdere stime e dipendenze temporali', () => {
    const result = normalizeDatabase(adaptiveReleaseDatabase());
    const releasePlan = result.database.releasePlan;

    assert.equal(releasePlan.schemaVersion, 2);
    assert.equal(releasePlan.releaseStatus.readiness[0].status, 'not_ready');
    assert.equal(releasePlan.workPackages[0].deliveryEstimate.correctedRemainingHours, 12);
    assert.equal(releasePlan.criticalPath.convergingBranches[0].joinsAt, 'gate-one');
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

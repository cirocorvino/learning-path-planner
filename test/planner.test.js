import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizeDatabase, updateDatabase } from '../js/model.js';
import {
    buildPlanSchedule,
    getActualWorkWeeks,
    getForecastStartDate,
    getReconciledActualActivities,
    getModuleWeekAllocations,
    getTimelineMonths,
    getWeekAgenda,
    getWeeklyCapacity,
    minutesBetween
} from '../js/planner.js';

const exampleUrl = new URL('../data/examples/organizer-example.json', import.meta.url);
const example = JSON.parse(await readFile(exampleUrl, 'utf8'));

function database() {
    return normalizeDatabase(example).database;
}

test('calcola intervalli e capacità focus ignorando gli impegni', () => {
    const value = database();

    assert.equal(minutesBetween('18:30', '20:00'), 90);
    assert.equal(getWeeklyCapacity(value), 300);
});

test('suddivide la timeline in segmenti mensili proporzionali', () => {
    const months = getTimelineMonths('2026-10-28', '2026-11-10', 'it-IT');

    assert.deepEqual(months.map(month => ({
        id: month.id,
        offsetDays: month.offsetDays,
        durationDays: month.durationDays
    })), [
        { id: '2026-10', offsetDays: 0, durationDays: 4 },
        { id: '2026-11', offsetDays: 4, durationDays: 10 }
    ]);
    assert.equal(months[0].label, 'ott');
    assert.equal(months[1].fullLabel, 'novembre 2026');
    assert.deepEqual(months.map(month => month.displayLabel), ['ott', 'nov']);

    const newYear = getTimelineMonths('2026-12-30', '2027-01-02', 'it-IT');
    assert.deepEqual(newYear.map(month => month.displayLabel), ['dic', 'gen 2027']);
});

test('costruisce un Gantt sequenziale con una settimana buffer', () => {
    const schedule = buildPlanSchedule(database());

    assert.equal(schedule.totalMinutes, 480);
    assert.equal(schedule.totalWeeks, 3);
    assert.equal(schedule.startDate, '2026-08-03');
    assert.equal(schedule.endDate, '2026-08-23');
    assert.deepEqual(schedule.modules.map(module => module.weeks), [1, 1, 1]);
});

test('porta avanti il forecast disatteso e pianifica soltanto i minuti residui', () => {
    const value = database();
    value.state.progress = {
        goals: { completedMinutes: 60, completed: true },
        environment: { completedMinutes: 60, completed: false }
    };
    value.releasePlan = {
        actualWorkLog: {
            entries: [{
                id: 'actual-checkpoint',
                date: '2026-08-05',
                references: [],
                workPackageIds: [],
                timing: {
                    kind: 'clock_interval',
                    startAt: '2026-08-05T09:00:00+02:00',
                    endAt: '2026-08-05T11:00:00+02:00',
                    timeZone: 'Europe/Rome',
                    actualClockElapsedSeconds: 7200
                },
                agentEffortEquivalentMinutes: null
            }]
        },
        scheduleReconciliation: {
            activities: [{
                id: 'onda-one-actual',
                title: 'Onda 1 - Baseline',
                kind: 'planned',
                color: '#0f766e',
                status: 'partial',
                startDate: '2026-08-03',
                endDate: '2026-08-09',
                sourceModuleIds: ['foundations'],
                sourceTopicIds: ['goals'],
                entryIds: ['actual-checkpoint'],
                baselinePlannedMinutes: 60,
                summary: 'Baseline svolta.',
                planImpact: 'Il residuo prosegue.'
            }]
        }
    };

    const actualWeeks = getActualWorkWeeks(value);
    const actualActivities = getReconciledActualActivities(value);
    const schedule = buildPlanSchedule(value);
    const allocations = getModuleWeekAllocations(value, 'foundations', 0);

    assert.equal(getForecastStartDate(value), '2026-08-10');
    assert.deepEqual(actualWeeks.map(week => [week.startDate, week.endDate]), [
        ['2026-08-03', '2026-08-09']
    ]);
    assert.deepEqual(actualActivities.map(activity => [
        activity.title,
        activity.taskElapsedSeconds,
        activity.dailyUnionElapsedSeconds
    ]), [['Onda 1 - Baseline', 7200, 7200]]);
    assert.equal(schedule.actualActivities[0].id, 'onda-one-actual');
    assert.equal(schedule.startDate, '2026-08-03');
    assert.equal(schedule.forecastStartDate, '2026-08-10');
    assert.equal(schedule.totalMinutes, 360);
    assert.equal(schedule.endDate, '2026-08-30');
    assert.deepEqual(schedule.modules.map(module => module.startDate), [
        '2026-08-10',
        '2026-08-17',
        '2026-08-24'
    ]);
    assert.equal(schedule.modules[0].originalTotalMinutes, 180);
    assert.equal(schedule.modules[0].completedMinutes, 120);
    assert.equal(schedule.modules[0].remainingTopicCount, 1);
    assert.deepEqual(allocations.map(item => [item.topicId, item.minutes]), [['environment', 60]]);
});

test('un target oltre la capacità viene limitato e segnalato', () => {
    const value = updateDatabase(database(), draft => { draft.plan.weeklyTargetMinutes = 600; });
    const schedule = buildPlanSchedule(value);

    assert.equal(schedule.effectiveWeeklyTargetMinutes, 300);
    assert.match(schedule.warnings[0], /supera la capacità settimanale/i);
});

test('le eccezioni riducono la capacità ed estendono il Gantt', () => {
    const value = updateDatabase(database(), draft => {
        draft.settings.calendarExceptions = [
            { id: 'blocked-tue', date: '2026-08-11', label: 'Assente', focusAvailable: false },
            { id: 'blocked-thu', date: '2026-08-13', label: 'Assente', focusAvailable: false }
        ];
    });
    const schedule = buildPlanSchedule(value);

    assert.deepEqual(schedule.modules.map(module => module.weeks), [1, 2, 1]);
    assert.equal(schedule.totalWeeks, 4);
    assert.equal(schedule.endDate, '2026-08-30');
});

test('spezza gli argomenti sul confine della settimana', () => {
    const value = updateDatabase(database(), draft => {
        draft.plan.weeklyTargetMinutes = 120;
    });
    const firstWeek = getModuleWeekAllocations(value, 'foundations', 0);
    const secondWeek = getModuleWeekAllocations(value, 'foundations', 1);

    assert.deepEqual(firstWeek.map(item => item.minutes), [60, 60]);
    assert.deepEqual(secondWeek.map(item => item.minutes), [60]);
});

test("distribuisce l'agenda soltanto negli slot focus disponibili", () => {
    const agenda = getWeekAgenda(database(), 'foundations', 0);
    const focusSessions = agenda.days.flatMap(day => day.sessions).filter(session => session.isFocus);
    const assignedMinutes = focusSessions
        .flatMap(session => session.assignments)
        .reduce((total, assignment) => total + assignment.minutes, 0);

    assert.equal(agenda.plannedMinutes, 300);
    assert.equal(agenda.allocations.reduce((total, item) => total + item.minutes, 0), 180);
    assert.equal(assignedMinutes, 180);
    assert.equal(agenda.days.flatMap(day => day.sessions).filter(session => !session.isFocus).flatMap(session => session.assignments).length, 0);
});

test('usa capacità release astratta senza convertire slot, eccezioni o impegni in orari agentici', () => {
    const value = database();
    value.releasePlan = {
        capacity: {
            scheduleMode: 'abstract_weekly_capacity',
            plannedWeeklyMinutes: 1800
        }
    };
    value.plan.weeklyTargetMinutes = 1800;
    value.settings.calendarExceptions = [{
        id: 'holiday',
        date: '2026-08-04',
        label: 'Impegno personale',
        focusAvailable: false
    }];

    const schedule = buildPlanSchedule(value);
    const agenda = getWeekAgenda(value, 'foundations', 0);

    assert.equal(getWeeklyCapacity(value), 1800);
    assert.equal(schedule.baseCapacityMinutes, 1800);
    assert.equal(schedule.warnings.length, 0);
    assert.equal(agenda.placementMode, 'abstract_weekly_capacity');
    assert.equal(agenda.availableMinutes, 1800);
    assert.equal(agenda.days.flatMap(day => day.sessions).length, 0);
    assert.ok(agenda.allocations.length > 0);
});

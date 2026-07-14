import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    DATABASE_KIND,
    PLAN_KIND,
    createEmptyDatabase,
    databaseHasContent,
    normalizeDatabase,
    normalizePlanInput,
    updateDatabase
} from '../js/model.js';

const exampleUrl = new URL('../data/examples/organizer-example.json', import.meta.url);
const example = JSON.parse(await readFile(exampleUrl, 'utf8'));

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

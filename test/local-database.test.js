import assert from 'node:assert/strict';
import test from 'node:test';

import {
    LOCAL_DATABASE_KIND,
    createLocalDatabaseRecord,
    normalizeLocalDatabaseRecord
} from '../js/local-database.js';

test('crea e normalizza la copia di lavoro IndexedDB', () => {
    const record = createLocalDatabaseRecord({
        database: { kind: 'learning-planner-database' },
        fileName: 'percorso.json',
        dirty: true,
        activeDatabasePath: 'data/user/percorso.json',
        databaseConfiguration: { kind: 'learning-planner-db-configuration', schemaVersion: 1 }
    });

    const normalized = normalizeLocalDatabaseRecord(record);
    assert.equal(normalized.kind, LOCAL_DATABASE_KIND);
    assert.equal(normalized.schemaVersion, 1);
    assert.equal(normalized.fileName, 'percorso.json');
    assert.equal(normalized.dirty, true);
    assert.match(normalized.savedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('rifiuta copie locali con schema sconosciuto o database mancante', () => {
    assert.throws(
        () => normalizeLocalDatabaseRecord({ kind: LOCAL_DATABASE_KIND, schemaVersion: 99, database: {} }),
        /formato della copia locale non supportato/i
    );
    assert.throws(
        () => normalizeLocalDatabaseRecord({ kind: LOCAL_DATABASE_KIND, schemaVersion: 1 }),
        /database salvato mancante/i
    );
});

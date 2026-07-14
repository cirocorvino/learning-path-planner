import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createDatabaseConfiguration, emptyDatabaseConfiguration } from '../js/db-configuration.js';
import { createLocalDatabaseRecord } from '../js/local-database.js';
import { PlannerStore } from '../js/store.js';

const exampleUrl = new URL('../data/examples/organizer-example.json', import.meta.url);
const example = JSON.parse(await readFile(exampleUrl, 'utf8'));

function clone(value) {
    return value === null || value === undefined ? value : structuredClone(value);
}

class MemoryLocalDatabaseCache {
    constructor(record = null) {
        this.record = clone(record);
        this.saveCount = 0;
        this.clearCount = 0;
    }

    async load() {
        return clone(this.record);
    }

    async save(record) {
        this.record = clone(record);
        this.saveCount += 1;
    }

    async clear() {
        this.record = null;
        this.clearCount += 1;
    }
}

function useFileMode(t) {
    const originalFetch = globalThis.fetch;
    const originalLocation = globalThis.location;
    t.after(() => {
        globalThis.fetch = originalFetch;
        if (originalLocation === undefined) delete globalThis.location;
        else globalThis.location = originalLocation;
    });
    globalThis.location = { protocol: 'file:' };
    globalThis.fetch = async () => assert.fail('fetch non deve essere invocato in modalità file');
}

function jsonResponse(payload) {
    return {
        ok: true,
        status: 200,
        async json() {
            return structuredClone(payload);
        }
    };
}

function notFoundResponse() {
    return { ok: false, status: 404 };
}

function recordDownloads(t) {
    const originalDocument = globalThis.document;
    const originalUrl = globalThis.URL;
    const blobs = new Map();
    const downloads = [];
    let nextBlobId = 0;

    globalThis.URL = {
        createObjectURL(blob) {
            const url = `blob:test-${nextBlobId += 1}`;
            blobs.set(url, blob);
            return url;
        },
        revokeObjectURL() {}
    };
    globalThis.document = {
        createElement(tagName) {
            assert.equal(tagName, 'a');
            return {
                href: '',
                download: '',
                click() {
                    downloads.push({ fileName: this.download, blob: blobs.get(this.href) });
                }
            };
        }
    };
    t.after(() => {
        globalThis.URL = originalUrl;
        if (originalDocument === undefined) delete globalThis.document;
        else globalThis.document = originalDocument;
    });
    return downloads;
}

test('carica con priorità il database indicato dalla configurazione', async t => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        requestedUrls.push(url);
        if (url === 'data/user/db-configuration.json') {
            return jsonResponse(createDatabaseConfiguration('data/user/percorso-ufficiale.json'));
        }
        if (url === 'data/user/percorso-ufficiale.json') return jsonResponse(example);
        return notFoundResponse();
    };

    const store = new PlannerStore();
    await store.initialize();

    assert.deepEqual(requestedUrls, [
        'data/user/db-configuration.json',
        'data/user/percorso-ufficiale.json'
    ]);
    assert.equal(store.fileName, 'percorso-ufficiale.json');
    assert.equal(store.databaseConfiguration.defaultDatabase, 'data/user/percorso-ufficiale.json');
    assert.match(store.status.message, /database predefinito caricato/i);
    assert.deepEqual(store.status.warnings, []);
});

test('se la configurazione manca carica organizer-data.json senza avvisi', async t => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    let snapshot;
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        requestedUrls.push(url);
        if (url === 'data/user/db-configuration.json') return notFoundResponse();
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    store.subscribe(value => { snapshot = value; });
    await store.initialize();

    assert.deepEqual(requestedUrls, [
        'data/user/db-configuration.json',
        'data/user/organizer-data.json'
    ]);
    assert.equal(store.fileName, 'organizer-data.json');
    assert.deepEqual(store.status.warnings, []);
    assert.equal(store.status.level, 'success');
    assert.equal(snapshot.isDemo, false);
});

test('se la configurazione contiene un percorso non valido avvisa e usa i fallback', async t => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        requestedUrls.push(url);
        if (url === 'data/user/db-configuration.json') {
            return jsonResponse({
                kind: 'learning-planner-db-configuration',
                schemaVersion: 1,
                defaultDatabase: '../database.json'
            });
        }
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    await store.initialize();

    assert.deepEqual(requestedUrls, [
        'data/user/db-configuration.json',
        'data/user/organizer-data.json'
    ]);
    assert.equal(store.fileName, 'organizer-data.json');
    assert.match(store.status.warnings[0], /percorso contiene segmenti non consentiti/i);
    assert.equal(store.status.level, 'warning');
});

test('se il database configurato manca passa al fallback con un avviso', async t => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        requestedUrls.push(url);
        if (url === 'data/user/db-configuration.json') {
            return jsonResponse(createDatabaseConfiguration('data/user/database-assente.json'));
        }
        if (url === 'data/user/database-assente.json') return notFoundResponse();
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    await store.initialize();

    assert.deepEqual(requestedUrls, [
        'data/user/db-configuration.json',
        'data/user/database-assente.json',
        'data/user/organizer-data.json'
    ]);
    assert.equal(store.fileName, 'organizer-data.json');
    assert.match(store.status.warnings[0], /impossibile caricare.*database-assente\.json/i);
});

test('una configurazione vuota usa i fallback senza errore di configurazione', async t => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        requestedUrls.push(url);
        if (url === 'data/user/db-configuration.json') {
            return jsonResponse(emptyDatabaseConfiguration());
        }
        if (url === 'data/user/organizer-data.json') return notFoundResponse();
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    await store.initialize();

    assert.deepEqual(requestedUrls, [
        'data/user/db-configuration.json',
        'data/user/organizer-data.json',
        'data/examples/organizer-example.json'
    ]);
    assert.equal(store.isDemo, true);
    assert.equal(store.databaseConfiguration.defaultDatabase, undefined);
    assert.deepEqual(store.status.warnings, []);
});

test('in modalità file senza IndexedDB inizializzato non carica la DEMO', async t => {
    useFileMode(t);
    const cache = new MemoryLocalDatabaseCache();
    const store = new PlannerStore({ localDatabaseCache: cache });
    await store.initialize();

    assert.equal(store.isDemo, false);
    assert.equal(store.fileName, 'organizer-data.json');
    assert.equal(store.dirty, false);
    assert.match(store.status.message, /nessun database locale/i);
    assert.deepEqual(store.status.warnings, []);
    assert.equal(cache.saveCount, 0);
});

test('in modalità file ripristina il database attivo da IndexedDB', async t => {
    useFileMode(t);
    const cache = new MemoryLocalDatabaseCache(createLocalDatabaseRecord({
        database: example,
        fileName: 'percorso-locale.json',
        dirty: true,
        activeDatabasePath: 'data/user/percorso-locale.json',
        databaseConfiguration: createDatabaseConfiguration('data/user/percorso-locale.json')
    }));

    const store = new PlannerStore({ localDatabaseCache: cache });
    await store.initialize();

    assert.equal(store.database.metadata.id, 'example-organizer');
    assert.equal(store.fileName, 'percorso-locale.json');
    assert.equal(store.dirty, true);
    assert.equal(store.isDemo, false);
    assert.match(store.status.message, /ripristinato da indexeddb/i);
});

test('apertura e modifiche aggiornano automaticamente IndexedDB', async t => {
    useFileMode(t);
    const cache = new MemoryLocalDatabaseCache();
    const store = new PlannerStore({ localDatabaseCache: cache });
    await store.initialize();

    await store.loadDatabaseFile({
        name: 'corso-personale.json',
        async text() { return JSON.stringify(example); }
    });
    assert.equal(cache.record.fileName, 'corso-personale.json');
    assert.equal(cache.record.dirty, false);

    store.update(database => {
        database.metadata.description = 'Modifica persistita automaticamente';
    });
    await store.flushLocalPersistence();

    assert.equal(cache.record.database.metadata.description, 'Modifica persistita automaticamente');
    assert.equal(cache.record.dirty, true);

    const restored = new PlannerStore({ localDatabaseCache: cache });
    await restored.initialize();
    assert.equal(restored.database.metadata.description, 'Modifica persistita automaticamente');
});

test('Nuovo sostituisce la copia attiva e Rimuovi database locale la elimina', async t => {
    useFileMode(t);
    const cache = new MemoryLocalDatabaseCache(createLocalDatabaseRecord({
        database: example,
        fileName: 'precedente.json',
        dirty: false,
        activeDatabasePath: 'data/user/precedente.json',
        databaseConfiguration: createDatabaseConfiguration('data/user/precedente.json')
    }));
    const store = new PlannerStore({ localDatabaseCache: cache });
    await store.initialize();

    store.createNew();
    await store.flushLocalPersistence();
    assert.equal(cache.record.fileName, 'organizer-data.json');
    assert.notEqual(cache.record.database.metadata.id, 'example-organizer');

    await store.clearLocalDatabase();
    assert.equal(cache.record, null);
    assert.equal(cache.clearCount, 1);
    assert.match(store.status.message, /nessun database locale/i);
});

test('un percorso non valido applicato dalle impostazioni attiva un fallback non bloccante', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        if (url === 'data/user/db-configuration.json') return notFoundResponse();
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    await store.initialize();
    store.useConventionalDatabaseFallback(
        new Error('Configurazione database non valida: il percorso deve essere relativo alla root del progetto')
    );

    assert.equal(store.dirty, true);
    assert.equal(store.databaseConfiguration.defaultDatabase, undefined);
    assert.equal(store.status.level, 'warning');
    assert.match(store.status.message, /fallback convenzionale attivo/i);
    assert.match(store.status.warnings[0], /percorso deve essere relativo/i);
});

test('Salva scarica database e configurazione soltanto per un percorso personalizzato', async t => {
    const originalFetch = globalThis.fetch;
    const downloads = recordDownloads(t);
    t.after(() => { globalThis.fetch = originalFetch; });

    globalThis.fetch = async url => {
        if (url === 'data/user/db-configuration.json') return notFoundResponse();
        return jsonResponse(example);
    };

    const store = new PlannerStore();
    await store.initialize();
    store.setDefaultDatabaseConfiguration('data/user/database-ufficiale.json');
    await store.save();

    assert.equal(store.fileName, 'database-ufficiale.json');
    assert.equal(store.dirty, false);
    assert.deepEqual(downloads.map(download => download.fileName), [
        'database-ufficiale.json',
        'db-configuration.json'
    ]);
    assert.equal(JSON.parse(await downloads[0].blob.text()).kind, 'learning-planner-database');
    assert.deepEqual(JSON.parse(await downloads[1].blob.text()), {
        kind: 'learning-planner-db-configuration',
        schemaVersion: 1,
        defaultDatabase: 'data/user/database-ufficiale.json'
    });

    downloads.length = 0;
    store.setDefaultDatabaseConfiguration('');
    await store.save();

    assert.deepEqual(downloads.map(download => download.fileName), ['organizer-data.json']);
    assert.equal(store.databaseConfiguration.defaultDatabase, undefined);
    assert.deepEqual(store.databaseConfiguration, emptyDatabaseConfiguration());
});

test('in modalità file Salva esporta soltanto il JSON e aggiorna IndexedDB', async t => {
    useFileMode(t);
    const downloads = recordDownloads(t);
    const cache = new MemoryLocalDatabaseCache();
    const store = new PlannerStore({ localDatabaseCache: cache });
    await store.initialize();
    await store.loadDatabaseFile({
        name: 'database-locale.json',
        async text() { return JSON.stringify(example); }
    });

    store.update(database => { database.metadata.description = 'Da esportare'; });
    await store.save();

    assert.deepEqual(downloads.map(download => download.fileName), ['database-locale.json']);
    assert.equal(cache.record.dirty, false);
    assert.equal(cache.record.database.metadata.description, 'Da esportare');
});

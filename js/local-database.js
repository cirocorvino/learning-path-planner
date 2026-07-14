export const LOCAL_DATABASE_NAME = 'learning-path-planner';
export const LOCAL_DATABASE_VERSION = 1;
export const LOCAL_DATABASE_STORE = 'application-state';
export const LOCAL_DATABASE_KEY = 'active-database';
export const LOCAL_DATABASE_KIND = 'learning-planner-local-state';
export const LOCAL_DATABASE_SCHEMA_VERSION = 1;

function storageError(message, cause) {
    return new Error(`Archivio locale non disponibile: ${message}`, { cause });
}

function requestResult(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || storageError('operazione IndexedDB non riuscita'));
    });
}

function transactionCompleted(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error || storageError('transazione IndexedDB annullata'));
        transaction.onerror = () => reject(transaction.error || storageError('transazione IndexedDB non riuscita'));
    });
}

export function isDirectFileMode() {
    return globalThis.location?.protocol === 'file:';
}

export function createLocalDatabaseRecord({
    database,
    fileName,
    dirty,
    activeDatabasePath,
    databaseConfiguration
}) {
    return {
        kind: LOCAL_DATABASE_KIND,
        schemaVersion: LOCAL_DATABASE_SCHEMA_VERSION,
        database,
        fileName,
        dirty: Boolean(dirty),
        activeDatabasePath,
        databaseConfiguration,
        savedAt: new Date().toISOString()
    };
}

export function normalizeLocalDatabaseRecord(input) {
    if (input === undefined || input === null) return null;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw storageError('il contenuto salvato non è un oggetto valido');
    }
    if (input.kind !== LOCAL_DATABASE_KIND || input.schemaVersion !== LOCAL_DATABASE_SCHEMA_VERSION) {
        throw storageError('formato della copia locale non supportato');
    }
    if (!input.database || typeof input.database !== 'object' || Array.isArray(input.database)) {
        throw storageError('database salvato mancante o non valido');
    }

    return {
        ...input,
        fileName: String(input.fileName || 'organizer-data.json'),
        dirty: Boolean(input.dirty)
    };
}

export class IndexedDbDatabaseCache {
    #indexedDb;

    constructor(indexedDb = globalThis.indexedDB) {
        this.#indexedDb = indexedDb;
    }

    async #open() {
        if (!this.#indexedDb?.open) {
            throw storageError('IndexedDB non è supportato o è stato disabilitato');
        }

        return new Promise((resolve, reject) => {
            let request;
            try {
                request = this.#indexedDb.open(LOCAL_DATABASE_NAME, LOCAL_DATABASE_VERSION);
            } catch (error) {
                reject(storageError(error.message, error));
                return;
            }

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(LOCAL_DATABASE_STORE)) {
                    database.createObjectStore(LOCAL_DATABASE_STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(storageError(request.error?.message || 'apertura non riuscita', request.error));
            request.onblocked = () => reject(storageError('aggiornamento bloccato da un’altra scheda aperta'));
        });
    }

    async load() {
        const database = await this.#open();
        try {
            const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readonly');
            return await requestResult(transaction.objectStore(LOCAL_DATABASE_STORE).get(LOCAL_DATABASE_KEY));
        } finally {
            database.close();
        }
    }

    async save(record) {
        const database = await this.#open();
        try {
            const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readwrite');
            transaction.objectStore(LOCAL_DATABASE_STORE).put(record, LOCAL_DATABASE_KEY);
            await transactionCompleted(transaction);
        } finally {
            database.close();
        }
    }

    async clear() {
        const database = await this.#open();
        try {
            const transaction = database.transaction(LOCAL_DATABASE_STORE, 'readwrite');
            transaction.objectStore(LOCAL_DATABASE_STORE).delete(LOCAL_DATABASE_KEY);
            await transactionCompleted(transaction);
        } finally {
            database.close();
        }
    }
}

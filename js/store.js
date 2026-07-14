import {
    createEmptyDatabase,
    normalizeDatabase,
    replacePlan,
    snapshotDatabase,
    updateDatabase
} from './model.js';
import {
    DATABASE_CONFIGURATION_FILE,
    DATABASE_CONFIGURATION_URL,
    DEFAULT_DATABASE_PATH,
    createDatabaseConfiguration,
    databaseFileNameFromPath,
    databaseUrlFromConfiguration,
    emptyDatabaseConfiguration,
    normalizeDatabaseConfiguration
} from './db-configuration.js';
import {
    IndexedDbDatabaseCache,
    createLocalDatabaseRecord,
    isDirectFileMode,
    normalizeLocalDatabaseRecord
} from './local-database.js';

const USER_DATABASE_URL = DEFAULT_DATABASE_PATH;
const EXAMPLE_DATABASE_URL = 'data/examples/organizer-example.json';
const CONFIGURATION_WARNING_PREFIX = 'Configurazione database:';
const LOCAL_DATABASE_WARNING_PREFIX = 'Archivio locale:';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function safeFileName(value, fallback = 'learning-planner.json') {
    const name = String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return name ? `${name.replace(/\.json$/i, '')}.json` : fallback;
}

function downloadJson(database, fileName) {
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

async function readJsonFile(file) {
    const text = await file.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`JSON non valido in ${file.name}: ${error.message}`);
    }
}

async function fetchJson(url) {
    if (globalThis.location?.protocol === 'file:') {
        const error = new Error('lettura automatica non consentita in modalità file locale');
        error.status = 404;
        throw error;
    }

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error(`JSON non valido in ${url}: ${error.message}`);
    }
}

export class PlannerStore {
    #database = null;
    #dirty = false;
    #fileName = 'learning-planner.json';
    #isDemo = false;
    #databaseConfiguration = emptyDatabaseConfiguration();
    #activeDatabasePath = USER_DATABASE_URL;
    #listeners = new Set();
    #status = { message: 'Inizializzazione…', level: 'info' };
    #warnings = [];
    #localDatabaseCache;
    #localPersistenceQueue = Promise.resolve();

    constructor({ localDatabaseCache } = {}) {
        this.#localDatabaseCache = localDatabaseCache || new IndexedDbDatabaseCache();
    }

    get database() {
        return this.#database ? clone(this.#database) : null;
    }

    get dirty() {
        return this.#dirty;
    }

    get fileName() {
        return this.#fileName;
    }

    get isDemo() {
        return this.#isDemo;
    }

    get databaseConfiguration() {
        return clone(this.#databaseConfiguration);
    }

    get usesLocalDatabase() {
        return isDirectFileMode();
    }

    get status() {
        return { ...this.#status, dirty: this.#dirty, warnings: [...this.#warnings] };
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #emit() {
        const snapshot = {
            database: this.database,
            dirty: this.#dirty,
            fileName: this.#fileName,
            isDemo: this.#isDemo,
            databaseConfiguration: this.databaseConfiguration,
            status: this.status
        };
        this.#listeners.forEach(listener => listener(snapshot));
    }

    #setStatus(message, level = 'info') {
        this.#status = { message, level };
    }

    #removeLocalDatabaseWarnings() {
        this.#warnings = this.#warnings.filter(warning => !warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX));
    }

    #handleLocalDatabaseError(error) {
        this.#removeLocalDatabaseWarnings();
        this.#warnings.push(`${LOCAL_DATABASE_WARNING_PREFIX} ${error.message || String(error)}`);
        this.#setStatus('Copia locale non aggiornata; esporta un JSON per non perdere le modifiche', 'warning');
        this.#emit();
    }

    #localDatabaseRecord() {
        return createLocalDatabaseRecord({
            database: this.#database,
            fileName: this.#fileName,
            dirty: this.#dirty,
            activeDatabasePath: this.#activeDatabasePath,
            databaseConfiguration: this.#databaseConfiguration
        });
    }

    #queueLocalPersistence() {
        if (!this.usesLocalDatabase || !this.#database) return Promise.resolve();
        const record = this.#localDatabaseRecord();
        this.#localPersistenceQueue = this.#localPersistenceQueue
            .catch(() => undefined)
            .then(() => this.#localDatabaseCache.save(record))
            .then(() => {
                const hadWarnings = this.#warnings.some(warning => warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX));
                this.#removeLocalDatabaseWarnings();
                if (hadWarnings) this.#emit();
            })
            .catch(error => this.#handleLocalDatabaseError(error));
        return this.#localPersistenceQueue;
    }

    async flushLocalPersistence() {
        await this.#localPersistenceQueue;
    }

    #useEmptyLocalDatabase(extraWarnings = []) {
        this.#database = createEmptyDatabase();
        this.#dirty = false;
        this.#fileName = 'organizer-data.json';
        this.#isDemo = false;
        this.#databaseConfiguration = emptyDatabaseConfiguration();
        this.#activeDatabasePath = USER_DATABASE_URL;
        this.#warnings = [...extraWarnings];
        this.#setStatus('Nessun database locale: usa Apri database o Nuovo', extraWarnings.length ? 'warning' : 'info');
        this.#emit();
    }

    async #initializeLocalDatabase() {
        try {
            const record = normalizeLocalDatabaseRecord(await this.#localDatabaseCache.load());
            if (!record) {
                this.#useEmptyLocalDatabase();
                return;
            }

            const startupWarnings = [];
            let databaseConfiguration = emptyDatabaseConfiguration();
            try {
                databaseConfiguration = normalizeDatabaseConfiguration(
                    record.databaseConfiguration || emptyDatabaseConfiguration()
                );
            } catch (error) {
                startupWarnings.push(`${LOCAL_DATABASE_WARNING_PREFIX} configurazione ignorata (${error.message})`);
            }

            const activeDatabasePath = databaseConfiguration.defaultDatabase || USER_DATABASE_URL;
            const result = this.#apply(record.database, {
                fileName: record.fileName,
                dirty: record.dirty,
                message: 'Database locale ripristinato da IndexedDB',
                level: startupWarnings.length ? 'warning' : (record.dirty ? 'warning' : 'success'),
                isDemo: false,
                extraWarnings: startupWarnings,
                activeDatabasePath,
                databaseConfiguration
            });
            if (result.migrated) await this.#queueLocalPersistence();
        } catch (error) {
            this.#useEmptyLocalDatabase([`${LOCAL_DATABASE_WARNING_PREFIX} ${error.message || String(error)}`]);
        }
    }

    #apply(input, {
        fileName,
        dirty = false,
        message,
        level,
        isDemo = false,
        extraWarnings = [],
        activeDatabasePath,
        databaseConfiguration
    } = {}) {
        const result = normalizeDatabase(input);
        this.#database = result.database;
        this.#warnings = [...(result.warnings || []), ...extraWarnings];
        this.#fileName = fileName || safeFileName(result.database.metadata.name);
        this.#isDemo = isDemo;
        this.#dirty = dirty || result.migrated;
        if (activeDatabasePath) this.#activeDatabasePath = activeDatabasePath;
        if (databaseConfiguration) this.#databaseConfiguration = databaseConfiguration;
        this.#setStatus(
            message || (result.migrated
                ? 'Database v1 migrato: salva una copia nel formato v2'
                : `Aperto ${this.#fileName}`),
            level || (this.#dirty || this.#warnings.length ? 'warning' : 'success')
        );
        this.#emit();
        return result;
    }

    async initialize() {
        if (this.usesLocalDatabase) {
            await this.#initializeLocalDatabase();
            return;
        }

        const startupWarnings = [];
        let configurationPayload = null;

        try {
            configurationPayload = await fetchJson(DATABASE_CONFIGURATION_URL);
        } catch (error) {
            this.#databaseConfiguration = emptyDatabaseConfiguration();
            if (error.status !== 404) {
                startupWarnings.push(
                    `${CONFIGURATION_WARNING_PREFIX} ${DATABASE_CONFIGURATION_URL} non utilizzabile (${error.message}); caricato il fallback successivo.`
                );
            }
        }

        if (configurationPayload) {
            try {
                this.#databaseConfiguration = normalizeDatabaseConfiguration(configurationPayload);
            } catch (error) {
                this.#databaseConfiguration = emptyDatabaseConfiguration();
                startupWarnings.push(
                    `${CONFIGURATION_WARNING_PREFIX} ${error.message}; caricato il fallback successivo.`
                );
            }
        }

        const configuredDatabaseUrl = databaseUrlFromConfiguration(this.#databaseConfiguration);
        if (configuredDatabaseUrl) {
            try {
                const payload = await fetchJson(configuredDatabaseUrl);
                this.#apply(payload, {
                    fileName: databaseFileNameFromPath(this.#databaseConfiguration.defaultDatabase),
                    message: `Database predefinito caricato: ${configuredDatabaseUrl}`,
                    extraWarnings: startupWarnings,
                    activeDatabasePath: this.#databaseConfiguration.defaultDatabase
                });
                return;
            } catch (error) {
                startupWarnings.push(
                    `${CONFIGURATION_WARNING_PREFIX} impossibile caricare ${configuredDatabaseUrl} (${error.message}); caricato il fallback successivo.`
                );
            }
        }

        await this.#loadFallbackDatabase(startupWarnings);
    }

    async #loadFallbackDatabase(startupWarnings) {
        let userDatabaseError;

        try {
            const payload = await fetchJson(USER_DATABASE_URL);
            this.#apply(payload, {
                fileName: 'organizer-data.json',
                extraWarnings: startupWarnings,
                activeDatabasePath: USER_DATABASE_URL
            });
            return;
        } catch (error) {
            userDatabaseError = error;
        }

        try {
            const payload = await fetchJson(EXAMPLE_DATABASE_URL);
            this.#apply(payload, {
                fileName: 'learning-planner-example.json',
                message: 'Nessun database utente: esempio generico caricato',
                level: startupWarnings.length === 0 ? 'success' : 'warning',
                isDemo: true,
                extraWarnings: startupWarnings,
                activeDatabasePath: USER_DATABASE_URL
            });
        } catch (exampleError) {
            this.#database = createEmptyDatabase();
            this.#dirty = true;
            this.#fileName = 'learning-planner.json';
            this.#isDemo = false;
            this.#activeDatabasePath = USER_DATABASE_URL;
            this.#warnings = [
                ...startupWarnings,
                `Database fallback non disponibili: ${userDatabaseError.message}; ${exampleError.message}`
            ];
            this.#setStatus(
                `Database utente ed esempio non disponibili: ${exampleError.message}`,
                'warning'
            );
            this.#emit();
        }
    }

    #removeConfigurationWarnings() {
        this.#warnings = this.#warnings.filter(warning => !warning.startsWith(CONFIGURATION_WARNING_PREFIX));
    }

    setDefaultDatabaseConfiguration(databasePath) {
        const configuration = createDatabaseConfiguration(databasePath);
        this.#databaseConfiguration = configuration;
        this.#activeDatabasePath = configuration.defaultDatabase || USER_DATABASE_URL;
        this.#dirty = true;
        this.#removeConfigurationWarnings();
        this.#setStatus(
            configuration.defaultDatabase
                ? `Percorso database aggiornato: premi Salva per scaricare ${DATABASE_CONFIGURATION_FILE}`
                : `Database convenzionale ripristinato: al salvataggio verrà scaricato organizer-data.json`,
            'warning'
        );
        this.#emit();
        void this.#queueLocalPersistence();
    }

    useConventionalDatabaseFallback(reason) {
        const message = reason?.message || String(reason || 'percorso non valido');
        this.#databaseConfiguration = emptyDatabaseConfiguration();
        this.#activeDatabasePath = USER_DATABASE_URL;
        this.#dirty = true;
        this.#removeConfigurationWarnings();
        this.#warnings.push(
            `${CONFIGURATION_WARNING_PREFIX} ${message}; verrà usato ${USER_DATABASE_URL}.`
        );
        this.#setStatus(
            'Impostazioni applicate; percorso database non valido, fallback convenzionale attivo',
            'warning'
        );
        this.#emit();
        void this.#queueLocalPersistence();
    }

    createNew() {
        this.#database = createEmptyDatabase();
        this.#dirty = true;
        this.#fileName = 'organizer-data.json';
        this.#isDemo = false;
        this.#databaseConfiguration = emptyDatabaseConfiguration();
        this.#activeDatabasePath = USER_DATABASE_URL;
        this.#warnings = [];
        this.#setStatus(
            this.usesLocalDatabase
                ? 'Nuovo database conservato localmente; premi Salva per esportare il JSON'
                : 'Nuovo database non ancora salvato',
            'warning'
        );
        this.#emit();
        void this.#queueLocalPersistence();
    }

    openDatabase(fileInput) {
        fileInput.click();
    }

    async loadDatabaseFile(file) {
        const payload = await readJsonFile(file);
        const activeDatabasePath = file.name.toLowerCase() === 'organizer-data.json'
            ? USER_DATABASE_URL
            : `data/user/${file.name}`;
        const databaseConfiguration = activeDatabasePath === USER_DATABASE_URL
            ? emptyDatabaseConfiguration()
            : createDatabaseConfiguration(activeDatabasePath);
        this.#apply(payload, {
            fileName: file.name,
            message: this.usesLocalDatabase
                ? `Aperto ${file.name} e impostato come database locale`
                : undefined,
            activeDatabasePath,
            databaseConfiguration
        });
        await this.#queueLocalPersistence();
    }

    update(updater, message = 'Modifiche non salvate') {
        this.#database = updateDatabase(this.#database, updater);
        this.#dirty = true;
        this.#warnings = this.#warnings.filter(warning =>
            warning.startsWith(CONFIGURATION_WARNING_PREFIX)
            || warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX)
        );
        this.#setStatus(
            this.usesLocalDatabase ? `${message}; copia locale aggiornata automaticamente` : message,
            'warning'
        );
        this.#emit();
        void this.#queueLocalPersistence();
    }

    async importPlanFile(file) {
        const payload = await readJsonFile(file);
        this.#database = replacePlan(this.#database, payload);
        this.#dirty = true;
        this.#warnings = this.#warnings.filter(warning =>
            warning.startsWith(CONFIGURATION_WARNING_PREFIX)
            || warning.startsWith(LOCAL_DATABASE_WARNING_PREFIX)
        );
        this.#setStatus(
            this.usesLocalDatabase
                ? `Programma importato da ${file.name} e salvato nella copia locale`
                : `Programma importato da ${file.name}: salva il database`,
            'warning'
        );
        this.#emit();
        await this.#queueLocalPersistence();
    }

    async save() {
        const snapshot = snapshotDatabase(this.#database);
        const targetPath = this.#activeDatabasePath || USER_DATABASE_URL;
        const targetName = databaseFileNameFromPath(targetPath);
        const usesConventionalDatabase = targetPath === USER_DATABASE_URL;

        downloadJson(snapshot, targetName);
        this.#databaseConfiguration = usesConventionalDatabase
            ? emptyDatabaseConfiguration()
            : createDatabaseConfiguration(targetPath);
        if (!this.usesLocalDatabase && !usesConventionalDatabase) {
            downloadJson(this.#databaseConfiguration, DATABASE_CONFIGURATION_FILE);
        }

        this.#database = snapshot;
        this.#fileName = targetName;
        this.#dirty = false;
        this.#isDemo = false;
        this.#removeConfigurationWarnings();
        this.#setStatus(
            this.usesLocalDatabase
                ? `Scaricato ${targetName}; la copia di lavoro resta salvata in IndexedDB`
                : (usesConventionalDatabase
                    ? 'Scaricato organizer-data.json: copialo in data/user'
                    : `Scaricati ${targetName} e ${DATABASE_CONFIGURATION_FILE}: copiali nei percorsi configurati`),
            'success'
        );
        this.#emit();
        await this.#queueLocalPersistence();
    }

    async clearLocalDatabase() {
        if (!this.usesLocalDatabase) return;
        await this.#localPersistenceQueue;
        await this.#localDatabaseCache.clear();
        this.#useEmptyLocalDatabase();
    }
}

export const plannerStore = new PlannerStore();

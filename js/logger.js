// logger.js - Sistema di logging configurabile
// Permette di abilitare/disabilitare tutti i log dell'applicazione

// Configurazione globale del logging
const LOG_CONFIG = {
    // Abilita/disabilita tutti i log (MASTER SWITCH)
    ENABLED: true,
    
    // Configurazione per categoria
    CATEGORIES: {
        DEBUG: true,      // Debug generale
        SAVE: true,       // Operazioni di salvataggio
        LOAD: true,       // Operazioni di caricamento
        UI: true,         // Aggiornamenti UI
        CALC: true,       // Calcoli e ricalcoli
        TEST: true,       // Log di test
        ERROR: true       // Errori (sempre consigliato true)
    },
    
    // Prefissi per categoria
    PREFIXES: {
        DEBUG: '🔍',
        SAVE: '💾',
        LOAD: '📁',
        UI: '🖥️',
        CALC: '📊',
        TEST: '🧪',
        ERROR: '❌'
    }
};

// Funzioni di logging categorizzate
const Logger = {
    debug: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.DEBUG) {
            console.log(`${LOG_CONFIG.PREFIXES.DEBUG} [DEBUG]`, message, ...args);
        }
    },
    
    save: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.SAVE) {
            console.log(`${LOG_CONFIG.PREFIXES.SAVE} [SAVE]`, message, ...args);
        }
    },
    
    load: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.LOAD) {
            console.log(`${LOG_CONFIG.PREFIXES.LOAD} [LOAD]`, message, ...args);
        }
    },
    
    ui: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.UI) {
            console.log(`${LOG_CONFIG.PREFIXES.UI} [UI]`, message, ...args);
        }
    },
    
    calc: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.CALC) {
            console.log(`${LOG_CONFIG.PREFIXES.CALC} [CALC]`, message, ...args);
        }
    },
    
    test: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.TEST) {
            console.log(`${LOG_CONFIG.PREFIXES.TEST} [TEST]`, message, ...args);
        }
    },
    
    error: (message, ...args) => {
        if (LOG_CONFIG.ENABLED && LOG_CONFIG.CATEGORIES.ERROR) {
            console.error(`${LOG_CONFIG.PREFIXES.ERROR} [ERROR]`, message, ...args);
        }
    },
    
    // Funzione per log generici (backward compatibility)
    log: (message, ...args) => {
        if (LOG_CONFIG.ENABLED) {
            console.log(message, ...args);
        }
    }
};

// Funzioni di controllo del logging
const LogControl = {
    // Salva configurazione nel localStorage
    saveConfig: () => {
        const config = {
            enabled: LOG_CONFIG.ENABLED,
            categories: {...LOG_CONFIG.CATEGORIES}
        };
        localStorage.setItem('logger_config', JSON.stringify(config));
    },
    
    // Carica configurazione dal localStorage
    loadConfig: () => {
        try {
            const saved = localStorage.getItem('logger_config');
            if (saved) {
                const config = JSON.parse(saved);
                LOG_CONFIG.ENABLED = config.enabled;
                Object.assign(LOG_CONFIG.CATEGORIES, config.categories);
                console.log('🔄 Configurazione Logger caricata da localStorage');
            }
        } catch (e) {
            console.log('⚠️ Errore caricamento configurazione Logger, uso default');
        }
    },
    
    // Disabilita tutti i log
    disableAll: () => {
        LOG_CONFIG.ENABLED = false;
        LogControl.saveConfig();
        console.log('🔇 Tutti i log sono stati disabilitati');
    },
    
    // Abilita tutti i log
    enableAll: () => {
        LOG_CONFIG.ENABLED = true;
        LogControl.saveConfig();
        console.log('🔊 Tutti i log sono stati abilitati');
    },
    
    // Disabilita una categoria specifica
    disableCategory: (category) => {
        if (LOG_CONFIG.CATEGORIES.hasOwnProperty(category.toUpperCase())) {
            LOG_CONFIG.CATEGORIES[category.toUpperCase()] = false;
            LogControl.saveConfig();
            console.log(`🔇 Log categoria ${category} disabilitati`);
        }
    },
    
    // Abilita una categoria specifica
    enableCategory: (category) => {
        if (LOG_CONFIG.CATEGORIES.hasOwnProperty(category.toUpperCase())) {
            LOG_CONFIG.CATEGORIES[category.toUpperCase()] = true;
            LogControl.saveConfig();
            console.log(`🔊 Log categoria ${category} abilitati`);
        }
    },
    
    // Mostra stato attuale
    status: () => {
        console.log('📊 Stato Logging:', {
            enabled: LOG_CONFIG.ENABLED,
            categories: LOG_CONFIG.CATEGORIES
        });
    },
    
    // Modalità produzione (solo errori)
    productionMode: () => {
        LOG_CONFIG.ENABLED = true;
        Object.keys(LOG_CONFIG.CATEGORIES).forEach(cat => {
            LOG_CONFIG.CATEGORIES[cat] = (cat === 'ERROR');
        });
        LogControl.saveConfig();
        console.log('🏭 Modalità produzione attivata (solo errori)');
    },
    
    // Modalità sviluppo (tutti i log)
    developmentMode: () => {
        LOG_CONFIG.ENABLED = true;
        Object.keys(LOG_CONFIG.CATEGORIES).forEach(cat => {
            LOG_CONFIG.CATEGORIES[cat] = true;
        });
        LogControl.saveConfig();
        console.log('🛠️ Modalità sviluppo attivata (tutti i log)');
    },
    
    // Reset completo configurazione
    resetConfig: () => {
        localStorage.removeItem('logger_config');
        LOG_CONFIG.ENABLED = true;
        Object.keys(LOG_CONFIG.CATEGORIES).forEach(cat => {
            LOG_CONFIG.CATEGORIES[cat] = true;
        });
        console.log('🔄 Configurazione Logger resettata ai default');
    }
};

// Esponi oggetti globalmente
window.Logger = Logger;
window.LogControl = LogControl;

// Comandi rapidi per la console
window.disableLogs = LogControl.disableAll;
window.enableLogs = LogControl.enableAll;
window.logStatus = LogControl.status;
window.prodMode = LogControl.productionMode;
window.devMode = LogControl.developmentMode;
window.resetLogs = LogControl.resetConfig;

// Carica configurazione salvata all'avvio
LogControl.loadConfig();

// Messaggio iniziale
Logger.debug('Sistema di logging inizializzato');
console.log('💡 Comandi rapidi disponibili:');
console.log('  disableLogs() - Disabilita tutti i log');
console.log('  enableLogs()  - Abilita tutti i log');
console.log('  logStatus()   - Mostra stato logging');
console.log('  prodMode()    - Solo errori');
console.log('  devMode()     - Tutti i log');
console.log('  resetLogs()   - Reset configurazione');
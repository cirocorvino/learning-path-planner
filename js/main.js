// main.js - File principale di inizializzazione e coordinamento

// Funzione di inizializzazione principale
function init() {
    Logger.debug('Inizializzazione applicazione...');
    
    // Prima inizializza le ore dei corsi (default)
    initializeCourseHours();
    Logger.debug('Ore inizializzate');
    
    // POI tenta di caricare l'ultimo piano utilizzato
    // (questo potrebbe sovrascrivere le ore calcolate sopra)
    const wasLoaded = loadLastPlan();
    Logger.load('Piano caricato:', wasLoaded ? 'SI' : 'NO (usando default)');
    
    // Se non è stato caricato nessun piano, assicurati che le variabili siano corrette
    if (!wasLoaded) {
        Logger.debug('Inizializzando valori predefiniti...');
        currentPlanName = 'Piano Predefinito';
        currentPlanDescription = 'Percorso completo di certificazione professionale - Ore Effettive Ricalcolate';
        currentPlanId = null;
    }
    
    // IMPORTANTE: Calcola le date (che calcola anche le settimane individuali e le statistiche)
    recalculateDates();
    Logger.debug('Date ricalcolate');
    
    // Aggiorna display del piano corrente
    updateCurrentPlanDisplay();
    Logger.ui('Display piano aggiornato:', {
        name: currentPlanName,
        description: currentPlanDescription,
        titleElement: document.getElementById('appTitle').textContent,
        descElement: document.getElementById('appDescription').textContent
    });
    
    // Aggiorna visualizzazione parametri di calcolo
    updateCalculationDisplay();
    
    Logger.debug('Inizializzazione completata:', {
        totalCourses: courses.length,
        totalHours: courses.reduce((sum, c) => sum + c.hours, 0),
        currentPlan: currentPlanName,
        headerTitle: document.getElementById('appTitle').textContent,
        headerDesc: document.getElementById('appDescription').textContent
    });
    
    // Imposta stato iniziale readonly per i campi
    const weeklyHoursInput = document.getElementById('weeklyHours');
    const startDateInput = document.getElementById('startDate');
    weeklyHoursInput.style.background = '#f0f0f0';
    startDateInput.style.background = '#f0f0f0';
    
    Logger.debug('Inizializzazione completata');
}

// Inizializza l'applicazione al caricamento della pagina
window.onload = function() {
    init();
};
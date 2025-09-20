// main.js - File principale di inizializzazione e coordinamento

// Funzione di inizializzazione principale
function init() {
    console.log('🚀 Inizializzazione applicazione...');
    
    // Prima inizializza le ore dei corsi (default)
    initializeCourseHours();
    console.log('✅ Ore inizializzate');
    
    // POI tenta di caricare l'ultimo piano utilizzato
    // (questo potrebbe sovrascrivere le ore calcolate sopra)
    const wasLoaded = loadLastPlan();
    console.log('📁 Piano caricato:', wasLoaded ? 'SI' : 'NO (usando default)');
    
    // IMPORTANTE: Calcola le date (che calcola anche le settimane individuali e le statistiche)
    recalculateDates();
    console.log('📅 Date ricalcolate');
    
    // Aggiorna display del piano corrente
    updateCurrentPlanDisplay();
    
    // Aggiorna visualizzazione parametri di calcolo
    updateCalculationDisplay();
    
    // Imposta stato iniziale readonly per i campi
    const weeklyHoursInput = document.getElementById('weeklyHours');
    const startDateInput = document.getElementById('startDate');
    weeklyHoursInput.style.background = '#f0f0f0';
    startDateInput.style.background = '#f0f0f0';
    
    console.log('✅ Inizializzazione completata');
}

// Inizializza l'applicazione al caricamento della pagina
window.onload = function() {
    init();
};
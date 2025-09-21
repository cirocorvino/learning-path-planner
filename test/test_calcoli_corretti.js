// test_calcoli_corretti.js - Script di verifica per l'app

// Funzione di test che può essere eseguita nella console del browser
function testCalcoliOreApp() {
    console.log("=== TEST CALCOLI ORE APPLICAZIONE ===");
    
    // Controlla se i corsi sono stati inizializzati
    if (!courses || courses.length === 0) {
        console.error("ERRORE: Array 'courses' non trovato o vuoto!");
        return;
    }
    
    console.log(`Numero corsi trovati: ${courses.length}`);
    
    // Mostra le ore calcolate per ogni corso
    let totalCalculatedHours = 0;
    courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.name}: ${course.hours}h`);
        totalCalculatedHours += course.hours;
    });
    
    console.log(`\nTOTALE ORE CALCOLATE: ${totalCalculatedHours}h`);
    
    // Verifica HTML
    const htmlTotalHours = document.getElementById('totalHours').textContent;
    const htmlTotalWeeks = document.getElementById('totalWeeks').textContent;
    const htmlTotalCourses = document.getElementById('totalCourses').textContent;
    
    console.log(`\n=== VALORI VISUALIZZATI NELL'HTML ===`);
    console.log(`Ore totali mostrate: ${htmlTotalHours}h`);
    console.log(`Settimane mostrate: ${htmlTotalWeeks}`);
    console.log(`Corsi mostrati: ${htmlTotalCourses}`);
    
    // Verifica coerenza settimane
    const expectedWeeksSimple = Math.ceil(totalCalculatedHours / weeklyHours);
    const actualWeeksFromCourses = courses.reduce((sum, course) => sum + (course.weeks || 0), 0);
    
    console.log(`\n=== VERIFICA COERENZA SETTIMANE ===`);
    console.log(`Calcolo semplice (${totalCalculatedHours}h ÷ ${weeklyHours}h): ${expectedWeeksSimple} settimane`);
    console.log(`Somma settimane reali corsi: ${actualWeeksFromCourses} settimane`);
    console.log(`Settimane mostrate in HTML: ${htmlTotalWeeks}`);
    
    console.log(`\n=== VERIFICA COERENZA ===`);
    console.log(`Ore calcolate match HTML: ${Math.round(totalCalculatedHours) == htmlTotalHours ? '✅' : '❌'}`);
    console.log(`Settimane reali (${actualWeeksFromCourses}) match HTML: ${actualWeeksFromCourses == htmlTotalWeeks ? '✅' : '❌'}`);
    console.log(`Settimane semplici (${expectedWeeksSimple}) match HTML: ${expectedWeeksSimple == htmlTotalWeeks ? '✅' : '❌'}`);
    console.log(`Corsi calcolati (${courses.length}) match HTML: ${courses.length == htmlTotalCourses ? '✅' : '❌'}`);
    
    if (Math.round(totalCalculatedHours) != htmlTotalHours) {
        console.warn(`⚠️ DISCREPANZA ORE: Calcolate ${Math.round(totalCalculatedHours)}h ma mostrate ${htmlTotalHours}h`);
    }
    
    if (actualWeeksFromCourses != htmlTotalWeeks) {
        console.warn(`⚠️ DISCREPANZA SETTIMANE: Reali ${actualWeeksFromCourses} ma mostrate ${htmlTotalWeeks}`);
    }
    
    return {
        corsiCalcolati: courses.length,
        oreCalcolate: totalCalculatedHours,
        oreMostrate: parseInt(htmlTotalHours),
        settimaneCalcolateReali: actualWeeksFromCourses,
        settimaneCalcolateSemplici: expectedWeeksSimple,
        settimaneMostrate: parseInt(htmlTotalWeeks)
    };
}

// Funzione per ricalcolare tutto e verificare
function ricalcolaEVerifica() {
    console.log("=== RICALCOLO FORZATO ===");
    
    // Forza ricalcolo ore
    initializeCourseHours();
    
    // Forza ricalcolo date e statistiche
    recalculateDates();
    
    // Testa i risultati
    return testCalcoliOreApp();
}

console.log("✅ Script di test caricato!");
console.log("Usa testCalcoliOreApp() per verificare i calcoli");
console.log("Usa ricalcolaEVerifica() per forzare un ricalcolo completo");
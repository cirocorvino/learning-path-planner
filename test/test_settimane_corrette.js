// test_settimane_corrette.js - Test per verificare il fix delle settimane

function testSettimaneCorrette() {
    console.log('🧪 === TEST SETTIMANE CORRETTE ===');
    console.log('');
    
    // Forza un ricalcolo delle date per testare il fix
    recalculateDates();
    
    console.log('📊 Verifica corrispondenza settimane Gantt vs Dettaglio:');
    console.log('');
    
    courses.forEach((course, index) => {
        // Settimane dal Gantt (calculate)
        const ganttWeeks = course.weeks;
        
        // Settimane dal dettaglio (count between dates)
        const detailWeeks = getWeeksForCourse(course);
        const detailWeeksCount = detailWeeks.length;
        
        // Verifica corrispondenza
        const match = ganttWeeks === detailWeeksCount;
        const status = match ? '✅' : '❌';
        
        console.log(`${status} Corso ${index + 1}: "${course.name}"`);
        console.log(`   Gantt: ${ganttWeeks} settimane`);
        console.log(`   Dettaglio: ${detailWeeksCount} settimane`);
        console.log(`   Date: ${course.startDate} → ${course.endDate}`);
        
        if (!match) {
            console.log(`   ⚠️  MISMATCH: Differenza di ${detailWeeksCount - ganttWeeks} settimana/e`);
        }
        
        console.log('');
    });
    
    // Conteggio risultati
    const totalCourses = courses.length;
    const correctCourses = courses.filter(course => {
        const ganttWeeks = course.weeks;
        const detailWeeks = getWeeksForCourse(course);
        return ganttWeeks === detailWeeks.length;
    }).length;
    
    const incorrectCourses = totalCourses - correctCourses;
    
    console.log('📈 === RISULTATI ===');
    console.log(`Corsi totali: ${totalCourses}`);
    console.log(`Corsi corretti: ${correctCourses} ✅`);
    console.log(`Corsi con errori: ${incorrectCourses} ❌`);
    console.log('');
    
    if (incorrectCourses === 0) {
        console.log('🎉 SUCCESSO: Tutte le settimane corrispondono!');
    } else {
        console.log('🔧 PROBLEMA: Alcuni corsi hanno ancora mismatch settimane');
    }
    
    console.log('');
    console.log('✅ === FINE TEST SETTIMANE ===');
}

// Test rapido per singolo corso
function testSingoloCorso(courseIndex = 1) {
    const course = courses[courseIndex];
    if (!course) {
        console.log('❌ Corso non trovato');
        return;
    }
    
    console.log(`🔍 Test rapido corso: "${course.name}"`);
    console.log(`Ore: ${course.hours}h`);
    console.log(`Ore settimanali: ${weeklyHours}h`);
    console.log(`Settimane calcolate: ${Math.ceil(course.hours / weeklyHours)}`);
    console.log(`Settimane Gantt: ${course.weeks}`);
    console.log(`Settimane Dettaglio: ${getWeeksForCourse(course).length}`);
    console.log(`Date: ${course.startDate} → ${course.endDate}`);
}

// Comandi rapidi per la console
window.testSettimane = testSettimaneCorrette;
window.testCorso = testSingoloCorso;

console.log('💡 Test settimane caricato!');
console.log('Esegui: testSettimane() o testCorso(1)');
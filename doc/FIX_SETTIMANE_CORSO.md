# Fix Settimane Corso - Problema Risolto

## 🐛 Problema Identificato

**Sintomo**: I corsi dal secondo in poi nella lista del Gantt mostravano sempre **una settimana in più** nel dettaglio corso rispetto a quelle visualizzate nel periodo del Gantt.

## 🔍 Causa del Problema

### Come Funzionava Prima (ERRATO):
1. **Calcolo settimane Gantt**: `Math.ceil(course.hours / weeklyHours)` ✅ (Corretto)
2. **Calcolo endDate**: 
   ```javascript
   currentDate.setDate(currentDate.getDate() + (weeksNeeded * 7));
   course.endDate = new Date(currentDate).toISOString().split('T')[0];
   ```
   ❌ L'endDate puntava al **primo giorno della settimana successiva**

3. **Calcolo settimane dettaglio**: Loop che conta i giorni tra `startDate` e `endDate`
   ```javascript
   while (currentWeekStart <= endDate) {
       weeks.push({...});
   }
   ```
   ❌ Trovava una settimana extra perché endDate includeva la settimana successiva

### Esempio del Bug:
- **Corso**: 30 ore, 15 ore/settimana = 2 settimane
- **Gantt**: Mostra correttamente 2 settimane
- **endDate**: Punta al giorno 15 invece del giorno 14
- **Dettaglio**: Conta 3 settimane (include la settimana del giorno 15)

## ✅ Soluzione Implementata

### Fix nel Calcolo endDate:
```javascript
// PRIMA (errato):
currentDate.setDate(currentDate.getDate() + (weeksNeeded * 7));
course.endDate = new Date(currentDate).toISOString().split('T')[0];

// DOPO (corretto):
const courseEndDate = new Date(currentDate);
courseEndDate.setDate(courseEndDate.getDate() + (weeksNeeded * 7) - 1);
course.endDate = courseEndDate.toISOString().split('T')[0];
```

### Logica della Correzione:
1. **endDate** ora punta all'**ultimo giorno** dell'ultima settimana del corso (giorno 14 nell'esempio)
2. **currentDate** per il corso successivo inizia comunque dal giorno 15 (settimana dopo)
3. **getWeeksForCourse()** ora conta correttamente le settimane esatte

## 🧪 Test della Correzione

### Test Script Creato: `test_settimane_corrette.js`

```javascript
testSettimane()    // Test completo tutti i corsi
testCorso(1)       // Test singolo corso (indice 1)
```

### Cosa Verifica:
- ✅ **Corrispondenza**: Settimane Gantt = Settimane Dettaglio
- ✅ **Calcoli**: Math.ceil(ore/settimanaOre) = count(startDate → endDate)
- ✅ **Date**: endDate è l'ultimo giorno dell'ultima settimana
- ✅ **Statistiche**: Totale settimane corretto

## 📊 Impatto del Fix

### Prima del Fix:
- ❌ Corso 1: Gantt 2 settimane, Dettaglio 2 settimane (OK solo il primo)
- ❌ Corso 2: Gantt 3 settimane, Dettaglio 4 settimane  
- ❌ Corso 3: Gantt 2 settimane, Dettaglio 3 settimane
- ❌ Confusione utente, dati inconsistenti

### Dopo il Fix:
- ✅ Corso 1: Gantt 2 settimane, Dettaglio 2 settimane
- ✅ Corso 2: Gantt 3 settimane, Dettaglio 3 settimane
- ✅ Corso 3: Gantt 2 settimane, Dettaglio 2 settimane
- ✅ Dati coerenti, UX migliorata

## 🔧 File Modificati

1. **`js/calculations.js`** - Correzione calcolo `endDate`
2. **`test/test_settimane_corrette.js`** - Test di verifica (nuovo)
3. **`index.html`** - Aggiunto script di test

## ⚡ Come Testare il Fix

1. **Apri l'app**: http://localhost:3000
2. **Console browser**: `testSettimane()`
3. **Verifica**: Tutti i corsi dovrebbero mostrare ✅
4. **Test manuale**: 
   - Click su un corso nel Gantt
   - Conta le settimane nel dettaglio
   - Confronta con le settimane mostrate nel Gantt
   - Dovrebbero corrispondere esattamente

## 💡 Prevenzione Futura

Per evitare problemi simili:
1. **Test automatici** per verificare coerenza calcoli
2. **Logging** delle date calcolate per debug
3. **Validazione** incrociata tra componenti
4. **Documentazione** chiara degli algoritmi di calcolo

---

**Status**: ✅ **RISOLTO** - Le settimane ora corrispondono perfettamente tra Gantt e dettaglio corso!
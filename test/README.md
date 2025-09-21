# 🧪 Cartella Test

Questa cartella contiene tutti i file di test e debug per l'applicazione Piano di Studio AI Development.

## File di Test

### Test Funzionalità Principali
- `test_testata.js` - Test per la modifica del titolo e descrizione della testata
- `test_bug_salvataggio.js` - Test per il debug del sistema di salvataggio
- `test_simulazione_utente.js` - Simulazione completa del flusso utente
- `test_immediato.js` - Test rapidi per verifiche immediate

### Test Calcoli
- `test_calcoli_corretti.js` - Test per la correttezza dei calcoli delle ore
- `test_hours_calculation.js` - Test specifici per il calcolo delle ore effettive

### Test Storage
- `test_localStorage.js` - Test per il salvataggio e caricamento da localStorage
- `test_completo_salvataggio.js` - Test completo del sistema di salvataggio

### File Debug
- `debug_metadata.js` - Strumenti di debug per i metadata dei piani
- `debug_salvataggio.js` - Debug specifico per il processo di salvataggio

### File Esempi
- `esempio_struttura_piano.js` - Esempi di strutture dati per i piani

## Come Usare i Test

I test sono già inclusi in `index.html` e si possono eseguire aprendo la console del browser:

```javascript
// Esempi di comandi disponibili
testTestata()           // Test della testata
testStatoCorrente()     // Stato attuale dell'app
simulazioneCompleta()   // Simulazione utente completa
```

## Rimozione in Produzione

Per la versione di produzione, rimuovere:
1. Questa cartella `test/`
2. I riferimenti ai test in `index.html` (sezione "Script di test")
3. Eventuali console.log di debug nel codice principale

## Note

- I test utilizzano le funzioni globali dell'app principale
- Non richiedono librerie esterne
- Sono progettati per essere eseguiti nel browser con l'app caricata
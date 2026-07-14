# Test

I test usano il runner integrato di Node.js 20+ e non richiedono dipendenze:

```bash
npm test
```

Prima dei test, lo script verifica che `js/app.bundle.js` sia sincronizzato con i moduli sorgente. `bundle.test.js` impedisce che la DEMO venga incorporata nuovamente nel bundle locale. `local-database.test.js` copre l'involucro versionato della copia IndexedDB. `db-configuration.test.js` copre schema, percorsi relativi e nomi riservati. `model.test.js` copre validazione, aggiornamenti e migrazione dei formati precedenti. `planner.test.js` copre capacità, target, eccezioni, Gantt, allocazioni e agenda. `store.test.js` verifica i flussi separati HTTP e `file://`, l'autosalvataggio, i fallback e i download.

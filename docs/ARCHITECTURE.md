# Architettura

Learning Path Planner è una single-page application statica, senza framework e senza backend. Il browser è l'unico runtime. Via HTTP la fonte primaria è il database indicato da `data/user/db-configuration.json`; via `file://` è la copia di lavoro conservata in IndexedDB.

## Componenti

- `model.js` definisce invarianti, normalizza ogni input, migra il formato organizer v1 al formato v2 e valida l'estensione v3 con release plan v1-v5.
- `db-configuration.js` valida la configurazione, limita i percorsi alla root del progetto e costruisce l'URL del database predefinito.
- `local-database.js` gestisce l'involucro versionato e le transazioni IndexedDB usate esclusivamente da `file://`.
- `planner.js` è un motore puro: calcola capacità, date del Gantt, allocazioni degli argomenti e agenda della settimana.
- `store.js` coordina stato, autosalvataggio IndexedDB, caricamento HTTP e download dei file JSON.
- `app.js` costruisce la UI con API DOM e `textContent`, senza eseguire HTML proveniente dai file importati.
- `app.bundle.js` è l'artefatto classico generato dai moduli sorgente e permette al browser di avviare l'app direttamente da disco.

## Flusso dei dati

### Avvio HTTP

```text
data/user/db-configuration.json
          │
          ├── defaultDatabase ──► database personalizzato
          │
          └── assente/vuoto/errore
                         ▼
           data/user/organizer-data.json
                         │ assente/errore
                         ▼
           data/examples/organizer-example.json (DEMO)
                         │
                         ▼
              validazione e migrazione
                         │
                         ▼
                stato normalizzato v2/v3
                  │             │
                  ├──► Gantt    └──► interfaccia
                  │
                  └──► download JSON e configurazione opzionale
```

Via HTTP lo stato modificato resta in memoria. Il download prodotto da **Salva** non scrive nella directory servita: la sostituzione dei file è un'operazione esplicita dell'utente.

### Avvio diretto `file://`

```text
IndexedDB ── record presente ──► validazione ──► stato normalizzato v2/v3
     │
     └── record assente ───────► planner vuoto, senza DEMO

Apri database ──► copia importata ──► IndexedDB
modifiche UI ────────────────────────► IndexedDB
Salva ───────────────────────────────► download del solo database JSON
```

`db-configuration.json`, `organizer-data.json` e il file DEMO non vengono letti automaticamente da `file://`. IndexedDB è la copia operativa, mentre il JSON scaricato è il formato portabile e di backup. Il flag `dirty` indica modifiche successive all'ultima apertura o esportazione e non l'esito della persistenza IndexedDB.

Ogni modifica attraversa nuovamente la normalizzazione. Il planner non muta il database e può quindi essere testato separatamente dalla UI. I flussi utente completi sono descritti in [GESTIONE-DATABASE.md](GESTIONE-DATABASE.md).

## Scelte intenzionali

- **Local-first:** nessun backend, account o servizio esterno e nessun accesso diretto in scrittura al filesystem; in `file://` il database operativo è persistito in IndexedDB, mai in `localStorage`.
- **Modello esplicito:** i tipi degli argomenti e i ruoli delle categorie sostituiscono inferenze basate sui nomi.
- **Piano sequenziale:** un modulo inizia dopo la fine del precedente; gli organizer usano gli slot, mentre un release plan v5 può usare una capacità settimanale astratta senza fasce orarie.
- **Consuntivo attestato:** elapsed per task, unione giornaliera, lead time ed effort agentico restano misure diverse; gli eventi GitHub sono evidenze di output, non durate.
- **Date senza orario:** i calcoli usano date ISO in UTC per evitare scarti dovuti all'ora legale.
- **Distribuzione statica:** il bundle classico versionato non richiede build per l'utilizzatore e non incorpora la DEMO; `npm run build` serve dopo una modifica ai moduli sorgente.

## Confini attuali

Il motore supporta un solo piano attivo per database, moduli sequenziali e indisponibilità giornaliere per gli slot focus. Lo stato contiene il progresso per argomento, ma l'interfaccia di avanzamento non è ancora esposta.

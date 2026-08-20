# Learning Path Planner

Applicazione web **local-first** per progettare un percorso di apprendimento, stimarne la durata e distribuirne gli argomenti negli slot disponibili della settimana.

Il piano viene mostrato su un diagramma di Gantt e, per ogni settimana, come agenda operativa con argomenti, tempi e indisponibilità. Non richiede backend, account o servizi cloud: i dati restano nel browser oppure in file JSON gestiti esplicitamente dall'utente.

## Funzioni principali

- moduli sequenziali, argomenti tipizzati e settimane di recupero;
- stime in minuti e moltiplicatori configurabili per teoria, pratica, esercizi e progetti;
- categorie personalizzabili con ruoli `focus`, `busy` e `neutral`;
- template settimanale con più slot per giorno;
- target settimanale e date eccezionali che riducono la capacità reale;
- Gantt calcolato sulla disponibilità effettiva e dettaglio di ogni settimana;
- dashboard di rilascio opzionale con avanzamento funzionale, gate di readiness, WP, forecast e semantica esplicita degli snapshot;
- copia di lavoro IndexedDB in modalità `file://` ed esportazione JSON portabile;
- importazione di piani (solo dati relativi ai moduli e agli argomenti, senza le categorie e i parametri dell'app);
- database predefinito configurabile (indexedDB, oppure, con web server, data/user/organizer-data.json).

## Scegliere come avviare l'app

Learning Path Planner supporta due modalità con comportamenti intenzionalmente diversi:

| | Apertura diretta `file://` | Server HTTP o GitHub Pages |
|---|---|---|
| Database all'avvio | Copia IndexedDB del browser | File JSON presenti nel progetto |
| Primo avvio senza dati | Planner vuoto, senza DEMO | Database di esempio in modalità DEMO |
| Modifiche | Autosalvate in IndexedDB | Conservate nella pagina fino al download |
| **Salva** | Esporta un backup JSON | Scarica database e configurazione opzionale |

Per l'uso personale più semplice, aprire direttamente `index.html`. Non servono installazione o server. Al primo avvio il planner vuoto è già modificabile: configurarlo tramite **Impostazioni** e aggiungere i contenuti da **Moduli e argomenti**. In alternativa, **Apri database** importa un JSON esistente. **Nuovo** resta disabilitato finché il piano è già vuoto.

In `file://`, ogni modifica applicata viene conservata automaticamente in IndexedDB. Il file eventualmente scelto con **Apri database** non viene modificato e non resta collegato all'app; **Salva** esporta una nuova copia JSON da usare come backup.

Per caricare automaticamente un database collocato nel progetto o mostrare la DEMO, avviare invece un server statico dalla root:

```bash
python -m http.server 3001
```

oppure:

```bash
php -S localhost:3001
```

Aprire `http://localhost:3001`. Non sono necessarie dipendenze runtime.

La guida completa [docs/GESTIONE-DATABASE.md](docs/GESTIONE-DATABASE.md) descrive i flussi consigliati, il passaggio tra le due modalità e la gestione dei backup.

## Gestire il proprio database

### Uso diretto senza server

1. Aprire `index.html`.
2. Configurare il planner vuoto oppure importare un JSON con **Apri database**.
3. Lavorare normalmente: **Applica impostazioni**, **Aggiorna il piano** e le importazioni aggiornano IndexedDB.
4. Premere periodicamente **Salva** per esportare un backup portabile.

Il pallino `●` segnala che lo stato corrente non è ancora stato esportato; in questa modalità non indica una mancata persistenza nel browser. **Rimuovi database locale**, disponibile nelle Impostazioni, elimina la copia IndexedDB ma non i JSON già scaricati.

### Server con il nome convenzionale

1. Collocare il database in `data/user/organizer-data.json`.
2. Non creare `db-configuration.json`, oppure lasciarlo senza `defaultDatabase`.
3. Avviare il server: il database viene caricato automaticamente.
4. Dopo le modifiche, premere **Salva** e sostituire manualmente `data/user/organizer-data.json` con il file scaricato.

### Server con un nome personalizzato

1. In **Impostazioni**, indicare un percorso relativo come `data/user/corso-dotnet.json`.
2. Premere **Applica impostazioni**, quindi **Salva**.
3. Copiare il database scaricato nel percorso dichiarato.
4. Copiare anche `db-configuration.json` in `data/user/`.
5. Ricaricare la pagina e verificare il database aperto.

Il percorso deve essere relativo alla root servita: un valore assoluto come `C:\Users\nome\Documenti\database.json` non è accessibile alla SPA. **Salva** produce download e non sovrascrive direttamente i file del progetto.

### Priorità e fallback HTTP

Quando è aperta via HTTP, l'app prova nell'ordine:

1. il database indicato da `data/user/db-configuration.json`;
2. `data/user/organizer-data.json`;
3. `data/examples/organizer-example.json` in modalità DEMO.

Una configurazione assente o vuota e il normale passaggio ai fallback sono trasparenti. Una configurazione invalida o un database esplicitamente indicato ma non caricabile generano un avviso non bloccante, seguito dal fallback successivo.

Le copie IndexedDB di `file://` e i database caricati via HTTP sono indipendenti. Per passare da una modalità all'altra, esportare con **Salva** e importare o collocare il JSON secondo il flusso di destinazione. L'app non usa `localStorage`.

## Sviluppo e test

Il bundle classico `js/app.bundle.js` è già incluso e non incorpora dati dimostrativi. Chi modifica i sorgenti in `js/` deve rigenerarlo con:

```bash
npm run build
```

Per eseguire i test serve Node.js 20 o successivo:

```bash
npm test
```

## Uso

1. Aprire **Impostazioni** per definire categorie, disponibilità ricorrenti, target ed eccezioni.
2. Aprire **Moduli e argomenti** per comporre il percorso e ordinare le attività.
3. Consultare il Gantt; selezionare un modulo per vedere la distribuzione settimanale.
4. Usare **Salva** per esportare il database corrente come JSON; via HTTP può essere scaricata anche la relativa configurazione.
5. Usare **Importa programma** per sostituire soltanto il percorso, conservando disponibilità e categorie.

## Interfaccia

La schermata è composta da barra delle azioni, riepilogo, diagramma di Gantt e dettaglio settimanale. Le finestre **Impostazioni** e **Moduli e argomenti** permettono di personalizzare rispettivamente disponibilità e contenuti del percorso.

La guida [docs/INTERFACCIA.md](docs/INTERFACCIA.md) descrive ogni area e chiarisce la differenza tra **Apri database** e **Importa programma**. La guida [docs/GESTIONE-DATABASE.md](docs/GESTIONE-DATABASE.md) raccoglie tutti i casi di caricamento, persistenza, esportazione e fallback.

## Struttura

```text
index.html                 interfaccia e dialog di modifica
Style/                     foglio di stile, manifest e icona
js/model.js                schema, validazione e migrazione v1
js/db-configuration.js     schema e validazione della configurazione predefinita
js/local-database.js       persistenza della copia di lavoro in IndexedDB
js/planner.js              capacità, Gantt e agenda settimanale
js/store.js                stato e I/O locale dei file JSON
js/app.js                  rendering e interazioni UI
js/app.bundle.js           versione classica pronta per l'apertura file://
scripts/build-classic.mjs  generazione e verifica del bundle classico
data/examples/             database dimostrativo versionato
data/user/                 database locali ignorati da Git
data/private/              documenti privati ignorati da Git
test/                      test automatici del modello e del planner
docs/                      gestione database, interfaccia, formato dati, architettura, privacy e roadmap
```

## Formati e privacy

I formati v2 e v3 per la governance di rilascio sono documentati in [docs/JSON-DATABASE.md](docs/JSON-DATABASE.md). Un piano importabile è disponibile in [data/study-program-example.json](data/study-program-example.json).

`data/user/` e `data/private/` sono esclusi da Git salvo i rispettivi README. Prima di rendere pubblico un repository che in passato ha contenuto dati personali, cancellare i file dal ramo corrente **non basta**: occorre pubblicare da una cronologia nuova o riscrivere e sostituire l'intera cronologia. La procedura è in [docs/PRIVACY.md](docs/PRIVACY.md).

## Licenza

Codice distribuito con licenza MIT.

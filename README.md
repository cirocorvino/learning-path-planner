# Learning Path Planner

Applicazione web **local-first** per progettare un percorso di apprendimento, stimarne la durata e distribuirne gli argomenti negli slot disponibili della settimana.

Il piano viene mostrato su un diagramma di Gantt e, per ogni settimana, come agenda operativa con argomenti, tempi e indisponibilità. Non richiede backend, account o servizi cloud: database e programmi sono file JSON scelti esplicitamente dall'utente.

## Funzioni principali

- moduli sequenziali, argomenti tipizzati e settimane di recupero;
- stime in minuti e moltiplicatori configurabili per teoria, pratica, esercizi e progetti;
- categorie personalizzabili con ruoli `focus`, `busy` e `neutral`;
- template settimanale con più slot per giorno;
- target settimanale e date eccezionali che riducono la capacità reale;
- Gantt calcolato sulla disponibilità effettiva e dettaglio di ogni settimana;
- apertura e salvataggio locale, con fallback tramite download JSON;
- importazione di piani;
- database predefinito configurabile, con fallback automatici e avvisi non bloccanti.

## Avvio locale

Per usare l'app senza server, aprire direttamente `index.html` con il browser. In modalità `file://` la copia di lavoro viene conservata automaticamente in IndexedDB. Al primo avvio non viene caricata alcuna DEMO: usare **Apri database** per importare un JSON oppure **Nuovo** per iniziare da un database vuoto.

I browser non consentono a una pagina `file://` di leggere automaticamente altri file dal disco. Per applicare automaticamente la catena `db-configuration.json` → `organizer-data.json` → esempio, avviare facoltativamente un server statico:

```bash
python -m http.server 3001
```

oppure:

```bash
php -S localhost:3001
```

Aprire `http://localhost:3001`. Non sono necessarie dipendenze runtime.

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
4. Usare **Salva** per esportare il database corrente come JSON. Via HTTP può essere scaricata anche la relativa configurazione.
5. Usare **Importa programma** per sostituire soltanto il percorso, conservando disponibilità e categorie.

Quando è aperta via HTTP, all'avvio l'app applica questo ordine di priorità:

1. database indicato da `data/user/db-configuration.json`;
2. `data/user/organizer-data.json`;
3. `data/examples/organizer-example.json`.

Se la configurazione manca o è vuota, l'app passa ai fallback in modo trasparente. Un percorso non valido, una configurazione non utilizzabile o un database esplicitamente indicato ma non caricabile producono invece un avviso non bloccante, seguito immediatamente dal fallback. In **Impostazioni** è possibile specificare un percorso relativo, per esempio `data/user/corso-dotnet.json`, oppure lasciare il campo vuoto per usare il database convenzionale.

In modalità `file://` questi tentativi automatici vengono evitati perché il browser li bloccherebbe. L'app cerca esclusivamente la copia IndexedDB associata a `index.html`; se manca, mostra un planner vuoto senza attivare la DEMO. **Apri database**, **Nuovo**, **Applica impostazioni** e **Aggiorna il piano** aggiornano automaticamente IndexedDB.

In `file://`, **Salva** serve soltanto a esportare un backup JSON e non è necessario per conservare le modifiche nel browser. Via HTTP scarica `organizer-data.json` quando è attivo il fallback convenzionale; per un percorso personalizzato scarica invece sia il database sia `db-configuration.json`. L'app non usa `localStorage`.

## Interfaccia

La schermata è composta da barra delle azioni, riepilogo, diagramma di Gantt e dettaglio settimanale. Le finestre **Impostazioni** e **Moduli e argomenti** permettono di personalizzare rispettivamente disponibilità e contenuti del percorso.

La guida [docs/INTERFACCIA.md](docs/INTERFACCIA.md) descrive ogni area, chiarisce la differenza tra **Apri database** e **Importa programma** e spiega cosa viene scritto usando **Salva**.

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
docs/                      interfaccia, formato dati, architettura, privacy e roadmap
```

## Formati e privacy

Il formato v2 è documentato in [docs/JSON-DATABASE.md](docs/JSON-DATABASE.md). Un piano importabile è disponibile in [data/study-program-example.json](data/study-program-example.json).

`data/user/` e `data/private/` sono esclusi da Git salvo i rispettivi README. Prima di rendere pubblico un repository che in passato ha contenuto dati personali, cancellare i file dal ramo corrente **non basta**: occorre pubblicare da una cronologia nuova o riscrivere e sostituire l'intera cronologia. La procedura è in [docs/PRIVACY.md](docs/PRIVACY.md).

## Licenza

Codice distribuito con licenza MIT.

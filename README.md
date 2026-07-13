# Personal Organizer & Study Planner

Applicazione **local-first** in HTML, CSS e JavaScript per combinare attività ricorrenti e programmi di studio in un calendario settimanale e in un diagramma di Gantt.

> Questo repository è privato perché il database predefinito contiene configurazioni personali. La futura versione pubblica verrà creata in un repository nuovo, con cronologia Git pulita e soli dati dimostrativi.

## Caratteristiche

- nessun backend e nessun database server;
- database portabile in un singolo file JSON;
- attività ricorrenti e slot di studio configurabili;
- importazione di programmi di studio JSON;
- supporto sia a moduli raggruppati sia a una lista piatta di unità;
- distribuzione automatica delle attività negli slot di studio;
- Gantt, dettaglio settimanale e modifica manuale;
- salvataggio diretto del file quando il browser lo consente;
- fallback universale tramite importazione ed esportazione JSON.

## Avvio locale

```bash
git clone https://github.com/cirocorvino/AI-Dev-scheduling-app-.git
cd AI-Dev-scheduling-app-
python -m http.server 3001
```

Aprire:

```text
http://localhost:3001
```

In alternativa:

```bash
npx http-server . -p 3001
```

L'app può essere aperta anche direttamente tramite `index.html`; in quel caso il browser potrebbe non caricare automaticamente il database predefinito. È comunque possibile usare **Apri database** e selezionare il file manualmente.

## Flusso principale

1. L'app tenta di caricare `data/organizer-data.json`.
2. **Apri database** permette di scegliere un altro file JSON.
3. **Importa programma** sostituisce il programma di studio attivo mantenendo il template settimanale.
4. Le attività vengono distribuite negli slot di tipo `study`.
5. **Salva database** aggiorna il file aperto oppure propone il salvataggio di una copia.

Il file JSON è la fonte ufficiale dei dati. `localStorage` resta presente soltanto per compatibilità con la versione precedente e non viene più caricato automaticamente.

## File principali

```text
index.html
js/
  config.js          fallback generici e costanti UI
  data.js            stato applicativo iniziale
  fileStore.js       apertura, validazione, importazione e salvataggio JSON
  calculations.js    calcolo ore e date
  courseDetail.js    dettaglio e distribuzione settimanale
  ganttChart.js      Gantt e gestione moduli
data/
  organizer-data.json          database personale predefinito
  study-program-example.json   esempio generico importabile
docs/
  JSON-DATABASE.md             formato dei file e istruzioni di importazione
COURSE-DOTNET.md                configurazione del corso corrente
```

## Programmi di studio

Un programma può contenere una struttura `courses` completa oppure una lista piatta `units`. Il formato piatto minimo è:

```json
{
  "kind": "study-program",
  "schemaVersion": 1,
  "id": "my-program",
  "title": "Il mio programma",
  "startDate": "2026-08-03",
  "weeklyTargetMinutes": 360,
  "units": [
    {
      "module": "Fondamenti",
      "order": 10,
      "title": "Prima attività - Teoria",
      "estimatedMinutes": 60
    }
  ]
}
```

Vedere [`docs/JSON-DATABASE.md`](docs/JSON-DATABASE.md) e [`data/study-program-example.json`](data/study-program-example.json).

## Privacy e backup

Il database può contenere orari, attività e piani personali. Prima di copiare codice o file in un repository pubblico:

- non copiare `data/organizer-data.json`;
- non copiare esportazioni o backup;
- usare soltanto dati fittizi;
- inizializzare una nuova cronologia Git;
- controllare README, screenshot, manifest e file JSON.

È consigliato salvare una copia del database al termine di ogni checkpoint mensile.

## Documentazione del corso

Il programma personale attuale riguarda il percorso **.NET e Architettura Applicazioni Web**. Date, carico settimanale e struttura sono descritti in [`COURSE-DOTNET.md`](COURSE-DOTNET.md).

## Licenza

MIT. La licenza riguarda il codice; i dati personali e la configurazione privata non sono materiale dimostrativo da pubblicare.

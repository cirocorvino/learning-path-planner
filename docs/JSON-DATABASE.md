# Formati JSON v2 e v3

Ogni file viene validato integralmente prima di entrare nello stato dell'app. Date e orari usano rispettivamente `YYYY-MM-DD` e `HH:MM`; durate e stime sono minuti interi positivi.

## Configurazione del database predefinito

Il file opzionale `data/user/db-configuration.json` usa uno schema separato dal database ed è consultato soltanto quando l'app è servita via HTTP:

```json
{
  "kind": "learning-planner-db-configuration",
  "schemaVersion": 1,
  "defaultDatabase": "data/user/percorso-personale.json"
}
```

`defaultDatabase` deve essere un percorso relativo alla root pubblicata dal server, non può contenere `..`, deve terminare in `.json` e non può indicare `db-configuration.json`. I percorsi assoluti del sistema operativo non sono caricabili dalla SPA. Il file indicato deve essere raggiungibile dallo stesso server dell'app.

Quando non è definito alcun database predefinito, il file resta valido senza la proprietà `defaultDatabase`:

```json
{
  "kind": "learning-planner-db-configuration",
  "schemaVersion": 1
}
```

Via HTTP, la priorità di caricamento è: database configurato, `data/user/organizer-data.json`, `data/examples/organizer-example.json`. L'ultimo viene presentato in modalità DEMO. Via `file://`, il browser non permette la lettura automatica dei file adiacenti: `db-configuration.json` viene ignorato e viene ripristinata la copia IndexedDB oppure mostrato un database vuoto. La DEMO non è incorporata nel codice dell'app.

L'assenza del file di configurazione, una configurazione vuota e il normale passaggio ai fallback non generano avvisi. Una configurazione non utilizzabile, un percorso non valido o un database indicato ma non caricabile producono un avviso non bloccante; il fallback successivo viene comunque caricato immediatamente.

Il file non viene scritto direttamente dall'app. Via HTTP è possibile impostare il percorso nelle **Impostazioni**: **Applica impostazioni** aggiorna lo stato corrente, mentre **Salva** genera `db-configuration.json` come download insieme al database personalizzato. L'utente deve copiare entrambi i file nelle posizioni previste. Con il nome convenzionale `data/user/organizer-data.json` la configurazione non viene generata perché non è necessaria.

Per il flusso completo, compresi `file://`, server e passaggio tra le modalità, vedere [GESTIONE-DATABASE.md](GESTIONE-DATABASE.md).

## Database completo

```json
{
  "kind": "learning-planner-database",
  "schemaVersion": 2,
  "metadata": {
    "id": "my-database",
    "name": "Il mio planner",
    "description": "",
    "locale": "it-IT",
    "timeZone": "Europe/Rome",
    "createdAt": "2026-07-13T00:00:00.000Z",
    "updatedAt": "2026-07-13T00:00:00.000Z"
  },
  "settings": {
    "weekStartsOn": 1,
    "planningMode": "sequential",
    "estimationMultipliers": {
      "theory": 1,
      "practice": 1,
      "exercise": 1,
      "project": 1,
      "other": 1
    },
    "calendarExceptions": [
      {
        "id": "holiday-1",
        "date": "2026-08-11",
        "label": "Indisponibile",
        "focusAvailable": false
      }
    ]
  },
  "categories": [
    {
      "id": "focus",
      "label": "Apprendimento",
      "icon": "📚",
      "color": "#2563eb",
      "role": "focus"
    }
  ],
  "weekTemplate": {
    "monday": [],
    "tuesday": [
      {
        "id": "tue-focus",
        "start": "18:30",
        "end": "20:00",
        "label": "",
        "categoryId": "focus"
      }
    ],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": []
  },
  "plan": {
    "kind": "learning-plan",
    "schemaVersion": 2,
    "id": "my-plan",
    "title": "Il mio percorso",
    "description": "",
    "startDate": "2026-08-03",
    "weeklyTargetMinutes": 300,
    "modules": []
  },
  "state": {
    "progress": {}
  }
}
```

Deve esistere almeno una categoria con ruolo `focus`. Solo gli slot collegati a queste categorie costituiscono capacità pianificabile. Gli slot `busy` e `neutral` appaiono nell'agenda ma non ricevono argomenti.

Le chiavi ammesse per `weekTemplate` sono `monday` … `sunday`. Un'eccezione con `focusAvailable: false` blocca tutti gli slot focus di quella data; il Gantt si estende se la capacità residua non basta.

## Estensione v3 per piani di rilascio

Il database v3 mantiene invariati calendario, piano e stato v2 e aggiunge l'oggetto obbligatorio `releasePlan`. I database v2 continuano a essere accettati e visualizzati senza dashboard di rilascio.

```json
{
  "kind": "learning-planner-database",
  "schemaVersion": 3,
  "metadata": {},
  "settings": {},
  "categories": [],
  "weekTemplate": {},
  "plan": {
    "kind": "learning-plan",
    "schemaVersion": 2,
    "modules": []
  },
  "state": { "progress": {} },
  "releasePlan": {
    "schemaVersion": 5,
    "sourceSnapshot": {},
    "methodology": {},
    "metricSemantics": {},
    "absoluteWeightModel": {
      "version": "absolute-functional-v1@2026-08-20",
      "visionScopeId": "known-vision",
      "scopeOrder": ["pilot-v1", "public-mvp-v1", "known-vision"]
    },
    "capacity": {
      "scheduleMode": "abstract_weekly_capacity",
      "effortUnit": "agentic_equivalent_minutes"
    },
    "actualWorkLog": {
      "version": "attested-actuals-v1",
      "entryRule": "Solo dati attestati.",
      "coverageNote": "Copertura delle task disponibili, non timesheet umano esaustivo.",
      "semantics": {},
      "sources": [],
      "outputEvidence": [],
      "entries": []
    },
    "scopes": [],
    "releaseStatus": {},
    "deliveryModel": {},
    "deliveryTotals": {},
    "scheduleScope": {},
    "workPackages": [],
    "gates": [],
    "milestones": [],
    "forecasts": [],
    "criticalPath": {},
    "risks": [],
    "changeHistory": [],
    "scopeChanges": []
  }
}
```

I formati `releasePlan` v1-v4 restano leggibili. La v2 aggiunge riepilogo, baseline e coefficienti adattivi; la v3 aggiunge la semantica esplicita delle metriche. La v4 introduce un solo `functionalWeight` per WP, membership esplicita tramite `scope.workPackageIds` e `reportedBreadthPercent`. La v5 separa capacità agentica astratta, lead time e consuntivo reale attestato.

Ogni work package dichiara stato, percentuale, risultato concreto, stato reale, lavoro residuo, owner, ultima revisione, evidenze, dipendenze ed eventuali topic del piano. Nella v4 aggiunge un solo `functionalWeight` con la relativa origine; le versioni precedenti conservano i pesi storici per-scope. `deliveryEstimate` espone profilo, natura della stima, coefficiente iniziale/applicato, confidenza, ore base/corrette e lead time esterni. Le ore dei work package con topic condivisi non sono additive: il Gantt conta ogni topic una sola volta.

`dependencyRules` assegna una semantica temporale alla dipendenza: `required_before_start`, `overlap_after_design`, `required_at_final_gate` o `required_at_paid_gate`. `criticalPath` distingue la catena primaria dai rami obbligatori che possono procedere in parallelo e convergono su un gate.

`deliveryTotals` distingue ore attive, ore già registrate, residuo netto e durata del Gantt. La durata del Gantt può essere più lunga delle settimane nette quando i moduli restano blocchi settimanali conservativi o intervengono eccezioni di calendario; `ganttRule` deve dichiararlo esplicitamente. I lead time esterni non si sommano automaticamente alla durata del Gantt.

Nella v4 ogni WP possiede un solo `functionalWeight`, indipendente da effort, durata e percentuale corrente. Gli scope differiscono soltanto per `workPackageIds` e devono essere annidati nell'ordine dichiarato da `absoluteWeightModel.scopeOrder`; lo scope Known Vision include tutti i WP. Il completamento è `somma(peso × completamento) / somma(pesi inclusi)`. L'ampiezza è `somma(pesi inclusi) / somma(pesi Known Vision)`. I valori dichiarati vengono rifiutati se divergono dai calcoli.

`functionalWeightOrigin` registra per ogni WP denominatore sorgente, peso sorgente e motivazione. La v4 rifiuta il vecchio oggetto `weights` per-scope, origini divergenti e membership non annidate. I database v1-v3 conservano invece il proprio modello storico durante la normalizzazione.

La readiness non deriva dal completamento o dall'ampiezza. Gli stati ammessi sono `ready`, `not_ready`, `partially_scheduled` e `not_assessed`. `ready` è accettato soltanto quando esiste almeno un gate applicabile e tutti i gate obbligatori dello scope sono `complete`; la validazione opera fail-closed.

Gli scope devono versionare il denominatore e indicare la fonte canonica. `changeHistory` registra le variazioni del piano; `scopeChanges` registra le modifiche di perimetro che rendono percentuali di versioni diverse non direttamente confrontabili. Gate, milestone, forecast e percorso critico sono validati rispetto agli ID dichiarati.

`capacity` distingue capacità lorda, quota pianificata e riserva. Quando deriva da limiti agentici o da altri proxy, `basis`, `officialLimitEvidence`, `empiricalBaseline` e `calibrationWindowWeeks` rendono esplicita l'assunzione e la successiva verifica. Il coefficiente non deve duplicare la riserva: il primo copre il normale costo del delivery previsto per una classe di intervento, la seconda resta capacità non allocata per variabilità e imprevisti.

Nella v5 `scheduleMode: abstract_weekly_capacity` usa `plannedWeeklyMinutes` per il Gantt macro senza creare slot di orologio; richiede `effortUnit: agentic_equivalent_minutes`. `clock_slots` e `clock_minutes` mantengono invece il comportamento basato sulla settimana tipo. Eccezioni, impegni personali e slot generici non riducono automaticamente una capacità agentica astratta.

`actualWorkLog` è indipendente da percentuali e forecast. Ogni voce dichiara ruolo/task, topic descrittivo, eventuali WP, riferimenti task/issue/PR, stato, fonte del timestamp ed evidenze output separate. I timing ammessi sono:

- `clock_interval`: `startAt`, `endAt`, `timeZone` e `actualClockElapsedSeconds`, verificati fra loro;
- `unplaced_duration`: sola `attestedDurationSeconds`, senza inventare orari;
- `open_interval`: solo `startAt` e `timeZone`, senza durata o fine finché l'attività resta aperta.

`agentEffortEquivalentMinutes` è nullable e non viene ricavato dal wall-clock. La vista calcola sia la somma dei record per task sia `dailyUnionElapsed`, che unisce gli intervalli sovrapposti della giornata. Gli eventi in `outputEvidence` documentano pubblicazione, commit o merge, ma non sostituiscono mai l'intervallo di lavoro.

## Piano importabile

**Importa piano** accetta un database completo oppure il solo oggetto `learning-plan`:

```json
{
  "kind": "learning-plan",
  "schemaVersion": 2,
  "id": "frontend-path",
  "title": "Percorso frontend",
  "description": "",
  "startDate": "2026-08-03",
  "weeklyTargetMinutes": 300,
  "modules": [
    {
      "id": "foundations",
      "title": "Fondamenti",
      "color": "#2563eb",
      "mode": "work",
      "topics": [
        {
          "id": "html-basics",
          "title": "Struttura semantica",
          "kind": "theory",
          "estimatedMinutes": 90
        }
      ]
    },
    {
      "id": "buffer",
      "title": "Recupero",
      "color": "#94a3b8",
      "mode": "buffer",
      "fixedWeeks": 1,
      "topics": []
    }
  ]
}
```

`mode` può essere `work` o `buffer`. I tipi di argomento sono `theory`, `practice`, `exercise`, `project` e `other`. Gli ID devono essere univoci e usare lettere, numeri, punto, trattino, underscore o due punti.

## Compatibilità v1

Sono riconosciuti i database `organizer-database` e i programmi `study-program` con `courses` o `units`. La migrazione converte giorni italiani, ore in minuti, corsi in moduli e attività in argomenti. Le vecchie cache `weeklySchedules` e `courseTopics` non vengono mantenute: il planner rigenera la schedulazione e segnala l'operazione. Il file originale non viene mai sovrascritto direttamente: **Salva** scarica una nuova copia JSON v2; un database di rilascio già v3 resta v3.

Gli esempi canonici sono `data/examples/organizer-example.json` e `data/study-program-example.json`.

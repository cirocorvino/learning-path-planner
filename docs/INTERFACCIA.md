# Guida dell'interfaccia

L'interfaccia di Learning Path Planner è divisa in quattro aree principali: intestazione, azioni sul database, riepilogo con Gantt e dettaglio settimanale. Due finestre di modifica permettono di configurare disponibilità e contenuti senza intervenire direttamente sul JSON.

## Intestazione e stato

L'intestazione mostra il titolo e la descrizione del percorso attivo. Sulla destra compare lo stato del database:

- `✓` indica che il database è stato appena aperto o esportato e non contiene modifiche successive;
- `●` indica che la versione corrente non è ancora stata esportata come JSON;
- eventuali errori di apertura, validazione o salvataggio vengono mostrati nello stesso spazio.

In `file://`, il pallino non segnala una perdita dell'autosalvataggio: le modifiche sono già nella copia IndexedDB. Via HTTP, invece, le modifiche restano nella pagina e il browser chiede conferma prima di chiuderla o ricaricarla.

## Caricamento automatico all'avvio

All'avvio via HTTP l'app cerca prima `data/user/db-configuration.json`. Se la proprietà `defaultDatabase` indica un file valido, quel database viene caricato con la priorità più alta. Seguono `data/user/organizer-data.json` e l'esempio fittizio `data/examples/organizer-example.json`.

Aprendo direttamente `index.html` (`file://`), l'app ripristina il database attivo da IndexedDB. Se non esiste una copia locale, mostra un planner vuoto e non carica la DEMO. Il planner è immediatamente configurabile tramite **Impostazioni** e **Moduli e argomenti**; **Apri database** permette invece di partire da un JSON esistente.

Una configurazione mancante o vuota attiva i fallback in modo trasparente. Se il file non è utilizzabile, contiene un percorso non valido oppure indica un database che non può essere caricato, l'app mostra un avviso non bloccante e apre immediatamente il fallback successivo.

Le due modalità non condividono la stessa copia di lavoro. La procedura completa per creare, spostare e mantenere un database è descritta in [GESTIONE-DATABASE.md](GESTIONE-DATABASE.md).

## Barra delle azioni

### Nuovo

Crea un database vuoto con categorie generiche e nessun modulo. Il pulsante è visibilmente disabilitato quando il piano non contiene moduli, perché l'operazione non produrrebbe alcun effetto. Quando è disponibile, chiede sempre conferma prima di sostituire il database corrente.

In `file://`, la conferma comporta anche la sostituzione della copia IndexedDB; via HTTP sostituisce soltanto lo stato in memoria finché non viene premuto **Salva**.

### Apri database

Apre un database completo e sostituisce l'intero stato corrente:

- nome e metadati;
- categorie e relativi ruoli;
- settimana tipo ed eccezioni;
- impostazioni di stima;
- programma, moduli, argomenti e progresso.

I database organizer v1 vengono migrati in memoria al formato v2. In `file://` il risultato normalizzato viene conservato in IndexedDB. In entrambe le modalità il file scelto viene soltanto letto: non resta collegato all'app e non viene modificato.

Via HTTP, aprire un file chiamato `organizer-data.json` mantiene il percorso convenzionale. Un nome diverso, per esempio `corso-dotnet.json`, prepara invece il percorso `data/user/corso-dotnet.json`; al successivo **Salva** viene scaricato anche il relativo `db-configuration.json`.

### Salva

Serializza l'intero database corrente nel formato JSON validato con cui è stato aperto, v2 oppure v3, e lo scarica. Non sovrascrive mai direttamente il file originale o un file presente nel progetto.

In modalità `file://`, esporta soltanto il database JSON: la conservazione quotidiana è già garantita dall'autosalvataggio IndexedDB. Via HTTP, se è attivo il percorso convenzionale viene scaricato soltanto `organizer-data.json`; con un percorso personalizzato vengono scaricati il database e `db-configuration.json`. I file scaricati devono poi essere copiati manualmente nelle posizioni previste.

Dopo **Importa programma**, il salvataggio registra il programma importato all'interno del database corrente.

### Importa programma

Sostituisce soltanto il percorso di apprendimento:

- titolo e descrizione;
- data iniziale e target settimanale;
- moduli e argomenti.

Categorie, settimana tipo, eccezioni e moltiplicatori restano quelli del database aperto. Il progresso precedente viene azzerato. In `file://` il risultato viene scritto subito in IndexedDB; via HTTP resta in memoria fino all'esportazione con **Salva**.

### Impostazioni

Apre l'editor del database e della disponibilità. Da qui si modificano:

- nome del database, titolo e descrizione del percorso;
- data iniziale, target settimanale, lingua e fuso orario;
- percorso relativo del database predefinito;
- coefficienti applicati alle stime dei diversi tipi di argomento;
- categorie, icone, colori e ruoli;
- attività ricorrenti e slot disponibili per ogni giorno;
- eccezioni del calendario.

Via HTTP, la sezione **Database predefinito** contiene un solo percorso relativo alla root servita, per esempio `data/user/corso-dotnet.json`. Non accetta percorsi assoluti del sistema operativo. Un percorso non valido non blocca le altre impostazioni, ripristina il fallback convenzionale e genera un avviso nella pagina.

**Applica impostazioni** aggiorna sempre il database corrente. Via HTTP modifica soltanto lo stato della pagina: il percorso viene scritto in un file reale solo quando **Salva** genera il download di `db-configuration.json`. In `file://`, il campo del percorso è disabilitato perché la configurazione HTTP non viene usata; le altre impostazioni vengono registrate automaticamente in IndexedDB. **Rimuovi database locale** elimina la copia IndexedDB dopo una conferma, senza cancellare eventuali JSON esportati.

Il successivo **Salva** scarica database e configurazione. Svuotando il campo si ripristina `data/user/organizer-data.json`: in questo caso viene scaricato soltanto il database convenzionale e non viene generato `db-configuration.json`.

Le eccezioni usano una riga per data nel formato:

```text
2026-12-25 | Festività
```

Gli slot `focus` di quella giornata vengono esclusi dal calcolo e il Gantt può allungarsi.

### Moduli e argomenti

Apre l'editor del contenuto del percorso. I moduli possono essere riordinati, eliminati o trasformati in settimane di pausa. Ogni modulo attivo contiene argomenti con titolo, tipo e stima in minuti.

L'ordine dei moduli determina l'ordine del Gantt. Un modulo `buffer` occupa un numero fisso di settimane e non contiene argomenti.

## Riepilogo

Le schede sotto la barra delle azioni mostrano:

- **Impegno totale:** somma delle stime degli argomenti dopo l'applicazione dei coefficienti;
- **Durata:** settimane necessarie includendo pause ed eventuali riduzioni di capacità;
- **Moduli:** numero di moduli attivi e buffer;
- **Capacità settimanale:** durata complessiva degli slot appartenenti a categorie `focus` nella settimana tipo;
- **Conclusione stimata:** ultimo giorno previsto dal piano.

Un avviso compare quando mancano slot focus, il target supera la capacità o una migrazione richiede attenzione.

## Dashboard di rilascio

Quando il database contiene un `releasePlan`, la dashboard separa quattro informazioni:

- **completamento nello scope:** media ponderata dei WP inclusi, usando un peso funzionale comune;
- **ampiezza della Visione:** quota dei pesi della Known Vision inclusa nello scope;
- **readiness di rilascio:** gate superati/applicabili e blocker, senza convertirli in una percentuale funzionale;
- **previsioni:** finestre di calendario e stime di delivery.

Le carte Pilot, MVP pubblico e Visione riportano completamento, ampiezza, versione del denominatore e data dello snapshot. Lo stesso WP mantiene lo stesso peso in tutti gli scope; cambia soltanto la membership. Se uno scope più ampio mostra un completamento superiore, un dettaglio espandibile elenca i WP esclusivi che contribuiscono all'aumento. La readiness rimane sempre separata.

## Diagramma di Gantt

Il Gantt rappresenta i moduli in sequenza. Ogni riga riporta nome, impegno, numero di settimane, periodo e barra temporale colorata. Nei piani di rilascio può inoltre mostrare lo **stato medio dei WP collegati**: è la media aritmetica dei WP distinti associati ai topic del modulo, con elenco dei contributori e date di revisione. Non è avanzamento temporale del modulo né forecast.

Selezionando la barra di un modulo si apre il relativo dettaglio settimanale. Le date vengono ricalcolate quando cambiano stime, target, disponibilità o eccezioni.

## Dettaglio settimanale

Il dettaglio mostra una scheda per ciascuna settimana del modulo. In alto sono riepilogati gli argomenti e i minuti assegnati; sotto appare l'agenda dei sette giorni. Nei piani di rilascio le ore pianificate restano separate dallo **stato WP oggi**. Se un topic contribuisce a più WP, il riepilogo espandibile li elenca tutti con percentuale e data dello snapshot.

Lo stato WP è corrente: la stessa percentuale può comparire in settimane diverse e future perché non cresce automaticamente con il calendario.

Ogni attività mostra:

- orario di inizio e fine;
- icona e **Nome** della categoria, per esempio `📚 Studio`;
- eventuale descrizione specifica dello slot;
- argomenti pianificati e minuti assegnati;
- eventuale **Spazio focus libero**, indicato solo per i minuti rimasti non assegnati.

Le attività con ruolo `busy` o `neutral` sono informative e non ricevono argomenti. Una giornata bloccata da un'eccezione mostra l'indisponibilità al posto delle assegnazioni.

## Ruoli delle categorie

- `focus`: fornisce tempo utilizzabile dal motore per distribuire gli argomenti;
- `busy`: rappresenta un impegno che appare nell'agenda ma non offre capacità;
- `neutral`: rappresenta un'informazione o attività non pianificabile.

Il **Nome** è l'etichetta mostrata nell'agenda; l'ID è il riferimento stabile usato dal file JSON.

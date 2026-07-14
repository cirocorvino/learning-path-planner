# Guida dell'interfaccia

L'interfaccia di Learning Path Planner è divisa in quattro aree principali: intestazione, azioni sul database, riepilogo con Gantt e dettaglio settimanale. Due finestre di modifica permettono di configurare disponibilità e contenuti senza intervenire direttamente sul JSON.

## Intestazione e stato

L'intestazione mostra il titolo e la descrizione del percorso attivo. Sulla destra compare lo stato del database:

- `✓` indica che il database è stato aperto o salvato e non contiene modifiche pendenti;
- `●` indica che esistono modifiche non ancora salvate;
- eventuali errori di apertura, validazione o salvataggio vengono mostrati nello stesso spazio.

Chiudendo o ricaricando la pagina con modifiche pendenti, il browser chiede conferma.

## Caricamento automatico all'avvio

All'avvio via HTTP l'app cerca prima `data/user/db-configuration.json`. Se la proprietà `defaultDatabase` indica un file valido, quel database viene caricato con la priorità più alta. Seguono `data/user/organizer-data.json` e l'esempio fittizio `data/examples/organizer-example.json`.

Aprendo direttamente `index.html` (`file://`), l'app ripristina il database attivo da IndexedDB. Se non esiste una copia locale, mostra un planner vuoto, non carica la DEMO e lascia **Nuovo** disabilitato. Il pulsante **Apri database** importa il JSON selezionato in IndexedDB; quando esiste un database attivo, **Nuovo** si abilita e, dopo una conferma esplicita, lo sostituisce con un database vuoto.

Una configurazione mancante o vuota attiva i fallback in modo trasparente. Se il file non è utilizzabile, contiene un percorso non valido oppure indica un database che non può essere caricato, l'app mostra un avviso non bloccante e apre immediatamente il fallback successivo.

## Barra delle azioni

### Nuovo

Crea un database vuoto con categorie generiche e nessun modulo. Se esistono modifiche non salvate, viene chiesta conferma prima di sostituire il lavoro corrente.

### Apri database

Apre un database completo e sostituisce l'intero stato corrente:

- nome e metadati;
- categorie e relativi ruoli;
- settimana tipo ed eccezioni;
- impostazioni di stima;
- programma, moduli, argomenti e progresso.

I database organizer v1 vengono migrati in memoria al formato v2. In `file://` il risultato normalizzato viene conservato in IndexedDB; il file originale non viene modificato.

### Salva

Serializza l'intero database corrente in formato JSON v2 e lo scarica senza richiedere autorizzazioni di scrittura al filesystem.

In modalità `file://`, esporta soltanto il database JSON: la conservazione quotidiana è già garantita dall'autosalvataggio IndexedDB. Via HTTP, se è attivo il percorso convenzionale viene scaricato soltanto `organizer-data.json`; con un percorso personalizzato vengono scaricati il database e `db-configuration.json`.

Dopo **Importa programma**, il salvataggio registra il programma importato all'interno del database corrente.

### Importa programma

Sostituisce soltanto il percorso di apprendimento:

- titolo e descrizione;
- data iniziale e target settimanale;
- moduli e argomenti.

Categorie, settimana tipo, eccezioni e moltiplicatori restano quelli del database aperto. Il progresso precedente viene azzerato. L'operazione resta pendente fino al successivo salvataggio.

### Impostazioni

Apre l'editor del database e della disponibilità. Da qui si modificano:

- nome del database, titolo e descrizione del percorso;
- data iniziale, target settimanale, lingua e fuso orario;
- percorso relativo del database predefinito;
- coefficienti applicati alle stime dei diversi tipi di argomento;
- categorie, icone, colori e ruoli;
- attività ricorrenti e slot disponibili per ogni giorno;
- eccezioni del calendario.

Via HTTP, la sezione **Database predefinito** contiene un solo percorso relativo, per esempio `data/user/corso-dotnet.json`. Un percorso non valido non blocca le altre impostazioni, ripristina il fallback convenzionale e genera un avviso nella pagina. In modalità `file://` il campo è disabilitato, **Applica impostazioni** aggiorna automaticamente IndexedDB e **Rimuovi database locale** elimina la copia attiva dopo una conferma.

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

## Diagramma di Gantt

Il Gantt rappresenta i moduli in sequenza. Ogni riga riporta nome, impegno, numero di settimane, periodo e barra temporale colorata.

Selezionando la barra di un modulo si apre il relativo dettaglio settimanale. Le date vengono ricalcolate quando cambiano stime, target, disponibilità o eccezioni.

## Dettaglio settimanale

Il dettaglio mostra una scheda per ciascuna settimana del modulo. In alto sono riepilogati gli argomenti e i minuti assegnati; sotto appare l'agenda dei sette giorni.

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

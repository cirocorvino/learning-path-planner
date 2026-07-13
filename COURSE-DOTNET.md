# Corso .NET e Architettura Applicazioni Web

Configurazione privata del planner per il percorso professionale .NET costruito sui quattro libri selezionati e sul capstone **ProvisioningHub**.

## Numeri del piano

- Avvio: **20 luglio 2026**
- Conclusione prevista: **31 gennaio 2027**
- Studio attivo: **24 settimane**
- Buffer e recupero: **4 settimane**
- Impegno: **11 ore settimanali**
- Ore effettive complessive: **264**

Pause programmate:

- 10-23 agosto 2026;
- 21 dicembre 2026-3 gennaio 2027.

## Settimana tipo

| Giorno | Orario | Durata | Attività di studio |
|---|---|---:|---|
| Lunedì | 20:45-21:30 | 0,75 h | Richiamo leggero dopo palestra |
| Martedì | 18:30-20:00 | 1,5 h | Lettura guidata e sintesi |
| Mercoledì | 20:45-21:30 | 0,75 h | Ripasso e domande di richiamo |
| Giovedì | 20:30-22:30 | 2 h | Laboratorio tecnico |
| Sabato | 09:00-12:00 | 3 h | Capstone e deep work |
| Sabato | 14:30-16:00 | 1,5 h | Test, refactoring e documentazione |
| Domenica | 10:30-12:00 | 1,5 h | Consolidamento e pianificazione |

Il template completo, compresi gli altri impegni ricorrenti, si trova esclusivamente nel database privato `data/organizer-data.json`.

## Avvio locale

```bash
git switch main
git pull origin main
python -m http.server 3001
```

Aprire `http://localhost:3001`.

## Database e salvataggio

All'avvio viene caricata una copia di `data/organizer-data.json` tramite HTTP. Questa copia non è automaticamente collegata al file sul disco.

Per lavorare direttamente sul file locale:

1. premere **Apri database**;
2. selezionare `data/organizer-data.json` dalla copia locale del repository;
3. apportare le modifiche;
4. premere **Salva database**.

Quando il browser non consente la scrittura diretta, **Salva database** genera una nuova copia JSON da sostituire manualmente.

## Importazione di un altro programma

Il pulsante **Importa programma** accetta un file `study-program` JSON. Il programma importato sostituisce quello visualizzato, mentre attività ricorrenti e slot settimanali restano invariati. Dopo l'importazione occorre salvare il database.

Un esempio generico è disponibile in `data/study-program-example.json`.

## Struttura del percorso

1. Baseline e impostazione
2. Modern ASP.NET Core
3. Pausa estiva e recupero
4. API production-grade
5. Application Architecture
6. Modularità e sistemi distribuiti
7. Comunicazione moderna
8. Containers e delivery
9. Cloud e operabilità I
10. Pausa natalizia e recupero
11. Cloud e operabilità II
12. Hardening e portfolio

Le singole attività indicano anche il libro principale di riferimento: **Lock**, **Marcotte**, **Price** oppure **Software Architecture**.

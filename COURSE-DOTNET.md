# Corso .NET e Architettura Applicazioni Web

Configurazione del planner per il percorso professionale .NET, costruito sui quattro libri selezionati e sul progetto capstone **ProvisioningHub**.

## Numeri del piano

- Avvio: **20 luglio 2026**
- Conclusione prevista: **31 gennaio 2027**
- Studio attivo: **24 settimane**
- Buffer e recupero: **4 settimane**
- Impegno: **11 ore settimanali**
- Ore effettive complessive: **264**

Le pause programmate sono:

- 10-23 agosto 2026
- 21 dicembre 2026-3 gennaio 2027

## Settimana tipo

| Giorno | Orario | Durata | Tipo di attività |
|---|---|---:|---|
| Lunedì | 20:45-21:30 | 0,75 h | Richiamo leggero dopo palestra |
| Martedì | 18:30-20:00 | 1,5 h | Lettura guidata e sintesi |
| Mercoledì | 20:45-21:30 | 0,75 h | Ripasso e domande di richiamo |
| Giovedì | 20:30-22:30 | 2 h | Laboratorio tecnico |
| Sabato | 09:00-12:00 | 3 h | Capstone e deep work |
| Sabato | 14:30-16:00 | 1,5 h | Test, refactoring e documentazione |
| Domenica | 10:30-12:00 | 1,5 h | Consolidamento e pianificazione |

Vincoli fissi già configurati:

- lavoro dal lunedì al venerdì, 09:00-18:00;
- palestra lunedì, mercoledì e venerdì, 18:30-20:00;
- venerdì senza sessioni di studio;
- preghiera e comunità mantenute dal template precedente.

## Avvio locale

### Primo clone

```bash
git clone https://github.com/cirocorvino/AI-Dev-scheduling-app-.git
cd AI-Dev-scheduling-app-
git switch course/dotnet-architecture-2026
python -m http.server 3001
```

Aprire nel browser:

```text
http://localhost:3001
```

La porta `3001` crea una origin distinta e impedisce ai vecchi dati salvati su `localhost:3000` di interferire con il nuovo piano.

### Repository già clonato

```bash
git fetch origin
git switch course/dotnet-architecture-2026
git pull
python -m http.server 3001
```

In alternativa, con Node.js:

```bash
npx http-server . -p 3001
```

## Primo utilizzo

1. Aprire il Gantt e verificare data iniziale, 11 ore settimanali e 28 settimane di calendario.
2. Fare clic su **Baseline e impostazione** per vedere la distribuzione della prima settimana.
3. Entrare in modalità **Modifica** solo per adattare una settimana eccezionale.
4. Salvare il piano con il nome `Corso .NET e Architettura 2026-2027`.
5. Esportare periodicamente il JSON come backup.

I dati restano nel `localStorage` del browser. L'esportazione JSON è quindi consigliata al termine di ogni checkpoint mensile.

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

I nomi dei singoli argomenti indicano anche il libro principale di riferimento: **Lock**, **Marcotte**, **Price** oppure **Software Architecture**.

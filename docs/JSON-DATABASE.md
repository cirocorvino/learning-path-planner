# Database JSON e programmi di studio

## Database organizer

Il database completo usa questo involucro:

```json
{
  "kind": "organizer-database",
  "schemaVersion": 1,
  "metadata": {},
  "settings": {},
  "categories": [],
  "weekTemplate": {},
  "studyProgram": {},
  "state": {
    "weeklySchedules": {},
    "courseTopics": {}
  }
}
```

### `categories`

```json
{
  "id": "study",
  "label": "Studio",
  "icon": "📚"
}
```

L'identificatore viene usato nel campo `type` delle sessioni settimanali.

### `weekTemplate`

```json
{
  "Lunedì": [
    {
      "time": "09:00-17:00",
      "content": "Attività ricorrente",
      "type": "work"
    },
    {
      "time": "20:00-21:30",
      "content": "",
      "type": "study"
    }
  ]
}
```

Gli intervalli di tipo `study` diventano automaticamente slot disponibili. La durata viene calcolata dal campo `time`.

## Programma con moduli raggruppati

```json
{
  "kind": "study-program",
  "schemaVersion": 1,
  "id": "dotnet-course",
  "title": "Corso .NET",
  "description": "Percorso dimostrativo",
  "startDate": "2026-08-03",
  "weeklyHours": 6,
  "courses": [
    {
      "id": 1,
      "name": "Fondamenti",
      "color": "#5B8FF9",
      "modules": [
        {
          "name": "Hosting model - Teoria",
          "time": 2
        }
      ]
    }
  ]
}
```

Per una pausa di calendario:

```json
{
  "id": 2,
  "name": "Pausa",
  "color": "#A0A7B4",
  "fixedWeeks": 1,
  "isBuffer": true,
  "modules": []
}
```

## Programma in formato piatto

È il formato più semplice da generare o convertire da un foglio di calcolo:

```json
{
  "kind": "study-program",
  "schemaVersion": 1,
  "id": "web-study",
  "title": "Sviluppo web",
  "startDate": "2026-08-03",
  "weeklyTargetMinutes": 360,
  "units": [
    {
      "module": "Fondamenti",
      "order": 10,
      "title": "Introduzione - Teoria",
      "estimatedMinutes": 60
    },
    {
      "module": "Fondamenti",
      "order": 20,
      "title": "Primo laboratorio - Pratica",
      "estimatedMinutes": 120
    }
  ]
}
```

Sono accettati anche `hours`, `estimatedHours` oppure `time` al posto di `estimatedMinutes`.

## Regole di importazione

- `kind` deve essere `study-program`;
- `schemaVersion` corrente: `1`;
- deve essere presente `courses` oppure `units`;
- ogni attività deve avere `name` o `title`;
- la durata deve essere un numero non negativo;
- l'importazione azzera il dettaglio settimanale generato per il programma precedente;
- attività ricorrenti, categorie e slot di studio restano invariati;
- il database deve essere salvato dopo l'importazione.

## Backup

Il file JSON è autosufficiente. Per un backup è sufficiente copiarlo con una data nel nome, per esempio:

```text
organizer-data-2026-08-31.json
```

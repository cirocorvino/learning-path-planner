// config.js - Configurazione generica caricata dal database JSON

// Questi valori sono fallback neutri. La configurazione reale viene caricata
// da data/organizer-data.json oppure da un file scelto dall'utente.
let activityIcons = {
    study: '📚',
    work: '💼',
    fitness: '🏋️',
    personal: '📌',
    other: '📌'
};

let activityLabels = {
    study: 'Studio',
    work: 'Lavoro',
    fitness: 'Fitness',
    personal: 'Personale',
    other: 'Altro'
};

let weekTemplate = {
    'Lunedì': [],
    'Martedì': [],
    'Mercoledì': [],
    'Giovedì': [],
    'Venerdì': [],
    'Sabato': [],
    'Domenica': []
};

// Mappa derivata dagli slot di tipo "study" presenti nel template settimanale.
let studySchedule = {};

// Le ore dei moduli sono già stime effettive; i moltiplicatori restano
// configurabili per compatibilità con il motore esistente.
let calculationParams = {
    theoryMultiplier: 1,
    practiceMultiplier: 1,
    exerciseHours: 3,
    projectHours: 8
};

const monthNames = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const monthNamesFull = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

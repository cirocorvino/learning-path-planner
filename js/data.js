// data.js - Stato applicativo iniziale

// Il curriculum e i corsi vengono popolati da FileStore a partire dal file JSON.
let curriculum = {};
let courses = [];

let weeklySchedules = {};
let courseTopics = {};
let editMode = false;
let selectedCourse = null;
let selectedWeek = 0;
let weeklyHours = 10;
let globalStartDate = new Date().toISOString().split('T')[0];
let currentPlanId = null;
let currentPlanName = 'Nuovo programma di studio';
let currentPlanDescription = 'Apri un database JSON oppure importa un programma di studio';
let planToDeleteId = null;

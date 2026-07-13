// Test Node senza dipendenze per il database JSON e l'importatore.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    Map,
    Set,
    Blob: class Blob {},
    URL: {
        createObjectURL: () => 'blob:test',
        revokeObjectURL: () => {}
    },
    alert: () => {},
    confirm: () => true,
    fetch: async () => {
        throw new Error('fetch non usato in questo test');
    },
    Logger: {
        error: () => {},
        debug: () => {},
        load: () => {}
    },
    document: {
        getElementById: () => null,
        createElement: () => ({ click() {} })
    }
};
context.window = context;
vm.createContext(context);

for (const relativePath of ['js/config.js', 'js/data.js', 'js/fileStore.js']) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
}

const database = JSON.parse(
    fs.readFileSync(path.join(root, 'data/organizer-data.json'), 'utf8')
);
context.FileStore.applyDatabase(database, { refresh: false });

const initialState = vm.runInContext(`({
    courseCount: courses.length,
    curriculumCount: Object.keys(curriculum).length,
    weeklyHours,
    startDate: globalStartDate,
    studyHours: Object.values(studySchedule)
        .reduce((total, day) => total + day.sessions
            .reduce((subtotal, session) => subtotal + session.hours, 0), 0)
})`, context);

if (initialState.courseCount !== 12) {
    throw new Error(`Attesi 12 moduli, trovati ${initialState.courseCount}.`);
}
if (initialState.curriculumCount !== 12) {
    throw new Error(`Curriculum incoerente: ${initialState.curriculumCount}.`);
}
if (initialState.weeklyHours !== 11 || Math.abs(initialState.studyHours - 11) > 0.0001) {
    throw new Error(`Ore settimanali incoerenti: ${JSON.stringify(initialState)}.`);
}
if (initialState.startDate !== '2026-07-20') {
    throw new Error(`Data iniziale inattesa: ${initialState.startDate}.`);
}

const snapshot = context.FileStore.buildDatabaseSnapshot();
const totalHours = snapshot.studyProgram.courses
    .flatMap(course => course.modules)
    .reduce((total, module) => total + module.time, 0);

if (totalHours !== 264) {
    throw new Error(`Attese 264 ore, trovate ${totalHours}.`);
}

const exampleProgram = JSON.parse(
    fs.readFileSync(path.join(root, 'data/study-program-example.json'), 'utf8')
);

context.FileStore.importStudyProgramPayload(exampleProgram, 'study-program-example.json')
    .then(() => {
        const imported = context.FileStore.buildDatabaseSnapshot();
        if (imported.studyProgram.courses.length !== 2) {
            throw new Error('Il formato piatto non è stato raggruppato in due moduli.');
        }

        const importedHours = imported.studyProgram.courses
            .flatMap(course => course.modules)
            .reduce((total, module) => total + module.time, 0);

        if (importedHours !== 8) {
            throw new Error(`Attese 8 ore nel programma di esempio, trovate ${importedHours}.`);
        }

        console.log('✓ Test database JSON superati');
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });

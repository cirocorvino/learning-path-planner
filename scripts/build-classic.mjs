import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'js/app.bundle.js');

const modules = [
    {
        name: 'modelApi',
        file: 'js/model.js',
        prelude: '',
        exports: [
            'DATABASE_KIND',
            'PLAN_KIND',
            'SCHEMA_VERSION',
            'DAY_KEYS',
            'TOPIC_KINDS',
            'CATEGORY_ROLES',
            'MODULE_MODES',
            'createId',
            'createEmptyWeekTemplate',
            'createEmptyDatabase',
            'databaseHasContent',
            'normalizeDatabase',
            'normalizePlanInput',
            'updateDatabase',
            'snapshotDatabase',
            'replacePlan'
        ]
    },
    {
        name: 'plannerApi',
        file: 'js/planner.js',
        prelude: 'const { DAY_KEYS, TOPIC_KINDS } = modelApi;',
        exports: [
            'parseIsoDate',
            'toIsoDate',
            'addDays',
            'daysBetween',
            'getTimelineMonths',
            'minutesBetween',
            'effectiveTopicMinutes',
            'moduleEffectiveMinutes',
            'getWeeklyCapacity',
            'getWeekTemplateForStart',
            'getWeekCapacity',
            'buildPlanSchedule',
            'getModuleWeekAllocations',
            'getWeekAgenda',
            'formatDuration',
            'formatDate',
            'formatDayName'
        ]
    },
    {
        name: 'configurationApi',
        file: 'js/db-configuration.js',
        prelude: '',
        exports: [
            'DATABASE_CONFIGURATION_KIND',
            'DATABASE_CONFIGURATION_VERSION',
            'DATABASE_CONFIGURATION_FILE',
            'DATABASE_CONFIGURATION_URL',
            'DEFAULT_DATABASE_PATH',
            'normalizeDatabasePath',
            'emptyDatabaseConfiguration',
            'createDatabaseConfiguration',
            'normalizeDatabaseConfiguration',
            'databaseUrlFromConfiguration',
            'databaseFileNameFromPath'
        ]
    },
    {
        name: 'localDatabaseApi',
        file: 'js/local-database.js',
        prelude: '',
        exports: [
            'LOCAL_DATABASE_NAME',
            'LOCAL_DATABASE_VERSION',
            'LOCAL_DATABASE_STORE',
            'LOCAL_DATABASE_KEY',
            'LOCAL_DATABASE_KIND',
            'LOCAL_DATABASE_SCHEMA_VERSION',
            'isDirectFileMode',
            'createLocalDatabaseRecord',
            'normalizeLocalDatabaseRecord',
            'IndexedDbDatabaseCache'
        ]
    },
    {
        name: 'storeApi',
        file: 'js/store.js',
        prelude: [
            'const { createEmptyDatabase, normalizeDatabase, replacePlan, snapshotDatabase, updateDatabase } = modelApi;',
            'const { DATABASE_CONFIGURATION_FILE, DATABASE_CONFIGURATION_URL, DEFAULT_DATABASE_PATH, createDatabaseConfiguration, databaseFileNameFromPath, databaseUrlFromConfiguration, emptyDatabaseConfiguration, normalizeDatabaseConfiguration } = configurationApi;',
            'const { IndexedDbDatabaseCache, createLocalDatabaseRecord, isDirectFileMode, normalizeLocalDatabaseRecord } = localDatabaseApi;'
        ].join('\n'),
        exports: ['PlannerStore', 'plannerStore']
    },
    {
        name: null,
        file: 'js/app.js',
        prelude: [
            'const { CATEGORY_ROLES, DAY_KEYS, MODULE_MODES, TOPIC_KINDS, createId, databaseHasContent } = modelApi;',
            'const { buildPlanSchedule, daysBetween, formatDate, formatDayName, formatDuration, getModuleWeekAllocations, getTimelineMonths, getWeekAgenda } = plannerApi;',
            'const { normalizeDatabasePath } = configurationApi;',
            'const { plannerStore } = storeApi;'
        ].join('\n'),
        exports: []
    }
];

function removeModuleSyntax(source) {
    return source
        .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\r?\n/gm, '')
        .replace(/^export\s+/gm, '')
        .trim();
}

function indent(value, spaces = 4) {
    const padding = ' '.repeat(spaces);
    return value.split('\n').map(line => line ? `${padding}${line}` : '').join('\n');
}

async function buildBundle() {
    const sections = [
        '/* File generato da scripts/build-classic.mjs. Non modificare direttamente. */',
        '(() => {',
        "    'use strict';"
    ];

    for (const module of modules) {
        const source = removeModuleSyntax(await readFile(resolve(root, module.file), 'utf8'));
        sections.push('');

        if (module.name) {
            sections.push(`    const ${module.name} = (() => {`);
            if (module.prelude) sections.push(indent(module.prelude, 8), '');
            sections.push(indent(source, 8));
            sections.push('', `        return { ${module.exports.join(', ')} };`, '    })();');
        } else {
            sections.push('    (() => {');
            if (module.prelude) sections.push(indent(module.prelude, 8), '');
            sections.push(indent(source, 8));
            sections.push('    })();');
        }
    }

    sections.push('})();', '');
    return sections.join('\n');
}

const output = await buildBundle();

if (process.argv.includes('--check')) {
    const current = await readFile(outputPath, 'utf8').catch(() => '');
    if (current !== output) {
        throw new Error('js/app.bundle.js non aggiornato: eseguire npm run build');
    }
} else {
    await writeFile(outputPath, output, 'utf8');
    console.log('Generato js/app.bundle.js');
}

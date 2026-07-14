import {
    CATEGORY_ROLES,
    DAY_KEYS,
    MODULE_MODES,
    TOPIC_KINDS,
    createId,
    databaseHasContent
} from './model.js';
import {
    buildPlanSchedule,
    daysBetween,
    formatDate,
    formatDayName,
    formatDuration,
    getModuleWeekAllocations,
    getTimelineMonths,
    getWeekAgenda
} from './planner.js';
import { normalizeDatabasePath } from './db-configuration.js';
import { plannerStore } from './store.js';

const elements = Object.fromEntries([
    'appTitle',
    'appDescription',
    'demoEyebrow',
    'databaseStatus',
    'newDatabaseButton',
    'openDatabaseButton',
    'saveDatabaseButton',
    'importPlanButton',
    'settingsButton',
    'editPlanButton',
    'databaseFileInput',
    'planFileInput',
    'totalDuration',
    'totalWeeks',
    'moduleCount',
    'weeklyCapacity',
    'endDate',
    'plannerWarnings',
    'planPeriod',
    'ganttTable',
    'ganttRows',
    'ganttEmpty',
    'weekDetail',
    'settingsDialog',
    'settingsForm',
    'databaseNameInput',
    'planTitleInput',
    'planDescriptionInput',
    'planStartDateInput',
    'weeklyTargetInput',
    'localeInput',
    'timeZoneInput',
    'databaseStorageTitle',
    'databaseStorageDescription',
    'defaultDatabasePathLabel',
    'defaultDatabasePathInput',
    'defaultDatabasePathHint',
    'clearLocalDatabaseButton',
    'multiplierEditor',
    'categoryEditor',
    'addCategoryButton',
    'weekTemplateEditor',
    'exceptionsInput',
    'settingsError',
    'planDialog',
    'planForm',
    'moduleEditor',
    'addModuleButton',
    'planError'
].map(id => [id, document.getElementById(id)]));

const KIND_LABELS = {
    theory: 'Teoria',
    practice: 'Pratica',
    exercise: 'Esercitazione',
    project: 'Progetto',
    other: 'Altro'
};

const ROLE_LABELS = {
    focus: 'Focus / pianificabile',
    busy: 'Impegno',
    neutral: 'Neutra'
};

let currentDatabase = null;
let currentSchedule = null;
let currentDatabaseConfiguration = null;
let selectedModuleId = null;
let selectedWeekIndex = 0;
let settingsDraft = null;
let planDraft = null;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createElement(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = String(options.text);
    if (options.type) node.type = options.type;
    if (options.value !== undefined) node.value = String(options.value);
    if (options.title) node.title = options.title;
    if (options.dataset) Object.assign(node.dataset, options.dataset);
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([name, value]) => {
            if (value !== null && value !== undefined) node.setAttribute(name, String(value));
        });
    }
    const childList = Array.isArray(children) ? children : [children];
    childList.filter(Boolean).forEach(child => node.append(child));
    return node;
}

function clear(node) {
    node.replaceChildren();
}

function setHidden(node, hidden) {
    node.classList.toggle('hidden', hidden);
}

function showFormError(node, error) {
    node.textContent = error?.message || String(error);
    setHidden(node, false);
}

function clearFormError(node) {
    node.textContent = '';
    setHidden(node, true);
}

function reportError(error) {
    console.error(error);
    elements.databaseStatus.textContent = error?.message || String(error);
    elements.databaseStatus.dataset.level = 'error';
}

function confirmDiscard() {
    return !plannerStore.dirty || window.confirm('Ci sono modifiche non salvate. Continuare senza salvarle?');
}

function dayLabels(locale) {
    const monday = new Date(Date.UTC(2026, 0, 5));
    return Object.fromEntries(DAY_KEYS.map((day, index) => [
        day,
        new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
            new Date(monday.getTime() + index * 86_400_000)
        )
    ]));
}

function renderStoreState(snapshot) {
    currentDatabase = snapshot.database;
    currentDatabaseConfiguration = snapshot.databaseConfiguration;
    if (!currentDatabase) return;
    currentSchedule = buildPlanSchedule(currentDatabase);

    elements.databaseStatus.textContent = `${snapshot.dirty ? '● ' : '✓ '}${snapshot.status.message}`;
    elements.databaseStatus.dataset.level = snapshot.status.level;
    setHidden(elements.demoEyebrow, !snapshot.isDemo);
    const newDatabaseDisabled = !snapshot.hasActiveDatabase || !databaseHasContent(currentDatabase);
    elements.newDatabaseButton.disabled = newDatabaseDisabled;
    elements.newDatabaseButton.title = newDatabaseDisabled ? 'Il database è già vuoto' : '';
    elements.saveDatabaseButton.disabled = false;

    renderOverview();
    renderGantt();
    renderSelectedWeek();
}

function renderOverview() {
    const locale = currentDatabase.metadata.locale;
    elements.appTitle.textContent = currentDatabase.plan.title;
    elements.appDescription.textContent = currentDatabase.plan.description
        || currentDatabase.metadata.description
        || 'Organizza moduli, argomenti e disponibilità in un percorso sostenibile.';
    document.title = `${currentDatabase.plan.title} · Learning Path Planner`;

    elements.totalDuration.textContent = formatDuration(currentSchedule.totalMinutes);
    elements.totalWeeks.textContent = `${currentSchedule.totalWeeks} sett.`;
    elements.moduleCount.textContent = String(currentSchedule.modules.length);
    elements.weeklyCapacity.textContent = formatDuration(currentSchedule.baseCapacityMinutes);
    elements.endDate.textContent = formatDate(currentSchedule.endDate, locale, { year: true });
    elements.planPeriod.textContent = `${formatDate(currentSchedule.startDate, locale, { year: true })} — ${formatDate(currentSchedule.endDate, locale, { year: true })}`;

    const warnings = [...currentSchedule.warnings, ...(plannerStore.status.warnings || [])];
    clear(elements.plannerWarnings);
    setHidden(elements.plannerWarnings, warnings.length === 0);
    if (warnings.length) {
        const list = createElement('ul');
        warnings.forEach(warning => list.append(createElement('li', { text: warning })));
        elements.plannerWarnings.append(list);
    }
}

function renderGantt() {
    clear(elements.ganttRows);
    const modules = currentSchedule.modules;
    const empty = modules.length === 0;
    setHidden(elements.ganttEmpty, !empty);
    setHidden(elements.ganttTable, empty);
    if (empty) return;

    const totalDays = Math.max(1, daysBetween(currentSchedule.startDate, currentSchedule.endDate) + 1);
    const locale = currentDatabase.metadata.locale;
    const months = getTimelineMonths(currentSchedule.startDate, currentSchedule.endDate, locale);

    modules.forEach(module => {
        const row = createElement('div', {
            className: 'gantt__row',
            attributes: { role: 'row' }
        });

        const identity = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('span', { className: 'gantt__module-title', text: module.title }),
            createElement('span', {
                className: 'gantt__module-meta',
                text: module.mode === 'buffer' ? 'Pausa / buffer' : `${module.topics.length} argomenti`
            })
        ]);

        const effort = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('strong', { text: module.mode === 'buffer' ? `${module.weeks} sett.` : formatDuration(module.totalMinutes) }),
            createElement('div', {
                className: 'gantt__module-meta',
                text: `${module.weeks} ${module.weeks === 1 ? 'settimana' : 'settimane'}`
            })
        ]);

        const period = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('span', { text: formatDate(module.startDate, locale) }),
            createElement('span', { className: 'gantt__module-meta', text: ` → ${formatDate(module.endDate, locale)}` })
        ]);

        const track = createElement('div', {
            className: 'gantt__track',
            attributes: { role: 'cell' }
        });
        months.forEach(month => {
            const label = createElement('span', {
                className: 'gantt__month-label',
                text: month.displayLabel,
                attributes: { 'aria-hidden': 'true' }
            });
            label.style.left = `${month.offsetDays / totalDays * 100}%`;
            label.style.width = `${month.durationDays / totalDays * 100}%`;
            track.append(label);
        });
        months.slice(1).forEach(month => {
            const line = createElement('span', {
                className: 'gantt__month-line',
                attributes: { 'aria-hidden': 'true' }
            });
            line.style.left = `${month.offsetDays / totalDays * 100}%`;
            track.append(line);
        });
        if (module.weeks > 0) {
            const left = daysBetween(currentSchedule.startDate, module.startDate) / totalDays * 100;
            const width = (daysBetween(module.startDate, module.endDate) + 1) / totalDays * 100;
            const bar = createElement('button', {
                className: 'gantt__bar',
                type: 'button',
                title: `Apri ${module.title}`,
                attributes: {
                    'aria-label': `Apri il dettaglio settimanale di ${module.title}`
                }
            });
            bar.style.left = `${left}%`;
            bar.style.width = `${Math.max(width, 1.2)}%`;
            bar.style.background = module.color;
            bar.addEventListener('click', () => {
                selectedModuleId = module.id;
                selectedWeekIndex = 0;
                renderSelectedWeek();
                elements.weekDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            track.append(bar);
        }

        row.append(identity, effort, period, track);
        elements.ganttRows.append(row);
    });
}

function renderSelectedWeek() {
    clear(elements.weekDetail);
    if (!selectedModuleId) {
        setHidden(elements.weekDetail, true);
        return;
    }

    const module = currentSchedule.modules.find(item => item.id === selectedModuleId);
    if (!module || module.weeks === 0) {
        selectedModuleId = null;
        setHidden(elements.weekDetail, true);
        return;
    }
    selectedWeekIndex = Math.min(selectedWeekIndex, module.weeks - 1);
    const agenda = getWeekAgenda(currentDatabase, selectedModuleId, selectedWeekIndex);
    const locale = currentDatabase.metadata.locale;

    const heading = createElement('div', { className: 'section-heading' }, [
        createElement('div', {}, [
            createElement('span', { className: 'eyebrow eyebrow--dark', text: `Settimana ${agenda.weekNumber} di ${module.weeks}` }),
            createElement('h2', { text: module.title }),
            createElement('p', {
                className: 'muted',
                text: `${formatDate(agenda.weekStart, locale, { year: true })} — ${formatDate(agenda.weekEnd, locale, { year: true })}`
            })
        ]),
        createElement('button', {
            className: 'icon-button',
            type: 'button',
            text: '×',
            attributes: { 'aria-label': 'Chiudi dettaglio' }
        })
    ]);
    heading.querySelector('button').addEventListener('click', () => {
        selectedModuleId = null;
        renderSelectedWeek();
    });

    const tabs = createElement('div', { className: 'week-tabs', attributes: { 'aria-label': 'Settimane del modulo' } });
    for (let index = 0; index < module.weeks; index += 1) {
        const weekStart = new Date(Date.UTC(
            Number(module.startDate.slice(0, 4)),
            Number(module.startDate.slice(5, 7)) - 1,
            Number(module.startDate.slice(8, 10)) + index * 7
        ));
        const button = createElement('button', {
            className: 'week-tab',
            type: 'button',
            text: `${index + 1} · ${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(weekStart)}`,
            attributes: { 'aria-pressed': index === selectedWeekIndex }
        });
        button.addEventListener('click', () => {
            selectedWeekIndex = index;
            renderSelectedWeek();
        });
        tabs.append(button);
    }

    const allocations = createElement('div', { className: 'allocation-list' });
    if (module.mode === 'buffer') {
        allocations.append(createElement('span', { className: 'allocation-pill', text: 'Settimana di recupero e consolidamento' }));
    } else if (agenda.allocations.length === 0) {
        allocations.append(createElement('span', { className: 'allocation-pill', text: 'Nessuna attività pianificata' }));
    } else {
        agenda.allocations.forEach(allocation => {
            allocations.append(createElement('span', {
                className: 'allocation-pill',
                text: `${allocation.title} · ${formatDuration(allocation.minutes)}`
            }));
        });
    }

    const agendaGrid = createElement('div', { className: 'agenda' });
    agenda.days.forEach(day => {
        const dayCard = createElement('article', { className: 'agenda-day' }, [
            createElement('h3', { text: formatDayName(day.date, locale) })
        ]);
        if (day.sessions.length === 0) {
            dayCard.append(createElement('p', { className: 'muted', text: 'Nessuna attività ricorrente.' }));
        }
        day.sessions.forEach(session => {
            const sessionNode = createElement('div', {
                className: `session${session.blocked ? ' session--blocked' : ''}`
            });
            sessionNode.style.setProperty('--session-color', session.category?.color || '#64748b');
            sessionNode.append(createElement('div', {
                className: 'session__time',
                text: `${session.start}–${session.end}`
            }));

            const content = createElement('div');
            const title = session.blocked
                ? `⛔ ${session.exceptionLabel}`
                : session.buffer
                    ? '↻ Recupero / pausa'
                    : `${session.category?.icon || '📌'} ${session.category?.label || 'Attività'}`;
            content.append(createElement('div', { className: 'session__title', text: title }));
            if (session.label && !session.blocked && !session.buffer) {
                content.append(createElement('div', {
                    className: 'session__description',
                    text: session.label
                }));
            }
            if (session.assignments?.length) {
                const list = createElement('ul', { className: 'session__assignments' });
                session.assignments.forEach(assignment => {
                    list.append(createElement('li', {
                        text: `${assignment.title} · ${formatDuration(assignment.minutes)}`
                    }));
                });
                content.append(list);
            }
            if (session.isFocus && !session.blocked && !session.buffer && session.freeMinutes > 0) {
                content.append(createElement('div', {
                    className: 'session__free',
                    text: `Spazio focus libero · ${formatDuration(session.freeMinutes)}`
                }));
            }
            sessionNode.append(content);
            dayCard.append(sessionNode);
        });
        agendaGrid.append(dayCard);
    });

    elements.weekDetail.append(heading, tabs, allocations, agendaGrid);
    setHidden(elements.weekDetail, false);
}

function createInputLabel(labelText, input) {
    return createElement('label', {}, [document.createTextNode(labelText), input]);
}

function option(value, label, selectedValue) {
    const node = createElement('option', { text: label, value });
    node.selected = value === selectedValue;
    return node;
}

function openSettingsDialog() {
    settingsDraft = clone(currentDatabase);
    clearFormError(elements.settingsError);
    const isDirectFileMode = globalThis.location?.protocol === 'file:';
    elements.databaseNameInput.value = settingsDraft.metadata.name;
    elements.planTitleInput.value = settingsDraft.plan.title;
    elements.planDescriptionInput.value = settingsDraft.plan.description;
    elements.planStartDateInput.value = settingsDraft.plan.startDate;
    elements.weeklyTargetInput.value = settingsDraft.plan.weeklyTargetMinutes
        ? String(settingsDraft.plan.weeklyTargetMinutes / 60)
        : '';
    elements.localeInput.value = settingsDraft.metadata.locale;
    elements.timeZoneInput.value = settingsDraft.metadata.timeZone;
    elements.defaultDatabasePathInput.value = currentDatabaseConfiguration?.defaultDatabase || '';
    elements.defaultDatabasePathInput.disabled = isDirectFileMode;
    elements.defaultDatabasePathLabel.classList.toggle('field-disabled', isDirectFileMode);
    elements.databaseStorageTitle.textContent = isDirectFileMode ? 'Database locale' : 'Database predefinito';
    elements.databaseStorageDescription.textContent = isDirectFileMode
        ? 'La copia di lavoro viene salvata automaticamente in IndexedDB.'
        : 'Indica il percorso relativo da scrivere in db-configuration.json.';
    elements.defaultDatabasePathHint.textContent = isDirectFileMode
        ? 'Apri database importa un JSON nella copia locale. Salva esporta un backup JSON, ma non è necessario per conservare le modifiche nel browser.'
        : 'Lascia vuoto per usare il fallback convenzionale data/user/organizer-data.json. Il file di configurazione viene scaricato soltanto premendo Salva.';
    setHidden(elements.clearLocalDatabaseButton, !isDirectFileMode);
    elements.exceptionsInput.value = settingsDraft.settings.calendarExceptions
        .map(exception => `${exception.date} | ${exception.label}`)
        .join('\n');
    renderMultiplierEditor();
    renderCategoryEditor();
    renderWeekTemplateEditor();
    elements.settingsDialog.showModal();
}

function renderMultiplierEditor() {
    clear(elements.multiplierEditor);
    TOPIC_KINDS.forEach(kind => {
        const input = createElement('input', {
            type: 'number',
            value: settingsDraft.settings.estimationMultipliers[kind],
            attributes: { min: '0.1', step: '0.1' }
        });
        input.addEventListener('input', () => {
            settingsDraft.settings.estimationMultipliers[kind] = Number(input.value);
        });
        elements.multiplierEditor.append(createInputLabel(KIND_LABELS[kind], input));
    });
}

function renderCategoryEditor() {
    clear(elements.categoryEditor);
    settingsDraft.categories.forEach((category, index) => {
        const idInput = createElement('input', { value: category.id, attributes: { 'aria-label': 'ID categoria' } });
        const labelInput = createElement('input', { value: category.label, attributes: { 'aria-label': 'Nome categoria' } });
        const iconInput = createElement('input', { value: category.icon, className: 'compact', attributes: { 'aria-label': 'Icona categoria', maxlength: '16' } });
        const colorInput = createElement('input', { type: 'color', value: category.color, className: 'compact', attributes: { 'aria-label': 'Colore categoria' } });
        const roleSelect = createElement('select', { attributes: { 'aria-label': 'Ruolo categoria' } });
        CATEGORY_ROLES.forEach(role => roleSelect.append(option(role, ROLE_LABELS[role], category.role)));
        const remove = createElement('button', {
            className: 'icon-button',
            type: 'button',
            text: '×',
            attributes: { 'aria-label': `Elimina ${category.label}` }
        });

        idInput.addEventListener('change', () => {
            const previous = category.id;
            category.id = idInput.value.trim();
            DAY_KEYS.forEach(day => settingsDraft.weekTemplate[day].forEach(session => {
                if (session.categoryId === previous) session.categoryId = category.id;
            }));
            renderWeekTemplateEditor();
        });
        labelInput.addEventListener('input', () => { category.label = labelInput.value; });
        iconInput.addEventListener('input', () => { category.icon = iconInput.value; });
        colorInput.addEventListener('input', () => { category.color = colorInput.value; });
        roleSelect.addEventListener('change', () => { category.role = roleSelect.value; });
        remove.addEventListener('click', () => {
            if (settingsDraft.categories.length === 1) return;
            settingsDraft.categories.splice(index, 1);
            const fallbackId = settingsDraft.categories[0].id;
            DAY_KEYS.forEach(day => settingsDraft.weekTemplate[day].forEach(session => {
                if (session.categoryId === category.id) session.categoryId = fallbackId;
            }));
            renderCategoryEditor();
            renderWeekTemplateEditor();
        });

        elements.categoryEditor.append(createElement('div', { className: 'editor-row' }, [
            createInputLabel('ID', idInput),
            createInputLabel('Nome', labelInput),
            createInputLabel('Icona', iconInput),
            createInputLabel('Colore', colorInput),
            createInputLabel('Ruolo', roleSelect),
            remove
        ]));
    });
}

function renderWeekTemplateEditor() {
    clear(elements.weekTemplateEditor);
    const labels = dayLabels(settingsDraft.metadata.locale || 'it-IT');

    DAY_KEYS.forEach(day => {
        const sessionContainer = createElement('div');
        settingsDraft.weekTemplate[day].forEach((session, sessionIndex) => {
            const start = createElement('input', { type: 'time', value: session.start, attributes: { 'aria-label': 'Inizio' } });
            const end = createElement('input', { type: 'time', value: session.end, attributes: { 'aria-label': 'Fine' } });
            const label = createElement('input', { value: session.label, attributes: { 'aria-label': 'Descrizione', placeholder: 'Descrizione' } });
            const category = createElement('select', { attributes: { 'aria-label': 'Categoria' } });
            settingsDraft.categories.forEach(item => category.append(option(item.id, `${item.icon} ${item.label}`, session.categoryId)));
            const remove = createElement('button', {
                className: 'icon-button',
                type: 'button',
                text: '×',
                attributes: { 'aria-label': 'Elimina slot' }
            });
            start.addEventListener('input', () => { session.start = start.value; });
            end.addEventListener('input', () => { session.end = end.value; });
            label.addEventListener('input', () => { session.label = label.value; });
            category.addEventListener('change', () => { session.categoryId = category.value; });
            remove.addEventListener('click', () => {
                settingsDraft.weekTemplate[day].splice(sessionIndex, 1);
                renderWeekTemplateEditor();
            });
            sessionContainer.append(createElement('div', { className: 'slot-row' }, [start, end, label, category, remove]));
        });

        const add = createElement('button', {
            className: 'button button--small button--ghost',
            type: 'button',
            text: 'Aggiungi slot'
        });
        add.addEventListener('click', () => {
            settingsDraft.weekTemplate[day].push({
                id: createId('slot'),
                start: '18:00',
                end: '19:00',
                label: '',
                categoryId: settingsDraft.categories[0]?.id || 'focus'
            });
            renderWeekTemplateEditor();
        });

        elements.weekTemplateEditor.append(createElement('section', { className: 'week-editor__day' }, [
            createElement('div', { className: 'week-editor__day-header' }, [
                createElement('h3', { text: labels[day] }),
                add
            ]),
            sessionContainer
        ]));
    });
}

function parseExceptions(value) {
    return String(value || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, index) => {
            const [date, ...labelParts] = line.split('|');
            return {
                id: `exception-${index + 1}-${date.trim()}`,
                date: date.trim(),
                label: labelParts.join('|').trim() || 'Indisponibile',
                focusAvailable: false
            };
        });
}

async function applySettings(event) {
    event.preventDefault();
    clearFormError(elements.settingsError);
    try {
        settingsDraft.metadata.name = elements.databaseNameInput.value;
        settingsDraft.metadata.locale = elements.localeInput.value;
        settingsDraft.metadata.timeZone = elements.timeZoneInput.value;
        settingsDraft.plan.title = elements.planTitleInput.value;
        settingsDraft.plan.description = elements.planDescriptionInput.value;
        settingsDraft.plan.startDate = elements.planStartDateInput.value;
        settingsDraft.plan.weeklyTargetMinutes = elements.weeklyTargetInput.value
            ? Math.round(Number(elements.weeklyTargetInput.value) * 60)
            : null;
        settingsDraft.settings.calendarExceptions = parseExceptions(elements.exceptionsInput.value);

        const isDirectFileMode = globalThis.location?.protocol === 'file:';
        const currentDefaultDatabase = currentDatabaseConfiguration?.defaultDatabase || '';
        const nextDefaultDatabase = isDirectFileMode
            ? currentDefaultDatabase
            : elements.defaultDatabasePathInput.value.trim();
        let databaseConfigurationError = null;
        if (!isDirectFileMode && nextDefaultDatabase) {
            try {
                normalizeDatabasePath(nextDefaultDatabase);
            } catch (error) {
                databaseConfigurationError = error;
            }
        }

        plannerStore.update(draft => {
            draft.metadata = settingsDraft.metadata;
            draft.settings = settingsDraft.settings;
            draft.categories = settingsDraft.categories;
            draft.weekTemplate = settingsDraft.weekTemplate;
            draft.plan.title = settingsDraft.plan.title;
            draft.plan.description = settingsDraft.plan.description;
            draft.plan.startDate = settingsDraft.plan.startDate;
            draft.plan.weeklyTargetMinutes = settingsDraft.plan.weeklyTargetMinutes;
        }, 'Impostazioni aggiornate');
        if (databaseConfigurationError) {
            plannerStore.useConventionalDatabaseFallback(databaseConfigurationError);
        } else if (!isDirectFileMode && nextDefaultDatabase !== currentDefaultDatabase) {
            plannerStore.setDefaultDatabaseConfiguration(nextDefaultDatabase);
        }
        elements.settingsDialog.close();
    } catch (error) {
        showFormError(elements.settingsError, error);
    }
}

function openPlanDialog() {
    planDraft = clone(currentDatabase.plan);
    clearFormError(elements.planError);
    renderModuleEditor();
    elements.planDialog.showModal();
}

function renderModuleEditor() {
    clear(elements.moduleEditor);
    planDraft.modules.forEach((module, moduleIndex) => {
        const title = createElement('input', { value: module.title, attributes: { 'aria-label': 'Titolo modulo' } });
        const color = createElement('input', { type: 'color', value: module.color, attributes: { 'aria-label': 'Colore modulo' } });
        const mode = createElement('select', { attributes: { 'aria-label': 'Tipo modulo' } });
        MODULE_MODES.forEach(value => mode.append(option(value, value === 'work' ? 'Attivo' : 'Pausa / buffer', module.mode)));
        const fixedWeeks = createElement('input', {
            type: 'number',
            value: module.fixedWeeks || 1,
            attributes: { min: '1', step: '1', 'aria-label': 'Settimane fisse' }
        });
        fixedWeeks.disabled = module.mode !== 'buffer';
        title.addEventListener('input', () => { module.title = title.value; });
        color.addEventListener('input', () => { module.color = color.value; });
        mode.addEventListener('change', () => {
            module.mode = mode.value;
            if (module.mode === 'buffer') {
                module.fixedWeeks = module.fixedWeeks || 1;
                module.topics = [];
            } else {
                delete module.fixedWeeks;
            }
            renderModuleEditor();
        });
        fixedWeeks.addEventListener('input', () => { module.fixedWeeks = Number(fixedWeeks.value); });

        const moveUp = createElement('button', { className: 'button button--small button--ghost', type: 'button', text: '↑', attributes: { 'aria-label': 'Sposta su' } });
        const moveDown = createElement('button', { className: 'button button--small button--ghost', type: 'button', text: '↓', attributes: { 'aria-label': 'Sposta giù' } });
        const removeModule = createElement('button', { className: 'button button--small button--danger', type: 'button', text: 'Elimina' });
        moveUp.disabled = moduleIndex === 0;
        moveDown.disabled = moduleIndex === planDraft.modules.length - 1;
        moveUp.addEventListener('click', () => {
            [planDraft.modules[moduleIndex - 1], planDraft.modules[moduleIndex]] = [module, planDraft.modules[moduleIndex - 1]];
            renderModuleEditor();
        });
        moveDown.addEventListener('click', () => {
            [planDraft.modules[moduleIndex + 1], planDraft.modules[moduleIndex]] = [module, planDraft.modules[moduleIndex + 1]];
            renderModuleEditor();
        });
        removeModule.addEventListener('click', () => {
            planDraft.modules.splice(moduleIndex, 1);
            renderModuleEditor();
        });

        const topicList = createElement('div', { className: 'topic-list' });
        if (module.mode === 'work') {
            module.topics.forEach((topic, topicIndex) => {
                const topicTitle = createElement('input', { value: topic.title, attributes: { 'aria-label': 'Titolo argomento' } });
                const kind = createElement('select', { attributes: { 'aria-label': 'Tipo argomento' } });
                TOPIC_KINDS.forEach(value => kind.append(option(value, KIND_LABELS[value], topic.kind)));
                const minutes = createElement('input', {
                    type: 'number',
                    value: topic.estimatedMinutes,
                    attributes: { min: '1', step: '15', 'aria-label': 'Minuti stimati' }
                });
                const removeTopic = createElement('button', {
                    className: 'icon-button',
                    type: 'button',
                    text: '×',
                    attributes: { 'aria-label': `Elimina ${topic.title}` }
                });
                topicTitle.addEventListener('input', () => { topic.title = topicTitle.value; });
                kind.addEventListener('change', () => { topic.kind = kind.value; });
                minutes.addEventListener('input', () => { topic.estimatedMinutes = Number(minutes.value); });
                removeTopic.addEventListener('click', () => {
                    module.topics.splice(topicIndex, 1);
                    renderModuleEditor();
                });
                topicList.append(createElement('div', { className: 'topic-row' }, [
                    createElement('div', { className: 'topic-row__title' }, [createInputLabel('Argomento', topicTitle)]),
                    createElement('div', { className: 'topic-row__kind' }, [createInputLabel('Tipo', kind)]),
                    createElement('div', { className: 'topic-row__minutes' }, [createInputLabel('Minuti', minutes)]),
                    removeTopic
                ]));
            });
        }

        const addTopic = createElement('button', {
            className: 'button button--small button--secondary',
            type: 'button',
            text: 'Aggiungi argomento'
        });
        addTopic.disabled = module.mode === 'buffer';
        addTopic.addEventListener('click', () => {
            module.topics.push({
                id: createId('topic'),
                title: 'Nuovo argomento',
                kind: 'other',
                estimatedMinutes: 60
            });
            renderModuleEditor();
        });

        const fields = createElement('div', { className: 'module-card__fields' }, [
            createInputLabel('Titolo', title),
            createInputLabel('Colore', color),
            createInputLabel('Tipo', mode),
            createInputLabel('Settimane', fixedWeeks)
        ]);
        const actions = createElement('div', { className: 'module-card__actions' }, [moveUp, moveDown, removeModule]);
        elements.moduleEditor.append(createElement('section', { className: 'module-card' }, [
            createElement('div', { className: 'module-card__header' }, [fields, actions]),
            topicList,
            addTopic
        ]));
    });
}

function applyPlan(event) {
    event.preventDefault();
    clearFormError(elements.planError);
    try {
        plannerStore.update(draft => {
            draft.plan = planDraft;
            draft.state.progress = {};
        }, 'Piano aggiornato');
        selectedModuleId = null;
        elements.planDialog.close();
    } catch (error) {
        showFormError(elements.planError, error);
    }
}

function bindEvents() {
    elements.newDatabaseButton.addEventListener('click', () => {
        const message = plannerStore.usesLocalDatabase
            ? 'Creare un nuovo database? Il database locale attivo verrà sostituito. Esporta prima un JSON se vuoi conservarne una copia.'
            : 'Creare un nuovo database? Le eventuali modifiche non salvate verranno perse.';
        if (!window.confirm(message)) return;
        selectedModuleId = null;
        plannerStore.createNew();
    });

    elements.openDatabaseButton.addEventListener('click', async () => {
        if (!confirmDiscard()) return;
        try {
            await plannerStore.openDatabase(elements.databaseFileInput);
        } catch (error) {
            reportError(error);
        }
    });

    elements.databaseFileInput.addEventListener('change', async () => {
        const file = elements.databaseFileInput.files?.[0];
        elements.databaseFileInput.value = '';
        if (!file) return;
        try {
            await plannerStore.loadDatabaseFile(file);
        } catch (error) {
            reportError(error);
        }
    });

    elements.saveDatabaseButton.addEventListener('click', async () => {
        try {
            await plannerStore.save();
        } catch (error) {
            reportError(error);
        }
    });

    elements.importPlanButton.addEventListener('click', () => {
        if (window.confirm('Il programma importato sostituirà moduli, argomenti e progresso correnti. Continuare?')) {
            elements.planFileInput.click();
        }
    });

    elements.planFileInput.addEventListener('change', async () => {
        const file = elements.planFileInput.files?.[0];
        elements.planFileInput.value = '';
        if (!file) return;
        try {
            await plannerStore.importPlanFile(file);
            selectedModuleId = null;
        } catch (error) {
            reportError(error);
        }
    });

    elements.settingsButton.addEventListener('click', openSettingsDialog);
    elements.editPlanButton.addEventListener('click', openPlanDialog);
    elements.settingsForm.addEventListener('submit', applySettings);
    elements.planForm.addEventListener('submit', applyPlan);

    elements.clearLocalDatabaseButton.addEventListener('click', async () => {
        if (!window.confirm('Rimuovere il database locale? Esporta prima un JSON se vuoi conservarne una copia.')) return;
        try {
            await plannerStore.clearLocalDatabase();
            elements.settingsDialog.close();
        } catch (error) {
            showFormError(elements.settingsError, error);
        }
    });

    elements.addCategoryButton.addEventListener('click', () => {
        settingsDraft.categories.push({
            id: `category-${settingsDraft.categories.length + 1}`,
            label: 'Nuova categoria',
            icon: '📌',
            color: '#64748b',
            role: 'neutral'
        });
        renderCategoryEditor();
        renderWeekTemplateEditor();
    });

    elements.addModuleButton.addEventListener('click', () => {
        planDraft.modules.push({
            id: createId('module'),
            title: 'Nuovo modulo',
            color: '#2563eb',
            mode: 'work',
            topics: []
        });
        renderModuleEditor();
    });

    document.querySelectorAll('[data-close-dialog]').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById(button.dataset.closeDialog)?.close();
        });
    });

    window.addEventListener('beforeunload', event => {
        if (!plannerStore.dirty || plannerStore.usesLocalDatabase) return;
        event.preventDefault();
        event.returnValue = '';
    });
}

async function init() {
    bindEvents();
    plannerStore.subscribe(renderStoreState);
    await plannerStore.initialize();
}

init().catch(reportError);

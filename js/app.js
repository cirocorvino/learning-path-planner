import {
    CATEGORY_ROLES,
    DAY_KEYS,
    MODULE_MODES,
    TOPIC_KINDS,
    calculateReleaseScopeMetrics,
    createId,
    databaseHasContent,
    releaseScopeInversionContributors,
    summarizeScopeGateReadiness
} from './model.js';
import {
    buildPlanSchedule,
    daysBetween,
    formatDate,
    formatDayName,
    formatDuration,
    getModuleWeekAllocations,
    getTimelineMonths,
    getVisibleGanttModules,
    getWeekAgenda
} from './planner.js';
import { normalizeDatabasePath } from './db-configuration.js';
import {
    buildActualWorkLogPresentation,
    buildAllocationClassNames,
    buildAllocationReleasePresentation,
    buildModuleWorkPackagePresentation,
    buildWeeklyActualWorkPresentation,
    formatElapsedSeconds
} from './release-presentation.js';
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
    'releaseDashboard',
    'releaseSourceSummary',
    'releaseCapacitySummary',
    'releaseScopeCards',
    'releaseMetricSemantics',
    'releaseStatusPanel',
    'releaseDeliveryTotals',
    'releaseStatusHeadline',
    'releaseFunctionalNote',
    'releaseStatusDetails',
    'releaseNextStep',
    'releaseCriticalSummary',
    'releaseCriticalPath',
    'releaseCriticalBranches',
    'releaseForecasts',
    'releaseWorkPackages',
    'releaseActualWorkPanel',
    'releaseActualCoverage',
    'releaseActualSemantics',
    'releaseActualSummary',
    'releaseActualDays',
    'releaseActualTotals',
    'releaseActualTotalsContent',
    'releaseGates',
    'releaseMilestones',
    'releaseHistory',
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

const RELEASE_STATUS_LABELS = {
    complete: 'Completato',
    validation: 'In validazione',
    in_progress: 'In corso',
    partial: 'Parziale',
    config_gated: 'Pronto ma non attivo',
    blocked: 'Bloccato',
    not_started: 'Non iniziato',
    future: 'Futuro',
    superseded: 'Superato'
};

const RELEASE_READINESS_LABELS = {
    ready: 'Pronto',
    not_ready: 'Non pronto',
    partially_scheduled: 'Parzialmente schedulato',
    not_assessed: 'Non valutato'
};

const DELIVERY_PROFILE_LABELS = {
    documentation_process: 'Documentazione / processo',
    internal_simple: 'Modifica interna semplice',
    ui_user_flow: 'UI / flusso utente',
    api_dto_database: 'API / DTO / database',
    security_ai_concurrency: 'Sicurezza / provider AI / concorrenza',
    cross_cutting_high_risk: 'Trasversale ad alto rischio',
    unscheduled_future: 'Futuro non schedulato'
};

const ESTIMATE_BASIS_LABELS = {
    base_technical: 'Base tecnica',
    inclusive: 'Già inclusiva',
    mixed: 'Mista',
    not_scheduled: 'Non schedulata'
};

const CONFIDENCE_LABELS = {
    high: 'Alta',
    medium: 'Media',
    low: 'Bassa'
};

let currentDatabase = null;
let currentSchedule = null;
let currentDatabaseConfiguration = null;
let selectedModuleId = null;
let selectedActualWeekStart = null;
let selectedActualActivityId = null;
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
    renderReleaseDashboard();
    renderGantt();
    renderSelectedWeek();
}

function releaseStatusBadge(status) {
    return createElement('span', {
        className: `release-status release-status--${status}`,
        text: RELEASE_STATUS_LABELS[status] || status
    });
}

function releaseReadinessBadge(status) {
    return createElement('span', {
        className: `release-status release-status--${status}`,
        text: RELEASE_READINESS_LABELS[status] || status
    });
}

function releaseWorkPackageMap() {
    const releasePlan = currentDatabase.releasePlan;
    return new Map((releasePlan?.workPackages || []).map(workPackage => [workPackage.id, workPackage]));
}

function releaseDate(value, locale) {
    return value ? formatDate(value, locale, { year: true }) : 'Non definita';
}

function releaseHours(value, locale) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} h`;
}

function releaseNumber(value, locale) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

function releaseSummaryList(title, items) {
    const list = createElement('ul');
    items.forEach(item => list.append(createElement('li', { text: item })));
    return createElement('section', {}, [createElement('h4', { text: title }), list]);
}

function actualSummaryMetric(label, value, detail = '') {
    return createElement('article', {}, [
        createElement('span', { text: label }),
        createElement('strong', { text: value }),
        detail ? createElement('small', { text: detail }) : null
    ]);
}

function renderActualWorkLog(releasePlan, locale) {
    const presentation = buildActualWorkLogPresentation(
        releasePlan,
        locale,
        currentDatabase.metadata.timeZone
    );
    setHidden(elements.releaseActualWorkPanel, !presentation);
    if (!presentation) return;

    elements.releaseActualCoverage.textContent = presentation.coverageNote;
    clear(elements.releaseActualSemantics);
    presentation.semantics.forEach(item => {
        elements.releaseActualSemantics.append(createElement('article', {}, [
            createElement('strong', { text: item.label }),
            createElement('p', { text: item.text })
        ]));
    });

    clear(elements.releaseActualSummary);
    elements.releaseActualSummary.append(
        actualSummaryMetric(
            'Somma per task',
            presentation.summary.taskElapsedText,
            `${presentation.summary.closedEntryCount} intervalli o durate chiusi`
        ),
        actualSummaryMetric(
            'Unione giornaliera',
            presentation.summary.dailyUnionText,
            'Le sovrapposizioni parallele sono contate una sola volta'
        ),
        actualSummaryMetric(
            'Durate non collocate',
            presentation.summary.unplacedText,
            'Non diventano fasce orarie'
        ),
        actualSummaryMetric(
            'Effort agentico equivalente',
            presentation.summary.agentEffortText,
            'Non derivato dal tempo di orologio'
        )
    );

    clear(elements.releaseActualDays);
    if (presentation.empty) {
        elements.releaseActualDays.append(createElement('p', {
            className: 'muted',
            text: presentation.emptyText
        }));
    }
    presentation.days.forEach(day => {
        const entries = createElement('div', { className: 'release-actual-day__entries' });
        day.entries.forEach(entry => {
            const outputEvidence = createElement('div', { className: 'release-actual-entry__evidence' }, [
                createElement('strong', { text: 'Evidenza output' })
            ]);
            if (entry.outputEvidence.length) {
                const list = createElement('ul');
                entry.outputEvidence.forEach(evidence => list.append(createElement('li', { text: evidence.text })));
                outputEvidence.append(list);
            } else {
                outputEvidence.append(createElement('span', { text: 'Nessun evento GitHub associato; vale la fonte task.' }));
            }
            entries.append(createElement('article', { className: 'release-actual-entry' }, [
                createElement('div', { className: 'release-actual-entry__heading' }, [
                    createElement('strong', { text: entry.roleTask }),
                    releaseStatusBadge(entry.status)
                ]),
                createElement('span', { className: 'release-actual-entry__time', text: entry.timingText }),
                createElement('p', {}, [
                    createElement('strong', { text: entry.topicLabel }),
                    document.createTextNode(` · ${entry.description}`)
                ]),
                createElement('small', {
                    text: [entry.referencesText, entry.workPackagesText].filter(Boolean).join(' · ')
                }),
                createElement('div', { className: 'release-actual-entry__source' }, [
                    createElement('strong', { text: 'Fonte intervallo' }),
                    createElement('span', { text: `${entry.source.reference} · ${entry.source.summary}` })
                ]),
                outputEvidence,
                createElement('small', { text: entry.agentEffortText })
            ]));
        });
        const openText = day.openEntryCount
            ? ` · ${day.openEntryCount} attività in corso ${day.openEntryCount === 1 ? 'esclusa' : 'escluse'} dai totali`
            : '';
        elements.releaseActualDays.append(createElement('details', { className: 'release-actual-day' }, [
            createElement('summary', {}, [
                createElement('strong', { text: day.dateText }),
                createElement('span', {
                    text: `Somma task ${day.taskElapsedText} · unione ${day.dailyUnionText}${openText}`
                })
            ]),
            day.unplacedText !== '0 s'
                ? createElement('p', { className: 'muted', text: `Non collocato: ${day.unplacedText}` })
                : null,
            entries
        ]));
    });

    clear(elements.releaseActualTotalsContent);
    elements.releaseActualTotalsContent.append(createElement('p', {
        className: 'muted release-actual-totals__note',
        text: 'Ogni attività può contribuire a più riferimenti: questi totali sono viste indipendenti e non vanno sommati tra loro.'
    }));
    const githubTotals = presentation.referenceTotals.filter(item => item.kind !== 'task');
    const appendTotals = (title, items, labelForItem) => {
        const section = createElement('section', {}, [createElement('h4', { text: title })]);
        if (!items.length) {
            section.append(createElement('p', { className: 'muted', text: 'Nessun totale disponibile.' }));
        } else {
            const list = createElement('ul');
            items.forEach(item => list.append(createElement('li', {
                text: `${labelForItem(item)}: ${item.elapsedText} osservati · ${item.entryCount} voci`
            })));
            section.append(list);
        }
        elements.releaseActualTotalsContent.append(section);
    };
    appendTotals('Issue e PR', githubTotals, item => `${item.kind.toUpperCase()} ${item.reference}`);
    appendTotals('Work package', presentation.workPackageTotals, item => item.label);
    elements.releaseActualTotals.title = presentation.entryRule;
}

function renderReleaseDashboard() {
    const releasePlan = currentDatabase.releasePlan;
    setHidden(elements.releaseDashboard, !releasePlan);
    if (!releasePlan) return;

    const locale = currentDatabase.metadata.locale;
    const source = releasePlan.sourceSnapshot;
    elements.releaseSourceSummary.textContent = [
        `${source.repository}@${source.commit}`,
        `stato verificato ${releaseDate(source.assessedAt, locale)}`,
        source.publicationStatus
    ].join(' · ');
    elements.releaseCapacitySummary.textContent = [
        `${formatDuration(releasePlan.capacity.plannedWeeklyMinutes)} pianificate`,
        `${formatDuration(releasePlan.capacity.reserveWeeklyMinutes)} di riserva`,
        `${formatDuration(releasePlan.capacity.grossWeeklyMinutes)} lorde`,
        `calibrazione ${releasePlan.capacity.calibrationWindowWeeks} settimane`
    ].join(' · ');
    elements.releaseCapacitySummary.title = releasePlan.capacity.basis;

    clear(elements.releaseScopeCards);
    releasePlan.scopes.forEach((scope, scopeIndex) => {
        const metrics = calculateReleaseScopeMetrics(releasePlan, scope.id);
        const calculated = metrics.completionPercent;
        const metricLabel = releasePlan.metricSemantics?.functionalCompletion.label
            || 'Avanzamento funzionale nello scope';
        const readiness = summarizeScopeGateReadiness(releasePlan, scope.id);
        const gateCount = readiness.applicableGateCount
            ? `${readiness.passedGateCount}/${readiness.applicableGateCount} gate superati`
            : 'Nessun gate applicabile registrato';
        const progress = createElement('progress', {
            attributes: {
                max: 100,
                value: calculated,
                'aria-label': `${metricLabel}, ${scope.label}: ${calculated}%`
            }
        });
        const breadth = metrics.breadthPercent === null
            ? null
            : createElement('div', { className: 'release-scope__breadth' }, [
                createElement('span', {
                    text: releasePlan.metricSemantics.functionalCompletion.breadthLabel
                }),
                createElement('strong', { text: `${metrics.breadthPercent.toFixed(1)}%` })
            ]);
        const previousScope = releasePlan.scopes[scopeIndex - 1];
        const inversionContributors = previousScope
            ? releaseScopeInversionContributors(releasePlan, scope.id, previousScope.id)
            : [];
        const inversionDetail = inversionContributors.length
            ? createElement('details', { className: 'release-scope__contributors' }, [
                createElement('summary', { text: 'Perché il completamento aumenta' }),
                createElement('ul', {}, inversionContributors.map(workPackage => createElement('li', {
                    text: `${workPackage.title}: ${workPackage.completionPercent.toFixed(1)}% · peso ${workPackage.functionalWeight}`
                })))
            ])
            : null;
        elements.releaseScopeCards.append(createElement('article', { className: 'release-scope' }, [
            createElement('div', { className: 'release-scope__heading' }, [
                createElement('div', {}, [
                    createElement('strong', { text: scope.label }),
                    createElement('span', { className: 'release-scope__version', text: scope.denominatorVersion })
                ]),
                createElement('span', { className: 'release-scope__percent', text: `${calculated.toFixed(1)}%` })
            ]),
            createElement('span', { className: 'release-scope__metric-label', text: metricLabel }),
            progress,
            breadth,
            inversionDetail,
            createElement('p', { className: 'muted', text: scope.perimeter }),
            createElement('small', {
                text: `${scope.status} · snapshot ${releaseDate(scope.lastReviewedAt, locale)}`
            }),
            createElement('div', { className: 'release-scope__readiness' }, [
                createElement('span', { text: releasePlan.metricSemantics?.releaseReadiness.label || 'Readiness di rilascio' }),
                releaseReadinessBadge(readiness.status),
                createElement('small', { text: `${gateCount}. ${readiness.summary}` })
            ])
        ]));
    });

    const metricSemantics = releasePlan.metricSemantics;
    setHidden(elements.releaseMetricSemantics, !metricSemantics);
    clear(elements.releaseMetricSemantics);
    if (metricSemantics) {
        const functionalCompletion = metricSemantics.functionalCompletion;
        const breadthText = functionalCompletion.breadthFormula
            ? `${functionalCompletion.breadthLabel}: ${functionalCompletion.breadthFormula}`
            : `Quota della Visione: ${functionalCompletion.visionShareFormula} Stato: ${functionalCompletion.visionShareStatus}.`;
        elements.releaseMetricSemantics.append(
            createElement('strong', { text: 'Come leggere queste misure' }),
            createElement('p', {
                text: `${functionalCompletion.label}: ${functionalCompletion.formula} ${functionalCompletion.comparisonRule}`
            }),
            createElement('p', {
                className: 'muted',
                text: breadthText
            }),
            createElement('p', {
                className: 'muted',
                text: `${metricSemantics.releaseReadiness.rule} ${metricSemantics.releaseReadiness.blockingRule}`
            })
        );
    }

    const releaseStatus = releasePlan.releaseStatus;
    setHidden(elements.releaseStatusPanel, !releaseStatus);
    if (releaseStatus) {
        const totals = releasePlan.deliveryTotals?.revisedBaseline;
        elements.releaseStatusHeadline.textContent = releaseStatus.headline;
        elements.releaseFunctionalNote.textContent = releaseStatus.functionalCompletionNote;
        elements.releaseNextStep.textContent = `Prossimo passo: ${releaseStatus.nextStep}`;
        elements.releaseDeliveryTotals.textContent = totals
            ? `${releaseHours(totals.remainingActiveHours, locale)} residue · ${releaseNumber(totals.remainingOperationalWeeksAtPlannedCapacity, locale)} settimane nette · Gantt ${releaseNumber(totals.ganttCalendarWeeks, locale)} settimane fino al ${releaseDate(totals.ganttEndDate, locale)} · ${releaseHours(totals.weeklyReserveHours, locale)} di riserva/settimana`
            : '';
        elements.releaseDeliveryTotals.title = totals?.ganttRule || '';
        clear(elements.releaseStatusDetails);
        elements.releaseStatusDetails.append(
            releaseSummaryList('Già utilizzabile', releaseStatus.availableNow),
            releaseSummaryList('Parziale o dormiente', releaseStatus.partialOrDormant),
            releaseSummaryList('Blocca il prossimo gate', releaseStatus.nextGateBlockers)
        );
    }

    const workPackageById = releaseWorkPackageMap();
    clear(elements.releaseCriticalPath);
    elements.releaseCriticalSummary.textContent = releasePlan.criticalPath.summary;
    releasePlan.criticalPath.workPackageIds.forEach(workPackageId => {
        const workPackage = workPackageById.get(workPackageId);
        if (!workPackage) return;
        elements.releaseCriticalPath.append(createElement('li', {}, [
            createElement('span', { text: workPackage.title }),
            releaseStatusBadge(workPackage.status),
            createElement('strong', {
                text: `Stato WP ${workPackage.completionPercent.toFixed(1)}%`,
                title: `Snapshot ${releaseDate(workPackage.lastReviewedAt, locale)}`
            })
        ]));
    });
    clear(elements.releaseCriticalBranches);
    (releasePlan.criticalPath.convergingBranches || []).forEach(branch => {
        const titles = branch.workPackageIds
            .map(workPackageId => workPackageById.get(workPackageId)?.title)
            .filter(Boolean);
        elements.releaseCriticalBranches.append(createElement('article', {}, [
            createElement('strong', { text: branch.label }),
            createElement('span', { text: titles.join(' · ') }),
            createElement('small', { text: `Converge su ${branch.joinsAt}` })
        ]));
    });

    clear(elements.releaseForecasts);
    releasePlan.forecasts.forEach(forecast => {
        elements.releaseForecasts.append(createElement('article', { className: 'forecast' }, [
            createElement('strong', { text: forecast.label }),
            createElement('dl', {}, [
                createElement('dt', { text: 'Minimo teorico' }),
                createElement('dd', { text: releaseDate(forecast.theoreticalDate, locale) }),
                createElement('dt', { text: 'Realistico' }),
                createElement('dd', {
                    text: `${releaseDate(forecast.realisticStart, locale)} – ${releaseDate(forecast.realisticEnd, locale)}`
                }),
                createElement('dt', { text: 'Prudenziale' }),
                createElement('dd', {
                    text: `${releaseDate(forecast.prudentStart, locale)} – ${releaseDate(forecast.prudentEnd, locale)}`
                })
            ]),
            createElement('small', { text: forecast.commitmentStatus })
        ]));
    });

    clear(elements.releaseWorkPackages);
    releasePlan.workPackages.forEach(workPackage => {
        const title = createElement('div', { className: 'release-wp__title' }, [
            createElement('strong', { text: workPackage.title })
        ]);
        const isPrimaryChain = (releasePlan.criticalPath.primaryChainWorkPackageIds || [])
            .includes(workPackage.id);
        if (isPrimaryChain || (!releasePlan.releaseStatus && workPackage.criticalPath)) {
            title.append(createElement('span', { className: 'release-tag', text: 'Percorso critico' }));
        }
        if (workPackage.issueRefs.length) {
            title.append(createElement('small', { text: workPackage.issueRefs.join(' · ') }));
        }

        const progress = createElement('progress', {
            attributes: {
                max: 100,
                value: workPackage.completionPercent,
                'aria-label': `${workPackage.title}: ${workPackage.completionPercent}%`
            }
        });
        const progressCell = createElement('div', { className: 'release-wp__progress' }, [
            releaseStatusBadge(workPackage.status),
            createElement('strong', { text: `${workPackage.completionPercent.toFixed(1)}%` }),
            progress
        ]);
        const weights = workPackage.functionalWeight
            ? [
                `Peso funzionale: ${workPackage.functionalWeight}`,
                `Scope: ${releasePlan.scopes
                    .filter(scope => scope.workPackageIds?.includes(workPackage.id))
                    .map(scope => scope.label)
                    .join(', ')}`
            ].join(' · ')
            : releasePlan.scopes
                .filter(scope => workPackage.weights[scope.id] > 0)
                .map(scope => `Peso interno ${scope.label}: ${workPackage.weights[scope.id]}/100`)
                .join(' · ') || 'Fuori perimetro';
        const latestEvidence = workPackage.evidence.at(-1);
        const evidence = createElement('div', { className: 'release-wp__evidence' }, [
            createElement('span', { text: weights }),
            createElement('span', { text: latestEvidence?.summary || 'Nessuna evidenza registrata' }),
            createElement('small', {
                text: `${latestEvidence?.reference || '—'} · revisione ${releaseDate(workPackage.lastReviewedAt, locale)}`
            })
        ]);

        const stateDetail = createElement('div', { className: 'release-wp__facts' }, [
            createElement('p', {}, [
                createElement('strong', { text: 'Stato reale' }),
                createElement('span', { text: workPackage.currentStateSummary || workPackage.description })
            ]),
            workPackage.remainingWorkSummary
                ? createElement('p', {}, [
                    createElement('strong', { text: 'Resta da fare' }),
                    createElement('span', { text: workPackage.remainingWorkSummary })
                ])
                : null,
            workPackage.dependencySummary
                ? createElement('p', {}, [
                    createElement('strong', { text: 'Dipendenze decisive' }),
                    createElement('span', { text: workPackage.dependencySummary })
                ])
                : null
        ]);

        const estimate = workPackage.deliveryEstimate;
        const estimateDetail = estimate
            ? createElement('div', { className: 'release-wp__estimate' }, [
                createElement('dl', {}, [
                    createElement('dt', { text: 'Profilo' }),
                    createElement('dd', { text: DELIVERY_PROFILE_LABELS[estimate.profile] || estimate.profile }),
                    createElement('dt', { text: 'Base' }),
                    createElement('dd', { text: ESTIMATE_BASIS_LABELS[estimate.estimateBasis] || estimate.estimateBasis }),
                    createElement('dt', { text: 'Coefficiente' }),
                    createElement('dd', {
                        text: estimate.initialCoefficient === estimate.appliedCoefficient
                            ? `${estimate.appliedCoefficient.toFixed(2)}×`
                            : `${estimate.initialCoefficient.toFixed(2)}× rif. · ${estimate.appliedCoefficient.toFixed(2)}× applicato`
                    }),
                    createElement('dt', { text: 'Confidenza' }),
                    createElement('dd', { text: CONFIDENCE_LABELS[estimate.confidence] || estimate.confidence }),
                    createElement('dt', { text: 'Residuo base' }),
                    createElement('dd', { text: releaseHours(estimate.remainingBaseHours, locale) }),
                    createElement('dt', { text: 'Residuo corretto' }),
                    createElement('dd', { text: releaseHours(estimate.correctedRemainingHours, locale) })
                ]),
                estimate.externalLeadTimes.length
                    ? createElement('small', {
                        text: `Lead time: ${estimate.externalLeadTimes.map(item => `${item.phase} ${item.minimumWeeks}/${item.realisticWeeks}/${item.prudentWeeks} sett.`).join(' · ')}`
                    })
                    : createElement('small', { text: 'Nessun lead time esterno separato.' })
            ])
            : createElement('span', { className: 'muted', text: 'Stima delivery non disponibile nel formato precedente.' });

        const row = createElement('tr');
        row.append(
            createElement('td', { attributes: { 'data-label': 'Work package' } }, [
                title,
                createElement('p', { text: workPackage.description }),
                workPackage.productOutcome
                    ? createElement('p', { className: 'release-wp__outcome' }, [
                        createElement('strong', { text: 'Risultato concreto' }),
                        createElement('span', { text: workPackage.productOutcome })
                    ])
                    : null
            ]),
            createElement('td', { attributes: { 'data-label': 'Stato funzionale' } }, [progressCell]),
            createElement('td', { attributes: { 'data-label': 'Stato reale e residuo' } }, [stateDetail]),
            createElement('td', { attributes: { 'data-label': 'Stima delivery' } }, [estimateDetail]),
            createElement('td', { attributes: { 'data-label': 'Peso ed evidenza' } }, [evidence])
        );
        elements.releaseWorkPackages.append(row);
    });

    renderActualWorkLog(releasePlan, locale);

    clear(elements.releaseGates);
    releasePlan.gates.forEach(gate => {
        const criteria = createElement('ul');
        gate.criteria.forEach(item => criteria.append(createElement('li', { text: item })));
        const details = createElement('details', { className: 'release-detail' }, [
            createElement('summary', {}, [
                createElement('span', { text: gate.title }),
                releaseStatusBadge(gate.status)
            ]),
            criteria,
            createElement('small', {
                text: `${gate.owner} · revisione ${releaseDate(gate.lastReviewedAt, locale)}`
            })
        ]);
        elements.releaseGates.append(details);
    });

    const forecastById = new Map(releasePlan.forecasts.map(forecast => [forecast.id, forecast]));
    clear(elements.releaseMilestones);
    releasePlan.milestones.forEach(milestone => {
        const forecast = forecastById.get(milestone.forecastId);
        elements.releaseMilestones.append(createElement('article', { className: 'milestone' }, [
            createElement('div', {}, [
                createElement('strong', { text: milestone.title }),
                createElement('p', { text: milestone.description })
            ]),
            releaseStatusBadge(milestone.status),
            forecast
                ? createElement('small', {
                    text: `Finestra realistica: ${releaseDate(forecast.realisticStart, locale)} – ${releaseDate(forecast.realisticEnd, locale)}`
                })
                : null
        ]));
    });

    clear(elements.releaseHistory);
    const historyEntries = [
        ...releasePlan.changeHistory.map(change => ({
            date: change.date,
            title: change.kind,
            summary: change.summary,
            detail: [change.from && `Da: ${change.from}`, change.to && `A: ${change.to}`].filter(Boolean).join(' · ')
        })),
        ...releasePlan.scopeChanges.map(change => ({
            date: change.date,
            title: `Perimetro ${change.scopeId}`,
            summary: change.change,
            detail: `${change.fromVersion} → ${change.toVersion} · ${change.denominatorImpact}`
        }))
    ].sort((left, right) => right.date.localeCompare(left.date));
    historyEntries.forEach(entry => {
        elements.releaseHistory.append(createElement('article', {}, [
            createElement('time', { text: releaseDate(entry.date, locale), attributes: { datetime: entry.date } }),
            createElement('div', {}, [
                createElement('strong', { text: entry.title }),
                createElement('p', { text: entry.summary }),
                entry.detail ? createElement('small', { text: entry.detail }) : null
            ])
        ]));
    });
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

function createGanttTrack(months, totalDays) {
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
    return track;
}

function reconciliationKindLabel(kind) {
    return {
        planned: 'Attività prevista',
        anticipated: 'Anticipo di attività futura',
        added: 'Attività aggiunta',
        added_and_anticipated: 'Attività aggiunta e anticipo'
    }[kind] || 'Attività svolta';
}

function reconciliationEvidenceBadge(activity) {
    return createElement('span', {
        className: `release-evidence-badge${activity.evidenceVerified ? ' release-evidence-badge--verified' : ''}`,
        text: `${activity.evidenceVerified ? '✓ ' : ''}${activity.evidenceLabel}`,
        title: activity.evidenceVerified
            ? 'Attività conclusa con evidenze finali collegate e verificate.'
            : 'Manca una prova finale chiusa oppure l’attività non è ancora conclusa.'
    });
}

function renderGantt() {
    clear(elements.ganttRows);
    const modules = getVisibleGanttModules(currentSchedule);
    const empty = modules.length === 0 && currentSchedule.actualActivities.length === 0;
    setHidden(elements.ganttEmpty, !empty);
    setHidden(elements.ganttTable, empty);
    if (empty) return;

    const totalDays = Math.max(1, daysBetween(currentSchedule.startDate, currentSchedule.endDate) + 1);
    const locale = currentDatabase.metadata.locale;
    const months = getTimelineMonths(currentSchedule.startDate, currentSchedule.endDate, locale);

    currentSchedule.actualActivities.forEach(activity => {
        const track = createGanttTrack(months, totalDays);
        const left = daysBetween(currentSchedule.startDate, activity.startDate) / totalDays * 100;
        const width = (daysBetween(activity.startDate, activity.endDate) + 1) / totalDays * 100;
        const bar = createElement('button', {
            className: `gantt__bar gantt__bar--actual gantt__bar--${activity.kind}`,
            type: 'button',
            title: `Apri ${activity.title}`,
            attributes: {
                'aria-label': `Apri le attività svolte per ${activity.title}`
            }
        });
        bar.style.left = `${left}%`;
        bar.style.width = `${Math.max(width, 1.2)}%`;
        bar.style.background = activity.color;
        bar.addEventListener('click', () => {
            const week = currentSchedule.actualWeeks.find(item => (
                activity.startDate >= item.startDate && activity.startDate <= item.endDate
            ));
            selectedActualWeekStart = week?.startDate || activity.startDate;
            selectedActualActivityId = activity.id;
            selectedModuleId = null;
            renderSelectedWeek();
            elements.weekDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        track.append(bar);

        const row = createElement('div', {
            className: `gantt__row gantt__row--actual gantt__row--${activity.kind}`,
            attributes: { role: 'row' }
        }, [
            createElement('div', { attributes: { role: 'cell' } }, [
                createElement('div', { className: 'gantt__actual-title' }, [
                    createElement('span', { className: 'gantt__module-title', text: activity.title }),
                    reconciliationEvidenceBadge(activity)
                ]),
                createElement('span', {
                    className: 'gantt__module-meta',
                    text: `${reconciliationKindLabel(activity.kind)} · ${activity.closedEntryCount} intervalli conclusi${activity.openEntryCount ? ` · ${activity.openEntryCount} in corso` : ''}`
                })
            ]),
            createElement('div', { attributes: { role: 'cell' } }, [
                createElement('strong', { text: formatElapsedSeconds(activity.taskElapsedSeconds) }),
                createElement('div', {
                    className: 'gantt__module-meta',
                    text: `${formatElapsedSeconds(activity.dailyUnionElapsedSeconds)} tempo coperto${activity.baselinePlannedMinutes === null ? ' · non prevista come blocco autonomo' : ` · stima ${formatDuration(activity.baselinePlannedMinutes)}`}`
                })
            ]),
            createElement('div', { attributes: { role: 'cell' } }, [
                createElement('span', { text: formatDate(activity.startDate, locale) }),
                createElement('span', { className: 'gantt__module-meta', text: ` → ${formatDate(activity.endDate, locale)}` })
            ]),
            track
        ]);
        elements.ganttRows.append(row);
    });

    modules.forEach(module => {
        const modulePresentation = buildModuleWorkPackagePresentation(currentDatabase.releasePlan, module, locale);
        const isCritical = modulePresentation?.contributors.some(workPackage => workPackage.criticalPath) || false;
        const row = createElement('div', {
            className: 'gantt__row',
            attributes: { role: 'row' }
        });

        const moduleSnapshotDetails = modulePresentation
            ? createElement('details', { className: 'gantt__wp-snapshot' }, [
                createElement('summary', {
                    text: modulePresentation.summaryText
                }),
                createElement('p', {
                    text: modulePresentation.explanationText
                }),
                createElement('ul', {}, modulePresentation.contributors.map(workPackage => createElement('li', {
                    text: workPackage.text
                })))
            ])
            : null;
        const identity = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('span', {
                className: 'gantt__module-title',
                text: module.completedTopicCount > 0 ? `${module.title} · residuo` : module.title
            }),
            createElement('span', {
                className: 'gantt__module-meta',
                text: module.mode === 'buffer'
                    ? 'Pausa / buffer'
                    : module.completedTopicCount > 0
                        ? `${module.remainingTopicCount} argomenti residui · ${module.completedTopicCount} completati${isCritical ? ' · percorso critico' : ''}`
                        : `${module.topics.length} argomenti${isCritical ? ' · percorso critico' : ''}`
            }),
            moduleSnapshotDetails
        ]);

        const effort = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('strong', { text: module.mode === 'buffer' ? `${module.weeks} sett.` : formatDuration(module.totalMinutes) }),
            createElement('div', {
                className: 'gantt__module-meta',
                text: `${module.weeks} ${module.weeks === 1 ? 'settimana' : 'settimane'}${module.completedMinutes > 0 ? ' · effort residuo' : ''}`
            })
        ]);

        const period = createElement('div', { attributes: { role: 'cell' } }, [
            createElement('span', { text: formatDate(module.startDate, locale) }),
            createElement('span', { className: 'gantt__module-meta', text: ` → ${formatDate(module.endDate, locale)}` })
        ]);

        const track = createGanttTrack(months, totalDays);
        if (module.weeks > 0) {
            const left = daysBetween(currentSchedule.startDate, module.startDate) / totalDays * 100;
            const width = (daysBetween(module.startDate, module.endDate) + 1) / totalDays * 100;
            const bar = createElement('button', {
                className: `gantt__bar${isCritical ? ' gantt__bar--critical' : ''}`,
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
                selectedActualWeekStart = null;
                selectedActualActivityId = null;
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

function renderSelectedActualWeek() {
    const actualWeeks = currentSchedule.actualWeeks;
    const week = actualWeeks.find(item => item.startDate === selectedActualWeekStart);
    if (!week) {
        selectedActualWeekStart = null;
        selectedActualActivityId = null;
        setHidden(elements.weekDetail, true);
        return;
    }
    const locale = currentDatabase.metadata.locale;
    const presentation = buildWeeklyActualWorkPresentation(
        currentDatabase.releasePlan,
        week.startDate,
        week.endDate,
        locale,
        currentDatabase.metadata.timeZone
    );
    const selectedActivity = currentSchedule.actualActivities
        .find(activity => activity.id === selectedActualActivityId);
    const heading = createElement('div', { className: 'section-heading' }, [
        createElement('div', {}, [
            createElement('span', {
                className: 'eyebrow eyebrow--dark',
                text: `Settimana svolta ${actualWeeks.indexOf(week) + 1} di ${actualWeeks.length}`
            }),
            createElement('h2', { text: selectedActivity?.title || 'Attività ProfAssistant della settimana' }),
            createElement('p', {
                className: 'muted',
                text: `${formatDate(week.startDate, locale, { year: true })} — ${formatDate(week.endDate, locale, { year: true })}`
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
        selectedActualWeekStart = null;
        selectedActualActivityId = null;
        renderSelectedWeek();
    });

    const tabs = createElement('div', {
        className: 'week-tabs',
        attributes: { 'aria-label': 'Settimane con attività svolte' }
    });
    actualWeeks.forEach((actualWeek, index) => {
        const button = createElement('button', {
            className: 'week-tab',
            type: 'button',
            text: `${index + 1} · ${formatDate(actualWeek.startDate, locale)}`,
            attributes: { 'aria-pressed': actualWeek.startDate === week.startDate }
        });
        button.addEventListener('click', () => {
            selectedActualWeekStart = actualWeek.startDate;
            selectedActualActivityId = null;
            renderSelectedWeek();
        });
        tabs.append(button);
    });

    elements.weekDetail.append(heading, tabs, renderWeeklyActualWork(presentation, selectedActualActivityId));
    setHidden(elements.weekDetail, false);
}

function renderSelectedWeek() {
    clear(elements.weekDetail);
    if (selectedActualWeekStart) {
        renderSelectedActualWeek();
        return;
    }
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
        selectedActualWeekStart = null;
        selectedActualActivityId = null;
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

    const allocationClassNames = buildAllocationClassNames(currentDatabase.releasePlan);
    const allocations = createElement('div', { className: allocationClassNames.listClassName });
    if (module.mode === 'buffer') {
        allocations.append(createElement('span', { className: allocationClassNames.itemClassName, text: 'Settimana di recupero e consolidamento' }));
    } else if (agenda.allocations.length === 0) {
        allocations.append(createElement('span', { className: allocationClassNames.itemClassName, text: 'Nessuna attività pianificata' }));
    } else {
        agenda.allocations.forEach(allocation => {
            const presentation = buildAllocationReleasePresentation(
                currentDatabase.releasePlan,
                allocation,
                locale
            );
            if (presentation.mode === 'legacy') {
                allocations.append(createElement('span', {
                    className: allocationClassNames.itemClassName,
                    text: presentation.text
                }));
                return;
            }
            const snapshotDetails = createElement('details', { className: 'allocation-pill__snapshot' }, [
                createElement('summary', { text: presentation.snapshotSummaryText }),
                presentation.contributors.length
                    ? createElement('ul', {}, presentation.contributors.map(workPackage => createElement('li', {
                        text: workPackage.text
                    })))
                    : createElement('p', { text: presentation.emptyContributorsText })
            ]);
            allocations.append(createElement('article', { className: allocationClassNames.itemClassName }, [
                createElement('strong', { text: presentation.title }),
                createElement('span', {
                    className: 'allocation-pill__hours',
                    text: presentation.plannedHoursText
                }),
                snapshotDetails
            ]));
        });
    }

    const snapshotNote = currentDatabase.releasePlan
        ? createElement('p', {
            className: 'release-snapshot-note',
            text: currentDatabase.releasePlan.metricSemantics?.scheduleSnapshot.rule
                || 'Lo stato WP è uno snapshot corrente: non misura il progresso della settimana e non cresce automaticamente nelle settimane future.'
        })
        : null;

    const agendaGrid = createElement('div', {
        className: agenda.placementMode === 'abstract_weekly_capacity'
            ? 'agenda agenda--abstract'
            : 'agenda'
    });
    if (agenda.placementMode === 'abstract_weekly_capacity') {
        agendaGrid.append(createElement('p', {
            text: 'Le schede sopra rappresentano il forecast macro e non generano fasce orarie future. Sotto compaiono soltanto le attività realmente svolte o in corso con tempo attestato.'
        }));
    }
    if (agenda.placementMode !== 'abstract_weekly_capacity') agenda.days.forEach(day => {
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

    const weeklyActual = buildWeeklyActualWorkPresentation(
        currentDatabase.releasePlan,
        agenda.weekStart,
        agenda.weekEnd,
        locale,
        currentDatabase.metadata.timeZone
    );
    const actualReplacesForecast = weeklyActual?.displayMode === 'actual';
    const weeklyActualNode = actualReplacesForecast ? renderWeeklyActualWork(weeklyActual) : null;

    elements.weekDetail.append(heading, tabs);
    if (!actualReplacesForecast) {
        if (snapshotNote) elements.weekDetail.append(snapshotNote);
        elements.weekDetail.append(allocations, agendaGrid);
    }
    if (weeklyActualNode) elements.weekDetail.append(weeklyActualNode);
    setHidden(elements.weekDetail, false);
}

function renderWeeklyActualWork(presentation, selectedActivityId = null) {
    const summary = createElement('div', { className: 'weekly-actual__summary' }, [
        actualSummaryMetric(
            'Totale ore della settimana',
            presentation.summary.dailyUnionText,
            'Tempo di calendario senza contare due volte le sovrapposizioni'
        ),
        actualSummaryMetric(
            'Somma durate task',
            presentation.summary.taskElapsedText,
            'Può essere maggiore del totale per il lavoro in parallelo'
        ),
        actualSummaryMetric(
            'Parallelismo osservato',
            presentation.summary.parallelismText,
            `${presentation.summary.calendarOverlapText} sovrapposti rispetto all’esecuzione seriale`
        ),
        actualSummaryMetric(
            'Durate non collocate',
            presentation.summary.unplacedText,
            'Attestate, ma senza una fascia oraria inventata'
        ),
        actualSummaryMetric(
            'Attività in corso',
            presentation.summary.openEntryCount,
            'Escluse dai totali finché non hanno una fine attestata'
        )
    ]);
    const activities = createElement('div', {
        className: 'allocation-list allocation-list--release weekly-actual__activities'
    });
    presentation.activities.forEach(activity => {
        const comparison = createElement('details', { className: 'allocation-pill__snapshot' }, [
            createElement('summary', { text: 'Confronto con il piano' }),
            createElement('p', { text: activity.comparisonText }),
            createElement('p', { text: activity.planImpact })
        ]);
        const activityNode = createElement('article', {
            className: `allocation-pill allocation-pill--release weekly-actual-activity${activity.id === selectedActivityId ? ' weekly-actual-activity--selected' : ''}`
        }, [
            createElement('strong', { text: activity.title }),
            createElement('span', { className: 'weekly-actual-activity__kind', text: activity.kindLabel }),
            reconciliationEvidenceBadge(activity),
            createElement('span', {
                className: 'allocation-pill__hours',
                text: `Task attestati: ${activity.taskElapsedText} · tempo coperto: ${activity.dailyUnionText}`
            }),
            createElement('p', { text: activity.summary }),
            comparison
        ]);
        activityNode.style.setProperty('--actual-activity-color', activity.color);
        activities.append(activityNode);
    });
    const days = createElement('div', { className: 'weekly-actual__days' });

    if (presentation.empty) {
        days.append(createElement('p', { className: 'muted', text: presentation.emptyText }));
    } else {
        presentation.days.forEach(day => {
            const groups = createElement('div', { className: 'actual-agenda' });
            day.groups.forEach(group => {
                const intervalDetails = createElement('ul', { className: 'actual-session__details-list' });
                group.intervals.forEach(interval => {
                    intervalDetails.append(createElement('li', {}, [
                        createElement('strong', { text: interval.timingText }),
                        createElement('span', { text: `${interval.roleTask}: ${interval.description}` })
                    ]));
                });
                const timeColumn = createElement('div', { className: 'session__time actual-session__time' });
                group.timingLines.forEach(timingLine => {
                    timeColumn.append(createElement('span', { text: timingLine }));
                });
                const content = createElement('div', {}, [
                    createElement('div', { className: 'session__title', text: group.activityTitle }),
                    createElement('div', {
                        className: 'session__description',
                        text: `${group.referenceText} · ${group.elapsedText}`
                    }),
                    group.topicText
                        ? createElement('p', { className: 'actual-session__summary', text: group.topicText })
                        : null,
                    createElement('details', { className: 'actual-session__details' }, [
                        createElement('summary', {
                            text: `Cosa è stato fatto · ${group.intervals.length} ${group.intervals.length === 1 ? 'intervallo' : 'intervalli'}`
                        }),
                        createElement('p', { text: group.descriptionText }),
                        intervalDetails,
                        group.workPackagesText
                            ? createElement('small', { text: `Work package: ${group.workPackagesText}` })
                            : null
                    ])
                ]);
                const session = createElement('article', {
                    className: `session actual-session${group.activityId === selectedActivityId ? ' actual-session--selected' : ''}`
                }, [timeColumn, content]);
                session.style.setProperty('--session-color', group.activityColor);
                groups.append(session);
            });
            const openText = day.openEntryCount
                ? ` · ${day.openEntryCount} ${day.openEntryCount === 1 ? 'attività in corso' : 'attività in corso'}`
                : '';
            days.append(createElement('section', { className: 'weekly-actual-day' }, [
                createElement('div', { className: 'weekly-actual-day__heading' }, [
                    createElement('h4', { text: day.dayName }),
                    createElement('span', {
                        text: `Tempo coperto ${day.dailyUnionText} · somma task ${day.taskElapsedText}${openText}`
                    })
                ]),
                groups
            ]));
        });
    }

    return createElement('section', { className: 'weekly-actual', attributes: { 'aria-labelledby': 'weeklyActualTitle' } }, [
        createElement('div', { className: 'weekly-actual__heading' }, [
            createElement('div', {}, [
                createElement('span', { className: 'eyebrow eyebrow--dark', text: 'Piano riconciliato' }),
                createElement('h3', { text: 'Attività svolte e collocazione nel piano', attributes: { id: 'weeklyActualTitle' } })
            ]),
            createElement('p', { text: presentation.coverageText })
        ]),
        activities,
        summary,
        days,
        createElement('aside', { className: 'weekly-actual__replan' }, [
            createElement('strong', { text: presentation.replanning.label }),
            createElement('p', { text: presentation.replanning.text })
        ])
    ]);
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
        selectedActualWeekStart = null;
        selectedActualActivityId = null;
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
        selectedActualWeekStart = null;
        selectedActualActivityId = null;
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

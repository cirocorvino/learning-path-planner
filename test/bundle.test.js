import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bundleUrl = new URL('../js/app.bundle.js', import.meta.url);
const indexUrl = new URL('../index.html', import.meta.url);

test('il bundle file locale include IndexedDB ma non incorpora la DEMO', async () => {
    const bundle = await readFile(bundleUrl, 'utf8');

    assert.match(bundle, /class IndexedDbDatabaseCache/);
    assert.doesNotMatch(bundle, /embeddedExampleDatabase/);
    assert.doesNotMatch(bundle, /example-organizer/);
    assert.doesNotMatch(bundle, /Planner dimostrativo/);
    assert.match(
        bundle,
        /const newDatabaseDisabled = !snapshot\.hasActiveDatabase \|\| !databaseHasContent\(currentDatabase\)/
    );
    assert.match(bundle, /newDatabaseButton\.title = newDatabaseDisabled \? 'Il database è già vuoto' : ''/);
    assert.match(bundle, /const releasePresentationApi = \(\(\) => \{/);
    assert.match(bundle, /buildAllocationClassNames/);
    assert.match(bundle, /className: allocationClassNames\.listClassName/);
    assert.match(bundle, /className: allocationClassNames\.itemClassName/);
    assert.match(bundle, /buildAllocationReleasePresentation/);
    assert.match(bundle, /buildModuleWorkPackagePresentation/);
    assert.match(bundle, /calculateReleaseScopeMetrics/);
    assert.match(bundle, /releaseScopeInversionContributors/);
    assert.match(bundle, /summarizeScopeGateReadiness/);
    assert.match(bundle, /summarizeReconciliationEvidence/);
    assert.match(bundle, /calculateActualWorkMetrics/);
    assert.match(
        bundle,
        /const \{ calculateActualEntriesMetrics, calculateActualWorkMetrics, releaseWorkPackagesForTopic, summarizeModuleWorkPackageSnapshot, summarizeReconciliationEvidence \} = modelApi;/
    );
    assert.match(bundle, /buildActualWorkLogPresentation/);
    assert.match(bundle, /buildReleaseComparisonPresentation/);
    assert.match(bundle, /releaseComparisonChange/);
    assert.match(
        bundle,
        /return \{ buildActualWorkLogPresentation, buildAllocationClassNames, buildAllocationReleasePresentation, buildModuleWorkPackagePresentation, buildReleaseComparisonPresentation, buildWeeklyActualWorkPresentation, formatElapsedSeconds, releaseComparisonChange, releaseComparisonSection \};/
    );
    assert.match(bundle, /day\.roleGroups\.forEach/);
    assert.match(bundle, /buildWeeklyActualWorkPresentation/);
    assert.match(
        bundle,
        /const \{ buildActualWorkLogPresentation, buildAllocationClassNames, buildAllocationReleasePresentation, buildModuleWorkPackagePresentation, buildReleaseComparisonPresentation, buildWeeklyActualWorkPresentation, formatElapsedSeconds, releaseComparisonChange, releaseComparisonSection \} = releasePresentationApi;/
    );
    assert.match(bundle, /currentSchedule\.actualActivities\.forEach/);
    assert.match(bundle, /getVisibleGanttModules\(currentSchedule\)/);
    assert.match(bundle, /className: 'actual-agenda'/);
    assert.doesNotMatch(bundle, /Consuntivo attestato · settimana/);
    assert.match(bundle, /releaseActualWorkPanel/);
    assert.match(bundle, /abstract_weekly_capacity/);
});

test('rende collassabili i pannelli release senza collassare la schedulazione giornaliera', async () => {
    const index = await readFile(indexUrl, 'utf8');

    assert.match(index, /<details[^>]*aria-labelledby="workPackagesTitle"/);
    assert.match(index, /<details[^>]*aria-labelledby="releaseHistoryTitle"/);
    assert.match(index, /<details[^>]*id="releaseActualWorkPanel"/);
    assert.match(index, /<section[^>]*id="releaseChangesPanel"/);
    assert.match(index, /id="releaseContextComparison"/);
    assert.match(index, /id="ganttComparison"/);
    assert.match(index, /<script defer src="js\/app\.bundle\.js\?v=6\.2"><\/script>/);
    assert.match(index, /<link rel="stylesheet" href="Style\/styles\.css\?v=6\.2">/);
    assert.match(index, /<summary[^>]*release-panel__summary/);
    assert.doesNotMatch(index, /<details[^>]*id="weekDetail"/);
});

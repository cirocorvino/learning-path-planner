import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bundleUrl = new URL('../js/app.bundle.js', import.meta.url);

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
});

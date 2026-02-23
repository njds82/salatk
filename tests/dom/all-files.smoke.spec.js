import { createBootstrappedWindow } from '../helpers/bootstrap.js';
import { loadLegacyScripts } from '../helpers/load-legacy-script.js';
import { CLASSIC_SOURCE_FILES } from '../helpers/source-manifest.js';

function prerequisitesFor(file) {
    if (file === 'js/app.js') {
        return ['js/config.example.js', 'js/i18n.js', 'js/date-utils.js'];
    }

    if (file === 'js/supabaseClient.js') {
        return ['js/config.example.js'];
    }

    return [];
}

describe('Direct Classic Script Smoke Coverage', () => {
    for (const sourceFile of CLASSIC_SOURCE_FILES) {
        it(`loads ${sourceFile} without top-level runtime errors`, () => {
            const { window, cleanup } = createBootstrappedWindow({ loadCoreScripts: false });

            const prerequisites = prerequisitesFor(sourceFile);
            if (prerequisites.length > 0) {
                loadLegacyScripts(window, prerequisites);
            }

            if (!prerequisites.includes(sourceFile)) {
                loadLegacyScripts(window, [sourceFile]);
            }

            cleanup();
        });
    }
});

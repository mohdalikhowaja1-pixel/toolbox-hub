/* ============================================================
   MyToolX Global Language Switcher — Injector (v3)
   - Inserts switcher right AFTER the theme toggle button
   - Keeps the user on the SAME page when switching languages
   - Safe on any header layout, never crashes
   ============================================================ */
(function () {
    'use strict';

    // --- 1. Detect current language from URL ---
    var path = window.location.pathname;
    var isEs = /\/es(\/|$)/.test(path);
    var isFr = /\/fr(\/|$)/.test(path);
    var currentLang = isEs ? 'es' : isFr ? 'fr' : 'en';

    // --- 2. Root prefix for links ---
    var rootPrefix = (isEs || isFr) ? '../' : '';

    // --- 3. Get current filename (e.g., word-scramble.html) ---
    var currentFile = path.substring(path.lastIndexOf('/') + 1);
    if (!currentFile) currentFile = 'index.html'; // Fallback if hitting just the folder path

    // --- 4. SVG flags (inline = zero HTTP requests) ---
    var FLAGS = {
        en: '<svg class="mtx-flag" viewBox="0 0 640 480"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/><path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/></svg>',
        es: '<svg class="mtx-flag" viewBox="0 0 640 480"><path fill="#c60b1e" d="M0 0h640v480H0z"/><path fill="#ffc400" d="M0 120h640v240H0z"/></svg>',
        fr: '<svg class="mtx-flag" viewBox="0 0 640 480"><path fill="#002395" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ed2939" d="M426.7 0H640v480H426.7z"/></svg>'
    };

    var LABELS = {
        en: { short: 'EN', full: 'English' },
        es: { short: 'ES', full: 'Español' },
        fr: { short: 'FR', full: 'Français' }
    };

    // --- 5. Build switcher HTML ---
    function buildSwitcher() {
        var current = LABELS[currentLang];
        var menu = '';
        ['en', 'es', 'fr'].forEach(function (code) {
            // Build the correct URL keeping the current filename
            var href;
            if (code === 'en') {
                href = rootPrefix + currentFile;
            } else {
                href = rootPrefix + code + '/' + currentFile;
            }
            
            var cls = code === currentLang ? ' class="mtx-current"' : '';
            menu += '<a href="' + href + '"' + cls + '>' + FLAGS[code] + '<span>' + LABELS[code].full + '</span></a>';
        });

        return (
            '<div class="mtx-lang-switcher" id="mtx-lang-switcher">' +
                '<button class="mtx-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Change language">' +
                    FLAGS[currentLang] +
                    '<span class="mtx-lang-name">' + current.full + '</span>' +
                    '<span class="mtx-caret" aria-hidden="true">▼</span>' +
                '</button>' +
                '<div class="mtx-lang-menu" role="menu">' + menu + '</div>' +
            '</div>'
        );
    }

    // --- 6. Find the best anchor: RIGHT AFTER theme toggle ---
    function findAnchor() {
        var themeBtn = document.getElementById('themeToggle');
        if (themeBtn && themeBtn.parentNode) {
            return { node: themeBtn, mode: 'after' };
        }

        var header = document.querySelector('header');
        if (!header) return null;

        var candidates = [
            header.querySelector('.flex.items-center.gap-1\\.5'),
            header.querySelector('.flex.items-center.gap-1'),
            header.querySelector('.flex.items-center.justify-between'),
            header.querySelector('.flex.items-center')
        ];
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i]) return { node: candidates[i], mode: 'append' };
        }
        return { node: header, mode: 'append' };
    }

    // --- 7. Inject + wire up ---
    function inject() {
        if (document.getElementById('mtx-lang-switcher')) return;

        var anchor = findAnchor();
        if (!anchor || !anchor.node) return;

        if (anchor.mode === 'after') {
            anchor.node.insertAdjacentHTML('afterend', buildSwitcher());
        } else {
            anchor.node.insertAdjacentHTML('beforeend', buildSwitcher());
        }

        var root = document.getElementById('mtx-lang-switcher');
        var btn = root.querySelector('.mtx-lang-btn');

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = root.classList.toggle('open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        document.addEventListener('click', function () {
            if (root.classList.contains('open')) {
                root.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && root.classList.contains('open')) {
                root.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // --- 8. Language switcher temporarily disabled ---
// Enable again when translated pages are ready.
return;
})();
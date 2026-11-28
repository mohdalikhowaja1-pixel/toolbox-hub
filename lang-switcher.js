/* MyToolX language switcher
   Uses only explicit hreflang links already present in the current page.
   It never probes URLs, fetches files, or redirects automatically.
   Add Spanish/French options only after their matching pages are complete.
*/
(function () {
  'use strict';

  function init() {
    if (document.getElementById('mtx-lang-switcher')) return;

    var alternates = Array.prototype.slice.call(
      document.querySelectorAll('link[rel="alternate"][hreflang][href]')
    );
    var supported = {};
    alternates.forEach(function (link) {
      var code = (link.getAttribute('hreflang') || '').toLowerCase();
      if (code === 'en' || code === 'es' || code === 'fr') {
        supported[code] = link.href;
      }
    });

    // Keep language navigation on the local HTTP preview when testing locally.
    // SEO hreflang/canonical tags remain untouched and continue pointing to production.
    function adaptHrefForLocalPreview(href) {
      var hostname = window.location.hostname.toLowerCase();
      var isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' ||
        hostname === '::1' || hostname.slice(-10) === '.localhost';
      if (!isLocalHost || (window.location.protocol !== 'http:' &&
          window.location.protocol !== 'https:')) return href;
      var target = new URL(href, window.location.href);
      return window.location.origin + target.pathname + target.search + target.hash;
    }

    Object.keys(supported).forEach(function (code) {
      supported[code] = adaptHrefForLocalPreview(supported[code]);
    });

    var currentPath = window.location.pathname;
    var currentLang = /^\/es(?:\/|$)/i.test(currentPath) ? 'es' :
                      /^\/fr(?:\/|$)/i.test(currentPath) ? 'fr' : 'en';
    if (!supported[currentLang]) supported[currentLang] = window.location.href;

    var labels = {
      en: { name: 'English', flag: '🇬🇧' },
      es: { name: 'Español', flag: '🇪🇸' },
      fr: { name: 'Français', flag: '🇫🇷' }
    };
    var codes = ['en', 'es', 'fr'].filter(function (code) {
      return Boolean(supported[code]);
    });
    if (codes.length < 2) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'mtx-lang-switcher';
    wrapper.id = 'mtx-lang-switcher';

    var button = document.createElement('button');
    button.className = 'mtx-lang-btn';
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Change language');
    button.innerHTML = '<span aria-hidden="true">' + labels[currentLang].flag +
      '</span><span class="mtx-lang-name">' + labels[currentLang].name +
      '</span><span class="mtx-caret" aria-hidden="true">▼</span>';

    var menu = document.createElement('div');
    menu.className = 'mtx-lang-menu';
    menu.setAttribute('role', 'menu');

    codes.forEach(function (code) {
      var link = document.createElement('a');
      link.href = supported[code];
      link.setAttribute('role', 'menuitem');
      if (code === currentLang) {
        link.className = 'mtx-current';
        link.setAttribute('aria-current', 'page');
      }
      var flag = document.createElement('span');
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = labels[code].flag;
      var name = document.createElement('span');
      name.textContent = labels[code].name;
      link.appendChild(flag);
      link.appendChild(name);
      menu.appendChild(link);
    });

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      var open = wrapper.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      wrapper.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        wrapper.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    wrapper.appendChild(button);
    wrapper.appendChild(menu);

    var themeButton = document.getElementById('themeToggle');
    if (themeButton && themeButton.parentNode) {
      themeButton.insertAdjacentElement('afterend', wrapper);
    } else {
      var header = document.querySelector('header');
      if (header) header.appendChild(wrapper);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

(function () {
  var dict = (typeof I18N !== 'undefined') ? I18N : { en: {}, es: {} };
  var SUPPORTED = ['en', 'es'];
  var STORAGE_KEY = 'lhs-lang';

  function detectLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (SUPPORTED.indexOf(q) > -1) return q;
      var saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.indexOf(saved) > -1) return saved;
    } catch (e) {}
    return (navigator.language || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }

  var lang = detectLang();

  function t(key) {
    var v = (dict[lang] && dict[lang][key]);
    if (v === undefined) v = dict.en && dict.en[key];
    return v || '';
  }

  var menuButton = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');

  function setMenuLabel() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-label', t(nav.classList.contains('is-open') ? 'nav.close' : 'nav.open'));
  }

  function applyLang() {
    var d = document;
    d.documentElement.lang = lang;

    d.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v) el.innerHTML = v;
    });
    d.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-alt'));
      if (v) el.setAttribute('alt', v);
    });
    d.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-aria'));
      if (v) el.setAttribute('aria-label', v);
    });

    var titleKey = d.documentElement.getAttribute('data-title-key');
    d.title = titleKey ? t(titleKey) + ' — Luis Henrique Souza' : t('meta.title');
    var meta = d.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t(d.documentElement.getAttribute('data-desc-key') || 'meta.desc'));

    d.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    setMenuLabel();
  }

  document.querySelectorAll('.lang-switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      applyLang();
    });
  });

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      setMenuLabel();
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        setMenuLabel();
      });
    });
  }

  var year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  // Formatos aceitos nas imagens locais. Para aceitar outro formato, acrescente aqui.
  var EXTS = ['jpg', 'png', 'gif', 'webp', 'jpeg'];

  // ---------- Capas dos projetos ----------
  // Usa assets/projects/<projeto>/cover.(jpg|png|gif|webp|jpeg) se o arquivo existir.
  // Se não existir, a imagem que já está no HTML (link do Framer) continua sendo usada.
  var useLocalCover = function (img, base) {
    var i = 0;
    (function next() {
      if (i >= EXTS.length) return;
      var probe = new Image();
      probe.onload = function () { img.removeAttribute('srcset'); img.src = probe.src; };
      probe.onerror = function () { i++; next(); };
      probe.src = base + '.' + EXTS[i];
    })();
  };

  document.querySelectorAll('a.project[href*="projects/"] .project-image img').forEach(function (img) {
    var m = img.closest('a.project').getAttribute('href').match(/projects\/([^\/.]+)\.html/);
    if (m) useLocalCover(img, 'assets/projects/' + m[1] + '/cover');
  });

  var coverImg = document.querySelector('.project-cover img');
  var galleryEl = document.querySelector('.project-gallery[data-folder]');
  if (coverImg && galleryEl) {
    useLocalCover(coverImg, '../assets/projects/' + galleryEl.getAttribute('data-folder') + '/cover');
  }

  // ---------- Galeria dos projetos ----------
  // Procura assets/projects/<pasta>/01 ... NN em vários formatos.
  var gallery = galleryEl;
  if (gallery) {
    var folder = gallery.getAttribute('data-folder');
    var max = parseInt(gallery.getAttribute('data-max') || '8', 10);

    var addSlot = function (n) {
      var name = (n < 10 ? '0' : '') + n;
      var fig = document.createElement('figure');
      fig.className = 'gallery-item';
      var img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      var tried = 0;
      img.onerror = function () {
        tried++;
        if (tried < EXTS.length) {
          img.src = '../assets/projects/' + folder + '/' + name + '.' + EXTS[tried];
        } else {
          fig.remove();
        }
      };
      img.src = '../assets/projects/' + folder + '/' + name + '.' + EXTS[0];
      fig.appendChild(img);
      gallery.appendChild(fig);
    };

    for (var n = 1; n <= max; n++) addSlot(n);
  }

  applyLang();
})();

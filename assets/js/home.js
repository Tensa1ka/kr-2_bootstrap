/* Главная: лампа осмотра в первом экране, превью услуг, до/после, отзывы. */
(function () {
  'use strict';

  const B = window.Blik;
  const api = window.BlikAPI;

  /*
   * Лампа: светлое пятно открывает «отполированную» версию кадра поверх матовой.
   * Один проход при загрузке, дальше пятно следует за курсором.
   */
  function initLamp() {
    const hero = B.$('[data-lamp]');
    if (!hero) return;
    const rest = { x: 70, y: 46 };
    const pos = { x: rest.x, y: rest.y };
    let target = { x: rest.x, y: rest.y };
    let frame = null;

    function apply() {
      hero.style.setProperty('--lx', pos.x.toFixed(2) + '%');
      hero.style.setProperty('--ly', pos.y.toFixed(2) + '%');
    }

    function follow() {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      apply();
      if (Math.abs(target.x - pos.x) > 0.05 || Math.abs(target.y - pos.y) > 0.05) {
        frame = requestAnimationFrame(follow);
      } else {
        frame = null;
      }
    }

    function moveTo(x, y) {
      target = { x: x, y: y };
      if (!frame) frame = requestAnimationFrame(follow);
    }

    apply();
    if (B.reduceMotion) return;

    // Первый проход лампы слева направо
    const start = performance.now();
    const duration = 1800;
    let introDone = false;
    function intro(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      pos.x = -20 + (rest.x + 20) * eased;
      apply();
      if (t < 1) requestAnimationFrame(intro);
      else introDone = true;
    }
    requestAnimationFrame(intro);

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    hero.addEventListener('pointermove', function (e) {
      if (!introDone) return;
      const r = hero.getBoundingClientRect();
      moveTo(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    });
    hero.addEventListener('pointerleave', function () {
      if (introDone) moveTo(rest.x, rest.y);
    });
  }

  function renderServices(list) {
    const root = B.$('#services-preview');
    const key = list.filter(function (s) {
      return s.key;
    });
    const feature =
      key.find(function (s) {
        return s.slug === 'ceramic';
      }) || key[0];
    const rest = key.filter(function (s) {
      return s !== feature;
    });

    root.innerHTML =
      '<a class="svc-feature" href="services.html#' +
      feature.slug +
      '">' +
      '<img src="' +
      B.esc(feature.image) +
      '" alt="" width="1400" height="1750" loading="lazy" decoding="async">' +
      '<span class="svc-feature__body"><span class="svc-feature__title">' +
      B.esc(feature.title) +
      '</span>' +
      '<span class="muted">' +
      B.esc(feature.short) +
      '</span>' +
      '<span class="price-from">от ' +
      B.price(feature.priceFrom) +
      ', ' +
      B.esc(feature.duration) +
      '</span></span></a>' +
      '<div class="svc-list">' +
      rest
        .map(function (s) {
          return (
            '<a class="svc-row" href="services.html#' +
            s.slug +
            '">' +
            '<img src="' +
            B.esc(s.image) +
            '" alt="" width="112" height="112" loading="lazy" decoding="async">' +
            '<span class="svc-row__body"><span class="svc-row__title">' +
            B.esc(s.title) +
            '</span>' +
            '<span class="svc-row__text">' +
            B.esc(s.short) +
            '</span>' +
            '<span class="price-from">от ' +
            B.price(s.priceFrom) +
            '</span></span></a>'
          );
        })
        .join('') +
      '</div>';
  }

  function renderBeforeAfter(data) {
    const works = data[0];
    const services = data[1];
    const titles = {};
    services.forEach(function (s) {
      titles[s.slug] = s.title;
    });

    const tablist = B.$('#ba-tabs');
    const panel = B.$('#ba-panel');
    tablist.innerHTML = works
      .map(function (w, i) {
        return (
          '<button class="nav-link" type="button" role="tab" id="ba-tab-' +
          i +
          '" aria-controls="ba-panel" data-index="' +
          i +
          '">' +
          B.esc(w.car) +
          '</button>'
        );
      })
      .join('');

    B.initTabs(tablist, function (tab) {
      const w = works[Number(tab.dataset.index)];
      panel.setAttribute('aria-labelledby', tab.id);
      panel.innerHTML = B.beforeAfterHTML(w, titles[w.service]);
      B.initBeforeAfter(panel);
    });
  }

  function renderReviews(data) {
    const res = data[0];
    const services = data[1];
    const contacts = data[2];
    const titles = {};
    services.forEach(function (s) {
      titles[s.slug] = s.title;
    });
    const root = B.$('#reviews-home');
    const r = contacts.rating;
    root.innerHTML =
      '<div class="rating-summary">' +
      '<p class="rating-summary__value">' +
      String(r.value).replace('.', ',') +
      '</p>' +
      B.stars(Math.round(r.value)).replace(
        'Оценка ' + Math.round(r.value),
        'Средняя оценка ' + String(r.value).replace('.', ','),
      ) +
      '<p class="muted">' +
      r.count +
      ' ' +
      B.plural(r.count, ['отзыв', 'отзыва', 'отзывов']) +
      ' на ' +
      B.esc(r.sources) +
      '</p>' +
      '</div>' +
      res.items
        .map(function (item) {
          return B.reviewCard(item, titles[item.service]);
        })
        .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLamp();

    B.load(
      B.$('#services-preview'),
      api.getServices,
      renderServices,
      'Не удалось загрузить услуги. Обновите страницу или откройте раздел «Услуги и цены».',
    );

    B.load(
      B.$('#ba-panel'),
      function () {
        return Promise.all([api.getBeforeAfter({ limit: 2 }), api.getServices()]);
      },
      renderBeforeAfter,
      'Не удалось загрузить работы. Попробуйте ещё раз.',
    );

    B.load(
      B.$('#reviews-home'),
      function () {
        return Promise.all([
          api.getReviews({ sort: 'high', perPage: 3 }),
          api.getServices(),
          api.getContacts(),
        ]);
      },
      renderReviews,
      'Не удалось загрузить отзывы. Их можно прочитать на странице «Портфолио и отзывы».',
    );
  });
})();

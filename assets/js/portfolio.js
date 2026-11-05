/* Портфолио и отзывы: галерея с фильтром и просмотром, до/после, все отзывы. */
(function () {
  'use strict';

  const B = window.Blik;
  const api = window.BlikAPI;

  let services = [];
  const titles = {};
  let works = [];
  let lightbox = null;

  /* ---------- Галерея ---------- */
  function renderFilter(all, active) {
    const counts = {};
    all.forEach(function (w) {
      w.services.forEach(function (s) {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    const chips = [{ slug: '', title: 'Все работы', count: all.length }].concat(
      services.map(function (s) {
        return { slug: s.slug, title: s.title, count: counts[s.slug] || 0 };
      }),
    );
    B.$('#gallery-filter').innerHTML = chips
      .map(function (c) {
        return (
          '<button class="chip" type="button" data-filter="' +
          c.slug +
          '" aria-pressed="' +
          (c.slug === active) +
          '">' +
          B.esc(c.title) +
          ' <span class="chip__count">' +
          c.count +
          '</span></button>'
        );
      })
      .join('');
  }

  function renderGallery(list) {
    works = list;
    const root = B.$('#gallery');
    if (!list.length) {
      root.innerHTML =
        '<div class="empty" style="grid-column: 1 / -1"><p>По этой услуге работ в портфолио пока нет. Фото появятся, как только закончим первые машины.</p>' +
        '<button class="btn btn-outline-light btn-sm" type="button" data-filter="">Показать все работы</button></div>';
      return;
    }
    root.innerHTML = list
      .map(function (w, i) {
        const mod = w.size ? ' gallery__item--' + w.size : '';
        return (
          '<button class="gallery__item' +
          mod +
          '" type="button" data-work="' +
          i +
          '" aria-haspopup="dialog">' +
          '<img src="' +
          B.esc(w.image) +
          '" alt="' +
          B.esc(w.alt) +
          '" width="1400" height="933" loading="lazy" decoding="async">' +
          '<span class="gallery__caption"><strong>' +
          B.esc(w.car) +
          '</strong><span>' +
          B.esc(
            w.services
              .map(function (s) {
                return titles[s];
              })
              .join(', '),
          ) +
          '</span></span></button>'
        );
      })
      .join('');
  }

  function applyFilter(slug) {
    B.$$('#gallery-filter [data-filter]').forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === slug));
    });
    const url = new URL(location.href);
    if (slug) url.searchParams.set('service', slug);
    else url.searchParams.delete('service');
    history.replaceState(null, '', url.pathname + url.search + url.hash);

    B.load(
      B.$('#gallery'),
      function () {
        return api.getPortfolio({ service: slug });
      },
      function (list) {
        renderGallery(list);
        B.$('#gallery-status').textContent =
          'Показано ' + list.length + ' ' + B.plural(list.length, ['работа', 'работы', 'работ']);
      },
      'Не удалось загрузить работы. Попробуйте ещё раз.',
    );
  }

  function openWork(index) {
    const w = works[index];
    if (!w) return;
    if (!lightbox) {
      lightbox = B.createDialog('work', '', 'dialog--wide');
      lightbox.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') openWork((Number(lightbox.dataset.index) + 1) % works.length);
        if (e.key === 'ArrowLeft')
          openWork((Number(lightbox.dataset.index) - 1 + works.length) % works.length);
      });
    }
    lightbox.dataset.index = index;
    B.$('.dialog__title', lightbox).textContent = w.car;
    B.$('.dialog__body', lightbox).innerHTML =
      '<img class="lightbox__img" src="' +
      B.esc(w.image) +
      '" alt="' +
      B.esc(w.alt) +
      '" width="1400" height="933">' +
      '<p>' +
      B.esc(w.text) +
      '</p>' +
      '<dl class="meta" style="max-width: 520px">' +
      '<div><dt>Услуги</dt><dd>' +
      B.esc(
        w.services
          .map(function (s) {
            return titles[s];
          })
          .join(', '),
      ) +
      '</dd></div>' +
      '<div><dt>Срок</dt><dd>' +
      B.esc(w.duration) +
      '</dd></div></dl>' +
      '<div class="lightbox__nav">' +
      '<button class="btn btn-outline-light btn-sm" type="button" data-step="-1">Предыдущая работа</button>' +
      '<span class="muted" aria-live="polite">' +
      (index + 1) +
      ' из ' +
      works.length +
      '</span>' +
      '<button class="btn btn-outline-light btn-sm" type="button" data-step="1">Следующая работа</button></div>' +
      '<a class="btn btn-light" href="about.html#request" data-booking data-service="' +
      w.services[0] +
      '" data-comment="Хочу так же, как ' +
      B.esc(w.car) +
      ' из портфолио">Хочу так же</a>';
    B.$$('[data-step]', lightbox).forEach(function (btn) {
      btn.addEventListener('click', function () {
        openWork((index + Number(btn.dataset.step) + works.length) % works.length);
        B.$('[data-step="' + btn.dataset.step + '"]', lightbox).focus();
      });
    });
    B.openDialog(lightbox);
  }

  /* ---------- До / после ---------- */
  function renderBeforeAfter(list) {
    const tablist = B.$('#ba-tabs');
    const panel = B.$('#ba-panel');
    tablist.innerHTML = list
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
      const w = list[Number(tab.dataset.index)];
      panel.setAttribute('aria-labelledby', tab.id);
      panel.innerHTML = B.beforeAfterHTML(w, titles[w.service]);
      B.initBeforeAfter(panel);
    });
  }

  /* ---------- Отзывы ---------- */
  const reviewState = { service: '', sort: 'new', page: 1 };

  function renderSummary(summary) {
    const avg = String(summary.average).replace('.', ',');
    B.$('#reviews-summary').innerHTML =
      '<div class="rating-summary"><p class="rating-summary__value">' +
      avg +
      '</p>' +
      B.stars(Math.round(summary.average)).replace(
        'Оценка ' + Math.round(summary.average),
        'Средняя оценка ' + avg,
      ) +
      '<p class="muted">' +
      summary.count +
      ' ' +
      B.plural(summary.count, ['отзыв', 'отзыва', 'отзывов']) +
      ' на сайте</p></div>' +
      '<div class="dist">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          const c = summary.distribution[n] || 0;
          const pct = summary.count ? Math.round((c / summary.count) * 100) : 0;
          return (
            '<div class="dist__row"><span>' +
            n +
            ' ' +
            B.plural(n, ['звезда', 'звезды', 'звёзд']) +
            '</span>' +
            '<span class="dist__bar" role="img" aria-label="' +
            pct +
            '% отзывов"><span style="width: ' +
            pct +
            '%"></span></span><span>' +
            c +
            '</span></div>'
          );
        })
        .join('') +
      '</div>' +
      '<button class="btn btn-light" type="button" id="review-open" aria-haspopup="dialog">Оставить отзыв</button>';
    B.$('#review-open').addEventListener('click', openReviewForm);
  }

  function loadReviews(append) {
    const list = B.$('#reviews-list');
    const more = B.$('#reviews-more');
    const loader = function () {
      return api.getReviews(Object.assign({ perPage: 6 }, reviewState));
    };
    const target = append ? more : list;

    B.load(
      target,
      loader,
      function (res) {
        if (!append) renderSummary(res.summary);
        const html = res.items
          .map(function (r) {
            return B.reviewCard(r, titles[r.service]);
          })
          .join('');
        if (append) list.insertAdjacentHTML('beforeend', html);
        else
          list.innerHTML =
            html ||
            '<div class="empty" style="grid-column: 1 / -1"><p>По этой услуге отзывов пока нет. Станьте первым, кто его оставит.</p></div>';

        const shown = Math.min(res.page * 6, res.total);
        B.$('#reviews-status').textContent = 'Показано ' + shown + ' из ' + res.total;
        more.innerHTML =
          res.page < res.pages
            ? '<button class="btn btn-outline-light" type="button" id="reviews-next">Показать ещё ' +
              Math.min(6, res.total - shown) +
              '</button>'
            : '';
        const next = B.$('#reviews-next');
        if (next)
          next.addEventListener('click', function () {
            reviewState.page += 1;
            loadReviews(true);
          });
      },
      'Не удалось загрузить отзывы. Попробуйте ещё раз.',
    );
  }

  let reviewDialog = null;
  function openReviewForm() {
    if (!reviewDialog) reviewDialog = B.createDialog('review-form', 'Отзыв о студии');
    const body = B.$('.dialog__body', reviewDialog);
    const star = B.icons.star;
    body.innerHTML =
      '<form class="form" id="rv-form" novalidate>' +
      '<fieldset class="fieldset"><legend class="form-label" style="font-family: var(--f-body); font-size: var(--fs-s); margin-bottom: 8px">Оценка</legend>' +
      '<div class="star-input" id="rv-rating" data-required-group data-msg="Поставьте оценку от 1 до 5">' +
      [5, 4, 3, 2, 1]
        .map(function (n) {
          return (
            '<input type="radio" id="rv-r' +
            n +
            '" name="rating" value="' +
            n +
            '"><label for="rv-r' +
            n +
            '" title="' +
            n +
            ' из 5">' +
            star +
            '<span class="visually-hidden">' +
            n +
            ' из 5</span></label>'
          );
        })
        .join('') +
      '</div><span class="field__error invalid-feedback d-block" id="rv-rating-error"></span></fieldset>' +
      '<div class="row g-3">' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="rv-name">Имя</label><input class="form-control" id="rv-name" name="name" autocomplete="given-name" required aria-describedby="rv-name-error" data-msg="Напишите имя — оно появится под отзывом"><span class="field__error invalid-feedback d-block" id="rv-name-error"></span></div>' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="rv-car">Автомобиль</label><input class="form-control" id="rv-car" name="car" placeholder="Например, Kia Sportage"></div>' +
      '</div>' +
      '<div class="field"><label class="form-label" for="rv-svc">Какую услугу делали</label><select class="form-select" id="rv-svc" name="service">' +
      '<option value="">Не помню или несколько</option>' +
      services
        .map(function (s) {
          return '<option value="' + s.slug + '">' + B.esc(s.title) + '</option>';
        })
        .join('') +
      '</select></div>' +
      '<div class="field"><label class="form-label" for="rv-text">Отзыв</label><textarea class="form-control" id="rv-text" name="text" rows="5" required minlength="20" aria-describedby="rv-text-error" data-msg="Расскажите, что понравилось или что можно улучшить"></textarea><span class="field__error invalid-feedback d-block" id="rv-text-error"></span></div>' +
      '<div class="field"><label class="check" for="rv-consent"><input type="checkbox" id="rv-consent" name="consent" value="1" required aria-describedby="rv-consent-error">' +
      '<span>Согласен на публикацию отзыва и обработку данных по <a class="text-link" href="#policy" data-policy>политике конфиденциальности</a></span></label><span class="field__error invalid-feedback d-block" id="rv-consent-error"></span></div>' +
      '<p class="form__status" aria-live="polite"></p>' +
      '<button class="btn btn-light w-100" type="submit">Отправить отзыв</button></form>';

    B.handleSubmit(
      B.$('#rv-form', body),
      function (payload) {
        payload.rating = Number(payload.rating);
        return api.createReview(payload);
      },
      function () {
        body.innerHTML = B.successBlock(
          'Отзыв отправлен',
          'Опубликуем после проверки, обычно в течение дня. Спасибо, что нашли время.',
          'Закрыть',
        );
        B.$('[data-close]', body).focus();
      },
    );
    B.openDialog(reviewDialog);
  }

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const initial = new URLSearchParams(location.search).get('service') || '';

    B.load(
      B.$('#gallery'),
      function () {
        return Promise.all([api.getServices(), api.getPortfolio()]);
      },
      function (data) {
        services = data[0];
        services.forEach(function (s) {
          titles[s.slug] = s.title;
        });
        const valid = services.some(function (s) {
          return s.slug === initial;
        })
          ? initial
          : '';
        renderFilter(data[1], valid);
        if (valid) applyFilter(valid);
        else renderGallery(data[1]);

        const select = B.$('#rv-service');
        services.forEach(function (s) {
          select.add(new Option(s.title, s.slug));
        });

        B.load(
          B.$('#ba-panel'),
          api.getBeforeAfter,
          renderBeforeAfter,
          'Не удалось загрузить работы «до и после».',
        );
        loadReviews(false);
      },
      'Не удалось загрузить портфолио. Попробуйте ещё раз.',
    );

    document.addEventListener('click', function (e) {
      const f = e.target.closest('[data-filter]');
      if (f) applyFilter(f.dataset.filter);
      const w = e.target.closest('[data-work]');
      if (w) openWork(Number(w.dataset.work));
    });

    B.$('#reviews-controls').addEventListener('change', function (e) {
      reviewState[e.target.name] = e.target.value;
      reviewState.page = 1;
      loadReviews(false);
    });
  });
})();

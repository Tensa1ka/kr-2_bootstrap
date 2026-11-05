/* Услуги и цены: карточки, детали в модальном окне, сводный прайс, калькулятор. */
(function () {
  'use strict';

  const B = window.Blik;
  const api = window.BlikAPI;

  let services = [];
  let classes = [];
  let detailDialog = null;

  /* ---------- Карточки ---------- */
  function renderCards() {
    B.$('#svc-grid').innerHTML = services
      .map(function (s) {
        return (
          '<div class="col"><article class="svc-card card h-100" id="card-' +
          s.slug +
          '">' +
          '<img class="svc-card__img card-img-top" src="' +
          B.esc(s.image) +
          '" alt="' +
          B.esc(s.alt) +
          '" width="1400" height="933" loading="lazy" decoding="async">' +
          '<div class="svc-card__body card-body">' +
          '<h3 class="svc-card__title">' +
          B.esc(s.title) +
          '</h3>' +
          '<p class="svc-card__text">' +
          B.esc(s.short) +
          '</p>' +
          '<dl class="meta">' +
          '<div><dt>Цена</dt><dd class="price-from">от ' +
          B.price(s.priceFrom) +
          '</dd></div>' +
          '<div><dt>Срок</dt><dd>' +
          B.esc(s.duration) +
          '</dd></div>' +
          '<div class="meta__wide"><dt>Гарантия</dt><dd>' +
          B.esc(s.warranty) +
          '</dd></div>' +
          '</dl>' +
          '<div class="svc-card__actions">' +
          '<button class="btn btn-outline-light btn-sm" type="button" data-detail="' +
          s.slug +
          '" aria-haspopup="dialog">Этапы, цены и вопросы</button>' +
          '<a class="btn btn-light btn-sm" href="about.html#request" data-booking data-service="' +
          s.slug +
          '">Записаться</a>' +
          '</div></div></article></div>'
        );
      })
      .join('');
  }

  /* ---------- Детали услуги ---------- */
  function openDetail(slug, updateHash) {
    const s = services.find(function (x) {
      return x.slug === slug;
    });
    if (!s) return;
    if (!detailDialog) {
      detailDialog = B.createDialog('service-detail', '', 'dialog--wide');
      detailDialog.addEventListener('close', function () {
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      });
    }
    B.$('.dialog__title', detailDialog).textContent = s.title;
    B.$('.dialog__body', detailDialog).innerHTML =
      '<img class="dialog__cover" src="' +
      B.esc(s.image) +
      '" alt="' +
      B.esc(s.alt) +
      '" width="1400" height="533">' +
      '<div class="svc-detail">' +
      '<div class="svc-detail__main">' +
      '<p>' +
      B.esc(s.description) +
      '</p>' +
      '<div><h3 class="subhead">Этапы работы</h3><ol class="stages">' +
      s.stages
        .map(function (st) {
          return (
            '<li class="stages__item"><div><strong>' +
            B.esc(st.title) +
            '</strong><span>' +
            B.esc(st.text) +
            '</span></div></li>'
          );
        })
        .join('') +
      '</ol></div>' +
      '<div><h3 class="subhead">Частые вопросы</h3><div class="faq">' +
      s.faq
        .map(function (f) {
          return (
            '<details class="faq__item"><summary class="faq__q">' +
            B.esc(f.q) +
            '</summary><p class="faq__a">' +
            B.esc(f.a) +
            '</p></details>'
          );
        })
        .join('') +
      '</div></div>' +
      '</div>' +
      '<aside class="svc-detail__aside" aria-label="Сроки и цены">' +
      '<dl class="meta" style="border-top: 0; padding-top: 0">' +
      '<div><dt>Срок</dt><dd>' +
      B.esc(s.duration) +
      '</dd></div>' +
      '<div><dt>Цена</dt><dd class="price-from">от ' +
      B.price(s.priceFrom) +
      '</dd></div>' +
      '<div class="meta__wide"><dt>Гарантия</dt><dd>' +
      B.esc(s.warranty) +
      '</dd></div>' +
      '</dl>' +
      '<div><h3 class="subhead">Варианты, от</h3><div class="variant-prices">' +
      s.variants
        .map(function (v) {
          return (
            '<div class="variant-prices__row"><span>' +
            B.esc(v.title) +
            '</span><strong>' +
            B.price(v.prices[0]) +
            ' — ' +
            B.price(v.prices[3]) +
            '</strong></div>'
          );
        })
        .join('') +
      '</div><p class="calc-summary__note" style="margin-top: 12px">От малого класса до внедорожников. Цены по каждому классу — в сводном прайсе.</p></div>' +
      '<a class="btn btn-light w-100" href="about.html#request" data-booking data-service="' +
      s.slug +
      '">Записаться на ' +
      B.esc(s.title.toLowerCase()) +
      '</a>' +
      '</aside></div>';
    B.openDialog(detailDialog);
    if (updateHash) history.replaceState(null, '', '#' + slug);
  }

  /* ---------- Прайс ---------- */
  function renderPriceTable(active) {
    const head =
      '<thead><tr><th scope="col">Услуга</th>' +
      classes
        .map(function (c) {
          return (
            '<th scope="col" data-c="' +
            c.id +
            '">' +
            B.esc(c.title) +
            '<span>' +
            B.esc(c.examples) +
            '</span></th>'
          );
        })
        .join('') +
      '</tr></thead>';
    const bodies = services
      .map(function (s) {
        return (
          '<tbody><tr class="price-table__group"><th scope="colgroup" colspan="' +
          (classes.length + 1) +
          '">' +
          B.esc(s.title) +
          '</th></tr>' +
          s.variants
            .map(function (v) {
              return (
                '<tr><th scope="row">' +
                B.esc(v.title) +
                '</th>' +
                v.prices
                  .map(function (p, i) {
                    return '<td data-c="' + classes[i].id + '">' + B.price(p) + '</td>';
                  })
                  .join('') +
                '</tr>'
              );
            })
            .join('') +
          '</tbody>'
        );
      })
      .join('');
    B.$('#price-wrap').innerHTML =
      '<table class="price-table table table-hover align-middle"><caption>Цены в рублях, указаны от. Финальная цена — после осмотра, до начала работ.</caption>' +
      head +
      bodies +
      '</table>';
    highlightClass(active);
  }

  function highlightClass(id) {
    B.$$('.price-table [data-c]').forEach(function (cell) {
      cell.classList.toggle('is-active', cell.dataset.c === String(id));
    });
  }

  function renderClassPicker(root, name, active, onChange) {
    root.className = 'radio-row';
    root.innerHTML = classes
      .map(function (c) {
        return (
          '<label class="pill-radio"><input type="radio" name="' +
          name +
          '" value="' +
          c.id +
          '"' +
          (c.id === active ? ' checked' : '') +
          '><span>' +
          B.esc(c.title) +
          '</span></label>'
        );
      })
      .join('');
    root.addEventListener('change', function (e) {
      onChange(Number(e.target.value));
    });
  }

  /* ---------- Калькулятор ---------- */
  const state = { carClass: 2, items: {} };

  function discountRate(count) {
    if (count >= 3) return 0.1;
    if (count === 2) return 0.05;
    return 0;
  }

  function durationDays(text) {
    // «1–3 дня» → 3, «3–5 часов» → 0.5
    const nums = (text.match(/\d+/g) || ['1']).map(Number);
    const max = Math.max.apply(null, nums);
    return /час/.test(text) ? 0.5 : max;
  }

  function computeEstimate() {
    const lines = [];
    services.forEach(function (s) {
      const variantId = state.items[s.slug];
      if (!variantId) return;
      const v = s.variants.find(function (x) {
        return x.id === variantId;
      });
      lines.push({
        service: s.slug,
        title: s.title,
        variant: v.title,
        price: v.prices[state.carClass - 1],
        days: durationDays(s.duration),
      });
    });
    const subtotal = lines.reduce(function (sum, l) {
      return sum + l.price;
    }, 0);
    const rate = discountRate(lines.length);
    const discount = Math.round((subtotal * rate) / 100) * 100;
    // Работы идут последовательно, но мойка и тонировка укладываются в один день с другими
    const days = Math.max(
      1,
      Math.ceil(
        lines.reduce(function (sum, l) {
          return sum + l.days;
        }, 0),
      ),
    );
    return {
      carClass: state.carClass,
      lines: lines,
      subtotal: subtotal,
      discountRate: rate,
      discount: discount,
      total: subtotal - discount,
      days: days,
    };
  }

  function renderCalc() {
    const root = B.$('#calc');
    root.innerHTML =
      '<form class="calc__form col-12 col-xl-8" id="calc-form">' +
      '<fieldset class="fieldset"><legend>Класс автомобиля</legend><div class="choice-grid">' +
      classes
        .map(function (c) {
          return (
            '<label class="choice"><input type="radio" name="carClass" value="' +
            c.id +
            '"' +
            (c.id === state.carClass ? ' checked' : '') +
            '>' +
            '<strong>' +
            B.esc(c.title) +
            '</strong><span>' +
            B.esc(c.examples) +
            '</span></label>'
          );
        })
        .join('') +
      '</div></fieldset>' +
      '<fieldset class="fieldset"><legend>Услуги</legend><div class="calc-items">' +
      services
        .map(function (s) {
          const id = 'calc-' + s.slug;
          return (
            '<div class="calc-item">' +
            '<label class="check check--inline" for="' +
            id +
            '"><input class="calc-item__check" type="checkbox" id="' +
            id +
            '" data-service="' +
            s.slug +
            '"><span>' +
            B.esc(s.title) +
            '</span></label>' +
            '<label class="visually-hidden" for="' +
            id +
            '-variant">Вариант услуги «' +
            B.esc(s.title) +
            '»</label>' +
            '<select class="form-select" id="' +
            id +
            '-variant" data-variant="' +
            s.slug +
            '" disabled>' +
            s.variants
              .map(function (v) {
                return '<option value="' + v.id + '">' + B.esc(v.title) + '</option>';
              })
              .join('') +
            '</select>' +
            '<span class="calc-item__price" data-price="' +
            s.slug +
            '"></span>' +
            '</div>'
          );
        })
        .join('') +
      '</div></fieldset>' +
      '</form>' +
      '<aside class="calc-summary col-12 col-xl-4" aria-labelledby="calc-summary-title">' +
      '<h3 class="h3" id="calc-summary-title">Ваш расчёт</h3>' +
      '<div class="calc-summary__lines" id="calc-lines"></div>' +
      '<div class="calc-summary__total"><span class="muted">Итого, от</span>' +
      '<output class="calc-summary__sum" id="calc-total" for="calc-form" aria-live="polite">0 ₽</output>' +
      '<span class="calc-summary__note" id="calc-days"></span></div>' +
      '<button class="btn btn-light booking-button-compact" type="button" id="calc-book" disabled>Записаться с этим расчётом</button>' +
      '<p class="calc-summary__note">Расчёт предварительный. Точную цену назовём после осмотра, и она не изменится в процессе работы.</p>' +
      '</aside>';

    const form = B.$('#calc-form');
    form.addEventListener('change', function (e) {
      const t = e.target;
      if (t.name === 'carClass') state.carClass = Number(t.value);
      if (t.dataset.service) {
        const select = B.$('[data-variant="' + t.dataset.service + '"]', form);
        select.disabled = !t.checked;
        if (t.checked) state.items[t.dataset.service] = select.value;
        else delete state.items[t.dataset.service];
      }
      if (t.dataset.variant) state.items[t.dataset.variant] = t.value;
      updateCalc();
    });

    B.$('#calc-book').addEventListener('click', function () {
      const est = computeEstimate();
      const cls = classes.find(function (c) {
        return c.id === est.carClass;
      });
      const comment =
        'Расчёт с сайта, ' +
        cls.title.toLowerCase() +
        ': ' +
        est.lines
          .map(function (l) {
            return l.title + ' (' + l.variant.toLowerCase() + ')';
          })
          .join('; ') +
        '. Итого от ' +
        B.price(est.total) +
        '.';
      B.openBooking({
        service: est.lines.length === 1 ? est.lines[0].service : '',
        comment: comment,
        estimate: est,
      });
    });

    updateCalc();
  }

  function updateCalc() {
    services.forEach(function (s) {
      const select = B.$('[data-variant="' + s.slug + '"]');
      const v = s.variants.find(function (x) {
        return x.id === select.value;
      });
      B.$('[data-price="' + s.slug + '"]').textContent = B.price(v.prices[state.carClass - 1]);
    });
    const est = computeEstimate();
    const lines = B.$('#calc-lines');
    if (!est.lines.length) {
      lines.innerHTML = '<p class="muted">Отметьте хотя бы одну услугу слева.</p>';
    } else {
      lines.innerHTML =
        est.lines
          .map(function (l) {
            return (
              '<div class="calc-summary__line"><span>' +
              B.esc(l.title) +
              '</span><span>' +
              B.price(l.price) +
              '</span></div>'
            );
          })
          .join('') +
        (est.discount
          ? '<div class="calc-summary__line muted"><span>Скидка ' +
            Math.round(est.discountRate * 100) +
            '% за ' +
            est.lines.length +
            ' ' +
            B.plural(est.lines.length, ['услугу', 'услуги', 'услуг']) +
            '</span><span>−' +
            B.price(est.discount) +
            '</span></div>'
          : '');
    }
    B.$('#calc-total').textContent = B.price(est.total);
    B.$('#calc-days').textContent = est.lines.length
      ? 'Срок около ' + est.days + ' ' + B.plural(est.days, ['дня', 'дней', 'дней'])
      : '';
    B.$('#calc-book').disabled = !est.lines.length;
  }

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    B.load(
      B.$('#svc-grid'),
      function () {
        return Promise.all([api.getServices(), api.getCarClasses()]);
      },
      function (data) {
        services = data[0];
        classes = data[1];
        renderCards();
        renderPriceTable(state.carClass);
        renderClassPicker(B.$('#price-classes'), 'price-class', state.carClass, highlightClass);
        renderCalc();

        const slug = location.hash.slice(1);
        if (
          services.some(function (s) {
            return s.slug === slug;
          })
        )
          openDetail(slug, false);
      },
      'Не удалось загрузить услуги и цены. Попробуйте ещё раз или позвоните нам.',
    );

    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-detail]');
      if (btn) openDetail(btn.dataset.detail, true);
    });

    window.addEventListener('hashchange', function () {
      const slug = location.hash.slice(1);
      if (
        services.some(function (s) {
          return s.slug === slug;
        })
      )
        openDetail(slug, false);
    });
  });
})();

/*
 * Общие компоненты всех страниц: шапка и мобильное меню, диалоги,
 * форма записи, маска телефона, валидация, слайдер «до/после», табы.
 */
(function () {
  'use strict';

  const api = window.BlikAPI;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STUDIO = { phone: '+7(495)-123-32-49', email: 'hello@blik-detailing.ru' };

  /* ---------- Утилиты ---------- */
  const $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  const $$ = function (sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  const priceFormat = new Intl.NumberFormat('ru-RU');
  function price(n) {
    return priceFormat.format(n) + ' ₽';
  }

  function date(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function plural(n, forms) {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
    return forms[2];
  }

  const icons = {
    close:
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 4l12 12M16 4 4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m10 1.8 2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/></svg>',
    check:
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="m6 14.5 5.5 5.5L22 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    handle:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6 3 12l6 6M15 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    telegram:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2 0 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8s.7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.8-1.1ZM9.6 14.1l8.6-7.6-6.9 8.8-.3 3.3-1.4-4.5Z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    max: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="6" stroke="currentColor" stroke-width="2"/><path d="M8 15V9l4 4 4-4v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    vk: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.8 17.5C6.9 17.5 3.5 13.5 3.4 6.8h3c.1 4.9 2.2 7 3.9 7.4V6.8h2.8v4.2c1.7-.2 3.5-2.1 4.1-4.2H20c-.5 2.6-2.4 4.5-3.8 5.3 1.4.6 3.6 2.4 4.4 5.4h-3.1c-.7-2.1-2.3-3.7-4.5-3.9v3.9h-.2Z"/></svg>',
  };

  function stars(rating) {
    let out = '<span class="stars" role="img" aria-label="Оценка ' + rating + ' из 5">';
    for (let i = 1; i <= 5; i += 1) {
      out += '<span class="' + (i <= rating ? '' : 'is-empty') + '">' + icons.star + '</span>';
    }
    return out + '</span>';
  }

  function reviewCard(r, serviceTitle) {
    return (
      '<figure class="review">' +
      stars(r.rating) +
      '<blockquote class="review__text"><p>' +
      esc(r.text) +
      '</p></blockquote>' +
      '<figcaption class="review__author"><strong>' +
      esc(r.name) +
      ', ' +
      esc(r.car) +
      '</strong>' +
      '<span class="review__meta">' +
      esc(serviceTitle || '') +
      (serviceTitle ? '. ' : '') +
      esc(r.source) +
      ', <time datetime="' +
      esc(r.date) +
      '">' +
      date(r.date) +
      '</time></span></figcaption>' +
      '</figure>'
    );
  }

  function loadError(message) {
    return (
      '<div class="load-error" role="alert"><p>' +
      esc(message) +
      '</p>' +
      '<button class="btn btn-outline-light btn-sm" type="button" data-retry>Повторить загрузку</button></div>'
    );
  }

  /** Показывает скелетон, вызывает загрузчик, при ошибке даёт кнопку повтора. */
  function load(container, loader, render, errorText) {
    container.setAttribute('aria-busy', 'true');
    return loader()
      .then(function (data) {
        container.removeAttribute('aria-busy');
        render(data);
        return data;
      })
      .catch(function (err) {
        container.removeAttribute('aria-busy');
        console.error(err);
        container.innerHTML = loadError(
          errorText || 'Не удалось загрузить данные. Проверьте соединение.',
        );
        $('[data-retry]', container).addEventListener('click', function () {
          load(container, loader, render, errorText);
        });
      });
  }

  function toast(message) {
    let el = $('#toast');
    if (!el) {
      const container = document.createElement('div');
      container.className =
        'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
      container.innerHTML =
        '<div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true"><div class="toast-body"></div></div>';
      document.body.appendChild(container);
      el = $('#toast');
    }
    $('.toast-body', el).textContent = message;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
  }

  function initHeader() {
    const header = $('.site-header');
    const menu = $('#mobile-menu');
    const onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    });
    window.matchMedia('(min-width: 1200px)').addEventListener('change', function (mq) {
      if (mq.matches) bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    });
  }

  /* Bootstrap owns focus trapping, Escape, backdrop and scroll locking. */
  function createDialog(id, title, extraClass) {
    const dialog = document.createElement('div');
    dialog.id = id;
    dialog.className = 'modal';
    dialog.tabIndex = -1;
    dialog.setAttribute('aria-labelledby', id + '-title');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.innerHTML =
      '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ' +
      (extraClass === 'dialog--wide' ? 'modal-xl' : 'modal-lg') +
      '"><div class="modal-content">' +
      '<div class="modal-header"><h2 class="dialog__title modal-title fs-4" id="' +
      id +
      '-title">' +
      esc(title) +
      '</h2>' +
      '<button class="btn-close" type="button" data-close aria-label="Закрыть"></button></div>' +
      '<div class="dialog__body modal-body"></div></div></div>';
    document.body.appendChild(dialog);
    dialog.close = function () {
      bootstrap.Modal.getOrCreateInstance(dialog).hide();
    };
    dialog.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) dialog.close();
    });
    dialog.addEventListener('hidden.bs.modal', function () {
      dialog.dispatchEvent(new Event('close'));
      // A policy may be opened from a form: restore the form and its focus.
      if (dialog.previousModal) {
        bootstrap.Modal.getOrCreateInstance(dialog.previousModal).show();
        dialog.previousModal = null;
      }
      if (dialog.returnFocus && dialog.returnFocus.isConnected) dialog.returnFocus.focus();
    });
    return dialog;
  }

  function openDialog(dialog) {
    if (dialog.classList.contains('show')) return;
    const show = function () {
      const previous = $('.modal.show');
      dialog.returnFocus = document.activeElement;
      if (previous && previous !== dialog) {
        bootstrap.Modal.getOrCreateInstance(previous).hide();
        dialog.previousModal = previous;
      }
      bootstrap.Modal.getOrCreateInstance(dialog).show();
      const first = $('input:not([type="hidden"]), textarea', dialog);
      if (first) first.focus();
    };
    const menu = $('.offcanvas.show, .offcanvas.showing, .offcanvas.hiding');
    if (menu) {
      menu.addEventListener('hidden.bs.offcanvas', show, { once: true });
      bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    } else show();
  }

  /* ---------- Телефон и валидация ---------- */
  function formatPhone(value) {
    let d = value.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function initPhoneMasks(root) {
    $$('input[type="tel"]', root).forEach(function (input) {
      input.addEventListener('input', function () {
        input.value = formatPhone(input.value);
      });
      input.addEventListener('focus', function () {
        if (!input.value) input.value = '+7 ';
      });
      input.addEventListener('blur', function () {
        if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
      });
    });
  }

  function setFieldError(field, message) {
    const errorEl = document.getElementById(field.id + '-error');
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.classList.toggle('is-invalid', !!message);
    if (errorEl) errorEl.textContent = message || '';
  }

  function fieldMessage(field) {
    if (field.type === 'checkbox')
      return field.required && !field.checked ? field.dataset.msg || 'Нужно ваше согласие' : '';
    const value = field.value.trim();
    if (field.required && !value) return field.dataset.msg || 'Заполните это поле';
    if (field.type === 'tel' && value && value.replace(/\D/g, '').length !== 11)
      return 'Введите номер полностью: +7 и 10 цифр';
    if (field.minLength > 0 && value && value.length < field.minLength)
      return (
        'Напишите хотя бы ' +
        field.minLength +
        ' ' +
        plural(field.minLength, ['символ', 'символа', 'символов'])
      );
    return '';
  }

  /** Проверяет форму, подсвечивает поля и фокусирует первое ошибочное. */
  function validate(form) {
    let first = null;
    $$('input, select, textarea', form).forEach(function (field) {
      if (!field.id || field.type === 'hidden' || field.disabled) return;
      if (field.type === 'radio') return;
      const msg = fieldMessage(field);
      setFieldError(field, msg);
      if (msg && !first) first = field;
    });
    $$('[data-required-group]', form).forEach(function (group) {
      const checked = $('input:checked', group);
      const errorEl = document.getElementById(group.id + '-error');
      if (errorEl) errorEl.textContent = checked ? '' : group.dataset.msg;
      if (!checked && !first) first = $('input', group);
    });
    if (first) first.focus();
    return !first;
  }

  function liveValidation(form) {
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true')
        setFieldError(e.target, fieldMessage(e.target));
    });
    form.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox' && e.target.id)
        setFieldError(e.target, fieldMessage(e.target));
      const group = e.target.closest('[data-required-group]');
      if (group) {
        const errorEl = document.getElementById(group.id + '-error');
        if (errorEl) errorEl.textContent = '';
      }
    });
  }

  /**
   * Общий обработчик отправки: валидация → запрос → экран успеха или текст ошибки.
   * submitFn(payload) должен вернуть промис из BlikAPI.
   */
  function handleSubmit(form, submitFn, onSuccess) {
    initPhoneMasks(form);
    liveValidation(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const status = $('.form__status', form);
      status.textContent = '';
      status.className = 'form__status';
      if (!validate(form)) return;

      const button = $('[type="submit"]', form);
      const label = button.textContent;
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = 'Отправляем…';

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.consent = !!payload.consent;

      submitFn(payload)
        .then(function (result) {
          onSuccess(result, payload);
        })
        .catch(function (err) {
          status.className = 'form__status form__status--error';
          status.setAttribute('role', 'alert');
          status.textContent =
            err && err.status === 503
              ? 'Сервер заявок не отвечает. Позвоните нам по номеру ' +
                STUDIO.phone +
                ' или напишите в Telegram.'
              : (err && err.message) ||
                'Не получилось отправить. Проверьте соединение и попробуйте ещё раз.';
        })
        .finally(function () {
          button.removeAttribute('aria-busy');
          button.disabled = false;
          button.textContent = label;
        });
    });
  }

  function successBlock(title, text, closeLabel) {
    return (
      '<div class="success" role="status"><span class="success__mark">' +
      icons.check +
      '</span>' +
      '<h3 class="h3">' +
      esc(title) +
      '</h3><p class="muted">' +
      esc(text) +
      '</p>' +
      (closeLabel
        ? '<button class="btn btn-light" type="button" data-close>' + esc(closeLabel) + '</button>'
        : '') +
      '</div>'
    );
  }

  /* ---------- Запись на осмотр ---------- */
  let servicesPromise;
  function getServicesCached() {
    if (!servicesPromise) {
      servicesPromise = api.getServices().catch(function (e) {
        servicesPromise = null;
        throw e;
      });
    }
    return servicesPromise;
  }

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function bookingFormHTML() {
    return (
      '<p class="muted">Перезвоним в течение 15 минут в рабочее время и подберём день. Осмотр и замер лака бесплатные.</p>' +
      '<form class="form" id="booking-form" novalidate>' +
      '<div class="row g-3">' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="bk-name">Имя</label>' +
      '<input class="form-control" id="bk-name" name="name" autocomplete="given-name" required aria-describedby="bk-name-error" data-msg="Напишите, как к вам обращаться">' +
      '<span class="field__error invalid-feedback d-block" id="bk-name-error"></span></div>' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="bk-phone">Телефон</label>' +
      '<input class="form-control" id="bk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (900) 000-00-00" required aria-describedby="bk-phone-error" data-msg="Укажите телефон, чтобы мы могли перезвонить">' +
      '<span class="field__error invalid-feedback d-block" id="bk-phone-error"></span></div>' +
      '</div>' +
      '<div class="row g-3">' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="bk-car">Марка и модель</label>' +
      '<input class="form-control" id="bk-car" name="car" placeholder="Например, BMW X5" autocomplete="off"></div>' +
      '<div class="field col-12 col-md-6"><label class="form-label" for="bk-service">Услуга</label>' +
      '<select class="form-select" id="bk-service" name="service"><option value="">Пока не знаю, нужна консультация</option></select></div>' +
      '</div>' +
      '<div class="field"><label class="form-label" for="bk-date">Удобная дата</label>' +
      '<input class="form-control" id="bk-date" name="date" type="date" min="' +
      todayISO() +
      '">' +
      '<span class="form-text">Необязательно. Точное время согласуем по телефону.</span></div>' +
      '<div class="field"><label class="form-label" for="bk-comment">Комментарий</label>' +
      '<textarea class="form-control" id="bk-comment" name="comment" rows="3" placeholder="Что беспокоит: сколы, царапины, запах в салоне"></textarea></div>' +
      '<div class="field"><label class="check" for="bk-consent"><input type="checkbox" id="bk-consent" name="consent" value="1" required aria-describedby="bk-consent-error">' +
      '<span>Согласен на обработку персональных данных по <a class="text-link" href="#policy" data-policy>политике конфиденциальности</a></span></label>' +
      '<span class="field__error invalid-feedback d-block" id="bk-consent-error"></span></div>' +
      '<p class="form__status" aria-live="polite"></p>' +
      '<button class="btn btn-light w-100" type="submit">Записаться на осмотр</button>' +
      '</form>'
    );
  }

  let bookingDialog;
  function openBooking(prefill) {
    prefill = prefill || {};
    if (!bookingDialog) bookingDialog = createDialog('booking', 'Запись на осмотр');
    const body = $('.dialog__body', bookingDialog);
    body.innerHTML = bookingFormHTML();
    const form = $('#booking-form', body);
    const select = $('#bk-service', form);

    getServicesCached()
      .then(function (list) {
        list.forEach(function (s) {
          const opt = new Option(s.title, s.slug);
          select.add(opt);
        });
        if (prefill.service) select.value = prefill.service;
      })
      .catch(function () {
        /* без списка услуг форма всё равно работает */
      });

    if (prefill.comment) $('#bk-comment', form).value = prefill.comment;
    if (prefill.estimate) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'estimate';
      hidden.value = JSON.stringify(prefill.estimate);
      form.appendChild(hidden);
    }

    handleSubmit(
      form,
      function (payload) {
        if (payload.estimate) payload.estimate = JSON.parse(payload.estimate);
        return api.createBooking(payload);
      },
      function (result, payload) {
        body.innerHTML = successBlock(
          'Заявка №' + result.id + ' отправлена',
          payload.name +
            ', перезвоним на номер ' +
            payload.phone +
            ' в течение 15 минут в рабочее время.',
          'Хорошо',
        );
        $('[data-close]', body).focus();
      },
    );

    openDialog(bookingDialog);
    $('#bk-name', form).focus();
  }

  /* ---------- Политика ---------- */
  let policyDialog;
  function openPolicy() {
    if (!policyDialog) {
      policyDialog = createDialog('policy', 'Политика конфиденциальности');
      $('.dialog__body', policyDialog).innerHTML =
        '<p class="muted">Текст политики будет добавлен юристом до запуска сайта. Кратко: мы используем имя и телефон только для связи по вашей заявке, ' +
        'не передаём их третьим лицам и удаляем по первому запросу на ' +
        esc(STUDIO.email) +
        '.</p>' +
        '<button class="btn btn-outline-light" type="button" data-close>Закрыть</button>';
    }
    openDialog(policyDialog);
  }

  /* ---------- До / после ---------- */
  function beforeAfterHTML(item) {
    const size = ' width="' + item.width + '" height="' + item.height + '"';
    const credit = item.credit
      ? '<p class="ba__credit">Фото: <a href="' +
        esc(item.credit.url) +
        '" rel="noopener" target="_blank">' +
        esc(item.credit.author) +
        '</a>, <a href="' +
        esc(item.credit.licenseUrl) +
        '" rel="noopener" target="_blank">' +
        esc(item.credit.license) +
        '</a></p>'
      : '';
    return (
      '<figure class="ba">' +
      '<div class="ba__frame" style="--pos: 50%; aspect-ratio: ' +
      item.width +
      ' / ' +
      item.height +
      '">' +
      '<img class="ba__img" src="' +
      esc(item.after) +
      '" alt="После: ' +
      esc(item.alt) +
      '"' +
      size +
      ' loading="lazy" decoding="async">' +
      '<div class="ba__before">' +
      '<img class="ba__img" src="' +
      esc(item.before) +
      '" alt="До: ' +
      esc(item.alt) +
      '"' +
      size +
      ' loading="lazy" decoding="async"></div>' +
      '<div class="ba__divider" aria-hidden="true"><span class="ba__handle">' +
      icons.handle +
      '</span></div>' +
      '<span class="ba__tag ba__tag--before" aria-hidden="true">До</span><span class="ba__tag ba__tag--after" aria-hidden="true">После</span>' +
      '<input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Граница между «до» и «после», ' +
      esc(item.car) +
      '" aria-valuetext="50% кадра — «до»">' +
      '</div>' +
      '<figcaption class="ba__caption">' +
      '<span class="ba__title"><strong>' +
      esc(item.car) +
      '</strong><span class="muted">' +
      esc(item.title) +
      '</span></span>' +
      '<p class="ba__text">' +
      esc(item.text) +
      '</p>' +
      '<dl class="ba__metrics">' +
      item.metrics
        .map(function (m) {
          return (
            '<div class="ba__metric"><dt>' +
            esc(m.label) +
            '</dt><dd>' +
            esc(m.value) +
            '</dd></div>'
          );
        })
        .join('') +
      '</dl>' +
      '<a class="btn btn-outline-light btn-sm ba__cta" href="about.html#request" data-booking data-service="' +
      esc(item.service) +
      '">Записаться на такую же работу</a>' +
      credit +
      '</figcaption>' +
      '</figure>'
    );
  }

  function initBeforeAfter(root) {
    $$('.ba__range', root).forEach(function (range) {
      const frame = range.closest('.ba__frame');
      const update = function () {
        frame.style.setProperty('--pos', range.value + '%');
        range.setAttribute('aria-valuetext', range.value + '% кадра — «до»');
      };
      range.addEventListener('input', update);
      update();
    });
  }

  /* ---------- Табы ---------- */
  function initTabs(tablist, onSelect) {
    const tabs = $$('[role="tab"]', tablist);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.classList.toggle('active', on);
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(tab, false);
      });
      tab.addEventListener('keydown', function (e) {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });
    if (tabs.length) select(tabs[0], false);
  }

  /* ---------- Возврат наверх ---------- */
  function initBackToTop() {
    const button = $('[data-back-to-top]');
    if (!button) return;

    function updateVisibility() {
      button.hidden = window.scrollY < 300;
    }

    button.addEventListener('click', function () {
      const logo = $('.site-header .logo');
      if (logo) logo.focus({ preventScroll: true });
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  /* ---------- Делегирование ---------- */
  document.addEventListener('click', function (e) {
    const booking = e.target.closest('[data-booking]');
    if (booking) {
      e.preventDefault();
      openBooking({ service: booking.dataset.service, comment: booking.dataset.comment });
      return;
    }
    if (e.target.closest('[data-policy]')) {
      e.preventDefault();
      openPolicy();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initBackToTop();
    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  });

  window.Blik = {
    $: $,
    $$: $$,
    esc: esc,
    price: price,
    date: date,
    plural: plural,
    icons: icons,
    stars: stars,
    reviewCard: reviewCard,
    load: load,
    toast: toast,
    reduceMotion: reduceMotion,
    createDialog: createDialog,
    openDialog: openDialog,
    openBooking: openBooking,
    handleSubmit: handleSubmit,
    successBlock: successBlock,
    beforeAfterHTML: beforeAfterHTML,
    initBeforeAfter: initBeforeAfter,
    initTabs: initTabs,
  };
})();

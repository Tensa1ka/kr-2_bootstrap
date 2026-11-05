/* О студии и контакты: команда, оборудование, бренды, мессенджеры, форма заявки. */
(function () {
  'use strict';

  const B = window.Blik;
  const api = window.BlikAPI;

  function renderStudio(data) {
    B.$('#team-list').innerHTML = data.team
      .map(function (p) {
        return (
          '<article class="person col">' +
          '<img class="person__photo" src="' +
          B.esc(p.photo) +
          '" alt="' +
          B.esc(p.name) +
          ', ' +
          B.esc(p.role.toLowerCase()) +
          '" width="800" height="1000" loading="lazy" decoding="async">' +
          '<h3 class="person__name">' +
          B.esc(p.name) +
          '</h3>' +
          '<p class="person__role">' +
          B.esc(p.role) +
          '. ' +
          B.esc(p.experience) +
          '</p>' +
          '<p class="person__about">' +
          B.esc(p.about) +
          '</p></article>'
        );
      })
      .join('');

    B.$('#equipment-list').innerHTML = data.equipment
      .map(function (g) {
        return (
          '<div class="equip__group col"><h3 class="h3">' +
          B.esc(g.group) +
          '</h3><ul class="equip__list">' +
          g.items
            .map(function (i) {
              return '<li>' + B.esc(i) + '</li>';
            })
            .join('') +
          '</ul></div>'
        );
      })
      .join('');

    B.$('#brands-list').innerHTML = data.brands
      .map(function (b) {
        return (
          '<li class="brand col"><span class="brand__name">' +
          B.esc(b.name) +
          '</span><span class="brand__use">' +
          B.esc(b.use) +
          '</span></li>'
        );
      })
      .join('');
  }

  function renderMessengers(contacts) {
    B.$('#messengers').innerHTML = contacts.messengers
      .map(function (m) {
        return (
          '<a class="btn btn-outline-light btn-sm" href="' +
          B.esc(m.href) +
          '" rel="noopener" target="_blank">' +
          (B.icons[m.id] || '') +
          B.esc(m.title) +
          '<span class="visually-hidden"> (откроется в новой вкладке)</span></a>'
        );
      })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    B.load(
      B.$('#team-list'),
      api.getStudio,
      renderStudio,
      'Не удалось загрузить информацию о команде.',
    );
    api
      .getContacts()
      .then(renderMessengers)
      .catch(function () {
        /* остаются статичные ссылки из разметки */
      });

    const box = B.$('#request-box');
    B.handleSubmit(B.$('#lead-form'), api.createLead, function (result, payload) {
      const channel =
        {
          call: 'перезвоним',
          telegram: 'напишем в Telegram',
          whatsapp: 'напишем в WhatsApp',
          max: 'напишем в MAX',
        }[payload.channel] || 'свяжемся';
      box.innerHTML = B.successBlock(
        'Заявка №' + result.id + ' принята',
        payload.name +
          ', ' +
          channel +
          ' на номер ' +
          payload.phone +
          ' в течение 15 минут в рабочее время.',
      );
      B.$('.success', box).setAttribute('tabindex', '-1');
      B.$('.success', box).focus();
    });
  });
})();

/* Подбор ухода, сравнение покрытий, памятки и локальное сохранение выбора. */
(function () {
  'use strict';

  const B = window.Blik;
  const key = 'blik.preferences.v1';
  const memory = { version: 1, favorites: [], calculator: null };
  let persistent = true;

  function read() {
    if (!persistent) return memory;
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (value && value.version === 1) {
        memory.favorites = Array.isArray(value.favorites)
          ? [...new Set(value.favorites.filter((id) => Number.isInteger(id) && id > 0))].slice(
              0,
              100,
            )
          : [];
        memory.calculator = value.calculator || null;
      }
    } catch (error) {
      // A damaged record should not prevent the page from loading.
      if (!(error instanceof SyntaxError)) persistent = false;
    }
    return memory;
  }

  function write() {
    try {
      localStorage.setItem(key, JSON.stringify(memory));
      persistent = true;
    } catch (error) {
      persistent = false;
    }
    window.dispatchEvent(new CustomEvent('blik:preferences'));
    return persistent;
  }

  function normalizePlan(value, services) {
    const plan = { carClass: 2, items: {} };
    if (!value || typeof value !== 'object') return plan;
    if ([1, 2, 3, 4].includes(Number(value.carClass))) plan.carClass = Number(value.carClass);
    services.forEach(function (service) {
      const id = value.items && value.items[service.slug];
      if (service.variants.some((variant) => variant.id === id)) plan.items[service.slug] = id;
    });
    return plan;
  }

  function calculatorUrl(plan) {
    return 'services.html?plan=' + encodeURIComponent(JSON.stringify(plan)) + '#calculator';
  }

  const storage = {
    favorites: function () {
      return read().favorites.slice();
    },
    toggleFavorite: function (id) {
      const ids = read().favorites;
      memory.favorites = ids.includes(id) ? ids.filter((item) => item !== id) : ids.concat(id);
      return write();
    },
    loadPlan: function (services) {
      return normalizePlan(read().calculator, services);
    },
    savePlan: function (plan) {
      memory.calculator = { carClass: plan.carClass, items: { ...plan.items } };
      return write();
    },
    persistent: function () {
      return persistent;
    },
  };
  read();
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      memory.favorites = [];
      memory.calculator = null;
      read();
      window.dispatchEvent(new CustomEvent('blik:preferences'));
    }
  });

  const care = {
    polish: [
      'После полировки',
      'Если нанесён защитный состав, первые 7 дней избегайте агрессивной химии и щёток.',
      'Используйте мягкую ручную мойку и чистую микрофибру. Не протирайте сухую пыль.',
      'Через 2 недели проверьте покрытие под освещением; при вопросах приезжайте на осмотр.',
    ],
    ceramic: [
      'После керамики',
      'Первые 7 дней не мойте кузов: покрытию нужно набрать прочность. Первые сутки берегите его от воды.',
      'Затем мойте pH-нейтральным шампунем без абразивов. Удаляйте следы птиц и насекомых как можно скорее.',
      'Первый контроль — через 2 недели, затем осмотр покрытия каждые 6 месяцев.',
    ],
    ppf: [
      'После оклейки плёнкой',
      'Не мойте автомобиль первые 7 дней и не трогайте кромки плёнки.',
      'Не направляйте струю высокого давления на края и стыки. Держите сопло на расстоянии не менее 50 см.',
      'Через 7–14 дней приезжайте на проверку кромок и стыков.',
    ],
    interior: [
      'После химчистки салона',
      'Дайте салону полностью высохнуть и проветрите его. Не накрывайте влажные сиденья чехлами.',
      'Используйте средства, подходящие материалу. Не применяйте спирт и жёсткие щётки для кожи.',
      'Через 1–2 недели проверьте состояние материалов; защитную пропитку обновляйте по рекомендации мастера.',
    ],
    wash: [
      'После мойки и воска',
      'Следующую мойку выбирайте по загрязнению, обычно через 1–2 недели. Избегайте автоматических щёток.',
      'Мойте кузов сверху вниз отдельной варежкой, диски — отдельной щёткой. Не растирайте песок.',
      'Если вода перестала собираться в капли, обсудите обновление воска на следующей мойке.',
    ],
    tint: [
      'После тонировки',
      'Не опускайте оклеенные стёкла первые 3–5 дней. В холодную погоду срок высыхания может увеличиться.',
      'Протирайте стёкла мягкой тканью и средством без аммиака. Не трогайте края плёнки.',
      'Через 1–2 недели проверьте края и прозрачность; сохраняющиеся пузыри покажите мастеру.',
    ],
    noise: [
      'После шумоизоляции',
      'Мойка кузова не ограничена; первые сутки избегайте сырости в разобранных и собранных зонах салона.',
      'Не снимайте самостоятельно обшивки и не перекрывайте дренажные отверстия дверей.',
      'После недели поездок оцените результат. Если появился скрип, запишитесь на проверку креплений.',
    ],
  };

  function careHTML(slugs) {
    return [...new Set(slugs)]
      .filter((slug) => care[slug])
      .map(function (slug) {
        const item = care[slug];
        return `<article class="care-card"><h3 class="h3">${B.esc(item[0])}</h3><dl>
        <dt>Когда мыть и что делать сначала</dt><dd>${B.esc(item[1])}</dd>
        <dt>Чего избегать и как ухаживать</dt><dd>${B.esc(item[2])}</dd>
        <dt>Когда проверить</dt><dd>${B.esc(item[3])}</dd></dl></article>`;
      })
      .join('');
  }

  const careNote =
    'Общие рекомендации: инструкция мастера и производителя конкретного состава или плёнки имеет приоритет.';
  let careDialog;
  function openCare(slugs) {
    const selected = [...new Set(slugs)].filter((slug) => care[slug]);
    if (!selected.length) return;
    if (!careDialog) careDialog = B.createDialog('care-dialog', 'Ваша памятка по уходу');
    B.$('.dialog__body', careDialog).innerHTML =
      careHTML(selected) +
      `<p class="muted small">${careNote}</p><button class="btn btn-outline-light btn-sm feature-action" type="button" data-download-care>Скачать памятку</button>`;
    B.$('[data-download-care]', careDialog).addEventListener('click', function () {
      const text =
        'Блик — памятка по уходу\n\n' +
        selected.map((slug) => care[slug].join('\n')).join('\n\n') +
        '\n\n' +
        careNote;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'blik-care.txt';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    B.openDialog(careDialog);
  }

  function initCare(services) {
    const form = B.$('#care-picker');
    if (!form) return;
    form.innerHTML = `<label class="form-label" for="care-service">Услуга</label>
      <select class="form-select" id="care-service">${services.map((s) => `<option value="${B.esc(s.slug)}">${B.esc(s.title)}</option>`).join('')}</select>
      <button class="btn btn-light feature-action" type="submit">Получить памятку</button>`;
    const output = B.$('#care-preview');
    const update = function () {
      output.innerHTML = careHTML([B.$('#care-service').value]);
    };
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      openCare([B.$('#care-service').value]);
    });
    update();
  }

  const questions = [
    {
      name: 'age',
      title: 'Сколько лет автомобилю?',
      choices: [
        ['new', 'До 1 года'],
        ['used', '1–5 лет'],
        ['old', 'Больше 5 лет'],
      ],
    },
    {
      name: 'body',
      title: 'В каком состоянии кузов?',
      choices: [
        ['good', 'Хороший блеск, заметных дефектов нет'],
        ['dull', 'Потускнел, есть мелкие царапины'],
        ['chips', 'Есть сколы или глубокие царапины'],
      ],
    },
    {
      name: 'concern',
      title: 'Что беспокоит в первую очередь?',
      choices: [
        ['shine', 'Хочу вернуть блеск'],
        ['protect', 'Хочу защиту от сколов и загрязнений'],
        ['interior', 'Пятна и запахи в салоне'],
        ['noise', 'Шум в салоне'],
        ['wash', 'Нужен регулярный уход'],
      ],
    },
    {
      name: 'budget',
      title: 'На какой бюджет ориентироваться?',
      choices: [
        ['10000', 'До 10 000 ₽'],
        ['30000', 'До 30 000 ₽'],
        ['100000', 'До 100 000 ₽'],
        ['500000', 'До 500 000 ₽'],
      ],
    },
    { name: 'carClass', title: 'Какой класс автомобиля?', choices: [] },
  ];

  function recommend(answers, services) {
    const items = {};
    const reasons = [];
    const carClass = Number(answers.carClass);
    let remaining = Number(answers.budget);
    function add(slug, reason) {
      const s = services.find((s) => s.slug === slug);
      if (!s || items[slug]) return false;
      const v = s.variants[0];
      const price = v.prices[carClass - 1];
      if (price > remaining) return false;
      remaining -= price;
      items[slug] = v.id;
      reasons.push({ title: s.title, reason: reason, price: price });
      return true;
    }
    const notes = [];
    if (answers.concern === 'interior')
      add(
        'interior',
        'Уборка сидений и ковриков под вашу задачу; состав работ уточним после осмотра.',
      );
    if (answers.concern === 'noise')
      add('noise', 'Начнём с дверей: это базовый вариант для снижения шума.');
    if (answers.concern === 'wash') add('wash', 'Базовая мойка для регулярного ухода за кузовом.');
    if (answers.concern === 'shine') {
      if (answers.body === 'good' && answers.age === 'new')
        add('ceramic', 'На свежем кузове можно сохранить блеск без лишней абразивной обработки.');
      else
        add(
          'polish',
          'Лёгкая полировка возвращает блеск; глубину обработки выбирает мастер после замера лака.',
        );
    }
    if (answers.concern === 'protect') {
      if (answers.body === 'dull')
        add('polish', 'Сначала подготовим потускневший кузов под защиту.');
      if (answers.body !== 'chips') {
        if (
          !add(
            'ppf',
            'Плёнка на зону риска защищает переднюю часть от дорожного песка и мелких сколов.',
          )
        )
          add(
            'ceramic',
            'Керамика облегчает уход и сохраняет блеск; от ударов камней она не защищает.',
          );
      }
    }
    if (answers.body === 'chips')
      notes.push(
        'Сколы и глубокие царапины требуют осмотра. Полировка не восстанавливает утраченный слой краски, а плёнка не исправляет существующие повреждения.',
      );
    if (!reasons.length) {
      notes.push(
        'Основная услуга не укладывается в выбранный бюджет или требует осмотра. Мойка ниже — только подготовка, а не решение основной проблемы.',
      );
      add('wash', 'Подготовительная мойка перед бесплатным осмотром состояния автомобиля.');
    }
    if (answers.age === 'old')
      notes.push(
        'Для автомобиля старше пяти лет особенно важны замеры лака и проверка окрашенных деталей.',
      );
    return { plan: { carClass: carClass, items: items }, reasons: reasons, notes: notes };
  }

  function initQuiz(root, services, classes) {
    let step = 0;
    const answers = {};
    const steps = questions.map((q) => ({ ...q }));
    steps[4].choices = classes.map((c) => [String(c.id), c.title + ' — ' + c.examples]);
    function render() {
      const q = steps[step];
      root.innerHTML = `<p class="eyebrow">Шаг ${step + 1} из ${steps.length}</p>
        <div class="progress quiz-progress" role="progressbar" aria-label="Пройдено вопросов" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${step}"><div class="progress-bar" style="width:${(step / steps.length) * 100}%"></div></div>
        <form id="care-quiz-form"><fieldset><legend id="quiz-question" tabindex="-1">${q.title}</legend>
          <div class="quiz-choices">${q.choices.map(([value, title]) => `<label class="quiz-choice"><input type="radio" name="${q.name}" value="${value}" required ${answers[q.name] === value ? 'checked' : ''}><span>${B.esc(title)}</span></label>`).join('')}</div>
        </fieldset><div class="feature-actions mt-4">
          ${step ? '<button type="button" class="btn btn-outline-light btn-sm" data-quiz-back>Назад</button>' : ''}
          <button class="btn btn-light feature-action" type="submit">${step === steps.length - 1 ? 'Показать рекомендации' : 'Далее'}</button>
        </div></form>`;
      B.$('#care-quiz-form', root).addEventListener('change', function (event) {
        answers[q.name] = event.target.value;
      });
      B.$('#care-quiz-form', root).addEventListener('submit', function (event) {
        event.preventDefault();
        if (!answers[q.name]) return;
        if (step < steps.length - 1) {
          step += 1;
          render();
          B.$('#quiz-question', root).focus();
        } else result();
      });
      const back = B.$('[data-quiz-back]', root);
      if (back)
        back.addEventListener('click', function () {
          step -= 1;
          render();
          B.$('#quiz-question', root).focus();
        });
    }
    function result() {
      const value = recommend(answers, services);
      const subtotal = value.reasons.reduce((sum, r) => sum + r.price, 0);
      root.innerHTML = `<div tabindex="-1" id="quiz-result"><p class="eyebrow">Ваш план ухода</p><h3 class="h3">С чего рекомендуем начать</h3>
        <ul class="recommendations">${value.reasons.map((r) => `<li><strong>${B.esc(r.title)} · от ${B.price(r.price)}</strong><p class="muted">${B.esc(r.reason)}</p></li>`).join('')}</ul>
        ${value.notes.map((n) => `<p class="quiz-note">${B.esc(n)}</p>`).join('')}
        <p>Сумма до скидки: от <strong>${B.price(subtotal)}</strong>. Итог со скидкой — в калькуляторе. Точная смета после осмотра.</p>
        <div class="feature-actions"><a class="btn btn-light feature-action" href="${B.esc(calculatorUrl(value.plan))}">Перенести в калькулятор</a>
          <button class="btn btn-outline-light btn-sm" type="button" data-quiz-reset>Пройти заново</button></div></div>`;
      B.$('[data-quiz-reset]', root).addEventListener('click', function () {
        step = 0;
        Object.keys(answers).forEach((k) => delete answers[k]);
        render();
        B.$('#quiz-question', root).focus();
      });
      B.$('#quiz-result', root).focus();
    }
    render();
  }

  function initComparison(services, classes) {
    const root = B.$('#protection-comparison');
    if (!root) return;
    const coatings = [
      {
        title: 'Воск',
        slug: 'wash',
        variant: 'wash-plus',
        protects: 'Загрязнения и следы воды. Сколы не предотвращает.',
        life: 'Обычно 1–3 месяца',
        care: 'Мягкая мойка, обновление при ослаблении гидрофобности.',
        note: 'Мойка, салон и воск',
        use: 'Для регулярного ухода с небольшим бюджетом.',
      },
      {
        title: 'Керамика',
        slug: 'ceramic',
        variant: 'ceramic-1',
        protects: 'Облегчает удаление грязи, помогает сохранить блеск. Сколы не предотвращает.',
        life: '1–5 лет в зависимости от состава и ухода',
        care: 'Первую неделю без мойки; затем pH-нейтральные средства и контроль покрытия.',
        note: 'Один слой на кузов',
        use: 'Чтобы облегчить мойку и сохранить внешний вид.',
      },
      {
        title: 'Плёнка PPF',
        slug: 'ppf',
        variant: 'ppf-risk',
        protects: 'Дорожный песок, мелкие сколы и поверхностные царапины на оклеенных деталях.',
        life: 'До 10 лет по условиям производителя',
        care: 'Первые 7 дней без мойки; беречь кромки от струи высокого давления.',
        note: 'Только зона риска, не весь кузов',
        use: 'Для механической защиты уязвимых деталей.',
      },
    ];
    root.innerHTML = `<div class="comparison-controls"><label class="form-label" for="comparison-class">Показать цены для вашего класса</label>
      <select class="form-select" id="comparison-class">${classes.map((c) => `<option value="${c.id}" ${c.id === 2 ? 'selected' : ''}>${B.esc(c.title)}</option>`).join('')}</select></div><p class="muted small d-md-none mb-3">Таблица прокручивается: проведите влево, чтобы увидеть все три покрытия.</p><div id="comparison-table" class="table-responsive" tabindex="0" role="region" aria-label="Сравнение воска, керамики и плёнки"></div>`;
    function update() {
      const carClass = Number(B.$('#comparison-class').value);
      const columns = coatings.map(function (c) {
        const service = services.find((s) => s.slug === c.slug);
        const variant = service && service.variants.find((v) => v.id === c.variant);
        if (!variant) return { ...c, price: 'Уточните в студии', url: null };
        return {
          ...c,
          price: 'от ' + B.price(variant.prices[carClass - 1]),
          url: calculatorUrl({ carClass: carClass, items: { [c.slug]: c.variant } }),
        };
      });
      const rows = [
        ['Что защищает', 'protects'],
        ['Срок службы', 'life'],
        ['Уход', 'care'],
        ['Кому подойдёт', 'use'],
      ];
      B.$('#comparison-table').innerHTML =
        `<table class="table comparison-table"><caption>Сроки ориентировочные. Цена зависит от класса автомобиля и указанного объёма работ.</caption>
        <thead><tr><th scope="col">Параметр</th>${columns.map((c) => `<th scope="col">${c.title}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(([title, field]) => `<tr><th scope="row">${title}</th>${columns.map((c) => `<td>${c[field]}</td>`).join('')}</tr>`).join('')}
        <tr><th scope="row">Цена и состав</th>${columns.map((c) => `<td><strong>${c.price}</strong><p class="small muted">${c.note}</p></td>`).join('')}</tr>
        <tr><th scope="row">Рассчитать</th>${columns.map((c) => `<td>${c.url ? `<a class="btn btn-outline-light btn-sm" href="${B.esc(c.url)}">Выбрать ${c.title.toLowerCase()}</a>` : 'Позвоните нам'}</td>`).join('')}</tr></tbody></table>`;
    }
    B.$('#comparison-class').addEventListener('change', update);
    update();
  }

  function loadWidgets() {
    if (!B.$('[data-care-quiz], #protection-comparison, #care-picker')) return;
    Promise.all([window.BlikAPI.getServices(), window.BlikAPI.getCarClasses()])
      .then(function ([services, classes]) {
        B.$$('[data-care-quiz]').forEach((root) => initQuiz(root, services, classes));
        initComparison(services, classes);
        initCare(services);
      })
      .catch(function () {
        B.$$('[data-care-quiz], #protection-comparison, #care-picker').forEach(function (root) {
          root.innerHTML =
            '<p role="alert">Не удалось загрузить услуги. Попробуйте ещё раз.</p><button class="btn btn-outline-light btn-sm" type="button" data-widget-retry>Повторить</button>';
          B.$('[data-widget-retry]', root).addEventListener('click', loadWidgets);
        });
      });
  }

  document.addEventListener('DOMContentLoaded', loadWidgets);
  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-care-services]');
    if (button) openCare(button.dataset.careServices.split(','));
  });
  window.BlikExperience = {
    storage: storage,
    normalizePlan: normalizePlan,
    calculatorUrl: calculatorUrl,
    careHTML: careHTML,
    openCare: openCare,
  };
})();

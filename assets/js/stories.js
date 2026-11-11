/* Демонстрационные истории: заменить реальными сметами и фотографиями до публикации кейсов студии. */
(function () {
  'use strict';

  const cases = {
    101: {
      carClass: 3,
      task: 'Сохранить внешний вид кузова при ежедневных поездках и защитить всю окрашенную поверхность.',
      variants: { ppf: 'ppf-full', ceramic: 'ceramic-2' },
    },
    102: {
      carClass: 3,
      task: 'Убрать следы прежних моек и вернуть глубину красному цвету.',
      variants: { polish: 'polish-full', ceramic: 'ceramic-1' },
    },
    103: {
      carClass: 3,
      task: 'Облегчить мойку кузова и сохранить блеск серого лака.',
      variants: { ceramic: 'ceramic-2' },
    },
    104: {
      carClass: 4,
      task: 'Очистить кузов и колёса перед зимним сезоном без риска для лака.',
      variants: { wash: 'wash-body' },
    },
    105: {
      carClass: 4,
      task: 'Удалить дорожную грязь с кузова, колёс и арок после поездки за город.',
      variants: { wash: 'wash-body' },
    },
    106: {
      carClass: 3,
      task: 'Очистить кожаные сиденья и защитить поверхности салона от повседневного износа.',
      variants: { interior: 'interior-protect' },
    },
    107: {
      carClass: 3,
      task: 'Освежить кузов перед продажей, сохранив безопасную толщину лака.',
      variants: { polish: 'polish-light' },
    },
    108: {
      carClass: 3,
      task: 'Снизить нагрев салона и облегчить дальнейший уход за кузовом.',
      variants: { tint: 'tint-full', ceramic: 'ceramic-1' },
    },
    109: {
      carClass: 3,
      task: 'Защитить переднюю часть автомобиля от дорожного песка и мелких сколов.',
      variants: { ppf: 'ppf-risk' },
    },
    110: {
      carClass: 3,
      task: 'Подготовить автомобиль к оклейке и защитить полный кузов прозрачной плёнкой.',
      variants: { wash: 'wash-body', ppf: 'ppf-full' },
    },
    111: {
      carClass: 4,
      task: 'Уменьшить дорожный шум в салоне, начав с четырёх дверей.',
      variants: { noise: 'noise-doors' },
    },
    112: {
      carClass: 3,
      task: 'Снизить шум в поездках и освежить материалы салона.',
      variants: { noise: 'noise-full', interior: 'interior-full' },
    },
    113: {
      carClass: 3,
      task: 'Привести в порядок кузов и салон после повседневных поездок.',
      variants: { wash: 'wash-plus', interior: 'interior-seats' },
    },
    114: {
      carClass: 2,
      task: 'Защитить кузов плёнкой и обсудить цветовые акценты на отдельных деталях.',
      variants: { ppf: 'ppf-full' },
    },
    115: {
      carClass: 4,
      task: 'Убрать последствия мойки щётками без лишнего снятия лака.',
      variants: { polish: 'polish-full' },
    },
  };

  function getStory(work, services) {
    const data = cases[work.id];
    if (!data) return null;
    const lines = work.services
      .map(function (slug) {
        const service = services.find((s) => s.slug === slug);
        const variant = service && service.variants.find((v) => v.id === data.variants[slug]);
        if (!variant) return null;
        return { service: service, variant: variant, price: variant.prices[data.carClass - 1] };
      })
      .filter(Boolean);
    const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
    const rate = lines.length >= 3 ? 0.1 : lines.length === 2 ? 0.05 : 0;
    const discount = Math.round((subtotal * rate) / 100) * 100;
    return {
      task: data.task,
      carClass: data.carClass,
      lines: lines,
      subtotal: subtotal,
      discount: discount,
      total: subtotal - discount,
      result: work.text,
    };
  }

  function render(work, services) {
    const story = getStory(work, services);
    if (!story) return '';
    const B = window.Blik;
    const stages = story.lines
      .map(function (line) {
        return `<article><h4 class="h3">${B.esc(line.service.title)}</h4><ol class="story-stages">${line.service.stages.map((s) => `<li><strong>${B.esc(s.title)}</strong><p class="muted">${B.esc(s.text)}</p></li>`).join('')}</ol></article>`;
      })
      .join('');
    const photos = story.lines
      .map(function (line) {
        return `<figure class="story-photo"><img src="${B.esc(line.service.image)}" alt="Иллюстрация услуги: ${B.esc(line.service.title)}" width="1400" height="933" loading="lazy"><figcaption>${B.esc(line.service.title)} — иллюстрация процесса, не съёмка этой машины.</figcaption></figure>`;
      })
      .join('');
    return `<section class="story-details" aria-label="Подробная история работ">
      <p class="quiz-note">Демонстрационная история. Задача и смета — пример; фотографии этапов иллюстративные. Это не подтверждённый заказ студии.</p>
      <div><h3 class="h3">Задача клиента</h3><p>${B.esc(story.task)}</p></div>
      <div><h3 class="h3">Этапы работы</h3><div class="story-stage-grid">${stages}</div></div>
      <div><h3 class="h3">Иллюстрации процесса</h3><div class="story-photos">${photos}</div></div>
      <div><h3 class="h3">Результат и срок</h3><p>${B.esc(story.result)}</p><p class="muted">Срок: ${B.esc(work.duration)}.</p></div>
      <div class="story-invoice"><h3 class="h3">Итоговая стоимость примера</h3><dl>${story.lines.map((l) => `<div><dt>${B.esc(l.service.title)} · ${B.esc(l.variant.title)}</dt><dd>${B.price(l.price)}</dd></div>`).join('')}
        ${story.discount ? `<div><dt>Скидка за комплекс</dt><dd>−${B.price(story.discount)}</dd></div>` : ''}
        <div class="story-total"><dt>Итого</dt><dd>${B.price(story.total)}</dd></div></dl>
        <p class="muted small">Расчёт по прайсу для класса «${B.esc(['Малый класс', 'Средний класс', 'Бизнес и кроссоверы', 'Внедорожники и минивэны'][story.carClass - 1])}». Реальный состав, дополнительные работы и цена согласуются после осмотра.</p>
        <a class="btn btn-outline-light btn-sm feature-action" href="${B.esc(window.BlikExperience.calculatorUrl({ carClass: story.carClass, items: Object.fromEntries(story.lines.map((l) => [l.service.slug, l.variant.id])) }))}">Рассчитать похожий комплекс</a>
      </div></section>`;
  }
  window.BlikStories = { get: getStory, render: render };
})();

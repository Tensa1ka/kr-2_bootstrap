# Блик — прототип сайта детейлинг-студии

Статичный прототип на Bootstrap 5.3.8, HTML и JavaScript без сборки и без бэкенда.
Bootstrap хранится локально в `assets/vendor/bootstrap/` (MIT, лицензия рядом).
Интернет нужен только для внешней карты и Google Fonts; при недоступности шрифтов используются системные.
Все данные отдаёт слой-заглушка `assets/js/api.js`. Когда появится сервер,
меняется только этот файл.

## Запуск

Страницы открываются и напрямую из файла, но карта и шрифты надёжнее работают через локальный сервер:

```bash
python -m http.server 5173
```

Затем откройте http://localhost:5173.

## Структура

```
index.html        Главная: оффер и запись, ключевые услуги, до/после, отзывы
services.html     Услуги и цены: карточки, детали в модальном окне, прайс, калькулятор
portfolio.html    Портфолио и отзывы: галерея с фильтром, до/после, все отзывы
about.html        О студии и контакты: команда, оборудование, бренды, карта, форма
assets/vendor/bootstrap/  Bootstrap 5.3.8: CSS, bundle JS и лицензия MIT
assets/css/styles.css   Тема студии и специальные эффекты, токены в :root
assets/js/data.js       Мок-база (удалить после подключения бэкенда)
assets/js/api.js        Слой API: моки сейчас, fetch потом
assets/js/ui.js         Общие компоненты: меню, диалоги, форма записи, до/после
assets/js/{home,services,portfolio,about}.js   Логика страниц
assets/img/             Фото (Unsplash, бесплатная лицензия), swirl.svg, favicon.svg
```

## Подключение бэкенда

1. В `assets/js/api.js` выставить `config.useMock = false` и `config.baseUrl`.
2. Убрать `<script src="assets/js/data.js">` со всех страниц.
3. Ошибки сервер возвращает в виде `{ "message": "...", "errors": { "field": "code" } }`
   с HTTP-кодом 4xx/5xx — текст `message` показывается пользователю.

Чтобы проверить экран ошибки на моках, введите телефон, оканчивающийся на `00-00`:
мок ответит кодом 503.

## Контракт API

| Метод | Путь                                                     | Ответ                                                              |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| GET   | `/services`                                              | `Service[]`                                                        |
| GET   | `/car-classes`                                           | `CarClass[]`                                                       |
| GET   | `/portfolio?service=slug`                                | `PortfolioItem[]`                                                  |
| GET   | `/before-after?limit=n`                                  | `BeforeAfter[]`                                                    |
| GET   | `/reviews?service=&sort=new\|high\|low&page=1&perPage=6` | `{ items: Review[], page, pages, total, summary }`                 |
| POST  | `/reviews`                                               | `{ id, status: "moderation" }`                                     |
| POST  | `/bookings`                                              | `{ id, status: "new" }`                                            |
| POST  | `/leads`                                                 | `{ id }`                                                           |
| GET   | `/studio`                                                | `{ team: Person[], equipment: EquipmentGroup[], brands: Brand[] }` |
| GET   | `/contacts`                                              | `Contacts`                                                         |

Полные структуры с примерами — в `assets/js/data.js`. Кратко:

```ts
Service {
  slug: string; title: string; short: string; description: string;
  image: string; alt: string; key: boolean;          // key — показывать на главной
  stages: { title: string; text: string }[];
  duration: string; warranty: string; priceFrom: number;
  variants: { id: string; title: string; prices: [number, number, number, number] }[]; // по классам 1–4
  faq: { q: string; a: string }[];
}
CarClass      { id: 1 | 2 | 3 | 4; title: string; examples: string }
PortfolioItem { id; car; services: string[]; image; alt; duration; text; size?: "wide" | "tall" }
BeforeAfter   { id; car; service; title; text; alt;
                before: string; after: string;       // два кадра с одной точки, одного размера
                width: number; height: number;       // размер кадров, задаёт пропорции слайдера
                metrics: { label: string; value: string }[];
                credit?: { author; url; license; licenseUrl } } // если фото не своё
Review        { id; name; car; service; rating: 1–5; date: "YYYY-MM-DD"; source; text }
summary       { average: number; count: number; distribution: { 1..5: number } }

POST /bookings { name, phone, car?, service?, date?, comment?, consent: true,
                 estimate?: { carClass, lines[], subtotal, discountRate, discount, total, days } }
POST /leads    { name, phone, channel: "call" | "telegram" | "whatsapp" | "max", message?, consent: true }
POST /reviews  { name, car?, service?, rating, text, consent: true }
```

## Что условно в прототипе

- Название, адрес, телефон, e-mail, ссылки на мессенджеры, отзывы и цены придуманы.
- В слайдере «до/после» — настоящие пары снимков со свободной лицензией, а не работы студии.
  Кадры совмещены по контрольным точкам. Свои работы снимайте с одной точки (штатив или метка на полу),
  тогда совмещать не придётся.
- Текст политики конфиденциальности — заглушка в модальном окне.
- В калькуляторе скидка 5% за две услуги и 10% за три и больше — замените на свои правила.

## Перенос на Bootstrap

- Адаптивные контейнеры, `row` / `col`, карточки услуг и сетки команды, оборудования, контактов и подвала.
- Кнопки `btn`, поля `form-control` / `form-select`, состояния ошибок `is-invalid`, таблица `table` в `table-responsive`.
- Шапка `navbar`, мобильное меню `Offcanvas`, окна записи, услуг, политики и галереи через `Modal`, уведомления `Toast`.
- У модальных окон работают Escape, ограничение фокуса, возврат к исходной форме после просмотра политики.
- Индивидуальные эффекты лампы, сравнение «до/после», раскладка галереи, рейтинг и логика калькулятора сохранены в CSS/JS проекта.
- Bootstrap загружается перед стилями темы и скриптами приложения. Сборка и npm для запуска не нужны.

## Проверки

Браузерные проверки в Chromium: четыре страницы на ширинах 320, 375, 768, 1024 и 1440 px; отсутствие горизонтального скролла и ошибок JavaScript; мобильное меню; валидация и успешная отправка записи; политика внутри формы с сохранением введённых данных; детали услуг; скидка калькулятора и перенос расчёта в запись; галерея и фильтр; отправка заявки.

Проверки выполнены при подготовке проекта. Внешняя карта и Google Fonts в браузерных проверках были отключены; их доступность не проверялась. Повторная проверка W3C и полный аудит доступности после переноса не проводились.

## Авторы фотографий

- Фото в галерее, на карточках услуг, в команде и первом экране — [Unsplash](https://unsplash.com/license).
- Слайдер «до/после», Toyota Avalon: [teakwood](https://www.flickr.com/photos/teakwood/5533438415)
  ([второй кадр](https://www.flickr.com/photos/teakwood/5534022816)),
  [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Кадры совмещены и обрезаны;
  файлы `assets/img/ba-avalon-*.webp` распространяются под той же лицензией.
- Слайдер «до/после», Mitsubishi Eclipse: [Upstate Options Magazine](https://www.flickr.com/photos/49760791@N07/8541417537),
  [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Исходный кадр с двумя половинами разделён и совмещён.

## Форматирование исходников

HTML, CSS и JavaScript оформлены с отступом в 2 пробела. Длинные HTML-теги разбиты по атрибутам.
Готовые файлы Bootstrap в `assets/vendor/` оставлены в оригинальном минифицированном виде.
Код сайта для редактирования находится в корне проекта, `assets/css/` и `assets/js/`.

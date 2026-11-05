/*
 * Слой доступа к данным. Все страницы получают данные только через BlikAPI.
 *
 * Сейчас config.useMock = true: ответы собираются из window.BLIK_MOCK_DB
 * с искусственной задержкой. Чтобы подключить бэкенд:
 *   1. выставить useMock = false и baseUrl;
 *   2. убрать data.js из страниц;
 *   3. бэкенд должен отвечать в форматах, описанных в README.md.
 *
 * Для проверки состояния ошибки: телефон, оканчивающийся на 00-00,
 * заставляет мок вернуть ошибку 503.
 */
(function () {
  'use strict';

  const config = {
    baseUrl: '/api/v1',
    useMock: true,
    mockDelay: [250, 650],
  };

  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details || null;
    }
  }

  async function request(method, path, body) {
    let response;
    try {
      response = await fetch(config.baseUrl + path, {
        method: method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError('Нет соединения с сервером', 0);
    }
    const data = await response.json().catch(function () {
      return null;
    });
    if (!response.ok) {
      throw new ApiError(
        (data && data.message) || 'Ошибка сервера',
        response.status,
        data && data.errors,
      );
    }
    return data;
  }

  function db() {
    return window.BLIK_MOCK_DB;
  }

  function mock(producer) {
    const [min, max] = config.mockDelay;
    const delay = min + Math.random() * (max - min);
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          resolve(structuredClone(producer()));
        } catch (e) {
          reject(e);
        }
      }, delay);
    });
  }

  function query(params) {
    const q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') q.set(k, params[k]);
    });
    const s = q.toString();
    return s ? '?' + s : '';
  }

  function assertPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length !== 11)
      throw new ApiError('Проверьте номер телефона', 422, { phone: 'invalid' });
    if (digits.endsWith('0000')) throw new ApiError('Сервер заявок временно недоступен', 503);
  }

  function summarizeReviews(list) {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    list.forEach(function (r) {
      dist[r.rating] += 1;
      sum += r.rating;
    });
    return {
      average: list.length ? Math.round((sum / list.length) * 10) / 10 : 0,
      count: list.length,
      distribution: dist,
    };
  }

  const api = {
    config: config,
    ApiError: ApiError,

    /** GET /services → Service[] */
    getServices: function () {
      if (!config.useMock) return request('GET', '/services');
      return mock(function () {
        return db().services;
      });
    },

    /** GET /car-classes → CarClass[] */
    getCarClasses: function () {
      if (!config.useMock) return request('GET', '/car-classes');
      return mock(function () {
        return db().carClasses;
      });
    },

    /** GET /portfolio?service=slug → PortfolioItem[] */
    getPortfolio: function (params) {
      params = params || {};
      if (!config.useMock) return request('GET', '/portfolio' + query(params));
      return mock(function () {
        const all = db().portfolio;
        return params.service
          ? all.filter(function (p) {
              return p.services.indexOf(params.service) !== -1;
            })
          : all;
      });
    },

    /** GET /before-after?limit=n → BeforeAfter[] */
    getBeforeAfter: function (params) {
      params = params || {};
      if (!config.useMock) return request('GET', '/before-after' + query(params));
      return mock(function () {
        const all = db().beforeAfter;
        return params.limit ? all.slice(0, params.limit) : all;
      });
    },

    /**
     * GET /reviews?service=&sort=new|high|low&page=1&perPage=6
     * → { items, page, pages, total, summary: { average, count, distribution } }
     */
    getReviews: function (params) {
      params = Object.assign({ sort: 'new', page: 1, perPage: 6 }, params || {});
      if (!config.useMock) return request('GET', '/reviews' + query(params));
      return mock(function () {
        const all = db().reviews.slice();
        let list = params.service
          ? all.filter(function (r) {
              return r.service === params.service;
            })
          : all;
        list.sort(function (a, b) {
          if (params.sort === 'high') return b.rating - a.rating || b.date.localeCompare(a.date);
          if (params.sort === 'low') return a.rating - b.rating || b.date.localeCompare(a.date);
          return b.date.localeCompare(a.date);
        });
        const pages = Math.max(1, Math.ceil(list.length / params.perPage));
        const start = (params.page - 1) * params.perPage;
        return {
          items: list.slice(start, start + params.perPage),
          page: params.page,
          pages: pages,
          total: list.length,
          summary: summarizeReviews(all),
        };
      });
    },

    /** POST /reviews { name, car, service, rating, text } → { id, status: 'moderation' } */
    createReview: function (payload) {
      if (!config.useMock) return request('POST', '/reviews', payload);
      return mock(function () {
        if (!payload.rating) throw new ApiError('Поставьте оценку', 422, { rating: 'required' });
        return { id: Date.now(), status: 'moderation' };
      });
    },

    /**
     * POST /bookings { name, phone, car, service, date, comment, estimate?, consent }
     * → { id, status: 'new' }
     */
    createBooking: function (payload) {
      if (!config.useMock) return request('POST', '/bookings', payload);
      return mock(function () {
        assertPhone(payload.phone);
        return { id: Math.floor(1000 + Math.random() * 9000), status: 'new' };
      });
    },

    /** POST /leads { name, phone, channel, message, consent } → { id } */
    createLead: function (payload) {
      if (!config.useMock) return request('POST', '/leads', payload);
      return mock(function () {
        assertPhone(payload.phone);
        return { id: Math.floor(1000 + Math.random() * 9000) };
      });
    },

    /** GET /studio → { team, equipment, brands } */
    getStudio: function () {
      if (!config.useMock) return request('GET', '/studio');
      return mock(function () {
        return { team: db().team, equipment: db().equipment, brands: db().brands };
      });
    },

    /** GET /contacts → Contacts */
    getContacts: function () {
      if (!config.useMock) return request('GET', '/contacts');
      return mock(function () {
        return db().contacts;
      });
    },
  };

  window.BlikAPI = api;
})();

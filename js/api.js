(function () {
  const KEY = 'tankGamePayments';
  const AWARD_KEY = 'tankGamePaymentAwards';
  const ACTIVE_KEY = 'tankGameActiveCheckout';
  const RATE_LIMIT_KEY = 'tankGamePaymentLastRequestAt';

  const PAY_TYPES = {
    'Credit Card': 8004,
    'Apple Pay': 8003,
    'Google Pay': 8012,
    card: 8004,
    apple: 8003,
    google: 8012,
    8004: 8004,
    8003: 8003,
    8012: 8012
  };

  function safeLoad() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (error) { return []; }
  }

  function safeSave(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function safeAwardLoad() {
    try { return JSON.parse(localStorage.getItem(AWARD_KEY) || '[]'); } catch (error) { return []; }
  }

  function safeAwardSave(list) {
    localStorage.setItem(AWARD_KEY, JSON.stringify(list));
  }

  function randomToken() {
    const raw = String(Date.now()) + ':' + Math.random() + ':' + navigator.userAgent;
    if (window.CryptoJS && window.CryptoJS.SHA256) return window.CryptoJS.SHA256(raw).toString().slice(0, 32);
    return 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 14);
  }

  function buildReturnUrl(status, orderId, token) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('payment', status);
    url.searchParams.set('orderId', orderId);
    url.searchParams.set('paymentToken', token);
    return url.toString();
  }

  function getPayType(data) {
    const raw = data.payTypes || data.payType || data.method || 'Credit Card';
    return PAY_TYPES[raw] || 8004;
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function buildRecord(data) {
    const selectedPack = data.selectedPack || {};
    const id = data.orderId || ('TG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase());
    const amount = Number(selectedPack.usd || data.amount || 0);
    const totalCoins = Number(selectedPack.totalCoins || selectedPack.coins || data.coins || 0);
    const token = data.paymentToken || randomToken();
    const currentUser = window.TankGame && window.TankGame.auth ? window.TankGame.auth.getCurrentUser() : null;
    return {
      id,
      orderId: id,
      token,
      status: 'created',
      created_at: new Date().toISOString(),
      amount,
      currency: data.currency || 'USD',
      method: data.method || 'Credit Card',
      payTypes: getPayType(data),
      coins: Number(selectedPack.coins || 0),
      bonus: Number(selectedPack.bonus || 0),
      total_coins: totalCoins,
      pack_id: selectedPack.id || '',
      pack_name: selectedPack.title || data.name || 'Credit Pack',
      account_email: normalizeEmail(currentUser && currentUser.email ? currentUser.email : data.email),
      gateway_verified: false,
      coins_granted: 0,
      customer: {
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: normalizeEmail(data.email || (currentUser && currentUser.email) || ''),
        country: data.country || 'US',
        phone: data.phone || ''
      }
    };
  }

  function saveOrUpdate(record) {
    const list = safeLoad();
    const index = list.findIndex((entry) => entry.id === record.id || entry.orderId === record.orderId);
    if (index >= 0) list[index] = Object.assign({}, list[index], record);
    else list.push(record);
    safeSave(list.slice(-80));
  }

  function setActiveCheckout(record) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({
      orderId: record.orderId,
      token: record.token,
      account_email: record.account_email,
      pack_id: record.pack_id,
      amount: record.amount,
      total_coins: record.total_coins,
      created_at: record.created_at
    }));
  }

  function getActiveCheckout() {
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch (error) { return null; }
  }

  function clearActiveCheckout() {
    localStorage.removeItem(ACTIVE_KEY);
  }

  function validateRecordForRequest(record) {
    if (!record.amount || record.amount <= 0) throw new Error('Select a valid Credit Drop before checkout.');
    if (!record.total_coins || record.total_coins <= 0) throw new Error('Selected pack has no Credits configured.');
    if (!record.customer.email || !record.customer.email.includes('@')) throw new Error('Enter a valid email before checkout.');
    if (!record.customer.first_name) throw new Error('Enter first name before checkout.');
    if (!record.customer.last_name) throw new Error('Enter last name before checkout.');
  }

  function grantCoinsOnce(record) {
    const awarded = safeAwardLoad();
    if (awarded.includes(record.id) || record.coins_granted > 0) return false;
    if (!record.gateway_verified || record.status !== 'confirmed') return false;
    if (!record.total_coins || record.total_coins <= 0) return false;
    if (!window.TankGame || !window.TankGame.auth) return false;

    const currentUser = window.TankGame.auth.getCurrentUser();
    const currentEmail = normalizeEmail(currentUser && currentUser.email);
    if (record.account_email && currentEmail && record.account_email !== currentEmail) {
      record.status = 'account_mismatch';
      record.error = 'Payment account does not match current signed-in account.';
      saveOrUpdate(record);
      return false;
    }

    window.TankGame.auth.applyCoinPack({ coins: record.total_coins });
    awarded.push(record.id);
    safeAwardSave(awarded);
    record.coins_granted = record.total_coins;
    record.credited_at = new Date().toISOString();
    record.status = 'credited';
    saveOrUpdate(record);
    return true;
  }

  const PaymentAPI = {
    payTypes: PAY_TYPES,

    createPayment(data) {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        const last = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
        if (now - last < 1200) return reject(new Error('Checkout is already starting. Please wait.'));
        localStorage.setItem(RATE_LIMIT_KEY, String(now));

        const record = buildRecord(data || {});
        try {
          validateRecordForRequest(record);
        } catch (error) {
          record.status = 'validation_failed';
          record.error = error.message;
          saveOrUpdate(record);
          return reject(error);
        }

        saveOrUpdate(record);

        const options = {
          orderId: record.orderId,
          amount: record.amount,
          currency: record.currency,
          payTypes: record.payTypes,
          name: record.pack_name,
          email: record.customer.email,
          firstName: record.customer.first_name,
          lastName: record.customer.last_name,
          phone: record.customer.phone || '0000000000',
          successUrl: data.successUrl || buildReturnUrl('success', record.orderId, record.token),
          backUrl: data.backUrl || buildReturnUrl('failed', record.orderId, record.token)
        };

        record.request_options = options;

        try {
          if (typeof window.DoRequest !== 'function') {
            record.status = 'script_missing';
            record.error = 'Payment SDK not loaded.';
            saveOrUpdate(record);
            return reject(new Error('Payment SDK not loaded. Please check PayApi-v2.js and crypto-js.min.js.'));
          }
          record.status = 'requesting';
          record.requested_at = new Date().toISOString();
          saveOrUpdate(record);
          setActiveCheckout(record);
          window.DoRequest(options);
          resolve(record);
        } catch (error) {
          record.status = 'failed_to_request';
          record.error = error.message;
          saveOrUpdate(record);
          clearActiveCheckout();
          reject(error);
        }
      });
    },

    confirmPayment(id) {
      return new Promise((resolve, reject) => {
        const list = safeLoad();
        const item = list.find((entry) => entry.id === id || entry.orderId === id);
        if (!item) return reject(new Error('Payment not found'));
        if (!item.gateway_verified) return reject(new Error('Payment is not verified by checkout return.'));
        grantCoinsOnce(item);
        resolve(item);
      });
    },

    getPaymentStatus(id) {
      return new Promise((resolve, reject) => {
        const list = safeLoad();
        const item = list.find((entry) => entry.id === id || entry.orderId === id);
        if (!item) return reject(new Error('Payment not found'));
        setTimeout(() => resolve({
          id: item.id,
          orderId: item.orderId,
          status: item.status,
          amount: item.amount,
          total_coins: item.total_coins,
          coins_granted: item.coins_granted || 0,
          updated_at: new Date().toISOString()
        }), 150);
      });
    },

    handleReturnFromGateway() {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('payment');
      const orderId = params.get('orderId');
      const token = params.get('paymentToken');
      if (!status || !orderId) return null;

      const active = getActiveCheckout();
      const list = safeLoad();
      const item = list.find((entry) => entry.id === orderId || entry.orderId === orderId);
      if (!item) return { status: 'failed', error: 'Payment order not found.' };

      const tokenMatches = !!token && item.token === token && active && active.orderId === orderId && active.token === token;
      if (!tokenMatches) {
        item.status = 'return_rejected';
        item.error = 'Payment return verification failed.';
        item.returned_at = new Date().toISOString();
        saveOrUpdate(item);
        clearActiveCheckout();
        return item;
      }

      item.returned_at = new Date().toISOString();
      if (status === 'success') {
        item.status = 'confirmed';
        item.gateway_verified = true;
        grantCoinsOnce(item);
      } else {
        item.status = 'failed';
        item.gateway_verified = false;
        saveOrUpdate(item);
      }
      clearActiveCheckout();
      return item;
    },

    retryLastPayment() {
      const active = getActiveCheckout();
      if (!active) return Promise.reject(new Error('No active checkout to retry.'));
      const list = safeLoad();
      const item = list.find((entry) => entry.id === active.orderId || entry.orderId === active.orderId);
      if (!item) return Promise.reject(new Error('Previous checkout was not found.'));
      return this.createPayment({
        orderId: item.orderId,
        paymentToken: item.token,
        amount: item.amount,
        currency: item.currency,
        method: item.method,
        payTypes: item.payTypes,
        selectedPack: {
          id: item.pack_id,
          title: item.pack_name,
          usd: item.amount,
          coins: item.coins,
          bonus: item.bonus,
          totalCoins: item.total_coins
        },
        first_name: item.customer.first_name,
        last_name: item.customer.last_name,
        email: item.customer.email,
        country: item.customer.country,
        phone: item.customer.phone
      });
    }
  };

  window.TankGame = window.TankGame || {};
  window.TankGame.api = PaymentAPI;
})();

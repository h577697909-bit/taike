(function () {
  const COIN_PACKS = [
    { id: 'starter', title: 'Starter Crate', usd: 1.99, hkd: 16, coins: 180, bonus: 20, totalCoins: 200, badge: 'Starter', note: 'Best for your first upgrade and emergency gear.' },
    { id: 'field', title: 'Field Supply', usd: 4.99, hkd: 40, coins: 500, bonus: 50, totalCoins: 550, badge: 'Popular', note: 'Enough Credits for several battle items.' },
    { id: 'arsenal', title: 'Command Pack', usd: 9.99, hkd: 78, coins: 1080, bonus: 120, totalCoins: 1200, badge: 'Popular', note: 'Popular pack for gear upgrades and skin unlocks.' },
    { id: 'hangar', title: 'Hangar Vault', usd: 19.99, hkd: 158, coins: 2200, bonus: 300, totalCoins: 2500, badge: 'Skin Ready', note: 'Unlock premium armor and keep gear stocked.' },
    { id: 'command', title: 'Vault Pack', usd: 49.99, hkd: 388, coins: 6000, bonus: 1000, totalCoins: 7000, badge: 'Best Value', note: 'Best value for long runs, skins, and Battle Gear.' },
    { id: 'legend', title: 'Legend Pack', usd: 99.99, hkd: 788, coins: 13200, bonus: 1800, totalCoins: 15000, badge: 'Legendary', note: 'For collectors who want every skin and premium upgrade.' }
  ];

  const SHOP_ITEMS = [
    { key: 'repair', title: 'Repair Kit', icon: '+', desc: 'Restore 35 Armor instantly. Best emergency recovery.', cost: 90, rarity: 'Common' },
    { key: 'shield', title: 'Shield Core', icon: '◌', desc: 'Gain a 6-second shield. Perfect for Boss pressure.', cost: 140, rarity: 'Rare' },
    { key: 'rapid', title: 'Rapid Fire', icon: '≫', desc: 'Boost fire rate for 6 seconds. Melt enemy waves.', cost: 130, rarity: 'Rare' },
    { key: 'bomb', title: 'EMP Bomb', icon: '✦', desc: 'Clear pressure and disable the battlefield briefly.', cost: 220, rarity: 'Epic' }
  ];

  const SKINS = [
    { id: 'classic', title: 'Iron Rookie', cost: 0, preview: ['#22c55e', '#d9f99d'], rarity: 'Default', effect: 'Clean tracer', desc: 'Balanced field armor with a clean energy shot.' },
    { id: 'crimson', title: 'Crimson Raider', cost: 980, preview: ['#ef4444', '#fecaca'], rarity: 'Rare', effect: 'Ember rounds', desc: 'Red-hot armor. Shots leave warm ember sparks.' },
    { id: 'frost', title: 'Frost Breaker', cost: 1480, preview: ['#38bdf8', '#cffafe'], rarity: 'Epic', effect: 'Frost trails', desc: 'Ice-blue shell with cold glow bullet trails.' },
    { id: 'royal', title: 'Royal Vanguard', cost: 2280, preview: ['#8b5cf6', '#ede9fe'], rarity: 'Epic', effect: 'Pulse ring', desc: 'Command-grade armor with purple pulse impacts.' },
    { id: 'obsidian', title: 'Obsidian Phantom', cost: 3280, preview: ['#334155', '#e2e8f0'], rarity: 'Legendary', effect: 'Shadow wake', desc: 'Dark stealth plating with smoky shot trails.' },
    { id: 'aurora', title: 'Aurora Overdrive', cost: 4880, preview: ['#06b6d4', '#67e8f9'], rarity: 'Mythic', effect: 'Aurora burst', desc: 'Mythic neon armor with longer color shock trails.' }
  ];

  const WEAPONS = [
    { key: 'cannon', title: 'Cannon', hotkey: 'Drop', desc: 'Balanced single shot. Reliable in every zone.' },
    { key: 'burst', title: 'Burst', hotkey: 'Drop', desc: 'Triple shot. Strong against groups.' },
    { key: 'rail', title: 'Railgun', hotkey: 'Drop', desc: 'High-energy piercing shot for armor and Bosses.' }
  ];

  const FEATURED_BUNDLES = [
    { id: 'starter_bundle', title: 'Starter Loadout', coinCost: 260, skinId: 'crimson', items: { repair: 2, shield: 1, rapid: 1 }, note: 'Great first upgrade: Crimson skin plus core Battle Gear.' },
    { id: 'boss_bundle', title: 'Boss Breaker', coinCost: 420, skinId: '', items: { bomb: 1, shield: 2, rapid: 2 }, note: 'High-impact kit built for boss zones.' }
  ];

  const UI = {
    pages: {},
    currentPage: 'home',
    currentPaymentId: '',
    toastTimer: null,
    touchJoystickPointerId: null,
    touchFirePointerId: null,
    touchJoystickRadius: 34,
    selectedStage: 1,
    stageStorageKey: 'tankGameSelectedStage',
    selectedCoinPackId: 'arsenal',
    quickPurchaseItemKey: '',
    authMode: 'register',

    init() {
      this.pages = {
        home: document.getElementById('page-home'),
        auth: document.getElementById('page-auth'),
        game: document.getElementById('page-game'),
        stages: document.getElementById('page-stages'),
        settings: document.getElementById('page-settings'),
        profile: document.getElementById('page-profile'),
        shop: document.getElementById('page-shop'),
        legal: document.getElementById('page-legal')
      };
      this.selectedStage = this.loadSelectedStage();
      this.bindNavigation();
      this.bindSettings();
      this.bindAuthButtons();
      this.bindGameButtons();
      this.bindPaymentButtons();
      this.bindCheckoutProfileFields();
      this.bindQuickItems();
      this.bindKeyboardItemHotkeys();
      this.bindMobileControlButtons();
      this.bindCookieBanner();
      this.bindTouchControls();
      this.bindFullscreenControls();
      this.bindQuickPurchase();
      this.bindGuestGate();
      this.bindV7Systems();
      this.bindProfileAccount();
      this.renderStageSelect();
      this.renderWeapons();
      this.renderShop();
      this.refreshAll();
      document.body.dataset.page = 'home';
    },

    bindNavigation() {
      document.querySelectorAll('[data-nav]').forEach((button) => {
        button.addEventListener('click', () => this.showPage(button.dataset.nav));
      });
      document.getElementById('startGameBtn')?.addEventListener('click', () => this.startGameFromSelection());
      document.getElementById('playSelectedStageBtn')?.addEventListener('click', () => this.startGameFromSelection());
    },

    showPage(name) {
      this.currentPage = name;
      Object.keys(this.pages).forEach((key) => this.pages[key].classList.toggle('active', key === name));
      document.body.dataset.page = name;
      if (name === 'game') this.updateShopRenderState();
      if (name === 'profile') { this.renderScoreHistory(); this.renderAchievements(); this.renderDailyReward(); }
      if (name === 'stages') this.renderStageSelect();
      if (name === 'shop') { this.renderShop(); this.syncCheckoutFields(true); }
    },

    startGameFromSelection() {
      if (window.TankGame.auth.isGuest && window.TankGame.auth.isGuest() && this.selectedStage > 1) {
        this.selectedStage = 1;
        this.saveSelectedStage && this.saveSelectedStage(1);
        this.showToast('Guest Run is limited to Zone 1. Sign in to unlock more zones.');
      }
      this.showPage('game');
      window.TankGame.game.start(this.selectedStage);
      this.hideGameOverlay();
      this.hideResultPanel(); this.showToast('DEPLOYING TO ZONE ' + this.selectedStage);
    },

bindSettings() {
  const music = document.getElementById('musicToggle');
  const sound = document.getElementById('soundToggle');
  const contrast = document.getElementById('contrastToggle');
  const accessibility = document.getElementById('accessibilityToggle');
  const childMode = document.getElementById('childModeToggle');
  if (music) music.addEventListener('change', () => { document.body.dataset.music = music.checked ? 'true' : 'false'; });
  if (sound) sound.addEventListener('change', () => { document.body.dataset.sound = sound.checked ? 'true' : 'false'; });
  if (contrast) contrast.addEventListener('change', () => document.body.classList.toggle('high-contrast', contrast.checked));
  if (accessibility) accessibility.addEventListener('change', () => document.body.classList.toggle('accessibility-mode', accessibility.checked));
  if (childMode) childMode.addEventListener('change', () => {
    document.body.dataset.childMode = childMode.checked ? 'true' : 'false';
    this.refreshAll();
  });
  const controlMode = document.getElementById('mobileControlModeSelect');
  const fireToggle = document.getElementById('alwaysFireToggle');
  const vibrationToggle = document.getElementById('vibrationToggle');
  const savedMode = localStorage.getItem('tankGameMobileControlMode') || 'joystick';
  const savedFire = localStorage.getItem('tankGameAlwaysFire') !== 'false';
  const savedVibration = localStorage.getItem('tankGameVibration') !== 'false';
  if (controlMode) controlMode.value = savedMode;
  if (fireToggle) fireToggle.checked = savedFire;
  if (vibrationToggle) vibrationToggle.checked = savedVibration;
  this.applyMobileControlMode(savedMode);
  document.body.dataset.alwaysFire = savedFire ? 'true' : 'false';
  document.body.dataset.vibration = savedVibration ? 'true' : 'false';
  if (controlMode) controlMode.addEventListener('change', () => {
    localStorage.setItem('tankGameMobileControlMode', controlMode.value);
    this.applyMobileControlMode(controlMode.value);
  });
  if (fireToggle) fireToggle.addEventListener('change', () => {
    localStorage.setItem('tankGameAlwaysFire', fireToggle.checked ? 'true' : 'false');
    document.body.dataset.alwaysFire = fireToggle.checked ? 'true' : 'false';
  });
  if (vibrationToggle) vibrationToggle.addEventListener('change', () => {
    localStorage.setItem('tankGameVibration', vibrationToggle.checked ? 'true' : 'false');
    document.body.dataset.vibration = vibrationToggle.checked ? 'true' : 'false';
  });
},

    setAuthMode(mode) {
      this.authMode = mode === 'login' ? 'login' : 'register';
      const register = this.authMode === 'register';
      const title = document.getElementById('authModeTitle');
      const hint = document.getElementById('authModeHint');
      const extra = document.getElementById('registerExtraFields');
      const confirmWrap = document.getElementById('confirmPasswordWrap');
      const createBtn = document.getElementById('createAccountBtn');
      const signInBtn = document.getElementById('signInBtn');
      const registerTab = document.getElementById('authRegisterTab');
      const loginTab = document.getElementById('authLoginTab');
      const guestTab = document.getElementById('authGuestTab');
      if (title) title.textContent = register ? 'Create Pilot ID' : 'Sign In';
      if (hint) hint.textContent = register ? 'Register a new pilot profile. Progress, Credits, skins, achievements, and stage stars will be saved under this email.' : 'Sign in with an existing Pilot Email and Access Code to continue your saved progress.';
      if (extra) extra.classList.toggle('hidden', !register);
      if (confirmWrap) confirmWrap.classList.toggle('hidden', !register);
      if (createBtn) createBtn.style.display = register ? '' : 'none';
      if (signInBtn) signInBtn.style.display = register ? 'none' : '';
      if (registerTab) registerTab.classList.toggle('active', register);
      if (loginTab) loginTab.classList.toggle('active', !register);
      if (guestTab) guestTab.classList.remove('active');
      this.setAuthMessage('', false);
    },

    setAuthMessage(message, isError) {
      const box = document.getElementById('authMessage');
      if (!box) return;
      box.textContent = message || '';
      box.classList.toggle('hidden', !message);
      box.classList.toggle('error', !!isError);
    },

    bindAuthButtons() {
      const safeOn = (id, eventName, handler) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound === 'true') return;
        el.dataset.bound = 'true';
        el.addEventListener(eventName, handler);
      };
      safeOn('openLoginBtn', 'click', () => { this.setAuthMode('register'); this.showPage('auth'); });
      safeOn('logoutBtn', 'click', () => {
        window.TankGame.auth.logout();
        this.handleAccountChanged();
        this.refreshAll();
        this.showToast('Signed out');
      });
      safeOn('accountLoginAction', 'click', () => { this.setAuthMode('login'); this.showPage('auth'); });
      safeOn('accountLogoutAction', 'click', () => {
        window.TankGame.auth.logout();
        this.handleAccountChanged();
        this.showToast('SIGNED OUT');
        this.showPage('home');
        this.refreshAll();
      });
      safeOn('accountMenuBtn', 'click', () => {
        const menu = document.getElementById('accountMenu');
        if (menu) menu.classList.toggle('open');
      });
      safeOn('authRegisterTab', 'click', () => this.setAuthMode('register'));
      safeOn('authLoginTab', 'click', () => this.setAuthMode('login'));
      safeOn('authGuestTab', 'click', () => {
        const tab = document.getElementById('authGuestTab');
        if (tab) tab.classList.add('active');
        this.startGuestRun();
      });

      const completeAuth = (mode) => {
        const emailEl = document.getElementById('loginEmail');
        const passwordEl = document.getElementById('loginPassword');
        const confirmEl = document.getElementById('loginConfirmPassword');
        const email = emailEl ? emailEl.value : '';
        const password = passwordEl ? passwordEl.value : '';
        try {
          if (mode === 'register') {
            if (window.TankGame.auth.emailExists && window.TankGame.auth.emailExists(email)) {
              throw new Error('This email is already registered. Please sign in.');
            }
            if (confirmEl && confirmEl.value && confirmEl.value !== password) {
              throw new Error('Access Code confirmation does not match.');
            }
            const extras = {
              name: (document.getElementById('pilotNameInput') || {}).value || '',
              firstName: (document.getElementById('pilotFirstNameInput') || {}).value || '',
              lastName: (document.getElementById('pilotLastNameInput') || {}).value || '',
              country: (document.getElementById('pilotCountryInput') || {}).value || 'US'
            };
            window.TankGame.auth.register(email, password, extras);
            this.setAuthMessage('Pilot ID created. Your progress will be saved to this account.', false);
            this.showToast('Pilot ID created');
          } else {
            window.TankGame.auth.login(email, password);
            this.setAuthMessage('Signed in. Welcome back, pilot.', false);
            this.showToast('Signed in');
          }
          this.handleAccountChanged();
          this.refreshAll();
          this.selectedStage = 1;
          this.startGameFromSelection();
        } catch (error) {
          const msg = error.message || 'Account action failed';
          this.setAuthMessage(msg, true);
          this.showToast(msg);
        }
      };
      safeOn('loginForm', 'submit', (event) => {
        event.preventDefault();
        completeAuth(this.authMode || 'register');
      });
      safeOn('signInBtn', 'click', () => completeAuth('login'));
      safeOn('createAccountBtn', 'click', () => { this.authMode = 'register'; });
      safeOn('guestLoginBtn', 'click', () => this.startGuestRun());
      safeOn('googleLoginBtn', 'click', () => {
        window.TankGame.auth.loginWithProvider('Google');
        this.handleAccountChanged();
        this.refreshAll();
        this.showPage('home');
        this.showToast('Google pilot ready');
      });
      safeOn('appleLoginBtn', 'click', () => {
        window.TankGame.auth.loginWithProvider('Apple');
        this.handleAccountChanged();
        this.refreshAll();
        this.showPage('home');
        this.showToast('Apple pilot ready');
      });
      this.setAuthMode('register');
    },

    startGuestRun() {
      window.TankGame.auth.loginGuest();
      this.handleAccountChanged();
      this.refreshAll();
      this.showToast('Guest Run started');
      this.selectedStage = 1;
      this.startGameFromSelection();
    },

    bindCheckoutProfileFields() {
      ['payFirstName', 'payLastName', 'payEmail', 'payPhone', 'payCountry'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.dataset.checkoutBound !== 'true') {
          el.dataset.checkoutBound = 'true';
          el.addEventListener('input', () => this.saveCheckoutProfile());
          el.addEventListener('change', () => this.saveCheckoutProfile());
        }
      });
    },

    bindGameButtons() {
      document.getElementById('newGameBtn')?.addEventListener('click', () => this.startGameFromSelection());
      document.getElementById('mobileNewGameBtn')?.addEventListener('click', () => this.startGameFromSelection());
      const mobileLobby = document.getElementById('mobileLobbyBtn');
      if (mobileLobby && mobileLobby.dataset.lobbyBound !== 'true') {
        mobileLobby.dataset.lobbyBound = 'true';
        mobileLobby.addEventListener('click', () => {
          try { if (window.TankGame.game.state === 'playing') window.TankGame.game.pause(); } catch (error) {}
          this.showPage('home');
        });
      }
      const mobileLobbyFloat = document.getElementById('mobileLobbyFloatBtn');
      if (mobileLobbyFloat && mobileLobbyFloat.dataset.lobbyBound !== 'true') {
        mobileLobbyFloat.dataset.lobbyBound = 'true';
        mobileLobbyFloat.addEventListener('click', () => {
          try { if (window.TankGame.game.state === 'playing') window.TankGame.game.pause(); } catch (error) {}
          this.showPage('home');
        });
      }
      document.getElementById('pauseGameBtn')?.addEventListener('click', () => window.TankGame.game.pause());
      document.getElementById('resumeGameBtn')?.addEventListener('click', () => window.TankGame.game.resume());
      document.getElementById('mobilePauseBtn')?.addEventListener('click', () => {
        if (window.TankGame.game.state === 'playing') window.TankGame.game.pause();
        else if (window.TankGame.game.state === 'paused') window.TankGame.game.resume();
      });
    },

    bindCookieBanner() {
      const banner = document.getElementById('cookieBanner');
      if (!localStorage.getItem('tankGameCookieConsent')) banner.classList.remove('hidden');
      document.getElementById('acceptCookiesBtn').addEventListener('click', () => {
        localStorage.setItem('tankGameCookieConsent', 'accepted');
        banner.classList.add('hidden');
      });
      document.getElementById('declineCookiesBtn').addEventListener('click', () => {
        localStorage.setItem('tankGameCookieConsent', 'declined');
        banner.classList.add('hidden');
      });
    },

    accountScopedKey(suffix, user) {
      const account = user || (window.TankGame && window.TankGame.auth ? window.TankGame.auth.getCurrentUser() : null);
      const email = String((account && account.email) || 'guest@local').trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
      return 'tankGameV892:account:' + email + ':' + suffix;
    },

    checkoutStorageKey(user) {
      return this.accountScopedKey('checkout', user);
    },

    getStageStorageKey() {
      return this.accountScopedKey('selectedStage');
    },

    handleAccountChanged() {
      this.selectedStage = this.loadSelectedStage();
      const form = document.getElementById('paymentForm');
      if (form) form.dataset.accountEmail = '';
      this.syncCheckoutFields(true);
      this.renderStageSelect();
      this.hideResultPanel();
      this.hideGuestStageGate();
    },

    getShortAccountName(user) {
      if (!user || user.guest) return 'Guest';
      const raw = String(user.name || user.email || 'Pilot').trim();
      if (raw.includes('@')) return raw.split('@')[0].slice(0, 12);
      return raw.slice(0, 14);
    },

    readCheckoutProfile(user) {
      try { return JSON.parse(localStorage.getItem(this.checkoutStorageKey(user)) || '{}') || {}; }
      catch (error) { return {}; }
    },

    saveCheckoutProfile() {
      const user = window.TankGame.auth.getCurrentUser ? window.TankGame.auth.getCurrentUser() : null;
      if (!user) return;
      const data = {
        firstName: (document.getElementById('payFirstName') || {}).value || '',
        lastName: (document.getElementById('payLastName') || {}).value || '',
        email: (document.getElementById('payEmail') || {}).value || '',
        phone: (document.getElementById('payPhone') || {}).value || '',
        country: (document.getElementById('payCountry') || {}).value || 'US'
      };
      localStorage.setItem(this.checkoutStorageKey(user), JSON.stringify(data));
    },

    syncCheckoutFields(force) {
      const form = document.getElementById('paymentForm');
      if (!form || !window.TankGame || !window.TankGame.auth) return;
      const user = window.TankGame.auth.getCurrentUser();
      const accountEmail = String((user && user.email) || 'guest@local').toLowerCase();
      if (!force && form.dataset.accountEmail === accountEmail) return;
      form.dataset.accountEmail = accountEmail;
      const saved = this.readCheckoutProfile(user);
      const nameParts = String((user && user.name) || '').trim().split(/\s+/).filter(Boolean);
      const values = {
        payFirstName: saved.firstName || nameParts[0] || '',
        payLastName: saved.lastName || nameParts.slice(1).join(' ') || '',
        payEmail: saved.email || ((user && !user.guest && user.email) ? user.email : ''),
        payPhone: saved.phone || '',
        payCountry: saved.country || (user && user.country) || 'US'
      };
      Object.keys(values).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = values[id];
      });
    },

    setPaymentBusy(isBusy, message) {
      const payBtn = document.getElementById('createPaymentBtn');
      const confirmBtn = document.getElementById('confirmPaymentModalBtn');
      const status = document.getElementById('paymentResult');
      if (payBtn) {
        payBtn.disabled = !!isBusy;
        payBtn.classList.toggle('is-loading', !!isBusy);
        payBtn.textContent = isBusy ? 'Opening Checkout...' : 'Open Checkout';
      }
      if (confirmBtn) {
        confirmBtn.disabled = !!isBusy;
        confirmBtn.classList.toggle('is-loading', !!isBusy);
        confirmBtn.textContent = isBusy ? 'Opening...' : 'Pay Now';
      }
      if (status && message) status.textContent = message;
    },

    getCheckoutCustomer() {
      const user = window.TankGame.auth.getCurrentUser ? window.TankGame.auth.getCurrentUser() : {};
      const profileName = String(user.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = (document.getElementById('payFirstName') && document.getElementById('payFirstName').value.trim()) || profileName[0] || 'Player';
      const lastName = (document.getElementById('payLastName') && document.getElementById('payLastName').value.trim()) || profileName.slice(1).join(' ') || 'One';
      const email = (document.getElementById('payEmail') && document.getElementById('payEmail').value.trim()) || user.email || '';
      const country = (document.getElementById('payCountry') && document.getElementById('payCountry').value.trim()) || user.country || 'US';
      const phone = (document.getElementById('payPhone') && document.getElementById('payPhone').value.trim()) || '0000000000';
      this.saveCheckoutProfile();
      return { first_name: firstName, last_name: lastName, email, country, phone };
    },

    async startSecureCheckout(pack, method, payType, customer) {
      if (!pack) throw new Error('Select a Credit Drop first.');
      if (document.body.dataset.childMode === 'true') throw new Error('Payments are disabled in Safe Mode.');
      this.setPaymentBusy(true, 'Opening secure checkout. Do not refresh this page.');
      this.showToast('Opening secure checkout...');
      try {
        const result = await window.TankGame.api.createPayment(Object.assign({}, customer || this.getCheckoutCustomer(), {
          method: method || 'Credit Card',
          payTypes: payType || 8004,
          selectedPack: pack
        }));
        this.currentPaymentId = result.id;
        const box = document.getElementById('paymentResult');
        if (box) box.textContent = 'Checkout started: ' + result.orderId + '\nReturn to this page after payment to receive Credits.';
        return result;
      } catch (error) {
        this.setPaymentBusy(false, error.message);
        this.showToast(error.message);
        throw error;
      }
    },

    updatePaymentModalSummary() {
      const pack = COIN_PACKS.find((entry) => entry.id === this.selectedCoinPackId) || COIN_PACKS[2];
      const label = document.getElementById('modalPackLabel');
      const value = document.getElementById('modalPackValue');
      if (label) label.textContent = pack.title + ' · $' + pack.usd;
      if (value) value.textContent = pack.totalCoins + ' Credits';
    },

    openPaymentModal() {
      const modal = document.getElementById('paymentModal');
      if (!modal) return;
      this.syncCheckoutFields(true);
      this.updatePaymentModalSummary();
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('payment-modal-open');
      const first = document.getElementById('payFirstName');
      if (first) setTimeout(() => first.focus(), 40);
    },

    closePaymentModal() {
      const modal = document.getElementById('paymentModal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('payment-modal-open');
    },

    bindPaymentButtons() {
      const methodCards = Array.from(document.querySelectorAll('#paymentModal .method-card'));
      this.selectedPaymentMethod = 'Credit Card';
      this.selectedPayType = 8004;
      methodCards.forEach((card, index) => {
        if (index === 0) card.classList.add('active');
        card.addEventListener('click', () => {
          methodCards.forEach((node) => node.classList.remove('active'));
          card.classList.add('active');
          this.selectedPaymentMethod = card.textContent.trim();
          this.selectedPayType = Number(card.dataset.payType || 8004);
        });
      });

      const payBtn = document.getElementById('createPaymentBtn');
      if (payBtn) {
        payBtn.addEventListener('click', () => {
          this.openPaymentModal();
        });
      }

      const confirmBtn = document.getElementById('confirmPaymentModalBtn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          const form = document.getElementById('paymentForm');
          if (form && typeof form.reportValidity === 'function' && !form.reportValidity()) return;
          const pack = COIN_PACKS.find((entry) => entry.id === this.selectedCoinPackId) || COIN_PACKS[2];
          try {
            await this.startSecureCheckout(pack, this.selectedPaymentMethod || 'Credit Card', this.selectedPayType || 8004);
            this.closePaymentModal();
            this.setPaymentBusy(false);
          } catch (error) { /* handled in startSecureCheckout */ }
        });
      }

      ['closePaymentModalBtn', 'cancelPaymentModalBtn'].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => this.closePaymentModal());
      });
      document.querySelectorAll('[data-close-payment-modal]').forEach((node) => {
        node.addEventListener('click', () => this.closePaymentModal());
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.closePaymentModal();
      });

      const checkBtn = document.getElementById('checkPaymentBtn');
      if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
          try {
            if (!this.currentPaymentId) throw new Error('Start checkout first.');
            const result = await window.TankGame.api.getPaymentStatus(this.currentPaymentId);
            document.getElementById('paymentResult').textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            document.getElementById('paymentResult').textContent = error.message;
          }
        });
      }
    },
bindQuickItems() {
  document.querySelectorAll('.quick-use-btn').forEach((button) => {
    button.addEventListener('click', () => this.useQuickItem(button.dataset.item));
  });
},

useQuickItem(itemKey) {
  if (!itemKey) return;
  if (document.body.dataset.childMode === 'true') return this.showToast('Shop is disabled in Safe Mode.');
  try {
    window.TankGame.auth.consumeItem(itemKey);
    window.TankGame.game.useInventoryItem(itemKey);
    if (document.body.dataset.vibration === 'true' && navigator.vibrate) navigator.vibrate(18);
    this.refreshAll();
    this.showToast('Item activated: ' + itemKey.toUpperCase());
  } catch (error) {
    this.openQuickPurchase(itemKey);
  }
},

bindKeyboardItemHotkeys() {
  const keyToItem = { q: 'repair', e: 'shield', r: 'rapid', f: 'bomb' };
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;
    const key = event.key.toLowerCase();
    const item = keyToItem[key];
    if (!item) return;
    event.preventDefault();
    this.useQuickItem(item);
  });
},

applyMobileControlMode(mode) {
  const safeMode = ['joystick', 'buttons', 'hybrid'].includes(mode) ? mode : 'joystick';
  document.body.dataset.mobileControlMode = safeMode;
  const dpad = document.getElementById('mobileDpad');
  const joystick = document.getElementById('joystickZone');
  if (dpad) dpad.setAttribute('aria-hidden', safeMode === 'joystick' ? 'true' : 'false');
  if (joystick) joystick.setAttribute('aria-hidden', safeMode === 'buttons' ? 'true' : 'false');
  window.TankGame.game.clearTouchVector();
},

bindMobileControlButtons() {
  const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const active = new Set();
  const updateVector = () => {
    let x = 0, y = 0;
    active.forEach((dir) => { x += vectors[dir][0]; y += vectors[dir][1]; });
    const length = Math.hypot(x, y);
    if (length > 0) window.TankGame.game.setTouchVector(x / length, y / length);
    else window.TankGame.game.clearTouchVector();
  };
  document.querySelectorAll('.dpad-btn').forEach((button) => {
    const dir = button.dataset.move;
    const start = (event) => {
      event.preventDefault();
      active.add(dir);
      button.classList.add('pressed');
      if (button.setPointerCapture && event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
      updateVector();
    };
    const end = (event) => {
      event.preventDefault();
      active.delete(dir);
      button.classList.remove('pressed');
      updateVector();
    };
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    button.addEventListener('pointerleave', end);
  });
},

    bindQuickPurchase() {
      document.querySelectorAll('[data-close-quick-purchase], #closeQuickPurchaseBtn, #quickPurchaseCancelBtn').forEach((node) => {
        node.addEventListener('click', () => this.closeQuickPurchase());
      });
      document.getElementById('quickPurchaseConfirmBtn').addEventListener('click', () => {
        if (!this.quickPurchaseItemKey) return;
        const item = SHOP_ITEMS.find((entry) => entry.key === this.quickPurchaseItemKey);
        if (!item) return;
        try {
          window.TankGame.auth.purchaseItem(item.key, item.cost);
          this.refreshAll();
          this.closeQuickPurchase();
          this.showToast('Purchased ' + item.title);
        } catch (error) {
          if (String(error.message || '').toLowerCase().includes('credit') || String(error.message || '').toLowerCase().includes('coin') || String(error.message || '').toLowerCase().includes('not enough')) {
            this.goToCreditPacks('Not enough Credits. Recharge to restock ' + item.title + '.');
          } else {
            this.showToast(error.message);
          }
        }
      });
    },

    isMobileViewport() {
      return window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
    },

    goToCreditPacks(message) {
      try {
        if (window.TankGame && window.TankGame.game && window.TankGame.game.state === 'playing') window.TankGame.game.pause();
      } catch (error) {}
      this.closeQuickPurchase();
      this.showPage('shop');
      this.renderShop();
      const target = document.querySelector('.coin-pack-panel') || document.getElementById('coinPackGrid') || document.getElementById('page-shop');
      if (target && target.scrollIntoView) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      this.showToast(message || 'Recharge Credits to continue.');
    },

    openQuickPurchase(itemKey) {
      const item = SHOP_ITEMS.find((entry) => entry.key === itemKey);
      if (!item) return;
      const inventory = window.TankGame.auth.getInventory();
      if (this.isMobileViewport() && Number(inventory.coins || 0) < Number(item.cost || 0)) {
        this.quickPurchaseItemKey = itemKey;
        this.goToCreditPacks('Not enough Credits for ' + item.title + '. Recharge first.');
        return;
      }
      this.quickPurchaseItemKey = itemKey;
      document.getElementById('quickPurchaseTitle').textContent = item.title;
      document.getElementById('quickPurchaseDesc').textContent = item.desc;
      document.getElementById('quickPurchaseIcon').textContent = item.icon;
      document.getElementById('quickPurchaseCoins').textContent = inventory.coins;
      document.getElementById('quickPurchaseCost').textContent = item.cost + ' Credits';
      document.getElementById('quickPurchaseModal').classList.remove('hidden');
    },
    closeQuickPurchase() {
      this.quickPurchaseItemKey = '';
      const modal = document.getElementById('quickPurchaseModal');
      if (modal) modal.classList.add('hidden');
    },

    bindTouchControls() {
      const zone = document.getElementById('joystickZone');
      const knob = document.getElementById('joystickKnob');
      const shootBtn = document.getElementById('mobileShootBtn');
      if (!zone || !knob) return;
      const resetKnob = () => {
        knob.style.transform = 'translate(-50%, -50%)';
        window.TankGame.game.clearTouchVector();
        this.touchJoystickPointerId = null;
      };
      zone.addEventListener('pointerdown', (event) => {
        this.touchJoystickPointerId = event.pointerId;
        zone.setPointerCapture(event.pointerId);
      });
      zone.addEventListener('pointermove', (event) => {
        if (event.pointerId !== this.touchJoystickPointerId) return;
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = event.clientX - centerX;
        let dy = event.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const max = this.touchJoystickRadius;
        if (dist > max) {
          dx = (dx / dist) * max;
          dy = (dy / dist) * max;
        }
        knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        window.TankGame.game.setTouchVector(dx / max, dy / max);
      });
      zone.addEventListener('pointerup', resetKnob);
      zone.addEventListener('pointercancel', resetKnob);

      const stopShoot = () => window.TankGame.game.setTouchShooting(false);
      shootBtn.addEventListener('pointerdown', (event) => {
        this.touchFirePointerId = event.pointerId;
        shootBtn.setPointerCapture(event.pointerId);
        window.TankGame.game.setTouchShooting(true);
      });
      shootBtn.addEventListener('pointerup', stopShoot);
      shootBtn.addEventListener('pointercancel', stopShoot);
    },

    bindFullscreenControls() {
      const btn = document.getElementById('mobileFullscreenBtn');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        const wrap = document.getElementById('canvasWrap');
        try {
          if (!document.fullscreenElement && wrap.requestFullscreen) await wrap.requestFullscreen();
          else if (document.exitFullscreen) await document.exitFullscreen();
        } catch (error) {
          this.showToast('Fullscreen is not supported here');
        }
      });
    },


    bindGuestGate() {
      const modal = document.getElementById('guestGateModal');
      if (!modal) return;
      const close = () => this.hideGuestStageGate();
      const login = () => { this.hideGuestStageGate(); this.showPage('auth'); };
      const replay = () => {
        this.hideGuestStageGate();
        this.selectedStage = 1;
        localStorage.setItem(this.getStageStorageKey(), '1');
        this.renderStageSelect();
        this.startGameFromSelection();
      };
      document.getElementById('closeGuestGateBtn')?.addEventListener('click', close);
      document.getElementById('guestGateLoginBtn')?.addEventListener('click', login);
      document.getElementById('guestGateStayBtn')?.addEventListener('click', replay);
      modal.querySelector('[data-close-guest-gate]')?.addEventListener('click', close);
    },

    showGuestStageGate() {
      const modal = document.getElementById('guestGateModal');
      if (!modal) return this.showPage('auth');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      this.showToast('Guest mode only includes Zone 1. Sign in to continue.');
    },

    hideGuestStageGate() {
      const modal = document.getElementById('guestGateModal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    },

    renderStageSelect() {
      const stages = [
        { id: 1, title: 'Neon Outpost', desc: 'Training zone with open lanes. Learn movement, shooting, and drops.', tags: ['Training', 'Open Map'], boss: false, twist: 'Basic Drops' },
        { id: 2, title: 'Steel Crossing', desc: 'Steel walls and water lines create early route pressure.', tags: ['Steel Walls', 'Water'], boss: false, twist: 'Route Control' },
        { id: 3, title: 'Overlord Gate', desc: 'First Boss zone. Dodge spread fire and protect the base.', tags: ['Boss', 'Warning Intro'], boss: true, twist: 'First Boss' },
        { id: 4, title: 'Crystal Split', desc: 'Multiple lanes force quick target switching and item timing.', tags: ['Split Lanes', 'Tempo'], boss: false, twist: 'Lane Swap' },
        { id: 5, title: 'Floodline Core', desc: 'Water narrows movement space. Shields become valuable here.', tags: ['Water Maze', 'Pressure'], boss: false, twist: 'Water Routes' },
        { id: 6, title: 'Hydra Lockdown', desc: 'Second Boss zone with a cleaner arena and heavier rewards.', tags: ['Boss', 'Spread Fire'], boss: true, twist: 'Hydra Boss' },
        { id: 7, title: 'Supply Rush', desc: 'Higher drop tempo rewards aggressive pickup routes.', tags: ['Drops', 'Tempo'], boss: false, twist: 'Drop Boost' },
        { id: 8, title: 'Crossfire Yard', desc: 'Enemies push from multiple angles, but spawns ramp gradually.', tags: ['Crossfire', 'Waves'], boss: false, twist: 'Multi-Point Push' },
        { id: 9, title: 'Titan Alarm', desc: 'Third Boss zone with higher armor and stronger pressure.', tags: ['Boss', 'Heavy Armor'], boss: true, twist: 'Titan Boss' },
        { id: 10, title: 'Ghost Channel', desc: 'Open lanes reward Railgun pickups and long shots.', tags: ['Open Lane', 'Rail'], boss: false, twist: 'Long Shot' },
        { id: 11, title: 'Final Relay', desc: 'Endurance test with more enemies and controlled ramp-up.', tags: ['Final Wave', 'Endurance'], boss: false, twist: 'Endurance' },
        { id: 12, title: 'Dreadnought End', desc: 'Current final Boss zone. Replay it for score and rewards.', tags: ['Final Boss', 'Big Reward'], boss: true, twist: 'Final Boss' }
      ];
      const grid = document.getElementById('stageSelectGrid');
      const title = document.getElementById('selectedStageTitle');
      const desc = document.getElementById('selectedStageDesc');
      const homeSelected = document.getElementById('homeSelectedStage');
      if (!grid) return;
      const guest = window.TankGame.auth.isGuest && window.TankGame.auth.isGuest();
      if (guest && this.selectedStage > 1) this.selectedStage = 1;
      grid.innerHTML = stages.map((stage) => {
        const locked = guest && stage.id > 1;
        return '<button class="stage-card ' + (stage.boss ? 'boss ' : '') + (locked ? 'locked ' : '') + (stage.id === this.selectedStage ? 'active' : '') + '" data-stage="' + stage.id + '">' +
          '<div class="stage-card-top"><h4>Stage ' + stage.id + '</h4><span class="stage-badge">' + (locked ? 'Login' : (stage.boss ? 'Boss' : 'Standard')) + '</span></div>' +
          '<strong>' + stage.title + '</strong>' +
          '<p class="muted">' + stage.desc + '</p>' +
          '<div class="stage-twist">' + stage.twist + '</div>' +
          '<div class="stage-stars">' + '★'.repeat(this.getStageStars(stage.id)) + '☆'.repeat(3 - this.getStageStars(stage.id)) + '</div>' +
          '<div class="pill-row small">' + stage.tags.map((tag) => '<span class="pill">' + tag + '</span>').join('') + '</div>' +
        '</button>';
      }).join('');
      const active = stages.find((stage) => stage.id === this.selectedStage) || stages[0];
      title.textContent = 'Stage ' + active.id + ' • ' + active.title;
      desc.textContent = active.desc + (guest ? ' (Guest trial: Zone 1 only)' : '');
      if (homeSelected) homeSelected.textContent = 'Stage ' + active.id + ' • ' + active.title;
      grid.querySelectorAll('[data-stage]').forEach((button) => {
        button.addEventListener('click', () => {
          const nextStage = Number(button.dataset.stage);
          if (guest && nextStage > 1) { this.showGuestStageGate(); return; }
          this.selectedStage = nextStage;
          localStorage.setItem(this.getStageStorageKey(), String(this.selectedStage));
          this.renderStageSelect();
        });
      });
    },

    loadSelectedStage() {
      const raw = Number(localStorage.getItem(this.getStageStorageKey()) || 1);
      return Number.isFinite(raw) ? Math.max(1, Math.min(12, Math.floor(raw))) : 1;
    },
    skinTitleById(id) {
      const skin = SKINS.find((item) => item.id === id);
      return skin ? skin.title : 'Classic';
    },
    weaponTitleById(id) {
      const weapon = WEAPONS.find((item) => item.key === id);
      return weapon ? weapon.title : 'Cannon';
    },


    bindV7Systems() {
      document.getElementById('claimDailyBtn')?.addEventListener('click', () => this.claimDailyReward());
      document.getElementById('profileClaimDailyBtn')?.addEventListener('click', () => this.claimDailyReward());
      document.getElementById('tutorialGotItBtn')?.addEventListener('click', () => this.closeTutorial());
      document.getElementById('resultRetryBtn')?.addEventListener('click', () => { this.hideResultPanel(); this.startGameFromSelection(); });
      document.getElementById('resultUpgradeBtn')?.addEventListener('click', () => { this.hideResultPanel(); this.showPage('shop'); });
      document.getElementById('closeStarterOfferBtn')?.addEventListener('click', () => this.closeStarterOffer());
      document.getElementById('starterOfferClaimBtn')?.addEventListener('click', () => this.claimStarterOffer());
      if (!localStorage.getItem(this.accountScopedKey('tutorialDone'))) setTimeout(() => this.openTutorial(), 500);
    },

    openTutorial() {
      const panel = document.getElementById('tutorialPanel');
      if (!panel) return;
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
    },
    closeTutorial() {
      localStorage.setItem(this.accountScopedKey('tutorialDone'), 'true');
      const panel = document.getElementById('tutorialPanel');
      if (panel) { panel.classList.add('hidden'); panel.setAttribute('aria-hidden', 'true'); }
    },
    maybeShowStarterOffer() {
      const inv = window.TankGame.auth.getInventory();
      if (Number(inv.coins || 0) > 180 || localStorage.getItem(this.accountScopedKey('starterOfferSeen'))) return;
      const modal = document.getElementById('starterOfferModal');
      if (!modal) return;
      localStorage.setItem(this.accountScopedKey('starterOfferSeen'), 'true');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    },
    closeStarterOffer() {
      const modal = document.getElementById('starterOfferModal');
      if (modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); }
    },
    claimStarterOffer() {
      window.TankGame.auth.addCoins(500);
      window.TankGame.auth.purchaseItem('shield', 0);
      window.TankGame.auth.purchaseItem('rapid', 0);
      this.closeStarterOffer();
      this.refreshAll();
      this.showToast('STARTER PACK LOADED');
    },
    claimDailyReward() {
      try {
        const result = window.TankGame.auth.claimDailyReward();
        this.refreshAll();
        this.showToast('DAILY DROP +' + result.reward + ' CREDITS');
      } catch (error) { this.showToast(error.message); }
    },
    renderDailyReward() {
      if (!window.TankGame.auth.getDailyRewardStatus) return;
      const status = window.TankGame.auth.getDailyRewardStatus();
      const text = (status.available ? ('Ready: +' + status.reward + ' Credits') : ('Claimed today • Streak ' + status.streak));
      ['dailyRewardText','profileDailyText'].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = text; });
      ['dailyRewardBadge','profileDailyBadge'].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = status.available ? 'READY' : 'CLAIMED'; });
      ['claimDailyBtn','profileClaimDailyBtn'].forEach((id) => { const el = document.getElementById(id); if (el) { el.disabled = !status.available; el.textContent = status.available ? 'CLAIM DROP' : 'CLAIMED'; } });
    },
    renderAchievements() {
      if (!window.TankGame.auth.getAchievementDefs) return;
      const defs = window.TankGame.auth.getAchievementDefs();
      const state = window.TankGame.auth.getAchievements();
      const unlocked = defs.filter((def) => state[def.id] && state[def.id].unlocked).length;
      const badge = document.getElementById('achievementProgressBadge');
      if (badge) badge.textContent = unlocked + ' / ' + defs.length;
      const list = document.getElementById('achievementList');
      if (list) {
        list.innerHTML = defs.map((def) => {
          const item = state[def.id] || { unlocked: false, claimed: false };
          const action = item.claimed ? 'CLAIMED' : (item.unlocked ? 'CLAIM +' + def.reward : 'LOCKED');
          return '<div class="achievement-row ' + (item.unlocked ? 'unlocked' : '') + '"><div><strong>' + def.title + '</strong><span>' + def.desc + '</span></div><button class="btn mini ' + (item.unlocked && !item.claimed ? 'neon' : 'ghost') + '" data-achievement="' + def.id + '" ' + (!item.unlocked || item.claimed ? 'disabled' : '') + '>' + action + '</button></div>';
        }).join('');
        list.querySelectorAll('[data-achievement]').forEach((button) => button.addEventListener('click', () => {
          try { window.TankGame.auth.claimAchievementReward(button.dataset.achievement); this.refreshAll(); this.showToast('ACHIEVEMENT REWARD CLAIMED'); } catch (error) { this.showToast(error.message); }
        }));
      }
      const preview = document.getElementById('homeAchievementPreview');
      if (preview) {
        preview.innerHTML = defs.slice(0, 3).map((def) => {
          const item = state[def.id] || { unlocked: false };
          return '<div class="v7-mini-row"><span>' + (item.unlocked ? '✓' : '•') + '</span><div><strong>' + def.title + '</strong><small>' + def.desc + '</small></div></div>';
        }).join('');
      }
    },

    updateUserBadge() {
      const menu = document.getElementById('accountMenu');
      const label = document.getElementById('userBadge');
      const emailLine = document.getElementById('accountDropdownEmail');
      const avatar = document.querySelector('.account-avatar');
      const loginAction = document.getElementById('accountLoginAction');
      const logoutAction = document.getElementById('accountLogoutAction');
      if (!menu || !label || !window.TankGame || !window.TankGame.auth) return;
      const user = window.TankGame.auth.getCurrentUser();
      if (!user) { menu.classList.add('hidden'); return; }
      const inv = window.TankGame.auth.getInventory();
      const displayName = user.guest ? 'Guest Pilot' : (user.name || user.email || 'Pilot');
      const shortName = this.getShortAccountName(user);
      const initial = (displayName || 'P').trim().charAt(0).toUpperCase();
      menu.classList.remove('hidden');
      label.textContent = shortName;
      if (emailLine) emailLine.innerHTML = (user.guest ? 'Guest session' : (user.email || 'Signed in')) + '<br><strong>' + Number(inv.coins || 0) + ' Credits</strong>';
      if (avatar) avatar.textContent = initial;
      if (loginAction) loginAction.style.display = user.guest ? 'block' : 'none';
      if (logoutAction) logoutAction.style.display = user.guest ? 'none' : 'block';
    },

    updateAuthSummary() {
      const user = window.TankGame.auth.getCurrentUser();
      const badge = document.getElementById('authStateBadge');
      const text = document.getElementById('authSummaryText');
      if (badge) badge.textContent = user.guest ? 'Guest' : 'Signed In';
      if (text) text.textContent = user.guest ? 'Guest trial: clear Zone 1, then sign in to continue the campaign.' : 'Signed in as ' + user.email + '. Progress and rewards are saved locally.';
      ['profileName','profileEmail','profileCountry','profileType'].forEach((id) => { const el = document.getElementById(id); if (!el) return; if (id==='profileName') el.textContent = user.name || (user.guest ? 'Guest Pilot' : 'Pilot'); if (id==='profileEmail') el.textContent = user.email; if (id==='profileCountry') el.textContent = user.country || 'US'; if (id==='profileType') el.textContent = user.provider || 'Guest'; });
      const nameInput = document.getElementById('accountPilotName');
      if (nameInput && !nameInput.matches(':focus')) nameInput.value = user.name || '';
      this.updateUserBadge();
    },
    renderLeaderboard() {
      const list = document.getElementById('leaderboardList');
      if (!list) return;
      const rows = window.TankGame.auth.getLeaderboardRows ? window.TankGame.auth.getLeaderboardRows() : [];
      const current = window.TankGame.auth.getCurrentUser ? window.TankGame.auth.getCurrentUser() : null;
      list.innerHTML = rows.map((item, i) => {
        const name = item.name || item.email || 'Pilot';
        const isMe = current && item.email === current.email;
        const sub = item.seeded ? 'Live rival' : (isMe ? 'Your best run' : 'Pilot record');
        return '<div class="leaderboard-row ' + (isMe ? 'is-me' : '') + '"><span>#' + (i + 1) + '</span><strong>' + name + '<small>' + sub + '</small></strong><em>' + Number(item.score || 0).toLocaleString() + '</em></div>';
      }).join('');
      const meta = document.getElementById('leaderboardLiveMeta');
      if (meta) {
        const now = new Date();
        meta.textContent = 'LIVE • updated ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    },
    renderScoreHistory() {
      const box = document.getElementById('scoreHistoryList');
      if (!box) return;
      const scores = (window.TankGame.auth.getCurrentScoreHistory ? window.TankGame.auth.getCurrentScoreHistory() : window.TankGame.auth.getScoreHistory()).slice(0, 10);
      box.innerHTML = scores.length ? scores.map((item) => '<div class="history-row"><span>' + item.time + '</span><strong>' + item.score + '</strong></div>').join('') : '<p class="muted">No runs yet. Deploy and set your first score.</p>';
      const user = window.TankGame.auth.getCurrentUser();
      const best = window.TankGame.auth.getBestScoreByEmail(user.email);
      const inv = window.TankGame.auth.getInventory();
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('profileBest', best); set('profileCoins', inv.coins); set('profileSkin', this.skinTitleById(inv.selectedSkin)); set('profileOwnedSkins', inv.ownedSkins.length);
    },
    renderWeapons() {
      const grid = document.getElementById('weaponSwitchGrid');
      if (!grid) return;
      const current = window.TankGame.game && window.TankGame.game.currentWeapon ? window.TankGame.game.currentWeapon.key : 'cannon';
      grid.innerHTML = WEAPONS.map((w) => '<div class="weapon-card ' + (w.key === current ? 'active' : '') + '"><div><strong>' + w.title + '</strong><p>' + w.desc + '</p></div><span>' + w.hotkey + '</span></div>').join('');
    },
    updateSelectedPackPreview() {
      const pack = COIN_PACKS.find((entry) => entry.id === this.selectedCoinPackId) || COIN_PACKS[2];
      const label = document.getElementById('selectedPackLabel');
      const value = document.getElementById('selectedPackValue');
      const hint = document.getElementById('selectedPackHint');
      if (label) label.textContent = pack.title;
      if (value) value.textContent = pack.totalCoins + ' Credits';
      if (hint) hint.textContent = pack.note + ' Spend these Credits on Battle Gear, bundles, and tank skins.';
      this.updatePaymentModalSummary();
    },

    renderShop() {
      const itemGrid = document.getElementById('itemShopGrid');
      const skinGrid = document.getElementById('skinShopGrid');
      const bundleGrid = document.getElementById('bundleShopGrid');
      const coinGrid = document.getElementById('coinPackGrid');
      const inv = window.TankGame.auth.getInventory();
      this.updateSelectedPackPreview();
      if (coinGrid) {
        coinGrid.innerHTML = COIN_PACKS.map((p) => '<button class="coin-pack-card ' + (this.selectedCoinPackId === p.id ? 'active' : '') + '" data-coin-pack="' + p.id + '"><span class="tag hot">' + p.badge + '</span><strong>' + p.title + '</strong><em>' + p.totalCoins + ' Credits</em><small>$' + p.usd + ' · instant recharge</small></button>').join('');
      }
      if (itemGrid) {
        itemGrid.innerHTML = SHOP_ITEMS.map((item) => '<div class="shop-item-card"><div class="shop-icon">' + item.icon + '</div><strong>' + item.title + '</strong><p>' + item.desc + '</p><button class="btn neon mini" data-buy-item="' + item.key + '">USE CREDITS · ' + item.cost + '</button></div>').join('');
      }
      if (bundleGrid) {
        bundleGrid.innerHTML = FEATURED_BUNDLES.map((b) => '<div class="bundle-card"><span class="tag sale">BEST VALUE</span><strong>' + b.title + '</strong><p>' + b.note + '</p><button class="btn secondary" data-buy-bundle="' + b.id + '">USE CREDITS · ' + b.coinCost + '</button></div>').join('');
      }
      if (skinGrid) {
        skinGrid.innerHTML = SKINS.map((skin) => {
          const owned = inv.ownedSkins.includes(skin.id);
          const active = inv.selectedSkin === skin.id;
          return '<div class="skin-card animated-skin skin-' + skin.id + ' ' + (active ? 'active' : '') + '"><div class="skin-preview tank-skin-preview" style="--skin-primary:' + skin.preview[0] + ';--skin-accent:' + skin.preview[1] + '"><div class="skin-rail left"></div><div class="skin-rail right"></div><div class="skin-tank-body"><span></span></div><div class="skin-cannon"></div><div class="skin-shot-line"></div></div><div class="skin-meta-row"><span class="tag">' + skin.rarity + '</span><span class="effect-tag">' + skin.effect + '</span></div><strong>' + skin.title + '</strong><p>' + skin.desc + '</p><button class="btn ' + (active ? 'ghost' : 'neon') + ' mini" data-skin="' + skin.id + '">' + (active ? 'EQUIPPED' : (owned ? 'EQUIP' : 'UNLOCK · ' + skin.cost)) + '</button></div>';
        }).join('');
      }
      document.querySelectorAll('[data-coin-pack]').forEach((b) => b.addEventListener('click', () => { this.selectedCoinPackId = b.dataset.coinPack; this.renderShop(); }));
      document.querySelectorAll('[data-buy-item]').forEach((b) => b.addEventListener('click', () => {
        const item = SHOP_ITEMS.find((entry) => entry.key === b.dataset.buyItem);
        try { window.TankGame.auth.purchaseItem(item.key, item.cost); this.refreshAll(); this.showToast('GEAR ADDED'); } catch (error) { this.showToast(error.message); }
      }));
      document.querySelectorAll('[data-buy-bundle]').forEach((b) => b.addEventListener('click', () => {
        const bundle = FEATURED_BUNDLES.find((entry) => entry.id === b.dataset.buyBundle);
        try { window.TankGame.auth.purchaseBundle(bundle.id, bundle); this.refreshAll(); this.showToast('BUNDLE UNLOCKED'); } catch (error) { this.showToast(error.message); }
      }));
      document.querySelectorAll('[data-skin]').forEach((b) => b.addEventListener('click', () => {
        const skin = SKINS.find((entry) => entry.id === b.dataset.skin);
        try {
          const owned = window.TankGame.auth.getInventory().ownedSkins.includes(skin.id);
          if (owned) window.TankGame.auth.selectSkin(skin.id); else window.TankGame.auth.purchaseSkin(skin.id, skin.cost);
          if (window.TankGame.game) window.TankGame.game.refreshSkin();
          this.refreshAll();
          this.showToast('PAINT JOB READY');
        } catch (error) { this.showToast(error.message); }
      }));
      this.updateShopState();
    },
    updateShopRenderState() { this.renderQuickItemCounts(); },
    updateShopState() { const inv = window.TankGame.auth.getInventory(); const el = document.getElementById('shopCoins'); if (el) el.textContent = inv.coins; this.renderQuickItemCounts(); },
    renderQuickItemCounts() {
      const inv = window.TankGame.auth.getInventory();
      ['repair','shield','rapid','bomb'].forEach((key) => { const el = document.getElementById('count-' + key); if (!el) return; const free = Number(inv.freeUses[key] || 0); const count = Number(inv.items[key] || 0); el.textContent = free > 0 ? 'FREE' : (count > 0 ? 'x' + count : 'BUY'); });
    },
    updateGameHud(data) {
      const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.textContent = val; };
      set('gameStateBadge', String(data.state || 'ready').toUpperCase()); set('hudHp', Math.ceil(data.hp || 0)); set('hudScore', data.score || 0); set('hudEnemies', data.enemyCount || 0); set('hudStage', data.stage || 1); set('hudLives', data.lives || 0); set('hudCoins', data.coins || 0); set('hudSkin', data.skinName || 'Classic'); set('hudWeapon', data.weaponName || 'Cannon'); set('hudMobileHp', Math.ceil(data.hp || 0)); set('hudMobileScore', data.score || 0); set('hudMobileCoins', data.coins || 0); set('hudMobileStage', data.stage || 1); set('hudBossState', data.bossActive ? data.bossName : (data.isBossStage ? 'Incoming' : 'None'));
      this.renderWeapons(); this.updateShopState();
    },
    showGameOverlay(html) { const el = document.getElementById('gameOverlay'); if (el) { el.innerHTML = html; el.classList.remove('hidden'); } },
    hideGameOverlay() { const el = document.getElementById('gameOverlay'); if (el) el.classList.add('hidden'); },
    showResultPanel(data) {
      const inv = window.TankGame.auth.getInventory();
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      const score = Number(data.score || 0);
      const kills = Number(data.kills || 0);
      const stage = Number(data.stage || 1);
      set('resultScore', score); set('resultStage', stage); set('resultKills', kills); set('resultCoins', inv.coins || 0);
      const stars = Math.max(1, Math.min(3, (score >= 1800 ? 3 : score >= 800 ? 2 : 1)));
      const starEl = document.getElementById('resultStars');
      if (starEl) starEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      this.saveStageStars(stage, stars);
      const rewards = document.getElementById('resultRewards'); if (rewards) rewards.textContent = 'Run saved. Claim Daily Drops and Achievement rewards for extra Credits.';
      const panel = document.getElementById('resultPanel'); if (panel) panel.classList.remove('hidden');
      this.maybeShowStarterOffer();
    },
    saveStageStars(stage, stars) {
      try { const key = this.accountScopedKey('stageStars'); const data = JSON.parse(localStorage.getItem(key) || '{}'); data[stage] = Math.max(Number(data[stage] || 0), Number(stars || 0)); localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    },
    getStageStars(stage) {
      try { const data = JSON.parse(localStorage.getItem(this.accountScopedKey('stageStars')) || '{}'); return Number(data[stage] || 0); } catch (e) { return 0; }
    },
    hideResultPanel() { const panel = document.getElementById('resultPanel'); if (panel) panel.classList.add('hidden'); },
    showToast(message) {
      let toast = document.getElementById('toast');
      if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
      toast.textContent = message; toast.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    },
    showAchievementPopup(achievement) {
      let stack = document.getElementById('achievementToastStack');
      if (!stack) {
        stack = document.createElement('div');
        stack.id = 'achievementToastStack';
        stack.className = 'achievement-toast-stack';
        document.body.appendChild(stack);
      }
      const card = document.createElement('div');
      card.className = 'achievement-toast-card';
      card.innerHTML = '<div class="achievement-toast-icon">★</div><div><strong>Achievement Unlocked</strong><span>' + (achievement.title || 'New Milestone') + ' · +' + (achievement.reward || 0) + ' Credits</span></div>';
      stack.appendChild(card);
      requestAnimationFrame(() => card.classList.add('show'));
      setTimeout(() => { card.classList.remove('show'); setTimeout(() => card.remove(), 260); }, 3200);
    },

    bindProfileAccount() {
      const saveBtn = document.getElementById('saveAccountBtn');
      if (saveBtn && saveBtn.dataset.bound !== 'true') {
        saveBtn.dataset.bound = 'true';
        saveBtn.addEventListener('click', () => {
          try {
            const nameEl = document.getElementById('accountPilotName');
            const passEl = document.getElementById('accountNewPassword');
            window.TankGame.auth.updateAccount({
              name: nameEl ? nameEl.value : '',
              password: passEl ? passEl.value : ''
            });
            if (passEl) passEl.value = '';
            this.refreshAll();
            this.showToast('PROFILE SAVED');
          } catch (error) { this.showToast(error.message); }
        });
      }
      const clearBtn = document.getElementById('clearScoresBtn');
      if (clearBtn && clearBtn.dataset.bound !== 'true') {
        clearBtn.dataset.bound = 'true';
        clearBtn.addEventListener('click', () => {
          window.TankGame.auth.clearScores();
          this.renderScoreHistory();
          this.showToast('SCORE HISTORY CLEARED');
        });
      }
    },
    renderProfileRecharge() { /* Quick Recharge removed: use Shop > Coin Packs only. */ },
    refreshAll() {
      this.updateAuthSummary();
      this.renderLeaderboard();
      this.renderScoreHistory();
      this.updateShopRenderState();
      this.updateShopState();
      this.renderDailyReward();
      this.renderAchievements();
      this.updateUserBadge();
      this.syncCheckoutFields(false);
      const inv = window.TankGame.auth.getInventory();
      const skinEl = document.getElementById('hudSkin');
      const weaponEl = document.getElementById('hudWeapon');
      const shopCoinsEl = document.getElementById('shopCoins');
      if (skinEl) skinEl.textContent = this.skinTitleById(inv.selectedSkin);
      if (weaponEl) weaponEl.textContent = this.weaponTitleById(inv.selectedWeapon);
      if (shopCoinsEl) shopCoinsEl.textContent = inv.coins;
    }
  };

  window.TankGame = window.TankGame || {};
  window.TankGame.ui = UI;
  let leaderboardRealtimeTimer = null;
  function startLeaderboardRealtime(){
    if (leaderboardRealtimeTimer) return;
    leaderboardRealtimeTimer = setInterval(() => {
      try {
        if (document.body && document.body.dataset.page === 'home' && UI.renderLeaderboard) UI.renderLeaderboard();
      } catch (err) {}
    }, 10000);
  }
  startLeaderboardRealtime();
})();
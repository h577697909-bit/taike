(function () {
  const NS = 'tankGameV892';
  const CURRENT_USER_KEY = NS + ':currentUser';
  const GLOBAL_SCORE_KEY = NS + ':scoreHistory';
  const LEGACY_KEYS_TO_IGNORE = ['tankGameCurrentUser', 'tankGameInventory', 'tankGameAchievements', 'tankGameDailyReward', 'tankGameV8_1ZeroStartApplied'];

  const TEST_ACCOUNT_EMAIL = 'test@dev.com';
  const TEST_ACCOUNT_PASSWORD = '123456';
  const TEST_ACCOUNT_COINS = 999999;

  const defaultInventory = {
    coins: 0,
    items: { repair: 0, shield: 0, rapid: 0, bomb: 0 },
    freeUses: { repair: 1, shield: 1, rapid: 1, bomb: 1 },
    ownedSkins: ['classic'],
    ownedBundles: [],
    selectedSkin: 'classic',
    ownedWeapons: ['cannon', 'burst', 'rail'],
    selectedWeapon: 'cannon',
    lifetimeKills: 0,
    lifetimeStages: 1,
    loginDays: 0
  };

  const ACHIEVEMENT_DEFS = [
    { id: 'first_blood', title: 'First Blood', desc: 'Destroy your first enemy.', reward: 120, test: (s) => s.kills >= 1 },
    { id: 'rookie_ace', title: 'Rookie Ace', desc: 'Destroy 5 enemies in one run.', reward: 160, test: (s) => s.kills >= 5 },
    { id: 'wave_cleaner', title: 'Wave Cleaner', desc: 'Destroy 12 enemies in one run.', reward: 240, test: (s) => s.kills >= 12 },
    { id: 'zone_runner', title: 'Zone Runner', desc: 'Reach Zone 3.', reward: 220, test: (s) => s.stage >= 3 },
    { id: 'frontline_veteran', title: 'Frontline Veteran', desc: 'Reach Zone 6.', reward: 360, test: (s) => s.stage >= 6 },
    { id: 'deep_strike', title: 'Deep Strike', desc: 'Reach Zone 9.', reward: 520, test: (s) => s.stage >= 9 },
    { id: 'boss_breaker', title: 'Boss Breaker', desc: 'Defeat a War Boss.', reward: 420, test: (s) => s.bossKills >= 1 },
    { id: 'score_chaser', title: 'Score Chaser', desc: 'Score 1,500+ in one run.', reward: 180, test: (s) => s.score >= 1500 || s.bestScore >= 1500 },
    { id: 'ace_score', title: 'Ace Score', desc: 'Score 2,500+ in one run.', reward: 300, test: (s) => s.score >= 2500 || s.bestScore >= 2500 },
    { id: 'legend_score', title: 'Legend Score', desc: 'Score 5,000+ in one run.', reward: 560, test: (s) => s.score >= 5000 || s.bestScore >= 5000 },
    { id: 'credit_hunter', title: 'Credit Hunter', desc: 'Hold 1,000 Credits.', reward: 180, test: (s) => s.coins >= 1000 },
    { id: 'vault_builder', title: 'Vault Builder', desc: 'Hold 5,000 Credits.', reward: 480, test: (s) => s.coins >= 5000 },
    { id: 'survivor', title: 'Survivor', desc: 'Stay alive for 90 seconds.', reward: 260, test: (s) => s.survivalTime >= 90 },
    { id: 'iron_wall', title: 'Iron Wall', desc: 'Clear a zone with the base intact.', reward: 240, test: (s) => s.baseAlive && s.stage >= 2 }
  ];

  let sessionUser = { email: 'guest@local', country: 'US', provider: 'Guest', guest: true };
  let sessionInventory = clone(defaultInventory);

  function childModeEnabled() { return document.body && document.body.dataset.childMode === 'true'; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function safeEmail(email) { return String(email || '').trim().toLowerCase(); }
  function keyEmail(email) { return safeEmail(email || 'guest@local').replace(/[^a-z0-9@._-]/g, '_'); }
  function accountKey(email, suffix) { return NS + ':account:' + keyEmail(email) + ':' + suffix; }
  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('Local data read failed:', key, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (!childModeEnabled()) localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeInventory(data) {
    const source = data && typeof data === 'object' ? data : {};
    const inv = Object.assign(clone(defaultInventory), source);
    inv.coins = Math.max(0, Number(source.coins || 0));
    inv.items = Object.assign({}, defaultInventory.items, source.items || {});
    inv.freeUses = Object.assign({}, defaultInventory.freeUses, source.freeUses || {});
    inv.ownedSkins = Array.isArray(source.ownedSkins) ? Array.from(new Set(['classic'].concat(source.ownedSkins))) : ['classic'];
    inv.ownedBundles = Array.isArray(source.ownedBundles) ? source.ownedBundles : [];
    inv.ownedWeapons = Array.isArray(source.ownedWeapons) ? Array.from(new Set(defaultInventory.ownedWeapons.concat(source.ownedWeapons))) : clone(defaultInventory.ownedWeapons);
    if (!inv.ownedWeapons.includes(inv.selectedWeapon)) inv.selectedWeapon = 'cannon';
    if (!inv.ownedSkins.includes(inv.selectedSkin)) inv.selectedSkin = 'classic';
    return inv;
  }

  function testInventory() {
    const inv = clone(defaultInventory);
    inv.coins = TEST_ACCOUNT_COINS;
    inv.items = { repair: 99, shield: 99, rapid: 99, bomb: 99 };
    inv.freeUses = { repair: 1, shield: 1, rapid: 1, bomb: 1 };
    inv.ownedSkins = ['classic', 'crimson', 'frost', 'royal', 'obsidian', 'aurora'];
    inv.ownedWeapons = ['cannon', 'burst', 'rail'];
    inv.selectedSkin = 'classic';
    inv.selectedWeapon = 'cannon';
    return inv;
  }

  function getStoredUser() {
    const user = readJson(CURRENT_USER_KEY, null);
    if (user && user.email) return user;
    return { email: 'guest@local', country: 'US', provider: 'Guest', guest: true };
  }

  function saveUser(user) {
    const clean = Object.assign({ country: 'US', provider: 'Email', guest: false }, user || {});
    clean.email = safeEmail(clean.email || 'guest@local');
    sessionUser = clone(clean);
    writeJson(CURRENT_USER_KEY, clean);
    return clean;
  }

  function getProfile(email) { return readJson(accountKey(email, 'profile'), null); }
  function saveProfile(user) { writeJson(accountKey(user.email, 'profile'), user); return user; }
  function getInventoryFor(email) { return normalizeInventory(readJson(accountKey(email, 'inventory'), null)); }
  function saveInventoryFor(email, inv) { const normalized = normalizeInventory(inv); writeJson(accountKey(email, 'inventory'), normalized); return normalized; }
  function readAchievementsFor(email) {
    const raw = readJson(accountKey(email, 'achievements'), {});
    const state = raw && typeof raw === 'object' ? raw : {};
    ACHIEVEMENT_DEFS.forEach((def) => { if (!state[def.id]) state[def.id] = { unlocked: false, claimed: false }; });
    return state;
  }
  function writeAchievementsFor(email, state) { writeJson(accountKey(email, 'achievements'), state); }
  function scoreHistoryFor(email) { return readJson(accountKey(email, 'scores'), []); }
  function writeScoreHistoryFor(email, scores) { writeJson(accountKey(email, 'scores'), scores.slice(0, 40)); }
  function dailyKeyFor(email) { return accountKey(email, 'dailyReward'); }

  function resetTestAccountData() {
    const user = { email: TEST_ACCOUNT_EMAIL, country: 'US', provider: 'Email', guest: false, devTest: true, name: 'Commander', logged_in_at: new Date().toISOString() };
    saveProfile(user);
    saveInventoryFor(TEST_ACCOUNT_EMAIL, testInventory());
    return user;
  }

  function createFreshAccountData(email, profile) {
    const normalizedEmail = safeEmail(email);
    saveProfile(Object.assign({ email: normalizedEmail, country: 'US', provider: 'Email', guest: false, created_at: new Date().toISOString() }, profile || {}));
    saveInventoryFor(normalizedEmail, clone(defaultInventory));
    writeAchievementsFor(normalizedEmail, readAchievementsFor(normalizedEmail));
    writeScoreHistoryFor(normalizedEmail, []);
    writeJson(dailyKeyFor(normalizedEmail), { lastClaim: '', streak: 0 });
  }

  function ensureAccount(email, password) {
    const normalizedEmail = safeEmail(email);
    let profile = getProfile(normalizedEmail);
    if (!profile) {
      profile = { email: normalizedEmail, country: 'US', provider: 'Email', guest: false, created_at: new Date().toISOString(), passwordHash: String(password || '') };
      createFreshAccountData(normalizedEmail, profile);
    }
    return getProfile(normalizedEmail) || profile;
  }

  function currentEmail() { return Auth.getCurrentUser().email || 'guest@local'; }

  const Auth = {
    getCurrentUser() {
      if (childModeEnabled()) return sessionUser;
      return getStoredUser();
    },
    isGuest() {
      const user = this.getCurrentUser();
      return !user || user.guest === true || String(user.provider || '').toLowerCase() === 'guest';
    },
    emailExists(email) {
      const normalizedEmail = safeEmail(email);
      return !!getProfile(normalizedEmail);
    },
    register(email, password, extras) {
      const normalizedEmail = safeEmail(email);
      const normalizedPassword = String(password || '').trim();
      if (!normalizedEmail || !normalizedPassword || normalizedPassword.length < 6) throw new Error('Enter a valid email and a password with at least 6 characters.');
      if (normalizedEmail === TEST_ACCOUNT_EMAIL) throw new Error('This Pilot ID is reserved. Please sign in.');
      if (getProfile(normalizedEmail)) throw new Error('This email is already registered. Please sign in.');
      const extra = extras && typeof extras === 'object' ? extras : {};
      const profile = {
        email: normalizedEmail,
        name: String(extra.name || '').trim(),
        firstName: String(extra.firstName || '').trim(),
        lastName: String(extra.lastName || '').trim(),
        country: String(extra.country || 'US').trim() || 'US',
        provider: 'Email',
        guest: false,
        created_at: new Date().toISOString(),
        passwordHash: normalizedPassword
      };
      createFreshAccountData(normalizedEmail, profile);
      const user = Object.assign({}, getProfile(normalizedEmail) || profile, { guest: false, provider: 'Email', logged_in_at: new Date().toISOString(), devTest: false });
      saveProfile(user);
      saveUser(user);
      return user;
    },
    login(email, password) {
      const normalizedEmail = safeEmail(email);
      const normalizedPassword = String(password || '').trim();
      if (!normalizedEmail || !normalizedPassword || normalizedPassword.length < 6) throw new Error('Enter a valid email and a password with at least 6 characters.');
      if (normalizedEmail === TEST_ACCOUNT_EMAIL) {
        if (normalizedPassword !== TEST_ACCOUNT_PASSWORD) throw new Error('Invalid test account password.');
        const testUser = resetTestAccountData();
        return saveUser(testUser);
      }
      const profile = ensureAccount(normalizedEmail, normalizedPassword);
      if (profile.passwordHash && profile.passwordHash !== normalizedPassword) throw new Error('Access Code does not match this Pilot ID.');
      const user = Object.assign({}, profile, { guest: false, provider: profile.provider || 'Email', logged_in_at: new Date().toISOString(), devTest: false });
      saveProfile(user);
      saveUser(user);
      return user;
    },
    loginWithProvider(providerName) {
      const provider = String(providerName || 'Provider');
      const email = safeEmail(provider + '@mock.local');
      let profile = getProfile(email);
      if (!profile) {
        profile = { email, country: 'US', provider, guest: false, created_at: new Date().toISOString() };
        createFreshAccountData(email, profile);
      }
      profile.logged_in_at = new Date().toISOString();
      saveProfile(profile);
      return saveUser(profile);
    },
    loginGuest() {
      const guest = { email: 'guest@local', country: 'US', provider: 'Guest', guest: true, logged_in_at: new Date().toISOString() };
      sessionInventory = clone(defaultInventory);
      saveInventoryFor(guest.email, clone(defaultInventory));
      saveUser(guest);
      return guest;
    },
    logout() {
      localStorage.removeItem(CURRENT_USER_KEY);
      sessionUser = { email: 'guest@local', country: 'US', provider: 'Guest', guest: true };
      sessionInventory = clone(defaultInventory);
      return sessionUser;
    },
    getScoreHistory() {
      const global = readJson(GLOBAL_SCORE_KEY, []);
      return Array.isArray(global) ? global : [];
    },
    getCurrentScoreHistory() {
      const user = this.getCurrentUser();
      const list = scoreHistoryFor(user.email || 'guest@local');
      return Array.isArray(list) ? list : [];
    },
    saveScore(score) {
      if (childModeEnabled()) return;
      const user = this.getCurrentUser();
      const entry = { email: user.email, name: (user.name || ''), score: Number(score || 0), country: user.country || 'US', time: new Date().toLocaleString() };
      const accountScores = scoreHistoryFor(user.email);
      accountScores.unshift(entry);
      writeScoreHistoryFor(user.email, accountScores);
      const global = this.getScoreHistory();
      global.unshift(entry);
      writeJson(GLOBAL_SCORE_KEY, global.slice(0, 60));
    },
    clearScores() {
      if (childModeEnabled()) return;
      const email = currentEmail();
      writeScoreHistoryFor(email, []);
      const global = this.getScoreHistory().filter((entry) => entry.email !== email);
      writeJson(GLOBAL_SCORE_KEY, global);
    },
    getBestScoreByEmail(email) {
      const list = scoreHistoryFor(email);
      if (!list.length) return 0;
      return Math.max.apply(null, list.map((entry) => Number(entry.score || 0)));
    },
    getDisplayNameByEmail(email) {
      const profile = getProfile(email);
      if (profile && profile.name && String(profile.name).trim()) return String(profile.name).trim();
      return safeEmail(email || 'Pilot');
    },
    getLeaderboardRows() {
      const liveTick = Math.floor(Date.now() / 10000);
      const seeded = [
        { email: 'novastrike@arena.local', name: 'NovaStrike', score: 98500 + (liveTick % 13) * 35, seeded: true },
        { email: 'steelpulse@arena.local', name: 'SteelPulse', score: 87200 + (liveTick % 11) * 28, seeded: true },
        { email: 'ghostarmor@arena.local', name: 'GhostArmor', score: 79450 + (liveTick % 9) * 24, seeded: true },
        { email: 'deltacore@arena.local', name: 'DeltaCore', score: 73120 + (liveTick % 8) * 21, seeded: true },
        { email: 'ironecho@arena.local', name: 'IronEcho', score: 68810 + (liveTick % 7) * 18, seeded: true },
        { email: 'vortexunit@arena.local', name: 'VortexUnit', score: 64100 + (liveTick % 6) * 15, seeded: true }
      ];
      const bestByEmail = {};
      this.getScoreHistory().forEach((entry) => {
        const email = safeEmail(entry.email || 'guest@local');
        const score = Number(entry.score || 0);
        if (!bestByEmail[email] || score > bestByEmail[email].score) {
          bestByEmail[email] = Object.assign({}, entry, { email, score });
        }
      });
      const rows = Object.keys(bestByEmail).map((email) => {
        const row = bestByEmail[email];
        return Object.assign({}, row, { name: this.getDisplayNameByEmail(email) });
      });
      return seeded.concat(rows).sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 10);
    },
    getInventory() {
      if (childModeEnabled()) return clone(sessionInventory);
      const user = this.getCurrentUser();
      if (user && user.email === TEST_ACCOUNT_EMAIL && user.devTest) {
        const inv = testInventory();
        saveInventoryFor(TEST_ACCOUNT_EMAIL, inv);
        return inv;
      }
      return getInventoryFor(user.email || 'guest@local');
    },
    saveInventory(inventory) {
      const normalized = normalizeInventory(inventory);
      sessionInventory = clone(normalized);
      if (!childModeEnabled()) saveInventoryFor(currentEmail(), normalized);
      return normalized;
    },
    addCoins(amount) {
      const inv = this.getInventory();
      inv.coins = Math.max(0, Number(inv.coins || 0) + Number(amount || 0));
      return this.saveInventory(inv);
    },
    applyCoinPack(pack) {
      const inv = this.getInventory();
      inv.coins = Math.max(0, Number(inv.coins || 0) + Number((pack && (pack.coins || pack.totalCoins)) || 0));
      return this.saveInventory(inv);
    },
    purchaseBundle(bundleId, bundle) {
      const inv = this.getInventory();
      if (inv.ownedBundles.includes(bundleId)) throw new Error('This bundle has already been claimed.');
      if (inv.coins < Number(bundle.coinCost || 0)) throw new Error('Not enough Credits.');
      inv.ownedBundles.push(bundleId);
      inv.coins -= Number(bundle.coinCost || 0);
      Object.keys(bundle.items || {}).forEach((key) => { inv.items[key] = Number(inv.items[key] || 0) + Number(bundle.items[key] || 0); });
      if (bundle.skinId && !inv.ownedSkins.includes(bundle.skinId)) inv.ownedSkins.push(bundle.skinId);
      if (bundle.skinId) inv.selectedSkin = bundle.skinId;
      return this.saveInventory(inv);
    },
    purchaseItem(itemKey, cost) {
      const inv = this.getInventory();
      const price = Number(cost || 0);
      if (inv.coins < price) throw new Error('Not enough Credits.');
      inv.coins -= price;
      inv.items[itemKey] = Number(inv.items[itemKey] || 0) + 1;
      return this.saveInventory(inv);
    },
    consumeItem(itemKey) {
      const inv = this.getInventory();
      if (Number(inv.items[itemKey] || 0) > 0) {
        inv.items[itemKey] -= 1;
        return this.saveInventory(inv);
      }
      if (Number(inv.freeUses[itemKey] || 0) > 0) {
        inv.freeUses[itemKey] -= 1;
        return this.saveInventory(inv);
      }
      throw new Error('This item is empty. Buy more to use it again.');
    },
    purchaseSkin(skinId, cost) {
      const inv = this.getInventory();
      if (inv.ownedSkins.includes(skinId)) return inv;
      const price = Number(cost || 0);
      if (inv.coins < price) throw new Error('Not enough Credits.');
      inv.coins -= price;
      inv.ownedSkins.push(skinId);
      inv.selectedSkin = skinId;
      return this.saveInventory(inv);
    },
    selectSkin(skinId) {
      const inv = this.getInventory();
      if (!inv.ownedSkins.includes(skinId)) throw new Error('Unlock this skin before equipping it.');
      inv.selectedSkin = skinId;
      return this.saveInventory(inv);
    },
    getAchievementDefs() { return clone(ACHIEVEMENT_DEFS); },
    getAchievements() { return readAchievementsFor(currentEmail()); },
    syncAchievements(runStats) {
      if (childModeEnabled()) return { state: readAchievementsFor(currentEmail()), unlocked: [] };
      const email = currentEmail();
      const inv = this.getInventory();
      const history = scoreHistoryFor(email);
      const currentScore = Number(runStats && runStats.score || 0);
      const bestScore = Math.max(currentScore, history.length ? Math.max.apply(null, history.map((entry) => Number(entry.score || 0))) : 0);
      const summary = {
        kills: Number(runStats && runStats.kills || 0),
        stage: Number(runStats && runStats.stage || 1),
        bossKills: Number(runStats && runStats.bossKills || 0),
        coins: Number(inv.coins || 0),
        score: currentScore,
        bestScore,
        survivalTime: Number(runStats && runStats.survivalTime || 0),
        baseAlive: !!(runStats && runStats.baseAlive)
      };
      const state = readAchievementsFor(email);
      const unlocked = [];
      ACHIEVEMENT_DEFS.forEach((def) => {
        if (!state[def.id].unlocked && def.test(summary)) {
          state[def.id].unlocked = true;
          unlocked.push({ id: def.id, title: def.title, desc: def.desc, reward: def.reward });
        }
      });
      writeAchievementsFor(email, state);
      return { state, unlocked };
    },
    claimAchievementReward(id) {
      const def = ACHIEVEMENT_DEFS.find((item) => item.id === id);
      if (!def) throw new Error('Achievement not found.');
      const email = currentEmail();
      const state = readAchievementsFor(email);
      if (!state[id] || !state[id].unlocked) throw new Error('Achievement is not unlocked yet.');
      if (state[id].claimed) throw new Error('Reward already claimed.');
      state[id].claimed = true;
      writeAchievementsFor(email, state);
      this.addCoins(def.reward);
      return this.getInventory();
    },
    getDailyRewardStatus() {
      const data = readJson(dailyKeyFor(currentEmail()), { lastClaim: '', streak: 0 });
      const today = todayKey();
      return { lastClaim: data.lastClaim || '', streak: Number(data.streak || 0), available: data.lastClaim !== today, reward: 180 + Math.min(Number(data.streak || 0), 6) * 40 };
    },
    claimDailyReward() {
      if (childModeEnabled()) throw new Error('Rewards are disabled in Safe Mode.');
      const status = this.getDailyRewardStatus();
      if (!status.available) throw new Error('Daily reward already claimed.');
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const nextStreak = status.lastClaim === yesterday ? status.streak + 1 : 1;
      const reward = 180 + Math.min(nextStreak - 1, 6) * 40;
      writeJson(dailyKeyFor(currentEmail()), { lastClaim: todayKey(), streak: nextStreak });
      this.addCoins(reward);
      return { reward, streak: nextStreak };
    },
    updateAccount(profileData) {
      if (childModeEnabled()) throw new Error('Account updates are disabled in Safe Mode.');
      const current = this.getCurrentUser();
      if (!current || current.guest) throw new Error('Sign in before updating your profile.');
      const profile = getProfile(current.email) || current;
      const name = String(profileData && profileData.name || '').trim();
      const password = String(profileData && profileData.password || '').trim();
      if (name) profile.name = name.slice(0, 24);
      if (password) {
        if (password.length < 6) throw new Error('Access Code must be at least 6 characters.');
        profile.passwordHash = password;
        profile.password_updated_at = new Date().toISOString();
      }
      saveProfile(profile);
      return saveUser(Object.assign({}, current, profile));
    },
    selectWeapon(weaponKey) {
      const inv = this.getInventory();
      if (!inv.ownedWeapons.includes(weaponKey)) throw new Error('This weapon is not unlocked yet.');
      inv.selectedWeapon = weaponKey;
      return this.saveInventory(inv);
    },
    resetLocalDataForDebug() {
      Object.keys(localStorage).forEach((key) => { if (key.indexOf(NS + ':') === 0 || LEGACY_KEYS_TO_IGNORE.includes(key)) localStorage.removeItem(key); });
      sessionUser = { email: 'guest@local', country: 'US', provider: 'Guest', guest: true };
      sessionInventory = clone(defaultInventory);
    }
  };

  window.TankGame = window.TankGame || {};
  window.TankGame.auth = Auth;
})();

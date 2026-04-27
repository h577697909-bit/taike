(function () {
  const App = {
    lastAchievementSync: 0,
    syncRunAchievements(data) {
      if (!window.TankGame.auth.syncAchievements || !window.TankGame.ui.showAchievementPopup) return;
      const result = window.TankGame.auth.syncAchievements({
        score: data.score || 0,
        stage: data.stage || 1,
        kills: data.kills || 0,
        bossKills: data.bossKills || 0,
        coins: data.coins || 0,
        survivalTime: data.survivalTime || 0,
        baseAlive: data.baseAlive
      });
      if (result && result.unlocked && result.unlocked.length) {
        result.unlocked.forEach((achievement) => window.TankGame.ui.showAchievementPopup(achievement));
        window.TankGame.ui.renderAchievements && window.TankGame.ui.renderAchievements();
      }
    },
    init() {
      document.body.dataset.childMode = 'false';
      document.body.dataset.music = 'true';
      document.body.dataset.sound = 'true';
      const returnedPayment = window.TankGame.api && window.TankGame.api.handleReturnFromGateway ? window.TankGame.api.handleReturnFromGateway() : null;
      window.TankGame.ui.init();
      if (returnedPayment) {
        window.TankGame.ui.showToast((returnedPayment.status === 'confirmed' || returnedPayment.status === 'credited') ? 'Credits loaded securely' : (returnedPayment.error || 'Payment was not completed'));
        window.TankGame.ui.refreshAll && window.TankGame.ui.refreshAll();
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      const canvas = document.getElementById('gameCanvas');
      window.TankGame.game.init(canvas, {
        onUpdate: (data) => {
          window.TankGame.ui.updateGameHud(data);
          if (data.state === 'playing' && performance.now() - App.lastAchievementSync > 900) {
            App.lastAchievementSync = performance.now();
            App.syncRunAchievements(data);
          }
          if (data.state === 'paused') {
            window.TankGame.ui.showGameOverlay('<strong>Paused</strong><span>Press Resume or P to continue</span>');
          } else if (data.state === 'ready') {
            window.TankGame.ui.showGameOverlay('<strong>Ready</strong><span>Click New Game to start</span>');
          } else if (data.state === 'playing') {
            window.TankGame.ui.hideGameOverlay();
          }
        },
        onGameOver: (result) => {
          const score = Number(result.score || 0);
          window.TankGame.auth.saveScore(score);
          if (window.TankGame.auth.syncAchievements) {
            const syncResult = window.TankGame.auth.syncAchievements({ score, stage: result.stage || window.TankGame.game.stage, kills: result.kills || 0, bossKills: result.bossKills || 0, survivalTime: result.survivalTime || 0, baseAlive: result.baseAlive });
            if (syncResult && syncResult.unlocked && syncResult.unlocked.length && window.TankGame.ui.showAchievementPopup) {
              syncResult.unlocked.forEach((achievement) => window.TankGame.ui.showAchievementPopup(achievement));
            }
          }
          window.TankGame.ui.refreshAll();
          window.TankGame.ui.showGameOverlay('<strong>TANK DESTROYED</strong><span>Final Score: ' + score + '</span><span>Tap NEW RUN to redeploy</span>');
          if (window.TankGame.ui.showResultPanel) window.TankGame.ui.showResultPanel({ score, stage: result.stage || window.TankGame.game.stage, kills: result.kills || 0 });
          window.TankGame.ui.updateGameHud({ state: 'gameover', hp: 0, score, enemyCount: 0, stage: window.TankGame.game.stage, lives: 0, coins: window.TankGame.auth.getInventory().coins, skinName: window.TankGame.game.getSkinLabel() });
        }
      });
      window.TankGame.ui.refreshAll();
    }
  };
  window.addEventListener('DOMContentLoaded', function () { App.init(); });
})();
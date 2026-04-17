(function(){
  "use strict";

  // 获取 URL 参数中的分数
  function getScoreFromURL() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('score')) || 0;
  }

  function getRankFromScore(score) {
    if (score <= 5) return { title: '🧬 入门神经元', icon: '🦠', sub: '突触还没长全' };
    if (score <= 10) return { title: '⚡ 突触学徒', icon: '🔌', sub: '偶尔漏电' };
    if (score <= 15) return { title: '🌐 神经漫游者', icon: '🧿', sub: '信号开始清晰' };
    if (score <= 20) return { title: '🚀 超频意识', icon: '💫', sub: '接近光速反应' };
    return { title: '🧠 全脑同步大师', icon: '♾️', sub: '已解锁终极专注' };
  }

  function initResultPage() {
    const score = getScoreFromURL();
    const rank = getRankFromScore(score);

    document.getElementById('resultScore').textContent = score;
    document.getElementById('resultIcon').textContent = rank.icon;
    document.getElementById('resultRankTitle').textContent = rank.title;
    document.getElementById('resultSubtitle').textContent = `—— ${rank.sub} ——`;

    // 再来一局按钮
    document.getElementById('playAgainBtn').addEventListener('click', () => {
      window.location.href = 'game.html';
    });
  }

  initResultPage();
})();

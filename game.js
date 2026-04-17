(function(){
  "use strict";

  const SIZE = 5;
  const TOTAL_CELLS = 25;
  const INIT_TIME = 20.0;

  let board = [];
  let expectedNumber = 1;
  let timeLeft = INIT_TIME;
  let gameActive = true;
  let timerInterval = null;
  const TIMER_INTERVAL_MS = 20;

  // 音效
  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}
    return audioCtx;
  }
  function playCorrectSound() {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().then(() => playTone(ctx, 880, 0.09, 'sine', 0.15, 1320));
    else playTone(ctx, 880, 0.09, 'sine', 0.15, 1320);
  }
  function playWrongSound() {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().then(() => playTone(ctx, 280, 0.15, 'sawtooth', 0.2, 220));
    else playTone(ctx, 280, 0.15, 'sawtooth', 0.2, 220);
  }
  function playTone(ctx, freq, duration, type='sine', volume=0.18, endFreq=null) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(now + duration);
  }

  const gridEl = document.getElementById('gridContainer');
  const timerDisplay = document.getElementById('timerDisplay');
  const messageArea = document.getElementById('messageArea');
  const gameContainer = document.getElementById('gameContainer');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generateRandomBoard() {
    const numbers = Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);
    shuffleArray(numbers);
    const newBoard = [];
    for (let i = 0; i < SIZE; i++) {
      const row = [];
      for (let j = 0; j < SIZE; j++) {
        row.push({ number: numbers[i * SIZE + j] });
      }
      newBoard.push(row);
    }
    return newBoard;
  }

  function resetBoardData() {
    board = generateRandomBoard();
    expectedNumber = 1;
  }

  function renderGrid() {
    gridEl.innerHTML = '';

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = board[r][c].number;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.number = board[r][c].number;
        gridEl.appendChild(cell);
      }
    }
  }

  function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const secs = Math.floor(seconds);
    const hundredths = Math.floor((seconds - secs) * 100);
    return `${secs}.${hundredths.toString().padStart(2, '0')}<span class="timer-unit">秒</span>`;
  }

  function updateTimerUI() {
    timerDisplay.innerHTML = formatTime(timeLeft);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startCountdown() {
    if (timerInterval) stopTimer();
    timerInterval = setInterval(() => {
      if (!gameActive) {
        stopTimer();
        return;
      }
      const decrement = TIMER_INTERVAL_MS / 1000;
      timeLeft = Math.max(0, timeLeft - decrement);
      updateTimerUI();

      if (timeLeft <= 0.005) {
        timeLeft = 0;
        updateTimerUI();
        endGame();
      }
    }, TIMER_INTERVAL_MS);
  }

  function flashCell(cellElement, type) {
    if (!cellElement) return;
    const flashClass = type === 'correct' ? 'correct-flash' : 'wrong-flash';
    cellElement.classList.add(flashClass);
    setTimeout(() => cellElement.classList.remove(flashClass), 200);
  }

  function handleCorrectClick(row, col, cellElement) {
    expectedNumber++;
    flashCell(cellElement, 'correct');
    playCorrectSound();
    if (expectedNumber > TOTAL_CELLS) {
      endGame();
    } else {
      messageArea.textContent = `⚡ 下一个 ${expectedNumber}`;
    }
  }

  function onGridClick(e) {
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const clickedNumber = board[row][col].number;
    
    if (clickedNumber === expectedNumber) {
      handleCorrectClick(row, col, cell);
    } else {
      flashCell(cell, 'wrong');
      playWrongSound();
      messageArea.textContent = `❌ 应该点击 ${expectedNumber}`;
    }
  }

  function endGame() {
    stopTimer();
    gameActive = false;
    const score = Math.max(0, expectedNumber - 1);
    localStorage.setItem('lastScore', score);
    window.location.href = `result.html?score=${score}`;
  }

  // 3秒倒计时
  function startCountdownOverlay() {
    let count = 3;
    gameActive = false; // 锁定游戏，禁止点击
    
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = count;
    
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count;
      } else if (count === 0) {
        countdownNumber.textContent = 'GO!';
      } else {
        clearInterval(interval);
        countdownOverlay.classList.add('hidden');
        gameActive = true; // 解锁游戏
        messageArea.textContent = '🎯 从 1 开始，按顺序点击数字';
        startCountdown(); // 开始游戏计时
      }
    }, 800);
  }

  function initApp() {
    resetBoardData();
    timeLeft = INIT_TIME;
    gameActive = false;
    
    renderGrid();
    updateTimerUI();
    messageArea.textContent = '准备开始...';
    
    gridEl.addEventListener('click', onGridClick);
    
    // 显示3秒倒计时
    startCountdownOverlay();
  }

  initApp();
  window.addEventListener('touchstart', ()=>{}, { passive: true });
})();

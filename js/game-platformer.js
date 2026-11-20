/**
 * GAME 1: SUPER DUEL HOBBIES (PLATFORMER)
 * Terintegrasi dengan HobbyDataManager, Fullscreen, & Karakter Bunda Shaumi
 */

(() => {
  'use strict';

  /* =========================================================================
   * 1. AUDIO & SOUND FX
   * ========================================================================= */
  const SoundFX = {
    ctx: null,
    muted: false,
    unlock() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      } catch (_) {}
    },
    toggleMute() {
      this.muted = !this.muted;
      const icon = document.getElementById('muteIcon');
      if (icon) icon.textContent = this.muted ? '🔇' : '🔊';
      if (this.muted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    speakWord(word) {
      if (this.muted || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word.toLowerCase());
        utter.lang = 'en-US';
        utter.rate = 0.9;
        utter.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utter.voice = enVoice;
        window.speechSynthesis.speak(utter);
      } catch (_) {}
    },
    playTone(freq, duration, type = 'square', gainVal = 0.12, endFreq = null, delay = 0) {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq !== null) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
        }
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {}
    },
    jump() { this.playTone(260, 0.16, 'square', 0.09, 620); },
    coin() {
      this.playTone(988, 0.08, 'square', 0.09);
      this.playTone(1319, 0.18, 'square', 0.09, null, 0.07);
    },
    bump() { this.playTone(150, 0.1, 'triangle', 0.14, 70); },
    stomp() { this.playTone(320, 0.12, 'sawtooth', 0.11, 110); },
    correct() {
      this.playTone(523, 0.1, 'triangle', 0.14);
      this.playTone(659, 0.1, 'triangle', 0.14, null, 0.09);
      this.playTone(784, 0.22, 'triangle', 0.15, null, 0.18);
    },
    wrong() {
      this.playTone(240, 0.14, 'sawtooth', 0.11, 170);
      this.playTone(165, 0.22, 'sawtooth', 0.11, 110, 0.12);
    },
    revive() {
      this.playTone(440, 0.1, 'sine', 0.14);
      this.playTone(587, 0.1, 'sine', 0.14, null, 0.09);
      this.playTone(880, 0.25, 'sine', 0.15, null, 0.18);
    },
    gameOver() {
      this.playTone(392, 0.16, 'sawtooth', 0.11);
      this.playTone(349, 0.16, 'sawtooth', 0.11, null, 0.16);
      this.playTone(311, 0.16, 'sawtooth', 0.11, null, 0.32);
      this.playTone(261, 0.35, 'sawtooth', 0.12, null, 0.48);
    },
    win() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => {
        this.playTone(n, i === 3 ? 0.35 : 0.12, 'triangle', 0.14, null, i * 0.11);
      });
    }
  };

  /* =========================================================================
   * 2. BANK SOAL TERINTEGRASI HOBBYDATAMANAGER
   * ========================================================================= */
  let HOBBY_BANK = window.HobbyDataManager ? window.HobbyDataManager.getHobbies('platformer') : window.DEFAULT_HOBBY_BANK;
  let activeHobbyIds = new Set(HOBBY_BANK.map(h => h.id));

  window.addEventListener('hobby-data-updated', (e) => {
    if (e.detail.gameKey === 'platformer' || e.detail.gameKey === 'all') {
      HOBBY_BANK = window.HobbyDataManager.getHobbies('platformer');
      activeHobbyIds = new Set(HOBBY_BANK.map(h => h.id));
      updateHobbyBadge();
    }
  });

  function updateHobbyBadge() {
    const badge = document.getElementById('badgeHobbyCount');
    if (badge) badge.textContent = activeHobbyIds.size;
  }

  function getActiveHobbyPool() {
    const pool = HOBBY_BANK.filter(h => activeHobbyIds.has(h.id));
    return pool.length >= 4 ? pool : [...HOBBY_BANK];
  }

  /* =========================================================================
   * 3. LEVEL PLATFORMER (GRID & SOLIDS)
   * ========================================================================= */
  const TILE = 48;
  const WORLD_ROWS = 14;
  const WORLD_COLS = 104;
  const WORLD_WIDTH = WORLD_COLS * TILE;
  const WORLD_HEIGHT = WORLD_ROWS * TILE;
  const GROUND_ROW = 12;
  const GROUND_Y = GROUND_ROW * TILE;
  const FLAG_COL = 96;

  const PIT_RANGES = [
    [24, 25],
    [49, 50],
    [74, 75]
  ];

  function isPitCol(c) {
    return PIT_RANGES.some(([s, e]) => c >= s && c <= e);
  }

  function createLevelData() {
    const solids = [];
    const coins = [];
    const enemies = [];

    for (let c = 0; c < WORLD_COLS; c++) {
      if (!isPitCol(c)) {
        solids.push({ x: c * TILE, y: GROUND_Y, w: TILE, h: TILE * 2, type: 'ground' });
      }
    }

    const addBlockY = (col, yPos, type) => {
      solids.push({ x: col * TILE, y: yPos, w: TILE, h: TILE, type, used: false, bumpY: 0 });
    };
    const addPipe = (col, heightPx) => {
      solids.push({ x: col * TILE, y: GROUND_Y - heightPx, w: TILE * 2, h: heightPx, type: 'pipe' });
    };
    const addCoinY = (col, yPos) => {
      coins.push({ x: col * TILE + TILE / 2, y: yPos, r: 14, collected: false });
    };
    const addEnemy = (col, floorY, minCol, maxCol, speed = 82) => {
      enemies.push({
        x: col * TILE + 6, y: floorY - 36, w: 36, h: 36,
        vx: -speed, minX: minCol * TILE, maxX: maxCol * TILE + TILE - 36,
        alive: true, squashedTimer: 0
      });
    };

    const QBLOCK_LOW_Y = GROUND_Y - 94 - TILE;
    const STEP1_Y = GROUND_Y - 88;
    const STEP2_Y = STEP1_Y - 88;
    const QBLOCK_ON_STEP1_Y = STEP1_Y - 92 - TILE;

    // ZONA 1
    addBlockY(8, QBLOCK_LOW_Y, 'brick');
    addBlockY(9, QBLOCK_LOW_Y, 'qblock');
    addBlockY(10, QBLOCK_LOW_Y, 'brick');
    addCoinY(8, QBLOCK_LOW_Y - 34);
    addCoinY(9, QBLOCK_LOW_Y - 42);
    addCoinY(10, QBLOCK_LOW_Y - 34);

    addPipe(14, 78);
    addCoinY(14.5, GROUND_Y - 122);
    addCoinY(15.5, GROUND_Y - 122);

    addBlockY(19, QBLOCK_LOW_Y, 'brick');
    addBlockY(20, QBLOCK_LOW_Y, 'qblock');
    addBlockY(21, QBLOCK_LOW_Y, 'brick');
    addEnemy(18, GROUND_Y, 16, 22, 78);

    addCoinY(23.5, GROUND_Y - 72);
    addCoinY(24.5, GROUND_Y - 115);
    addCoinY(25.5, GROUND_Y - 115);
    addCoinY(26.5, GROUND_Y - 72);

    // ZONA 2
    addBlockY(29, STEP1_Y, 'brick');
    addBlockY(30, STEP1_Y, 'brick');
    addBlockY(31, STEP1_Y, 'brick');
    addCoinY(29, STEP1_Y - 34);
    addCoinY(31, STEP1_Y - 34);
    addBlockY(30, QBLOCK_ON_STEP1_Y, 'qblock');

    for (let c = 33; c <= 37; c++) {
      addBlockY(c, STEP2_Y, 'brick');
      addCoinY(c, STEP2_Y - 34);
    }
    addBlockY(35, STEP2_Y - 92 - TILE, 'qblock');
    addEnemy(33, GROUND_Y, 28, 38, 86);

    addPipe(40, 82);
    addCoinY(40.5, GROUND_Y - 126);
    addCoinY(41.5, GROUND_Y - 126);

    addBlockY(44, QBLOCK_LOW_Y, 'brick');
    addBlockY(45, QBLOCK_LOW_Y, 'qblock');
    addBlockY(46, QBLOCK_LOW_Y, 'brick');
    addEnemy(44, GROUND_Y, 42, 47, 86);

    addCoinY(48.5, GROUND_Y - 72);
    addCoinY(49.5, GROUND_Y - 115);
    addCoinY(50.5, GROUND_Y - 115);
    addCoinY(51.5, GROUND_Y - 72);

    // ZONA 3
    addBlockY(54, QBLOCK_LOW_Y, 'brick');
    addBlockY(55, QBLOCK_LOW_Y, 'qblock');
    addBlockY(56, QBLOCK_LOW_Y, 'brick');
    addCoinY(54, QBLOCK_LOW_Y - 34);
    addCoinY(55, QBLOCK_LOW_Y - 34);
    addCoinY(56, QBLOCK_LOW_Y - 34);

    addPipe(59, 76);
    addEnemy(62, GROUND_Y, 61, 65, 92);
    addPipe(66, 92);
    addCoinY(62, GROUND_Y - 72);
    addCoinY(63, GROUND_Y - 102);
    addCoinY(64, GROUND_Y - 72);

    addBlockY(69, STEP1_Y, 'brick');
    addBlockY(70, STEP1_Y, 'brick');
    addBlockY(71, STEP1_Y, 'brick');
    addBlockY(70, QBLOCK_ON_STEP1_Y, 'qblock');

    addCoinY(73.5, GROUND_Y - 72);
    addCoinY(74.5, GROUND_Y - 115);
    addCoinY(75.5, GROUND_Y - 115);
    addCoinY(76.5, GROUND_Y - 72);

    // ZONA 4
    addBlockY(79, QBLOCK_LOW_Y, 'brick');
    addBlockY(80, QBLOCK_LOW_Y, 'qblock');
    addBlockY(81, QBLOCK_LOW_Y, 'brick');
    addEnemy(80, GROUND_Y, 77, 83, 96);

    addBlockY(85, GROUND_Y - TILE, 'brick');
    addBlockY(86, GROUND_Y - TILE, 'brick');
    addBlockY(86, GROUND_Y - TILE * 2, 'brick');
    addBlockY(87, GROUND_Y - TILE, 'brick');
    addBlockY(87, GROUND_Y - TILE * 2, 'brick');
    addBlockY(87, GROUND_Y - TILE * 3, 'brick');
    addCoinY(85, GROUND_Y - TILE - 32);
    addCoinY(86, GROUND_Y - TILE * 2 - 32);
    addCoinY(87, GROUND_Y - TILE * 3 - 32);

    addBlockY(90, QBLOCK_LOW_Y, 'qblock');
    addEnemy(91, GROUND_Y, 88, 94, 90);
    addCoinY(92, GROUND_Y - 56);
    addCoinY(93, GROUND_Y - 56);
    addCoinY(94, GROUND_Y - 56);

    return { solids, coins, enemies };
  }

  /* =========================================================================
   * 4. STATE PERMAINAN & KUSTOMISASI
   * ========================================================================= */
  let playMode = 'duel'; // 'duel' | 'solo'
  let gameActive = false;
  let rafId = null;
  let lastFrameTime = 0;
  let globalAnimTime = 0;

  const playerPrefs = [
    { gender: 'boy', uniform: 'SD' },
    { gender: 'girl', uniform: 'SD' }
  ];

  const UNIFORM_PALETTES = {
    SD:  { bottom: '#dc2626', bottomDark: '#991b1b', tie: '#dc2626' },
    SMP: { bottom: '#1e3a8a', bottomDark: '#172554', tie: '#1e3a8a' },
    SMA: { bottom: '#64748b', bottomDark: '#475569', tie: '#64748b' }
  };

  const players = [null, null];
  const canvases = [
    document.getElementById('canvas0'),
    document.getElementById('canvas1')
  ];
  const contexts = [
    canvases[0].getContext('2d'),
    canvases[1].getContext('2d')
  ];

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function createPlayerState(id, name) {
    const level = createLevelData();
    const pref = playerPrefs[id];
    return {
      id,
      name: name.trim() || (id === 0 ? 'Pemain 1' : 'Pemain 2'),
      gender: pref.gender,
      uniform: pref.uniform,
      badgeColor: id === 0 ? '#dc2626' : '#16a34a',

      x: 2 * TILE,
      y: GROUND_Y - 46,
      w: 34,
      h: 46,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      walkFrame: 0,

      lastSafeX: 2 * TILE,
      lastSafeY: GROUND_Y - 46,
      invincibleTimer: 0,

      state: 'PLAYING',
      score: 0,
      coins: 0,
      correctAnswers: 0,
      finishBonus: 0,
      elapsedTime: 0,
      finishTime: null,
      cameraX: 0,

      input: { left: false, right: false, jump: false },
      level,
      particles: [],

      hobbyDeck: shuffleArray(getActiveHobbyPool()),
      activeQuiz: null,
      quizLocked: false
    };
  }

  function generateHobbyQuizForPlayer(p) {
    const pool = getActiveHobbyPool();
    if (!p.hobbyDeck || p.hobbyDeck.length === 0) {
      p.hobbyDeck = shuffleArray(pool);
    }
    const target = p.hobbyDeck.pop();
    const distractors = shuffleArray(pool.filter(h => h.id !== target.id)).slice(0, 3);
    const options = shuffleArray([target, ...distractors]);
    const ansIndex = options.findIndex(o => o.id === target.id);
    return { target, options, ans: ansIndex };
  }

  /* =========================================================================
   * 5. SWITCHER MODE & FULLSCREEN
   * ========================================================================= */
  function setPlayMode(mode) {
    playMode = mode;
    const btnDuel = document.getElementById('btnModeDuel');
    const btnSolo = document.getElementById('btnModeSolo');
    const grid = document.getElementById('playerSetupGrid');
    const cardP2 = document.getElementById('setupCardP2');
    const labelP1 = document.getElementById('labelP1');

    if (mode === 'duel') {
      btnDuel.className = 'px-4 py-2 rounded-xl font-game font-bold text-sm sm:text-base cursor-pointer transition-all bg-indigo-600 text-white shadow-sm';
      btnSolo.className = 'px-4 py-2 rounded-xl font-game font-bold text-sm sm:text-base cursor-pointer transition-all text-slate-600 hover:bg-slate-200';
      cardP2.classList.remove('hidden');
      grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4';
      labelP1.textContent = 'Pemain 1 (Kiri)';
    } else {
      btnSolo.className = 'px-4 py-2 rounded-xl font-game font-bold text-sm sm:text-base cursor-pointer transition-all bg-rose-500 text-white shadow-sm';
      btnDuel.className = 'px-4 py-2 rounded-xl font-game font-bold text-sm sm:text-base cursor-pointer transition-all text-slate-600 hover:bg-slate-200';
      cardP2.classList.add('hidden');
      grid.className = 'grid grid-cols-1 max-w-md mx-auto gap-4 mb-4';
      labelP1.textContent = 'Pemain (Mode Solo)';
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function applyArenaLayout() {
    const pane0 = document.getElementById('pane0');
    const pane1 = document.getElementById('pane1');
    const hudWrap0 = document.getElementById('hudWrap0');

    if (playMode === 'solo') {
      pane0.className = 'relative w-full h-full overflow-hidden';
      pane1.classList.add('hidden');
      hudWrap0.className = 'pointer-events-none absolute top-14 sm:top-2 left-2 right-2 sm:right-auto sm:w-80 z-10 flex flex-col gap-1.5';
    } else {
      pane0.className = 'relative w-1/2 h-full overflow-hidden border-r-4 border-slate-900';
      pane1.classList.remove('hidden');
      hudWrap0.className = 'pointer-events-none absolute top-2 left-2 right-12 z-10 flex flex-col gap-1.5';
    }
  }

  function resizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = playMode === 'solo' ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const pane = document.getElementById('pane' + i);
      const canvas = canvases[i];
      if (!pane || !canvas) continue;
      const rect = pane.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        contexts[i].setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }
  window.addEventListener('resize', resizeCanvases);

  /* =========================================================================
   * 6. KONTROL TOUCH & KEYBOARD
   * ========================================================================= */
  const activePointersByBtn = new WeakMap();

  function setupTouchControls() {
    const buttons = document.querySelectorAll('.touch-btn');
    buttons.forEach(btn => {
      const pId = Number(btn.dataset.player);
      const action = btn.dataset.action;
      activePointersByBtn.set(btn, new Set());

      const updateBtnState = () => {
        const set = activePointersByBtn.get(btn);
        const isPressed = set.size > 0;
        btn.classList.toggle('active', isPressed);
        const p = players[pId];
        if (!p) return;
        if (action === 'left') p.input.left = isPressed;
        if (action === 'right') p.input.right = isPressed;
        if (action === 'jump') {
          if (isPressed && !p.input.jump) {
            p.jumpBufferTimer = 0.12;
          }
          p.input.jump = isPressed;
        }
      };

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        SoundFX.unlock();
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
        activePointersByBtn.get(btn).add(e.pointerId);
        updateBtnState();
      });

      const releasePointer = (e) => {
        const set = activePointersByBtn.get(btn);
        if (set.has(e.pointerId)) {
          set.delete(e.pointerId);
          updateBtnState();
        }
      };

      btn.addEventListener('pointerup', releasePointer);
      btn.addEventListener('pointercancel', releasePointer);
      btn.addEventListener('lostpointercapture', releasePointer);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    SoundFX.unlock();
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    const p0 = players[0];
    const p1 = players[1];

    if (p0) {
      if (code === 'KeyA' || (playMode === 'solo' && code === 'ArrowLeft')) p0.input.left = true;
      if (code === 'KeyD' || (playMode === 'solo' && code === 'ArrowRight')) p0.input.right = true;
      if (code === 'KeyW' || (playMode === 'solo' && (code === 'ArrowUp' || code === 'Space'))) {
        if (!p0.input.jump) p0.jumpBufferTimer = 0.12;
        p0.input.jump = true;
      }
      if (p0.state === 'QUIZ_POINT' || p0.state === 'QUIZ_RESCUE') {
        if (code === 'Digit1') submitQuizAnswer(0, 0);
        if (code === 'Digit2') submitQuizAnswer(0, 1);
        if (code === 'Digit3') submitQuizAnswer(0, 2);
        if (code === 'Digit4') submitQuizAnswer(0, 3);
      }
    }

    if (playMode === 'duel' && p1) {
      if (code === 'ArrowLeft') p1.input.left = true;
      if (code === 'ArrowRight') p1.input.right = true;
      if (code === 'ArrowUp') {
        if (!p1.input.jump) p1.jumpBufferTimer = 0.12;
        p1.input.jump = true;
      }
      if (p1.state === 'QUIZ_POINT' || p1.state === 'QUIZ_RESCUE') {
        if (code === 'Digit7' || code === 'Numpad1') submitQuizAnswer(1, 0);
        if (code === 'Digit8' || code === 'Numpad2') submitQuizAnswer(1, 1);
        if (code === 'Digit9' || code === 'Numpad3') submitQuizAnswer(1, 2);
        if (code === 'Digit0' || code === 'Numpad4') submitQuizAnswer(1, 3);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    const p0 = players[0];
    const p1 = players[1];
    if (p0) {
      if (code === 'KeyA' || (playMode === 'solo' && code === 'ArrowLeft')) p0.input.left = false;
      if (code === 'KeyD' || (playMode === 'solo' && code === 'ArrowRight')) p0.input.right = false;
      if (code === 'KeyW' || (playMode === 'solo' && (code === 'ArrowUp' || code === 'Space'))) p0.input.jump = false;
    }
    if (playMode === 'duel' && p1) {
      if (code === 'ArrowLeft') p1.input.left = false;
      if (code === 'ArrowRight') p1.input.right = false;
      if (code === 'ArrowUp') p1.input.jump = false;
    }
  });

  /* =========================================================================
   * 7. POP-UP SOAL GAMBAR HOBI & FEEDBACK
   * ========================================================================= */
  const OPT_LABELS = ['A', 'B', 'C', 'D'];
  const KEY_HINTS_P0 = ['1', '2', '3', '4'];
  const KEY_HINTS_P1 = ['7', '8', '9', '0'];

  function triggerFlash(pId, isCorrect) {
    const el = document.getElementById('flash' + pId);
    el.classList.remove('flash-correct', 'flash-wrong');
    void el.offsetWidth;
    el.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
  }

  function addFloatingText(p, x, y, text, color = '#fde047') {
    p.particles.push({ x, y, text, color, vy: -65, life: 0.9, maxLife: 0.9 });
  }

  function openQuizModal(pId, mode) {
    const p = players[pId];
    if (!p) return;

    p.state = mode;
    p.quizLocked = false;
    p.input.left = false;
    p.input.right = false;
    p.input.jump = false;

    const qObj = generateHobbyQuizForPlayer(p);
    p.activeQuiz = qObj;

    const modal = document.getElementById('quizModal' + pId);
    const card = document.getElementById('quizCard' + pId);
    const header = document.getElementById('quizHeader' + pId);
    const title = document.getElementById('quizTitle' + pId);
    const svgBox = document.getElementById('quizHobbySvg' + pId);
    const optsWrap = document.getElementById('quizOptions' + pId);
    const feedback = document.getElementById('quizFeedback' + pId);

    if (mode === 'QUIZ_POINT') {
      card.className = 'animate-pop w-full max-w-md rounded-3xl border-4 border-amber-400 shadow-2xl overflow-hidden bg-white';
      header.className = 'px-3.5 py-2 text-white font-game font-bold text-sm sm:text-lg flex items-center justify-between gap-2 bg-gradient-to-r from-blue-600 to-indigo-600';
      title.textContent = '⭐ TEBAK HOBI (+10 POIN)';
    } else {
      card.className = 'animate-pop w-full max-w-md rounded-3xl border-4 border-orange-500 shadow-2xl overflow-hidden bg-white';
      header.className = 'px-3.5 py-2 text-white font-game font-bold text-sm sm:text-lg flex items-center justify-between gap-2 bg-gradient-to-r from-red-600 to-orange-500';
      title.textContent = '❤️ PENYELAMAT NYAWA!';
    }

    svgBox.innerHTML = qObj.target.svg;
    feedback.classList.add('hidden');
    optsWrap.innerHTML = '';

    const hints = pId === 0 ? KEY_HINTS_P0 : KEY_HINTS_P1;

    qObj.options.forEach((optHobby, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.optIdx = idx;
      btn.className = 'btn-game p-2.5 sm:p-3 rounded-2xl border-2 border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 text-slate-900 font-game font-bold text-sm sm:text-lg text-left flex items-center gap-2 cursor-pointer transition-colors';
      btn.innerHTML = `
        <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 text-white font-game font-bold flex items-center justify-center shrink-0 text-sm sm:text-base">${OPT_LABELS[idx]}</span>
        <span class="leading-tight flex-1 tracking-wide truncate">${optHobby.word}</span>
        <span class="hidden sm:inline text-[11px] text-slate-400 font-sans font-bold">[${hints[idx]}]</span>
      `;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        SoundFX.unlock();
        submitQuizAnswer(pId, idx);
      });
      optsWrap.appendChild(btn);
    });

    modal.classList.remove('hidden');
  }

  function submitQuizAnswer(pId, chosenIdx) {
    const p = players[pId];
    if (!p || p.quizLocked || !p.activeQuiz) return;
    if (p.state !== 'QUIZ_POINT' && p.state !== 'QUIZ_RESCUE') return;

    p.quizLocked = true;
    const isCorrect = (chosenIdx === p.activeQuiz.ans);
    const target = p.activeQuiz.target;
    const mode = p.state;

    const optsWrap = document.getElementById('quizOptions' + pId);
    const feedback = document.getElementById('quizFeedback' + pId);
    const buttons = optsWrap.querySelectorAll('button');

    buttons.forEach((btn, idx) => {
      if (idx === p.activeQuiz.ans) {
        btn.className = 'p-2.5 sm:p-3 rounded-2xl border-2 border-emerald-600 bg-emerald-500 text-white font-game font-bold text-sm sm:text-lg text-left flex items-center gap-2';
      } else if (idx === chosenIdx && !isCorrect) {
        btn.className = 'p-2.5 sm:p-3 rounded-2xl border-2 border-red-600 bg-red-500 text-white font-game font-bold text-sm sm:text-lg text-left flex items-center gap-2';
      } else {
        btn.classList.add('opacity-50');
      }
    });

    feedback.classList.remove('hidden');
    triggerFlash(pId, isCorrect);

    if (isCorrect) {
      p.correctAnswers++;
      setTimeout(() => SoundFX.speakWord(target.word), 160);

      if (mode === 'QUIZ_POINT') {
        p.score += 10;
        SoundFX.correct();
        feedback.className = 'mt-2.5 py-2 px-3 rounded-xl text-center font-game font-bold text-sm sm:text-base bg-emerald-100 text-emerald-800 border-2 border-emerald-400';
        feedback.textContent = `✅ BENAR! ${target.word} (${target.meaning}) +10!`;
        addFloatingText(p, p.x + p.w / 2, p.y - 10, '+10', '#4ade80');
      } else {
        SoundFX.revive();
        feedback.className = 'mt-2.5 py-2 px-3 rounded-xl text-center font-game font-bold text-sm sm:text-base bg-emerald-100 text-emerald-800 border-2 border-emerald-400';
        feedback.textContent = `🛡️ SELAMAT! ${target.word} (${target.meaning})!`;
      }
    } else {
      if (mode === 'QUIZ_POINT') {
        SoundFX.wrong();
        feedback.className = 'mt-2.5 py-2 px-3 rounded-xl text-center font-game font-bold text-sm sm:text-base bg-red-100 text-red-800 border-2 border-red-400';
        feedback.textContent = `❌ Itu adalah ${target.word} (${target.meaning})`;
      } else {
        SoundFX.gameOver();
        feedback.className = 'mt-2.5 py-2 px-3 rounded-xl text-center font-game font-bold text-sm sm:text-base bg-red-100 text-red-800 border-2 border-red-400';
        feedback.textContent = `💀 SALAH! Jawabannya ${target.word}`;
      }
    }

    updateHUD(pId);

    setTimeout(() => {
      const modal = document.getElementById('quizModal' + pId);
      modal.classList.add('hidden');
      if (!gameActive || !players[pId]) return;

      if (mode === 'QUIZ_POINT') {
        p.state = 'PLAYING';
      } else if (mode === 'QUIZ_RESCUE') {
        if (isCorrect) {
          p.x = p.lastSafeX;
          p.y = p.lastSafeY - 8;
          p.vx = 0;
          p.vy = -120;
          p.invincibleTimer = 2.5;
          p.state = 'PLAYING';
          addFloatingText(p, p.x + p.w / 2, p.y - 16, 'BANGKIT!', '#38bdf8');
        } else {
          setPlayerGameOver(pId);
        }
      }
    }, 850);
  }

  /* =========================================================================
   * 8. STATUS SELESAI & OVERLAY PEMENANG
   * ========================================================================= */
  function setPlayerGameOver(pId) {
    const p = players[pId];
    p.state = 'GAMEOVER';
    p.finishTime = p.elapsedTime;
    if (playMode === 'solo') {
      setTimeout(() => showWinnerOverlay(), 500);
    } else {
      showStatusOverlay(pId, false);
      checkMatchEnd();
    }
  }

  function setPlayerFinished(pId) {
    const p = players[pId];
    if (p.state === 'FINISHED') return;
    p.state = 'FINISHED';
    p.finishTime = p.elapsedTime;
    p.finishBonus = 5;
    p.score += 5;
    addFloatingText(p, p.x, p.y - 20, 'FINIS (+5)', '#fde047');

    SoundFX.win();
    updateHUD(pId);

    if (playMode === 'solo') {
      setTimeout(() => showWinnerOverlay(), 600);
    } else {
      showStatusOverlay(pId, true);
      checkMatchEnd();
    }
  }

  function showStatusOverlay(pId, isFinished) {
    const p = players[pId];
    const overlay = document.getElementById('statusOverlay' + pId);
    const card = document.getElementById('statusCard' + pId);
    const icon = document.getElementById('statusIcon' + pId);
    const title = document.getElementById('statusTitle' + pId);
    const desc = document.getElementById('statusDesc' + pId);

    if (isFinished) {
      card.className = 'animate-pop w-full max-w-sm bg-white rounded-3xl border-4 border-emerald-400 p-6 text-center shadow-2xl';
      icon.textContent = '🏆';
      title.textContent = 'FINIS! (+5 POIN)';
      title.className = 'font-game text-2xl sm:text-3xl font-bold mb-1 text-emerald-600';
      desc.textContent = `Selesai dalam ${p.finishTime.toFixed(1)} detik. Menunggu lawan...`;
    } else {
      card.className = 'animate-pop w-full max-w-sm bg-white rounded-3xl border-4 border-red-500 p-6 text-center shadow-2xl';
      icon.textContent = '💀';
      title.textContent = 'GAME OVER';
      title.className = 'font-game text-3xl font-bold mb-1 text-red-600';
      desc.textContent = 'Skor akhirmu terkunci. Menunggu lawan...';
    }

    document.getElementById('statusScore' + pId).textContent = p.score;
    document.getElementById('statusCoins' + pId).textContent = p.coins;
    overlay.classList.remove('hidden');
  }

  function checkMatchEnd() {
    const p0 = players[0];
    const p1 = players[1];
    const p0Done = p0.state === 'FINISHED' || p0.state === 'GAMEOVER';
    const p1Done = p1.state === 'FINISHED' || p1.state === 'GAMEOVER';

    if (p0Done && p1Done) {
      setTimeout(() => showWinnerOverlay(), 700);
    }
  }

  function showWinnerOverlay() {
    const p0 = players[0];
    const p1 = players[1];
    gameActive = false;

    const headline = document.getElementById('winnerHeadline');
    const subtext = document.getElementById('winnerSubtext');
    const winGrid = document.getElementById('winnerCardsGrid');
    const winCard1 = document.getElementById('winCard1');

    if (playMode === 'solo') {
      winCard1.classList.add('hidden');
      winGrid.className = 'grid grid-cols-1 max-w-xs mx-auto gap-4 mb-6';
      if (p0.state === 'FINISHED') {
        headline.textContent = `🎉 HEBAT! ${p0.name.toUpperCase()} FINIS!`;
        headline.className = 'font-game text-3xl sm:text-4xl font-bold text-emerald-600 mb-1';
        subtext.textContent = 'Bunda Shaumi bangga padamu! Kosakata hobimu hebat!';
      } else {
        headline.textContent = `💪 AYO COBA LAGI!`;
        headline.className = 'font-game text-3xl sm:text-4xl font-bold text-amber-600 mb-1';
        subtext.textContent = `Kamu sudah menjawab ${p0.correctAnswers} hobi dengan benar!`;
      }
      fillWinnerCard(0, p0);
    } else {
      winCard1.classList.remove('hidden');
      winGrid.className = 'grid grid-cols-2 gap-4 mb-6';
      if (p0.score > p1.score) {
        headline.textContent = `🎉 ${p0.name.toUpperCase()} MENANG!`;
        headline.className = 'font-game text-3xl sm:text-5xl font-bold text-red-600 mb-1';
        subtext.textContent = `Unggul ${p0.score - p1.score} poin atas ${p1.name}!`;
      } else if (p1.score > p0.score) {
        headline.textContent = `🎉 ${p1.name.toUpperCase()} MENANG!`;
        headline.className = 'font-game text-3xl sm:text-5xl font-bold text-emerald-600 mb-1';
        subtext.textContent = `Unggul ${p1.score - p0.score} poin atas ${p0.name}!`;
      } else {
        headline.textContent = '🤝 HASIL SERI!';
        headline.className = 'font-game text-3xl sm:text-5xl font-bold text-amber-500 mb-1';
        subtext.textContent = 'Kalian berdua sama-sama hebat!';
      }
      fillWinnerCard(0, p0);
      fillWinnerCard(1, p1);
    }

    SoundFX.win();
    document.getElementById('winnerOverlay').classList.remove('hidden');
  }

  function fillWinnerCard(idx, p) {
    document.getElementById('winName' + idx).textContent = p.name;
    document.getElementById('winStatus' + idx).textContent = p.state === 'FINISHED' ? '🚩 FINIS' : '💀 GAME OVER';
    document.getElementById('winScore' + idx).textContent = p.score;
    document.getElementById('winCoins' + idx).textContent = p.coins;
    document.getElementById('winCorrect' + idx).textContent = p.correctAnswers;
    document.getElementById('winBonus' + idx).textContent = `+${p.finishBonus}`;
    const tVal = p.finishTime !== null ? p.finishTime : p.elapsedTime;
    document.getElementById('winTime' + idx).textContent = `${tVal.toFixed(1)} dtk`;
  }

  /* =========================================================================
   * 9. UPDATE FISIKA & GERAKAN PEMAIN
   * ========================================================================= */
  const GRAVITY = 1480;
  const MOVE_SPEED = 300;
  const JUMP_VELOCITY = -700;
  const COYOTE_TIME = 0.10;

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function updatePlayer(p, dt) {
    for (let i = p.particles.length - 1; i >= 0; i--) {
      const pt = p.particles[i];
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) p.particles.splice(i, 1);
    }
    for (const s of p.level.solids) {
      if (s.bumpY && s.bumpY < 0) {
        s.bumpY = Math.min(0, s.bumpY + 120 * dt);
      }
    }

    if (p.state !== 'PLAYING') return;

    p.elapsedTime += dt;
    if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);

    if (p.onGround) p.coyoteTimer = COYOTE_TIME;
    else p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);

    if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);

    if (p.input.left && !p.input.right) {
      p.vx = -MOVE_SPEED;
      p.facing = -1;
    } else if (p.input.right && !p.input.left) {
      p.vx = MOVE_SPEED;
      p.facing = 1;
    } else {
      p.vx *= 0.72;
      if (Math.abs(p.vx) < 8) p.vx = 0;
    }

    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      p.vy = JUMP_VELOCITY;
      p.onGround = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      SoundFX.jump();
    }

    p.vy = Math.min(920, p.vy + GRAVITY * dt);

    p.x += p.vx * dt;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.w > WORLD_WIDTH) { p.x = WORLD_WIDTH - p.w; p.vx = 0; }
    for (const s of p.level.solids) {
      if (rectsOverlap(p, s)) {
        if (p.vx > 0) { p.x = s.x - p.w; p.vx = 0; }
        else if (p.vx < 0) { p.x = s.x + s.w; p.vx = 0; }
      }
    }

    const prevY = p.y;
    p.y += p.vy * dt;
    p.onGround = false;

    let hitQuestionBlock = null;
    for (const s of p.level.solids) {
      if (rectsOverlap(p, s)) {
        if (p.vy > 0) {
          p.y = s.y - p.h;
          p.vy = 0;
          p.onGround = true;

          if (s.type === 'ground') {
            const centerCol = Math.floor((p.x + p.w / 2) / TILE);
            if (!isPitCol(centerCol) && !isPitCol(centerCol - 1) && !isPitCol(centerCol + 1)) {
              p.lastSafeX = p.x;
              p.lastSafeY = p.y;
            } else if (!isPitCol(centerCol)) {
              p.lastSafeX = centerCol * TILE + 6;
              p.lastSafeY = p.y;
            }
          }
        } else if (p.vy < 0) {
          p.y = s.y + s.h;
          p.vy = 40;
          if (s.type === 'qblock' && !s.used) {
            s.used = true;
            s.bumpY = -12;
            SoundFX.bump();
            hitQuestionBlock = s;
          } else if (s.type === 'brick' || s.type === 'qblock') {
            s.bumpY = -8;
            SoundFX.bump();
          }
        }
      }
    }

    if (p.onGround && Math.abs(p.vx) > 20) p.walkFrame += dt * 12;
    else p.walkFrame = 0;

    if (hitQuestionBlock) {
      openQuizModal(p.id, 'QUIZ_POINT');
      return;
    }

    if (p.y > WORLD_HEIGHT + 40) {
      SoundFX.wrong();
      openQuizModal(p.id, 'QUIZ_RESCUE');
      return;
    }

    const pxCenter = p.x + p.w / 2;
    const pyCenter = p.y + p.h / 2;
    for (const c of p.level.coins) {
      if (c.collected) continue;
      const dx = pxCenter - c.x;
      const dy = pyCenter - c.y;
      if (dx * dx + dy * dy < (c.r + 18) * (c.r + 18)) {
        c.collected = true;
        p.coins += 1;
        p.score += 1;
        SoundFX.coin();
        addFloatingText(p, c.x, c.y - 10, '+1', '#fde047');
        updateHUD(p.id);
      }
    }

    for (const en of p.level.enemies) {
      if (!en.alive) {
        if (en.squashedTimer > 0) en.squashedTimer -= dt;
        continue;
      }
      en.x += en.vx * dt;
      if (en.x <= en.minX) { en.x = en.minX; en.vx = Math.abs(en.vx); }
      else if (en.x >= en.maxX) { en.x = en.maxX; en.vx = -Math.abs(en.vx); }

      if (rectsOverlap(p, en)) {
        const playerPrevBottom = prevY + p.h;
        const isStomp = (p.vy > 0) && (playerPrevBottom <= en.y + en.h * 0.58);
        if (isStomp) {
          en.alive = false;
          en.squashedTimer = 0.45;
          p.vy = -460;
          p.score += 2;
          SoundFX.stomp();
          addFloatingText(p, en.x + en.w / 2, en.y, '+2', '#86efac');
          updateHUD(p.id);
        } else if (p.invincibleTimer <= 0) {
          SoundFX.wrong();
          openQuizModal(p.id, 'QUIZ_RESCUE');
          return;
        }
      }
    }

    const flagX = FLAG_COL * TILE + 18;
    if (p.x + p.w >= flagX) {
      setPlayerFinished(p.id);
      return;
    }

    const prog = Math.max(0, Math.min(100, (p.x / flagX) * 100));
    document.getElementById('hudProg' + p.id).style.width = prog.toFixed(1) + '%';
  }

  function updateHUD(pId) {
    const p = players[pId];
    if (!p) return;
    document.getElementById('hudName' + pId).textContent = p.name;
    document.getElementById('hudCoins' + pId).textContent = p.coins;
    document.getElementById('hudScore' + pId).textContent = p.score;
  }

  /* =========================================================================
   * 10. RENDER CANVAS 2D
   * ========================================================================= */
  function renderPlayerView(pId) {
    const p = players[pId];
    const canvas = canvases[pId];
    const ctx = contexts[pId];
    if (!p || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;
    const scale = viewH / WORLD_HEIGHT;
    const visibleWorldW = viewW / scale;

    const targetCamX = Math.max(0, Math.min(WORLD_WIDTH - visibleWorldW, p.x - visibleWorldW * 0.36));
    p.cameraX += (targetCamX - p.cameraX) * 0.14;

    ctx.save();
    ctx.clearRect(0, 0, viewW, viewH);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.7, '#7dd3fc');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.scale(scale, scale);
    drawParallaxBackground(ctx, p.cameraX, visibleWorldW);

    ctx.save();
    ctx.translate(-Math.floor(p.cameraX), 0);

    const minVisX = p.cameraX - TILE * 2;
    const maxVisX = p.cameraX + visibleWorldW + TILE * 2;

    drawFinishArea(ctx);

    for (const s of p.level.solids) {
      if (s.x + s.w < minVisX || s.x > maxVisX) continue;
      const drawY = s.y + (s.bumpY || 0);
      if (s.type === 'ground') drawGroundBlock(ctx, s.x, drawY, s.w, s.h);
      else if (s.type === 'brick') drawBrickBlock(ctx, s.x, drawY, s.w, s.h);
      else if (s.type === 'qblock') drawQuestionBlock(ctx, s.x, drawY, s.w, s.h, s.used);
      else if (s.type === 'pipe') drawPipe(ctx, s.x, drawY, s.w, s.h);
    }

    for (const c of p.level.coins) {
      if (c.collected || c.x < minVisX || c.x > maxVisX) continue;
      drawCoin(ctx, c.x, c.y, c.r);
    }

    for (const en of p.level.enemies) {
      if (en.x + en.w < minVisX || en.x > maxVisX) continue;
      if (en.alive || en.squashedTimer > 0) drawEnemy(ctx, en);
    }

    drawCharacter(ctx, p);

    for (const pt of p.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 22px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(pt.text, pt.x, pt.y);
      ctx.fillStyle = pt.color;
      ctx.fillText(pt.text, pt.x, pt.y);
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  function drawParallaxBackground(ctx, camX, visW) {
    ctx.fillStyle = '#4ade80';
    const hillStep = 420;
    const startHill = Math.floor((camX * 0.35) / hillStep) * hillStep;
    for (let hx = startHill - hillStep; hx < camX * 0.35 + visW + hillStep; hx += hillStep) {
      const screenX = hx - camX * 0.35;
      ctx.beginPath();
      ctx.arc(screenX + 120, GROUND_ROW * TILE + 20, 150, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(screenX + 290, GROUND_ROW * TILE + 20, 100, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const cloudStep = 340;
    const startCloud = Math.floor((camX * 0.2) / cloudStep) * cloudStep;
    for (let cx = startCloud - cloudStep; cx < camX * 0.2 + visW + cloudStep; cx += cloudStep) {
      const sx = cx - camX * 0.2;
      const cy = 95 + ((Math.abs(cx) % 3) * 38);
      ctx.beginPath();
      ctx.arc(sx, cy, 24, 0, Math.PI * 2);
      ctx.arc(sx + 24, cy - 10, 30, 0, Math.PI * 2);
      ctx.arc(sx + 52, cy, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGroundBlock(ctx, x, y, w, h) {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x, y, w, 5);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 15, w - 2, h - 16);
  }

  function drawBrickBlock(ctx, x, y, w, h) {
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h / 2);
    ctx.moveTo(x + w / 4, y + h / 2); ctx.lineTo(x + w / 4, y + h);
    ctx.stroke();
  }

  function drawQuestionBlock(ctx, x, y, w, h, used) {
    if (used) {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillRect(x + w - 10, y + 6, 4, 4);
      ctx.fillRect(x + 6, y + h - 10, 4, 4);
      ctx.fillRect(x + w - 10, y + h - 10, 4, 4);
      return;
    }
    const pulse = Math.sin(globalAnimTime * 5) * 0.5 + 0.5;
    ctx.fillStyle = pulse > 0.5 ? '#f59e0b' : '#fbbf24';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 5, y + 5, 4, 4);
    ctx.fillRect(x + w - 9, y + 5, 4, 4);
    ctx.fillRect(x + 5, y + h - 9, 4, 4);
    ctx.fillRect(x + w - 9, y + h - 9, 4, 4);

    ctx.font = 'bold 30px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#78350f';
    ctx.fillText('?', x + w / 2 + 2, y + h / 2 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('?', x + w / 2, y + h / 2);
  }

  function drawPipe(ctx, x, y, w, h) {
    const rimH = 26;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x + 6, y + rimH, w - 12, h - rimH);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x + 14, y + rimH, 12, h - rimH);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + w - 20, y + rimH, 14, h - rimH);
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 6, y + rimH, w - 12, h - rimH);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y, w, rimH);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(x + 10, y + 2, 14, rimH - 4);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + w - 18, y + 2, 16, rimH - 4);
    ctx.strokeRect(x, y, w, rimH);
  }

  function drawCoin(ctx, x, y, r) {
    const spin = Math.abs(Math.cos(globalAnimTime * 5 + x * 0.02));
    const rx = Math.max(4, r * spin);
    const bob = Math.sin(globalAnimTime * 4 + x * 0.03) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (rx > 7) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-rx * 0.25, -r * 0.45, rx * 0.5, r * 0.9);
    }
    ctx.restore();
  }

  function drawEnemy(ctx, en) {
    ctx.save();
    if (!en.alive) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(en.x, en.y + en.h - 12, en.w, 12);
      ctx.restore();
      return;
    }
    const cx = en.x + en.w / 2;
    const step = Math.sin(globalAnimTime * 12) * 3;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(en.x + 5, en.y + en.h - 8 + step * 0.5, 10, 8);
    ctx.fillRect(en.x + en.w - 15, en.y + en.h - 8 - step * 0.5, 10, 8);

    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(cx, en.y + 16, 18, Math.PI, 0);
    ctx.lineTo(en.x + en.w, en.y + 26);
    ctx.lineTo(en.x, en.y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 10, en.y + 11, 7, 9);
    ctx.fillRect(cx + 3, en.y + 11, 7, 9);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 7, en.y + 14, 3, 5);
    ctx.fillRect(cx + 4, en.y + 14, 3, 5);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, en.y + 9); ctx.lineTo(cx - 2, en.y + 13);
    ctx.moveTo(cx + 12, en.y + 9); ctx.lineTo(cx + 2, en.y + 13);
    ctx.stroke();
    ctx.restore();
  }

  function drawCharacter(ctx, p) {
    if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 16) % 2 === 0) return;
    drawStudentSprite(ctx, {
      cx: p.x + p.w / 2,
      cy: p.y + p.h / 2,
      facing: p.facing,
      gender: p.gender,
      uniform: p.uniform,
      walkFrame: p.walkFrame,
      onGround: p.onGround,
      tag: p.id === 0 ? 'P1' : 'P2',
      badgeColor: p.badgeColor
    });
  }

  function drawStudentSprite(ctx, opts) {
    const {
      cx, cy, facing = 1, gender = 'boy', uniform = 'SD',
      walkFrame = 0, onGround = true, tag = null, badgeColor = '#dc2626', scale = 1
    } = opts;

    const pal = UNIFORM_PALETTES[uniform] || UNIFORM_PALETTES.SD;
    const legSwing = onGround ? Math.sin(walkFrame) * 4.5 : 4;
    const armSwing = onGround ? -Math.sin(walkFrame) * 4 : -3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(facing * scale, scale);

    if (gender === 'girl') {
      ctx.fillStyle = '#1e1b18';
      ctx.beginPath();
      ctx.ellipse(-12, -13, 6.5, 9, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.tie;
      ctx.beginPath();
      ctx.arc(-9, -18, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (gender === 'hijab') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-10 + legSwing * 0.6, 17, 10, 6, 2);
      ctx.roundRect(1 - legSwing * 0.6, 17, 10, 6, 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-8 + legSwing * 0.7, 11, 5, 5);
      ctx.fillRect(3 - legSwing * 0.7, 11, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8 + legSwing * 0.7, 14, 5, 4);
      ctx.fillRect(3 - legSwing * 0.7, 14, 5, 4);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-10 + legSwing * 0.7, 9, 9, 6, 2);
      ctx.roundRect(2 - legSwing * 0.7, 17, 9, 6, 2);
      ctx.fill();
    }

    ctx.fillStyle = gender === 'hijab' ? '#f8fafc' : '#fed7aa';
    ctx.fillRect(-13 - armSwing * 0.5, -1, 5, 10);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-10, -4, 20, 14, 3);
    ctx.fill();
    ctx.stroke();

    if (gender !== 'hijab') {
      ctx.fillStyle = pal.tie;
      ctx.beginPath();
      ctx.moveTo(0, -3); ctx.lineTo(3, 5); ctx.lineTo(0, 8); ctx.lineTo(-3, 5);
      ctx.closePath();
      ctx.fill();
    }

    if (gender === 'boy') {
      const pantH = uniform === 'SD' ? 8 : 11;
      ctx.fillStyle = pal.bottom;
      ctx.fillRect(-10, 7, 20, 5);
      ctx.fillRect(-9 + legSwing * 0.5, 10, 8, pantH - 3);
      ctx.fillRect(1 - legSwing * 0.5, 10, 8, pantH - 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, 6, 20, 2);
    } else if (gender === 'girl') {
      ctx.fillStyle = pal.bottom;
      ctx.beginPath();
      ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.lineTo(13, 16); ctx.lineTo(-13, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.bottomDark;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, 7); ctx.lineTo(-6, 16);
      ctx.moveTo(0, 7); ctx.lineTo(0, 16);
      ctx.moveTo(5, 7); ctx.lineTo(6, 16);
      ctx.stroke();
    } else {
      ctx.fillStyle = pal.bottom;
      ctx.beginPath();
      ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.lineTo(12.5, 19); ctx.lineTo(-12.5, 19);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.bottomDark;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4, 7); ctx.lineTo(-5, 19);
      ctx.moveTo(4, 7); ctx.lineTo(5, 19);
      ctx.stroke();
    }

    ctx.fillStyle = gender === 'hijab' ? '#ffffff' : '#fed7aa';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(7 + armSwing * 0.5, -1, 5, 10, 2);
    ctx.fill();
    if (gender === 'hijab') ctx.stroke();

    if (gender === 'hijab') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -14, 12.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(11, 2);
      ctx.quadraticCurveTo(0, 6, -11, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(2.5, -13, 7.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.roundRect(-10, -23, 20, 19, 8);
      ctx.fill();

      ctx.fillStyle = '#1e1b18';
      if (gender === 'boy') {
        ctx.beginPath();
        ctx.arc(0, -17, 11, Math.PI, Math.PI * 2);
        ctx.lineTo(11, -15); ctx.lineTo(-11, -15);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-10, -21, 5, 7);
      } else {
        ctx.beginPath();
        ctx.arc(0, -17, 11.5, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.fillRect(-11, -19, 6, 12);
      }
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(4.5, -14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.1, -14.7, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.ellipse(6.5, -10.5, 2.2, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(4, -10.5, 2.8, 0.2, Math.PI * 0.85);
    ctx.stroke();

    if (tag) {
      ctx.scale(facing, 1);
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(-13, -43, 26, 15, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tag, 0, -35.5);
    }
    ctx.restore();
  }

  let previewTime = 0;
  function animateStartPreviews() {
    previewTime += 0.05;
    const startEl = document.getElementById('startScreen');
    if (startEl && !startEl.classList.contains('hidden')) {
      for (let i = 0; i < 2; i++) {
        const c = document.getElementById('previewCanvas' + i);
        if (!c) continue;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, 68, 80, 12);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, 68, 80, 3);
        drawStudentSprite(ctx, {
          cx: 40, cy: 43, facing: 1,
          gender: playerPrefs[i].gender, uniform: playerPrefs[i].uniform,
          walkFrame: previewTime * 2.2, onGround: true, tag: null, scale: 1.15
        });
      }
    }
    requestAnimationFrame(animateStartPreviews);
  }

  function drawFinishArea(ctx) {
    const flagX = FLAG_COL * TILE + 20;
    const baseY = GROUND_ROW * TILE;
    const poleH = TILE * 7;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(flagX, baseY - poleH, 8, poleH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(flagX, baseY - poleH, 8, poleH);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(flagX + 4, baseY - poleH - 6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const wave = Math.sin(globalAnimTime * 6) * 4;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(flagX + 8, baseY - poleH + 6);
    ctx.lineTo(flagX + 74, baseY - poleH + 22 + wave);
    ctx.lineTo(flagX + 8, baseY - poleH + 46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Fredoka, sans-serif';
    ctx.fillText('FINIS', flagX + 14, baseY - poleH + 31);

    const cx = (FLAG_COL + 2.5) * TILE;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx, baseY - 120, 110, 120);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx, baseY - 120, 110, 120);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 8, baseY - 140, 26, 24);
    ctx.fillRect(cx + 42, baseY - 140, 26, 24);
    ctx.fillRect(cx + 92, baseY - 140, 26, 24);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx + 55, baseY - 38, 22, Math.PI, 0);
    ctx.lineTo(cx + 77, baseY);
    ctx.lineTo(cx + 33, baseY);
    ctx.closePath();
    ctx.fill();
  }

  /* =========================================================================
   * 11. GAME LOOP & KONTROL
   * ========================================================================= */
  function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
    lastFrameTime = timestamp;
    globalAnimTime += dt;

    if (gameActive) {
      const count = playMode === 'solo' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        if (players[i]) {
          updatePlayer(players[i], dt);
          renderPlayerView(i);
        }
      }
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    SoundFX.unlock();
    const name0 = document.getElementById('inputP1').value;
    const name1 = document.getElementById('inputP2').value;

    players[0] = createPlayerState(0, name0);
    players[1] = playMode === 'duel' ? createPlayerState(1, name1) : null;

    applyArenaLayout();

    for (let i = 0; i < 2; i++) {
      document.getElementById('quizModal' + i).classList.add('hidden');
      document.getElementById('statusOverlay' + i).classList.add('hidden');
      document.getElementById('hudProg' + i).style.width = '0%';
      if (players[i]) updateHUD(i);
    }

    document.getElementById('winnerOverlay').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');

    resizeCanvases();
    gameActive = true;
    lastFrameTime = 0;
    if (!rafId) rafId = requestAnimationFrame(gameLoop);
  }

  function backToMenu() {
    gameActive = false;
    document.getElementById('winnerOverlay').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
  }

  /* =========================================================================
   * 12. BANK SOAL DIALOG
   * ========================================================================= */
  function showHobbyBankMsg(text) {
    const el = document.getElementById('hobbyBankMsg');
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function renderHobbyBankModal() {
    const grid = document.getElementById('hobbyBankGrid');
    grid.innerHTML = '';

    HOBBY_BANK.forEach(hobby => {
      const isChecked = activeHobbyIds.has(hobby.id);
      const card = document.createElement('div');
      card.className = `rounded-2xl border-2 p-2.5 flex flex-col items-center text-center transition-all ${
        isChecked ? 'bg-sky-50 border-blue-400 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
      }`;

      card.innerHTML = `
        <div class="w-full flex items-center justify-between mb-1">
          <label class="inline-flex items-center gap-1 cursor-pointer text-xs font-extrabold text-slate-600">
            <input type="checkbox" ${isChecked ? 'checked' : ''} class="hobby-chk w-4 h-4 accent-blue-600 cursor-pointer" data-id="${hobby.id}">
            <span>Aktif</span>
          </label>
          <button type="button" class="hobby-spk w-7 h-7 rounded-full bg-white border border-sky-300 text-sm flex items-center justify-center shadow-xs cursor-pointer hover:bg-sky-100" title="Dengarkan pelafalan">
            🔊
          </button>
        </div>
        <div class="w-20 h-16 flex items-center justify-center my-1">
          ${hobby.svg}
        </div>
        <div class="font-game font-bold text-sm text-indigo-800">${hobby.word}</div>
        <div class="text-xs font-bold text-slate-500">${hobby.meaning}</div>
      `;

      card.querySelector('.hobby-spk').addEventListener('click', () => {
        SoundFX.unlock();
        SoundFX.speakWord(hobby.word);
      });

      const chk = card.querySelector('.hobby-chk');
      chk.addEventListener('change', () => {
        if (!chk.checked && activeHobbyIds.size <= 4) {
          chk.checked = true;
          showHobbyBankMsg('Minimal 4 hobi harus aktif agar 4 pilihan jawaban bisa dibuat!');
          return;
        }
        if (chk.checked) activeHobbyIds.add(hobby.id);
        else activeHobbyIds.delete(hobby.id);
        updateHobbyBadge();
        renderHobbyBankModal();
      });

      grid.appendChild(card);
    });
  }

  function setupCharacterSelectors() {
    document.querySelectorAll('.opt-gender-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = Number(btn.dataset.p);
        const gender = btn.dataset.gender;
        playerPrefs[pId].gender = gender;

        const group = document.getElementById('genderGroup' + pId);
        const activeCls = pId === 0 ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
        const inactiveCls = pId === 0 ? 'bg-white text-slate-700 border-red-200 hover:border-red-400' : 'bg-white text-slate-700 border-emerald-200 hover:border-emerald-400';

        group.querySelectorAll('.opt-gender-btn').forEach(b => {
          b.className = `opt-gender-btn py-1.5 px-2 rounded-xl border-2 text-xs font-extrabold cursor-pointer transition-all ${b.dataset.gender === gender ? activeCls : inactiveCls}`;
        });
      });
    });

    document.querySelectorAll('.opt-uniform-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = Number(btn.dataset.p);
        const uniform = btn.dataset.uniform;
        playerPrefs[pId].uniform = uniform;

        const group = document.getElementById('uniformGroup' + pId);
        const activeCls = pId === 0 ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
        const inactiveCls = pId === 0 ? 'bg-white text-slate-700 border-red-200 hover:border-red-400' : 'bg-white text-slate-700 border-emerald-200 hover:border-emerald-400';

        group.querySelectorAll('.opt-uniform-btn').forEach(b => {
          b.className = `opt-uniform-btn py-1.5 px-2 rounded-xl border-2 text-xs font-extrabold cursor-pointer transition-all ${b.dataset.uniform === uniform ? activeCls : inactiveCls}`;
        });
      });
    });
  }

  window.addEventListener('load', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    updateHobbyBadge();
    setupTouchControls();
    setupCharacterSelectors();
    animateStartPreviews();

    setPlayMode(window.innerWidth < 768 ? 'solo' : 'duel');

    document.getElementById('btnModeDuel').addEventListener('click', () => setPlayMode('duel'));
    document.getElementById('btnModeSolo').addEventListener('click', () => setPlayMode('solo'));
    document.getElementById('btnStartGame').addEventListener('click', startGame);
    document.getElementById('btnPlayAgain').addEventListener('click', startGame);
    document.getElementById('btnBackMenu').addEventListener('click', backToMenu);
    document.getElementById('btnWinnerMenu').addEventListener('click', backToMenu);
    document.getElementById('btnMute').addEventListener('click', () => SoundFX.toggleMute());
    document.getElementById('btnFullscreenStart').addEventListener('click', toggleFullscreen);
    document.getElementById('btnFullscreenInGame').addEventListener('click', toggleFullscreen);

    const hobbyModal = document.getElementById('hobbyBankModal');
    document.getElementById('btnOpenHobbyBank').addEventListener('click', () => {
      renderHobbyBankModal();
      hobbyModal.classList.remove('hidden');
    });
    document.getElementById('btnCloseHobbyBank').addEventListener('click', () => hobbyModal.classList.add('hidden'));
    document.getElementById('btnDoneHobbyBank').addEventListener('click', () => hobbyModal.classList.add('hidden'));
    document.getElementById('btnSelectAllHobbies').addEventListener('click', () => {
      activeHobbyIds = new Set(HOBBY_BANK.map(h => h.id));
      updateHobbyBadge();
      renderHobbyBankModal();
    });
  });
})();

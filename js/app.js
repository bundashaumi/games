/**
 * MAIN APP CONTROLLER - LEARNING ENGLISH WITH BUNDA SHAUMI
 * Mengontrol navigasi sidebar (Games, Modul Canva, Umpan Balik, RPP, Asesmen),
 * peluncur game (modal SPA + Fullscreen), modul Canva slideshow dengan tombol keluar fullscreen TV,
 * interaksi Umpan Balik kolektif bergilir siswa dengan emotikon 3D Animated, serta Settings Bank Soal.
 */

(() => {
  'use strict';

  // State aplikasi
  let currentGameKey = 'all';
  let activeGameIframe = null;
  let currentView = 'games';
  let studentSessionList = [];

  try {
    studentSessionList = JSON.parse(localStorage.getItem('bunda_shaumi_session_emotes') || '[]');
  } catch (_) {
    studentSessionList = [];
  }

  // DOM Elements - Navigation & Views
  const viewGames = document.getElementById('viewGames');
  const viewModul = document.getElementById('viewModul');
  const viewFeedback = document.getElementById('viewFeedback');

  const navGames = document.getElementById('navGames');
  const navModul = document.getElementById('navModul');
  const navFeedback = document.getElementById('navFeedback');
  const navRPP = document.getElementById('navRPP');
  const navAsesmen = document.getElementById('navAsesmen');

  // Modul Controls
  const btnFullscreenModul = document.getElementById('btnFullscreenModul');
  const btnBackToGamesFromModul = document.getElementById('btnBackToGamesFromModul');
  const canvaEmbedWrapper = document.getElementById('canvaEmbedWrapper');
  const btnFloatingExitFullscreen = document.getElementById('btnFloatingExitFullscreen');

  // Feedback Controls (Sampaikan Perasaanmu di Sini)
  const btnBackToGamesFromFeedback = document.getElementById('btnBackToGamesFromFeedback');
  const feedbackDropZone = document.getElementById('feedbackDropZone');
  const dropZonePlaceholder = document.getElementById('dropZonePlaceholder');
  const studentEmoteBoard = document.getElementById('studentEmoteBoard');
  const boardTallyBar = document.getElementById('boardTallyBar');
  const badgeLiveCount = document.getElementById('badgeLiveCount');
  const btnResetBoard = document.getElementById('btnResetBoard');
  const emoteTray = document.getElementById('emoteTray');
  const feedbackMentorSpeech = document.getElementById('feedbackMentorSpeech');
  const feedbackConfettiCanvas = document.getElementById('feedbackConfettiCanvas');
  const feedbackCountTotal = document.getElementById('feedbackCountTotal');
  const btnClearFeedbackStats = document.getElementById('btnClearFeedbackStats');

  // Game Modal Elements
  const gameModal = document.getElementById('gameModal');
  const gameIframe = document.getElementById('gameIframe');
  const gameModalTitle = document.getElementById('gameModalTitle');
  const btnCloseGameModal = document.getElementById('btnCloseGameModal');
  const btnFullscreenGame = document.getElementById('btnFullscreenGame');
  const btnGameModalSettings = document.getElementById('btnGameModalSettings');

  // Settings Modal Elements
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingsGameSelect = document.getElementById('settingsGameSelect');
  const hobbyTableBody = document.getElementById('hobbyTableBody');
  const formAddHobby = document.getElementById('formAddHobby');
  const inputHobbyWord = document.getElementById('inputHobbyWord');
  const inputHobbyMeaning = document.getElementById('inputHobbyMeaning');
  const inputHobbyHint = document.getElementById('inputHobbyHint');
  const selectHobbyIcon = document.getElementById('selectHobbyIcon');
  const btnDownloadCSV = document.getElementById('btnDownloadCSV');
  const fileUploadCSV = document.getElementById('fileUploadCSV');
  const btnTriggerUploadCSV = document.getElementById('btnTriggerUploadCSV');
  const inputSheetUrl = document.getElementById('inputSheetUrl');
  const btnSyncSheet = document.getElementById('btnSyncSheet');
  const btnResetDefault = document.getElementById('btnResetDefault');

  // Coming Soon Modal
  const comingSoonModal = document.getElementById('comingSoonModal');
  const comingSoonTitle = document.getElementById('comingSoonTitle');
  const comingSoonDesc = document.getElementById('comingSoonDesc');
  const btnCloseComingSoon = document.getElementById('btnCloseComingSoon');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  const GAMES_INFO = {
    platformer: {
      name: 'Super Duel Hobbies',
      url: 'games/platformer.html',
      badge: 'Platformer Petualangan Mario'
    },
    tugofwar: {
      name: 'Duel Tarik Tambang Hobbies',
      url: 'games/tugofwar.html',
      badge: 'Adu Cepat Tarik Tambang'
    },
    match: {
      name: 'Hobby Match: Grade 3',
      url: 'games/match.html',
      badge: 'Sambung Garis & Buka Kartu'
    },
    wordsearch: {
      name: 'Word Search: Hobbies',
      url: 'games/wordsearch.html',
      badge: 'Teka-Teki Cari Kata 9x9'
    }
  };

  // 7 Emotikon 3D Animated (Karakter Timbul & Bergerak)
  const EMOTICONS = [
    {
      id: 'senyum',
      icon: '😊',
      animClass: 'anim-3d-senyum',
      label: 'SENYUM (Smiling)',
      tag: 'Senyum',
      speech: 'Senang sekali melihatmu tersenyum! Semangat terus ya belajarnya, anak hebat! 😊✨',
      border: 'border-amber-400 bg-amber-50/90 text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'senang',
      icon: '🤩',
      animClass: 'anim-3d-senang',
      label: 'SENANG BANGET (Excited)',
      tag: 'Senang',
      speech: 'Waaah luar biasa! Bunda ikut gembira melihat antusiasme dan keceriaanmu hari ini! 🌟',
      border: 'border-emerald-400 bg-emerald-50/90 text-emerald-900',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'semangat',
      icon: '💪',
      animClass: 'anim-3d-semangat',
      label: 'SEMANGAT (Energetic)',
      tag: 'Semangat',
      speech: 'Top markotop! Energi dan semangatmu membuat suasana kelas jadi sangat hidup! 🚀',
      border: 'border-orange-400 bg-orange-50/90 text-orange-900',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    {
      id: 'biasa',
      icon: '😐',
      animClass: 'anim-3d-biasa',
      label: 'BIASA SAJA (Just Okay)',
      tag: 'Biasa Saja',
      speech: 'Tidak apa-apa, besok kita coba lagi aktivitas yang lebih seru dan menarik ya! 👍',
      border: 'border-slate-300 bg-slate-50/90 text-slate-800',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
    },
    {
      id: 'sedih',
      icon: '😢',
      animClass: 'anim-3d-sedih',
      label: 'SEDIH (Sad)',
      tag: 'Sedih',
      speech: 'Jangan bersedih ya. Bunda Shaumi selalu ada untuk menemani dan membantumu. Peluk hangat! 🤗',
      border: 'border-sky-400 bg-sky-50/90 text-sky-900',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300'
    },
    {
      id: 'marah',
      icon: '😡',
      animClass: 'anim-3d-marah',
      label: 'KESAL / MARAH (Angry)',
      tag: 'Marah',
      speech: 'Tarik napas perlahan ya nak. Kalau ada materi yang sulit, ceritakan ke Bunda, nanti kita pelajari bersama. 🌸',
      border: 'border-rose-400 bg-rose-50/90 text-rose-900',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    {
      id: 'bingung',
      icon: '🤔',
      animClass: 'anim-3d-bingung',
      label: 'BINGUNG (Need Help)',
      tag: 'Perlu Bantuan',
      speech: 'Hebat sudah berani bilang bingung! Bagian mana yang sulit? Bunda jelaskan lagi sampai paham ya! 💡',
      border: 'border-purple-400 bg-purple-50/90 text-purple-900',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300'
    }
  ];

  /* =========================================================================
   * 1. TOAST NOTIFIKASI
   * ========================================================================= */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-400',
      error: 'bg-rose-600 text-white border-rose-400',
      warning: 'bg-amber-500 text-white border-amber-300',
      info: 'bg-indigo-600 text-white border-indigo-400'
    };
    toast.className = `px-5 py-3 rounded-2xl font-bold text-sm sm:text-base shadow-2xl border-2 flex items-center gap-2 transform transition-all duration-300 translate-y-[-10px] opacity-0 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  /* =========================================================================
   * 2. AUDIO FX SINTETIS (WEB AUDIO API)
   * ========================================================================= */
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playPopSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (_) {}
  }

  function playChimeSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + (idx * 0.07);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (_) {}
  }

  /* =========================================================================
   * 3. CANVAS KONFETI CERIA
   * ========================================================================= */
  function burstConfetti() {
    if (!feedbackConfettiCanvas) return;
    const canvas = feedbackConfettiCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 220;

    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
    const particles = [];
    const count = 40;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height / 2 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        gravity: 0.35,
        alpha: 1
      });
    }

    let animFrame = null;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.alpha -= 0.016;

        if (p.alpha > 0) {
          alive++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      });

      if (alive > 0) {
        animFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animFrame);
      }
    }
    render();
  }

  /* =========================================================================
   * 4. VIEW SWITCHER: GAMES / MODUL CANVA / UMPAN BALIK
   * ========================================================================= */
  function switchView(viewName) {
    currentView = viewName;

    if (viewGames) {
      if (viewName === 'games') {
        viewGames.classList.remove('hidden');
        viewGames.classList.add('block');
      } else {
        viewGames.classList.add('hidden');
        viewGames.classList.remove('block');
      }
    }

    if (viewModul) {
      if (viewName === 'modul') {
        viewModul.classList.remove('hidden');
        viewModul.classList.add('flex');
      } else {
        viewModul.classList.add('hidden');
        viewModul.classList.remove('flex');
      }
    }

    if (viewFeedback) {
      if (viewName === 'feedback') {
        viewFeedback.classList.remove('hidden');
        viewFeedback.classList.add('flex');
        initFeedbackTray();
        renderStudentBoard();
        updateFeedbackStats();
      } else {
        viewFeedback.classList.add('hidden');
        viewFeedback.classList.remove('flex');
      }
    }

    // Update styling indikator active di sidebar
    [navGames, navModul, navFeedback].forEach(btn => {
      if (btn) btn.classList.remove('nav-btn-active');
    });

    if (viewName === 'games' && navGames) navGames.classList.add('nav-btn-active');
    if (viewName === 'modul' && navModul) navModul.classList.add('nav-btn-active');
    if (viewName === 'feedback' && navFeedback) navFeedback.classList.add('nav-btn-active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* =========================================================================
   * 5. FULLSCREEN MODUL CANVA & TOMBOL KELUAR FLOATING TV
   * ========================================================================= */
  function toggleModulFullscreen() {
    const target = canvaEmbedWrapper || viewModul;
    if (!target) return;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      exitModulFullscreen();
    }
  }

  function exitModulFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  // Monitor status fullscreen browser secara global
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    if (btnFloatingExitFullscreen) {
      if (isFs && (document.fullscreenElement === canvaEmbedWrapper || canvaEmbedWrapper.contains(document.fullscreenElement))) {
        btnFloatingExitFullscreen.classList.remove('hidden');
        btnFloatingExitFullscreen.classList.add('flex');
      } else {
        btnFloatingExitFullscreen.classList.add('hidden');
        btnFloatingExitFullscreen.classList.remove('flex');
      }
    }
  });

  /* =========================================================================
   * 6. UMPAN BALIK KOLEKTIF BERGILIR: SISWA BERBARIS & 3D ANIMATED EMOTES
   * ========================================================================= */
  let touchStartEmoteId = null;

  function initFeedbackTray() {
    if (!emoteTray || emoteTray.children.length > 0) return;
    emoteTray.innerHTML = '';

    EMOTICONS.forEach(item => {
      const card = document.createElement('div');
      card.className = `btn-chunky p-3 sm:p-4 rounded-2xl border-3 ${item.border} flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing shadow-md hover:scale-105 transition-all select-none bg-white/90`;
      card.setAttribute('draggable', 'true');
      card.setAttribute('data-id', item.id);
      card.innerHTML = `
        <div class="emote-3d-bubble text-4xl sm:text-5xl mb-1 ${item.animClass} pointer-events-none">
          ${item.icon}
        </div>
        <div class="font-game font-bold text-xs sm:text-sm leading-tight pointer-events-none">
          ${item.tag}
        </div>
      `;

      // HTML5 Drag Events (Desktop)
      card.addEventListener('dragstart', (e) => {
        playPopSound();
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'copy';
        card.classList.add('opacity-50');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
      });

      // Touch Events (Mobile, Tablet, Smart TV)
      card.addEventListener('touchstart', () => {
        touchStartEmoteId = item.id;
        playPopSound();
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        if (!touchStartEmoteId) return;
        const touch = e.changedTouches ? e.changedTouches[0] : null;
        if (touch && feedbackDropZone) {
          const rect = feedbackDropZone.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            addStudentFeedback(touchStartEmoteId);
            touchStartEmoteId = null;
            return;
          }
        }
        // Fallback: Satu sentuhan jari langsung menambahkan pilihan
        addStudentFeedback(item.id);
        touchStartEmoteId = null;
      });

      // Click Fallback (Desktop satu-klik langsung masuk barisan)
      card.addEventListener('click', () => {
        addStudentFeedback(item.id);
      });

      emoteTray.appendChild(card);
    });

    setupDropZoneEvents();
  }

  function setupDropZoneEvents() {
    if (!feedbackDropZone || feedbackDropZone.dataset.setup === 'true') return;
    feedbackDropZone.dataset.setup = 'true';

    feedbackDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      feedbackDropZone.classList.add('border-purple-600', 'bg-purple-100', 'scale-[1.01]');
    });

    feedbackDropZone.addEventListener('dragleave', () => {
      feedbackDropZone.classList.remove('border-purple-600', 'bg-purple-100', 'scale-[1.01]');
    });

    feedbackDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      feedbackDropZone.classList.remove('border-purple-600', 'bg-purple-100', 'scale-[1.01]');
      const emoteId = e.dataTransfer.getData('text/plain');
      if (emoteId) {
        addStudentFeedback(emoteId);
      }
    });
  }

  // Siswa menambahkan perasaan satu per satu dan berbaris di papan
  function addStudentFeedback(emoteId) {
    const found = EMOTICONS.find(e => e.id === emoteId);
    if (!found) return;

    playChimeSound();
    burstConfetti();

    const studentOrder = studentSessionList.length + 1;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    studentSessionList.push({
      order: studentOrder,
      id: found.id,
      icon: found.icon,
      animClass: found.animClass,
      tag: found.tag,
      border: found.border,
      time: nowTime
    });

    // Simpan sesi aktif ke localStorage
    try {
      localStorage.setItem('bunda_shaumi_session_emotes', JSON.stringify(studentSessionList));
      
      // Simpan juga ke log riwayat guru
      const history = JSON.parse(localStorage.getItem('bunda_shaumi_feedback_history') || '[]');
      history.push({
        id: found.id,
        tag: found.tag,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('bunda_shaumi_feedback_history', JSON.stringify(history));
    } catch (_) {}

    renderStudentBoard();

    if (feedbackMentorSpeech) {
      feedbackMentorSpeech.textContent = `"Hebat! Siswa #${studentOrder} memilih ${found.tag}! ${found.speech}"`;
    }

    showToast(`✨ Siswa #${studentOrder} berhasil menyampaikan: ${found.tag}!`, 'success');
  }

  function renderStudentBoard() {
    if (!studentEmoteBoard || !dropZonePlaceholder) return;

    if (studentSessionList.length === 0) {
      dropZonePlaceholder.classList.remove('hidden');
      dropZonePlaceholder.classList.add('flex');
      studentEmoteBoard.classList.add('hidden');
      studentEmoteBoard.classList.remove('grid');
      if (badgeLiveCount) badgeLiveCount.textContent = '0 Siswa Sudah Memilih';
      renderTallyBar();
      return;
    }

    dropZonePlaceholder.classList.add('hidden');
    dropZonePlaceholder.classList.remove('flex');
    studentEmoteBoard.classList.remove('hidden');
    studentEmoteBoard.classList.add('grid');
    studentEmoteBoard.innerHTML = '';

    studentSessionList.forEach((st, idx) => {
      const card = document.createElement('div');
      card.className = `emote-3d-card p-2 sm:p-2.5 rounded-2xl border-2 ${st.border} flex flex-col items-center justify-center text-center bg-white shadow-md anim-pop relative`;
      card.innerHTML = `
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 mb-1 leading-none">
          Siswa #${idx + 1}
        </span>
        <div class="emote-3d-bubble text-3xl sm:text-4xl my-0.5 ${st.animClass}">
          ${st.icon}
        </div>
        <div class="font-game font-bold text-[11px] sm:text-xs text-slate-800 leading-tight mt-0.5 truncate max-w-full">
          ${st.tag}
        </div>
      `;
      studentEmoteBoard.appendChild(card);
    });

    if (badgeLiveCount) {
      badgeLiveCount.textContent = `${studentSessionList.length} Siswa Sudah Memilih`;
    }

    renderTallyBar();
    updateFeedbackStats();
  }

  function renderTallyBar() {
    if (!boardTallyBar) return;
    if (studentSessionList.length === 0) {
      boardTallyBar.classList.add('hidden');
      boardTallyBar.innerHTML = '';
      return;
    }
    boardTallyBar.classList.remove('hidden');
    boardTallyBar.classList.add('flex');

    const counts = {};
    studentSessionList.forEach(s => {
      counts[s.id] = (counts[s.id] || 0) + 1;
    });

    let html = `<span class="text-purple-900 font-bold mr-1">Rekap Kelas:</span>`;
    EMOTICONS.forEach(em => {
      const c = counts[em.id] || 0;
      if (c > 0) {
        html += `
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-purple-200 shadow-xs font-game text-[11px] sm:text-xs text-slate-800">
            <span>${em.icon}</span> <span>${em.tag}: <strong>${c}</strong></span>
          </span>
        `;
      }
    });
    boardTallyBar.innerHTML = html;
  }

  // Tombol Mulai Sesi Baru untuk Guru
  function resetBoardSession() {
    if (studentSessionList.length === 0) {
      showToast('Papan perasaan masih kosong.', 'info');
      return;
    }
    if (confirm('Mulai sesi baru dan bersihkan emotikon di papan untuk kelas berikutnya?')) {
      studentSessionList = [];
      localStorage.removeItem('bunda_shaumi_session_emotes');
      renderStudentBoard();
      if (feedbackMentorSpeech) {
        feedbackMentorSpeech.textContent = '"Papan sudah bersih untuk sesi baru! Ayo anak-anak hebat, maju bergantian sampaikan perasaanmu! ✨"';
      }
      showToast('Papan perasaan berhasil dibersihkan untuk sesi baru!', 'info');
    }
  }

  function updateFeedbackStats() {
    try {
      const history = JSON.parse(localStorage.getItem('bunda_shaumi_feedback_history') || '[]');
      if (feedbackCountTotal) {
        feedbackCountTotal.textContent = history.length;
      }
    } catch (_) {}
  }

  function clearFeedbackStats() {
    if (confirm('Hapus seluruh catatan riwayat umpan balik siswa secara permanen?')) {
      localStorage.removeItem('bunda_shaumi_feedback_history');
      localStorage.removeItem('bunda_shaumi_session_emotes');
      studentSessionList = [];
      renderStudentBoard();
      updateFeedbackStats();
      showToast('Catatan riwayat respon berhasil dibersihkan!', 'info');
    }
  }

  /* =========================================================================
   * 7. GAME LAUNCHER & FULLSCREEN (SPA MODAL)
   * ========================================================================= */
  function openGame(gameKey) {
    const info = GAMES_INFO[gameKey];
    if (!info) return;

    currentGameKey = gameKey;
    gameModalTitle.textContent = info.name;
    gameIframe.src = info.url;
    gameModal.classList.remove('hidden');
    gameModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeGame() {
    gameModal.classList.add('hidden');
    gameModal.classList.remove('flex');
    gameIframe.src = 'about:blank';
    document.body.style.overflow = '';
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleFullscreen() {
    const target = gameModal || document.documentElement;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  /* =========================================================================
   * 8. COMING SOON MODAL
   * ========================================================================= */
  function showComingSoon(featureName, message) {
    comingSoonTitle.textContent = `${featureName} - Coming Soon!`;
    comingSoonDesc.textContent = message || `Menu ${featureName} sedang disiapkan dengan penuh kasih oleh Bunda Shaumi untuk anak-anak hebat! Segera hadir ya! ✨`;
    comingSoonModal.classList.remove('hidden');
    comingSoonModal.classList.add('flex');
  }

  function closeComingSoon() {
    comingSoonModal.classList.add('hidden');
    comingSoonModal.classList.remove('flex');
  }

  /* =========================================================================
   * 9. SETTINGS BANK SOAL (CRUD, CSV, SPREADSHEET)
   * ========================================================================= */
  function openSettings(gameKey = 'all') {
    currentGameKey = gameKey;
    if (settingsGameSelect) {
      settingsGameSelect.value = gameKey;
    }
    if (inputSheetUrl) {
      inputSheetUrl.value = window.HobbyDataManager.getSavedSheetUrl();
    }
    renderSettingsTable();
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
    settingsModal.classList.remove('flex');
  }

  function renderSettingsTable() {
    if (!hobbyTableBody) return;
    const currentTarget = settingsGameSelect ? settingsGameSelect.value : 'all';
    const hobbies = window.HobbyDataManager.getHobbies(currentTarget);
    hobbyTableBody.innerHTML = '';

    if (hobbies.length === 0) {
      hobbyTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 font-bold">Belum ada soal. Silakan tambah atau reset ke bawaan!</td></tr>`;
      return;
    }

    hobbies.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-3 text-center font-bold text-slate-500">${index + 1}</td>
        <td class="py-2.5 px-3">
          <div class="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 p-1 flex items-center justify-center">
            ${item.svg || '🎨'}
          </div>
        </td>
        <td class="py-2.5 px-3">
          <div class="font-bold text-indigo-700 text-sm sm:text-base">${item.word}</div>
          <div class="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">${item.hint || '-'}</div>
        </td>
        <td class="py-2.5 px-3 font-bold text-slate-700 text-sm sm:text-base">${item.meaning || '-'}</td>
        <td class="py-2.5 px-3 text-right">
          <button type="button" class="btn-delete-hobby px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs sm:text-sm font-bold cursor-pointer transition-colors" data-id="${item.id}">
            🗑️ Hapus
          </button>
        </td>
      `;

      tr.querySelector('.btn-delete-hobby').addEventListener('click', () => {
        deleteHobby(currentTarget, item.id);
      });

      hobbyTableBody.appendChild(tr);
    });
  }

  function deleteHobby(targetKey, hobbyId) {
    const list = window.HobbyDataManager.getHobbies(targetKey);
    if (list.length <= 4) {
      showToast('Minimal harus ada 4 soal aktif agar permainan berjalan lancar!', 'warning');
      return;
    }
    const filtered = list.filter(h => h.id !== hobbyId);
    window.HobbyDataManager.saveHobbies(targetKey, filtered);
    renderSettingsTable();
    showToast('Soal berhasil dihapus!', 'success');
  }

  function handleAddHobby(e) {
    e.preventDefault();
    const word = (inputHobbyWord.value || '').trim().toUpperCase();
    const meaning = (inputHobbyMeaning.value || '').trim();
    const hint = (inputHobbyHint.value || '').trim();
    const svgType = selectHobbyIcon.value || 'default';

    if (!word || word.length < 2) {
      showToast('Kata hobi bahasa Inggris minimal 2 huruf!', 'warning');
      return;
    }

    const targetKey = settingsGameSelect.value || 'all';
    const list = window.HobbyDataManager.getHobbies(targetKey);

    const newHobby = {
      id: word.toLowerCase().replace(/[^a-z0-9]/g, ''),
      word,
      meaning: meaning || word,
      hint: hint || `Aktivitas ${meaning || word}`,
      svgType
    };

    // Cek apakah sudah ada kata yang sama
    const existingIndex = list.findIndex(h => h.word === word);
    if (existingIndex >= 0) {
      list[existingIndex] = newHobby;
      showToast(`Soal "${word}" berhasil diperbarui!`, 'success');
    } else {
      list.push(newHobby);
      showToast(`Soal "${word}" berhasil ditambahkan!`, 'success');
    }

    window.HobbyDataManager.saveHobbies(targetKey, list);
    formAddHobby.reset();
    renderSettingsTable();
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = window.HobbyDataManager.parseCSV(text);
        const targetKey = settingsGameSelect.value || 'all';
        window.HobbyDataManager.saveHobbies(targetKey, parsed);
        renderSettingsTable();
        showToast(`Berhasil mengimpor ${parsed.length} soal dari file CSV!`, 'success');
      } catch (err) {
        showToast(err.message || 'Gagal membaca file CSV. Pastikan formatnya sesuai template!', 'error');
      }
      fileUploadCSV.value = '';
    };
    reader.onerror = () => {
      showToast('Gagal membuka file dari perangkat.', 'error');
      fileUploadCSV.value = '';
    };
    reader.readAsText(file);
  }

  async function handleSyncGoogleSheet() {
    const url = (inputSheetUrl.value || '').trim();
    if (!url) {
      showToast('Masukkan link Google Spreadsheet publik terlebih dahulu!', 'warning');
      return;
    }

    btnSyncSheet.disabled = true;
    btnSyncSheet.innerHTML = '<span>⏳</span><span>Menghubungkan...</span>';

    try {
      const data = await window.HobbyDataManager.fetchGoogleSheet(url);
      const targetKey = settingsGameSelect.value || 'all';
      window.HobbyDataManager.saveHobbies(targetKey, data);
      renderSettingsTable();
      showToast(`🎉 Sukses sinkronisasi! ${data.length} soal berhasil dimuat dari Google Spreadsheet!`, 'success');
    } catch (err) {
      showToast(err.message || 'Gagal sinkronisasi Google Spreadsheet.', 'error');
    } finally {
      btnSyncSheet.disabled = false;
      btnSyncSheet.innerHTML = '<span>🔗</span><span>Sinkronkan Sekarang</span>';
    }
  }

  function handleResetDefault() {
    if (confirm('Kembalikan bank soal ke 15 kosakata bawaan standar?')) {
      const targetKey = settingsGameSelect.value || 'all';
      window.HobbyDataManager.resetHobbies(targetKey);
      renderSettingsTable();
      showToast('Bank soal berhasil dikembalikan ke standar!', 'success');
    }
  }

  /* =========================================================================
   * 10. INISIALISASI EVENT LISTENERS
   * ========================================================================= */
  window.addEventListener('DOMContentLoaded', () => {
    // Tombol Play pada Game Cards
    document.querySelectorAll('.btn-play-game').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameKey = btn.dataset.game;
        openGame(gameKey);
      });
    });

    // Tombol Settings pada Game Cards
    document.querySelectorAll('.btn-open-settings').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameKey = btn.dataset.game || 'all';
        openSettings(gameKey);
      });
    });

    // Tombol Navigasi Sidebar - View Switcher
    if (navGames) {
      navGames.addEventListener('click', () => {
        switchView('games');
      });
    }

    if (navModul) {
      navModul.addEventListener('click', () => {
        switchView('modul');
      });
    }

    if (navFeedback) {
      navFeedback.addEventListener('click', () => {
        switchView('feedback');
      });
    }

    if (navRPP) {
      navRPP.addEventListener('click', () => {
        showComingSoon('RPP / Modul Ajar', 'Rencana Pelaksanaan Pembelajaran (RPP) Kurikulum Merdeka Bahasa Inggris sedang difinalisasi oleh Bunda Shaumi.');
      });
    }

    if (navAsesmen) {
      navAsesmen.addEventListener('click', () => {
        showComingSoon('Asesmen & Lembar Kerja', 'Lembar Asesmen Diagnostik, Formatif, dan Sumatif sedang disiapkan untuk menunjang kegiatan belajar siswa.');
      });
    }

    // Tombol Kembali dari Modul & Feedback ke Games
    if (btnBackToGamesFromModul) {
      btnBackToGamesFromModul.addEventListener('click', () => {
        switchView('games');
      });
    }

    if (btnBackToGamesFromFeedback) {
      btnBackToGamesFromFeedback.addEventListener('click', () => {
        switchView('games');
      });
    }

    // Tombol Fullscreen Modul Canva
    if (btnFullscreenModul) {
      btnFullscreenModul.addEventListener('click', toggleModulFullscreen);
    }

    // Tombol Melayang Keluar Layar Penuh (Floating Exit Fullscreen untuk TV / Proyektor)
    if (btnFloatingExitFullscreen) {
      btnFloatingExitFullscreen.addEventListener('click', exitModulFullscreen);
    }

    // Tombol Bersihkan Sesi Papan Perasaan untuk Guru
    if (btnResetBoard) {
      btnResetBoard.addEventListener('click', resetBoardSession);
    }

    if (btnClearFeedbackStats) {
      btnClearFeedbackStats.addEventListener('click', clearFeedbackStats);
    }

    // Modal Game Controls
    if (btnCloseGameModal) btnCloseGameModal.addEventListener('click', closeGame);
    if (btnFullscreenGame) btnFullscreenGame.addEventListener('click', toggleFullscreen);
    if (btnGameModalSettings) {
      btnGameModalSettings.addEventListener('click', () => {
        openSettings(currentGameKey);
      });
    }

    // Settings Modal Controls
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
    if (settingsGameSelect) settingsGameSelect.addEventListener('change', renderSettingsTable);
    if (formAddHobby) formAddHobby.addEventListener('submit', handleAddHobby);
    if (btnDownloadCSV) {
      btnDownloadCSV.addEventListener('click', () => {
        window.HobbyDataManager.downloadCSVTemplate();
        showToast('Template CSV berhasil diunduh. Silakan buka di Microsoft Excel atau Google Sheets!', 'success');
      });
    }
    if (btnTriggerUploadCSV) {
      btnTriggerUploadCSV.addEventListener('click', () => {
        if (fileUploadCSV) fileUploadCSV.click();
      });
    }
    if (fileUploadCSV) fileUploadCSV.addEventListener('change', handleCSVUpload);
    if (btnSyncSheet) btnSyncSheet.addEventListener('click', handleSyncGoogleSheet);
    if (btnResetDefault) btnResetDefault.addEventListener('click', handleResetDefault);

    // Coming Soon Modal Controls
    if (btnCloseComingSoon) btnCloseComingSoon.addEventListener('click', closeComingSoon);
  });
})();

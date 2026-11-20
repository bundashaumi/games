/**
 * MAIN APP CONTROLLER - LEARNING ENGLISH WITH BUNDA SHAUMI
 * Mengontrol navigasi sidebar, peluncur game (modal SPA + Fullscreen),
 * dan modal Settings Bank Soal (CRUD, CSV Template, CSV Upload, Google Sheets Sync).
 */

(() => {
  'use strict';

  // State aplikasi
  let currentGameKey = 'all';
  let activeGameIframe = null;

  // DOM Elements
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
   * 2. GAME LAUNCHER & FULLSCREEN
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
   * 3. COMING SOON MODAL
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
   * 4. SETTINGS BANK SOAL (CRUD, CSV, SPREADSHEET)
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
   * 5. INISIALISASI EVENT LISTENERS
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

    // Tombol Navigasi Sidebar
    const navGames = document.getElementById('navGames');
    const navModul = document.getElementById('navModul');
    const navRPP = document.getElementById('navRPP');
    const navAsesmen = document.getElementById('navAsesmen');

    if (navGames) {
      navGames.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (navModul) {
      navModul.addEventListener('click', () => {
        showComingSoon('Modul Pembelajaran', 'Modul Ajar Bahasa Inggris Kelas 3 SD bertema Hobbies sedang dipersiapkan oleh Bunda Shaumi.');
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

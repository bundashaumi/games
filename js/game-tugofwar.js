/**
 * GAME 2: DUEL TARIK TAMBANG (TUG OF WAR)
 * Terintegrasi dengan HobbyDataManager, Fullscreen, & Karakter Bunda Shaumi
 */

(() => {
    'use strict';

    let HOBBY_BANK = window.HobbyDataManager ? window.HobbyDataManager.getHobbies('tugofwar') : window.DEFAULT_HOBBY_BANK;

    window.addEventListener('hobby-data-updated', (e) => {
        if (e.detail.gameKey === 'tugofwar' || e.detail.gameKey === 'all') {
            HOBBY_BANK = window.HobbyDataManager.getHobbies('tugofwar');
        }
    });

    const WIN_STEPS = 4;
    const SOLO_DURATION = 60;

    let gameMode = 'duel';
    let soundEnabled = true;
    let isPlaying = false;
    let questionLocked = false;
    let currentHobby = null;
    let lastHobbyId = null;

    let ropePos = 0;
    let p1Pulls = 0;
    let p2Pulls = 0;
    let p1Frozen = false;
    let p2Frozen = false;
    let p1FreezeTimer = null;
    let p2FreezeTimer = null;

    let soloTimeLeft = SOLO_DURATION;
    let soloTimerInterval = null;
    let soloScore = 0;
    let soloStreak = 0;
    let soloMaxStreak = 0;
    let soloCorrectCount = 0;

    let countdownTimer = null;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) audioCtx = new AudioCtx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, duration, type = 'sine', volume = 0.16, delay = 0) {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;
            const now = audioCtx.currentTime + delay;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        } catch (_) {}
    }

    function playBeep(high = false) {
        playTone(high ? 880 : 440, high ? 0.25 : 0.12, 'triangle', 0.18);
    }

    function playPullSound(isPlayer1) {
        const base = isPlayer1 ? 523.25 : 587.33;
        playTone(base, 0.1, 'triangle', 0.18, 0);
        playTone(base * 1.25, 0.12, 'triangle', 0.18, 0.06);
        playTone(base * 1.5, 0.2, 'sine', 0.2, 0.12);
    }

    function playWrongSound() {
        playTone(230, 0.12, 'sawtooth', 0.09, 0);
        playTone(180, 0.16, 'sawtooth', 0.09, 0.08);
    }

    function playVictoryFanfare() {
        const notes = [
            { f: 523.25, t: 0.00, d: 0.13 },
            { f: 659.25, t: 0.11, d: 0.13 },
            { f: 783.99, t: 0.22, d: 0.13 },
            { f: 1046.5, t: 0.35, d: 0.28 },
            { f: 783.99, t: 0.52, d: 0.13 },
            { f: 1046.5, t: 0.65, d: 0.42 }
        ];
        notes.forEach(n => playTone(n.f, n.d, 'triangle', 0.2, n.t));
    }

    function speakWord(word) {
        if (!soundEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(word.toLowerCase());
            utter.lang = 'en-US';
            utter.rate = 0.92;
            utter.pitch = 1.05;
            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utter.voice = enVoice;
            window.speechSynthesis.speak(utter);
        } catch (_) {}
    }

    window.toggleSound = function() {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('sound-icon');
        const btn = document.getElementById('btn-sound');
        if (soundEnabled) {
            icon.textContent = '🔊';
            btn.classList.remove('bg-slate-200', 'border-slate-300', 'text-slate-500');
            btn.classList.add('bg-sky-100', 'border-sky-300', 'text-sky-800');
            playBeep(false);
        } else {
            icon.textContent = '🔇';
            btn.classList.remove('bg-sky-100', 'border-sky-300', 'text-sky-800');
            btn.classList.add('bg-slate-200', 'border-slate-300', 'text-slate-500');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    };

    window.toggleFullscreen = function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    function shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function showToast(text, bgClass = 'bg-indigo-600 text-white') {
        const container = document.getElementById('toast-container');
        container.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `toast-animate px-5 py-2 rounded-2xl font-display font-bold text-sm sm:text-lg shadow-xl border-2 border-white/70 whitespace-nowrap ${bgClass}`;
        toast.textContent = text;
        container.appendChild(toast);
    }

    function updateModeUI() {
        const tabDuel = document.getElementById('tab-duel');
        const tabSolo = document.getElementById('tab-solo');
        const duelArena = document.getElementById('duel-arena');
        const soloArena = document.getElementById('solo-arena');
        const subtitle = document.getElementById('header-subtitle');

        if (gameMode === 'duel') {
            tabDuel.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-xl font-display font-bold text-sm sm:text-base cursor-pointer bg-indigo-500 text-white shadow-sm';
            tabSolo.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-xl font-display font-bold text-sm sm:text-base cursor-pointer text-slate-600 hover:bg-slate-200';
            duelArena.classList.remove('hidden');
            duelArena.classList.add('flex');
            soloArena.classList.add('hidden');
            soloArena.classList.remove('flex');
            subtitle.textContent = 'Mode TV Touchscreen • 2 Pemain Adu Cepat!';
        } else {
            tabSolo.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-xl font-display font-bold text-sm sm:text-base cursor-pointer bg-rose-500 text-white shadow-sm';
            tabDuel.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-xl font-display font-bold text-sm sm:text-base cursor-pointer text-slate-600 hover:bg-slate-200';
            soloArena.classList.remove('hidden');
            soloArena.classList.add('flex');
            duelArena.classList.add('hidden');
            duelArena.classList.remove('flex');
            subtitle.textContent = 'Mode HP / Solo • Jawab sebanyak-banyaknya dalam 60 detik!';
        }

        const rDuel = document.getElementById('ready-pick-duel');
        const rSolo = document.getElementById('ready-pick-solo');
        const rTitle = document.getElementById('ready-title');
        const rDesc = document.getElementById('ready-desc');

        if (gameMode === 'duel') {
            rDuel.className = 'btn-bubbly py-2.5 px-3 rounded-2xl font-display font-bold text-sm sm:text-base border-2 cursor-pointer bg-indigo-500 text-white border-indigo-700 shadow-sm';
            rSolo.className = 'btn-bubbly py-2.5 px-3 rounded-2xl font-display font-bold text-sm sm:text-base border-2 cursor-pointer bg-slate-100 text-slate-600 border-slate-300';
            rTitle.textContent = 'Siap Duel Tarik Tambang?';
            rDesc.innerHTML = 'Pemain 1 di <b>Kiri (Biru)</b>, Pemain 2 di <b>Kanan (Merah)</b>. Siapa tercepat menjawab gambar hobi akan menarik tali tambang!';
        } else {
            rSolo.className = 'btn-bubbly py-2.5 px-3 rounded-2xl font-display font-bold text-sm sm:text-base border-2 cursor-pointer bg-rose-500 text-white border-rose-700 shadow-sm';
            rDuel.className = 'btn-bubbly py-2.5 px-3 rounded-2xl font-display font-bold text-sm sm:text-base border-2 cursor-pointer bg-slate-100 text-slate-600 border-slate-300';
            rTitle.textContent = 'Siap Tantangan 60 Detik?';
            rDesc.innerHTML = 'Tebak gambar hobi dalam <b>Bahasa Inggris</b> secepat mungkin bersama Bunda Shaumi!';
        }
    }

    window.switchGameMode = function(mode) {
        if (gameMode === mode && isPlaying) return;
        initAudio();
        playBeep(false);
        clearAllTimers();
        gameMode = mode;
        updateModeUI();
        window.openReadyScreen();
    };

    window.selectModeOnReady = function(mode) {
        initAudio();
        playBeep(false);
        gameMode = mode;
        updateModeUI();
    };

    function clearAllTimers() {
        if (soloTimerInterval) {
            clearInterval(soloTimerInterval);
            soloTimerInterval = null;
        }
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        if (p1FreezeTimer) clearTimeout(p1FreezeTimer);
        if (p2FreezeTimer) clearTimeout(p2FreezeTimer);
        p1Frozen = false;
        p2Frozen = false;
    }

    window.openReadyScreen = function() {
        clearAllTimers();
        stopConfetti();
        hideVictoryModal();
        isPlaying = false;

        const overlay = document.getElementById('ready-overlay');
        document.getElementById('ready-prompt').classList.remove('hidden');
        document.getElementById('countdown-display').classList.add('hidden');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');

        updateModeUI();
        resetVisualBoards();
    };

    function resetVisualBoards() {
        ropePos = 0;
        p1Pulls = 0;
        p2Pulls = 0;
        updateRopeVisual();
        document.getElementById('p1-score-text').textContent = '0 Tarikan';
        document.getElementById('p2-score-text').textContent = '0 Tarikan';
        setPlayerFreeze(1, false);
        setPlayerFreeze(2, false);

        soloTimeLeft = SOLO_DURATION;
        soloScore = 0;
        soloStreak = 0;
        soloMaxStreak = 0;
        soloCorrectCount = 0;
        updateSoloHUD();
    }

    window.beginCountdown = function() {
        initAudio();
        document.getElementById('ready-prompt').classList.add('hidden');
        document.getElementById('countdown-display').classList.remove('hidden');

        const numEl = document.getElementById('countdown-number');
        const subEl = document.getElementById('countdown-sub');

        let count = 3;
        const showStep = (text, colorClass, subText, isGo = false) => {
            numEl.className = `font-display font-bold text-7xl sm:text-8xl count-pop ${colorClass}`;
            numEl.textContent = text;
            void numEl.offsetWidth;
            subEl.textContent = subText;
            playBeep(isGo);
        };

        showStep('3', 'text-sky-500', 'Bersiap di posisimu...');

        countdownTimer = setInterval(() => {
            count--;
            if (count === 2) {
                showStep('2', 'text-amber-500', 'Fokus ke gambar hobi...');
            } else if (count === 1) {
                showStep('1', 'text-rose-500', 'Siap-siap sentuh layar!');
            } else if (count === 0) {
                showStep(gameMode === 'duel' ? 'TARIK!' : 'MULAI!', 'text-emerald-500', 'Ayo semangat!', true);
            } else {
                clearInterval(countdownTimer);
                countdownTimer = null;
                document.getElementById('ready-overlay').classList.add('hidden');
                document.getElementById('ready-overlay').classList.remove('flex');
                startMatch();
            }
        }, 680);
    };

    function startMatch() {
        resetVisualBoards();
        isPlaying = true;
        questionLocked = false;
        lastHobbyId = null;

        if (gameMode === 'duel') {
            loadNextDuelQuestion();
        } else {
            loadNextSoloQuestion();
            startSoloTimer();
        }
    }

    function generateQuestion() {
        const candidates = HOBBY_BANK.filter(h => h.id !== lastHobbyId);
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        lastHobbyId = target.id;

        const distractors = shuffle(HOBBY_BANK.filter(h => h.id !== target.id)).slice(0, 3);
        const options = [target, ...distractors];
        return { target, options };
    }

    function loadNextDuelQuestion() {
        if (!isPlaying) return;
        questionLocked = false;
        setPlayerFreeze(1, false);
        setPlayerFreeze(2, false);

        const { target, options } = generateQuestion();
        currentHobby = target;

        const svgBox = document.getElementById('duel-hobby-svg');
        svgBox.innerHTML = target.svg;
        svgBox.classList.remove('pop-anim');
        void svgBox.offsetWidth;
        svgBox.classList.add('pop-anim');

        const statusEl = document.getElementById('duel-question-status');
        statusEl.textContent = 'Siapa paling cepat? ⚡';
        statusEl.className = 'font-display font-bold text-lg sm:text-2xl text-slate-700 leading-tight';

        renderDuelButtons(1, shuffle(options));
        renderDuelButtons(2, shuffle(options));
    }

    function renderDuelButtons(playerNum, options) {
        const container = document.getElementById(playerNum === 1 ? 'p1-options' : 'p2-options');
        container.innerHTML = '';

        const colorStyle = playerNum === 1
            ? 'bg-white hover:bg-sky-50 text-sky-900 border-sky-300 border-b-sky-500'
            : 'bg-white hover:bg-rose-50 text-rose-900 border-rose-300 border-b-rose-500';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.hobbyId = opt.id;
            btn.className = `btn-bubbly min-h-[64px] sm:min-h-[78px] px-2 py-3 rounded-2xl border-2 border-b-[5px] shadow-md font-display font-bold text-lg sm:text-2xl tracking-wide flex items-center justify-center cursor-pointer ${colorStyle}`;
            btn.textContent = opt.word;

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                handleDuelAnswer(playerNum, opt, btn);
            });

            container.appendChild(btn);
        });
    }

    function setPlayerFreeze(playerNum, frozen) {
        const badge = document.getElementById(playerNum === 1 ? 'p1-cooldown-badge' : 'p2-cooldown-badge');
        const grid = document.getElementById(playerNum === 1 ? 'p1-options' : 'p2-options');

        if (playerNum === 1) p1Frozen = frozen;
        else p2Frozen = frozen;

        if (frozen) {
            grid.classList.add('frozen-panel');
            badge.classList.remove('hidden');
        } else {
            grid.classList.remove('frozen-panel');
            badge.classList.add('hidden');
        }
    }

    function handleDuelAnswer(playerNum, chosen, btnEl) {
        initAudio();
        if (!isPlaying || questionLocked) return;
        if ((playerNum === 1 && p1Frozen) || (playerNum === 2 && p2Frozen)) return;

        if (chosen.id === currentHobby.id) {
            questionLocked = true;
            btnEl.classList.remove('bg-white', 'text-sky-900', 'text-rose-900');
            btnEl.classList.add('bg-emerald-400', 'text-white', 'border-emerald-600', 'pop-anim');

            if (playerNum === 1) {
                ropePos = Math.max(-WIN_STEPS, ropePos - 1);
                p1Pulls++;
                document.getElementById('p1-score-text').textContent = `${p1Pulls} Tarikan`;
                triggerAvatarPull(1);
                showToast(`🔵 TIM BIRU TARIK! ${currentHobby.word}`, 'bg-sky-500 text-white');
            } else {
                ropePos = Math.min(WIN_STEPS, ropePos + 1);
                p2Pulls++;
                document.getElementById('p2-score-text').textContent = `${p2Pulls} Tarikan`;
                triggerAvatarPull(2);
                showToast(`🔴 TIM MERAH TARIK! ${currentHobby.word}`, 'bg-rose-500 text-white');
            }

            const statusEl = document.getElementById('duel-question-status');
            statusEl.textContent = `${currentHobby.word} (${currentHobby.meaning}) ✅`;
            statusEl.className = 'font-display font-bold text-lg sm:text-2xl text-emerald-600 leading-tight';

            updateRopeVisual();
            playPullSound(playerNum === 1);
            setTimeout(() => speakWord(currentHobby.word), 180);

            if (Math.abs(ropePos) >= WIN_STEPS) {
                isPlaying = false;
                setTimeout(() => showDuelVictory(ropePos < 0 ? 1 : 2), 750);
            } else {
                setTimeout(loadNextDuelQuestion, 1050);
            }
        } else {
            playWrongSound();
            btnEl.classList.remove('bg-white');
            btnEl.classList.add('bg-red-100', 'border-red-400', 'text-red-700', 'shake-anim');

            setPlayerFreeze(playerNum, true);
            if (playerNum === 1) {
                if (p1FreezeTimer) clearTimeout(p1FreezeTimer);
                p1FreezeTimer = setTimeout(() => setPlayerFreeze(1, false), 1200);
            } else {
                if (p2FreezeTimer) clearTimeout(p2FreezeTimer);
                p2FreezeTimer = setTimeout(() => setPlayerFreeze(2, false), 1200);
            }
        }
    }

    function updateRopeVisual() {
        const percentShift = (ropePos / WIN_STEPS) * 34;
        const ropeEl = document.getElementById('rope-assembly');
        ropeEl.style.transform = `translateX(${percentShift}%)`;
    }

    function triggerAvatarPull(playerNum) {
        const avatar = document.getElementById(playerNum === 1 ? 'p1-avatar' : 'p2-avatar');
        const cls = playerNum === 1 ? 'anim-pull-left' : 'anim-pull-right';
        avatar.classList.remove(cls);
        void avatar.offsetWidth;
        avatar.classList.add(cls);
    }

    function startSoloTimer() {
        updateSoloHUD();
        soloTimerInterval = setInterval(() => {
            soloTimeLeft--;
            updateSoloHUD();

            if (soloTimeLeft <= 5 && soloTimeLeft > 0) {
                playBeep(false);
            }
            if (soloTimeLeft <= 0) {
                clearInterval(soloTimerInterval);
                soloTimerInterval = null;
                isPlaying = false;
                showSoloVictory();
            }
        }, 1000);
    }

    function updateSoloHUD() {
        document.getElementById('solo-timer-text').textContent = `${soloTimeLeft} dtk`;
        document.getElementById('solo-streak-text').textContent = `x${soloStreak}`;
        document.getElementById('solo-score-text').textContent = `${soloScore}`;
        const pct = Math.max(0, (soloTimeLeft / SOLO_DURATION) * 100);
        document.getElementById('solo-timer-bar').style.width = `${pct}%`;
    }

    function loadNextSoloQuestion() {
        if (!isPlaying) return;
        questionLocked = false;

        const { target, options } = generateQuestion();
        currentHobby = target;

        const svgBox = document.getElementById('solo-hobby-svg');
        svgBox.innerHTML = target.svg;
        svgBox.classList.remove('pop-anim');
        void svgBox.offsetWidth;
        svgBox.classList.add('pop-anim');

        const fb = document.getElementById('solo-feedback-text');
        fb.textContent = 'Ketuk jawaban bahasa Inggris yang benar!';
        fb.className = 'font-display font-bold text-base sm:text-lg text-slate-500 h-7 flex items-center justify-center';

        const container = document.getElementById('solo-options');
        container.innerHTML = '';

        const btnPalettes = [
            'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 border-b-sky-500',
            'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-300 border-b-pink-500',
            'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 border-b-amber-500',
            'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 border-b-purple-500'
        ];

        shuffle(options).forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn-bubbly min-h-[72px] px-3 py-3 rounded-2xl border-2 border-b-[5px] shadow-md font-display font-bold text-xl tracking-wide flex items-center justify-center cursor-pointer ${btnPalettes[i % 4]}`;
            btn.textContent = opt.word;

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                handleSoloAnswer(opt, btn);
            });

            container.appendChild(btn);
        });
    }

    function handleSoloAnswer(chosen, btnEl) {
        initAudio();
        if (!isPlaying || questionLocked) return;

        if (chosen.id === currentHobby.id) {
            questionLocked = true;
            soloStreak++;
            soloMaxStreak = Math.max(soloMaxStreak, soloStreak);
            soloCorrectCount++;
            const bonus = soloStreak >= 3 ? 5 : 0;
            soloScore += 10 + bonus;

            btnEl.className = 'btn-bubbly min-h-[72px] px-3 py-3 rounded-2xl border-2 border-b-[5px] shadow-md font-display font-bold text-xl tracking-wide flex items-center justify-center bg-emerald-400 text-white border-emerald-600 pop-anim';

            const fb = document.getElementById('solo-feedback-text');
            fb.textContent = `✅ ${currentHobby.word} = ${currentHobby.meaning}! ${bonus ? '+15 🔥' : '+10 ⭐'}`;
            fb.className = 'font-display font-bold text-base sm:text-lg text-emerald-600 h-7 flex items-center justify-center';

            updateSoloHUD();
            playPullSound(true);
            speakWord(currentHobby.word);

            setTimeout(loadNextSoloQuestion, 750);
        } else {
            soloStreak = 0;
            updateSoloHUD();
            playWrongSound();
            btnEl.disabled = true;
            btnEl.classList.add('opacity-45', 'shake-anim', 'bg-red-100', 'border-red-400', 'text-red-700');
            const fb = document.getElementById('solo-feedback-text');
            fb.textContent = 'Coba pilihan yang lain ya! 💪';
            fb.className = 'font-display font-bold text-base sm:text-lg text-rose-500 h-7 flex items-center justify-center';
        }
    }

    function showDuelVictory(winnerNum) {
        playVictoryFanfare();
        startConfetti();

        const title = document.getElementById('victory-title');
        const sub = document.getElementById('victory-subtitle');
        const stats = document.getElementById('victory-stats');

        if (winnerNum === 1) {
            title.textContent = '🔵 TIM BIRU MENANG! 🎉';
            title.className = 'font-display text-2xl sm:text-3xl font-bold text-sky-600 mb-1';
        } else {
            title.textContent = '🔴 TIM MERAH MENANG! 🎉';
            title.className = 'font-display text-2xl sm:text-3xl font-bold text-rose-600 mb-1';
        }
        sub.textContent = 'Bunda Shaumi bangga melihat kekompakan kalian berdua!';

        stats.innerHTML = `
            <div class="text-center">
                <div class="text-xs font-bold text-sky-700">🔵 TIM BIRU</div>
                <div class="font-display font-bold text-2xl text-sky-600">${p1Pulls}</div>
                <div class="text-xs font-bold text-slate-400">Benar</div>
            </div>
            <div class="h-10 w-0.5 bg-sky-200"></div>
            <div class="text-center">
                <div class="text-xs font-bold text-rose-700">🔴 TIM MERAH</div>
                <div class="font-display font-bold text-2xl text-rose-600">${p2Pulls}</div>
                <div class="text-xs font-bold text-slate-400">Benar</div>
            </div>
        `;

        openVictoryModal();
    }

    function showSoloVictory() {
        playVictoryFanfare();
        startConfetti();

        const stars = soloScore >= 120 ? '⭐⭐⭐' : (soloScore >= 60 ? '⭐⭐☆' : '⭐☆☆');
        const title = document.getElementById('victory-title');
        title.textContent = `WAKTU HABIS! ${stars}`;
        title.className = 'font-display text-2xl sm:text-3xl font-bold text-indigo-700 mb-1';

        document.getElementById('victory-subtitle').textContent =
            `Hebat! Bunda Shaumi senang kamu berhasil menebak ${soloCorrectCount} hobi dalam 60 detik!`;

        document.getElementById('victory-stats').innerHTML = `
            <div class="text-center">
                <div class="text-xs font-bold text-emerald-700">⭐ SKOR</div>
                <div class="font-display font-bold text-2xl text-emerald-600">${soloScore}</div>
            </div>
            <div class="h-10 w-0.5 bg-sky-200"></div>
            <div class="text-center">
                <div class="text-xs font-bold text-amber-700">🔥 KOMBO MAX</div>
                <div class="font-display font-bold text-2xl text-amber-600">x${soloMaxStreak}</div>
            </div>
            <div class="h-10 w-0.5 bg-sky-200"></div>
            <div class="text-center">
                <div class="text-xs font-bold text-indigo-700">🏆 BENAR</div>
                <div class="font-display font-bold text-2xl text-indigo-600">${soloCorrectCount}</div>
            </div>
        `;

        openVictoryModal();
    }

    function openVictoryModal() {
        const modal = document.getElementById('victory-modal');
        const card = document.getElementById('victory-card');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        requestAnimationFrame(() => {
            card.classList.remove('scale-95', 'opacity-0');
            card.classList.add('scale-100', 'opacity-100');
        });
    }

    function hideVictoryModal() {
        const modal = document.getElementById('victory-modal');
        const card = document.getElementById('victory-card');
        card.classList.add('scale-95', 'opacity-0');
        card.classList.remove('scale-100', 'opacity-100');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    window.restartFromVictory = function() {
        playBeep(false);
        window.openReadyScreen();
    };

    window.switchModeFromVictory = function() {
        playBeep(false);
        gameMode = gameMode === 'duel' ? 'solo' : 'duel';
        window.openReadyScreen();
    };

    let confettiAnimId = null;
    let confettiParticles = [];

    function startConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.classList.remove('hidden');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#facc15', '#4ade80', '#38bdf8', '#f472b6', '#c084fc', '#fb923c', '#ef4444'];
        confettiParticles = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 12 + 6,
            h: Math.random() * 8 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 3.5,
            vy: Math.random() * 3.5 + 2.4,
            rot: Math.random() * 360,
            vrot: (Math.random() - 0.5) * 8
        }));

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confettiParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vrot;
                if (p.y > canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            confettiAnimId = requestAnimationFrame(animate);
        }

        if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
        animate();
    }

    function stopConfetti() {
        if (confettiAnimId) {
            cancelAnimationFrame(confettiAnimId);
            confettiAnimId = null;
        }
        document.getElementById('confetti-canvas').classList.add('hidden');
    }

    window.addEventListener('resize', () => {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas.classList.contains('hidden')) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });

    window.onload = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
        gameMode = window.innerWidth < 768 ? 'solo' : 'duel';
        window.openReadyScreen();
    };
})();

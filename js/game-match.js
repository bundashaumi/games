/**
 * GAME 3: HOBBY MATCH (SAMBUNG PASANGAN & BUKA KARTU)
 * Terintegrasi dengan HobbyDataManager, Fullscreen, & Karakter Bunda Shaumi
 */

(() => {
    'use strict';

    let HOBBY_BANK = window.HobbyDataManager ? window.HobbyDataManager.getHobbies('match') : window.DEFAULT_HOBBY_BANK;

    window.addEventListener('hobby-data-updated', (e) => {
        if (e.detail.gameKey === 'match' || e.detail.gameKey === 'all') {
            HOBBY_BANK = window.HobbyDataManager.getHobbies('match');
            hobbyQueue = [];
            window.startNewRound();
        }
    });

    const PAIR_THEMES = [
        { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900', stroke: '#eab308', dot: '#ca8a04' },
        { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900', stroke: '#10b981', dot: '#059669' },
        { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-900', stroke: '#0ea5e9', dot: '#0284c7' },
        { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900', stroke: '#ec4899', dot: '#db2777' },
        { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', stroke: '#a855f7', dot: '#9333ea' }
    ];

    let currentMode = 'connect';
    let soundEnabled = true;
    let hobbyQueue = [];
    let roundHobbies = [];
    let matchedIds = new Set();
    let pairColorMap = {};
    let mistakes = 0;
    let moves = 0;

    let selectedConnect = null;
    let matchedConnections = [];

    let memoryCards = [];
    let flippedCards = [];
    let memoryLocked = false;

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

    function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
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
            gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        } catch (_) {}
    }

    function playPopSound() { playTone(540, 0.07, 'sine', 0.12); }
    function playMatchChime() {
        playTone(523.25, 0.12, 'triangle', 0.18, 0.00);
        playTone(659.25, 0.12, 'triangle', 0.18, 0.07);
        playTone(783.99, 0.20, 'triangle', 0.20, 0.14);
        playTone(1046.5, 0.28, 'sine',     0.18, 0.21);
    }
    function playMismatchSound() {
        playTone(280, 0.12, 'sine', 0.13, 0.00);
        playTone(215, 0.18, 'sine', 0.13, 0.09);
    }
    function playVictoryFanfare() {
        const melody = [
            { f: 523.25, t: 0.00, d: 0.13 },
            { f: 659.25, t: 0.11, d: 0.13 },
            { f: 783.99, t: 0.22, d: 0.13 },
            { f: 1046.5, t: 0.35, d: 0.26 },
            { f: 783.99, t: 0.52, d: 0.13 },
            { f: 1046.5, t: 0.65, d: 0.42 }
        ];
        melody.forEach(n => playTone(n.f, n.d, 'triangle', 0.2, n.t));
    }

    function speakWord(word, speakerBtn = null) {
        if (!soundEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(word.toLowerCase());
            utter.lang = 'en-US';
            utter.rate = 0.88;
            utter.pitch = 1.05;

            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utter.voice = enVoice;

            window.speechSynthesis.speak(utter);

            if (speakerBtn) {
                speakerBtn.classList.remove('speaker-active');
                void speakerBtn.offsetWidth;
                speakerBtn.classList.add('speaker-active');
            }
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
            playPopSound();
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

    function pickNextFiveHobbies() {
        if (hobbyQueue.length < 5) {
            const remainingIds = new Set(hobbyQueue.map(h => h.id));
            const freshPool = shuffle(HOBBY_BANK.filter(h => !remainingIds.has(h.id)));
            hobbyQueue = [...hobbyQueue, ...freshPool];
        }
        return hobbyQueue.splice(0, 5);
    }

    function showToast(text, bgClass = 'bg-indigo-600 text-white') {
        const container = document.getElementById('toast-container');
        container.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `toast-animate px-5 py-2 rounded-2xl font-display font-bold text-sm sm:text-lg shadow-xl border-2 border-white/70 whitespace-nowrap ${bgClass}`;
        toast.textContent = text;
        container.appendChild(toast);
    }

    function updateHeaderUI() {
        const tabConnect = document.getElementById('tab-connect');
        const tabMemory = document.getElementById('tab-memory');
        const subtitle = document.getElementById('mode-subtitle');
        const movesPill = document.getElementById('moves-pill');

        if (currentMode === 'connect') {
            tabConnect.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-display font-bold text-sm sm:text-base transition-all cursor-pointer bg-indigo-500 text-white shadow-sm';
            tabMemory.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-display font-bold text-sm sm:text-base transition-all cursor-pointer text-slate-600 hover:bg-slate-200';
            subtitle.textContent = 'Ketuk gambar lalu ketuk nama hobinya!';
            movesPill.classList.add('hidden');
            movesPill.classList.remove('flex');
        } else {
            tabMemory.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-display font-bold text-sm sm:text-base transition-all cursor-pointer bg-pink-500 text-white shadow-sm';
            tabConnect.className = 'btn-bubbly flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-display font-bold text-sm sm:text-base transition-all cursor-pointer text-slate-600 hover:bg-slate-200';
            subtitle.textContent = 'Buka 2 kartu bernomor untuk mencari pasangan!';
            movesPill.classList.remove('hidden');
            movesPill.classList.add('flex');
        }

        document.getElementById('progress-badge').textContent = `${matchedIds.size} / 5`;
        document.getElementById('moves-badge').textContent = `${moves}`;
    }

    window.switchMode = function(mode) {
        if (currentMode === mode) return;
        playPopSound();
        currentMode = mode;
        window.startNewRound();
    };

    window.startNewRound = function() {
        stopConfetti();
        hideVictoryModal();

        roundHobbies = pickNextFiveHobbies();
        matchedIds.clear();
        pairColorMap = {};
        mistakes = 0;
        moves = 0;
        selectedConnect = null;
        matchedConnections = [];
        flippedCards = [];
        memoryLocked = false;

        updateHeaderUI();

        const connectBoard = document.getElementById('connect-board');
        const memoryBoard = document.getElementById('memory-board');

        if (currentMode === 'connect') {
            connectBoard.classList.remove('hidden');
            connectBoard.classList.add('flex');
            memoryBoard.classList.add('hidden');
            memoryBoard.classList.remove('flex');
            renderConnectMode();
        } else {
            memoryBoard.classList.remove('hidden');
            memoryBoard.classList.add('flex');
            connectBoard.classList.add('hidden');
            connectBoard.classList.remove('flex');
            renderMemoryMode();
        }
    };

    function renderConnectMode() {
        const picCol = document.getElementById('picture-column');
        const wordCol = document.getElementById('word-column');
        picCol.innerHTML = '';
        wordCol.innerHTML = '';
        document.getElementById('connect-svg').innerHTML = '';

        const shuffledPics = shuffle(roundHobbies);
        let shuffledWords = shuffle(roundHobbies);
        let tries = 0;
        while (shuffledWords.every((w, i) => w.id === shuffledPics[i].id) && tries < 10) {
            shuffledWords = shuffle(roundHobbies);
            tries++;
        }

        shuffledPics.forEach(hobby => {
            const card = document.createElement('button');
            card.type = 'button';
            card.id = `connect-pic-${hobby.id}`;
            card.dataset.id = hobby.id;
            card.dataset.type = 'picture';
            card.className = 'btn-bubbly relative h-[68px] sm:h-[74px] bg-white hover:bg-indigo-50/70 rounded-2xl border-[3px] border-indigo-200 shadow-md flex items-center justify-center p-1.5 sm:p-2 cursor-pointer transition-all';
            card.onclick = () => handleConnectTap('picture', hobby.id, card);

            card.innerHTML = `
                <div class="w-20 h-14 sm:w-24 sm:h-16 flex items-center justify-center pointer-events-none">
                    ${hobby.svg}
                </div>
                <span class="anchor-dot absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-300 border-[3px] border-white shadow-sm"></span>
            `;
            picCol.appendChild(card);
        });

        shuffledWords.forEach(hobby => {
            const card = document.createElement('div');
            card.id = `connect-word-${hobby.id}`;
            card.dataset.id = hobby.id;
            card.dataset.type = 'word';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.className = 'btn-bubbly relative h-[68px] sm:h-[74px] bg-white hover:bg-pink-50/70 rounded-2xl border-[3px] border-pink-200 shadow-md flex items-center justify-between gap-1.5 sm:gap-3 px-3.5 sm:px-5 cursor-pointer transition-all';
            card.onclick = () => handleConnectTap('word', hobby.id, card);

            card.innerHTML = `
                <span class="anchor-dot absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-pink-300 border-[3px] border-white shadow-sm"></span>
                <span class="font-display font-bold text-base sm:text-xl lg:text-2xl tracking-wide text-slate-800 truncate">
                    ${hobby.word}
                </span>
                <button type="button" aria-label="Dengar pelafalan ${hobby.word}"
                    class="speaker-btn shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-100 hover:bg-sky-200 border-2 border-sky-300 flex items-center justify-center text-base sm:text-lg shadow-sm cursor-pointer"
                    title="Dengarkan pelafalan">
                    🔊
                </button>
            `;

            const spkBtn = card.querySelector('.speaker-btn');
            spkBtn.onclick = (e) => {
                e.stopPropagation();
                initAudio();
                speakWord(hobby.word, spkBtn);
            };

            wordCol.appendChild(card);
        });
    }

    function clearConnectHint() {
        document.querySelectorAll('.hint-glow').forEach(el => el.classList.remove('hint-glow'));
    }

    function handleConnectTap(type, id, el) {
        initAudio();
        if (matchedIds.has(id)) {
            const hobby = roundHobbies.find(h => h.id === id);
            if (hobby) speakWord(hobby.word);
            return;
        }

        clearConnectHint();

        if (!selectedConnect) {
            playPopSound();
            selectedConnect = { type, id, el };
            el.classList.add('card-selected');
            if (type === 'word') {
                const hobby = roundHobbies.find(h => h.id === id);
                if (hobby) speakWord(hobby.word);
            }
            return;
        }

        if (selectedConnect.el === el) {
            playPopSound();
            el.classList.remove('card-selected');
            selectedConnect = null;
            return;
        }

        if (selectedConnect.type === type) {
            playPopSound();
            selectedConnect.el.classList.remove('card-selected');
            selectedConnect = { type, id, el };
            el.classList.add('card-selected');
            if (type === 'word') {
                const hobby = roundHobbies.find(h => h.id === id);
                if (hobby) speakWord(hobby.word);
            }
            return;
        }

        const first = selectedConnect;
        first.el.classList.remove('card-selected');
        selectedConnect = null;

        if (first.id === id) {
            const colorIdx = matchedIds.size % PAIR_THEMES.length;
            matchedIds.add(id);
            pairColorMap[id] = colorIdx;
            matchedConnections.push({ id, colorIdx });

            const theme = PAIR_THEMES[colorIdx];
            const picCard = document.getElementById(`connect-pic-${id}`);
            const wordCard = document.getElementById(`connect-word-${id}`);

            [picCard, wordCard].forEach(card => {
                card.classList.remove('bg-white', 'border-indigo-200', 'border-pink-200', 'hover:bg-indigo-50/70', 'hover:bg-pink-50/70');
                card.classList.add(theme.bg, theme.border, 'match-pop');
                const dot = card.querySelector('.anchor-dot');
                if (dot) dot.style.backgroundColor = theme.dot;
            });

            const hobby = roundHobbies.find(h => h.id === id);
            drawAllConnectLines(id);
            updateHeaderUI();

            playMatchChime();
            if (hobby) {
                setTimeout(() => speakWord(hobby.word), 200);
                showToast(`✅ ${hobby.word} = ${hobby.meaning}!`, 'bg-emerald-500 text-white');
            }

            if (matchedIds.size === roundHobbies.length) {
                setTimeout(showVictoryModal, 800);
            }
        } else {
            mistakes++;
            playMismatchSound();
            [first.el, el].forEach(card => {
                card.classList.remove('shake-card');
                void card.offsetWidth;
                card.classList.add('shake-card');
            });
        }
    }

    function drawAllConnectLines(animateId = null) {
        const svg = document.getElementById('connect-svg');
        const stage = document.getElementById('connect-stage');
        if (!svg || !stage || currentMode !== 'connect') return;

        const stageRect = stage.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
        svg.innerHTML = '';

        matchedConnections.forEach(({ id, colorIdx }) => {
            const picEl = document.getElementById(`connect-pic-${id}`);
            const wordEl = document.getElementById(`connect-word-${id}`);
            if (!picEl || !wordEl) return;

            const picRect = picEl.getBoundingClientRect();
            const wordRect = wordEl.getBoundingClientRect();

            const x1 = picRect.right - stageRect.left;
            const y1 = picRect.top + picRect.height / 2 - stageRect.top;
            const x2 = wordRect.left - stageRect.left;
            const y2 = wordRect.top + wordRect.height / 2 - stageRect.top;

            const cx = (x1 + x2) / 2;
            const pathData = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
            const theme = PAIR_THEMES[colorIdx];

            const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            outline.setAttribute('d', pathData);
            outline.setAttribute('fill', 'none');
            outline.setAttribute('stroke', '#ffffff');
            outline.setAttribute('stroke-width', '12');
            outline.setAttribute('stroke-linecap', 'round');
            svg.appendChild(outline);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', theme.stroke);
            path.setAttribute('stroke-width', '7');
            path.setAttribute('stroke-linecap', 'round');
            if (animateId === id) path.classList.add('line-draw');
            svg.appendChild(path);

            [ { x: x1, y: y1 }, { x: x2, y: y2 } ].forEach(pt => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pt.x);
                circle.setAttribute('cy', pt.y);
                circle.setAttribute('r', '7');
                circle.setAttribute('fill', theme.dot);
                circle.setAttribute('stroke', '#ffffff');
                circle.setAttribute('stroke-width', '3');
                svg.appendChild(circle);
            });
        });
    }

    function renderMemoryMode() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';

        const deck = [];
        roundHobbies.forEach(h => {
            deck.push({ uid: `pic-${h.id}`, id: h.id, kind: 'picture', hobby: h });
            deck.push({ uid: `word-${h.id}`, id: h.id, kind: 'word', hobby: h });
        });
        memoryCards = shuffle(deck);

        memoryCards.forEach((cardData, index) => {
            const number = index + 1;
            const scene = document.createElement('div');
            scene.className = 'memory-card-scene h-28 sm:h-36 lg:h-40 cursor-pointer';
            scene.onclick = () => handleMemoryTap(index);

            const inner = document.createElement('div');
            inner.id = `mem-inner-${index}`;
            inner.className = 'memory-card-inner';

            const back = document.createElement('div');
            back.id = `mem-back-${index}`;
            back.className = 'memory-card-face card-back-pattern border-4 border-white shadow-lg flex flex-col items-center justify-center p-2 transition-all hover:brightness-105';
            back.innerHTML = `
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/95 shadow-md flex items-center justify-center font-display font-bold text-2xl sm:text-4xl text-indigo-600 border-4 border-indigo-200">
                    ${number}
                </div>
                <span class="mt-1.5 text-[11px] sm:text-xs font-display font-bold text-white/90 tracking-wider uppercase">
                    Ketuk
                </span>
            `;

            const front = document.createElement('div');
            front.id = `mem-front-${index}`;
            front.className = 'memory-card-face memory-card-front bg-white border-4 border-sky-300 shadow-lg flex flex-col items-center justify-center p-2 sm:p-3';

            if (cardData.kind === 'picture') {
                front.innerHTML = `
                    <span class="absolute top-1.5 left-2.5 text-xs font-display font-bold text-slate-400">#${number}</span>
                    <div class="w-20 h-16 sm:w-24 sm:h-20 flex items-center justify-center p-1">
                        ${cardData.hobby.svg}
                    </div>
                `;
            } else {
                front.innerHTML = `
                    <span class="absolute top-1.5 left-2.5 text-xs font-display font-bold text-slate-400">#${number}</span>
                    <span class="text-2xl sm:text-3xl mb-1">🔤</span>
                    <div class="font-display font-bold text-base sm:text-xl lg:text-2xl text-indigo-800 text-center break-words leading-tight">
                        ${cardData.hobby.word}
                    </div>
                    <span class="mt-1 text-xs font-bold text-sky-500">🔊 English</span>
                `;
            }

            inner.appendChild(back);
            inner.appendChild(front);
            scene.appendChild(inner);
            grid.appendChild(scene);
        });
    }

    function handleMemoryTap(index) {
        initAudio();
        if (memoryLocked) return;

        const cardData = memoryCards[index];
        if (matchedIds.has(cardData.id)) {
            speakWord(cardData.hobby.word);
            return;
        }

        if (flippedCards.some(c => c.index === index)) return;

        clearConnectHint();

        const inner = document.getElementById(`mem-inner-${index}`);
        inner.classList.add('is-flipped');
        playPopSound();

        if (cardData.kind === 'word') {
            speakWord(cardData.hobby.word);
        }

        flippedCards.push({ index, cardData });

        if (flippedCards.length === 2) {
            moves++;
            updateHeaderUI();
            memoryLocked = true;

            const [first, second] = flippedCards;
            const isMatch = (first.cardData.id === second.cardData.id) && (first.cardData.kind !== second.cardData.kind);

            if (isMatch) {
                const colorIdx = matchedIds.size % PAIR_THEMES.length;
                matchedIds.add(first.cardData.id);
                pairColorMap[first.cardData.id] = colorIdx;
                const theme = PAIR_THEMES[colorIdx];

                setTimeout(() => {
                    [first.index, second.index].forEach(idx => {
                        const front = document.getElementById(`mem-front-${idx}`);
                        front.classList.remove('bg-white', 'border-sky-300');
                        front.classList.add(theme.bg, theme.border, 'match-pop');
                    });

                    playMatchChime();
                    speakWord(first.cardData.hobby.word);
                    showToast(`✨ ${first.cardData.hobby.word} = ${first.cardData.hobby.meaning}!`, 'bg-emerald-500 text-white');
                    updateHeaderUI();

                    flippedCards = [];
                    memoryLocked = false;

                    if (matchedIds.size === roundHobbies.length) {
                        setTimeout(showVictoryModal, 850);
                    }
                }, 260);
            } else {
                mistakes++;
                setTimeout(() => {
                    playMismatchSound();
                    [first.index, second.index].forEach(idx => {
                        const innerEl = document.getElementById(`mem-inner-${idx}`);
                        innerEl.classList.remove('is-flipped');
                    });
                    flippedCards = [];
                    memoryLocked = false;
                }, 1100);
            }
        }
    }

    window.triggerHint = function() {
        initAudio();
        const unfound = roundHobbies.filter(h => !matchedIds.has(h.id));
        if (unfound.length === 0) return;

        playPopSound();
        clearConnectHint();

        const target = unfound[0];
        speakWord(target.word);

        if (currentMode === 'connect') {
            const picCard = document.getElementById(`connect-pic-${target.id}`);
            const wordCard = document.getElementById(`connect-word-${target.id}`);
            if (picCard) picCard.classList.add('hint-glow');
            if (wordCard) wordCard.classList.add('hint-glow');
            showToast(`💡 Coba sambungkan kartu ${target.word} yang berkedip!`, 'bg-amber-400 text-amber-950');
        } else {
            const indices = [];
            memoryCards.forEach((c, idx) => {
                if (c.id === target.id) indices.push(idx);
            });
            indices.forEach(idx => {
                const back = document.getElementById(`mem-back-${idx}`);
                if (back) back.classList.add('hint-glow');
            });
            showToast(`💡 Coba buka kartu Nomor ${indices[0] + 1} dan Nomor ${indices[1] + 1}!`, 'bg-amber-400 text-amber-950');
        }
    };

    function calculateStars() {
        if (currentMode === 'connect') {
            if (mistakes <= 1) return 3;
            if (mistakes <= 4) return 2;
            return 1;
        } else {
            if (moves <= 8) return 3;
            if (moves <= 13) return 2;
            return 1;
        }
    }

    function showVictoryModal() {
        playVictoryFanfare();
        startConfetti();

        const starsCount = calculateStars();
        const starsEl = document.getElementById('victory-stars');
        starsEl.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const span = document.createElement('span');
            span.textContent = i <= starsCount ? '⭐' : '☆';
            span.className = i <= starsCount ? 'drop-shadow-md' : 'text-slate-300';
            starsEl.appendChild(span);
        }

        const subtitle = document.getElementById('victory-subtitle');
        subtitle.textContent = currentMode === 'connect'
            ? 'Bunda Shaumi kagum! Semua pasangan hobi berhasil kamu sambungkan!'
            : `Keren! Kamu menyelesaikan semua kartu dalam ${moves} langkah!`;

        const summaryList = document.getElementById('victory-summary-list');
        summaryList.innerHTML = '';
        roundHobbies.forEach(hobby => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'btn-bubbly flex items-center justify-between gap-2 bg-white hover:bg-sky-100 border-2 border-sky-200 rounded-xl p-2 shadow-sm cursor-pointer text-left';
            item.onclick = () => speakWord(hobby.word, item.querySelector('.sum-spk'));
            item.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <div class="w-10 h-9 shrink-0">${hobby.svg}</div>
                    <div class="min-w-0">
                        <div class="font-display font-bold text-sm text-indigo-800 truncate">${hobby.word}</div>
                        <div class="text-xs font-bold text-slate-500 truncate">${hobby.meaning}</div>
                    </div>
                </div>
                <span class="sum-spk text-base shrink-0">🔊</span>
            `;
            summaryList.appendChild(item);
        });

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

    window.nextRoundFromVictory = function() {
        playPopSound();
        window.startNewRound();
    };

    window.switchModeFromVictory = function() {
        playPopSound();
        currentMode = currentMode === 'connect' ? 'memory' : 'connect';
        window.startNewRound();
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
            vx: (Math.random() - 0.5) * 3.2,
            vy: Math.random() * 3.4 + 2.4,
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
        if (currentMode === 'connect') drawAllConnectLines();
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas.classList.contains('hidden')) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });

    window.addEventListener('scroll', () => {
        if (currentMode === 'connect' && matchedConnections.length > 0) {
            drawAllConnectLines();
        }
    }, { passive: true });

    window.onload = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
        window.startNewRound();
    };
})();

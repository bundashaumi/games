/**
 * GAME 4: WORD SEARCH: HOBBIES
 * Terintegrasi dengan HobbyDataManager, Fullscreen, & Karakter Bunda Shaumi
 */

(() => {
    'use strict';

    let allHobbies = window.HobbyDataManager ? window.HobbyDataManager.getHobbies('wordsearch') : window.DEFAULT_HOBBY_BANK;

    window.addEventListener('hobby-data-updated', (e) => {
        if (e.detail.gameKey === 'wordsearch' || e.detail.gameKey === 'all') {
            allHobbies = window.HobbyDataManager.getHobbies('wordsearch');
            window.startNewGame();
        }
    });

    const HIGHLIGHT_COLORS = [
        { stroke: '#facc15', cardBg: 'bg-yellow-100', cardBorder: 'border-yellow-400', text: 'text-yellow-900' },
        { stroke: '#4ade80', cardBg: 'bg-green-100',  cardBorder: 'border-green-400',  text: 'text-green-900' },
        { stroke: '#38bdf8', cardBg: 'bg-sky-100',    cardBorder: 'border-sky-400',    text: 'text-sky-900' },
        { stroke: '#f472b6', cardBg: 'bg-pink-100',   cardBorder: 'border-pink-400',   text: 'text-pink-900' },
        { stroke: '#c084fc', cardBg: 'bg-purple-100', cardBorder: 'border-purple-400', text: 'text-purple-900' },
        { stroke: '#fb923c', cardBg: 'bg-orange-100', cardBorder: 'border-orange-400', text: 'text-orange-900' }
    ];

    const GRID_SIZE = 9;
    const ALLOWED_DIRECTIONS = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 }
    ];

    let currentPack = 'pack1';
    let grid = [];
    let placedWords = [];
    let foundWords = new Set();
    let soundEnabled = true;

    let isDragging = false;
    let activePointerId = null;
    let dragStart = null;
    let dragCurrent = null;
    let hasMovedToAnotherCell = false;
    let tapStart = null;
    let hintCellCoords = null;

    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, duration, type = 'sine', volume = 0.16, startTimeOffset = 0) {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            if (!audioCtx) return;
            const now = audioCtx.currentTime + startTimeOffset;
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

    function playTapSound() { playTone(520, 0.07, 'sine', 0.1); }
    function playFoundSound() {
        playTone(523.25, 0.12, 'triangle', 0.18, 0);
        playTone(659.25, 0.12, 'triangle', 0.18, 0.08);
        playTone(783.99, 0.22, 'triangle', 0.2, 0.16);
        playTone(1046.5, 0.30, 'sine', 0.18, 0.24);
    }
    function playWrongSound() {
        playTone(260, 0.12, 'sine', 0.12, 0);
        playTone(210, 0.16, 'sine', 0.12, 0.09);
    }
    function playVictoryFanfare() {
        const notes = [
            { f: 523.25, t: 0.00, d: 0.14 },
            { f: 659.25, t: 0.12, d: 0.14 },
            { f: 783.99, t: 0.24, d: 0.14 },
            { f: 1046.5, t: 0.38, d: 0.28 },
            { f: 783.99, t: 0.56, d: 0.14 },
            { f: 1046.5, t: 0.70, d: 0.45 }
        ];
        notes.forEach(n => playTone(n.f, n.d, 'triangle', 0.2, n.t));
    }

    function speakEnglishWord(word, cardElement = null) {
        if (!soundEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            utterance.pitch = 1.05;

            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utterance.voice = enVoice;

            window.speechSynthesis.speak(utterance);

            if (cardElement) {
                const icon = cardElement.querySelector('.speaker-btn');
                if (icon) {
                    icon.classList.remove('speaking-icon');
                    void icon.offsetWidth;
                    icon.classList.add('speaking-icon');
                }
            }
        } catch (_) {}
    }

    window.toggleSound = function() {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('sound-icon');
        const label = document.getElementById('sound-label');
        const btn = document.getElementById('btn-sound');

        if (soundEnabled) {
            icon.textContent = '🔊';
            label.textContent = 'Suara';
            btn.classList.remove('bg-slate-200', 'border-slate-300', 'text-slate-600');
            btn.classList.add('bg-sky-100', 'border-sky-300', 'text-sky-800');
            playTapSound();
        } else {
            icon.textContent = '🔇';
            label.textContent = 'Mute';
            btn.classList.remove('bg-sky-100', 'border-sky-300', 'text-sky-800');
            btn.classList.add('bg-slate-200', 'border-slate-300', 'text-slate-600');
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

    function shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function getWordsForPack(packKey) {
        const source = allHobbies.length >= 6 ? allHobbies : window.DEFAULT_HOBBY_BANK;
        if (packKey === 'pack1') {
            return source.slice(0, 6);
        } else if (packKey === 'pack2') {
            return source.slice(6, 12).length >= 4 ? source.slice(6, 12) : source.slice(0, 6);
        } else {
            return shuffleArray(source).slice(0, 6);
        }
    }

    function generatePuzzle(wordItems) {
        const validWords = wordItems.filter(item => item.word.length <= GRID_SIZE);
        const sortedItems = [...validWords].sort((a, b) => b.word.length - a.word.length);

        for (let attempt = 0; attempt < 150; attempt++) {
            const tempGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
            const tempPlaced = [];
            let allSuccess = true;

            const dirOrderBase = shuffleArray([0, 1, 2, 0, 1, 2]);

            for (let idx = 0; idx < sortedItems.length; idx++) {
                const item = sortedItems[idx];
                const word = item.word.toUpperCase();
                let placed = false;

                const preferredDir = dirOrderBase[idx % dirOrderBase.length];
                const dirsToTry = [
                    ALLOWED_DIRECTIONS[preferredDir],
                    ...ALLOWED_DIRECTIONS.filter((_, i) => i !== preferredDir)
                ];

                for (const dir of dirsToTry) {
                    const candidates = [];
                    const maxRow = GRID_SIZE - 1 - dir.dr * (word.length - 1);
                    const maxCol = GRID_SIZE - 1 - dir.dc * (word.length - 1);

                    for (let r = 0; r <= maxRow; r++) {
                        for (let c = 0; c <= maxCol; c++) {
                            let canFit = true;
                            let overlaps = 0;

                            for (let k = 0; k < word.length; k++) {
                                const nr = r + dir.dr * k;
                                const nc = c + dir.dc * k;
                                const existing = tempGrid[nr][nc];
                                if (existing !== '' && existing !== word[k]) {
                                    canFit = false;
                                    break;
                                }
                                if (existing === word[k]) overlaps++;
                            }

                            if (canFit) candidates.push({ r, c, overlaps });
                        }
                    }

                    if (candidates.length > 0) {
                        const shuffled = shuffleArray(candidates);
                        const pick = shuffled[0];

                        const cells = [];
                        for (let k = 0; k < word.length; k++) {
                            const nr = pick.r + dir.dr * k;
                            const nc = pick.c + dir.dc * k;
                            tempGrid[nr][nc] = word[k];
                            cells.push({ r: nr, c: nc });
                        }

                        tempPlaced.push({
                            ...item,
                            word,
                            start: cells[0],
                            end: cells[cells.length - 1],
                            cells
                        });
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    allSuccess = false;
                    break;
                }
            }

            if (allSuccess) {
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        if (tempGrid[r][c] === '') {
                            tempGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
                        }
                    }
                }

                const finalPlaced = validWords.map((orig, index) => {
                    const match = tempPlaced.find(p => p.word === orig.word.toUpperCase());
                    return {
                        ...match,
                        colorIndex: index % HIGHLIGHT_COLORS.length
                    };
                });

                return { grid: tempGrid, placedWords: finalPlaced };
            }
        }
        return null;
    }

    function updatePackTabs() {
        ['pack1', 'pack2', 'mix'].forEach(key => {
            const btn = document.getElementById(`tab-${key}`);
            if (key === currentPack) {
                btn.className = 'btn-bubbly py-2 sm:py-2.5 px-2 rounded-2xl font-display font-bold text-sm sm:text-base border-b-4 transition-all cursor-pointer bg-indigo-500 text-white border-indigo-700 shadow-md';
            } else {
                btn.className = 'btn-bubbly py-2 sm:py-2.5 px-2 rounded-2xl font-display font-bold text-sm sm:text-base border-b-4 transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300';
            }
        });
    }

    function renderGrid() {
        const container = document.getElementById('letter-grid');
        container.innerHTML = '';

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.id = `cell-${r}-${c}`;
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.className = 'flex items-center justify-center font-display font-bold text-slate-800 select-none transition-transform duration-100 text-xl sm:text-2xl lg:text-3xl xl:text-4xl';
                cell.textContent = grid[r][c];
                container.appendChild(cell);
            }
        }

        document.getElementById('found-lines-group').innerHTML = '';
        hideActiveDragLine();
    }

    function renderWordList() {
        const listEl = document.getElementById('word-list');
        listEl.innerHTML = '';

        placedWords.forEach((item) => {
            const isFound = foundWords.has(item.word);
            const color = HIGHLIGHT_COLORS[item.colorIndex];

            const card = document.createElement('button');
            card.type = 'button';
            card.id = `word-card-${item.word}`;
            card.onclick = () => {
                playTapSound();
                speakEnglishWord(item.word, card);
            };

            if (isFound) {
                card.className = `btn-bubbly flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl border-2 ${color.cardBg} ${color.cardBorder} shadow-sm text-left cursor-pointer`;
            } else {
                card.className = 'btn-bubbly flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl border-2 bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 shadow-sm text-left cursor-pointer';
            }

            card.innerHTML = `
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div class="w-8 h-8 shrink-0 flex items-center justify-center">${item.svg || '🎨'}</div>
                    <div class="min-w-0">
                        <div class="font-display font-bold text-sm sm:text-base lg:text-lg tracking-wide truncate ${isFound ? color.text + ' line-through decoration-2' : 'text-slate-800'}">
                            ${item.word}
                        </div>
                        <div class="text-xs sm:text-sm font-bold truncate ${isFound ? color.text + ' opacity-90' : 'text-slate-400'}">
                            ${item.meaning}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    ${isFound ? '<span class="text-base sm:text-lg">✅</span>' : ''}
                    <span class="speaker-btn w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 flex items-center justify-center text-sm sm:text-base shadow-sm" title="Dengarkan pelafalan">
                        🔊
                    </span>
                </div>
            `;

            listEl.appendChild(card);
        });

        document.getElementById('progress-text').textContent = `${foundWords.size} / ${placedWords.length}`;
    }

    function addFoundLineSVG(wordItem) {
        const svgGroup = document.getElementById('found-lines-group');
        const color = HIGHLIGHT_COLORS[wordItem.colorIndex];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        const x1 = wordItem.start.c * 100 + 50;
        const y1 = wordItem.start.r * 100 + 50;
        const x2 = wordItem.end.c * 100 + 50;
        const y2 = wordItem.end.r * 100 + 50;

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color.stroke);
        line.setAttribute('stroke-opacity', '0.62');
        line.setAttribute('stroke-width', '76');
        line.setAttribute('stroke-linecap', 'round');

        svgGroup.appendChild(line);
    }

    function updateActiveDragLine(start, end) {
        const line = document.getElementById('active-drag-line');
        line.setAttribute('x1', start.c * 100 + 50);
        line.setAttribute('y1', start.r * 100 + 50);
        line.setAttribute('x2', end.c * 100 + 50);
        line.setAttribute('y2', end.r * 100 + 50);
        line.classList.remove('hidden');
    }

    function hideActiveDragLine() {
        const line = document.getElementById('active-drag-line');
        line.classList.add('hidden');
    }

    function clearTapHighlight() {
        if (tapStart) {
            const el = document.getElementById(`cell-${tapStart.r}-${tapStart.c}`);
            if (el) el.classList.remove('tap-start-cell');
            tapStart = null;
        }
    }

    function setTapHighlight(coords) {
        clearTapHighlight();
        tapStart = coords;
        const el = document.getElementById(`cell-${coords.r}-${coords.c}`);
        if (el) el.classList.add('tap-start-cell');
    }

    function clearHintHighlight() {
        if (hintCellCoords) {
            const el = document.getElementById(`cell-${hintCellCoords.r}-${hintCellCoords.c}`);
            if (el) el.classList.remove('hint-cell');
            hintCellCoords = null;
        }
    }

    function showToast(message, bgClass = 'bg-indigo-600 text-white') {
        const container = document.getElementById('toast-container');
        container.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `toast-animate px-5 py-2.5 rounded-2xl font-display font-bold text-base sm:text-lg shadow-xl border-2 border-white/60 whitespace-nowrap ${bgClass}`;
        toast.textContent = message;
        container.appendChild(toast);
    }

    function getCellFromClientXY(clientX, clientY) {
        const wrapper = document.getElementById('word-grid-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) {
            return null;
        }

        const c = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((relX / rect.width) * GRID_SIZE)));
        const r = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((relY / rect.height) * GRID_SIZE)));
        return { r, c };
    }

    function snapToStraightLine(start, current) {
        const dr = current.r - start.r;
        const dc = current.c - start.c;
        if (dr === 0 && dc === 0) return { ...start };

        const angle = Math.atan2(dr, dc);
        const octant = Math.round(angle / (Math.PI / 4));
        const dirMap = {
            0:  { dr: 0,  dc: 1 },
            1:  { dr: 1,  dc: 1 },
            2:  { dr: 1,  dc: 0 },
            3:  { dr: 1,  dc: -1 },
            4:  { dr: 0,  dc: -1 },
            '-4': { dr: 0, dc: -1 },
            '-3': { dr: -1, dc: -1 },
            '-2': { dr: -1, dc: 0 },
            '-1': { dr: -1, dc: 1 }
        };

        const dir = dirMap[octant] || { dr: 0, dc: 1 };
        const steps = Math.max(Math.abs(dr), Math.abs(dc));

        let maxValidSteps = steps;
        while (maxValidSteps > 0) {
            const nr = start.r + dir.dr * maxValidSteps;
            const nc = start.c + dir.dc * maxValidSteps;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                return { r: nr, c: nc };
            }
            maxValidSteps--;
        }
        return { ...start };
    }

    function isStraightLine(a, b) {
        const dr = Math.abs(b.r - a.r);
        const dc = Math.abs(b.c - a.c);
        return dr === 0 || dc === 0 || dr === dc;
    }

    function evaluateSelection(start, end) {
        if (start.r === end.r && start.c === end.c) return false;

        const matched = placedWords.find(item => {
            if (foundWords.has(item.word)) return false;
            const forward = (item.start.r === start.r && item.start.c === start.c && item.end.r === end.r && item.end.c === end.c);
            const backward = (item.start.r === end.r && item.start.c === end.c && item.end.r === start.r && item.end.c === start.c);
            return forward || backward;
        });

        if (matched) {
            handleWordFound(matched);
            return true;
        } else {
            playWrongSound();
            const wrapper = document.getElementById('word-grid-wrapper');
            wrapper.classList.remove('shake-board');
            void wrapper.offsetWidth;
            wrapper.classList.add('shake-board');
            return false;
        }
    }

    function handleWordFound(wordItem) {
        foundWords.add(wordItem.word);
        clearHintHighlight();
        clearTapHighlight();
        addFoundLineSVG(wordItem);
        renderWordList();

        const card = document.getElementById(`word-card-${wordItem.word}`);
        if (card) card.classList.add('word-found-pop');

        playFoundSound();
        setTimeout(() => speakEnglishWord(wordItem.word, card), 220);
        showToast(`✨ ${wordItem.word} = ${wordItem.meaning}!`, 'bg-emerald-500 text-white');

        if (foundWords.size === placedWords.length) {
            setTimeout(triggerVictory, 750);
        }
    }

    function setupGridPointerEvents() {
        const wrapper = document.getElementById('word-grid-wrapper');

        wrapper.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            initAudioContext();

            const cell = getCellFromClientXY(e.clientX, e.clientY);
            if (!cell) return;

            isDragging = true;
            activePointerId = e.pointerId;
            dragStart = cell;
            dragCurrent = cell;
            hasMovedToAnotherCell = false;

            try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
            updateActiveDragLine(dragStart, dragCurrent);
        });

        wrapper.addEventListener('pointermove', (e) => {
            if (!isDragging || e.pointerId !== activePointerId) return;
            e.preventDefault();

            const cell = getCellFromClientXY(e.clientX, e.clientY);
            if (!cell) return;

            const snapped = snapToStraightLine(dragStart, cell);
            if (snapped.r !== dragStart.r || snapped.c !== dragStart.c) {
                hasMovedToAnotherCell = true;
                clearTapHighlight();
            }

            if (snapped.r !== dragCurrent.r || snapped.c !== dragCurrent.c) {
                dragCurrent = snapped;
                updateActiveDragLine(dragStart, dragCurrent);
            }
        });

        const finishPointer = (e) => {
            if (!isDragging || e.pointerId !== activePointerId) return;
            e.preventDefault();

            isDragging = false;
            activePointerId = null;
            hideActiveDragLine();

            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}

            if (hasMovedToAnotherCell) {
                evaluateSelection(dragStart, dragCurrent);
            } else {
                handleTapCell(dragStart);
            }
        };

        wrapper.addEventListener('pointerup', finishPointer);
        wrapper.addEventListener('pointercancel', finishPointer);
    }

    function handleTapCell(cell) {
        if (!tapStart) {
            playTapSound();
            setTapHighlight(cell);
            return;
        }

        if (tapStart.r === cell.r && tapStart.c === cell.c) {
            playTapSound();
            clearTapHighlight();
            return;
        }

        if (isStraightLine(tapStart, cell)) {
            const startCopy = { ...tapStart };
            clearTapHighlight();
            evaluateSelection(startCopy, cell);
        } else {
            playTapSound();
            setTapHighlight(cell);
        }
    }

    window.useHint = function() {
        const unfound = placedWords.filter(w => !foundWords.has(w.word));
        if (unfound.length === 0) return;

        playTapSound();
        clearHintHighlight();

        const target = unfound[0];
        hintCellCoords = { ...target.start };

        const cellEl = document.getElementById(`cell-${target.start.r}-${target.start.c}`);
        if (cellEl) cellEl.classList.add('hint-cell');

        showToast(`💡 Cari kata ${target.word} mulai dari huruf yang berkedip!`, 'bg-amber-400 text-amber-950');
        speakEnglishWord(target.word);
    };

    window.selectPack = function(packKey) {
        playTapSound();
        currentPack = packKey;
        window.startNewGame();
    };

    window.startNewGame = function() {
        foundWords.clear();
        clearTapHighlight();
        clearHintHighlight();
        stopConfetti();
        hideVictoryModal();

        const words = getWordsForPack(currentPack);
        const result = generatePuzzle(words);

        if (result) {
            grid = result.grid;
            placedWords = result.placedWords;
            updatePackTabs();
            renderGrid();
            renderWordList();
        }
    };

    function triggerVictory() {
        playVictoryFanfare();
        startConfetti();

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

    window.closeVictoryAndRestart = function() {
        playTapSound();
        window.startNewGame();
    };

    window.closeVictoryAndNextPack = function() {
        playTapSound();
        const order = ['pack1', 'pack2', 'mix'];
        const nextIndex = (order.indexOf(currentPack) + 1) % order.length;
        currentPack = order[nextIndex];
        window.startNewGame();
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
        confettiParticles = Array.from({ length: 130 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 12 + 6,
            h: Math.random() * 8 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 3.5,
            vy: Math.random() * 3.5 + 2.5,
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
        const canvas = document.getElementById('confetti-canvas');
        canvas.classList.add('hidden');
    }

    window.addEventListener('resize', () => {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas.classList.contains('hidden')) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });

    window.onload = () => {
        setupGridPointerEvents();
        window.startNewGame();
        if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    };
})();

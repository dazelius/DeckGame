// ==========================================
// 메모리 비주얼 시스템
// 게임플레이 영향 없이 비주얼 효과만 담당
// ==========================================

const MemoryVisual = {
    // 현재 메모리 레벨 (0-10)
    level: 0,
    
    // 실제 메모리 수치 (1000당 레벨 1)
    memoryAmount: 0,
    memoryPerLevel: 1000,
    
    // 효과 활성화 여부
    enabled: true,
    
    // DOM 요소들
    elements: {
        overlay: null,
        noise: null,
        vignette: null,
        hiddenTexts: [],
        shadows: []
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.createOverlay();
        this.injectStyles();
        this.startAmbientEffects();
        
        // 기존 메모리 로드 (ExtractionResult 연동)
        this.syncFromExtractionResult();
        
        console.log(`[MemoryVisual] 메모리 비주얼 시스템 초기화 (메모리: ${this.memoryAmount}, 레벨: ${this.level})`);
    },
    
    // ==========================================
    // 오버레이 생성
    // ==========================================
    createOverlay() {
        // 기존 오버레이 제거
        const existing = document.getElementById('memory-visual-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'memory-visual-overlay';
        overlay.innerHTML = `
            <div class="mv-vignette"></div>
            <div class="mv-noise"></div>
            <div class="mv-scanlines"></div>
            <div class="mv-glitch"></div>
            <div class="mv-whispers"></div>
        `;
        document.body.appendChild(overlay);
        
        this.elements.overlay = overlay;
        this.elements.noise = overlay.querySelector('.mv-noise');
        this.elements.vignette = overlay.querySelector('.mv-vignette');
    },
    
    // ==========================================
    // 메모리 레벨 설정
    // ==========================================
    setLevel(level) {
        const oldLevel = this.level;
        this.level = Math.max(0, Math.min(10, level));
        
        this.applyEffects();
        
        // BGM 크로스페이드 연동
        this.updateBGM(oldLevel, this.level);
        
        console.log(`[MemoryVisual] 메모리 레벨: ${this.level}`);
    },
    
    // BGM 메모리 효과 업데이트
    updateBGM(oldLevel, newLevel) {
        if (typeof BGMSystem === 'undefined') return;
        
        // BGM 메모리 효과 적용
        BGMSystem.setMemoryLevel(newLevel);
    },
    
    // ==========================================
    // 메모리 수치 관리 (1000당 레벨 1)
    // ExtractionResult 시스템과 연동
    // ==========================================
    
    // 메모리 추가 (ExtractionResult 연동)
    addMemory(amount) {
        // ExtractionResult 시스템 사용
        if (typeof ExtractionResult !== 'undefined' && ExtractionResult.addMemory) {
            ExtractionResult.addMemory(amount);
        } else {
            // fallback: localStorage 직접 사용
            const current = this.getMemory();
            localStorage.setItem('shadowDeck_memory', (current + amount).toString());
        }
        
        // 로컬 상태 업데이트
        this.syncFromExtractionResult();
        
        // TopBar 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.updateMemory();
        }
        
        console.log(`[MemoryVisual] 메모리 +${amount} (총: ${this.memoryAmount}, 레벨: ${this.level})`);
    },
    
    // 메모리 감소 (ExtractionResult 연동)
    removeMemory(amount) {
        if (typeof ExtractionResult !== 'undefined' && ExtractionResult.spendMemory) {
            ExtractionResult.spendMemory(amount);
        } else {
            const current = this.getMemory();
            localStorage.setItem('shadowDeck_memory', Math.max(0, current - amount).toString());
        }
        
        this.syncFromExtractionResult();
        
        if (typeof TopBar !== 'undefined') {
            TopBar.updateMemory();
        }
        
        console.log(`[MemoryVisual] 메모리 -${amount} (총: ${this.memoryAmount}, 레벨: ${this.level})`);
    },
    
    // 메모리 직접 설정
    setMemory(amount) {
        localStorage.setItem('shadowDeck_memory', Math.max(0, amount).toString());
        
        if (typeof gameState !== 'undefined') {
            gameState.memory = amount;
        }
        
        this.syncFromExtractionResult();
        
        if (typeof TopBar !== 'undefined') {
            TopBar.updateMemory();
        }
    },
    
    // ExtractionResult에서 메모리 동기화
    syncFromExtractionResult() {
        if (typeof ExtractionResult !== 'undefined' && ExtractionResult.getMemory) {
            this.memoryAmount = ExtractionResult.getMemory();
        } else {
            this.memoryAmount = parseInt(localStorage.getItem('shadowDeck_memory') || '0');
        }
        
        this.updateLevelFromMemory();
        
        if (typeof gameState !== 'undefined') {
            gameState.memory = this.memoryAmount;
            gameState.memoryLevel = this.level;
        }
    },
    
    // 메모리 수치로부터 레벨 계산
    updateLevelFromMemory() {
        const newLevel = Math.min(10, Math.floor(this.memoryAmount / this.memoryPerLevel));
        if (newLevel !== this.level) {
            this.setLevel(newLevel);
        }
    },
    
    // 현재 메모리 반환 (ExtractionResult 연동)
    getMemory() {
        if (typeof ExtractionResult !== 'undefined' && ExtractionResult.getMemory) {
            return ExtractionResult.getMemory();
        }
        return parseInt(localStorage.getItem('shadowDeck_memory') || '0');
    },
    
    // 다음 레벨까지 필요한 메모리
    getMemoryToNextLevel() {
        if (this.level >= 10) return 0;
        const nextLevelMemory = (this.level + 1) * this.memoryPerLevel;
        return nextLevelMemory - this.memoryAmount;
    },
    
    // ==========================================
    // 효과 적용
    // ==========================================
    applyEffects() {
        const overlay = this.elements.overlay;
        if (!overlay) return;
        
        // 모든 레벨 클래스 제거
        for (let i = 0; i <= 10; i++) {
            overlay.classList.remove(`mv-level-${i}`);
        }
        
        // 현재 레벨 클래스 추가
        overlay.classList.add(`mv-level-${this.level}`);
        
        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--memory-level', this.level);
        document.documentElement.style.setProperty('--memory-intensity', this.level / 10);
        
        // 플레이어 그로테스크 효과 적용
        this.applyPlayerEffects();
        
        // 레벨별 특수 효과
        if (this.level >= 3) {
            this.showRandomWhisper();
        }
        if (this.level >= 5) {
            this.addHiddenSymbols();
        }
        if (this.level >= 7) {
            this.triggerGlitch();
        }
    },
    
    // ==========================================
    // 플레이어 그로테스크 효과
    // ==========================================
    applyPlayerEffects() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        // 모든 플레이어 메모리 클래스 제거
        playerEl.classList.remove('mv-player-normal', 'mv-player-uneasy', 'mv-player-disturbed', 
                                   'mv-player-corrupted', 'mv-player-insane');
        
        // 기존 오버레이 제거
        const existingOverlay = playerEl.querySelector('.mv-player-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        if (this.level === 0) return;
        
        // 레벨별 클래스 적용
        if (this.level <= 2) {
            playerEl.classList.add('mv-player-normal');
        } else if (this.level <= 4) {
            playerEl.classList.add('mv-player-uneasy');
        } else if (this.level <= 6) {
            playerEl.classList.add('mv-player-disturbed');
            this.addPlayerOverlay(playerEl, 'disturbed');
        } else if (this.level <= 8) {
            playerEl.classList.add('mv-player-corrupted');
            this.addPlayerOverlay(playerEl, 'corrupted');
        } else {
            playerEl.classList.add('mv-player-insane');
            this.addPlayerOverlay(playerEl, 'insane');
        }
    },
    
    // 플레이어 오버레이 추가 (균열, 피, 아우라 등)
    addPlayerOverlay(playerEl, type) {
        const overlay = document.createElement('div');
        overlay.className = `mv-player-overlay mv-player-${type}-overlay`;
        
        // 타입별 내용
        if (type === 'disturbed') {
            overlay.innerHTML = `
                <div class="mv-player-shadow"></div>
                <div class="mv-player-eye-glow"></div>
            `;
        } else if (type === 'corrupted') {
            overlay.innerHTML = `
                <div class="mv-player-shadow intense"></div>
                <div class="mv-player-eye-glow intense"></div>
                <div class="mv-player-cracks"></div>
                <div class="mv-player-aura"></div>
            `;
        } else if (type === 'insane') {
            overlay.innerHTML = `
                <div class="mv-player-shadow extreme"></div>
                <div class="mv-player-eye-glow extreme bleeding"></div>
                <div class="mv-player-cracks severe"></div>
                <div class="mv-player-aura intense"></div>
                <div class="mv-player-blood-tears"></div>
                <div class="mv-player-distortion"></div>
            `;
        }
        
        playerEl.style.position = 'relative';
        playerEl.appendChild(overlay);
    },
    
    // 플레이어 경련 효과 (높은 레벨에서 간헐적)
    triggerPlayerSpasm() {
        const playerEl = document.getElementById('player');
        if (!playerEl || this.level < 6) return;
        
        playerEl.classList.add('mv-player-spasm');
        setTimeout(() => {
            playerEl.classList.remove('mv-player-spasm');
        }, 300);
    },
    
    // ==========================================
    // 속삭임 효과 (화면에 텍스트가 잠깐 나타남)
    // ==========================================
    whispers: [
        // 일반 (레벨 3-5)
        '기억해...',
        '잊지 마...',
        '...보고 있어',
        '뒤를 봐...',
        '누가 있어',
        '...들려?',
        // 불안 (레벨 5-7)
        '도망쳐',
        '...죽어가고 있어',
        '피가...',
        '눈을 떠',
        '숨을 수 없어',
        '이미 늦었어',
        // 공포 (레벨 7-9)  
        '네 안에 있어',
        '살...려...',
        '아파...',
        '왜 날 버렸어',
        '같이 가자',
        '...찢어져...',
        // 광기 (레벨 9-10)
        'IT HURTS',
        'DON\'T LOOK',
        '■■■■■',
        'HELP ME',
        '죽여줘...',
        '끝이 없어',
        '...아무것도...',
        '잊혀져가...'
    ],
    
    // 그로테스크 심볼 (텍스트 기반)
    grotesqueSymbols: ['◉', '●', '◎', '⊗', '⊙', '⦿', '☽', '†', '‡', '※'],
    
    lastWhisperIndex: -1,
    
    showRandomWhisper() {
        // 레벨에 따라 다른 범위의 텍스트 선택
        let maxIndex;
        if (this.level <= 5) maxIndex = 6;        // 일반
        else if (this.level <= 7) maxIndex = 12;  // 불안
        else if (this.level <= 9) maxIndex = 18;  // 공포
        else maxIndex = this.whispers.length;     // 광기
        
        // 같은 텍스트 연속 방지
        let index;
        do {
            index = Math.floor(Math.random() * maxIndex);
        } while (index === this.lastWhisperIndex && maxIndex > 1);
        this.lastWhisperIndex = index;
        
        const whisper = this.whispers[index];
        this.showWhisper(whisper);
        
        // 높은 레벨에서 추가 효과
        if (this.level >= 7 && Math.random() < 0.3) {
            this.showEyeEffect();
        }
        if (this.level >= 8 && Math.random() < 0.2) {
            this.showBloodDrip();
        }
    },
    
    showWhisper(text) {
        const whisperEl = document.createElement('div');
        whisperEl.className = 'mv-whisper-text';
        
        // 높은 레벨에서 글리치 효과
        if (this.level >= 8 && Math.random() < 0.3) {
            whisperEl.classList.add('glitchy');
        }
        
        // 피 색상 (높은 레벨)
        if (this.level >= 7 && Math.random() < 0.4) {
            whisperEl.classList.add('bloody');
        }
        
        whisperEl.textContent = text;
        
        // 랜덤 위치
        whisperEl.style.left = `${10 + Math.random() * 80}%`;
        whisperEl.style.top = `${10 + Math.random() * 80}%`;
        
        // 랜덤 크기 (높은 레벨에서 더 크게)
        const sizeMultiplier = 0.8 + Math.random() * 0.6 + (this.level > 7 ? 0.3 : 0);
        whisperEl.style.fontSize = `${1.2 * sizeMultiplier}rem`;
        
        // 랜덤 회전
        const rotation = -15 + Math.random() * 30;
        whisperEl.style.transform = `rotate(${rotation}deg)`;
        
        // 레벨에 따른 투명도
        const opacity = 0.3 + (this.level / 10) * 0.5;
        whisperEl.style.setProperty('--whisper-opacity', opacity);
        
        const overlay = this.elements.overlay;
        if (overlay) {
            overlay.appendChild(whisperEl);
            
            const duration = 1500 + (this.level * 200);
            
            setTimeout(() => {
                whisperEl.classList.add('fade-out');
                setTimeout(() => whisperEl.remove(), 1000);
            }, duration);
        }
    },
    
    // 눈 효과
    showEyeEffect() {
        const eye = document.createElement('div');
        eye.className = 'mv-creepy-eye';
        eye.innerHTML = '◉';
        
        eye.style.left = `${10 + Math.random() * 80}%`;
        eye.style.top = `${10 + Math.random() * 80}%`;
        eye.style.fontSize = `${2 + Math.random() * 3}rem`;
        
        const overlay = this.elements.overlay;
        if (overlay) {
            overlay.appendChild(eye);
            
            setTimeout(() => {
                eye.classList.add('blink');
                setTimeout(() => eye.remove(), 500);
            }, 1000 + Math.random() * 2000);
        }
    },
    
    // 피 흐르는 효과
    showBloodDrip() {
        const drip = document.createElement('div');
        drip.className = 'mv-blood-drip';
        drip.style.left = `${Math.random() * 100}%`;
        
        const overlay = this.elements.overlay;
        if (overlay) {
            overlay.appendChild(drip);
            
            setTimeout(() => drip.remove(), 4000);
        }
    },
    
    // ==========================================
    // 숨겨진 심볼 추가
    // ==========================================
    symbols: ['◈', '⬡', '◇', '⊕', '⌘', '☽', '★', '⚝', '✧', '⟁', '◉', '⚫', '◎', '❂', '✦', '⬢', '⬣', '△', '▽', '⌬'],
    
    addHiddenSymbols() {
        // 레벨에 따라 여러 개 생성
        const count = Math.ceil(this.level / 4);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.createSymbol(), i * 200);
        }
    },
    
    createSymbol() {
        const symbol = document.createElement('div');
        symbol.className = 'mv-hidden-symbol';
        
        // 레벨에 따라 다른 심볼 풀
        let symbolPool;
        if (this.level >= 8) {
            // 그로테스크 심볼 포함
            symbolPool = [...this.symbols, ...this.grotesqueSymbols];
            if (Math.random() < 0.5) {
                symbol.classList.add('creepy');
            }
        } else {
            symbolPool = this.symbols;
        }
        
        symbol.textContent = symbolPool[Math.floor(Math.random() * symbolPool.length)];
        
        // 랜덤 위치
        symbol.style.left = `${5 + Math.random() * 90}%`;
        symbol.style.top = `${5 + Math.random() * 90}%`;
        
        // 랜덤 크기 (그로테스크할수록 크게)
        const size = 1.5 + Math.random() * 1.5 + (this.level >= 8 ? 1 : 0);
        symbol.style.fontSize = `${size}rem`;
        
        // 레벨에 따른 투명도
        const opacity = 0.2 + (this.level / 10) * 0.5;
        symbol.style.setProperty('--symbol-opacity', opacity);
        
        const overlay = this.elements.overlay;
        if (overlay) {
            overlay.appendChild(symbol);
            
            const duration = 2000 + (this.level * 300);
            
            setTimeout(() => {
                symbol.classList.add('fade-out');
                setTimeout(() => symbol.remove(), 2000);
            }, duration);
        }
    },
    
    // ==========================================
    // 글리치 효과
    // ==========================================
    triggerGlitch() {
        if (Math.random() > 0.15) return; // 15% 확률
        
        const overlay = this.elements.overlay;
        if (!overlay) return;
        
        overlay.classList.add('mv-glitching');
        
        setTimeout(() => {
            overlay.classList.remove('mv-glitching');
        }, 200 + Math.random() * 300);
    },
    
    // ==========================================
    // 주기적인 앰비언트 효과
    // ==========================================
    ambientInterval: null,
    whisperLoop: null,
    symbolLoop: null,
    
    startAmbientEffects() {
        if (this.ambientInterval) return;
        
        // 메인 앰비언트 루프
        this.ambientInterval = setInterval(() => {
            if (!this.enabled || this.level < 1) return;
            
            // 글리치 (확률 기반)
            if (this.level >= 7 && Math.random() < 0.1) {
                this.triggerGlitch();
            }
            // 환각 플래시
            if (this.level >= 9 && Math.random() < 0.05) {
                this.flashVision();
            }
            // 공포 얼굴 (레벨 10에서 매우 낮은 확률)
            if (this.level >= 10 && Math.random() < 0.02) {
                this.showHorrorFace();
            }
            // 피 흐름 (레벨 8+)
            if (this.level >= 8 && Math.random() < 0.08) {
                this.showBloodDrip();
            }
            // 플레이어 경련 (레벨 8+, 낮은 확률)
            if (this.level >= 8 && Math.random() < 0.02) {
                this.triggerPlayerSpasm();
            }
        }, 2000);
        
        // 속삭임 루프 시작
        this.startWhisperLoop();
        
        // 심볼 루프 시작
        this.startSymbolLoop();
    },
    
    // 속삭임 루프 (레벨에 따라 간격 조절)
    startWhisperLoop() {
        this.stopWhisperLoop();
        
        const loop = () => {
            if (!this.enabled || this.level < 1) {
                this.whisperLoop = setTimeout(loop, 2000);
                return;
            }
            
            // 레벨에 따른 간격 (높을수록 빠름)
            const baseInterval = 4000;
            const interval = Math.max(800, baseInterval - (this.level * 300));
            
            // 레벨 3 이상이면 속삭임
            if (this.level >= 3) {
                this.showRandomWhisper();
            }
            
            this.whisperLoop = setTimeout(loop, interval);
        };
        
        loop();
    },
    
    stopWhisperLoop() {
        if (this.whisperLoop) {
            clearTimeout(this.whisperLoop);
            this.whisperLoop = null;
        }
    },
    
    // 심볼 루프
    startSymbolLoop() {
        this.stopSymbolLoop();
        
        const loop = () => {
            if (!this.enabled || this.level < 1) {
                this.symbolLoop = setTimeout(loop, 3000);
                return;
            }
            
            // 레벨에 따른 간격
            const baseInterval = 5000;
            const interval = Math.max(1000, baseInterval - (this.level * 400));
            
            // 레벨 5 이상이면 심볼
            if (this.level >= 5) {
                this.addHiddenSymbols();
            }
            
            this.symbolLoop = setTimeout(loop, interval);
        };
        
        loop();
    },
    
    stopSymbolLoop() {
        if (this.symbolLoop) {
            clearTimeout(this.symbolLoop);
            this.symbolLoop = null;
        }
    },
    
    stopAmbientEffects() {
        if (this.ambientInterval) {
            clearInterval(this.ambientInterval);
            this.ambientInterval = null;
        }
        this.stopWhisperLoop();
        this.stopSymbolLoop();
    },
    
    // ==========================================
    // 환각 플래시 (높은 레벨)
    // ==========================================
    grotesqueVisions: [
        { icon: '◉', text: '' },
        { icon: '†', text: '' },
        { icon: '◆', text: '쿵... 쿵...' },
        { icon: '▼', text: '' },
        { icon: '※', text: '...먹어...' },
        { icon: '◈', text: '' },
        { icon: '✝', text: 'DEATH' },
        { icon: '▣', text: '' },
        { icon: '◐', text: '' },
        { icon: '⬡', text: '...숨을...' }
    ],
    
    flashVision() {
        const flash = document.createElement('div');
        flash.className = 'mv-vision-flash';
        
        const vision = this.grotesqueVisions[Math.floor(Math.random() * this.grotesqueVisions.length)];
        
        flash.innerHTML = `
            <span class="mv-vision-icon">${vision.icon}</span>
            ${vision.text ? `<span class="mv-vision-text">${vision.text}</span>` : ''}
        `;
        
        // 화면 떨림
        document.body.classList.add('mv-screen-shake');
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.classList.add('fade-out');
            document.body.classList.remove('mv-screen-shake');
            setTimeout(() => flash.remove(), 500);
        }, 150 + Math.random() * 100);
    },
    
    // ==========================================
    // 얼굴 플래시 (레벨 10에서 가끔)
    // ==========================================
    showHorrorFace() {
        const face = document.createElement('div');
        face.className = 'mv-horror-face';
        face.innerHTML = `
            <div class="mv-face-eyes">
                <span class="mv-face-eye left">●</span>
                <span class="mv-face-eye right">●</span>
            </div>
            <div class="mv-face-mouth">━</div>
        `;
        
        face.style.left = `${20 + Math.random() * 60}%`;
        face.style.top = `${20 + Math.random() * 60}%`;
        
        document.body.appendChild(face);
        
        // 화면 플래시
        if (typeof VFX !== 'undefined') {
            VFX.screenFlash('rgba(139, 0, 0, 0.3)', 0.2);
        }
        
        setTimeout(() => {
            face.classList.add('disappear');
            setTimeout(() => face.remove(), 300);
        }, 200);
    },
    
    // ==========================================
    // 적/NPC에 그림자 추가
    // ==========================================
    addShadowToElement(element, trueName = '???') {
        if (!element || this.level < 3) return;
        
        const shadow = document.createElement('div');
        shadow.className = 'mv-entity-shadow';
        shadow.setAttribute('data-true-name', trueName);
        
        element.style.position = 'relative';
        element.appendChild(shadow);
        
        this.elements.shadows.push(shadow);
        this.updateShadowOpacity(shadow);
    },
    
    updateShadowOpacity(shadow) {
        const opacity = Math.max(0, (this.level - 3) / 7);
        shadow.style.opacity = opacity;
    },
    
    updateAllShadows() {
        this.elements.shadows.forEach(shadow => {
            this.updateShadowOpacity(shadow);
        });
    },
    
    // ==========================================
    // 숨겨진 텍스트 추가 (특정 요소에)
    // ==========================================
    addHiddenText(element, hiddenContent) {
        if (!element) return;
        
        const hidden = document.createElement('span');
        hidden.className = 'mv-hidden-text';
        hidden.textContent = hiddenContent;
        
        element.style.position = 'relative';
        element.appendChild(hidden);
        
        this.elements.hiddenTexts.push(hidden);
    },
    
    // ==========================================
    // 카드에 숨겨진 이름 추가
    // ==========================================
    addCardTrueName(cardElement, trueName) {
        if (!cardElement || this.level < 5) return;
        
        const existingTrue = cardElement.querySelector('.mv-card-true-name');
        if (existingTrue) existingTrue.remove();
        
        const trueNameEl = document.createElement('div');
        trueNameEl.className = 'mv-card-true-name';
        trueNameEl.textContent = `「${trueName}」`;
        
        const nameEl = cardElement.querySelector('.card-name');
        if (nameEl) {
            nameEl.style.position = 'relative';
            nameEl.appendChild(trueNameEl);
        }
    },
    
    // ==========================================
    // 활성화/비활성화
    // ==========================================
    enable() {
        this.enabled = true;
        if (this.elements.overlay) {
            this.elements.overlay.style.display = 'block';
        }
        this.applyEffects();
    },
    
    disable() {
        this.enabled = false;
        if (this.elements.overlay) {
            this.elements.overlay.style.display = 'none';
        }
    },
    
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('memory-visual-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'memory-visual-styles';
        style.textContent = `
            /* ==========================================
               메모리 비주얼 오버레이
               ========================================== */
            #memory-visual-overlay {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 99998;
            }
            
            /* 비네팅 */
            .mv-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0) 100%);
                opacity: 0;
                transition: all 0.5s ease;
            }
            
            /* 노이즈 */
            .mv-noise {
                position: absolute;
                inset: 0;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                opacity: 0;
                mix-blend-mode: overlay;
                transition: opacity 0.5s ease;
            }
            
            /* 스캔라인 */
            .mv-scanlines {
                position: absolute;
                inset: 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.1) 2px,
                    rgba(0, 0, 0, 0.1) 4px
                );
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            /* 글리치 오버레이 */
            .mv-glitch {
                position: absolute;
                inset: 0;
                opacity: 0;
            }
            
            #memory-visual-overlay.mv-glitching .mv-glitch {
                opacity: 1;
                animation: mvGlitchAnim 0.2s steps(2) infinite;
            }
            
            @keyframes mvGlitchAnim {
                0% { background: rgba(255, 0, 0, 0.05); transform: translateX(-2px); }
                25% { background: rgba(0, 255, 255, 0.05); transform: translateX(2px); }
                50% { background: rgba(255, 0, 255, 0.05); transform: translateY(-1px); }
                75% { background: rgba(0, 255, 0, 0.05); transform: translateY(1px); }
                100% { background: transparent; transform: none; }
            }
            
            /* ==========================================
               레벨별 효과
               ========================================== */
            
            /* Level 1-2: 미세한 노이즈 */
            .mv-level-1 .mv-noise,
            .mv-level-2 .mv-noise {
                opacity: 0.02;
            }
            
            /* Level 3-4: 비네팅 시작 */
            .mv-level-3 .mv-noise,
            .mv-level-4 .mv-noise {
                opacity: 0.04;
            }
            
            .mv-level-3 .mv-vignette,
            .mv-level-4 .mv-vignette {
                opacity: 1;
                background: radial-gradient(ellipse at center, transparent 50%, rgba(20, 0, 40, 0.3) 100%);
            }
            
            /* Level 5-6: 더 강한 효과 */
            .mv-level-5 .mv-noise,
            .mv-level-6 .mv-noise {
                opacity: 0.06;
            }
            
            .mv-level-5 .mv-vignette,
            .mv-level-6 .mv-vignette {
                opacity: 1;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(40, 0, 60, 0.4) 100%);
            }
            
            .mv-level-5 .mv-scanlines,
            .mv-level-6 .mv-scanlines {
                opacity: 0.3;
            }
            
            /* Level 7-8: 강한 효과 */
            .mv-level-7 .mv-noise,
            .mv-level-8 .mv-noise {
                opacity: 0.08;
            }
            
            .mv-level-7 .mv-vignette,
            .mv-level-8 .mv-vignette {
                opacity: 1;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(60, 0, 80, 0.5) 100%);
            }
            
            .mv-level-7 .mv-scanlines,
            .mv-level-8 .mv-scanlines {
                opacity: 0.5;
            }
            
            /* Level 9-10: 최대 효과 - 그로테스크 */
            .mv-level-9 .mv-noise,
            .mv-level-10 .mv-noise {
                opacity: 0.12;
            }
            
            .mv-level-9 .mv-vignette {
                opacity: 1;
                background: radial-gradient(ellipse at center, transparent 20%, rgba(100, 0, 30, 0.6) 100%);
                animation: mvVignetteBreath 4s ease-in-out infinite;
            }
            
            .mv-level-10 .mv-vignette {
                opacity: 1;
                background: radial-gradient(ellipse at center, transparent 15%, rgba(139, 0, 0, 0.7) 100%);
                animation: mvVignetteBreath 2s ease-in-out infinite;
            }
            
            @keyframes mvVignetteBreath {
                0%, 100% { 
                    opacity: 0.8;
                    background-size: 100% 100%;
                }
                50% { 
                    opacity: 1;
                    background-size: 120% 120%;
                }
            }
            
            .mv-level-9 .mv-scanlines,
            .mv-level-10 .mv-scanlines {
                opacity: 0.7;
            }
            
            /* 레벨 10 전용 - 추가 왜곡 */
            .mv-level-10 .mv-glitch {
                animation: mvConstantGlitch 5s steps(3) infinite;
            }
            
            @keyframes mvConstantGlitch {
                0%, 95%, 100% { opacity: 0; }
                96% { opacity: 0.3; background: rgba(139, 0, 0, 0.1); transform: skewX(1deg); }
                97% { opacity: 0; }
                98% { opacity: 0.2; background: rgba(0, 0, 0, 0.2); transform: skewX(-1deg); }
                99% { opacity: 0; }
            }
            
            /* ==========================================
               속삭임 텍스트
               ========================================== */
            .mv-whisper-text {
                position: absolute;
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: rgba(167, 139, 250, var(--whisper-opacity, 0.6));
                text-shadow: 
                    0 0 10px rgba(167, 139, 250, 0.8),
                    0 0 20px rgba(139, 92, 246, 0.6),
                    0 0 40px rgba(139, 92, 246, 0.4);
                pointer-events: none;
                animation: mvWhisperAppear 2s ease-out forwards;
                z-index: 10;
                letter-spacing: 2px;
                white-space: nowrap;
            }
            
            .mv-whisper-text.fade-out {
                animation: mvWhisperFade 1s ease-out forwards;
            }
            
            @keyframes mvWhisperAppear {
                0% { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.5); 
                    filter: blur(15px); 
                }
                20% { 
                    opacity: var(--whisper-opacity, 0.6); 
                    filter: blur(0); 
                }
                80% { 
                    opacity: var(--whisper-opacity, 0.5); 
                    transform: translateY(-5px) scale(1.02);
                }
                100% { 
                    opacity: var(--whisper-opacity, 0.4); 
                    transform: translateY(-15px) scale(1); 
                }
            }
            
            @keyframes mvWhisperFade {
                0% { 
                    opacity: var(--whisper-opacity, 0.4); 
                    filter: blur(0); 
                }
                100% { 
                    opacity: 0; 
                    transform: translateY(-40px) scale(0.8); 
                    filter: blur(20px); 
                }
            }
            
            /* 피색 텍스트 */
            .mv-whisper-text.bloody {
                color: rgba(180, 30, 30, var(--whisper-opacity, 0.7));
                text-shadow: 
                    0 0 10px rgba(139, 0, 0, 0.9),
                    0 0 20px rgba(180, 30, 30, 0.7),
                    0 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            /* 글리치 텍스트 */
            .mv-whisper-text.glitchy {
                animation: mvWhisperAppear 2s ease-out forwards, mvTextGlitch 0.1s steps(2) infinite;
            }
            
            @keyframes mvTextGlitch {
                0% { 
                    text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; 
                    transform: translateX(-2px);
                }
                25% { 
                    text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; 
                    transform: translateX(2px);
                }
                50% { 
                    text-shadow: 0 2px #ff0000, 0 -2px #00ffff; 
                    transform: translateY(-1px);
                }
                75% { 
                    text-shadow: 0 -2px #ff0000, 0 2px #00ffff; 
                    transform: translateY(1px);
                }
            }
            
            /* ==========================================
               눈 효과
               ========================================== */
            .mv-creepy-eye {
                position: absolute;
                pointer-events: none;
                z-index: 15;
                filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
                animation: mvEyeAppear 0.3s ease-out, mvEyeStare 2s ease-in-out infinite;
            }
            
            .mv-creepy-eye.blink {
                animation: mvEyeBlink 0.5s ease-out forwards;
            }
            
            @keyframes mvEyeAppear {
                0% { 
                    opacity: 0; 
                    transform: scale(0); 
                }
                50% { 
                    opacity: 1; 
                    transform: scale(1.3); 
                }
                100% { 
                    opacity: 0.8; 
                    transform: scale(1); 
                }
            }
            
            @keyframes mvEyeStare {
                0%, 100% { 
                    transform: scale(1); 
                    filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
                }
                50% { 
                    transform: scale(1.1); 
                    filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8));
                }
            }
            
            @keyframes mvEyeBlink {
                0% { 
                    transform: scaleY(1); 
                    opacity: 0.8;
                }
                30% { 
                    transform: scaleY(0.1); 
                }
                60% { 
                    transform: scaleY(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: scale(0);
                }
            }
            
            /* ==========================================
               피 흐르는 효과
               ========================================== */
            .mv-blood-drip {
                position: absolute;
                top: 0;
                width: 8px;
                height: 0;
                background: linear-gradient(180deg, 
                    rgba(139, 0, 0, 0.9) 0%, 
                    rgba(180, 30, 30, 0.7) 50%,
                    rgba(100, 0, 0, 0.5) 100%);
                border-radius: 0 0 4px 4px;
                animation: mvBloodDrip 4s ease-in forwards;
                z-index: 20;
                pointer-events: none;
            }
            
            .mv-blood-drip::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 12px;
                height: 12px;
                background: radial-gradient(circle, rgba(139, 0, 0, 0.9) 0%, rgba(100, 0, 0, 0) 70%);
                border-radius: 50%;
            }
            
            @keyframes mvBloodDrip {
                0% { 
                    height: 0; 
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                80% { 
                    height: 200px; 
                    opacity: 0.8;
                }
                100% { 
                    height: 300px; 
                    opacity: 0;
                }
            }
            
            /* ==========================================
               환각 플래시 (그로테스크)
               ========================================== */
            .mv-vision-flash {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                animation: mvFlashIn 0.1s ease;
            }
            
            .mv-vision-flash.fade-out {
                animation: mvFlashOut 0.5s ease forwards;
            }
            
            .mv-vision-icon {
                font-size: 15rem;
                filter: 
                    drop-shadow(0 0 30px rgba(139, 0, 0, 0.8))
                    drop-shadow(0 0 60px rgba(139, 0, 0, 0.5));
                animation: mvVisionPulse 0.15s ease;
            }
            
            .mv-vision-text {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #8b0000;
                text-shadow: 0 0 20px #8b0000;
                margin-top: 20px;
                letter-spacing: 5px;
            }
            
            @keyframes mvFlashIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes mvFlashOut {
                to { opacity: 0; }
            }
            
            @keyframes mvVisionPulse {
                0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
                50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            /* ==========================================
               화면 떨림
               ========================================== */
            body.mv-screen-shake {
                animation: mvScreenShake 0.15s ease;
            }
            
            @keyframes mvScreenShake {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(-10px, 5px); }
                40% { transform: translate(10px, -5px); }
                60% { transform: translate(-5px, 10px); }
                80% { transform: translate(5px, -10px); }
            }
            
            /* ==========================================
               공포 얼굴
               ========================================== */
            .mv-horror-face {
                position: fixed;
                width: 200px;
                height: 250px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100001;
                pointer-events: none;
                animation: mvFaceAppear 0.1s ease;
                filter: 
                    drop-shadow(0 0 30px rgba(0, 0, 0, 0.9))
                    contrast(1.5)
                    brightness(0.8);
            }
            
            .mv-horror-face.disappear {
                animation: mvFaceDisappear 0.3s ease forwards;
            }
            
            .mv-face-eyes {
                display: flex;
                gap: 40px;
                font-size: 3rem;
            }
            
            .mv-face-eye {
                animation: mvEyeTwitch 0.1s steps(2) infinite;
            }
            
            .mv-face-eye.left { animation-delay: 0.05s; }
            
            .mv-face-mouth {
                font-size: 4rem;
                margin-top: 10px;
                animation: mvMouthOpen 0.2s ease infinite alternate;
            }
            
            @keyframes mvFaceAppear {
                0% { 
                    opacity: 0; 
                    transform: scale(3) rotate(-20deg); 
                    filter: blur(20px);
                }
                100% { 
                    opacity: 1; 
                    transform: scale(1) rotate(0deg); 
                    filter: blur(0);
                }
            }
            
            @keyframes mvFaceDisappear {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.5); }
                100% { opacity: 0; transform: scale(0) rotate(180deg); }
            }
            
            @keyframes mvEyeTwitch {
                0% { transform: translateX(-2px); }
                100% { transform: translateX(2px); }
            }
            
            @keyframes mvMouthOpen {
                0% { transform: scaleY(1); }
                100% { transform: scaleY(1.3); }
            }
            
            /* ==========================================
               그로테스크 심볼
               ========================================== */
            .mv-hidden-symbol.creepy {
                color: rgba(139, 0, 0, var(--symbol-opacity, 0.6));
                text-shadow: 
                    0 0 10px rgba(139, 0, 0, 0.9),
                    0 0 20px rgba(139, 0, 0, 0.6),
                    0 0 40px rgba(180, 30, 30, 0.4);
                animation: mvSymbolAppear 0.5s ease-out, mvCreepyFloat 2s ease-in-out 0.5s infinite;
            }
            
            @keyframes mvCreepyFloat {
                0%, 100% { 
                    transform: translateY(0) rotate(0deg) scale(1); 
                    filter: brightness(1);
                }
                25% {
                    transform: translateY(-5px) rotate(-5deg) scale(1.1);
                    filter: brightness(1.2);
                }
                50% { 
                    transform: translateY(-10px) rotate(5deg) scale(0.9); 
                    filter: brightness(0.8);
                }
                75% {
                    transform: translateY(-5px) rotate(-3deg) scale(1.05);
                    filter: brightness(1.1);
                }
            }
            
            /* ==========================================
               숨겨진 심볼
               ========================================== */
            .mv-hidden-symbol {
                position: absolute;
                font-size: 2rem;
                color: rgba(139, 92, 246, var(--symbol-opacity, 0.4));
                text-shadow: 
                    0 0 10px rgba(139, 92, 246, 0.8),
                    0 0 20px rgba(139, 92, 246, 0.5),
                    0 0 40px rgba(167, 139, 250, 0.3);
                pointer-events: none;
                animation: mvSymbolAppear 0.5s ease-out, mvSymbolFloat 3s ease-in-out 0.5s infinite;
                z-index: 5;
            }
            
            .mv-hidden-symbol.fade-out {
                animation: mvSymbolFade 2s ease-out forwards;
            }
            
            @keyframes mvSymbolAppear {
                0% { 
                    opacity: 0; 
                    transform: scale(0) rotate(-180deg); 
                    filter: blur(10px);
                }
                100% { 
                    opacity: var(--symbol-opacity, 0.4); 
                    transform: scale(1) rotate(0deg); 
                    filter: blur(0);
                }
            }
            
            @keyframes mvSymbolFloat {
                0%, 100% { 
                    transform: translateY(0) rotate(0deg) scale(1); 
                }
                25% {
                    transform: translateY(-10px) rotate(5deg) scale(1.05);
                }
                50% { 
                    transform: translateY(-20px) rotate(-3deg) scale(1); 
                }
                75% {
                    transform: translateY(-10px) rotate(8deg) scale(0.95);
                }
            }
            
            @keyframes mvSymbolFade {
                0% {
                    opacity: var(--symbol-opacity, 0.4);
                    transform: scale(1) rotate(0deg);
                    filter: blur(0);
                }
                100% { 
                    opacity: 0; 
                    transform: translateY(-60px) scale(0.3) rotate(180deg); 
                    filter: blur(15px);
                }
            }
            
            /* ==========================================
               환각 플래시
               ========================================== */
            .mv-vision-flash {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                animation: mvFlashIn 0.15s ease;
            }
            
            .mv-vision-flash.fade-out {
                animation: mvFlashOut 0.5s ease forwards;
            }
            
            .mv-vision-icon {
                font-size: 10rem;
                filter: drop-shadow(0 0 50px currentColor);
                animation: mvVisionPulse 0.15s ease;
            }
            
            @keyframes mvFlashIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes mvFlashOut {
                to { opacity: 0; }
            }
            
            @keyframes mvVisionPulse {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* ==========================================
               엔티티 그림자
               ========================================== */
            .mv-entity-shadow {
                position: absolute;
                inset: -10px;
                background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                filter: blur(15px);
                opacity: 0;
                transition: opacity 0.5s ease;
                pointer-events: none;
                z-index: -1;
            }
            
            .mv-entity-shadow::after {
                content: attr(data-true-name);
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.7rem;
                color: rgba(167, 139, 250, 0.7);
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .mv-entity-shadow:hover::after {
                opacity: 1;
            }
            
            /* ==========================================
               숨겨진 텍스트
               ========================================== */
            .mv-hidden-text {
                position: absolute;
                top: 100%;
                left: 0;
                font-size: 0.75rem;
                color: rgba(239, 68, 68, 0.7);
                white-space: nowrap;
                opacity: calc(var(--memory-intensity, 0) * 0.8);
                transition: opacity 0.5s ease;
                pointer-events: none;
            }
            
            /* ==========================================
               카드 진짜 이름
               ========================================== */
            .mv-card-true-name {
                position: absolute;
                top: -20px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 0.7rem;
                color: rgba(167, 139, 250, 0.8);
                opacity: calc(var(--memory-intensity, 0));
                transition: opacity 0.5s ease;
                pointer-events: none;
            }
            
            /* ==========================================
               플레이어 그로테스크 효과 (약하게)
               ========================================== */
            
            /* 오버레이 컨테이너 */
            .mv-player-overlay {
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 10;
                overflow: visible;
            }
            
            /* 레벨 1-2: 거의 없음 */
            .mv-player-normal {
                /* 효과 없음 */
            }
            
            /* 레벨 3-4: 아주 미세한 떨림 */
            .mv-player-uneasy {
                animation: mvPlayerUneasy 6s ease-in-out infinite;
            }
            
            @keyframes mvPlayerUneasy {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(0.5px, 0.5px); }
            }
            
            /* 레벨 5-6: 미세한 떨림 + 약간 어두움 */
            .mv-player-disturbed {
                animation: mvPlayerDisturbed 4s ease-in-out infinite;
                filter: brightness(0.95);
            }
            
            @keyframes mvPlayerDisturbed {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(0.5px, -0.5px); }
                50% { transform: translate(-0.5px, 0.5px); }
                75% { transform: translate(0.5px, 0.5px); }
            }
            
            /* 레벨 7-8: 약한 떨림 + 약간 붉은 색조 */
            .mv-player-corrupted {
                animation: mvPlayerCorrupted 3s ease-in-out infinite;
                filter: brightness(0.9) sepia(0.1);
            }
            
            @keyframes mvPlayerCorrupted {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(1px, -0.5px); }
                50% { transform: translate(-1px, 0.5px); }
                75% { transform: translate(0.5px, -1px); }
            }
            
            /* 레벨 9-10: 떨림 + 어두운 색조 */
            .mv-player-insane {
                animation: mvPlayerInsane 3s ease-in-out infinite;
                filter: brightness(0.85) sepia(0.15) saturate(0.9);
            }
            
            @keyframes mvPlayerInsane {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(1px, -1px); }
                40% { transform: translate(-1px, 1px); }
                60% { transform: translate(1px, 0.5px); }
                80% { transform: translate(-0.5px, -1px); }
            }
            
            /* 경련 효과 (약하게) */
            .mv-player-spasm {
                animation: mvPlayerSpasm 0.2s ease !important;
            }
            
            @keyframes mvPlayerSpasm {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(2px, -2px); }
            }
            
            /* 그림자 효과 (약하게) */
            .mv-player-shadow {
                position: absolute;
                inset: -10px;
                background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.15) 100%);
                border-radius: 50%;
                filter: blur(8px);
                opacity: 0.5;
            }
            
            .mv-player-shadow.intense {
                background: radial-gradient(ellipse at center, transparent 40%, rgba(20, 0, 0, 0.2) 100%);
                inset: -15px;
                opacity: 0.6;
            }
            
            .mv-player-shadow.extreme {
                background: radial-gradient(ellipse at center, transparent 30%, rgba(30, 0, 0, 0.3) 100%);
                inset: -20px;
                opacity: 0.7;
            }
            
            /* 눈 빛남 효과 (약하게) */
            .mv-player-eye-glow {
                position: absolute;
                top: 15%;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 20%;
                background: radial-gradient(ellipse at 30% 50%, rgba(255, 100, 100, 0.2) 0%, transparent 40%),
                            radial-gradient(ellipse at 70% 50%, rgba(255, 100, 100, 0.2) 0%, transparent 40%);
                animation: mvEyeGlow 4s ease-in-out infinite;
                filter: blur(5px);
            }
            
            .mv-player-eye-glow.intense {
                background: radial-gradient(ellipse at 30% 50%, rgba(255, 50, 50, 0.3) 0%, transparent 40%),
                            radial-gradient(ellipse at 70% 50%, rgba(255, 50, 50, 0.3) 0%, transparent 40%);
            }
            
            .mv-player-eye-glow.extreme {
                background: radial-gradient(ellipse at 30% 50%, rgba(255, 30, 30, 0.4) 0%, transparent 50%),
                            radial-gradient(ellipse at 70% 50%, rgba(255, 30, 30, 0.4) 0%, transparent 50%);
            }
            
            @keyframes mvEyeGlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.7; }
            }
            
            /* 균열 효과 - 제거 (너무 과함) */
            .mv-player-cracks,
            .mv-player-cracks.severe {
                display: none;
            }
            
            /* 검은 아우라 (약하게) */
            .mv-player-aura {
                position: absolute;
                inset: -20px;
                background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.1) 100%);
                border-radius: 50%;
                filter: blur(10px);
            }
            
            .mv-player-aura.intense {
                background: radial-gradient(ellipse at center, transparent 50%, rgba(20, 0, 20, 0.15) 100%);
                inset: -25px;
            }
            
            /* 피눈물 (약하게, 낮은 빈도) */
            .mv-player-blood-tears {
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                width: 50%;
                height: 60%;
                overflow: visible;
            }
            
            .mv-player-blood-tears::before,
            .mv-player-blood-tears::after {
                content: '';
                position: absolute;
                top: 0;
                width: 3px;
                height: 0;
                background: linear-gradient(180deg, rgba(139, 0, 0, 0.5) 0%, rgba(180, 30, 30, 0.3) 100%);
                border-radius: 0 0 2px 2px;
                animation: mvBloodTear 8s ease-in infinite;
            }
            
            .mv-player-blood-tears::before {
                left: 25%;
                animation-delay: 0s;
            }
            
            .mv-player-blood-tears::after {
                right: 25%;
                animation-delay: 4s;
            }
            
            @keyframes mvBloodTear {
                0% { height: 0; opacity: 0; }
                5% { opacity: 0.6; }
                50% { height: 40px; opacity: 0.4; }
                100% { height: 60px; opacity: 0; }
            }
            
            /* 왜곡 효과 - 제거 (너무 과함) */
            .mv-player-distortion {
                display: none;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 등록
window.MemoryVisual = MemoryVisual;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 딜레이 후 초기화 (다른 시스템들이 먼저 로드되도록)
    setTimeout(() => {
        MemoryVisual.init();
    }, 1000);
});

console.log('[MemoryVisual] 메모리 비주얼 시스템 로드됨');


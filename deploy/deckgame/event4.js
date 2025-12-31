// ==========================================
// Shadow Deck - 엘프 구출 이벤트
// "숲의 부름" - 위기에 빠진 엘프를 구하라
// ==========================================

const ElfRescueEvent = {
    isActive: false,
    currentStage: 0,         // 현재 단계 (0~4)
    maxStages: 4,            // 총 함정 수
    trapDamage: 5,           // 함정 데미지
    trapChance: 0.50,        // 함정 발동 확률 50%
    successCount: 0,         // 성공 횟수
    failCount: 0,            // 실패 횟수
    isComplete: false,
    
    // 엘프 조력자 ID
    elfAllyId: 'rescuedArcher',
    
    // 대사
    dialogues: {
        intro: [
            "...거기... 누구야...?!",
            "도와줘...! 함정에 갇혔어...!",
            "제발... 여기서 꺼내줘...!"
        ],
        askHelp: [
            "이 던전엔 함정이 가득해... 나를 구하려면 4개를 통과해야 해.",
            "위험해... 하지만 부탁해. 나 혼자선 못 빠져나가.",
            "조심해... 함정에 걸리면 다쳐."
        ],
        trapWarning: [
            "조심해...! 뭔가 이상해...!",
            "멈춰! 함정 냄새가 나!",
            "천천히... 조심스럽게..."
        ],
        trapSafe: [
            "휴... 다행이야!",
            "잘했어! 무사히 통과했어!",
            "좋아, 이대로 계속!"
        ],
        trapHit: [
            "안돼...! 괜찮아?!",
            "미안해... 내가 더 빨리 경고했어야 했는데...!",
            "젠장... 상처가 깊어...!"
        ],
        almostThere: [
            "거의 다 왔어! 마지막이야!",
            "조금만 더! 이제 하나 남았어!",
            "힘내...! 끝이 보여!"
        ],
        rescued: [
            "...고마워, 정말로.",
            "네 덕분에 살았어... 잊지 않을게.",
            "이 은혜, 반드시 갚겠어."
        ],
        joinParty: [
            "나도... 함께 싸워도 될까?",
            "네 여정을 돕고 싶어. 내 화살이 필요할 거야.",
            "혼자 두고 갈 순 없잖아. 같이 가자."
        ],
        giveUp: [
            "...가지 마... 제발...",
            "...혼자선... 여기서 못 나가...",
            "...안 돼..."
        ]
    },
    
    // ==========================================
    // 이벤트 시작
    // ==========================================
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStage = 0;
        this.successCount = 0;
        this.failCount = 0;
        this.isComplete = false;
        
        this.injectStyles();
        this.showIntro();
        
        console.log('[ElfRescueEvent] Started');
    },
    
    // ==========================================
    // 인트로 화면 (event3.js 스타일)
    // ==========================================
    showIntro() {
        const intro = document.createElement('div');
        intro.id = 'elf-intro';
        intro.className = 'elf-intro';
        intro.innerHTML = `
            <div class="elf-intro-bg"></div>
            <div class="elf-intro-content">
                <div class="elf-intro-icon">
                    <img src="elf_portrait.png" alt="Elf" class="elf-intro-portrait" onerror="this.src='ally_archer.png'">
                </div>
                <div class="elf-intro-title">함정에 갇힌 자</div>
                <div class="elf-intro-subtitle">THE TRAPPED ONE</div>
                <div class="elf-intro-dialogue">"...도와줘...! 누가 거기 있어...?!"</div>
                <div class="elf-intro-line"></div>
            </div>
        `;
        
        document.body.appendChild(intro);
        
        // VFX
        if (typeof VFX !== 'undefined') {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            VFX.sparks(cx, cy, { color: '#22c55e', count: 30, speed: 8, size: 4 });
        }
        
        requestAnimationFrame(() => {
            intro.classList.add('show');
        });
        
        // 2.5초 후 메인 UI 생성
        setTimeout(() => {
            this.createUI();
        }, 2500);
        
        // 3초 후 인트로 페이드아웃
        setTimeout(() => {
            intro.classList.add('fade-out');
            setTimeout(() => {
                intro.remove();
                // 메인 이벤트 시작
                this.startMainEvent();
            }, 800);
        }, 3000);
    },
    
    // ==========================================
    // 메인 이벤트 시작
    // ==========================================
    async startMainEvent() {
        const portraitArea = document.getElementById('elf-portrait-area');
        const heroSection = document.getElementById('elf-hero-section');
        const trapSection = document.getElementById('elf-trap-section');
        const goalSection = document.getElementById('elf-goal-section');
        const heroSprite = document.getElementById('elf-hero-sprite');
        const archerSprite = document.getElementById('elf-archer-sprite');
        
        // 초기 상태 - 모든 섹션 숨김
        if (heroSection) heroSection.style.opacity = '0';
        if (trapSection) trapSection.style.opacity = '0';
        if (goalSection) goalSection.style.opacity = '0';
        
        await this.wait(300);
        
        // 포트레이트 등장 + 대사
        this.updateDialogue(this.getRandomDialogue('intro'), 'worried');
        
        // 목적지(궁수) 먼저 등장
        if (goalSection) {
            goalSection.style.transition = 'opacity 0.8s ease';
            goalSection.style.opacity = '1';
        }
        
        // 궁수 VFX
        if (typeof VFX !== 'undefined' && goalSection) {
            const rect = goalSection.getBoundingClientRect();
            VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                color: '#ef4444', count: 25, speed: 6, size: 4
            });
        }
        
        await this.wait(1500);
        
        // 함정 등장
        this.updateDialogue(this.getRandomDialogue('askHelp'), 'worried');
        
        if (trapSection) {
            trapSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            trapSection.style.opacity = '1';
        }
        
        // 함정 VFX
        if (typeof VFX !== 'undefined') {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            VFX.sparks(cx, cy, { color: '#fbbf24', count: 30, speed: 8, size: 4 });
        }
        
        await this.wait(1000);
        
        // 주인공 등장
        if (heroSection) {
            heroSection.style.transition = 'opacity 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
            heroSection.style.opacity = '1';
        }
        
        if (typeof VFX !== 'undefined' && heroSection) {
            const rect = heroSection.getBoundingClientRect();
            VFX.shockwave(rect.left + rect.width / 2, rect.bottom - 50, {
                color: '#6495ed', size: 100, lineWidth: 4
            });
            VFX.sparks(rect.left + rect.width / 2, rect.bottom - 50, {
                color: '#6495ed', count: 30, speed: 12
            });
        }
        
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(5, 300);
        }
        
        // 스테이지 인디케이터 초기화
        this.updateStageIndicator();
        
        await this.wait(1000);
        
        // 버튼 활성화
        const buttons = document.getElementById('elf-buttons');
        if (buttons) buttons.classList.add('visible');
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createUI() {
        // 기존 UI 제거
        const existing = document.getElementById('elf-rescue-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'elf-rescue-overlay';
        overlay.className = 'elf-rescue-overlay';
        
        overlay.innerHTML = `
            <!-- 배경 -->
            <div class="elf-bg"></div>
            
            <!-- 상단: 진행도 표시 -->
            <div class="elf-top-bar">
                <div class="elf-stage-indicator">
                    ${this.createStageIndicatorHTML()}
                </div>
                <div class="elf-trap-warning">
                    ⚠️ 함정 확률 50% · <span class="warning-damage">-5 HP</span>
                </div>
            </div>
            
            <!-- 메인: 사이드뷰 스테이지 -->
            <div class="elf-stage-area">
                <!-- 주인공 (왼쪽) -->
                <div class="elf-hero-section" id="elf-hero-section">
                    <img src="${this.getHeroSprite()}" alt="Hero" class="elf-hero-sprite" id="elf-hero-sprite">
                    <div class="elf-hero-glow"></div>
                </div>
                
                <!-- 중앙: 현재 함정 -->
                <div class="elf-trap-section" id="elf-trap-section">
                    <div class="elf-current-trap" id="elf-current-trap">
                        <img src="dungeon_tile_trap.png" alt="Trap" class="elf-trap-img">
                        <div class="elf-trap-question">?</div>
                    </div>
                    <div class="elf-trap-result" id="elf-trap-result"></div>
                </div>
                
                <!-- 목적지 (오른쪽) - 궁수 -->
                <div class="elf-goal-section" id="elf-goal-section">
                    <div class="elf-cage-wrapper" id="elf-cage-wrapper">
                        <img src="cage.png" alt="Cage" class="elf-cage-img" onerror="this.style.display='none'">
                        <img src="ally_archer.png" alt="Archer" class="elf-archer-sprite" id="elf-archer-sprite">
                    </div>
                    <div class="elf-goal-label">갇힌 궁수</div>
                </div>
            </div>
            
            <!-- 우측: 엘프 포트레이트 + 말풍선 -->
            <div class="elf-portrait-area" id="elf-portrait-area">
                <div class="elf-speech-bubble" id="elf-speech-bubble">
                    <div class="elf-speech-text" id="elf-dialogue-text"></div>
                    <div class="elf-speech-tail"></div>
                </div>
                <div class="elf-portrait-wrapper">
                    <img src="elf_portrait.png" alt="Elf" class="elf-portrait-img" id="elf-portrait">
                </div>
            </div>
            
            <!-- 하단: 버튼 -->
            <div class="elf-buttons" id="elf-buttons">
                <button class="elf-btn elf-btn-advance" id="elf-btn-advance">
                    앞으로 나아가기
                </button>
                <button class="elf-btn elf-btn-giveup" id="elf-btn-giveup">
                    포기하기
                </button>
            </div>
            
            <!-- 결과 오버레이 -->
            <div class="elf-result-overlay" id="elf-result-overlay">
                <div class="elf-result-content" id="elf-result-content"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.injectStyles();
        this.setupEventListeners();
    },
    
    // ==========================================
    // 경로 HTML 생성
    // ==========================================
    createPathHTML() {
        // 기존 함수 유지 (사용하지 않음)
        return '';
    },
    
    // 스테이지 인디케이터 생성
    createStageIndicatorHTML() {
        let html = '<div class="elf-stages">';
        for (let i = 0; i < this.maxStages; i++) {
            html += `<div class="elf-stage-dot" data-index="${i}" id="elf-stage-${i}">
                <span class="stage-num">${i + 1}</span>
            </div>`;
        }
        html += '<div class="elf-stage-goal">🏹</div>';
        html += '</div>';
        return html;
    },
    
    // ==========================================
    // 히어로 스프라이트 가져오기
    // ==========================================
    getHeroSprite() {
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob && JobSystem.jobs[JobSystem.currentJob]) {
            return JobSystem.jobs[JobSystem.currentJob].sprite || 'hero.png';
        }
        return 'hero.png';
    },
    
    // ==========================================
    // 이벤트 리스너 설정
    // ==========================================
    setupEventListeners() {
        const advanceBtn = document.getElementById('elf-btn-advance');
        const giveupBtn = document.getElementById('elf-btn-giveup');
        
        if (advanceBtn) {
            advanceBtn.addEventListener('click', () => this.attemptTrap());
        }
        
        if (giveupBtn) {
            giveupBtn.addEventListener('click', () => this.giveUp());
        }
    },
    
    
    // ==========================================
    // 함정 시도
    // ==========================================
    async attemptTrap() {
        if (this.currentStage >= this.maxStages || this.isComplete) return;
        
        const advanceBtn = document.getElementById('elf-btn-advance');
        if (advanceBtn) advanceBtn.disabled = true;
        
        const currentTrap = document.getElementById('elf-current-trap');
        const trapQuestion = currentTrap?.querySelector('.elf-trap-question');
        
        // 함정 확인 애니메이션
        if (currentTrap) {
            currentTrap.classList.add('checking');
        }
        
        this.updateDialogue(this.getRandomDialogue('trapWarning'), 'worried');
        
        // 긴장감 연출
        await this.playTensionEffect();
        
        // 함정 발동 여부 결정
        const isTrapped = Math.random() < this.trapChance;
        
        if (isTrapped) {
            this.trapResults[this.currentStage] = 'failed';
            await this.triggerTrap(currentTrap, trapQuestion);
        } else {
            this.trapResults[this.currentStage] = 'passed';
            await this.passTrap(currentTrap, trapQuestion);
        }
        
        this.currentStage++;
        this.updateProgress();
        
        // 완료 체크
        if (this.currentStage >= this.maxStages) {
            await this.wait(1000);
            this.completeRescue();
        } else {
            if (this.currentStage === this.maxStages - 1) {
                this.updateDialogue(this.getRandomDialogue('almostThere'), 'happy');
            }
            
            // 함정 리셋
            this.resetTrapDisplay();
            
            if (advanceBtn) advanceBtn.disabled = false;
        }
    },
    
    // 함정 표시 리셋
    resetTrapDisplay() {
        const currentTrap = document.getElementById('elf-current-trap');
        const trapQuestion = currentTrap?.querySelector('.elf-trap-question');
        const trapResult = document.getElementById('elf-trap-result');
        
        if (currentTrap) {
            currentTrap.classList.remove('checking', 'triggered', 'passed');
            currentTrap.style.transform = '';
        }
        if (trapQuestion) {
            trapQuestion.textContent = '?';
            trapQuestion.className = 'elf-trap-question';
        }
        if (trapResult) {
            trapResult.textContent = '';
            trapResult.className = 'elf-trap-result';
        }
    },
    
    // ==========================================
    // 긴장감 연출
    // ==========================================
    async playTensionEffect() {
        const trapSlot = document.getElementById(`elf-trap-${this.currentStage}`);
        
        // 비네트 효과
        this.showTensionVignette();
        
        // 함정 슬롯 강조 VFX
        if (trapSlot && typeof VFX !== 'undefined') {
            const rect = trapSlot.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            // 경고 파티클
            for (let i = 0; i < 3; i++) {
                await this.wait(200);
                VFX.sparks(cx, cy, {
                    color: '#fbbf24',
                    count: 10,
                    speed: 5,
                    size: 3
                });
            }
        }
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(5, 600);
        }
        
        // 사운드
        this.playSound('sound/empty-gun-shot.mp3', 0.3);
        
        await this.wait(500);
        
        // 비네트 제거
        this.hideTensionVignette();
    },
    
    // 긴장감 비네트
    showTensionVignette() {
        let vignette = document.getElementById('elf-tension-vignette');
        if (!vignette) {
            vignette = document.createElement('div');
            vignette.id = 'elf-tension-vignette';
            vignette.style.cssText = `
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.4) 100%);
                z-index: 10001;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(vignette);
        }
        vignette.style.opacity = '1';
    },
    
    hideTensionVignette() {
        const vignette = document.getElementById('elf-tension-vignette');
        if (vignette) {
            vignette.style.opacity = '0';
            setTimeout(() => vignette.remove(), 300);
        }
    },
    
    // ==========================================
    // 함정 발동
    // ==========================================
    async triggerTrap(trapEl, trapQuestion) {
        this.failCount++;
        
        // 함정 발동 표시
        if (trapQuestion) {
            trapQuestion.textContent = '💥';
            trapQuestion.classList.add('danger');
        }
        if (trapEl) {
            trapEl.classList.remove('checking');
            trapEl.classList.add('triggered');
        }
        
        // 결과 텍스트
        const trapResult = document.getElementById('elf-trap-result');
        if (trapResult) {
            trapResult.textContent = '함정 발동!';
            trapResult.className = 'elf-trap-result danger';
        }
        
        // 강력한 VFX
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.screenFlash('#ff4444', 0.6);
            VFX.fire(cx, cy, { size: 150 });
            VFX.shockwave(cx, cy, { color: '#ef4444', size: 200, lineWidth: 5 });
            VFX.sparks(cx, cy, { color: '#ff6600', count: 50, speed: 20, size: 6 });
        }
        
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(25, 600);
        }
        
        this.playSound('sound/retro-gun-shot.mp3', 0.6);
        
        // HP 감소
        if (gameState?.player) {
            gameState.player.hp -= this.trapDamage;
            if (gameState.player.hp < 0) gameState.player.hp = 0;
            
            if (typeof TopBar !== 'undefined') {
                TopBar.update();
            }
        }
        
        // 주인공 피격 효과
        const heroSprite = document.getElementById('elf-hero-sprite');
        if (heroSprite) {
            heroSprite.classList.add('hit');
            setTimeout(() => heroSprite.classList.remove('hit'), 600);
        }
        
        this.updateDialogue(this.getRandomDialogue('trapHit'), 'worried');
        this.showDamagePopup(this.trapDamage);
        
        await this.wait(800);
        
        // 사망 체크
        if (gameState?.player?.hp <= 0) {
            this.playerDied();
            return;
        }
    },
    
    // ==========================================
    // 함정 통과
    // ==========================================
    async passTrap(trapEl, trapQuestion) {
        this.successCount++;
        
        // 안전 표시
        if (trapQuestion) {
            trapQuestion.textContent = '✓';
            trapQuestion.classList.add('safe');
        }
        if (trapEl) {
            trapEl.classList.remove('checking');
            trapEl.classList.add('passed');
        }
        
        // 결과 텍스트
        const trapResult = document.getElementById('elf-trap-result');
        if (trapResult) {
            trapResult.textContent = '무사 통과!';
            trapResult.className = 'elf-trap-result safe';
        }
        
        // VFX
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.screenFlash('#22c55e', 0.3);
            VFX.shockwave(cx, cy, { color: '#22c55e', size: 150, lineWidth: 3 });
            VFX.sparks(cx, cy, { color: '#22c55e', count: 25, speed: 10, size: 4 });
            
            // 잔여 빛 파티클
            setTimeout(() => {
                VFX.sparks(cx, cy, { color: '#4ade80', count: 15, speed: 5, size: 3 });
            }, 150);
        }
        
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(2, 150);
        }
        
        this.updateDialogue(this.getRandomDialogue('trapSafe'), 'happy');
        
        await this.wait(500);
    },
    
    // ==========================================
    // 구출 완료
    // ==========================================
    async completeRescue() {
        this.isComplete = true;
        
        const buttons = document.getElementById('elf-buttons');
        if (buttons) buttons.classList.remove('visible');
        
        // 구출 완료 연출 시작
        await this.playOutroSequence();
    },
    
    // ==========================================
    // 아웃트로 시퀀스
    // ==========================================
    async playOutroSequence() {
        const cage = document.getElementById('elf-cage');
        const elfSprite = document.getElementById('elf-sprite');
        const elfWrapper = document.querySelector('.elf-elf-wrapper');
        const goal = document.getElementById('elf-goal');
        
        // 1단계: 케이지 파괴
        this.updateDialogue("드디어...!", 'happy');
        
        if (typeof VFX !== 'undefined' && goal) {
            const goalRect = goal.getBoundingClientRect();
            const cx = goalRect.left + goalRect.width / 2;
            const cy = goalRect.top + goalRect.height / 2;
            
            // 빛 집중
            for (let i = 0; i < 5; i++) {
                await this.wait(100);
                VFX.sparks(cx, cy, { color: '#fbbf24', count: 15, speed: 3, size: 4 });
            }
        }
        
        await this.wait(500);
        
        // 케이지 파괴
        if (cage) {
            cage.classList.add('breaking');
            this.playSound('sound/retro-gun-shot.mp3', 0.5);
            
            // 파괴 VFX
            if (typeof VFX !== 'undefined' && goal) {
                const goalRect = goal.getBoundingClientRect();
                const cx = goalRect.left + goalRect.width / 2;
                const cy = goalRect.top + goalRect.height / 2;
                
                VFX.screenFlash('#ffd700', 0.4);
                VFX.shockwave(cx, cy, { color: '#ffd700', size: 150, lineWidth: 5 });
                VFX.sparks(cx, cy, { color: '#8b7355', count: 40, speed: 12, size: 6 });
            }
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(15, 400);
            }
            
            await this.wait(500);
            cage.style.display = 'none';
        }
        
        // 2단계: 궁수 해방
        if (elfWrapper) {
            elfWrapper.classList.remove('elf-trapped');
        }
        if (elfSprite) {
            elfSprite.classList.remove('trembling');
            elfSprite.classList.add('freed');
        }
        
        // 해방 VFX
        if (typeof VFX !== 'undefined' && goal) {
            const goalRect = goal.getBoundingClientRect();
            const cx = goalRect.left + goalRect.width / 2;
            const cy = goalRect.top + goalRect.height / 2;
            
            VFX.shockwave(cx, cy, { color: '#22c55e', size: 200, lineWidth: 3 });
            VFX.sparks(cx, cy, { color: '#4ade80', count: 50, speed: 15, size: 5 });
        }
        
        this.updateDialogue(this.getRandomDialogue('rescued'), 'happy');
        await this.wait(2000);
        
        // 3단계: 주인공과 만남
        this.updateDialogue(this.getRandomDialogue('joinParty'), 'happy');
        // 조력자 시스템에 추가
        this.addElfAlly();
        
        // 완료 화면
        this.showCompletionScreen();
    },
    
    // ==========================================
    // 만남 연출
    // ==========================================
    async playMeetingSequence() {
        const heroToken = document.getElementById('elf-hero-token');
        const elfSprite = document.getElementById('elf-sprite');
        const goal = document.getElementById('elf-goal');
        
        // 주인공 토큰이 엘프에게 이동
        this.moveHeroToken();
        
        await this.wait(800);
        
        // VFX - 만남의 순간
        if (typeof VFX !== 'undefined' && goal) {
            const goalRect = goal.getBoundingClientRect();
            const cx = goalRect.left + goalRect.width / 2;
            const cy = goalRect.top + goalRect.height / 2;
            
            VFX.sparks(cx, cy, { color: '#fbbf24', count: 50, speed: 15 });
            VFX.shockwave(cx, cy, { color: '#22c55e', size: 200 });
            VFX.screenFlash('#fbbf24', 0.3);
        }
        
        // 화면 효과
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(8, 400);
        }
        
        await this.wait(500);
    },
    
    // ==========================================
    // 엘프 조력자 추가
    // ==========================================
    addElfAlly() {
        // AllySystem에 엘프 조력자 등록
        if (typeof AllySystem !== 'undefined') {
            // 엘프 조력자가 없으면 추가
            if (!AllySystem.allyDatabase.rescuedArcher) {
                AllySystem.allyDatabase.rescuedArcher = {
                    id: 'rescuedArcher',
                    name: {
                        kr: '정예 궁수',
                        en: 'Elite Archer'
                    },
                    description: {
                        kr: '2 코스트 사용 시 적에게 4 데미지를 입힙니다. (정확한 사격)',
                        en: 'Deals 4 damage when 2 energy is spent.'
                    },
                    icon: 'ally_archer.png',
                    attackDamage: 4,
                    attackType: 'projectile',
                    attackColor: '#f59e0b',
                    costThreshold: 2,
                    onAttack: (ally, enemy) => {
                        return { damage: 4, effect: 'projectile' };
                    }
                };
            }
            
            // 조력자 설정
            AllySystem.setAlly('rescuedArcher');
            
            console.log('[ElfRescueEvent] Rescued Archer ally added!');
        }
    },
    
    // ==========================================
    // 완료 화면
    // ==========================================
    showCompletionScreen() {
        const resultOverlay = document.getElementById('elf-result-overlay');
        const resultContent = document.getElementById('elf-result-content');
        
        if (resultContent) {
            const avoidCount = this.maxStages - this.failCount;
            const totalDamage = this.failCount * this.trapDamage;
            
            resultContent.innerHTML = `
                <div class="elf-result-title">구출 성공!</div>
                <div class="elf-result-icon">
                    <img src="ally_archer.png" alt="Archer" style="width: 100px; height: auto; filter: drop-shadow(0 0 25px rgba(34, 197, 94, 0.8)); image-rendering: pixelated;">
                </div>
                <div class="elf-result-text">
                    정예 궁수가 조력자로 합류했습니다!
                </div>
                <div class="elf-result-stats">
                    <div class="elf-stat">함정 회피 <span>${avoidCount}/${this.maxStages}</span></div>
                    <div class="elf-stat">받은 피해 <span>${totalDamage > 0 ? '-' + totalDamage : '0'}</span></div>
                </div>
                <div class="elf-ally-preview">
                    <img src="ally_archer.png" alt="Archer" class="elf-ally-img">
                    <div class="elf-ally-info">
                        <div class="elf-ally-name">정예 궁수</div>
                        <div class="elf-ally-desc">2 코스트 사용 시 적에게 4 데미지</div>
                    </div>
                </div>
                <button class="elf-btn elf-btn-confirm" onclick="ElfRescueEvent.closeEvent()">
                    계속하기
                </button>
            `;
        }
        
        if (resultOverlay) {
            resultOverlay.classList.add('visible');
        }
    },
    
    // ==========================================
    // 플레이어 사망
    // ==========================================
    playerDied() {
        this.isComplete = true;
        
        const resultOverlay = document.getElementById('elf-result-overlay');
        const resultContent = document.getElementById('elf-result-content');
        
        if (resultContent) {
            resultContent.innerHTML = `
                <div class="elf-result-title elf-fail">쓰러졌다...</div>
                <div class="elf-result-icon" style="filter: grayscale(0.5) brightness(0.6);">💀</div>
                <div class="elf-result-text" style="color: #fca5a5;">
                    함정에 의해 쓰러졌습니다.<br>
                    <small style="color: #888; font-size: 0.9rem;">궁수를 구출하지 못했습니다.</small>
                </div>
                <button class="elf-btn elf-btn-confirm" onclick="ElfRescueEvent.closeEvent()">
                    계속하기
                </button>
            `;
        }
        
        if (resultOverlay) {
            resultOverlay.classList.add('visible');
        }
    },
    
    // ==========================================
    // 구출 포기
    // ==========================================
    async giveUp() {
        const buttons = document.getElementById('elf-buttons');
        if (buttons) buttons.classList.remove('visible');
        
        this.updateDialogue(this.getRandomDialogue('giveUp'), 'worried');
        
        // 주인공이 뒤돌아가는 연출
        const heroToken = document.getElementById('elf-hero-token');
        if (heroToken) {
            heroToken.style.transition = 'all 1s ease';
            heroToken.style.left = '-150px';
            heroToken.style.opacity = '0.5';
        }
        
        await this.wait(1500);
        
        // 포기 결과 화면
        this.showGiveUpScreen();
    },
    
    // 포기 결과 화면
    showGiveUpScreen() {
        const resultOverlay = document.getElementById('elf-result-overlay');
        const resultContent = document.getElementById('elf-result-content');
        
        if (resultContent) {
            resultContent.innerHTML = `
                <div class="elf-result-title elf-giveup">포기...</div>
                <div class="elf-result-icon" style="opacity: 0.6;">🚶</div>
                <div class="elf-result-text" style="color: #9ca3af;">
                    위험을 피해 돌아갔습니다.<br>
                    <small style="color: #6b7280; font-size: 0.9rem;">궁수의 울음소리가 멀어져 갑니다...</small>
                </div>
                <div class="elf-result-stats">
                    <div class="elf-stat">진행 <span>${this.currentStage}/${this.maxStages}</span></div>
                    <div class="elf-stat">받은 피해 <span>${this.failCount * this.trapDamage > 0 ? '-' + (this.failCount * this.trapDamage) : '0'}</span></div>
                </div>
                <button class="elf-btn elf-btn-confirm" onclick="ElfRescueEvent.closeEvent()">
                    떠나기
                </button>
            `;
        }
        
        if (resultOverlay) {
            resultOverlay.classList.add('visible');
        }
    },
    
    // ==========================================
    // 이벤트 종료
    // ==========================================
    closeEvent() {
        this.isActive = false;
        
        const overlay = document.getElementById('elf-rescue-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }
        
        // 게임 상태 업데이트
        if (typeof updateUI === 'function') updateUI();
        if (typeof TopBar !== 'undefined') TopBar.update();
        
        console.log('[ElfRescueEvent] Closed');
    },
    
    // ==========================================
    // 유틸리티 함수들
    // ==========================================
    updateDialogue(text, emotion = 'normal') {
        const portraitArea = document.getElementById('elf-portrait-area');
        const speechBubble = document.getElementById('elf-speech-bubble');
        const dialogueText = document.getElementById('elf-dialogue-text');
        const portrait = document.getElementById('elf-portrait');
        
        // 포트레이트 영역 표시
        if (portraitArea && !portraitArea.classList.contains('visible')) {
            portraitArea.classList.add('visible');
        }
        
        // 말풍선 표시
        if (speechBubble) {
            speechBubble.classList.add('visible');
        }
        
        // 포트레이트 감정 설정
        if (portrait) {
            portrait.classList.remove('speaking', 'happy', 'worried');
            portrait.classList.add('speaking');
            
            if (emotion === 'happy') {
                portrait.classList.add('happy');
            } else if (emotion === 'worried') {
                portrait.classList.add('worried');
            }
            
            // 말하기 애니메이션 종료
            setTimeout(() => {
                portrait.classList.remove('speaking');
            }, 1500);
        }
        
        // 텍스트 업데이트
        if (dialogueText) {
            dialogueText.style.opacity = '0';
            setTimeout(() => {
                dialogueText.textContent = text;
                dialogueText.style.opacity = '1';
            }, 150);
        }
    },
    
    hideDialogue() {
        const speechBubble = document.getElementById('elf-speech-bubble');
        if (speechBubble) {
            speechBubble.classList.remove('visible');
        }
    },
    
    updateProgress() {
        // 스테이지 인디케이터 업데이트
        this.updateStageIndicator();
        
        // 주인공 이동 애니메이션
        this.moveHeroToken();
    },
    
    // 스테이지 인디케이터 업데이트
    updateStageIndicator() {
        for (let i = 0; i < this.maxStages; i++) {
            const dot = document.getElementById(`elf-stage-${i}`);
            if (dot) {
                dot.classList.remove('current', 'passed', 'failed');
                if (i < this.currentStage) {
                    // 이미 지나간 스테이지
                    const trapResult = this.trapResults?.[i];
                    dot.classList.add(trapResult === 'passed' ? 'passed' : 'failed');
                    dot.querySelector('.stage-num').textContent = trapResult === 'passed' ? '✓' : '✗';
                } else if (i === this.currentStage) {
                    dot.classList.add('current');
                }
            }
        }
    },
    
    // 함정 결과 기록
    trapResults: [],
    
    // 주인공 이동 애니메이션
    moveHeroToken() {
        const heroSprite = document.getElementById('elf-hero-sprite');
        if (heroSprite) {
            heroSprite.classList.add('moving');
            setTimeout(() => heroSprite.classList.remove('moving'), 600);
        }
        this.updateStageIndicator();
    },
    
    getRandomDialogue(type) {
        const dialogues = this.dialogues[type];
        if (!dialogues || dialogues.length === 0) return '';
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    },
    
    showDamagePopup(damage) {
        const popup = document.createElement('div');
        popup.className = 'elf-damage-popup';
        popup.textContent = `-${damage}`;
        
        // 주인공 스프라이트 위치 찾기
        const heroSprite = document.getElementById('elf-hero-sprite');
        const heroSection = document.getElementById('elf-hero-section');
        const target = heroSprite || heroSection;
        
        if (target) {
            const rect = target.getBoundingClientRect();
            popup.style.left = `${rect.left + rect.width / 2}px`;
            popup.style.top = `${rect.top + 50}px`;
        } else {
            // 폴백: 화면 중앙 왼쪽
            popup.style.left = '25%';
            popup.style.top = '40%';
        }
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    },
    
    playSound(src, volume = 0.5) {
        try {
            const sound = new Audio(src);
            sound.volume = volume;
            sound.play().catch(() => {});
        } catch (e) {}
    },
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('elf-rescue-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'elf-rescue-styles';
        style.textContent = `
            /* ==========================================
               인트로 화면
               ========================================== */
            .elf-intro {
                position: fixed;
                inset: 0;
                z-index: 100001;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                opacity: 0;
            }
            
            .elf-intro.show {
                opacity: 1;
                transition: none;
            }
            
            .elf-intro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .elf-intro-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at center, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 30% 70%, rgba(239, 68, 68, 0.1) 0%, transparent 40%),
                    linear-gradient(180deg, #0a1a0a 0%, #050a05 100%);
            }
            
            .elf-intro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: elfIntroReveal 1.5s ease-out forwards;
            }
            
            @keyframes elfIntroReveal {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .elf-intro-icon {
                margin-bottom: 30px;
                animation: elfIntroIconFloat 3s ease-in-out infinite;
            }
            
            .elf-intro-portrait {
                width: 200px;
                height: 200px;
                object-fit: contain;
                filter: 
                    drop-shadow(0 0 30px rgba(34, 197, 94, 0.6))
                    drop-shadow(0 0 60px rgba(239, 68, 68, 0.3));
                animation: elfIntroPortraitPulse 2s ease-in-out infinite;
            }
            
            @keyframes elfIntroPortraitPulse {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px rgba(34, 197, 94, 0.6)); }
                50% { transform: scale(1.05); filter: drop-shadow(0 0 50px rgba(239, 68, 68, 0.5)); }
            }
            
            @keyframes elfIntroIconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .elf-intro-title {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: #22c55e;
                letter-spacing: 0.3em;
                text-shadow: 0 0 40px rgba(34, 197, 94, 0.5);
                margin-bottom: 15px;
            }
            
            .elf-intro-subtitle {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #4ade80;
                letter-spacing: 0.5em;
                opacity: 0.7;
                margin-bottom: 25px;
            }
            
            .elf-intro-dialogue {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #ef4444;
                text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
                margin-bottom: 30px;
                animation: elfIntroDialogueTremble 0.1s linear infinite;
            }
            
            @keyframes elfIntroDialogueTremble {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }
            
            .elf-intro-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.6), transparent);
                animation: elfIntroLine 1.5s ease-out forwards;
            }
            
            @keyframes elfIntroLine {
                0% { width: 0; opacity: 0; }
                100% { width: 250px; opacity: 1; }
            }
            
            /* ==========================================
               메인 오버레이
               ========================================== */
            .elf-rescue-overlay {
                position: fixed;
                top: 50px;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                background: #0a0a0a;
                font-family: 'Cinzel', serif;
                overflow: hidden;
            }
            
            .elf-rescue-overlay.fade-out {
                animation: elfFadeOut 0.5s ease forwards;
            }
            
            @keyframes elfFadeOut {
                to { opacity: 0; }
            }
            
            /* 배경 - 숲 느낌 */
            .elf-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at 30% 100%, rgba(34, 197, 94, 0.2) 0%, transparent 40%),
                    radial-gradient(ellipse at 70% 100%, rgba(34, 197, 94, 0.15) 0%, transparent 40%),
                    radial-gradient(ellipse at 90% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 30%),
                    linear-gradient(180deg, #050a05 0%, #0a1510 50%, #0a0f0a 100%);
            }
            
            /* ==========================================
               상단바: 스테이지 인디케이터
               ========================================== */
            .elf-top-bar {
                position: absolute;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 200;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            .elf-stage-indicator {
                background: rgba(0, 0, 0, 0.7);
                padding: 15px 30px;
                border-radius: 50px;
                border: 2px solid rgba(139, 115, 85, 0.5);
            }
            
            .elf-stages {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .elf-stage-dot {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: rgba(50, 50, 50, 0.8);
                border: 3px solid rgba(100, 100, 100, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #888;
                transition: all 0.3s ease;
            }
            
            .elf-stage-dot.current {
                background: rgba(251, 191, 36, 0.3);
                border-color: #fbbf24;
                color: #fbbf24;
                transform: scale(1.15);
                box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
                animation: currentStagePulse 1s ease-in-out infinite;
            }
            
            @keyframes currentStagePulse {
                0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
                50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.8); }
            }
            
            .elf-stage-dot.passed {
                background: rgba(34, 197, 94, 0.3);
                border-color: #22c55e;
                color: #22c55e;
            }
            
            .elf-stage-dot.failed {
                background: rgba(239, 68, 68, 0.3);
                border-color: #ef4444;
                color: #ef4444;
            }
            
            .elf-stage-goal {
                font-size: 1.8rem;
                margin-left: 10px;
                filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.5));
            }
            
            .elf-top-bar .elf-trap-warning {
                color: #f59e0b;
                font-size: 0.9rem;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
            }
            
            .elf-top-bar .warning-damage {
                color: #ef4444;
                font-weight: bold;
            }
            
            /* ==========================================
               메인: 사이드뷰 스테이지
               ========================================== */
            .elf-stage-area {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 900px;
                height: 350px;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                padding: 0 50px;
                z-index: 50;
            }
            
            /* 바닥선 */
            .elf-stage-area::before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, 
                    rgba(100, 150, 255, 0.3) 0%,
                    rgba(139, 115, 85, 0.5) 50%,
                    rgba(34, 197, 94, 0.3) 100%
                );
            }
            
            /* 주인공 섹션 */
            .elf-hero-section {
                position: relative;
                width: 200px;
                height: 100%;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            
            .elf-hero-sprite {
                width: 180px;
                height: auto;
                max-height: 280px;
                object-fit: contain;
                object-position: bottom center;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 25px rgba(100, 150, 255, 0.6));
                animation: heroIdle 2s ease-in-out infinite;
                transition: all 0.3s ease;
            }
            
            @keyframes heroIdle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            
            .elf-hero-sprite.moving {
                animation: heroMove 0.6s ease;
            }
            
            @keyframes heroMove {
                0% { transform: translateX(0); }
                30% { transform: translateX(50px) translateY(-20px); }
                60% { transform: translateX(80px); }
                100% { transform: translateX(0); }
            }
            
            .elf-hero-sprite.hit {
                animation: heroHit 0.5s ease !important;
            }
            
            @keyframes heroHit {
                0%, 100% { filter: drop-shadow(0 0 25px rgba(100, 150, 255, 0.6)); }
                25% { transform: translateX(-20px); filter: brightness(0.5) drop-shadow(0 0 30px rgba(255, 50, 50, 0.9)); }
                50% { transform: translateX(10px); filter: brightness(1.5); }
                75% { transform: translateX(-5px); }
            }
            
            .elf-hero-glow {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 150px;
                height: 50px;
                background: radial-gradient(ellipse at center, rgba(100, 150, 255, 0.4) 0%, transparent 70%);
            }
            
            /* 함정 섹션 (중앙, 크게) */
            .elf-trap-section {
                position: relative;
                width: 280px;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
            }
            
            .elf-current-trap {
                position: relative;
                width: 220px;
                height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .elf-trap-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
                transition: all 0.3s ease;
            }
            
            .elf-trap-question {
                position: absolute;
                font-size: 4rem;
                font-weight: bold;
                color: #fff;
                text-shadow: 
                    0 0 30px rgba(255, 255, 255, 0.8),
                    0 4px 8px rgba(0, 0, 0, 0.8);
                transition: all 0.3s ease;
            }
            
            /* 함정 체크 중 */
            .elf-current-trap.checking {
                animation: trapShake 0.1s linear infinite;
            }
            
            .elf-current-trap.checking .elf-trap-img {
                filter: brightness(1.3) drop-shadow(0 0 40px rgba(251, 191, 36, 0.8));
            }
            
            .elf-current-trap.checking .elf-trap-question {
                color: #fbbf24;
                animation: questionPulse 0.3s ease infinite;
            }
            
            @keyframes trapShake {
                0%, 100% { transform: translateX(0) rotate(0); }
                25% { transform: translateX(-5px) rotate(-2deg); }
                75% { transform: translateX(5px) rotate(2deg); }
            }
            
            @keyframes questionPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            /* 함정 통과 */
            .elf-current-trap.passed .elf-trap-img {
                filter: brightness(1.2) hue-rotate(80deg) drop-shadow(0 0 30px rgba(34, 197, 94, 0.6));
            }
            
            .elf-current-trap.passed .elf-trap-question {
                color: #22c55e;
                text-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
            }
            
            /* 함정 발동 */
            .elf-current-trap.triggered {
                animation: trapExplode 0.5s ease;
            }
            
            .elf-current-trap.triggered .elf-trap-img {
                filter: brightness(1.5) hue-rotate(-20deg) drop-shadow(0 0 50px rgba(239, 68, 68, 0.9));
            }
            
            .elf-current-trap.triggered .elf-trap-question {
                color: #ef4444;
                text-shadow: 0 0 40px rgba(239, 68, 68, 1);
                font-size: 5rem;
            }
            
            @keyframes trapExplode {
                0% { transform: scale(1); }
                30% { transform: scale(1.2) rotate(-5deg); }
                60% { transform: scale(1.15) rotate(5deg); }
                100% { transform: scale(1); }
            }
            
            /* 결과 텍스트 */
            .elf-trap-result {
                margin-top: 20px;
                font-size: 1.8rem;
                font-weight: bold;
                letter-spacing: 0.1em;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
            }
            
            .elf-trap-result.safe {
                color: #22c55e;
                text-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
                opacity: 1;
                transform: translateY(0);
                animation: resultAppear 0.5s ease;
            }
            
            .elf-trap-result.danger {
                color: #ef4444;
                text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
                opacity: 1;
                transform: translateY(0);
                animation: resultAppear 0.5s ease;
            }
            
            @keyframes resultAppear {
                0% { opacity: 0; transform: translateY(30px) scale(0.5); }
                60% { transform: translateY(-5px) scale(1.1); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            
            /* 목적지: 궁수 */
            .elf-goal-section {
                position: relative;
                width: 200px;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
            }
            
            .elf-cage-wrapper {
                position: relative;
                width: 180px;
                height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .elf-cage-img {
                position: absolute;
                width: 200px;
                height: auto;
                z-index: 2;
                filter: drop-shadow(0 0 15px rgba(139, 115, 85, 0.5));
            }
            
            .elf-archer-sprite {
                width: 140px;
                height: auto;
                object-fit: contain;
                image-rendering: pixelated;
                filter: brightness(0.7) drop-shadow(0 0 10px rgba(34, 197, 94, 0.3));
                animation: archerTremble 0.15s linear infinite;
            }
            
            @keyframes archerTremble {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(2px); }
            }
            
            .elf-goal-label {
                margin-top: 15px;
                color: #22c55e;
                font-size: 1rem;
                text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            }
            
            /* 우측 포트레이트 영역 */
            .elf-portrait-area {
                position: fixed;
                right: 0;
                bottom: 0;
                width: 400px;
                height: 85%;
                z-index: 100;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                justify-content: flex-end;
                pointer-events: none;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.8s ease;
            }
            
            .elf-portrait-area.visible {
                opacity: 1;
                transform: translateX(0);
            }
            
            /* 말풍선 */
            .elf-speech-bubble {
                position: absolute;
                right: 320px;
                bottom: 55%;
                max-width: 350px;
                min-width: 200px;
                padding: 20px 25px;
                background: rgba(10, 20, 15, 0.95);
                border: 2px solid rgba(34, 197, 94, 0.6);
                border-radius: 15px;
                box-shadow: 
                    0 0 30px rgba(34, 197, 94, 0.3),
                    inset 0 0 20px rgba(34, 197, 94, 0.1);
                opacity: 0;
                transform: scale(0.8) translateX(20px);
                transition: all 0.4s ease;
            }
            
            .elf-speech-bubble.visible {
                opacity: 1;
                transform: scale(1) translateX(0);
            }
            
            .elf-speech-tail {
                position: absolute;
                right: -20px;
                bottom: 30px;
                width: 0;
                height: 0;
                border-left: 20px solid rgba(34, 197, 94, 0.6);
                border-top: 10px solid transparent;
                border-bottom: 10px solid transparent;
            }
            
            .elf-speech-tail::before {
                content: '';
                position: absolute;
                right: 3px;
                top: -8px;
                width: 0;
                height: 0;
                border-left: 17px solid rgba(10, 20, 15, 0.95);
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
            }
            
            .elf-speech-text {
                color: #a7f3d0;
                font-size: 1.15rem;
                line-height: 1.7;
                font-family: 'Noto Sans KR', sans-serif;
                text-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
                transition: opacity 0.15s ease;
            }
            
            /* 포트레이트 */
            .elf-portrait-wrapper {
                position: relative;
                width: 350px;
                height: 100%;
            }
            
            .elf-portrait-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: bottom right;
                filter: drop-shadow(0 0 30px rgba(34, 197, 94, 0.5));
                animation: elfPortraitIdle 3s ease-in-out infinite;
            }
            
            @keyframes elfPortraitIdle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .elf-portrait-img.speaking {
                animation: elfPortraitSpeak 0.15s ease-in-out infinite;
            }
            
            @keyframes elfPortraitSpeak {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-2px) scale(1.01); }
            }
            
            .elf-portrait-img.happy {
                filter: drop-shadow(0 0 40px rgba(34, 197, 94, 0.8)) brightness(1.1);
            }
            
            .elf-portrait-img.worried {
                filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.5)) brightness(0.9);
                animation: elfPortraitWorry 0.2s ease-in-out infinite;
            }
            
            @keyframes elfPortraitWorry {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-3px); }
                75% { transform: translateX(3px); }
            }
            
            .elf-portrait-glow {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 100%;
                height: 50%;
                background: radial-gradient(ellipse at bottom right, rgba(34, 197, 94, 0.3) 0%, transparent 70%);
                pointer-events: none;
            }
            
            /* 메인 보드 영역 */
            .elf-board {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px 50px;
                position: relative;
                z-index: 1;
            }
            
            
            /* 경로 보드 (가로 배열) */
            .elf-path-board {
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: flex-end;
                justify-content: center;
                gap: 5px;
                padding: 20px 30px 30px;
                background: 
                    linear-gradient(180deg, rgba(20, 15, 10, 0.95) 0%, rgba(30, 25, 20, 0.9) 100%);
                border: 2px solid rgba(139, 115, 85, 0.5);
                border-radius: 15px;
                position: relative;
                box-shadow: 
                    inset 0 0 50px rgba(0, 0, 0, 0.5),
                    0 0 30px rgba(0, 0, 0, 0.5);
            }
            
            /* 경로 연결선 - 제거 (타일이 이미 연결된 느낌) */
            .elf-path-board::before {
                display: none;
            }
            
            /* 주인공 토큰 */
            .elf-hero-token {
                width: 80px;
                height: 80px;
                z-index: 20;
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                flex-shrink: 0;
                position: relative;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            
            .elf-hero-token.jumping {
                animation: elfTokenJump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            @keyframes elfTokenJump {
                0% { 
                    transform: translateY(0) scale(1); 
                }
                15% { 
                    transform: translateY(3px) scale(0.95, 1.05); 
                }
                35% { 
                    transform: translateY(-25px) scale(1.05, 0.95); 
                }
                50% { 
                    transform: translateY(-30px) scale(1); 
                }
                70% { 
                    transform: translateY(-15px) scale(1); 
                }
                85% { 
                    transform: translateY(-5px) scale(0.98, 1.02); 
                }
                100% { 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .elf-token-sprite {
                width: 70px;
                height: 90px;
                object-fit: contain;
                object-position: bottom center;
                filter: drop-shadow(0 0 15px rgba(100, 150, 255, 0.6));
                animation: elfTokenIdle 2s ease-in-out infinite;
                image-rendering: pixelated;
                margin-bottom: -10px;
            }
            
            @keyframes elfTokenIdle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .elf-token-sprite.hit {
                animation: elfTokenHit 0.5s ease !important;
            }
            
            @keyframes elfTokenHit {
                0%, 100% { filter: drop-shadow(0 0 20px rgba(100, 150, 255, 0.7)); }
                25% { transform: translateX(-15px); filter: brightness(0.5) drop-shadow(0 0 25px rgba(255, 50, 50, 0.9)); }
                75% { transform: translateX(15px); filter: brightness(1.5); }
            }
            
            .elf-token-glow {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 20px;
                background: radial-gradient(ellipse at center, rgba(100, 150, 255, 0.4) 0%, transparent 70%);
                pointer-events: none;
            }
            
            /* 함정 슬롯 */
            .elf-trap-slot {
                width: 80px;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                position: relative;
                flex-shrink: 0;
                z-index: 10;
                margin: 0 -5px;
            }
            
            .elf-trap-tile {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: brightness(0.8) saturate(0.9);
                transition: all 0.3s;
            }
            
            .elf-trap-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            
            /* 함정 체크 중 */
            .elf-trap-slot.checking {
                animation: elfTrapShake 0.15s ease infinite;
                filter: drop-shadow(0 0 30px rgba(251, 191, 36, 1)) !important;
            }
            
            .elf-trap-slot.checking .elf-trap-tile {
                filter: brightness(1.4) saturate(1.3);
            }
            
            .elf-trap-slot.checking .elf-trap-icon {
                animation: elfTrapIconPulse 0.25s ease infinite;
                color: #fbbf24 !important;
                text-shadow: 0 0 20px #fbbf24, 0 0 40px #fbbf24;
                font-size: 2.2rem !important;
            }
            
            @keyframes elfTrapShake {
                0%, 100% { transform: translateX(0) rotate(0); }
                25% { transform: translateX(-3px) rotate(-2deg); }
                75% { transform: translateX(3px) rotate(2deg); }
            }
            
            @keyframes elfTrapIconPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.4); opacity: 1; }
            }
            
            /* 등장 애니메이션 */
            @keyframes elfTrapAppear {
                0% { 
                    opacity: 0; 
                    transform: translateY(-30px) scale(0.5); 
                }
                60% { 
                    opacity: 1; 
                    transform: translateY(5px) scale(1.05); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .elf-trap-slot.passed .elf-trap-tile {
                filter: brightness(1.2) saturate(0.7) hue-rotate(80deg);
            }
            
            .elf-trap-slot.passed {
                filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8));
                animation: elfTrapPassed 0.6s ease forwards;
            }
            
            @keyframes elfTrapPassed {
                0% { transform: scale(1); }
                30% { transform: scale(1.2) rotate(5deg); }
                60% { transform: scale(0.95) rotate(-3deg); }
                100% { transform: scale(1) rotate(0); }
            }
            
            .elf-trap-slot.passed .elf-trap-icon {
                color: #22c55e !important;
                animation: elfTrapIconSuccess 0.5s ease forwards;
            }
            
            @keyframes elfTrapIconSuccess {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                60% { transform: scale(1.3) rotate(20deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            .elf-trap-slot.triggered .elf-trap-tile {
                filter: brightness(1.5) saturate(1.5) hue-rotate(-20deg);
            }
            
            .elf-trap-slot.triggered {
                filter: drop-shadow(0 0 25px rgba(239, 68, 68, 1));
                animation: elfTrapTriggered 0.6s ease;
            }
            
            @keyframes elfTrapTriggered {
                0% { transform: scale(1) rotate(0); }
                15% { transform: scale(1.3) rotate(-10deg); }
                30% { transform: scale(1.2) rotate(10deg); }
                45% { transform: scale(1.25) rotate(-8deg); }
                60% { transform: scale(1.15) rotate(5deg); }
                80% { transform: scale(1.05) rotate(-2deg); }
                100% { transform: scale(1) rotate(0); }
            }
            
            .elf-trap-slot.triggered .elf-trap-icon {
                color: #ef4444 !important;
                animation: elfTrapIconDanger 0.4s ease forwards;
            }
            
            @keyframes elfTrapIconDanger {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 1; }
                100% { transform: scale(1.2); opacity: 1; }
            }
            
            .elf-trap-icon {
                font-size: 2rem;
                color: #fff;
                font-weight: bold;
                text-shadow: 
                    0 0 10px rgba(0, 0, 0, 0.9), 
                    0 2px 6px rgba(0, 0, 0, 0.7),
                    0 0 20px rgba(255, 255, 255, 0.3);
                transition: all 0.3s;
                font-weight: bold;
            }
            
            .elf-trap-icon.safe {
                color: #22c55e;
                text-shadow: 0 0 15px #22c55e, 0 0 30px rgba(34, 197, 94, 0.5);
                font-size: 2.2rem;
            }
            
            .elf-trap-icon.danger {
                color: #ef4444;
                text-shadow: 0 0 15px #ef4444, 0 0 30px rgba(239, 68, 68, 0.5);
                font-size: 2.2rem;
            }
            
            /* 함정 상태 */
            .elf-trap-status {
                position: absolute;
                bottom: 5px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.7rem;
                color: #888;
                white-space: nowrap;
            }
            
            /* 목적지: 궁수 - 아이소메트릭 */
            .elf-goal-point {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                z-index: 10;
                flex-shrink: 0;
                margin-left: 5px;
            }
            
            .elf-elf-wrapper {
                position: relative;
                width: 80px;
                height: 90px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            
            .elf-elf-sprite {
                width: 70px;
                height: auto;
                max-height: 85px;
                object-fit: contain;
                filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.5));
                transition: all 0.5s ease;
                z-index: 2;
                image-rendering: pixelated;
            }
            
            .elf-elf-sprite.trembling {
                animation: elfTremble 0.1s linear infinite;
            }
            
            @keyframes elfTremble {
                0% { transform: translate(-2px, 0); }
                50% { transform: translate(2px, 0); }
                100% { transform: translate(-2px, 0); }
            }
            
            .elf-elf-sprite.freed {
                animation: elfFreed 1s ease forwards;
            }
            
            @keyframes elfFreed {
                0% { transform: scale(0.9); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.5)); }
                50% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(34, 197, 94, 1)); }
                100% { transform: scale(1); filter: drop-shadow(0 0 30px rgba(34, 197, 94, 0.8)); }
            }
            
            .elf-elf-glow {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 100px;
                height: 30px;
                background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.4) 0%, transparent 70%);
            }
            
            .elf-elf-name {
                margin-top: 5px;
                color: #22c55e;
                font-size: 0.75rem;
                text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                white-space: nowrap;
            }
            
            /* 케이지 */
            .elf-cage {
                position: absolute;
                inset: -10px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3;
            }
            
            .elf-cage-img {
                width: 90px;
                height: auto;
                filter: drop-shadow(0 0 10px rgba(139, 115, 85, 0.5));
            }
            
            .elf-cage.breaking {
                animation: elfCageBreak 0.5s ease forwards;
            }
            
            @keyframes elfCageBreak {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.5; }
                100% { transform: scale(1.5); opacity: 0; }
            }
            
            .elf-trapped .elf-elf-sprite {
                filter: drop-shadow(0 0 10px rgba(139, 0, 0, 0.5)) brightness(0.7);
            }
            
            /* 진행도 */
            .elf-progress {
                text-align: center;
                color: #b8860b;
                font-size: 1rem;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 20px;
                border-radius: 5px;
                margin-top: 15px;
            }
            
            /* 버튼 영역 */
            .elf-buttons {
                position: absolute;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 20px;
                z-index: 200;
                opacity: 0;
                transition: all 0.5s ease;
            }
            
            .elf-buttons.visible {
                opacity: 1;
            }
            
            /* 함정 경고 문구 */
            .elf-trap-warning {
                width: 100%;
                text-align: center;
                color: #f59e0b;
                font-size: 0.9rem;
                margin-bottom: 15px;
                padding: 8px 15px;
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 5px;
                animation: warningPulse 2s ease-in-out infinite;
            }
            
            .elf-trap-warning .warning-damage {
                color: #ef4444;
                font-weight: bold;
                text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
            }
            
            @keyframes warningPulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; border-color: rgba(245, 158, 11, 0.6); }
            }
            
            .elf-btn-row {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            
            .elf-btn {
                padding: 15px 40px;
                font-size: 1.1rem;
                font-family: 'Cinzel', serif;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .elf-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .elf-btn-advance {
                background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
            }
            
            .elf-btn-advance:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(34, 197, 94, 0.6);
            }
            
            .elf-btn-giveup {
                background: rgba(80, 30, 30, 0.8);
                color: #aaa;
                border: 1px solid rgba(139, 69, 69, 0.5);
            }
            
            .elf-btn-giveup:hover {
                background: rgba(100, 40, 40, 0.8);
                color: #ccc;
                border-color: rgba(180, 80, 80, 0.6);
            }
            
            .elf-btn-confirm {
                background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            }
            
            .elf-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
            }
            
            /* 결과 오버레이 */
            .elf-result-overlay {
                position: fixed;
                inset: 0;
                background: linear-gradient(180deg, rgba(10, 15, 10, 0.98) 0%, rgba(5, 10, 5, 0.99) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.5s ease;
                z-index: 10000;
            }
            
            .elf-result-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .elf-result-content {
                text-align: center;
                padding: 50px 60px;
                background: rgba(20, 25, 20, 0.9);
                border: 2px solid rgba(34, 197, 94, 0.3);
                border-radius: 20px;
                box-shadow: 
                    0 0 60px rgba(34, 197, 94, 0.2),
                    inset 0 0 30px rgba(0, 0, 0, 0.5);
                max-width: 500px;
            }
            
            .elf-result-title {
                font-family: 'Cinzel', serif;
                font-size: 2.8rem;
                font-weight: bold;
                color: #22c55e;
                text-shadow: 
                    0 0 30px rgba(34, 197, 94, 0.8),
                    0 2px 4px rgba(0, 0, 0, 0.8);
                margin-bottom: 25px;
                letter-spacing: 3px;
            }
            
            .elf-result-title.elf-fail {
                color: #ef4444;
                text-shadow: 
                    0 0 30px rgba(239, 68, 68, 0.8),
                    0 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .elf-result-title.elf-giveup {
                color: #6b7280;
                text-shadow: 
                    0 0 20px rgba(100, 100, 100, 0.5),
                    0 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .elf-result-sub {
                font-size: 0.9rem;
                color: #666;
                display: block;
                margin-top: 10px;
            }
            
            .elf-result-icon {
                font-size: 5rem;
                margin-bottom: 25px;
                filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.5));
            }
            
            .elf-result-text {
                color: #a7f3d0;
                font-size: 1.3rem;
                margin-bottom: 25px;
                line-height: 1.6;
            }
            
            .elf-result-stats {
                display: flex;
                gap: 40px;
                justify-content: center;
                margin-bottom: 30px;
                padding: 15px 25px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }
            
            .elf-stat {
                color: #9ca3af;
                font-size: 1rem;
            }
            
            .elf-stat span {
                color: #fbbf24;
                font-weight: bold;
            }
            
            /* 조력자 프리뷰 */
            .elf-ally-preview {
                display: flex;
                align-items: center;
                gap: 25px;
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
                border: 2px solid rgba(34, 197, 94, 0.4);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 35px;
            }
            
            .elf-ally-img {
                width: 90px;
                height: 90px;
                object-fit: contain;
                filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.6));
                image-rendering: pixelated;
            }
            
            .elf-ally-info {
                text-align: left;
            }
            
            .elf-ally-name {
                color: #22c55e;
                font-size: 1.4rem;
                font-weight: bold;
                margin-bottom: 8px;
                text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            }
            
            .elf-ally-desc {
                color: #9ca3af;
                font-size: 1rem;
                line-height: 1.4;
            }
            
            /* 데미지 팝업 */
            .elf-damage-popup {
                position: fixed;
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                font-weight: bold;
                color: #ef4444;
                text-shadow: 
                    0 0 20px #ef4444,
                    0 0 40px #ef4444,
                    2px 2px 4px rgba(0, 0, 0, 0.9),
                    -2px -2px 4px rgba(0, 0, 0, 0.9);
                pointer-events: none;
                z-index: 100000;
                transform: translateX(-50%);
                animation: elfDamagePopup 1.2s ease-out forwards;
            }
            
            @keyframes elfDamagePopup {
                0% { 
                    transform: translateX(-50%) translateY(0) scale(0.5); 
                    opacity: 0; 
                }
                20% { 
                    transform: translateX(-50%) translateY(-10px) scale(1.3); 
                    opacity: 1; 
                }
                40% { 
                    transform: translateX(-50%) translateY(-20px) scale(1); 
                }
                100% { 
                    transform: translateX(-50%) translateY(-80px) scale(0.8); 
                    opacity: 0; 
                }
            }
            
            /* 반응형 */
            @media (max-width: 900px) {
                .elf-main {
                    flex-direction: column;
                    padding: 30px;
                    gap: 20px;
                }
                
                .elf-hero-side, .elf-elf-side {
                    flex-direction: row;
                    gap: 20px;
                }
                
                .elf-character-wrapper {
                    width: 150px;
                    height: 200px;
                }
                
                .elf-hero-sprite, .elf-elf-sprite {
                    width: 120px;
                }
                
                .elf-path {
                    gap: 10px;
                }
                
                .elf-trap-slot {
                    width: 60px;
                    height: 60px;
                }
                
                .elf-trap-icon {
                    font-size: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 노출
window.ElfRescueEvent = ElfRescueEvent;

console.log('[ElfRescueEvent] Loaded');


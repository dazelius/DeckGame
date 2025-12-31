// ==========================================
// 골드 시스템 (영구 저장 + 던전 골드)
// ==========================================
const GoldSystem = {
    storageKey: 'lordofnight_gold',
    dungeonGold: 0,  // 던전에서 획득한 골드 (탈출해야 영구 저장)
    isInDungeon: false,  // 던전 진행 중 여부
    
    // 영구 골드 가져오기
    getGold() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? parseInt(saved, 10) : 0;
    },
    
    // 던전 골드 가져오기
    getDungeonGold() {
        return this.dungeonGold;
    },
    
    // 현재 표시용 총 골드 (영구 + 던전)
    getTotalGold() {
        return this.getGold() + this.dungeonGold;
    },
    
    // 영구 골드 설정
    setGold(amount) {
        localStorage.setItem(this.storageKey, Math.max(0, amount).toString());
        this.updateDisplay();
    },
    
    // 골드 추가 (던전 중이면 던전 골드로, 아니면 영구 골드로)
    addGold(amount) {
        if (this.isInDungeon) {
            this.dungeonGold += amount;
            console.log(`[Gold] 던전 골드 +${amount} (현재: ${this.dungeonGold})`);
            this.updateDisplay();
            this.showDungeonGoldPopup(amount);
            return this.getTotalGold();
        } else {
            const current = this.getGold();
            this.setGold(current + amount);
            return current + amount;
        }
    },
    
    // 골드 사용 (영구 골드에서 차감)
    spendGold(amount) {
        const current = this.getGold();
        if (current >= amount) {
            this.setGold(current - amount);
            return true;
        }
        return false;
    },
    
    // 현재 상황에 맞게 골드 사용 (던전 중이면 총 골드에서 차감)
    useGold(amount) {
        const total = this.getTotalGold();
        if (total < amount) {
            console.log(`[Gold] 골드 부족! 필요: ${amount}, 보유: ${total}`);
            return false;
        }
        
        if (this.isInDungeon) {
            // 던전 중: 던전 골드에서 먼저 차감
            if (this.dungeonGold >= amount) {
                this.dungeonGold -= amount;
            } else {
                // 던전 골드가 부족하면 영구 골드에서도 차감
                const remainder = amount - this.dungeonGold;
                this.dungeonGold = 0;
                this.setGold(this.getGold() - remainder);
            }
        } else {
            // 던전 밖: 영구 골드에서 차감
            this.setGold(this.getGold() - amount);
        }
        
        console.log(`[Gold] 골드 사용 -${amount} (남은 총: ${this.getTotalGold()})`);
        this.updateDisplay();
        return true;
    },
    
    // 던전 시작
    enterDungeon() {
        this.isInDungeon = true;
        this.dungeonGold = 0;
        console.log('[Gold] 던전 진입 - 던전 골드 초기화');
        this.updateDisplay();
    },
    
    // 던전 탈출 성공 (골드 영구 저장)
    escapeDungeon() {
        if (this.dungeonGold > 0) {
            const earned = this.dungeonGold;
            const current = this.getGold();
            this.setGold(current + earned);
            console.log(`[Gold] 던전 탈출! 골드 ${earned} 영구 저장 (총: ${this.getGold()})`);
        }
        this.dungeonGold = 0;
        this.isInDungeon = false;
        this.updateDisplay();
    },
    
    // 던전에서 사망 (던전 골드 상실)
    dieInDungeon() {
        const lost = this.dungeonGold;
        if (lost > 0) {
            console.log(`[Gold] 던전에서 사망! 골드 ${lost} 상실!`);
            this.showGoldLostMessage(lost);
        }
        this.dungeonGold = 0;
        this.isInDungeon = false;
        this.updateDisplay();
    },
    
    // 던전 골드 획득 팝업
    showDungeonGoldPopup(amount) {
        // 맵 UI의 골드 표시에 효과
        const goldDisplay = document.getElementById('map-gold');
        if (goldDisplay) {
            goldDisplay.classList.add('gold-earned');
            setTimeout(() => goldDisplay.classList.remove('gold-earned'), 500);
        }
    },
    
    // 골드 상실 메시지
    showGoldLostMessage(amount) {
        const msg = document.createElement('div');
        msg.className = 'gold-lost-message';
        msg.innerHTML = `<span class="lost-icon">💀</span> 골드 ${amount} 상실!`;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ef4444;
            padding: 20px 40px;
            border-radius: 10px;
            border: 2px solid #ef4444;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10000;
            animation: goldLostPop 0.5s ease-out;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2500);
    },
    
    // UI 업데이트
    updateDisplay() {
        // 영구 골드 표시 (타이틀, 마을)
        const displays = document.querySelectorAll('.gold-display-value');
        displays.forEach(el => {
            el.textContent = this.getGold().toLocaleString();
        });
        
        // 던전 골드 표시 (맵 UI)
        const dungeonGoldEl = document.getElementById('map-gold');
        if (dungeonGoldEl) {
            if (this.isInDungeon) {
                dungeonGoldEl.textContent = this.dungeonGold;
                dungeonGoldEl.title = `던전 골드: ${this.dungeonGold} (탈출 시 획득)`;
            } else {
                dungeonGoldEl.textContent = this.getGold();
            }
        }
    }
};

// ==========================================
// 타이틀 화면 시스템
// ==========================================

const TitleSystem = {
    // 초기화
    init() {
        this.createTitleScreen();
        this.showTitle();
        GoldSystem.updateDisplay();
        
        // 🖼️ 이미지 프리로드 시작
        this.startImagePreload();
    },
    
    // 이미지 프리로드 (LoadingScreen에서 처리)
    startImagePreload() {
        // LoadingScreen이 이미지 프리로딩을 처리하므로 여기서는 스킵
        if (typeof LoadingScreen !== 'undefined' && LoadingScreen.isComplete) {
            console.log('[TitleSystem] LoadingScreen에서 이미 로딩 완료됨');
            return;
        }
        
        // LoadingScreen이 없는 경우에만 직접 프리로드
        if (typeof LoadingScreen === 'undefined' && typeof ImagePreloader !== 'undefined') {
            console.log('[TitleSystem] LoadingScreen 없음 - 직접 프리로드');
            ImagePreloader.preload(
                (loaded, total) => {
                    console.log(`[TitleSystem] 로딩 ${loaded}/${total}`);
                },
                () => {
                    console.log('[TitleSystem] ✅ 모든 이미지 프리로드 완료!');
                }
            );
        }
    },
    
    // 타이틀 화면 생성
    createTitleScreen() {
        // 다크소울 스타일 주입
        this.injectTitleStyles();
        
        const titleScreen = document.createElement('div');
        titleScreen.id = 'title-screen';
        titleScreen.className = 'ds-title';
        
        titleScreen.innerHTML = `
            <div class="ds-title-bg">
                <div class="ds-title-embers"></div>
                <div class="ds-title-vignette"></div>
            </div>
            
            <!-- 골드 표시 -->
            <div class="ds-gold-display">
                <span class="ds-gold-icon">✦</span>
                <span class="gold-display-value">${GoldSystem.getGold().toLocaleString()}</span>
            </div>
            
            <!-- 데이터 초기화 버튼 -->
            <button class="ds-reset-btn" id="reset-data-btn" title="데이터 초기화">✕</button>
            
            <div class="ds-title-content">
                <!-- 타이틀 텍스트 -->
                <div class="ds-game-title">
                    <div class="ds-title-text">PROJECT</div>
                    <div class="ds-title-text main">DDoo</div>
                </div>
                
                <!-- 로고 이미지 -->
                <div class="ds-logo-wrapper">
                    <div class="ds-logo-aura"></div>
                    <img src="logo.png" alt="Project DDoo" class="ds-logo-img">
                </div>
                
                <div class="ds-subtitle">TEST VERSION</div>
                
                <!-- 메뉴 버튼 -->
                <div class="ds-menu">
                    <button class="ds-menu-btn" id="title-start-btn">
                        <span class="ds-btn-line"></span>
                        <span class="ds-btn-text">게임 시작</span>
                        <span class="ds-btn-line"></span>
                    </button>
                    <button class="ds-menu-btn continue-btn hidden" id="title-continue-btn">
                        <span class="ds-btn-line"></span>
                        <span class="ds-btn-text">이어하기</span>
                        <span class="ds-btn-sub"></span>
                        <span class="ds-btn-line"></span>
                    </button>
                    <button class="ds-menu-btn secondary" id="title-test-btn">
                        <span class="ds-btn-line"></span>
                        <span class="ds-btn-text">전투 테스트</span>
                        <span class="ds-btn-line"></span>
                    </button>
                </div>
                
                <div class="ds-version">v0.1.0</div>
            </div>
        `;
        
        document.body.insertBefore(titleScreen, document.body.firstChild);
        
        // 불씨 파티클 생성
        this.createEmbers();
        
        // 이벤트 리스너
        document.getElementById('title-start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 이어하기 버튼
        document.getElementById('title-continue-btn').addEventListener('click', () => {
            this.continueGame();
        });
        
        // 전투 테스트 버튼
        document.getElementById('title-test-btn').addEventListener('click', () => {
            this.startBattleTest();
        });
        
        // 데이터 초기화 버튼
        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.resetAllData();
        });
        
        // 저장 데이터 확인 후 이어하기 버튼 표시
        this.checkSaveData();
    },
    
    // 저장 데이터 확인
    checkSaveData() {
        if (typeof SaveSystem === 'undefined') {
            setTimeout(() => this.checkSaveData(), 100);
            return;
        }
        
        const continueBtn = document.getElementById('title-continue-btn');
        if (!continueBtn) return;
        
        if (SaveSystem.hasSave()) {
            const summary = SaveSystem.getSaveSummary();
            if (summary) {
                continueBtn.classList.remove('hidden');
                const subText = continueBtn.querySelector('.ds-btn-sub');
                if (subText) {
                    subText.textContent = `B${summary.floor}F · ${summary.timeString}`;
                }
            }
        }
    },
    
    // 이어하기
    continueGame() {
        if (typeof SaveSystem === 'undefined' || !SaveSystem.hasSave()) {
            console.log('[Title] 저장 데이터 없음');
            return;
        }
        
        // 버튼 비활성화
        const continueBtn = document.getElementById('title-continue-btn');
        if (continueBtn) {
            continueBtn.disabled = true;
            continueBtn.classList.add('loading');
        }
        
        // 페이드 아웃 후 게임 복원
        setTimeout(() => {
            this.hideTitle();
            
            setTimeout(() => {
                SaveSystem.continueGame();
            }, 300);
        }, 200);
    },
    
    // 다크소울 스타일 CSS 주입
    injectTitleStyles() {
        if (document.getElementById('ds-title-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ds-title-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
            
            .ds-title {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                font-family: 'Cinzel', serif;
                background: #0a0806;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .ds-title.visible {
                display: flex;
                opacity: 1;
            }
            
            .ds-title-bg {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, #1a1410 0%, #0a0806 100%);
            }
            
            .ds-title-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%);
                pointer-events: none;
            }
            
            .ds-title-embers {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
            }
            
            .ds-ember {
                position: absolute;
                width: 3px;
                height: 3px;
                background: radial-gradient(circle, #d4af37 0%, #8b6914 50%, transparent 100%);
                border-radius: 50%;
                animation: emberFloat var(--duration) ease-in-out infinite;
                animation-delay: var(--delay);
                opacity: 0;
            }
            
            @keyframes emberFloat {
                0% { opacity: 0; transform: translateY(100vh) scale(0.5); }
                10% { opacity: 0.8; }
                90% { opacity: 0.6; }
                100% { opacity: 0; transform: translateY(-20vh) scale(0); }
            }
            
            .ds-title-content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            /* 타이틀 텍스트 */
            .ds-game-title {
                text-align: center;
                margin-bottom: 10px;
            }
            
            .ds-title-text {
                font-family: 'Cinzel', serif;
                font-weight: 400;
                color: #6b5b45;
                letter-spacing: 0.5em;
                font-size: 1rem;
                text-transform: uppercase;
            }
            
            .ds-title-text.main {
                font-size: 3.5rem;
                font-weight: 700;
                color: #d4af37;
                letter-spacing: 0.15em;
                text-shadow: 
                    0 0 40px rgba(212, 175, 55, 0.4),
                    0 0 80px rgba(212, 175, 55, 0.2),
                    0 2px 0 #8b6914,
                    0 4px 0 #5a4510;
                animation: titleGlow 3s ease-in-out infinite alternate;
                margin-top: 5px;
            }
            
            @keyframes titleGlow {
                from {
                    text-shadow: 
                        0 0 40px rgba(212, 175, 55, 0.4),
                        0 0 80px rgba(212, 175, 55, 0.2),
                        0 2px 0 #8b6914,
                        0 4px 0 #5a4510;
                }
                to {
                    text-shadow: 
                        0 0 60px rgba(212, 175, 55, 0.6),
                        0 0 100px rgba(212, 175, 55, 0.3),
                        0 2px 0 #8b6914,
                        0 4px 0 #5a4510;
                }
            }
            
            /* 로고 */
            .ds-logo-wrapper {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .ds-logo-aura {
                position: absolute;
                width: 120%;
                height: 120%;
                background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.15) 0%, transparent 60%);
                animation: logoAura 4s ease-in-out infinite;
            }
            
            @keyframes logoAura {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }
            
            .ds-logo-img {
                max-width: 450px;
                width: 70vw;
                height: auto;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
            }
            
            .ds-subtitle {
                font-size: 0.85rem;
                color: #6b5b45;
                letter-spacing: 0.4em;
            }
            
            /* 메뉴 */
            .ds-menu {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 20px !important;
                margin-top: 30px !important;
                position: relative !important;
            }
            
            .ds-menu-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 15px !important;
                padding: 15px 40px !important;
                background: transparent !important;
                border: none !important;
                cursor: pointer !important;
                position: relative !important;
                transition: all 0.3s ease !important;
            }
            
            .ds-menu-btn:hover {
                transform: scale(1.05);
            }
            
            .ds-menu-btn:hover .ds-btn-text {
                color: #d4af37;
                text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
            }
            
            .ds-menu-btn:hover .ds-btn-line {
                background: #d4af37;
                width: 50px;
            }
            
            .ds-btn-line {
                display: inline-block !important;
                width: 30px !important;
                height: 1px !important;
                background: #4a4035 !important;
                flex-shrink: 0 !important;
                transition: all 0.3s ease !important;
            }
            
            .ds-btn-text {
                display: inline-block !important;
                font-family: 'Cinzel', serif !important;
                font-size: 1.1rem !important;
                font-weight: 500 !important;
                color: #8b7355 !important;
                letter-spacing: 0.1em !important;
                white-space: nowrap !important;
                transition: all 0.3s ease !important;
            }
            
            .ds-menu-btn.secondary .ds-btn-text {
                font-size: 0.95rem !important;
                color: #5a4a3a !important;
            }
            
            .ds-menu-btn.secondary:hover .ds-btn-text {
                color: #a89070;
            }
            
            /* 이어하기 버튼 */
            .ds-menu-btn.continue-btn {
                background: rgba(212, 175, 55, 0.1);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 4px;
            }
            
            .ds-menu-btn.continue-btn .ds-btn-text {
                color: #d4af37 !important;
            }
            
            .ds-menu-btn.continue-btn .ds-btn-sub {
                display: block;
                font-size: 0.7rem !important;
                color: #666 !important;
                margin-top: 2px;
            }
            
            .ds-menu-btn.continue-btn:hover {
                background: rgba(212, 175, 55, 0.2);
                border-color: #d4af37;
            }
            
            .ds-menu-btn.continue-btn.hidden {
                display: none !important;
            }
            
            .ds-version {
                font-size: 0.7rem;
                color: #3a3025;
                letter-spacing: 0.2em;
                margin-top: 40px;
            }
            
            /* 골드 표시 */
            .ds-gold-display {
                position: absolute;
                top: 25px;
                right: 25px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: 'Cinzel', serif;
                z-index: 10;
            }
            
            .ds-gold-icon {
                color: #d4af37;
                font-size: 1rem;
            }
            
            .ds-gold-display .gold-display-value {
                color: #d4af37;
                font-size: 1rem;
                font-weight: 600;
            }
            
            /* 리셋 버튼 */
            .ds-reset-btn {
                position: absolute;
                top: 25px;
                left: 25px;
                width: 36px;
                height: 36px;
                background: transparent;
                border: 1px solid #2a2520;
                border-radius: 50%;
                color: #4a4035;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
            }
            
            .ds-reset-btn:hover {
                border-color: #6b4040;
                color: #a05050;
            }
            
            /* 페이드 아웃 */
            .ds-title.fade-out {
                animation: titleFadeOut 0.6s ease-out forwards;
            }
            
            @keyframes titleFadeOut {
                to { opacity: 0; }
            }
            
            /* 반응형 */
            @media (max-width: 768px) {
                .ds-title-text.main { font-size: 2.5rem; }
                .ds-title-text { font-size: 0.8rem; }
                .ds-logo-img { max-width: 280px; }
                .ds-btn-text { font-size: 0.95rem; }
                .ds-menu-btn { padding: 10px 25px; }
            }
        `;
        document.head.appendChild(style);
    },
    
    // 불씨 파티클 생성
    createEmbers() {
        const container = document.querySelector('.ds-title-embers');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const ember = document.createElement('div');
            ember.className = 'ds-ember';
            ember.style.cssText = `
                left: ${Math.random() * 100}%;
                --delay: ${Math.random() * 8}s;
                --duration: ${6 + Math.random() * 6}s;
            `;
            container.appendChild(ember);
        }
    },
    
    // 모든 로컬 데이터 초기화
    resetAllData() {
        if (confirm('정말로 모든 데이터를 초기화하시겠습니까?\n\n• 골드\n• 캐릭터 업그레이드\n• 카드 강화 (덱)\n• 구출한 NPC\n• 직업 (전사로 초기화)\n\n이 작업은 되돌릴 수 없습니다!')) {
            // 골드 초기화
            localStorage.removeItem('lordofnight_gold');
            
            // 캐릭터 업그레이드 초기화
            localStorage.removeItem('lordofnight_upgrades');
            
            // 카드 강화 (덱) 초기화
            localStorage.removeItem('lordofnight_player_deck');
            
            // 구출 데이터 초기화
            localStorage.removeItem('lordofnight_rescued');
            
            // 직업 데이터 초기화 (전사로 설정)
            localStorage.removeItem('shadowDeck_jobs');
            localStorage.removeItem('lordofnight_player_sprite');
            localStorage.removeItem('lordofnight_slash_sprite');
            
            // 전사 직업으로 설정
            const warriorJobData = {
                currentJob: 'warrior',
                unlockedJobs: ['warrior', 'knight', 'mage', 'ranger', 'ninja']
            };
            localStorage.setItem('shadowDeck_jobs', JSON.stringify(warriorJobData));
            localStorage.setItem('lordofnight_player_sprite', 'hero.png');
            localStorage.setItem('lordofnight_slash_sprite', 'hero_slash.png');
            
            // PlayerBaseStats 리셋
            if (typeof PlayerBaseStats !== 'undefined') {
                PlayerBaseStats.resetUpgrades();
            }
            
            // JobSystem 리셋
            if (typeof JobSystem !== 'undefined') {
                JobSystem.currentJob = 'warrior';
                // 전사 스타터 덱 저장
                const warriorDeck = JobSystem.getStarterDeck('warrior');
                if (warriorDeck && warriorDeck.length > 0) {
                    localStorage.setItem('lordofnight_player_deck', JSON.stringify(warriorDeck));
                }
            }
            
            // UI 업데이트
            GoldSystem.updateDisplay();
            
            alert('데이터가 초기화되었습니다!\n직업: 전사');
            
            // 페이지 새로고침
            location.reload();
        }
    },
    
    // 파티클 생성 (레거시 - createEmbers로 대체됨)
    createParticles() {
        // 다크소울 테마에서는 createEmbers() 사용
    },
    
    // 타이틀 표시
    showTitle() {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.style.display = 'flex';
            titleScreen.classList.add('visible');
        }
        
        // 게임 컨테이너 숨김
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // 맵 화면 숨김
        const mapScreen = document.getElementById('map-screen');
        if (mapScreen) {
            mapScreen.style.display = 'none';
        }
        
        // TopBar 숨김 (타이틀에서는 불필요)
        if (typeof TopBar !== 'undefined') {
            TopBar.hide();
            document.body.classList.remove('has-topbar');
        }
    },
    
    // 타이틀 숨김
    hideTitle() {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.classList.add('fade-out');
            setTimeout(() => {
                titleScreen.style.display = 'none';
                titleScreen.classList.remove('visible', 'fade-out');
            }, 500);
        }
    },
    
    // 게임 시작 → 마을로 이동
    startGame() {
        // 버튼 비활성화 (중복 클릭 방지)
        const startBtn = document.getElementById('title-start-btn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add('loading');
        }
        
        // 페이드 아웃 후 마을로
        setTimeout(() => {
            this.hideTitle();
            
            // 마을 표시 (인트로 포함)
            setTimeout(() => {
                if (typeof TownSystem !== 'undefined') {
                    TownSystem.showWithIntro(false);
                }
            }, 300);
        }, 200);
    },
    
    // 시작 유물 선택 화면
    showStarterRelicSelection() {
        // 선택 가능한 시작 유물 (3개 랜덤)
        const starterRelics = this.getRandomStarterRelics(3);
        
        const modal = document.createElement('div');
        modal.id = 'starter-relic-modal';
        modal.className = 'starter-relic-modal';
        
        modal.innerHTML = `
            <div class="starter-relic-content">
                <div class="starter-relic-header">
                    <div class="starter-glow"></div>
                    <div class="starter-hero">
                        <img src="hero.png" alt="용사" class="starter-hero-img">
                    </div>
                    <h1 class="starter-title">유물 선택</h1>
                    <p class="starter-subtitle">여정에 함께할 유물을 선택하십시오.</p>
                </div>
                
                <div class="starter-relic-choices">
                    ${starterRelics.map((relic, index) => `
                        <div class="starter-relic-card" data-relic-id="${relic.id}" style="animation-delay: ${index * 0.15}s">
                            <div class="relic-card-glow" style="--relic-color: ${this.getRelicColor(relic.rarity)}"></div>
                            <div class="relic-card-icon">${relic.icon}</div>
                            <div class="relic-card-name">${relic.name}</div>
                            <div class="relic-card-rarity ${relic.rarity}">${this.getRelicRarityName(relic.rarity)}</div>
                            <div class="relic-card-desc">${relic.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
        
        // 유물 선택 이벤트
        modal.querySelectorAll('.starter-relic-card').forEach(card => {
            card.addEventListener('click', () => {
                const relicId = card.dataset.relicId;
                this.selectStarterRelic(relicId, modal);
            });
            
            // 호버 효과
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    },
    
    // 시작 유물 3개 랜덤 선택 (relicDatabase에서 가져옴)
    getRandomStarterRelics(count) {
        // relicDatabase에서 유물 정보 가져오기
        if (typeof relicDatabase === 'undefined') {
            console.error('[Title] relicDatabase를 찾을 수 없습니다!');
            return [];
        }
        
        // 선택 가능한 시작 유물 목록 (relicDatabase의 ID 사용)
        const starterRelicIds = [
            'relentlessAttack',  // 거침없는 공격
            'ironHeart',         // 강철 심장
            'vampireFang',       // 흡혈의 송곳니
            'energyCrystal',     // 에너지 결정
            'ancientCrown',      // 고대의 왕관
            'phoenixFeather'     // 불사조 깃털
        ];
        
        // relicDatabase에서 유물 정보 가져오기
        const allRelics = starterRelicIds
            .filter(id => relicDatabase[id])
            .map(id => relicDatabase[id]);
        
        // 셔플 후 count개 선택
        const shuffled = [...allRelics].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },
    
    // 유물 희귀도 색상
    getRelicColor(rarity) {
        const colors = {
            starter: '#22c55e',
            common: '#9ca3af',
            uncommon: '#3b82f6',
            rare: '#fbbf24'
        };
        return colors[rarity] || '#9ca3af';
    },
    
    // 유물 희귀도 이름
    getRelicRarityName(rarity) {
        const names = {
            starter: '시작',
            common: '일반',
            uncommon: '고급',
            rare: '희귀'
        };
        return names[rarity] || rarity;
    },
    
    // 시작 유물 선택 완료
    selectStarterRelic(relicId, modal) {
        // 선택된 카드 강조
        const selectedCard = modal.querySelector(`[data-relic-id="${relicId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            // 다른 카드 페이드 아웃
            modal.querySelectorAll('.starter-relic-card').forEach(card => {
                if (card !== selectedCard) {
                    card.classList.add('not-selected');
                }
            });
        }
        
        // 유물 획득
        setTimeout(() => {
            if (typeof RelicSystem !== 'undefined') {
                RelicSystem.addRelic(relicId);
            }
            
            // 모달 닫기
            modal.classList.add('closing');
            
            setTimeout(() => {
                modal.remove();
                
                // 맵 시스템 시작
                if (typeof MapSystem !== 'undefined') {
                    MapSystem.startGame();
                }
            }, 500);
        }, 800);
    },
    
    // 전투 테스트 (MapSystem의 몬스터 테스트 메뉴 사용)
    startBattleTest() {
        // 타이틀 숨기기
        this.hideTitle();
        
        setTimeout(() => {
            // MapSystem의 몬스터 테스트 메뉴 표시
            if (typeof MapSystem !== 'undefined' && MapSystem.showMonsterTestMenu) {
                MapSystem.showMonsterTestMenu();
            } else {
                // MapSystem이 없으면 직접 구현
                this.showBattleTestModal();
            }
        }, 300);
    },
    
    // 자체 전투 테스트 모달 (MapSystem 없을 때 사용)
    showBattleTestModal() {
        // 모든 몬스터 목록 가져오기
        const allMonsters = [
            { category: '일반 몬스터', monsters: typeof enemyDatabase !== 'undefined' ? enemyDatabase.filter(e => !e.isSplitForm) : [] },
            { category: '엘리트 몬스터', monsters: typeof eliteDatabase !== 'undefined' ? eliteDatabase : [] },
            { category: '보스 몬스터', monsters: typeof bossDatabase !== 'undefined' ? bossDatabase : [] }
        ];
        
        // 다중 적 프리셋
        const multiEnemyPresets = [
            { name: '고블린 습격', monsters: ['goblinRogue', 'goblinRogue', 'goblinArcher'], type: 'normal', icon: '👺👺🏹' },
            { name: '고블린 주술단', monsters: ['goblinShaman', 'goblinRogue', 'goblinArcher'], type: 'normal', icon: '🧙‍♂️👺🏹' },
            { name: '슬라임 웨이브', monsters: ['shadowSlime', 'shadowSlime', 'shadowSlime'], type: 'normal', icon: '🟢🟢🟢' },
            { name: '혼합 무리', monsters: ['goblinRogue', 'shadowSlime', 'skeletonWarrior'], type: 'normal', icon: '👹🟢💀' },
            { name: '해골 부대', monsters: ['skeletonWarrior', 'skeletonWarrior'], type: 'normal', icon: '💀💀' },
            { name: '야수 팩', monsters: ['direWolf', 'direWolf', 'direWolf'], type: 'normal', icon: '🐺🐺🐺' },
            { name: '독거미 둥지', monsters: ['poisonSpider', 'poisonSpider'], type: 'normal', icon: '🕷️🕷️' },
            { name: '불꽃 군단', monsters: ['fireElemental', 'fireElemental', 'fireElemental'], type: 'normal', icon: '🔥🔥🔥' },
            { name: '엘리트 도전', monsters: ['thornGuardian', 'doppelganger'], type: 'elite', icon: '⭐⭐' },
            { name: '거미 여왕 보스', monsters: ['spiderQueen'], type: 'boss', icon: '🕷️👑' },
            { name: '고블린 왕 보스', monsters: ['goblinKing'], type: 'boss', icon: '👺👑' },
            { name: '화염왕 보스', monsters: ['fireKing'], type: 'boss', icon: '🔥👑' },
        ];
        
        let monstersHtml = '';
        
        // === 다중 적 프리셋 섹션 ===
        monstersHtml += `
            <div class="test-category multi-enemy-section">
                <h3 class="category-title">⚔️ 다중 적 전투</h3>
                <div class="monster-list preset-list">
        `;
        
        multiEnemyPresets.forEach((preset, idx) => {
            monstersHtml += `
                <button class="monster-test-btn multi-preset" 
                        data-preset-idx="${idx}">
                    <span class="monster-icon">${preset.icon}</span>
                    <span class="monster-name">${preset.name}</span>
                    <span class="monster-hp">${preset.monsters.length}마리</span>
                </button>
            `;
        });
        
        monstersHtml += `</div></div>`;
        
        // === 커스텀 다중 적 섹션 ===
        monstersHtml += `
            <div class="test-category custom-multi-section">
                <h3 class="category-title">🎮 커스텀 다중 적</h3>
                <div class="custom-multi-controls">
                    <select id="custom-monster-select" class="custom-select">
                        <option value="">-- 몬스터 선택 --</option>
        `;
        
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            monstersHtml += `<optgroup label="${category.category}">`;
            category.monsters.forEach(m => {
                monstersHtml += `<option value="${m.id}">${m.name} (HP: ${m.maxHp})</option>`;
            });
            monstersHtml += `</optgroup>`;
        });
        
        monstersHtml += `
                    </select>
                    <button class="add-monster-btn" id="add-monster-btn">+ 추가</button>
                </div>
                <div class="selected-monsters" id="selected-monsters">
                    <span class="placeholder">몬스터를 추가하세요 (최대 5마리)</span>
                </div>
                <button class="start-custom-btn" id="start-custom-battle" disabled>
                    🗡️ 커스텀 전투 시작
                </button>
            </div>
        `;
        
        // === 단일 몬스터 섹션 ===
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            
            monstersHtml += `<div class="test-category">
                <h3 class="category-title">${category.category}</h3>
                <div class="monster-list">`;
            
            category.monsters.forEach(m => {
                const isBoss = category.category === '보스 몬스터';
                const isElite = category.category === '엘리트 몬스터';
                monstersHtml += `
                    <button class="monster-test-btn ${isBoss ? 'boss' : ''} ${isElite ? 'elite' : ''}" 
                            data-monster-id="${m.id}"
                            data-battle-type="${isBoss ? 'boss' : isElite ? 'elite' : 'normal'}">
                        <span class="monster-icon">${isBoss ? '👑' : isElite ? '⭐' : '👹'}</span>
                        <span class="monster-name">${m.name}</span>
                        <span class="monster-hp">HP: ${m.maxHp}</span>
                    </button>
                `;
            });
            
            monstersHtml += `</div></div>`;
        });
        
        const modal = document.createElement('div');
        modal.className = 'event-modal monster-test-modal';
        modal.innerHTML = `
            <div class="event-content test-content">
                <h2 class="event-title">🧪 몬스터 테스트</h2>
                <p class="test-desc">테스트할 몬스터를 선택하세요</p>
                <div class="test-monsters-container">
                    ${monstersHtml}
                </div>
                <button class="pause-btn secondary" id="test-cancel">닫기</button>
            </div>
        `;
        
        // 스타일 추가
        this.injectTestModalStyles();
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 커스텀 다중 적 상태
        const customMonsters = [];
        const selectedMonstersEl = modal.querySelector('#selected-monsters');
        const startCustomBtn = modal.querySelector('#start-custom-battle');
        
        const updateCustomUI = () => {
            if (customMonsters.length === 0) {
                selectedMonstersEl.innerHTML = '<span class="placeholder">몬스터를 추가하세요 (최대 5마리)</span>';
                startCustomBtn.disabled = true;
            } else {
                selectedMonstersEl.innerHTML = customMonsters.map((m, i) => `
                    <span class="selected-monster-tag" data-idx="${i}">
                        ${m.name} <button class="remove-monster">×</button>
                    </span>
                `).join('');
                startCustomBtn.disabled = false;
                
                // 삭제 버튼
                selectedMonstersEl.querySelectorAll('.remove-monster').forEach((btn, i) => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        customMonsters.splice(i, 1);
                        updateCustomUI();
                    });
                });
            }
        };
        
        // 몬스터 추가 버튼
        modal.querySelector('#add-monster-btn').addEventListener('click', () => {
            const select = modal.querySelector('#custom-monster-select');
            const monsterId = select.value;
            if (!monsterId) return;
            if (customMonsters.length >= 5) {
                alert('최대 5마리까지 추가 가능합니다!');
                return;
            }
            
            // 몬스터 이름 찾기
            let monsterName = monsterId;
            allMonsters.forEach(cat => {
                const found = cat.monsters.find(m => m.id === monsterId);
                if (found) monsterName = found.name;
            });
            
            customMonsters.push({ id: monsterId, name: monsterName });
            select.value = '';
            updateCustomUI();
        });
        
        // 커스텀 전투 시작
        startCustomBtn.addEventListener('click', () => {
            if (customMonsters.length === 0) return;
            modal.remove();
            this.startMultiEnemyBattle(customMonsters.map(m => m.id), 'normal');
        });
        
        // 프리셋 버튼 클릭
        modal.querySelectorAll('.multi-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.presetIdx);
                const preset = multiEnemyPresets[idx];
                modal.remove();
                this.startMultiEnemyBattle(preset.monsters, preset.type);
            });
        });
        
        // 단일 몬스터 버튼 클릭
        modal.querySelectorAll('.monster-test-btn:not(.multi-preset)').forEach(btn => {
            btn.addEventListener('click', () => {
                const monsterId = btn.dataset.monsterId;
                const battleType = btn.dataset.battleType;
                if (!monsterId) return;
                modal.remove();
                this.startTestBattleFromTitle(monsterId, battleType);
            });
        });
        
        // 닫기 버튼
        modal.querySelector('#test-cancel').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                this.show(); // 타이틀로 돌아가기
            }, 300);
        });
    },
    
    // 다중 적 전투 시작
    startMultiEnemyBattle(monsterIds, battleType) {
        console.log(`[Title Test] 다중 적 테스트 시작:`, monsterIds, battleType);
        
        // 게임 컨테이너 표시
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = monsterIds.map(id => ({
                name: id,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }));
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    },
    
    // 테스트 모달 스타일 주입
    injectTestModalStyles() {
        if (document.getElementById('test-modal-extra-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'test-modal-extra-styles';
        style.textContent = `
            .multi-enemy-section, .custom-multi-section {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .multi-enemy-section .category-title,
            .custom-multi-section .category-title {
                color: #ef4444;
            }
            
            .preset-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px;
            }
            
            .multi-preset {
                background: linear-gradient(145deg, #3a1a1a 0%, #2a1010 100%) !important;
                border-color: #ef4444 !important;
            }
            
            .multi-preset:hover {
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.5) !important;
            }
            
            .custom-multi-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .custom-select {
                flex: 1;
                padding: 10px;
                background: #1a1a2e;
                border: 2px solid #4a4a6a;
                border-radius: 8px;
                color: #fff;
                font-size: 0.9rem;
            }
            
            .custom-select:focus {
                outline: none;
                border-color: #fbbf24;
            }
            
            .add-monster-btn {
                padding: 10px 20px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .add-monster-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
            }
            
            .selected-monsters {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                min-height: 50px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .selected-monsters .placeholder {
                color: #6b7280;
                font-style: italic;
            }
            
            .selected-monster-tag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border-radius: 20px;
                font-size: 0.85rem;
                color: #fff;
                animation: tagAppear 0.2s ease-out;
            }
            
            @keyframes tagAppear {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            .remove-monster {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .remove-monster:hover {
                background: #ef4444;
            }
            
            .start-custom-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border: 2px solid #f87171;
                border-radius: 10px;
                color: #fff;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .start-custom-btn:disabled {
                background: #374151;
                border-color: #4b5563;
                color: #6b7280;
                cursor: not-allowed;
            }
            
            .start-custom-btn:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(239, 68, 68, 0.5);
            }
        `;
        document.head.appendChild(style);
    },
    
    // 테스트 전투 시작
    startTestBattleFromTitle(monsterId, battleType) {
        console.log(`[Title Test] 몬스터 테스트 시작: ${monsterId} (${battleType})`);
        
        // 몬스터 데이터 찾기
        const monsterData = typeof findEnemyByName === 'function' ? findEnemyByName(monsterId) : null;
        if (!monsterData) {
            alert(`몬스터를 찾을 수 없습니다: ${monsterId}`);
            return;
        }
        
        // 게임 컨테이너 표시
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = [{
                name: monsterId,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }];
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    }
};

// 페이지 로드 시 타이틀 표시
document.addEventListener('DOMContentLoaded', () => {
    TitleSystem.init();
});

console.log('[Title] 타이틀 시스템 로드 완료');


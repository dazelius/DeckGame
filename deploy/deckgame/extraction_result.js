// ==========================================
// Shadow Deck - 탈출 결과 시스템
// 카드/유물/진행도 → 기억(Memory) 환산
// ==========================================

const ExtractionResult = {
    // 상태
    isActive: false,
    extractionData: null,
    
    // 기억 환산 설정
    config: {
        // 기본 환산율
        roomCleared: 5,        // 클리어한 방당 기억
        cardAcquired: 3,       // 획득 카드당 기억
        relicAcquired: 15,     // 유물당 기억
        stageBonus: 50,        // 스테이지당 보너스
        floorBonus: 20,        // 층당 보너스
        goldConversion: 0.1,   // 골드 10% 환산
        
        // 희귀도별 카드 보너스
        cardRarityBonus: {
            common: 2,
            uncommon: 5,
            rare: 10,
        },
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        console.log('[ExtractionResult] 탈출 결과 시스템 초기화 완료');
    },
    
    // ==========================================
    // 기억 계산
    // ==========================================
    calculateMemory() {
        const data = {
            roomsCleared: 0,
            cardsAcquired: 0,
            relicsAcquired: 0,
            currentStage: 1,
            currentFloor: 1,
            goldHeld: 0,
            
            // 세부 내역
            breakdown: {
                rooms: 0,
                cards: 0,
                relics: 0,
                stage: 0,
                floor: 0,
                gold: 0,
            },
            
            totalMemory: 0,
        };
        
        // MapSystem에서 정보 가져오기
        if (typeof MapSystem !== 'undefined') {
            data.roomsCleared = MapSystem.roomsCleared || 0;
            data.currentStage = MapSystem.currentStage || 1;
            data.currentFloor = MapSystem.currentFloor || 1;
        }
        
        // 덱 정보 (시작 덱 제외 - 획득한 카드만 계산)
        if (typeof gameState !== 'undefined' && gameState.deck) {
            // 시작 덱 사이즈 가져오기
            let starterDeckSize = 10; // 기본값
            if (typeof starterDeck !== 'undefined' && Array.isArray(starterDeck)) {
                starterDeckSize = starterDeck.length;
            } else if (typeof JobSystem !== 'undefined' && JobSystem.getJobDeck) {
                const jobDeck = JobSystem.getJobDeck();
                if (jobDeck) {
                    // 직업 덱 카드 수 계산
                    starterDeckSize = Object.values(jobDeck.attacks || {}).reduce((a, b) => a + b, 0) +
                                     Object.values(jobDeck.skills || {}).reduce((a, b) => a + b, 0) +
                                     Object.values(jobDeck.powers || {}).reduce((a, b) => a + b, 0);
                }
            }
            data.cardsAcquired = Math.max(0, gameState.deck.length - starterDeckSize);
        }
        
        // 유물 정보 (RelicSystem에서 가져오기)
        if (typeof RelicSystem !== 'undefined' && RelicSystem.ownedRelics) {
            data.relicsAcquired = RelicSystem.ownedRelics.length || 0;
        } else if (typeof gameState !== 'undefined' && gameState.relics) {
            data.relicsAcquired = gameState.relics.length || 0;
        }
        
        // 골드
        if (typeof GoldSystem !== 'undefined') {
            data.goldHeld = GoldSystem.getTotalGold() || 0;
        } else if (typeof gameState !== 'undefined') {
            data.goldHeld = gameState.gold || 0;
        }
        
        // 기억 계산
        const cfg = this.config;
        
        data.breakdown.rooms = data.roomsCleared * cfg.roomCleared;
        data.breakdown.cards = data.cardsAcquired * cfg.cardAcquired;
        data.breakdown.relics = data.relicsAcquired * cfg.relicAcquired;
        data.breakdown.stage = (data.currentStage - 1) * cfg.stageBonus;
        data.breakdown.floor = (data.currentFloor - 1) * cfg.floorBonus;
        data.breakdown.gold = Math.floor(data.goldHeld * cfg.goldConversion);
        
        data.totalMemory = 
            data.breakdown.rooms +
            data.breakdown.cards +
            data.breakdown.relics +
            data.breakdown.stage +
            data.breakdown.floor +
            data.breakdown.gold;
        
        this.extractionData = data;
        return data;
    },
    
    // ==========================================
    // 탈출 결과 화면 표시
    // ==========================================
    show(callback) {
        if (this.isActive) return;
        this.isActive = true;
        
        // 기억 계산
        const data = this.calculateMemory();
        
        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'extraction-overlay';
        overlay.innerHTML = this.createUI(data);
        
        document.body.appendChild(overlay);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            
            // 파티클 생성
            this.createParticles();
            
            // 숫자 카운트업 애니메이션
            setTimeout(() => this.animateNumbers(data), 1200);
        });
        
        // 확인 버튼
        overlay.querySelector('.extraction-confirm-btn').addEventListener('click', () => {
            // 기억 저장
            this.saveMemory(data.totalMemory);
            
            // 화면 닫기
            this.close(() => {
                if (callback) callback();
            });
        });
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createUI(data) {
        return `
            <div class="extraction-container">
                <!-- 레터박스 -->
                <div class="extraction-letterbox top"></div>
                <div class="extraction-letterbox bottom"></div>
                
                <!-- 비네팅 -->
                <div class="extraction-vignette"></div>
                
                <!-- 파티클 -->
                <div class="extraction-particles"></div>
                
                <!-- 메인 컨텐츠 -->
                <div class="extraction-content">
                    <!-- 타이틀 섹션 -->
                    <div class="extraction-title-section">
                        <div class="extraction-title-glow"></div>
                        <div class="extraction-line left"></div>
                        <h1 class="extraction-title">HOMEWARD</h1>
                        <div class="extraction-line right"></div>
                        <p class="extraction-subtitle">귀환</p>
                    </div>
                    
                    <!-- 진행 정보 -->
                    <div class="extraction-progress">
                        <div class="progress-item">
                            <span class="progress-value">B${data.currentFloor}F</span>
                            <span class="progress-label">도달 층</span>
                        </div>
                        <div class="progress-divider"></div>
                        <div class="progress-item">
                            <span class="progress-value">${data.roomsCleared}</span>
                            <span class="progress-label">클리어</span>
                        </div>
                        <div class="progress-divider"></div>
                        <div class="progress-item">
                            <span class="progress-value">${data.cardsAcquired}</span>
                            <span class="progress-label">카드</span>
                        </div>
                    </div>
                    
                    <!-- 기억 환산 -->
                    <div class="extraction-memory-section">
                        <div class="memory-header">
                            <span class="memory-header-line"></span>
                            <span class="memory-header-text">MEMORY GAINED</span>
                            <span class="memory-header-line"></span>
                        </div>
                        
                        <div class="memory-breakdown">
                            <div class="memory-row"><span>클리어 방</span><span class="memory-val" data-target="${data.breakdown.rooms}">0</span></div>
                            <div class="memory-row"><span>획득 카드</span><span class="memory-val" data-target="${data.breakdown.cards}">0</span></div>
                            <div class="memory-row"><span>유물</span><span class="memory-val" data-target="${data.breakdown.relics}">0</span></div>
                            <div class="memory-row"><span>보너스</span><span class="memory-val" data-target="${data.breakdown.stage + data.breakdown.floor}">0</span></div>
                            <div class="memory-row"><span>골드 환산</span><span class="memory-val" data-target="${data.breakdown.gold}">0</span></div>
                        </div>
                        
                        <div class="memory-total">
                            <div class="memory-total-icon">🔮</div>
                            <div class="memory-total-amount" data-target="${data.totalMemory}">0</div>
                            <div class="memory-total-label">MEMORY</div>
                        </div>
                    </div>
                    
                    <!-- 확인 버튼 -->
                    <button class="extraction-confirm-btn">
                        <span class="btn-line"></span>
                        <span class="btn-text">귀환</span>
                        <span class="btn-line"></span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // ==========================================
    // 숫자 애니메이션
    // ==========================================
    animateNumbers(data) {
        const duration = 1500;
        const startTime = Date.now();
        
        const valueEls = document.querySelectorAll('.memory-val, .memory-total-amount');
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            
            valueEls.forEach(el => {
                const target = parseInt(el.dataset.target) || 0;
                const current = Math.floor(target * eased);
                el.textContent = current.toLocaleString();
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 최종 값 설정 (정확한 값)
                valueEls.forEach(el => {
                    const target = parseInt(el.dataset.target) || 0;
                    el.textContent = target.toLocaleString();
                });
                
                // 총 기억 강조 효과
                const totalEl = document.querySelector('.extraction-total');
                if (totalEl) totalEl.classList.add('highlight');
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 기억 저장
    // ==========================================
    saveMemory(amount) {
        // 기존 기억에 추가
        let currentMemory = parseInt(localStorage.getItem('shadowDeck_memory') || '0');
        currentMemory += amount;
        localStorage.setItem('shadowDeck_memory', currentMemory.toString());
        
        console.log(`[ExtractionResult] 기억 저장: +${amount} (총: ${currentMemory})`);
        
        // gameState에도 반영
        if (typeof gameState !== 'undefined') {
            gameState.memory = currentMemory;
        }
    },
    
    // ==========================================
    // 기억 가져오기
    // ==========================================
    getMemory() {
        return parseInt(localStorage.getItem('shadowDeck_memory') || '0');
    },
    
    // ==========================================
    // 기억 사용
    // ==========================================
    spendMemory(amount) {
        let currentMemory = this.getMemory();
        if (currentMemory < amount) return false;
        
        currentMemory -= amount;
        localStorage.setItem('shadowDeck_memory', currentMemory.toString());
        
        if (typeof gameState !== 'undefined') {
            gameState.memory = currentMemory;
        }
        
        console.log(`[ExtractionResult] 기억 사용: -${amount} (남은: ${currentMemory})`);
        return true;
    },
    
    // ==========================================
    // 종료
    // ==========================================
    close(callback) {
        const overlay = document.querySelector('.extraction-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                this.isActive = false;
                
                if (callback) callback();
            }, 500);
        } else {
            this.isActive = false;
            if (callback) callback();
        }
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('extraction-result-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'extraction-result-styles';
        style.textContent = `
            /* ==========================================
               탈출 결과 오버레이 (다크소울 스타일)
               ========================================== */
            .extraction-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .extraction-overlay.visible {
                opacity: 1;
            }
            
            .extraction-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            /* 레터박스 */
            .extraction-letterbox {
                position: absolute;
                left: 0;
                width: 100%;
                height: 8%;
                background: #000;
                z-index: 3;
                pointer-events: none;
            }
            
            .extraction-letterbox.top { top: 0; }
            .extraction-letterbox.bottom { bottom: 0; }
            
            /* 비네팅 */
            .extraction-vignette {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center,
                    transparent 20%,
                    rgba(138, 43, 226, 0.15) 50%,
                    rgba(75, 0, 130, 0.4) 100%);
                pointer-events: none;
                z-index: 1;
            }
            
            /* 파티클 */
            .extraction-particles {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 2;
                overflow: hidden;
            }
            
            .extraction-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: #a855f7;
                border-radius: 50%;
                opacity: 0;
                animation: extractionParticleRise 4s ease-out infinite;
            }
            
            @keyframes extractionParticleRise {
                0% {
                    transform: translateY(100vh) scale(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(-20vh) scale(1);
                    opacity: 0;
                }
            }
            
            /* 메인 컨텐츠 */
            .extraction-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
                text-align: center;
                width: 90%;
                max-width: 450px;
            }
            
            /* 타이틀 섹션 */
            .extraction-title-section {
                position: relative;
                margin-bottom: 30px;
            }
            
            .extraction-title-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 100px;
                background: radial-gradient(ellipse at center, 
                    rgba(168, 85, 247, 0.3) 0%, 
                    transparent 70%);
                pointer-events: none;
                animation: titleGlow 3s ease-in-out infinite;
            }
            
            @keyframes titleGlow {
                0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            }
            
            .extraction-title {
                font-family: 'Cinzel', serif;
                font-size: 3.5rem;
                font-weight: 400;
                color: #e8dcc4;
                letter-spacing: 15px;
                margin: 0;
                text-shadow: 
                    0 0 20px rgba(168, 85, 247, 0.8),
                    0 0 60px rgba(168, 85, 247, 0.4);
                animation: titleAppear 1.5s ease-out;
            }
            
            @keyframes titleAppear {
                0% { opacity: 0; transform: scale(1.2); letter-spacing: 30px; }
                100% { opacity: 1; transform: scale(1); letter-spacing: 15px; }
            }
            
            .extraction-subtitle {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #888;
                margin-top: 10px;
                letter-spacing: 5px;
                animation: subtitleAppear 1.5s ease-out 0.3s both;
            }
            
            @keyframes subtitleAppear {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .extraction-line {
                position: absolute;
                top: 50%;
                width: 100px;
                height: 1px;
                background: linear-gradient(90deg, transparent, #a855f7, transparent);
                animation: lineExpand 1s ease-out 0.5s both;
            }
            
            .extraction-line.left { right: 100%; margin-right: 30px; }
            .extraction-line.right { left: 100%; margin-left: 30px; }
            
            @keyframes lineExpand {
                0% { width: 0; opacity: 0; }
                100% { width: 100px; opacity: 1; }
            }
            
            /* 진행 정보 */
            .extraction-progress {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 40px;
                margin-bottom: 40px;
                animation: fadeInUp 0.8s ease-out 0.8s both;
            }
            
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .progress-item {
                text-align: center;
            }
            
            .progress-value {
                display: block;
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #e8dcc4;
                text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            
            .progress-label {
                display: block;
                font-size: 0.8rem;
                color: #666;
                margin-top: 5px;
                letter-spacing: 2px;
            }
            
            .progress-divider {
                width: 1px;
                height: 40px;
                background: linear-gradient(180deg, transparent, #a855f7, transparent);
            }
            
            /* 기억 섹션 */
            .extraction-memory-section {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 30px;
                animation: fadeInUp 0.8s ease-out 1s both;
            }
            
            .memory-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .memory-header-text {
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                color: #a855f7;
                letter-spacing: 3px;
            }
            
            .memory-header-line {
                width: 50px;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
            }
            
            .memory-breakdown {
                margin-bottom: 20px;
            }
            
            .memory-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 0.9rem;
                color: #888;
            }
            
            .memory-row:last-child { border-bottom: none; }
            
            .memory-val {
                color: #c084fc;
                font-family: 'Cinzel', serif;
            }
            
            .memory-val::after {
                content: ' 🔮';
                font-size: 0.7rem;
            }
            
            .memory-total {
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
                border: 2px solid #a855f7;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            
            .memory-total-icon {
                font-size: 2.5rem;
                filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.8));
                margin-bottom: 5px;
            }
            
            .memory-total-amount {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                color: #e8dcc4;
                text-shadow: 
                    0 0 20px rgba(168, 85, 247, 0.8),
                    0 0 40px rgba(168, 85, 247, 0.4);
            }
            
            .memory-total-label {
                font-size: 0.8rem;
                color: #888;
                letter-spacing: 5px;
                margin-top: 5px;
            }
            
            /* 확인 버튼 */
            .extraction-confirm-btn {
                display: inline-flex;
                align-items: center;
                gap: 20px;
                padding: 18px 60px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 4px;
                cursor: pointer;
                animation: fadeInUp 0.8s ease-out 1.2s both;
                transition: all 0.3s ease;
                margin-top: 10px;
                position: relative;
                z-index: 20;
            }
            
            .extraction-confirm-btn:hover {
                transform: scale(1.05);
                background: rgba(168, 85, 247, 0.15);
                border-color: #a855f7;
            }
            
            .extraction-confirm-btn:hover .btn-text {
                color: #a855f7;
                text-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
            }
            
            .extraction-confirm-btn:hover .btn-line {
                width: 60px;
                background: #a855f7;
            }
            
            .btn-line {
                width: 40px;
                height: 1px;
                background: #555;
                transition: all 0.3s ease;
            }
            
            .btn-text {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #a89070;
                letter-spacing: 5px;
                transition: all 0.3s ease;
            }
            
            /* ==========================================
               반응형 대응
               ========================================== */
            
            /* 태블릿 */
            @media (max-width: 1024px) {
                .extraction-content {
                    max-width: 400px;
                }
                
                .extraction-title {
                    font-size: 2.8rem;
                    letter-spacing: 10px;
                }
                
                .extraction-progress {
                    gap: 30px;
                }
                
                .progress-value {
                    font-size: 1.7rem;
                }
            }
            
            /* 작은 태블릿/큰 모바일 */
            @media (max-width: 768px) {
                .extraction-content {
                    max-width: 90%;
                    width: 90%;
                    padding: 0 15px;
                }
                
                .extraction-title {
                    font-size: 2.2rem;
                    letter-spacing: 8px;
                }
                
                .extraction-subtitle {
                    font-size: 1rem;
                    letter-spacing: 3px;
                }
                
                .extraction-progress {
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .progress-value {
                    font-size: 1.5rem;
                }
                
                .progress-label {
                    font-size: 0.7rem;
                }
                
                .extraction-memory-section {
                    padding: 20px 15px;
                }
                
                .memory-total-amount {
                    font-size: 2.5rem;
                }
                
                .memory-total-icon {
                    font-size: 2rem;
                }
                
                .extraction-line {
                    display: none;
                }
                
                .extraction-confirm-btn {
                    padding: 15px 40px;
                }
                
                .btn-text {
                    font-size: 1rem;
                    letter-spacing: 3px;
                }
            }
            
            /* 모바일 */
            @media (max-width: 480px) {
                .extraction-letterbox {
                    height: 5%;
                }
                
                .extraction-content {
                    padding: 0 10px;
                }
                
                .extraction-title-section {
                    margin-bottom: 20px;
                }
                
                .extraction-title {
                    font-size: 1.8rem;
                    letter-spacing: 5px;
                }
                
                .extraction-subtitle {
                    font-size: 0.85rem;
                    letter-spacing: 2px;
                }
                
                .extraction-progress {
                    gap: 15px;
                    margin-bottom: 25px;
                }
                
                .progress-value {
                    font-size: 1.3rem;
                }
                
                .progress-divider {
                    height: 30px;
                }
                
                .extraction-memory-section {
                    padding: 15px 12px;
                    margin-bottom: 20px;
                }
                
                .memory-header-text {
                    font-size: 0.75rem;
                    letter-spacing: 2px;
                }
                
                .memory-row {
                    font-size: 0.8rem;
                    padding: 6px 0;
                }
                
                .memory-total {
                    padding: 15px;
                }
                
                .memory-total-amount {
                    font-size: 2rem;
                }
                
                .memory-total-label {
                    font-size: 0.7rem;
                    letter-spacing: 3px;
                }
                
                .extraction-confirm-btn {
                    padding: 12px 30px;
                    margin-top: 5px;
                }
                
                .btn-line {
                    width: 25px;
                }
                
                .btn-text {
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                }
            }
            
            /* 아주 작은 모바일 */
            @media (max-width: 320px) {
                .extraction-title {
                    font-size: 1.5rem;
                    letter-spacing: 3px;
                }
                
                .extraction-progress {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .progress-divider {
                    width: 40px;
                    height: 1px;
                }
                
                .memory-total-amount {
                    font-size: 1.8rem;
                }
            }
            
            /* 높이가 낮은 화면 */
            @media (max-height: 600px) {
                .extraction-letterbox {
                    height: 4%;
                }
                
                .extraction-title-section {
                    margin-bottom: 15px;
                }
                
                .extraction-title {
                    font-size: 2rem;
                }
                
                .extraction-progress {
                    margin-bottom: 20px;
                }
                
                .extraction-memory-section {
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .memory-total {
                    padding: 12px;
                }
                
                .memory-total-amount {
                    font-size: 2rem;
                }
            }
            
            /* 가로 모드 모바일 */
            @media (max-height: 500px) and (orientation: landscape) {
                .extraction-content {
                    max-width: 80%;
                }
                
                .extraction-letterbox {
                    height: 3%;
                }
                
                .extraction-title-section {
                    margin-bottom: 10px;
                }
                
                .extraction-title {
                    font-size: 1.6rem;
                }
                
                .extraction-subtitle {
                    font-size: 0.75rem;
                    margin-top: 5px;
                }
                
                .extraction-progress {
                    gap: 30px;
                    margin-bottom: 15px;
                }
                
                .progress-value {
                    font-size: 1.2rem;
                }
                
                .extraction-memory-section {
                    padding: 10px 15px;
                    margin-bottom: 10px;
                }
                
                .memory-breakdown {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px 20px;
                    margin-bottom: 10px;
                }
                
                .memory-row {
                    flex: 1 1 45%;
                    padding: 3px 0;
                    font-size: 0.75rem;
                }
                
                .memory-total {
                    padding: 10px;
                }
                
                .memory-total-icon {
                    font-size: 1.5rem;
                }
                
                .memory-total-amount {
                    font-size: 1.8rem;
                }
                
                .extraction-confirm-btn {
                    padding: 10px 25px;
                }
                
                .btn-text {
                    font-size: 0.85rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 파티클 생성
    createParticles() {
        const container = document.querySelector('.extraction-particles');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'extraction-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 4}s`;
            particle.style.animationDuration = `${3 + Math.random() * 2}s`;
            container.appendChild(particle);
        }
    },
    
};

// 전역 접근
window.ExtractionResult = ExtractionResult;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    ExtractionResult.init();
});

console.log('[ExtractionResult] 탈출 결과 시스템 로드 완료');


// ==========================================
// Shadow Deck - 가챠 이벤트
// 일본 서브컬쳐 가챠시스템 패러디
// "신비한 무녀의 소환"
// ==========================================

const GachaEvent = {
    isActive: false,
    currentRoom: null,
    
    // 가챠 설정
    config: {
        singleCost: 50,      // 1회 뽑기 비용
        tenPullCost: 450,    // 10회 뽑기 비용 (1회 무료)
        
        // 등급별 확률 (%) - 최소 3%
        rates: {
            N: 44,      // 일반
            R: 28,      // 레어
            SR: 15,     // 슈퍼레어
            SSR: 7,     // SSR
            UR: 3,      // UR (전설)
            SPECIAL: 3, // 가챠 전용 특별 카드
        },
        
        // 등급별 색상
        colors: {
            N: { main: '#888888', glow: '#666666', name: 'NORMAL' },
            R: { main: '#3b82f6', glow: '#60a5fa', name: 'RARE' },
            SR: { main: '#a855f7', glow: '#c084fc', name: 'SUPER RARE' },
            SSR: { main: '#f59e0b', glow: '#fbbf24', name: 'SSR' },
            UR: { main: '#ef4444', glow: '#f87171', name: 'ULTRA RARE', rainbow: true },
            SPECIAL: { main: '#ff69b4', glow: '#ffb6c1', name: 'MAIDEN SPECIAL', rainbow: true, special: true },
        }
    },
    
    // 무녀 대사
    dialogues: {
        greeting: [
            "...어서 오세요. 운명을 찾아 오셨군요.",
            "크리스탈이 당신을 기다리고 있었어요.",
            "신비한 힘이 당신을 이끌었네요..."
        ],
        askPull: [
            "자, 운명을 시험해볼까요?",
            "크리스탈에 손을 대보세요...",
            "어떤 카드가 나올지... 두근거리네요."
        ],
        pullStart: [
            "운명의 빛이여, 이 자에게 응답하라...",
            "크리스탈이 공명하고 있어요...!",
            "별들이 움직이기 시작했어요..."
        ],
        resultN: [
            "평범한 운명이네요... 다음엔 더 좋은 게...",
            "아쉽지만... 이것도 운명이에요.",
            "크리스탈이 조용하네요..."
        ],
        resultR: [
            "오, 괜찮은 기운이에요!",
            "크리스탈이 반응했어요!",
            "좋은 징조예요...!"
        ],
        resultSR: [
            "우와...! 강한 기운이에요!",
            "크리스탈이 밝게 빛나고 있어요!",
            "이건 좋은 카드예요...!"
        ],
        resultSSR: [
            "믿을 수 없어...! 황금빛이에요!",
            "크리스탈이 폭발적으로 빛나요!!",
            "대단해요...! 축복받은 자시네요!"
        ],
        resultUR: [
            "!!!...이건...전설의...!!!",
            "크리스탈이...무지개빛으로...!!",
            "신이시여...! 이런 기적이...!!"
        ],
        outro: [
            "또 오세요... 운명은 언제나 기다리고 있어요.",
            "크리스탈과 함께... 다음 만남을 기다릴게요.",
            "좋은 여정이 되길 빌어요..."
        ]
    },
    
    // 무료 뽑기 사용 여부
    freePullUsed: false,
    particleInterval: null,
    
    // 등급별 카드 풀
    cardPools: {
        N: ['strike', 'defend', 'bash', 'dodge'],
        R: ['pommelStrike', 'quickSlash', 'dirtyStrike', 'plunder', 'ironWave', 'cleave'],
        SR: ['shieldBash', 'twinStrike', 'ragingBlow'],
        SSR: ['triforcePower', 'triforceCourage', 'triforceWisdom'],
        UR: ['masterSword', 'brutalSever'],
        SPECIAL: ['mysticMaidenCall'], // 가챠 전용 특별 카드
    },
    
    // ==========================================
    // 이벤트 시작
    // ==========================================
    show(room) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentRoom = room;
        this.injectStyles();
        
        // 인트로 시작
        this.showIntro();
    },
    
    // ==========================================
    // 인트로 시퀀스
    // ==========================================
    showIntro() {
        const intro = document.createElement('div');
        intro.id = 'gacha-intro';
        intro.className = 'gacha-intro';
        intro.innerHTML = `
            <div class="gacha-intro-bg"></div>
            <div class="gacha-intro-content">
                <div class="gacha-intro-icon">
                    <img src="crystal.png" alt="Crystal" class="intro-crystal-img">
                </div>
                <div class="gacha-intro-title">신비한 무녀</div>
                <div class="gacha-intro-subtitle">MYSTIC SHRINE MAIDEN</div>
                <div class="gacha-intro-line"></div>
            </div>
        `;
        
        document.body.appendChild(intro);
        
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
            }, 800);
        }, 3000);
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createUI() {
        // 기존 오버레이 제거
        const existing = document.querySelector('.gacha-overlay');
        if (existing) existing.remove();
        
        // 플레이어 스프라이트 가져오기
        let playerSprite = 'hero.png';
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob && JobSystem.jobs[JobSystem.currentJob]) {
            playerSprite = JobSystem.jobs[JobSystem.currentJob].sprite || 'hero.png';
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'gacha-overlay';
        overlay.innerHTML = `
            <div class="gacha-flower-bg"></div>
            <div class="gacha-letterbox bottom"></div>
            <div class="gacha-bg"></div>
            <div class="gacha-vignette"></div>
            <div class="gacha-particles"></div>
            
            <!-- 오른쪽: 플레이어 캐릭터 -->
            <div class="gacha-player-char">
                <img src="${playerSprite}" alt="플레이어" class="gacha-player-img">
                <div class="gacha-player-glow"></div>
            </div>
            
            <div class="gacha-container">
                
                <!-- 대화창 -->
                <div class="gacha-dialogue-area">
                    <div class="gacha-dialogue-box">
                        <span class="gacha-dialogue-text"></span>
                    </div>
                </div>
                
                <!-- 중앙: 크리스탈 + 무녀 -->
                <div class="gacha-main">
                    <div class="gacha-crystal-area">
                        <!-- 회전하는 크리스탈 이미지 -->
                        <div class="gacha-crystal-container">
                            <div class="gacha-crystal">
                                <img src="crystal.png" alt="Crystal" class="gacha-crystal-img">
                            </div>
                            <div class="gacha-crystal-ring ring-1"></div>
                            <div class="gacha-crystal-ring ring-2"></div>
                            <div class="gacha-crystal-ring ring-3"></div>
                            <div class="gacha-crystal-glow"></div>
                        </div>
                        
                        <!-- 무녀 캐릭터 (크리스탈 아래 배치) -->
                        <div class="gacha-mugirl">
                            <img src="mugirl.png" alt="무녀" class="gacha-mugirl-img">
                            <div class="gacha-mugirl-glow"></div>
                        </div>
                    </div>
                    
                    <!-- 확률 표시 -->
                    <div class="gacha-rates-display">
                        <div class="gacha-rate-item special">SPECIAL 3%</div>
                        <div class="gacha-rate-item ur">UR 3%</div>
                        <div class="gacha-rate-item ssr">SSR 7%</div>
                        <div class="gacha-rate-item sr">SR 15%</div>
                        <div class="gacha-rate-item r">R 28%</div>
                    </div>
                </div>
                
                <!-- 하단: 버튼 -->
                <div class="gacha-buttons">
                    <button class="gacha-btn gacha-free ${this.freePullUsed ? 'used' : ''}" 
                            onclick="GachaEvent.freePull()" 
                            ${this.freePullUsed ? 'disabled' : ''}>
                        <span class="gacha-btn-label">${this.freePullUsed ? '사용완료' : '무료 1회'}</span>
                        <span class="gacha-btn-cost">${this.freePullUsed ? '—' : 'FREE!'}</span>
                    </button>
                    
                    <button class="gacha-btn gacha-single" onclick="GachaEvent.pull(1)">
                        <span class="gacha-btn-label">1회 뽑기</span>
                        <span class="gacha-btn-cost">${this.config.singleCost} G</span>
                    </button>
                    
                    <button class="gacha-btn gacha-ten" onclick="GachaEvent.pull(10)">
                        <span class="gacha-btn-label">10연차</span>
                        <span class="gacha-btn-cost">${this.config.tenPullCost} G</span>
                        <span class="gacha-btn-bonus">+1 FREE!</span>
                    </button>
                    
                    <button class="gacha-btn gacha-exit" onclick="GachaEvent.closeWithOutro()">
                        <span class="gacha-btn-label">나가기</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 입장 애니메이션
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            this.startParticles();
            this.playGreeting();
        });
        
        // TopBar 골드 갱신
        if (typeof TopBar !== 'undefined') TopBar.updateGold();
    },
    
    // ==========================================
    // 인사 대사
    // ==========================================
    async playGreeting() {
        const dialogueText = document.querySelector('.gacha-dialogue-text');
        if (!dialogueText) return;
        
        await this.typeText(dialogueText, this.getRandomDialogue('greeting'));
        await this.wait(1500);
        await this.typeText(dialogueText, this.getRandomDialogue('askPull'));
    },
    
    // ==========================================
    // 파티클 시작
    // ==========================================
    startParticles() {
        const container = document.querySelector('.gacha-particles');
        if (!container) return;
        
        this.particleInterval = setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'gacha-particle';
            particle.style.left = `${Math.random() * 100}%`;
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }, 300);
    },
    
    // ==========================================
    // 골드 관련
    // ==========================================
    getCurrentGold() {
        return gameState?.gold ?? (typeof GoldSystem !== 'undefined' ? GoldSystem.getTotalGold() : 0);
    },
    
    updateTopBarGold() {
        if (typeof TopBar !== 'undefined') TopBar.updateGold();
    },
    
    // ==========================================
    // 무료 뽑기
    // ==========================================
    async freePull() {
        if (this.freePullUsed) {
            this.showMessage('이미 무료 뽑기를 사용했습니다!', 'error');
            return;
        }
        
        this.freePullUsed = true;
        
        const freeBtn = document.querySelector('.gacha-free');
        if (freeBtn) {
            freeBtn.classList.add('used');
            freeBtn.disabled = true;
            freeBtn.querySelector('.gacha-btn-label').textContent = '사용완료';
            freeBtn.querySelector('.gacha-btn-cost').textContent = '—';
        }
        
        await this.executePull(1);
    },
    
    // ==========================================
    // 유료 뽑기
    // ==========================================
    async pull(count) {
        const cost = count === 1 ? this.config.singleCost : this.config.tenPullCost;
        
        if (this.getCurrentGold() < cost) {
            this.showMessage('골드가 부족합니다!', 'error');
            return;
        }
        
        // 골드 차감
        if (gameState) gameState.gold -= cost;
        if (typeof GoldSystem !== 'undefined' && GoldSystem.spendGold) {
            GoldSystem.spendGold(cost);
        }
        if (typeof TopBar !== 'undefined') TopBar.updateGold();
        
        await this.executePull(count);
    },
    
    // ==========================================
    // 뽑기 실행
    // ==========================================
    async executePull(count) {
        this.setButtonsEnabled(false);
        
        const dialogueText = document.querySelector('.gacha-dialogue-text');
        await this.typeText(dialogueText, this.getRandomDialogue('pullStart'));
        
        // 뽑기 결과 생성
        const results = [];
        const actualCount = count === 10 ? 11 : count;
        
        for (let i = 0; i < actualCount; i++) {
            results.push(this.rollGacha());
        }
        
        const highestRarity = this.getHighestRarity(results);
        
        // 연출 시작
        await this.playGachaAnimation(results, highestRarity);
        
        // 결과 대사
        const resultDialogueKey = `result${highestRarity}`;
        await this.typeText(dialogueText, this.getRandomDialogue(resultDialogueKey));
        
        // 결과 표시
        this.showResults(results);
        
        this.setButtonsEnabled(true);
    },
    
    // ==========================================
    // 가챠 롤
    // ==========================================
    rollGacha() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        
        for (const [rarity, rate] of Object.entries(this.config.rates)) {
            cumulative += rate;
            if (rand < cumulative) {
                const pool = this.cardPools[rarity];
                const cardId = pool[Math.floor(Math.random() * pool.length)];
                return { rarity, cardId };
            }
        }
        
        return { rarity: 'N', cardId: this.cardPools.N[0] };
    },
    
    getHighestRarity(results) {
        const order = ['N', 'R', 'SR', 'SSR', 'UR', 'SPECIAL'];
        let highest = 'N';
        
        for (const result of results) {
            if (order.indexOf(result.rarity) > order.indexOf(highest)) {
                highest = result.rarity;
            }
        }
        
        return highest;
    },
    
    // ==========================================
    // 가챠 애니메이션 (긴장감 있는 연출)
    // ==========================================
    async playGachaAnimation(results, highestRarity) {
        const crystal = document.querySelector('.gacha-crystal');
        const crystalContainer = document.querySelector('.gacha-crystal-container');
        const overlay = document.querySelector('.gacha-overlay');
        const dialogueText = document.querySelector('.gacha-dialogue-text');
        const colorConfig = this.config.colors[highestRarity];
        
        // 크리스탈 중심 좌표 헬퍼
        const getCrystalCenter = () => {
            if (!crystalContainer) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
            const rect = crystalContainer.getBoundingClientRect();
            return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
        };
        
        // 등급별 연출 시간 (높을수록 길고 화려하게)
        const timings = {
            N: { buildup: 1500, tension: 500, reveal: 800 },
            R: { buildup: 2000, tension: 800, reveal: 1000 },
            SR: { buildup: 2500, tension: 1200, reveal: 1200 },
            SSR: { buildup: 3000, tension: 1800, reveal: 1500 },
            UR: { buildup: 3500, tension: 2500, reveal: 2000 },
            SPECIAL: { buildup: 4000, tension: 3000, reveal: 2500 }
        };
        const timing = timings[highestRarity] || timings.N;
        
        // ========== 1단계: 시작 - 서서히 빌드업 ==========
        crystal.classList.add('phase-start');
        this.showSummonText('운명이 움직인다...', 'start');
        
        // VFX: 부드러운 파티클 등장
        if (typeof VFX !== 'undefined') {
            const { cx, cy } = getCrystalCenter();
            VFX.smoke(cx, cy, { color: '#ffb6c1', count: 10, size: 30, speed: 1 });
            // 원형 링 파티클
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const px = cx + Math.cos(angle) * 80;
                const py = cy + Math.sin(angle) * 80;
                setTimeout(() => {
                    VFX.sparks(px, py, { color: '#ffe4ec', count: 3, speed: 2, size: 2 });
                }, i * 80);
            }
        }
        
        await this.wait(800);
        
        // ========== 2단계: 크리스탈 회전 가속 ==========
        crystal.classList.remove('phase-start');
        crystal.classList.add('spinning');
        overlay.classList.add('darkening');
        
        // VFX: 소용돌이 파티클 + 수렴 파티클
        this.createConvergingParticles(crystalContainer);
        
        // 빔 컨테이너 생성
        const beamContainer = this.createBeamContainer(crystalContainer);
        
        // 빔이 점점 늘어나는 연출
        let beamCount = 0;
        const maxBeams = 16;
        const beamInterval = setInterval(() => {
            if (beamCount < maxBeams) {
                this.addBeam(beamContainer, beamCount, maxBeams);
                beamCount++;
            }
        }, timing.buildup * 0.4 / maxBeams);
        
        // 빔 인터벌 저장 (나중에 정리용)
        this.beamInterval = beamInterval;
        this.beamContainer = beamContainer;
        
        if (typeof VFX !== 'undefined') {
            const { cx, cy } = getCrystalCenter();
            // 회전하는 궤적 표현
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const angle = (i / 12) * Math.PI * 2 + performance.now() * 0.001;
                    const radius = 100 + Math.random() * 50;
                    const px = cx + Math.cos(angle) * radius;
                    const py = cy + Math.sin(angle) * radius;
                    VFX.sparks(px, py, { color: '#ff88aa', count: 5, speed: 3, size: 3 });
                }, i * 60);
            }
            // 작은 충격파
            setTimeout(() => {
                VFX.shockwave(cx, cy, { color: '#ffb6c1', size: 150, lineWidth: 2 });
            }, 300);
        }
        
        await this.wait(timing.buildup * 0.3);
        
        // ========== 3단계: 긴장감 빌드업 ==========
        crystal.classList.add('charging');
        this.showSummonText('크리스탈이 공명한다...!', 'charging');
        
        // VFX: 강렬한 집중 효과
        if (typeof VFX !== 'undefined') {
            const { cx, cy } = getCrystalCenter();
            
            // 반복적인 파티클 수렴
            const chargeInterval = setInterval(() => {
                VFX.sparks(cx, cy, { color: '#ffd700', count: 12, speed: 2, size: 4 });
                VFX.smoke(cx, cy, { color: '#ffcc00', count: 5, size: 20, speed: 1 });
            }, 300);
            
            // 충격파 반복
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    VFX.shockwave(cx, cy, { color: '#ffdd88', size: 180 + i * 30, lineWidth: 2 });
                }, i * 400);
            }
            
            // 일정 시간 후 인터벌 정리
            setTimeout(() => clearInterval(chargeInterval), timing.buildup * 0.35);
        }
        
        await this.wait(timing.buildup * 0.4);
        
        // ========== 4단계: 최고조 - 화면 암전 + 긴장 ==========
        overlay.classList.remove('darkening');
        overlay.classList.add('blackout');
        crystal.classList.add('trembling');
        
        this.showSummonText('...!', 'tension');
        
        // VFX: 긴장감 있는 번쩍임
        if (typeof VFX !== 'undefined') {
            const { cx, cy } = getCrystalCenter();
            
            // 불규칙한 스파크
            const tensionInterval = setInterval(() => {
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 60;
                VFX.sparks(cx + offsetX, cy + offsetY, { color: '#ffffff', count: 3, speed: 8, size: 2 });
            }, 100);
            
            setTimeout(() => clearInterval(tensionInterval), timing.tension * 0.4);
        }
        
        await this.wait(timing.tension * 0.5);
        
        // 등급에 따른 힌트 연출 (높은 등급일수록 화려한 힌트)
        if (highestRarity === 'SPECIAL') {
            // SPECIAL - 무녀 카드 최고급 힌트
            overlay.classList.add('rarity-hint-high');
            overlay.classList.add('special-hint');
            this.showSummonText('...신비한 기운이...!!!', 'hint-special');
            
            if (typeof VFX !== 'undefined') {
                const { cx, cy } = getCrystalCenter();
                
                // 핑크 플래시
                VFX.screenFlash('#ff69b4', 0.7);
                VFX.screenFlash('#ff1493', 0.4);
                
                // 핑크 충격파 연속
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        VFX.shockwave(cx, cy, { color: '#ff69b4', size: 300 - i * 30, lineWidth: 6 - i });
                    }, i * 100);
                }
                
                // 핑크 파티클 폭발
                const pinkColors = ['#ff69b4', '#ff1493', '#ffb6c1', '#ff69b4', '#ffffff'];
                pinkColors.forEach((color, i) => {
                    setTimeout(() => {
                        VFX.sparks(cx, cy, { color, count: 25, speed: 18, size: 6 });
                    }, i * 60);
                });
                
                // 화면 흔들림
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(20, 800);
                }
            }
            
            await this.wait(timing.tension * 0.4);
            
        } else if (highestRarity === 'UR' || highestRarity === 'SSR') {
            overlay.classList.add('rarity-hint-high');
            this.showSummonText('...이건...!!', 'hint-high');
            
            // VFX: 금빛/무지개 플래시
            if (typeof VFX !== 'undefined') {
                const { cx, cy } = getCrystalCenter();
                VFX.screenFlash('#ffd700', 0.5);
                VFX.shockwave(cx, cy, { color: '#ffd700', size: 250, lineWidth: 5 });
                
                // UR은 무지개 파티클 추가
                if (highestRarity === 'UR') {
                    const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#8800ff'];
                    rainbowColors.forEach((color, i) => {
                        setTimeout(() => {
                            VFX.sparks(cx, cy, { color, count: 15, speed: 15, size: 5 });
                        }, i * 80);
                    });
                }
            }
            
            await this.wait(timing.tension * 0.3);
        } else if (highestRarity === 'SR') {
            overlay.classList.add('rarity-hint-mid');
            this.showSummonText('좋은 기운이...!', 'hint-mid');
            
            // VFX: 보라빛 플래시
            if (typeof VFX !== 'undefined') {
                const { cx, cy } = getCrystalCenter();
                VFX.shockwave(cx, cy, { color: '#a855f7', size: 200, lineWidth: 3 });
                VFX.sparks(cx, cy, { color: '#c084fc', count: 20, speed: 10, size: 4 });
            }
            
            await this.wait(timing.tension * 0.2);
        } else if (highestRarity === 'R') {
            // R 등급도 약간의 힌트
            if (typeof VFX !== 'undefined') {
                const { cx, cy } = getCrystalCenter();
                VFX.sparks(cx, cy, { color: '#60a5fa', count: 10, speed: 8, size: 3 });
            }
        }
        
        await this.wait(timing.tension * 0.2);
        
        // ========== 5단계: 폭발 - 결과 공개 ==========
        crystal.classList.remove('spinning', 'charging', 'trembling');
        overlay.classList.remove('blackout', 'rarity-hint-high', 'rarity-hint-mid', 'special-hint');
        
        // 빔 폭발
        this.explodeBeams();
        
        // 폭발 연출
        crystal.classList.add('exploding');
        overlay.classList.add('revealing');
        overlay.style.setProperty('--reveal-color', colorConfig.main);
        overlay.style.setProperty('--reveal-glow', colorConfig.glow);
        
        // 등급별 텍스트
        const revealTexts = {
            N: 'NORMAL',
            R: 'RARE!',
            SR: 'SUPER RARE',
            SSR: 'SSR',
            UR: 'ULTRA RARE',
            SPECIAL: 'MAIDEN SPECIAL'
        };
        this.showSummonText(revealTexts[highestRarity] || 'NORMAL', `reveal-${highestRarity.toLowerCase()}`);
        
        // 레인보우 효과 (UR)
        if (colorConfig.rainbow) {
            overlay.classList.add('rainbow');
        }
        
        // 폭발 VFX (등급별 강화)
        if (typeof VFX !== 'undefined') {
            const { cx, cy } = getCrystalCenter();
            
            // 화면 플래시
            VFX.screenFlash(colorConfig.main, 0.8);
            
            if (highestRarity === 'SPECIAL') {
                // SPECIAL - 무녀 카드 궁극의 연출
                VFX.criticalHit(cx, cy, { size: 600 });
                
                // 핑크 폭발 연속 (UR보다 더 강력)
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        const colors = ['#ff69b4', '#ff1493', '#ffb6c1', '#ff69b4', '#ff1493', '#ffffff', '#ffb6c1', '#ff69b4', '#ff1493', '#ffffff'];
                        VFX.shockwave(cx, cy, { color: colors[i], size: 700 - i * 50, lineWidth: 14 - i });
                    }, i * 70);
                }
                
                // 대량 파티클 폭발
                VFX.sparks(cx, cy, { color: '#ffffff', count: 200, speed: 45, size: 12 });
                VFX.sparks(cx, cy, { color: '#ff69b4', count: 150, speed: 40, size: 10 });
                VFX.sparks(cx, cy, { color: '#ff1493', count: 100, speed: 35, size: 8 });
                VFX.sparks(cx, cy, { color: '#ffb6c1', count: 80, speed: 30, size: 6 });
                
                // 추가 핑크 충격파 (지연)
                setTimeout(() => {
                    VFX.shockwave(cx, cy, { color: '#ffffff', size: 900, lineWidth: 4 });
                    VFX.screenFlash('#ff69b4', 0.5);
                }, 200);
                setTimeout(() => {
                    VFX.shockwave(cx, cy, { color: '#ff69b4', size: 1000, lineWidth: 2 });
                }, 400);
                
                // 강력한 화면 흔들림
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(30, 1000);
                }
                
                console.log('[Gacha] MAIDEN SPECIAL 궁극 연출!');
                
            } else if (highestRarity === 'UR') {
                // UR - 최강 연출
                VFX.criticalHit(cx, cy, { size: 500 });
                
                // 다중 무지개 충격파
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#8800ff', '#ff00ff', '#ffffff'];
                        VFX.shockwave(cx, cy, { color: colors[i], size: 600 - i * 50, lineWidth: 12 - i });
                    }, i * 80);
                }
                
                // 폭발 파티클
                VFX.sparks(cx, cy, { color: '#ffffff', count: 150, speed: 40, size: 10 });
                VFX.sparks(cx, cy, { color: '#ffd700', count: 100, speed: 35, size: 8 });
                
                // 추가 혈흔/임팩트 (극적 연출)
                setTimeout(() => VFX.shockwave(cx, cy, { color: '#ffffff', size: 800, lineWidth: 3 }), 200);
                
            } else if (highestRarity === 'SSR') {
                // SSR - 금빛 폭발
                VFX.criticalHit(cx, cy, { size: 350 });
                VFX.shockwave(cx, cy, { color: '#ffd700', size: 450, lineWidth: 10 });
                VFX.shockwave(cx, cy, { color: '#ffaa00', size: 400, lineWidth: 7 });
                VFX.shockwave(cx, cy, { color: '#ff8800', size: 350, lineWidth: 5 });
                VFX.sparks(cx, cy, { color: '#ffd700', count: 80, speed: 30, size: 7 });
                VFX.sparks(cx, cy, { color: '#ffffff', count: 40, speed: 25, size: 5 });
                
            } else if (highestRarity === 'SR') {
                // SR - 보라빛 폭발
                VFX.impact(cx, cy, { color: '#a855f7', size: 250 });
                VFX.shockwave(cx, cy, { color: '#a855f7', size: 350, lineWidth: 6 });
                VFX.shockwave(cx, cy, { color: '#c084fc', size: 300, lineWidth: 4 });
                VFX.sparks(cx, cy, { color: '#c084fc', count: 50, speed: 22, size: 6 });
                
            } else if (highestRarity === 'R') {
                // R - 파란빛
                VFX.impact(cx, cy, { color: '#3b82f6', size: 180 });
                VFX.shockwave(cx, cy, { color: '#3b82f6', size: 250, lineWidth: 4 });
                VFX.sparks(cx, cy, { color: '#60a5fa', count: 35, speed: 18, size: 5 });
                
            } else {
                // N - 기본
                VFX.impact(cx, cy, { color: '#888888', size: 120 });
                VFX.shockwave(cx, cy, { color: '#aaaaaa', size: 180, lineWidth: 3 });
                VFX.sparks(cx, cy, { color: '#aaaaaa', count: 20, speed: 12, size: 4 });
            }
        }
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            const shakeIntensity = { N: 5, R: 12, SR: 18, SSR: 30, UR: 50 };
            const shakeDuration = { N: 200, R: 350, SR: 500, SSR: 700, UR: 1000 };
            EffectSystem.screenShake(shakeIntensity[highestRarity], shakeDuration[highestRarity]);
        }
        
        await this.wait(timing.reveal);
        
        // 정리
        crystal.classList.remove('exploding');
        overlay.classList.remove('revealing', 'rainbow');
        this.hideSummonText();
    },
    
    // 소환 텍스트 표시
    showSummonText(text, className) {
        let textEl = document.querySelector('.gacha-summon-text');
        if (!textEl) {
            textEl = document.createElement('div');
            textEl.className = 'gacha-summon-text';
            document.querySelector('.gacha-overlay')?.appendChild(textEl);
        }
        textEl.textContent = text;
        textEl.className = `gacha-summon-text ${className} active`;
    },
    
    hideSummonText() {
        const textEl = document.querySelector('.gacha-summon-text');
        if (textEl) {
            textEl.classList.remove('active');
            setTimeout(() => textEl.remove(), 300);
        }
    },
    
    // 수렴 파티클 생성
    createConvergingParticles(target) {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'gacha-converge-particle';
                
                // 랜덤 시작 위치 (화면 가장자리)
                const angle = Math.random() * Math.PI * 2;
                const distance = 300 + Math.random() * 200;
                const startX = cx + Math.cos(angle) * distance;
                const startY = cy + Math.sin(angle) * distance;
                
                particle.style.cssText = `
                    position: fixed;
                    left: ${startX}px;
                    top: ${startY}px;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #ffb6c1 0%, transparent 70%);
                    border-radius: 50%;
                    z-index: 100010;
                    pointer-events: none;
                    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                `;
                
                document.body.appendChild(particle);
                
                requestAnimationFrame(() => {
                    particle.style.left = `${cx}px`;
                    particle.style.top = `${cy}px`;
                    particle.style.transform = 'scale(0)';
                    particle.style.opacity = '0';
                });
                
                setTimeout(() => particle.remove(), 1200);
            }, i * 80);
        }
    },
    
    // 빔 컨테이너 생성
    createBeamContainer(target) {
        if (!target) return null;
        
        const container = document.createElement('div');
        container.className = 'gacha-beam-container';
        container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            z-index: 3;
            pointer-events: none;
        `;
        
        target.appendChild(container);
        return container;
    },
    
    // 개별 빔 추가
    addBeam(container, index, total) {
        if (!container) return;
        
        const beam = document.createElement('div');
        beam.className = 'gacha-beam';
        
        // 빔 각도 계산 (균등 분배 + 약간의 랜덤)
        const baseAngle = (index / total) * 360;
        const angle = baseAngle + (Math.random() - 0.5) * 10;
        
        // 빔 색상 (그라데이션)
        const colors = ['#ff88aa', '#ffb6c1', '#ffd700', '#ff69b4', '#ffffff'];
        const color = colors[index % colors.length];
        
        // 빔 길이 (점점 길어짐)
        const length = 200 + (index / total) * 400;
        const width = 2 + Math.random() * 3;
        
        beam.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${length}px;
            height: ${width}px;
            background: linear-gradient(90deg, 
                ${color} 0%, 
                rgba(255, 255, 255, 0.8) 30%,
                rgba(255, 255, 255, 0.4) 60%,
                transparent 100%);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            opacity: 0;
            animation: beamAppear 0.3s ease forwards, beamPulse 0.8s ease infinite;
            animation-delay: 0s, 0.3s;
            filter: blur(1px);
            box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        `;
        
        container.appendChild(beam);
        
        // VFX: 빔 끝에서 스파크
        setTimeout(() => {
            if (typeof VFX !== 'undefined') {
                const rect = container.getBoundingClientRect();
                const cx = rect.left;
                const cy = rect.top;
                const rad = angle * Math.PI / 180;
                const sparkX = cx + Math.cos(rad) * length * 0.8;
                const sparkY = cy + Math.sin(rad) * length * 0.8;
                VFX.sparks(sparkX, sparkY, { color: color, count: 3, speed: 4, size: 2 });
            }
        }, 200);
    },
    
    // 빔 폭발 (결과 공개 시)
    explodeBeams() {
        if (this.beamInterval) {
            clearInterval(this.beamInterval);
            this.beamInterval = null;
        }
        
        const container = this.beamContainer;
        if (!container) return;
        
        // 모든 빔에 폭발 애니메이션 적용
        const beams = container.querySelectorAll('.gacha-beam');
        beams.forEach((beam, i) => {
            beam.style.animation = 'beamExplode 0.5s ease forwards';
            beam.style.animationDelay = `${i * 0.02}s`;
        });
        
        // 컨테이너 제거
        setTimeout(() => {
            container.remove();
            this.beamContainer = null;
        }, 800);
    },
    
    // ==========================================
    // 결과 표시 (실제 카드 디자인 + 딜링 애니메이션)
    // ==========================================
    async showResults(results) {
        const overlay = document.querySelector('.gacha-overlay');
        
        // 기존 결과창 제거
        const existingResults = document.querySelector('.gacha-results');
        if (existingResults) existingResults.remove();
        
        // 최고 등급 확인
        const highestRarity = this.getHighestRarity(results);
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'gacha-results';
        
        // 헤더와 카드 영역만 먼저 생성 (배경 없음)
        resultsContainer.innerHTML = `
            <div class="gacha-results-header">
                <span class="gacha-results-title">소환 결과</span>
            </div>
            <div class="gacha-dealing-area"></div>
            <div class="gacha-results-buttons">
                <button class="gacha-results-close" type="button">확인</button>
            </div>
        `;
        
        overlay.appendChild(resultsContainer);
        
        // 이벤트 리스너 직접 연결
        const closeBtn = resultsContainer.querySelector('.gacha-results-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeResults();
            });
        }
        
        requestAnimationFrame(() => {
            resultsContainer.classList.add('active');
        });
        
        await this.wait(300);
        
        // 카드 딜링 영역
        const dealingArea = resultsContainer.querySelector('.gacha-dealing-area');
        
        // 딜링 연출로 카드 추가
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const colorConfig = this.config.colors[result.rarity];
            const cardData = typeof cardDatabase !== 'undefined' ? cardDatabase[result.cardId] : null;
            
            // 실제 카드 디자인 생성
            const cardWrapper = this.createRealCardElement(cardData, result, colorConfig);
            cardWrapper.classList.add('gacha-dealt-card');
            cardWrapper.style.setProperty('--deal-index', i);
            cardWrapper.style.setProperty('--card-color', colorConfig.main);
            cardWrapper.style.setProperty('--card-glow', colorConfig.glow);
            
            dealingArea.appendChild(cardWrapper);
            
            // 딜링 VFX (카드 착지 타이밍 = 약 0.24초 후)
            const landingDelay = i * 120 + 240;
            setTimeout(() => {
                if (typeof VFX !== 'undefined') {
                    const rect = cardWrapper.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    
                    // 착지 스파크
                    VFX.sparks(cx, cy, {
                        color: colorConfig.main,
                        count: 12,
                        speed: 6,
                        size: 4
                    });
                    
                    // 높은 등급은 추가 VFX
                    if (result.rarity === 'UR' || result.rarity === 'SSR') {
                        VFX.shockwave(cx, cy, {
                            color: colorConfig.main,
                            size: 180,
                            lineWidth: 4
                        });
                        VFX.screenFlash(colorConfig.main, 0.15);
                    }
                    
                    // SPECIAL (무녀 카드) - 최고급 VFX
                    if (result.rarity === 'SPECIAL') {
                        // 핑크 충격파 연속
                        VFX.shockwave(cx, cy, { color: '#ff69b4', size: 250, lineWidth: 6 });
                        setTimeout(() => {
                            VFX.shockwave(cx, cy, { color: '#ffb6c1', size: 200, lineWidth: 4 });
                        }, 100);
                        
                        // 화면 플래시
                        VFX.screenFlash('#ff69b4', 0.3);
                        
                        // 스파크 폭발
                        for (let j = 0; j < 3; j++) {
                            setTimeout(() => {
                                VFX.sparks(cx, cy, { color: '#ff69b4', count: 20, speed: 10, size: 5 });
                            }, j * 100);
                        }
                        
                        // 화면 흔들림
                        if (typeof EffectSystem !== 'undefined') {
                            EffectSystem.screenShake(15, 500);
                        }
                        
                        console.log('[Gacha] MAIDEN SPECIAL 카드 등장!');
                    }
                }
            }, landingDelay);
            
            // 딜링 딜레이 (애니메이션 딜레이와 맞춤)
            await this.wait(120);
            
            // 덱에 카드 추가
            if (typeof gameState !== 'undefined' && cardData) {
                const newCard = { ...cardData, instanceId: `${cardData.id}_${Date.now()}_${Math.random()}` };
                gameState.deck.push(newCard);
            }
        }
    },
    
    // 실제 카드 디자인 요소 생성 (단순화 - 앞면만)
    createRealCardElement(cardData, result, colorConfig) {
        const wrapper = document.createElement('div');
        wrapper.className = `gacha-result-card rarity-${result.rarity.toLowerCase()}`;
        
        const cardName = cardData ? cardData.name : result.cardId;
        const cardCost = cardData ? cardData.cost : 0;
        const cardIcon = cardData ? cardData.icon : '?';
        const cardDesc = cardData ? (cardData.description || '') : '';
        const cardType = cardData ? (cardData.type === 'attack' || cardData.type?.id === 'attack' ? 'attack' : 'skill') : 'skill';
        
        // 설명 처리
        const descHtml = cardDesc.split('<br>').map(line => 
            `<div class="desc-line">${line.trim()}</div>`
        ).join('');
        
        // 아이콘 처리
        let iconHtml = cardIcon;
        if (cardIcon && cardIcon.includes('<img')) {
            iconHtml = cardIcon;
        }
        
        // 단순하게 카드 앞면만 표시
        wrapper.innerHTML = `
            <div class="card ${cardType}">
                <div class="card-cost">${cardCost}</div>
                <div class="card-header">
                    <div class="card-name">${cardName}</div>
                    <div class="card-type">${cardType === 'attack' ? 'ATTACK' : 'SKILL'}</div>
                </div>
                <div class="card-image">${iconHtml}</div>
                <div class="card-description">${descHtml}</div>
            </div>
        `;
        
        return wrapper;
    },
    
    closeResults() {
        const results = document.querySelector('.gacha-results');
        if (results) {
            results.classList.add('closing');
            setTimeout(() => {
                results.remove();
            }, 300);
        }
    },
    
    // ==========================================
    // 메시지
    // ==========================================
    showMessage(text, type = 'info') {
        const msg = document.createElement('div');
        msg.className = `gacha-message gacha-message-${type}`;
        msg.textContent = text;
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    },
    
    // ==========================================
    // 버튼 활성화/비활성화
    // ==========================================
    setButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.gacha-btn');
        buttons.forEach(btn => {
            if (!btn.classList.contains('used')) {
                btn.disabled = !enabled;
                btn.style.pointerEvents = enabled ? 'auto' : 'none';
                btn.style.opacity = enabled ? '1' : '0.5';
            }
        });
    },
    
    // ==========================================
    // 아웃트로와 함께 닫기
    // ==========================================
    async closeWithOutro() {
        const overlay = document.querySelector('.gacha-overlay');
        if (overlay) overlay.classList.add('fading-content');
        
        await this.wait(500);
        
        // 아웃트로 화면
        const outro = document.createElement('div');
        outro.id = 'gacha-outro';
        outro.className = 'gacha-outro';
        outro.innerHTML = `
            <div class="gacha-outro-bg"></div>
            <div class="gacha-outro-content">
                <div class="outro-icon">
                    <img src="crystal.png" alt="Crystal" class="outro-crystal-img">
                </div>
                <div class="outro-text">${this.getRandomDialogue('outro')}</div>
                <div class="outro-line"></div>
            </div>
        `;
        
        document.body.appendChild(outro);
        requestAnimationFrame(() => outro.classList.add('show'));
        
        await this.wait(2500);
        
        outro.classList.add('fade-out');
        await this.wait(800);
        outro.remove();
        
        this.close();
    },
    
    // ==========================================
    // 닫기
    // ==========================================
    close() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        
        const overlay = document.querySelector('.gacha-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 500);
        }
        
        this.isActive = false;
        
        // 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
        }
        
        // 맵으로 돌아가기
        if (typeof MapSystem !== 'undefined') {
            MapSystem.showMap();
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    getRandomDialogue(category) {
        const list = this.dialogues[category];
        if (!list) return '';
        return list[Math.floor(Math.random() * list.length)];
    },
    
    async typeText(element, text) {
        if (!element) return;
        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.wait(40);
        }
    },
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('gacha-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gacha-styles';
        style.textContent = `
            /* ==========================================
               인트로 화면
               ========================================== */
            .gacha-intro {
                position: fixed;
                inset: 0;
                z-index: 100001;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                opacity: 0;
            }
            
            .gacha-intro.show {
                opacity: 1;
                transition: none;
            }
            
            .gacha-intro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .gacha-intro-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at center, rgba(255, 100, 150, 0.2) 0%, transparent 50%),
                    linear-gradient(180deg, #1a0a1a 0%, #0a0a1a 100%);
            }
            
            .gacha-intro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: gachaIntroReveal 1.5s ease-out forwards;
            }
            
            @keyframes gachaIntroReveal {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .gacha-intro-icon {
                margin-bottom: 30px;
                animation: introIconFloat 3s ease-in-out infinite;
            }
            
            .intro-crystal-img {
                width: 120px;
                height: 120px;
                object-fit: contain;
                filter: drop-shadow(0 0 30px rgba(255, 100, 200, 0.8));
                animation: introCrystalSpin 4s linear infinite;
            }
            
            @keyframes introCrystalSpin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes introIconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .gacha-intro-title {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: #ffb6c1;
                letter-spacing: 0.4em;
                text-shadow: 0 0 40px rgba(255, 182, 193, 0.5);
                margin-bottom: 15px;
            }
            
            .gacha-intro-subtitle {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #a080a0;
                letter-spacing: 0.5em;
                margin-bottom: 30px;
            }
            
            .gacha-intro-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 182, 193, 0.6), transparent);
                animation: gachaIntroLine 1.5s ease-out forwards;
            }
            
            @keyframes gachaIntroLine {
                0% { width: 0; opacity: 0; }
                100% { width: 200px; opacity: 1; }
            }
            
            /* ==========================================
               메인 오버레이
               ========================================== */
            .gacha-overlay {
                position: fixed;
                top: 50px; /* TopBar 아래부터 */
                left: 0;
                right: 0;
                bottom: 0;
                background: #000;
                z-index: 9990;
                opacity: 0;
                transition: opacity 0.5s ease;
                --reveal-color: #f59e0b;
                --reveal-glow: #fbbf24;
            }
            
            .gacha-overlay.visible { opacity: 1; }
            
            .gacha-overlay.fading-content .gacha-container {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .gacha-overlay.focusing {
                animation: gachaFocus 0.8s ease;
            }
            
            @keyframes gachaFocus {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(0.5); }
            }
            
            .gacha-overlay.revealing {
                animation: gachaReveal 1.5s ease;
            }
            
            @keyframes gachaReveal {
                0% { background: #0a0a1a; filter: brightness(0.2); }
                10% { background: #fff; filter: brightness(5); }
                20% { background: var(--reveal-color); filter: brightness(2); }
                40% { background: var(--reveal-color); filter: brightness(1.5); }
                100% { background: #0a0a1a; filter: brightness(1); }
            }
            
            .gacha-overlay.rainbow {
                animation: gachaRainbow 2s ease;
            }
            
            @keyframes gachaRainbow {
                0% { background: #000; }
                5% { background: #fff; filter: brightness(5); }
                10% { background: #ff0000; filter: brightness(2); }
                20% { background: #ff8800; }
                35% { background: #ffff00; }
                50% { background: #00ff00; }
                65% { background: #0088ff; }
                80% { background: #8800ff; }
                90% { background: #ff00ff; }
                100% { background: #0a0a1a; filter: brightness(1); }
            }
            
            /* 레터박스 */
            .gacha-letterbox {
                position: absolute;
                left: 0;
                width: 100%;
                height: 5%;
                background: #000;
                z-index: 20;
            }
            .gacha-letterbox.top { top: 0; }
            .gacha-letterbox.bottom { bottom: 0; }
            
            /* 꽃밭 배경 (크리스탈/무녀 뒤) */
            .gacha-flower-bg {
                position: absolute;
                inset: 0;
                z-index: 0;
                background: url('gacha_done.png') center center / cover no-repeat;
                opacity: 0.6;
            }
            
            /* 배경 그라데이션 */
            .gacha-bg {
                position: absolute;
                inset: 0;
                z-index: 1;
                background: 
                    radial-gradient(ellipse at 50% 80%, transparent 30%, rgba(0, 0, 0, 0.7) 100%),
                    radial-gradient(ellipse at 30% 50%, rgba(255, 100, 150, 0.1) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 50%, rgba(100, 150, 255, 0.08) 0%, transparent 50%);
            }
            
            .gacha-vignette {
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%);
                pointer-events: none;
                z-index: 2;
                opacity: 0.5;
            }
            
            /* 파티클 */
            .gacha-particles {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 3;
                overflow: hidden;
            }
            
            .gacha-particle {
                position: absolute;
                bottom: -10px;
                width: 4px;
                height: 4px;
                background: rgba(255, 182, 193, 0.6);
                border-radius: 50%;
                animation: gachaParticleFloat 4s ease-out forwards;
                box-shadow: 0 0 8px rgba(255, 182, 193, 0.4);
            }
            
            @keyframes gachaParticleFloat {
                to { transform: translateY(-100vh); opacity: 0; }
            }
            
            /* ==========================================
               무녀 캐릭터 (크리스탈 아래 중앙 배치)
               ========================================== */
            .gacha-mugirl {
                position: relative;
                width: 280px;
                height: 320px;
                margin-top: -20px;
                z-index: 5;
                pointer-events: none;
                animation: mugirlAppear 1s ease-out 0.5s both;
            }
            
            @keyframes mugirlAppear {
                0% { 
                    opacity: 0; 
                    transform: translateY(40px) scale(0.8);
                    filter: brightness(0) blur(5px);
                }
                50% {
                    filter: brightness(1.3) blur(0);
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1);
                    filter: brightness(1) blur(0);
                }
            }
            
            .gacha-mugirl-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: center top;
                filter: drop-shadow(0 0 40px rgba(255, 100, 150, 0.6))
                        drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6));
                animation: mugirlFloat 4s ease-in-out infinite 1.5s;
            }
            
            @keyframes mugirlFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .gacha-mugirl-glow {
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                width: 220px;
                height: 120px;
                background: radial-gradient(ellipse at center, rgba(255, 100, 150, 0.5) 0%, rgba(255, 150, 200, 0.2) 40%, transparent 70%);
                pointer-events: none;
                animation: mugirlGlowPulse 2.5s ease-in-out infinite;
            }
            
            @keyframes mugirlGlowPulse {
                0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
            }
            
            /* ==========================================
               플레이어 캐릭터 (오른쪽)
               ========================================== */
            .gacha-player-char {
                position: absolute;
                right: 15%;
                bottom: 5%;
                width: 250px;
                height: 60%;
                z-index: 5;
                pointer-events: none;
                animation: playerCharAppear 0.8s ease-out 0.5s both;
            }
            
            @keyframes playerCharAppear {
                0% { 
                    opacity: 0; 
                    transform: translateX(30px);
                }
                100% { 
                    opacity: 1; 
                    transform: translateX(0);
                }
            }
            
            .gacha-player-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: bottom center;
                filter: drop-shadow(0 0 20px rgba(100, 150, 255, 0.4));
                image-rendering: pixelated;
            }
            
            .gacha-player-glow {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 150%;
                height: 40%;
                background: radial-gradient(ellipse at bottom center, rgba(100, 150, 255, 0.25) 0%, transparent 70%);
                pointer-events: none;
            }
            
            /* ==========================================
               컨테이너
               ========================================== */
            .gacha-container {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 50px 40px 60px;
                z-index: 10;
                overflow-y: auto;
            }
            
            /* 헤더 */
            .gacha-header {
                text-align: center;
                margin-bottom: 15px;
            }
            
            .gacha-title {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .gacha-title-jp {
                font-size: 2.5rem;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 
                    0 0 20px rgba(255, 215, 0, 0.8),
                    0 0 40px rgba(255, 215, 0, 0.4);
                font-family: 'Cinzel', serif;
                letter-spacing: 8px;
            }
            
            .gacha-title-sub {
                font-size: 1rem;
                color: rgba(255, 215, 0, 0.6);
                font-style: italic;
                letter-spacing: 4px;
            }
            
            .gacha-banner {
                margin-top: 15px;
            }
            
            .gacha-rate-up {
                display: inline-block;
                padding: 8px 25px;
                background: linear-gradient(90deg, transparent, rgba(255, 100, 150, 0.3), transparent);
                border: 1px solid rgba(255, 100, 150, 0.5);
                color: #ffb6c1;
                font-size: 0.9rem;
                letter-spacing: 3px;
                animation: gachaRateUpPulse 2s ease infinite;
            }
            
            @keyframes gachaRateUpPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.02); }
            }
            
            /* ==========================================
               대화창
               ========================================== */
            .gacha-dialogue-area {
                margin-bottom: 20px;
                width: 100%;
                max-width: 500px;
            }
            
            .gacha-dialogue-box {
                background: rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(255, 182, 193, 0.3);
                border-bottom: 1px solid rgba(255, 182, 193, 0.3);
                padding: 18px 30px;
                text-align: center;
                min-height: 24px;
            }
            
            .gacha-dialogue-text {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.05rem;
                color: #ffb6c1;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
                line-height: 1.6;
            }
            
            /* ==========================================
               크리스탈 영역
               ========================================== */
            .gacha-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .gacha-crystal-area {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .gacha-crystal-container {
                position: relative;
                width: 200px;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .gacha-crystal {
                position: relative;
                z-index: 10;
            }
            
            .gacha-crystal-img {
                width: 150px;
                height: 150px;
                object-fit: contain;
                filter: drop-shadow(0 0 30px rgba(0, 255, 255, 0.6));
                animation: crystalFloat 3s ease-in-out infinite;
            }
            
            @keyframes crystalFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
            }
            
            .gacha-crystal-ring {
                position: absolute;
                border: 2px solid rgba(255, 182, 193, 0.3);
                border-radius: 50%;
                animation: gachaRingRotate 3s linear infinite;
            }
            
            .gacha-crystal-ring.ring-1 {
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                animation-duration: 4s;
            }
            
            .gacha-crystal-ring.ring-2 {
                width: 130%;
                height: 130%;
                top: -15%;
                left: -15%;
                animation-duration: 6s;
                animation-direction: reverse;
            }
            
            .gacha-crystal-ring.ring-3 {
                width: 160%;
                height: 160%;
                top: -30%;
                left: -30%;
                animation-duration: 8s;
                border-style: dashed;
            }
            
            @keyframes gachaRingRotate {
                to { transform: rotate(360deg); }
            }
            
            .gacha-crystal-glow {
                position: absolute;
                width: 250px;
                height: 250px;
                background: radial-gradient(circle, rgba(255, 182, 193, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                animation: gachaGlowPulse 2s ease infinite;
                pointer-events: none;
            }
            
            @keyframes gachaGlowPulse {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }
            
            /* ==========================================
               크리스탈 애니메이션 상태
               ========================================== */
            
            /* 시작 단계 */
            .gacha-crystal.phase-start .gacha-crystal-img {
                animation: crystalAwaken 0.8s ease;
            }
            
            @keyframes crystalAwaken {
                0% { filter: brightness(0.5) drop-shadow(0 0 10px rgba(255, 182, 193, 0.3)); }
                100% { filter: brightness(1) drop-shadow(0 0 30px rgba(255, 182, 193, 0.6)); }
            }
            
            /* 회전 */
            .gacha-crystal.spinning .gacha-crystal-img {
                animation: crystalSpin 0.8s linear infinite;
            }
            
            @keyframes crystalSpin {
                to { transform: rotate(360deg); }
            }
            
            .gacha-crystal.spinning.charging .gacha-crystal-img {
                animation: crystalSpinCharge 0.4s linear infinite;
                filter: drop-shadow(0 0 50px rgba(255, 215, 0, 0.8)) 
                        drop-shadow(0 0 100px rgba(255, 182, 193, 0.6));
            }
            
            @keyframes crystalSpinCharge {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.15); }
                100% { transform: rotate(360deg) scale(1); }
            }
            
            /* 떨림 */
            .gacha-crystal.trembling .gacha-crystal-img {
                animation: crystalTremble 0.05s linear infinite;
            }
            
            @keyframes crystalTremble {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(-3px, 2px); }
                50% { transform: translate(3px, -2px); }
                75% { transform: translate(-2px, -3px); }
            }
            
            /* 폭발 */
            .gacha-crystal.exploding .gacha-crystal-img {
                animation: crystalExplode 0.8s ease forwards;
            }
            
            @keyframes crystalExplode {
                0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                30% { transform: scale(1.5); opacity: 1; filter: brightness(3); }
                60% { transform: scale(2.5); opacity: 0.8; filter: brightness(5); }
                100% { transform: scale(4); opacity: 0; filter: brightness(10); }
            }
            
            /* ==========================================
               빔 효과
               ========================================== */
            .gacha-beam-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            @keyframes beamAppear {
                0% { 
                    opacity: 0; 
                    width: 0;
                    filter: blur(5px);
                }
                100% { 
                    opacity: 0.9; 
                    filter: blur(1px);
                }
            }
            
            @keyframes beamPulse {
                0%, 100% { 
                    opacity: 0.7;
                    filter: blur(1px) brightness(1);
                }
                50% { 
                    opacity: 1;
                    filter: blur(0.5px) brightness(1.5);
                }
            }
            
            @keyframes beamExplode {
                0% { 
                    opacity: 1;
                    transform: rotate(var(--angle)) scaleX(1);
                    filter: brightness(1);
                }
                30% {
                    opacity: 1;
                    transform: rotate(var(--angle)) scaleX(1.5) scaleY(2);
                    filter: brightness(3);
                }
                100% { 
                    opacity: 0;
                    transform: rotate(var(--angle)) scaleX(3) scaleY(0);
                    filter: brightness(5);
                }
            }
            
            /* ==========================================
               오버레이 연출 상태
               ========================================== */
            
            /* 어두워지기 */
            .gacha-overlay.darkening {
                animation: overlayDarken 1s ease forwards;
            }
            
            @keyframes overlayDarken {
                to { filter: brightness(0.6); }
            }
            
            /* 완전 암전 */
            .gacha-overlay.blackout {
                animation: overlayBlackout 0.3s ease forwards;
            }
            
            @keyframes overlayBlackout {
                to { filter: brightness(0.2); }
            }
            
            /* 높은 등급 힌트 */
            .gacha-overlay.rarity-hint-high {
                animation: rarityHintHigh 0.5s ease infinite;
            }
            
            @keyframes rarityHintHigh {
                0%, 100% { filter: brightness(0.2); }
                50% { filter: brightness(0.5) sepia(0.5) saturate(2); }
            }
            
            .gacha-overlay.rarity-hint-mid {
                animation: rarityHintMid 0.3s ease;
            }
            
            @keyframes rarityHintMid {
                0%, 100% { filter: brightness(0.2); }
                50% { filter: brightness(0.4); }
            }
            
            /* ==========================================
               소환 텍스트
               ========================================== */
            .gacha-summon-text {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: bold;
                color: #fff;
                z-index: 10015;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
                text-align: center;
                white-space: nowrap;
                letter-spacing: 4px;
                /* 그림자만으로 가독성 */
                text-shadow: 
                    0 0 20px currentColor,
                    0 0 40px currentColor,
                    3px 3px 8px #000,
                    -3px -3px 8px #000,
                    3px -3px 8px #000,
                    -3px 3px 8px #000,
                    0 0 15px #000;
            }
            
            .gacha-summon-text.active {
                opacity: 1;
            }
            
            .gacha-summon-text.start {
                font-size: 2rem;
                color: #ffb6c1;
            }
            
            .gacha-summon-text.charging {
                font-size: 2.2rem;
                color: #ffd700;
                animation: textPulse 0.5s ease infinite;
            }
            
            .gacha-summon-text.tension {
                font-size: 3.5rem;
                color: #fff;
                animation: textTension 0.1s linear infinite;
            }
            
            .gacha-summon-text.hint-high {
                font-size: 3rem;
                color: #ffd700;
                text-shadow: 
                    0 0 30px #ffd700,
                    0 0 60px #ff8800,
                    3px 3px 6px #000,
                    -3px -3px 6px #000;
                animation: textHintHigh 0.3s ease infinite;
            }
            
            .gacha-summon-text.hint-mid {
                font-size: 2.5rem;
                color: #c084fc;
                text-shadow: 
                    0 0 30px #a855f7,
                    0 0 60px #a855f7,
                    3px 3px 6px #000,
                    -3px -3px 6px #000;
            }
            
            /* SPECIAL 힌트 - 핑크 빛 */
            .gacha-summon-text.hint-special {
                font-size: 3.5rem;
                background: linear-gradient(90deg, #ff69b4, #ff1493, #ffb6c1, #ff69b4);
                background-size: 200% 100%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 0 20px #ff69b4) drop-shadow(0 0 40px #ff1493);
                animation: textHintSpecial 0.2s ease infinite, pinkGradientFast 0.5s linear infinite;
            }
            
            @keyframes textHintSpecial {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.15); }
            }
            
            @keyframes pinkGradientFast {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
            
            /* SPECIAL 오버레이 효과 */
            .gacha-overlay.special-hint {
                animation: specialHintOverlay 0.3s ease infinite !important;
            }
            
            @keyframes specialHintOverlay {
                0%, 100% { 
                    filter: brightness(0.2);
                    background: radial-gradient(circle at center, rgba(255,105,180,0.2) 0%, rgba(0,0,0,0.9) 100%);
                }
                50% { 
                    filter: brightness(0.6);
                    background: radial-gradient(circle at center, rgba(255,20,147,0.4) 0%, rgba(0,0,0,0.8) 100%);
                }
            }
            
            /* 결과 텍스트 */
            .gacha-summon-text.reveal-n {
                font-size: 2.5rem;
                color: #bbb;
            }
            
            .gacha-summon-text.reveal-r {
                font-size: 3rem;
                color: #60a5fa;
                text-shadow: 
                    0 0 30px #3b82f6,
                    0 0 60px #3b82f6,
                    3px 3px 6px #000,
                    -3px -3px 6px #000;
            }
            
            .gacha-summon-text.reveal-sr {
                font-size: 3.5rem;
                color: #c084fc;
                text-shadow: 
                    0 0 40px #a855f7,
                    0 0 80px #a855f7,
                    3px 3px 6px #000,
                    -3px -3px 6px #000;
                animation: textRevealSR 0.5s ease;
            }
            
            .gacha-summon-text.reveal-ssr {
                font-size: 4rem;
                color: #ffd700;
                text-shadow: 
                    0 0 50px #ffd700,
                    0 0 100px #ff8800,
                    4px 4px 8px #000,
                    -4px -4px 8px #000;
                animation: textRevealSSR 0.8s ease;
            }
            
            .gacha-summon-text.reveal-ur {
                font-size: 4.5rem;
                background: linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #8800ff, #ff0000);
                background-size: 200% 100%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 0 20px #fff) drop-shadow(0 0 40px #ffd700);
                -webkit-text-stroke: 0;
                animation: textRevealUR 1s ease, rainbowText 1s linear infinite;
            }
            
            .gacha-summon-text.reveal-special {
                font-size: 4.5rem;
                background: linear-gradient(90deg, #ff69b4, #ff1493, #ffb6c1, #ff69b4);
                background-size: 200% 100%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 0 30px #ff69b4) drop-shadow(0 0 60px #ff1493);
                -webkit-text-stroke: 0;
                animation: textRevealUR 1s ease, pinkGradient 2s linear infinite;
            }
            
            @keyframes pinkGradient {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
            
            @keyframes textPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.05); }
            }
            
            @keyframes textTension {
                0%, 100% { transform: translate(-50%, -50%); }
                25% { transform: translate(-52%, -48%); }
                75% { transform: translate(-48%, -52%); }
            }
            
            @keyframes textHintHigh {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
            }
            
            @keyframes textRevealSR {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes textRevealSSR {
                0% { transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); }
                100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
            }
            
            @keyframes textRevealUR {
                0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
                30% { transform: translate(-50%, -50%) scale(1.5); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                70% { transform: translate(-50%, -50%) scale(1.4); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes rainbowText {
                to { background-position: 200% 0; }
            }
            
            /* 확률 표시 */
            .gacha-rates-display {
                margin-top: 30px;
                display: flex;
                gap: 15px;
                font-size: 0.8rem;
            }
            
            .gacha-rate-item {
                padding: 5px 12px;
                border-radius: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid currentColor;
            }
            
            .gacha-rate-item.special { color: #ff69b4; }
            .gacha-rate-item.ur { color: #ef4444; }
            .gacha-rate-item.ssr { color: #f59e0b; }
            .gacha-rate-item.sr { color: #a855f7; }
            .gacha-rate-item.r { color: #3b82f6; }
            
            /* ==========================================
               버튼
               ========================================== */
            .gacha-buttons {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                padding: 30px 0;
                flex-wrap: wrap;
            }
            
            .gacha-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 120px;
                padding: 15px 25px;
                border: 2px solid;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .gacha-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .gacha-btn:hover::before {
                left: 100%;
            }
            
            .gacha-free {
                background: linear-gradient(180deg, #2a7a4a 0%, #1a4a2a 100%);
                border: 2px solid #22c55e;
                color: #fff;
                animation: gachaFreePulse 2s ease infinite;
            }
            
            @keyframes gachaFreePulse {
                0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }
                50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.6); }
            }
            
            .gacha-free:hover:not(.used) {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(34, 197, 94, 0.5);
            }
            
            .gacha-free.used {
                background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
                border: 2px solid #555;
                color: #666;
                animation: none;
                cursor: not-allowed;
            }
            
            .gacha-single {
                background: linear-gradient(180deg, #2a4a7a 0%, #1a2a4a 100%);
                border: 2px solid #3b82f6;
                color: #fff;
            }
            
            .gacha-single:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
            }
            
            .gacha-ten {
                background: linear-gradient(180deg, #7a4a2a 0%, #4a2a1a 100%);
                border: 2px solid #f59e0b;
                color: #fff;
            }
            
            .gacha-ten:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
            }
            
            .gacha-btn-label {
                font-size: 1rem;
                font-weight: bold;
                white-space: nowrap;
            }
            
            .gacha-btn-cost {
                font-size: 0.85rem;
                opacity: 0.8;
                white-space: nowrap;
            }
            
            .gacha-btn-bonus {
                position: absolute;
                top: -8px;
                right: -8px;
                padding: 3px 8px;
                background: #ef4444;
                color: #fff;
                font-size: 0.7rem;
                border-radius: 10px;
                animation: gachaBonusPulse 1s ease infinite;
            }
            
            @keyframes gachaBonusPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            /* 나가기 버튼 */
            .gacha-btn.gacha-exit {
                background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
                border-color: #666;
            }
            
            .gacha-btn.gacha-exit:hover {
                background: linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%);
                border-color: #888;
                box-shadow: 0 0 20px rgba(150, 150, 150, 0.3);
            }
            
            /* ==========================================
               결과 화면 (카드 딜링 스타일)
               ========================================== */
            .gacha-results {
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(20, 15, 30, 0.98) 0%, rgba(5, 5, 10, 0.99) 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 30px;
                opacity: 0;
                transform: scale(0.9);
                transition: all 0.4s ease;
                z-index: 100020;
                pointer-events: auto;
            }
            
            .gacha-results.active {
                opacity: 1;
                transform: scale(1);
            }
            
            .gacha-results.closing {
                opacity: 0;
                transform: scale(0.9);
            }
            
            /* 대박 배경 (SSR/UR) - 꽃밭 */
            .gacha-jackpot-bg {
                position: absolute;
                inset: 0;
                background-image: url('gacha_done.png');
                background-size: cover;
                background-position: center;
                z-index: -1;
                opacity: 0;
                animation: jackpotBgAppear 1.5s ease 0.5s forwards;
            }
            
            @keyframes jackpotBgAppear {
                0% {
                    opacity: 0;
                    transform: scale(1.2);
                    filter: brightness(0) blur(10px);
                }
                50% {
                    opacity: 0.8;
                    filter: brightness(1.5) blur(2px);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                    filter: brightness(1) blur(0);
                }
            }
            
            .gacha-results.jackpot {
                background: transparent;
            }
            
            .gacha-results.jackpot::before {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(255, 200, 220, 0.3) 0%, rgba(20, 15, 30, 0.7) 100%);
                z-index: 0;
                pointer-events: none;
            }
            
            .gacha-results.jackpot .gacha-results-header,
            .gacha-results.jackpot .gacha-dealing-area,
            .gacha-results.jackpot .gacha-results-buttons {
                position: relative;
                z-index: 1;
            }
            
            .gacha-results.jackpot .gacha-results-title {
                color: #ffd700;
                text-shadow: 
                    0 0 30px rgba(255, 215, 0, 0.8),
                    0 0 60px rgba(255, 150, 200, 0.6);
                animation: jackpotTitleGlow 1.5s ease infinite;
            }
            
            @keyframes jackpotTitleGlow {
                0%, 100% { 
                    text-shadow: 
                        0 0 30px rgba(255, 215, 0, 0.8),
                        0 0 60px rgba(255, 150, 200, 0.6);
                }
                50% { 
                    text-shadow: 
                        0 0 50px rgba(255, 215, 0, 1),
                        0 0 100px rgba(255, 150, 200, 0.8);
                }
            }
            
            .gacha-results-header {
                margin-bottom: 30px;
                animation: resultsHeaderIn 0.5s ease 0.2s both;
            }
            
            @keyframes resultsHeaderIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .gacha-results-title {
                font-size: 2.5rem;
                color: #ffd700;
                text-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
                font-family: 'Cinzel', serif;
                letter-spacing: 8px;
            }
            
            /* 카드 딜링 영역 */
            .gacha-dealing-area {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 15px;
                max-width: 1000px;
                width: 100%;
                max-height: 55vh;
                overflow-y: auto;
                padding: 20px;
                perspective: 1000px;
            }
            
            /* 가챠 결과 카드 (딜링 애니메이션) */
            .gacha-result-card {
                width: 140px;
                height: 200px;
                position: relative;
                opacity: 0;
                transform: translateY(-300px) scale(0.3) rotate(-15deg);
                animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                animation-delay: calc(var(--deal-index, 0) * 0.12s);
                pointer-events: none;
            }
            
            @keyframes cardDeal {
                0% {
                    transform: translateY(-300px) scale(0.3) rotate(-15deg);
                    opacity: 0;
                    filter: blur(5px);
                }
                40% {
                    transform: translateY(20px) scale(1.1) rotate(3deg);
                    opacity: 1;
                    filter: blur(0);
                }
                60% {
                    transform: translateY(-10px) scale(0.95) rotate(-2deg);
                }
                80% {
                    transform: translateY(5px) scale(1.02) rotate(1deg);
                }
                100% {
                    transform: translateY(0) scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            
            /* 딜링 시 그림자 효과 */
            .gacha-result-card.gacha-dealt-card {
                animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                           cardShadow 0.6s ease forwards;
                animation-delay: calc(var(--deal-index, 0) * 0.12s);
            }
            
            @keyframes cardShadow {
                0% {
                    box-shadow: 0 50px 60px rgba(0, 0, 0, 0.5);
                }
                40% {
                    box-shadow: 0 -5px 20px rgba(255, 255, 255, 0.3),
                                0 10px 30px rgba(0, 0, 0, 0.4);
                }
                100% {
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                }
            }
            
            /* 가챠 결과 카드 내부 게임 카드 스타일 */
            .gacha-result-card .card {
                width: 100%;
                height: 100%;
                margin: 0;
                transform: none !important;
                animation: none !important;
            }
            
            .gacha-result-card .card:hover {
                transform: none !important;
                box-shadow: inherit !important;
            }
            
            .gacha-result-card .card-cost {
                position: absolute;
                top: 5px;
                left: 5px;
                width: 28px;
                height: 28px;
                font-size: 1rem;
            }
            
            .gacha-result-card .card-header {
                padding: 8px 5px 3px 35px;
            }
            
            .gacha-result-card .card-name {
                font-size: 0.75rem;
            }
            
            .gacha-result-card .card-type {
                font-size: 0.55rem;
            }
            
            .gacha-result-card .card-image {
                flex: 1;
                font-size: 2.5rem;
                min-height: 60px;
            }
            
            .gacha-result-card .card-description {
                font-size: 0.6rem;
                padding: 5px 8px 8px;
                max-height: 50px;
            }
            
            /* 등급별 카드 광채 */
            .gacha-result-card.rarity-r {
                filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
            }
            
            .gacha-result-card.rarity-sr {
                filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.6));
            }
            
            .gacha-result-card.rarity-ssr.gacha-dealt-card {
                animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                           cardShadow 0.6s ease forwards,
                           ssrGlow 1.5s ease infinite 0.6s;
            }
            
            @keyframes ssrGlow {
                0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.7)); }
                50% { filter: drop-shadow(0 0 35px rgba(255, 215, 0, 0.9)); }
            }
            
            .gacha-result-card.rarity-ur.gacha-dealt-card {
                animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                           cardShadow 0.6s ease forwards,
                           urRainbow 2s linear infinite 0.6s;
            }
            
            .gacha-result-card.rarity-special.gacha-dealt-card {
                animation: cardDeal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                           cardShadow 0.6s ease forwards,
                           specialGlow 2s linear infinite 0.6s;
            }
            
            /* SPECIAL 카드 특수 마킹 */
            .gacha-result-card.rarity-special {
                position: relative;
            }
            
            .gacha-result-card.rarity-special::before {
                content: 'MAIDEN';
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #ff69b4 100%);
                color: #fff;
                font-size: 0.65rem;
                font-weight: bold;
                padding: 3px 12px;
                border-radius: 10px;
                z-index: 10;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 0 15px rgba(255, 105, 180, 0.8),
                            0 0 30px rgba(255, 105, 180, 0.5);
                animation: specialBadgePulse 1s ease infinite;
                letter-spacing: 2px;
            }
            
            .gacha-result-card.rarity-special::after {
                content: '';
                position: absolute;
                inset: -4px;
                border: 3px solid transparent;
                border-radius: 14px;
                background: linear-gradient(45deg, #ff69b4, #ff1493, #ff69b4, #ffb6c1) border-box;
                -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                animation: specialBorderRotate 3s linear infinite;
                pointer-events: none;
            }
            
            @keyframes specialBadgePulse {
                0%, 100% { 
                    transform: translateX(-50%) scale(1);
                    box-shadow: 0 0 15px rgba(255, 105, 180, 0.8),
                                0 0 30px rgba(255, 105, 180, 0.5);
                }
                50% { 
                    transform: translateX(-50%) scale(1.1);
                    box-shadow: 0 0 25px rgba(255, 105, 180, 1),
                                0 0 50px rgba(255, 105, 180, 0.8);
                }
            }
            
            @keyframes specialBorderRotate {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            
            @keyframes specialGlow {
                0%, 100% { filter: drop-shadow(0 0 25px rgba(255, 105, 180, 0.8)); }
                50% { filter: drop-shadow(0 0 40px rgba(255, 182, 193, 1)); }
            }
            
            @keyframes urRainbow {
                0% { filter: drop-shadow(0 0 25px #ff0000); }
                16% { filter: drop-shadow(0 0 25px #ff8800); }
                33% { filter: drop-shadow(0 0 25px #ffff00); }
                50% { filter: drop-shadow(0 0 25px #00ff00); }
                66% { filter: drop-shadow(0 0 25px #00ffff); }
                83% { filter: drop-shadow(0 0 25px #8800ff); }
                100% { filter: drop-shadow(0 0 25px #ff0000); }
            }
            
            /* 버튼 컨테이너 */
            .gacha-results-buttons {
                margin-top: 30px;
                z-index: 100025;
                position: relative;
            }
            
            .gacha-results-close {
                padding: 18px 80px;
                background: linear-gradient(180deg, #5a3a7a 0%, #3a2a5a 100%);
                border: 3px solid #8855bb;
                color: #fff;
                font-size: 1.2rem;
                font-family: 'Cinzel', serif;
                font-weight: bold;
                letter-spacing: 3px;
                border-radius: 40px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 5px 25px rgba(136, 85, 187, 0.4);
                position: relative;
                z-index: 100030;
                pointer-events: auto !important;
            }
            
            .gacha-results-close:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 10px 40px rgba(136, 85, 187, 0.6);
                background: linear-gradient(180deg, #7a4a9a 0%, #5a3a7a 100%);
                border-color: #aa77dd;
            }
            
            .gacha-results-close:active {
                transform: translateY(0) scale(0.98);
            }
            
            /* ==========================================
               아웃트로
               ========================================== */
            .gacha-outro {
                position: fixed;
                inset: 0;
                z-index: 100002;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                opacity: 0;
            }
            
            .gacha-outro.show {
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            .gacha-outro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .gacha-outro-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at center, rgba(255, 100, 150, 0.1) 0%, transparent 50%),
                    linear-gradient(180deg, #1a0a1a 0%, #0a0a1a 100%);
            }
            
            .gacha-outro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: outroReveal 0.8s ease-out forwards;
            }
            
            @keyframes outroReveal {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .outro-icon {
                margin-bottom: 30px;
            }
            
            .outro-crystal-img {
                width: 100px;
                height: 100px;
                object-fit: contain;
                filter: drop-shadow(0 0 30px rgba(255, 182, 193, 0.5));
                animation: outroCrystalPulse 2s ease-in-out infinite;
            }
            
            @keyframes outroCrystalPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
            }
            
            .outro-text {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #ffb6c1;
                font-style: italic;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                letter-spacing: 2px;
                text-align: center;
                margin-bottom: 30px;
            }
            
            .outro-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 182, 193, 0.5), transparent);
                animation: outroLine 1s ease-out 0.3s forwards;
            }
            
            @keyframes outroLine {
                to { width: 200px; }
            }
            
            /* ==========================================
               메시지
               ========================================== */
            .gacha-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 20px 40px;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 10px;
                color: #fff;
                font-size: 1.2rem;
                z-index: 100003;
                animation: gachaMessageIn 0.3s ease;
            }
            
            .gacha-message-error {
                border: 2px solid #ef4444;
                color: #ef4444;
            }
            
            @keyframes gachaMessageIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            .gacha-message.fade-out {
                animation: gachaMessageOut 0.3s ease forwards;
            }
            
            @keyframes gachaMessageOut {
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            /* ==========================================
               반응형
               ========================================== */
            @media (max-width: 900px) {
                .gacha-mugirl {
                    width: 200px;
                    height: 240px;
                }
            }
            
            @media (max-width: 700px) {
                .gacha-mugirl {
                    width: 150px;
                    height: 180px;
                    margin-top: -10px;
                }
                .gacha-title-jp {
                    font-size: 1.8rem;
                    letter-spacing: 4px;
                }
                .gacha-buttons {
                    gap: 10px;
                }
                .gacha-btn {
                    padding: 12px 25px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 등록
window.GachaEvent = GachaEvent;

// EventSystem 등록
if (typeof EventSystem !== 'undefined') {
    EventSystem.register('gacha', {
        id: 'gacha',
        name: '신비한 무녀',
        description: '운명의 카드를 소환하는 무녀를 만났다.',
        icon: '🔮',
        weight: 80,
        isFullscreen: true,
        condition: () => true,
        execute: (room) => GachaEvent.show(room)
    });
    console.log('[GachaEvent] EventSystem에 등록 완료!');
}

console.log('[GachaEvent] 가챠 이벤트 시스템 로드됨');

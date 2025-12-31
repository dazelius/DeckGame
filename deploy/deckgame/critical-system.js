// ==========================================
// Critical System - 회심 유물 & 크리티컬 시스템
// ==========================================

const CriticalSystem = {
    // 공격 카드 사용 카운터
    attackCounter: 0,
    
    // 크리티컬 발동 주기 (7번째 공격)
    criticalThreshold: 7,
    
    // 크리티컬 배율
    criticalMultiplier: 2.0,
    
    // 현재 크리티컬 준비 상태
    isCriticalReady: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.attackCounter = 0;
        this.isCriticalReady = false;
        this.updateCriticalUI();
        console.log('[CriticalSystem] Initialized');
    },
    
    // ==========================================
    // 전투 시작 시 리셋
    // ==========================================
    onBattleStart() {
        this.attackCounter = 0;
        this.isCriticalReady = false;
        this.updateCriticalUI();
    },
    
    // ==========================================
    // 공격 카드 사용 시 호출
    // ==========================================
    onAttackCardPlayed(card) {
        // 회심 유물이 없으면 무시
        if (typeof RelicSystem === 'undefined' || !RelicSystem.hasRelic('criticalStrike')) {
            return { isCritical: false, multiplier: 1.0 };
        }
        
        this.attackCounter++;
        
        // 7번째 공격인지 체크
        if (this.attackCounter >= this.criticalThreshold) {
            this.attackCounter = 0; // 카운터 리셋
            this.isCriticalReady = false;
            this.updateCriticalUI();
            
            // 크리티컬 이펙트 표시
            this.showCriticalEffect();
            addLog(`CRITICAL! x${this.criticalMultiplier}`, 'damage');
            
            return { isCritical: true, multiplier: this.criticalMultiplier };
        }
        
        // 다음 공격이 크리티컬인지 체크 (6번째 공격 후)
        if (this.attackCounter === this.criticalThreshold - 1) {
            this.isCriticalReady = true;
        } else {
            this.isCriticalReady = false;
        }
        
        this.updateCriticalUI();
        return { isCritical: false, multiplier: 1.0 };
    },
    
    // ==========================================
    // 크리티컬 UI 업데이트 (카드 스파크 효과)
    // ==========================================
    updateCriticalUI() {
        // 회심 유물이 없으면 무시
        if (typeof RelicSystem === 'undefined' || !RelicSystem.hasRelic('criticalStrike')) {
            this.removeCriticalEffects();
            return;
        }
        
        const handEl = document.getElementById('hand');
        if (!handEl) {
            console.log('[CriticalSystem] Hand element not found');
            return;
        }
        
        // 기존 효과 제거
        this.removeCriticalEffects();
        
        // 모든 카드 검사
        const allCards = handEl.querySelectorAll('.card');
        
        // 공격 카드 필터링
        const attackCards = [];
        allCards.forEach(cardEl => {
            const isAttack = cardEl.classList.contains('attack') || 
                            cardEl.dataset.type === 'attack';
            if (isAttack) {
                attackCards.push(cardEl);
            }
        });
        
        // 크리티컬 준비 상태면 무지개 빛 효과 추가
        if (this.isCriticalReady) {
            attackCards.forEach(cardEl => {
                cardEl.classList.add('critical-ready');
                this.addRainbowEffect(cardEl);
            });
        }
        
        // 유물 UI에도 카운터 표시
        this.updateRelicCounter();
    },
    
    // ==========================================
    // 무지개 빛 효과 추가
    // ==========================================
    addRainbowEffect(cardEl) {
        // 무지개 글로우 효과
        const rainbowGlow = document.createElement('div');
        rainbowGlow.className = 'critical-rainbow-glow';
        cardEl.appendChild(rainbowGlow);
        
        // 무지개 테두리
        const rainbowBorder = document.createElement('div');
        rainbowBorder.className = 'critical-rainbow-border';
        cardEl.appendChild(rainbowBorder);
    },
    
    // ==========================================
    // 스파크 효과 추가
    // ==========================================
    addSparkEffect(cardEl) {
        // 스파크 컨테이너
        const sparkContainer = document.createElement('div');
        sparkContainer.className = 'critical-spark-container';
        
        // 여러 개의 스파크 생성
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'critical-spark';
            spark.style.animationDelay = `${i * 0.15}s`;
            spark.style.left = `${10 + Math.random() * 80}%`;
            spark.style.top = `${10 + Math.random() * 80}%`;
            sparkContainer.appendChild(spark);
        }
        
        // 글로우 효과
        const glow = document.createElement('div');
        glow.className = 'critical-glow';
        cardEl.appendChild(glow);
        
        cardEl.appendChild(sparkContainer);
    },
    
    // ==========================================
    // 크리티컬 효과 제거
    // ==========================================
    removeCriticalEffects() {
        document.querySelectorAll('.critical-ready').forEach(el => {
            el.classList.remove('critical-ready');
        });
        document.querySelectorAll('.critical-rainbow-glow').forEach(el => el.remove());
        document.querySelectorAll('.critical-rainbow-border').forEach(el => el.remove());
        document.querySelectorAll('.relic-spark-container').forEach(el => el.remove());
    },
    
    // ==========================================
    // 유물 카운터 업데이트
    // ==========================================
    updateRelicCounter() {
        // relic-slot 또는 relic-item 둘 다 지원
        const relicEl = document.querySelector('.relic-slot[data-relic-id="criticalStrike"]') || 
                       document.querySelector('.relic-item[data-relic-id="criticalStrike"]');
        if (!relicEl) return;
        
        let counterEl = relicEl.querySelector('.relic-crit-counter');
        if (!counterEl) {
            counterEl = document.createElement('div');
            counterEl.className = 'relic-crit-counter';
            relicEl.appendChild(counterEl);
        }
        
        // 6/7 형식으로 표시
        counterEl.textContent = `${this.attackCounter}/${this.criticalThreshold}`;
        
        if (this.isCriticalReady) {
            counterEl.classList.add('ready');
            relicEl.classList.add('critical-ready');
            
            // 크리티컬 준비 시 유물에도 스파크 추가
            if (!relicEl.querySelector('.relic-spark-container')) {
                this.addRelicSparkEffect(relicEl);
            }
        } else {
            counterEl.classList.remove('ready');
            relicEl.classList.remove('critical-ready');
            
            // 스파크 제거
            const sparkContainer = relicEl.querySelector('.relic-spark-container');
            if (sparkContainer) sparkContainer.remove();
        }
    },
    
    // ==========================================
    // 유물에 스파크 효과 추가
    // ==========================================
    addRelicSparkEffect(relicEl) {
        const sparkContainer = document.createElement('div');
        sparkContainer.className = 'relic-spark-container';
        
        for (let i = 0; i < 6; i++) {
            const spark = document.createElement('div');
            spark.className = 'relic-spark';
            spark.style.animationDelay = `${i * 0.2}s`;
            sparkContainer.appendChild(spark);
        }
        
        relicEl.appendChild(sparkContainer);
    },
    
    // ==========================================
    // 크리티컬 발동 이펙트 (강화 버전)
    // ==========================================
    showCriticalEffect() {
        // 🎬 카메라 크리티컬 효과
        if (typeof CameraEffects !== 'undefined') {
            CameraEffects.triggerCritical();
        }
        
        // 1. 화면 전체 플래시 (다중 레이어)
        const flash = document.createElement('div');
        flash.className = 'critical-flash';
        document.body.appendChild(flash);
        
        const flash2 = document.createElement('div');
        flash2.className = 'critical-flash-secondary';
        document.body.appendChild(flash2);
        
        setTimeout(() => flash.remove(), 600);
        setTimeout(() => flash2.remove(), 800);
        
        // 2. 화면 흔들림
        document.body.classList.add('critical-screen-shake');
        setTimeout(() => document.body.classList.remove('critical-screen-shake'), 400);
        
        // 3. CRITICAL 텍스트 (강화)
        const critText = document.createElement('div');
        critText.className = 'critical-text';
        critText.innerHTML = `
            <div class="critical-bg-burst"></div>
            <span class="critical-label">CRITICAL</span>
            <span class="critical-multiplier">x${this.criticalMultiplier}</span>
        `;
        document.body.appendChild(critText);
        setTimeout(() => critText.remove(), 1500);
        
        // 4. 파티클 폭발
        this.createCriticalParticles();
        
        // 5. 적에게 임팩트 이펙트
        const enemyEl = document.querySelector('.enemy-unit.selected') || document.querySelector('.enemy-unit');
        if (enemyEl) {
            enemyEl.classList.add('critical-hit');
            
            // 임팩트 링 이펙트
            const impactRing = document.createElement('div');
            impactRing.className = 'critical-impact-ring';
            enemyEl.appendChild(impactRing);
            setTimeout(() => impactRing.remove(), 600);
            
            setTimeout(() => enemyEl.classList.remove('critical-hit'), 600);
        }
        
        // 6. 사운드 효과 느낌의 시각적 웨이브
        const wave = document.createElement('div');
        wave.className = 'critical-wave';
        document.body.appendChild(wave);
        setTimeout(() => wave.remove(), 800);
    },
    
    // ==========================================
    // 크리티컬 파티클 생성
    // ==========================================
    createCriticalParticles() {
        const container = document.createElement('div');
        container.className = 'critical-particles-container';
        document.body.appendChild(container);
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'critical-particle';
            particle.style.setProperty('--angle', `${(i / 20) * 360}deg`);
            particle.style.setProperty('--delay', `${Math.random() * 0.2}s`);
            particle.style.setProperty('--distance', `${100 + Math.random() * 150}px`);
            container.appendChild(particle);
        }
        
        setTimeout(() => container.remove(), 1000);
    },
    
    // ==========================================
    // 데미지 계산에 크리티컬 적용
    // ==========================================
    applyToDamage(baseDamage, isCritical) {
        if (!isCritical) return baseDamage;
        return Math.floor(baseDamage * this.criticalMultiplier);
    }
};

// 회심 유물은 relics.js의 relicDatabase에 정의됨

// ==========================================
// CSS 스타일 주입
// ==========================================
const criticalStyles = document.createElement('style');
criticalStyles.textContent = `
    /* ==========================================
       무지개 테두리 (크리티컬 준비 상태)
       ========================================== */
    .card.critical-ready {
        /* 기본 상태 유지 */
    }
    
    /* 글로우 없음 */
    .critical-rainbow-glow {
        display: none;
    }
    
    /* 무지개 테두리만 */
    .critical-rainbow-border {
        position: absolute;
        inset: -3px;
        border-radius: inherit;
        padding: 3px;
        background: linear-gradient(
            90deg,
            #ff0000, #ff8000, #ffff00, #00ff00, 
            #00ffff, #0080ff, #8000ff, #ff00ff, #ff0000
        );
        background-size: 300% 100%;
        animation: rainbowBorder 3s linear infinite;
        -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        z-index: 100;
    }
    
    @keyframes rainbowBorder {
        0% { background-position: 0% 50%; }
        100% { background-position: 300% 50%; }
    }
    
    /* ==========================================
       유물 카운터
       ========================================== */
    .relic-crit-counter {
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #ff6666;
        font-size: 0.55rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 8px;
        border: 1px solid #ff4444;
        font-family: monospace;
        white-space: nowrap;
        z-index: 10;
    }
    
    .relic-crit-counter.ready {
        background: linear-gradient(180deg, #ff3333 0%, #cc0000 100%);
        color: #fff;
        border-color: #ff6666;
        animation: counterReadyPulse 0.4s ease-in-out infinite;
        box-shadow: 0 0 10px rgba(255, 50, 50, 0.8);
    }
    
    @keyframes counterReadyPulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.15); }
    }
    
    .relic-slot.critical-ready,
    .relic-item.critical-ready {
        animation: relicCriticalPulse 0.6s ease-in-out infinite;
    }
    
    @keyframes relicCriticalPulse {
        0%, 100% { 
            box-shadow: 0 0 15px rgba(255, 50, 50, 0.6);
            transform: scale(1);
        }
        50% { 
            box-shadow: 0 0 30px rgba(255, 50, 50, 1), 0 0 50px rgba(255, 100, 100, 0.5);
            transform: scale(1.1);
        }
    }
    
    /* ==========================================
       크리티컬 데미지 팝업 (강화)
       ========================================== */
    .damage-popup.critical-damage {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: critDamagePopup 2s ease-out forwards !important;
        z-index: 100000 !important;
    }
    
    .damage-popup.critical-damage .crit-label {
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 900;
        color: #ffdd00;
        text-shadow: 
            0 0 15px #ffcc00,
            0 0 30px #ff6600,
            0 0 45px #ff3300,
            3px 3px 0 #000,
            -1px -1px 0 #000;
        animation: critLabelBounce 0.6s ease-out;
        letter-spacing: 3px;
    }
    
    .damage-popup.critical-damage .crit-value {
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 900;
        color: #ff0000;
        text-shadow: 
            0 0 20px #ff0000,
            0 0 40px #ff4444,
            0 0 60px #ff6666,
            4px 4px 0 #000,
            -2px -2px 0 #660000;
        animation: critValuePop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    @keyframes critDamagePopup {
        0% {
            opacity: 1;
            transform: translateY(0) scale(0.3);
        }
        15% {
            transform: translateY(-30px) scale(1.5);
        }
        30% {
            transform: translateY(-50px) scale(1.2);
        }
        50% {
            transform: translateY(-70px) scale(1);
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: translateY(-150px) scale(0.6);
        }
    }
    
    @keyframes critLabelBounce {
        0% { transform: scale(0) rotate(-10deg); }
        50% { transform: scale(1.4) rotate(5deg); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    @keyframes critValuePop {
        0% { transform: scale(0) rotate(-15deg); }
        40% { transform: scale(1.5) rotate(8deg); }
        70% { transform: scale(0.9) rotate(-3deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    /* 크리티컬 히트 이펙트 */
    .critical-hit-effect {
        animation: criticalHitShake 0.5s ease-out !important;
        filter: brightness(2) saturate(2) !important;
    }
    
    @keyframes criticalHitShake {
        0%, 100% { transform: translateX(0) scale(1); }
        10% { transform: translateX(-15px) rotate(-3deg) scale(1.1); }
        20% { transform: translateX(15px) rotate(3deg) scale(1.1); }
        30% { transform: translateX(-10px) rotate(-2deg); }
        40% { transform: translateX(10px) rotate(2deg); }
        50% { transform: translateX(-5px); }
        60% { transform: translateX(5px); }
    }
    
    /* ==========================================
       크리티컬 발동 이펙트
       ========================================== */
    .critical-flash {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 99999;
    }
    
    .critical-flash-red {
        background: radial-gradient(circle at center, 
            rgba(255, 50, 50, 0.6) 0%, 
            rgba(255, 50, 50, 0.2) 40%,
            transparent 70%);
        animation: criticalFlashRed 0.5s ease-out forwards;
    }
    
    .critical-flash-gold {
        background: radial-gradient(circle at center, 
            rgba(255, 200, 50, 0.4) 0%, 
            transparent 60%);
        animation: criticalFlashGold 0.7s ease-out forwards;
    }
    
    @keyframes criticalFlashRed {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    @keyframes criticalFlashGold {
        0% { opacity: 0; }
        40% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    /* 크리티컬 텍스트 컨테이너 */
    .critical-text-container {
        position: fixed;
        top: 35%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .critical-text-burst {
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, 
            rgba(255, 50, 50, 0.4) 0%, 
            rgba(255, 200, 50, 0.2) 30%,
            transparent 70%);
        animation: burstExpand 0.8s ease-out forwards;
    }
    
    @keyframes burstExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
    }
    
    .critical-text-main {
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 900;
        background: linear-gradient(180deg, #ffcc00 0%, #ff6600 50%, #ff0000 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 20px #ff6600) drop-shadow(4px 4px 0 #000);
        animation: critTextMain 1.5s ease-out forwards;
        letter-spacing: 8px;
    }
    
    .critical-text-multiplier {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        font-weight: 700;
        color: #fff;
        text-shadow: 
            0 0 15px #ff6600,
            2px 2px 0 #000;
        animation: critTextMultiplier 1.5s ease-out forwards;
        margin-top: -5px;
    }
    
    @keyframes critTextMain {
        0% { opacity: 0; transform: scale(0.3) translateY(30px); }
        20% { opacity: 1; transform: scale(1.2) translateY(0); }
        40% { transform: scale(1) translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: scale(1.1) translateY(-30px); }
    }
    
    @keyframes critTextMultiplier {
        0%, 15% { opacity: 0; transform: scale(0); }
        35% { opacity: 1; transform: scale(1.2); }
        50% { transform: scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    /* 크리티컬 파티클 */
    .critical-particle {
        position: fixed;
        top: 35%;
        left: 50%;
        width: 6px;
        height: 6px;
        background: linear-gradient(45deg, #ff4444, #ffcc00);
        border-radius: 50%;
        box-shadow: 0 0 8px #ff4444;
        pointer-events: none;
        z-index: 99998;
        animation: particleFly 1s ease-out forwards;
    }
    
    @keyframes particleFly {
        0% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% { 
            transform: translate(
                calc(-50% + var(--vx) * 15), 
                calc(-50% + var(--vy) * 15)
            ) scale(0);
            opacity: 0;
        }
    }
    
    /* 충격파 */
    .critical-shockwave {
        position: fixed;
        top: 35%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border: 3px solid rgba(255, 100, 50, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 99997;
        animation: shockwaveExpand 0.8s ease-out forwards;
    }
    
    @keyframes shockwaveExpand {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(10); opacity: 0; }
    }
    
    /* 임팩트 링 */
    .critical-impact-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 3px solid #ffcc00;
        border-radius: 50%;
        pointer-events: none;
        animation: impactRing 0.6s ease-out forwards;
    }
    
    @keyframes impactRing {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
    }
    
    .enemy-unit.critical-hit {
        animation: enemyCritHit 0.8s ease-out;
    }
    
    @keyframes enemyCritHit {
        0%, 100% { filter: brightness(1); }
        20% { filter: brightness(3) saturate(2); }
        40% { filter: brightness(1.5); }
    }
`;
document.head.appendChild(criticalStyles);

console.log('[CriticalSystem] Loaded');


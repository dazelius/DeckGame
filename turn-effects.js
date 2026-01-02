// ==========================================
// 턴 전환 연출 시스템
// ==========================================

const TurnEffects = {
    // ==========================================
    // 턴 전환 사운드 재생
    // ==========================================
    playTurnSound() {
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playReady();
        } else {
            try {
                const sound = new Audio('sound/ready.mp3');
                sound.volume = 0.6;
                sound.play().catch(e => console.log('[TurnEffects] Sound play failed:', e));
            } catch (e) {
                console.log('[TurnEffects] Sound load failed:', e);
            }
        }
    },
    
    // ==========================================
    // 플레이어 턴 시작 연출
    // ==========================================
    showPlayerTurn(turnNumber) {
        this.createTurnBanner('YOUR TURN', turnNumber, 'player');
        this.pulsePlayerArea();
        this.showEnergyRefill();
    },
    
    // ==========================================
    // 적 턴 시작 연출
    // ==========================================
    showEnemyTurn(enemyName) {
        this.createTurnBanner('ENEMY TURN', null, 'enemy', enemyName);
        this.pulseEnemyArea();
        this.showDangerOverlay();
    },
    
    // ==========================================
    // 턴 배너 생성
    // ==========================================
    createTurnBanner(text, turnNumber, type, subText = null) {
        // 기존 배너 제거
        const existing = document.querySelector('.turn-banner');
        if (existing) existing.remove();
        
        // 턴 전환 사운드 재생
        this.playTurnSound();
        
        const banner = document.createElement('div');
        banner.className = `turn-banner ${type}`;
        
        banner.innerHTML = `
            <div class="turn-banner-bg"></div>
            <div class="turn-banner-content">
                <div class="turn-banner-line left"></div>
                <div class="turn-banner-text-container">
                    ${turnNumber ? `<div class="turn-number">TURN ${turnNumber}</div>` : ''}
                    <div class="turn-text">${text}</div>
                    ${subText ? `<div class="turn-subtext">${subText}</div>` : ''}
                </div>
                <div class="turn-banner-line right"></div>
            </div>
            <div class="turn-particles"></div>
        `;
        
        document.body.appendChild(banner);
        
        // 파티클 생성
        this.createBannerParticles(banner.querySelector('.turn-particles'), type);
        
        // 배너 제거
        setTimeout(() => {
            banner.classList.add('fade-out');
            setTimeout(() => banner.remove(), 500);
        }, 1500);
    },
    
    // ==========================================
    // 배너 파티클
    // ==========================================
    createBannerParticles(container, type) {
        const colors = type === 'player' 
            ? ['#fbbf24', '#f59e0b', '#fff'] 
            : ['#ef4444', '#dc2626', '#f87171'];
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'banner-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 0.5}s;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
            `;
            container.appendChild(particle);
        }
    },
    
    // ==========================================
    // 플레이어 영역 펄스
    // ==========================================
    pulsePlayerArea() {
        const playerArea = document.getElementById('player');
        if (!playerArea) return;
        
        playerArea.classList.add('turn-pulse-player');
        setTimeout(() => playerArea.classList.remove('turn-pulse-player'), 1000);
        
        // 플레이어 주변 링 이펙트
        this.createRingEffect(playerArea, '#fbbf24');
    },
    
    // ==========================================
    // 적 영역 펄스
    // ==========================================
    pulseEnemyArea() {
        const enemyArea = document.getElementById('enemy');
        if (!enemyArea) return;
        
        enemyArea.classList.add('turn-pulse-enemy');
        setTimeout(() => enemyArea.classList.remove('turn-pulse-enemy'), 1000);
        
        // 적 주변 링 이펙트
        this.createRingEffect(enemyArea, '#ef4444');
    },
    
    // ==========================================
    // 링 이펙트
    // ==========================================
    createRingEffect(element, color) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.className = 'turn-ring';
                ring.style.cssText = `
                    left: ${centerX}px;
                    top: ${centerY}px;
                    border-color: ${color};
                    box-shadow: 0 0 20px ${color}, inset 0 0 20px ${color};
                `;
                document.body.appendChild(ring);
                setTimeout(() => ring.remove(), 1000);
            }, i * 150);
        }
    },
    
    // ==========================================
    // 에너지 충전 이펙트
    // ==========================================
    showEnergyRefill() {
        const energyEl = document.querySelector('.energy-orb');
        if (!energyEl) return;
        
        energyEl.classList.add('energy-refill');
        setTimeout(() => energyEl.classList.remove('energy-refill'), 800);
        
        // 에너지 파티클
        const rect = energyEl.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'energy-particle';
                particle.style.cssText = `
                    left: ${rect.left + rect.width / 2}px;
                    top: ${rect.top + rect.height / 2}px;
                `;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 800);
            }, i * 50);
        }
    },
    
    // ==========================================
    // 위험 오버레이 (적 턴)
    // ==========================================
    showDangerOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'danger-overlay';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 600);
    },
    
    // ==========================================
    // 전투 시작 연출 (임팩트 스타일)
    // ==========================================
    showBattleStart(enemyName) {
        // Battle Start 사운드 재생
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playBattleStart();
        } else {
            try {
                const sound = new Audio('sound/battlestart.mp3');
                sound.volume = 0.6;
                sound.play().catch(() => {});
            } catch (e) {}
        }
        
        const container = document.createElement('div');
        container.className = 'battle-intro-container';
        
        container.innerHTML = `
            <div class="battle-intro-flash"></div>
            <div class="battle-intro-stripe top"></div>
            <div class="battle-intro-stripe bottom"></div>
            <div class="battle-intro-content">
                <div class="battle-intro-slash left"></div>
                <div class="battle-intro-text">
                    <span class="battle-intro-label">ENGAGE</span>
                    <span class="battle-intro-enemy">${enemyName}</span>
                </div>
                <div class="battle-intro-slash right"></div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 화면 흔들림
        setTimeout(() => {
            if (typeof EffectSystem !== 'undefined' && EffectSystem.screenShake) {
                EffectSystem.screenShake(6, 200);
            }
        }, 100);
        
        setTimeout(() => {
            container.classList.add('fade-out');
            setTimeout(() => container.remove(), 400);
        }, 1400);
    },
    
    // ==========================================
    // 승리 연출 - 다크소울 스타일
    // ==========================================
    showVictory(onComplete = null) {
        const container = document.createElement('div');
        container.className = 'ds-victory-container';
        
        container.innerHTML = `
            <div class="ds-victory-bg"></div>
            <div class="ds-victory-vignette"></div>
            <div class="ds-victory-letterbox top"></div>
            <div class="ds-victory-letterbox bottom"></div>
            <div class="ds-victory-content">
                <div class="ds-victory-line left"></div>
                <div class="ds-victory-text-container">
                    <div class="ds-victory-subtitle">HEIR OF FIRE DESTROYED</div>
                    <div class="ds-victory-main">VICTORY ACHIEVED</div>
                    <div class="ds-victory-korean">적을 쓰러뜨렸다</div>
                </div>
                <div class="ds-victory-line right"></div>
            </div>
            <div class="ds-victory-particles"></div>
            <div class="ds-victory-rays"></div>
        `;
        
        document.body.appendChild(container);
        
        // 금색 파티클 생성
        const particlesEl = container.querySelector('.ds-victory-particles');
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'ds-victory-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 2}s;
                animation-duration: ${2 + Math.random() * 2}s;
            `;
            particlesEl.appendChild(particle);
        }
        
        // 빛줄기 생성
        const raysEl = container.querySelector('.ds-victory-rays');
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'ds-victory-ray';
            ray.style.cssText = `
                transform: rotate(${i * 45}deg);
                animation-delay: ${i * 0.1}s;
            `;
            raysEl.appendChild(ray);
        }
        
        // 3초 후 페이드아웃, 완료 후 콜백 실행
        setTimeout(() => {
            container.classList.add('fade-out');
            setTimeout(() => {
                container.remove();
                // 연출 완료 후 콜백 실행
                if (onComplete && typeof onComplete === 'function') {
                    onComplete();
                }
            }, 1000);
        }, 2500);
    },
    
    // ==========================================
    // 패배 연출 - 다크소울 스타일
    // ==========================================
    showDefeat() {
        const container = document.createElement('div');
        container.className = 'ds-defeat-container';
        
        container.innerHTML = `
            <div class="ds-defeat-bg"></div>
            <div class="ds-defeat-blood-vignette"></div>
            <div class="ds-defeat-letterbox top"></div>
            <div class="ds-defeat-letterbox bottom"></div>
            <div class="ds-defeat-content">
                <div class="ds-defeat-line left"></div>
                <div class="ds-defeat-text-container">
                    <div class="ds-defeat-main">YOU DIED</div>
                    <div class="ds-defeat-korean">죽음을 맞이했다</div>
                </div>
                <div class="ds-defeat-line right"></div>
            </div>
            <div class="ds-defeat-particles"></div>
        `;
        
        document.body.appendChild(container);
        
        // 핏방울 파티클 생성
        const particlesEl = container.querySelector('.ds-defeat-particles');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'ds-defeat-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 2}s;
                animation-duration: ${3 + Math.random() * 2}s;
            `;
            particlesEl.appendChild(particle);
        }
    }
};

// ==========================================
// CSS 스타일
// ==========================================
const turnEffectStyles = document.createElement('style');
turnEffectStyles.textContent = `
    /* ==========================================
       턴 배너
       ========================================== */
    .turn-banner {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
        animation: bannerAppear 0.5s ease-out;
    }
    
    @keyframes bannerAppear {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
    
    .turn-banner.fade-out {
        animation: bannerFadeOut 0.5s ease-out forwards;
    }
    
    @keyframes bannerFadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    .turn-banner-bg {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
    }
    
    .turn-banner.player .turn-banner-bg {
        background: linear-gradient(180deg, 
            rgba(0, 0, 0, 0.3) 0%, 
            rgba(251, 191, 36, 0.2) 40%,
            rgba(251, 191, 36, 0.2) 60%,
            rgba(0, 0, 0, 0.3) 100%
        );
    }
    
    .turn-banner.enemy .turn-banner-bg {
        background: linear-gradient(180deg, 
            rgba(0, 0, 0, 0.3) 0%, 
            rgba(239, 68, 68, 0.2) 40%,
            rgba(239, 68, 68, 0.2) 60%,
            rgba(0, 0, 0, 0.3) 100%
        );
    }
    
    .turn-banner-content {
        display: flex;
        align-items: center;
        gap: 30px;
        z-index: 1;
    }
    
    .turn-banner-line {
        width: 150px;
        height: 3px;
        background: linear-gradient(90deg, transparent, currentColor);
    }
    
    .turn-banner-line.right {
        background: linear-gradient(-90deg, transparent, currentColor);
    }
    
    .turn-banner.player .turn-banner-line {
        color: #fbbf24;
        box-shadow: 0 0 10px #fbbf24;
    }
    
    .turn-banner.enemy .turn-banner-line {
        color: #ef4444;
        box-shadow: 0 0 10px #ef4444;
    }
    
    .turn-banner-text-container {
        text-align: center;
    }
    
    .turn-number {
        font-family: 'Cinzel', serif;
        font-size: 1rem;
        letter-spacing: 5px;
        margin-bottom: 5px;
        opacity: 0.7;
    }
    
    .turn-banner.player .turn-number {
        color: #fbbf24;
    }
    
    .turn-banner.enemy .turn-number {
        color: #ef4444;
    }
    
    .turn-text {
        font-family: 'Cinzel', serif;
        font-size: 3rem;
        font-weight: 900;
        letter-spacing: 8px;
        text-transform: uppercase;
        animation: turnTextPop 0.5s ease-out;
    }
    
    .turn-banner.player .turn-text {
        color: #fbbf24;
        text-shadow: 
            0 0 30px rgba(251, 191, 36, 0.8),
            0 0 60px rgba(251, 191, 36, 0.4),
            3px 3px 0 rgba(0, 0, 0, 0.5);
    }
    
    .turn-banner.enemy .turn-text {
        color: #ef4444;
        text-shadow: 
            0 0 30px rgba(239, 68, 68, 0.8),
            0 0 60px rgba(239, 68, 68, 0.4),
            3px 3px 0 rgba(0, 0, 0, 0.5);
    }
    
    @keyframes turnTextPop {
        0% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .turn-subtext {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        margin-top: 10px;
        opacity: 0.8;
    }
    
    .turn-banner.enemy .turn-subtext {
        color: #f87171;
    }
    
    /* 배너 파티클 */
    .turn-particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }
    
    .banner-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        top: 50%;
        animation: particleFly 1.5s ease-out forwards;
    }
    
    @keyframes particleFly {
        0% { 
            transform: translateY(0) scale(0);
            opacity: 0;
        }
        20% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% { 
            transform: translateY(calc(-50vh + (var(--random, 0) * 100vh))) scale(0);
            opacity: 0;
        }
    }
    
    /* ==========================================
       영역 펄스
       ========================================== */
    .turn-pulse-player {
        animation: pulsePlayer 1s ease-out;
    }
    
    @keyframes pulsePlayer {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.5) drop-shadow(0 0 30px #fbbf24); }
        100% { filter: brightness(1); }
    }
    
    .turn-pulse-enemy {
        animation: pulseEnemy 1s ease-out;
    }
    
    @keyframes pulseEnemy {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.3) drop-shadow(0 0 30px #ef4444); }
        100% { filter: brightness(1); }
    }
    
    /* 링 이펙트 */
    .turn-ring {
        position: fixed;
        width: 100px;
        height: 100px;
        border: 3px solid;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        animation: ringExpand 1s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
    }
    
    @keyframes ringExpand {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }
    
    /* ==========================================
       에너지 충전
       ========================================== */
    .energy-refill {
        animation: energyRefill 0.8s ease-out !important;
    }
    
    @keyframes energyRefill {
        0% { transform: scale(1); filter: brightness(1); }
        30% { transform: scale(1.3); filter: brightness(2); }
        60% { transform: scale(0.9); }
        100% { transform: scale(1); filter: brightness(1); }
    }
    
    .energy-particle {
        position: fixed;
        width: 8px;
        height: 8px;
        background: #fbbf24;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: energyParticle 0.8s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 0 10px #fbbf24;
    }
    
    @keyframes energyParticle {
        0% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        100% { 
            transform: translate(
                calc(-50% + (var(--random-x, 0) * 100px - 50px)),
                calc(-50% + (var(--random-y, 0) * 100px - 50px))
            ) scale(0);
            opacity: 0;
        }
    }
    
    /* ==========================================
       위험 오버레이
       ========================================== */
    .danger-overlay {
        position: fixed;
        inset: 0;
        background: transparent;
        pointer-events: none;
        z-index: 900;
        animation: dangerPulse 0.6s ease-out;
    }
    
    @keyframes dangerPulse {
        0% { 
            box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0);
        }
        50% { 
            box-shadow: inset 0 0 100px 20px rgba(239, 68, 68, 0.3);
        }
        100% { 
            box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0);
        }
    }
    
    /* ==========================================
       전투 시작 (임팩트 스타일)
       ========================================== */
    .battle-intro-container {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        overflow: hidden;
    }
    
    .battle-intro-container.fade-out {
        animation: battleIntroOut 0.4s ease-in forwards;
    }
    
    @keyframes battleIntroOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    /* 초기 플래시 */
    .battle-intro-flash {
        position: absolute;
        inset: 0;
        background: rgba(255, 100, 50, 0.4);
        animation: battleFlash 0.3s ease-out forwards;
    }
    
    @keyframes battleFlash {
        0% { opacity: 1; background: rgba(255, 255, 255, 0.8); }
        100% { opacity: 0; }
    }
    
    /* 상하 빨간 띠 */
    .battle-intro-stripe {
        position: absolute;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(180deg, 
            rgba(180, 30, 30, 0.95) 0%,
            rgba(120, 20, 20, 0.9) 50%,
            rgba(80, 10, 10, 0.95) 100%);
        box-shadow: 
            0 0 30px rgba(255, 50, 50, 0.5),
            inset 0 0 20px rgba(0, 0, 0, 0.3);
    }
    
    .battle-intro-stripe.top {
        top: 0;
        border-bottom: 2px solid rgba(255, 100, 50, 0.6);
        animation: stripeSlideTop 0.25s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    
    .battle-intro-stripe.bottom {
        bottom: 0;
        border-top: 2px solid rgba(255, 100, 50, 0.6);
        animation: stripeSlideBottom 0.25s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    
    @keyframes stripeSlideTop {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(0); }
    }
    
    @keyframes stripeSlideBottom {
        0% { transform: translateY(100%); }
        100% { transform: translateY(0); }
    }
    
    /* 메인 컨텐츠 */
    .battle-intro-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
        z-index: 2;
    }
    
    /* 슬래시 장식 */
    .battle-intro-slash {
        width: 120px;
        height: 4px;
        background: linear-gradient(90deg, 
            transparent 0%,
            rgba(255, 200, 100, 0.8) 20%,
            rgba(255, 150, 50, 1) 50%,
            rgba(255, 200, 100, 0.8) 80%,
            transparent 100%);
        box-shadow: 0 0 15px rgba(255, 150, 50, 0.8);
    }
    
    .battle-intro-slash.left {
        animation: slashLeft 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    
    .battle-intro-slash.right {
        animation: slashRight 0.3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    
    @keyframes slashLeft {
        0% { transform: translateX(200px) scaleX(0); opacity: 0; }
        100% { transform: translateX(0) scaleX(1); opacity: 1; }
    }
    
    @keyframes slashRight {
        0% { transform: translateX(-200px) scaleX(0); opacity: 0; }
        100% { transform: translateX(0) scaleX(1); opacity: 1; }
    }
    
    /* 텍스트 영역 */
    .battle-intro-text {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: textSlam 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    
    @keyframes textSlam {
        0% { 
            transform: scale(2) translateY(-20px); 
            opacity: 0;
            filter: blur(10px);
        }
        60% {
            transform: scale(0.95);
        }
        100% { 
            transform: scale(1) translateY(0); 
            opacity: 1;
            filter: blur(0);
        }
    }
    
    .battle-intro-label {
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 8px;
        color: rgba(255, 200, 150, 0.9);
        text-shadow: 0 0 10px rgba(255, 150, 50, 0.5);
        margin-bottom: 5px;
    }
    
    .battle-intro-enemy {
        font-family: 'Cinzel', serif;
        font-size: 2.8rem;
        font-weight: 900;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: #fff;
        text-shadow: 
            0 0 20px rgba(255, 100, 50, 0.8),
            0 0 40px rgba(255, 50, 50, 0.5),
            2px 2px 0 rgba(0, 0, 0, 0.5);
    }
    
    /* ==========================================
       승리 연출 - 다크소울 스타일
       ========================================== */
    .ds-victory-container {
        position: fixed;
        inset: 0;
        z-index: 10000;
        pointer-events: none;
        animation: dsVictoryAppear 1s ease-out;
    }
    
    @keyframes dsVictoryAppear {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
    
    .ds-victory-container.fade-out {
        animation: dsVictoryFadeOut 1s ease-out forwards;
    }
    
    @keyframes dsVictoryFadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    .ds-victory-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center,
            rgba(20, 15, 10, 0.85) 0%,
            rgba(0, 0, 0, 0.95) 100%
        );
    }
    
    .ds-victory-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center,
            transparent 0%,
            transparent 40%,
            rgba(212, 175, 55, 0.1) 70%,
            rgba(212, 175, 55, 0.2) 100%
        );
        animation: dsVictoryVignettePulse 2s ease-in-out infinite;
    }
    
    @keyframes dsVictoryVignettePulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    
    .ds-victory-letterbox {
        position: absolute;
        left: 0;
        right: 0;
        height: 12%;
        background: #000;
    }
    
    .ds-victory-letterbox.top {
        top: 0;
        animation: dsLetterboxSlide 0.8s ease-out;
    }
    
    .ds-victory-letterbox.bottom {
        bottom: 0;
        animation: dsLetterboxSlide 0.8s ease-out;
    }
    
    @keyframes dsLetterboxSlide {
        0% { transform: scaleY(0); }
        100% { transform: scaleY(1); }
    }
    
    .ds-victory-content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
    }
    
    .ds-victory-line {
        width: 200px;
        height: 2px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(212, 175, 55, 0.8), 
            rgba(212, 175, 55, 1),
            rgba(212, 175, 55, 0.8),
            transparent
        );
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        animation: dsVictoryLineGrow 1s ease-out 0.5s both;
    }
    
    .ds-victory-line.left {
        transform-origin: right center;
    }
    
    .ds-victory-line.right {
        transform-origin: left center;
    }
    
    @keyframes dsVictoryLineGrow {
        0% { transform: scaleX(0); opacity: 0; }
        100% { transform: scaleX(1); opacity: 1; }
    }
    
    .ds-victory-text-container {
        text-align: center;
        animation: dsVictoryTextAppear 1.2s ease-out 0.3s both;
    }
    
    @keyframes dsVictoryTextAppear {
        0% { 
            opacity: 0;
            transform: translateY(20px);
            filter: blur(10px);
        }
        100% { 
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
        }
    }
    
    .ds-victory-subtitle {
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 8px;
        color: rgba(212, 175, 55, 0.6);
        margin-bottom: 15px;
        text-transform: uppercase;
    }
    
    .ds-victory-main {
        font-family: 'Cinzel', serif;
        font-size: 3.5rem;
        font-weight: 700;
        letter-spacing: 12px;
        color: #d4af37;
        text-shadow: 
            0 0 30px rgba(212, 175, 55, 0.8),
            0 0 60px rgba(212, 175, 55, 0.4),
            0 0 90px rgba(212, 175, 55, 0.2),
            0 4px 0 rgba(0, 0, 0, 0.8);
        text-transform: uppercase;
        animation: dsVictoryMainPulse 2s ease-in-out infinite;
    }
    
    @keyframes dsVictoryMainPulse {
        0%, 100% { 
            text-shadow: 
                0 0 30px rgba(212, 175, 55, 0.8),
                0 0 60px rgba(212, 175, 55, 0.4),
                0 0 90px rgba(212, 175, 55, 0.2),
                0 4px 0 rgba(0, 0, 0, 0.8);
        }
        50% { 
            text-shadow: 
                0 0 40px rgba(212, 175, 55, 1),
                0 0 80px rgba(212, 175, 55, 0.6),
                0 0 120px rgba(212, 175, 55, 0.4),
                0 4px 0 rgba(0, 0, 0, 0.8);
        }
    }
    
    .ds-victory-korean {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 1.2rem;
        letter-spacing: 4px;
        color: rgba(212, 175, 55, 0.7);
        margin-top: 20px;
    }
    
    .ds-victory-particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }
    
    .ds-victory-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #d4af37;
        border-radius: 50%;
        box-shadow: 0 0 10px #d4af37, 0 0 20px rgba(212, 175, 55, 0.5);
        animation: dsVictoryParticleFloat 3s ease-in-out infinite;
    }
    
    @keyframes dsVictoryParticleFloat {
        0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
        }
        50% {
            transform: translateY(-30px) scale(1.2);
            opacity: 1;
        }
    }
    
    .ds-victory-rays {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        height: 300px;
        pointer-events: none;
    }
    
    .ds-victory-ray {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 400px;
        height: 2px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(212, 175, 55, 0.3), 
            transparent
        );
        transform-origin: left center;
        animation: dsVictoryRayGlow 2s ease-in-out infinite;
    }
    
    @keyframes dsVictoryRayGlow {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.6; }
    }
    
    /* ==========================================
       패배 연출 - 다크소울 스타일
       ========================================== */
    .ds-defeat-container {
        position: fixed;
        inset: 0;
        z-index: 10000;
        pointer-events: none;
        animation: dsDefeatAppear 1.5s ease-out;
    }
    
    @keyframes dsDefeatAppear {
        0% { opacity: 0; }
        30% { opacity: 0.3; }
        100% { opacity: 1; }
    }
    
    .ds-defeat-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center,
            rgba(30, 10, 10, 0.9) 0%,
            rgba(10, 0, 0, 0.98) 100%
        );
    }
    
    .ds-defeat-blood-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center,
            transparent 0%,
            transparent 30%,
            rgba(139, 0, 0, 0.15) 60%,
            rgba(139, 0, 0, 0.3) 100%
        );
        animation: dsDefeatVignettePulse 3s ease-in-out infinite;
    }
    
    @keyframes dsDefeatVignettePulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }
    
    .ds-defeat-letterbox {
        position: absolute;
        left: 0;
        right: 0;
        height: 15%;
        background: #000;
    }
    
    .ds-defeat-letterbox.top {
        top: 0;
        animation: dsDefeatLetterboxSlide 1s ease-out;
    }
    
    .ds-defeat-letterbox.bottom {
        bottom: 0;
        animation: dsDefeatLetterboxSlide 1s ease-out;
    }
    
    @keyframes dsDefeatLetterboxSlide {
        0% { transform: scaleY(0); }
        100% { transform: scaleY(1); }
    }
    
    .ds-defeat-content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
    }
    
    .ds-defeat-line {
        width: 180px;
        height: 2px;
        background: linear-gradient(90deg, 
            transparent, 
            rgba(139, 0, 0, 0.6), 
            rgba(200, 50, 50, 0.8),
            rgba(139, 0, 0, 0.6),
            transparent
        );
        box-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
        animation: dsDefeatLineGrow 1.2s ease-out 0.5s both;
    }
    
    .ds-defeat-line.left {
        transform-origin: right center;
    }
    
    .ds-defeat-line.right {
        transform-origin: left center;
    }
    
    @keyframes dsDefeatLineGrow {
        0% { transform: scaleX(0); opacity: 0; }
        100% { transform: scaleX(1); opacity: 1; }
    }
    
    .ds-defeat-text-container {
        text-align: center;
        animation: dsDefeatTextAppear 1.5s ease-out 0.3s both;
    }
    
    @keyframes dsDefeatTextAppear {
        0% { 
            opacity: 0;
            transform: translateY(30px);
            filter: blur(15px);
        }
        100% { 
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
        }
    }
    
    .ds-defeat-main {
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 700;
        letter-spacing: 15px;
        color: #8b0000;
        text-shadow: 
            0 0 30px rgba(139, 0, 0, 0.8),
            0 0 60px rgba(139, 0, 0, 0.5),
            0 0 90px rgba(139, 0, 0, 0.3),
            0 4px 0 rgba(0, 0, 0, 0.9);
        text-transform: uppercase;
        animation: dsDefeatMainPulse 3s ease-in-out infinite;
    }
    
    @keyframes dsDefeatMainPulse {
        0%, 100% { 
            text-shadow: 
                0 0 30px rgba(139, 0, 0, 0.8),
                0 0 60px rgba(139, 0, 0, 0.5),
                0 0 90px rgba(139, 0, 0, 0.3),
                0 4px 0 rgba(0, 0, 0, 0.9);
        }
        50% { 
            text-shadow: 
                0 0 40px rgba(180, 30, 30, 1),
                0 0 80px rgba(139, 0, 0, 0.7),
                0 0 120px rgba(139, 0, 0, 0.5),
                0 4px 0 rgba(0, 0, 0, 0.9);
        }
    }
    
    .ds-defeat-korean {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 1.3rem;
        letter-spacing: 6px;
        color: rgba(139, 0, 0, 0.7);
        margin-top: 20px;
    }
    
    .ds-defeat-particles {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }
    
    .ds-defeat-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #8b0000;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(139, 0, 0, 0.8);
        animation: dsDefeatParticleFall 4s ease-in infinite;
    }
    
    @keyframes dsDefeatParticleFall {
        0% {
            transform: translateY(-10px) scale(1);
            opacity: 0;
        }
        10% {
            opacity: 0.8;
        }
        100% {
            transform: translateY(100vh) scale(0.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(turnEffectStyles);

console.log('[TurnEffects] 로드 완료');


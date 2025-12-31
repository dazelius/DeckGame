// ==========================================
// Shadow Deck - 카메라 효과 시스템 v2
// 긴박감 있는 전투 연출
// ==========================================

const CameraEffects = {
    isActive: false,
    animationFrameId: null,
    targetEl: null,
    time: 0,
    
    // 현재 상태
    state: 'idle', // idle, combat, enemyTurn, lowHP, critical
    
    // 심장박동
    heartbeat: {
        active: false,
        rate: 1.0, // 1.0 = 60bpm, 2.0 = 120bpm
        phase: 0
    },
    
    // 크로마틱 애버레이션
    chromatic: {
        active: false,
        intensity: 0
    },
    
    // 충격파
    impact: {
        active: false,
        startTime: 0,
        duration: 0,
        intensity: 0
    },
    
    // 슬로우 모션 느낌
    tension: {
        active: false,
        intensity: 0,
        targetIntensity: 0
    },
    
    // 초기화
    init() {
        this.targetEl = document.querySelector('.game-container');
        if (!this.targetEl) {
            console.warn('[CameraEffects] .game-container not found');
            return;
        }
        this.injectStyles();
        console.log('[CameraEffects v2] 초기화 완료');
    },
    
    injectStyles() {
        if (document.getElementById('camera-effects-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'camera-effects-styles';
        style.textContent = `
            /* 메인 컨테이너 */
            .game-container {
                transform-origin: center center;
                will-change: transform, filter;
            }
            
            /* ===== 전투 오버레이 레이어들 ===== */
            .combat-overlay-container {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 5;
                overflow: hidden;
            }
            
            /* 강한 비네트 (전투용) */
            .combat-vignette {
                position: absolute;
                inset: -50px;
                background: radial-gradient(
                    ellipse 70% 60% at center,
                    transparent 30%,
                    rgba(0, 0, 0, 0.3) 60%,
                    rgba(0, 0, 0, 0.7) 85%,
                    rgba(0, 0, 0, 0.9) 100%
                );
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .combat-vignette.active {
                opacity: 1;
            }
            
            /* 적 턴 긴장감 오버레이 */
            .enemy-turn-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    180deg,
                    rgba(139, 0, 0, 0.15) 0%,
                    transparent 30%,
                    transparent 70%,
                    rgba(139, 0, 0, 0.2) 100%
                );
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .enemy-turn-overlay.active {
                opacity: 1;
                animation: enemyTurnPulse 2s ease-in-out infinite;
            }
            
            @keyframes enemyTurnPulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            /* 피격 플래시 */
            .hit-flash {
                position: absolute;
                inset: 0;
                background: radial-gradient(
                    circle at center,
                    rgba(255, 0, 0, 0.4) 0%,
                    rgba(139, 0, 0, 0.3) 50%,
                    transparent 80%
                );
                opacity: 0;
                mix-blend-mode: screen;
            }
            
            .hit-flash.active {
                animation: hitFlash 0.25s ease-out forwards;
            }
            
            @keyframes hitFlash {
                0% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 0; transform: scale(1); }
            }
            
            /* 심장박동 비네트 (저HP) */
            .heartbeat-vignette {
                position: absolute;
                inset: -20px;
                background: radial-gradient(
                    ellipse at center,
                    transparent 40%,
                    rgba(139, 0, 0, 0.4) 70%,
                    rgba(80, 0, 0, 0.8) 100%
                );
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .heartbeat-vignette.active {
                opacity: 1;
            }
            
            /* 스캔라인 효과 */
            .scanlines {
                position: absolute;
                inset: 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.03) 2px,
                    rgba(0, 0, 0, 0.03) 4px
                );
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .scanlines.active {
                opacity: 1;
            }
            
            /* 필름 그레인 */
            .film-grain {
                position: absolute;
                inset: 0;
                opacity: 0;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E");
                mix-blend-mode: overlay;
                transition: opacity 0.5s ease;
            }
            
            .film-grain.active {
                opacity: 0.15;
                animation: grainShift 0.5s steps(10) infinite;
            }
            
            @keyframes grainShift {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-1%, -1%); }
                20% { transform: translate(1%, 1%); }
                30% { transform: translate(-1%, 1%); }
                40% { transform: translate(1%, -1%); }
                50% { transform: translate(-1%, 0); }
                60% { transform: translate(1%, 0); }
                70% { transform: translate(0, 1%); }
                80% { transform: translate(0, -1%); }
                90% { transform: translate(1%, 1%); }
            }
            
            /* 크리티컬 플래시 */
            .critical-flash {
                position: absolute;
                inset: 0;
                background: radial-gradient(
                    circle at center,
                    rgba(255, 215, 0, 0.5) 0%,
                    rgba(255, 165, 0, 0.3) 40%,
                    transparent 70%
                );
                opacity: 0;
                mix-blend-mode: screen;
            }
            
            .critical-flash.active {
                animation: criticalFlash 0.4s ease-out forwards;
            }
            
            @keyframes criticalFlash {
                0% { opacity: 1; transform: scale(0.8); }
                50% { opacity: 0.8; transform: scale(1.2); }
                100% { opacity: 0; transform: scale(1); }
            }
            
            /* 충격파 */
            .impact-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100px;
                height: 100px;
                transform: translate(-50%, -50%) scale(0);
                border: 3px solid rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                opacity: 0;
            }
            
            .impact-ring.active {
                animation: impactRing 0.5s ease-out forwards;
            }
            
            @keyframes impactRing {
                0% { 
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                    border-width: 8px;
                }
                100% { 
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                    border-width: 1px;
                }
            }
            
            /* 화면 흔들림 클래스 */
            .screen-shake-light {
                animation: shakeLight 0.3s ease-out;
            }
            
            .screen-shake-medium {
                animation: shakeMedium 0.4s ease-out;
            }
            
            .screen-shake-heavy {
                animation: shakeHeavy 0.5s ease-out;
            }
            
            @keyframes shakeLight {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(-3px, 2px); }
                40% { transform: translate(2px, -2px); }
                60% { transform: translate(-2px, 1px); }
                80% { transform: translate(1px, -1px); }
            }
            
            @keyframes shakeMedium {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                10% { transform: translate(-6px, 3px) rotate(-0.5deg); }
                20% { transform: translate(5px, -4px) rotate(0.5deg); }
                30% { transform: translate(-4px, 5px) rotate(-0.3deg); }
                40% { transform: translate(4px, -3px) rotate(0.3deg); }
                50% { transform: translate(-3px, 2px) rotate(-0.2deg); }
                60% { transform: translate(2px, -2px) rotate(0.2deg); }
                70% { transform: translate(-2px, 1px) rotate(-0.1deg); }
                80% { transform: translate(1px, -1px) rotate(0.1deg); }
            }
            
            @keyframes shakeHeavy {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                5% { transform: translate(-12px, 6px) rotate(-1deg); }
                10% { transform: translate(10px, -8px) rotate(1deg); }
                15% { transform: translate(-8px, 10px) rotate(-0.8deg); }
                20% { transform: translate(8px, -6px) rotate(0.8deg); }
                25% { transform: translate(-6px, 8px) rotate(-0.6deg); }
                30% { transform: translate(6px, -5px) rotate(0.6deg); }
                40% { transform: translate(-4px, 4px) rotate(-0.4deg); }
                50% { transform: translate(3px, -3px) rotate(0.3deg); }
                60% { transform: translate(-2px, 2px) rotate(-0.2deg); }
                80% { transform: translate(1px, -1px) rotate(0.1deg); }
            }
            
            /* 줌 펄스 */
            .zoom-pulse {
                animation: zoomPulse 0.3s ease-out;
            }
            
            @keyframes zoomPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); }
            }
            
            /* 긴장 줌인 */
            .tension-zoom {
                transition: transform 0.8s ease;
            }
            
            .tension-zoom.active {
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);
        
        // 오버레이 컨테이너 생성
        this.createOverlays();
    },
    
    createOverlays() {
        if (document.querySelector('.combat-overlay-container')) return;
        
        const container = document.createElement('div');
        container.className = 'combat-overlay-container';
        container.innerHTML = `
            <div class="combat-vignette"></div>
            <div class="enemy-turn-overlay"></div>
            <div class="heartbeat-vignette"></div>
            <div class="hit-flash"></div>
            <div class="critical-flash"></div>
            <div class="impact-ring"></div>
            <div class="scanlines"></div>
            <div class="film-grain"></div>
        `;
        document.body.appendChild(container);
    },
    
    // ===== 전투 시작 =====
    onBattleStart() {
        this.init();
        this.isActive = true;
        this.state = 'combat';
        
        // 비네트 활성화
        this.toggleClass('.combat-vignette', 'active', true);
        this.toggleClass('.scanlines', 'active', true);
        this.toggleClass('.film-grain', 'active', true);
        
        // 줌인 효과
        if (this.targetEl) {
            this.targetEl.classList.add('tension-zoom');
            setTimeout(() => {
                this.targetEl.classList.add('active');
            }, 100);
        }
        
        // 심장박동 시작 (느리게)
        this.startHeartbeat(0.8);
        
        console.log('[CameraEffects] 전투 시작');
    },
    
    // ===== 전투 종료 =====
    onBattleEnd() {
        // 모든 효과 제거
        this.toggleClass('.combat-vignette', 'active', false);
        this.toggleClass('.enemy-turn-overlay', 'active', false);
        this.toggleClass('.heartbeat-vignette', 'active', false);
        this.toggleClass('.scanlines', 'active', false);
        this.toggleClass('.film-grain', 'active', false);
        
        if (this.targetEl) {
            this.targetEl.classList.remove('tension-zoom', 'active');
        }
        
        this.stopHeartbeat();
        this.isActive = false;
        this.state = 'idle';
        
        console.log('[CameraEffects] 전투 종료');
    },
    
    // ===== 플레이어 턴 =====
    onPlayerTurn() {
        if (!this.isActive) return;
        this.state = 'combat';
        
        // 적 턴 오버레이 제거
        this.toggleClass('.enemy-turn-overlay', 'active', false);
        
        // 심장박동 정상화
        this.heartbeat.rate = 0.8;
        
        // HP 체크
        this.checkLowHP();
    },
    
    // ===== 적 턴 시작 =====
    onEnemyTurn() {
        if (!this.isActive) return;
        this.state = 'enemyTurn';
        
        // 적 턴 오버레이 활성화
        this.toggleClass('.enemy-turn-overlay', 'active', true);
        
        // 심장박동 빨라짐
        this.heartbeat.rate = 1.2;
        
        // 줌인
        if (this.targetEl) {
            this.targetEl.style.transform = 'scale(1.025)';
        }
        
        // 긴장감 있는 흔들림
        this.shake('light');
    },
    
    // ===== 공격 시 =====
    triggerAttack() {
        if (!this.isActive) return;
        
        // 줌 펄스
        if (this.targetEl) {
            this.targetEl.classList.add('zoom-pulse');
            setTimeout(() => {
                this.targetEl.classList.remove('zoom-pulse');
            }, 300);
        }
        
        // 가벼운 흔들림
        this.shake('light');
    },
    
    // ===== 강한 공격 =====
    triggerHeavyAttack() {
        if (!this.isActive) return;
        
        // 충격파
        this.triggerImpactRing();
        
        // 강한 흔들림
        this.shake('medium');
    },
    
    // ===== 플레이어 피격 =====
    triggerHitPulse() {
        if (!this.isActive) return;
        
        // 빨간 플래시
        const flash = document.querySelector('.hit-flash');
        if (flash) {
            flash.classList.remove('active');
            void flash.offsetWidth;
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 250);
        }
        
        // 중간 흔들림
        this.shake('medium');
        
        // 심장박동 가속
        this.heartbeat.rate = Math.min(2.0, this.heartbeat.rate + 0.3);
        
        // HP 체크
        this.checkLowHP();
    },
    
    // ===== 크리티컬 히트 =====
    triggerCritical() {
        if (!this.isActive) return;
        
        // 금색 플래시
        const flash = document.querySelector('.critical-flash');
        if (flash) {
            flash.classList.remove('active');
            void flash.offsetWidth;
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 400);
        }
        
        // 충격파 + 강한 흔들림
        this.triggerImpactRing();
        this.shake('heavy');
    },
    
    // ===== 치명적 피격 =====
    triggerHeavyHit() {
        if (!this.isActive) return;
        
        // 큰 플래시
        const flash = document.querySelector('.hit-flash');
        if (flash) {
            flash.style.background = 'radial-gradient(circle at center, rgba(255,0,0,0.6) 0%, rgba(100,0,0,0.4) 50%, transparent 70%)';
            flash.classList.remove('active');
            void flash.offsetWidth;
            flash.classList.add('active');
            setTimeout(() => {
                flash.classList.remove('active');
                flash.style.background = '';
            }, 300);
        }
        
        // 강한 흔들림
        this.shake('heavy');
        
        // HP 체크
        this.checkLowHP();
    },
    
    // ===== 저 HP 체크 =====
    checkLowHP() {
        if (typeof gameState === 'undefined' || !gameState.player) return;
        
        const hpPercent = gameState.player.hp / gameState.player.maxHp;
        
        if (hpPercent <= 0.3) {
            // 위험! 심장박동 빨라짐
            this.toggleClass('.heartbeat-vignette', 'active', true);
            this.heartbeat.rate = 1.8;
            this.state = 'lowHP';
            
            // 지속적인 펄스 효과
            this.startLowHPPulse();
        } else if (hpPercent <= 0.5) {
            // 경고
            this.heartbeat.rate = 1.3;
            this.toggleClass('.heartbeat-vignette', 'active', false);
            this.stopLowHPPulse();
        } else {
            this.toggleClass('.heartbeat-vignette', 'active', false);
            this.stopLowHPPulse();
        }
    },
    
    // ===== 저 HP 펄스 =====
    lowHPPulseId: null,
    
    startLowHPPulse() {
        if (this.lowHPPulseId) return;
        
        const pulse = () => {
            if (this.state !== 'lowHP' || !this.isActive) {
                this.stopLowHPPulse();
                return;
            }
            
            const vignette = document.querySelector('.heartbeat-vignette');
            if (vignette) {
                vignette.style.opacity = '0.7';
                setTimeout(() => {
                    if (vignette) vignette.style.opacity = '1';
                }, 300);
            }
            
            // 미세한 흔들림
            if (this.targetEl) {
                this.targetEl.style.transform = 'scale(1.01)';
                setTimeout(() => {
                    if (this.targetEl) this.targetEl.style.transform = 'scale(1.02)';
                }, 300);
            }
            
            this.lowHPPulseId = setTimeout(pulse, 800);
        };
        
        pulse();
    },
    
    stopLowHPPulse() {
        if (this.lowHPPulseId) {
            clearTimeout(this.lowHPPulseId);
            this.lowHPPulseId = null;
        }
    },
    
    // ===== 충격파 =====
    triggerImpactRing() {
        const ring = document.querySelector('.impact-ring');
        if (ring) {
            ring.classList.remove('active');
            void ring.offsetWidth;
            ring.classList.add('active');
            setTimeout(() => ring.classList.remove('active'), 500);
        }
    },
    
    // ===== 화면 흔들림 =====
    shake(intensity = 'light') {
        if (!this.targetEl) return;
        
        const classes = ['screen-shake-light', 'screen-shake-medium', 'screen-shake-heavy'];
        classes.forEach(c => this.targetEl.classList.remove(c));
        
        const shakeClass = `screen-shake-${intensity}`;
        this.targetEl.classList.add(shakeClass);
        
        const duration = intensity === 'heavy' ? 500 : intensity === 'medium' ? 400 : 300;
        setTimeout(() => {
            this.targetEl.classList.remove(shakeClass);
        }, duration);
    },
    
    // ===== 심장박동 =====
    heartbeatId: null,
    
    startHeartbeat(rate = 1.0) {
        this.heartbeat.active = true;
        this.heartbeat.rate = rate;
        // 심장박동은 저 HP 시에만 시각적으로 표시됨
    },
    
    stopHeartbeat() {
        this.heartbeat.active = false;
    },
    
    // ===== 유틸리티 =====
    toggleClass(selector, className, add) {
        const el = document.querySelector(selector);
        if (el) {
            if (add) {
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        }
    }
};

// 전역 등록
window.CameraEffects = CameraEffects;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    CameraEffects.init();
});

console.log('[Camera Effects v2] 긴박감 카메라 효과 시스템 로드됨');

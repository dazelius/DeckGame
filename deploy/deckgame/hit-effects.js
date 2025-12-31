// ==========================================
// Hit Effects System - 타격감 전용 시스템
// ==========================================

const HitEffects = {
    // 설정
    config: {
        screenShakeEnabled: true,
        flashEnabled: true,
        particlesEnabled: true,
        hitStopEnabled: true,  // 히트스탑 (순간 멈춤)
        intensityMultiplier: 1.0
    },
    
    // 활성 플래시 타이머 관리 (요소별)
    activeFlashTimers: new WeakMap(),
    
    // 초기화
    init() {
        console.log('[HitEffects] 타격감 시스템 초기화');
        this.injectStyles();
    },
    
    // 요소의 필터를 강제로 리셋
    resetFilter(targetEl) {
        if (!targetEl) return;
        
        // 기존 타이머 취소
        const existingTimer = this.activeFlashTimers.get(targetEl);
        if (existingTimer) {
            clearTimeout(existingTimer.timer1);
            clearTimeout(existingTimer.timer2);
        }
        
        // 필터 완전 리셋
        targetEl.style.filter = '';
        targetEl.style.transition = '';
    },
    
    // ==========================================
    // 메인 타격 효과
    // ==========================================
    
    // 일반 타격 (VFX 혈흔 사용)
    normalHit(targetEl, damage = 0) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const intensity = Math.min(1 + damage / 20, 2);
        
        // 1. 타겟 플래시 (붉은색)
        this.flashTarget(targetEl, '#ff2222', 150);
        
        // 2. VFX 혈흔 이펙트
        if (typeof VFX !== 'undefined') {
            // 혈흔 슬래시
            VFX.bloodSlash(x, y, { 
                length: 120 + damage * 3, 
                width: 15 + damage,
                duration: 350
            });
            // 피 튀김
            VFX.bloodSplatter(x, y, { 
                count: 10 + Math.floor(damage / 2), 
                speed: 250, 
                size: 5 + damage / 3 
            });
        }
        
        // 3. 화면 흔들림
        this.screenShake(6 * intensity, 150);
        
        // 4. 히트스탑
        this.hitStop(25);
    },
    
    // 크리티컬 타격 (VFX 혈흔 - 최대 고어)
    criticalHit(targetEl, damage = 0) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const intensity = Math.min(1.5 + damage / 15, 3);
        
        // 1. 강렬한 붉은 플래시
        this.flashTarget(targetEl, '#ff0000', 300);
        
        // 2. VFX 혈흔 크리티컬
        if (typeof VFX !== 'undefined') {
            // 크리티컬 혈흔 (화면 플래시 + X슬래시 + 대량 피)
            VFX.bloodCritical(x, y, { size: 180 + damage * 2 });
            
            // 추가 쇼크웨이브 (붉은색)
            VFX.shockwave(x, y, { color: '#dc143c', size: 200, duration: 400 });
        }
        
        // 3. 강한 화면 흔들림
        this.screenShake(15 * intensity, 350);
        
        // 4. 긴 히트스탑
        this.hitStop(80);
        
        // 5. 크리티컬 텍스트
        this.showCriticalText(targetEl);
    },
    
    // 멀티 히트 (연속 혈흔)
    multiHit(targetEl, hitCount = 3, interval = 100) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        for (let i = 0; i < hitCount; i++) {
            setTimeout(() => {
                this.flashTarget(targetEl, '#dc143c', 100);
                this.screenShake(5, 100);
                
                // VFX 혈흔 콤보
                if (typeof VFX !== 'undefined') {
                    const offsetX = (Math.random() - 0.5) * 60;
                    const offsetY = (Math.random() - 0.5) * 60;
                    VFX.bloodSlash(x + offsetX, y + offsetY, {
                        length: 100 + Math.random() * 50,
                        width: 12,
                        angle: Math.random() * 360,
                        duration: 250
                    });
                }
            }, i * interval);
        }
    },
    
    // 헤비 히트 (강타, 묵직한 일격 등 - VFX 혈흔)
    heavyHit(targetEl, damage = 0) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 1. 강렬한 붉은 플래시
        this.flashTarget(targetEl, '#8b0000', 400);
        
        // 2. VFX 혈흔 헤비 임팩트
        if (typeof VFX !== 'undefined') {
            // 헤비 혈흔 임팩트 (다중 슬래시 + 대량 피)
            VFX.bloodHeavyImpact(x, y, { size: 200 + damage * 2 });
            
            // 추가 충격파
            VFX.shockwave(x, y, { color: '#8b0000', size: 180, duration: 500 });
        }
        
        // 3. 매우 강한 흔들림
        this.screenShake(22, 450);
        
        // 4. 긴 히트스탑
        this.hitStop(100);
    },
    
    // 분신 타격 (보라색 혈흔)
    cloneHit(targetEl, damage = 0) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 1. 보라색 플래시
        this.flashTarget(targetEl, '#a855f7', 150);
        
        // 2. VFX 혈흔 (보라색 테마)
        if (typeof VFX !== 'undefined') {
            // 보라색 혈흔 슬래시
            VFX.bloodSlash(x, y, { 
                length: 100 + damage * 2,
                width: 15,
                color: '#4a0080',  // 어두운 보라
                duration: 300
            });
            // 보라색 피 튀김
            VFX.bloodSplatter(x, y, { 
                count: 8 + Math.floor(damage / 3), 
                speed: 200, 
                size: 5,
                color: '#4a0080',
                secondaryColor: '#a855f7'
            });
            VFX.impact(x, y, { color: '#a855f7', size: 50 });
        }
        
        // 3. 약한 흔들림
        this.screenShake(5, 120);
    },
    
    // ==========================================
    // 개별 이펙트 함수들
    // ==========================================
    
    // 타겟 플래시 (연속 피격 시에도 안전하게 처리)
    flashTarget(targetEl, color = '#ffffff', duration = 200) {
        if (!targetEl || !this.config.flashEnabled) return;
        
        // 기존 플래시 타이머가 있으면 취소
        const existingTimer = this.activeFlashTimers.get(targetEl);
        if (existingTimer) {
            clearTimeout(existingTimer.timer1);
            clearTimeout(existingTimer.timer2);
            // 즉시 필터 리셋
            targetEl.style.filter = '';
            targetEl.style.transition = '';
        }
        
        // 플래시 효과 적용 (더 가벼운 효과 - drop-shadow 제거)
        targetEl.style.transition = `filter ${duration/4}ms ease-out`;
        targetEl.style.filter = `brightness(1.8) saturate(1.5)`;
        
        // 새 타이머 설정
        const timer1 = setTimeout(() => {
            if (!targetEl) return;
            targetEl.style.transition = `filter ${duration * 0.6}ms ease-in`;
            targetEl.style.filter = 'none';  // 명시적으로 none 설정
            
            const timer2 = setTimeout(() => {
                if (!targetEl) return;
                targetEl.style.filter = '';
                targetEl.style.transition = '';
                // 타이머 정리
                this.activeFlashTimers.delete(targetEl);
            }, duration * 0.6);
            
            // timer2 업데이트
            const timers = this.activeFlashTimers.get(targetEl);
            if (timers) timers.timer2 = timer2;
        }, duration / 4);
        
        // 타이머 저장
        this.activeFlashTimers.set(targetEl, { timer1, timer2: null });
    },
    
    // 화면 플래시
    flashScreen(color = '#ffffff', duration = 100) {
        if (!this.config.flashEnabled) return;
        
        const flash = document.createElement('div');
        flash.className = 'hit-screen-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            opacity: 0.4;
            pointer-events: none;
            z-index: 9999;
            animation: screenFlashFade ${duration}ms ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), duration);
    },
    
    // 화면 흔들림
    screenShake(intensity = 10, duration = 300) {
        if (!this.config.screenShakeEnabled) return;
        
        const gameContainer = document.getElementById('game-container') || document.body;
        const scaledIntensity = intensity * this.config.intensityMultiplier;
        
        gameContainer.style.animation = 'none';
        gameContainer.offsetHeight; // 리플로우
        gameContainer.style.setProperty('--shake-intensity', `${scaledIntensity}px`);
        gameContainer.style.animation = `hitScreenShake ${duration}ms ease-out`;
        
        setTimeout(() => {
            gameContainer.style.animation = '';
        }, duration);
    },
    
    // 히트 스파크 생성
    spawnHitSparks(targetEl, color = '#ffaa00', count = 10) {
        if (!targetEl || !this.config.particlesEnabled) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < count; i++) {
            const spark = document.createElement('div');
            spark.className = 'hit-spark-particle';
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const distance = 50 + Math.random() * 100;
            const size = 3 + Math.random() * 6;
            const duration = 300 + Math.random() * 200;
            
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            spark.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1002;
                box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color};
                --end-x: ${endX}px;
                --end-y: ${endY}px;
                animation: sparkFly ${duration}ms ease-out forwards;
            `;
            
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), duration);
        }
    },
    
    // 임팩트 링
    impactRing(targetEl, color = '#ffffff', size = 100, delay = 0) {
        if (!targetEl || !this.config.particlesEnabled) return;
        
        setTimeout(() => {
            const rect = targetEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const ring = document.createElement('div');
            ring.className = 'hit-impact-ring';
            ring.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 0;
                height: 0;
                border: 3px solid ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1001;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px ${color}, inset 0 0 10px ${color};
                --ring-size: ${size}px;
                animation: impactRingExpand 300ms ease-out forwards;
            `;
            
            document.body.appendChild(ring);
            setTimeout(() => ring.remove(), 300);
        }, delay);
    },
    
    // 히트스탑 (순간 멈춤 효과)
    hitStop(duration = 50) {
        if (!this.config.hitStopEnabled) return;
        
        // 게임 요소들 잠시 멈추기
        const gameElements = document.querySelectorAll('.enemy-unit, #player, .card');
        
        gameElements.forEach(el => {
            const originalTransition = el.style.transition;
            el.style.transition = 'none';
            el.dataset.originalTransition = originalTransition;
        });
        
        setTimeout(() => {
            gameElements.forEach(el => {
                el.style.transition = el.dataset.originalTransition || '';
            });
        }, duration);
    },
    
    // 크리티컬 텍스트
    showCriticalText(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        
        const text = document.createElement('div');
        text.className = 'critical-text-popup';
        text.innerHTML = 'CRITICAL!';
        text.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top - 20}px;
            transform: translateX(-50%);
            font-size: 1.8rem;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 
                0 0 10px #ff4400,
                0 0 20px #ff4400,
                2px 2px 0 #ff0000,
                -2px -2px 0 #ff0000;
            pointer-events: none;
            z-index: 1003;
            animation: criticalTextPop 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 800);
    },
    
    // 균열 효과
    showCrackEffect(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        
        const crack = document.createElement('div');
        crack.className = 'hit-crack-effect';
        crack.innerHTML = '💥';
        crack.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            font-size: 4rem;
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 1002;
            animation: crackPop 0.5s ease-out forwards;
        `;
        
        document.body.appendChild(crack);
        setTimeout(() => crack.remove(), 500);
    },
    
    // 슬래시 트레일 효과
    slashTrail(startX, startY, endX, endY, color = '#ffffff') {
        const trail = document.createElement('div');
        trail.className = 'slash-trail';
        
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        trail.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${length}px;
            height: 4px;
            background: linear-gradient(90deg, transparent, ${color}, transparent);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            pointer-events: none;
            z-index: 1001;
            animation: slashTrailFade 0.3s ease-out forwards;
        `;
        
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 300);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('hit-effects-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'hit-effects-styles';
        style.textContent = `
            /* 화면 플래시 페이드 */
            @keyframes screenFlashFade {
                0% { opacity: 0.4; }
                100% { opacity: 0; }
            }
            
            /* 화면 흔들림 */
            @keyframes hitScreenShake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(calc(var(--shake-intensity) * -1), var(--shake-intensity)); }
                20% { transform: translate(var(--shake-intensity), calc(var(--shake-intensity) * -1)); }
                30% { transform: translate(calc(var(--shake-intensity) * -0.8), calc(var(--shake-intensity) * 0.8)); }
                40% { transform: translate(calc(var(--shake-intensity) * 0.8), calc(var(--shake-intensity) * -0.8)); }
                50% { transform: translate(calc(var(--shake-intensity) * -0.5), calc(var(--shake-intensity) * 0.5)); }
                60% { transform: translate(calc(var(--shake-intensity) * 0.5), calc(var(--shake-intensity) * -0.5)); }
                70% { transform: translate(calc(var(--shake-intensity) * -0.3), calc(var(--shake-intensity) * 0.3)); }
                80% { transform: translate(calc(var(--shake-intensity) * 0.3), calc(var(--shake-intensity) * -0.3)); }
                90% { transform: translate(calc(var(--shake-intensity) * -0.1), calc(var(--shake-intensity) * 0.1)); }
            }
            
            /* 스파크 날아가기 */
            @keyframes sparkFly {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(
                        calc(-50% + var(--end-x)),
                        calc(-50% + var(--end-y))
                    ) scale(0);
                    opacity: 0;
                }
            }
            
            /* 임팩트 링 확장 */
            @keyframes impactRingExpand {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 1;
                }
                100% {
                    width: var(--ring-size);
                    height: var(--ring-size);
                    opacity: 0;
                }
            }
            
            /* 크리티컬 텍스트 팝업 */
            @keyframes criticalTextPop {
                0% {
                    transform: translateX(-50%) scale(0.5);
                    opacity: 0;
                }
                20% {
                    transform: translateX(-50%) scale(1.3);
                    opacity: 1;
                }
                40% {
                    transform: translateX(-50%) scale(1);
                }
                100% {
                    transform: translateX(-50%) translateY(-50px) scale(0.8);
                    opacity: 0;
                }
            }
            
            /* 균열 효과 */
            @keyframes crackPop {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.5) rotate(15deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2) rotate(30deg);
                    opacity: 0;
                }
            }
            
            /* 슬래시 트레일 페이드 */
            @keyframes slashTrailFade {
                0% {
                    opacity: 1;
                    transform: rotate(var(--angle)) scaleY(1);
                }
                100% {
                    opacity: 0;
                    transform: rotate(var(--angle)) scaleY(0);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 함수로 노출 (하위 호환성)
function applyNormalHit(targetEl, damage) {
    HitEffects.normalHit(targetEl, damage);
}

function applyCriticalHit(targetEl, damage) {
    HitEffects.criticalHit(targetEl, damage);
}

function applyHeavyHit(targetEl, damage) {
    HitEffects.heavyHit(targetEl, damage);
}

function applyMultiHit(targetEl, hitCount, interval) {
    HitEffects.multiHit(targetEl, hitCount, interval);
}

function applyCloneHit(targetEl, damage) {
    HitEffects.cloneHit(targetEl, damage);
}

// 필터 리셋 함수 (버그 방지용)
function resetElementFilter(targetEl) {
    HitEffects.resetFilter(targetEl);
}

// 플레이어 필터 강제 리셋
function resetPlayerFilter() {
    const playerEl = document.getElementById('player');
    if (playerEl) {
        HitEffects.resetFilter(playerEl);
        const sprite = playerEl.querySelector('.player-sprite-img, img');
        if (sprite) {
            sprite.style.filter = '';
            sprite.style.transition = '';
        }
    }
}

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HitEffects.init());
} else {
    HitEffects.init();
}

// 전역 노출
window.HitEffects = HitEffects;

console.log('[HitEffects] 타격감 시스템 로드 완료');


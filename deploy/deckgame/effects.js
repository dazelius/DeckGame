// ==========================================
// Shadow Deck - 이펙트 시스템 (VFX 기반)
// ==========================================

const EffectSystem = {
    // 초기화 - VFX 시스템 초기화
    init() {
        if (typeof VFX !== 'undefined') {
            VFX.init();
        }
    },
    
    // ==========================================
    // 슬래시 이펙트 (기본 공격 - 혈흔 사용)
    // ==========================================
    slash(targetEl, options = {}) {
        if (!targetEl) return;
        
        const {
            color = '#ff4444',
            count = 1
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            // 혈흔 슬래시 사용
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 50;
                    VFX.bloodSlash(centerX + offsetX, centerY + offsetY, { 
                        length: 150 + Math.random() * 50,
                        width: 20,
                        angle: Math.random() * 360,
                        duration: 350
                    });
                }, i * 60);
            }
        }
        
        this.screenShake(5 + count * 2, 200);
    },
    
    // ==========================================
    // 강타 이펙트
    // ==========================================
    impact(targetEl, options = {}) {
        const {
            color = '#ff6b35',
            size = 200
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.impact(centerX, centerY, { color, size: size * 0.6 });
            VFX.shockwave(centerX, centerY, { color, size: size * 1.5 });
            VFX.sparks(centerX, centerY, { color, count: 15, speed: 20 });
        }
        
        this.screenShake(12, 300);
    },
    
    // ==========================================
    // 다중 타격 이펙트
    // ==========================================
    multiHit(targetEl, hitCount = 2, options = {}) {
        const {
            color = '#ff4444',
            interval = 100
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.multiHit(centerX, centerY, hitCount, { color, interval });
        }
        
        this.screenShake(6, 300);
    },
    
    // ==========================================
    // 연속 찌르기 이펙트
    // ==========================================
    flurryStab(targetEl, options = {}) {
        const {
            color = '#60a5fa',
            hitCount = 3,
            interval = 150
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            for (let i = 0; i < hitCount; i++) {
                setTimeout(() => {
                    const offsetY = (i - 1) * 25;
                    VFX.slash(centerX, centerY + offsetY, {
                        color,
                        length: 200,
                        width: 10,
                        angle: 0 + (Math.random() - 0.5) * 20
                    });
                    VFX.sparks(centerX + 30, centerY + offsetY, { color, count: 8 });
                    this.showHitNumber(centerX + 40, centerY + offsetY - 20, i + 1, color);
                }, i * interval);
            }
        }
        
        setTimeout(() => this.screenShake(6, 200), (hitCount - 1) * interval);
    },
    
    // ==========================================
    // 히트 넘버 표시
    // ==========================================
    showHitNumber(x, y, hitNum, color) {
        const number = document.createElement('div');
        number.textContent = hitNum;
        number.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            color: ${color};
            text-shadow: 0 0 10px ${color}, 2px 2px 0 #000;
            transform: translate(-50%, -50%) scale(0);
            animation: hitNumberPop 0.4s ease-out forwards;
            z-index: 1002;
            pointer-events: none;
        `;
        document.body.appendChild(number);
        setTimeout(() => number.remove(), 400);
    },
    
    // ==========================================
    // 처형의 칼날 이펙트 (심플 버전)
    // ==========================================
    executionBlade(targetEl, hitCount = 1) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            // 히트 수만큼 슬래시
            VFX.multiHit(centerX, centerY, hitCount, { 
                color: '#ff4444', 
                interval: 80 
            });
            
            // 마지막에 강한 슬래시
            setTimeout(() => {
                VFX.crossSlash(centerX, centerY, { color: '#fbbf24', size: 350 });
                VFX.shockwave(centerX, centerY, { color: '#ff4444', size: 250 });
            }, hitCount * 80 + 100);
        }
        
        this.screenShake(10, 300);
    },

    // ==========================================
    // 투척 이펙트 (단검)
    // ==========================================
    throwProjectile(targetEl, options = {}) {
        const {
            color = '#60a5fa',
            glowColor = '#60a5fa',
            isDagger = true
        } = options;
        
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const playerRect = playerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const startX = playerRect.left + playerRect.width / 2;
        const startY = playerRect.top + playerRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            if (isDagger) {
                // 단검 투척
                VFX.dagger(startX, startY, endX, endY, { 
                    color: '#c0c0c0',
                    glowColor: glowColor,
                    size: 45,
                    speed: 30,
                    spinSpeed: 20
                });
            } else {
                // 일반 발사체
                VFX.projectile(startX, startY, endX, endY, { 
                    color, 
                    size: 15,
                    speed: 20
                });
            }
        }
    },
    
    // ==========================================
    // NPC용 단검 투척 (적 → 플레이어)
    // ==========================================
    throwDaggerFromEnemy(enemyEl, targetEl, options = {}) {
        const {
            glowColor = '#ef4444'
        } = options;
        
        if (!enemyEl || !targetEl) return;
        
        const enemyRect = enemyEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const startX = enemyRect.left + enemyRect.width / 2;
        const startY = enemyRect.top + enemyRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.dagger(startX, startY, endX, endY, { 
                color: '#c0c0c0',
                glowColor: glowColor,
                size: 45,
                speed: 28,
                spinSpeed: 18
            });
        }
    },
    
    // ==========================================
    // 방어 이펙트
    // ==========================================
    shield(targetEl, options = {}) {
        const {
            color = '#4fc3f7'
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.shield(centerX, centerY, { color, size: 100 });
        }
    },
    
    // ==========================================
    // 힐 이펙트
    // ==========================================
    heal(targetEl, options = {}) {
        const {
            color = '#4ade80'
        } = options;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 캐릭터 색상 플래시 효과
        if (targetEl) {
            targetEl.classList.add('heal-flash');
            setTimeout(() => targetEl.classList.remove('heal-flash'), 400);
        }
        
        if (typeof VFX !== 'undefined') {
            VFX.heal(centerX, centerY, { color, count: 15, size: 80 });
        }
    },
    
    // ==========================================
    // 파이어 이펙트
    // ==========================================
    fire(targetEl, options = {}) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.fire(centerX, centerY, { size: 80, count: 25 });
        }
        
        this.screenShake(8, 250);
    },
    
    // ==========================================
    // 처형 이펙트 (즉사기)
    // ==========================================
    execute(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 화면 어둡게
        const darkness = document.createElement('div');
        darkness.style.cssText = `
            position: fixed;
            inset: 0;
            background: #000;
            opacity: 0;
            animation: executeDarkness 1000ms ease-in-out forwards;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(darkness);
        
        setTimeout(() => {
            if (typeof VFX !== 'undefined') {
                VFX.crossSlash(centerX, centerY, { color: '#ff0000', size: 500 });
                VFX.shockwave(centerX, centerY, { color: '#ff0000', size: 400 });
            }
        }, 300);
        
        setTimeout(() => darkness.remove(), 1000);
        this.screenShake(20, 500);
    },
    
    // ==========================================
    // 검우 이펙트 (다중 검)
    // ==========================================
    swordRain(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 200;
                    VFX.slash(centerX + offsetX, centerY - 50, {
                        color: '#e0e0e0',
                        length: 150,
                        angle: 90 + (Math.random() - 0.5) * 20
                    });
                    VFX.sparks(centerX + offsetX, centerY + 30, { color: '#fff', count: 5 });
                }, i * 80);
            }
        }
        
        setTimeout(() => this.screenShake(15, 400), 200);
    },
    
    // ==========================================
    // 에너지 충전 이펙트
    // ==========================================
    energize(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.lightning(centerX - 50, centerY - 100, centerX, centerY, { color: '#ffd700' });
            VFX.lightning(centerX + 50, centerY - 100, centerX, centerY, { color: '#ffd700' });
            VFX.sparks(centerX, centerY, { color: '#ffd700', count: 20 });
            VFX.shockwave(centerX, centerY, { color: '#ffd700', size: 150 });
        }
    },
    
    // ==========================================
    // 버프 이펙트
    // ==========================================
    buff(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.buff(centerX, centerY, { color: '#fbbf24' });
        }
        
        // 대상 글로우
        targetEl.classList.add('buff-glow');
        setTimeout(() => targetEl.classList.remove('buff-glow'), 800);
    },
    
    // ==========================================
    // 디버프 이펙트
    // ==========================================
    debuff(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.buff(centerX, centerY, { color: '#a855f7', isDebuff: true });
        }
        
        // 대상 글로우
        targetEl.classList.add('debuff-glow');
        setTimeout(() => targetEl.classList.remove('debuff-glow'), 800);
    },
    
    // ==========================================
    // 출혈 이펙트
    // ==========================================
    bleed(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.bleed(centerX, centerY, { color: '#dc2626', count: 12 });
        }
    },
    
    // ==========================================
    // 크리티컬 히트 이펙트
    // ==========================================
    criticalHit(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.criticalHit(centerX, centerY, { size: 150 });
        }
        
        this.screenShake(15, 300);
    },
    
    // ==========================================
    // 파티클 버스트 이펙트
    // ==========================================
    particleBurst(x, y, options = {}) {
        const {
            color = '#ffffff',
            count = 15,
            speed = 200
        } = options;
        
        if (typeof VFX !== 'undefined') {
            VFX.sparks(x, y, { color, count, speed: speed / 20 });
        }
    },
    
    // ==========================================
    // 글로우 이펙트
    // ==========================================
    glow(targetEl, options = {}) {
        const {
            color = '#ffd700',
            duration = 300
        } = options;
        
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (typeof VFX !== 'undefined') {
            VFX.buff(centerX, centerY, { color, size: 80 });
        }
    },
    
    // ==========================================
    // 파티클 상승 이펙트
    // ==========================================
    particleRise(x, y, options = {}) {
        const {
            color = '#ffffff',
            count = 10,
            symbol = '✨'
        } = options;
        
        if (typeof VFX !== 'undefined') {
            VFX.buff(x, y, { color, size: 60 });
            VFX.sparks(x, y, { color, count: count, speed: 5 });
        }
    },
    
    // ==========================================
    // 연속 찌르기 히트 이펙트
    // ==========================================
    flurryHit(targetEl, hitNum) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        
        if (typeof VFX !== 'undefined') {
            VFX.slash(centerX + offsetX, centerY + offsetY, {
                color: '#60a5fa',
                length: 80,
                angle: Math.random() * Math.PI * 2
            });
            VFX.sparks(centerX + offsetX, centerY + offsetY, {
                color: '#60a5fa',
                count: 5,
                speed: 8
            });
        }
    },
    
    // ==========================================
    // 플래시 이펙트
    // ==========================================
    // 플래시 타이머 관리
    _flashTimers: new WeakMap(),
    
    flash(targetEl, options = {}) {
        if (!targetEl) return;
        
        const {
            color = '#ffffff',
            duration = 100
        } = options;
        
        const sprite = targetEl.querySelector('.enemy-sprite-img, .player-sprite-img, img');
        
        // 기존 타이머 취소
        const existing = this._flashTimers.get(targetEl);
        if (existing) {
            clearTimeout(existing);
        }
        
        // 플래시 효과 적용
        const flashFilter = `brightness(2) sepia(1) saturate(10) hue-rotate(${this.getHueRotation(color)}deg)`;
        targetEl.style.filter = flashFilter;
        if (sprite) {
            sprite.style.filter = flashFilter;
        }
        
        // 원래 상태로 복구 (항상 빈 문자열로 리셋)
        const timer = setTimeout(() => {
            targetEl.style.filter = '';
            if (sprite) {
                sprite.style.filter = '';
            }
            this._flashTimers.delete(targetEl);
        }, duration);
        
        this._flashTimers.set(targetEl, timer);
    },
    
    // 색상에서 Hue 회전값 계산 헬퍼
    getHueRotation(color) {
        // 간단한 색상별 hue 매핑
        const colorMap = {
            '#22c55e': 90,   // 초록
            '#4ade80': 90,   // 밝은 초록
            '#ef4444': 0,    // 빨강
            '#ff4444': 0,    // 빨강
            '#fbbf24': 40,   // 노랑/금색
            '#60a5fa': 200,  // 파랑
            '#a855f7': 270,  // 보라
            '#ffffff': 0,    // 흰색
        };
        return colorMap[color] || 0;
    },
    
    // ==========================================
    // 화면 흔들림
    // ==========================================
    screenShake(intensity = 10, duration = 300) {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        gameContainer.style.animation = 'none';
        gameContainer.offsetHeight; // Reflow
        gameContainer.style.animation = `screenShake ${duration}ms ease-out`;
        gameContainer.style.setProperty('--shake-intensity', `${intensity}px`);
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    screenFlash(color = '#ffffff', duration = 200) {
        // 기존 플래시 제거
        const existing = document.getElementById('screen-flash-overlay');
        if (existing) existing.remove();
        
        // 플래시 오버레이 생성
        const flash = document.createElement('div');
        flash.id = 'screen-flash-overlay';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            opacity: 0.6;
            pointer-events: none;
            z-index: 99999;
            animation: screenFlashAnim ${duration}ms ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        
        // 제거
        setTimeout(() => flash.remove(), duration);
    },
    
    // ==========================================
    // 플레이어 공격 이펙트 (돌진)
    // ==========================================
    playerAttack(playerEl, enemyEl, callback) {
        if (!playerEl || !enemyEl) {
            if (callback) callback();
            return;
        }
        
        // 분신 시스템에 플레이어 공격 중임을 알림 (분신이 따라오지 않게)
        if (typeof ShadowCloneSystem !== 'undefined') {
            ShadowCloneSystem.playerAttacking = true;
        }
        
        // 플레이어 돌진
        playerEl.classList.add('player-attacking');
        
        // 돌진 후 콜백 실행
        setTimeout(() => {
            if (callback) callback();
        }, 200);
        
        // 원위치
        setTimeout(() => {
            playerEl.classList.remove('player-attacking');
            // 분신 시스템에 플레이어 공격 종료 알림
            if (typeof ShadowCloneSystem !== 'undefined') {
                ShadowCloneSystem.playerAttacking = false;
            }
        }, 500);
    },
    
    // ==========================================
    // 몸통박치기 이펙트 (전투 개막용)
    // ==========================================
    bodySlam(playerEl, enemyEl, callback) {
        if (!playerEl || !enemyEl) {
            if (callback) callback();
            return;
        }
        
        // 분신 시스템에 플레이어 공격 중임을 알림
        if (typeof ShadowCloneSystem !== 'undefined') {
            ShadowCloneSystem.playerAttacking = true;
        }
        
        const enemyRect = enemyEl.getBoundingClientRect();
        
        // 강력한 돌진 클래스 추가
        playerEl.classList.add('body-slam-attack');
        
        // 화면 흔들림 시작
        this.screenShake(15, 400);
        
        // 충돌 시점에 이펙트
        setTimeout(() => {
            const impactX = enemyRect.left + enemyRect.width / 2;
            const impactY = enemyRect.top + enemyRect.height / 2;
            
            if (typeof VFX !== 'undefined') {
                VFX.impact(impactX, impactY, { color: '#ff6600', size: 150 });
                VFX.shockwave(impactX, impactY, { color: '#ffaa00', size: 300 });
                VFX.sparks(impactX, impactY, { color: '#ffaa00', count: 30, speed: 25 });
            }
            
            if (callback) callback();
        }, 200);
        
        // 원위치
        setTimeout(() => {
            playerEl.classList.remove('body-slam-attack');
            // 분신 시스템에 플레이어 공격 종료 알림
            if (typeof ShadowCloneSystem !== 'undefined') {
                ShadowCloneSystem.playerAttacking = false;
            }
        }, 600);
    },
    
    // ==========================================
    // 적 공격 이펙트
    // ==========================================
    enemyAttack(enemyEl, playerEl, damage) {
        if (!enemyEl || !playerEl) return;
        
        const playerRect = playerEl.getBoundingClientRect();
        const playerCenterX = playerRect.left + playerRect.width / 2;
        const playerCenterY = playerRect.top + playerRect.height / 2;
        
        // 적 돌진 애니메이션
        enemyEl.classList.add('enemy-attacking');
        
        // 충돌 이펙트
        setTimeout(() => {
            if (typeof VFX !== 'undefined') {
                VFX.slash(playerCenterX, playerCenterY, { 
                    color: '#ef4444', 
                    slashCount: 2,
                    randomOffset: 50
                });
                VFX.impact(playerCenterX, playerCenterY, { color: '#ef4444', size: 80 });
            }
            
            this.screenShake(damage > 15 ? 20 : 12, 400);
            this.showDamageVignette();
        }, 300);
        
        // 적 원위치
        setTimeout(() => {
            enemyEl.classList.remove('enemy-attacking');
        }, 600);
    },
    
    // ==========================================
    // 데미지 비네팅
    // ==========================================
    showDamageVignette() {
        const vignette = document.createElement('div');
        vignette.className = 'damage-vignette';
        document.body.appendChild(vignette);
        setTimeout(() => vignette.remove(), 500);
    }
};

// ==========================================
// 최소 CSS 애니메이션 (돌진, 화면 흔들림 등 DOM 기반)
// ==========================================
const effectStyles = document.createElement('style');
effectStyles.textContent = `
    @keyframes hitNumberPop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        40% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
        100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
    }
    
    @keyframes executeDarkness {
        0% { opacity: 0; }
        30% { opacity: 0.8; }
        70% { opacity: 0.8; }
        100% { opacity: 0; }
    }
    
    @keyframes screenShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(calc(var(--shake-intensity) * -1), calc(var(--shake-intensity) * 0.5)); }
        20% { transform: translate(var(--shake-intensity), calc(var(--shake-intensity) * -0.5)); }
        30% { transform: translate(calc(var(--shake-intensity) * -0.8), var(--shake-intensity)); }
        40% { transform: translate(calc(var(--shake-intensity) * 0.8), calc(var(--shake-intensity) * -1)); }
        50% { transform: translate(calc(var(--shake-intensity) * -0.5), calc(var(--shake-intensity) * 0.5)); }
        60% { transform: translate(calc(var(--shake-intensity) * 0.5), calc(var(--shake-intensity) * -0.3)); }
        70% { transform: translate(calc(var(--shake-intensity) * -0.3), calc(var(--shake-intensity) * 0.2)); }
        80% { transform: translate(calc(var(--shake-intensity) * 0.2), calc(var(--shake-intensity) * -0.1)); }
        90% { transform: translate(calc(var(--shake-intensity) * -0.1), 0); }
    }
    
    /* 화면 플래시 */
    @keyframes screenFlashAnim {
        0% { opacity: 0.7; }
        100% { opacity: 0; }
    }
    
    /* 플레이어 돌진 */
    .player-attacking {
        animation: playerLunge 0.5s ease-out !important;
    }
    
    @keyframes playerLunge {
        0% { transform: translateX(0); }
        25% { transform: translateX(60px) scale(1.1); }
        40% { transform: translateX(80px) scale(1.15); }
        100% { transform: translateX(0) scale(1); }
    }
    
    /* 몸통박치기 공격 */
    .body-slam-attack {
        animation: bodySlamLunge 0.6s ease-out !important;
    }
    
    @keyframes bodySlamLunge {
        0% { transform: translateX(0) scale(1); }
        15% { transform: translateX(-20px) scale(1.2); }
        30% { transform: translateX(120px) scale(1.3); }
        50% { transform: translateX(150px) scale(1.4); }
        70% { transform: translateX(100px) scale(1.2); }
        100% { transform: translateX(0) scale(1); }
    }
    
    /* 적 돌진 */
    .enemy-attacking {
        animation: enemyLunge 0.6s ease-out !important;
    }
    
    @keyframes enemyLunge {
        0% { transform: translateX(0); }
        30% { transform: translateX(-80px) scale(1.1); }
        50% { transform: translateX(-100px) scale(1.15); }
        100% { transform: translateX(0) scale(1); }
    }
    
    /* 데미지 비네팅 */
    .damage-vignette {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 999;
        animation: damageVignette 0.5s ease-out forwards;
    }
    
    @keyframes damageVignette {
        0% { box-shadow: inset 0 0 150px 50px rgba(239, 68, 68, 0.5); }
        100% { box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    
    /* 버프/디버프 글로우 */
    .buff-glow {
        filter: brightness(1.3) drop-shadow(0 0 20px #fbbf24) !important;
        animation: buffGlow 0.8s ease-out;
    }
    
    @keyframes buffGlow {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.5) drop-shadow(0 0 30px #fbbf24); }
    }
    
    .debuff-glow {
        filter: brightness(0.7) drop-shadow(0 0 20px #a855f7) !important;
        animation: debuffGlow 0.8s ease-out;
    }
    
    @keyframes debuffGlow {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(0.5) drop-shadow(0 0 30px #a855f7); }
    }
`;
document.head.appendChild(effectStyles);

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    EffectSystem.init();
});

// 페이지 로드 후에도 초기화
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    EffectSystem.init();
}

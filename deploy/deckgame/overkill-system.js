// ==========================================
// Overkill System - 오버킬 시각 보상 시스템
// 오버킬 데미지가 높을수록 화려한 절단 효과!
// ==========================================

const OverkillSystem = {
    // 설정
    config: {
        enabled: true,
        // 오버킬 티어 기준 (초과 데미지) - 매우 쉽게 절단!
        tiers: {
            minor: 1,       // 1+ : 절단 (모든 오버킬에서 절단!)
            normal: 3,      // 3+ : 절단 + 더 많은 파편
            major: 6,       // 6+ : 강한 절단
            brutal: 12,     // 12+ : 폭발 절단
            obliterate: 25  // 25+ : 완전 분쇄 + 화면 효과
        },
        // 슬로우 모션 설정 (더 부드럽게)
        slowmo: {
            minor: { scale: 1.0, duration: 0 },        // 슬로우 없음
            normal: { scale: 0.7, duration: 300 },     // 70% 속도, 0.3초
            major: { scale: 0.5, duration: 500 },      // 50% 속도, 0.5초
            brutal: { scale: 0.4, duration: 700 },     // 40% 속도, 0.7초
            obliterate: { scale: 0.3, duration: 1000 } // 30% 속도, 1초
        },
        // 로그 출력
        showLog: true
    },
    
    // (슬로우 모션 제거됨)
    
    // 오버킬 데이터 저장 (적별)
    pendingOverkills: new Map(),
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[OverkillSystem] 오버킬 시스템 초기화');
    },
    
    // ==========================================
    // 오버킬 등록 (데미지 적용 시 호출)
    // ==========================================
    registerOverkill(enemy, damage, enemyIndex) {
        console.log('[Overkill] registerOverkill 호출:', { 
            enemyName: enemy?.name, 
            damage, 
            enemyIndex, 
            enemyHp: enemy?.hp,
            enabled: this.config.enabled 
        });
        
        if (!this.config.enabled) {
            console.log('[Overkill] 시스템 비활성화');
            return;
        }
        if (!enemy) {
            console.log('[Overkill] enemy 없음');
            return;
        }
        if (enemy.hp > 0) {
            console.log('[Overkill] 적이 아직 살아있음:', enemy.hp);
            return;
        }
        
        // 오버킬 데미지 계산 (음수 HP 또는 저장된 값)
        let overkillDamage = 0;
        if (enemy.hp < 0) {
            overkillDamage = Math.abs(enemy.hp);
        } else if (enemy._overkillDamage) {
            overkillDamage = enemy._overkillDamage;
        }
        
        // 🔥 연타 공격 누적: 이미 등록된 오버킬이 있으면 데미지 합산!
        const existing = this.pendingOverkills.get(enemyIndex);
        if (existing) {
            overkillDamage += existing.overkillDamage;
            console.log('[Overkill] 🔥 연타 누적! 기존:', existing.overkillDamage, '+ 추가 → 총:', overkillDamage);
        }
        
        console.log('[Overkill] 오버킬 데미지:', overkillDamage, '(enemy.hp:', enemy.hp, ')');
        
        if (overkillDamage <= 0) {
            console.log('[Overkill] 오버킬 없음 (정확히 0)');
            return;
        }
        
        const tier = this.getTier(overkillDamage);
        
        // 저장 (누적된 값으로 업데이트)
        this.pendingOverkills.set(enemyIndex, {
            enemy,
            overkillDamage,
            tier
        });
        
        console.log(`[Overkill] ✅ 등록/업데이트: ${enemy.name}, 총 ${overkillDamage} 데미지, 티어: ${tier}`);
    },
    
    // ==========================================
    // 오버킬 티어 계산
    // ==========================================
    getTier(overkillDamage) {
        const { tiers } = this.config;
        
        if (overkillDamage >= tiers.obliterate) return 'obliterate';
        if (overkillDamage >= tiers.brutal) return 'brutal';
        if (overkillDamage >= tiers.major) return 'major';
        if (overkillDamage >= tiers.normal) return 'normal';
        if (overkillDamage >= tiers.minor) return 'minor';
        return 'none';
    },
    
    // ==========================================
    // 오버킬 효과 실행 (적 사망 처리 시 호출)
    // ==========================================
    executeOverkill(enemyIndex, enemyEl) {
        console.log('[Overkill] executeOverkill 호출:', enemyIndex, enemyEl);
        
        if (!this.config.enabled) {
            console.log('[Overkill] 시스템 비활성화');
            return false;
        }
        if (!enemyEl) {
            console.log('[Overkill] enemyEl 없음');
            return false;
        }
        
        const overkillData = this.pendingOverkills.get(enemyIndex);
        console.log('[Overkill] pendingOverkills:', this.pendingOverkills.size, 'overkillData:', overkillData);
        
        if (!overkillData) {
            console.log('[Overkill] 오버킬 데이터 없음 - 등록되지 않음');
            return false;
        }
        
        const { enemy, overkillDamage, tier } = overkillData;
        const rect = enemyEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        console.log('[Overkill] 실행:', { 
            enemy: enemy.name, 
            overkillDamage, 
            tier, 
            x, y, 
            width: rect.width, 
            height: rect.height 
        });
        
        // GoreVFX 체크 (VFX 폴백)
        const hasGore = typeof GoreVFX !== 'undefined';
        const hasVFX = typeof VFX !== 'undefined';
        console.log('[Overkill] GoreVFX:', hasGore, 'VFX:', hasVFX);
        
        if (!hasGore && !hasVFX) {
            console.warn('[Overkill] VFX 시스템 없음');
            this.pendingOverkills.delete(enemyIndex);
            return false;
        }
        
        // 💀 오버킬 데미지 표시
        this.showOverkillDamageText(x, y, overkillDamage, tier);
        
        // 티어별 효과 실행 (슬로우 모션 제거됨)
        this.executeEffect(tier, x, y, rect, overkillDamage, enemy, enemyEl);
        
        // 로그
        if (this.config.showLog) {
            this.showOverkillLog(enemy.name, overkillDamage, tier);
        }
        
        // 정리
        this.pendingOverkills.delete(enemyIndex);
        return true;
    },
    
    // ==========================================
    // 티어별 효과 실행
    // ==========================================
    executeEffect(tier, x, y, rect, overkillDamage, enemy, enemyEl) {
        const width = rect.width * 0.8;
        const height = rect.height * 0.8;
        
        // 적 이미지 소스 추출
        const imgSrc = this.getEnemyImageSrc(enemyEl);
        
        // 🩸 모든 티어에서 무조건 절단 + 파편!
        switch (tier) {
            case 'obliterate':
                this.effectObliterate(x, y, width, height, overkillDamage, imgSrc);
                break;
            case 'brutal':
                this.effectBrutal(x, y, width, height, overkillDamage, imgSrc);
                break;
            case 'major':
                this.effectMajor(x, y, width, height, overkillDamage, imgSrc);
                break;
            case 'normal':
                this.effectNormal(x, y, width, height, overkillDamage, imgSrc);
                break;
            case 'minor':
                this.effectMinor(x, y, width, height, overkillDamage, imgSrc);
                break;
            default:
                // 오버킬 없음 - 기본 사망도 파편!
                this.effectMinor(x, y, width, height, 1, imgSrc);
                break;
        }
    },
    
    // 적 이미지 소스 추출 (GoreVFX 사용)
    getEnemyImageSrc(enemyEl) {
        if (typeof GoreVFX !== 'undefined') {
            return GoreVFX.getEnemyImageSrc(enemyEl);
        }
        
        // 폴백
        if (!enemyEl) return null;
        
        let spriteImg = enemyEl.querySelector('.enemy-sprite-img');
        if (!spriteImg) spriteImg = enemyEl.querySelector('img');
        
        if (spriteImg) {
            return spriteImg.src || spriteImg.getAttribute('src');
        }
        
        return null;
    },
    
    // ==========================================
    // 🩸 모든 티어에서 무조건 절단!
    // ==========================================
    effectMinor(x, y, width, height, overkillDamage, imgSrc) {
        // minor도 절단!
        this.forceDisember(x, y, width, height, overkillDamage, 'minor');
    },
    
    effectNormal(x, y, width, height, overkillDamage, imgSrc) {
        this.forceDisember(x, y, width, height, overkillDamage, 'normal');
    },
    
    effectMajor(x, y, width, height, overkillDamage, imgSrc) {
        this.forceDisember(x, y, width, height, overkillDamage, 'major');
    },
    
    effectBrutal(x, y, width, height, overkillDamage, imgSrc) {
        this.forceDisember(x, y, width, height, overkillDamage, 'brutal');
    },
    
    effectObliterate(x, y, width, height, overkillDamage, imgSrc) {
        this.forceDisember(x, y, width, height, overkillDamage, 'obliterate');
        this.showObliterateText(x, y);
    },
    
    // ==========================================
    // 💀 강제 절단 효과 (무조건 실행!)
    // ==========================================
    forceDisember(x, y, width, height, overkillDamage, tier) {
        console.log('[Overkill] 강제 절단 실행:', tier, overkillDamage);
        
        // 화면 플래시
        this.doScreenFlash(tier);
        
        // 화면 흔들림
        this.doScreenShake(tier, overkillDamage);
        
        // 🩸 피 튀김 (무조건)
        this.doBloodSplatter(x, y, overkillDamage, tier);
        
        // ⚔️ 절단 파편 (무조건!) - Canvas 직접 그리기
        this.doForcedFragments(x, y, width, height, overkillDamage, tier);
        
        // 🩸 피 웅덩이
        setTimeout(() => {
            this.doBloodPool(x, y + height/2 + 50, tier);
        }, 500);
    },
    
    // 화면 플래시
    doScreenFlash(tier) {
        const flash = document.createElement('div');
        const colors = {
            minor: 'rgba(139, 0, 0, 0.3)',
            normal: 'rgba(200, 0, 0, 0.4)',
            major: 'rgba(255, 0, 0, 0.5)',
            brutal: 'rgba(255, 0, 0, 0.6)',
            obliterate: 'rgba(255, 255, 255, 0.7)'
        };
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${colors[tier] || 'rgba(255, 0, 0, 0.5)'};
            pointer-events: none;
            z-index: 99999;
            animation: overkillFlash 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    },
    
    // 화면 흔들림
    doScreenShake(tier, overkillDamage) {
        const intensities = { minor: 5, normal: 10, major: 20, brutal: 30, obliterate: 50 };
        const intensity = intensities[tier] || 10;
        
        document.body.style.animation = `overkillShake ${0.1 + overkillDamage * 0.005}s ease-out`;
        setTimeout(() => {
            document.body.style.animation = '';
        }, 100 + overkillDamage * 5);
    },
    
    // 피 튀김
    doBloodSplatter(x, y, overkillDamage, tier) {
        if (typeof GoreVFX !== 'undefined') {
            const counts = { minor: 30, normal: 50, major: 70, brutal: 100, obliterate: 150 };
            GoreVFX.bloodSplatter(x, y, {
                count: counts[tier] || 50,
                speed: 400 + overkillDamage * 10,
                size: 8 + overkillDamage * 0.2
            });
        }
    },
    
    // 피 웅덩이
    doBloodPool(x, y, tier) {
        if (typeof GoreVFX !== 'undefined') {
            const sizes = { minor: 50, normal: 70, major: 90, brutal: 120, obliterate: 150 };
            GoreVFX.bloodPool(x, y, { size: sizes[tier] || 80 });
        }
    },
    
    // ⚔️ 모든 오버킬 = 조각조각(shatter) 연출!
    doForcedFragments(x, y, width, height, overkillDamage, tier) {
        console.log('[Overkill] 💥 조각조각 절단 실행:', tier);
        
        // 🩸 무조건 shatterDismember (조각조각)!
        if (typeof GoreVFX !== 'undefined') {
            GoreVFX.shatterDismember(x, y, { width, height, duration: 2500 });
        }
    },
    
    // 🩸 파편 객체 생성 (속도 1/2로 감소)
    createFragment(x, y, dir, size, speed, overkillDamage) {
        const viewportH = window.innerHeight;
        
        return {
            x, y,
            // 속도 절반으로 감소
            vx: dir.dx * (speed + Math.random() * 150),
            vy: dir.dy * speed - 200 - Math.random() * 150,
            vr: (Math.random() - 0.5) * 10,  // 회전도 느리게
            rotation: Math.random() * Math.PI * 2,
            size,
            alpha: 1,
            startTime: Date.now(),
            duration: 3000,  // 3초간 지속
            gravity: 400,    // 중력 적당히
            groundY: viewportH - 80 + Math.random() * 50,
            bounceCount: 0,
            maxBounces: 3,
            color: `hsl(0, ${60 + Math.random() * 40}%, ${8 + Math.random() * 12}%)`,
            bloodTrail: [],
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const dt = 0.016 * (typeof VFX !== 'undefined' ? VFX.timeScale : 1);
                
                // 물리
                this.vy += this.gravity * dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.rotation += this.vr * dt;
                
                // 바운스 (땅에서)
                if (this.y > this.groundY && this.bounceCount < this.maxBounces) {
                    this.bounceCount++;
                    this.y = this.groundY;
                    this.vy = -this.vy * 0.4;
                    this.vx *= 0.7;
                    this.vr *= 0.6;
                }
                
                // 마찰
                this.vx *= 0.995;
                
                // 페이드아웃 (마지막 25%에서)
                const progress = elapsed / this.duration;
                if (progress > 0.75) {
                    this.alpha = 1 - (progress - 0.75) / 0.25;
                }
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                
                // 그림자
                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                
                // 파편 본체 (불규칙한 형태)
                ctx.fillStyle = this.color;
                ctx.beginPath();
                const points = 6;
                for (let i = 0; i < points; i++) {
                    const angle = (i / points) * Math.PI * 2;
                    const r = this.size / 2 * (0.7 + (i % 2) * 0.3);
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                
                // 테두리 (어두운 색)
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#3a1a0a';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                ctx.restore();
            }
        };
    },
    
    // ==========================================
    // OBLITERATE 텍스트 표시
    // ==========================================
    showObliterateText(x, y) {
        const text = document.createElement('div');
        text.className = 'overkill-obliterate-text';
        text.innerHTML = 'OBLITERATE!';
        text.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y - 50}px;
            transform: translateX(-50%) scale(0);
            font-family: 'Cinzel', serif;
            font-size: 3rem;
            font-weight: 900;
            color: #ff0000;
            text-shadow: 
                0 0 20px #ff0000,
                0 0 40px #ff0000,
                0 0 60px #8b0000,
                3px 3px 0 #4a0000,
                -3px -3px 0 #4a0000;
            pointer-events: none;
            z-index: 999999;
            animation: obliterateTextPop 1.2s ease-out forwards;
        `;
        
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1200);
    },
    
    // ==========================================
    // 오버킬 데미지 텍스트 표시
    // ==========================================
    showOverkillDamageText(x, y, overkillDamage, tier) {
        const tierColors = {
            minor: { main: '#ff6b6b', glow: '#ff0000' },
            normal: { main: '#ff4757', glow: '#ff0000' },
            major: { main: '#ff3838', glow: '#dc143c' },
            brutal: { main: '#ff0000', glow: '#8b0000' },
            obliterate: { main: '#ffffff', glow: '#ff0000' }
        };
        
        const tierSizes = {
            minor: '2rem',
            normal: '2.5rem',
            major: '3rem',
            brutal: '3.5rem',
            obliterate: '4.5rem'
        };
        
        const tierLabels = {
            minor: '',
            normal: 'OVERKILL',
            major: 'OVERKILL!',
            brutal: 'BRUTAL!',
            obliterate: 'OBLITERATE!'
        };
        
        const colors = tierColors[tier] || tierColors.normal;
        const fontSize = tierSizes[tier] || '2.5rem';
        const label = tierLabels[tier] || '';
        
        // 오버킬 데미지 숫자
        const dmgText = document.createElement('div');
        dmgText.className = 'overkill-damage-text';
        dmgText.innerHTML = `+${overkillDamage}`;
        dmgText.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y - 30}px;
            transform: translateX(-50%) scale(0);
            font-family: 'Cinzel', 'Georgia', serif;
            font-size: ${fontSize};
            font-weight: 900;
            color: ${colors.main};
            text-shadow: 
                0 0 10px ${colors.glow},
                0 0 20px ${colors.glow},
                0 0 40px ${colors.glow},
                3px 3px 0 #000,
                -1px -1px 0 #000;
            pointer-events: none;
            z-index: 999999;
            animation: overkillDamagePop 1.5s ease-out forwards;
            letter-spacing: 2px;
        `;
        
        document.body.appendChild(dmgText);
        setTimeout(() => dmgText.remove(), 1500);
        
        // 티어 라벨 (major 이상)
        if (label) {
            setTimeout(() => {
                const labelText = document.createElement('div');
                labelText.className = 'overkill-label-text';
                labelText.innerHTML = label;
                labelText.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y - 80}px;
                    transform: translateX(-50%) scale(0);
                    font-family: 'Cinzel', 'Georgia', serif;
                    font-size: ${tier === 'obliterate' ? '3rem' : '2rem'};
                    font-weight: 900;
                    color: ${tier === 'obliterate' ? '#fbbf24' : colors.main};
                    text-shadow: 
                        0 0 15px ${tier === 'obliterate' ? '#fbbf24' : colors.glow},
                        0 0 30px ${tier === 'obliterate' ? '#f59e0b' : colors.glow},
                        0 0 50px ${colors.glow},
                        2px 2px 0 #000;
                    pointer-events: none;
                    z-index: 999999;
                    animation: overkillLabelPop 1.8s ease-out forwards;
                    letter-spacing: 4px;
                `;
                
                document.body.appendChild(labelText);
                setTimeout(() => labelText.remove(), 1800);
            }, 100);
        }
    },
    
    // ==========================================
    // 오버킬 로그 표시
    // ==========================================
    showOverkillLog(enemyName, overkillDamage, tier) {
        const tierNames = {
            obliterate: '💀 OBLITERATE',
            brutal: '💥 BRUTAL',
            major: '⚔️ MAJOR',
            normal: '🗡️ OVERKILL',
            minor: '🩸 overkill'
        };
        
        const tierColors = {
            obliterate: 'critical',
            brutal: 'critical',
            major: 'damage',
            normal: 'damage',
            minor: 'normal'
        };
        
        const tierName = tierNames[tier] || 'OVERKILL';
        const logType = tierColors[tier] || 'normal';
        
        if (typeof addLog === 'function') {
            addLog(`${tierName}! ${enemyName} +${overkillDamage}`, logType);
        }
    },
    
    // (슬로우 모션 기능 제거됨 - 게임 방해)
    startSlowmo(tier) { /* 비활성화 */ },
    endSlowmo() { /* 비활성화 */ },
    hitStop(duration) { /* 비활성화 */ },
    slowmoScreenEffect(tier) { /* 비활성화 */ },
    
    // ==========================================
    // 전투 시작 시 초기화
    // ==========================================
    onBattleStart() {
        this.pendingOverkills.clear();
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('overkill-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'overkill-styles';
        style.textContent = `
            /* ===== 슬로우 모션 (VFX만 영향) ===== */
            /* CSS 애니메이션은 건드리지 않음 - VFX.timeScale로만 제어 */
            
            /* 슬로우 모션 중 붉은 테두리 효과만 */
            body.overkill-slowmo::before {
                content: '';
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 60%, rgba(139, 0, 0, 0.2) 100%);
                pointer-events: none;
                z-index: 9990;
            }
            
            /* 비네팅 효과 */
            @keyframes vignetteFlash {
                0% {
                    opacity: 0;
                }
                20% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                }
            }
            
            /* 🩸 화면 플래시 */
            @keyframes overkillFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            /* 🩸 화면 흔들림 */
            @keyframes overkillShake {
                0%, 100% { transform: translate(0); }
                10% { transform: translate(-15px, 10px); }
                20% { transform: translate(15px, -10px); }
                30% { transform: translate(-10px, -15px); }
                40% { transform: translate(10px, 15px); }
                50% { transform: translate(-20px, 5px); }
                60% { transform: translate(20px, -5px); }
                70% { transform: translate(-5px, 20px); }
                80% { transform: translate(5px, -20px); }
                90% { transform: translate(-10px, 10px); }
            }
            
            /* ===== 오버킬 데미지 텍스트 ===== */
            @keyframes overkillDamagePop {
                0% {
                    transform: translateX(-50%) scale(0) rotate(-15deg);
                    opacity: 0;
                }
                15% {
                    transform: translateX(-50%) scale(1.8) rotate(5deg);
                    opacity: 1;
                }
                30% {
                    transform: translateX(-50%) scale(1.3) rotate(-3deg);
                }
                50% {
                    transform: translateX(-50%) scale(1.5) rotate(0deg);
                }
                70% {
                    transform: translateX(-50%) scale(1.4) translateY(-20px);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) scale(1.2) translateY(-80px);
                    opacity: 0;
                }
            }
            
            @keyframes overkillLabelPop {
                0% {
                    transform: translateX(-50%) scale(0) rotate(10deg);
                    opacity: 0;
                }
                20% {
                    transform: translateX(-50%) scale(1.5) rotate(-5deg);
                    opacity: 1;
                }
                40% {
                    transform: translateX(-50%) scale(1.2) rotate(3deg);
                }
                60% {
                    transform: translateX(-50%) scale(1.3) rotate(0deg);
                }
                80% {
                    transform: translateX(-50%) scale(1.2) translateY(-30px);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) scale(1) translateY(-100px);
                    opacity: 0;
                }
            }
            
            /* ===== 텍스트 애니메이션 ===== */
            @keyframes obliterateTextPop {
                0% {
                    transform: translateX(-50%) scale(0) rotate(-10deg);
                    opacity: 0;
                }
                20% {
                    transform: translateX(-50%) scale(1.5) rotate(5deg);
                    opacity: 1;
                }
                40% {
                    transform: translateX(-50%) scale(1.2) rotate(-3deg);
                }
                60% {
                    transform: translateX(-50%) scale(1.3) rotate(2deg);
                }
                80% {
                    transform: translateX(-50%) scale(1.1) translateY(-30px);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) scale(0.8) translateY(-80px);
                    opacity: 0;
                }
            }
            
            .overkill-text {
                position: fixed;
                font-family: 'Cinzel', serif;
                font-weight: 900;
                pointer-events: none;
                z-index: 999999;
                animation: overkillTextFloat 1s ease-out forwards;
            }
            
            @keyframes overkillTextFloat {
                0% {
                    transform: translateX(-50%) scale(0.5);
                    opacity: 0;
                }
                30% {
                    transform: translateX(-50%) scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) translateY(-60px) scale(1);
                    opacity: 0;
                }
            }
            
            /* 슬로우 모션 중 UI 효과 */
            body.overkill-slowmo .enemy-unit {
                filter: contrast(1.2) saturate(1.3);
            }
            
            body.overkill-slowmo #player {
                filter: brightness(1.1) contrast(1.1);
            }
        `;
        
        document.head.appendChild(style);
    }
};

// ==========================================
// 초기화
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        OverkillSystem.init();
        OverkillSystem.injectStyles();
    });
} else {
    OverkillSystem.init();
    OverkillSystem.injectStyles();
}

// 전역 노출
window.OverkillSystem = OverkillSystem;

console.log('[OverkillSystem] overkill-system.js 로드 완료');


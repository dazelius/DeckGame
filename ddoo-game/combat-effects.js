// =====================================================
// Combat Effects System - 전투 연출 시스템
// =====================================================

const CombatEffects = {
    app: null,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(pixiApp) {
        this.app = pixiApp;
        this.container = new PIXI.Container();
        this.container.zIndex = 500;
        this.container.sortableChildren = true;
        pixiApp.stage.addChild(this.container);
        console.log('[CombatEffects] 초기화 완료');
    },
    
    // ==========================================
    // 유닛 위치 가져오기
    // ==========================================
    getUnitPosition(unit) {
        if (!unit) return null;
        const target = unit.container || unit.sprite;
        return target ? { x: target.x, y: target.y } : null;
    },
    
    // ==========================================
    // 화면 흔들림
    // ==========================================
    screenShake(intensity = 10, duration = 300) {
        const battleArea = document.getElementById('battle-area');
        if (!battleArea) return;
        
        const startTime = Date.now();
        const originalTransform = battleArea.style.transform || '';
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                battleArea.style.transform = originalTransform;
                return;
            }
            
            const progress = elapsed / duration;
            const currentIntensity = intensity * (1 - progress);
            const x = (Math.random() - 0.5) * 2 * currentIntensity;
            const y = (Math.random() - 0.5) * 2 * currentIntensity;
            
            battleArea.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };
        
        shake();
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    screenFlash(color = '#ffffff', duration = 150, intensity = 0.5) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${color};
            opacity: ${intensity};
            pointer-events: none;
            z-index: 9000;
            transition: opacity ${duration}ms ease-out;
        `;
        document.body.appendChild(flash);
        
        requestAnimationFrame(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), duration);
        });
    },
    
    // ==========================================
    // 히트 스톱 (프레임 멈춤 효과)
    // ==========================================
    async hitStop(duration = 50) {
        if (this.app) {
            this.app.ticker.stop();
            await new Promise(r => setTimeout(r, duration));
            this.app.ticker.start();
        }
    },
    
    // ==========================================
    // 슬래시 이펙트 (근접 공격)
    // ==========================================
    slashEffect(x, y, angle = -45, color = 0xffffff, scale = 1) {
        if (!this.app) return;
        
        const slash = new PIXI.Graphics();
        slash.x = x;
        slash.y = y;
        slash.rotation = angle * Math.PI / 180;
        slash.alpha = 0;
        slash.zIndex = 100;
        
        // 슬래시 모양 그리기
        const width = 120 * scale;
        const height = 15 * scale;
        
        // 메인 슬래시
        slash.moveTo(-width/2, 0);
        slash.lineTo(0, -height/2);
        slash.lineTo(width/2, 0);
        slash.lineTo(0, height/2);
        slash.closePath();
        slash.fill({ color: color, alpha: 0.9 });
        
        // 글로우 효과
        slash.moveTo(-width/2 * 0.8, 0);
        slash.lineTo(0, -height/2 * 0.6);
        slash.lineTo(width/2 * 0.8, 0);
        slash.lineTo(0, height/2 * 0.6);
        slash.closePath();
        slash.fill({ color: 0xffffff, alpha: 0.6 });
        
        this.container.addChild(slash);
        
        // 애니메이션
        gsap.timeline()
            .to(slash, { alpha: 1, duration: 0.05 })
            .to(slash.scale, { x: 1.5, y: 0.5, duration: 0.15, ease: 'power2.out' }, 0)
            .to(slash, { alpha: 0, duration: 0.1, delay: 0.1, onComplete: () => slash.destroy() });
    },
    
    // ==========================================
    // 대형 슬래시 (강공격용)
    // ==========================================
    heavySlash(x, y, angle = -30, color = 0xff6600) {
        if (!this.app) return;
        
        // 화면 흔들림 + 플래시
        this.screenShake(8, 200);
        this.screenFlash('#ff6600', 100, 0.3);
        
        // 메인 슬래시
        this.slashEffect(x, y, angle, color, 1.5);
        
        // 추가 슬래시 라인들
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.slashEffect(
                    x + (Math.random() - 0.5) * 40,
                    y + (Math.random() - 0.5) * 40,
                    angle + (Math.random() - 0.5) * 30,
                    0xffaa00,
                    0.6 + Math.random() * 0.4
                );
            }, i * 30);
        }
    },
    
    // ==========================================
    // 광역 슬래시 (Cleave)
    // ==========================================
    cleaveEffect(x, y, width = 200) {
        if (!this.app) return;
        
        this.screenShake(12, 250);
        this.screenFlash('#ffaa00', 120, 0.4);
        
        const arc = new PIXI.Graphics();
        arc.x = x;
        arc.y = y;
        arc.alpha = 0;
        arc.zIndex = 100;
        
        // 호 형태의 슬래시
        arc.arc(0, 0, width/2, Math.PI * 0.8, Math.PI * 0.2, true);
        arc.lineTo(0, 0);
        arc.closePath();
        arc.fill({ color: 0xffcc00, alpha: 0.7 });
        
        arc.arc(0, 0, width/2 * 0.7, Math.PI * 0.75, Math.PI * 0.25, true);
        arc.lineTo(0, 0);
        arc.closePath();
        arc.fill({ color: 0xffffff, alpha: 0.5 });
        
        this.container.addChild(arc);
        
        gsap.timeline()
            .to(arc, { alpha: 1, duration: 0.05 })
            .to(arc.scale, { x: 1.3, y: 0.8, duration: 0.2, ease: 'power2.out' }, 0)
            .to(arc, { rotation: 0.3, duration: 0.2 }, 0)
            .to(arc, { alpha: 0, duration: 0.15, delay: 0.1, onComplete: () => arc.destroy() });
    },
    
    // ==========================================
    // 찌르기 이펙트 (Strike - Pierce)
    // ==========================================
    pierceEffect(startX, startY, endX, endY, color = 0x66aaff) {
        if (!this.app) return;
        
        this.screenShake(6, 150);
        
        const angle = Math.atan2(endY - startY, endX - startX);
        const distance = Math.hypot(endX - startX, endY - startY);
        
        const pierce = new PIXI.Graphics();
        pierce.x = startX;
        pierce.y = startY;
        pierce.rotation = angle;
        pierce.alpha = 0;
        pierce.zIndex = 100;
        
        // 긴 찌르기 라인
        pierce.moveTo(0, -8);
        pierce.lineTo(distance, -3);
        pierce.lineTo(distance + 30, 0);
        pierce.lineTo(distance, 3);
        pierce.lineTo(0, 8);
        pierce.closePath();
        pierce.fill({ color: color, alpha: 0.8 });
        
        // 중심 라인
        pierce.moveTo(0, -3);
        pierce.lineTo(distance + 20, 0);
        pierce.lineTo(0, 3);
        pierce.closePath();
        pierce.fill({ color: 0xffffff, alpha: 0.6 });
        
        this.container.addChild(pierce);
        
        gsap.timeline()
            .fromTo(pierce.scale, { x: 0 }, { x: 1, duration: 0.1, ease: 'power2.out' })
            .to(pierce, { alpha: 1, duration: 0.05 }, 0)
            .to(pierce, { alpha: 0, x: pierce.x + Math.cos(angle) * 50, duration: 0.2, delay: 0.1, onComplete: () => pierce.destroy() });
    },
    
    // ==========================================
    // 원거리 공격 이펙트 (투사체)
    // ==========================================
    async projectileEffect(startX, startY, endX, endY, color = 0xff4444, size = 12) {
        if (!this.app) return;
        
        return new Promise(resolve => {
            const projectile = new PIXI.Graphics();
            projectile.x = startX;
            projectile.y = startY;
            projectile.zIndex = 100;
            
            // 투사체 본체
            projectile.circle(0, 0, size);
            projectile.fill({ color: color, alpha: 0.9 });
            
            // 글로우
            projectile.circle(0, 0, size * 0.6);
            projectile.fill({ color: 0xffffff, alpha: 0.7 });
            
            this.container.addChild(projectile);
            
            // 트레일 효과
            const createTrail = () => {
                const trail = new PIXI.Graphics();
                trail.x = projectile.x;
                trail.y = projectile.y;
                trail.zIndex = 99;
                trail.circle(0, 0, size * 0.5);
                trail.fill({ color: color, alpha: 0.5 });
                this.container.addChild(trail);
                
                gsap.to(trail, {
                    alpha: 0,
                    scale: 0.3,
                    duration: 0.2,
                    onComplete: () => trail.destroy()
                });
            };
            
            const trailInterval = setInterval(createTrail, 30);
            
            // 이동 애니메이션
            const duration = Math.hypot(endX - startX, endY - startY) / 800;
            
            gsap.to(projectile, {
                x: endX,
                y: endY,
                duration: Math.max(0.15, duration),
                ease: 'power1.in',
                onComplete: () => {
                    clearInterval(trailInterval);
                    projectile.destroy();
                    
                    // 착탄 이펙트
                    this.impactEffect(endX, endY, color);
                    resolve();
                }
            });
        });
    },
    
    // ==========================================
    // 화살 이펙트 (곡사 베지어 곡선) - 빠른 버전
    // ==========================================
    async arrowEffect(startX, startY, endX, endY, options = {}) {
        if (!this.app) return;
        
        const {
            color = 0x8B4513,      // 갈색 화살
            arrowLength = 25,
            arrowWidth = 3,
            arcHeight = 50,        // 곡사 높이 (낮게)
            speed = 1200,          // ★ 빠르게!
            isEnemy = false
        } = options;
        
        return new Promise(resolve => {
            // 화살 컨테이너
            const arrow = new PIXI.Container();
            arrow.x = startX;
            arrow.y = startY;
            arrow.zIndex = 100;
            
            // 화살대 (나무 막대)
            const shaft = new PIXI.Graphics();
            shaft.rect(-arrowLength/2, -arrowWidth/2, arrowLength, arrowWidth);
            shaft.fill({ color: color });
            arrow.addChild(shaft);
            
            // 화살촉 (삼각형)
            const head = new PIXI.Graphics();
            head.moveTo(arrowLength/2, 0);
            head.lineTo(arrowLength/2 - 8, -5);
            head.lineTo(arrowLength/2 - 8, 5);
            head.closePath();
            head.fill({ color: 0x555555 }); // 금속색
            arrow.addChild(head);
            
            // 깃털 (뒤쪽)
            const feather = new PIXI.Graphics();
            feather.moveTo(-arrowLength/2, 0);
            feather.lineTo(-arrowLength/2 - 5, -4);
            feather.lineTo(-arrowLength/2 + 3, 0);
            feather.lineTo(-arrowLength/2 - 5, 4);
            feather.closePath();
            feather.fill({ color: 0xffffff, alpha: 0.8 });
            arrow.addChild(feather);
            
            this.container.addChild(arrow);
            
            // 베지어 곡선 제어점 (곡사)
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - arcHeight;
            
            // 비행시간 (빠르게!)
            const distance = Math.hypot(endX - startX, endY - startY);
            const duration = Math.max(0.15, distance / speed);  // ★ 최소 0.15초
            
            // 트레일 효과
            const createTrail = () => {
                const trail = new PIXI.Graphics();
                trail.x = arrow.x;
                trail.y = arrow.y;
                trail.rotation = arrow.rotation;
                trail.zIndex = 99;
                trail.rect(-arrowLength/3, -1, arrowLength/2, 2);
                trail.fill({ color: 0xcccccc, alpha: 0.5 });
                this.container.addChild(trail);
                
                gsap.to(trail, {
                    alpha: 0,
                    duration: 0.15,
                    onComplete: () => trail.destroy()
                });
            };
            
            const trailInterval = setInterval(createTrail, 15);  // ★ 빠른 트레일
            
            // 베지어 애니메이션
            const bezier = { t: 0 };
            
            gsap.to(bezier, {
                t: 1,
                duration: duration,
                ease: 'none',
                onUpdate: () => {
                    const t = bezier.t;
                    const invT = 1 - t;
                    
                    // 2차 베지어 곡선
                    const x = invT * invT * startX + 2 * invT * t * midX + t * t * endX;
                    const y = invT * invT * startY + 2 * invT * t * midY + t * t * endY;
                    
                    // 이전 위치에서 현재 위치로의 방향으로 화살 회전
                    const dx = x - arrow.x;
                    const dy = y - arrow.y;
                    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                        arrow.rotation = Math.atan2(dy, dx);
                    }
                    
                    arrow.x = x;
                    arrow.y = y;
                },
                onComplete: () => {
                    clearInterval(trailInterval);
                    
                    // 착탄 이펙트
                    this.arrowImpactEffect(endX, endY);
                    
                    arrow.destroy();
                    resolve();
                }
            });
        });
    },
    
    // 화살 착탄 이펙트
    arrowImpactEffect(x, y) {
        if (!this.app) return;
        
        // 먼지/파편 파티클
        for (let i = 0; i < 6; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, 2 + Math.random() * 2);
            particle.fill({ color: 0x8B7355, alpha: 0.7 }); // 흙색
            particle.x = x;
            particle.y = y;
            particle.zIndex = 98;
            this.container.addChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 15;
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 10,
                alpha: 0,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: () => particle.destroy()
            });
        }
        
        // 작은 임팩트 원
        const impact = new PIXI.Graphics();
        impact.circle(0, 0, 8);
        impact.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
        impact.x = x;
        impact.y = y;
        impact.zIndex = 97;
        this.container.addChild(impact);
        
        gsap.to(impact, {
            scale: 1.5,
            alpha: 0,
            duration: 0.2,
            onComplete: () => impact.destroy()
        });
    },
    
    // ==========================================
    // 파이어볼 이펙트 (베지어 곡선 + 화염 VFX) - 진중한 버전
    // ==========================================
    async fireballEffect(startX, startY, endX, endY) {
        if (!this.app) return;
        
        // 시전 이펙트 - 짧고 강렬하게
        this.screenFlash('#ff4400', 50, 0.2);
        
        return new Promise(resolve => {
            // 파이어볼 컨테이너
            const fireball = new PIXI.Container();
            fireball.x = startX;
            fireball.y = startY;
            fireball.zIndex = 200;
            this.container.addChild(fireball);
            
            // === 외부 열기 (희미한 왜곡) ===
            const heatWave = new PIXI.Graphics();
            heatWave.circle(0, 0, 50);
            heatWave.fill({ color: 0xff2200, alpha: 0.15 });
            fireball.addChild(heatWave);
            
            // === 외부 화염 ===
            const outerFlame = new PIXI.Graphics();
            outerFlame.circle(0, 0, 35);
            outerFlame.fill({ color: 0xff3300, alpha: 0.5 });
            fireball.addChild(outerFlame);
            
            // === 중간 화염 ===
            const midFlame = new PIXI.Graphics();
            midFlame.circle(0, 0, 25);
            midFlame.fill({ color: 0xff5500, alpha: 0.7 });
            fireball.addChild(midFlame);
            
            // === 내부 코어 ===
            const core = new PIXI.Graphics();
            core.circle(0, 0, 16);
            core.fill({ color: 0xffaa00, alpha: 0.95 });
            fireball.addChild(core);
            
            // === 밝은 중심 ===
            const hotCore = new PIXI.Graphics();
            hotCore.circle(0, 0, 8);
            hotCore.fill({ color: 0xffffcc, alpha: 1 });
            fireball.addChild(hotCore);
            
            // === 코어 펄스 (빠르고 미세하게) - 안전 체크 포함 ===
            const corePulse = gsap.to({ val: 0 }, {
                val: Math.PI * 2,
                duration: 0.08,
                repeat: -1,
                ease: 'none',
                onUpdate: function() {
                    if (!core || core.destroyed) {
                        this.kill();
                        return;
                    }
                    const s = 1 + Math.sin(this.targets()[0].val) * 0.15;
                    core.scale.set(s);
                }
            });
            
            const flamePulse = gsap.to({ val: 0 }, {
                val: Math.PI * 2,
                duration: 0.1,
                repeat: -1,
                ease: 'none',
                onUpdate: function() {
                    if (!midFlame || midFlame.destroyed) {
                        this.kill();
                        return;
                    }
                    const s = 1 + Math.sin(this.targets()[0].val) * 0.1;
                    midFlame.scale.set(s);
                }
            });
            
            // === 베지어 곡선 계산 (낮은 아치 - 더 직선적) ===
            const distance = Math.hypot(endX - startX, endY - startY);
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - distance * 0.15; // 낮은 아치
            
            const getBezierPoint = (t) => {
                const mt = 1 - t;
                return {
                    x: mt * mt * startX + 2 * mt * t * midX + t * t * endX,
                    y: mt * mt * startY + 2 * mt * t * midY + t * t * endY
                };
            };
            
            // === 화염 꼬리 (집중된 트레일) ===
            const createFireTrail = () => {
                // 메인 트레일
                const trail = new PIXI.Graphics();
                trail.x = fireball.x;
                trail.y = fireball.y;
                trail.zIndex = 195;
                
                const size = 15 + Math.random() * 10;
                trail.circle(0, 0, size);
                trail.fill({ color: 0xff4400, alpha: 0.8 });
                
                this.container.addChild(trail);
                
                gsap.to(trail, {
                    alpha: 0,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => trail.destroy()
                });
                
                gsap.to(trail.scale, {
                    x: 0.3, y: 0.3,
                    duration: 0.2
                });
            };
            
            // === 불씨 (작고 빠르게) ===
            const createEmber = () => {
                const ember = new PIXI.Graphics();
                ember.x = fireball.x + (Math.random() - 0.5) * 25;
                ember.y = fireball.y + (Math.random() - 0.5) * 25;
                ember.zIndex = 198;
                
                const size = 2 + Math.random() * 4;
                const colors = [0xff4400, 0xff6600, 0xffaa00];
                ember.circle(0, 0, size);
                ember.fill({ color: colors[Math.floor(Math.random() * colors.length)], alpha: 1 });
                
                this.container.addChild(ember);
                
                // 뒤로 날아감
                const backAngle = Math.atan2(startY - endY, startX - endX) + (Math.random() - 0.5) * 0.8;
                const speed = 30 + Math.random() * 40;
                
                gsap.to(ember, {
                    x: ember.x + Math.cos(backAngle) * speed,
                    y: ember.y + Math.sin(backAngle) * speed,
                    alpha: 0,
                    duration: 0.25 + Math.random() * 0.15,
                    ease: 'power1.out',
                    onComplete: () => ember.destroy()
                });
            };
            
            // === 연기 (적게, 어둡게) ===
            const createSmoke = () => {
                const smoke = new PIXI.Graphics();
                smoke.x = fireball.x + (Math.random() - 0.5) * 15;
                smoke.y = fireball.y;
                smoke.zIndex = 190;
                
                const size = 10 + Math.random() * 10;
                smoke.circle(0, 0, size);
                smoke.fill({ color: 0x222222, alpha: 0.4 });
                
                this.container.addChild(smoke);
                
                gsap.to(smoke, {
                    y: smoke.y - 30,
                    alpha: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => smoke.destroy()
                });
                
                gsap.to(smoke.scale, {
                    x: 2, y: 2,
                    duration: 0.4
                });
            };
            
            // 파티클 인터벌 (빠르게)
            const trailInterval = setInterval(createFireTrail, 12);
            const emberInterval = setInterval(createEmber, 18);
            const smokeInterval = setInterval(createSmoke, 50);
            
            // === 빠른 비행 ===
            const flightDuration = Math.max(0.25, distance / 800); // 2배 빠르게
            const progress = { t: 0 };
            
            gsap.to(progress, {
                t: 1,
                duration: flightDuration,
                ease: 'power2.in',  // 강한 가속
                onUpdate: () => {
                    const pos = getBezierPoint(progress.t);
                    fireball.x = pos.x;
                    fireball.y = pos.y;
                    
                    // 미세한 흔들림
                    fireball.rotation = Math.sin(progress.t * 20) * 0.1;
                    
                    // 약간 커짐
                    const scale = 1 + progress.t * 0.15;
                    fireball.scale.set(scale);
                },
                onComplete: () => {
                    clearInterval(trailInterval);
                    clearInterval(emberInterval);
                    clearInterval(smokeInterval);
                    
                    // === 착탄 폭발 ===
                    this.fireballExplosion(endX, endY);
                    
                    fireball.destroy();
                    resolve();
                }
            });
        });
    },
    
    // ==========================================
    // 파이어볼 폭발 이펙트 - 진중한 버전
    // ==========================================
    fireballExplosion(x, y) {
        if (!this.app) return;
        
        // 강력하지만 짧은 화면 효과
        this.screenShake(15, 200);
        this.screenFlash('#ff3300', 100, 0.5);
        this.hitStop(40);
        
        // === 초기 플래시 ===
        const flash = new PIXI.Graphics();
        flash.x = x;
        flash.y = y;
        flash.zIndex = 250;
        flash.circle(0, 0, 80);
        flash.fill({ color: 0xffffaa, alpha: 0.9 });
        this.container.addChild(flash);
        
        gsap.to(flash, {
            alpha: 0,
            duration: 0.08,
            onComplete: () => flash.destroy()
        });
        
        gsap.to(flash.scale, {
            x: 1.5, y: 1.5,
            duration: 0.08
        });
        
        // === 폭발 코어 ===
        const core = new PIXI.Graphics();
        core.x = x;
        core.y = y;
        core.zIndex = 240;
        core.circle(0, 0, 40);
        core.fill({ color: 0xff5500, alpha: 0.9 });
        this.container.addChild(core);
        
        gsap.to(core.scale, {
            x: 2, y: 2,
            duration: 0.2,
            ease: 'power2.out'
        });
        gsap.to(core, {
            alpha: 0,
            duration: 0.25,
            onComplete: () => core.destroy()
        });
        
        // === 폭발 링 ===
        const ring = new PIXI.Graphics();
        ring.x = x;
        ring.y = y;
        ring.zIndex = 235;
        ring.circle(0, 0, 25);
        ring.stroke({ color: 0xff4400, width: 6, alpha: 0.8 });
        this.container.addChild(ring);
        
        gsap.to(ring.scale, {
            x: 6, y: 6,
            duration: 0.3,
            ease: 'power2.out'
        });
        gsap.to(ring, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => ring.destroy()
        });
        
        // === 화염 파편 (집중적) ===
        for (let i = 0; i < 24; i++) {
            const spark = new PIXI.Graphics();
            spark.x = x;
            spark.y = y;
            spark.zIndex = 220;
            
            const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
            const distance = 60 + Math.random() * 80;
            const size = 4 + Math.random() * 8;
            
            const colors = [0xff3300, 0xff5500, 0xff7700, 0xffaa00];
            spark.circle(0, 0, size);
            spark.fill({ color: colors[Math.floor(Math.random() * colors.length)], alpha: 1 });
            
            this.container.addChild(spark);
            
            gsap.to(spark, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 20,
                alpha: 0,
                duration: 0.35 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => spark.destroy()
            });
            
            gsap.to(spark.scale, {
                x: 0.2, y: 0.2,
                duration: 0.35
            });
        }
        
        // === 연기 (적게, 빠르게) ===
        for (let i = 0; i < 6; i++) {
            const smoke = new PIXI.Graphics();
            smoke.x = x + (Math.random() - 0.5) * 50;
            smoke.y = y + (Math.random() - 0.5) * 30;
            smoke.zIndex = 200;
            
            const size = 20 + Math.random() * 25;
            smoke.circle(0, 0, size);
            smoke.fill({ color: 0x1a1a1a, alpha: 0.5 });
            
            this.container.addChild(smoke);
            
            gsap.to(smoke, {
                y: smoke.y - 50 - Math.random() * 30,
                alpha: 0,
                duration: 0.6 + Math.random() * 0.3,
                delay: i * 0.02,
                ease: 'power2.out',
                onComplete: () => smoke.destroy()
            });
            
            gsap.to(smoke.scale, {
                x: 2.5, y: 2.5,
                duration: 0.6
            });
        }
        
        // === 잔불 ===
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                if (!this.app) return;
                const ember = new PIXI.Graphics();
                ember.x = x + (Math.random() - 0.5) * 60;
                ember.y = y + (Math.random() - 0.5) * 40;
                ember.zIndex = 210;
                
                ember.circle(0, 0, 2 + Math.random() * 3);
                ember.fill({ color: 0xff6600, alpha: 0.9 });
                
                this.container.addChild(ember);
                
                gsap.to(ember, {
                    y: ember.y - 40 - Math.random() * 30,
                    alpha: 0,
                    duration: 0.5 + Math.random() * 0.3,
                    ease: 'power1.out',
                    onComplete: () => ember.destroy()
                });
            }, i * 20);
        }
    },
    
    // ==========================================
    // 착탄/충격 이펙트
    // ==========================================
    impactEffect(x, y, color = 0xff4444, scale = 1) {
        if (!this.app) return;
        
        this.screenShake(5 * scale, 100);
        
        // 충격파
        const impact = new PIXI.Graphics();
        impact.x = x;
        impact.y = y;
        impact.zIndex = 101;
        
        impact.circle(0, 0, 20 * scale);
        impact.fill({ color: color, alpha: 0.8 });
        
        this.container.addChild(impact);
        
        gsap.timeline()
            .to(impact.scale, { x: 2, y: 2, duration: 0.15, ease: 'power2.out' })
            .to(impact, { alpha: 0, duration: 0.15 }, 0)
            .add(() => impact.destroy());
        
        // 파티클
        this.burstParticles(x, y, color, 8);
    },
    
    // ==========================================
    // 파티클 버스트
    // ==========================================
    burstParticles(x, y, color = 0xffffff, count = 10, speed = 100) {
        if (!this.app) return;
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.x = x;
            particle.y = y;
            particle.zIndex = 102;
            
            const size = 2 + Math.random() * 4;
            particle.circle(0, 0, size);
            particle.fill({ color: color, alpha: 0.9 });
            
            this.container.addChild(particle);
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const dist = speed * (0.5 + Math.random() * 0.5);
            const duration = 0.3 + Math.random() * 0.2;
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: duration,
                ease: 'power2.out',
                onComplete: () => particle.destroy()
            });
        }
    },
    
    // ==========================================
    // 피격 이펙트 (유닛에 적용)
    // ==========================================
    hitEffect(sprite, color = 0xff0000) {
        if (!sprite) return;
        
        // 기존 애니메이션 중단 (알파 꼬임 방지)
        gsap.killTweensOf(sprite, 'alpha,tint');
        
        // 원래 값 저장
        const originalTint = sprite.tint || 0xffffff;
        const originalAlpha = 1;
        
        // 즉시 흰색 플래시
        sprite.tint = 0xffffff;
        sprite.alpha = 1;
        
        // 빨간색으로 깜빡이고 복원
        gsap.timeline()
            .to(sprite, { duration: 0.03 }) // 흰색 유지
            .set(sprite, { tint: color })
            .to(sprite, { duration: 0.08 })
            .set(sprite, { tint: originalTint, alpha: originalAlpha });
        
        // 넉백 느낌
        const originalX = sprite.x;
        gsap.timeline()
            .to(sprite, { x: originalX - 10, duration: 0.05 })
            .to(sprite, { x: originalX + 5, duration: 0.05 })
            .to(sprite, { x: originalX, duration: 0.1 });
    },
    
    // ==========================================
    // 데미지 숫자 표시 (크고 명확하게)
    // ==========================================
    showDamageNumber(x, y, damage, type = 'normal') {
        if (!this.app) return;
        
        const styles = {
            normal: { 
                fill: '#ff4444',
                stroke: '#000000',
                fontSize: 52,
                prefix: ''
            },
            critical: { 
                fill: '#ffff00',
                stroke: '#cc4400',
                fontSize: 68,
                prefix: ''
            },
            heal: { 
                fill: '#44ff44',
                stroke: '#004400',
                fontSize: 52,
                prefix: '+'
            },
            block: { 
                fill: '#44aaff',
                stroke: '#001144',
                fontSize: 48,
                prefix: ''
            },
            burn: { 
                fill: '#ff6600',
                stroke: '#440000',
                fontSize: 48,
                prefix: '🔥'
            },
            dot: { 
                fill: '#88ff44',
                stroke: '#003300',
                fontSize: 46,
                prefix: '☠'
            },
            poison: { 
                fill: '#44ff00',
                stroke: '#003300',
                fontSize: 48,
                prefix: '🧪'
            },
            bash: { 
                fill: '#ff8800',
                stroke: '#441100',
                fontSize: 72,
                prefix: '💥'
            },
            flurry: { 
                fill: '#88ccff',
                stroke: '#002244',
                fontSize: 38,
                prefix: ''
            }
        };
        
        const style = styles[type] || styles.normal;
        const isCritical = type === 'critical';
        const isHeal = type === 'heal';
        const isBash = type === 'bash';
        
        // 메인 텍스트
        const text = new PIXI.Text({
            text: `${style.prefix}${damage}`,
            style: {
                fontSize: style.fontSize,
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontWeight: 'bold',
                fill: style.fill,
                stroke: { color: style.stroke, width: isBash ? 10 : 8 },
                dropShadow: {
                    color: 0x000000,
                    blur: isBash ? 10 : 6,
                    distance: isBash ? 5 : 3,
                    angle: Math.PI / 4
                },
                letterSpacing: 3
            }
        });
        
        // 랜덤 오프셋 (여러 데미지가 겹치지 않게)
        const offsetX = (Math.random() - 0.5) * 30;
        text.x = x + offsetX;
        text.y = y;
        text.anchor.set(0.5);
        text.zIndex = 200 + Math.random() * 10;
        
        this.container.addChild(text);
        
        // 애니메이션
        if (isBash) {
            // 배쉬: 위에서 쿵! 내려찍듯이
            text.y = y - 100;
            text.scale.set(2);
            text.alpha = 0;
            
            gsap.timeline()
                .to(text, { alpha: 1, duration: 0.05 })
                .to(text, { y: y, duration: 0.12, ease: 'power3.in' })  // 쿵 내려옴
                .to(text.scale, { x: 1.8, y: 0.6, duration: 0.08 }, '-=0.02')  // 찌그러짐
                .to(text.scale, { x: 1.3, y: 1.3, duration: 0.15, ease: 'elastic.out(1, 0.5)' })  // 탄성 복구
                .to(text, { 
                    y: y - 40, 
                    alpha: 0, 
                    duration: 1.5,
                    delay: 0.5,  // 오래 머무름
                    ease: 'power2.out',
                    onComplete: () => text.destroy()
                });
                
        } else if (isCritical) {
            // 크리티컬: 크게 펑! 터지며 나타남
            text.scale.set(0.2);
            text.alpha = 0;
            
            gsap.timeline()
                .to(text, { alpha: 1, duration: 0.05 })
                .to(text.scale, { x: 1.5, y: 1.5, duration: 0.15, ease: 'back.out(2)' })
                .to(text.scale, { x: 1.2, y: 1.2, duration: 0.1 })
                .to(text, { 
                    y: y - 100, 
                    alpha: 0, 
                    duration: 1.2,
                    delay: 0.3,
                    ease: 'power2.out',
                    onComplete: () => text.destroy()
                }, '<');
                
        } else if (isHeal) {
            // 힐: 아래서 위로 부드럽게
            text.y = y + 20;
            text.alpha = 0;
            
            gsap.timeline()
                .to(text, { alpha: 1, y: y - 30, duration: 0.3, ease: 'power2.out' })
                .to(text, { 
                    y: y - 80, 
                    alpha: 0, 
                    duration: 0.8,
                    ease: 'power1.out',
                    onComplete: () => text.destroy()
                });
                
        } else {
            // 일반: 튀어나오며 위로
            text.scale.set(0.5);
            text.alpha = 0;
            
            gsap.timeline()
                .to(text, { alpha: 1, duration: 0.05 })
                .to(text.scale, { x: 1.2, y: 1.2, duration: 0.1, ease: 'back.out(3)' })
                .to(text.scale, { x: 1, y: 1, duration: 0.1 })
                .to(text, { 
                    y: y - 70, 
                    alpha: 0, 
                    duration: 1,
                    delay: 0.2,
                    ease: 'power2.out',
                    onComplete: () => text.destroy()
                }, '<');
        }
    },
    
    // ==========================================
    // 블록 이펙트 (방어)
    // ==========================================
    blockEffect(x, y) {
        if (!this.app) return;
        
        this.screenShake(3, 100);
        
        // 방패 모양
        const shield = new PIXI.Graphics();
        shield.x = x;
        shield.y = y;
        shield.zIndex = 100;
        shield.alpha = 0;
        
        // 방패 외곽
        shield.roundRect(-25, -30, 50, 60, 5);
        shield.stroke({ color: 0x4488ff, width: 4, alpha: 0.9 });
        shield.fill({ color: 0x4488ff, alpha: 0.3 });
        
        this.container.addChild(shield);
        
        gsap.timeline()
            .to(shield, { alpha: 1, duration: 0.1 })
            .to(shield.scale, { x: 1.3, y: 1.3, duration: 0.15 })
            .to(shield.scale, { x: 1, y: 1, duration: 0.1 })
            .to(shield, { alpha: 0, duration: 0.2, delay: 0.1, onComplete: () => shield.destroy() });
        
        // 파편
        this.burstParticles(x, y, 0x4488ff, 6, 60);
    },
    
    // ==========================================
    // 헬퍼: 유닛 위치/스케일 타겟 가져오기
    // ==========================================
    getPositionTarget(unit) {
        return unit?.container || unit?.sprite || null;
    },
    
    getScaleTarget(unit) {
        return unit?.sprite || null;
    },
    
    // ==========================================
    // 적 공격 인텐트 실행 연출
    // ==========================================
    async enemyAttackEffect(enemy, target, damage) {
        const enemyPos = this.getPositionTarget(enemy);
        const targetPos = this.getPositionTarget(target);
        const enemyScale = this.getScaleTarget(enemy);
        if (!enemyPos || !targetPos) return;
        
        const baseScale = enemy.baseScale || enemyScale?.baseScale || 1;
        const startX = enemyPos.x;
        const startY = enemyPos.y - (enemy.sprite?.height || 60) / 2;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // 적 준비 동작
        await new Promise(resolve => {
            gsap.timeline()
                .to(enemyPos, { x: startX - 20, duration: 0.15, ease: 'power2.in' })
                .call(() => {
                    if (enemyScale) gsap.to(enemyScale.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.15 });
                }, null, 0)
                .add(resolve);
        });
        
        // 히트 스톱
        await this.hitStop(30);
        
        // 돌진 + 슬래시
        await new Promise(resolve => {
            const attackX = endX - 50;
            
            gsap.timeline()
                .to(enemyPos, { x: attackX, duration: 0.1, ease: 'power2.in' })
                .call(() => {
                    if (enemyScale) gsap.to(enemyScale.scale, { x: baseScale, y: baseScale, duration: 0.1 });
                }, null, 0)
                .add(() => {
                    this.slashEffect(endX, endY, -45 + Math.random() * 30, 0xff4444, 1.2);
                    this.hitEffect(target.sprite);
                    this.showDamageNumber(endX, endY - 20, damage);
                    this.screenShake(8, 150);
                    this.screenFlash('#ff0000', 80, 0.2);
                })
                .to(enemyPos, { x: startX, duration: 0.2, ease: 'power2.out', delay: 0.1 })
                .add(resolve);
        });
    },
    
    // ==========================================
    // 적 원거리 공격 연출
    // ==========================================
    async enemyRangedAttackEffect(enemy, target, damage) {
        const enemyPos = this.getPositionTarget(enemy);
        const targetPos = this.getPositionTarget(target);
        const enemyScale = this.getScaleTarget(enemy);
        if (!enemyPos || !targetPos) return;
        
        const baseScale = enemy.baseScale || enemyScale?.baseScale || 1;
        const startX = enemyPos.x;
        const startY = enemyPos.y - (enemy.sprite?.height || 60) / 2;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // 차징 모션
        await new Promise(resolve => {
            if (enemyScale) {
                gsap.timeline()
                    .to(enemyScale.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.2 })
                    .to(enemyScale.scale, { x: baseScale, y: baseScale, duration: 0.1 })
                    .add(resolve);
            } else {
                resolve();
            }
        });
        
        // 투사체 발사
        await this.projectileEffect(startX, startY, endX, endY, 0xff6600, 10);
        
        // 피격
        this.hitEffect(target.sprite);
        this.showDamageNumber(endX, endY - 20, damage);
    },
    
    // ==========================================
    // 플레이어 근접 공격 연출 (카드)
    // ==========================================
    async playerMeleeAttack(hero, target, damage, cardType = 'strike') {
        const heroPos = this.getPositionTarget(hero);
        const targetPos = this.getPositionTarget(target);
        if (!heroPos || !targetPos) return;
        
        const startX = heroPos.x;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // 영웅 돌진
        await new Promise(resolve => {
            gsap.timeline()
                .to(heroPos, { x: endX - 60, duration: 0.15, ease: 'power2.in' })
                .add(resolve);
        });
        
        // 히트 스톱
        await this.hitStop(40);
        
        // 공격 종류별 이펙트
        switch (cardType) {
            case 'bash':
                this.heavySlash(endX, endY, -30, 0xff8800);
                this.screenShake(10, 150);
                break;
            case 'cleave':
                this.cleaveEffect(endX, endY, 180);
                break;
            case 'strike':
            default:
                this.slashEffect(endX, endY, -45, 0xffffff, 1.3);
                this.screenShake(6, 120);
                break;
        }
        
        // 피격
        this.hitEffect(target.sprite);
        this.showDamageNumber(endX, endY - 20, damage);
        
        // 복귀 (await 없이 - 넉백과 동시에 실행되도록)
        gsap.to(heroPos, {
            x: startX,
            duration: 0.25,
            ease: 'power2.out'
        });
        
        // 히트 직후 바로 리턴 (넉백이 즉시 시작되도록)
    },
    
    // ==========================================
    // 플레이어 원거리 공격 연출 (카드)
    // ==========================================
    async playerRangedAttack(hero, target, damage) {
        const heroPos = this.getPositionTarget(hero);
        const targetPos = this.getPositionTarget(target);
        const heroScale = this.getScaleTarget(hero);
        if (!heroPos || !targetPos) return;
        
        const baseScale = hero.baseScale || heroScale?.baseScale || 1;
        const startX = heroPos.x;
        const startY = heroPos.y - (hero.sprite?.height || 60) / 2;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // 캐스팅 모션
        await new Promise(resolve => {
            if (heroScale) {
                gsap.timeline()
                    .to(heroScale.scale, { x: baseScale * 1.1, y: baseScale * 0.95, duration: 0.15 })
                    .to(heroScale.scale, { x: baseScale, y: baseScale, duration: 0.1 })
                    .add(resolve);
            } else {
                resolve();
            }
        });
        
        // 마법 투사체
        await this.projectileEffect(startX, startY, endX, endY, 0x66aaff, 14);
        
        // 피격
        this.hitEffect(target.sprite);
        this.showDamageNumber(endX, endY - 20, damage);
    },
    
    // ==========================================
    // AOE 공격 연출
    // ==========================================
    async aoeAttackEffect(hero, targets, damage) {
        const heroPos = this.getPositionTarget(hero);
        if (!heroPos || targets.length === 0) return;
        
        const startX = heroPos.x;
        const startY = heroPos.y;
        
        // 점프
        await new Promise(resolve => {
            gsap.timeline()
                .to(heroPos, { y: startY - 50, duration: 0.15, ease: 'power2.out' })
                .to(heroPos, { y: startY, duration: 0.15, ease: 'power2.in' })
                .add(resolve);
        });
        
        // 히트 스톱
        await this.hitStop(60);
        
        // 모든 타겟에 이펙트
        const centerX = targets.reduce((sum, t) => {
            const pos = this.getPositionTarget(t);
            return sum + (pos?.x || 0);
        }, 0) / targets.length;
        const centerY = targets.reduce((sum, t) => {
            const pos = this.getPositionTarget(t);
            return sum + (pos?.y || 0);
        }, 0) / targets.length - 30;
        
        this.cleaveEffect(centerX, centerY, 250);
        
        targets.forEach((target, i) => {
            const targetPos = this.getPositionTarget(target);
            if (!targetPos) return;
            
            setTimeout(() => {
                this.hitEffect(target.sprite);
                this.showDamageNumber(
                    targetPos.x,
                    targetPos.y - (target.sprite?.height || 60) / 2 - 20,
                    damage
                );
            }, i * 50);
        });
    },
    
    // ==========================================
    // 소환 이펙트
    // ==========================================
    summonEffect(x, y) {
        if (!this.app) return;
        
        // 마법진
        const circle = new PIXI.Graphics();
        circle.x = x;
        circle.y = y;
        circle.zIndex = 50;
        circle.alpha = 0;
        
        circle.circle(0, 0, 40);
        circle.stroke({ color: 0xffcc00, width: 3, alpha: 0.8 });
        circle.circle(0, 0, 30);
        circle.stroke({ color: 0xffcc00, width: 2, alpha: 0.5 });
        
        // 십자
        circle.moveTo(-35, 0);
        circle.lineTo(35, 0);
        circle.moveTo(0, -35);
        circle.lineTo(0, 35);
        circle.stroke({ color: 0xffcc00, width: 2, alpha: 0.6 });
        
        this.container.addChild(circle);
        
        gsap.timeline()
            .to(circle, { alpha: 1, duration: 0.2 })
            .to(circle, { rotation: Math.PI * 2, duration: 0.8, ease: 'none' }, 0)
            .to(circle.scale, { x: 0, y: 0, duration: 0.3, delay: 0.5 })
            .to(circle, { alpha: 0, duration: 0.3, delay: 0.5, onComplete: () => circle.destroy() }, '<');
        
        // 파티클
        setTimeout(() => {
            this.burstParticles(x, y, 0xffcc00, 15, 80);
        }, 500);
        
        this.screenFlash('#ffcc00', 200, 0.3);
    },
    
    // ==========================================
    // 힐 이펙트
    // ==========================================
    healEffect(x, y, amount) {
        if (!this.app) return;
        
        // 상승하는 빛
        for (let i = 0; i < 8; i++) {
            const light = new PIXI.Graphics();
            light.x = x + (Math.random() - 0.5) * 40;
            light.y = y + 20;
            light.zIndex = 100;
            
            light.rect(-2, -15, 4, 30);
            light.fill({ color: 0x44ff44, alpha: 0.7 });
            
            this.container.addChild(light);
            
            gsap.to(light, {
                y: y - 60,
                alpha: 0,
                duration: 0.8 + Math.random() * 0.4,
                delay: i * 0.05,
                ease: 'power2.out',
                onComplete: () => light.destroy()
            });
        }
        
        this.showDamageNumber(x, y - 30, amount, 'heal');
        this.screenFlash('#44ff44', 150, 0.15);
    },
    
    // ==========================================
    // 방어 획득 이펙트
    // ==========================================
    gainBlockEffect(x, y, amount) {
        if (!this.app) return;
        
        this.blockEffect(x, y);
        this.showDamageNumber(x, y - 30, amount, 'block');
    },
    
    // ==========================================
    // ★ 유닛 플로터 시스템 (상태효과 표시)
    // ==========================================
    
    /**
     * 유닛 위에 플로터 표시
     * @param {Object} unit - 유닛 객체
     * @param {string} text - 표시할 텍스트
     * @param {Object} options - 옵션 { color, icon, size, duration }
     */
    showUnitFloater(unit, text, options = {}) {
        if (!this.app) return;
        
        const {
            color = '#ffffff',
            icon = '',
            size = 16,
            duration = 1.2,
            offsetY = -60
        } = options;
        
        // 유닛 위치 가져오기
        const pos = this.getUnitPosition(unit);
        if (!pos) return;
        
        // 플로터 컨테이너
        const floater = new PIXI.Container();
        floater.x = pos.x;
        floater.y = pos.y + offsetY;
        floater.zIndex = 1000;
        
        // 텍스트 생성
        const displayText = icon ? `${icon} ${text}` : text;
        const textObj = new PIXI.Text({
            text: displayText,
            style: {
                fontSize: size,
                fill: color,
                fontWeight: 'bold',
                fontFamily: 'Noto Sans KR, sans-serif',
                stroke: { color: '#000000', width: 4 },
                dropShadow: {
                    color: '#000000',
                    blur: 4,
                    angle: Math.PI / 4,
                    distance: 2
                }
            }
        });
        textObj.anchor.set(0.5);
        floater.addChild(textObj);
        
        this.app.stage.addChild(floater);
        
        // 애니메이션: 위로 떠오르며 사라짐
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(floater, 
                { alpha: 0, y: pos.y + offsetY + 20 },
                { 
                    alpha: 1, 
                    y: pos.y + offsetY,
                    duration: 0.2,
                    ease: 'power2.out'
                }
            );
            gsap.to(floater, {
                y: pos.y + offsetY - 30,
                alpha: 0,
                duration: duration,
                delay: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    if (floater && !floater.destroyed) floater.destroy();
                }
            });
        } else {
            setTimeout(() => {
                if (floater && !floater.destroyed) floater.destroy();
            }, duration * 1000);
        }
    },
    
    /**
     * 블록 획득 플로터 (유닛 기반)
     * @param {Object} unit - 유닛 객체
     * @param {number} amount - 획득량
     */
    showBlockGain(unit, amount) {
        this.showUnitFloater(unit, `+${amount}`, {
            color: '#66ccff',
            icon: '🛡',
            size: 18
        });
        
        // 이펙트도 추가
        const pos = this.getUnitPosition(unit);
        if (pos) this.blockEffect(pos.x, pos.y);
    },
    
    /**
     * 힐 플로터 (유닛 기반)
     * @param {Object} unit - 유닛 객체
     * @param {number} amount - 회복량
     */
    showHeal(unit, amount) {
        this.showUnitFloater(unit, `+${amount}`, {
            color: '#44ff44',
            icon: '❤',
            size: 18
        });
    },
    
    /**
     * 버프 플로터 (유닛 기반)
     * @param {Object} unit - 유닛 객체
     * @param {string} buffName - 버프 이름
     * @param {number} amount - 수치 (옵션)
     */
    showBuff(unit, buffName, amount = null) {
        const text = amount !== null ? `${buffName} +${amount}` : buffName;
        this.showUnitFloater(unit, text, {
            color: '#ffaa00',
            icon: '⬆',
            size: 14
        });
    },
    
    /**
     * 디버프 플로터 (유닛 기반)
     * @param {Object} unit - 유닛 객체
     * @param {string} debuffName - 디버프 이름
     * @param {number} amount - 수치 (옵션)
     */
    showDebuff(unit, debuffName, amount = null) {
        const text = amount !== null ? `${debuffName} +${amount}` : debuffName;
        this.showUnitFloater(unit, text, {
            color: '#aa66ff',
            icon: '⬇',
            size: 14
        });
    },
    
    /**
     * 상태효과 플로터 (범용)
     * @param {Object} unit - 유닛 객체
     * @param {string} effectType - 효과 타입 ('block', 'heal', 'buff', 'debuff', 'damage', 'poison', 'bleed')
     * @param {string|number} value - 값 또는 텍스트
     */
    showStatusEffect(unit, effectType, value) {
        const effectConfig = {
            block: { color: '#66ccff', icon: '🛡', prefix: '+' },
            heal: { color: '#44ff44', icon: '❤', prefix: '+' },
            buff: { color: '#ffaa00', icon: '⬆', prefix: '' },
            debuff: { color: '#aa66ff', icon: '⬇', prefix: '' },
            damage: { color: '#ff4444', icon: '', prefix: '-' },
            poison: { color: '#88ff44', icon: '☠', prefix: '' },
            bleed: { color: '#ff6666', icon: '🩸', prefix: '' },
            strength: { color: '#ff6600', icon: '💪', prefix: '+' },
            weak: { color: '#8888ff', icon: '💫', prefix: '' },
            vulnerable: { color: '#ff88ff', icon: '💔', prefix: '' }
        };
        
        const config = effectConfig[effectType] || { color: '#ffffff', icon: '', prefix: '' };
        const text = typeof value === 'number' ? `${config.prefix}${value}` : value;
        
        this.showUnitFloater(unit, text, {
            color: config.color,
            icon: config.icon,
            size: effectType === 'damage' ? 20 : 16
        });
    },
    
    // ==========================================
    // 스피어 투척 이펙트
    // ==========================================
    async spearThrowEffect(attacker, target, damage, gameRef) {
        if (!this.app || !attacker.sprite || !target.sprite) {
            if (gameRef) gameRef.dealDamage(target, damage);
            return;
        }
        
        // 시작/도착 위치 계산
        const attackerPos = attacker.sprite.getGlobalPosition();
        const targetPos = target.sprite.getGlobalPosition();
        
        // 투척 모션 - 살짝 뒤로 빠졌다가 던지기
        const posTarget = attacker.container || attacker.sprite;
        const originalX = posTarget.x;
        
        return new Promise(resolve => {
            gsap.timeline()
                // 1. 뒤로 빠지는 준비 동작
                .to(posTarget, {
                    x: originalX - 15,
                    duration: 0.1,
                    ease: 'power1.in'
                })
                // 2. 앞으로 던지는 동작
                .to(posTarget, {
                    x: originalX + 10,
                    duration: 0.08,
                    ease: 'power3.out',
                    onComplete: () => {
                        // 창 발사!
                        this.createSpearProjectile(attackerPos, targetPos, () => {
                            // 창 도착 - 대미지 및 VFX
                            if (gameRef) gameRef.dealDamage(target, damage);
                            this.screenShake(8, 150);
                            this.spearImpactEffect(targetPos.x, targetPos.y);
                        });
                    }
                })
                // 3. 원위치
                .to(posTarget, {
                    x: originalX,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: resolve
                });
        });
    },
    
    // 스피어 발사체 생성
    createSpearProjectile(start, end, onHit) {
        if (!this.app) return;
        
        const spearContainer = new PIXI.Container();
        spearContainer.x = start.x;
        spearContainer.y = start.y - 30; // 히어로 손 높이
        spearContainer.zIndex = 600;
        this.container.addChild(spearContainer);
        
        // 창 모양 (그래픽으로 그리기)
        const spear = new PIXI.Graphics();
        
        // 창날 (삼각형)
        spear.poly([
            { x: 40, y: 0 },   // 창끝
            { x: 25, y: -5 },  // 날 위
            { x: 25, y: 5 }    // 날 아래
        ]);
        spear.fill({ color: 0xcccccc }); // 은색 창날
        
        // 창날 테두리
        spear.stroke({ width: 1, color: 0xffffff });
        
        // 창대 (막대)
        spear.roundRect(-35, -3, 60, 6, 2);
        spear.fill({ color: 0x8b4513 }); // 갈색 나무
        spear.stroke({ width: 1, color: 0x5c3317 });
        
        // 창대 장식 (금색 띠)
        spear.rect(15, -4, 8, 8);
        spear.fill({ color: 0xdaa520 });
        
        spearContainer.addChild(spear);
        
        // 비행 방향에 맞게 회전
        const angle = Math.atan2(
            end.y - 30 - (start.y - 30),
            end.x - start.x
        );
        spearContainer.rotation = angle;
        
        // 잔상 효과용 트레일
        const trailInterval = setInterval(() => {
            if (spearContainer.destroyed) {
                clearInterval(trailInterval);
                return;
            }
            this.createSpearTrail(spearContainer.x, spearContainer.y, spearContainer.rotation);
        }, 20);
        
        // 비행 애니메이션 (거리에 따라 속도 조절)
        const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const flightDuration = Math.max(0.3, distance / 600); // 더 천천히 (0.3초 최소)
        
        gsap.to(spearContainer, {
            x: end.x,
            y: end.y - 30,
            duration: flightDuration,
            ease: 'power1.in',  // 완만한 가속
            onComplete: () => {
                clearInterval(trailInterval);
                
                // 도착 시 콜백
                if (onHit) onHit();
                
                // 창 사라짐
                gsap.to(spearContainer, {
                    alpha: 0,
                    duration: 0.1,
                    onComplete: () => {
                        if (!spearContainer.destroyed) {
                            spearContainer.destroy({ children: true });
                        }
                    }
                });
            }
        });
    },
    
    // 창 잔상 효과
    createSpearTrail(x, y, rotation) {
        if (!this.app) return;
        
        const trail = new PIXI.Graphics();
        trail.x = x;
        trail.y = y;
        trail.rotation = rotation;
        trail.alpha = 0.4;
        trail.zIndex = 590;
        
        // 잔상 (흐릿한 창 실루엣)
        trail.roundRect(-30, -2, 50, 4, 2);
        trail.fill({ color: 0xdddddd, alpha: 0.5 });
        
        this.container.addChild(trail);
        
        gsap.to(trail, {
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.5,
            duration: 0.15,
            onComplete: () => {
                if (!trail.destroyed) trail.destroy();
            }
        });
    },
    
    // 창 충돌 이펙트
    spearImpactEffect(x, y) {
        if (!this.app) return;
        
        // 1. 충돌 스파크
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.circle(0, 0, 3);
            spark.fill({ color: 0xffdd66 });
            spark.x = x;
            spark.y = y;
            spark.zIndex = 610;
            this.container.addChild(spark);
            
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.5;
            const distance = 30 + Math.random() * 20;
            
            gsap.to(spark, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    if (!spark.destroyed) spark.destroy();
                }
            });
        }
        
        // 2. 충격파 링
        const ring = new PIXI.Graphics();
        ring.circle(0, 0, 10);
        ring.stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
        ring.x = x;
        ring.y = y;
        ring.zIndex = 605;
        this.container.addChild(ring);
        
        gsap.to(ring.scale, {
            x: 4,
            y: 4,
            duration: 0.25,
            ease: 'power2.out'
        });
        gsap.to(ring, {
            alpha: 0,
            duration: 0.25,
            onComplete: () => {
                if (!ring.destroyed) ring.destroy();
            }
        });
        
        // 3. 먼지/파편
        for (let i = 0; i < 5; i++) {
            const debris = new PIXI.Graphics();
            debris.rect(-2, -2, 4, 4);
            debris.fill({ color: 0x8b4513 }); // 나무 색상
            debris.x = x;
            debris.y = y;
            debris.zIndex = 608;
            this.container.addChild(debris);
            
            const vx = (Math.random() - 0.5) * 60;
            const vy = -Math.random() * 40 - 20;
            
            gsap.to(debris, {
                x: x + vx,
                y: y + vy + 60, // 중력 효과
                rotation: Math.random() * Math.PI * 4,
                alpha: 0,
                duration: 0.5,
                ease: 'power1.in',
                onComplete: () => {
                    if (!debris.destroyed) debris.destroy();
                }
            });
        }
    }
};

// CSS 추가
const combatEffectsStyles = document.createElement('style');
combatEffectsStyles.textContent = `
    /* 히트 스톱 중 게임 일시정지 느낌 */
    .combat-hitstop {
        filter: contrast(1.2) brightness(1.1);
    }
`;
document.head.appendChild(combatEffectsStyles);

console.log('[CombatEffects] 전투 이펙트 시스템 로드 완료');

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
            
            // === 코어 펄스 (빠르고 미세하게) ===
            gsap.to(core.scale, {
                x: 1.15, y: 1.15,
                duration: 0.04,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            
            gsap.to(midFlame.scale, {
                x: 1.1, y: 1.1,
                duration: 0.05,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
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
    // 적 공격 인텐트 실행 연출
    // ==========================================
    async enemyAttackEffect(enemy, target, damage) {
        if (!enemy?.sprite || !target?.sprite) return;
        
        const startX = enemy.sprite.x;
        const startY = enemy.sprite.y - (enemy.sprite.height || 60) / 2;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 적 준비 동작
        await new Promise(resolve => {
            gsap.timeline()
                .to(enemy.sprite, { x: startX - 20, duration: 0.15, ease: 'power2.in' })
                .to(enemy.sprite.scale, { x: 1.1, y: 0.9, duration: 0.15 }, 0)
                .add(resolve);
        });
        
        // 히트 스톱
        await this.hitStop(30);
        
        // 돌진 + 슬래시
        await new Promise(resolve => {
            const attackX = endX - 50;
            
            gsap.timeline()
                .to(enemy.sprite, { x: attackX, duration: 0.1, ease: 'power2.in' })
                .to(enemy.sprite.scale, { x: 1, y: 1, duration: 0.1 }, 0)
                .add(() => {
                    this.slashEffect(endX, endY, -45 + Math.random() * 30, 0xff4444, 1.2);
                    this.hitEffect(target.sprite);
                    this.showDamageNumber(endX, endY - 20, damage);
                    this.screenShake(8, 150);
                    this.screenFlash('#ff0000', 80, 0.2);
                })
                .to(enemy.sprite, { x: startX, duration: 0.2, ease: 'power2.out', delay: 0.1 })
                .add(resolve);
        });
    },
    
    // ==========================================
    // 적 원거리 공격 연출
    // ==========================================
    async enemyRangedAttackEffect(enemy, target, damage) {
        if (!enemy?.sprite || !target?.sprite) return;
        
        const startX = enemy.sprite.x;
        const startY = enemy.sprite.y - (enemy.sprite.height || 60) / 2;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 차징 모션
        await new Promise(resolve => {
            gsap.timeline()
                .to(enemy.sprite.scale, { x: 0.9, y: 1.1, duration: 0.2 })
                .to(enemy.sprite.scale, { x: 1, y: 1, duration: 0.1 })
                .add(resolve);
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
        if (!hero?.sprite || !target?.sprite) return;
        
        const startX = hero.sprite.x;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 영웅 돌진
        await new Promise(resolve => {
            gsap.timeline()
                .to(hero.sprite, { x: endX - 60, duration: 0.15, ease: 'power2.in' })
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
        gsap.to(hero.sprite, {
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
        if (!hero?.sprite || !target?.sprite) return;
        
        const startX = hero.sprite.x;
        const startY = hero.sprite.y - (hero.sprite.height || 60) / 2;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 캐스팅 모션
        await new Promise(resolve => {
            gsap.timeline()
                .to(hero.sprite.scale, { x: 1.1, y: 0.95, duration: 0.15 })
                .to(hero.sprite.scale, { x: 1, y: 1, duration: 0.1 })
                .add(resolve);
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
        if (!hero?.sprite || targets.length === 0) return;
        
        const startX = hero.sprite.x;
        
        // 점프
        await new Promise(resolve => {
            gsap.timeline()
                .to(hero.sprite, { y: hero.sprite.y - 50, duration: 0.15, ease: 'power2.out' })
                .to(hero.sprite, { y: hero.sprite.y, duration: 0.15, ease: 'power2.in' })
                .add(resolve);
        });
        
        // 히트 스톱
        await this.hitStop(60);
        
        // 모든 타겟에 이펙트
        const centerX = targets.reduce((sum, t) => sum + (t.sprite?.x || 0), 0) / targets.length;
        const centerY = targets.reduce((sum, t) => sum + (t.sprite?.y || 0), 0) / targets.length - 30;
        
        this.cleaveEffect(centerX, centerY, 250);
        
        targets.forEach((target, i) => {
            if (!target.sprite) return;
            
            setTimeout(() => {
                this.hitEffect(target.sprite);
                this.showDamageNumber(
                    target.sprite.x,
                    target.sprite.y - (target.sprite.height || 60) / 2 - 20,
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

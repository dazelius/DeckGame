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
    // 모든 플로터/이펙트 정리
    // ==========================================
    cleanupAllFloaters() {
        if (!this.container) return;
        
        const toRemove = [];
        this.container.children.forEach(child => {
            if (child instanceof PIXI.Text) {
                toRemove.push(child);
            }
        });
        
        toRemove.forEach(child => {
            try {
                gsap.killTweensOf(child);
                if (child.scale) gsap.killTweensOf(child.scale);
                if (!child.destroyed) child.destroy();
            } catch(e) {}
        });
        
        console.log(`[CombatEffects] ${toRemove.length}개 플로터 정리`);
    },
    
    // 특정 영역의 플로터 정리
    cleanupFloatersInArea(x, y, radius = 100) {
        if (!this.container) return;
        
        const toRemove = [];
        this.container.children.forEach(child => {
            if (child instanceof PIXI.Text) {
                const dx = child.x - x;
                const dy = child.y - y;
                if (Math.sqrt(dx*dx + dy*dy) < radius) {
                    toRemove.push(child);
                }
            }
        });
        
        toRemove.forEach(child => {
            try {
                gsap.killTweensOf(child);
                if (child.scale) gsap.killTweensOf(child.scale);
                if (!child.destroyed) child.destroy();
            } catch(e) {}
        });
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
    // ★★★ 잔상 시스템 (DDOOAction 방식) ★★★
    // ==========================================
    
    // DDOOAction 스타일 잔상 생성
    createAfterimage(sourceSprite, sourceContainer, alpha = 0.6, tint = 0x00ffff) {
        console.log('[Afterimage] 호출됨', { 
            hasContainer: !!this.container,
            hasSprite: !!sourceSprite,
            hasSpriteContainer: !!sourceContainer
        });
        
        if (!this.container) {
            console.warn('[Afterimage] this.container 없음!');
            return null;
        }
        if (!sourceSprite || sourceSprite.destroyed) {
            console.warn('[Afterimage] sourceSprite 없거나 destroyed');
            return null;
        }
        
        try {
            // ★ 텍스처 찾기 (여러 방법 시도)
            let texture = null;
            
            // 1. 직접 texture
            if (sourceSprite.texture && sourceSprite.texture.valid) {
                texture = sourceSprite.texture;
                console.log('[Afterimage] 직접 texture 사용');
            }
            // 2. Container인 경우 자식에서 찾기
            else if (sourceSprite.children && sourceSprite.children.length > 0) {
                for (const child of sourceSprite.children) {
                    if (child.texture && child.texture.valid) {
                        texture = child.texture;
                        sourceSprite = child;  // 실제 스프라이트로 교체
                        console.log('[Afterimage] 자식에서 texture 찾음');
                        break;
                    }
                }
            }
            
            if (!texture) {
                console.warn('[Afterimage] 유효한 texture 없음!');
                return null;
            }
            
            // ★ 텍스처 직접 복제!
            const ghost = new PIXI.Sprite(texture);
            
            // 앵커 복사
            ghost.anchor.set(
                sourceSprite.anchor?.x ?? 0.5, 
                sourceSprite.anchor?.y ?? 1
            );
            
            // 위치 = 컨테이너 위치
            const posX = sourceContainer?.x ?? sourceSprite.x ?? 0;
            const posY = sourceContainer?.y ?? sourceSprite.y ?? 0;
            ghost.x = posX;
            ghost.y = posY;
            
            // ★ 컨테이너 스케일도 반영!
            const containerScaleX = sourceContainer?.scale?.x ?? 1;
            const containerScaleY = sourceContainer?.scale?.y ?? 1;
            const spriteScaleX = sourceSprite.scale?.x ?? 1;
            const spriteScaleY = sourceSprite.scale?.y ?? 1;
            
            ghost.scale.set(
                spriteScaleX * containerScaleX, 
                spriteScaleY * containerScaleY
            );
            
            // 회전
            ghost.rotation = sourceSprite.rotation ?? 0;
            
            // 틴트 + 알파
            ghost.tint = tint;
            ghost.alpha = alpha;
            ghost.zIndex = 500;  // 높은 zIndex로 확실히 보이게
            
            this.container.addChild(ghost);
            
            console.log('[Afterimage] 생성 완료!', { 
                x: ghost.x, 
                y: ghost.y, 
                scaleX: ghost.scale.x,
                scaleY: ghost.scale.y,
                alpha: ghost.alpha,
                tint: ghost.tint.toString(16)
            });
            
            // ★ GSAP로 부드러운 페이드아웃 + 스케일 축소
            gsap.to(ghost, {
                alpha: 0,
                duration: 0.25,
                ease: 'power1.out',
                onUpdate: () => {
                    if (ghost && !ghost.destroyed) {
                        ghost.scale.x *= 0.98;
                        ghost.scale.y *= 0.98;
                    }
                },
                onComplete: () => {
                    if (ghost && !ghost.destroyed) {
                        if (ghost.parent) ghost.parent.removeChild(ghost);
                        ghost.destroy();
                    }
                }
            });
            
            return ghost;
        } catch (e) {
            console.error('[Afterimage] 생성 실패:', e);
            return null;
        }
    },
    
    // ==========================================
    // ★★★ 연속 잔상 (산데비스탄) ★★★
    // ==========================================
    sandevistanTrail(sourceSprite, sourceContainer, count = 4, tint = 0x00ffff) {
        if (!sourceSprite || sourceSprite.destroyed) return;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (sourceSprite && !sourceSprite.destroyed) {
                    const alpha = 0.7 - i * 0.1;
                    this.createAfterimage(sourceSprite, sourceContainer, alpha, tint);
                }
            }, i * 20);
        }
    },
    
    // ==========================================
    // ★★★ 찌르기 이펙트 (사이버펑크 + 다크소울) ★★★
    // ==========================================
    flurryStab(x, y, hitIndex = 0) {
        if (!this.app || !this.container) return;
        
        // 사이버펑크 네온 팔레트
        const palettes = [
            { blade: 0x00ffff, core: 0xffffff, glow: 0x0088aa, accent: 0xff00ff },
            { blade: 0xff00ff, core: 0xffffff, glow: 0x880088, accent: 0x00ffff },
            { blade: 0xffff00, core: 0xffffff, glow: 0xff6600, accent: 0xff0044 }
        ];
        const colors = palettes[hitIndex % 3];
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y + (hitIndex === 0 ? -10 : hitIndex === 1 ? 10 : 0);
        container.zIndex = 200;
        
        const bladeLen = 180 + hitIndex * 40;
        
        // ========================================
        // 1. 글로우 트레일 (3겹)
        // ========================================
        for (let i = 2; i >= 0; i--) {
            const trail = new PIXI.Graphics();
            const len = bladeLen * (1 - i * 0.15);
            const wid = (8 + hitIndex * 2) * (1 + i * 0.5);
            
            trail.moveTo(-40 - i * 20, 0);
            trail.lineTo(len * 0.3, -wid);
            trail.lineTo(len, 0);
            trail.lineTo(len * 0.3, wid);
            trail.closePath();
            trail.fill({ color: colors.glow, alpha: 0.2 - i * 0.05 });
            
            container.addChild(trail);
        }
        
        // ========================================
        // 2. 메인 블레이드 (날카로운 삼각형)
        // ========================================
        const blade = new PIXI.Graphics();
        
        // 외곽 글로우
        blade.moveTo(-10, 0);
        blade.lineTo(bladeLen * 0.4, -(5 + hitIndex));
        blade.lineTo(bladeLen + 5, 0);
        blade.lineTo(bladeLen * 0.4, (5 + hitIndex));
        blade.closePath();
        blade.fill({ color: colors.blade, alpha: 0.9 });
        
        // 밝은 코어
        blade.moveTo(10, 0);
        blade.lineTo(bladeLen * 0.5, -2);
        blade.lineTo(bladeLen, 0);
        blade.lineTo(bladeLen * 0.5, 2);
        blade.closePath();
        blade.fill({ color: colors.core, alpha: 1 });
        
        container.addChild(blade);
        
        // ========================================
        // 3. 임팩트 (다중 링)
        // ========================================
        // 외곽 글로우
        const outerGlow = new PIXI.Graphics();
        outerGlow.circle(bladeLen, 0, 40 + hitIndex * 10);
        outerGlow.fill({ color: colors.glow, alpha: 0.3 });
        container.addChild(outerGlow);
        
        // 메인 플래시
        const flash = new PIXI.Graphics();
        flash.circle(bladeLen, 0, 22 + hitIndex * 6);
        flash.fill({ color: colors.blade, alpha: 0.9 });
        container.addChild(flash);
        
        // 코어
        const core = new PIXI.Graphics();
        core.circle(bladeLen, 0, 10 + hitIndex * 3);
        core.fill({ color: colors.core, alpha: 1 });
        container.addChild(core);
        
        // ========================================
        // 4. 네온 스파크 라인 (방사형)
        // ========================================
        const sparkCount = 8 + hitIndex * 2;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            const angle = (i / sparkCount) * Math.PI * 2 - Math.PI / 2;
            const len = 30 + Math.random() * 40;
            
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            spark.stroke({ 
                color: i % 2 === 0 ? colors.blade : colors.accent, 
                width: 2 + hitIndex * 0.5, 
                alpha: 1 
            });
            
            spark.x = bladeLen;
            spark.y = 0;
            container.addChild(spark);
            
            // 확장 애니메이션
            gsap.fromTo(spark.scale, 
                { x: 0.3, y: 0.3 },
                { x: 1.5, y: 1.5, duration: 0.08, ease: 'power2.out' }
            );
            gsap.to(spark, { alpha: 0, duration: 0.1, delay: 0.03 });
        }
        
        // ========================================
        // 5. 충격파 링
        // ========================================
        const ring = new PIXI.Graphics();
        ring.circle(bladeLen, 0, 15);
        ring.stroke({ color: colors.accent, width: 3, alpha: 1 });
        container.addChild(ring);
        
        this.container.addChild(container);
        
        // ========================================
        // 메인 애니메이션
        // ========================================
        container.alpha = 0;
        container.scale.set(0.2, 1.3);
        container.x = x - 40;
        
        // 모든 애니메이션을 하나의 타임라인으로
        const tl = gsap.timeline({
            onComplete: () => {
                if (container && !container.destroyed) {
                    container.destroy({ children: true });
                }
            }
        });
        
        // 찌르기!
        tl.to(container, { alpha: 1, x: x + 40, duration: 0.025, ease: 'power4.out' })
          .to(container.scale, { x: 1.3, y: 0.95, duration: 0.025 }, '<');
        
        // 임팩트
        tl.to(outerGlow.scale, { x: 2, y: 2, duration: 0.06 }, 0.02)
          .to(outerGlow, { alpha: 0, duration: 0.08 }, 0.02);
        
        tl.to(flash.scale, { x: 1.6, y: 1.6, duration: 0.05 }, 0.01)
          .to(flash, { alpha: 0, duration: 0.06 }, 0.03);
        
        tl.to(core.scale, { x: 2, y: 2, duration: 0.04 }, 0.01)
          .to(core, { alpha: 0, duration: 0.05 }, 0.02);
        
        // 충격파
        tl.to(ring.scale, { x: 4, y: 4, duration: 0.1 }, 0.02)
          .to(ring, { alpha: 0, duration: 0.08 }, 0.04);
        
        // 페이드아웃
        tl.to(container, { alpha: 0, duration: 0.03 }, 0.1);
        
        // 마지막 타격 특수효과
        if (hitIndex === 2) {
            this.screenFlash(colors.accent, 50, 0.25);
            this.screenShake(6, 100);
        }
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
    // 파이어볼 이펙트 - 절제된 파티클 버전
    // ==========================================
    async fireballEffect(startX, startY, endX, endY) {
        if (!this.app) return;
        
        // 시전 이펙트
        this.screenFlash('#ff4400', 40, 0.15);
        
        return new Promise(resolve => {
            // 파이어볼 컨테이너
            const fireball = new PIXI.Container();
            fireball.x = startX;
            fireball.y = startY;
            fireball.zIndex = 200;
            this.container.addChild(fireball);
            
            // ========================================
            // 파티클 시스템 (2궤도 x 5개 = 10개)
            // ========================================
            const orbitParticles = [];
            const NUM_ORBITS = 2;
            const PARTICLES_PER_ORBIT = 5;
            
            for (let orbit = 0; orbit < NUM_ORBITS; orbit++) {
                const orbitRadius = 18 + orbit * 10;
                const orbitSpeed = 0.12 - orbit * 0.02;
                const baseSize = 6 - orbit * 2;
                
                for (let i = 0; i < PARTICLES_PER_ORBIT; i++) {
                    const particle = new PIXI.Graphics();
                    const angle = (i / PARTICLES_PER_ORBIT) * Math.PI * 2;
                    const size = baseSize + Math.random() * 3;
                    
                    const colors = [0xffcc44, 0xff8800, 0xff5500];
                    const colorIdx = Math.min(orbit, colors.length - 1);
                    
                    particle.circle(0, 0, size);
                    particle.fill({ color: colors[colorIdx], alpha: 0.85 - orbit * 0.2 });
                    
                    particle._angle = angle;
                    particle._orbit = orbitRadius;
                    particle._speed = orbitSpeed * (Math.random() * 0.3 + 0.85);
                    particle._zPhase = Math.random() * Math.PI * 2;
                    particle._baseSize = size;
                    
                    fireball.addChild(particle);
                    orbitParticles.push(particle);
                }
            }
            
            // === 코어 글로우 (3레이어) ===
            const glowLayers = [];
            for (let i = 2; i >= 0; i--) {
                const glow = new PIXI.Graphics();
                const radius = 6 + i * 6;
                const alpha = 0.2 + (2 - i) * 0.2;
                const colors = [0xffffcc, 0xffaa33, 0xff5500];
                
                glow.circle(0, 0, radius);
                glow.fill({ color: colors[i], alpha: alpha });
                fireball.addChild(glow);
                glowLayers.push(glow);
            }
            
            // === 핫스팟 코어 ===
            const hotCore = new PIXI.Graphics();
            hotCore.circle(0, 0, 5);
            hotCore.fill({ color: 0xffffff, alpha: 0.9 });
            fireball.addChild(hotCore);
            
            // === 3D 회전 애니메이션 ===
            let animTime = 0;
            const orbitAnim = gsap.ticker.add(() => {
                if (fireball.destroyed) {
                    gsap.ticker.remove(orbitAnim);
                    return;
                }
                
                animTime += 0.016;  // ~60fps
                
                // 각 파티클 3D 궤도 업데이트
                orbitParticles.forEach((p, idx) => {
                    if (p.destroyed) return;
                    
                    p._angle += p._speed;
                    
                    // 3D 원형 궤도 시뮬레이션 (타원 + Z축 스케일)
                    const zOffset = Math.sin(p._angle + p._zPhase);
                    const depthScale = 0.6 + zOffset * 0.4;  // 깊이에 따른 스케일
                    
                    p.x = Math.cos(p._angle) * p._orbit;
                    p.y = Math.sin(p._angle) * p._orbit * 0.6;  // Y축 압축 (원근)
                    
                    // 깊이에 따른 크기 & 알파
                    p.scale.set(depthScale);
                    p.alpha = 0.4 + depthScale * 0.5;
                    
                    // 뒤에 있으면 더 어둡게
                    if (zOffset < 0) {
                        p.alpha *= 0.6;
                    }
                });
                
                // 글로우 펄스
                glowLayers.forEach((g, i) => {
                    if (g.destroyed) return;
                    const pulse = 1 + Math.sin(animTime * 8 + i * 0.5) * 0.15;
                    g.scale.set(pulse);
                });
                
                // 핫스팟 펄스
                if (!hotCore.destroyed) {
                    const corePulse = 1 + Math.sin(animTime * 12) * 0.2;
                    hotCore.scale.set(corePulse);
                }
            });
            
            // === 베지어 곡선 ===
            const distance = Math.hypot(endX - startX, endY - startY);
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - distance * 0.15;
            
            const getBezierPoint = (t) => {
                const mt = 1 - t;
                return {
                    x: mt * mt * startX + 2 * mt * t * midX + t * t * endX,
                    y: mt * mt * startY + 2 * mt * t * midY + t * t * endY
                };
            };
            
            // === 3D 화염 트레일 ===
            const createVolumetricTrail = () => {
                if (fireball.destroyed) return;
                
                // 다층 트레일 (3D 깊이감)
                for (let layer = 0; layer < 3; layer++) {
                    const trail = new PIXI.Graphics();
                    trail.x = fireball.x + (Math.random() - 0.5) * 15;
                    trail.y = fireball.y + (Math.random() - 0.5) * 10;
                    trail.zIndex = 195 - layer;
                    
                    const size = 12 + layer * 6 + Math.random() * 8;
                    const colors = [0xffcc44, 0xff7700, 0xff3300];
                    const alpha = 0.7 - layer * 0.2;
                    
                    trail.circle(0, 0, size);
                    trail.fill({ color: colors[layer], alpha: alpha });
                    
                    this.container.addChild(trail);
                    
                    // 3D 수축 + 페이드
                    gsap.to(trail, {
                        alpha: 0,
                        duration: 0.25 + layer * 0.05,
                        ease: 'power2.out',
                        onComplete: () => { if (!trail.destroyed) trail.destroy(); }
                    });
                    
                    gsap.to(trail.scale, {
                        x: 0.2, y: 0.4,  // 비대칭 수축 (3D 느낌)
                        duration: 0.25
                    });
                }
            };
            
            // === 스파크 파티클 (3D 튀기) ===
            const createSpark = () => {
                if (fireball.destroyed) return;
                
                const spark = new PIXI.Graphics();
                const angle3D = Math.random() * Math.PI * 2;
                const zAngle = Math.random() * Math.PI - Math.PI / 2;
                
                spark.x = fireball.x;
                spark.y = fireball.y;
                spark.zIndex = 199;
                
                const size = 2 + Math.random() * 3;
                const colors = [0xffffaa, 0xffdd66, 0xff9944];
                spark.circle(0, 0, size);
                spark.fill({ color: colors[Math.floor(Math.random() * colors.length)], alpha: 1 });
                
                this.container.addChild(spark);
                
                // 3D 방향으로 튀기
                const speed = 40 + Math.random() * 60;
                const backAngle = Math.atan2(startY - endY, startX - endX);
                const finalAngle = backAngle + (Math.random() - 0.5) * 1.5;
                
                // Z축 효과 (위아래로 곡선)
                const zEffect = Math.sin(zAngle) * 30;
                
                gsap.to(spark, {
                    x: spark.x + Math.cos(finalAngle) * speed,
                    y: spark.y + Math.sin(finalAngle) * speed + zEffect,
                    alpha: 0,
                    duration: 0.2 + Math.random() * 0.15,
                    ease: 'power2.out',
                    onComplete: () => { if (!spark.destroyed) spark.destroy(); }
                });
                
                // 크기도 3D 깊이 시뮬레이션
                gsap.to(spark.scale, {
                    x: 0.3 + Math.random() * 0.4,
                    y: 0.3 + Math.random() * 0.4,
                    duration: 0.2
                });
            };
            
            // === 연기 볼륨 ===
            const createVolumetricSmoke = () => {
                if (fireball.destroyed) return;
                
                const smoke = new PIXI.Graphics();
                smoke.x = fireball.x + (Math.random() - 0.5) * 20;
                smoke.y = fireball.y;
                smoke.zIndex = 188;
                
                const size = 8 + Math.random() * 12;
                smoke.circle(0, 0, size);
                smoke.fill({ color: 0x332211, alpha: 0.35 });
                
                this.container.addChild(smoke);
                
                gsap.to(smoke, {
                    y: smoke.y - 40 - Math.random() * 20,
                    x: smoke.x + (Math.random() - 0.5) * 30,
                    alpha: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                    onComplete: () => { if (!smoke.destroyed) smoke.destroy(); }
                });
                
                gsap.to(smoke.scale, {
                    x: 2.5, y: 2,
                    duration: 0.5
                });
            };
            
            // 파티클 생성 인터벌 (절제된 빈도)
            const trailInterval = setInterval(createVolumetricTrail, 30);
            const sparkInterval = setInterval(createSpark, 25);
            const smokeInterval = setInterval(createVolumetricSmoke, 80);
            
            // === 비행 애니메이션 ===
            const flightDuration = Math.max(0.3, distance / 700);
            const progress = { t: 0 };
            
            gsap.to(progress, {
                t: 1,
                duration: flightDuration,
                ease: 'power2.in',
                onUpdate: () => {
                    const pos = getBezierPoint(progress.t);
                    fireball.x = pos.x;
                    fireball.y = pos.y;
                    
                    // 비행 중 약간 커짐
                    const scale = 1 + progress.t * 0.2;
                    fireball.scale.set(scale);
                    
                    // 비행 방향으로 약간 기울임
                    const nextPos = getBezierPoint(Math.min(1, progress.t + 0.1));
                    fireball.rotation = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x) * 0.3;
                },
                onComplete: () => {
                    clearInterval(trailInterval);
                    clearInterval(sparkInterval);
                    clearInterval(smokeInterval);
                    gsap.ticker.remove(orbitAnim);
                    
                    this.fireballExplosion3D(endX, endY);
                    
                    if (!fireball.destroyed) fireball.destroy({ children: true });
                    resolve();
                }
            });
        });
    },
    
    // ==========================================
    // 파이어볼 폭발 이펙트 - 3D 볼류메트릭 버전
    // ==========================================
    fireballExplosion3D(x, y) {
        if (!this.app) return;
        
        // 화면 효과 (절제됨)
        this.screenShake(12, 180);
        this.screenFlash('#ff4400', 80, 0.4);
        this.hitStop(40);
        
        // ========================================
        // 초기 플래시 (2레이어)
        // ========================================
        for (let i = 0; i < 2; i++) {
            const flash = new PIXI.Graphics();
            flash.x = x;
            flash.y = y;
            flash.zIndex = 260 - i * 5;
            
            const radius = 40 + i * 25;
            const colors = [0xffffff, 0xffdd88];
            const alphas = [0.9, 0.6];
            
            flash.circle(0, 0, radius);
            flash.fill({ color: colors[i], alpha: alphas[i] });
            this.container.addChild(flash);
            
            gsap.to(flash, {
                alpha: 0,
                duration: 0.1 + i * 0.03,
                onComplete: () => { if (!flash.destroyed) flash.destroy(); }
            });
            
            gsap.to(flash.scale, {
                x: 1.6, y: 1.6,
                duration: 0.1 + i * 0.03
            });
        }
        
        // ========================================
        // 폭발 구체 (4레이어)
        // ========================================
        const sphereContainer = new PIXI.Container();
        sphereContainer.x = x;
        sphereContainer.y = y;
        sphereContainer.zIndex = 245;
        this.container.addChild(sphereContainer);
        
        for (let layer = 3; layer >= 0; layer--) {
            const sphere = new PIXI.Graphics();
            const radius = 12 + layer * 10;
            const colors = [0xffffcc, 0xffaa44, 0xff6600, 0xff3300];
            const alpha = 0.85 - layer * 0.15;
            
            sphere.circle(0, 0, radius);
            sphere.fill({ color: colors[layer], alpha: alpha });
            sphereContainer.addChild(sphere);
        }
        
        gsap.to(sphereContainer.scale, {
            x: 2.2, y: 2,
            duration: 0.25,
            ease: 'power2.out'
        });
        gsap.to(sphereContainer, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => { if (!sphereContainer.destroyed) sphereContainer.destroy({ children: true }); }
        });
        
        // ========================================
        // 충격파 링 (2개)
        // ========================================
        for (let r = 0; r < 2; r++) {
            const ring = new PIXI.Graphics();
            ring.x = x;
            ring.y = y;
            ring.zIndex = 240 - r * 3;
            
            const ringRadius = 20 + r * 10;
            const colors = [0xffdd66, 0xff6622];
            const widths = [6, 4];
            
            ring.circle(0, 0, ringRadius);
            ring.stroke({ color: colors[r], width: widths[r], alpha: 0.8 - r * 0.2 });
            this.container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 5 - r, y: 4 - r * 0.5,
                duration: 0.3 + r * 0.05,
                ease: 'power2.out'
            });
            gsap.to(ring, {
                alpha: 0,
                duration: 0.3 + r * 0.05,
                delay: r * 0.02,
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
        
        // ========================================
        // 화염 파편 (15개로 축소)
        // ========================================
        const NUM_DEBRIS = 15;
        for (let i = 0; i < NUM_DEBRIS; i++) {
            const debris = new PIXI.Container();
            debris.x = x;
            debris.y = y;
            debris.zIndex = 220;
            this.container.addChild(debris);
            
            // 각 파편은 여러 겹의 그래픽
            const angle = (i / NUM_DEBRIS) * Math.PI * 2 + Math.random() * 0.3;
            const zAngle = (Math.random() - 0.5) * Math.PI;  // 3D Z축 각도
            const distance = 80 + Math.random() * 100;
            const speed = 0.3 + Math.random() * 0.2;
            
            // 파편 코어 (밝은 중심)
            const core = new PIXI.Graphics();
            const coreSize = 3 + Math.random() * 5;
            core.circle(0, 0, coreSize);
            core.fill({ color: 0xffffaa, alpha: 1 });
            debris.addChild(core);
            
            // 파편 글로우
            const glow = new PIXI.Graphics();
            const glowSize = coreSize + 4 + Math.random() * 4;
            const glowColors = [0xff8844, 0xff6622, 0xff4400];
            glow.circle(0, 0, glowSize);
            glow.fill({ color: glowColors[Math.floor(Math.random() * glowColors.length)], alpha: 0.7 });
            debris.addChildAt(glow, 0);
            
            // 3D 궤적 계산
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance * 0.7;  // Y축 압축 (원근)
            const arcHeight = Math.sin(zAngle) * 40;  // Z축 = 위아래 아치
            
            // 깊이에 따른 스케일 변화
            const depthScale = 0.5 + Math.cos(zAngle) * 0.5;
            debris.scale.set(depthScale);
            
            // 파편 비행 애니메이션
            const progress = { t: 0 };
            gsap.to(progress, {
                t: 1,
                duration: speed,
                ease: 'power2.out',
                onUpdate: () => {
                    const t = progress.t;
                    debris.x = x + (endX - x) * t;
                    // 포물선 궤적 (3D 아치)
                    debris.y = y + (endY - y) * t - arcHeight * Math.sin(t * Math.PI);
                    
                    // 비행 중 축소
                    const scale = depthScale * (1 - t * 0.6);
                    debris.scale.set(scale);
                    debris.alpha = 1 - t * 0.8;
                },
                onComplete: () => { if (!debris.destroyed) debris.destroy({ children: true }); }
            });
        }
        
        // ========================================
        // 연기 (5개로 축소)
        // ========================================
        for (let i = 0; i < 5; i++) {
            const smokeContainer = new PIXI.Container();
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 30;
            smokeContainer.x = x + offsetX;
            smokeContainer.y = y + offsetY;
            smokeContainer.zIndex = 205;
            this.container.addChild(smokeContainer);
            
            // 2층 연기
            for (let s = 1; s >= 0; s--) {
                const smoke = new PIXI.Graphics();
                const size = 12 + s * 8 + Math.random() * 8;
                const colors = [0x222222, 0x333333];
                const alpha = 0.35 - s * 0.1;
                
                smoke.circle(s * 2, s * 2, size);
                smoke.fill({ color: colors[s], alpha: alpha });
                smokeContainer.addChild(smoke);
            }
            
            gsap.to(smokeContainer, {
                y: smokeContainer.y - 50 - Math.random() * 40,
                x: smokeContainer.x + (Math.random() - 0.5) * 30,
                alpha: 0,
                duration: 0.6 + Math.random() * 0.3,
                delay: i * 0.03,
                ease: 'power2.out',
                onComplete: () => { if (!smokeContainer.destroyed) smokeContainer.destroy({ children: true }); }
            });
            
            gsap.to(smokeContainer.scale, {
                x: 2 + Math.random() * 0.5, y: 1.5 + Math.random() * 0.5,
                duration: 0.6
            });
        }
        
        // ========================================
        // 떠오르는 불씨 (10개로 축소)
        // ========================================
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                if (!this.app || !this.container) return;
                
                const ember = new PIXI.Graphics();
                ember.x = x + (Math.random() - 0.5) * 80;
                ember.y = y + (Math.random() - 0.5) * 50;
                ember.zIndex = 215;
                
                const size = 2 + Math.random() * 4;
                const colors = [0xffcc44, 0xff9944, 0xff6644];
                ember.circle(0, 0, size);
                ember.fill({ color: colors[Math.floor(Math.random() * colors.length)], alpha: 1 });
                
                this.container.addChild(ember);
                
                // 위로 떠오르며 흔들림
                const duration = 0.6 + Math.random() * 0.5;
                const wobble = (Math.random() - 0.5) * 60;
                
                gsap.to(ember, {
                    y: ember.y - 60 - Math.random() * 50,
                    x: ember.x + wobble,
                    alpha: 0,
                    duration: duration,
                    ease: 'power1.out',
                    onComplete: () => { if (!ember.destroyed) ember.destroy(); }
                });
                
                // 깜빡임
                gsap.to(ember.scale, {
                    x: 0.3, y: 0.3,
                    duration: duration
                });
            }, i * 25 + Math.random() * 50);
        }
        
        // ========================================
        // 바닥 스콜치 마크 (잔여 효과)
        // ========================================
        const scorch = new PIXI.Graphics();
        scorch.x = x;
        scorch.y = y + 20;  // 바닥 쪽
        scorch.zIndex = 180;
        
        // 타원형 스콜치
        scorch.ellipse(0, 0, 50, 20);
        scorch.fill({ color: 0x111111, alpha: 0.4 });
        this.container.addChild(scorch);
        
        scorch.scale.set(0.5);
        gsap.to(scorch.scale, {
            x: 1.2, y: 1,
            duration: 0.15,
            ease: 'power2.out'
        });
        gsap.to(scorch, {
            alpha: 0,
            duration: 1.5,
            delay: 0.3,
            ease: 'power2.in',
            onComplete: () => { if (!scorch.destroyed) scorch.destroy(); }
        });
    },
    
    // 기존 함수 호환용 래퍼
    fireballExplosion(x, y) {
        this.fireballExplosion3D(x, y);
    },
    
    // ==========================================
    // 기존 폭발 (레거시 - 필요시 사용)
    // ==========================================
    fireballExplosionLegacy(x, y) {
        if (!this.app) return;
        
        this.screenShake(15, 200);
        this.screenFlash('#ff3300', 100, 0.5);
        this.hitStop(40);
        
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
            onComplete: () => { if (!flash.destroyed) flash.destroy(); }
        });
        
        gsap.to(flash.scale, {
            x: 1.5, y: 1.5,
            duration: 0.08
        });
        
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
            onComplete: () => { if (!core.destroyed) core.destroy(); }
        });
        
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
            onComplete: () => { if (!ring.destroyed) ring.destroy(); }
        });
        
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
                onComplete: () => { if (!spark.destroyed) spark.destroy(); }
            });
            
            gsap.to(spark.scale, {
                x: 0.2, y: 0.2,
                duration: 0.35
            });
        }
        
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
                onComplete: () => { if (!smoke.destroyed) smoke.destroy(); }
            });
            
            gsap.to(smoke.scale, {
                x: 2.5, y: 2.5,
                duration: 0.6
            });
        }
        
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
                    onComplete: () => { if (!ember.destroyed) ember.destroy(); }
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
        if (!sprite || sprite.destroyed) return;
        
        // 기존 애니메이션 중단
        gsap.killTweensOf(sprite);
        
        // 원래 값 저장
        const originalTint = sprite.tint || 0xffffff;
        const originalX = sprite.x;
        
        // ★ 직접 tint 설정 (GSAP은 PixiJS tint 애니메이션 미지원)
        sprite.tint = 0xffffff;
        sprite.alpha = 1;
        
        // 타이밍 기반 tint 변경
        setTimeout(() => {
            if (sprite && !sprite.destroyed) sprite.tint = color;
        }, 30);
        setTimeout(() => {
            if (sprite && !sprite.destroyed) {
                sprite.tint = originalTint;
                sprite.alpha = 1;
            }
        }, 110);
        
        // 넉백 느낌 (안전 체크 포함)
        if (!isNaN(originalX)) {
            gsap.timeline()
                .to(sprite, { 
                    x: originalX - 10, 
                    duration: 0.05,
                    onUpdate: function() {
                        if (!sprite || sprite.destroyed) this.kill();
                    }
                })
                .to(sprite, { x: originalX + 5, duration: 0.05 })
                .to(sprite, { x: originalX, duration: 0.1 });
        }
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
        
        // 안전한 텍스트 제거 함수
        const safeDestroy = () => {
            try {
                if (text && !text.destroyed) {
                    gsap.killTweensOf(text);
                    if (text.scale) gsap.killTweensOf(text.scale);
                    text.destroy();
                }
            } catch(e) {}
        };
        
        // 애니메이션
        if (isBash) {
            // 배쉬: 위에서 쿵! 내려찍듯이
            text.y = y - 100;
            text.scale.set(2);
            text.alpha = 0;
            
            gsap.timeline()
                .to(text, { alpha: 1, duration: 0.05 })
                .to(text, { y: y, duration: 0.12, ease: 'power3.in' })
                .to(text.scale, { x: 1.8, y: 0.6, duration: 0.08 }, '-=0.02')
                .to(text.scale, { x: 1.3, y: 1.3, duration: 0.15, ease: 'elastic.out(1, 0.5)' })
                .to(text, { 
                    y: y - 40, 
                    alpha: 0, 
                    duration: 1.5,
                    delay: 0.5,
                    ease: 'power2.out',
                    onComplete: safeDestroy
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
                    onComplete: safeDestroy
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
                    onComplete: safeDestroy
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
                    onComplete: safeDestroy
                }, '<');
        }
        
        // ★ 백업 타이머: 3초 후에도 남아있으면 강제 제거
        setTimeout(safeDestroy, 3000);
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
    // ★★★ 갈고리 이펙트 (베지어 곡선 + 직선 당기기!) ★★★
    // ==========================================
    async hookEffect(startPos, targetPos, target, damage, crashDamage, gameRef, onHitCallback = null) {
        if (!this.app || !this.container) {
            // ★ onHit 콜백 먼저 실행!
            if (typeof onHitCallback === 'function') {
                onHitCallback(target);
            }
            if (gameRef) {
                gameRef.dealDamage(target, damage);
                if (typeof KnockbackSystem !== 'undefined') {
                    await KnockbackSystem.hookPull(target, crashDamage);
                }
            }
            return;
        }
        
        const startX = startPos.x;
        const startY = startPos.y - 40;
        const endX = targetPos.x;
        const endY = targetPos.y - 40;
        
        // 베지어 곡선 컨트롤 포인트 (위로 볼록)
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - 80;
        
        const hookContainer = new PIXI.Container();
        hookContainer.zIndex = 200;
        this.container.addChild(hookContainer);
        
        // ========================================
        // 1. 체인 & 갈고리 헤드 생성
        // ========================================
        const chain = new PIXI.Graphics();
        hookContainer.addChild(chain);
        
        // 갈고리 헤드 (더 날카롭게!)
        const hookHead = new PIXI.Graphics();
        hookHead.moveTo(0, 0);
        hookHead.lineTo(12, -6);
        hookHead.quadraticCurveTo(20, 0, 15, 12);
        hookHead.lineTo(8, 10);
        hookHead.quadraticCurveTo(2, 8, 0, 0);
        hookHead.fill({ color: 0x666666 });
        hookHead.stroke({ color: 0x333333, width: 2 });
        // 날카로운 끝
        hookHead.moveTo(12, -6);
        hookHead.lineTo(25, -18);
        hookHead.lineTo(18, -4);
        hookHead.fill({ color: 0xaaaaaa });
        hookHead.x = startX;
        hookHead.y = startY;
        hookContainer.addChild(hookHead);
        
        // 베지어 곡선 계산
        const getBezierPoint = (t) => {
            const u = 1 - t;
            return {
                x: u * u * startX + 2 * u * t * midX + t * t * endX,
                y: u * u * startY + 2 * u * t * midY + t * t * endY
            };
        };
        
        // 체인 그리기 (갈고리 위치까지)
        const drawChainTo = (toX, toY) => {
            chain.clear();
            // 굵은 체인
            chain.moveTo(startX, startY);
            chain.lineTo(toX, toY);
            chain.stroke({ color: 0x555555, width: 5 });
            // 밝은 하이라이트
            chain.moveTo(startX, startY);
            chain.lineTo(toX, toY);
            chain.stroke({ color: 0x888888, width: 2 });
        };
        
        // ========================================
        // 2. 갈고리 발사! (베지어 곡선)
        // ========================================
        this.createSparkBurst(startX, startY, 0xffaa00, 5);
        
        const progress = { t: 0 };
        await new Promise(resolve => {
            gsap.to(progress, {
                t: 1,
                duration: 0.2,
                ease: 'power2.out',
                onUpdate: () => {
                    const pt = getBezierPoint(progress.t);
                    hookHead.x = pt.x;
                    hookHead.y = pt.y;
                    // 진행 방향으로 회전
                    const nextT = Math.min(1, progress.t + 0.1);
                    const nextPt = getBezierPoint(nextT);
                    hookHead.rotation = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
                    drawChainTo(pt.x, pt.y);
                },
                onComplete: resolve
            });
        });
        
        // ========================================
        // 3. 명중! 적을 움켜쥠
        // ========================================
        this.createSparkBurst(endX, endY, 0xff4400, 12);
        this.screenShake(5, 80);
        
        // ★★★ 타격 시점! onHit 콜백 (브레이크 시스템 등) ★★★
        if (typeof onHitCallback === 'function') {
            onHitCallback(target);
        }
        
        // 대미지!
        if (gameRef) {
            gameRef.dealDamage(target, damage);
        }
        
        // 히트 플래시
        const targetSprite = target.container || target.sprite;
        if (target.sprite && !target.sprite.destroyed) {
            target.sprite.tint = 0xff4444;
        }
        
        await new Promise(r => setTimeout(r, 100));
        
        // 틴트 복구
        if (target.sprite && !target.sprite.destroyed) {
            target.sprite.tint = 0xffffff;
        }
        
        // ========================================
        // 4. 당기기! (직선으로 + 충돌 처리!)
        // ========================================
        const hero = gameRef?.state?.hero;
        const finalGridX = hero ? hero.gridX + 1 : target.gridX;
        const finalPos = gameRef?.getCellCenter(finalGridX, target.gridZ);
        const pullEndX = finalPos?.x || startX + 60;
        const pullEndY = finalPos?.y || endY + 40;
        
        // ★ 경로에 있는 적들 찾기 (같은 Z, target보다 앞에 있는)
        const enemiesInPath = gameRef?.state?.enemyUnits?.filter(e => 
            e !== target && e.hp > 0 && 
            e.gridZ === target.gridZ &&
            e.gridX >= finalGridX && e.gridX < target.gridX
        ).sort((a, b) => b.gridX - a.gridX) || []; // X 내림차순 (가까운 적부터)
        
        // 당기기 시작점
        const pullStartX = endX;
        const pullStartY = endY + 40;
        const pullDuration = 0.3;
        let crashTriggered = [];
        
        // ★★★ 적 스프라이트를 GSAP 트윈으로 당기기! ★★★
        let pullTween = null;
        if (targetSprite && !targetSprite.destroyed && target.hp > 0) {
            // 적 당기기 트윈 시작!
            pullTween = gsap.to(targetSprite, {
                x: pullEndX,
                y: pullEndY,
                duration: pullDuration,
                ease: 'power2.in',
                onUpdate: function() {
                    // 타겟이 파괴되면 트윈 중단
                    if (!targetSprite || targetSprite.destroyed || target.hp <= 0) {
                        this.kill();
                    }
                }
            });
        }
        
        // 갈고리 & 체인 & 충돌 처리
        await new Promise(resolve => {
            const pullProgress = { t: 0 };
            
            gsap.to(pullProgress, {
                t: 1,
                duration: pullDuration,
                ease: 'power2.in',
                onUpdate: () => {
                    const t = pullProgress.t;
                    
                    // 갈고리 + 체인 위치 계산 (직선 보간)
                    const currentX = pullStartX + (pullEndX - pullStartX) * t;
                    const currentY = pullStartY + (pullEndY - pullStartY) * t;
                    
                    // 갈고리 헤드 이동 (적과 함께)
                    hookHead.x = currentX;
                    hookHead.y = currentY - 40;
                    hookHead.rotation = Math.atan2(startY - hookHead.y, startX - hookHead.x);
                    
                    // 체인 업데이트
                    drawChainTo(hookHead.x, hookHead.y);
                    
                    // ★ 경로의 적과 충돌 체크!
                    for (const enemy of enemiesInPath) {
                        if (crashTriggered.includes(enemy)) continue;
                        
                        const enemyPos = gameRef?.getCellCenter(enemy.gridX, enemy.gridZ);
                        if (!enemyPos) continue;
                        
                        // 충돌 판정 (X 좌표 기준)
                        if (currentX <= enemyPos.x + 30) {
                            crashTriggered.push(enemy);
                            
                            // ★ 충돌 이펙트!
                            CombatEffects.createSparkBurst(enemyPos.x, enemyPos.y - 40, 0xff6600, 10);
                            CombatEffects.screenShake(6, 100);
                            
                            // 충돌 대미지 (양쪽)
                            if (gameRef) {
                                gameRef.dealDamage(enemy, crashDamage);
                                gameRef.dealDamage(target, crashDamage);
                            }
                            
                            // 충돌한 적 밀려남! (트윈으로!)
                            const enemySprite = enemy.container || enemy.sprite;
                            if (enemySprite && !enemySprite.destroyed) {
                                // 뒤로 한 칸 밀기
                                const newEnemyX = enemy.gridX + 1;
                                if (newEnemyX < gameRef.arena.width) {
                                    const pushPos = gameRef.getCellCenter(newEnemyX, enemy.gridZ);
                                    if (pushPos) {
                                        enemy.gridX = newEnemyX;
                                        enemy.x = newEnemyX + 0.5;
                                        gsap.to(enemySprite, {
                                            x: pushPos.x,
                                            duration: 0.15,
                                            ease: 'power2.out'
                                        });
                                    }
                                }
                                // 충돌 플래시
                                if (enemy.sprite) {
                                    enemy.sprite.tint = 0xff6600;
                                    setTimeout(() => {
                                        if (enemy.sprite && !enemy.sprite.destroyed) {
                                            enemy.sprite.tint = 0xffffff;
                                        }
                                    }, 150);
                                }
                            }
                            
                            console.log(`[Hook] 충돌! ${enemy.type}과 부딪힘!`);
                        }
                    }
                },
                onComplete: resolve
            });
        });
        
        // ========================================
        // 5. 최종 위치 고정 + 그리드 업데이트
        // ========================================
        // 그리드 위치 업데이트
        target.gridX = finalGridX;
        target.x = finalGridX + 0.5;
        
        // 스프라이트 최종 위치 보정
        if (targetSprite && !targetSprite.destroyed && finalPos) {
            targetSprite.x = finalPos.x;
            targetSprite.y = finalPos.y;
        }
        
        // 정리
        hookContainer.destroy();
        
        // 착지 이펙트
        this.createDustCloud(pullEndX, pullEndY, 8);
        
        // 착지 충격
        this.screenShake(4, 80);
        
        console.log(`[Hook] 완료! 최종 위치: gridX=${target.gridX}, 충돌: ${crashTriggered.length}명`);
    },
    
    // ==========================================
    // 스파크 버스트 (갈고리용)
    // ==========================================
    createSparkBurst(x, y, color = 0xffaa00, count = 10) {
        for (let i = 0; i < count; i++) {
            const spark = new PIXI.Graphics();
            spark.circle(0, 0, 3);
            spark.fill({ color });
            spark.x = x;
            spark.y = y;
            spark.zIndex = 250;
            this.container.addChild(spark);
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 80 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            gsap.to(spark, {
                x: x + vx * 0.3,
                y: y + vy * 0.3,
                alpha: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => spark.destroy()
            });
        }
    },
    
    // ==========================================
    // 먼지 구름 (착지용)
    // ==========================================
    createDustCloud(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const dust = new PIXI.Graphics();
            const size = 8 + Math.random() * 8;
            dust.circle(0, 0, size);
            dust.fill({ color: 0x8b7355, alpha: 0.6 });
            dust.x = x + (Math.random() - 0.5) * 30;
            dust.y = y;
            dust.zIndex = 50;
            this.container.addChild(dust);
            
            gsap.to(dust, {
                y: y - 20 - Math.random() * 20,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                ease: 'power1.out',
                onComplete: () => dust.destroy()
            });
            
            gsap.to(dust.scale, {
                x: 1.5,
                y: 1.5,
                duration: 0.4,
                ease: 'power1.out'
            });
        }
    },
    
    // ==========================================
    // 스피어 투척 이펙트 (그리드 거리 기반 파워업!)
    // ==========================================
    async spearThrowEffect(attacker, target, baseDamage, distanceBonus, gameRef, onHitCallback = null) {
        const totalDamage = baseDamage + distanceBonus;
        
        if (!this.app || !attacker.sprite || !target.sprite) {
            // ★ onHit 콜백 먼저 실행!
            if (typeof onHitCallback === 'function') {
                onHitCallback(target);
            }
            if (gameRef) gameRef.dealDamage(target, totalDamage);
            return;
        }
        
        // 시작/도착 위치 계산
        const attackerPos = attacker.sprite.getGlobalPosition();
        const targetPos = target.sprite.getGlobalPosition();
        
        // ★ 그리드 거리 계산 (한 칸당 파워업!)
        const gridDistance = Math.abs(target.gridX - attacker.gridX);
        const powerLevel = Math.min(5, Math.max(0, gridDistance - 1)); // 2칸부터 파워업 시작, 최대 5
        
        console.log(`[Spear] 그리드 거리: ${gridDistance}, 파워 레벨: ${powerLevel}`);
        
        // 투척 모션 - 더 역동적으로!
        const posTarget = attacker.container || attacker.sprite;
        const scaleTarget = attacker.sprite;
        const originalX = posTarget.x;
        const baseScale = scaleTarget.scale?.x || 1;
        
        return new Promise(resolve => {
            const tl = gsap.timeline();
            
            // 1. 준비 동작 - 뒤로 빠지면서 몸을 웅크림
            tl.to(posTarget, {
                x: originalX - 20,
                duration: 0.15,
                ease: 'power2.in'
            });
            if (scaleTarget.scale) {
                tl.to(scaleTarget.scale, {
                    x: baseScale * 0.9,
                    y: baseScale * 1.1,
                    duration: 0.15
                }, '<');
            }
            
            // 2. 던지기! - 강하게 앞으로
            tl.to(posTarget, {
                x: originalX + 25,
                duration: 0.1,
                ease: 'power4.out',
                onComplete: () => {
                    // ★ 강화된 창 발사!
                    this.createSpearProjectile(attackerPos, targetPos, gridDistance, powerLevel, (currentPower) => {
                        // ★★★ 타격 시점! onHit 콜백 (브레이크 시스템 등) ★★★
                        if (typeof onHitCallback === 'function') {
                            onHitCallback(target);
                        }
                        
                        // 창 도착 - 대미지 처리
                        if (gameRef && target && target.hp > 0) {
                            // ★ dealDamage 사용 (플로터 포함)
                            gameRef.dealDamage(target, totalDamage);
                            console.log(`[Spear Hit] 대미지 적용: ${totalDamage} (기본: ${baseDamage}, 보너스: ${distanceBonus})`);
                        }
                        // ★ 파워 레벨에 따른 쉐이크 강도
                        const shakeIntensity = 5 + currentPower * 4;
                        this.screenShake(shakeIntensity, 100 + currentPower * 30);
                        this.spearImpactEffect(targetPos.x, targetPos.y, currentPower);
                    });
                }
            });
            if (scaleTarget.scale) {
                tl.to(scaleTarget.scale, {
                    x: baseScale * 1.15,
                    y: baseScale * 0.85,
                    duration: 0.1
                }, '<');
            }
            
            // 3. 원위치
            tl.to(posTarget, {
                x: originalX,
                duration: 0.25,
                ease: 'power2.out',
                onUpdate: function() {
                    // ★ 파괴 체크
                    if (!posTarget || posTarget.destroyed) {
                        this.kill();
                        resolve();
                    }
                },
                onComplete: resolve
            });
            if (scaleTarget.scale) {
                tl.to(scaleTarget.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.2,
                    ease: 'elastic.out(1, 0.5)'
                }, '<');
            }
        });
    },
    
    
    
    // ★ 스피어 발사체 생성 (비행 중 실시간 파워업!)
    createSpearProjectile(start, end, gridDistance, initialPower = 0, onHit) {
        if (!this.app) return;
        
        const spearContainer = new PIXI.Container();
        spearContainer.x = start.x;
        spearContainer.y = start.y - 30;
        spearContainer.zIndex = 600;
        this.container.addChild(spearContainer);
        
        // ★ 창 그래픽 (기본 상태)
        const spear = new PIXI.Graphics();
        this.drawSpear(spear, 0);
        spearContainer.addChild(spear);
        
        // ★ 글로우 이펙트 컨테이너
        const glowContainer = new PIXI.Container();
        glowContainer.zIndex = -1;
        spearContainer.addChild(glowContainer);
        
        // ★ 파워업 텍스트 표시용
        let lastPowerLevel = 0;
        
        // 비행 방향
        const angle = Math.atan2(end.y - 30 - (start.y - 30), end.x - start.x);
        spearContainer.rotation = angle;
        
        // 비행 거리 & 시간
        const pixelDistance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const flightDuration = Math.max(0.25, pixelDistance / 800);
        
        // ★ 그리드 체크포인트 계산 (한 칸마다 파워업)
        const checkpoints = [];
        for (let i = 1; i <= gridDistance; i++) {
            checkpoints.push(i / gridDistance); // 0~1 사이의 진행률
        }
        
        let currentPower = 0;
        let passedCheckpoints = 0;
        
        // ★ 실시간 업데이트 (프레임마다)
        const updateInterval = setInterval(() => {
            if (spearContainer.destroyed) {
                clearInterval(updateInterval);
                return;
            }
            
            // 현재 진행률 계산
            const progress = (spearContainer.x - start.x) / (end.x - start.x);
            
            // 체크포인트 통과 확인
            while (passedCheckpoints < checkpoints.length && progress >= checkpoints[passedCheckpoints]) {
                passedCheckpoints++;
                if (passedCheckpoints >= 2) { // 2칸부터 파워업
                    currentPower = Math.min(5, passedCheckpoints - 1);
                    this.powerUpSpear(spearContainer, spear, glowContainer, currentPower);
                }
            }
            
            // 잔상 생성
            this.createSpearTrail(spearContainer.x, spearContainer.y, spearContainer.rotation, currentPower);
            
            // 파워 2 이상: 불꽃 파티클
            if (currentPower >= 2 && Math.random() < 0.4) {
                this.createFlameParticle(spearContainer.x, spearContainer.y, currentPower);
            }
        }, 25);
        
        // 비행 애니메이션
        gsap.to(spearContainer, {
            x: end.x,
            y: end.y - 30,
            duration: flightDuration,
            ease: 'none',
            onUpdate: function() {
                // ★ 애니메이션 중 파괴 체크
                if (!spearContainer || spearContainer.destroyed) {
                    this.kill();
                    clearInterval(updateInterval);
                }
            },
            onComplete: () => {
                clearInterval(updateInterval);
                
                // ★ 파괴 체크
                if (spearContainer && !spearContainer.destroyed) {
                    // 도착 시 콜백 (최종 파워 레벨 전달)
                    if (typeof onHit === 'function') onHit(currentPower);
                    
                    // 폭발 후 사라짐
                    gsap.to(spearContainer, {
                        alpha: 0,
                        duration: 0.08,
                        onComplete: () => {
                            if (spearContainer && !spearContainer.destroyed) {
                                spearContainer.destroy({ children: true });
                            }
                        }
                    });
                } else {
                    // 이미 파괴됨 - 콜백만 호출
                    if (typeof onHit === 'function') onHit(currentPower);
                }
            }
        });
    },
    
    // ★ 창 그리기 (다크소울 풍 - 파워 레벨별)
    drawSpear(graphics, powerLevel) {
        graphics.clear();
        
        // 다크소울 색상 - 어둡고 묵직한 톤
        const colors = [
            { blade: 0x6a6a6a, shaft: 0x3d2817, core: 0x888888 },     // 0: 철 
            { blade: 0x7a7a7a, shaft: 0x4a3020, core: 0xaa6622 },     // 1: 열기
            { blade: 0x8a7060, shaft: 0x553322, core: 0xcc5500 },     // 2: 잔불
            { blade: 0x8a5540, shaft: 0x442211, core: 0xdd4400 },     // 3: 화염
            { blade: 0x7a3020, shaft: 0x331100, core: 0xff3300 },     // 4: 맹화
            { blade: 0x601010, shaft: 0x220000, core: 0xff2200 },     // 5: 지옥불
        ];
        const c = colors[Math.min(powerLevel, 5)];
        
        const scale = 1 + powerLevel * 0.08;
        const bladeLen = (45 + powerLevel * 5) * scale;
        const bladeW = (4 + powerLevel * 1) * scale;
        
        // 창날 - 날카롭고 위협적인 형태
        graphics.poly([
            { x: bladeLen, y: 0 },
            { x: bladeLen - 12 * scale, y: -bladeW * 0.6 },
            { x: bladeLen - 22 * scale, y: -bladeW },
            { x: bladeLen - 22 * scale, y: bladeW },
            { x: bladeLen - 12 * scale, y: bladeW * 0.6 }
        ]);
        graphics.fill({ color: c.blade });
        graphics.stroke({ width: 1, color: 0x222222, alpha: 0.8 });
        
        // 파워 1 이상: 중심에 빛나는 코어
        if (powerLevel >= 1) {
            graphics.moveTo(bladeLen - 5 * scale, 0);
            graphics.lineTo(bladeLen - 20 * scale, 0);
            graphics.stroke({ width: 2 + powerLevel * 0.5, color: c.core, alpha: 0.6 + powerLevel * 0.08 });
        }
        
        // 창대 - 어두운 나무/금속
        graphics.roundRect(-38 * scale, -2.5 * scale, 62 * scale, 5 * scale, 2);
        graphics.fill({ color: c.shaft });
        graphics.stroke({ width: 1, color: 0x111111 });
        
        // 장식 밴드 - 어두운 금속
        graphics.rect(10 * scale, -3.5 * scale, 8 * scale, 7 * scale);
        graphics.fill({ color: 0x4a4a3a });
        graphics.stroke({ width: 1, color: 0x222211 });
    },
    
    // ★ 창 파워업 연출 (다크소울 풍 - 은은하고 묵직하게)
    powerUpSpear(container, spearGraphics, glowContainer, powerLevel) {
        // 창 다시 그리기
        this.drawSpear(spearGraphics, powerLevel);
        
        // 묵직한 펀치 효과
        gsap.fromTo(container.scale, 
            { x: 1.15, y: 0.9 },
            { x: 1, y: 1, duration: 0.12, ease: 'power2.out' }
        );
        
        // 어두운 글로우/오라
        const glowColors = [null, 0x442200, 0x663300, 0x884400, 0x993300, 0x882200];
        const coreColors = [null, 0xaa5500, 0xcc5500, 0xdd4400, 0xee3300, 0xff2200];
        const glowColor = glowColors[Math.min(powerLevel, 5)];
        const coreColor = coreColors[Math.min(powerLevel, 5)];
        
        if (glowColor) {
            glowContainer.removeChildren();
            
            // 외곽 어두운 오라
            const outerGlow = new PIXI.Graphics();
            outerGlow.circle(20, 0, 25 + powerLevel * 6);
            outerGlow.fill({ color: 0x110000, alpha: 0.3 + powerLevel * 0.05 });
            glowContainer.addChild(outerGlow);
            
            // 내부 잔열
            const innerGlow = new PIXI.Graphics();
            innerGlow.circle(25, 0, 12 + powerLevel * 3);
            innerGlow.fill({ color: glowColor, alpha: 0.25 + powerLevel * 0.05 });
            glowContainer.addChild(innerGlow);
            
            // 코어 빛
            const core = new PIXI.Graphics();
            core.circle(30, 0, 4 + powerLevel);
            core.fill({ color: coreColor, alpha: 0.4 });
            glowContainer.addChild(core);
            
            // 은은한 펄스
            gsap.to(innerGlow, {
                alpha: 0.1,
                duration: 0.15,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
        
        // 파워업 이펙트
        this.showPowerUpEffect(container.x, container.y, powerLevel);
    },
    
    // ★ 파워업 이펙트 (다크소울 풍 - 불씨 폭발)
    showPowerUpEffect(x, y, powerLevel) {
        if (!this.app) return;
        
        // 작은 불씨들 폭발
        const emberCount = 4 + powerLevel * 2;
        const emberColors = [0x662200, 0x883300, 0xaa4400, 0xcc5500, 0xdd4400];
        
        for (let i = 0; i < emberCount; i++) {
            const ember = new PIXI.Graphics();
            const size = 1 + Math.random() * (1.5 + powerLevel * 0.3);
            ember.circle(0, 0, size);
            ember.fill({ color: emberColors[Math.min(powerLevel, 4)], alpha: 0.8 });
            ember.x = x;
            ember.y = y;
            ember.zIndex = 650;
            this.container.addChild(ember);
            
            const angle = (Math.PI * 2 / emberCount) * i + Math.random() * 0.5;
            const dist = 15 + Math.random() * 20;
            
            gsap.to(ember, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 10,
                alpha: 0,
                duration: 0.25 + Math.random() * 0.1,
                ease: 'power2.out',
                onComplete: () => { if (!ember.destroyed) ember.destroy(); }
            });
        }
        
        // 검은 연기 퍼프
        const smoke = new PIXI.Graphics();
        smoke.circle(0, 0, 8 + powerLevel * 2);
        smoke.fill({ color: 0x111111, alpha: 0.3 });
        smoke.x = x;
        smoke.y = y;
        smoke.zIndex = 640;
        this.container.addChild(smoke);
        
        gsap.to(smoke.scale, { x: 2, y: 2, duration: 0.2, ease: 'power2.out' });
        gsap.to(smoke, { 
            y: y - 15,
            alpha: 0, 
            duration: 0.25,
            onComplete: () => { if (!smoke.destroyed) smoke.destroy(); }
        });
    },
    
    // ★ 불씨/잔열 파티클 (다크소울 풍)
    createFlameParticle(x, y, powerLevel) {
        if (!this.app) return;
        
        // 다크소울 스타일 - 어두운 불씨와 연기
        const isSmoke = Math.random() < 0.3; // 30% 확률로 연기
        
        if (isSmoke) {
            // 검은 연기
            const smoke = new PIXI.Graphics();
            const size = 3 + Math.random() * 4;
            smoke.circle(0, 0, size);
            smoke.fill({ color: 0x111111, alpha: 0.2 + Math.random() * 0.1 });
            smoke.x = x + (Math.random() - 0.5) * 20;
            smoke.y = y + (Math.random() - 0.5) * 10;
            smoke.zIndex = 593;
            this.container.addChild(smoke);
            
            gsap.to(smoke, {
                x: smoke.x - 20 - Math.random() * 20,
                y: smoke.y - 15 - Math.random() * 15,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.15,
                ease: 'power1.out',
                onComplete: () => { if (!smoke.destroyed) smoke.destroy(); }
            });
            gsap.to(smoke.scale, { x: 1.5, y: 1.5, duration: 0.3 });
        } else {
            // 어두운 불씨
            const emberColors = [0x552200, 0x773300, 0x994400, 0xaa4400, 0xbb3300];
            const color = emberColors[Math.min(powerLevel, 4)];
            
            const ember = new PIXI.Graphics();
            const size = 1 + Math.random() * (1.5 + powerLevel * 0.3);
            ember.circle(0, 0, size);
            ember.fill({ color, alpha: 0.7 + Math.random() * 0.3 });
            ember.x = x + (Math.random() - 0.5) * 15;
            ember.y = y + (Math.random() - 0.5) * 12;
            ember.zIndex = 595;
            this.container.addChild(ember);
            
            const vx = -25 - Math.random() * 35;
            const vy = (Math.random() - 0.5) * 25 - 5; // 약간 위로
            
            gsap.to(ember, {
                x: ember.x + vx,
                y: ember.y + vy,
                alpha: 0,
                duration: 0.2 + Math.random() * 0.15,
                ease: 'power2.out',
                onComplete: () => { if (!ember.destroyed) ember.destroy(); }
            });
        }
    },
    
    // ★ 창 잔상 효과 (다크소울 풍 - 연기/잔불)
    createSpearTrail(x, y, rotation, powerLevel = 0) {
        if (!this.app) return;
        
        const trailContainer = new PIXI.Container();
        trailContainer.x = x;
        trailContainer.y = y;
        trailContainer.rotation = rotation;
        trailContainer.zIndex = 590;
        this.container.addChild(trailContainer);
        
        // 1. 메인 잔상 - 어두운 연기/그림자
        const mainTrail = new PIXI.Graphics();
        const length = 30 + powerLevel * 12;
        const width = 2 + powerLevel * 1.5;
        
        // 그라데이션 효과를 위한 여러 레이어
        for (let i = 0; i < 3; i++) {
            const layerLen = length * (1 - i * 0.2);
            const layerW = width * (1 + i * 0.3);
            const alpha = (0.3 - i * 0.08) * (1 + powerLevel * 0.1);
            mainTrail.roundRect(-15, -layerW, layerLen, layerW * 2, 2);
            mainTrail.fill({ color: 0x222222, alpha });
        }
        trailContainer.addChild(mainTrail);
        
        // 2. 파워 1 이상: 불씨/잔열
        if (powerLevel >= 1) {
            const emberColors = [0x662200, 0x883300, 0xaa4400, 0xcc5500, 0xdd4400];
            const emberColor = emberColors[Math.min(powerLevel - 1, 4)];
            
            const ember = new PIXI.Graphics();
            ember.roundRect(-10, -width * 0.4, length * 0.6, width * 0.8, 1);
            ember.fill({ color: emberColor, alpha: 0.4 + powerLevel * 0.1 });
            trailContainer.addChild(ember);
            
            // 작은 불씨 파티클들
            const particleCount = Math.min(powerLevel, 3);
            for (let i = 0; i < particleCount; i++) {
                const spark = new PIXI.Graphics();
                const sparkX = -5 + Math.random() * (length * 0.4);
                const sparkY = (Math.random() - 0.5) * width * 2;
                spark.circle(sparkX, sparkY, 1 + Math.random());
                spark.fill({ color: emberColor, alpha: 0.5 + Math.random() * 0.3 });
                trailContainer.addChild(spark);
            }
        }
        
        // 3. 파워 3 이상: 검은 연기 파티클
        if (powerLevel >= 3) {
            for (let i = 0; i < 2; i++) {
                const smoke = new PIXI.Graphics();
                const smokeX = -20 - Math.random() * 15;
                const smokeY = (Math.random() - 0.5) * width * 3;
                smoke.circle(smokeX, smokeY, 3 + Math.random() * 3);
                smoke.fill({ color: 0x111111, alpha: 0.2 });
                trailContainer.addChild(smoke);
            }
        }
        
        // 서서히 사라지며 위로 흩어짐
        gsap.to(trailContainer, {
            alpha: 0,
            y: y - 3,
            duration: 0.15 + powerLevel * 0.02,
            ease: 'power1.out',
            onComplete: () => { if (!trailContainer.destroyed) trailContainer.destroy({ children: true }); }
        });
    },
    
    // ★ 창 충돌 이펙트 (다크소울 풍 - 묵직한 타격감)
    spearImpactEffect(x, y, powerLevel = 0) {
        if (!this.app) return;
        
        // 다크소울 색상 - 어두운 불씨와 먼지
        const emberColors = [0x555555, 0x664422, 0x774433, 0x885544, 0x994433, 0xaa3322];
        const mainColor = emberColors[Math.min(powerLevel, 5)];
        
        // 1. 충격 먼지 구름
        const dustCloud = new PIXI.Graphics();
        dustCloud.circle(0, 0, 12 + powerLevel * 4);
        dustCloud.fill({ color: 0x1a1a1a, alpha: 0.35 + powerLevel * 0.04 });
        dustCloud.x = x;
        dustCloud.y = y;
        dustCloud.zIndex = 605;
        this.container.addChild(dustCloud);
        
        gsap.to(dustCloud.scale, { x: 2 + powerLevel * 0.25, y: 1.4 + powerLevel * 0.15, duration: 0.22, ease: 'power2.out' });
        gsap.to(dustCloud, { y: y - 8, alpha: 0, duration: 0.32, onComplete: () => { if (!dustCloud.destroyed) dustCloud.destroy(); } });
        
        // 2. 금속/돌 파편 (무거운 느낌)
        const debrisCount = 4 + powerLevel * 2;
        for (let i = 0; i < debrisCount; i++) {
            const debris = new PIXI.Graphics();
            const size = 1.5 + Math.random() * 2;
            debris.rect(-size/2, -size/2, size, size);
            debris.fill({ color: 0x333333 + Math.floor(Math.random() * 0x222222) });
            debris.x = x;
            debris.y = y;
            debris.zIndex = 615;
            this.container.addChild(debris);
            
            const angle = (Math.PI * 2 / debrisCount) * i + Math.random() * 0.5;
            const dist = 18 + Math.random() * 25 + powerLevel * 6;
            
            gsap.to(debris, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist + 25, // 중력
                rotation: (Math.random() - 0.5) * Math.PI * 3,
                alpha: 0,
                duration: 0.38 + Math.random() * 0.12,
                ease: 'power1.in',
                onComplete: () => { if (!debris.destroyed) debris.destroy(); }
            });
        }
        
        // 3. 불씨 튀김 (작고 어두운)
        const emberCount = 2 + powerLevel * 2;
        for (let i = 0; i < emberCount; i++) {
            const ember = new PIXI.Graphics();
            const size = 0.8 + Math.random() * (1 + powerLevel * 0.3);
            ember.circle(0, 0, size);
            ember.fill({ color: mainColor, alpha: 0.7 });
            ember.x = x + (Math.random() - 0.5) * 8;
            ember.y = y + (Math.random() - 0.5) * 8;
            ember.zIndex = 618;
            this.container.addChild(ember);
            
            const vx = (Math.random() - 0.5) * (35 + powerLevel * 8);
            const vy = -12 - Math.random() * (15 + powerLevel * 4);
            
            gsap.to(ember, {
                x: ember.x + vx,
                y: ember.y + vy + 28, // 중력
                alpha: 0,
                duration: 0.4 + Math.random() * 0.18,
                ease: 'power1.in',
                onComplete: () => { if (!ember.destroyed) ember.destroy(); }
            });
        }
        
        // 4. 파워 2 이상: 검은 연기 (서서히 올라감)
        if (powerLevel >= 2) {
            const smokeCount = 1 + powerLevel;
            for (let i = 0; i < smokeCount; i++) {
                setTimeout(() => {
                    if (!this.app) return;
                    const smoke = new PIXI.Graphics();
                    const size = 5 + Math.random() * 6;
                    smoke.circle(0, 0, size);
                    smoke.fill({ color: 0x0a0a0a, alpha: 0.22 });
                    smoke.x = x + (Math.random() - 0.5) * 20;
                    smoke.y = y + (Math.random() - 0.5) * 12;
                    smoke.zIndex = 602;
                    this.container.addChild(smoke);
                    
                    gsap.to(smoke, {
                        y: smoke.y - 25 - Math.random() * 18,
                        alpha: 0,
                        duration: 0.45 + Math.random() * 0.2,
                        ease: 'power1.out',
                        onComplete: () => { if (!smoke.destroyed) smoke.destroy(); }
                    });
                    gsap.to(smoke.scale, { x: 1.6, y: 1.6, duration: 0.45 });
                }, i * 30);
            }
        }
        
        // 5. 파워 3 이상: 땅 갈라짐 (가로선)
        if (powerLevel >= 3) {
            const crack = new PIXI.Graphics();
            crack.moveTo(0, 0);
            crack.lineTo(-12 - powerLevel * 4, 2 + Math.random() * 2);
            crack.lineTo(12 + powerLevel * 4, -1 - Math.random() * 2);
            crack.stroke({ width: 1.5, color: 0x2a2a2a, alpha: 0.5 });
            crack.x = x;
            crack.y = y + 4;
            crack.zIndex = 600;
            this.container.addChild(crack);
            
            gsap.to(crack, { alpha: 0, duration: 0.5, delay: 0.15, onComplete: () => { if (!crack.destroyed) crack.destroy(); } });
        }
        
        // 6. 파워 4 이상: 어두운 잔상
        if (powerLevel >= 4) {
            const shadow = new PIXI.Graphics();
            shadow.circle(0, 0, 35 + powerLevel * 8);
            shadow.fill({ color: 0x110808, alpha: 0.12 + (powerLevel - 4) * 0.04 });
            shadow.x = x;
            shadow.y = y;
            shadow.zIndex = 598;
            this.container.addChild(shadow);
            gsap.to(shadow.scale, { x: 1.8, y: 1.8, duration: 0.18, ease: 'power2.out' });
            gsap.to(shadow, { alpha: 0, duration: 0.25, onComplete: () => { if (!shadow.destroyed) shadow.destroy(); } });
        }
        
        // 7. 파워 5: 지면 충격파
        if (powerLevel >= 5) {
            setTimeout(() => {
                const groundWave = new PIXI.Graphics();
                groundWave.ellipse(0, 0, 25, 6);
                groundWave.stroke({ width: 1.5, color: 0x3a2a1a, alpha: 0.35 });
                groundWave.x = x;
                groundWave.y = y + 8;
                groundWave.zIndex = 596;
                this.container.addChild(groundWave);
                
                gsap.to(groundWave.scale, { x: 2.5, y: 1.8, duration: 0.28, ease: 'power2.out' });
                gsap.to(groundWave, { alpha: 0, duration: 0.28, onComplete: () => { if (!groundWave.destroyed) groundWave.destroy(); } });
            }, 35);
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

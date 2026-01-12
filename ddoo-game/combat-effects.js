// =====================================================
// Combat Effects System - 전투 연출 시스템
// =====================================================

const CombatEffects = {
    app: null,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(pixiApp, gameWorld = null) {
        this.app = pixiApp;
        this.container = new PIXI.Container();
        this.container.zIndex = 50;  // effects(20) 위
        this.container.sortableChildren = true;
        
        // ★ gameWorld가 있으면 그 안에 추가 (좌표 동기화)
        if (gameWorld) {
            gameWorld.addChild(this.container);
            console.log('[CombatEffects] 초기화 완료 (gameWorld)');
        } else {
            pixiApp.stage.addChild(this.container);
            console.log('[CombatEffects] 초기화 완료 (stage)');
        }
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
    // ★★★ 스피어 이펙트 (직선 투척, 스핀 파워업!) ★★★
    // ==========================================
    async spearEffect(startX, startY, endX, endY, options = {}) {
        if (!this.app) return;
        
        const {
            shaftColor = 0x8B4513,    // 갈색 나무
            metalColor = 0x888899,    // 금속색
            spearLength = 60,         // ★ 큰 창
            speed = 900,              // 직선 스피드
            gridDistance = 1,         // ★ 그리드 거리 (파워업용)
            isEnemy = false
        } = options;
        
        return new Promise(resolve => {
            // ★ 파워 레벨 (1칸부터 시작, 최대 5)
            let currentPower = 0;
            const maxPower = Math.min(5, gridDistance);
            
            // ★ 스핀 강도 (파워에 따라 증가) - 드릴처럼 축 회전!
            let spinIntensity = 0;  // 스핀 강도 (시각 효과용)
            const baseAngle = Math.atan2(endY - startY, endX - startX);
            let spinPhase = 0;  // 스핀 애니메이션 위상
            
            // 파워 레벨별 색상
            const powerColors = [
                { trail: 0xddccaa, glow: null },           // 0: 기본
                { trail: 0xeedd99, glow: 0xffcc00 },       // 1: 황금빛
                { trail: 0xffaa44, glow: 0xff8800 },       // 2: 주황
                { trail: 0xff7733, glow: 0xff4400 },       // 3: 불꽃
                { trail: 0xff4422, glow: 0xff2200 },       // 4: 맹렬
                { trail: 0xff2211, glow: 0xff0000 },       // 5: 지옥불
            ];
            
            // 스피어 컨테이너 (위치용)
            const spearContainer = new PIXI.Container();
            spearContainer.x = startX;
            spearContainer.y = startY;
            spearContainer.zIndex = 150;
            
            // 스피어 본체 (회전용)
            const spear = new PIXI.Container();
            spearContainer.addChild(spear);
            
            // === 글로우 컨테이너 (파워업용) ===
            const glowContainer = new PIXI.Container();
            glowContainer.zIndex = -1;
            spear.addChild(glowContainer);
            
            // === 창대 (나무) ===
            const shaft = new PIXI.Graphics();
            shaft.rect(-spearLength/2, -3, spearLength, 6);
            shaft.fill({ color: shaftColor });
            shaft.rect(-spearLength/2 + 5, -2, spearLength - 10, 2);
            shaft.fill({ color: 0xA67C52, alpha: 0.5 });
            spear.addChild(shaft);
            
            // === 창날 (금속, 삼각형) ===
            const head = new PIXI.Graphics();
            head.moveTo(spearLength/2 + 20, 0);
            head.lineTo(spearLength/2 - 5, -8);
            head.lineTo(spearLength/2 - 5, 8);
            head.closePath();
            head.fill({ color: metalColor });
            head.moveTo(spearLength/2 + 18, 0);
            head.lineTo(spearLength/2, -4);
            head.lineTo(spearLength/2, 4);
            head.closePath();
            head.fill({ color: 0xccccdd, alpha: 0.6 });
            head.rect(spearLength/2 - 8, -5, 6, 10);
            head.fill({ color: 0x666666 });
            spear.addChild(head);
            
            // === 창 끝 장식 (뒷부분) ===
            const pommel = new PIXI.Graphics();
            pommel.circle(-spearLength/2 - 3, 0, 4);
            pommel.fill({ color: 0x555555 });
            spear.addChild(pommel);
            
            // 초기 각도 설정 (발사 방향)
            spear.rotation = baseAngle;
            
            this.container.addChild(spearContainer);
            
            // 비행 시간
            const pixelDistance = Math.hypot(endX - startX, endY - startY);
            const duration = Math.max(0.25, pixelDistance / speed);
            
            // ★ 그리드 체크포인트 (진행률 기준)
            const checkpoints = [];
            for (let i = 1; i <= gridDistance; i++) {
                checkpoints.push(i / gridDistance);
            }
            let passedCheckpoints = 0;
            
            // ★ 파워업 함수 (스핀 강도 증가!)
            const powerUp = (power) => {
                currentPower = power;
                const colors = powerColors[Math.min(power, 5)];
                
                // ★ 스핀 강도 증가! (드릴 회전 효과)
                spinIntensity = power;
                
                // 글로우 업데이트
                glowContainer.removeChildren();
                if (colors.glow) {
                    // 외곽 글로우
                    const outerGlow = new PIXI.Graphics();
                    outerGlow.circle(15, 0, 20 + power * 4);
                    outerGlow.fill({ color: colors.glow, alpha: 0.15 + power * 0.03 });
                    glowContainer.addChild(outerGlow);
                    
                    // 코어 글로우
                    const coreGlow = new PIXI.Graphics();
                    coreGlow.circle(25, 0, 8 + power * 2);
                    coreGlow.fill({ color: 0xffffff, alpha: 0.3 });
                    glowContainer.addChild(coreGlow);
                    
                    // 펄스 애니메이션
                    gsap.to(coreGlow, {
                        alpha: 0.1,
                        duration: 0.08,
                        repeat: -1,
                        yoyo: true,
                        onUpdate: function() {
                            if (spearContainer.destroyed) this.kill();
                        }
                    });
                }
                
                // 파워업 이펙트 (스핀 강화 + 불씨 폭발)
                this.spearPowerUpEffect(spearContainer.x, spearContainer.y, power);
                
                // 스핀 강화 연출
                this.spearSpinBoostEffect(spearContainer.x, spearContainer.y, power);
                
                // 스케일 펀치
                gsap.fromTo(spear.scale, 
                    { x: 1.15, y: 0.9 },
                    { x: 1, y: 1, duration: 0.1, ease: 'power2.out' }
                );
            };
            
            // === 드릴 스핀 트레일 (축 방향 회전!) ===
            const createSpinTrail = () => {
                if (spearContainer.destroyed) return;
                
                const trail = new PIXI.Container();
                trail.x = spearContainer.x;
                trail.y = spearContainer.y;
                trail.rotation = baseAngle;  // 항상 발사 방향 유지
                trail.zIndex = 149;
                
                const colors = powerColors[Math.min(currentPower, 5)];
                const trailLength = spearLength/2 + currentPower * 8;
                const trailWidth = 3 + currentPower * 1.2;
                
                // 메인 트레일 (직선)
                const mainTrail = new PIXI.Graphics();
                mainTrail.rect(-spearLength/3, -trailWidth/2, trailLength, trailWidth);
                mainTrail.fill({ color: colors.trail, alpha: 0.4 + currentPower * 0.05 });
                trail.addChild(mainTrail);
                
                // ★ 스핀이 있으면 드릴 오라 효과!
                if (currentPower >= 1 && colors.glow) {
                    // 회전하는 오라 링 (축 방향 스핀 표현)
                    const ringCount = Math.min(3, currentPower);
                    for (let i = 0; i < ringCount; i++) {
                        const ring = new PIXI.Graphics();
                        const offset = -10 + i * 15;  // 창 축을 따라 배치
                        const ringSize = 6 + currentPower * 2 - i * 2;
                        
                        // 타원으로 3D 회전 느낌
                        const phase = spinPhase + (Math.PI * 2 / ringCount) * i;
                        const scaleY = 0.3 + Math.abs(Math.sin(phase)) * 0.4;
                        
                        ring.ellipse(offset, 0, ringSize, ringSize * scaleY);
                        ring.stroke({ width: 1.5, color: colors.glow, alpha: 0.4 - i * 0.1 });
                        trail.addChild(ring);
                    }
                }
                
                this.container.addChild(trail);
                
                gsap.to(trail, {
                    alpha: 0,
                    scaleX: 0.7,
                    duration: 0.1 + currentPower * 0.015,
                    onComplete: () => { if (!trail.destroyed) trail.destroy(); }
                });
            };
            
            // === 바람/불씨 파티클 (스핀 방향으로!) ===
            const createParticle = () => {
                if (spearContainer.destroyed) return;
                
                const colors = powerColors[Math.min(currentPower, 5)];
                
                if (currentPower >= 2) {
                    // ★ 스핀하는 불씨 파티클
                    const ember = new PIXI.Graphics();
                    const size = 1.5 + Math.random() * (1 + currentPower * 0.4);
                    ember.circle(0, 0, size);
                    ember.fill({ color: colors.glow || 0xffaa00, alpha: 0.8 });
                    
                    // 스핀 방향으로 튀어나감
                    const spinAngle = spear.rotation + (Math.random() - 0.5) * Math.PI;
                    ember.x = spearContainer.x + Math.cos(spinAngle) * 10;
                    ember.y = spearContainer.y + Math.sin(spinAngle) * 10;
                    ember.zIndex = 148;
                    this.container.addChild(ember);
                    
                    gsap.to(ember, {
                        x: ember.x + Math.cos(spinAngle) * (15 + Math.random() * 15),
                        y: ember.y + Math.sin(spinAngle) * (15 + Math.random() * 15),
                        alpha: 0,
                        duration: 0.15 + Math.random() * 0.1,
                        onComplete: () => { if (!ember.destroyed) ember.destroy(); }
                    });
                } else {
                    // 바람 파티클
                    const wind = new PIXI.Graphics();
                    wind.moveTo(0, 0);
                    wind.lineTo(-15 - Math.random() * 10, 0);
                    wind.stroke({ width: 1 + Math.random(), color: 0xffffff, alpha: 0.3 });
                    wind.x = spearContainer.x + (Math.random() - 0.5) * 20;
                    wind.y = spearContainer.y + (Math.random() - 0.5) * 15;
                    wind.rotation = baseAngle + (Math.random() - 0.5) * 0.3;
                    wind.zIndex = 148;
                    this.container.addChild(wind);
                    
                    gsap.to(wind, {
                        x: wind.x - Math.cos(baseAngle) * 30,
                        alpha: 0,
                        duration: 0.1,
                        onComplete: () => { if (!wind.destroyed) wind.destroy(); }
                    });
                }
            };
            
            const trailInterval = setInterval(createSpinTrail, 16);
            const particleInterval = setInterval(createParticle, currentPower >= 2 ? 12 : 30);
            
            // === 직선 비행 + 드릴 스핀 애니메이션 ===
            let lastTime = Date.now();
            const progress = { t: 0 };
            
            gsap.to(progress, {
                t: 1,
                duration: duration,
                ease: 'power1.in',
                onUpdate: () => {
                    if (spearContainer.destroyed) return;
                    
                    // 위치 업데이트
                    spearContainer.x = startX + (endX - startX) * progress.t;
                    spearContainer.y = startY + (endY - startY) * progress.t;
                    
                    // ★ 드릴 스핀 위상 업데이트 (창은 회전 안 함!)
                    const now = Date.now();
                    const dt = (now - lastTime) / 1000;
                    lastTime = now;
                    
                    // 스핀 강도에 따라 위상 속도 증가
                    spinPhase += spinIntensity * 15 * dt;
                    
                    // 창은 항상 발사 방향 유지!
                    spear.rotation = baseAngle;
                    
                    // ★ 체크포인트 통과 확인 (파워업!)
                    while (passedCheckpoints < checkpoints.length && progress.t >= checkpoints[passedCheckpoints]) {
                        passedCheckpoints++;
                        if (passedCheckpoints >= 1) {
                            powerUp(Math.min(5, passedCheckpoints));
                        }
                    }
                },
                onComplete: () => {
                    clearInterval(trailInterval);
                    clearInterval(particleInterval);
                    
                    // ★ 착탄 이펙트 (파워 레벨 + 스핀 강도 반영)
                    this.spearImpactEffect(endX, endY, baseAngle, currentPower, spinIntensity);
                    
                    spearContainer.destroy();
                    resolve();
                }
            });
            
            // 시전시 약간의 스케일 팝
            spear.scale.set(0.6);
            gsap.to(spear.scale, {
                x: 1, y: 1,
                duration: 0.1,
                ease: 'back.out(2)'
            });
        });
    },
    
    // ★ 스피어 파워업 이펙트 (불씨 폭발)
    spearPowerUpEffect(x, y, power) {
        if (!this.app) return;
        
        const powerColors = [0xddcc88, 0xffcc00, 0xff8800, 0xff4400, 0xff2200, 0xff0000];
        const color = powerColors[Math.min(power, 5)];
        
        // 불씨 폭발
        const count = 3 + power * 2;
        for (let i = 0; i < count; i++) {
            const ember = new PIXI.Graphics();
            const size = 1 + Math.random() * (1.5 + power * 0.3);
            ember.circle(0, 0, size);
            ember.fill({ color, alpha: 0.8 });
            ember.x = x;
            ember.y = y;
            ember.zIndex = 160;
            this.container.addChild(ember);
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const dist = 12 + Math.random() * 18;
            
            gsap.to(ember, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 8,
                alpha: 0,
                duration: 0.2 + Math.random() * 0.1,
                ease: 'power2.out',
                onComplete: () => { if (!ember.destroyed) ember.destroy(); }
            });
        }
        
        // 충격 링
        const ring = new PIXI.Graphics();
        ring.circle(0, 0, 10 + power * 3);
        ring.stroke({ width: 2, color: color, alpha: 0.6 });
        ring.x = x;
        ring.y = y;
        ring.zIndex = 159;
        this.container.addChild(ring);
        
        gsap.to(ring, {
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 0.15,
            onComplete: () => { if (!ring.destroyed) ring.destroy(); }
        });
    },
    
    // ★ 스핀 부스트 이펙트 (드릴 회전 강화 표현)
    spearSpinBoostEffect(x, y, power) {
        if (!this.app) return;
        
        const powerColors = [0xddcc88, 0xffcc00, 0xff8800, 0xff4400, 0xff2200, 0xff0000];
        const color = powerColors[Math.min(power, 5)];
        
        // ★ 드릴 링 이펙트 (축 방향 회전 표현)
        const ringCount = 2 + power;
        for (let i = 0; i < ringCount; i++) {
            const ring = new PIXI.Graphics();
            const ringSize = 15 + power * 3;
            
            // 타원으로 3D 회전 느낌
            ring.ellipse(0, 0, ringSize, ringSize * 0.4);
            ring.stroke({ width: 2 + power * 0.3, color: color, alpha: 0.6 });
            
            ring.x = x;
            ring.y = y;
            ring.rotation = (Math.PI / ringCount) * i;
            ring.zIndex = 161;
            this.container.addChild(ring);
            
            // 확대되면서 회전하고 사라짐
            gsap.to(ring, {
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 0.2 + i * 0.03,
                ease: 'power2.out',
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
        
        // "DRILL!" 텍스트 (파워 2 이상)
        if (power >= 2) {
            const spinText = new PIXI.Text({
                text: power >= 4 ? '🔥 MAX DRILL!' : `⚡ DRILL x${power}`,
                style: {
                    fontSize: 11 + power * 2,
                    fontWeight: 'bold',
                    fill: color,
                    stroke: { color: 0x000000, width: 3 }
                }
            });
            spinText.anchor.set(0.5);
            spinText.x = x;
            spinText.y = y - 25;
            spinText.zIndex = 162;
            this.container.addChild(spinText);
            
            gsap.to(spinText, {
                y: y - 40,
                alpha: 0,
                duration: 0.35,
                ease: 'power2.out',
                onComplete: () => { if (!spinText.destroyed) spinText.destroy(); }
            });
        }
    },
    
    // 스피어 착탄 이펙트 (★ 파워 레벨 + 드릴 스핀 반영)
    spearImpactEffect(x, y, angle, power = 0, spinIntensity = 0) {
        if (!this.app) return;
        
        const powerColors = [0xffffff, 0xffcc00, 0xff8800, 0xff4400, 0xff2200, 0xff0000];
        const impactColor = powerColors[Math.min(power, 5)];
        
        // ★ 드릴 스핀이 강할수록 관통 이펙트!
        if (power >= 2) {
            // 드릴링 효과 (동심원 링들)
            const drillRingCount = power + 1;
            for (let i = 0; i < drillRingCount; i++) {
                const drillRing = new PIXI.Graphics();
                const ringSize = 12 + power * 4;
                
                // 3D 드릴링 느낌의 타원
                drillRing.ellipse(0, 0, ringSize, ringSize * 0.35);
                drillRing.stroke({ width: 2 + power * 0.5, color: impactColor, alpha: 0.6 });
                drillRing.rotation = angle;  // 창 방향으로 정렬
                drillRing.x = x;
                drillRing.y = y;
                drillRing.zIndex = 201;
                this.container.addChild(drillRing);
                
                gsap.to(drillRing, {
                    scaleX: 2.5 + i * 0.3,
                    scaleY: 2.5 + i * 0.3,
                    alpha: 0,
                    duration: 0.2 + i * 0.05,
                    delay: i * 0.03,
                    ease: 'power2.out',
                    onComplete: () => { if (!drillRing.destroyed) drillRing.destroy(); }
                });
            }
        }
        
        // 충격파 (파워에 따라 크기 증가)
        const shockwave = new PIXI.Graphics();
        shockwave.circle(0, 0, 15 + power * 5);
        shockwave.stroke({ width: 3 + power, color: impactColor, alpha: 0.8 });
        shockwave.x = x;
        shockwave.y = y;
        shockwave.zIndex = 200;
        this.container.addChild(shockwave);
        
        gsap.to(shockwave, {
            scaleX: 2.5 + power * 0.3,
            scaleY: 2.5 + power * 0.3,
            alpha: 0,
            duration: 0.25,
            ease: 'power2.out',
            onComplete: () => shockwave.destroy()
        });
        
        // ★ 드릴 파편 (창 방향 + 방사형)
        const sparkCount = 8 + power * 3;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.rect(-3, -1, 6, 2);
            spark.fill({ color: power >= 2 ? impactColor : 0xffffaa });
            spark.x = x;
            spark.y = y;
            spark.zIndex = 199;
            this.container.addChild(spark);
            
            // 방사형으로 퍼짐
            const sparkAngle = angle + Math.PI + (Math.PI * 2 / sparkCount) * i;
            const dist = 20 + Math.random() * (30 + power * 8);
            
            gsap.to(spark, {
                x: x + Math.cos(sparkAngle) * dist,
                y: y + Math.sin(sparkAngle) * dist,
                rotation: Math.random() * Math.PI * 4,
                alpha: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => spark.destroy()
            });
        }
        
        // 먼지 구름 (파워에 따라 크기/수 증가)
        const dustCount = 5 + power * 2;
        for (let i = 0; i < dustCount; i++) {
            const dust = new PIXI.Graphics();
            const size = 8 + Math.random() * (8 + power * 3);
            dust.circle(0, 0, size);
            dust.fill({ color: power >= 3 ? 0x554433 : 0x887766, alpha: 0.5 });
            dust.x = x + (Math.random() - 0.5) * (20 + power * 5);
            dust.y = y + Math.random() * 10;
            dust.zIndex = 198;
            this.container.addChild(dust);
            
            gsap.to(dust, {
                y: dust.y - 20 - Math.random() * (15 + power * 3),
                scaleX: 1.5 + power * 0.2,
                scaleY: 1.5 + power * 0.2,
                alpha: 0,
                duration: 0.4,
                ease: 'power1.out',
                onComplete: () => dust.destroy()
            });
        }
        
        // ★ 파워 3 이상: 지면 충격파
        if (power >= 3) {
            const groundWave = new PIXI.Graphics();
            groundWave.ellipse(0, 0, 20 + power * 5, 6);
            groundWave.stroke({ width: 2, color: 0x664422, alpha: 0.4 });
            groundWave.x = x;
            groundWave.y = y + 8;
            groundWave.zIndex = 197;
            this.container.addChild(groundWave);
            
            gsap.to(groundWave, {
                scaleX: 2.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 0.3,
                onComplete: () => { if (!groundWave.destroyed) groundWave.destroy(); }
            });
        }
        
        // 화면 흔들림 (파워에 따라 강화)
        this.screenShake(6 + power * 3, 100 + power * 30);
    },
    
    // ==========================================
    // 파이어볼 이펙트 (3D 파티클 시스템) - 볼류메트릭 버전
    // ==========================================
    async fireballEffect(startX, startY, endX, endY) {
        if (!this.app) return;
        
        // 시전 이펙트
        this.screenFlash('#ff4400', 50, 0.2);
        
        return new Promise(resolve => {
            // 파이어볼 컨테이너
            const fireball = new PIXI.Container();
            fireball.x = startX;
            fireball.y = startY;
            fireball.zIndex = 200;
            this.container.addChild(fireball);
            
            // ========================================
            // 3D 파티클 시스템 - 궤도 파티클들 (경량화)
            // ========================================
            const orbitParticles = [];
            const NUM_ORBITS = 2;  // 궤도 레이어 수 (3→2)
            const PARTICLES_PER_ORBIT = 5;  // 궤도당 파티클 (8→5)
            
            // 각 궤도 레이어 생성
            for (let orbit = 0; orbit < NUM_ORBITS; orbit++) {
                const orbitRadius = 20 + orbit * 12;
                const orbitSpeed = 0.15 - orbit * 0.03;  // 안쪽이 더 빠름
                const baseSize = 8 - orbit * 2;
                
                for (let i = 0; i < PARTICLES_PER_ORBIT; i++) {
                    const particle = new PIXI.Graphics();
                    const angle = (i / PARTICLES_PER_ORBIT) * Math.PI * 2;
                    const size = baseSize + Math.random() * 4;
                    
                    // 깊이에 따른 색상 (안쪽 = 밝음, 바깥 = 어두움)
                    const colors = [0xffffcc, 0xffcc44, 0xff8800, 0xff5500, 0xff3300];
                    const colorIdx = Math.min(orbit + Math.floor(Math.random() * 2), colors.length - 1);
                    
                    particle.circle(0, 0, size);
                    particle.fill({ color: colors[colorIdx], alpha: 0.9 - orbit * 0.2 });
                    
                    // 3D 느낌의 초기 위치
                    particle._angle = angle;
                    particle._orbit = orbitRadius;
                    particle._speed = orbitSpeed * (Math.random() * 0.4 + 0.8);
                    particle._zPhase = Math.random() * Math.PI * 2;  // Z축 위상
                    particle._baseSize = size;
                    
                    fireball.addChild(particle);
                    orbitParticles.push(particle);
                }
            }
            
            // === 볼류메트릭 코어 (다층 글로우) ===
            const glowLayers = [];
            for (let i = 4; i >= 0; i--) {
                const glow = new PIXI.Graphics();
                const radius = 8 + i * 8;
                const alpha = 0.15 + (4 - i) * 0.15;
                const colors = [0xffffee, 0xffdd66, 0xffaa33, 0xff7722, 0xff4400];
                
                glow.circle(0, 0, radius);
                glow.fill({ color: colors[i], alpha: alpha });
                fireball.addChild(glow);
                glowLayers.push(glow);
            }
            
            // === 밝은 핫스팟 코어 ===
            const hotCore = new PIXI.Graphics();
            hotCore.circle(0, 0, 6);
            hotCore.fill({ color: 0xffffff, alpha: 1 });
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
            
            // 파티클 생성 인터벌 (경량화: 빈도 낮춤)
            const trailInterval = setInterval(createVolumetricTrail, 30);   // 15→30
            const sparkInterval = setInterval(createSpark, 25);             // 12→25
            const smokeInterval = setInterval(createVolumetricSmoke, 100);  // 60→100
            
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
        
        // 강력한 화면 효과
        this.screenShake(18, 250);
        this.screenFlash('#ff4400', 120, 0.6);
        this.hitStop(50);
        
        // ========================================
        // 초기 플래시 (3중 레이어)
        // ========================================
        for (let i = 0; i < 3; i++) {
            const flash = new PIXI.Graphics();
            flash.x = x;
            flash.y = y;
            flash.zIndex = 260 - i * 5;
            
            const radius = 50 + i * 30;
            const colors = [0xffffff, 0xffffcc, 0xffdd88];
            const alphas = [0.95, 0.7, 0.5];
            
            flash.circle(0, 0, radius);
            flash.fill({ color: colors[i], alpha: alphas[i] });
            this.container.addChild(flash);
            
            gsap.to(flash, {
                alpha: 0,
                duration: 0.1 + i * 0.03,
                onComplete: () => { if (!flash.destroyed) flash.destroy(); }
            });
            
            gsap.to(flash.scale, {
                x: 1.8 - i * 0.2, y: 1.8 - i * 0.2,
                duration: 0.1 + i * 0.03
            });
        }
        
        // ========================================
        // 3D 폭발 구체 (다층 글로우)
        // ========================================
        const sphereContainer = new PIXI.Container();
        sphereContainer.x = x;
        sphereContainer.y = y;
        sphereContainer.zIndex = 245;
        this.container.addChild(sphereContainer);
        
        // 볼류메트릭 구체 레이어들
        for (let layer = 5; layer >= 0; layer--) {
            const sphere = new PIXI.Graphics();
            const radius = 15 + layer * 12;
            const colors = [0xffffff, 0xffee88, 0xffcc44, 0xff9922, 0xff6600, 0xff3300];
            const alpha = 0.9 - layer * 0.12;
            
            sphere.circle(0, 0, radius);
            sphere.fill({ color: colors[layer], alpha: alpha });
            sphereContainer.addChild(sphere);
        }
        
        // 구체 확장 + 소멸
        gsap.to(sphereContainer.scale, {
            x: 2.5, y: 2.2,  // 약간 비대칭 (3D 느낌)
            duration: 0.25,
            ease: 'power2.out'
        });
        gsap.to(sphereContainer, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => { if (!sphereContainer.destroyed) sphereContainer.destroy({ children: true }); }
        });
        
        // ========================================
        // 3D 충격파 링 (다중 레이어)
        // ========================================
        for (let r = 0; r < 3; r++) {
            const ring = new PIXI.Graphics();
            ring.x = x;
            ring.y = y;
            ring.zIndex = 240 - r * 3;
            
            const ringRadius = 20 + r * 10;
            const colors = [0xffdd66, 0xff8844, 0xff5522];
            const widths = [8, 5, 3];
            
            ring.circle(0, 0, ringRadius);
            ring.stroke({ color: colors[r], width: widths[r], alpha: 0.9 - r * 0.2 });
            this.container.addChild(ring);
            
            // 3D 느낌의 비대칭 확장
            gsap.to(ring.scale, {
                x: 7 - r, y: 5 - r * 0.5,  // Y축 압축
                duration: 0.35 + r * 0.05,
                ease: 'power2.out'
            });
            gsap.to(ring, {
                alpha: 0,
                duration: 0.35 + r * 0.05,
                delay: r * 0.02,
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
        
        // ========================================
        // 3D 화염 파편 (깊이별 레이어) - 경량화
        // ========================================
        const NUM_DEBRIS = 18;  // 36→18
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
        // 3D 연기 볼륨 (경량화)
        // ========================================
        for (let i = 0; i < 5; i++) {  // 10→5
            const smokeContainer = new PIXI.Container();
            const offsetX = (Math.random() - 0.5) * 70;
            const offsetY = (Math.random() - 0.5) * 40;
            smokeContainer.x = x + offsetX;
            smokeContainer.y = y + offsetY;
            smokeContainer.zIndex = 205;
            this.container.addChild(smokeContainer);
            
            // 다층 연기 (볼륨감)
            for (let s = 2; s >= 0; s--) {
                const smoke = new PIXI.Graphics();
                const size = 15 + s * 8 + Math.random() * 10;
                const colors = [0x111111, 0x222222, 0x333333];
                const alpha = 0.4 - s * 0.1;
                
                smoke.circle(s * 3, s * 2, size);  // 약간 오프셋 (3D 깊이)
                smoke.fill({ color: colors[s], alpha: alpha });
                smokeContainer.addChild(smoke);
            }
            
            // 연기 상승
            gsap.to(smokeContainer, {
                y: smokeContainer.y - 70 - Math.random() * 50,
                x: smokeContainer.x + (Math.random() - 0.5) * 40,
                alpha: 0,
                duration: 0.8 + Math.random() * 0.4,
                delay: i * 0.03,
                ease: 'power2.out',
                onComplete: () => { if (!smokeContainer.destroyed) smokeContainer.destroy({ children: true }); }
            });
            
            gsap.to(smokeContainer.scale, {
                x: 2.5 + Math.random(), y: 2 + Math.random(),
                duration: 0.8
            });
        }
        
        // ========================================
        // 떠오르는 불씨 파티클 (경량화)
        // ========================================
        for (let i = 0; i < 10; i++) {  // 20→10
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
        // 바닥 스콜치 마크 (잔여 효과) - 20% 축소
        // ========================================
        const scorch = new PIXI.Graphics();
        scorch.x = x;
        scorch.y = y + 20;  // 바닥 쪽
        scorch.zIndex = 180;
        
        // 타원형 스콜치 (50,20 → 40,16 = 20% 축소)
        scorch.ellipse(0, 0, 40, 16);
        scorch.fill({ color: 0x111111, alpha: 0.35 });
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
        
        // ★ 피 효과 자동 발생 (대미지 타입일 때만)
        const damageTypes = ['normal', 'critical', 'bash', 'flurry', 'burn', 'poison', 'dot', 'bleed'];
        console.log(`[CombatEffects] showDamageNumber: type=${type}, damage=${damage}, BloodEffect=${typeof BloodEffect}`);
        if (typeof BloodEffect !== 'undefined' && damageTypes.includes(type) && damage > 0) {
            console.log('[CombatEffects] BloodEffect.onDamage 호출!');
            BloodEffect.onDamage(x, y, damage, { type: type });
        }
        
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
            },
            bleed: { 
                fill: '#cc0000',
                stroke: '#330000',
                fontSize: 42,
                prefix: '🩸'
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
        
        // ★ 쉴드 글로우 추가/강화
        this.addShieldGlow(unit);
    },
    
    // ==========================================
    // ★ 쉴드 외곽선 글로우 시스템
    // ==========================================
    
    /**
     * 유닛에 쉴드 글로우 추가
     * @param {Object} unit - 유닛 객체
     */
    addShieldGlow(unit) {
        if (!unit || !unit.sprite) return;
        
        const sprite = unit.sprite;
        const container = unit.container || sprite;
        
        // 이미 글로우가 있으면 강화만
        if (unit.shieldGlow) {
            this.pulseShieldGlow(unit);
            return;
        }
        
        // 글로우 컨테이너 생성
        const glowContainer = new PIXI.Container();
        glowContainer.zIndex = -5;  // 스프라이트 뒤에
        glowContainer.isShieldGlow = true;
        
        // 외곽선 글로우 (여러 겹으로)
        const glowLayers = [];
        const baseColor = 0x4488ff;
        const glowSizes = [1.15, 1.10, 1.05];
        const glowAlphas = [0.15, 0.25, 0.4];
        
        for (let i = 0; i < glowSizes.length; i++) {
            const glow = new PIXI.Graphics();
            
            // 스프라이트 크기에 맞춰 외곽선 생성
            const spriteWidth = sprite.width || 100;
            const spriteHeight = sprite.height || 100;
            const scale = glowSizes[i];
            
            // 둥근 사각형으로 외곽선
            glow.roundRect(
                -spriteWidth * scale / 2,
                -spriteHeight * scale / 2,
                spriteWidth * scale,
                spriteHeight * scale,
                15
            );
            glow.fill({ color: baseColor, alpha: glowAlphas[i] });
            
            glow.y = -spriteHeight / 2 + 10;  // 스프라이트 중심으로
            glowLayers.push(glow);
            glowContainer.addChild(glow);
        }
        
        // 외곽 라인 (실제 외곽선)
        const outline = new PIXI.Graphics();
        const spriteWidth = sprite.width || 100;
        const spriteHeight = sprite.height || 100;
        
        outline.roundRect(
            -spriteWidth * 1.02 / 2,
            -spriteHeight * 1.02 / 2,
            spriteWidth * 1.02,
            spriteHeight * 1.02,
            12
        );
        outline.stroke({ color: 0x66ccff, width: 3, alpha: 0.8 });
        outline.y = -spriteHeight / 2 + 10;
        glowContainer.addChild(outline);
        
        // 컨테이너에 추가
        if (container !== sprite) {
            container.addChildAt(glowContainer, 0);  // 맨 뒤에
        } else {
            // sprite만 있는 경우 부모에 추가
            const parent = sprite.parent;
            if (parent) {
                const idx = parent.getChildIndex(sprite);
                parent.addChildAt(glowContainer, idx);
                glowContainer.x = sprite.x;
                glowContainer.y = sprite.y;
            }
        }
        
        unit.shieldGlow = glowContainer;
        unit.shieldGlowLayers = glowLayers;
        unit.shieldGlowOutline = outline;
        
        // 등장 애니메이션
        glowContainer.alpha = 0;
        glowContainer.scale.set(0.8);
        
        gsap.to(glowContainer, {
            alpha: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
        gsap.to(glowContainer.scale, {
            x: 1, y: 1,
            duration: 0.3,
            ease: 'back.out(2)'
        });
        
        // 숨쉬기 애니메이션 시작
        this.startShieldBreathing(unit);
        
        // 강조 펄스
        this.pulseShieldGlow(unit);
    },
    
    /**
     * 쉴드 글로우 펄스 효과 (획득 시)
     */
    pulseShieldGlow(unit) {
        if (!unit.shieldGlow || !unit.shieldGlowOutline) return;
        
        const outline = unit.shieldGlowOutline;
        
        // 밝게 펄스
        gsap.timeline()
            .to(unit.shieldGlow, {
                alpha: 1.5,
                duration: 0.15,
                ease: 'power2.out'
            })
            .to(unit.shieldGlow, {
                alpha: 1,
                duration: 0.3,
                ease: 'power2.inOut'
            });
        
        // 외곽선 확대 펄스
        gsap.timeline()
            .to(unit.shieldGlow.scale, {
                x: 1.15, y: 1.15,
                duration: 0.15,
                ease: 'power2.out'
            })
            .to(unit.shieldGlow.scale, {
                x: 1, y: 1,
                duration: 0.25,
                ease: 'power2.inOut'
            });
    },
    
    /**
     * 쉴드 숨쉬기 애니메이션
     */
    startShieldBreathing(unit) {
        if (!unit.shieldGlow) return;
        
        // 기존 애니메이션 정리
        if (unit.shieldBreathTween) {
            unit.shieldBreathTween.kill();
        }
        
        // 숨쉬기 (글로우 크기 변화)
        unit.shieldBreathTween = gsap.to({ val: 0 }, {
            val: Math.PI * 2,
            duration: 2,
            repeat: -1,
            ease: 'none',
            onUpdate: function() {
                if (!unit.shieldGlow || unit.shieldGlow.destroyed) {
                    this.kill();
                    return;
                }
                const v = this.targets()[0].val;
                const breathScale = 1 + Math.sin(v) * 0.03;
                const breathAlpha = 0.85 + Math.sin(v) * 0.15;
                
                unit.shieldGlow.scale.set(breathScale);
                unit.shieldGlow.alpha = breathAlpha;
            }
        });
    },
    
    /**
     * 쉴드 글로우 제거
     */
    removeShieldGlow(unit) {
        if (!unit.shieldGlow) return;
        
        const glow = unit.shieldGlow;
        
        // 애니메이션 정리
        if (unit.shieldBreathTween) {
            unit.shieldBreathTween.kill();
            unit.shieldBreathTween = null;
        }
        
        // 페이드 아웃 후 제거
        gsap.to(glow, {
            alpha: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                if (glow && !glow.destroyed) {
                    glow.destroy({ children: true });
                }
            }
        });
        gsap.to(glow.scale, {
            x: 0.8, y: 0.8,
            duration: 0.3,
            ease: 'power2.in'
        });
        
        unit.shieldGlow = null;
        unit.shieldGlowLayers = null;
        unit.shieldGlowOutline = null;
    },
    
    /**
     * 쉴드 상태 업데이트 (block 값에 따라)
     */
    updateShieldGlow(unit) {
        if (!unit) return;
        
        const hasBlock = (unit.block || 0) > 0;
        
        if (hasBlock && !unit.shieldGlow) {
            this.addShieldGlow(unit);
        } else if (!hasBlock && unit.shieldGlow) {
            this.removeShieldGlow(unit);
        }
    },
    
    // ★ 슬라임 분열 경고 VFX
    showSplitWarning(x, y) {
        if (!this.app) return;
        
        // 경고 텍스트
        const warningText = new PIXI.Text({
            text: '💥 분열 준비!',
            style: {
                fontSize: 16,
                fontWeight: 'bold',
                fill: '#ff4444',
                stroke: { color: '#000000', width: 4 }
            }
        });
        warningText.anchor.set(0.5);
        warningText.x = x;
        warningText.y = y;
        warningText.zIndex = 500;
        this.container.addChild(warningText);
        
        // 애니메이션
        gsap.fromTo(warningText, 
            { y: y + 20, alpha: 0, scale: 0.5 },
            { 
                y: y - 10, 
                alpha: 1, 
                scale: 1.2,
                duration: 0.3,
                ease: 'back.out(2)',
                onComplete: () => {
                    gsap.to(warningText, {
                        y: y - 30,
                        alpha: 0,
                        duration: 0.5,
                        delay: 0.5,
                        onComplete: () => { if (!warningText.destroyed) warningText.destroy(); }
                    });
                }
            }
        );
        
        // 위험 링 이펙트
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 20 + i * 10);
            ring.stroke({ width: 2, color: 0xff4444, alpha: 0.6 });
            ring.x = x;
            ring.y = y + 30;
            ring.zIndex = 499;
            this.container.addChild(ring);
            
            gsap.to(ring, {
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 0.4,
                delay: i * 0.1,
                ease: 'power2.out',
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
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

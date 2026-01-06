// ==========================================
// PixiJS 기반 발사체 시스템
// PlayerRenderer/EnemyRenderer와 동일한 PixiJS 앱 사용
// ==========================================

const PixiProjectile = {
    app: null,
    container: null,
    projectiles: [],
    initialized: false,
    enabled: true,
    
    // ==========================================
    // 초기화
    // ==========================================
    async init() {
        if (this.initialized) return;
        
        // EnemyRenderer 또는 PlayerRenderer의 앱 재사용
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.app) {
            this.app = EnemyRenderer.app;
        } else if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.app) {
            this.app = PlayerRenderer.app;
        } else {
            console.warn('[PixiProjectile] PixiJS 앱을 찾을 수 없음, 비활성화');
            this.enabled = false;
            return;
        }
        
        // 발사체 전용 컨테이너 (최상위 레이어)
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.container.zIndex = 1000; // 최상위
        this.app.stage.addChild(this.container);
        
        // 애니메이션 루프
        this.app.ticker.add(this.update.bind(this));
        
        this.initialized = true;
        console.log('[PixiProjectile] 초기화 완료');
    },
    
    // ==========================================
    // 업데이트 루프
    // ==========================================
    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            if (proj.alive) {
                proj.update(delta);
            } else {
                // 정리
                if (proj.container) {
                    this.container.removeChild(proj.container);
                    proj.container.destroy({ children: true });
                }
                this.projectiles.splice(i, 1);
            }
        }
    },
    
    // ==========================================
    // 플레이어 → 적 발사체 (편의 메서드)
    // ==========================================
    fireAtEnemy(enemyIndex = 0, options = {}) {
        const playerPos = this.getPlayerPosition();
        const enemyPos = this.getEnemyPosition(enemyIndex);
        
        if (!playerPos || !enemyPos) {
            console.warn('[PixiProjectile] 위치를 찾을 수 없음');
            return;
        }
        
        this.projectile(playerPos.centerX, playerPos.centerY, enemyPos.centerX, enemyPos.centerY, options);
    },
    
    // ==========================================
    // 적 → 플레이어 발사체 (편의 메서드)
    // ==========================================
    fireAtPlayer(enemyIndex = 0, options = {}) {
        const playerPos = this.getPlayerPosition();
        const enemyPos = this.getEnemyPosition(enemyIndex);
        
        if (!playerPos || !enemyPos) {
            console.warn('[PixiProjectile] 위치를 찾을 수 없음');
            return;
        }
        
        this.projectile(enemyPos.centerX, enemyPos.centerY, playerPos.centerX, playerPos.centerY, options);
    },
    
    // ==========================================
    // 에너지 투사체
    // ==========================================
    projectile(fromX, fromY, toX, toY, options = {}) {
        if (!this.initialized || !this.enabled) {
            // 폴백: 기존 VFX 시스템
            if (typeof VFX !== 'undefined') {
                VFX.projectile(fromX, fromY, toX, toY, options);
            }
            return;
        }
        
        const {
            color = '#a855f7',
            size = 15,
            speed = 15,
            trail = true,
            onHit = null,
            glow = true
        } = options;
        
        const projContainer = new PIXI.Container();
        projContainer.x = fromX;
        projContainer.y = fromY;
        projContainer.zIndex = 100;
        
        // 메인 발사체 (그라디언트 원)
        const mainGraphics = new PIXI.Graphics();
        const colorNum = this.parseColor(color);
        
        // 글로우 효과
        if (glow) {
            mainGraphics.circle(0, 0, size * 1.5);
            mainGraphics.fill({ color: colorNum, alpha: 0.3 });
        }
        
        // 코어
        mainGraphics.circle(0, 0, size);
        mainGraphics.fill({ color: colorNum, alpha: 0.8 });
        
        // 밝은 중심
        mainGraphics.circle(0, 0, size * 0.5);
        mainGraphics.fill({ color: 0xffffff, alpha: 0.9 });
        
        projContainer.addChild(mainGraphics);
        this.container.addChild(projContainer);
        
        // 트레일 컨테이너
        const trailContainer = new PIXI.Container();
        trailContainer.zIndex = 99;
        this.container.addChild(trailContainer);
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        const proj = {
            container: projContainer,
            trailContainer: trailContainer,
            trails: [],
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            size,
            color: colorNum,
            colorHex: color,
            trail,
            alive: true,
            
            update(delta) {
                this.x += this.vx * delta;
                this.y += this.vy * delta;
                
                this.container.x = this.x;
                this.container.y = this.y;
                
                // 트레일 생성
                if (this.trail && Math.random() > 0.3) {
                    const trailGraphics = new PIXI.Graphics();
                    trailGraphics.circle(0, 0, this.size * 0.6);
                    trailGraphics.fill({ color: this.color, alpha: 0.6 });
                    trailGraphics.x = this.x;
                    trailGraphics.y = this.y;
                    this.trailContainer.addChild(trailGraphics);
                    this.trails.push({ graphics: trailGraphics, alpha: 0.6 });
                }
                
                // 트레일 페이드
                for (let i = this.trails.length - 1; i >= 0; i--) {
                    const t = this.trails[i];
                    t.alpha -= 0.08 * delta;
                    t.graphics.alpha = t.alpha;
                    t.graphics.scale.set(t.alpha);
                    
                    if (t.alpha <= 0) {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                        this.trails.splice(i, 1);
                    }
                }
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2.5) {
                    this.alive = false;
                    
                    // 충돌 이펙트
                    PixiProjectile.createImpact(this.targetX, this.targetY, this.color, this.size * 3);
                    
                    // 트레일 정리
                    this.trails.forEach(t => {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                    });
                    PixiProjectile.container.removeChild(this.trailContainer);
                    this.trailContainer.destroy();
                    
                    if (onHit) onHit();
                }
            }
        };
        
        this.projectiles.push(proj);
    },
    
    // ==========================================
    // 화살 투사체
    // ==========================================
    arrow(fromX, fromY, toX, toY, options = {}) {
        if (!this.initialized || !this.enabled) {
            if (typeof VFX !== 'undefined') {
                VFX.arrow(fromX, fromY, toX, toY, options);
            }
            return;
        }
        
        const {
            color = '#8B4513',
            speed = 25,
            onHit = null
        } = options;
        
        const projContainer = new PIXI.Container();
        projContainer.x = fromX;
        projContainer.y = fromY;
        projContainer.zIndex = 100;
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        projContainer.rotation = angle;
        
        // 화살 그래픽
        const arrowGraphics = new PIXI.Graphics();
        const woodColor = this.parseColor(color);
        
        // 화살대
        arrowGraphics.rect(-25, -2, 30, 4);
        arrowGraphics.fill({ color: woodColor });
        
        // 화살촉 (삼각형)
        arrowGraphics.moveTo(10, 0);
        arrowGraphics.lineTo(0, -6);
        arrowGraphics.lineTo(0, 6);
        arrowGraphics.closePath();
        arrowGraphics.fill({ color: 0x9ca3af });
        
        // 깃털
        arrowGraphics.moveTo(-25, 0);
        arrowGraphics.lineTo(-30, -5);
        arrowGraphics.lineTo(-28, 0);
        arrowGraphics.closePath();
        arrowGraphics.fill({ color: 0xef4444 });
        
        arrowGraphics.moveTo(-25, 0);
        arrowGraphics.lineTo(-30, 5);
        arrowGraphics.lineTo(-28, 0);
        arrowGraphics.closePath();
        arrowGraphics.fill({ color: 0xef4444 });
        
        projContainer.addChild(arrowGraphics);
        this.container.addChild(projContainer);
        
        // 트레일 컨테이너
        const trailContainer = new PIXI.Container();
        trailContainer.zIndex = 99;
        this.container.addChild(trailContainer);
        
        const proj = {
            container: projContainer,
            trailContainer: trailContainer,
            trails: [],
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            angle,
            alive: true,
            
            update(delta) {
                this.x += this.vx * delta;
                this.y += this.vy * delta;
                
                this.container.x = this.x;
                this.container.y = this.y;
                
                // 트레일 생성
                if (Math.random() > 0.6) {
                    const trailGraphics = new PIXI.Graphics();
                    trailGraphics.circle(0, 0, 2);
                    trailGraphics.fill({ color: 0xf59e0b, alpha: 0.5 });
                    trailGraphics.x = this.x - Math.cos(this.angle) * 15;
                    trailGraphics.y = this.y - Math.sin(this.angle) * 15;
                    this.trailContainer.addChild(trailGraphics);
                    this.trails.push({ graphics: trailGraphics, alpha: 0.5 });
                }
                
                // 트레일 페이드
                for (let i = this.trails.length - 1; i >= 0; i--) {
                    const t = this.trails[i];
                    t.alpha -= 0.06 * delta;
                    t.graphics.alpha = t.alpha;
                    
                    if (t.alpha <= 0) {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                        this.trails.splice(i, 1);
                    }
                }
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2.5) {
                    this.alive = false;
                    
                    // 충돌 이펙트
                    PixiProjectile.createImpact(this.targetX, this.targetY, 0xef4444, 40);
                    PixiProjectile.createSparks(this.targetX, this.targetY, 0xffd700, 6);
                    
                    // 트레일 정리
                    this.trails.forEach(t => {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                    });
                    PixiProjectile.container.removeChild(this.trailContainer);
                    this.trailContainer.destroy();
                    
                    if (onHit) onHit();
                }
            }
        };
        
        this.projectiles.push(proj);
    },
    
    // ==========================================
    // 단검 투사체 (회전)
    // ==========================================
    dagger(fromX, fromY, toX, toY, options = {}) {
        if (!this.initialized || !this.enabled) {
            if (typeof VFX !== 'undefined') {
                VFX.dagger(fromX, fromY, toX, toY, options);
            }
            return;
        }
        
        const {
            color = '#c0c0c0',
            glowColor = '#60a5fa',
            size = 50,
            speed = 30,
            spinSpeed = 20,
            onHit = null
        } = options;
        
        const projContainer = new PIXI.Container();
        projContainer.x = fromX;
        projContainer.y = fromY;
        projContainer.zIndex = 100;
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        // 단검 그래픽
        const daggerGraphics = new PIXI.Graphics();
        const metalColor = this.parseColor(color);
        const glowNum = this.parseColor(glowColor);
        
        // 칼날
        daggerGraphics.moveTo(size * 0.5, 0);
        daggerGraphics.lineTo(0, -size * 0.1);
        daggerGraphics.lineTo(-size * 0.3, 0);
        daggerGraphics.lineTo(0, size * 0.1);
        daggerGraphics.closePath();
        daggerGraphics.fill({ color: metalColor });
        
        // 손잡이
        daggerGraphics.rect(-size * 0.5, -size * 0.05, size * 0.2, size * 0.1);
        daggerGraphics.fill({ color: 0x4b3621 });
        
        projContainer.addChild(daggerGraphics);
        this.container.addChild(projContainer);
        
        // 트레일 컨테이너
        const trailContainer = new PIXI.Container();
        trailContainer.zIndex = 99;
        this.container.addChild(trailContainer);
        
        const proj = {
            container: projContainer,
            trailContainer: trailContainer,
            trails: [],
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            spinSpeed: spinSpeed * 0.1,
            rotation: 0,
            glowColor: glowNum,
            alive: true,
            
            update(delta) {
                this.x += this.vx * delta;
                this.y += this.vy * delta;
                this.rotation += this.spinSpeed * delta;
                
                this.container.x = this.x;
                this.container.y = this.y;
                this.container.rotation = this.rotation;
                
                // 글로우 트레일
                if (Math.random() > 0.4) {
                    const trailGraphics = new PIXI.Graphics();
                    trailGraphics.circle(0, 0, 4);
                    trailGraphics.fill({ color: this.glowColor, alpha: 0.6 });
                    trailGraphics.x = this.x;
                    trailGraphics.y = this.y;
                    this.trailContainer.addChild(trailGraphics);
                    this.trails.push({ graphics: trailGraphics, alpha: 0.6 });
                }
                
                // 트레일 페이드
                for (let i = this.trails.length - 1; i >= 0; i--) {
                    const t = this.trails[i];
                    t.alpha -= 0.1 * delta;
                    t.graphics.alpha = t.alpha;
                    
                    if (t.alpha <= 0) {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                        this.trails.splice(i, 1);
                    }
                }
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2) {
                    this.alive = false;
                    
                    // 충돌 이펙트
                    PixiProjectile.createImpact(this.targetX, this.targetY, this.glowColor, 50);
                    PixiProjectile.createSparks(this.targetX, this.targetY, 0xffffff, 8);
                    
                    // 트레일 정리
                    this.trails.forEach(t => {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                    });
                    PixiProjectile.container.removeChild(this.trailContainer);
                    this.trailContainer.destroy();
                    
                    if (onHit) onHit();
                }
            }
        };
        
        this.projectiles.push(proj);
    },
    
    // ==========================================
    // 마법 투사체 (반짝이는 에너지 볼)
    // ==========================================
    magicBolt(fromX, fromY, toX, toY, options = {}) {
        if (!this.initialized || !this.enabled) {
            if (typeof VFX !== 'undefined') {
                VFX.projectile(fromX, fromY, toX, toY, options);
            }
            return;
        }
        
        const {
            color = '#60a5fa',
            size = 20,
            speed = 18,
            onHit = null
        } = options;
        
        const projContainer = new PIXI.Container();
        projContainer.x = fromX;
        projContainer.y = fromY;
        projContainer.zIndex = 100;
        
        const colorNum = this.parseColor(color);
        
        // 외부 글로우
        const outerGlow = new PIXI.Graphics();
        outerGlow.circle(0, 0, size * 2);
        outerGlow.fill({ color: colorNum, alpha: 0.2 });
        projContainer.addChild(outerGlow);
        
        // 중간 글로우
        const middleGlow = new PIXI.Graphics();
        middleGlow.circle(0, 0, size * 1.3);
        middleGlow.fill({ color: colorNum, alpha: 0.4 });
        projContainer.addChild(middleGlow);
        
        // 코어
        const core = new PIXI.Graphics();
        core.circle(0, 0, size);
        core.fill({ color: colorNum, alpha: 0.9 });
        projContainer.addChild(core);
        
        // 밝은 중심
        const center = new PIXI.Graphics();
        center.circle(0, 0, size * 0.4);
        center.fill({ color: 0xffffff, alpha: 1 });
        projContainer.addChild(center);
        
        this.container.addChild(projContainer);
        
        // 트레일 컨테이너
        const trailContainer = new PIXI.Container();
        trailContainer.zIndex = 99;
        this.container.addChild(trailContainer);
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        const proj = {
            container: projContainer,
            trailContainer: trailContainer,
            outerGlow,
            middleGlow,
            trails: [],
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            size,
            color: colorNum,
            pulseTime: 0,
            alive: true,
            
            update(delta) {
                this.x += this.vx * delta;
                this.y += this.vy * delta;
                this.pulseTime += delta * 0.2;
                
                this.container.x = this.x;
                this.container.y = this.y;
                
                // 펄스 효과
                const pulse = 1 + Math.sin(this.pulseTime) * 0.15;
                this.outerGlow.scale.set(pulse);
                this.middleGlow.scale.set(pulse * 0.9);
                
                // 마법 파티클 트레일
                if (Math.random() > 0.2) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * this.size;
                    const trailGraphics = new PIXI.Graphics();
                    trailGraphics.circle(0, 0, 3 + Math.random() * 3);
                    trailGraphics.fill({ color: this.color, alpha: 0.7 });
                    trailGraphics.x = this.x + Math.cos(angle) * dist;
                    trailGraphics.y = this.y + Math.sin(angle) * dist;
                    this.trailContainer.addChild(trailGraphics);
                    this.trails.push({ graphics: trailGraphics, alpha: 0.7 });
                }
                
                // 트레일 페이드
                for (let i = this.trails.length - 1; i >= 0; i--) {
                    const t = this.trails[i];
                    t.alpha -= 0.12 * delta;
                    t.graphics.alpha = t.alpha;
                    t.graphics.scale.set(t.alpha);
                    
                    if (t.alpha <= 0) {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                        this.trails.splice(i, 1);
                    }
                }
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2.5) {
                    this.alive = false;
                    
                    // 마법 폭발 이펙트
                    PixiProjectile.createMagicExplosion(this.targetX, this.targetY, this.color, this.size * 4);
                    
                    // 트레일 정리
                    this.trails.forEach(t => {
                        this.trailContainer.removeChild(t.graphics);
                        t.graphics.destroy();
                    });
                    PixiProjectile.container.removeChild(this.trailContainer);
                    this.trailContainer.destroy();
                    
                    if (onHit) onHit();
                }
            }
        };
        
        this.projectiles.push(proj);
    },
    
    // ==========================================
    // 충돌 이펙트 생성
    // ==========================================
    createImpact(x, y, color, size) {
        const impactContainer = new PIXI.Container();
        impactContainer.x = x;
        impactContainer.y = y;
        impactContainer.zIndex = 150;
        this.container.addChild(impactContainer);
        
        // 중앙 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, size);
        flash.fill({ color: 0xffffff, alpha: 1 });
        impactContainer.addChild(flash);
        
        // 외곽 링
        const ring = new PIXI.Graphics();
        ring.circle(0, 0, size * 0.5);
        ring.stroke({ color: color, width: 4, alpha: 0.8 });
        impactContainer.addChild(ring);
        
        // 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                alpha: 0,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(flash.scale, {
                x: 1.5,
                y: 1.5,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(ring.scale, {
                x: 3,
                y: 3,
                duration: 0.4,
                ease: "power2.out"
            });
            
            gsap.to(ring, {
                alpha: 0,
                duration: 0.4,
                ease: "power2.out",
                onComplete: () => {
                    this.container.removeChild(impactContainer);
                    impactContainer.destroy({ children: true });
                }
            });
        } else {
            setTimeout(() => {
                this.container.removeChild(impactContainer);
                impactContainer.destroy({ children: true });
            }, 400);
        }
    },
    
    // ==========================================
    // 스파크 이펙트 생성
    // ==========================================
    createSparks(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const spark = new PIXI.Graphics();
            spark.circle(0, 0, 3);
            spark.fill({ color: color, alpha: 1 });
            spark.x = x;
            spark.y = y;
            spark.zIndex = 151;
            this.container.addChild(spark);
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 80 + Math.random() * 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(spark, {
                    x: x + vx,
                    y: y + vy + 30, // 중력
                    alpha: 0,
                    duration: 0.4,
                    ease: "power2.out",
                    onComplete: () => {
                        this.container.removeChild(spark);
                        spark.destroy();
                    }
                });
                
                gsap.to(spark.scale, {
                    x: 0.3,
                    y: 0.3,
                    duration: 0.4,
                    ease: "power2.out"
                });
            } else {
                setTimeout(() => {
                    this.container.removeChild(spark);
                    spark.destroy();
                }, 400);
            }
        }
    },
    
    // ==========================================
    // 마법 폭발 이펙트
    // ==========================================
    createMagicExplosion(x, y, color, size) {
        const explosionContainer = new PIXI.Container();
        explosionContainer.x = x;
        explosionContainer.y = y;
        explosionContainer.zIndex = 150;
        this.container.addChild(explosionContainer);
        
        // 중앙 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, size);
        flash.fill({ color: 0xffffff, alpha: 1 });
        explosionContainer.addChild(flash);
        
        // 컬러 글로우
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, size * 0.8);
        glow.fill({ color: color, alpha: 0.8 });
        explosionContainer.addChild(glow);
        
        // 외곽 링들
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, size * (0.3 + i * 0.2));
            ring.stroke({ color: color, width: 3 - i, alpha: 0.6 });
            explosionContainer.addChild(ring);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ring.scale, {
                    x: 2 + i * 0.5,
                    y: 2 + i * 0.5,
                    duration: 0.4 + i * 0.1,
                    ease: "power2.out"
                });
                
                gsap.to(ring, {
                    alpha: 0,
                    duration: 0.4 + i * 0.1,
                    ease: "power2.out"
                });
            }
        }
        
        // 마법 파티클
        for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, 4);
            particle.fill({ color: color, alpha: 0.9 });
            explosionContainer.addChild(particle);
            
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 100 + Math.random() * 50;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                    alpha: 0,
                    duration: 0.5,
                    ease: "power2.out"
                });
                
                gsap.to(particle.scale, {
                    x: 0.2,
                    y: 0.2,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        }
        
        // 메인 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                alpha: 0,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(flash.scale, {
                x: 2,
                y: 2,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(glow, {
                alpha: 0,
                duration: 0.4,
                ease: "power2.out",
                onComplete: () => {
                    this.container.removeChild(explosionContainer);
                    explosionContainer.destroy({ children: true });
                }
            });
        } else {
            setTimeout(() => {
                this.container.removeChild(explosionContainer);
                explosionContainer.destroy({ children: true });
            }, 500);
        }
    },
    
    // ==========================================
    // 유틸리티: 색상 파싱
    // ==========================================
    parseColor(color) {
        if (typeof color === 'number') return color;
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                return parseInt(color.slice(1), 16);
            }
            if (color.startsWith('0x')) {
                return parseInt(color, 16);
            }
        }
        return 0xa855f7; // 기본 보라색
    },
    
    // ==========================================
    // 유틸리티: 플레이어 위치 가져오기
    // ==========================================
    getPlayerPosition() {
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.enabled && PlayerRenderer.initialized) {
            return PlayerRenderer.getPlayerPosition();
        }
        
        // 폴백: DOM
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const rect = playerEl.getBoundingClientRect();
            return {
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
            };
        }
        return null;
    },
    
    // ==========================================
    // 유틸리티: 적 위치 가져오기
    // ==========================================
    getEnemyPosition(enemyIndex = 0) {
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
            const positions = EnemyRenderer.getEnemyScreenPositions();
            if (positions && positions[enemyIndex]) {
                return positions[enemyIndex];
            }
        }
        
        // 폴백: DOM
        const container = document.getElementById('enemies-container');
        if (container) {
            const enemies = container.querySelectorAll('.enemy-unit:not(.dead)');
            if (enemies[enemyIndex]) {
                const rect = enemies[enemyIndex].getBoundingClientRect();
                return {
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2,
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                };
            }
        }
        
        const enemyEl = document.getElementById('enemy');
        if (enemyEl) {
            const rect = enemyEl.getBoundingClientRect();
            return {
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
            };
        }
        return null;
    },
    
    // ==========================================
    // 정리
    // ==========================================
    clear() {
        this.projectiles.forEach(proj => {
            if (proj.container) {
                this.container.removeChild(proj.container);
                proj.container.destroy({ children: true });
            }
            if (proj.trailContainer) {
                this.container.removeChild(proj.trailContainer);
                proj.trailContainer.destroy({ children: true });
            }
        });
        this.projectiles = [];
    },
    
    destroy() {
        this.clear();
        if (this.container) {
            this.app?.stage.removeChild(this.container);
            this.container.destroy({ children: true });
            this.container = null;
        }
        this.initialized = false;
    }
};

// 전역 등록
window.PixiProjectile = PixiProjectile;

console.log('[PixiProjectile] PixiJS 발사체 시스템 로드 완료');


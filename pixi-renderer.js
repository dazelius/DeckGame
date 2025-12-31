// ==========================================
// Shadow Deck - PixiJS 렌더러 (화려한 버전)
// ==========================================

const PixiRenderer = {
    app: null,
    particleContainer: null,
    effectsContainer: null,
    glowContainer: null,
    initialized: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    async init() {
        if (this.initialized) return;
        
        try {
            // PixiJS 앱 생성
            this.app = new PIXI.Application();
            
            await this.app.init({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });
            
            // 캔버스를 게임 위에 오버레이
            this.app.canvas.id = 'pixi-canvas';
            this.app.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9000;
            `;
            document.body.appendChild(this.app.canvas);
            
            // 컨테이너 생성 (레이어 순서)
            this.glowContainer = new PIXI.Container();
            this.particleContainer = new PIXI.Container();
            this.effectsContainer = new PIXI.Container();
            
            this.app.stage.addChild(this.glowContainer);
            this.app.stage.addChild(this.particleContainer);
            this.app.stage.addChild(this.effectsContainer);
            
            // 리사이즈 핸들러
            window.addEventListener('resize', () => this.resize());
            
            this.initialized = true;
            console.log('[PixiRenderer] 초기화 완료');
        } catch (e) {
            console.error('[PixiRenderer] 초기화 실패:', e);
        }
    },
    
    // 리사이즈
    resize() {
        if (!this.app) return;
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    },
    
    // ==========================================
    // 🔥 불씨 파티클 (화톳불 스타일)
    // ==========================================
    createEmbers(x, y, count = 20) {
        if (!this.initialized) return;
        
        for (let i = 0; i < count; i++) {
            // 글로우 레이어 (뒤)
            const glow = new PIXI.Graphics();
            const size = 4 + Math.random() * 6;
            const colors = ['#ff6b35', '#ff4500', '#ff8c00', '#ffa500', '#ffcc00'];
            const color = this.randomColor(colors);
            
            // 큰 글로우
            glow.circle(0, 0, size * 3);
            glow.fill({ color: color, alpha: 0.15 });
            
            // 중간 글로우
            glow.circle(0, 0, size * 2);
            glow.fill({ color: color, alpha: 0.3 });
            
            // 밝은 코어
            glow.circle(0, 0, size);
            glow.fill({ color: '#ffffff', alpha: 0.8 });
            glow.circle(0, 0, size * 0.6);
            glow.fill({ color: '#ffffcc' });
            
            glow.x = x + (Math.random() - 0.5) * 80;
            glow.y = y;
            glow.alpha = 0.8 + Math.random() * 0.2;
            
            // 물리
            glow.vx = (Math.random() - 0.5) * 1.5;
            glow.vy = -1.5 - Math.random() * 3;
            glow.life = 80 + Math.random() * 80;
            glow.maxLife = glow.life;
            glow.wobble = Math.random() * Math.PI * 2;
            glow.wobbleSpeed = 0.05 + Math.random() * 0.05;
            
            this.particleContainer.addChild(glow);
            
            const animate = () => {
                glow.life--;
                glow.wobble += glow.wobbleSpeed;
                
                // 위로 올라가며 좌우 흔들림
                glow.x += glow.vx + Math.sin(glow.wobble) * 0.5;
                glow.y += glow.vy;
                glow.vy -= 0.015; // 가속
                
                // 페이드 아웃
                const lifeRatio = glow.life / glow.maxLife;
                glow.alpha = lifeRatio * 0.9;
                glow.scale.set(0.5 + lifeRatio * 0.5);
                
                if (glow.life <= 0) {
                    this.particleContainer.removeChild(glow);
                    glow.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            // 딜레이 스폰
            setTimeout(() => animate(), i * 30);
        }
    },
    
    // ==========================================
    // 💥 히트 파티클 (스파크 스타일 - 플래시 없음)
    // ==========================================
    createHitParticles(x, y, count = 15, color = '#ff4444') {
        if (!this.initialized) return;
        
        // 스파크 파티클만 (플래시 제거 - 캐릭터 가림 방지)
        for (let i = 0; i < count; i++) {
            const spark = new PIXI.Graphics();
            const size = 2 + Math.random() * 4;
            
            // 글로우 + 코어
            spark.circle(0, 0, size * 2);
            spark.fill({ color: color, alpha: 0.3 });
            spark.circle(0, 0, size);
            spark.fill({ color: '#ffffff', alpha: 0.8 });
            
            // 시작 위치 (약간 분산)
            spark.x = x + (Math.random() - 0.5) * 30;
            spark.y = y + (Math.random() - 0.5) * 30;
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 6 + Math.random() * 10;
            spark.vx = Math.cos(angle) * speed;
            spark.vy = Math.sin(angle) * speed;
            spark.life = 20 + Math.random() * 15;
            spark.maxLife = spark.life;
            
            this.particleContainer.addChild(spark);
            
            const animate = () => {
                spark.life--;
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.vx *= 0.9;
                spark.vy *= 0.9;
                spark.vy += 0.15; // 약한 중력
                
                const lifeRatio = spark.life / spark.maxLife;
                spark.alpha = lifeRatio * 0.8;
                spark.scale.set(0.5 + lifeRatio * 0.5);
                
                if (spark.life <= 0) {
                    this.particleContainer.removeChild(spark);
                    spark.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    },
    
    // ==========================================
    // 💚 힐 파티클 (상승 빛 스타일)
    // ==========================================
    createHealParticles(x, y, count = 25) {
        if (!this.initialized) return;
        
        // 상승 기둥 효과
        const pillar = new PIXI.Graphics();
        pillar.rect(-30, -100, 60, 120);
        pillar.fill({ color: '#4ade80', alpha: 0.15 });
        pillar.x = x;
        pillar.y = y;
        this.glowContainer.addChild(pillar);
        
        let pillarLife = 40;
        const animatePillar = () => {
            pillarLife--;
            pillar.alpha = (pillarLife / 40) * 0.15;
            pillar.scale.y = 1 + (1 - pillarLife / 40) * 0.5;
            
            if (pillarLife <= 0) {
                this.glowContainer.removeChild(pillar);
                pillar.destroy();
            } else {
                requestAnimationFrame(animatePillar);
            }
        };
        animatePillar();
        
        // 상승 파티클
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            const size = 3 + Math.random() * 5;
            const colors = ['#4ade80', '#22c55e', '#86efac', '#bbf7d0'];
            const color = this.randomColor(colors);
            
            // 글로우 레이어
            particle.circle(0, 0, size * 3);
            particle.fill({ color: color, alpha: 0.15 });
            particle.circle(0, 0, size * 2);
            particle.fill({ color: color, alpha: 0.3 });
            particle.circle(0, 0, size);
            particle.fill({ color: '#ffffff', alpha: 0.9 });
            
            particle.x = x + (Math.random() - 0.5) * 80;
            particle.y = y + 40 + Math.random() * 40;
            particle.vx = (Math.random() - 0.5) * 0.8;
            particle.vy = -2.5 - Math.random() * 3;
            particle.life = 50 + Math.random() * 40;
            particle.maxLife = particle.life;
            particle.wobble = Math.random() * Math.PI * 2;
            
            this.particleContainer.addChild(particle);
            
            const animate = () => {
                particle.life--;
                particle.wobble += 0.08;
                particle.x += particle.vx + Math.sin(particle.wobble) * 0.3;
                particle.y += particle.vy;
                particle.vy *= 0.98;
                
                const lifeRatio = particle.life / particle.maxLife;
                particle.alpha = lifeRatio;
                particle.scale.set(0.4 + lifeRatio * 0.6);
                
                if (particle.life <= 0) {
                    this.particleContainer.removeChild(particle);
                    particle.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            setTimeout(() => animate(), i * 20);
        }
    },
    
    // ==========================================
    // 🛡️ 블록 파티클 (실드 스타일)
    // ==========================================
    createBlockParticles(x, y, count = 12) {
        if (!this.initialized) return;
        
        // 실드 플래시
        const shield = new PIXI.Graphics();
        shield.circle(0, 0, 60);
        shield.fill({ color: '#3b82f6', alpha: 0.3 });
        shield.circle(0, 0, 45);
        shield.stroke({ width: 4, color: '#60a5fa', alpha: 0.8 });
        shield.x = x;
        shield.y = y;
        this.effectsContainer.addChild(shield);
        
        let shieldLife = 20;
        const animateShield = () => {
            shieldLife--;
            shield.alpha = shieldLife / 20;
            shield.scale.set(1 + (1 - shieldLife / 20) * 0.3);
            
            if (shieldLife <= 0) {
                this.effectsContainer.removeChild(shield);
                shield.destroy();
            } else {
                requestAnimationFrame(animateShield);
            }
        };
        animateShield();
        
        // 파편 파티클
        for (let i = 0; i < count; i++) {
            const shard = new PIXI.Graphics();
            const size = 4 + Math.random() * 6;
            const colors = ['#60a5fa', '#3b82f6', '#93c5fd', '#bfdbfe'];
            const color = this.randomColor(colors);
            
            // 다이아몬드 모양
            shard.moveTo(0, -size);
            shard.lineTo(size * 0.6, 0);
            shard.lineTo(0, size);
            shard.lineTo(-size * 0.6, 0);
            shard.closePath();
            shard.fill({ color: '#ffffff', alpha: 0.9 });
            shard.stroke({ width: 2, color: color, alpha: 0.8 });
            
            // 글로우
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, size * 2);
            glow.fill({ color: color, alpha: 0.3 });
            shard.addChild(glow);
            
            shard.x = x;
            shard.y = y;
            
            const angle = (Math.PI * 2 / count) * i;
            const speed = 4 + Math.random() * 6;
            shard.vx = Math.cos(angle) * speed;
            shard.vy = Math.sin(angle) * speed;
            shard.rotationSpeed = (Math.random() - 0.5) * 0.3;
            shard.life = 35 + Math.random() * 20;
            shard.maxLife = shard.life;
            
            this.particleContainer.addChild(shard);
            
            const animate = () => {
                shard.life--;
                shard.x += shard.vx;
                shard.y += shard.vy;
                shard.vx *= 0.95;
                shard.vy *= 0.95;
                shard.rotation += shard.rotationSpeed;
                
                const lifeRatio = shard.life / shard.maxLife;
                shard.alpha = lifeRatio;
                
                if (shard.life <= 0) {
                    this.particleContainer.removeChild(shard);
                    shard.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    },
    
    // ==========================================
    // ⚔️ 슬래시 이펙트 (화려한 베기)
    // ==========================================
    createSlashEffect(x, y, angle = 0, color = '#ff4444') {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.rotation = angle;
        
        // 잔상 트레일
        for (let i = 0; i < 5; i++) {
            const trail = new PIXI.Graphics();
            const length = 120 - i * 15;
            const width = 25 - i * 4;
            const alpha = 0.4 - i * 0.08;
            
            trail.moveTo(-length / 2, 0);
            trail.quadraticCurveTo(0, -width / 2, length / 2, 0);
            trail.quadraticCurveTo(0, width / 2, -length / 2, 0);
            trail.fill({ color: color, alpha: alpha });
            
            container.addChild(trail);
        }
        
        // 밝은 코어
        const core = new PIXI.Graphics();
        core.moveTo(-60, 0);
        core.quadraticCurveTo(0, -8, 60, 0);
        core.quadraticCurveTo(0, 8, -60, 0);
        core.fill({ color: '#ffffff', alpha: 0.9 });
        container.addChild(core);
        
        // 글로우
        const glow = new PIXI.Graphics();
        glow.moveTo(-70, 0);
        glow.quadraticCurveTo(0, -20, 70, 0);
        glow.quadraticCurveTo(0, 20, -70, 0);
        glow.fill({ color: color, alpha: 0.3 });
        container.addChildAt(glow, 0);
        
        this.effectsContainer.addChild(container);
        
        let progress = 0;
        const animate = () => {
            progress += 0.08;
            
            container.scale.x = 0.5 + progress * 1.5;
            container.scale.y = 1 - progress * 0.3;
            container.alpha = 1 - progress;
            
            if (progress >= 1) {
                this.effectsContainer.removeChild(container);
                container.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        // 스파크 추가
        this.createHitParticles(x, y, 8, color);
    },
    
    // ==========================================
    // 🌊 충격파 이펙트
    // ==========================================
    createShockwave(x, y, color = '#ffffff') {
        if (!this.initialized) return;
        
        // 다중 링
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 15);
            ring.stroke({ width: 4 - i, color: i === 0 ? '#ffffff' : color, alpha: 0.8 - i * 0.2 });
            ring.x = x;
            ring.y = y;
            
            this.effectsContainer.addChild(ring);
            
            let scale = 1;
            let alpha = 1;
            const speed = 0.15 - i * 0.02;
            const delay = i * 50;
            
            setTimeout(() => {
                const animate = () => {
                    scale += speed;
                    alpha -= 0.04;
                    
                    ring.scale.set(scale);
                    ring.alpha = alpha;
                    
                    if (alpha <= 0) {
                        this.effectsContainer.removeChild(ring);
                        ring.destroy();
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }, delay);
        }
    },
    
    // ==========================================
    // 🪙 칩 파티클 (겜블러)
    // ==========================================
    createChipParticles(x, y, count = 30) {
        if (!this.initialized) return;
        
        // 황금빛 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 50);
        flash.fill({ color: '#ffd700', alpha: 0.5 });
        flash.x = x;
        flash.y = y;
        this.effectsContainer.addChild(flash);
        
        let flashLife = 15;
        const animateFlash = () => {
            flashLife--;
            flash.alpha = (flashLife / 15) * 0.5;
            flash.scale.set(1 + (1 - flashLife / 15) * 0.5);
            
            if (flashLife <= 0) {
                this.effectsContainer.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        animateFlash();
        
        for (let i = 0; i < count; i++) {
            const chip = new PIXI.Graphics();
            const size = 8 + Math.random() * 4;
            const colors = ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fcd34d'];
            const color = this.randomColor(colors);
            
            // 칩 모양 (원 + 테두리 + 하이라이트)
            chip.circle(0, 0, size);
            chip.fill({ color: color });
            chip.circle(0, 0, size * 0.7);
            chip.stroke({ width: 1.5, color: '#92400e', alpha: 0.8 });
            
            // 하이라이트
            chip.circle(-size * 0.3, -size * 0.3, size * 0.25);
            chip.fill({ color: '#ffffff', alpha: 0.5 });
            
            // 글로우
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, size * 2);
            glow.fill({ color: color, alpha: 0.2 });
            chip.addChildAt(glow, 0);
            
            chip.x = x + (Math.random() - 0.5) * 60;
            chip.y = y - 150 - Math.random() * 100;
            
            chip.vx = (Math.random() - 0.5) * 4;
            chip.vy = Math.random() * 2;
            chip.gravity = 0.4;
            chip.bounce = 0.6;
            chip.targetY = y + Math.random() * 30;
            chip.life = 100;
            chip.maxLife = 100;
            chip.rotation = Math.random() * Math.PI * 2;
            chip.rotationSpeed = (Math.random() - 0.5) * 0.15;
            
            this.particleContainer.addChild(chip);
            
            const animate = () => {
                chip.life--;
                
                chip.vy += chip.gravity;
                chip.x += chip.vx;
                chip.y += chip.vy;
                chip.rotation += chip.rotationSpeed;
                
                // 바닥 충돌
                if (chip.y >= chip.targetY) {
                    chip.y = chip.targetY;
                    chip.vy *= -chip.bounce;
                    chip.vx *= 0.9;
                    chip.rotationSpeed *= 0.8;
                    chip.bounce *= 0.7;
                    
                    if (Math.abs(chip.vy) < 1) {
                        chip.vy = 0;
                    }
                }
                
                // 페이드 아웃
                if (chip.life < 30) {
                    chip.alpha = chip.life / 30;
                }
                
                if (chip.life <= 0) {
                    this.particleContainer.removeChild(chip);
                    chip.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            setTimeout(() => animate(), i * 15);
        }
    },
    
    // ==========================================
    // 파티클 애니메이션 (기본)
    // ==========================================
    animateParticle(particle, type) {
        // 위의 개별 함수에서 처리
    },
    
    // ==========================================
    // 스크린 이펙트
    // ==========================================
    
    // 화면 플래시
    screenFlash(color = '#ffffff', duration = 200) {
        const flash = new PIXI.Graphics();
        flash.rect(0, 0, window.innerWidth, window.innerHeight);
        flash.fill({ color: color, alpha: 0.4 });
        
        this.effectsContainer.addChild(flash);
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.effectsContainer.removeChild(flash);
                flash.destroy();
                return;
            }
            
            flash.alpha = 0.4 * (1 - progress);
            requestAnimationFrame(animate);
        };
        animate();
    },
    
    // CRT 스캔라인 효과
    createScanlines() {
        const scanlines = new PIXI.Graphics();
        const height = window.innerHeight;
        
        for (let y = 0; y < height; y += 4) {
            scanlines.rect(0, y, window.innerWidth, 1);
        }
        scanlines.fill({ color: '#000000', alpha: 0.1 });
        
        scanlines.y = 0;
        this.effectsContainer.addChild(scanlines);
        
        // 스캔라인 움직임
        const animate = () => {
            if (!scanlines.parent) return;
            scanlines.y = (scanlines.y + 0.5) % 4;
            requestAnimationFrame(animate);
        };
        animate();
        
        return scanlines;
    },
    
    // 비네팅 효과
    createVignette() {
        const vignette = new PIXI.Graphics();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.sqrt(cx * cx + cy * cy);
        
        // 그라데이션 원 (가장자리 어둡게)
        for (let i = 0; i < 10; i++) {
            const r = maxR * (0.5 + i * 0.05);
            const alpha = i * 0.03;
            vignette.circle(cx, cy, r);
            vignette.fill({ color: '#000000', alpha: alpha });
        }
        
        this.app.stage.addChildAt(vignette, 0);
        return vignette;
    },
    
    // 마법 오라 이펙트
    createMagicAura(x, y, color = '#8b5cf6', duration = 2000) {
        const aura = new PIXI.Container();
        
        // 여러 개의 회전하는 원
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 40 + i * 15);
            ring.stroke({ width: 2, color: color, alpha: 0.6 - i * 0.15 });
            ring.rotationSpeed = (i % 2 === 0 ? 1 : -1) * (0.02 + i * 0.01);
            aura.addChild(ring);
        }
        
        aura.x = x;
        aura.y = y;
        this.effectsContainer.addChild(aura);
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= duration) {
                this.effectsContainer.removeChild(aura);
                aura.destroy();
                return;
            }
            
            // 회전
            aura.children.forEach(ring => {
                ring.rotation += ring.rotationSpeed;
            });
            
            // 페이드 아웃
            if (elapsed > duration * 0.7) {
                aura.alpha = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    },
    
    // 번개 이펙트
    createLightning(x1, y1, x2, y2, color = '#00ffff') {
        const lightning = new PIXI.Graphics();
        lightning.moveTo(x1, y1);
        
        // 번개 경로 생성
        const segments = 8;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        
        let currentX = x1;
        let currentY = y1;
        
        for (let i = 0; i < segments; i++) {
            const nextX = x1 + dx * (i + 1) + (Math.random() - 0.5) * 30;
            const nextY = y1 + dy * (i + 1) + (Math.random() - 0.5) * 30;
            lightning.lineTo(nextX, nextY);
            currentX = nextX;
            currentY = nextY;
        }
        
        lightning.lineTo(x2, y2);
        lightning.stroke({ width: 3, color: color, alpha: 1 });
        
        // 글로우 효과
        const glow = new PIXI.Graphics();
        glow.moveTo(x1, y1);
        currentX = x1;
        currentY = y1;
        
        for (let i = 0; i < segments; i++) {
            const nextX = x1 + dx * (i + 1) + (Math.random() - 0.5) * 30;
            const nextY = y1 + dy * (i + 1) + (Math.random() - 0.5) * 30;
            glow.lineTo(nextX, nextY);
        }
        glow.lineTo(x2, y2);
        glow.stroke({ width: 8, color: color, alpha: 0.3 });
        
        this.effectsContainer.addChild(glow);
        this.effectsContainer.addChild(lightning);
        
        // 빠르게 페이드아웃
        let alpha = 1;
        const animate = () => {
            alpha -= 0.08;
            lightning.alpha = alpha;
            glow.alpha = alpha * 0.3;
            
            if (alpha <= 0) {
                this.effectsContainer.removeChild(lightning);
                this.effectsContainer.removeChild(glow);
                lightning.destroy();
                glow.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        this.screenFlash('#00ffff', 100);
    },
    
    // 폭발 이펙트
    createExplosion(x, y, size = 100, color = '#ff6b35') {
        // 중심 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, size * 0.3);
        flash.fill({ color: '#ffffff' });
        flash.x = x;
        flash.y = y;
        this.effectsContainer.addChild(flash);
        
        // 폭발 파티클
        for (let i = 0; i < 40; i++) {
            const particle = new PIXI.Graphics();
            const pSize = 3 + Math.random() * 8;
            particle.circle(0, 0, pSize);
            particle.fill({ color: this.randomColor([color, '#ff4500', '#ffa500', '#ffff00']) });
            
            particle.x = x;
            particle.y = y;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 15;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 40;
            particle.maxLife = 40;
            
            this.particleContainer.addChild(particle);
            this.animateParticle(particle, 'burst');
        }
        
        // 충격파
        this.createShockwave(x, y, color);
        this.createShockwave(x, y, '#ffffff');
        
        // 플래시 페이드아웃
        let flashAlpha = 1;
        const animateFlash = () => {
            flashAlpha -= 0.1;
            flash.alpha = flashAlpha;
            flash.scale.x += 0.15;
            flash.scale.y += 0.15;
            
            if (flashAlpha <= 0) {
                this.effectsContainer.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        animateFlash();
        
        this.screenFlash(color, 150);
    },
    
    // ==========================================
    // 🎵 도발 음표 이펙트
    // ==========================================
    createTauntNotes(x, y) {
        if (!this.initialized) return;
        
        const notes = ['♪', '♫', '♬', '♩', '🎵'];
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
        const noteCount = 8;
        
        for (let i = 0; i < noteCount; i++) {
            const note = new PIXI.Text({
                text: notes[Math.floor(Math.random() * notes.length)],
                style: {
                    fontSize: 20 + Math.random() * 16,
                    fill: colors[Math.floor(Math.random() * colors.length)],
                    fontFamily: 'Arial',
                    fontWeight: 'bold',
                    stroke: { color: '#000000', width: 2 },
                    dropShadow: {
                        color: '#000000',
                        blur: 4,
                        distance: 2,
                        angle: Math.PI / 4
                    }
                }
            });
            
            // 시작 위치 (캐릭터 주변 랜덤)
            const offsetX = (Math.random() - 0.5) * 60;
            note.x = x + offsetX;
            note.y = y;
            note.anchor.set(0.5);
            note.alpha = 0;
            note.rotation = (Math.random() - 0.5) * 0.5;
            
            this.effectsContainer.addChild(note);
            
            // 딜레이를 주어 순차적으로 올라가게
            const delay = i * 100;
            const floatX = (Math.random() - 0.5) * 40; // 좌우 흔들림
            const floatDuration = 1000 + Math.random() * 500;
            
            setTimeout(() => {
                let startTime = performance.now();
                
                const animate = () => {
                    const elapsed = performance.now() - startTime;
                    const progress = Math.min(elapsed / floatDuration, 1);
                    
                    // 위로 올라감 (사인파로 좌우 흔들림)
                    note.y = y - progress * 80;
                    note.x = x + offsetX + Math.sin(progress * Math.PI * 3) * floatX;
                    
                    // 회전
                    note.rotation = Math.sin(progress * Math.PI * 4) * 0.3;
                    
                    // 알파 (등장 -> 유지 -> 페이드아웃)
                    if (progress < 0.2) {
                        note.alpha = progress * 5; // 빠르게 등장
                    } else if (progress > 0.7) {
                        note.alpha = 1 - (progress - 0.7) / 0.3; // 페이드아웃
                    } else {
                        note.alpha = 1;
                    }
                    
                    // 스케일 (살짝 커졌다 작아짐)
                    const scaleWave = 1 + Math.sin(progress * Math.PI * 2) * 0.2;
                    note.scale.set(scaleWave);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.effectsContainer.removeChild(note);
                        note.destroy();
                    }
                };
                
                animate();
            }, delay);
        }
    },
    
    // ==========================================
    // ⭐ 스턴 이펙트 (브레이크 시)
    // ==========================================
    createStunEffect(x, y) {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        // 🌟 큰 노란 폭발
        const burst = new PIXI.Graphics();
        burst.circle(0, 0, 80);
        burst.fill({ color: '#fbbf24', alpha: 0.6 });
        burst.circle(0, 0, 50);
        burst.fill({ color: '#fef3c7', alpha: 0.8 });
        container.addChild(burst);
        
        // ⭐ 별 파티클 12개
        const stars = [];
        for (let i = 0; i < 12; i++) {
            const star = new PIXI.Graphics();
            const angle = (Math.PI * 2 / 12) * i;
            
            // 별 모양
            star.star(0, 0, 5, 8, 4);
            star.fill({ color: '#fef3c7', alpha: 1 });
            star.stroke({ width: 1, color: '#f59e0b', alpha: 0.8 });
            
            star.x = Math.cos(angle) * 20;
            star.y = Math.sin(angle) * 20;
            star.rotation = angle;
            
            container.addChild(star);
            stars.push({ star, angle, speed: 3 + Math.random() * 2 });
        }
        
        // 💫 중앙 스파이럴 효과
        const spiral = new PIXI.Graphics();
        spiral.moveTo(0, 0);
        for (let i = 0; i < 3; i++) {
            for (let a = 0; a < Math.PI * 2; a += 0.3) {
                const r = 10 + a * 5 + i * 20;
                spiral.lineTo(Math.cos(a + i) * r, Math.sin(a + i) * r);
            }
        }
        spiral.stroke({ width: 2, color: '#fbbf24', alpha: 0.5 });
        container.addChild(spiral);
        
        let life = 40;
        const animate = () => {
            life--;
            const progress = 1 - (life / 40);
            
            // 폭발 확장 & 페이드
            burst.scale.set(1 + progress * 2);
            burst.alpha = 0.6 * (1 - progress);
            
            // 별 퍼져나감
            stars.forEach(data => {
                data.star.x += Math.cos(data.angle) * data.speed;
                data.star.y += Math.sin(data.angle) * data.speed;
                data.star.rotation += 0.2;
                data.star.alpha = 1 - progress;
                data.star.scale.set(1 + progress * 0.5);
            });
            
            // 스파이럴 회전
            spiral.rotation += 0.15;
            spiral.alpha = 0.5 * (1 - progress);
            
            if (life <= 0) {
                container.destroy({ children: true });
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    },
    
    // ==========================================
    // 💫 스턴 상태 유지 이펙트 (머리 위 별 회전)
    // ==========================================
    createStunLoop(x, y, duration = 2000) {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        // 5개의 별이 원형으로 회전
        const stars = [];
        const starCount = 5;
        const radius = 35;
        
        for (let i = 0; i < starCount; i++) {
            const star = new PIXI.Graphics();
            star.star(0, 0, 5, 10, 5);
            star.fill({ color: '#fef3c7', alpha: 1 });
            star.stroke({ width: 1.5, color: '#f59e0b', alpha: 1 });
            
            const angle = (Math.PI * 2 / starCount) * i;
            star.x = Math.cos(angle) * radius;
            star.y = Math.sin(angle) * radius;
            
            container.addChild(star);
            stars.push({ star, baseAngle: angle });
        }
        
        let time = 0;
        const totalFrames = duration / (1000 / 60);
        
        const animate = () => {
            time++;
            const progress = time / totalFrames;
            const rotation = progress * Math.PI * 4;
            
            // 전체 컨테이너 회전
            container.rotation = rotation;
            
            // 각 별 반짝임
            stars.forEach((data, i) => {
                const twinkle = Math.sin(time * 0.3 + i) * 0.3 + 0.7;
                data.star.alpha = twinkle;
                data.star.scale.set(0.8 + twinkle * 0.4);
            });
            
            // 페이드 아웃 (마지막 20%)
            if (progress > 0.8) {
                container.alpha = 1 - (progress - 0.8) * 5;
            }
            
            if (progress >= 1) {
                container.destroy({ children: true });
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
        
        return container;
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    randomColor(colors) {
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // DOM 요소 위치 가져오기
    getElementCenter(el) {
        if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    },
    
    // 클리어
    clear() {
        this.particleContainer.removeChildren();
        this.effectsContainer.removeChildren();
    },
    
    // ==========================================
    // 🛡️⚡ 파직 쉴드 이펙트! (방어 시)
    // ==========================================
    createShieldImpact(x, y, blockAmount = 5, intensity = 1) {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        // 🔵 육각형 쉴드 (확장되며 페이드)
        const shield = new PIXI.Graphics();
        const hexRadius = 50 + (intensity * 20);
        
        // 육각형 그리기
        shield.poly(this.getHexPoints(0, 0, hexRadius * 0.3));
        shield.fill({ color: '#60a5fa', alpha: 0.4 });
        shield.stroke({ width: 3, color: '#93c5fd', alpha: 0.9 });
        container.addChild(shield);
        
        // 육각형 확장 애니메이션
        let shieldLife = 30;
        const animateShield = () => {
            shieldLife--;
            const progress = 1 - (shieldLife / 30);
            const scale = 0.5 + progress * 1.5;
            shield.scale.set(scale);
            shield.alpha = 1 - progress;
            
            if (shieldLife <= 0) {
                container.removeChild(shield);
                shield.destroy();
            } else {
                requestAnimationFrame(animateShield);
            }
        };
        animateShield();
        
        // ⚡ 전기 스파크 (6~12개)
        const sparkCount = 6 + Math.floor(intensity * 6);
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.5;
            const length = 20 + Math.random() * 40 * intensity;
            
            // 번개 모양 (지그재그)
            const segments = 3 + Math.floor(Math.random() * 3);
            spark.moveTo(0, 0);
            
            let px = 0, py = 0;
            for (let j = 1; j <= segments; j++) {
                const segLen = length / segments;
                const offsetAngle = angle + (Math.random() - 0.5) * 0.5;
                px += Math.cos(offsetAngle) * segLen;
                py += Math.sin(offsetAngle) * segLen;
                spark.lineTo(px, py);
            }
            
            // 글로우 효과
            spark.stroke({ 
                width: 4, 
                color: '#3b82f6', 
                alpha: 0.5,
                cap: 'round',
                join: 'round'
            });
            spark.stroke({ 
                width: 2, 
                color: '#93c5fd', 
                alpha: 0.9,
                cap: 'round',
                join: 'round'
            });
            spark.stroke({ 
                width: 1, 
                color: '#ffffff', 
                alpha: 1,
                cap: 'round',
                join: 'round'
            });
            
            spark.rotation = Math.random() * Math.PI * 2;
            container.addChild(spark);
            
            // 스파크 애니메이션
            let sparkLife = 15 + Math.random() * 10;
            const maxSparkLife = sparkLife;
            const animateSpark = () => {
                sparkLife--;
                spark.alpha = sparkLife / maxSparkLife;
                spark.scale.set(1 + (1 - sparkLife / maxSparkLife) * 0.3);
                
                if (sparkLife <= 0) {
                    container.removeChild(spark);
                    spark.destroy();
                } else {
                    requestAnimationFrame(animateSpark);
                }
            };
            
            // 약간의 딜레이로 파직파직
            setTimeout(animateSpark, i * 20);
        }
        
        // 💎 유리 파편 (파직 느낌)
        const shardCount = 8 + Math.floor(intensity * 8);
        for (let i = 0; i < shardCount; i++) {
            const shard = new PIXI.Graphics();
            const size = 3 + Math.random() * 5;
            const angle = (Math.PI * 2 / shardCount) * i + Math.random() * 0.3;
            
            // 다이아몬드 모양
            shard.moveTo(0, -size);
            shard.lineTo(size * 0.6, 0);
            shard.lineTo(0, size);
            shard.lineTo(-size * 0.6, 0);
            shard.closePath();
            shard.fill({ color: '#bfdbfe', alpha: 0.9 });
            shard.stroke({ width: 1, color: '#60a5fa', alpha: 0.8 });
            
            // 작은 글로우
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, size * 1.5);
            glow.fill({ color: '#60a5fa', alpha: 0.3 });
            shard.addChild(glow);
            
            const speed = 3 + Math.random() * 5 * intensity;
            shard.vx = Math.cos(angle) * speed;
            shard.vy = Math.sin(angle) * speed - 2;
            shard.rotation = Math.random() * Math.PI * 2;
            shard.rotationSpeed = (Math.random() - 0.5) * 0.3;
            shard.life = 30 + Math.random() * 15;
            shard.maxLife = shard.life;
            
            container.addChild(shard);
            
            const animateShard = () => {
                shard.life--;
                shard.x += shard.vx;
                shard.y += shard.vy;
                shard.vy += 0.15; // 중력
                shard.vx *= 0.98;
                shard.rotation += shard.rotationSpeed;
                shard.alpha = shard.life / shard.maxLife;
                
                if (shard.life <= 0) {
                    container.removeChild(shard);
                    shard.destroy();
                } else {
                    requestAnimationFrame(animateShard);
                }
            };
            
            setTimeout(animateShard, 50 + Math.random() * 50);
        }
        
        // 🌟 중심 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 30 * intensity);
        flash.fill({ color: '#ffffff', alpha: 0.8 });
        container.addChild(flash);
        
        let flashLife = 10;
        const animateFlash = () => {
            flashLife--;
            flash.alpha = flashLife / 10;
            flash.scale.set(1 + (1 - flashLife / 10) * 2);
            
            if (flashLife <= 0) {
                container.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        animateFlash();
        
        // 🔊 링 확장 (충격파)
        const ring = new PIXI.Graphics();
        ring.circle(0, 0, 20);
        ring.stroke({ width: 4, color: '#60a5fa', alpha: 0.8 });
        container.addChild(ring);
        
        let ringLife = 25;
        const animateRing = () => {
            ringLife--;
            const progress = 1 - (ringLife / 25);
            ring.scale.set(1 + progress * 3);
            ring.alpha = 1 - progress;
            
            if (ringLife <= 0) {
                container.removeChild(ring);
                ring.destroy();
            } else {
                requestAnimationFrame(animateRing);
            }
        };
        animateRing();
        
        // 컨테이너 정리 (2초 후)
        setTimeout(() => {
            this.effectsContainer.removeChild(container);
            container.destroy({ children: true });
        }, 2000);
    },
    
    // 육각형 포인트 생성
    getHexPoints(cx, cy, radius) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            points.push(
                cx + radius * Math.cos(angle),
                cy + radius * Math.sin(angle)
            );
        }
        return points;
    },
    
    // ==========================================
    // 🛡️ 쉴드 전개 이펙트 (매우 미니멀!)
    // ==========================================
    createShieldDeploy(x, y, size = 60, color = '#60a5fa', intensity = 1) {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        // 🔵 아주 작은 육각형 (빠르게 사라짐)
        const shield = new PIXI.Graphics();
        const hexRadius = size * 0.35;  // 더 작게!
        
        // 육각형 그리기
        shield.poly(this.getHexPoints(0, 0, hexRadius));
        shield.fill({ color: color, alpha: 0.08 });  // 거의 투명!
        shield.stroke({ width: 1.5, color: color, alpha: 0.4 });  // 선도 약하게
        shield.scale.set(0);
        container.addChild(shield);
        
        // 쉴드 확장 애니메이션 (빠르게!)
        let shieldPhase = 0;
        const animateShield = () => {
            shieldPhase += 0.15;  // 더 빠르게!
            
            if (shieldPhase < 0.4) {
                // 확장 단계
                const scale = shieldPhase * 2.5;
                shield.scale.set(scale);
                shield.alpha = 0.3;  // 약하게
            } else if (shieldPhase < 0.8) {
                // 사라짐
                shield.alpha = 0.3 * (1 - (shieldPhase - 0.4) / 0.4);
            } else {
                // 종료
                container.removeChild(shield);
                shield.destroy();
                return;
            }
            
            requestAnimationFrame(animateShield);
        };
        animateShield();
        
        // ⚡ 스파크 2개만
        const sparkCount = 2;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            const angle = (Math.PI * 2 / sparkCount) * i + Math.PI / 4;
            const length = 6 + Math.random() * 8;
            
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            spark.stroke({ width: 1.5, color: color, alpha: 0.3, cap: 'round' });
            container.addChild(spark);
            
            // 스파크 애니메이션
            let sparkLife = 0;
            const animateSpark = () => {
                sparkLife++;
                spark.x = Math.cos(angle) * sparkLife * 1.5;
                spark.y = Math.sin(angle) * sparkLife * 1.5;
                spark.alpha = 0.3 * (1 - sparkLife / 10);
                
                if (sparkLife >= 10) {
                    container.removeChild(spark);
                    spark.destroy();
                } else {
                    requestAnimationFrame(animateSpark);
                }
            };
            setTimeout(animateSpark, i * 20);
        }
        
        // 💎 파편 3개만
        const shardCount = 3;
        for (let i = 0; i < shardCount; i++) {
            const shard = new PIXI.Graphics();
            const shardSize = 1.5 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            
            shard.moveTo(0, -shardSize);
            shard.lineTo(shardSize * 0.5, 0);
            shard.lineTo(0, shardSize);
            shard.lineTo(-shardSize * 0.5, 0);
            shard.closePath();
            shard.fill({ color: '#93c5fd', alpha: 0.35 });
            
            const speed = 0.8 + Math.random() * 1.2;
            shard.vx = Math.cos(angle) * speed;
            shard.vy = Math.sin(angle) * speed;
            shard.rotation = Math.random() * Math.PI * 2;
            shard.rotationSpeed = (Math.random() - 0.5) * 0.08;
            shard.life = 12;
            shard.maxLife = shard.life;
            
            container.addChild(shard);
            
            const animateShard = () => {
                shard.life--;
                shard.x += shard.vx;
                shard.y += shard.vy;
                shard.vx *= 0.96;
                shard.vy *= 0.96;
                shard.rotation += shard.rotationSpeed;
                shard.alpha = shard.life / shard.maxLife;
                
                if (shard.life <= 0) {
                    container.removeChild(shard);
                    shard.destroy();
                } else {
                    requestAnimationFrame(animateShard);
                }
            };
            setTimeout(animateShard, 50 + Math.random() * 80);
        }
        
        // 🌟 중심 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 30);
        flash.fill({ color: '#ffffff', alpha: 1 });
        container.addChild(flash);
        
        let flashLife = 0;
        const animateFlash = () => {
            flashLife++;
            flash.alpha = 1 - flashLife / 12;
            flash.scale.set(1 + flashLife * 0.15);
            
            if (flashLife >= 12) {
                container.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        animateFlash();
        
        // 🔊 동심원 링 (2개)
        for (let ring = 0; ring < 2; ring++) {
            const ringGfx = new PIXI.Graphics();
            ringGfx.circle(0, 0, 20);
            ringGfx.stroke({ width: 3 - ring, color: color, alpha: 0.8 });
            container.addChild(ringGfx);
            
            let ringLife = 0;
            const animateRing = () => {
                ringLife++;
                ringGfx.scale.set(1 + ringLife * 0.2);
                ringGfx.alpha = 1 - ringLife / 25;
                
                if (ringLife >= 25) {
                    container.removeChild(ringGfx);
                    ringGfx.destroy();
                } else {
                    requestAnimationFrame(animateRing);
                }
            };
            setTimeout(animateRing, ring * 100);
        }
        
        // 컨테이너 정리
        setTimeout(() => {
            this.effectsContainer.removeChild(container);
            container.destroy({ children: true });
        }, 1500);
    },
    
    // ==========================================
    // 💥 히트 이펙트! (피격 시)
    // ==========================================
    createHitImpact(x, y, damage = 10, color = '#ff4444') {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        const intensity = Math.min(damage / 15, 2) + 0.5;
        
        // 🔴 중심 플래시 (빨간색/흰색)
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 25 * intensity);
        flash.fill({ color: '#ffffff', alpha: 1 });
        container.addChild(flash);
        
        let flashLife = 8;
        const animateFlash = () => {
            flashLife--;
            flash.alpha = flashLife / 8;
            flash.scale.set(1 + (1 - flashLife / 8) * 2);
            
            if (flashLife <= 0) {
                container.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animateFlash);
            }
        };
        animateFlash();
        
        // 💢 충격선 (스피드라인)
        const lineCount = 6 + Math.floor(intensity * 4);
        for (let i = 0; i < lineCount; i++) {
            const line = new PIXI.Graphics();
            const angle = (Math.PI * 2 / lineCount) * i + Math.random() * 0.3;
            const length = 30 + Math.random() * 50 * intensity;
            const width = 2 + Math.random() * 3;
            
            line.moveTo(15, 0);
            line.lineTo(15 + length, 0);
            line.stroke({ 
                width: width, 
                color: color, 
                alpha: 0.9,
                cap: 'round'
            });
            line.rotation = angle;
            container.addChild(line);
            
            let lineLife = 12 + Math.random() * 8;
            const maxLineLife = lineLife;
            const animateLine = () => {
                lineLife--;
                line.alpha = lineLife / maxLineLife;
                line.scale.set(1 + (1 - lineLife / maxLineLife) * 0.5);
                
                if (lineLife <= 0) {
                    container.removeChild(line);
                    line.destroy();
                } else {
                    requestAnimationFrame(animateLine);
                }
            };
            setTimeout(animateLine, i * 10);
        }
        
        // 🩸 피 파티클 (작은 점들)
        const bloodCount = 8 + Math.floor(intensity * 8);
        for (let i = 0; i < bloodCount; i++) {
            const blood = new PIXI.Graphics();
            const size = 2 + Math.random() * 4;
            const angle = Math.random() * Math.PI * 2;
            
            blood.circle(0, 0, size);
            blood.fill({ color: color, alpha: 0.9 });
            
            const speed = 4 + Math.random() * 8 * intensity;
            blood.vx = Math.cos(angle) * speed;
            blood.vy = Math.sin(angle) * speed - 3;
            blood.life = 25 + Math.random() * 15;
            blood.maxLife = blood.life;
            blood.gravity = 0.2 + Math.random() * 0.1;
            
            container.addChild(blood);
            
            const animateBlood = () => {
                blood.life--;
                blood.x += blood.vx;
                blood.y += blood.vy;
                blood.vy += blood.gravity;
                blood.vx *= 0.98;
                blood.alpha = (blood.life / blood.maxLife) * 0.9;
                blood.scale.set(1 - (1 - blood.life / blood.maxLife) * 0.5);
                
                if (blood.life <= 0) {
                    container.removeChild(blood);
                    blood.destroy();
                } else {
                    requestAnimationFrame(animateBlood);
                }
            };
            setTimeout(animateBlood, Math.random() * 30);
        }
        
        // 💫 별 파티클 (데미지 큰 경우)
        if (damage >= 15) {
            const starCount = 3 + Math.floor(intensity * 2);
            for (let i = 0; i < starCount; i++) {
                const star = new PIXI.Graphics();
                const starSize = 6 + Math.random() * 4;
                
                // 4각 별 그리기
                star.moveTo(0, -starSize);
                star.lineTo(starSize * 0.3, -starSize * 0.3);
                star.lineTo(starSize, 0);
                star.lineTo(starSize * 0.3, starSize * 0.3);
                star.lineTo(0, starSize);
                star.lineTo(-starSize * 0.3, starSize * 0.3);
                star.lineTo(-starSize, 0);
                star.lineTo(-starSize * 0.3, -starSize * 0.3);
                star.closePath();
                star.fill({ color: '#ffff00', alpha: 0.9 });
                
                const angle = Math.random() * Math.PI * 2;
                const dist = 20 + Math.random() * 30;
                star.x = Math.cos(angle) * dist;
                star.y = Math.sin(angle) * dist;
                star.rotation = Math.random() * Math.PI;
                star.rotationSpeed = (Math.random() - 0.5) * 0.2;
                star.life = 20 + Math.random() * 10;
                star.maxLife = star.life;
                
                container.addChild(star);
                
                const animateStar = () => {
                    star.life--;
                    star.rotation += star.rotationSpeed;
                    star.alpha = star.life / star.maxLife;
                    star.scale.set(1 + (1 - star.life / star.maxLife) * 0.3);
                    
                    if (star.life <= 0) {
                        container.removeChild(star);
                        star.destroy();
                    } else {
                        requestAnimationFrame(animateStar);
                    }
                };
                setTimeout(animateStar, 50 + i * 30);
            }
        }
        
        // 🔊 충격파 링 (데미지 큰 경우)
        if (damage >= 10) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 15);
            ring.stroke({ width: 3, color: color, alpha: 0.8 });
            container.addChild(ring);
            
            let ringLife = 20;
            const animateRing = () => {
                ringLife--;
                ring.scale.set(1 + (1 - ringLife / 20) * 3 * intensity);
                ring.alpha = ringLife / 20;
                
                if (ringLife <= 0) {
                    container.removeChild(ring);
                    ring.destroy();
                } else {
                    requestAnimationFrame(animateRing);
                }
            };
            animateRing();
        }
        
        // 컨테이너 정리
        setTimeout(() => {
            this.effectsContainer.removeChild(container);
            container.destroy({ children: true });
        }, 1500);
    },
    
    // ==========================================
    // 💀 크리티컬 히트 이펙트!
    // ==========================================
    createCriticalHit(x, y, damage = 25) {
        if (!this.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        this.effectsContainer.addChild(container);
        
        // 💥 대형 플래시 (여러 층)
        for (let layer = 0; layer < 3; layer++) {
            const flash = new PIXI.Graphics();
            const size = 60 - layer * 15;
            const colors = ['#ffffff', '#ffff00', '#ff4444'];
            
            flash.circle(0, 0, size);
            flash.fill({ color: colors[layer], alpha: 0.9 - layer * 0.2 });
            container.addChild(flash);
            
            let life = 15 - layer * 2;
            const maxLife = life;
            const animate = () => {
                life--;
                flash.alpha = (life / maxLife) * (0.9 - layer * 0.2);
                flash.scale.set(1 + (1 - life / maxLife) * (3 - layer * 0.5));
                
                if (life <= 0) {
                    container.removeChild(flash);
                    flash.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            setTimeout(animate, layer * 30);
        }
        
        // ⚡ X자 슬래시
        for (let i = 0; i < 2; i++) {
            const slash = new PIXI.Graphics();
            const angle = i === 0 ? -0.7 : 0.7;
            
            slash.moveTo(-80, 0);
            slash.lineTo(80, 0);
            slash.stroke({ width: 8, color: '#ffff00', alpha: 0.9, cap: 'round' });
            slash.stroke({ width: 4, color: '#ffffff', alpha: 1, cap: 'round' });
            slash.rotation = angle;
            container.addChild(slash);
            
            let slashLife = 20;
            const animateSlash = () => {
                slashLife--;
                slash.alpha = slashLife / 20;
                slash.scale.set(1 + (1 - slashLife / 20) * 0.3);
                
                if (slashLife <= 0) {
                    container.removeChild(slash);
                    slash.destroy();
                } else {
                    requestAnimationFrame(animateSlash);
                }
            };
            setTimeout(animateSlash, i * 50);
        }
        
        // 🌟 폭발 파티클
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            const size = 3 + Math.random() * 6;
            const colors = ['#ff4444', '#ffff00', '#ffffff', '#ff8800'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.circle(0, 0, size);
            particle.fill({ color: color, alpha: 1 });
            
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.3;
            const speed = 8 + Math.random() * 12;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 30 + Math.random() * 20;
            particle.maxLife = particle.life;
            
            container.addChild(particle);
            
            const animateParticle = () => {
                particle.life--;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vx *= 0.95;
                particle.vy *= 0.95;
                particle.alpha = particle.life / particle.maxLife;
                
                if (particle.life <= 0) {
                    container.removeChild(particle);
                    particle.destroy();
                } else {
                    requestAnimationFrame(animateParticle);
                }
            };
            animateParticle();
        }
        
        // 이중 충격파
        for (let ring = 0; ring < 2; ring++) {
            const shockwave = new PIXI.Graphics();
            shockwave.circle(0, 0, 20);
            shockwave.stroke({ width: 5 - ring * 2, color: '#ffff00', alpha: 0.9 });
            container.addChild(shockwave);
            
            let life = 25;
            const animate = () => {
                life--;
                shockwave.scale.set(1 + (1 - life / 25) * 5);
                shockwave.alpha = life / 25;
                
                if (life <= 0) {
                    container.removeChild(shockwave);
                    shockwave.destroy();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            setTimeout(animate, ring * 80);
        }
        
        // 컨테이너 정리
        setTimeout(() => {
            this.effectsContainer.removeChild(container);
            container.destroy({ children: true });
        }, 2000);
    },
    
    // ==========================================
    // 🔥 화면 플래시 (히트 시)
    // ==========================================
    hitFlash(color = '#ff0000', duration = 100) {
        const flash = new PIXI.Graphics();
        flash.rect(0, 0, window.innerWidth, window.innerHeight);
        flash.fill({ color: color, alpha: 0.3 });
        this.effectsContainer.addChild(flash);
        
        let life = duration / 16;
        const maxLife = life;
        const animate = () => {
            life--;
            flash.alpha = (life / maxLife) * 0.3;
            
            if (life <= 0) {
                this.effectsContainer.removeChild(flash);
                flash.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // PixiJS 로드 확인 후 초기화
    if (typeof PIXI !== 'undefined') {
        PixiRenderer.init();
    } else {
        console.warn('[PixiRenderer] PIXI가 로드되지 않음');
    }
});


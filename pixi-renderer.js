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


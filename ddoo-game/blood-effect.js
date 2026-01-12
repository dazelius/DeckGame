// =====================================================
// Blood Effect System - 모탈컴뱃 스타일 물리 기반 피 효과
// 실시간 물리 시뮬레이션 (중력, 바운스, 바닥 충돌)
// =====================================================

const BloodEffect = {
    app: null,
    container: null,
    initialized: false,
    
    // 물리 설정
    physics: {
        gravity: 1200,        // 중력 가속도
        airResistance: 0.98,  // 공기 저항
        bounceDecay: 0.3,     // 바운스 감쇠
        groundY: 380,         // 바닥 Y 좌표
    },
    
    // 설정
    config: {
        enabled: true,
        intensity: 1.2,
    },
    
    // 피 색상 팔레트
    bloodColors: [
        0xAA0000, 0x880000, 0x660000,
        0x990011, 0xBB1111, 0x770000,
    ],
    
    // 활성 파티클
    particles: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app, gameWorld = null) {
        this.app = app;
        
        this.container = new PIXI.Container();
        this.container.zIndex = 25;
        this.container.sortableChildren = true;
        
        if (gameWorld) {
            gameWorld.addChild(this.container);
        } else if (app && app.stage) {
            app.stage.addChild(this.container);
        }
        
        // 물리 업데이트 루프
        if (app && app.ticker) {
            app.ticker.add(this.update, this);
        }
        
        this.initialized = true;
        console.log('[BloodEffect] 🩸 물리 기반 피 시스템 초기화');
    },
    
    // ==========================================
    // 물리 업데이트 (매 프레임)
    // ==========================================
    update(delta) {
        const dt = Math.min(delta / 60, 0.05);  // 최대 50ms
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 생명 감소
            p.life -= dt * p.decay;
            
            if (p.life <= 0) {
                if (p.graphics.parent) p.graphics.parent.removeChild(p.graphics);
                p.graphics.destroy();
                this.particles.splice(i, 1);
                continue;
            }
            
            // 물리 시뮬레이션
            if (!p.stuck) {
                // 중력
                p.vy += this.physics.gravity * dt;
                
                // 공기 저항
                p.vx *= Math.pow(this.physics.airResistance, dt * 60);
                p.vy *= Math.pow(this.physics.airResistance, dt * 60);
                
                // 위치 업데이트
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                
                // 바닥 충돌
                if (p.y >= p.groundY) {
                    p.y = p.groundY;
                    
                    if (Math.abs(p.vy) < 50) {
                        // 바닥에 붙음
                        p.stuck = true;
                        p.decay *= 2;  // 빨리 사라짐
                    } else {
                        // 바운스
                        p.vy = -p.vy * this.physics.bounceDecay * (0.5 + Math.random() * 0.5);
                        p.vx *= 0.8;
                        p.bounceCount++;
                        
                        // 바운스할 때 작은 방울 생성
                        if (p.bounceCount === 1 && p.size > 3) {
                            this.spawnSplash(p.x, p.y, Math.ceil(p.size / 2));
                        }
                        
                        // 3번 이상 바운스하면 멈춤
                        if (p.bounceCount >= 3) {
                            p.stuck = true;
                            p.decay *= 2;
                        }
                    }
                }
            }
            
            // 그리기
            this.drawParticle(p);
        }
    },
    
    // ==========================================
    // 파티클 그리기
    // ==========================================
    drawParticle(p) {
        const g = p.graphics;
        g.clear();
        
        const alpha = Math.min(1, p.life * 1.5);
        if (alpha <= 0) return;
        
        if (p.type === 'drop' || p.type === 'spray') {
            // 속도에 따른 늘어남
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const stretch = p.stuck ? 1 : Math.min(1 + speed / 300, 2.5);
            const angle = Math.atan2(p.vy, p.vx);
            
            const sizeX = p.size / stretch;
            const sizeY = p.size * stretch;
            
            // 회전된 타원
            g.rotation = angle;
            g.ellipse(0, 0, sizeY, sizeX);
            g.fill({ color: p.color, alpha: alpha });
            g.x = p.x;
            g.y = p.y;
            
        } else if (p.type === 'chunk') {
            // 불규칙한 덩어리
            g.x = p.x;
            g.y = p.y;
            g.rotation = p.rotation;
            
            g.poly(p.shape);
            g.fill({ color: p.color, alpha: alpha });
            
            // 회전 업데이트
            if (!p.stuck) {
                p.rotation += p.rotationSpeed * 0.016;
            }
            
        } else if (p.type === 'mist') {
            // 안개
            const size = p.size * (1 + (1 - p.life) * 0.5);
            g.circle(p.x, p.y, size);
            g.fill({ color: p.color, alpha: alpha * 0.4 });
            
        } else if (p.type === 'puddle') {
            // 바닥 웅덩이
            const size = p.size * (1 + (1 - p.life) * 0.3);
            g.ellipse(p.x, p.y, size * 1.5, size * 0.4);
            g.fill({ color: p.color, alpha: alpha * 0.7 });
        }
    },
    
    // ==========================================
    // 🩸 메인 API
    // ==========================================
    onDamage(x, y, damage, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        console.log(`[BloodEffect] onDamage: x=${x?.toFixed?.(0) || x}, y=${y?.toFixed?.(0) || y}, damage=${damage}`);
        
        // ★ 디버그: 테스트 원 (이 위치에 피가 나와야 함)
        const testG = new PIXI.Graphics();
        testG.circle(x, y, 15);
        testG.fill({ color: 0x00FF00, alpha: 1 });  // 초록색
        this.container.addChild(testG);
        setTimeout(() => {
            if (testG.parent) testG.parent.removeChild(testG);
            testG.destroy();
        }, 1500);
        
        const { type = 'normal', direction = null } = options;
        const intensity = Math.min(damage / 8, 2) * this.config.intensity;
        
        // 피 스프레이
        const sprayCount = Math.floor(10 + damage * 3 * intensity);
        this.spawnSpray(x, y, sprayCount, direction);
        
        // 큰 방울
        const dropCount = Math.floor(3 + damage * intensity);
        this.spawnDrops(x, y, dropCount, direction);
        
        // 안개
        if (damage >= 5) {
            this.spawnMist(x, y, Math.ceil(damage / 3));
        }
        
        // 크리티컬/강타면 덩어리 추가
        if (type === 'critical' || type === 'heavy' || type === 'bash') {
            this.spawnChunks(x, y, 2 + Math.floor(damage / 5));
            
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.screenFlash('#ff0000', 80, 0.15);
            }
        }
    },
    
    // ==========================================
    // 피 스프레이 생성
    // ==========================================
    spawnSpray(x, y, count, direction = null) {
        for (let i = 0; i < count; i++) {
            let angle;
            if (direction !== null) {
                angle = direction + (Math.random() - 0.5) * Math.PI * 0.8;
            } else {
                angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.2;
            }
            
            const speed = 200 + Math.random() * 400;
            const size = 2 + Math.random() * 4;
            
            this.createParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                size: size,
                type: 'spray',
                life: 1,
                decay: 0.8 + Math.random() * 0.4,
                groundY: y + 80 + Math.random() * 100,
            });
        }
    },
    
    // ==========================================
    // 큰 피 방울 생성
    // ==========================================
    spawnDrops(x, y, count, direction = null) {
        for (let i = 0; i < count; i++) {
            let angle;
            if (direction !== null) {
                angle = direction + (Math.random() - 0.5) * Math.PI * 0.5;
            } else {
                angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
            }
            
            const speed = 150 + Math.random() * 300;
            const size = 5 + Math.random() * 8;
            
            this.createParticle({
                x: x + (Math.random() - 0.5) * 15,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80,
                size: size,
                type: 'drop',
                life: 1,
                decay: 0.5 + Math.random() * 0.3,
                groundY: y + 100 + Math.random() * 80,
            });
        }
    },
    
    // ==========================================
    // 피 덩어리 생성
    // ==========================================
    spawnChunks(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            const size = 8 + Math.random() * 10;
            
            // 불규칙한 모양 생성
            const shape = [];
            const points = 5 + Math.floor(Math.random() * 3);
            for (let j = 0; j < points; j++) {
                const a = (j / points) * Math.PI * 2;
                const r = size * (0.6 + Math.random() * 0.8);
                shape.push(Math.cos(a) * r, Math.sin(a) * r);
            }
            
            this.createParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 120,
                size: size,
                type: 'chunk',
                shape: shape,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 15,
                life: 1,
                decay: 0.4 + Math.random() * 0.2,
                groundY: y + 100 + Math.random() * 60,
            });
        }
    },
    
    // ==========================================
    // 바운스 시 튀는 작은 방울
    // ==========================================
    spawnSplash(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
            const speed = 50 + Math.random() * 100;
            const size = 1 + Math.random() * 2;
            
            this.createParticle({
                x: x + (Math.random() - 0.5) * 10,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                size: size,
                type: 'spray',
                life: 0.8,
                decay: 1.5,
                groundY: y + 20 + Math.random() * 30,
            });
        }
    },
    
    // ==========================================
    // 피 안개 생성
    // ==========================================
    spawnMist(x, y, count) {
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 30;
            
            this.createParticle({
                x: x + offsetX,
                y: y + offsetY,
                vx: (Math.random() - 0.5) * 30,
                vy: -20 - Math.random() * 40,
                size: 25 + Math.random() * 35,
                type: 'mist',
                life: 1,
                decay: 1.5 + Math.random() * 0.5,
                stuck: true,  // 안개는 바닥 충돌 안함
                groundY: 9999,
            });
        }
    },
    
    // ==========================================
    // 바닥 웅덩이 생성
    // ==========================================
    spawnPuddle(x, y, size) {
        this.createParticle({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: size,
            type: 'puddle',
            life: 1,
            decay: 0.1,  // 천천히 사라짐
            stuck: true,
            groundY: 9999,
        });
    },
    
    // ==========================================
    // 파티클 생성 헬퍼
    // ==========================================
    createParticle(config) {
        const g = new PIXI.Graphics();
        this.container.addChild(g);
        
        const particle = {
            graphics: g,
            x: config.x,
            y: config.y,
            vx: config.vx || 0,
            vy: config.vy || 0,
            size: config.size || 5,
            type: config.type || 'drop',
            color: config.color || this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)],
            life: config.life || 1,
            decay: config.decay || 1,
            groundY: config.groundY || this.physics.groundY,
            stuck: config.stuck || false,
            bounceCount: 0,
            rotation: config.rotation || 0,
            rotationSpeed: config.rotationSpeed || 0,
            shape: config.shape || null,
        };
        
        this.particles.push(particle);
        return particle;
    },
    
    // ==========================================
    // 💀 사망 시 대량 출혈
    // ==========================================
    onDeath(x, y, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        // 폭발적인 피 분출
        this.spawnSpray(x, y, 80, null);
        setTimeout(() => this.spawnSpray(x, y, 50, null), 50);
        setTimeout(() => this.spawnSpray(x, y, 30, null), 100);
        
        // 큰 방울들
        this.spawnDrops(x, y, 25, null);
        
        // 피 덩어리
        this.spawnChunks(x, y, 8);
        
        // 안개
        this.spawnMist(x, y, 12);
        
        // 바닥 웅덩이
        setTimeout(() => {
            this.spawnPuddle(x, y + 100, 40 + Math.random() * 30);
        }, 400);
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff0000', 150, 0.3);
            CombatEffects.screenShake(15, 250);
        }
    },
    
    // ==========================================
    // 설정
    // ==========================================
    setEnabled(enabled) {
        this.config.enabled = enabled;
    },
    
    setIntensity(value) {
        this.config.intensity = Math.max(0, Math.min(3, value));
    },
    
    setGroundY(y) {
        this.physics.groundY = y;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.BloodEffect = BloodEffect;
}

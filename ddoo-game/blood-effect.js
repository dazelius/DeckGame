// =====================================================
// Blood Effect System - 모탈컴뱃 스타일 피 효과
// 리얼하고 잔인한 피 표현
// =====================================================

const BloodEffect = {
    app: null,
    container: null,
    game: null,
    initialized: false,
    
    // 설정
    config: {
        enabled: true,
        intensity: 1.2,           // 전체 강도
        particlesPerDamage: 4,    // 대미지 1당 파티클 수
        maxActiveEffects: 200,    // 최대 동시 이펙트
    },
    
    // 피 색상 팔레트 (모탈컴뱃 스타일)
    bloodColors: [
        0xAA0000,  // 선명한 피
        0x880000,  // 진한 빨강
        0x660000,  // 다크 레드
        0x990011,  // 검붉은색
        0xBB1111,  // 밝은 피
        0x770000,  // 어두운 피
    ],
    
    activeEffects: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app, gameWorld = null) {
        this.app = app;
        this.game = typeof game !== 'undefined' ? game : null;
        
        this.container = new PIXI.Container();
        this.container.zIndex = 25;  // 유닛 위에
        this.container.sortableChildren = true;
        
        if (gameWorld) {
            gameWorld.addChild(this.container);
        } else if (app && app.stage) {
            app.stage.addChild(this.container);
        }
        
        this.initialized = true;
        console.log('[BloodEffect] 🩸 모탈컴뱃 스타일 피 시스템 초기화');
    },
    
    // ==========================================
    // 🩸 메인 API - 대미지 기반 피 효과
    // ==========================================
    onDamage(x, y, damage, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        const {
            direction = null,
            type = 'normal',
            color = null,
        } = options;
        
        // 대미지 기반 강도 계산
        const intensity = Math.min(damage / 10, 2) * this.config.intensity;
        
        // 타입별 효과
        switch(type) {
            case 'critical':
                this.criticalBlood(x, y, damage, direction);
                break;
            case 'heavy':
            case 'bash':
                this.heavyBlood(x, y, damage, direction);
                break;
            case 'bleed':
                this.bleedEffect(x, y, damage);
                break;
            default:
                this.normalBlood(x, y, damage, direction);
        }
    },
    
    // ==========================================
    // 일반 피 효과
    // ==========================================
    normalBlood(x, y, damage, direction = null) {
        const count = Math.min(8 + damage * 3, 40);
        
        // 피 스프레이
        this.spawnSpray(x, y, count, direction);
        
        // 큰 방울 몇 개
        this.spawnDroplets(x, y, Math.ceil(count / 4), direction);
        
        // 피 안개
        if (damage >= 5) {
            this.spawnMist(x, y, Math.ceil(damage / 3));
        }
    },
    
    // ==========================================
    // 크리티컬 피 효과 (대량)
    // ==========================================
    criticalBlood(x, y, damage, direction = null) {
        const count = Math.min(20 + damage * 4, 80);
        
        // 대량 스프레이
        this.spawnSpray(x, y, count, direction);
        this.spawnSpray(x, y, count / 2, direction, { delay: 0.05 });
        
        // 큰 방울들
        this.spawnDroplets(x, y, Math.ceil(count / 3), direction, { size: 1.5 });
        
        // 피 줄기
        this.spawnStrings(x, y, 5 + Math.floor(damage / 3));
        
        // 피 안개
        this.spawnMist(x, y, 8 + Math.floor(damage / 2));
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff0000', 100, 0.2);
        }
    },
    
    // ==========================================
    // 강타 피 효과
    // ==========================================
    heavyBlood(x, y, damage, direction = null) {
        const count = Math.min(15 + damage * 3, 60);
        
        // 사방으로 튀는 스프레이
        this.spawnSpray(x, y, count, null);  // 방향 무시, 전방위
        
        // 큰 덩어리들
        this.spawnChunks(x, y, 3 + Math.floor(damage / 5));
        
        // 피 안개
        this.spawnMist(x, y, 5 + Math.floor(damage / 3));
    },
    
    // ==========================================
    // 출혈 효과 (지속)
    // ==========================================
    bleedEffect(x, y, damage) {
        // 소량의 피 흘림
        this.spawnDroplets(x, y, 3 + damage, null, { 
            size: 0.6, 
            speed: 0.5,
            gravity: 1.5 
        });
    },
    
    // ==========================================
    // 🩸 피 스프레이 (작은 방울들)
    // ==========================================
    spawnSpray(x, y, count, direction = null, options = {}) {
        const { delay = 0, size = 1 } = options;
        
        const spawn = () => {
            for (let i = 0; i < count; i++) {
                const g = new PIXI.Graphics();
                
                // 방향 계산
                let angle;
                if (direction !== null) {
                    angle = direction + (Math.random() - 0.5) * Math.PI * 0.8;
                } else {
                    angle = Math.random() * Math.PI * 2;
                }
                
                // 위쪽으로 편향
                angle -= Math.PI * 0.3 * Math.random();
                
                const speed = (100 + Math.random() * 300) * size;
                const particleSize = (2 + Math.random() * 4) * size;
                const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
                
                const startX = x + (Math.random() - 0.5) * 15;
                const startY = y + (Math.random() - 0.5) * 15;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 50 - Math.random() * 80;
                
                // 초기 그리기
                g.circle(startX, startY, particleSize);
                g.fill({ color: color, alpha: 1 });
                this.container.addChild(g);
                
                // 물리 애니메이션
                const duration = 0.4 + Math.random() * 0.4;
                const gravity = 600 + Math.random() * 300;
                
                gsap.to({}, {
                    duration: duration,
                    onUpdate: function() {
                        const t = this.progress();
                        const currentX = startX + vx * t;
                        const currentY = startY + vy * t + 0.5 * gravity * t * t;
                        const currentSize = particleSize * (1 - t * 0.3);
                        const alpha = 1 - t * t;
                        
                        g.clear();
                        if (currentSize > 0.5 && alpha > 0) {
                            g.circle(currentX, currentY, currentSize);
                            g.fill({ color: color, alpha: alpha });
                        }
                    },
                    onComplete: () => {
                        if (g.parent) g.parent.removeChild(g);
                        g.destroy();
                    }
                });
            }
        };
        
        if (delay > 0) {
            setTimeout(spawn, delay * 1000);
        } else {
            spawn();
        }
    },
    
    // ==========================================
    // 🩸 피 방울 (큰 것들)
    // ==========================================
    spawnDroplets(x, y, count, direction = null, options = {}) {
        const { size = 1, speed = 1, gravity = 1 } = options;
        
        for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            
            let angle;
            if (direction !== null) {
                angle = direction + (Math.random() - 0.5) * Math.PI * 0.6;
            } else {
                angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
            }
            
            const dropSpeed = (80 + Math.random() * 200) * speed;
            const dropSize = (5 + Math.random() * 8) * size;
            const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            
            const startX = x + (Math.random() - 0.5) * 10;
            const startY = y + (Math.random() - 0.5) * 10;
            const vx = Math.cos(angle) * dropSpeed;
            const vy = Math.sin(angle) * dropSpeed - 60;
            
            g.circle(startX, startY, dropSize);
            g.fill({ color: color, alpha: 1 });
            this.container.addChild(g);
            
            const duration = 0.6 + Math.random() * 0.5;
            const grav = (500 + Math.random() * 300) * gravity;
            
            gsap.to({}, {
                duration: duration,
                onUpdate: function() {
                    const t = this.progress();
                    const currentX = startX + vx * t;
                    const currentY = startY + vy * t + 0.5 * grav * t * t;
                    
                    // 늘어나는 효과
                    const stretch = 1 + t * 0.5;
                    const currentSizeX = dropSize / stretch;
                    const currentSizeY = dropSize * stretch;
                    const alpha = 1 - t * 0.7;
                    
                    g.clear();
                    if (alpha > 0) {
                        g.ellipse(currentX, currentY, currentSizeX, currentSizeY);
                        g.fill({ color: color, alpha: alpha });
                    }
                },
                onComplete: () => {
                    if (g.parent) g.parent.removeChild(g);
                    g.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 🩸 피 줄기 (늘어지는 효과)
    // ==========================================
    spawnStrings(x, y, count) {
        for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 200 + Math.random() * 250;
            const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            
            const startX = x + (Math.random() - 0.5) * 10;
            const startY = y;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 80;
            
            this.container.addChild(g);
            
            const duration = 0.8 + Math.random() * 0.4;
            const gravity = 700 + Math.random() * 200;
            const trail = [];
            const maxTrail = 12;
            
            gsap.to({}, {
                duration: duration,
                onUpdate: function() {
                    const t = this.progress();
                    const currentX = startX + vx * t;
                    const currentY = startY + vy * t + 0.5 * gravity * t * t;
                    
                    trail.push({ x: currentX, y: currentY, alpha: 1 - t });
                    if (trail.length > maxTrail) trail.shift();
                    
                    g.clear();
                    
                    // 트레일 그리기
                    for (let j = 1; j < trail.length; j++) {
                        const p1 = trail[j - 1];
                        const p2 = trail[j];
                        const alpha = p2.alpha * (j / trail.length);
                        const width = 3 * (j / trail.length);
                        
                        if (alpha > 0.1) {
                            g.moveTo(p1.x, p1.y);
                            g.lineTo(p2.x, p2.y);
                            g.stroke({ width: width, color: color, alpha: alpha });
                        }
                    }
                    
                    // 끝 방울
                    if (trail.length > 0 && (1 - t) > 0.1) {
                        const last = trail[trail.length - 1];
                        g.circle(last.x, last.y, 3);
                        g.fill({ color: color, alpha: 1 - t });
                    }
                },
                onComplete: () => {
                    if (g.parent) g.parent.removeChild(g);
                    g.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 🩸 피 덩어리 (강타용)
    // ==========================================
    spawnChunks(x, y, count) {
        for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            const size = 8 + Math.random() * 10;
            const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            
            const startX = x + (Math.random() - 0.5) * 20;
            const startY = y + (Math.random() - 0.5) * 20;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            
            // 불규칙한 모양
            const points = [];
            const numPoints = 5 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numPoints; j++) {
                const a = (j / numPoints) * Math.PI * 2;
                const r = size * (0.7 + Math.random() * 0.6);
                points.push(Math.cos(a) * r, Math.sin(a) * r);
            }
            
            this.container.addChild(g);
            
            const duration = 0.7 + Math.random() * 0.5;
            const gravity = 600 + Math.random() * 200;
            const rotation = (Math.random() - 0.5) * 10;
            
            gsap.to({}, {
                duration: duration,
                onUpdate: function() {
                    const t = this.progress();
                    const currentX = startX + vx * t;
                    const currentY = startY + vy * t + 0.5 * gravity * t * t;
                    const currentRotation = rotation * t;
                    const alpha = 1 - t * 0.8;
                    const scale = 1 - t * 0.3;
                    
                    g.clear();
                    if (alpha > 0.1) {
                        // 회전 적용된 다각형
                        const rotatedPoints = [];
                        for (let j = 0; j < points.length; j += 2) {
                            const px = points[j] * scale;
                            const py = points[j + 1] * scale;
                            const rx = px * Math.cos(currentRotation) - py * Math.sin(currentRotation);
                            const ry = px * Math.sin(currentRotation) + py * Math.cos(currentRotation);
                            rotatedPoints.push(currentX + rx, currentY + ry);
                        }
                        
                        g.poly(rotatedPoints);
                        g.fill({ color: color, alpha: alpha });
                    }
                },
                onComplete: () => {
                    if (g.parent) g.parent.removeChild(g);
                    g.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 🌫️ 피 안개
    // ==========================================
    spawnMist(x, y, count) {
        for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            
            const size = 20 + Math.random() * 40;
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 30;
            
            this.container.addChild(g);
            
            const duration = 0.5 + Math.random() * 0.3;
            
            gsap.to({}, {
                duration: duration,
                onUpdate: function() {
                    const t = this.progress();
                    const currentX = x + offsetX + (Math.random() - 0.5) * 5;
                    const currentY = y + offsetY - t * 30;
                    const currentSize = size * (1 + t * 0.5);
                    const alpha = 0.3 * (1 - t);
                    
                    g.clear();
                    if (alpha > 0.02) {
                        g.circle(currentX, currentY, currentSize);
                        g.fill({ color: 0x660000, alpha: alpha });
                    }
                },
                onComplete: () => {
                    if (g.parent) g.parent.removeChild(g);
                    g.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 💀 사망 시 대량 출혈
    // ==========================================
    onDeath(x, y, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        // 폭발적인 피 분출
        this.spawnSpray(x, y, 60, null);
        this.spawnSpray(x, y, 40, null, { delay: 0.05 });
        this.spawnSpray(x, y, 30, null, { delay: 0.1 });
        
        // 큰 방울들
        this.spawnDroplets(x, y, 20, null, { size: 1.3 });
        
        // 피 줄기
        this.spawnStrings(x, y, 10);
        
        // 피 덩어리
        this.spawnChunks(x, y, 5);
        
        // 대량 안개
        this.spawnMist(x, y, 15);
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff0000', 150, 0.25);
            CombatEffects.screenShake(12, 200);
        }
    },
    
    // ==========================================
    // 설정
    // ==========================================
    setIntensity(value) {
        this.config.intensity = Math.max(0, Math.min(3, value));
    },
    
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.BloodEffect = BloodEffect;
}

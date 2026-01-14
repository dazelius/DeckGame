// =====================================================
// Dust VFX System - 레트로 스타일 먼지 이펙트
// 심플하고 깔끔한 픽셀 아트 느낌
// =====================================================

const DustVFX = {
    app: null,
    container: null,
    particles: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init(pixiApp, vfxContainer) {
        this.app = pixiApp;
        this.container = vfxContainer;
        this.particles = [];
        
        // 메인 루프에 업데이트 추가
        if (this.app && this.app.ticker) {
            this.app.ticker.add(this.update, this);
        }
        
        console.log('[DustVFX] 레트로 먼지 시스템 초기화 완료');
    },
    
    // ==========================================
    // 파티클 업데이트 (매 프레임)
    // ==========================================
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 물리 업데이트
            p.x += p.vx;
            p.y += p.vy;
            
            // 마찰
            p.vx *= 0.95;
            p.vy *= 0.95;
            
            // 페이드 & 축소
            p.alpha -= p.lifeDecay;
            p.currentSize = p.maxSize * Math.max(0, p.alpha);
            
            // 그래픽 업데이트
            if (p.alpha > 0 && p.graphics && !p.graphics.destroyed) {
                p.graphics.clear();
                p.graphics.rect(
                    p.x - p.currentSize / 2,
                    p.y - p.currentSize / 2,
                    p.currentSize,
                    p.currentSize
                );
                p.graphics.fill({ color: p.color, alpha: p.alpha });
            }
            
            // 죽은 파티클 제거
            if (p.alpha <= 0) {
                if (p.graphics && !p.graphics.destroyed) {
                    p.graphics.destroy();
                }
                this.particles.splice(i, 1);
            }
        }
    },
    
    // ==========================================
    // ★ 파티클 생성 (핵심 함수)
    // ==========================================
    createParticle(x, y, vx, vy, size, color = 0xecf0f1, lifeDecay = 0.02) {
        if (!this.container) return null;
        
        const graphics = new PIXI.Graphics();
        graphics.zIndex = 200;
        
        // 초기 그리기
        graphics.rect(x - size / 2, y - size / 2, size, size);
        graphics.fill({ color: color, alpha: 1 });
        
        this.container.addChild(graphics);
        
        const particle = {
            x, y,
            vx, vy,
            maxSize: size,
            currentSize: size,
            alpha: 1,
            color,
            lifeDecay,
            graphics
        };
        
        this.particles.push(particle);
        return particle;
    },
    
    // ==========================================
    // ★ 퍼프 효과 생성 (여러 파티클)
    // ==========================================
    createPuff(x, y, count, type, intensity = 1.0) {
        if (!this.container) return;
        
        const color = 0xecf0f1;  // 밝은 회색
        
        for (let i = 0; i < count; i++) {
            let vx, vy, size, decay;
            
            switch (type) {
                case 'jump':
                    // 점프: 좌우로 퍼지고 약간 위로
                    vx = (Math.random() - 0.5) * 8 * intensity;
                    vy = (Math.random() - 0.5) * 3 - 2;
                    size = Math.random() * 10 + 6;
                    decay = Math.random() * 0.05 + 0.02;
                    break;
                    
                case 'land':
                    // 착지: 넓게 좌우로 퍼짐
                    vx = (Math.random() - 0.5) * 14 * intensity;
                    vy = (Math.random() - 0.3) * 4;
                    size = Math.random() * 14 + 8;
                    decay = Math.random() * 0.04 + 0.01;
                    break;
                    
                case 'run':
                    // 달리기: 작은 트레일
                    vx = (Math.random() - 0.5) * 4 * intensity;
                    vy = (Math.random() - 0.5) * 2 - 1;
                    size = Math.random() * 8 + 4;
                    decay = Math.random() * 0.08 + 0.04;
                    break;
                    
                case 'dash':
                    // 대쉬: 방향성 있는 강한 먼지
                    vx = (Math.random() - 0.5) * 6 * intensity;
                    vy = (Math.random() - 0.5) * 4 - 2;
                    size = Math.random() * 12 + 6;
                    decay = Math.random() * 0.06 + 0.03;
                    break;
                    
                default:
                    vx = (Math.random() - 0.5) * 4;
                    vy = (Math.random() - 0.5) * 4;
                    size = Math.random() * 6 + 4;
                    decay = 0.03;
            }
            
            this.createParticle(x, y, vx, vy, size, color, decay);
        }
    },
    
    // ==========================================
    // ★ 방향성 있는 퍼프 (대쉬용)
    // direction: 라디안 (0 = 오른쪽)
    // ==========================================
    createDirectionalPuff(x, y, direction, count, intensity = 1.0) {
        if (!this.container) return;
        
        const color = 0xecf0f1;
        const oppositeDir = direction + Math.PI;  // 반대 방향으로 먼지
        
        for (let i = 0; i < count; i++) {
            // 반대 방향 + 약간의 퍼짐
            const spread = (Math.random() - 0.5) * 1.2;
            const angle = oppositeDir + spread;
            const speed = (Math.random() * 6 + 4) * intensity;
            
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1;  // 약간 위로
            
            const size = Math.random() * 10 + 6;
            const decay = Math.random() * 0.05 + 0.02;
            
            this.createParticle(x, y, vx, vy, size, color, decay);
        }
    },
    
    // ==========================================
    // 편의 함수들 (★ 밀도 4배!)
    // ==========================================
    
    // 점프/도약 먼지
    jump(x, y, intensity = 1.0) {
        const count = Math.floor(48 * intensity);  // 24 → 48
        this.createPuff(x, y, count, 'jump', intensity);
    },
    
    // 착지 먼지
    land(x, y, intensity = 1.0) {
        const count = Math.floor(72 * intensity);  // 36 → 72
        this.createPuff(x, y, count, 'land', intensity);
    },
    
    // 달리기 먼지 (트레일)
    run(x, y, intensity = 1.0) {
        const count = Math.floor(20 * intensity);  // 10 → 20
        this.createPuff(x, y, count, 'run', intensity);
    },
    
    // 대쉬 먼지 (방향성)
    dash(x, y, direction, intensity = 1.0) {
        const count = Math.floor(60 * intensity);  // 30 → 60
        this.createDirectionalPuff(x, y, direction, count, intensity);
    },
    
    // ==========================================
    // 유닛 기반 함수들 (게임 통합용)
    // ==========================================
    
    // 유닛 위치에서 도약 먼지
    jumpFromUnit(unit, intensity = 1.0) {
        if (!unit) return;
        const pos = this.getUnitFeet(unit);
        if (pos) this.jump(pos.x, pos.y, intensity);
    },
    
    // 유닛 위치에서 착지 먼지
    landFromUnit(unit, intensity = 1.0) {
        if (!unit) return;
        const pos = this.getUnitFeet(unit);
        if (pos) this.land(pos.x, pos.y, intensity);
    },
    
    // 유닛 위치에서 대쉬 먼지
    dashFromUnit(unit, direction, intensity = 1.0) {
        if (!unit) return;
        const pos = this.getUnitFeet(unit);
        if (pos) this.dash(pos.x, pos.y, direction, intensity);
    },
    
    // 유닛의 발 위치 가져오기
    getUnitFeet(unit) {
        const posTarget = unit.container || unit.sprite;
        if (!posTarget) return null;
        return { x: posTarget.x, y: posTarget.y };
    },
    
    // ==========================================
    // 대쉬 트레일 (이동 중 연속 먼지)
    // ==========================================
    startDashTrail(unit, direction, options = {}) {
        if (!unit || !this.app) return null;
        
        const {
            interval = 50,
            intensity = 0.6,
            maxDuration = 500
        } = options;
        
        const startTime = Date.now();
        let lastPos = this.getUnitFeet(unit) || { x: 0, y: 0 };
        
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxDuration) {
                clearInterval(timer);
                return;
            }
            
            const pos = this.getUnitFeet(unit);
            if (!pos) return;
            
            // 이동했으면 트레일 먼지 생성
            const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
            if (dist > 10) {
                this.run(pos.x, pos.y, intensity);
                lastPos = { ...pos };
            }
        }, interval);
        
        return timer;
    },
    
    stopDashTrail(timer) {
        if (timer) clearInterval(timer);
    },
    
    // 이전 API 호환용
    createDashDust(x, y, direction, intensity = 1.0) {
        this.dash(x, y, direction, intensity);
    },
    
    createLandingDust(x, y, intensity = 1.0) {
        this.land(x, y, intensity);
    },
    
    landingFromUnit(unit, intensity = 1.0) {
        this.landFromUnit(unit, intensity);
    }
};

console.log('[DustVFX] 레트로 먼지 시스템 로드 완료');

// =====================================================
// Blood Effect System - 모탈컴뱃 스타일 피 효과
// 대미지 발생 시 자동으로 피가 튀는 범용 시스템
// =====================================================

const BloodEffect = {
    // PIXI 앱 참조
    app: null,
    container: null,
    
    // 설정
    config: {
        enabled: true,
        intensity: 1.0,        // 전체 강도 (0.5 = 절반, 2.0 = 두배)
        minDamageForBlood: 1,  // 최소 대미지
        particlesPerDamage: 3, // 대미지 1당 파티클 수
        maxParticles: 150,     // 최대 파티클 수
    },
    
    // 피 색상 팔레트 (모탈컴뱃 스타일 - 선명한 빨강)
    bloodColors: [
        0xCC0000,  // 밝은 피
        0x990000,  // 진한 빨강
        0x880000,  // 다크 레드
        0xAA1111,  // 산소 섞인 피
        0x770011,  // 검붉은색
        0xDD2222,  // 선명한 피
    ],
    
    // 파티클 풀
    particles: [],
    activeParticles: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app) {
        this.app = app;
        
        // 피 전용 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.zIndex = 500;  // 유닛 위, UI 아래
        this.container.sortableChildren = true;
        
        if (app && app.stage) {
            app.stage.addChild(this.container);
        }
        
        // 파티클 풀 초기화
        this.initParticlePool();
        
        // 업데이트 루프 시작
        if (app && app.ticker) {
            app.ticker.add(this.update, this);
        }
        
        console.log('[BloodEffect] 🩸 피 효과 시스템 초기화 완료');
    },
    
    // 파티클 풀 초기화
    initParticlePool() {
        for (let i = 0; i < this.config.maxParticles; i++) {
            const particle = this.createParticle();
            particle.visible = false;
            particle.active = false;
            this.particles.push(particle);
            this.container.addChild(particle);
        }
    },
    
    // 파티클 생성
    createParticle() {
        const g = new PIXI.Graphics();
        g.particleData = {
            vx: 0, vy: 0,
            gravity: 0,
            life: 0,
            maxLife: 1,
            size: 1,
            originalSize: 1,
            type: 'drop',
            trail: [],
            rotation: 0,
            rotationSpeed: 0,
            airResistance: 0.99,
            groundY: 9999,
            bounced: false,
            stretch: 1,
        };
        return g;
    },
    
    // 파티클 풀에서 가져오기
    getParticle() {
        for (const p of this.particles) {
            if (!p.active) {
                p.active = true;
                p.visible = true;
                return p;
            }
        }
        // 풀이 가득 찼으면 새로 생성
        const p = this.createParticle();
        p.active = true;
        p.visible = true;
        this.particles.push(p);
        this.container.addChild(p);
        return p;
    },
    
    // ==========================================
    // 🩸 메인 API - 대미지 기반 피 효과
    // ==========================================
    onDamage(x, y, damage, options = {}) {
        if (!this.config.enabled || damage < this.config.minDamageForBlood) return;
        
        const {
            direction = null,     // 피격 방향 (라디안, null이면 랜덤)
            type = 'normal',      // 'normal', 'critical', 'bleed', 'heavy'
            color = null,         // 커스텀 색상
        } = options;
        
        // 대미지에 비례한 파티클 수 계산
        const baseCount = Math.min(
            Math.ceil(damage * this.config.particlesPerDamage * this.config.intensity),
            80
        );
        
        // 타입별 강도 조정
        let intensity = 1;
        let extraEffects = false;
        
        switch (type) {
            case 'critical':
                intensity = 2.0;
                extraEffects = true;
                break;
            case 'heavy':
                intensity = 1.5;
                extraEffects = true;
                break;
            case 'bleed':
                intensity = 0.7;
                break;
        }
        
        // 메인 피 분출
        this.spawnBloodBurst(x, y, baseCount * intensity, direction, color);
        
        // 추가 효과
        if (extraEffects) {
            this.spawnBloodMist(x, y, Math.ceil(baseCount * 0.3));
            if (damage >= 10) {
                this.spawnBloodStrings(x, y, Math.ceil(damage / 5));
            }
        }
        
        // 대미지가 크면 피 줄기 추가
        if (damage >= 15) {
            this.spawnBloodStrings(x, y, Math.ceil(damage / 8));
        }
        
        // 크리티컬이면 화면 효과
        if (type === 'critical' && typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff0000', 80, 0.15);
        }
    },
    
    // ==========================================
    // 🩸 피 분출 (메인)
    // ==========================================
    spawnBloodBurst(x, y, count, direction = null, customColor = null) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            const d = p.particleData;
            
            // 방향 설정
            let angle;
            if (direction !== null) {
                // 타격 방향 기준 + 랜덤 편차
                const spread = Math.PI * (0.3 + Math.random() * 0.5);
                angle = direction + (Math.random() - 0.5) * spread;
            } else {
                // 완전 랜덤 (위쪽 편향)
                angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.5;
            }
            
            // 속도 (파레토 분포 - 대부분 빠르고 일부 느림)
            const speedVar = Math.pow(Math.random(), 0.7);
            const speed = 150 + speedVar * 400;
            
            // 크기 (역 지수 분포 - 작은 것 많이, 큰 것 적게)
            const sizeRoll = Math.random();
            let size;
            if (sizeRoll < 0.5) {
                size = 2 + Math.random() * 3;    // 50%: 작은 방울
            } else if (sizeRoll < 0.85) {
                size = 4 + Math.random() * 5;    // 35%: 중간 방울
            } else {
                size = 7 + Math.random() * 6;    // 15%: 큰 덩어리
            }
            
            // 타입 결정
            const typeRoll = Math.random();
            let type;
            if (typeRoll < 0.5) {
                type = 'spray';
            } else if (typeRoll < 0.85) {
                type = 'drop';
            } else {
                type = 'glob';
            }
            
            // 파티클 설정
            p.x = x + (Math.random() - 0.5) * 10;
            p.y = y + (Math.random() - 0.5) * 10;
            d.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 50;
            d.vy = Math.sin(angle) * speed - 50 - Math.random() * 100;
            d.gravity = 800 + Math.random() * 400;
            d.size = size;
            d.originalSize = size;
            d.life = 1;
            d.maxLife = 0.8 + Math.random() * 0.6;
            d.type = type;
            d.color = customColor || this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            d.rotation = Math.random() * Math.PI * 2;
            d.rotationSpeed = (Math.random() - 0.5) * 10;
            d.airResistance = 0.97 + Math.random() * 0.02;
            d.groundY = y + 100 + Math.random() * 150;
            d.bounced = false;
            d.trail = [];
            d.stretch = 1;
            
            this.activeParticles.push(p);
        }
    },
    
    // ==========================================
    // 🌫️ 피 안개 (미스트)
    // ==========================================
    spawnBloodMist(x, y, count) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            const d = p.particleData;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            
            p.x = x + (Math.random() - 0.5) * 30;
            p.y = y + (Math.random() - 0.5) * 30;
            d.vx = Math.cos(angle) * speed;
            d.vy = Math.sin(angle) * speed - 30;
            d.gravity = 30 + Math.random() * 30;
            d.size = 15 + Math.random() * 30;
            d.originalSize = d.size;
            d.life = 1;
            d.maxLife = 0.5 + Math.random() * 0.3;
            d.type = 'mist';
            d.color = 0x880000;
            d.airResistance = 0.98;
            d.groundY = 9999;
            d.bounced = false;
            d.trail = [];
            
            this.activeParticles.push(p);
        }
    },
    
    // ==========================================
    // 🩸 피 줄기 (늘어지는 효과)
    // ==========================================
    spawnBloodStrings(x, y, count) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            const d = p.particleData;
            
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
            const speed = 200 + Math.random() * 300;
            
            p.x = x + (Math.random() - 0.5) * 20;
            p.y = y + (Math.random() - 0.5) * 20;
            d.vx = Math.cos(angle) * speed;
            d.vy = Math.sin(angle) * speed - 100;
            d.gravity = 600 + Math.random() * 200;
            d.size = 3 + Math.random() * 3;
            d.originalSize = d.size;
            d.life = 1;
            d.maxLife = 1.0 + Math.random() * 0.5;
            d.type = 'string';
            d.color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            d.rotation = 0;
            d.rotationSpeed = 0;
            d.airResistance = 0.98;
            d.groundY = y + 150 + Math.random() * 100;
            d.bounced = false;
            d.trail = [];
            d.maxTrailLength = 8 + Math.floor(Math.random() * 8);
            
            this.activeParticles.push(p);
        }
    },
    
    // ==========================================
    // 💀 사망 시 대량 출혈
    // ==========================================
    onDeath(x, y, options = {}) {
        if (!this.config.enabled) return;
        
        const { overkill = 0 } = options;
        
        // 기본 대량 출혈
        this.spawnBloodBurst(x, y, 60 + Math.random() * 40, null);
        this.spawnBloodMist(x, y, 15);
        this.spawnBloodStrings(x, y, 10);
        
        // 오버킬이면 더 많이
        if (overkill > 0) {
            const extraCount = Math.min(overkill * 5, 100);
            setTimeout(() => {
                this.spawnBloodBurst(x, y, extraCount, null);
            }, 50);
        }
        
        // 피 웅덩이 효과 (GoreVFX 있으면 사용)
        if (typeof GoreVFX !== 'undefined') {
            setTimeout(() => {
                GoreVFX.bloodPool(x, y + 80, { size: 60 + Math.random() * 40 });
            }, 300);
        }
    },
    
    // ==========================================
    // 업데이트 루프
    // ==========================================
    update(delta) {
        const dt = delta / 60;  // 60fps 기준
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            const d = p.particleData;
            
            // 생명 감소
            d.life -= dt / d.maxLife;
            
            if (d.life <= 0) {
                // 파티클 비활성화
                p.active = false;
                p.visible = false;
                p.clear();
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            // 물리 시뮬레이션
            d.vy += d.gravity * dt;
            d.vx *= d.airResistance;
            d.vy *= d.airResistance;
            
            p.x += d.vx * dt;
            p.y += d.vy * dt;
            
            // 트레일 (string 타입)
            if (d.type === 'string' && d.trail) {
                d.trail.push({ x: p.x, y: p.y, alpha: d.life });
                if (d.trail.length > (d.maxTrailLength || 10)) {
                    d.trail.shift();
                }
            }
            
            // 바닥 충돌
            if (p.y >= d.groundY && !d.bounced) {
                d.bounced = true;
                d.vy = -Math.abs(d.vy) * 0.2;
                d.vx *= 0.5;
                d.gravity *= 2;
            }
            
            // 회전
            d.rotation += d.rotationSpeed * dt;
            
            // 늘어남 (속도 기반)
            const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            d.stretch = 1 + Math.min(speed / 200, 2);
            
            // 그리기
            this.drawParticle(p);
        }
    },
    
    // ==========================================
    // 파티클 그리기
    // ==========================================
    drawParticle(p) {
        const d = p.particleData;
        p.clear();
        
        const alpha = Math.min(1, d.life * 1.5);
        
        switch (d.type) {
            case 'spray':
            case 'drop':
                this.drawDrop(p, d, alpha);
                break;
            case 'glob':
                this.drawGlob(p, d, alpha);
                break;
            case 'string':
                this.drawString(p, d, alpha);
                break;
            case 'mist':
                this.drawMist(p, d, alpha);
                break;
        }
    },
    
    // 물방울 그리기
    drawDrop(p, d, alpha) {
        const size = d.size * (0.5 + d.life * 0.5);
        const stretchX = d.stretch;
        const stretchY = 1 / Math.sqrt(d.stretch);
        
        // 방향에 따른 회전
        const angle = Math.atan2(d.vy, d.vx);
        
        p.beginFill(d.color, alpha);
        
        // 타원 그리기 (늘어난 방울)
        const points = [];
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const rx = size * stretchX;
            const ry = size * stretchY;
            const px = Math.cos(a) * rx;
            const py = Math.sin(a) * ry;
            // 회전 적용
            const rotX = px * Math.cos(angle) - py * Math.sin(angle);
            const rotY = px * Math.sin(angle) + py * Math.cos(angle);
            points.push(rotX, rotY);
        }
        p.drawPolygon(points);
        p.endFill();
        
        // 하이라이트
        if (size > 3) {
            p.beginFill(0xFF6666, alpha * 0.3);
            p.drawCircle(-size * 0.2, -size * 0.2, size * 0.3);
            p.endFill();
        }
    },
    
    // 덩어리 그리기
    drawGlob(p, d, alpha) {
        const size = d.size * (0.6 + d.life * 0.4);
        
        // 불규칙한 형태
        const points = [];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const wobble = 0.7 + Math.sin(a * 3 + d.rotation) * 0.3;
            const r = size * wobble;
            points.push(Math.cos(a) * r, Math.sin(a) * r * 0.8);
        }
        
        p.beginFill(d.color, alpha);
        p.drawPolygon(points);
        p.endFill();
        
        // 어두운 중심
        p.beginFill(0x440000, alpha * 0.5);
        p.drawCircle(0, 0, size * 0.4);
        p.endFill();
        
        // 하이라이트
        p.beginFill(0xFF8888, alpha * 0.25);
        p.drawEllipse(-size * 0.25, -size * 0.2, size * 0.3, size * 0.15);
        p.endFill();
    },
    
    // 줄기 그리기
    drawString(p, d, alpha) {
        if (!d.trail || d.trail.length < 2) {
            this.drawDrop(p, d, alpha);
            return;
        }
        
        // 트레일 선 그리기
        p.lineStyle(d.size * 1.2, d.color, alpha * 0.7);
        p.moveTo(d.trail[0].x - p.x, d.trail[0].y - p.y);
        
        for (let i = 1; i < d.trail.length; i++) {
            const t = d.trail[i];
            p.lineTo(t.x - p.x, t.y - p.y);
        }
        p.lineTo(0, 0);
        
        // 끝점에 방울
        p.lineStyle(0);
        p.beginFill(d.color, alpha);
        p.drawCircle(0, 0, d.size);
        p.endFill();
    },
    
    // 미스트 그리기
    drawMist(p, d, alpha) {
        const size = d.size * (1 + (1 - d.life) * 0.5);
        
        // 그라데이션 효과 (여러 원 중첩)
        for (let i = 3; i >= 0; i--) {
            const ratio = i / 3;
            const r = size * (0.3 + ratio * 0.7);
            const a = alpha * (1 - ratio) * 0.3;
            p.beginFill(d.color, a);
            p.drawCircle(0, 0, r);
            p.endFill();
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    
    // 설정 변경
    setConfig(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
            console.log(`[BloodEffect] ${key} = ${value}`);
        }
    },
    
    // 활성화/비활성화
    setEnabled(enabled) {
        this.config.enabled = enabled;
        console.log(`[BloodEffect] ${enabled ? '활성화' : '비활성화'}`);
    },
    
    // 모든 파티클 정리
    clear() {
        for (const p of this.activeParticles) {
            p.active = false;
            p.visible = false;
            p.clear();
        }
        this.activeParticles = [];
    },
};

// 전역 노출
window.BloodEffect = BloodEffect;

console.log('[BloodEffect] 🩸 blood-effect.js 로드 완료');

// =====================================================
// VFX Library - 독립적인 VFX 컴포넌트 라이브러리
// 모든 VFX는 이 파일에서 관리
// =====================================================

const VFXLibrary = {
    app: null,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(pixiApp, vfxContainer) {
        this.app = pixiApp;
        this.container = vfxContainer;
        console.log('[VFXLibrary] VFX 라이브러리 초기화 완료');
    },
    
    // ==========================================
    // 컨테이너 가져오기 (폴백 포함)
    // ==========================================
    getContainer() {
        if (this.container) return this.container;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            return CombatEffects.container;
        }
        if (this.app?.stage) return this.app.stage;
        return null;
    },
    
    // ==========================================
    // ★ 찌르기 이펙트 (Stab)
    // 깊숙히 찌르는 날카로운 관통감
    // ==========================================
    stab(x, y, options = {}) {
        const {
            direction = 1,
            color = 0x88ccff,
            intensity = 1,
            length = 80,
            width = 12
        } = options;
        
        const container = this.getContainer();
        if (!container) return null;
        
        const vfxContainer = new PIXI.Container();
        vfxContainer.x = x;
        vfxContainer.y = y;
        vfxContainer.zIndex = 150;
        container.addChild(vfxContainer);
        
        const len = length * intensity;
        const w = width * intensity;
        
        // 1. 찌르기 궤적 (날카로운 삼각형)
        const stabLine = new PIXI.Graphics();
        stabLine.moveTo(-len * 0.3 * direction, 0);
        stabLine.lineTo(len * 0.7 * direction, -w / 2);
        stabLine.lineTo(len * direction, 0);
        stabLine.lineTo(len * 0.7 * direction, w / 2);
        stabLine.closePath();
        stabLine.fill({ color: color, alpha: 0.9 });
        
        // 중심 하이라이트
        stabLine.moveTo(0, 0);
        stabLine.lineTo(len * 0.8 * direction, -w / 4);
        stabLine.lineTo(len * 0.95 * direction, 0);
        stabLine.lineTo(len * 0.8 * direction, w / 4);
        stabLine.closePath();
        stabLine.fill({ color: 0xffffff, alpha: 0.8 });
        vfxContainer.addChild(stabLine);
        
        // 2. 관통 스파크 (뒤로 튀는 파편)
        for (let i = 0; i < 6 * intensity; i++) {
            const spark = new PIXI.Graphics();
            const sparkLen = 15 + Math.random() * 25;
            const angle = Math.PI + (Math.random() - 0.5) * 1.2;
            
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * sparkLen, Math.sin(angle) * sparkLen);
            spark.stroke({ width: 2 + Math.random() * 2, color: 0xffffff, alpha: 0.9 });
            
            spark.x = len * 0.6 * direction;
            spark.y = (Math.random() - 0.5) * 20;
            vfxContainer.addChild(spark);
            
            gsap.to(spark, {
                x: spark.x + Math.cos(angle) * (40 + Math.random() * 30) * direction,
                y: spark.y + Math.sin(angle) * (30 + Math.random() * 20),
                alpha: 0,
                duration: 0.15 + Math.random() * 0.1,
                ease: 'power2.out'
            });
        }
        
        // 3. 관통 임팩트 링
        const impactRing = new PIXI.Graphics();
        impactRing.circle(len * 0.8 * direction, 0, 8);
        impactRing.stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
        vfxContainer.addChild(impactRing);
        
        gsap.to(impactRing.scale, { x: 2.5, y: 2.5, duration: 0.12, ease: 'power2.out' });
        gsap.to(impactRing, { alpha: 0, duration: 0.12 });
        
        // 4. 깊이감 관통 라인
        const throughLine = new PIXI.Graphics();
        throughLine.moveTo(-len * 0.5 * direction, 0);
        throughLine.lineTo(len * 1.2 * direction, 0);
        throughLine.stroke({ width: 4, color: color, alpha: 0.6 });
        vfxContainer.addChild(throughLine);
        
        gsap.to(throughLine.scale, { x: 1.5, duration: 0.1, ease: 'power2.out' });
        gsap.to(throughLine, { alpha: 0, duration: 0.15 });
        
        // 5. 메인 애니메이션
        stabLine.alpha = 0;
        stabLine.scale.x = 0.3;
        
        gsap.timeline()
            .to(stabLine, { alpha: 1, duration: 0.03 })
            .to(stabLine.scale, { x: 1.2, duration: 0.06, ease: 'power3.out' }, 0)
            .to(stabLine.scale, { x: 0.8, y: 1.5, duration: 0.08, ease: 'power2.in' }, 0.06)
            .to(stabLine, { alpha: 0, duration: 0.06 }, 0.1);
        
        // 정리
        setTimeout(() => {
            if (!vfxContainer.destroyed) vfxContainer.destroy({ children: true });
        }, 300);
        
        return vfxContainer;
    },
    
    // ==========================================
    // ★ 연속 찌르기 콤보
    // ==========================================
    flurryStab(x, y, options = {}) {
        const {
            direction = 1,
            hitIndex = 0,
            color = 0x88ccff
        } = options;
        
        const offsetY = (hitIndex - 1) * 8;
        const intensity = 0.8 + hitIndex * 0.15;
        
        this.stab(x, y + offsetY, { direction, color, intensity });
        this.burst(x + direction * 40, y + offsetY, { color, count: 4 + hitIndex });
        
        if (hitIndex >= 2) {
            this.screenShake(6, 100);
            this.afterglow(x, y, { direction, length: 130, color: 0xffffff });
        }
    },
    
    // ==========================================
    // ★ 슬래시 이펙트
    // ==========================================
    slash(x, y, options = {}) {
        const {
            angle = -45,
            color = 0xffffff,
            scale = 1,
            width = 120,
            height = 15
        } = options;
        
        const container = this.getContainer();
        if (!container) return null;
        
        const slash = new PIXI.Graphics();
        slash.x = x;
        slash.y = y;
        slash.rotation = angle * Math.PI / 180;
        slash.alpha = 0;
        slash.zIndex = 100;
        
        const w = width * scale;
        const h = height * scale;
        
        // 메인 슬래시
        slash.moveTo(-w/2, 0);
        slash.lineTo(0, -h/2);
        slash.lineTo(w/2, 0);
        slash.lineTo(0, h/2);
        slash.closePath();
        slash.fill({ color: color, alpha: 0.9 });
        
        // 글로우
        slash.moveTo(-w/2 * 0.8, 0);
        slash.lineTo(0, -h/2 * 0.6);
        slash.lineTo(w/2 * 0.8, 0);
        slash.lineTo(0, h/2 * 0.6);
        slash.closePath();
        slash.fill({ color: 0xffffff, alpha: 0.6 });
        
        container.addChild(slash);
        
        gsap.timeline()
            .to(slash, { alpha: 1, duration: 0.05 })
            .to(slash.scale, { x: 1.5, y: 0.5, duration: 0.15, ease: 'power2.out' }, 0)
            .to(slash, { alpha: 0, duration: 0.1, delay: 0.1, onComplete: () => slash.destroy() });
        
        return slash;
    },
    
    // ==========================================
    // ★ 강타 슬래시 (Heavy Slash)
    // ==========================================
    heavySlash(x, y, options = {}) {
        const {
            angle = -30,
            color = 0xff8800
        } = options;
        
        // 메인 슬래시
        this.slash(x, y, { angle, color, scale: 1.5 });
        
        // 추가 슬래시
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.slash(
                    x + (Math.random() - 0.5) * 40,
                    y + (Math.random() - 0.5) * 40,
                    {
                        angle: angle + (Math.random() - 0.5) * 30,
                        color: 0xffaa00,
                        scale: 0.6 + Math.random() * 0.4
                    }
                );
            }, i * 30);
        }
    },
    
    // ==========================================
    // ★ 버스트 파티클
    // ==========================================
    burst(x, y, options = {}) {
        const {
            color = 0xffffff,
            count = 8,
            speed = 80,
            size = 4,
            duration = 0.3
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const dist = speed * (0.5 + Math.random() * 0.5);
            
            particle.circle(0, 0, size * (0.5 + Math.random() * 0.5));
            particle.fill({ color: color, alpha: 1 });
            particle.x = x;
            particle.y = y;
            particle.zIndex = 100;
            container.addChild(particle);
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: duration * (0.7 + Math.random() * 0.6),
                ease: 'power2.out',
                onComplete: () => { if (!particle.destroyed) particle.destroy(); }
            });
        }
    },
    
    // ==========================================
    // ★ 임팩트 링
    // ==========================================
    impactRing(x, y, options = {}) {
        const {
            color = 0xffffff,
            size = 30,
            rings = 2,
            duration = 0.25
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        for (let i = 0; i < rings; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, size);
            ring.stroke({ width: 4 - i, color: color, alpha: 0.8 });
            ring.x = x;
            ring.y = y;
            ring.zIndex = 100;
            container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 3 + i,
                y: 3 + i,
                duration: duration,
                delay: i * 0.05,
                ease: 'power2.out'
            });
            gsap.to(ring, {
                alpha: 0,
                duration: duration,
                delay: i * 0.05,
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
    },
    
    // ==========================================
    // ★ 충격파
    // ==========================================
    shockwave(x, y, options = {}) {
        const {
            color = 0xffffff,
            size = 50,
            duration = 0.3
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        const wave = new PIXI.Graphics();
        wave.circle(0, 0, size);
        wave.stroke({ width: 6, color: color, alpha: 0.9 });
        wave.x = x;
        wave.y = y;
        wave.zIndex = 90;
        container.addChild(wave);
        
        gsap.to(wave.scale, { x: 4, y: 4, duration: duration, ease: 'power2.out' });
        gsap.to(wave, { alpha: 0, duration: duration, onComplete: () => wave.destroy() });
    },
    
    // ==========================================
    // ★ 잔광 (Afterglow)
    // ==========================================
    afterglow(x, y, options = {}) {
        const {
            direction = 1,
            length = 100,
            color = 0xffffff,
            duration = 0.2
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        const glow = new PIXI.Graphics();
        glow.moveTo(x - direction * 30, y);
        glow.lineTo(x + direction * length, y);
        glow.stroke({ width: 6, color: color, alpha: 0.7 });
        glow.zIndex = 140;
        container.addChild(glow);
        
        gsap.to(glow, {
            alpha: 0,
            duration: duration,
            onComplete: () => { if (!glow.destroyed) glow.destroy(); }
        });
    },
    
    // ==========================================
    // ★ 플래시
    // ==========================================
    flash(x, y, options = {}) {
        const {
            color = 0xffffff,
            size = 40,
            duration = 0.15
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, size);
        flash.fill({ color: color, alpha: 1 });
        flash.x = x;
        flash.y = y;
        flash.zIndex = 200;
        container.addChild(flash);
        
        gsap.to(flash.scale, { x: 2, y: 2, duration: duration * 0.5, ease: 'power2.out' });
        gsap.to(flash, { alpha: 0, duration: duration, onComplete: () => flash.destroy() });
    },
    
    // ==========================================
    // ★ 스크린 쉐이크
    // ==========================================
    screenShake(intensity = 10, duration = 200) {
        if (typeof CombatEffects !== 'undefined' && CombatEffects.screenShake) {
            CombatEffects.screenShake(intensity, duration);
        }
    },
    
    // ==========================================
    // ★ 스크린 플래시
    // ==========================================
    screenFlash(color = '#ffffff', duration = 100, alpha = 0.5) {
        if (typeof CombatEffects !== 'undefined' && CombatEffects.screenFlash) {
            CombatEffects.screenFlash(color, duration, alpha);
        }
    },
    
    // ==========================================
    // ★ 번개 볼트
    // ==========================================
    lightning(x1, y1, x2, y2, options = {}) {
        const {
            color = 0x88ccff,
            segments = 10,
            width = 6,
            branches = true
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        const vfxContainer = new PIXI.Container();
        vfxContainer.zIndex = 200;
        container.addChild(vfxContainer);
        
        // 번개 경로 생성
        const points = [{ x: x1, y: y1 }];
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const maxOffset = Math.min(40, dist * 0.2);
        
        for (let i = 1; i < segments; i++) {
            points.push({
                x: x1 + dx * i + (Math.random() - 0.5) * maxOffset,
                y: y1 + dy * i + (Math.random() - 0.5) * maxOffset * 0.7
            });
        }
        points.push({ x: x2, y: y2 });
        
        // 레이어들
        const layers = [
            { width: width * 3, color: color, alpha: 0.3 },
            { width: width * 1.5, color: color, alpha: 0.6 },
            { width: width, color: 0xffffff, alpha: 0.9 },
            { width: width * 0.4, color: 0xffffff, alpha: 1 }
        ];
        
        layers.forEach(layer => {
            const bolt = new PIXI.Graphics();
            bolt.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                bolt.lineTo(points[i].x, points[i].y);
            }
            bolt.stroke({ width: layer.width, color: layer.color, alpha: layer.alpha });
            vfxContainer.addChild(bolt);
        });
        
        // 분기
        if (branches) {
            for (let i = 2; i < points.length - 2; i++) {
                if (Math.random() > 0.5) {
                    const branch = new PIXI.Graphics();
                    const angle = Math.random() * Math.PI * 2;
                    const len = 20 + Math.random() * 40;
                    let cx = points[i].x;
                    let cy = points[i].y;
                    
                    branch.moveTo(cx, cy);
                    for (let j = 0; j < 3; j++) {
                        cx += Math.cos(angle + (Math.random() - 0.5) * 0.8) * (len / 3);
                        cy += Math.sin(angle + (Math.random() - 0.5) * 0.8) * (len / 3);
                        branch.lineTo(cx, cy);
                    }
                    branch.stroke({ width: 2, color: color, alpha: 0.7 });
                    vfxContainer.addChild(branch);
                }
            }
        }
        
        // 페이드아웃
        gsap.to(vfxContainer, {
            alpha: 0,
            duration: 0.15,
            delay: 0.05,
            onComplete: () => {
                if (!vfxContainer.destroyed) vfxContainer.destroy({ children: true });
            }
        });
        
        return vfxContainer;
    },
    
    // ==========================================
    // ★ 전기 스파크
    // ==========================================
    electricSpark(x, y, options = {}) {
        const {
            color = 0x88ccff,
            count = 8,
            length = 50
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        for (let i = 0; i < count; i++) {
            const spark = new PIXI.Graphics();
            const angle = (i / count) * Math.PI * 2;
            const len = length * (0.5 + Math.random() * 0.5);
            
            // 지그재그 번개
            let cx = 0, cy = 0;
            spark.moveTo(cx, cy);
            for (let j = 0; j < 4; j++) {
                cx += Math.cos(angle + (Math.random() - 0.5) * 0.5) * (len / 4);
                cy += Math.sin(angle + (Math.random() - 0.5) * 0.5) * (len / 4);
                spark.lineTo(cx, cy);
            }
            spark.stroke({ width: 2 + Math.random() * 2, color: color, alpha: 0.9 });
            
            spark.x = x;
            spark.y = y;
            spark.zIndex = 150;
            container.addChild(spark);
            
            gsap.to(spark, {
                alpha: 0,
                duration: 0.2 + Math.random() * 0.1,
                ease: 'power2.out',
                onComplete: () => { if (!spark.destroyed) spark.destroy(); }
            });
        }
    },
    
    // ==========================================
    // ★ 물 스플래시
    // ==========================================
    waterSplash(x, y, options = {}) {
        const {
            color = 0x4488ff,
            count = 12,
            height = 60
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        for (let i = 0; i < count; i++) {
            const drop = new PIXI.Graphics();
            drop.circle(0, 0, 3 + Math.random() * 4);
            drop.fill({ color: i % 3 === 0 ? 0xffffff : color, alpha: 0.9 });
            
            drop.x = x + (Math.random() - 0.5) * 40;
            drop.y = y;
            drop.zIndex = 100;
            container.addChild(drop);
            
            const targetX = drop.x + (Math.random() - 0.5) * 80;
            const peakY = y - height * (0.5 + Math.random() * 0.5);
            
            gsap.to(drop, {
                x: targetX,
                y: peakY,
                duration: 0.2,
                ease: 'power2.out'
            });
            gsap.to(drop, {
                y: y + 20,
                alpha: 0,
                duration: 0.3,
                delay: 0.2,
                ease: 'power2.in',
                onComplete: () => { if (!drop.destroyed) drop.destroy(); }
            });
        }
    },
    
    // ==========================================
    // ★ 화염
    // ==========================================
    fire(x, y, options = {}) {
        const {
            color = 0xff6600,
            count = 10,
            height = 50
        } = options;
        
        const container = this.getContainer();
        if (!container) return;
        
        for (let i = 0; i < count; i++) {
            const flame = new PIXI.Graphics();
            const size = 8 + Math.random() * 12;
            
            // 불꽃 모양
            flame.moveTo(0, size);
            flame.lineTo(-size * 0.5, 0);
            flame.lineTo(0, -size);
            flame.lineTo(size * 0.5, 0);
            flame.closePath();
            flame.fill({ color: i % 2 === 0 ? color : 0xffaa00, alpha: 0.9 });
            
            flame.x = x + (Math.random() - 0.5) * 30;
            flame.y = y;
            flame.zIndex = 100;
            container.addChild(flame);
            
            gsap.to(flame, {
                x: flame.x + (Math.random() - 0.5) * 20,
                y: y - height * (0.3 + Math.random() * 0.7),
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => { if (!flame.destroyed) flame.destroy(); }
            });
            
            gsap.to(flame.scale, {
                x: 0.3,
                y: 0.3,
                duration: 0.4,
                ease: 'power2.in'
            });
        }
    },
    
    // ==========================================
    // ★ 유닛 기준 VFX (VFXAnchor 연동)
    // ==========================================
    atUnit(unit, vfxType, anchorType = 'center', options = {}) {
        if (typeof VFXAnchor === 'undefined') {
            console.warn('[VFXLibrary] VFXAnchor가 없습니다.');
            return;
        }
        
        const pos = VFXAnchor.getAnchorPoint(unit, anchorType, options);
        
        switch (vfxType) {
            case 'stab':
                return this.stab(pos.x, pos.y, options);
            case 'slash':
                return this.slash(pos.x, pos.y, options);
            case 'burst':
                return this.burst(pos.x, pos.y, options);
            case 'flash':
                return this.flash(pos.x, pos.y, options);
            case 'impactRing':
                return this.impactRing(pos.x, pos.y, options);
            case 'shockwave':
                return this.shockwave(pos.x, pos.y, options);
            case 'electricSpark':
                return this.electricSpark(pos.x, pos.y, options);
            case 'waterSplash':
                return this.waterSplash(pos.x, pos.y, options);
            case 'fire':
                return this.fire(pos.x, pos.y, options);
            default:
                console.warn(`[VFXLibrary] 알 수 없는 VFX 타입: ${vfxType}`);
        }
    }
};

console.log('[VFXLibrary] VFX 라이브러리 로드 완료');

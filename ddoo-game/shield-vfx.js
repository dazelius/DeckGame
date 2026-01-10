// ==========================================
// Shield VFX System - 실드 시각 효과 시스템
// ==========================================

const ShieldVFX = {
    app: null,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app, container) {
        this.app = app;
        this.container = container || app?.stage;
        console.log('[ShieldVFX] 실드 VFX 시스템 초기화');
    },
    
    // ==========================================
    // 실드 파괴 연출 (메인)
    // ==========================================
    shieldBreak(x, y, options = {}) {
        if (!this.app || !this.container) return;
        
        const {
            shieldAmount = 10,        // 파괴된 실드량
            color = 0x4488ff,         // 실드 색상
            size = 60,                // 실드 크기
            intensity = 1.0           // 연출 강도
        } = options;
        
        console.log(`[ShieldVFX] 실드 파괴! x:${x}, y:${y}, amount:${shieldAmount}`);
        
        // 1. 화면 효과
        this.shieldBreakFlash();
        
        // 2. 파편 폭발
        this.shieldShatter(x, y, { color, size, intensity });
        
        // 3. 충격파 링
        this.shieldShockwave(x, y, { color, size });
        
        // 4. 전기 스파크
        this.electricSparks(x, y, { color, intensity });
        
        // 5. 에너지 해체
        this.energyDissipate(x, y, { color, size });
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    shieldBreakFlash() {
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#4488ff', 80, 0.4);
            CombatEffects.screenShake(8, 150);
        }
    },
    
    // ==========================================
    // 실드 파편 폭발
    // ==========================================
    shieldShatter(x, y, options = {}) {
        const { color = 0x4488ff, size = 60, intensity = 1.0 } = options;
        
        const NUM_SHARDS = Math.floor(20 * intensity);
        
        for (let i = 0; i < NUM_SHARDS; i++) {
            const shard = new PIXI.Graphics();
            shard.x = x;
            shard.y = y;
            shard.zIndex = 300;
            
            // 다양한 파편 모양
            const shardType = Math.floor(Math.random() * 3);
            const shardSize = 4 + Math.random() * 12;
            
            // 색상 변화 (밝은 파랑 ~ 진한 파랑)
            const colorVariation = this.varyColor(color, 0.3);
            
            if (shardType === 0) {
                // 삼각형 파편
                shard.poly([
                    { x: 0, y: -shardSize },
                    { x: shardSize * 0.6, y: shardSize * 0.5 },
                    { x: -shardSize * 0.6, y: shardSize * 0.5 }
                ]);
            } else if (shardType === 1) {
                // 사각형 파편
                const w = shardSize * (0.5 + Math.random() * 0.5);
                const h = shardSize * (0.3 + Math.random() * 0.7);
                shard.rect(-w/2, -h/2, w, h);
            } else {
                // 마름모 파편
                shard.poly([
                    { x: 0, y: -shardSize },
                    { x: shardSize * 0.5, y: 0 },
                    { x: 0, y: shardSize * 0.7 },
                    { x: -shardSize * 0.5, y: 0 }
                ]);
            }
            
            shard.fill({ color: colorVariation, alpha: 0.9 });
            shard.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
            
            // 글로우 효과
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, shardSize * 0.8);
            glow.fill({ color: color, alpha: 0.3 });
            shard.addChildAt(glow, 0);
            
            this.container.addChild(shard);
            
            // 방사형 폭발
            const angle = (i / NUM_SHARDS) * Math.PI * 2 + Math.random() * 0.5;
            const distance = (size * 0.5) + Math.random() * (size * 1.5);
            const duration = 0.4 + Math.random() * 0.3;
            
            // 회전하면서 날아감
            shard.rotation = Math.random() * Math.PI * 2;
            
            gsap.to(shard, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance + 20,  // 약간 아래로 (중력)
                rotation: shard.rotation + (Math.random() - 0.5) * Math.PI * 4,
                alpha: 0,
                duration: duration,
                ease: 'power2.out',
                onComplete: () => {
                    if (!shard.destroyed) shard.destroy({ children: true });
                }
            });
            
            gsap.to(shard.scale, {
                x: 0.2, y: 0.2,
                duration: duration * 0.8
            });
        }
    },
    
    // ==========================================
    // 충격파 링
    // ==========================================
    shieldShockwave(x, y, options = {}) {
        const { color = 0x4488ff, size = 60 } = options;
        
        // 이중 충격파
        for (let wave = 0; wave < 2; wave++) {
            const ring = new PIXI.Graphics();
            ring.x = x;
            ring.y = y;
            ring.zIndex = 295;
            
            const ringRadius = size * 0.3;
            const strokeWidth = 4 - wave * 1.5;
            
            ring.circle(0, 0, ringRadius);
            ring.stroke({ 
                color: wave === 0 ? 0xffffff : color, 
                width: strokeWidth, 
                alpha: 0.9 - wave * 0.3 
            });
            
            this.container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 4 + wave, y: 3 + wave * 0.5,  // 타원형 확장
                duration: 0.35 + wave * 0.1,
                ease: 'power2.out'
            });
            
            gsap.to(ring, {
                alpha: 0,
                duration: 0.35 + wave * 0.1,
                delay: wave * 0.05,
                onComplete: () => {
                    if (!ring.destroyed) ring.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 전기 스파크
    // ==========================================
    electricSparks(x, y, options = {}) {
        const { color = 0x4488ff, intensity = 1.0 } = options;
        
        const NUM_SPARKS = Math.floor(12 * intensity);
        
        for (let i = 0; i < NUM_SPARKS; i++) {
            const spark = new PIXI.Graphics();
            spark.x = x;
            spark.y = y;
            spark.zIndex = 310;
            
            // 지그재그 번개 모양
            const segments = 3 + Math.floor(Math.random() * 3);
            const totalLength = 20 + Math.random() * 40;
            const baseAngle = Math.random() * Math.PI * 2;
            
            let px = 0, py = 0;
            spark.moveTo(px, py);
            
            for (let s = 0; s < segments; s++) {
                const segmentLength = totalLength / segments;
                const angleVariation = (Math.random() - 0.5) * 1.2;
                px += Math.cos(baseAngle + angleVariation) * segmentLength;
                py += Math.sin(baseAngle + angleVariation) * segmentLength;
                spark.lineTo(px, py);
            }
            
            spark.stroke({ color: 0xffffff, width: 2, alpha: 1 });
            
            // 글로우 라인
            const glowSpark = spark.clone();
            glowSpark.clear();
            glowSpark.moveTo(0, 0);
            px = 0; py = 0;
            for (let s = 0; s < segments; s++) {
                const segmentLength = totalLength / segments;
                const angleVariation = (Math.random() - 0.5) * 1.2;
                px += Math.cos(baseAngle + angleVariation) * segmentLength;
                py += Math.sin(baseAngle + angleVariation) * segmentLength;
                glowSpark.lineTo(px, py);
            }
            glowSpark.stroke({ color: color, width: 5, alpha: 0.4 });
            spark.addChildAt(glowSpark, 0);
            
            this.container.addChild(spark);
            
            // 빠르게 나타났다 사라짐
            spark.alpha = 0;
            gsap.to(spark, {
                alpha: 1,
                duration: 0.02,
                delay: i * 0.02
            });
            
            gsap.to(spark, {
                alpha: 0,
                duration: 0.15,
                delay: 0.05 + i * 0.02,
                onComplete: () => {
                    if (!spark.destroyed) spark.destroy({ children: true });
                }
            });
        }
    },
    
    // ==========================================
    // 에너지 해체 (육각형 패턴)
    // ==========================================
    energyDissipate(x, y, options = {}) {
        const { color = 0x4488ff, size = 60 } = options;
        
        // 육각형 에너지 패턴
        const NUM_HEXES = 8;
        
        for (let i = 0; i < NUM_HEXES; i++) {
            const hex = new PIXI.Graphics();
            const angle = (i / NUM_HEXES) * Math.PI * 2;
            const dist = size * 0.3 + Math.random() * size * 0.3;
            
            hex.x = x + Math.cos(angle) * dist;
            hex.y = y + Math.sin(angle) * dist;
            hex.zIndex = 290;
            
            // 육각형 그리기
            const hexSize = 8 + Math.random() * 12;
            const points = [];
            for (let h = 0; h < 6; h++) {
                const hexAngle = (h / 6) * Math.PI * 2;
                points.push({
                    x: Math.cos(hexAngle) * hexSize,
                    y: Math.sin(hexAngle) * hexSize
                });
            }
            
            hex.poly(points);
            hex.fill({ color: color, alpha: 0.4 });
            hex.stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
            
            this.container.addChild(hex);
            
            // 회전하며 확장 후 소멸
            gsap.to(hex, {
                x: hex.x + Math.cos(angle) * 40,
                y: hex.y + Math.sin(angle) * 30,
                rotation: Math.random() * Math.PI,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.2,
                delay: i * 0.03,
                ease: 'power2.out',
                onComplete: () => {
                    if (!hex.destroyed) hex.destroy();
                }
            });
            
            gsap.to(hex.scale, {
                x: 0.3, y: 0.3,
                duration: 0.5,
                delay: i * 0.03
            });
        }
        
        // 중앙 에너지 폭발
        const coreBlast = new PIXI.Graphics();
        coreBlast.x = x;
        coreBlast.y = y;
        coreBlast.zIndex = 305;
        
        coreBlast.circle(0, 0, size * 0.4);
        coreBlast.fill({ color: 0xffffff, alpha: 0.8 });
        
        this.container.addChild(coreBlast);
        
        gsap.to(coreBlast, {
            alpha: 0,
            duration: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                if (!coreBlast.destroyed) coreBlast.destroy();
            }
        });
        
        gsap.to(coreBlast.scale, {
            x: 2.5, y: 2.5,
            duration: 0.15
        });
    },
    
    // ==========================================
    // 실드 흡수 연출 (데미지 블록)
    // ==========================================
    shieldAbsorb(x, y, absorbedAmount, options = {}) {
        if (!this.app || !this.container) return;
        
        const { color = 0x4488ff } = options;
        
        // 흡수 임팩트 링
        const impactRing = new PIXI.Graphics();
        impactRing.x = x;
        impactRing.y = y;
        impactRing.zIndex = 280;
        
        impactRing.circle(0, 0, 30);
        impactRing.stroke({ color: color, width: 4, alpha: 0.8 });
        
        this.container.addChild(impactRing);
        
        // 수축 후 확장
        gsap.fromTo(impactRing.scale, 
            { x: 1.5, y: 1.5 },
            { x: 0.5, y: 0.5, duration: 0.1, ease: 'power2.in',
              onComplete: () => {
                  gsap.to(impactRing.scale, {
                      x: 2, y: 2,
                      duration: 0.2,
                      ease: 'power2.out'
                  });
                  gsap.to(impactRing, {
                      alpha: 0,
                      duration: 0.2,
                      onComplete: () => {
                          if (!impactRing.destroyed) impactRing.destroy();
                      }
                  });
              }
            }
        );
        
        // 에너지 파동
        for (let i = 0; i < 6; i++) {
            const wave = new PIXI.Graphics();
            const angle = (i / 6) * Math.PI * 2;
            
            wave.x = x + Math.cos(angle) * 15;
            wave.y = y + Math.sin(angle) * 15;
            wave.zIndex = 275;
            
            wave.circle(0, 0, 5);
            wave.fill({ color: 0xffffff, alpha: 0.7 });
            
            this.container.addChild(wave);
            
            // 중심으로 수렴
            gsap.to(wave, {
                x: x,
                y: y,
                alpha: 0,
                duration: 0.15,
                delay: i * 0.02,
                ease: 'power2.in',
                onComplete: () => {
                    if (!wave.destroyed) wave.destroy();
                }
            });
            
            gsap.to(wave.scale, {
                x: 0.3, y: 0.3,
                duration: 0.15,
                delay: i * 0.02
            });
        }
    },
    
    // ==========================================
    // 실드 활성화 연출
    // ==========================================
    shieldActivate(x, y, options = {}) {
        if (!this.app || !this.container) return;
        
        const { color = 0x4488ff, size = 50 } = options;
        
        // 육각형 실드 생성
        const shield = new PIXI.Graphics();
        shield.x = x;
        shield.y = y;
        shield.zIndex = 250;
        shield.alpha = 0;
        
        // 육각형
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            hexPoints.push({
                x: Math.cos(angle) * size,
                y: Math.sin(angle) * size
            });
        }
        
        shield.poly(hexPoints);
        shield.fill({ color: color, alpha: 0.2 });
        shield.stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
        
        this.container.addChild(shield);
        
        // 나타나기
        shield.scale.set(0.3);
        gsap.to(shield, {
            alpha: 1,
            duration: 0.2,
            ease: 'power2.out'
        });
        gsap.to(shield.scale, {
            x: 1, y: 1,
            duration: 0.25,
            ease: 'back.out(1.5)'
        });
        
        // 펄스 후 사라짐
        gsap.to(shield.scale, {
            x: 1.3, y: 1.3,
            duration: 0.15,
            delay: 0.3,
            ease: 'power2.out'
        });
        gsap.to(shield, {
            alpha: 0,
            duration: 0.2,
            delay: 0.35,
            onComplete: () => {
                if (!shield.destroyed) shield.destroy();
            }
        });
        
        // 파티클 흩뿌리기
        for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics();
            const angle = Math.random() * Math.PI * 2;
            
            particle.x = x;
            particle.y = y;
            particle.zIndex = 255;
            
            particle.circle(0, 0, 2 + Math.random() * 3);
            particle.fill({ color: 0xffffff, alpha: 0.9 });
            
            this.container.addChild(particle);
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * (size + 20 + Math.random() * 30),
                y: y + Math.sin(angle) * (size + 20 + Math.random() * 30),
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                delay: 0.1,
                ease: 'power2.out',
                onComplete: () => {
                    if (!particle.destroyed) particle.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 실드 회복 연출
    // ==========================================
    shieldRecharge(x, y, amount, options = {}) {
        if (!this.app || !this.container) return;
        
        const { color = 0x4488ff } = options;
        
        // 위로 올라오는 에너지 파티클
        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            const offsetX = (Math.random() - 0.5) * 40;
            
            particle.x = x + offsetX;
            particle.y = y + 40;  // 아래에서 시작
            particle.zIndex = 260;
            
            // 다이아몬드 모양
            particle.poly([
                { x: 0, y: -6 },
                { x: 4, y: 0 },
                { x: 0, y: 6 },
                { x: -4, y: 0 }
            ]);
            particle.fill({ color: color, alpha: 0.9 });
            
            this.container.addChild(particle);
            
            // 위로 올라가며 흡수
            gsap.to(particle, {
                x: x,
                y: y - 20,
                alpha: 0,
                duration: 0.5,
                delay: i * 0.05,
                ease: 'power2.in',
                onComplete: () => {
                    if (!particle.destroyed) particle.destroy();
                }
            });
            
            gsap.to(particle.scale, {
                x: 0.5, y: 0.5,
                duration: 0.5,
                delay: i * 0.05
            });
        }
        
        // 숫자 플로터
        const floater = new PIXI.Text({
            text: `+${amount}`,
            style: {
                fontSize: 18,
                fill: '#88ccff',
                fontWeight: 'bold',
                stroke: { color: '#002244', width: 4 }
            }
        });
        floater.anchor.set(0.5);
        floater.x = x;
        floater.y = y - 30;
        floater.zIndex = 270;
        
        this.container.addChild(floater);
        
        gsap.to(floater, {
            y: y - 60,
            alpha: 0,
            duration: 0.8,
            delay: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                if (!floater.destroyed) floater.destroy();
            }
        });
    },
    
    // ==========================================
    // 유틸리티: 색상 변형
    // ==========================================
    varyColor(baseColor, variance) {
        const r = (baseColor >> 16) & 0xFF;
        const g = (baseColor >> 8) & 0xFF;
        const b = baseColor & 0xFF;
        
        const vary = (v) => Math.max(0, Math.min(255, 
            v + Math.floor((Math.random() - 0.5) * 2 * variance * 255)
        ));
        
        return (vary(r) << 16) | (vary(g) << 8) | vary(b);
    },
    
    // ==========================================
    // 유닛 위치에서 실드 파괴
    // ==========================================
    breakAtUnit(unit, shieldAmount = 10) {
        const pos = this.getUnitPosition(unit);
        if (!pos) return;
        
        this.shieldBreak(pos.x, pos.y, {
            shieldAmount,
            color: unit.team === 'player' ? 0x4488ff : 0xff4444,
            size: 60,
            intensity: Math.min(1.5, 0.5 + shieldAmount / 20)
        });
    },
    
    // ==========================================
    // 유틸리티: 유닛 위치 가져오기
    // ==========================================
    getUnitPosition(unit) {
        const target = unit.container || unit.sprite;
        if (!target || target.destroyed) return null;
        
        const globalPos = target.getGlobalPosition ? target.getGlobalPosition() : target;
        return { x: globalPos.x, y: globalPos.y };
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.ShieldVFX = ShieldVFX;
}


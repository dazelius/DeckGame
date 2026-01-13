// ==========================================
// Shield VFX System - 실드 시각 효과 시스템
// ==========================================

const ShieldVFX = {
    app: null,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app, stage) {
        this.app = app;
        // ★ 유닛보다 앞에 그려지도록 별도의 높은 zIndex 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.zIndex = 800;  // 유닛(10), effects(20)보다 훨씬 높게
        this.container.sortableChildren = true;
        stage.addChild(this.container);
        console.log('[ShieldVFX] 실드 VFX 시스템 초기화 (zIndex: 800)');
    },
    
    // ==========================================
    // ★★★ 실드 파괴 연출 (강렬하게!) ★★★
    // ==========================================
    shieldBreak(x, y, options = {}) {
        if (!this.app || !this.container) return;
        
        const {
            shieldAmount = 10,
            color = 0x4488ff,
            size = 80,
            intensity = 1.5
        } = options;
        
        console.log(`[ShieldVFX] 💥 실드 파괴! x:${x}, y:${y}, amount:${shieldAmount}`);
        
        // 1. 강한 화면 효과
        this.shieldBreakFlash();
        
        // 2. 대형 파편 폭발
        this.shieldShatter(x, y, { color, size, intensity });
        
        // 3. 다중 충격파
        this.shieldShockwave(x, y, { color, size });
        
        // 4. 전기 스파크 폭풍
        this.electricSparks(x, y, { color, intensity });
        
        // 5. 에너지 해체
        this.energyDissipate(x, y, { color, size });
        
        // 6. ★ 추가: 글래스 파쇄 효과
        this.glassShatter(x, y, { color, size });
        
        // 7. ★ 3D 쉴드 파괴 효과
        if (typeof Shield3D !== 'undefined') {
            Shield3D.createBreakEffect(x, y, intensity);
        }
    },
    
    // ==========================================
    // 화면 플래시 (강하게!)
    // ==========================================
    shieldBreakFlash() {
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#88ddff', 120, 0.6);
            CombatEffects.screenShake(15, 250);
        }
    },
    
    // ==========================================
    // 실드 파편 폭발 (더 많이, 더 크게!)
    // ==========================================
    shieldShatter(x, y, options = {}) {
        const { color = 0x4488ff, size = 80, intensity = 1.5 } = options;
        
        const NUM_SHARDS = Math.floor(35 * intensity);
        
        for (let i = 0; i < NUM_SHARDS; i++) {
            const shard = new PIXI.Graphics();
            shard.x = x;
            shard.y = y;
            shard.zIndex = 300;
            
            const shardType = Math.floor(Math.random() * 3);
            const shardSize = 6 + Math.random() * 18;  // 더 크게
            const colorVariation = this.varyColor(color, 0.3);
            
            if (shardType === 0) {
                shard.poly([
                    { x: 0, y: -shardSize },
                    { x: shardSize * 0.6, y: shardSize * 0.5 },
                    { x: -shardSize * 0.6, y: shardSize * 0.5 }
                ]);
            } else if (shardType === 1) {
                const w = shardSize * (0.5 + Math.random() * 0.5);
                const h = shardSize * (0.3 + Math.random() * 0.7);
                shard.rect(-w/2, -h/2, w, h);
            } else {
                shard.poly([
                    { x: 0, y: -shardSize },
                    { x: shardSize * 0.5, y: 0 },
                    { x: 0, y: shardSize * 0.7 },
                    { x: -shardSize * 0.5, y: 0 }
                ]);
            }
            
            shard.fill({ color: colorVariation, alpha: 1 });
            shard.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
            
            // 글로우 효과
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, shardSize);
            glow.fill({ color: 0xffffff, alpha: 0.4 });
            shard.addChildAt(glow, 0);
            
            this.container.addChild(shard);
            
            // 폭발적으로 튀어나감!
            const angle = (i / NUM_SHARDS) * Math.PI * 2 + Math.random() * 0.3;
            const distance = (size * 0.8) + Math.random() * (size * 2);  // 더 멀리
            const duration = 0.5 + Math.random() * 0.4;
            
            shard.rotation = Math.random() * Math.PI * 2;
            
            gsap.to(shard, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance + 40,  // 중력
                rotation: shard.rotation + (Math.random() - 0.5) * Math.PI * 6,
                alpha: 0,
                duration: duration,
                ease: 'power2.out',
                onComplete: () => {
                    if (!shard.destroyed) shard.destroy({ children: true });
                }
            });
            
            gsap.to(shard.scale, {
                x: 0.1, y: 0.1,
                duration: duration * 0.9
            });
        }
    },
    
    // ==========================================
    // 다중 충격파 링
    // ==========================================
    shieldShockwave(x, y, options = {}) {
        const { color = 0x4488ff, size = 80 } = options;
        
        // 4중 충격파!
        for (let wave = 0; wave < 4; wave++) {
            const ring = new PIXI.Graphics();
            ring.x = x;
            ring.y = y;
            ring.zIndex = 295;
            
            const ringRadius = size * 0.4;
            const strokeWidth = 6 - wave * 1.2;
            
            ring.circle(0, 0, ringRadius);
            ring.stroke({ 
                color: wave === 0 ? 0xffffff : (wave === 1 ? 0xaaddff : color), 
                width: strokeWidth, 
                alpha: 1 - wave * 0.2 
            });
            
            this.container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 5 + wave * 0.8, y: 4 + wave * 0.6,
                duration: 0.4 + wave * 0.08,
                ease: 'power2.out'
            });
            
            gsap.to(ring, {
                alpha: 0,
                duration: 0.4 + wave * 0.08,
                delay: wave * 0.04,
                onComplete: () => {
                    if (!ring.destroyed) ring.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 전기 스파크 폭풍!
    // ==========================================
    electricSparks(x, y, options = {}) {
        const { color = 0x4488ff, intensity = 1.5 } = options;
        
        const NUM_SPARKS = Math.floor(20 * intensity);  // 더 많이
        
        for (let i = 0; i < NUM_SPARKS; i++) {
            const spark = new PIXI.Graphics();
            spark.x = x;
            spark.y = y;
            spark.zIndex = 310;
            
            const segments = 4 + Math.floor(Math.random() * 4);
            const totalLength = 30 + Math.random() * 60;  // 더 길게
            const baseAngle = Math.random() * Math.PI * 2;
            
            let px = 0, py = 0;
            spark.moveTo(px, py);
            
            for (let s = 0; s < segments; s++) {
                const segmentLength = totalLength / segments;
                const angleVariation = (Math.random() - 0.5) * 1.5;
                px += Math.cos(baseAngle + angleVariation) * segmentLength;
                py += Math.sin(baseAngle + angleVariation) * segmentLength;
                spark.lineTo(px, py);
            }
            
            spark.stroke({ color: 0xffffff, width: 3, alpha: 1 });
            
            // 글로우
            const glowSpark = new PIXI.Graphics();
            glowSpark.moveTo(0, 0);
            px = 0; py = 0;
            for (let s = 0; s < segments; s++) {
                const segmentLength = totalLength / segments;
                const angleVariation = (Math.random() - 0.5) * 1.5;
                px += Math.cos(baseAngle + angleVariation) * segmentLength;
                py += Math.sin(baseAngle + angleVariation) * segmentLength;
                glowSpark.lineTo(px, py);
            }
            glowSpark.stroke({ color: color, width: 8, alpha: 0.5 });
            spark.addChildAt(glowSpark, 0);
            
            this.container.addChild(spark);
            
            spark.alpha = 0;
            gsap.to(spark, {
                alpha: 1,
                duration: 0.02,
                delay: i * 0.015
            });
            
            gsap.to(spark, {
                alpha: 0,
                duration: 0.2,
                delay: 0.08 + i * 0.015,
                onComplete: () => {
                    if (!spark.destroyed) spark.destroy({ children: true });
                }
            });
        }
    },
    
    // ==========================================
    // 에너지 해체 (더 많은 육각형!)
    // ==========================================
    energyDissipate(x, y, options = {}) {
        const { color = 0x4488ff, size = 80 } = options;
        
        const NUM_HEXES = 16;  // 더 많이!
        
        for (let i = 0; i < NUM_HEXES; i++) {
            const hex = new PIXI.Graphics();
            const angle = (i / NUM_HEXES) * Math.PI * 2;
            const dist = size * 0.2 + Math.random() * size * 0.4;
            
            hex.x = x + Math.cos(angle) * dist;
            hex.y = y + Math.sin(angle) * dist;
            hex.zIndex = 290;
            
            const hexSize = 10 + Math.random() * 16;
            const points = [];
            for (let h = 0; h < 6; h++) {
                const hexAngle = (h / 6) * Math.PI * 2;
                points.push({
                    x: Math.cos(hexAngle) * hexSize,
                    y: Math.sin(hexAngle) * hexSize
                });
            }
            
            hex.poly(points);
            hex.fill({ color: color, alpha: 0.6 });
            hex.stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
            
            this.container.addChild(hex);
            
            gsap.to(hex, {
                x: hex.x + Math.cos(angle) * 70,
                y: hex.y + Math.sin(angle) * 50 + 20,
                rotation: (Math.random() - 0.5) * Math.PI * 2,
                alpha: 0,
                duration: 0.6 + Math.random() * 0.3,
                delay: i * 0.02,
                ease: 'power2.out',
                onComplete: () => {
                    if (!hex.destroyed) hex.destroy();
                }
            });
            
            gsap.to(hex.scale, {
                x: 0.1, y: 0.1,
                duration: 0.6,
                delay: i * 0.02
            });
        }
        
        // 거대한 중앙 폭발!
        const coreBlast = new PIXI.Graphics();
        coreBlast.x = x;
        coreBlast.y = y;
        coreBlast.zIndex = 305;
        
        coreBlast.circle(0, 0, size * 0.5);
        coreBlast.fill({ color: 0xffffff, alpha: 1 });
        
        this.container.addChild(coreBlast);
        
        gsap.to(coreBlast, {
            alpha: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                if (!coreBlast.destroyed) coreBlast.destroy();
            }
        });
        
        gsap.to(coreBlast.scale, {
            x: 3.5, y: 3.5,
            duration: 0.2
        });
    },
    
    // ==========================================
    // ★ NEW: 글래스 파쇄 효과 (균열 패턴)
    // ==========================================
    glassShatter(x, y, options = {}) {
        const { color = 0x4488ff, size = 80 } = options;
        
        // 균열 라인들
        const NUM_CRACKS = 12;
        
        for (let i = 0; i < NUM_CRACKS; i++) {
            const crack = new PIXI.Graphics();
            crack.x = x;
            crack.y = y;
            crack.zIndex = 320;
            
            const baseAngle = (i / NUM_CRACKS) * Math.PI * 2;
            const length = size * 0.6 + Math.random() * size * 0.5;
            const branches = 2 + Math.floor(Math.random() * 3);
            
            // 메인 균열
            let px = 0, py = 0;
            crack.moveTo(px, py);
            
            for (let b = 0; b < branches; b++) {
                const segLength = length / branches;
                const angleOffset = (Math.random() - 0.5) * 0.8;
                px += Math.cos(baseAngle + angleOffset) * segLength;
                py += Math.sin(baseAngle + angleOffset) * segLength;
                crack.lineTo(px, py);
                
                // 분기 균열
                if (Math.random() > 0.4) {
                    const branchAngle = baseAngle + (Math.random() - 0.5) * 1.5;
                    const branchLen = segLength * 0.5;
                    crack.moveTo(px, py);
                    crack.lineTo(
                        px + Math.cos(branchAngle) * branchLen,
                        py + Math.sin(branchAngle) * branchLen
                    );
                    crack.moveTo(px, py);
                }
            }
            
            crack.stroke({ color: 0xffffff, width: 3, alpha: 1 });
            
            // 글로우
            const glowCrack = crack.clone();
            glowCrack.clear();
            // 동일한 패턴 재생성
            px = 0; py = 0;
            glowCrack.moveTo(px, py);
            for (let b = 0; b < branches; b++) {
                const segLength = length / branches;
                px += Math.cos(baseAngle) * segLength;
                py += Math.sin(baseAngle) * segLength;
                glowCrack.lineTo(px, py);
            }
            glowCrack.stroke({ color: color, width: 8, alpha: 0.4 });
            crack.addChildAt(glowCrack, 0);
            
            this.container.addChild(crack);
            
            // 빠르게 나타났다 확장 후 사라짐
            crack.scale.set(0.3);
            crack.alpha = 0;
            
            gsap.to(crack, {
                alpha: 1,
                duration: 0.05,
                delay: i * 0.02
            });
            
            gsap.to(crack.scale, {
                x: 1.2, y: 1.2,
                duration: 0.15,
                delay: i * 0.02,
                ease: 'power2.out'
            });
            
            gsap.to(crack, {
                alpha: 0,
                duration: 0.25,
                delay: 0.15 + i * 0.02,
                onComplete: () => {
                    if (!crack.destroyed) crack.destroy({ children: true });
                }
            });
        }
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
    // 유틸리티: 유닛 위치 가져오기 (스프라이트 중앙)
    // ==========================================
    getUnitPosition(unit) {
        if (!unit) return null;
        
        // ★ CombatEffects.getUnitPosition 사용 (일관된 좌표)
        if (typeof CombatEffects !== 'undefined' && CombatEffects.getUnitPosition) {
            return CombatEffects.getUnitPosition(unit);
        }
        
        // 폴백: container 위치 + 스프라이트 높이 계산
        const container = unit.container;
        if (container && !container.destroyed) {
            let footX, footY;
            if (container.getGlobalPosition) {
                const globalPos = container.getGlobalPosition();
                footX = globalPos.x;
                footY = globalPos.y;
            } else {
                footX = container.x;
                footY = container.y;
            }
            
            // 스프라이트 높이로 중앙 계산
            let spriteHeight = 120;
            const sprite = unit.sprite;
            if (sprite && !sprite.destroyed) {
                try {
                    const bounds = sprite.getLocalBounds();
                    const scaleY = Math.abs(sprite.scale?.y || 1);
                    spriteHeight = Math.abs(bounds.height) * scaleY;
                } catch (e) {}
            }
            
            return { x: footX, y: footY - spriteHeight / 2 };
        }
        
        // 최후 폴백
        const target = unit.sprite;
        if (target && !target.destroyed) {
            const globalPos = target.getGlobalPosition ? target.getGlobalPosition() : target;
            return { x: globalPos.x, y: globalPos.y - 60 };
        }
        
        return null;
    },
    
    // ==========================================
    // ★ 턴 종료 시 쉴드 소멸 연출 (부드러운 페이드)
    // ==========================================
    expireAtUnit(unit) {
        const pos = this.getUnitPosition(unit);
        if (!pos) return;
        
        // ★ getUnitPosition이 이미 중앙 반환
        this.shieldExpire(pos.x, pos.y, {
            color: unit.team === 'player' ? 0x4488ff : 0xff4444
        });
    },
    
    // ==========================================
    // 쉴드 소멸 효과 (파괴가 아닌 자연 소멸)
    // ==========================================
    shieldExpire(x, y, options = {}) {
        if (!this.app || !this.container) return;
        
        const { color = 0x4488ff } = options;
        
        console.log(`[ShieldVFX] 쉴드 소멸 연출: x:${x}, y:${y}`);
        
        // 1. 부드러운 링 페이드아웃
        this.expireRing(x, y, color);
        
        // 2. 위로 올라가는 파티클
        this.expireParticles(x, y, color);
        
        // 3. 잔광 플래시
        this.expireFlash(x, y, color);
    },
    
    // ==========================================
    // 소멸 링 (확장하며 페이드)
    // ==========================================
    expireRing(x, y, color) {
        const ring = new PIXI.Graphics();
        ring.x = x;
        ring.y = y;
        ring.zIndex = 250;
        
        ring.circle(0, 0, 30);
        ring.stroke({ width: 3, color: color, alpha: 0.8 });
        
        this.container.addChild(ring);
        
        gsap.to(ring, {
            alpha: 0,
            duration: 0.6,
            ease: 'power2.out'
        });
        
        gsap.to(ring.scale, {
            x: 2.5,
            y: 2.5,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
                if (ring.parent) ring.parent.removeChild(ring);
                ring.destroy();
            }
        });
    },
    
    // ==========================================
    // 위로 올라가는 파티클들
    // ==========================================
    expireParticles(x, y, color) {
        const NUM_PARTICLES = 12;
        
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const particle = new PIXI.Graphics();
            const angle = (i / NUM_PARTICLES) * Math.PI * 2;
            const radius = 20 + Math.random() * 15;
            
            particle.x = x + Math.cos(angle) * radius;
            particle.y = y + Math.sin(angle) * radius * 0.5;
            particle.zIndex = 260;
            
            const size = 3 + Math.random() * 4;
            particle.circle(0, 0, size);
            particle.fill({ color: this.varyColor(color, 0.2), alpha: 0.9 });
            
            this.container.addChild(particle);
            
            // 위로 올라가면서 사라짐
            const delay = i * 0.03;
            gsap.to(particle, {
                y: particle.y - 40 - Math.random() * 30,
                x: particle.x + (Math.random() - 0.5) * 20,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                delay: delay,
                ease: 'power2.out',
                onComplete: () => {
                    if (particle.parent) particle.parent.removeChild(particle);
                    particle.destroy();
                }
            });
            
            // 크기도 줄어들기
            gsap.to(particle.scale, {
                x: 0,
                y: 0,
                duration: 0.5 + Math.random() * 0.3,
                delay: delay,
                ease: 'power2.in'
            });
        }
    },
    
    // ==========================================
    // 잔광 플래시
    // ==========================================
    expireFlash(x, y, color) {
        const flash = new PIXI.Graphics();
        flash.x = x;
        flash.y = y;
        flash.zIndex = 240;
        
        flash.circle(0, 0, 35);
        flash.fill({ color: color, alpha: 0.4 });
        
        this.container.addChild(flash);
        
        gsap.to(flash, {
            alpha: 0,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
                if (flash.parent) flash.parent.removeChild(flash);
                flash.destroy();
            }
        });
        
        gsap.to(flash.scale, {
            x: 1.5,
            y: 1.5,
            duration: 0.4,
            ease: 'power2.out'
        });
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.ShieldVFX = ShieldVFX;
}


// =====================================================
// Rush VFX System - 소닉 스타일 돌진 이펙트
// 보로노이 노이즈 + 트위스트 에너지 오라
// =====================================================

const RushVFX = {
    app: null,
    game: null,
    
    // 쉐이더 소스
    fragmentShader: `
        precision mediump float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        
        uniform float u_time;
        uniform float u_speed;
        uniform float u_scale;
        uniform float u_power;
        uniform float u_strength;
        uniform vec3 u_mainColor;
        uniform float u_layoutStrength;
        uniform vec3 u_layoutColor;
        uniform float u_alpha;
        
        vec2 random2(vec2 p) {
            return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
        }
        
        float voronoi(vec2 st) {
            vec2 i_st = floor(st);
            vec2 f_st = fract(st);
            float m_dist = 1.0;
            
            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 neighbor = vec2(float(x), float(y));
                    vec2 point = random2(i_st + neighbor);
                    point = 0.5 + 0.5 * sin(6.2831 * point + u_time * 2.0);
                    vec2 diff = neighbor + point - f_st;
                    float dist = length(diff);
                    m_dist = min(m_dist, dist);
                }
            }
            return m_dist;
        }
        
        mat2 rotate(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }
        
        vec2 twirl(vec2 uv, vec2 center, float angleOffset, float strength) {
            float d = distance(uv, center);
            uv -= center;
            uv *= rotate(d * strength - angleOffset);
            uv += center;
            return uv;
        }
        
        vec3 circle(vec2 uv) {
            return vec3(1.0 - length((uv - vec2(0.5, 0.5)) * 2.0));
        }
        
        void main() {
            vec2 uv = vTextureCoord;
            float t = u_time * u_speed;
            
            vec2 twirledUV = twirl(uv, vec2(0.5), t, u_strength);
            
            vec3 mainMask = vec3(voronoi(twirledUV * u_scale) * u_power) * circle(uv);
            vec3 layoutMask = circle(uv) * u_layoutStrength;
            vec3 resultMask = mainMask + layoutMask;
            
            float alpha = clamp(length(resultMask) * u_alpha, 0.0, 1.0);
            vec3 color = mainMask * u_mainColor + layoutMask * u_layoutColor;
            
            gl_FragColor = vec4(color, alpha);
        }
    `,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef, pixiApp) {
        this.game = gameRef;
        this.app = pixiApp;
        console.log('[RushVFX] 돌진 이펙트 시스템 초기화 완료');
    },
    
    // ==========================================
    // 소닉 에너지 오라 생성 - VFXAnchor 사용
    // ==========================================
    createEnergyAura(unit, color = 0xff8800) {
        if (!this.app || !unit?.sprite) return null;
        
        // ★ VFXAnchor로 위치와 크기 정보 가져오기
        let anchorPos, bounds;
        if (typeof VFXAnchor !== 'undefined') {
            anchorPos = VFXAnchor.getCenter(unit);
            bounds = anchorPos.bounds;
        }
        
        // 오라 컨테이너
        const auraContainer = new PIXI.Container();
        auraContainer.zIndex = 200;
        
        // 오라 크기 (스프라이트보다 약간 크게)
        const size = bounds ? Math.max(bounds.width, bounds.height) * 1.5 : 120;
        
        // 오라 그래픽
        const auraGraphic = new PIXI.Graphics();
        auraGraphic.circle(0, 0, size / 2);
        auraGraphic.fill({ color: 0xffffff, alpha: 1 });
        
        // RGB 추출
        const r = ((color >> 16) & 0xFF) / 255;
        const g = ((color >> 8) & 0xFF) / 255;
        const b = (color & 0xFF) / 255;
        
        // 쉐이더 유니폼
        const uniforms = {
            u_time: 0,
            u_speed: 0.08,
            u_scale: 3.5,
            u_power: 1.2,
            u_strength: 15,
            u_mainColor: [r, g, b],
            u_layoutStrength: 0.5,
            u_layoutColor: [r * 0.7, g * 0.9, b * 1.2],
            u_alpha: 0.9
        };
        
        // 커스텀 필터 생성
        try {
            const filter = new PIXI.Filter({
                glProgram: PIXI.GlProgram.from({
                    fragment: this.fragmentShader,
                    vertex: PIXI.Filter.defaultOptions.glProgram.vertex
                }),
                resources: {
                    rushUniforms: {
                        u_time: { value: 0, type: 'f32' },
                        u_speed: { value: 0.08, type: 'f32' },
                        u_scale: { value: 3.5, type: 'f32' },
                        u_power: { value: 1.2, type: 'f32' },
                        u_strength: { value: 15, type: 'f32' },
                        u_mainColor: { value: new Float32Array([r, g, b]), type: 'vec3<f32>' },
                        u_layoutStrength: { value: 0.5, type: 'f32' },
                        u_layoutColor: { value: new Float32Array([r * 0.7, g * 0.9, b * 1.2]), type: 'vec3<f32>' },
                        u_alpha: { value: 0.9, type: 'f32' }
                    }
                }
            });
            
            auraGraphic.filters = [filter];
            auraGraphic._rushFilter = filter;
            auraGraphic._rushUniforms = uniforms;
        } catch (e) {
            // 쉐이더 실패 시 대체 이펙트
            console.warn('[RushVFX] 쉐이더 생성 실패, 대체 이펙트 사용');
            return this.createFallbackAura(unit, color);
        }
        
        auraContainer.addChild(auraGraphic);
        auraContainer._auraGraphic = auraGraphic;
        
        // ★ VFX 컨테이너 결정
        let vfxContainer = this.app.stage;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            vfxContainer = CombatEffects.container;
        }
        
        // ★ 글로벌 좌표를 로컬 좌표로 변환
        if (anchorPos) {
            const localPos = this.toLocalCoords(anchorPos, vfxContainer);
            auraContainer.x = localPos.x;
            auraContainer.y = localPos.y;
        }
        
        vfxContainer.addChild(auraContainer);
        auraContainer._vfxContainer = vfxContainer;
        
        // 업데이트 함수 (VFXAnchor로 위치 추적 + 좌표 변환)
        const updateFunc = () => {
            if (auraContainer.destroyed) {
                this.app.ticker.remove(updateFunc);
                return;
            }
            
            uniforms.u_time += 1;
            
            // ★ VFXAnchor로 유닛 위치 추적 (로컬 좌표 변환)
            if (typeof VFXAnchor !== 'undefined' && unit && unit.sprite && !unit.sprite.destroyed) {
                const newGlobalPos = VFXAnchor.getCenter(unit);
                const newLocalPos = this.toLocalCoords(newGlobalPos, auraContainer._vfxContainer);
                auraContainer.x = newLocalPos.x;
                auraContainer.y = newLocalPos.y;
            }
        };
        
        this.app.ticker.add(updateFunc);
        auraContainer._updateFunc = updateFunc;
        
        return auraContainer;
    },
    
    // ==========================================
    // ★ 글로벌 좌표를 컨테이너 로컬 좌표로 변환
    // ==========================================
    toLocalCoords(globalPos, container) {
        if (!container || !globalPos) return globalPos;
        if (container.toLocal) {
            return container.toLocal({ x: globalPos.x, y: globalPos.y });
        }
        return globalPos;
    },
    
    // ==========================================
    // ★ 심플한 스핀볼 오라 - 깔끔하게!
    // ==========================================
    createFallbackAura(unit, color = 0xff8800) {
        if (!unit?.sprite) return null;
        
        // ★ VFXAnchor로 스프라이트 정보 가져오기 (글로벌 좌표)
        let bounds, globalPos;
        if (typeof VFXAnchor !== 'undefined') {
            globalPos = VFXAnchor.getCenter(unit);
            bounds = globalPos.bounds;
        }
        
        const size = bounds ? Math.max(bounds.width, bounds.height) * 0.6 : 50;
        
        const auraContainer = new PIXI.Container();
        auraContainer.zIndex = 200;
        
        // ★ 심플한 스핀볼 - 2레이어만
        // 외곽 글로우
        const outerGlow = new PIXI.Graphics();
        outerGlow.circle(0, 0, size * 0.8);
        outerGlow.fill({ color: color, alpha: 0.4 });
        auraContainer.addChild(outerGlow);
        
        // 코어 (밝은 중심)
        const core = new PIXI.Graphics();
        core.circle(0, 0, size * 0.4);
        core.fill({ color: 0xffffff, alpha: 0.7 });
        auraContainer.addChild(core);
        
        // ★ VFX 컨테이너 결정 + 좌표 변환
        let vfxContainer = this.app.stage;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            vfxContainer = CombatEffects.container;
        }
        
        // ★ 글로벌 좌표를 로컬 좌표로 변환
        if (globalPos) {
            const localPos = this.toLocalCoords(globalPos, vfxContainer);
            auraContainer.x = localPos.x;
            auraContainer.y = localPos.y;
        }
        
        vfxContainer.addChild(auraContainer);
        auraContainer._vfxContainer = vfxContainer;
        
        // ★ 심플 애니메이션 - 부드러운 펄스만
        let time = 0;
        const updateFunc = () => {
            if (auraContainer.destroyed) {
                this.app.ticker.remove(updateFunc);
                return;
            }
            
            time += 0.15;
            
            // 부드러운 펄스
            const pulse = 1 + Math.sin(time * 2) * 0.1;
            auraContainer.scale.set(pulse);
            outerGlow.alpha = 0.3 + Math.sin(time * 3) * 0.15;
            
            // ★ VFXAnchor로 위치 추적 (로컬 좌표 변환)
            if (typeof VFXAnchor !== 'undefined' && unit && unit.sprite && !unit.sprite.destroyed) {
                const newGlobalPos = VFXAnchor.getCenter(unit);
                const newLocalPos = this.toLocalCoords(newGlobalPos, auraContainer._vfxContainer);
                auraContainer.x = newLocalPos.x;
                auraContainer.y = newLocalPos.y;
            }
        };
        
        this.app.ticker.add(updateFunc);
        auraContainer._updateFunc = updateFunc;
        
        return auraContainer;
    },
    
    // ==========================================
    // 돌진 이펙트 시퀀스 (소닉 스타일)
    // ==========================================
    async playRushSequence(unit, targetX, direction = 1, color = 0xff8800) {
        if (!unit?.sprite) return;
        
        const container = unit.container || unit.sprite;
        
        // 1. 에너지 충전 이펙트
        await this.playChargeEffect(unit, color);
        
        // 2. 에너지 오라 생성
        const aura = this.createFallbackAura(unit, color);
        
        // 3. 스피드라인
        this.createSpeedLines(container.x, container.y, direction, color);
        
        // 4. 화면 플래시
        if (typeof CombatEffects !== 'undefined') {
            const hexColor = '#' + color.toString(16).padStart(6, '0');
            CombatEffects.screenFlash(hexColor, 50, 0.3);
        }
        
        return aura;
    },
    
    // ==========================================
    // 에너지 충전 이펙트 - VFXAnchor 사용 + 좌표 변환
    // ==========================================
    async playChargeEffect(unit, color = 0xff8800) {
        if (!unit?.sprite) return;
        
        // ★ VFXAnchor로 중심 위치 가져오기 (글로벌)
        let globalPos;
        if (typeof VFXAnchor !== 'undefined') {
            globalPos = VFXAnchor.getCenter(unit);
        } else {
            const container = unit.container || unit.sprite;
            const pos = container.getGlobalPosition ? container.getGlobalPosition() : { x: container.x, y: container.y };
            globalPos = { x: pos.x, y: pos.y - (unit.sprite.height || 60) * 0.3 };
        }
        
        // ★ VFX 컨테이너 결정
        let vfxContainer = this.app.stage;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            vfxContainer = CombatEffects.container;
        }
        
        // ★ 글로벌 좌표를 로컬 좌표로 변환
        const localPos = this.toLocalCoords(globalPos, vfxContainer);
        
        const chargeContainer = new PIXI.Container();
        chargeContainer.x = localPos.x;
        chargeContainer.y = localPos.y;
        chargeContainer.zIndex = 250;
        
        // 수축하는 링들
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            const startSize = 150 + i * 30;
            
            ring.circle(0, 0, startSize);
            ring.stroke({ width: 4 - i, color: color, alpha: 0.8 });
            ring._startSize = startSize;
            ring._delay = i * 50;
            
            chargeContainer.addChild(ring);
        }
        
        // 중앙 글로우
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, 20);
        glow.fill({ color: 0xffffff, alpha: 0 });
        chargeContainer.addChild(glow);
        
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            CombatEffects.container.addChild(chargeContainer);
        } else {
            this.app.stage.addChild(chargeContainer);
        }
        
        // 애니메이션
        return new Promise(resolve => {
            const duration = 300;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                chargeContainer.children.forEach((child, idx) => {
                    if (child._startSize !== undefined) {
                        const delayProgress = Math.max(0, (elapsed - child._delay) / (duration - child._delay));
                        const size = child._startSize * (1 - delayProgress * 0.9);
                        child.clear();
                        child.circle(0, 0, Math.max(5, size));
                        child.stroke({ width: 4 - idx, color: color, alpha: 0.8 * (1 - delayProgress * 0.5) });
                    }
                });
                
                // 글로우
                glow.clear();
                glow.circle(0, 0, 20 + progress * 30);
                glow.fill({ color: 0xffffff, alpha: progress * 0.8 });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 폭발 플래시
                    glow.clear();
                    glow.circle(0, 0, 80);
                    glow.fill({ color: 0xffffff, alpha: 1 });
                    
                    gsap.to(glow, {
                        alpha: 0,
                        duration: 0.1,
                        onComplete: () => {
                            if (!chargeContainer.destroyed) {
                                chargeContainer.destroy({ children: true });
                            }
                            resolve();
                        }
                    });
                    
                    gsap.to(glow.scale, { x: 3, y: 3, duration: 0.1 });
                }
            };
            
            animate();
        });
    },
    
    // ==========================================
    // ★ 간소화된 스피드라인
    // ==========================================
    createSpeedLines(x, y, direction = 1, color = 0xff8800) {
        const container = new PIXI.Container();
        container.zIndex = 150;
        
        // 심플한 스피드라인 (8개만)
        for (let i = 0; i < 8; i++) {
            const line = new PIXI.Graphics();
            const lineY = y + (Math.random() - 0.5) * 60;
            const lineLen = 40 + Math.random() * 80;
            const lineX = x - direction * (20 + Math.random() * 30);
            
            line.moveTo(lineX, lineY);
            line.lineTo(lineX - direction * lineLen, lineY);
            line.stroke({ 
                width: 2 + Math.random() * 2, 
                color: i % 2 === 0 ? 0xffffff : color, 
                alpha: 0.5 + Math.random() * 0.3 
            });
            
            container.addChild(line);
            
            gsap.to(line, {
                alpha: 0,
                duration: 0.15,
                onComplete: () => {
                    if (!line.destroyed) line.destroy();
                }
            });
        }
        
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            CombatEffects.container.addChild(container);
        } else {
            this.app.stage.addChild(container);
        }
        
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, 300);
    },
    
    // ==========================================
    // ★ 간소화된 대시 트레일
    // ==========================================
    createDashTrail(x, y, direction = 1, color = 0xff8800, size = 20) {
        const trail = new PIXI.Graphics();
        trail.zIndex = 180;
        
        // 단순한 원
        trail.circle(0, 0, size);
        trail.fill({ color: color, alpha: 0.3 });
        
        trail.x = x;
        trail.y = y;
        
        let vfxContainer = this.app.stage;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            vfxContainer = CombatEffects.container;
        }
        vfxContainer.addChild(trail);
        
        // 빠르게 페이드
        gsap.to(trail, {
            alpha: 0,
            duration: 0.1,
            onComplete: () => {
                if (!trail.destroyed) trail.destroy();
            }
        });
    },
    
    // ==========================================
    // 충돌 임팩트 이펙트
    // ==========================================
    playImpactEffect(x, y, color = 0xff8800) {
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 300;
        
        // 중앙 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 40);
        flash.fill({ color: 0xffffff, alpha: 1 });
        container.addChild(flash);
        
        // 충격파 링
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 30);
            ring.stroke({ width: 6 - i * 2, color: color, alpha: 0.9 });
            container.addChild(ring);
            
            gsap.to(ring.scale, { 
                x: 4 + i, 
                y: 4 + i, 
                duration: 0.25 + i * 0.05,
                ease: 'power2.out'
            });
            gsap.to(ring, { 
                alpha: 0, 
                duration: 0.25 + i * 0.05 
            });
        }
        
        // 파편
        for (let i = 0; i < 15; i++) {
            const particle = new PIXI.Graphics();
            const angle = (i / 15) * Math.PI * 2;
            const speed = 100 + Math.random() * 80;
            
            particle.circle(0, 0, 3 + Math.random() * 4);
            particle.fill({ color: i % 2 === 0 ? color : 0xffffff, alpha: 1 });
            container.addChild(particle);
            
            gsap.to(particle, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.1,
                ease: 'power2.out'
            });
        }
        
        // 플래시 애니메이션
        gsap.to(flash.scale, { x: 3, y: 3, duration: 0.1 });
        gsap.to(flash, { alpha: 0, duration: 0.15 });
        
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            CombatEffects.container.addChild(container);
        } else {
            this.app.stage.addChild(container);
        }
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(15, 200);
            CombatEffects.screenFlash('#ffffff', 80, 0.5);
        }
        
        // 정리
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, 600);
    },
    
    // ==========================================
    // 오라 제거
    // ==========================================
    removeAura(auraContainer) {
        if (!auraContainer || auraContainer.destroyed) return;
        
        if (auraContainer._updateFunc && this.app) {
            this.app.ticker.remove(auraContainer._updateFunc);
        }
        
        // 페이드아웃
        gsap.to(auraContainer, {
            alpha: 0,
            duration: 0.15,
            onComplete: () => {
                if (!auraContainer.destroyed) {
                    auraContainer.destroy({ children: true });
                }
            }
        });
    }
};

console.log('[RushVFX] 돌진 이펙트 시스템 로드 완료');

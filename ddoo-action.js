// =====================================================
// DDOO Action Engine v1.1
// 애니메이션 & VFX & 캐릭터 렌더링 통합 엔진
// =====================================================

const DDOOAction = {
    // ==================== 설정 ====================
    config: {
        speed: 1.0,
        enableAfterimage: true,
        enableVFX: true,
        enableShake: true,
        enableHitstop: true,
        enableShadow: true,
        enableOutline: true,
        enableHitFlash: true,
        enableBreathing: true,
        enableGlow: true,
        debug: false,
        
        // 캐릭터 렌더링 설정
        character: {
            shadowAlpha: 0.4,
            shadowScaleY: 0.3,
            shadowOffsetY: 5,
            outlineColor: 0xffffff,
            outlineThickness: 2,
            hitFlashColor: 0xffffff,
            hitFlashDuration: 100,
            breathingAmount: 0.02,
            breathingSpeed: 1.5,
            glowColor: 0x60a5fa,
            glowStrength: 0.5
        }
    },
    
    // ==================== 캐시 ====================
    animCache: new Map(),
    vfxCache: new Map(),
    
    // ==================== 캐릭터 관리 ====================
    characters: new Map(),  // id -> CharacterData
    
    // ==================== 상태 ====================
    initialized: false,
    pixiApp: null,
    vfxCanvas: null,
    vfxCtx: null,
    particles: [],
    afterimages: [],
    afterimageContainer: null,
    stageContainer: null,
    shadowContainer: null,
    animationFrame: null,
    
    // ==================== 초기화 ====================
    async init(pixiApp, stageContainer) {
        if (this.initialized) return;
        
        this.pixiApp = pixiApp;
        this.stageContainer = stageContainer;
        
        // VFX 캔버스 생성
        this.createVFXCanvas();
        
        // 잔상 컨테이너 생성
        this.createAfterimageContainer();
        
        // JSON 데이터 로드
        await this.loadAllAnimations();
        await this.loadAllVFX();
        
        // VFX 렌더 루프 시작
        this.startVFXLoop();
        
        this.initialized = true;
        console.log('[DDOOAction] ✅ 엔진 초기화 완료');
        console.log(`[DDOOAction] 📁 애니메이션: ${this.animCache.size}개`);
        console.log(`[DDOOAction] 💥 VFX: ${this.vfxCache.size}개`);
        
        return this;
    },
    
    createVFXCanvas() {
        // 기존 캔버스 찾기 또는 생성
        this.vfxCanvas = document.getElementById('ddoo-vfx-canvas');
        if (!this.vfxCanvas) {
            this.vfxCanvas = document.createElement('canvas');
            this.vfxCanvas.id = 'ddoo-vfx-canvas';
            this.vfxCanvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            // PixiJS 캔버스 옆에 배치
            const pixiCanvas = this.pixiApp?.view || this.pixiApp?.canvas;
            if (pixiCanvas && pixiCanvas.parentElement) {
                pixiCanvas.parentElement.style.position = 'relative';
                pixiCanvas.parentElement.appendChild(this.vfxCanvas);
            } else {
                document.body.appendChild(this.vfxCanvas);
            }
        }
        
        this.vfxCanvas.width = this.vfxCanvas.offsetWidth || 900;
        this.vfxCanvas.height = this.vfxCanvas.offsetHeight || 600;
        this.vfxCtx = this.vfxCanvas.getContext('2d');
    },
    
    createAfterimageContainer() {
        if (!this.stageContainer) return;
        
        // 그림자 컨테이너 (맨 아래)
        this.shadowContainer = new PIXI.Container();
        this.shadowContainer.name = 'ddoo-shadows';
        this.stageContainer.addChildAt(this.shadowContainer, 0);
        
        // 잔상 컨테이너 (그림자 위)
        this.afterimageContainer = new PIXI.Container();
        this.afterimageContainer.name = 'ddoo-afterimages';
        this.stageContainer.addChildAt(this.afterimageContainer, 1);
    },
    
    // ==================== 캐릭터 생성 ====================
    createCharacter(id, options = {}) {
        const {
            texture,           // PIXI.Texture
            x = 0,
            y = 0,
            scale = 1,
            anchor = { x: 0.5, y: 1 },
            team = 'player',   // 'player' | 'enemy'
            enableEffects = true
        } = options;
        
        // 메인 컨테이너
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.name = `char-${id}`;
        
        // 그림자 (별도 컨테이너에)
        let shadow = null;
        if (this.config.enableShadow && this.shadowContainer) {
            shadow = this.createShadow(texture, scale);
            shadow.x = x;
            shadow.y = y + this.config.character.shadowOffsetY;
            this.shadowContainer.addChild(shadow);
        }
        
        // 메인 스프라이트
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.scale.set(scale);
        
        // 아웃라인 스프라이트들 (4방향)
        const outlines = [];
        if (this.config.enableOutline && enableEffects) {
            const outlineSprites = this.createOutlineSprites(texture, scale, anchor);
            outlines.push(...outlineSprites);
            outlineSprites.forEach(o => container.addChild(o));
        }
        
        container.addChild(sprite);
        this.stageContainer.addChild(container);
        
        // 캐릭터 데이터 저장
        const charData = {
            id,
            container,
            sprite,
            shadow,
            outlines,
            team,
            baseScale: scale,
            baseX: x,
            baseY: y,
            state: 'idle',
            effects: {
                hitFlash: null,
                glow: null,
                breathing: null
            }
        };
        
        this.characters.set(id, charData);
        
        // 브레싱 애니메이션 시작
        if (this.config.enableBreathing && enableEffects) {
            this.startBreathing(charData);
        }
        
        console.log(`[DDOOAction] 캐릭터 생성: ${id}`);
        return charData;
    },
    
    // 그림자 생성
    createShadow(texture, scale) {
        const shadow = new PIXI.Sprite(texture);
        shadow.anchor.set(0.5, 0.5);
        shadow.scale.set(scale, scale * this.config.character.shadowScaleY);
        shadow.alpha = this.config.character.shadowAlpha;
        shadow.tint = 0x000000;
        return shadow;
    },
    
    // 아웃라인 스프라이트 생성 (픽셀 스타일)
    createOutlineSprites(texture, scale, anchor) {
        const thickness = this.config.character.outlineThickness;
        const color = this.config.character.outlineColor;
        const offsets = [
            { x: -thickness, y: 0 },
            { x: thickness, y: 0 },
            { x: 0, y: -thickness },
            { x: 0, y: thickness }
        ];
        
        return offsets.map(offset => {
            const outline = new PIXI.Sprite(texture);
            outline.anchor.set(anchor.x, anchor.y);
            outline.scale.set(scale);
            outline.tint = color;
            outline.x = offset.x;
            outline.y = offset.y;
            outline.alpha = 0.9;
            return outline;
        });
    },
    
    // 브레싱 애니메이션
    startBreathing(charData) {
        const { sprite, baseScale } = charData;
        const amount = this.config.character.breathingAmount;
        const speed = this.config.character.breathingSpeed;
        
        charData.effects.breathing = gsap.to(sprite.scale, {
            y: baseScale * (1 + amount),
            duration: speed,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    },
    
    // 브레싱 일시정지/재개
    pauseBreathing(charData) {
        if (charData.effects.breathing) {
            charData.effects.breathing.pause();
        }
    },
    
    resumeBreathing(charData) {
        if (charData.effects.breathing) {
            charData.effects.breathing.resume();
        }
    },
    
    // ==================== 히트 플래시 ====================
    hitFlash(charId, color = null) {
        const charData = this.characters.get(charId);
        if (!charData || !this.config.enableHitFlash) return;
        
        const { sprite, outlines } = charData;
        const flashColor = color || this.config.character.hitFlashColor;
        const duration = this.config.character.hitFlashDuration;
        
        // 기존 플래시 취소
        if (charData.effects.hitFlash) {
            charData.effects.hitFlash.kill();
        }
        
        // 스프라이트 틴트 변경
        sprite.tint = flashColor;
        outlines.forEach(o => o.tint = flashColor);
        
        // 복원 타이머
        charData.effects.hitFlash = gsap.delayedCall(duration / 1000, () => {
            sprite.tint = 0xffffff;
            outlines.forEach(o => o.tint = this.config.character.outlineColor);
        });
    },
    
    // ==================== 글로우 효과 ====================
    setGlow(charId, enabled, color = null) {
        const charData = this.characters.get(charId);
        if (!charData || !this.config.enableGlow) return;
        
        const { sprite } = charData;
        const glowColor = color || this.config.character.glowColor;
        
        if (enabled) {
            // PixiJS GlowFilter 사용 (있으면)
            if (typeof PIXI.filters !== 'undefined' && PIXI.filters.GlowFilter) {
                const glow = new PIXI.filters.GlowFilter({
                    color: glowColor,
                    distance: 15,
                    outerStrength: this.config.character.glowStrength,
                    quality: 0.5
                });
                sprite.filters = [glow];
                charData.effects.glow = glow;
            }
        } else {
            sprite.filters = [];
            charData.effects.glow = null;
        }
    },
    
    // ==================== 아웃라인 색상 변경 ====================
    setOutlineColor(charId, color) {
        const charData = this.characters.get(charId);
        if (!charData) return;
        
        charData.outlines.forEach(o => o.tint = color);
    },
    
    // ==================== 캐릭터 상태 변경 ====================
    setState(charId, state) {
        const charData = this.characters.get(charId);
        if (!charData) return;
        
        const prevState = charData.state;
        charData.state = state;
        
        // 상태별 비주얼 처리
        switch (state) {
            case 'idle':
                this.resumeBreathing(charData);
                this.setOutlineColor(charId, this.config.character.outlineColor);
                break;
            case 'attacking':
                this.pauseBreathing(charData);
                this.setOutlineColor(charId, 0xfbbf24); // 금색
                break;
            case 'hit':
                this.hitFlash(charId);
                break;
            case 'defending':
                this.setOutlineColor(charId, 0x60a5fa); // 파란색
                break;
            case 'stunned':
                this.setGlow(charId, true, 0xfbbf24);
                break;
            case 'dead':
                this.pauseBreathing(charData);
                charData.sprite.tint = 0x666666;
                break;
        }
        
        if (this.config.debug) {
            console.log(`[DDOOAction] ${charId} 상태: ${prevState} → ${state}`);
        }
    },
    
    // ==================== 캐릭터 위치/스케일 업데이트 ====================
    updateCharacter(charId, props = {}) {
        const charData = this.characters.get(charId);
        if (!charData) return;
        
        const { container, sprite, shadow, outlines, baseScale } = charData;
        
        if (props.x !== undefined) container.x = props.x;
        if (props.y !== undefined) container.y = props.y;
        if (props.scale !== undefined) {
            sprite.scale.set(props.scale);
            outlines.forEach(o => o.scale.set(props.scale));
        }
        if (props.rotation !== undefined) sprite.rotation = props.rotation;
        if (props.alpha !== undefined) sprite.alpha = props.alpha;
        
        // 그림자 동기화
        if (shadow) {
            shadow.x = container.x;
            shadow.y = container.y + this.config.character.shadowOffsetY;
            shadow.scale.x = (props.scale || baseScale);
            shadow.scale.y = (props.scale || baseScale) * this.config.character.shadowScaleY;
        }
    },
    
    // ==================== 캐릭터 제거 ====================
    removeCharacter(charId) {
        const charData = this.characters.get(charId);
        if (!charData) return;
        
        // 이펙트 정리
        if (charData.effects.breathing) charData.effects.breathing.kill();
        if (charData.effects.hitFlash) charData.effects.hitFlash.kill();
        
        // 그림자 제거
        if (charData.shadow && charData.shadow.parent) {
            charData.shadow.parent.removeChild(charData.shadow);
            charData.shadow.destroy();
        }
        
        // 컨테이너 제거
        if (charData.container.parent) {
            charData.container.parent.removeChild(charData.container);
            charData.container.destroy({ children: true });
        }
        
        this.characters.delete(charId);
        console.log(`[DDOOAction] 캐릭터 제거: ${charId}`);
    },
    
    // 캐릭터 가져오기
    getCharacter(charId) {
        return this.characters.get(charId);
    },
    
    // ==================== JSON 로드 ====================
    async loadAllAnimations() {
        try {
            const indexRes = await fetch('anim/index.json');
            if (!indexRes.ok) throw new Error('index.json not found');
            
            const files = await indexRes.json();
            for (const id of files) {
                try {
                    const res = await fetch(`anim/${id}.json`);
                    if (res.ok) {
                        this.animCache.set(id, await res.json());
                    }
                } catch (e) {
                    if (this.config.debug) console.warn(`[DDOOAction] anim/${id} failed`);
                }
            }
        } catch (e) {
            console.warn('[DDOOAction] anim/index.json 없음, 기본 목록 사용');
        }
    },
    
    async loadAllVFX() {
        try {
            const indexRes = await fetch('vfx/index.json');
            if (!indexRes.ok) throw new Error('index.json not found');
            
            const files = await indexRes.json();
            for (const id of files) {
                try {
                    const res = await fetch(`vfx/${id}.json`);
                    if (res.ok) {
                        this.vfxCache.set(id, await res.json());
                    }
                } catch (e) {
                    if (this.config.debug) console.warn(`[DDOOAction] vfx/${id} failed`);
                }
            }
        } catch (e) {
            console.warn('[DDOOAction] vfx/index.json 없음, 기본 목록 사용');
        }
    },
    
    // ==================== 애니메이션 재생 ====================
    async play(animId, options = {}) {
        const data = this.animCache.get(animId);
        if (!data) {
            console.warn(`[DDOOAction] 애니메이션 없음: ${animId}`);
            return null;
        }
        
        const {
            container,      // PIXI.Container
            sprite,         // PIXI.Sprite
            baseX,          // 기본 X 위치
            baseY,          // 기본 Y 위치
            dir = 1,        // 방향 (1: 오른쪽, -1: 왼쪽)
            isRelative = false,  // 상대 좌표 사용
            onComplete,     // 완료 콜백
            onHit,          // 히트 콜백
            getHitPoint     // 타격점 계산 함수
        } = options;
        
        if (!container || !sprite) {
            console.warn('[DDOOAction] container와 sprite 필요');
            return null;
        }
        
        // 시퀀스 타입
        if (data.type === 'sequence' && data.steps) {
            return this.playSequence(data, options);
        }
        
        // 단일 애니메이션
        return this.playKeyframes(data, options);
    },
    
    async playSequence(data, options) {
        if (this.config.debug) console.log(`[DDOOAction] 🎬 Sequence: ${data.id}`);
        
        for (const step of data.steps) {
            if (step.delay && !step.anim) {
                await this.delay(step.delay);
                continue;
            }
            
            if (step.anim) {
                const animData = this.animCache.get(step.anim);
                if (!animData) {
                    if (this.config.debug) console.warn(`[DDOOAction] 애니메이션 없음: ${step.anim}`);
                    continue;
                }
                
                // 딜레이가 있으면 적용
                if (step.delay) {
                    await this.delay(step.delay);
                }
                
                // 애니메이션 재생
                const promise = this.playKeyframes(animData, {
                    ...options,
                    isRelative: true  // 시퀀스 내에서는 상대 좌표
                });
                
                // wait가 true면 완료까지 대기
                if (step.wait) {
                    await promise;
                }
            }
        }
        
        if (options.onComplete) options.onComplete();
    },
    
    playKeyframes(data, options) {
        return new Promise((resolve) => {
            const {
                container,
                sprite,
                baseX = container.x,
                baseY = container.y,
                dir = 1,
                isRelative = false,
                getHitPoint
            } = options;
            
            const baseScale = sprite.scale.x;
            const startX = container.x;
            
            const tl = gsap.timeline({
                onComplete: () => {
                    resolve();
                }
            });
            
            data.keyframes.forEach((kf, idx) => {
                if (idx === 0) return;
                
                const dur = (kf.duration || 100) / 1000 / this.config.speed;
                const ease = kf.ease || 'power2.out';
                const pos = idx === 1 ? 0 : '>';
                
                // 이동
                if (kf.x !== undefined) {
                    const targetX = isRelative ? startX + (kf.x * dir) : baseX + (kf.x * dir);
                    tl.to(container, { x: targetX, duration: dur, ease }, pos);
                }
                
                if (kf.y !== undefined) {
                    tl.to(container, { y: baseY + kf.y, duration: dur, ease }, '<');
                }
                
                // 스케일
                if (kf.scaleX !== undefined || kf.scaleY !== undefined) {
                    const scaleX = (kf.scaleX ?? 1) * baseScale;
                    const scaleY = (kf.scaleY ?? 1) * baseScale;
                    tl.to(sprite.scale, { x: scaleX, y: scaleY, duration: dur, ease }, '<');
                }
                
                // 회전
                if (kf.rotation !== undefined) {
                    tl.to(sprite, { rotation: kf.rotation * dir, duration: dur, ease }, '<');
                }
                
                // 알파
                if (kf.alpha !== undefined) {
                    tl.to(sprite, { alpha: kf.alpha, duration: dur, ease }, '<');
                }
                
                // VFX
                if (kf.vfx && this.config.enableVFX) {
                    tl.call(() => {
                        const hitPoint = getHitPoint ? getHitPoint() : { x: container.x, y: container.y };
                        this.triggerVFX(kf.vfx, hitPoint.x, hitPoint.y, dir, hitPoint.scale || 1);
                    }, null, '<');
                }
                
                // 히트스톱
                if (kf.hitstop && this.config.enableHitstop) {
                    tl.call(() => {
                        tl.pause();
                        setTimeout(() => tl.resume(), kf.hitstop / this.config.speed);
                    }, null, '>');
                }
                
                // 스크린쉐이크
                if (kf.shake && this.config.enableShake) {
                    tl.call(() => this.screenShake(kf.shake), null, '<');
                }
                
                // 잔상
                if (kf.afterimage && this.config.enableAfterimage) {
                    tl.call(() => {
                        const tint = data.target === 'player' ? 0x60a5fa : 0xef4444;
                        this.createAfterimage(sprite, container, 0.7, tint);
                    }, null, '<');
                }
            });
        });
    },
    
    // ==================== 잔상 시스템 ====================
    createAfterimage(sourceSprite, sourceContainer, alpha = 0.6, tint = 0x8888ff) {
        if (!this.afterimageContainer || !sourceSprite.texture) return;
        
        const ghost = new PIXI.Sprite(sourceSprite.texture);
        ghost.anchor.set(sourceSprite.anchor.x, sourceSprite.anchor.y);
        ghost.x = sourceContainer.x;
        ghost.y = sourceContainer.y;
        ghost.scale.set(sourceSprite.scale.x, sourceSprite.scale.y);
        ghost.rotation = sourceSprite.rotation;
        ghost.alpha = alpha;
        ghost.tint = tint;
        
        this.afterimageContainer.addChild(ghost);
        
        this.afterimages.push({
            sprite: ghost,
            life: 150,
            maxLife: 150
        });
    },
    
    updateAfterimages(delta) {
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const ai = this.afterimages[i];
            ai.life -= delta * 16;
            
            const progress = ai.life / ai.maxLife;
            ai.sprite.alpha = progress * 0.6;
            ai.sprite.scale.x *= 0.995;
            ai.sprite.scale.y *= 0.995;
            
            if (ai.life <= 0) {
                this.afterimageContainer.removeChild(ai.sprite);
                ai.sprite.destroy();
                this.afterimages.splice(i, 1);
            }
        }
    },
    
    clearAfterimages() {
        this.afterimages.forEach(ai => {
            this.afterimageContainer?.removeChild(ai.sprite);
            ai.sprite.destroy();
        });
        this.afterimages.length = 0;
    },
    
    // ==================== VFX 시스템 ====================
    triggerVFX(vfxId, x, y, dir = 1, scale = 1) {
        const vfxData = this.vfxCache.get(vfxId);
        if (!vfxData) {
            if (this.config.debug) console.warn(`[DDOOAction] VFX 없음: ${vfxId}`);
            return;
        }
        
        if (this.config.debug) console.log(`[DDOOAction] 💥 ${vfxId} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        
        // 쉐이크
        if (vfxData.shake && this.config.enableShake) {
            this.screenShake(vfxData.shake);
        }
        
        // 파티클 생성
        for (const pDef of vfxData.particles) {
            this.spawnParticlesFromDef(pDef, x, y, dir, scale);
        }
    },
    
    spawnParticlesFromDef(def, x, y, dir, scale = 1.0) {
        const count = def.count || 1;
        const delayBetween = def.delay || 0;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                switch (def.type) {
                    case 'slash':
                    case 'thrust':
                        this.spawnSlashParticle(def, x, y, dir, i, scale);
                        break;
                    case 'arrow':
                    case 'wedge':
                        this.spawnArrowParticle(def, x, y, dir, i, scale);
                        break;
                    case 'spark':
                        this.spawnSparkParticle(def, x, y, scale);
                        break;
                    case 'flash':
                        this.spawnFlashParticle(def, x, y, scale);
                        break;
                    case 'ring':
                        this.spawnRingParticle(def, x, y, scale);
                        break;
                    case 'line':
                        this.spawnLineParticle(def, x, y, i, scale);
                        break;
                    case 'debris':
                        this.spawnDebrisParticle(def, x, y, scale);
                        break;
                    case 'trail':
                        // trail은 잔상 시스템 사용
                        break;
                }
            }, delayBetween * i);
        }
    },
    
    spawnParticle(p) {
        p.born = performance.now();
        p.startLife = p.life || 150;
        if (p.length) p.startLength = p.length;
        if (p.width) p.startWidth = p.width;
        if (p.size) p.startSize = p.size;
        this.particles.push(p);
    },
    
    getRandValue(val) {
        if (Array.isArray(val)) {
            return val[0] + Math.random() * (val[1] - val[0]);
        }
        return val || 0;
    },
    
    spawnSlashParticle(def, x, y, dir, index, scale) {
        const angles = Array.isArray(def.angle) ? def.angle : [def.angle || 0];
        const angle = angles[index % angles.length] || (Math.random() - 0.5) * 60;
        const length = this.getRandValue(def.length) * scale;
        const width = (def.width || 8) * scale;
        
        this.spawnParticle({
            type: 'slash',
            x, y,
            angle: angle * dir,
            length: length,
            width: width,
            color: def.color || '#ffffff',
            glow: def.glow || '#60a5fa',
            life: def.life || 150
        });
    },
    
    spawnArrowParticle(def, x, y, dir, index, scale) {
        const length = this.getRandValue(def.length) * scale;
        const width = (def.width || 60) * scale;
        const tipAngle = def.tipAngle || 35;
        
        this.spawnParticle({
            type: 'arrow',
            x, y,
            dir: dir,
            startLength: length,
            startWidth: width,
            tipAngle: tipAngle,
            color: def.color || '#ffffff',
            glow: def.glow || '#a78bfa',
            innerColor: def.innerColor || 'rgba(167, 139, 250, 0.5)',
            life: def.life || 120
        });
    },
    
    spawnSparkParticle(def, x, y, scale) {
        const spread = (def.spread || 50) * scale;
        const speed = this.getRandValue(def.speed) * scale;
        const size = this.getRandValue(def.size) * scale;
        const angle = Math.random() * Math.PI * 2;
        const colors = def.colors || [def.color || '#fbbf24'];
        
        this.spawnParticle({
            type: 'spark',
            x: x + (Math.random() - 0.5) * spread,
            y: y + (Math.random() - 0.5) * spread,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: size,
            gravity: def.gravity || 0.15,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: this.getRandValue(def.life)
        });
    },
    
    spawnFlashParticle(def, x, y, scale) {
        this.spawnParticle({
            type: 'flash',
            x, y,
            size: (def.size || 50) * scale,
            color: def.color || '#ffffff',
            life: def.life || 80
        });
    },
    
    spawnRingParticle(def, x, y, scale) {
        this.spawnParticle({
            type: 'ring',
            x, y,
            size: (def.size || 20) * scale,
            maxSize: (def.maxSize || 100) * scale,
            color: def.color || '#60a5fa',
            life: def.life || 200
        });
    },
    
    spawnLineParticle(def, x, y, index, scale) {
        const angleStep = def.angleStep || 45;
        const angle = index * angleStep;
        const length = this.getRandValue(def.length) * scale;
        
        this.spawnParticle({
            type: 'line',
            x, y,
            angle: angle,
            length: length,
            width: (def.width || 3) * scale,
            color: def.color || '#fbbf24',
            life: def.life || 150
        });
    },
    
    spawnDebrisParticle(def, x, y, scale) {
        const speed = this.getRandValue(def.speed) * scale;
        const size = this.getRandValue(def.size) * scale;
        const angle = Math.random() * Math.PI * 2;
        const colors = def.colors || [def.color || '#888'];
        
        this.spawnParticle({
            type: 'debris',
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - speed * 0.5,
            size: size,
            gravity: def.gravity || 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: this.getRandValue(def.life)
        });
    },
    
    // ==================== VFX 렌더링 ====================
    startVFXLoop() {
        let lastTime = performance.now();
        
        const render = () => {
            const now = performance.now();
            const delta = (now - lastTime) / 16.67;
            lastTime = now;
            
            // 잔상 업데이트
            this.updateAfterimages(delta);
            
            // 캔버스 클리어
            if (this.vfxCtx) {
                this.vfxCtx.clearRect(0, 0, this.vfxCanvas.width, this.vfxCanvas.height);
                
                // 파티클 렌더링
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    const age = now - p.born;
                    const progress = age / p.startLife;
                    
                    if (progress >= 1) {
                        this.particles.splice(i, 1);
                        continue;
                    }
                    
                    const alpha = 1 - progress;
                    
                    this.vfxCtx.save();
                    this.drawParticle(p, alpha, progress);
                    this.vfxCtx.restore();
                }
            }
            
            this.animationFrame = requestAnimationFrame(render);
        };
        
        render();
    },
    
    drawParticle(p, alpha, progress) {
        switch (p.type) {
            case 'slash':
                this.drawSlashParticle(p, alpha, progress);
                break;
            case 'arrow':
                this.drawArrowParticle(p, alpha, progress);
                break;
            case 'spark':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                this.drawSparkParticle(p, alpha);
                break;
            case 'flash':
                this.drawFlashParticle(p, alpha, progress);
                break;
            case 'ring':
                this.drawRingParticle(p, alpha, progress);
                break;
            case 'line':
                this.drawLineParticle(p, alpha, progress);
                break;
            case 'debris':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                this.drawDebrisParticle(p, alpha);
                break;
        }
    },
    
    drawSlashParticle(p, alpha, progress) {
        const rad = p.angle * Math.PI / 180;
        const len = p.startLength * (1 - progress * 0.3);
        
        this.vfxCtx.translate(p.x, p.y);
        this.vfxCtx.rotate(rad);
        
        if (p.glow) {
            this.vfxCtx.shadowColor = p.glow;
            this.vfxCtx.shadowBlur = 20;
        }
        
        const grad = this.vfxCtx.createLinearGradient(-len/2, 0, len/2, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(0.7, p.color);
        grad.addColorStop(1, 'transparent');
        
        this.vfxCtx.strokeStyle = grad;
        this.vfxCtx.lineWidth = p.startWidth * alpha;
        this.vfxCtx.lineCap = 'round';
        
        this.vfxCtx.beginPath();
        this.vfxCtx.moveTo(-len/2, 0);
        this.vfxCtx.lineTo(len/2, 0);
        this.vfxCtx.stroke();
    },
    
    drawArrowParticle(p, alpha, progress) {
        const len = p.startLength * (1 - progress * 0.4);
        const width = p.startWidth * (1 - progress * 0.3);
        const tipRad = (p.tipAngle || 35) * Math.PI / 180;
        const dir = p.dir || 1;
        
        this.vfxCtx.translate(p.x, p.y);
        if (dir < 0) this.vfxCtx.scale(-1, 1);
        
        if (p.glow) {
            this.vfxCtx.shadowColor = p.glow;
            this.vfxCtx.shadowBlur = 25;
        }
        this.vfxCtx.globalAlpha = alpha;
        
        // 내부 채우기
        if (p.innerColor) {
            this.vfxCtx.fillStyle = p.innerColor;
            this.vfxCtx.beginPath();
            this.vfxCtx.moveTo(len, 0);
            this.vfxCtx.lineTo(0, -width * Math.sin(tipRad));
            this.vfxCtx.lineTo(len * 0.3, 0);
            this.vfxCtx.lineTo(0, width * Math.sin(tipRad));
            this.vfxCtx.closePath();
            this.vfxCtx.fill();
        }
        
        // 외곽선
        this.vfxCtx.strokeStyle = p.color;
        this.vfxCtx.lineWidth = 3 * alpha;
        this.vfxCtx.lineCap = 'round';
        this.vfxCtx.lineJoin = 'round';
        
        this.vfxCtx.beginPath();
        this.vfxCtx.moveTo(0, -width * Math.sin(tipRad));
        this.vfxCtx.lineTo(len, 0);
        this.vfxCtx.lineTo(0, width * Math.sin(tipRad));
        this.vfxCtx.stroke();
        
        // 중앙선
        this.vfxCtx.strokeStyle = '#ffffff';
        this.vfxCtx.lineWidth = 2 * alpha;
        this.vfxCtx.beginPath();
        this.vfxCtx.moveTo(len * 0.2, 0);
        this.vfxCtx.lineTo(len * 0.9, 0);
        this.vfxCtx.stroke();
    },
    
    drawSparkParticle(p, alpha) {
        this.vfxCtx.fillStyle = p.color;
        this.vfxCtx.globalAlpha = alpha;
        this.vfxCtx.shadowColor = p.color;
        this.vfxCtx.shadowBlur = 8;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, p.startSize * alpha, 0, Math.PI * 2);
        this.vfxCtx.fill();
    },
    
    drawFlashParticle(p, alpha, progress) {
        const size = p.startSize * (1 + progress * 0.5);
        const grad = this.vfxCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.5, p.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        grad.addColorStop(1, 'transparent');
        
        this.vfxCtx.fillStyle = grad;
        this.vfxCtx.globalAlpha = alpha * 0.8;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
        this.vfxCtx.fill();
    },
    
    drawRingParticle(p, alpha, progress) {
        const currentSize = p.startSize + (p.maxSize - p.startSize) * progress;
        
        this.vfxCtx.strokeStyle = p.color;
        this.vfxCtx.lineWidth = 3 * alpha;
        this.vfxCtx.globalAlpha = alpha * 0.7;
        this.vfxCtx.shadowColor = p.color;
        this.vfxCtx.shadowBlur = 10;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        this.vfxCtx.stroke();
    },
    
    drawLineParticle(p, alpha, progress) {
        const rad = p.angle * Math.PI / 180;
        const len = p.startLength * (1 - progress * 0.3);
        
        this.vfxCtx.strokeStyle = p.color;
        this.vfxCtx.lineWidth = p.startWidth * alpha;
        this.vfxCtx.globalAlpha = alpha;
        this.vfxCtx.lineCap = 'round';
        this.vfxCtx.shadowColor = p.color;
        this.vfxCtx.shadowBlur = 8;
        
        const sx = p.x;
        const sy = p.y;
        const ex = p.x + Math.cos(rad) * len;
        const ey = p.y + Math.sin(rad) * len;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.moveTo(sx, sy);
        this.vfxCtx.lineTo(ex, ey);
        this.vfxCtx.stroke();
    },
    
    drawDebrisParticle(p, alpha) {
        this.vfxCtx.fillStyle = p.color;
        this.vfxCtx.globalAlpha = alpha;
        this.vfxCtx.shadowColor = p.color;
        this.vfxCtx.shadowBlur = 5;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, p.startSize * alpha, 0, Math.PI * 2);
        this.vfxCtx.fill();
    },
    
    // ==================== 스크린쉐이크 ====================
    screenShake(intensity) {
        if (!this.stageContainer) return;
        
        const duration = 150;
        const startTime = performance.now();
        const originalX = this.stageContainer.x;
        const originalY = this.stageContainer.y;
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.stageContainer.x = originalX;
                this.stageContainer.y = originalY;
                return;
            }
            
            const remaining = 1 - progress;
            const offsetX = (Math.random() - 0.5) * intensity * 2 * remaining;
            const offsetY = (Math.random() - 0.5) * intensity * 2 * remaining;
            
            this.stageContainer.x = originalX + offsetX;
            this.stageContainer.y = originalY + offsetY;
            
            requestAnimationFrame(shake);
        };
        
        shake();
    },
    
    // ==================== 유틸리티 ====================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms / this.config.speed));
    },
    
    clearAll() {
        this.particles.length = 0;
        this.clearAfterimages();
        if (this.vfxCtx) {
            this.vfxCtx.clearRect(0, 0, this.vfxCanvas.width, this.vfxCanvas.height);
        }
    },
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // 모든 캐릭터 제거
        this.characters.forEach((_, id) => this.removeCharacter(id));
        this.characters.clear();
        
        this.clearAll();
        
        if (this.vfxCanvas && this.vfxCanvas.parentElement) {
            this.vfxCanvas.parentElement.removeChild(this.vfxCanvas);
        }
        if (this.afterimageContainer && this.afterimageContainer.parent) {
            this.afterimageContainer.parent.removeChild(this.afterimageContainer);
        }
        if (this.shadowContainer && this.shadowContainer.parent) {
            this.shadowContainer.parent.removeChild(this.shadowContainer);
        }
        this.initialized = false;
    },
    
    // ==================== 디버그 ====================
    getStats() {
        return {
            animations: this.animCache.size,
            vfx: this.vfxCache.size,
            particles: this.particles.length,
            afterimages: this.afterimages.length,
            characters: this.characters.size
        };
    },
    
    // 모든 캐릭터 정보 출력
    debugCharacters() {
        console.log('[DDOOAction] 캐릭터 목록:');
        this.characters.forEach((data, id) => {
            console.log(`  - ${id}: state=${data.state}, pos=(${data.container.x.toFixed(0)}, ${data.container.y.toFixed(0)})`);
        });
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOAction = DDOOAction;
}

console.log('[DDOOAction] 🎮 DDOO Action Engine v1.0 로드됨');


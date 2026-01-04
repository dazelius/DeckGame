// =====================================================
// DDOO Action Engine v3.1
// 애니메이션 & VFX & 캐릭터 렌더링 & 카메라 & 컬러그레이딩 & 슬로우모션 통합 엔진
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
        enableCamera: true,        // 📷 카메라 시스템
        enableColorGrade: true,    // 🎨 컬러 그레이딩
        enableSlowmo: true,        // ⏱️ 슬로우모션
        debug: false,
        
        // 리턴 애니메이션 설정
        return: {
            duration: 250,       // 리턴 시간 (ms)
            ease: 'power2.inOut' // 이징
        },
        
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
        },
        
        // 📷 카메라 설정
        camera: {
            defaultZoom: 1.0,
            minZoom: 0.5,
            maxZoom: 2.0,
            zoomSpeed: 0.3,      // 줌 전환 시간 (초)
            panSpeed: 0.2        // 팬 전환 시간 (초)
        },
        
        // 🎨 컬러 그레이딩 설정
        colorGrade: {
            transitionSpeed: 0.15  // 색상 전환 시간 (초)
        },
        
        // ⏱️ 슬로우모션 설정
        slowmo: {
            defaultScale: 1.0,
            minScale: 0.1,
            maxScale: 2.0
        }
    },
    
    // 📷 카메라 상태
    cameraState: {
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0,
        focusTarget: null,
        pivotSet: false,
        isRootStage: false  // app.stage를 직접 사용하는지 여부
    },
    
    // ⏱️ 슬로우모션 상태
    timescale: 1.0,
    slowmoTween: null,
    
    // 🎨 컬러 그레이딩 필터
    colorFilter: null,
    
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
        
        // 🔍 stageContainer가 app.stage인지 확인 (카메라 pivot 설정 방지용)
        this.cameraState.isRootStage = (stageContainer === pixiApp?.stage);
        if (this.cameraState.isRootStage) {
            console.log('[DDOOAction] ⚠️ app.stage 직접 사용 - 카메라 pivot 비활성화');
        }
        
        // VFX 캔버스 생성
        this.createVFXCanvas();
        
        // 잔상 컨테이너 생성
        this.createAfterimageContainer();
        
        // JSON 데이터 로드
        await this.loadAllAnimations();
        await this.loadAllVFX();
        
        // VFX 렌더 루프 시작
        this.startVFXLoop();
        
        // 📷 카메라 초기화
        this.initCamera();
        
        // 🎨 컬러 그레이딩 필터 초기화
        this.initColorFilter();
        
        this.initialized = true;
        console.log('[DDOOAction] ✅ 엔진 v3.0 초기화 완료');
        console.log(`[DDOOAction] 📁 애니메이션: ${this.animCache.size}개`);
        console.log(`[DDOOAction] 💥 VFX: ${this.vfxCache.size}개`);
        console.log(`[DDOOAction] 📷 카메라: ${this.config.enableCamera ? 'ON' : 'OFF'}`);
        console.log(`[DDOOAction] 🎨 컬러그레이딩: ${this.config.enableColorGrade ? 'ON' : 'OFF'}`);
        
        return this;
    },
    
    // 📷 카메라 시스템 초기화
    initCamera() {
        this.cameraState = {
            zoom: this.config.camera.defaultZoom,
            offsetX: 0,
            offsetY: 0,
            focusTarget: null,
            pivotSet: false,
            isRootStage: this.cameraState.isRootStage  // 🔄 유지!
        };
    },
    
    // 🎨 컬러 그레이딩 필터 초기화
    initColorFilter() {
        if (typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
            this.colorFilter = new PIXI.ColorMatrixFilter();
            if (this.stageContainer && !this.stageContainer.filters) {
                this.stageContainer.filters = [];
            }
        }
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
        // 🔄 애니메이션 시작 전 카메라/이펙트 상태 초기화
        this.resetCameraImmediate();
        this.resetColorGradeImmediate();
        this.resetSlowmoImmediate();
        
        // ⏳ 한 프레임 대기 (리셋이 렌더링에 반영되도록)
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // 🎲 배열이면 랜덤 선택!
        let actualAnimId = animId;
        if (Array.isArray(animId)) {
            actualAnimId = animId[Math.floor(Math.random() * animId.length)];
            if (this.config.debug) console.log(`[DDOOAction] 🎲 랜덤 선택: ${actualAnimId}`);
        }
        
        const data = this.animCache.get(actualAnimId);
        if (!data) {
            console.warn(`[DDOOAction] 애니메이션 없음: ${actualAnimId}`);
            return null;
        }
        
        const {
            container,      // PIXI.Container
            sprite,         // PIXI.Sprite
            baseX,          // 기본 X 위치 (리턴할 원점)
            baseY,          // 기본 Y 위치 (리턴할 원점)
            dir = 1,        // 방향 (1: 오른쪽, -1: 왼쪽)
            isRelative = false,  // 상대 좌표 사용
            targetContainer,// 🎯 적 컨테이너 (dashToTarget용)
            targetSprite,   // 🎯 적 스프라이트 (dashToTarget용)
            onComplete,     // 완료 콜백
            onHit,          // 히트 콜백
            onDamage,       // 🎯 대미지 콜백 (value, target)
            onBuff,         // 🎯 버프 콜백 (name, value, target)
            onDebuff,       // 🎯 디버프 콜백 (name, value, target)
            onEvent,        // 🎯 커스텀 이벤트 콜백 (eventData)
            getHitPoint     // 타격점 계산 함수
        } = options;
        
        if (!container || !sprite) {
            console.warn('[DDOOAction] container와 sprite 필요');
            return null;
        }
        
        // 원점 저장 (리턴용)
        const originX = baseX ?? container.x;
        const originY = baseY ?? container.y;
        
        // 시퀀스 타입
        if (data.type === 'sequence' && data.steps) {
            return this.playSequence(data, { ...options, originX, originY });
        }
        
        // 단일 애니메이션
        return this.playKeyframes(data, { ...options, originX, originY });
    },
    
    async playSequence(data, options) {
        if (this.config.debug) console.log(`[DDOOAction] 🎬 Sequence: ${data.id}`);
        
        const { container, sprite, originX, originY, dir = 1 } = options;
        
        try {
            for (const step of data.steps) {
                // 순수 딜레이
                if (step.delay && !step.anim) {
                    await this.delay(step.delay);
                    continue;
                }
                
                // 📍 게임 이벤트 처리 (애니메이션 없이 이벤트만)
                if (!step.anim) {
                    await this.processStepEvents(step, options);
                    continue;
                }
                
                // 애니메이션 재생
                if (step.anim) {
                    // 🎲 배열이면 랜덤 선택!
                    let animId = step.anim;
                    if (Array.isArray(step.anim)) {
                        animId = step.anim[Math.floor(Math.random() * step.anim.length)];
                        if (this.config.debug) console.log(`[DDOOAction] 🎲 랜덤 선택: ${animId}`);
                    }
                    
                    const actualAnimData = this.animCache.get(animId);
                    if (!actualAnimData) {
                        if (this.config.debug) console.warn(`[DDOOAction] 애니메이션 없음: ${animId}`);
                        continue;
                    }
                    
                    // 딜레이가 있으면 적용
                    if (step.delay) {
                        await this.delay(step.delay);
                    }
                    
                    // 🎯 타겟에 따라 다른 캐릭터 사용!
                    let stepContainer = container;
                    let stepSprite = sprite;
                    let stepOriginX = originX;
                    let stepOriginY = originY;
                    let stepDir = dir;
                    
                    const animTarget = actualAnimData.target || (animId.startsWith('enemy') ? 'enemy' : 'player');
                    
                    if (animTarget === 'enemy') {
                        // 적 캐릭터 가져오기
                        const enemyChar = this.characters.get('enemy');
                        if (enemyChar) {
                            stepContainer = enemyChar.container;
                            stepSprite = enemyChar.sprite;
                            stepOriginX = enemyChar.baseX;
                            stepOriginY = enemyChar.baseY;
                            stepDir = -1;
                        } else if (options.targetContainer && options.targetSprite) {
                            // 옵션에서 타겟 정보 사용
                            stepContainer = options.targetContainer;
                            stepSprite = options.targetSprite;
                            stepOriginX = options.targetBaseX || stepContainer.x;
                            stepOriginY = options.targetBaseY || stepContainer.y;
                            stepDir = -1;
                        }
                    }
                    
                    // 애니메이션 재생
                    const promise = this.playKeyframes(actualAnimData, {
                        ...options,
                        container: stepContainer,
                        sprite: stepSprite,
                        originX: stepOriginX,
                        originY: stepOriginY,
                        dir: stepDir,
                        isRelative: true,  // 시퀀스 내에서는 상대 좌표
                        stepEvents: step   // 스텝에 정의된 이벤트 전달
                    });
                    
                    // wait가 true면 완료까지 대기
                    if (step.wait) {
                        await promise;
                    }
                    
                    // 📍 스텝 완료 후 이벤트 처리
                    await this.processStepEvents(step, options);
                }
            }
        } catch (e) {
            console.error(`[DDOOAction] ❌ Sequence 에러 (${data.id}):`, e);
        }
        
        // ⭐ returnToBase: 원점으로 복귀! (에러 발생해도 무조건 실행)
        // 🔥 플레이어 복원을 최우선으로! (적이 죽어도 플레이어는 돌아와야 함)
        try {
            if (data.returnToBase !== false) {
                await this.returnToOrigin(container, sprite, originX, originY);
            }
        } catch (e) {
            console.warn('[DDOOAction] returnToOrigin 에러 (무시):', e);
        }
        
        // ⚠️ 최종 안전장치: 호출자 컨테이너/스프라이트 강제 복원!
        try {
            if (sprite) {
                sprite.alpha = 1;
                sprite.rotation = 0;
                if (sprite.scale) sprite.scale.set(1, 1);
            }
            if (container) {
                gsap.killTweensOf(container);  // 진행 중인 트윈 정리!
                container.x = originX;
                container.y = originY;
            }
        } catch (e) {
            console.warn('[DDOOAction] 호출자 복원 에러:', e);
        }
        
        // ⚠️ 플레이어 캐릭터 확실히 복원! (DDOOAction 캐릭터 - 적이 죽어도 작동!)
        try {
            const playerChar = this.characters.get('player');
            if (playerChar && playerChar.sprite && playerChar.container) {
                gsap.killTweensOf(playerChar.container);
                gsap.killTweensOf(playerChar.sprite);
                playerChar.sprite.alpha = 1;
                playerChar.sprite.rotation = 0;
                if (playerChar.sprite.scale) playerChar.sprite.scale.set(1, 1);
                playerChar.container.x = playerChar.baseX;
                playerChar.container.y = playerChar.baseY;
            }
        } catch (e) {
            console.warn('[DDOOAction] 플레이어 복원 에러:', e);
        }
        
        // ⚠️ 적 캐릭터도 상태 복원 (죽었으면 건너뜀)
        try {
            const enemyChar = this.characters.get('enemy');
            if (enemyChar && enemyChar.sprite && enemyChar.container && enemyChar.sprite.parent) {
                gsap.killTweensOf(enemyChar.container);
                gsap.killTweensOf(enemyChar.sprite);
                enemyChar.sprite.alpha = 1;
                enemyChar.sprite.rotation = 0;
                if (enemyChar.sprite.scale) enemyChar.sprite.scale.set(1, 1);
                enemyChar.container.x = enemyChar.baseX;
                enemyChar.container.y = enemyChar.baseY;
            }
        } catch (e) {
            // 적이 죽었으면 무시
        }
        
        // 📷 카메라 리셋
        this.resetCamera();
        
        // 🎨 컬러 그레이딩 리셋
        this.resetColorGrade();
        
        // ⏱️ 슬로우모션 리셋
        this.resetSlowmo();
        
        if (options.onComplete) options.onComplete();
    },
    
    // ⭐ 원점 복귀 애니메이션
    async returnToOrigin(container, sprite, originX, originY) {
        return new Promise((resolve) => {
            // ⚠️ 안전 체크: 컨테이너/스프라이트가 없으면 즉시 완료
            if (!container || !sprite) {
                console.warn('[DDOOAction] returnToOrigin: 컨테이너/스프라이트 없음, 건너뜀');
                resolve();
                return;
            }
            
            // ⚠️ 안전 체크: 스프라이트가 이미 제거되었으면 즉시 완료
            if (!sprite.parent) {
                console.warn('[DDOOAction] returnToOrigin: 스프라이트가 제거됨, 위치만 복원');
                container.x = originX;
                container.y = originY;
                resolve();
                return;
            }
            
            const duration = this.config.return.duration / 1000 / this.config.speed;
            const ease = this.config.return.ease;
            
            // 그림자 찾기
            const charId = [...this.characters.keys()].find(
                id => this.characters.get(id)?.container === container
            );
            const shadow = charId ? this.characters.get(charId)?.shadow : null;
            
            // ⚠️ 기존 트윈 정리
            gsap.killTweensOf(container);
            gsap.killTweensOf(sprite);
            if (sprite.scale) gsap.killTweensOf(sprite.scale);
            
            gsap.to(container, {
                x: originX,
                y: originY,
                duration,
                ease,
                onUpdate: () => {
                    if (shadow && sprite.alpha !== undefined) {
                        shadow.x = container.x;
                        shadow.y = container.y + (this.config.character.shadowOffsetY || 5);
                        shadow.alpha = sprite.alpha * (this.config.character.shadowAlpha || 0.4);
                    }
                },
                onComplete: () => {
                    // ⚠️ 최종 확실한 복원 (안전 체크)
                    if (sprite && sprite.parent) {
                        sprite.alpha = 1;
                        sprite.rotation = 0;
                        if (sprite.scale) sprite.scale.set(1, 1);
                    }
                    container.x = originX;
                    container.y = originY;
                    resolve();
                }
            });
            
            // 스케일/회전/알파 정규화 (안전 체크)
            if (sprite.scale) gsap.to(sprite.scale, { x: 1, y: 1, duration, ease });
            gsap.to(sprite, { rotation: 0, alpha: 1, duration, ease });
        });
    },
    
    // ==================== 📷 카메라 시스템 ====================
    
    // 카메라 피벗 설정 (확대/축소 기준점을 화면 중앙으로)
    setupCameraPivot() {
        if (!this.stageContainer || !this.pixiApp || this.cameraState.pivotSet) return;
        
        // ⚠️ app.stage 직접 사용 시 pivot 설정 건너뜀 (위치 꼬임 방지)
        if (this.cameraState.isRootStage) {
            this.cameraState.pivotSet = true;
            if (this.config.debug) console.log(`[DDOOAction] 📷 Pivot 설정 건너뜀 (app.stage 직접 사용)`);
            return;
        }
        
        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;
        
        // 피벗을 화면 중앙으로 설정
        this.stageContainer.pivot.set(centerX, centerY);
        this.stageContainer.position.set(centerX, centerY);
        
        this.cameraState.pivotSet = true;
        if (this.config.debug) console.log(`[DDOOAction] 📷 Pivot set to center: (${centerX}, ${centerY})`);
    },
    
    // 카메라 줌
    cameraZoom(zoom, duration = 300) {
        if (!this.config.enableCamera || !this.stageContainer) return;
        
        // 피벗이 설정되어 있는지 확인
        this.setupCameraPivot();
        
        const targetZoom = Math.max(this.config.camera.minZoom, Math.min(this.config.camera.maxZoom, zoom));
        const dur = duration / 1000 / this.config.speed / this.timescale;
        
        // ⚠️ app.stage 직접 사용 시 PixiJS 줌 건너뜀 (3D 배경만 줌)
        if (!this.cameraState.isRootStage) {
            // PixiJS stageContainer 줌
            gsap.to(this.stageContainer.scale, {
                x: targetZoom,
                y: targetZoom,
                duration: dur,
                ease: 'power2.out'
            });
        }
        
        // 🎥 Background3D 카메라 줌 연동 (있으면)
        // ⚠️ animate()가 매 프레임 currentZ를 targetZ로 보간하므로, targetZ를 변경!
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            const newTargetZ = baseZ / targetZoom;  // 줌인하면 카메라 가까이
            
            // targetZ 변경 → updateAutoZoom이 부드럽게 currentZ를 따라가게 함
            Background3D.autoZoom.targetZ = newTargetZ;
            
            if (this.config.debug) console.log(`[DDOOAction] 📷 3D Cam targetZ: ${newTargetZ.toFixed(1)}`);
        }
        
        this.cameraState.zoom = targetZoom;
        if (this.config.debug) console.log(`[DDOOAction] 📷 Zoom: ${targetZoom.toFixed(2)}`);
    },
    
    // 카메라 이동 (특정 대상 포커스)
    cameraFocus(target, duration = 200) {
        if (!this.config.enableCamera || !this.stageContainer) return;
        
        // ⚠️ app.stage 직접 사용 시 포커스 건너뜀
        if (this.cameraState.isRootStage) {
            if (this.config.debug) console.log(`[DDOOAction] 📷 Focus 건너뜀 (app.stage 직접 사용)`);
            return;
        }
        
        // 피벗이 설정되어 있는지 확인
        this.setupCameraPivot();
        
        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;
        let focusX = centerX, focusY = centerY;
        
        if (target === 'player') {
            const playerChar = this.characters.get('player');
            if (playerChar) {
                // 플레이어를 화면 중앙으로 이동 (포커스)
                focusX = centerX + (centerX - playerChar.container.x) * 0.4;
                focusY = centerY + (centerY - playerChar.container.y) * 0.3;
            }
        } else if (target === 'enemy') {
            const enemyChar = this.characters.get('enemy');
            if (enemyChar) {
                focusX = centerX + (centerX - enemyChar.container.x) * 0.4;
                focusY = centerY + (centerY - enemyChar.container.y) * 0.3;
            }
        } else if (target === 'center') {
            focusX = centerX;
            focusY = centerY;
        }
        
        const dur = duration / 1000 / this.config.speed / this.timescale;
        
        gsap.to(this.stageContainer.position, {
            x: focusX,
            y: focusY,
            duration: dur,
            ease: 'power2.out'
        });
        
        this.cameraState.offsetX = focusX - centerX;
        this.cameraState.offsetY = focusY - centerY;
        this.cameraState.focusTarget = target;
        
        if (this.config.debug) console.log(`[DDOOAction] 📷 Focus: ${target}`);
    },
    
    // 카메라 리셋
    resetCamera() {
        if (!this.config.enableCamera || !this.stageContainer) return;
        
        const dur = this.config.camera.zoomSpeed / this.config.speed / this.timescale;
        const centerX = this.pixiApp?.screen.width / 2 || 0;
        const centerY = this.pixiApp?.screen.height / 2 || 0;
        
        // ⚠️ app.stage 직접 사용 시 PixiJS 카메라 조작 건너뜀
        if (!this.cameraState.isRootStage) {
            gsap.to(this.stageContainer.scale, {
                x: this.config.camera.defaultZoom,
                y: this.config.camera.defaultZoom,
                duration: dur,
                ease: 'power2.out'
            });
            
            if (this.cameraState.pivotSet) {
                gsap.to(this.stageContainer.position, {
                    x: centerX,
                    y: centerY,
                    duration: dur,
                    ease: 'power2.out'
                });
            } else {
                gsap.to(this.stageContainer, {
                    x: 0,
                    y: 0,
                    duration: dur,
                    ease: 'power2.out'
                });
            }
        }
        
        // 🎥 Background3D 카메라도 리셋 (targetZ 복원 → 자동 보간)
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            Background3D.autoZoom.targetZ = baseZ;
        }
        
        this.cameraState = {
            zoom: this.config.camera.defaultZoom,
            offsetX: 0,
            offsetY: 0,
            focusTarget: null,
            pivotSet: this.cameraState.pivotSet,
            isRootStage: this.cameraState.isRootStage  // 🔄 유지!
        };
    },
    
    // 🔄 카메라 즉시 리셋 (애니메이션 없이)
    resetCameraImmediate() {
        if (!this.stageContainer) return;
        
        const centerX = this.pixiApp?.screen.width / 2 || 0;
        const centerY = this.pixiApp?.screen.height / 2 || 0;
        
        // ⚠️ app.stage 직접 사용 시 PixiJS 카메라 조작 건너뜀
        if (!this.cameraState.isRootStage) {
            // GSAP 트윈 중단
            gsap.killTweensOf(this.stageContainer.scale);
            gsap.killTweensOf(this.stageContainer.position);
            gsap.killTweensOf(this.stageContainer);
            
            // 즉시 리셋
            this.stageContainer.scale.set(this.config.camera.defaultZoom);
            
            if (this.cameraState.pivotSet) {
                this.stageContainer.position.set(centerX, centerY);
            } else {
                this.stageContainer.x = 0;
                this.stageContainer.y = 0;
            }
        }
        
        // 🎥 Background3D 카메라도 즉시 리셋 (targetZ + currentZ 동시 복원)
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            Background3D.autoZoom.targetZ = baseZ;
            Background3D.autoZoom.currentZ = baseZ;  // 즉시 적용
        }
        
        this.cameraState = {
            zoom: this.config.camera.defaultZoom,
            offsetX: 0,
            offsetY: 0,
            focusTarget: null,
            pivotSet: this.cameraState.pivotSet,
            isRootStage: this.cameraState.isRootStage  // 🔄 유지!
        };
    },
    
    // ==================== ⏱️ 슬로우모션 시스템 ====================
    
    // 슬로우모션 적용
    slowmo(scale, duration = 500, ease = 'power2.out') {
        if (!this.config.enableSlowmo) return;
        
        const targetScale = Math.max(
            this.config.slowmo.minScale, 
            Math.min(this.config.slowmo.maxScale, scale)
        );
        
        // 기존 트윈 중단
        if (this.slowmoTween) {
            this.slowmoTween.kill();
        }
        
        const dur = duration / 1000;
        
        this.slowmoTween = gsap.to(this, {
            timescale: targetScale,
            duration: dur,
            ease: ease,
            onUpdate: () => {
                // GSAP globalTimeScale 동기화
                if (typeof gsap !== 'undefined') {
                    gsap.globalTimeline.timeScale(this.timescale);
                }
            }
        });
        
        if (this.config.debug) console.log(`[DDOOAction] ⏱️ Slowmo: ${targetScale.toFixed(2)}`);
        
        return this.slowmoTween;
    },
    
    // 슬로우모션 + 자동 복구 (임팩트용)
    slowmoImpact(scale = 0.2, holdDuration = 100, recoveryDuration = 400) {
        if (!this.config.enableSlowmo) return Promise.resolve();
        
        return new Promise(resolve => {
            // 즉시 슬로우
            this.slowmo(scale, 30, 'power4.out');
            
            // 홀드 후 복구
            setTimeout(() => {
                this.slowmo(1.0, recoveryDuration, 'power2.inOut');
                setTimeout(resolve, recoveryDuration);
            }, holdDuration);
        });
    },
    
    // 슬로우모션 리셋
    resetSlowmo() {
        if (this.slowmoTween) {
            this.slowmoTween.kill();
            this.slowmoTween = null;
        }
        
        this.timescale = 1.0;
        if (typeof gsap !== 'undefined') {
            gsap.globalTimeline.timeScale(1.0);
        }
        
        if (this.config.debug) console.log(`[DDOOAction] ⏱️ Slowmo reset`);
    },
    
    // 🔄 슬로우모션 즉시 리셋 (애니메이션 없이)
    resetSlowmoImmediate() {
        if (this.slowmoTween) {
            this.slowmoTween.kill();
            this.slowmoTween = null;
        }
        this.timescale = 1.0;
        if (typeof gsap !== 'undefined') {
            gsap.globalTimeline.timeScale(1.0);
        }
    },
    
    // ==================== 🎨 컬러 그레이딩 시스템 ====================
    
    // 컬러 그레이딩 적용
    applyColorGrade(effect, duration = 150) {
        if (!this.config.enableColorGrade || !this.stageContainer) return;
        
        // 필터가 없으면 생성
        if (!this.colorFilter && typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
            this.colorFilter = new PIXI.ColorMatrixFilter();
        }
        if (!this.colorFilter) return;
        
        // 필터 적용 (⚠️ filters 배열은 직접 수정 불가, 새 배열로 할당!)
        if (!this.stageContainer.filters) {
            this.stageContainer.filters = [this.colorFilter];
        } else if (!this.stageContainer.filters.includes(this.colorFilter)) {
            // push 대신 새 배열 생성하여 할당
            this.stageContainer.filters = [...this.stageContainer.filters, this.colorFilter];
        }
        
        const dur = duration / 1000 / this.config.speed;
        
        // 효과별 처리
        switch (effect) {
            case 'hit':  // 피격 - 붉은색 플래시
                this.colorFilter.reset();
                this.colorFilter.saturate(0.3);
                gsap.to(this.colorFilter, {
                    saturate: 1,
                    duration: dur,
                    ease: 'power2.out'
                });
                // 임시 틴트 효과
                if (this.stageContainer.tint !== undefined) {
                    gsap.fromTo(this.stageContainer, 
                        { tint: 0xff6666 },
                        { tint: 0xffffff, duration: dur }
                    );
                }
                break;
                
            case 'critical':  // 크리티컬 - 흑백 플래시
                this.colorFilter.reset();
                this.colorFilter.desaturate();
                gsap.to({}, {
                    duration: dur * 0.5,
                    onComplete: () => {
                        this.colorFilter.reset();
                    }
                });
                break;
                
            case 'power':  // 파워업 - 황금빛
                this.colorFilter.reset();
                this.colorFilter.sepia(0.3);
                gsap.to({}, {
                    duration: dur,
                    onComplete: () => {
                        this.colorFilter.reset();
                    }
                });
                break;
                
            case 'shadow':  // 그림자 - 어두운 보라
                this.colorFilter.reset();
                this.colorFilter.night(0.3);
                break;
                
            case 'heal':  // 힐 - 녹색
                this.colorFilter.reset();
                this.colorFilter.hue(60);
                gsap.to({}, {
                    duration: dur,
                    onComplete: () => {
                        this.colorFilter.reset();
                    }
                });
                break;
                
            default:
                this.colorFilter.reset();
        }
        
        if (this.config.debug) console.log(`[DDOOAction] 🎨 Color: ${effect}`);
    },
    
    // 컬러 그레이딩 리셋
    resetColorGrade() {
        if (!this.colorFilter) return;
        
        this.colorFilter.reset();
        
        // 필터 목록에서 제거 (선택적)
        // if (this.stageContainer?.filters) {
        //     const idx = this.stageContainer.filters.indexOf(this.colorFilter);
        //     if (idx >= 0) this.stageContainer.filters.splice(idx, 1);
        // }
    },
    
    // 🔄 컬러 그레이딩 즉시 리셋
    resetColorGradeImmediate() {
        if (this.colorFilter) {
            this.colorFilter.reset();
        }
    },
    
    // 📍 스텝 이벤트 처리
    async processStepEvents(step, options) {
        const { onDamage, onBuff, onDebuff, onEvent } = options;
        
        // 🎯 대미지
        if (step.damage !== undefined && onDamage) {
            onDamage(step.damage, step.target || 'enemy');
        }
        
        // 🎯 버프
        if (step.buff && onBuff) {
            const buff = typeof step.buff === 'object' ? step.buff : { name: step.buff, value: 1 };
            onBuff(buff.name, buff.value, buff.target || 'player');
        }
        
        // 🎯 디버프
        if (step.debuff && onDebuff) {
            const debuff = typeof step.debuff === 'object' ? step.debuff : { name: step.debuff, value: 1 };
            onDebuff(debuff.name, debuff.value, debuff.target || 'enemy');
        }
        
        // 🎯 커스텀 이벤트
        if (step.event && onEvent) {
            onEvent(step.event);
        }
    },
    
    playKeyframes(data, options) {
        return new Promise((resolve) => {
            const {
                container,
                sprite,
                baseX = container.x,
                baseY = container.y,
                originX,
                originY,
                dir = 1,
                isRelative = false,
                getHitPoint,
                onDamage,
                onBuff,
                onDebuff,
                onEvent,
                onHit,
                stepEvents
            } = options;
            
            // ⚠️ 중요: baseScale은 항상 1.0으로 고정!
            const baseScale = 1.0;
            const startX = container.x;
            
            // 애니메이션 시작 전 스케일 정규화
            if (data.keyframes && data.keyframes[0]) {
                const firstKf = data.keyframes[0];
                sprite.scale.set(firstKf.scaleX ?? 1, firstKf.scaleY ?? 1);
            }
            
            // 그림자 찾기 (캐릭터 ID로)
            const charId = [...this.characters.keys()].find(
                id => this.characters.get(id)?.container === container
            );
            const charData = charId ? this.characters.get(charId) : null;
            const shadow = charData?.shadow;
            
            const tl = gsap.timeline({
                onUpdate: () => {
                    // 그림자 위치 동기화
                    if (shadow) {
                        shadow.x = container.x;
                        shadow.y = container.y + (this.config.character.shadowOffsetY || 5);
                        shadow.alpha = sprite.alpha * (this.config.character.shadowAlpha || 0.4);
                    }
                },
                onComplete: () => {
                    // ⚠️ 마지막 키프레임 상태로 확실히 설정
                    const lastKf = data.keyframes[data.keyframes.length - 1];
                    if (lastKf) {
                        if (lastKf.alpha !== undefined) sprite.alpha = lastKf.alpha;
                        if (lastKf.scaleX !== undefined && lastKf.scaleY !== undefined) {
                            sprite.scale.set(lastKf.scaleX, lastKf.scaleY);
                        }
                        if (lastKf.rotation !== undefined) sprite.rotation = lastKf.rotation;
                    }
                    resolve();
                }
            });
            
            data.keyframes.forEach((kf, idx) => {
                if (idx === 0) return;
                
                const dur = (kf.duration || 100) / 1000 / this.config.speed;
                const ease = kf.ease || 'power2.out';
                const pos = idx === 1 ? 0 : '>';
                
                // 🎯 타겟으로 대시 (dashToTarget)
                if (kf.dashToTarget) {
                    tl.call(() => {
                        // 타겟 위치 계산
                        let targetX = container.x;
                        let targetChar = null;
                        let myChar = null;
                        
                        // 내 캐릭터 정보 찾기 (DDOOAction.characters 또는 현재 sprite)
                        const myCharId = [...this.characters.keys()].find(
                            id => this.characters.get(id)?.container === container
                        );
                        myChar = myCharId ? this.characters.get(myCharId) : { container, sprite };
                        
                        if (kf.dashToTarget === 'enemy' || kf.dashToTarget === true) {
                            // 🎯 우선순위: options.targetContainer > DDOOAction.characters
                            if (options.targetContainer) {
                                targetChar = { container: options.targetContainer, sprite: options.targetSprite };
                            } else {
                                targetChar = this.characters.get('enemy');
                            }
                        } else if (kf.dashToTarget === 'player') {
                            targetChar = this.characters.get('player');
                        }
                        
                        if (targetChar) {
                            // 🎯 스프라이트 크기 기반 오프셋 계산 (겹침 방지)
                            let myWidth = 50;  // 기본값
                            let targetWidth = 50;  // 기본값
                            const padding = kf.dashPadding || 10;  // 추가 여백
                            
                            // 내 스프라이트 너비 계산
                            if (myChar?.sprite) {
                                try {
                                    const myBounds = myChar.sprite.getBounds();
                                    myWidth = myBounds.width / 2;
                                } catch (e) {
                                    myWidth = (myChar.sprite.width || 50) * Math.abs(myChar.sprite.scale?.x || 1) / 2;
                                }
                            } else if (sprite) {
                                try {
                                    const myBounds = sprite.getBounds();
                                    myWidth = myBounds.width / 2;
                                } catch (e) {
                                    myWidth = (sprite.width || 50) * Math.abs(sprite.scale?.x || 1) / 2;
                                }
                            }
                            
                            // 타겟 스프라이트 너비 계산
                            if (targetChar.sprite) {
                                try {
                                    const targetBounds = targetChar.sprite.getBounds();
                                    targetWidth = targetBounds.width / 2;
                                } catch (e) {
                                    targetWidth = (targetChar.sprite.width || 50) * Math.abs(targetChar.sprite.scale?.x || 1) / 2;
                                }
                            }
                            
                            // 동적 오프셋: 두 스프라이트가 겹치지 않는 거리
                            const autoOffset = myWidth + targetWidth + padding;
                            const offset = kf.dashOffset !== undefined ? kf.dashOffset : autoOffset;
                            
                            // 타겟 위치에서 오프셋만큼 떨어진 곳으로
                            if (kf.dashToTarget === 'player') {
                                targetX = targetChar.container.x + (offset * dir);
                            } else {
                                targetX = targetChar.container.x - (offset * dir);
                            }
                            
                            if (this.config.debug) {
                                console.log(`[DDOOAction] 🎯 DashToTarget - myWidth: ${myWidth.toFixed(0)}, targetWidth: ${targetWidth.toFixed(0)}, offset: ${offset.toFixed(0)}`);
                            }
                        }
                        
                        // 빠른 대시 애니메이션
                        gsap.to(container, {
                            x: targetX,
                            y: baseY + (kf.y || 0),
                            duration: dur,
                            ease: kf.dashEase || 'power3.out',
                            onUpdate: () => {
                                // 그림자 동기화
                                if (myChar?.shadow) {
                                    myChar.shadow.x = container.x;
                                    myChar.shadow.y = container.y + (this.config.character.shadowOffsetY || 5);
                                }
                            }
                        });
                        
                        if (this.config.debug) console.log(`[DDOOAction] 🎯 DashToTarget: ${targetX.toFixed(0)}`);
                    }, null, pos);
                }
                // 일반 이동
                else if (kf.x !== undefined) {
                    const targetX = isRelative ? startX + (kf.x * dir) : baseX + (kf.x * dir);
                    tl.to(container, { x: targetX, duration: dur, ease }, pos);
                }
                
                if (kf.y !== undefined && !kf.dashToTarget) {
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
                        // vfxTarget: "self"면 자기 위치, 아니면 타격점
                        let vfxX, vfxY, vfxScale;
                        
                        if (kf.vfxTarget === 'self' || data.target === 'player' && !kf.damage) {
                            // 자기 자신에게 VFX (회피, 버프 등)
                            const bounds = sprite.getBounds();
                            vfxX = container.x;
                            vfxY = container.y - (bounds.height || 60) / 2;
                            vfxScale = sprite.scale.x || 1;
                            
                            // 🎯 프로젝타일용 타겟 정보 저장
                            this.currentTargetContainer = options.targetContainer || null;
                            this.currentTargetSprite = options.targetSprite || null;
                        } else {
                            // 적에게 VFX (공격)
                            const hitPoint = getHitPoint ? getHitPoint() : { x: container.x, y: container.y };
                            vfxX = hitPoint.x;
                            vfxY = hitPoint.y;
                            vfxScale = hitPoint.scale || 1;
                            
                            // 🎯 프로젝타일용 타겟 정보 저장
                            this.currentTargetContainer = options.targetContainer || null;
                            this.currentTargetSprite = options.targetSprite || null;
                        }
                        
                        this.triggerVFX(kf.vfx, vfxX, vfxY, dir, vfxScale);
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
                
                // 🎆 복셀 쉐터 (타격감!)
                if (kf.shatter) {
                    tl.call(() => {
                        const shatterOpts = typeof kf.shatter === 'object' ? kf.shatter : {};
                        const target = shatterOpts.target || 'enemy';
                        this.shatterTarget(target, {
                            gridSize: shatterOpts.grid || 10,
                            force: shatterOpts.force || 12,
                            gravity: shatterOpts.gravity || 0.35,
                            life: shatterOpts.life || 500,
                            color: shatterOpts.color || null,
                            dirBias: dir,  // 공격 방향으로 튀어나감
                            hideSprite: shatterOpts.hide !== false,
                            hideTime: shatterOpts.hideTime || 150
                        });
                    }, null, '<');
                }
                
                // 📷 카메라 줌
                if (kf.camera && this.config.enableCamera) {
                    tl.call(() => {
                        if (kf.camera.zoom !== undefined) {
                            this.cameraZoom(kf.camera.zoom, kf.camera.duration || 200);
                        }
                        if (kf.camera.focus !== undefined) {
                            this.cameraFocus(kf.camera.focus, kf.camera.duration || 150);
                        }
                    }, null, '<');
                }
                
                // 🎨 컬러 그레이딩
                if (kf.color && this.config.enableColorGrade) {
                    tl.call(() => {
                        this.applyColorGrade(kf.color, kf.colorDuration || 150);
                    }, null, '<');
                }
                
                // ⏱️ 슬로우모션
                if (kf.slowmo !== undefined && this.config.enableSlowmo) {
                    tl.call(() => {
                        if (typeof kf.slowmo === 'object') {
                            // { scale: 0.3, duration: 500 }
                            this.slowmo(kf.slowmo.scale, kf.slowmo.duration || 500, kf.slowmo.ease);
                        } else if (kf.slowmo === 'impact') {
                            // 임팩트 슬로우 (순간 멈춤 후 복귀)
                            this.slowmoImpact(0.15, 80, 350);
                        } else if (typeof kf.slowmo === 'number') {
                            // 단순 스케일 값
                            this.slowmo(kf.slowmo, kf.slowmoDuration || 300);
                        } else if (kf.slowmo === 'reset' || kf.slowmo === 1) {
                            // 리셋
                            this.slowmo(1.0, 200);
                        }
                    }, null, '<');
                }
                
                // 잔상
                if (kf.afterimage && this.config.enableAfterimage) {
                    tl.call(() => {
                        const tint = data.target === 'player' ? 0x60a5fa : 0xef4444;
                        this.createAfterimage(sprite, container, 0.7, tint);
                    }, null, '<');
                }
                
                // ========== 🎯 게임 이벤트 (키프레임 레벨) ==========
                
                // 대미지
                if (kf.damage !== undefined && onDamage) {
                    tl.call(() => {
                        onDamage(kf.damage, kf.target || 'enemy');
                        if (onHit) onHit(kf);
                    }, null, '<');
                }
                
                // 버프
                if (kf.buff && onBuff) {
                    tl.call(() => {
                        const buff = typeof kf.buff === 'object' ? kf.buff : { name: kf.buff, value: 1 };
                        onBuff(buff.name, buff.value, buff.target || 'player');
                    }, null, '<');
                }
                
                // 디버프
                if (kf.debuff && onDebuff) {
                    tl.call(() => {
                        const debuff = typeof kf.debuff === 'object' ? kf.debuff : { name: kf.debuff, value: 1 };
                        onDebuff(debuff.name, debuff.value, debuff.target || 'enemy');
                    }, null, '<');
                }
                
                // 커스텀 이벤트
                if (kf.event && onEvent) {
                    tl.call(() => onEvent(kf.event), null, '<');
                }
                
                // 히트 (단순 히트 마커)
                if (kf.hit && onHit) {
                    tl.call(() => onHit(kf), null, '<');
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
                    case 'smoke':
                        this.spawnSmokeParticle(def, x, y, scale);
                        break;
                    case 'symbol':
                        this.spawnSymbolParticle(def, x, y, scale);
                        break;
                    case 'trail':
                        // trail은 잔상 시스템 사용
                        break;
                    case 'projectile':
                        this.spawnProjectileParticle(def, x, y, dir, scale);
                        break;
                }
            }, delayBetween * i);
        }
    },
    
    // 🎯 프로젝타일 파티클 생성 (타겟을 향해 날아감)
    spawnProjectileParticle(def, startX, startY, dir, scale) {
        // 타겟 위치 계산 (현재 활성 타겟 컨테이너 사용)
        let targetX = startX + dir * 400;  // 기본값
        let targetY = startY;
        
        // DDOOAction의 현재 타겟 정보 사용
        if (this.currentTargetContainer) {
            targetX = this.currentTargetContainer.x;
            // 타겟 스프라이트 중앙점
            if (this.currentTargetSprite) {
                const bounds = this.currentTargetSprite.getBounds();
                targetY = this.currentTargetContainer.y - bounds.height / 2;
            } else {
                targetY = this.currentTargetContainer.y - 60;
            }
        } else {
            // 캐릭터 Map에서 찾기
            const targetChar = dir > 0 ? this.characters.get('enemy') : this.characters.get('player');
            if (targetChar) {
                targetX = targetChar.container.x;
                if (targetChar.sprite) {
                    const bounds = targetChar.sprite.getBounds();
                    targetY = targetChar.container.y - bounds.height / 2;
                } else {
                    targetY = targetChar.container.y - 60;
                }
            }
        }
        
        const speed = (def.speed || 25) * scale;
        const size = (def.size || 20) * scale;
        
        this.spawnParticle({
            type: 'projectile',
            x: startX,
            y: startY,
            targetX: targetX,
            targetY: targetY,
            speed: speed,
            size: size,
            rotation: def.rotation || 0,
            currentRotation: 0,
            shape: def.shape || 'circle',
            color: def.color || '#94a3b8',
            glow: def.glow || '#60a5fa',
            trail: def.trail !== false,
            trailTimer: 0,
            life: def.life || 500,
            onHitVFX: def.onHitVFX || null
        });
    },
    
    // 연기 파티클 생성
    spawnSmokeParticle(def, x, y, scale) {
        const spread = (def.spread || 30) * scale;
        const size = this.getRandValue(def.size) * scale;
        const speed = this.getRandValue(def.speed) * scale;
        const angleRange = def.angle || { min: -180, max: 180 };
        const angleDeg = angleRange.min + Math.random() * (angleRange.max - angleRange.min);
        const angleRad = angleDeg * Math.PI / 180;
        
        this.spawnParticle({
            type: 'smoke',
            x: x + (Math.random() - 0.5) * spread,
            y: y + (Math.random() - 0.5) * spread,
            vx: Math.cos(angleRad) * speed,
            vy: Math.sin(angleRad) * speed,
            size: size,
            startSize: size,
            gravity: def.gravity || -0.1,
            color: def.color || '#333333',
            life: this.getRandValue(def.life),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05
        });
    },
    
    // 심볼(이모지) 파티클 생성
    spawnSymbolParticle(def, x, y, scale) {
        this.spawnParticle({
            type: 'symbol',
            x: x,
            y: y,
            vy: def.floatUp ? -1.5 : 0,
            symbol: def.symbol || '⭐',
            size: (def.size || 30) * scale,
            life: def.life || 500
        });
    },
    
    // ============================================
    // 🎆 복셀 쉐터 효과 (스프라이트 산산조각!)
    // ============================================
    spawnVoxelShatter(sprite, options = {}) {
        if (!sprite || !sprite.texture) return;
        
        const gridSize = options.gridSize || 8;  // 8x8 조각
        const force = options.force || 15;       // 폭발 힘
        const gravity = options.gravity || 0.4;  // 중력
        const life = options.life || 600;        // 수명
        const color = options.color || null;     // 색상 오버라이드
        const dirBias = options.dirBias || 0;    // 방향 편향 (-1: 왼쪽, 1: 오른쪽)
        
        // 스프라이트 위치/크기
        const bounds = sprite.getBounds();
        const spriteX = bounds.x + bounds.width / 2;
        const spriteY = bounds.y + bounds.height / 2;
        const pieceW = bounds.width / gridSize;
        const pieceH = bounds.height / gridSize;
        
        // 텍스처에서 색상 샘플링 시도
        let pixels = null;
        try {
            const tex = sprite.texture;
            if (tex.source && tex.source.resource) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = tex.width;
                canvas.height = tex.height;
                ctx.drawImage(tex.source.resource, 0, 0);
                pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            }
        } catch (e) {
            // 색상 샘플링 실패 시 기본값 사용
        }
        
        // 조각 생성
        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                // 조각 중심점
                const px = bounds.x + (gx + 0.5) * pieceW;
                const py = bounds.y + (gy + 0.5) * pieceH;
                
                // 중심에서의 거리/각도
                const dx = px - spriteX;
                const dy = py - spriteY;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const angle = Math.atan2(dy, dx);
                
                // 폭발 속도 (중심에서 멀수록 약간 빠름)
                const speed = force * (0.5 + Math.random() * 0.8) * (1 + dist * 0.01);
                const biasAngle = angle + dirBias * 0.5;
                
                // 색상 결정
                let pieceColor = color || '#888888';
                if (pixels && !color) {
                    // 텍스처에서 색상 샘플링
                    const texX = Math.floor((gx / gridSize) * sprite.texture.width);
                    const texY = Math.floor((gy / gridSize) * sprite.texture.height);
                    const idx = (texY * sprite.texture.width + texX) * 4;
                    if (pixels[idx + 3] > 50) {  // 투명하지 않으면
                        pieceColor = `rgb(${pixels[idx]}, ${pixels[idx+1]}, ${pixels[idx+2]})`;
                    } else {
                        continue;  // 투명 픽셀은 건너뜀
                    }
                }
                
                this.spawnParticle({
                    type: 'voxel',
                    x: px,
                    y: py,
                    vx: Math.cos(biasAngle) * speed + (Math.random() - 0.5) * force * 0.5,
                    vy: Math.sin(biasAngle) * speed - force * 0.3 - Math.random() * force * 0.5,
                    size: Math.max(pieceW, pieceH) * (0.8 + Math.random() * 0.4),
                    color: pieceColor,
                    gravity: gravity,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    life: life * (0.7 + Math.random() * 0.6)
                });
            }
        }
        
        console.log(`[DDOOAction] 🎆 Voxel Shatter: ${gridSize}x${gridSize} = ${gridSize*gridSize} pieces`);
    },
    
    // 대상 스프라이트에 쉐터 효과 (JSON에서 호출용)
    shatterTarget(target, options = {}) {
        let sprite = null;
        
        if (target === 'enemy' || target === 'target') {
            sprite = this.currentTargetSprite;
        } else if (target === 'player' || target === 'self') {
            sprite = this.currentSprite;
        } else if (target && target.texture) {
            sprite = target;
        }
        
        if (sprite) {
            // 스프라이트 일시적으로 숨기기 (선택적)
            if (options.hideSprite !== false) {
                const originalAlpha = sprite.alpha;
                sprite.alpha = 0;
                
                // 잠시 후 복구
                setTimeout(() => {
                    sprite.alpha = originalAlpha;
                }, options.hideTime || 200);
            }
            
            this.spawnVoxelShatter(sprite, options);
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
            case 'smoke':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                p.rotation += p.rotationSpeed || 0;
                p.size = p.startSize * (1 + progress * 0.5);
                this.drawSmokeParticle(p, alpha * 0.7);
                break;
            case 'symbol':
                p.y += p.vy || 0;
                this.drawSymbolParticle(p, alpha, progress);
                break;
            case 'projectile':
                this.updateAndDrawProjectile(p, alpha, progress);
                break;
            case 'trail_dot':
                this.drawTrailDot(p, alpha);
                break;
            case 'voxel':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                p.rotation += p.rotationSpeed || 0;
                this.drawVoxelParticle(p, alpha, progress);
                break;
        }
    },
    
    // 🔵 트레일 도트 렌더링
    drawTrailDot(p, alpha) {
        const ctx = this.vfxCtx;
        if (!ctx) return;
        
        const size = p.size || 5;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color || '#60a5fa';
        ctx.shadowColor = p.color || '#60a5fa';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * (1 - alpha * 0.3), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 🎆 복셀 조각 렌더링
    drawVoxelParticle(p, alpha, progress) {
        const ctx = this.vfxCtx;
        if (!ctx) return;
        
        const size = p.size || 8;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        
        // 페이드아웃
        ctx.globalAlpha = alpha * (1 - progress * 0.3);
        
        // 메인 복셀 조각 (사각형)
        ctx.fillStyle = p.color || '#888888';
        const halfSize = size / 2;
        ctx.fillRect(-halfSize, -halfSize, size, size);
        
        // 하이라이트 (3D 느낌)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-halfSize, -halfSize, size * 0.4, size * 0.4);
        
        // 그림자 (3D 느낌)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(halfSize * 0.2, halfSize * 0.2, size * 0.6, size * 0.6);
        
        // 글로우 효과 (선택적)
        if (progress < 0.3) {
            ctx.shadowColor = p.color || '#ffffff';
            ctx.shadowBlur = 10 * (1 - progress * 3);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(-halfSize, -halfSize, size, size);
        }
        
        ctx.restore();
    },
    
    // 🎯 프로젝타일 업데이트 및 렌더링
    updateAndDrawProjectile(p, alpha, progress) {
        const ctx = this.vfxCtx;
        if (!ctx) return;
        
        // 프로젝타일 이동
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > p.speed) {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
        } else {
            // 타겟 도달 - 히트 VFX
            if (p.onHitVFX && !p.hitTriggered) {
                p.hitTriggered = true;
                this.triggerVFX(p.onHitVFX, p.targetX, p.targetY, 1, 1);
            }
            p.x = p.targetX;
            p.y = p.targetY;
            p.life = 0;  // 즉시 제거
            return;
        }
        
        // 회전
        if (p.rotation) {
            p.currentRotation += p.rotation * Math.PI / 180 * 0.016;
        }
        
        // 잔상 트레일 생성
        if (p.trail && dist > 10) {
            p.trailTimer = (p.trailTimer || 0) + 1;
            if (p.trailTimer % 3 === 0) {
                this.spawnParticle({
                    type: 'trail_dot',
                    x: p.x - (dx / dist) * 8,
                    y: p.y - (dy / dist) * 8,
                    size: p.size * 0.4,
                    color: p.glow || 'rgba(148, 163, 184, 0.5)',
                    life: 120
                });
            }
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.currentRotation || 0);
        
        // 글로우
        ctx.shadowColor = p.glow || p.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = alpha;
        
        // 모양별 렌더링
        if (p.shape === 'dagger') {
            // 🗡️ 단검 모양
            const size = p.size;
            
            // 블레이드 (메인)
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(size * 1.2, 0);           // 끝
            ctx.lineTo(size * 0.3, -size * 0.25);  // 위쪽 날
            ctx.lineTo(-size * 0.4, -size * 0.15); // 손잡이 연결부
            ctx.lineTo(-size * 0.6, 0);            // 손잡이
            ctx.lineTo(-size * 0.4, size * 0.15);  // 손잡이 연결부
            ctx.lineTo(size * 0.3, size * 0.25);   // 아래쪽 날
            ctx.closePath();
            ctx.fill();
            
            // 하이라이트
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.moveTo(size * 1.0, 0);
            ctx.lineTo(size * 0.2, -size * 0.12);
            ctx.lineTo(-size * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            
            // 손잡이
            ctx.fillStyle = '#4a3728';
            ctx.globalAlpha = alpha;
            ctx.fillRect(-size * 0.6, -size * 0.08, size * 0.25, size * 0.16);
            
        } else if (p.shape === 'shuriken') {
            // ⭐ 수리검 모양
            const size = p.size;
            ctx.fillStyle = p.color;
            
            // 4개의 날
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.lineTo(size * 0.3, size * 0.3);
                ctx.lineTo(0, 0);
                ctx.lineTo(size * 0.3, -size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            
            // 중앙 원
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // 기본 원형
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // 연기 파티클 렌더링
    drawSmokeParticle(p, alpha) {
        const ctx = this.vfxCtx;
        if (!ctx) return;
        
        // 유효성 검사
        const size = p.size || 20;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        
        // 부드러운 원형 연기
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, p.color || '#333333');
        gradient.addColorStop(0.5, (p.color || '#333333') + 'aa');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 심볼 파티클 렌더링
    drawSymbolParticle(p, alpha, progress) {
        const ctx = this.vfxCtx;
        if (!ctx) return;
        
        // 유효성 검사
        const size = p.size || 30;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 글로우 효과
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        
        ctx.fillText(p.symbol || '⭐', p.x, p.y);
        ctx.restore();
    },
    
    drawSlashParticle(p, alpha, progress) {
        // NaN/Infinity 체크
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const rad = (p.angle || 0) * Math.PI / 180;
        const len = Math.max(1, p.startLength * (1 - progress * 0.3));
        
        this.vfxCtx.translate(p.x, p.y);
        this.vfxCtx.rotate(rad);
        
        if (p.glow) {
            this.vfxCtx.shadowColor = p.glow;
            this.vfxCtx.shadowBlur = 20;
        }
        
        const halfLen = len / 2;
        const grad = this.vfxCtx.createLinearGradient(-halfLen, 0, halfLen, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.3, p.color || '#ffffff');
        grad.addColorStop(0.7, p.color || '#ffffff');
        grad.addColorStop(1, 'transparent');
        
        this.vfxCtx.strokeStyle = grad;
        this.vfxCtx.lineWidth = Math.max(1, (p.startWidth || 5) * alpha);
        this.vfxCtx.lineCap = 'round';
        
        this.vfxCtx.beginPath();
        this.vfxCtx.moveTo(-halfLen, 0);
        this.vfxCtx.lineTo(halfLen, 0);
        this.vfxCtx.stroke();
    },
    
    drawArrowParticle(p, alpha, progress) {
        // NaN/Infinity 체크
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const len = Math.max(1, (p.startLength || 50) * (1 - progress * 0.4));
        const width = Math.max(1, (p.startWidth || 30) * (1 - progress * 0.3));
        const tipRad = (p.tipAngle || 35) * Math.PI / 180;
        const dir = p.dir || 1;
        
        this.vfxCtx.translate(p.x, p.y);
        if (dir < 0) this.vfxCtx.scale(-1, 1);
        
        if (p.glow) {
            this.vfxCtx.shadowColor = p.glow;
            this.vfxCtx.shadowBlur = 25;
        }
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        
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
        this.vfxCtx.strokeStyle = p.color || '#ffffff';
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
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = Math.max(1, (p.startSize || 5) * alpha);
        
        this.vfxCtx.fillStyle = p.color || '#fbbf24';
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.vfxCtx.shadowColor = p.color || '#fbbf24';
        this.vfxCtx.shadowBlur = 8;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
        this.vfxCtx.fill();
    },
    
    drawFlashParticle(p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startSize) || p.startSize <= 0) {
            return;
        }
        
        const size = Math.max(1, p.startSize * (1 + progress * 0.5));
        const color = p.color || '#ffffff';
        
        const grad = this.vfxCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'transparent');
        
        this.vfxCtx.fillStyle = grad;
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.8));
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
        this.vfxCtx.fill();
    },
    
    drawRingParticle(p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startSize)) return;
        
        const currentSize = Math.max(1, (p.startSize || 10) + ((p.maxSize || 50) - (p.startSize || 10)) * progress);
        
        this.vfxCtx.strokeStyle = p.color || '#ef4444';
        this.vfxCtx.lineWidth = 3 * alpha;
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.7));
        this.vfxCtx.shadowColor = p.color || '#ef4444';
        this.vfxCtx.shadowBlur = 10;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        this.vfxCtx.stroke();
    },
    
    drawLineParticle(p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const rad = (p.angle || 0) * Math.PI / 180;
        const len = Math.max(1, p.startLength * (1 - progress * 0.3));
        
        this.vfxCtx.strokeStyle = p.color || '#fbbf24';
        this.vfxCtx.lineWidth = Math.max(1, (p.startWidth || 3) * alpha);
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.vfxCtx.lineCap = 'round';
        this.vfxCtx.shadowColor = p.color || '#fbbf24';
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
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = Math.max(1, (p.startSize || 5) * alpha);
        
        this.vfxCtx.fillStyle = p.color || '#ef4444';
        this.vfxCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.vfxCtx.shadowColor = p.color || '#ef4444';
        this.vfxCtx.shadowBlur = 5;
        
        this.vfxCtx.beginPath();
        this.vfxCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
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


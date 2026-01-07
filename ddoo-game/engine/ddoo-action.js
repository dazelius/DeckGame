// =====================================================
// DDOO Action Engine v3.2
// 애니메이션 & VFX & 캐릭터 렌더링 & 카메라 & 컬러그레이딩 & 슬로우모션 & 필터 통합 엔진
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
        enableColorGrade: false,   // 🎨 컬러 그레이딩 - 전역 필터 문제로 비활성화
        enableSlowmo: true,        // ⏱️ 슬로우모션
        enableFilters: false,      // ✨ PixiJS 필터 - 기본 OFF (성능)
        debug: false,
        
        // ⚡ 성능 설정 (최적화)
        performance: {
            maxParticles: 100,        // 최대 파티클 수 (줄임)
            shadowBlur: false,        // shadowBlur OFF (가장 느린 효과)
            maxShadowBlur: 8,         // 최대 shadowBlur 값
            useGradients: true,       // 그라데이션 사용
            particleQuality: 1.0,     // 파티클 품질
            skipFrames: 0             // 프레임 스킵
        },
        
        // 리턴 애니메이션 설정
        return: {
            duration: 120,       // 리턴 시간 (ms) - 빠르게!
            ease: 'power3.out'   // 빠른 이징
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
        },
        
        // ✨ 필터 설정
        filters: {
            bloom: {
                enabled: true,
                strength: 1.5,
                brightness: 1.0,
                blur: 3
            },
            glow: {
                enabled: true,
                distance: 15,
                outerStrength: 2,
                innerStrength: 0,
                color: 0x60a5fa,
                quality: 0.3
            },
            shockwave: {
                enabled: true,
                amplitude: 20,
                wavelength: 100,
                speed: 400
            }
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
    
    // ✨ PixiJS 필터
    pixiFilters: {
        bloom: null,
        glow: null,
        shockwave: null,
        available: false  // pixi-filters 로드 여부
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
        
        // 📁 외부 설정 파일 로드 (ddoo-config.json)
        await this.loadConfig();
        
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
        
        // ✨ PixiJS 필터 초기화
        this.initPixiFilters();
        
        this.initialized = true;
        console.log('[DDOOAction] ✅ 엔진 v3.0 초기화 완료');
        console.log(`[DDOOAction] 📁 애니메이션: ${this.animCache.size}개`);
        console.log(`[DDOOAction] 💥 VFX: ${this.vfxCache.size}개`);
        console.log(`[DDOOAction] 📷 카메라: ${this.config.enableCamera ? 'ON' : 'OFF'}`);
        console.log(`[DDOOAction] 🎨 컬러그레이딩: ${this.config.enableColorGrade ? 'ON' : 'OFF'}`);
        
        return this;
    },
    
    // 📁 외부 설정 파일 로드
    async loadConfig() {
        try {
            const res = await fetch('ddoo-config.json');
            if (res.ok) {
                const json = await res.json();
                // 기존 config에 덮어쓰기 (deep merge)
                this.mergeConfig(this.config, json);
                console.log('[DDOOAction] 📁 ddoo-config.json 로드 완료');
            }
        } catch (e) {
            console.log('[DDOOAction] 📁 ddoo-config.json 없음, 기본 설정 사용');
        }
    },
    
    // 설정 병합 (deep merge)
    mergeConfig(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeConfig(target[key], source[key]);
            } else {
                // 문자열 "0x..."를 숫자로 변환
                if (typeof source[key] === 'string' && source[key].startsWith('0x')) {
                    target[key] = parseInt(source[key], 16);
                } else {
                    target[key] = source[key];
                }
            }
        }
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
    
    // 🎨 컬러 그레이딩 필터 초기화 (현재 비활성화됨)
    initColorFilter() {
        // ⚠️ 컬러 그레이딩이 전체 화면에 영향을 주는 문제로 비활성화
        // 개별 스프라이트 tint 효과로 대체됨
        if (!this.config.enableColorGrade) return;
        
        if (typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
            this.colorFilter = new PIXI.ColorMatrixFilter();
            if (this.stageContainer && !this.stageContainer.filters) {
                this.stageContainer.filters = [];
            }
        }
    },
    
    // ✨ PixiJS 필터 초기화 (pixi-filters 라이브러리)
    initPixiFilters() {
        // pixi-filters 라이브러리 체크
        if (typeof PIXI === 'undefined' || typeof PIXI.filters === 'undefined') {
            console.log('[DDOOAction] ⚠️ pixi-filters 미로드 - 고급 필터 비활성화');
            this.pixiFilters.available = false;
            return;
        }
        
        try {
            const filters = PIXI.filters;
            
            // 🌟 블룸 필터 (밝은 부분 번짐)
            if (filters.AdvancedBloomFilter) {
                this.pixiFilters.bloom = new filters.AdvancedBloomFilter({
                    threshold: 0.5,
                    bloomScale: this.config.filters.bloom.strength,
                    brightness: this.config.filters.bloom.brightness,
                    blur: this.config.filters.bloom.blur,
                    quality: 5
                });
                console.log('[DDOOAction] ✨ BloomFilter 준비완료');
            }
            
            // 💡 글로우 필터 (외곽 발광)
            if (filters.GlowFilter) {
                this.pixiFilters.glow = new filters.GlowFilter({
                    distance: this.config.filters.glow.distance,
                    outerStrength: this.config.filters.glow.outerStrength,
                    innerStrength: this.config.filters.glow.innerStrength,
                    color: this.config.filters.glow.color,
                    quality: this.config.filters.glow.quality
                });
                console.log('[DDOOAction] 💡 GlowFilter 준비완료');
            }
            
            // 🌊 충격파 필터 (v6.0.0+ API)
            if (filters.ShockwaveFilter) {
                this.pixiFilters.shockwave = new filters.ShockwaveFilter({
                    center: { x: 0.5, y: 0.5 },
                    amplitude: this.config.filters.shockwave.amplitude,
                    wavelength: this.config.filters.shockwave.wavelength,
                    speed: this.config.filters.shockwave.speed,
                    radius: -1,
                    brightness: 1,
                    time: 0
                });
                console.log('[DDOOAction] 🌊 ShockwaveFilter 준비완료');
            }
            
            this.pixiFilters.available = true;
            console.log('[DDOOAction] ✨ PixiJS 필터 시스템 초기화 완료');
            
        } catch (e) {
            console.warn('[DDOOAction] ⚠️ 필터 초기화 실패:', e);
            this.pixiFilters.available = false;
        }
    },
    
    // ✨ 스프라이트에 글로우 효과 적용
    applyGlow(sprite, options = {}) {
        if (!this.pixiFilters.available || !this.pixiFilters.glow) return;
        if (!sprite) return;
        
        const color = options.color || this.config.filters.glow.color;
        const strength = options.strength || this.config.filters.glow.outerStrength;
        const distance = options.distance || this.config.filters.glow.distance;
        
        try {
            const glow = new PIXI.filters.GlowFilter({
                distance: distance,
                outerStrength: strength,
                innerStrength: 0,
                color: color,
                quality: 0.3
            });
            
            if (!sprite.filters) sprite.filters = [];
            sprite.filters = [...sprite.filters, glow];
            
            // 자동 제거 (옵션)
            if (options.duration) {
                gsap.to(glow, {
                    outerStrength: 0,
                    duration: options.duration / 1000,
                    ease: 'power2.out',
                    onComplete: () => {
                        if (sprite.filters) {
                            sprite.filters = sprite.filters.filter(f => f !== glow);
                        }
                    }
                });
            }
            
            return glow;
        } catch (e) {
            console.warn('[DDOOAction] 글로우 적용 실패:', e);
        }
    },
    
    // ✨ 스프라이트에 블룸 효과 적용
    applyBloom(sprite, options = {}) {
        if (!this.pixiFilters.available || !PIXI.filters.AdvancedBloomFilter) return;
        if (!sprite) return;
        
        try {
            const bloom = new PIXI.filters.AdvancedBloomFilter({
                threshold: options.threshold || 0.3,
                bloomScale: options.scale || 1.5,
                brightness: options.brightness || 1.2,
                blur: options.blur || 4,
                quality: 5
            });
            
            if (!sprite.filters) sprite.filters = [];
            sprite.filters = [...sprite.filters, bloom];
            
            // 자동 제거
            if (options.duration) {
                gsap.to(bloom, {
                    bloomScale: 0,
                    duration: options.duration / 1000,
                    ease: 'power2.out',
                    onComplete: () => {
                        if (sprite.filters) {
                            sprite.filters = sprite.filters.filter(f => f !== bloom);
                        }
                    }
                });
            }
            
            return bloom;
        } catch (e) {
            console.warn('[DDOOAction] 블룸 적용 실패:', e);
        }
    },
    
    // 🌊 충격파 효과 (성능 문제로 기본 비활성화)
    triggerShockwave(x, y, options = {}) {
        // ⚡ 성능 최적화: ShockwaveFilter는 매우 무거움 - 비활성화
        if (!this.config.enableFilters) return;
        if (!this.pixiFilters.available || !this.stageContainer) return;
        if (!PIXI.filters || !PIXI.filters.ShockwaveFilter) return;
        
        try {
            const screenW = this.pixiApp?.screen?.width || 800;
            const screenH = this.pixiApp?.screen?.height || 600;
            
            // 화면 좌표를 normalized 좌표로 변환
            const centerX = x / screenW;
            const centerY = y / screenH;
            
            // v6.0.0+ 새 API: options 객체만 사용
            const shockwave = new PIXI.filters.ShockwaveFilter({
                center: { x: centerX, y: centerY },
                amplitude: options.amplitude || 15,
                wavelength: options.wavelength || 80,
                speed: options.speed || 300,
                radius: -1,
                brightness: 1,
                time: 0
            });
            
            // 스테이지에 필터 추가
            if (!this.stageContainer.filters) {
                this.stageContainer.filters = [shockwave];
            } else {
                this.stageContainer.filters = [...this.stageContainer.filters, shockwave];
            }
            
            // 충격파 애니메이션
            const duration = options.duration || 600;
            const maxRadius = options.maxRadius || 300;
            const startAmplitude = options.amplitude || 15;
            
            gsap.to(shockwave, {
                time: duration / 1000,
                duration: duration / 1000,
                ease: 'power2.out',
                onUpdate: () => {
                    // 반경 확장
                    shockwave.radius = (shockwave.time / (duration / 1000)) * maxRadius;
                    // 진폭 감소
                    shockwave.amplitude = startAmplitude * (1 - shockwave.time / (duration / 1000));
                },
                onComplete: () => {
                    // 필터 제거
                    if (this.stageContainer.filters) {
                        this.stageContainer.filters = this.stageContainer.filters.filter(f => f !== shockwave);
                    }
                }
            });
            
            console.log(`[DDOOAction] 🌊 Shockwave at (${x.toFixed(0)}, ${y.toFixed(0)})`);
            return shockwave;
            
        } catch (e) {
            console.warn('[DDOOAction] 충격파 적용 실패:', e);
        }
    },
    
    // ✨ 타격 시 글로우+블룸 콤보 효과
    triggerHitEffect(sprite, options = {}) {
        if (!this.pixiFilters.available || !sprite) return;
        
        const color = options.color || 0xffffff;
        const duration = options.duration || 200;
        
        // 1. 글로우 효과
        this.applyGlow(sprite, {
            color: color,
            strength: 4,
            distance: 20,
            duration: duration
        });
        
        // 2. 밝기 플래시
        if (sprite.tint !== undefined) {
            const originalTint = sprite.tint;
            sprite.tint = 0xffffff;
            gsap.to(sprite, {
                tint: originalTint,
                duration: duration / 1000,
                ease: 'power2.out'
            });
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
        
        // 🔧 기존 컨테이너가 있으면 먼저 정리! (중복 생성 방지)
        const existingShadow = this.stageContainer.children.find(c => c.name === 'ddoo-shadows');
        const existingAfterimage = this.stageContainer.children.find(c => c.name === 'ddoo-afterimages');
        
        if (existingShadow) {
            this.stageContainer.removeChild(existingShadow);
            existingShadow.destroy({ children: true });
        }
        if (existingAfterimage) {
            this.stageContainer.removeChild(existingAfterimage);
            existingAfterimage.destroy({ children: true });
        }
        
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
        if (!charData || !charData.sprite) return;
        
        const { sprite, container, baseScale = 1 } = charData;
        const amount = this.config.character.breathingAmount;
        const speed = this.config.character.breathingSpeed;
        
        // 🔥 EnemyRenderer 판단: container.scale < 0.95면 EnemyRenderer가 숨쉬기 담당
        // DDOOAction은 숨쉬기 건너뜀 (충돌 방지!)
        const containerScale = container?.scale?.x || 1;
        if (containerScale < 0.95) {
            // EnemyRenderer가 이미 container.scale로 숨쉬기 중
            // sprite.scale은 건드리지 않음
            if (this.config.debug) {
                console.log('[DDOOAction] 🫁 EnemyRenderer 숨쉬기 사용 중 (스킵)');
            }
            return;
        }
        
        // effects 객체가 없으면 생성
        if (!charData.effects) charData.effects = {};
        
        // 기존 브레싱 있으면 정리
        if (charData.effects.breathing) {
            charData.effects.breathing.kill();
        }
        
        // DDOOAction 캐릭터 (container.scale=1, sprite.scale=baseScale)
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
        if (!charData || !charData.effects) return;
        if (charData.effects.breathing) {
            charData.effects.breathing.pause();
        }
    },
    
    resumeBreathing(charData) {
        if (!charData || !charData.effects) return;
        if (charData.effects.breathing) {
            charData.effects.breathing.resume();
        }
    },
    
    // ==================== 리사이즈 핸들러 ====================
    handleResize() {
        if (!this.initialized) return;
        
        const battleArena = document.querySelector('.battle-arena');
        if (!battleArena) return;
        
        const width = battleArena.offsetWidth;
        const height = battleArena.offsetHeight;
        const groundY = height * 0.75;
        
        // 🎯 PlayerRenderer에서 위치 동기화
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.playerContainer) {
            const playerChar = this.characters.get('player');
            if (playerChar) {
                const newX = PlayerRenderer.playerContainer.x;
                const newY = PlayerRenderer.playerContainer.y;
                playerChar.container.x = newX;
                playerChar.container.y = newY;
                playerChar.baseX = newX;
                playerChar.baseY = newY;
                if (playerChar.shadow) {
                    playerChar.shadow.x = newX;
                    playerChar.shadow.y = newY + (this.config.character.shadowOffsetY || 5);
                }
            }
        }
        
        // 🎯 EnemyRenderer에서 위치 동기화
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.sprites) {
            EnemyRenderer.sprites.forEach((data, id) => {
                // DDOOAction에서 같은 ID의 캐릭터 찾기
                let charId = 'enemy';
                if (id !== 'enemy' && !id.startsWith('enemy')) {
                    // pixiId로 저장된 경우
                    const enemyChar = this.characters.get('enemy');
                    if (enemyChar && enemyChar.container === data.container) {
                        charId = 'enemy';
                    }
                }
                
                const enemyChar = this.characters.get(charId);
                if (enemyChar && data.container) {
                    const newX = data.container.x;
                    const newY = data.container.y;
                    enemyChar.container.x = newX;
                    enemyChar.container.y = newY;
                    enemyChar.baseX = newX;
                    enemyChar.baseY = newY;
                    if (enemyChar.shadow) {
                        enemyChar.shadow.x = newX;
                        enemyChar.shadow.y = newY + (this.config.character.shadowOffsetY || 5);
                    }
                }
            });
        }
        
        // 🎯 VFX Canvas 리사이즈
        if (this.vfxCanvas) {
            this.vfxCanvas.width = width;
            this.vfxCanvas.height = height;
        }
        
        console.log(`[DDOOAction] 📐 리사이즈: ${width}x${height}`);
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
    _isPlaying: false,  // 🔥 재생 중 플래그 (재배치 방지용)
    
    async play(animId, options = {}) {
        // 🔥 재생 중 플래그 설정!
        this._isPlaying = true;
        
        try {
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
                return await this.playSequence(data, { ...options, originX, originY });
            }
            
            // 단일 애니메이션
            const result = await this.playKeyframes(data, { ...options, originX, originY });
            
            // 🔥 단일 애니메이션 완료 후 플래그 해제!
            this._isPlaying = false;
            return result;
        } catch (e) {
            console.error('[DDOOAction] play 에러:', e);
            return null;
        } finally {
            // 🔥 에러 발생해도 플래그 해제!
            this._isPlaying = false;
        }
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
                if (!step.anim && !step.projectile) {
                    await this.processStepEvents(step, options);
                    continue;
                }
                
                // 🎯 관통형 발사체 (시퀀스 레벨)
                if (step.projectile) {
                    if (this.config.debug) console.log(`[DDOOAction] 🎯 Projectile: ${step.projectile.type}`);
                    
                    const promise = this.playProjectile(step.projectile, container, sprite, options);
                    
                    if (step.wait) {
                        await promise;
                    }
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
                        // 🔥 옵션의 타겟을 우선 사용 (단일 타겟 공격에서 정확한 대상!)
                        if (options.targetContainer && options.targetSprite) {
                            stepContainer = options.targetContainer;
                            stepSprite = options.targetSprite;
                            stepOriginX = options.targetBaseX || stepContainer.x;
                            stepOriginY = options.targetBaseY || stepContainer.y;
                            stepDir = -1;
                        } else {
                            // 옵션에 타겟 없으면 등록된 'enemy' 캐릭터 사용 (폴백)
                            const enemyChar = this.characters.get('enemy');
                            if (enemyChar) {
                                stepContainer = enemyChar.container;
                                stepSprite = enemyChar.sprite;
                                stepOriginX = enemyChar.baseX;
                                stepOriginY = enemyChar.baseY;
                                stepDir = -1;
                            }
                        }
                    }
                    
                    // 애니메이션 재생
                    // 🔥 baseX/baseY를 명시적으로 전달하여 원래 위치 기준으로 애니메이션!
                    // (그래야 공중 콤보 등에서 y 오프셋이 누적되지 않음)
                    const promise = this.playKeyframes(actualAnimData, {
                        ...options,
                        container: stepContainer,
                        sprite: stepSprite,
                        baseX: stepOriginX,    // 🔥 원래 위치 기준!
                        baseY: stepOriginY,    // 🔥 원래 위치 기준!
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
            // 🔍 호출자의 baseScale 찾기
            let callerBaseScale = 1;
            this.characters.forEach((char) => {
                if (char.container === container) {
                    callerBaseScale = char.baseScale || 1;
                }
            });
            
            if (sprite) {
                sprite.alpha = 1;
                sprite.rotation = 0;
                // 🔥 EnemyRenderer 판단: container.scale < 0.95면 sprite는 1.0
                const containerScale = container?.scale?.x || 1;
                const spriteTargetScale = (containerScale < 0.95) ? 1 : callerBaseScale;
                if (sprite.scale) sprite.scale.set(spriteTargetScale, spriteTargetScale);
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
                // 🔥 EnemyRenderer 판단: container.scale < 0.95면 sprite는 1.0
                const pContainerScale = playerChar.container?.scale?.x || 1;
                const pSpriteScale = (pContainerScale < 0.95) ? 1 : (playerChar.baseScale || 1);
                if (playerChar.sprite.scale) playerChar.sprite.scale.set(pSpriteScale, pSpriteScale);
                playerChar.container.x = playerChar.baseX;
                playerChar.container.y = playerChar.baseY;
            }
        } catch (e) {
            console.warn('[DDOOAction] 플레이어 복원 에러:', e);
        }
        
        // ⚠️ 모든 적 캐릭터 상태 복원! (개별 baseScale 사용)
        try {
            this.characters.forEach((char, id) => {
                if (id === 'player') return;  // 플레이어는 위에서 처리
                if (!char.sprite || !char.container || !char.sprite.parent) return;  // 죽은 적 스킵
                
                gsap.killTweensOf(char.container);
                gsap.killTweensOf(char.sprite);
                char.sprite.alpha = 1;
                char.sprite.rotation = 0;
                // 🔥 EnemyRenderer 판단: container.scale < 0.95면 sprite는 1.0
                const eContainerScale = char.container?.scale?.x || 1;
                const eSpriteScale = (eContainerScale < 0.95) ? 1 : (char.baseScale || 1);
                if (char.sprite.scale) char.sprite.scale.set(eSpriteScale, eSpriteScale);
                char.container.x = char.baseX;
                char.container.y = char.baseY;
            });
        } catch (e) {
            console.warn('[DDOOAction] 적 복원 에러:', e);
        }
        
        // 📷 카메라 리셋
        this.resetCamera();
        
        // 🎨 컬러 그레이딩 리셋
        this.resetColorGrade();
        
        // ⏱️ 슬로우모션 리셋
        this.resetSlowmo();
        
        // 🔥 재생 완료 플래그!
        this._isPlaying = false;
        
        if (options.onComplete) options.onComplete();
    },
    
    // ⭐ 원점 복귀 애니메이션 (거리가 멀면 점프!)
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
            
            // 🔥 거리 계산
            const distX = Math.abs(container.x - originX);
            const distY = Math.abs(container.y - originY);
            const totalDist = Math.sqrt(distX * distX + distY * distY);
            
            // 거리가 100 이상이면 점프 복귀!
            const shouldJump = totalDist > 100;
            
            const baseDuration = this.config.return.duration / 1000 / this.config.speed;
            // 거리에 따라 시간 조정 (점프도 빠르게!)
            const duration = shouldJump ? Math.min(baseDuration * 1.2, 0.25) : baseDuration;
            
            // 그림자 찾기
            const charId = [...this.characters.keys()].find(
                id => this.characters.get(id)?.container === container
            );
            const shadow = charId ? this.characters.get(charId)?.shadow : null;
            const baseScale = container.breathingBaseScale || 1;
            
            // ⚠️ 기존 트윈 정리
            gsap.killTweensOf(container);
            gsap.killTweensOf(sprite);
            if (sprite.scale) gsap.killTweensOf(sprite.scale);
            
            if (shouldJump) {
                // 🦘 점프 복귀 애니메이션! (빠르게!)
                const jumpHeight = Math.min(40 + totalDist * 0.1, 80);  // 점프 높이 줄임
                const tl = gsap.timeline();
                
                // 🎨 잔상 생성 함수 (회색 톤)
                const createJumpAfterimage = (alpha = 0.5, tint = 0x666666) => {
                    if (this.config.enableAfterimage && sprite && sprite.texture) {
                        this.createAfterimage(sprite, container, alpha, tint);
                    }
                };
                
                // 1️⃣ 점프 준비 (웅크림) - 빠르게 + 잔상!
                tl.to(container.scale, {
                    x: baseScale * 1.1,
                    y: baseScale * 0.85,
                    duration: 0.03,
                    ease: 'power2.in',
                    onStart: () => createJumpAfterimage(0.6, 0x555555)
                });
                
                // 🎨 잔상 트래킹용 변수
                let lastAfterimageTime = 0;
                const afterimageInterval = 35;  // 35ms마다 잔상 생성
                
                // 2️⃣ 도약! (위로 튀면서 x 이동)
                tl.to(container, {
                    x: originX,
                    y: originY - jumpHeight,
                    duration: duration * 0.45,
                    ease: 'power2.out',
                    onUpdate: () => {
                        if (shadow) {
                            shadow.x = container.x;
                            shadow.y = originY + (this.config.character.shadowOffsetY || 5);
                            const heightRatio = Math.abs(container.y - originY) / jumpHeight;
                            shadow.scale.set(1 - heightRatio * 0.4);
                            shadow.alpha = (1 - heightRatio * 0.3) * (this.config.character.shadowAlpha || 0.4);
                        }
                        // 🎨 주기적 잔상 생성
                        const now = performance.now();
                        if (now - lastAfterimageTime > afterimageInterval) {
                            createJumpAfterimage(0.4, 0x666666);
                            lastAfterimageTime = now;
                        }
                    }
                }, '<');
                
                tl.to(container.scale, {
                    x: baseScale * 0.9,
                    y: baseScale * 1.1,
                    duration: duration * 0.45,
                    ease: 'power2.out'
                }, '<');
                
                // 3️⃣ 착지! (빠른 낙하)
                tl.to(container, {
                    y: originY,
                    duration: duration * 0.35,
                    ease: 'power3.in',
                    onUpdate: () => {
                        if (shadow) {
                            const heightRatio = Math.abs(container.y - originY) / jumpHeight;
                            shadow.scale.set(1 - heightRatio * 0.4);
                            shadow.alpha = (1 - heightRatio * 0.3) * (this.config.character.shadowAlpha || 0.4);
                        }
                        // 🎨 착지 중 잔상
                        const now = performance.now();
                        if (now - lastAfterimageTime > afterimageInterval) {
                            createJumpAfterimage(0.35, 0x555555);
                            lastAfterimageTime = now;
                        }
                    }
                });
                
                // 4️⃣ 착지 충격 (스쿼시) - 빠르게
                tl.to(container.scale, {
                    x: baseScale * 1.1,
                    y: baseScale * 0.9,
                    duration: 0.03,
                    ease: 'power4.out',
                    onStart: () => createJumpAfterimage(0.5, 0x444444)
                }, '-=0.01');
                
                // 5️⃣ 복귀 (빠른 탄성)
                tl.to(container.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.08,
                    ease: 'power2.out',
                    onComplete: () => {
                        if (shadow) {
                            shadow.scale.set(1);
                            shadow.alpha = this.config.character.shadowAlpha || 0.4;
                        }
                        this.finishReturnToOrigin(container, sprite, originX, originY, resolve);
                    }
                });
            } else {
                // 🚶 일반 복귀 (가까운 거리)
                gsap.to(container, {
                    x: originX,
                    y: originY,
                    duration,
                    ease: this.config.return.ease,
                    onUpdate: () => {
                        if (shadow && sprite.alpha !== undefined) {
                            shadow.x = container.x;
                            shadow.y = container.y + (this.config.character.shadowOffsetY || 5);
                            shadow.alpha = sprite.alpha * (this.config.character.shadowAlpha || 0.4);
                        }
                    },
                    onComplete: () => {
                        this.finishReturnToOrigin(container, sprite, originX, originY, resolve);
                    }
                });
            }
        });
    },
    
    // 🔧 복귀 완료 처리 (공통)
    finishReturnToOrigin(container, sprite, originX, originY, resolve) {
        // 🔍 캐릭터의 baseScale 찾기
        let baseScale = 1;
        this.characters.forEach((char) => {
            if (char.container === container) {
                baseScale = char.baseScale || 1;
            }
        });
        
        // 🔥 컨테이너 스케일로 EnemyRenderer 판단
        const containerScale = container.scale?.x || 1;
        const isContainerScaled = containerScale < 0.95;
        // EnemyRenderer: sprite는 1.0으로, DDOOAction: sprite는 baseScale로
        const spriteTargetScale = isContainerScaled ? 1 : baseScale;
        
        // ⚠️ 최종 확실한 복원 (안전 체크)
        if (sprite && sprite.parent) {
            sprite.alpha = 1;
            sprite.rotation = 0;
            if (sprite.scale) sprite.scale.set(spriteTargetScale, spriteTargetScale);
        }
        container.x = originX;
        container.y = originY;
        
        // 🔝 zIndex 복구 (dashToTarget에서 저장한 값)
        if (container._originalZIndex !== undefined) {
            container.zIndex = container._originalZIndex;
            delete container._originalZIndex;
            if (container.parent?.sortChildren) container.parent.sortChildren();
        }
        
        resolve();
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
        if (!this.stageContainer) return;
        
        // 피벗이 설정되어 있는지 확인
        this.setupCameraPivot();
        
        const targetZoom = Math.max(this.config.camera.minZoom, Math.min(this.config.camera.maxZoom, zoom));
        const dur = duration / 1000 / this.config.speed / this.timescale;
        
        // 🔥 기존 카메라 트윈 정리 (덜컹거림 방지!)
        if (this._cameraZoomTweens) {
            this._cameraZoomTweens.forEach(tw => tw?.kill?.());
        }
        this._cameraZoomTweens = [];
        
        // 🚫 isRootStage일 때: 캐릭터 컨테이너 스케일 변경 비활성화!
        // 이유: playKeyframes의 sprite.scale과 충돌하여 크기 버그 발생
        // 대신 3D 배경 줌만 사용하여 줌 효과 제공
        if (this.cameraState?.isRootStage && this.characters.size > 0) {
            // 🔒 캐릭터 스케일 변경 건너뜀 (버그 방지)
            // 기존 코드: container.scale 변경 → sprite.scale과 충돌!
            if (this.config.debug) {
                console.log(`[DDOOAction] 📷 캐릭터 스케일 줌 건너뜀 (isRootStage, 3D 배경만 줌)`);
            }
        }
        
        // 🎬 isRootStage가 아닐 때 stageContainer 줌 (전체 화면 줌)
        if (!this.cameraState?.isRootStage) {
            gsap.killTweensOf(this.stageContainer.scale);
            const tw = gsap.to(this.stageContainer.scale, {
                x: targetZoom,
                y: targetZoom,
                duration: dur,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            this._cameraZoomTweens.push(tw);
        }
        
        // 🎥 Background3D 카메라 줌 연동 - 캐릭터 스케일과 동일한 비율!
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            // 🔥 캐릭터 스케일과 동일한 비율로 3D 카메라 줌
            // targetZoom 1.3 → 카메라 거리 15/1.3 = 11.5 (30% 가까이)
            const newTargetZ = baseZ / targetZoom;
            
            Background3D.autoZoom.targetZ = newTargetZ;
            gsap.to(Background3D.autoZoom, {
                currentZ: newTargetZ,
                duration: dur,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            
            console.log(`[DDOOAction] 📷 3D: ${baseZ.toFixed(1)} → ${newTargetZ.toFixed(1)} (zoom ${targetZoom.toFixed(2)})`);
        }
        
        this.cameraState.zoom = targetZoom;
        if (this.config.debug) console.log(`[DDOOAction] 📷 Zoom: ${targetZoom.toFixed(2)}`);
    },
    
    // 카메라 이동 (특정 대상 포커스)
    cameraFocus(target, duration = 200) {
        if (!this.stageContainer) return;
        
        const dur = duration / 1000 / this.config.speed / this.timescale;
        
        // 🔧 Map.get() 사용!
        let focusChar = null;
        if (target === 'player') {
            focusChar = this.characters.get('player');
        } else if (target === 'enemy') {
            focusChar = this.characters.get('enemy') || this.characters.get('target');
        } else if (typeof target === 'string') {
            focusChar = this.characters.get(target);
        }
        
        // 🎬 DDOOAction.characters에 등록된 캐릭터 알파 하이라이트
        // (test_animation.html + 인게임 모두 여기로 통합)
        if (this.characters.size > 0) {
            this.characters.forEach((char, key) => {
                if (char?.sprite) {
                    const isFocus = (char === focusChar);
                    gsap.killTweensOf(char.sprite);
                    gsap.to(char.sprite, {
                        alpha: isFocus ? 1.0 : 0.6,
                        duration: dur,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
            });
            if (this.config.debug) console.log(`[DDOOAction] 📷 Focus: ${target}`);
        }
        
        // 🎬 isRootStage가 아닐 때만 stageContainer 이동
        if (this.cameraState?.isRootStage) {
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
        if (!this.stageContainer) return;
        
        const dur = 0.2;  // 빠른 복원 (200ms)
        const centerX = this.pixiApp?.screen.width / 2 || 0;
        const centerY = this.pixiApp?.screen.height / 2 || 0;
        
        // 🔥 전역 카메라 트윈 정리!
        if (this._cameraZoomTweens) {
            this._cameraZoomTweens.forEach(tw => tw.kill());
            this._cameraZoomTweens = [];
        }
        
        // 🔒 isRootStage일 때: 캐릭터 스케일 복원 건너뜀 (cameraZoom에서 변경 안 함)
        // 알파만 복원
        if (this.cameraState?.isRootStage) {
            this.characters.forEach((char, id) => {
                if (char?.sprite) {
                    gsap.to(char.sprite, {
                        alpha: 1.0,
                        duration: dur,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
            });
        }
        
        // 🎬 isRootStage가 아닐 때만 stageContainer 조작
        if (!this.cameraState?.isRootStage) {
            gsap.killTweensOf(this.stageContainer.scale);
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
        
        // 🎥 Background3D 카메라도 리셋 (부드럽게 복원)
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            Background3D.autoZoom.targetZ = baseZ;
            
            // 🔥 currentZ도 부드럽게 트윈!
            gsap.to(Background3D.autoZoom, {
                currentZ: baseZ,
                duration: dur,
                ease: 'power2.out',
                overwrite: 'auto'
            });
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
        
        // 🔥 진행 중인 카메라 트윈 모두 정리!
        if (this._cameraZoomTweens) {
            this._cameraZoomTweens.forEach(tw => tw?.kill?.());
            this._cameraZoomTweens = [];
        }
        
        // 🔒 isRootStage일 때: 캐릭터 스케일 복원 건너뜀 (cameraZoom에서 변경 안 함)
        // 알파만 복원
        if (this.cameraState?.isRootStage) {
            this.characters.forEach((char, id) => {
                if (char?.sprite) {
                    gsap.killTweensOf(char.sprite);
                    char.sprite.alpha = 1;
                }
            });
        }
        
        // 🎬 isRootStage가 아닐 때만 stageContainer 조작
        if (!this.cameraState?.isRootStage) {
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
            gsap.killTweensOf(Background3D.autoZoom);  // 진행 중인 트윈 정리
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
        
        // ⚠️ 'hit' 효과는 전역 필터 대신 개별 스프라이트 tint 사용 (즉시 리턴!)
        if (effect === 'hit') {
            // 전체 화면에 적용하면 모든 캐릭터가 그레이스케일됨
            // enemy.hit.json의 tint 키프레임으로 대체
            return;
        }
        
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
            case 'hit':  // 위에서 이미 리턴됨
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
            
            // 🔍 캐릭터의 실제 baseScale 찾기!
            const charId = [...this.characters.keys()].find(
                id => this.characters.get(id)?.container === container
            );
            const charData = charId ? this.characters.get(charId) : null;
            const charBaseScale = charData?.baseScale || 1.0;
            const shadow = charData?.shadow;
            
            // ⚠️ 애니메이션 중 스케일은 charBaseScale 기준!
            const baseScale = charBaseScale;
            const startX = container.x;
            
            // 🔥 스프라이트 스케일 기준 결정 (컨테이너 스케일로 판단!)
            // EnemyRenderer: container.scale < 1 (컨테이너가 스케일 담당) → sprite는 1.0 기준
            // DDOOAction: container.scale = 1 (스프라이트가 스케일 담당) → sprite는 baseScale 기준
            const containerScale = container.scale?.x || 1;
            const isContainerScaled = containerScale < 0.95;  // 컨테이너가 스케일되어 있으면 EnemyRenderer 방식
            
            // 🔥 스프라이트의 목표 스케일 (EnemyRenderer=1.0, DDOOAction=baseScale)
            // 이전 애니메이션의 영향을 받지 않도록 고정값 사용!
            const spriteBaseScale = isContainerScaled ? 1 : baseScale;
            const originalSpriteScaleX = spriteBaseScale;
            const originalSpriteScaleY = spriteBaseScale;
            
            // 🔧 애니메이션 시작 전 아웃라인 스프라이트 숨기기!
            // (복잡한 동기화 대신 단순히 숨겼다가 복원)
            const hiddenOutlines = [];
            if (container.children) {
                container.children.forEach(child => {
                    if (child.isOutline && child.visible !== false) {
                        child.visible = false;
                        hiddenOutlines.push(child);
                    }
                });
            }
            
            // 🔥 애니메이션 시작 전 스케일 초기화 (누적 스케일 방지!)
            // 먼저 기본 스케일로 리셋
            sprite.scale.set(spriteBaseScale, spriteBaseScale);
            sprite.rotation = 0;
            
            // 첫 키프레임 스케일 적용
            if (data.keyframes && data.keyframes[0]) {
                const firstKf = data.keyframes[0];
                const sx = (firstKf.scaleX ?? 1) * spriteBaseScale;
                const sy = (firstKf.scaleY ?? 1) * spriteBaseScale;
                sprite.scale.set(sx, sy);
            }
            
            // 🎯 현재 애니메이션 대상 스프라이트 저장 (shatter: "self" 용)
            this.currentSprite = sprite;
            this.currentContainer = container;
            
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
                    // 🔥 마지막 키프레임 상태로 확실히 설정
                    const lastKf = data.keyframes[data.keyframes.length - 1];
                    if (lastKf && sprite && sprite.scale) {
                        if (lastKf.alpha !== undefined) sprite.alpha = lastKf.alpha;
                        
                        // 🔥 스케일 복원: spriteBaseScale 기준! (누적 방지)
                        const finalScaleX = (lastKf.scaleX ?? 1) * spriteBaseScale;
                        const finalScaleY = (lastKf.scaleY ?? 1) * spriteBaseScale;
                        sprite.scale.set(finalScaleX, finalScaleY);
                        
                        // rotation도 복원
                        sprite.rotation = lastKf.rotation ?? 0;
                    }
                    
                    // 🔧 숨겼던 아웃라인 스프라이트 복원! + 스케일 동기화
                    hiddenOutlines.forEach(outline => {
                        outline.visible = true;
                        // 메인 스프라이트와 스케일 동기화!
                        if (sprite && sprite.scale) {
                            outline.scale.set(sprite.scale.x, sprite.scale.y);
                        }
                    });
                    
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
                        // 🛡️ 안전장치: 에러 발생해도 타임라인 재개되도록
                        let timelineResumed = false;
                        const resumeTimeline = () => {
                            if (!timelineResumed) {
                                timelineResumed = true;
                                tl.resume();
                            }
                        };
                        
                        // ⏰ 타임아웃 안전장치: 2초 후에도 재개 안되면 강제 재개
                        const safetyTimeout = setTimeout(() => {
                            if (!timelineResumed) {
                                console.warn('[DDOOAction] ⚠️ dashToTarget 타임아웃! 타임라인 강제 재개');
                                resumeTimeline();
                            }
                        }, 2000);
                        
                        try {
                            // 🔝 공격 시 레이어 최상위로! (몬스터 앞에 오도록)
                            const originalZIndex = container.zIndex || 0;
                            container.zIndex = 9999;
                            if (container.parent?.sortChildren) container.parent.sortChildren();
                            
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
                                const padding = kf.dashPadding !== undefined ? kf.dashPadding : 10;  // 추가 여백 (음수도 허용)
                                
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
                                    console.log(`[DDOOAction] 🎯 DashToTarget: target=${targetChar.container.x.toFixed(0)}, offset=${offset.toFixed(0)}, targetX=${targetX.toFixed(0)}`);
                                }
                            }
                            
                            // 부드러운 대시 애니메이션
                            const dashDuration = Math.max(dur, 0.15);  // 최소 150ms 보장
                            const dashEase = kf.dashEase || 'power2.inOut';  // 더 부드러운 이징
                            
                            // 대시 시작 전 현재 위치
                            const startX = container.x;
                            const finalX = targetX;  // 최종 목적지 저장
                            
                            // 🔥 메인 타임라인 일시정지! (대시 완료 후 재개)
                            tl.pause();
                            
                            // 🔥 기존 container 트윈 모두 정리!
                            gsap.killTweensOf(container);
                            
                            // 대시 애니메이션 실행
                            gsap.to(container, {
                                x: finalX,
                                y: baseY + (kf.y || 0),
                                duration: dashDuration,
                                ease: dashEase,
                                onStart: () => {
                                    if (this.config.debug) console.log(`[DDOOAction] 🚀 대시 시작: ${container.x.toFixed(0)} → ${finalX.toFixed(0)}`);
                                },
                                onUpdate: () => {
                                    // 그림자 동기화
                                    if (myChar?.shadow) {
                                        myChar.shadow.x = container.x;
                                        myChar.shadow.y = container.y + (this.config.character.shadowOffsetY || 5);
                                    }
                                },
                                onComplete: () => {
                                    // 🔥 최종 위치 강제 설정!
                                    container.x = finalX;
                                    container.y = baseY + (kf.y || 0);
                                    
                                    // 🔝 zIndex 복구 저장 (returnToBase에서 사용)
                                    container._originalZIndex = originalZIndex;
                                    
                                    if (this.config.debug) console.log(`[DDOOAction] ✅ 대시 완료: x=${container.x.toFixed(0)}`);
                                    
                                    // 🔥 타임아웃 취소 & 타임라인 재개!
                                    clearTimeout(safetyTimeout);
                                    resumeTimeline();
                                }
                            });
                        } catch (e) {
                            console.error('[DDOOAction] ❌ dashToTarget 에러:', e);
                            clearTimeout(safetyTimeout);
                            resumeTimeline();  // 에러 발생해도 타임라인 재개!
                        }
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
                
                // 스케일 (아웃라인은 숨겨져 있으므로 스프라이트만)
                if (kf.scaleX !== undefined || kf.scaleY !== undefined) {
                    const scaleX = (kf.scaleX ?? 1) * spriteBaseScale;
                    const scaleY = (kf.scaleY ?? 1) * spriteBaseScale;
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
                
                // 스크린쉐이크 + 충격파
                if (kf.shake && this.config.enableShake) {
                    tl.call(() => {
                        this.screenShake(kf.shake);
                        
                        // ✨ 충격파 효과 (shake 강도에 따라)
                        if (this.config.enableFilters && kf.shake >= 8) {
                            const hitPoint = getHitPoint ? getHitPoint() : { x: container.x, y: container.y };
                            this.triggerShockwave(hitPoint.x, hitPoint.y, {
                                amplitude: kf.shake * 1.2,
                                wavelength: 60 + kf.shake * 3,
                                duration: 400 + kf.shake * 20,
                                maxRadius: 200 + kf.shake * 10
                            });
                        }
                    }, null, '<');
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
                
                // 🎯 관통형 발사체 (차크람 등)
                if (kf.projectile) {
                    tl.call(async () => {
                        await this.playProjectile(kf.projectile, container, sprite, options);
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
                        const afterTint = data.target === 'player' ? 0x60a5fa : 0xef4444;
                        this.createAfterimage(sprite, container, 0.7, afterTint);
                    }, null, '<');
                }
                
                // 🔴 틴트 플래시 (피격 시 빠른 색상 변화)
                if (kf.tint) {
                    tl.call(() => {
                        const tintColor = typeof kf.tint.color === 'string' 
                            ? parseInt(kf.tint.color.replace('#', ''), 16) 
                            : kf.tint.color;
                        const tintDuration = (kf.tint.duration || 30) / 1000;
                        
                        if (sprite && sprite.tint !== undefined) {
                            sprite.tint = tintColor;
                            
                            // duration 후 원래 색상으로 복귀 (다음 tint가 없을 경우)
                            gsap.delayedCall(tintDuration, () => {
                                if (sprite && sprite.tint !== undefined) {
                                    // 다음 키프레임의 tint가 있으면 복귀하지 않음
                                    const nextKfIdx = idx + 1;
                                    const nextKf = data.keyframes[nextKfIdx];
                                    if (!nextKf || !nextKf.tint) {
                                        sprite.tint = 0xffffff;
                                    }
                                }
                            });
                        }
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
        
        // 🔧 컨테이너 스케일도 반영! (컨테이너가 스케일링되어 있을 수 있음)
        const containerScaleX = sourceContainer.scale?.x || 1;
        const containerScaleY = sourceContainer.scale?.y || 1;
        ghost.scale.set(
            sourceSprite.scale.x * containerScaleX, 
            sourceSprite.scale.y * containerScaleY
        );
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
                    // 새로운 고급 파티클 타입들
                    case 'energy_orb':
                        this.spawnEnergyOrbParticle(def, x, y, scale);
                        break;
                    case 'electric':
                        this.spawnElectricParticle(def, x, y, i, scale);
                        break;
                    case 'wave':
                        this.spawnWaveParticle(def, x, y, i, scale);
                        break;
                    case 'star':
                        this.spawnStarParticle(def, x, y, scale);
                        break;
                    case 'comet':
                        this.spawnCometParticle(def, x, y, scale);
                        break;
                    case 'sword_arc':
                        this.spawnSwordArcParticle(def, x, y, dir, i, scale);
                        break;
                }
            }, delayBetween * i);
        }
    },
    
    // ⚔️ 검 궤적 아크 스폰
    spawnSwordArcParticle(def, x, y, dir, index, scale) {
        const radius = this.getRandValue(def.radius) * scale;
        const thickness = (def.thickness || 15) * scale;
        const startAngle = def.startAngle || -60;
        const endAngle = def.endAngle || 60;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const glowColors = Array.isArray(def.glowColors) ? def.glowColors : [def.glow || '#60a5fa'];
        const glow = glowColors[Math.floor(Math.random() * glowColors.length)];
        
        this.spawnParticle({
            type: 'sword_arc',
            x: x,
            y: y,
            dir: dir,
            radius: radius,
            thickness: thickness,
            startAngle: startAngle,
            endAngle: endAngle,
            color: color,
            glow: glow,
            trail: def.trail !== false,
            life: this.getRandValue(def.life) || 180
        });
    },
    
    // 🔮 에너지 오브 스폰
    spawnEnergyOrbParticle(def, x, y, scale) {
        const size = this.getRandValue(def.size) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#fbbf24'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const spread = (def.spread || 0) * scale;
        
        this.spawnParticle({
            type: 'energy_orb',
            x: x + (Math.random() - 0.5) * spread,
            y: y + (Math.random() - 0.5) * spread,
            startSize: size,
            color: color,
            life: this.getRandValue(def.life) || 150
        });
    },
    
    // ⚡ 전기 파티클 스폰
    spawnElectricParticle(def, x, y, index, scale) {
        const length = this.getRandValue(def.length) * scale;
        const width = (def.width || 2) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#60a5fa'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angleStep = def.angleStep || 45;
        const angle = angleStep * index;
        
        this.spawnParticle({
            type: 'electric',
            x: x,
            y: y,
            length: length,
            width: width,
            angle: angle,
            segments: def.segments || 5,
            color: color,
            life: this.getRandValue(def.life) || 120
        });
    },
    
    // 🌊 웨이브 파티클 스폰
    spawnWaveParticle(def, x, y, index, scale) {
        const startAngles = Array.isArray(def.startAngle) ? def.startAngle : [def.startAngle || -90];
        const endAngles = Array.isArray(def.endAngle) ? def.endAngle : [def.endAngle || 90];
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#60a5fa'];
        
        this.spawnParticle({
            type: 'wave',
            x: x,
            y: y,
            startSize: (def.startSize || 30) * scale,
            maxSize: (def.maxSize || 100) * scale,
            thickness: (def.thickness || 8) * scale,
            startAngle: startAngles[index % startAngles.length],
            endAngle: endAngles[index % endAngles.length],
            color: colors[index % colors.length],
            life: this.getRandValue(def.life) || 150
        });
    },
    
    // ⭐ 별 파티클 스폰
    spawnStarParticle(def, x, y, scale) {
        const size = this.getRandValue(def.size) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#fbbf24'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const points = Array.isArray(def.points) ? 
            def.points[Math.floor(Math.random() * def.points.length)] : 
            (def.points || 4);
        const spread = (def.spread || 0) * scale;
        const rotationSpeed = this.getRandValue(def.rotationSpeed) || 0.08;
        
        this.spawnParticle({
            type: 'star',
            x: x + (Math.random() - 0.5) * spread,
            y: y + (Math.random() - 0.5) * spread,
            startSize: size,
            points: points,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: rotationSpeed,
            color: color,
            life: this.getRandValue(def.life) || 180
        });
    },
    
    // ☄️ 혜성 파티클 스폰
    spawnCometParticle(def, x, y, scale) {
        const size = this.getRandValue(def.size) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#fbbf24'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const speed = this.getRandValue(def.speed) * scale;
        const angle = Math.random() * Math.PI * 2;
        
        this.spawnParticle({
            type: 'comet',
            x: x,
            y: y,
            startSize: size,
            tailLength: (def.tailLength || 40) * scale,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: this.getRandValue(def.life) || 250
        });
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
        
        const gridSize = options.gridSize || 10;  // 10x10 조각
        const force = options.force || 15;        // 폭발 힘
        const gravity = options.gravity || 0.4;   // 중력
        const life = options.life || 600;         // 수명
        const color = options.color || null;      // 색상 오버라이드
        const dirBias = options.dirBias || 0;     // 방향 편향 (-1: 왼쪽, 1: 오른쪽)
        const maxPieceSize = options.maxSize || 6; // 🔥 최대 조각 크기!
        
        // 🎯 컨테이너 위치 (복셀 중심점!)
        const container = sprite.parent;
        const containerX = container ? container.x : sprite.x;
        const containerY = container ? container.y : sprite.y;
        
        // 🎯 캐릭터 크기 추정 (고정값 사용 - 더 안정적!)
        // 대부분의 캐릭터는 약 60x80 정도 크기
        const charWidth = options.width || 60;
        const charHeight = options.height || 80;
        
        // 🎯 복셀 생성 중심점 = 컨테이너 위치 (앵커가 발 밑이므로 위로 올림)
        const spriteCenterX = containerX;
        const spriteCenterY = containerY - charHeight * 0.4;  // 약간 위 (몸통 중심)
        
        const pieceW = Math.min(charWidth / gridSize, maxPieceSize);
        const pieceH = Math.min(charHeight / gridSize, maxPieceSize);
        
        console.log('[DDOOAction] 🎆 Shatter 위치:', { 
            containerX, containerY, 
            spriteCenterX, spriteCenterY,
            charWidth, charHeight,
            gridSize, pieceW, pieceH
        });
        
        // 🎨 텍스처에서 색상 샘플링 (PixiJS v8 호환)
        let pixels = null;
        let texWidth = 0;
        let texHeight = 0;
        
        try {
            const tex = sprite.texture;
            texWidth = tex.width;
            texHeight = tex.height;
            
            // 🔍 텍스처 구조 디버그
            console.log('[DDOOAction] 📊 텍스처 분석:', {
                width: tex.width,
                height: tex.height,
                hasSource: !!tex.source,
                sourceType: tex.source?.constructor?.name,
                hasResource: !!tex.source?.resource,
                resourceType: tex.source?.resource?.constructor?.name,
                label: tex.source?.label
            });
            
            // 방법 1: texture.source.resource가 HTMLImageElement인 경우 (가장 직접적)
            if (tex.source && tex.source.resource instanceof HTMLImageElement) {
                const img = tex.source.resource;
                if (img.complete && img.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    texWidth = canvas.width;
                    texHeight = canvas.height;
                    console.log('[DDOOAction] 🎨 HTMLImageElement로 픽셀 추출 성공!', texWidth, 'x', texHeight);
                }
            }
            
            // 방법 2: texture.source.resource가 ImageBitmap인 경우
            if (!pixels && tex.source && tex.source.resource instanceof ImageBitmap) {
                const bitmap = tex.source.resource;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                ctx.drawImage(bitmap, 0, 0);
                pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                texWidth = canvas.width;
                texHeight = canvas.height;
                console.log('[DDOOAction] 🎨 ImageBitmap으로 픽셀 추출 성공!', texWidth, 'x', texHeight);
            }
            
            // 방법 3: texture.source.resource.data (Uint8Array 직접 접근)
            if (!pixels && tex.source && tex.source.resource && tex.source.resource.data) {
                pixels = tex.source.resource.data;
                texWidth = tex.source.width || tex.width;
                texHeight = tex.source.height || tex.height;
                console.log('[DDOOAction] 🎨 직접 data 배열 접근 성공!', texWidth, 'x', texHeight);
            }
            
            // 방법 4: PixiJS extract API (백업)
            if (!pixels && this.pixiApp && this.pixiApp.renderer && this.pixiApp.renderer.extract) {
                try {
                    // 텍스처에서 직접 추출 시도
                    const canvas = this.pixiApp.renderer.extract.canvas(tex);
                    const ctx = canvas.getContext('2d');
                    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    texWidth = canvas.width;
                    texHeight = canvas.height;
                    console.log('[DDOOAction] 🎨 Extract API (texture)로 픽셀 추출 성공!', texWidth, 'x', texHeight);
                } catch (e1) {
                    console.log('[DDOOAction] Extract API 실패:', e1.message);
                }
            }
            
            // 방법 5: texture.baseTexture.resource.source (레거시 호환)
            if (!pixels && tex.baseTexture && tex.baseTexture.resource && tex.baseTexture.resource.source) {
                const img = tex.baseTexture.resource.source;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width || img.naturalWidth;
                canvas.height = img.height || img.naturalHeight;
                ctx.drawImage(img, 0, 0);
                pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                texWidth = canvas.width;
                texHeight = canvas.height;
                console.log('[DDOOAction] 🎨 baseTexture.resource.source로 픽셀 추출 성공!', texWidth, 'x', texHeight);
            }
        } catch (e) {
            console.warn('[DDOOAction] ⚠️ 픽셀 추출 실패:', e);
        }
        
        // 🎨 픽셀 추출 실패 시 스프라이트 틴트 색상 사용
        let fallbackColors = ['#888888'];
        if (!pixels) {
            // 스프라이트 틴트 색상 사용
            if (sprite.tint && sprite.tint !== 0xFFFFFF) {
                const tint = sprite.tint;
                const r = (tint >> 16) & 0xFF;
                const g = (tint >> 8) & 0xFF;
                const b = tint & 0xFF;
                fallbackColors = [`rgb(${r},${g},${b})`];
            } else {
                // 캐릭터별 기본 색상
                const isEnemy = this.currentTargetSprite === sprite;
                fallbackColors = isEnemy 
                    ? ['#4a7c59', '#5a9c69', '#3a6c49', '#6aac79', '#2a5c39'] // 고블린 녹색 계열
                    : ['#7c8a99', '#8c9aa9', '#6c7a89', '#9caab9', '#5c6a79']; // 플레이어 회색 계열
            }
            console.warn('[DDOOAction] ⚠️ 픽셀 추출 실패, 대체 색상 사용:', fallbackColors);
        }
        
        // 🔍 픽셀이 있으면 불투명 영역 분석 (Extract API는 전체 캔버스를 반환)
        let opaqueBox = null;
        if (pixels && texWidth > 0 && texHeight > 0) {
            let minX = texWidth, maxX = 0, minY = texHeight, maxY = 0;
            let foundOpaque = false;
            
            // 불투명 픽셀 영역 찾기 (샘플링으로 빠르게)
            const step = Math.max(1, Math.floor(texWidth / 50));
            for (let y = 0; y < texHeight; y += step) {
                for (let x = 0; x < texWidth; x += step) {
                    const idx = (y * texWidth + x) * 4;
                    if (pixels[idx + 3] > 30) {
                        foundOpaque = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            
            if (foundOpaque) {
                // 약간 여유 추가
                minX = Math.max(0, minX - step);
                maxX = Math.min(texWidth - 1, maxX + step);
                minY = Math.max(0, minY - step);
                maxY = Math.min(texHeight - 1, maxY + step);
                opaqueBox = { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
                console.log(`[DDOOAction] 🔍 불투명 영역: ${opaqueBox.w}x${opaqueBox.h} at (${minX},${minY})`);
            } else {
                console.warn('[DDOOAction] ⚠️ 불투명 픽셀을 찾을 수 없음!');
            }
        }
        
        // 조각 생성
        let createdCount = 0;
        const halfW = charWidth / 2;
        const halfH = charHeight / 2;
        
        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                // 🎯 조각 중심점 (캐릭터 중심 기준!)
                const px = (spriteCenterX - halfW) + (gx + 0.5) * pieceW;
                const py = (spriteCenterY - halfH) + (gy + 0.5) * pieceH;
                
                // 중심에서의 거리/각도
                const dx = px - spriteCenterX;
                const dy = py - spriteCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const angle = Math.atan2(dy, dx);
                
                // 폭발 속도 (중심에서 멀수록 약간 빠름)
                const speed = force * (0.5 + Math.random() * 0.8) * (1 + dist * 0.01);
                const biasAngle = angle + dirBias * 0.5;
                
                // 색상 결정
                let pieceColor = color;
                if (!pieceColor) {
                    if (pixels && texWidth > 0 && texHeight > 0 && opaqueBox) {
                        // 불투명 영역 내에서 샘플링
                        const texX = opaqueBox.minX + Math.floor((gx / gridSize) * opaqueBox.w);
                        const texY = opaqueBox.minY + Math.floor((gy / gridSize) * opaqueBox.h);
                        const idx = (texY * texWidth + texX) * 4;
                        
                        if (idx >= 0 && idx + 3 < pixels.length && pixels[idx + 3] > 10) {
                            pieceColor = `rgb(${pixels[idx]}, ${pixels[idx+1]}, ${pixels[idx+2]})`;
                        } else {
                            // 투명 픽셀이면 대체 색상 사용 (건너뛰지 않음)
                            pieceColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
                        }
                    } else {
                        // 대체 색상 랜덤 선택
                        pieceColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
                    }
                }
                
                // 🔥 조각 크기: 작고 픽셀스러운 느낌으로!
                const baseSize = Math.max(pieceW, pieceH);
                const finalSize = Math.min(baseSize * (0.6 + Math.random() * 0.4), maxPieceSize);
                
                this.spawnParticle({
                    type: 'voxel',
                    x: px,
                    y: py,
                    vx: Math.cos(biasAngle) * speed + (Math.random() - 0.5) * force * 0.5,
                    vy: Math.sin(biasAngle) * speed - force * 0.3 - Math.random() * force * 0.5,
                    size: finalSize,
                    color: pieceColor,
                    gravity: gravity,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    life: life * (0.7 + Math.random() * 0.6)
                });
                createdCount++;
            }
        }
        
        console.log(`[DDOOAction] 🎆 Voxel Shatter: ${createdCount}/${gridSize*gridSize} pieces (pixels: ${!!pixels}, opaque: ${!!opaqueBox})`);
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
        // ⚡ 파티클 수 제한 (성능 최적화)
        const maxParticles = this.config.performance?.maxParticles || 150;
        if (this.particles.length >= maxParticles) {
            // 가장 오래된 파티클 제거
            this.particles.shift();
        }
        
        p.born = performance.now();
        p.startLife = p.life || 150;
        if (p.length) p.startLength = p.length;
        if (p.width) p.startWidth = p.width;
        if (p.size) p.startSize = p.size;
        this.particles.push(p);
    },
    
    // ⚡ shadowBlur 최적화 헬퍼 (성능 우선)
    setShadowBlur(ctx, value) {
        // 성능 모드: shadowBlur 완전 비활성화
        if (!this.config.performance?.shadowBlur) {
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            return;
        }
        const max = this.config.performance?.maxShadowBlur || 8;
        ctx.shadowBlur = Math.min(value, max);
    },
    
    // 🔧 DDOOUtils로 위임 (ddoo-utils.js)
    getRandValue(val) {
        return typeof DDOOUtils !== 'undefined' 
            ? DDOOUtils.getRandValue(val) 
            : (Array.isArray(val) ? val[0] + Math.random() * (val[1] - val[0]) : val || 0);
    },
    
    spawnSlashParticle(def, x, y, dir, index, scale) {
        const angles = Array.isArray(def.angle) ? def.angle : [def.angle || 0];
        const angle = angles[index % angles.length] || (Math.random() - 0.5) * 60;
        // 2배 크기 적용
        const length = this.getRandValue(def.length) * scale * 2;
        const width = (def.width || 8) * scale * 2;
        
        this.spawnParticle({
            type: 'slash',
            x, y,
            angle: angle * dir,
            length: length,
            width: width,
            color: def.color || '#ffffff',
            glow: def.glow || '#60a5fa',
            life: def.life || 180
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
    
    // 🎨 DDOODraw 모듈로 위임 (ddoo-draw.js)
    drawParticle(p, alpha, progress) {
        const ctx = this.vfxCtx;
        
        // DDOODraw 모듈 체크
        if (typeof DDOODraw === 'undefined') {
            console.error('[DDOOAction] DDOODraw 모듈이 로드되지 않았습니다! ddoo-draw.js를 먼저 로드하세요.');
            return;
        }
        
        switch (p.type) {
            case 'slash':
                DDOODraw.drawSlashParticle(ctx, p, alpha, progress);
                break;
            case 'arrow':
                DDOODraw.drawArrowParticle(ctx, p, alpha, progress);
                break;
            case 'spark':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                DDOODraw.drawSparkParticle(ctx, p, alpha);
                break;
            case 'flash':
                DDOODraw.drawFlashParticle(ctx, p, alpha, progress);
                break;
            case 'ring':
                DDOODraw.drawRingParticle(ctx, p, alpha, progress);
                break;
            case 'line':
                DDOODraw.drawLineParticle(ctx, p, alpha, progress);
                break;
            case 'debris':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                DDOODraw.drawDebrisParticle(ctx, p, alpha);
                break;
            case 'smoke':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                p.rotation += p.rotationSpeed || 0;
                p.size = p.startSize * (1 + progress * 0.5);
                DDOODraw.drawSmokeParticle(ctx, p, alpha * 0.7);
                break;
            case 'symbol':
                p.y += p.vy || 0;
                DDOODraw.drawSymbolParticle(ctx, p, alpha, progress);
                break;
            case 'projectile':
                this.updateAndDrawProjectile(p, alpha, progress);  // 의존성 있어서 분리 안함
                break;
            case 'trail_dot':
                DDOODraw.drawTrailDot(ctx, p, alpha);
                break;
            case 'voxel':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                if (p.gravity) p.vy += p.gravity;
                p.rotation += p.rotationSpeed || 0;
                DDOODraw.drawVoxelParticle(ctx, p, alpha, progress);
                break;
            // ✨ 새로운 고급 파티클 타입들
            case 'energy_orb':
                DDOODraw.drawEnergyOrbParticle(ctx, p, alpha, progress);
                break;
            case 'electric':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                DDOODraw.drawElectricParticle(ctx, p, alpha, progress);
                break;
            case 'wave':
                DDOODraw.drawWaveParticle(ctx, p, alpha, progress);
                break;
            case 'star':
                p.rotation += p.rotationSpeed || 0.05;
                DDOODraw.drawStarParticle(ctx, p, alpha, progress);
                break;
            case 'comet':
                p.x += p.vx || 0;
                p.y += p.vy || 0;
                DDOODraw.drawCometParticle(ctx, p, alpha, progress);
                break;
            case 'sword_arc':
                DDOODraw.drawSwordArcParticle(ctx, p, alpha, progress);
                break;
        }
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
    
    // ==================== 🎯 관통형 발사체 시스템 ====================
    async playProjectile(config, container, sprite, options = {}) {
        const {
            type = 'chakram',      // 발사체 타입
            piercing = true,       // 관통 여부
            targetAll = true,      // 모든 적 타겟
            reverse = false,       // 역방향 (적→플레이어)
            speed = 25,            // 속도 (픽셀/프레임)
            onHitEach = true,      // 각 타겟 타격 시 콜백
            damage = 4             // 데미지
        } = config;
        
        console.log(`[DDOOAction] 🎯 playProjectile: ${type}, reverse=${reverse}, speed=${speed}`);
        
        return new Promise(async (resolve) => {
            // 🎯 타겟 목록 수집
            let targets = [];
            
            // 1️⃣ 인게임: gameState.enemies
            if (typeof gameState !== 'undefined' && gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, idx) => {
                    if (enemy.hp <= 0) return;
                    
                    let pos = null;
                    
                    // EnemyRenderer에서 위치 가져오기
                    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                        pos = EnemyRenderer.getEnemyPosition(enemy);
                    }
                    
                    if (pos) {
                        targets.push({
                            enemy,
                            x: pos.centerX,
                            y: pos.centerY,
                            idx
                        });
                    }
                });
            }
            
            // 2️⃣ test_animation.html: DDOOAction.characters에서 enemy 찾기
            if (targets.length === 0 && this.characters.size > 0) {
                this.characters.forEach((charData, id) => {
                    if (id.startsWith('enemy') || id === 'target') {
                        const pos = charData.container;
                        if (pos) {
                            targets.push({
                                enemy: { name: id, hp: 100 },
                                x: pos.x,
                                y: pos.y - 50,  // 중심점
                                idx: targets.length,
                                charData
                            });
                        }
                    }
                });
            }
            
            if (targets.length === 0) {
                console.warn('[DDOOAction] playProjectile: 타겟 없음!');
                resolve();
                return;
            }
            
            console.log(`[DDOOAction] 🎯 타겟 ${targets.length}개:`, targets.map(t => `${t.enemy?.name || 'enemy'}(${t.x.toFixed(0)},${t.y.toFixed(0)})`));
            
            // X 좌표로 정렬 (왼쪽→오른쪽)
            targets.sort((a, b) => a.x - b.x);
            
            // 역방향이면 순서 뒤집기 (오른쪽→왼쪽)
            if (reverse) {
                targets.reverse();
            }
            
            // 🎯 플레이어 위치 (screen 좌표)
            let playerX, playerY;
            
            if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                const playerPos = PlayerRenderer.getPlayerPosition();
                if (playerPos) {
                    playerX = playerPos.centerX;
                    playerY = playerPos.centerY;
                }
            }
            
            // test_animation.html용 폴백
            if (!playerX) {
                const playerChar = this.characters.get('player');
                if (playerChar) {
                    playerX = playerChar.container.x;
                    playerY = playerChar.container.y - 50;
                } else {
                    playerX = container?.x || 300;
                    playerY = (container?.y || 400) - 50;
                }
            }
            
            // 🎯 시작점/끝점 계산
            let startX, startY, endX, endY;
            const firstTarget = targets[0];
            const lastTarget = targets[targets.length - 1];
            
            if (reverse) {
                // 🔄 되돌아오기: 화면 오른쪽 끝 → 플레이어 (플레이어에서 사라짐!)
                startX = window.innerWidth + 100;  // 화면 밖 오른쪽에서 시작
                startY = lastTarget.y;
                endX = playerX;  // 플레이어 위치에서 정확히 종료!
                endY = playerY;
            } else {
                // 🚀 던지기: 플레이어 → 화면 밖 (적들 뚫고 나감)
                startX = playerX;
                startY = playerY;
                endX = window.innerWidth + 200;  // 화면 밖으로 나감
                endY = lastTarget.y;
            }
            
            console.log(`[DDOOAction] 🚀 발사: (${startX.toFixed(0)},${startY.toFixed(0)}) → (${endX.toFixed(0)},${endY.toFixed(0)})`);
            
            // 🎯 비행 속도 (픽셀/ms)
            const flySpeed = speed * 0.06;  // 60fps 기준
            
            // 각 타겟까지의 히트 타이밍 계산
            targets.forEach((target) => {
                const dist = Math.sqrt(Math.pow(target.x - startX, 2) + Math.pow(target.y - startY, 2));
                target.hitTime = dist / flySpeed;  // ms
                console.log(`[DDOOAction]   - ${target.enemy?.name || 'enemy'}: dist=${dist.toFixed(0)}, hitTime=${target.hitTime.toFixed(0)}ms`);
            });
            
            // 🎯 DDOOChakram으로 발사체 표시!
            if (typeof DDOOChakram !== 'undefined') {
                console.log('[DDOOAction] 🎮 DDOOChakram.chakram 호출!');
                DDOOChakram.chakram(
                    startX, startY,
                    endX, endY,
                    {
                        color: '#ffd700',
                        glowColor: '#ff8c00',
                        size: 80,  // 크기 증가!
                        speed: speed,
                        spinSpeed: 35,
                        passThrough: !reverse,  // 던지기=관통, 되돌아오기=플레이어에서 멈춤
                        stopAtTarget: reverse   // 되돌아올 때 플레이어에서 정확히 멈춤
                    }
                );
            } else {
                console.warn('[DDOOAction] ⚠️ DDOOChakram 없음!');
            }
            
            // 🎯 각 타겟 순차 타격!
            targets.forEach((target, i) => {
                setTimeout(() => {
                    console.log(`[DDOOAction] 💥 HIT ${i+1}/${targets.length}: ${target.enemy?.name || 'enemy'}`);
                    
                    // 히트 이펙트 (DDOOChakram 사용)
                    if (typeof DDOOChakram !== 'undefined') {
                        DDOOChakram.sparks(target.x, target.y, { color: '#ffd700', count: 12, speed: 15 });
                        DDOOChakram.impact(target.x, target.y, { color: '#ff8c00', size: 60 });
                    }
                    
                    // 스크린쉐이크 (매 타격마다 약하게)
                    this.screenShake(6);
                    
                    // 피격 애니메이션 (인게임)
                    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled && target.enemy) {
                        EnemyRenderer.playHitAnimation(target.enemy, damage);
                    }
                    
                    // 피격 애니메이션 (test_animation.html)
                    if (target.charData) {
                        const cont = target.charData.container;
                        const spr = target.charData.sprite;
                        if (cont && spr && typeof gsap !== 'undefined') {
                            gsap.timeline()
                                .to(cont, { x: cont.x + 15, duration: 0.05 })
                                .to(spr, { tint: 0xff0000, duration: 0.05 }, '<')
                                .to(cont, { x: cont.x, duration: 0.15 })
                                .to(spr, { tint: 0xffffff, duration: 0.15 }, '<');
                        }
                    }
                    
                    // onDamage 콜백
                    if (onHitEach && options.onDamage) {
                        options.onDamage(damage, target.enemy);
                    }
                    
                }, target.hitTime);
            });
            
            // 마지막 타겟 통과 후 완료
            const lastHitTime = Math.max(...targets.map(t => t.hitTime));
            setTimeout(() => {
                resolve();
            }, lastHitTime + 200);
        });
    },
    
    // ==================== 유틸리티 ====================
    // 🔧 DDOOUtils로 위임 (ddoo-utils.js)
    delay(ms) {
        return typeof DDOOUtils !== 'undefined'
            ? DDOOUtils.delay(ms, this.config.speed)
            : new Promise(resolve => setTimeout(resolve, ms / this.config.speed));
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


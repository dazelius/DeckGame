// =====================================================
// DDOO Action Engine v3.3 - 모듈화 버전
// 통합 엔트리 포인트
// =====================================================

const DDOOAction = {
    // ==================== 버전 ====================
    version: '3.3',
    
    // ==================== 모듈 참조 ====================
    vfx: null,        // DDOOVfx
    camera: null,     // DDOOCamera
    character: null,  // DDOOCharacter
    animation: null,  // DDOOAnimation
    
    // ==================== 상태 ====================
    initialized: false,
    pixiApp: null,
    stageContainer: null,
    config: null,
    
    // 레거시 호환용
    animCache: new Map(),
    vfxCache: new Map(),
    characters: new Map(),
    timescale: 1.0,
    
    // ==================== 설정 로드 ====================
    async loadConfig() {
        try {
            const res = await fetch('ddoo-config.json');
            if (res.ok) {
                const json = await res.json();
                this.config = this.parseConfig(json);
                console.log('[DDOOAction] ✅ 설정 파일 로드 완료');
                return this.config;
            }
        } catch (e) {
            console.warn('[DDOOAction] 설정 파일 로드 실패, 기본값 사용');
        }
        
        // 기본 설정
        this.config = this.getDefaultConfig();
        return this.config;
    },
    
    parseConfig(json) {
        // 색상 문자열을 숫자로 변환
        const parseColors = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            
            for (const key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('0x')) {
                    obj[key] = parseInt(obj[key], 16);
                } else if (typeof obj[key] === 'object') {
                    parseColors(obj[key]);
                }
            }
            return obj;
        };
        
        return parseColors(json);
    },
    
    getDefaultConfig() {
        return {
            engine: { speed: 1.0, debug: false },
            features: {
                afterimage: true, vfx: true, shake: true, hitstop: true,
                shadow: true, outline: true, hitFlash: true, breathing: true,
                glow: true, camera: true, colorGrade: true, slowmo: true, filters: false
            },
            performance: { maxParticles: 100, shadowBlur: false },
            return: { duration: 250, ease: 'power2.inOut' },
            character: {
                shadowAlpha: 0.4, shadowScaleY: 0.3, shadowOffsetY: 5,
                breathingAmount: 0.02, breathingSpeed: 1.5
            },
            camera: { defaultZoom: 1.0, minZoom: 0.5, maxZoom: 2.0, zoomSpeed: 0.3 },
            slowmo: { defaultScale: 1.0, minScale: 0.1, maxScale: 2.0 }
        };
    },
    
    // ==================== 초기화 ====================
    async init(pixiApp, stageContainer) {
        if (this.initialized) return this;
        
        this.pixiApp = pixiApp;
        this.stageContainer = stageContainer;
        
        // 설정 로드
        await this.loadConfig();
        
        // 모듈 초기화
        await this.initModules();
        
        // 레거시 호환: 캐시 공유
        this.syncLegacyCaches();
        
        this.initialized = true;
        
        console.log(`[DDOOAction] ✅ 엔진 v${this.version} 초기화 완료 (모듈화)`);
        console.log(`[DDOOAction] 📁 애니메이션: ${this.animCache.size}개`);
        console.log(`[DDOOAction] 💥 VFX: ${this.vfxCache.size}개`);
        
        return this;
    },
    
    async initModules() {
        // VFX 모듈
        if (typeof DDOOVfx !== 'undefined') {
            this.vfx = DDOOVfx.init(this.pixiApp, this.stageContainer, this.config);
        }
        
        // 카메라 모듈
        if (typeof DDOOCamera !== 'undefined') {
            this.camera = DDOOCamera.init(this.pixiApp, this.stageContainer, this.config);
        }
        
        // 캐릭터 모듈
        if (typeof DDOOCharacter !== 'undefined') {
            this.character = DDOOCharacter.init(this.pixiApp, this.stageContainer, this.config);
        }
        
        // 애니메이션 모듈
        if (typeof DDOOAnimation !== 'undefined') {
            this.animation = DDOOAnimation.init(this.config);
            await this.animation.loadAllAnimations();
        }
    },
    
    syncLegacyCaches() {
        // 레거시 호환: animCache, vfxCache, characters 공유
        if (this.animation) {
            this.animCache = this.animation.animCache;
        }
        if (this.vfx) {
            this.vfxCache = this.vfx.vfxCache;
        }
        if (this.character) {
            this.characters = this.character.characters;
        }
    },
    
    // ==================== 레거시 호환 API ====================
    
    // 애니메이션 재생
    async play(animId, options = {}) {
        if (this.animation) {
            return this.animation.play(animId, options);
        }
        console.warn('[DDOOAction] 애니메이션 모듈 없음');
        return null;
    },
    
    // VFX 트리거
    triggerVFX(vfxId, x, y, options = {}) {
        if (this.vfx) {
            this.vfx.trigger(vfxId, x, y, options);
        }
    },
    
    // 카메라 API
    cameraZoom(zoom, duration = 300) {
        if (this.camera) {
            this.camera.zoom(zoom, duration);
        }
    },
    
    cameraFocus(target, duration = 200) {
        if (this.camera) {
            this.camera.focus(target, duration);
        }
    },
    
    screenShake(intensity = 5) {
        if (this.camera) {
            this.camera.shake(intensity);
        }
    },
    
    resetCamera() {
        if (this.camera) {
            this.camera.reset();
        }
    },
    
    resetCameraImmediate() {
        if (this.camera) {
            this.camera.reset(false);
        }
    },
    
    // 슬로우모션 API
    slowmo(scale, duration = 500, ease) {
        if (this.camera) {
            return this.camera.slowmo(scale, duration, ease);
        }
    },
    
    slowmoImpact(scale = 0.2, holdDuration = 100, recoveryDuration = 400) {
        if (this.camera) {
            return this.camera.slowmoImpact(scale, holdDuration, recoveryDuration);
        }
        return Promise.resolve();
    },
    
    resetSlowmo() {
        if (this.camera) {
            this.camera.resetSlowmo();
        }
        this.timescale = 1.0;
    },
    
    resetSlowmoImmediate() {
        if (this.camera) {
            this.camera.resetSlowmo(true);
        }
        this.timescale = 1.0;
    },
    
    // 컬러 그레이딩 API
    applyColorGrade(effect, duration = 150) {
        if (this.camera) {
            this.camera.applyColorGrade(effect, duration);
        }
    },
    
    resetColorGrade() {
        if (this.camera) {
            this.camera.resetColorGrade();
        }
    },
    
    resetColorGradeImmediate() {
        if (this.camera) {
            this.camera.resetColorGrade();
        }
    },
    
    // 캐릭터 API
    createCharacter(id, options = {}) {
        if (this.character) {
            return this.character.create(id, options);
        }
        return null;
    },
    
    removeCharacter(id) {
        if (this.character) {
            this.character.remove(id);
        }
    },
    
    hitFlash(id, color, duration) {
        if (this.character) {
            this.character.hitFlash(id, color, duration);
        }
    },
    
    createAfterimage(id, options) {
        if (this.character) {
            return this.character.createAfterimage(id, options);
        }
    },
    
    // ==================== VFX 고급 API ====================
    
    // 글로우 필터 적용
    applyGlow(sprite, options = {}) {
        if (this.vfx) {
            this.vfx.applyGlow(sprite, options);
        }
    },
    
    // 글로우 필터 제거
    removeGlow(sprite) {
        if (this.vfx) {
            this.vfx.removeGlow(sprite);
        }
    },
    
    // 블룸 필터 적용
    applyBloom(container, options = {}) {
        if (this.vfx) {
            this.vfx.applyBloom(container, options);
        }
    },
    
    // 블룸 필터 제거
    removeBloom(container) {
        if (this.vfx) {
            this.vfx.removeBloom(container);
        }
    },
    
    // 충격파 효과
    triggerShockwave(x, y, options = {}) {
        if (this.vfx) {
            this.vfx.triggerShockwave(x, y, options);
        }
    },
    
    // 타격 효과 (글로우 + 플래시)
    triggerHitEffect(sprite, options = {}) {
        if (this.vfx) {
            this.vfx.triggerHitEffect(sprite, options);
        }
    },
    
    // 복셀 쉐터 효과
    spawnVoxelShatter(sprite, options = {}) {
        if (this.vfx) {
            this.vfx.spawnVoxelShatter(sprite, options);
        }
    },
    
    // 타겟 쉐터 효과
    shatterTarget(target, options = {}) {
        if (this.vfx) {
            this.vfx.shatterTarget(target, options);
        }
    },
    
    // ==================== 유틸리티 ====================
    delay(ms) {
        const speed = this.config?.engine?.speed || 1.0;
        return new Promise(resolve => setTimeout(resolve, ms / speed));
    },
    
    clearAll() {
        if (this.vfx) this.vfx.clearAll();
        if (this.character) this.character.clearAfterimages();
    },
    
    // ==================== 정리 ====================
    destroy() {
        if (this.vfx) this.vfx.destroy();
        if (this.camera) this.camera.destroy();
        if (this.character) this.character.destroy();
        if (this.animation) this.animation.destroy();
        
        this.initialized = false;
        console.log('[DDOOAction] 정리 완료');
    },
    
    // ==================== 디버그 ====================
    getStats() {
        return {
            version: this.version,
            animations: this.animCache.size,
            vfx: this.vfxCache.size,
            characters: this.characters.size,
            particles: this.vfx?.getStats()?.particles || 0
        };
    },
    
    debugCharacters() {
        console.log('[DDOOAction] 캐릭터 목록:');
        this.characters.forEach((data, id) => {
            console.log(`  - ${id}: state=${data.state}, pos=(${data.container?.x?.toFixed(0) || 0}, ${data.container?.y?.toFixed(0) || 0})`);
        });
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOAction = DDOOAction;
}

console.log('[DDOOAction] 🎮 DDOO Action Engine v3.3 로드됨 (모듈화)');

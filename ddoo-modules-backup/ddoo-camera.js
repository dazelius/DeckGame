// =====================================================
// DDOO Camera System - 카메라/슬로우모션/컬러그레이딩
// =====================================================

const DDOOCamera = {
    // ==================== 상태 ====================
    initialized: false,
    pixiApp: null,
    stageContainer: null,
    config: null,
    
    // 📷 카메라 상태
    state: {
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0,
        focusTarget: null,
        pivotSet: false,
        isRootStage: false
    },
    
    // ⏱️ 슬로우모션
    timescale: 1.0,
    slowmoTween: null,
    
    // 🎨 컬러 그레이딩
    colorFilter: null,
    
    // ==================== 초기화 ====================
    init(pixiApp, stageContainer, config = {}) {
        if (this.initialized) return this;
        
        this.pixiApp = pixiApp;
        this.stageContainer = stageContainer;
        this.config = config;
        
        // app.stage 직접 사용 여부 확인
        this.state.isRootStage = (stageContainer === pixiApp?.stage);
        if (this.state.isRootStage) {
            console.log('[DDOOCamera] ⚠️ app.stage 직접 사용 - 카메라 pivot 비활성화');
        }
        
        // 카메라 초기화
        this.resetState();
        
        // 컬러 필터 초기화
        this.initColorFilter();
        
        this.initialized = true;
        console.log('[DDOOCamera] ✅ 카메라 시스템 초기화 완료');
        
        return this;
    },
    
    resetState() {
        const camConfig = this.config.camera || {};
        this.state = {
            zoom: camConfig.defaultZoom || 1.0,
            offsetX: 0,
            offsetY: 0,
            focusTarget: null,
            pivotSet: false,
            isRootStage: this.state.isRootStage
        };
    },
    
    initColorFilter() {
        if (typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
            this.colorFilter = new PIXI.ColorMatrixFilter();
            if (this.stageContainer && !this.stageContainer.filters) {
                this.stageContainer.filters = [];
            }
        }
    },
    
    // ==================== 📷 카메라 ====================
    
    setupPivot() {
        if (!this.stageContainer || !this.pixiApp || this.state.pivotSet) return;
        if (this.state.isRootStage) {
            this.state.pivotSet = true;
            return;
        }
        
        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;
        
        this.stageContainer.pivot.set(centerX, centerY);
        this.stageContainer.position.set(centerX, centerY);
        
        this.state.pivotSet = true;
    },
    
    zoom(level, duration = 300) {
        if (!this.stageContainer) return;
        
        this.setupPivot();
        
        const camConfig = this.config.camera || {};
        const minZoom = camConfig.minZoom || 0.5;
        const maxZoom = camConfig.maxZoom || 2.0;
        const targetZoom = Math.max(minZoom, Math.min(maxZoom, level));
        const dur = duration / 1000 / this.timescale;
        
        if (!this.state.isRootStage && typeof gsap !== 'undefined') {
            gsap.to(this.stageContainer.scale, {
                x: targetZoom,
                y: targetZoom,
                duration: dur,
                ease: 'power2.out'
            });
        }
        
        // Background3D 연동
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            Background3D.autoZoom.targetZ = baseZ / targetZoom;
        }
        
        this.state.zoom = targetZoom;
    },
    
    focus(target, duration = 200) {
        if (!this.stageContainer || this.state.isRootStage) return;
        
        this.setupPivot();
        
        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;
        let focusX = centerX, focusY = centerY;
        
        // 타겟 위치 계산 (DDOOAction.characters 연동)
        if (target === 'player' && typeof DDOOAction !== 'undefined') {
            const playerChar = DDOOAction.characters?.get('player');
            if (playerChar) {
                focusX = centerX + (centerX - playerChar.container.x) * 0.4;
                focusY = centerY + (centerY - playerChar.container.y) * 0.3;
            }
        } else if (target === 'enemy' && typeof DDOOAction !== 'undefined') {
            const enemyChar = DDOOAction.characters?.get('enemy');
            if (enemyChar) {
                focusX = centerX + (centerX - enemyChar.container.x) * 0.4;
                focusY = centerY + (centerY - enemyChar.container.y) * 0.3;
            }
        } else if (target === 'center') {
            focusX = centerX;
            focusY = centerY;
        }
        
        const dur = duration / 1000 / this.timescale;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.stageContainer.position, {
                x: focusX,
                y: focusY,
                duration: dur,
                ease: 'power2.out'
            });
        }
        
        this.state.offsetX = focusX - centerX;
        this.state.offsetY = focusY - centerY;
        this.state.focusTarget = target;
    },
    
    shake(intensity = 5, duration = 150) {
        if (!this.stageContainer) return;
        
        const startTime = performance.now();
        const originalX = this.stageContainer.x;
        const originalY = this.stageContainer.y;
        
        const doShake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.stageContainer.x = originalX;
                this.stageContainer.y = originalY;
                return;
            }
            
            const remaining = 1 - progress;
            this.stageContainer.x = originalX + (Math.random() - 0.5) * intensity * 2 * remaining;
            this.stageContainer.y = originalY + (Math.random() - 0.5) * intensity * 2 * remaining;
            
            requestAnimationFrame(doShake);
        };
        
        doShake();
    },
    
    reset(animated = true) {
        if (!this.stageContainer) return;
        
        const camConfig = this.config.camera || {};
        const dur = (camConfig.zoomSpeed || 0.3) / this.timescale;
        const centerX = this.pixiApp?.screen.width / 2 || 0;
        const centerY = this.pixiApp?.screen.height / 2 || 0;
        const defaultZoom = camConfig.defaultZoom || 1.0;
        
        if (!this.state.isRootStage && typeof gsap !== 'undefined') {
            if (animated) {
                gsap.to(this.stageContainer.scale, {
                    x: defaultZoom,
                    y: defaultZoom,
                    duration: dur,
                    ease: 'power2.out'
                });
                
                if (this.state.pivotSet) {
                    gsap.to(this.stageContainer.position, {
                        x: centerX,
                        y: centerY,
                        duration: dur,
                        ease: 'power2.out'
                    });
                }
            } else {
                gsap.killTweensOf(this.stageContainer.scale);
                gsap.killTweensOf(this.stageContainer.position);
                this.stageContainer.scale.set(defaultZoom);
                if (this.state.pivotSet) {
                    this.stageContainer.position.set(centerX, centerY);
                }
            }
        }
        
        // Background3D 리셋
        if (typeof Background3D !== 'undefined' && Background3D.isInitialized && Background3D.autoZoom) {
            const baseZ = Background3D.cameraDefaults?.posZ || 15;
            Background3D.autoZoom.targetZ = baseZ;
            if (!animated) Background3D.autoZoom.currentZ = baseZ;
        }
        
        this.resetState();
    },
    
    // ==================== ⏱️ 슬로우모션 ====================
    
    slowmo(scale, duration = 500, ease = 'power2.out') {
        const slowConfig = this.config.slowmo || {};
        const minScale = slowConfig.minScale || 0.1;
        const maxScale = slowConfig.maxScale || 2.0;
        const targetScale = Math.max(minScale, Math.min(maxScale, scale));
        
        if (this.slowmoTween) {
            this.slowmoTween.kill();
        }
        
        if (typeof gsap !== 'undefined') {
            this.slowmoTween = gsap.to(this, {
                timescale: targetScale,
                duration: duration / 1000,
                ease: ease,
                onUpdate: () => {
                    gsap.globalTimeline.timeScale(this.timescale);
                }
            });
        }
        
        return this.slowmoTween;
    },
    
    slowmoImpact(scale = 0.2, holdDuration = 100, recoveryDuration = 400) {
        return new Promise(resolve => {
            this.slowmo(scale, 30, 'power4.out');
            
            setTimeout(() => {
                this.slowmo(1.0, recoveryDuration, 'power2.inOut');
                setTimeout(resolve, recoveryDuration);
            }, holdDuration);
        });
    },
    
    resetSlowmo(immediate = false) {
        if (this.slowmoTween) {
            this.slowmoTween.kill();
            this.slowmoTween = null;
        }
        
        this.timescale = 1.0;
        if (typeof gsap !== 'undefined') {
            gsap.globalTimeline.timeScale(1.0);
        }
    },
    
    // ==================== 🎨 컬러 그레이딩 ====================
    
    applyColorGrade(effect, duration = 150) {
        if (!this.stageContainer || !this.colorFilter) return;
        
        // 필터 적용
        if (!this.stageContainer.filters) {
            this.stageContainer.filters = [this.colorFilter];
        } else if (!this.stageContainer.filters.includes(this.colorFilter)) {
            this.stageContainer.filters = [...this.stageContainer.filters, this.colorFilter];
        }
        
        const dur = duration / 1000;
        
        switch (effect) {
            case 'hit':
                this.colorFilter.reset();
                this.colorFilter.saturate(0.3);
                if (typeof gsap !== 'undefined') {
                    gsap.to(this.colorFilter, {
                        saturate: 1,
                        duration: dur,
                        ease: 'power2.out'
                    });
                }
                break;
                
            case 'critical':
                this.colorFilter.reset();
                this.colorFilter.desaturate();
                setTimeout(() => this.colorFilter.reset(), dur * 500);
                break;
                
            case 'power':
                this.colorFilter.reset();
                this.colorFilter.sepia(0.3);
                setTimeout(() => this.colorFilter.reset(), dur * 1000);
                break;
                
            case 'shadow':
                this.colorFilter.reset();
                this.colorFilter.night(0.3);
                break;
                
            case 'heal':
                this.colorFilter.reset();
                this.colorFilter.hue(60);
                setTimeout(() => this.colorFilter.reset(), dur * 1000);
                break;
                
            default:
                this.colorFilter.reset();
        }
    },
    
    resetColorGrade() {
        if (this.colorFilter) {
            this.colorFilter.reset();
        }
    },
    
    // ==================== 통합 리셋 ====================
    resetAll(animated = true) {
        this.reset(animated);
        this.resetSlowmo(!animated);
        this.resetColorGrade();
    },
    
    // ==================== 정리 ====================
    destroy() {
        this.resetAll(false);
        this.initialized = false;
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOCamera = DDOOCamera;
}

console.log('[DDOOCamera] 📷 카메라 모듈 로드됨');

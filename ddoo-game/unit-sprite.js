// =====================================================
// UnitSprite - 유닛 스프라이트 생성 및 애니메이션 관리
// 스케일, 스폰 애니메이션, 숨쉬기 등 스프라이트 관련 로직 통합
// =====================================================

const UnitSprite = {
    // ==================== 설정 ====================
    config: {
        // 스폰 애니메이션 설정
        spawn: {
            offsetX: 200,           // 화면 밖 시작 거리
            offsetY: 50,            // Y축 시작 오프셋
            initialScale: 0.5,      // 시작 스케일 비율
            duration: {
                fadeIn: 0.1,
                stretch: 0.15,
                move: 0.25,
                squash: 0.08,
                bounce: 0.15
            },
            squash: {
                x: 0.9,             // 착지 시 X 스케일
                y: 1.15             // 착지 시 Y 스케일
            },
            stretch: {
                x: 1.1,             // 등장 시 X 스케일
                y: 0.9              // 등장 시 Y 스케일
            }
        },
        
        // 숨쉬기 애니메이션 설정
        breathing: {
            scaleAmount: 0.025,     // Y 스케일 변화량 (2.5%)
            duration: 2.5           // 한 사이클 시간 (초)
        }
    },
    
    // ==================== 스프라이트 생성 ====================
    /**
     * 유닛 스프라이트 생성
     * @param {string} imagePath - 이미지 경로
     * @param {number} scale - 목표 스케일
     * @returns {Promise<PIXI.Container>} 스프라이트 컨테이너
     * 
     * ★ 중요: DDOORenderer.createSprite는 PIXI.Container를 반환!
     * - 내부 스프라이트 스케일: 항상 1 (컨테이너 스케일로만 조절)
     * - 컨테이너.scale: 실제 표시 스케일
     * - 컨테이너.baseScale: 기본 스케일 (복원용)
     */
    async create(imagePath, scale = 1) {
        if (typeof DDOORenderer === 'undefined') {
            console.error('[UnitSprite] DDOORenderer not found!');
            return null;
        }
        
        // ★ 핵심: 내부 스프라이트는 scale: 1로 생성
        // 컨테이너 스케일로만 크기 조절 (이중 스케일 방지)
        const container = await DDOORenderer.createSprite(imagePath, {
            scale: 1,                           // 내부 스프라이트 = 1:1
            outline: { enabled: false },
            shadow: { enabled: false },
            breathing: { enabled: false }       // 수동으로 시작
        });
        
        if (!container) return null;
        
        // 기본 스케일 저장 (복원, 애니메이션에 사용)
        container.baseScale = scale;
        
        // 초기 컨테이너 스케일 설정
        container.scale.set(scale);
        
        return container;
    },
    
    // ==================== 스폰 애니메이션 ====================
    /**
     * 스폰 애니메이션 재생
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     * @param {Object} options - 옵션
     * @param {number} options.targetX - 목표 X 좌표
     * @param {number} options.targetY - 목표 Y 좌표
     * @param {string} options.direction - 'left' 또는 'right' (등장 방향)
     * @param {boolean} options.showEffect - 소환 이펙트 표시 여부
     * @returns {Promise} 애니메이션 완료 Promise
     */
    playSpawnAnimation(container, options = {}) {
        if (!container || typeof gsap === 'undefined') {
            return Promise.resolve();
        }
        
        const {
            targetX = container.x,
            targetY = container.y,
            direction = 'left',
            showEffect = true
        } = options;
        
        const cfg = this.config.spawn;
        const baseScale = container.baseScale || 1;
        
        // 시작 위치 설정
        const spawnOffsetX = direction === 'right' ? cfg.offsetX : -cfg.offsetX;
        container.x = targetX + spawnOffsetX;
        container.y = targetY + cfg.offsetY;
        container.alpha = 0;
        container.scale.set(baseScale * cfg.initialScale);
        container.zIndex = Math.floor(targetY);
        
        return new Promise(resolve => {
            const tl = gsap.timeline({
                onComplete: () => {
                    // 스폰 완료 - 스케일 확정 및 숨쉬기 시작
                    if (container && !container.destroyed) {
                        container.scale.set(baseScale);
                        this.startBreathing(container);
                    }
                    resolve();
                }
            });
            
            // 1. 페이드 인 + 스트레치
            tl.to(container, { alpha: 1, duration: cfg.duration.fadeIn })
              .to(container.scale, {
                  x: baseScale * cfg.stretch.x,
                  y: baseScale * cfg.stretch.y,
                  duration: cfg.duration.stretch
              }, '<');
            
            // 2. 이동
            tl.to(container, {
                x: targetX,
                y: targetY,
                duration: cfg.duration.move,
                ease: 'power2.out'
            }, '<');
            
            // 3. 착지 스쿼시
            tl.to(container.scale, {
                x: baseScale * cfg.squash.x,
                y: baseScale * cfg.squash.y,
                duration: cfg.duration.squash
            });
            
            // 4. 바운스 복귀
            tl.to(container.scale, {
                x: baseScale,
                y: baseScale,
                duration: cfg.duration.bounce,
                ease: 'elastic.out(1, 0.5)'
            });
        }).then(() => {
            // 소환 이펙트
            if (showEffect && typeof CombatEffects !== 'undefined') {
                CombatEffects.summonEffect(targetX, targetY);
                CombatEffects.screenShake(5, 100);
            }
        });
    },
    
    // ==================== 숨쉬기 애니메이션 ====================
    /**
     * 숨쉬기 애니메이션 시작
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     */
    startBreathing(container) {
        if (!container || container.destroyed || typeof gsap === 'undefined') return;
        
        // 기존 숨쉬기 중지
        this.stopBreathing(container);
        
        const baseScale = container.baseScale || container.scale.x || 1;
        const cfg = this.config.breathing;
        
        // 숨쉬기 트윈 생성
        container._breathingTween = gsap.to(container.scale, {
            y: baseScale * (1 + cfg.scaleAmount),
            duration: cfg.duration,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    },
    
    /**
     * 숨쉬기 애니메이션 중지
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     */
    stopBreathing(container) {
        if (!container) return;
        
        if (container._breathingTween) {
            container._breathingTween.kill();
            container._breathingTween = null;
        }
    },
    
    // ==================== 스케일 복원 ====================
    /**
     * 스케일을 기본값으로 복원
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     * @param {boolean} animated - 애니메이션 사용 여부
     */
    restoreScale(container, animated = false) {
        if (!container || container.destroyed) return;
        
        const baseScale = container.baseScale || 1;
        
        if (animated && typeof gsap !== 'undefined') {
            gsap.to(container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.2,
                ease: 'power2.out'
            });
        } else {
            container.scale.set(baseScale);
        }
    },
    
    // ==================== 유틸리티 ====================
    /**
     * 컨테이너의 기본 스케일 가져오기
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     * @returns {number} 기본 스케일
     */
    getBaseScale(container) {
        return container?.baseScale || container?.scale?.x || 1;
    },
    
    /**
     * 스프라이트 스케일 설정 (baseScale 기준)
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     * @param {number} multiplier - 스케일 배율 (1 = 100%)
     */
    setScale(container, multiplier = 1) {
        if (!container || container.destroyed) return;
        
        const baseScale = container.baseScale || 1;
        container.scale.set(baseScale * multiplier);
    },
    
    // ==================== UI 스케일 역보정 ====================
    /**
     * 컨테이너 스케일 역보정 값 가져오기
     * HP 바, 인텐트 등 UI 요소가 컨테이너 스케일 영향 받지 않도록
     * @param {PIXI.Container} container - 스프라이트 컨테이너
     * @returns {number} 역보정 스케일 값
     * 
     * 사용예:
     *   hpBar.scale.set(UnitSprite.getInverseScale(unit.sprite));
     */
    getInverseScale(container) {
        if (!container) return 1;
        const containerScale = container.scale?.x || container.baseScale || 1;
        return containerScale !== 0 ? (1 / containerScale) : 1;
    },
    
    /**
     * UI 요소에 역보정 스케일 적용
     * @param {PIXI.Container} uiElement - HP 바, 인텐트 등 UI 요소
     * @param {PIXI.Container} parentContainer - 부모 스프라이트 컨테이너
     */
    applyInverseScale(uiElement, parentContainer) {
        if (!uiElement || !parentContainer) return;
        const inverseScale = this.getInverseScale(parentContainer);
        uiElement.scale.set(inverseScale);
    }
};

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.UnitSprite = UnitSprite;
}

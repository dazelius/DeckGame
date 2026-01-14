// =====================================================
// VFX Anchor System - VFX 위치 규격화 시스템
// 모든 VFX가 일관된 위치에 생성되도록 함
// =====================================================

const VFXAnchor = {
    game: null,
    app: null,
    
    // ==========================================
    // 앵커 포인트 타입
    // ==========================================
    ANCHOR: {
        CENTER: 'center',       // 스프라이트 중심
        HEAD: 'head',           // 머리 위
        CHEST: 'chest',         // 가슴 높이
        FEET: 'feet',           // 발 아래
        FRONT: 'front',         // 전방 (공격 방향)
        BACK: 'back',           // 후방
        ABOVE: 'above',         // 머리 위 (UI용)
        BELOW: 'below'          // 발 아래 (그림자용)
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef, pixiApp) {
        this.game = gameRef;
        this.app = pixiApp;
        console.log('[VFXAnchor] VFX 위치 규격화 시스템 초기화 완료');
    },
    
    // ==========================================
    // 유닛의 스프라이트 바운드 정보 가져오기
    // ==========================================
    getSpriteBounds(unit) {
        if (!unit) return null;
        
        const sprite = unit.sprite;
        const container = unit.container;
        
        if (!sprite) return null;
        
        // 스프라이트 크기
        const width = sprite.width || 60;
        const height = sprite.height || 80;
        
        // 기본 스케일
        const baseScale = unit.baseScale || sprite.baseScale || 1;
        const currentScaleX = sprite.scale?.x || baseScale;
        const currentScaleY = sprite.scale?.y || baseScale;
        
        // 실제 표시 크기 (스케일 적용)
        const displayWidth = width * Math.abs(currentScaleX);
        const displayHeight = height * Math.abs(currentScaleY);
        
        return {
            width: displayWidth,
            height: displayHeight,
            rawWidth: width,
            rawHeight: height,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            baseScale: baseScale
        };
    },
    
    // ==========================================
    // 유닛의 글로벌 위치 가져오기 (컨테이너 기준)
    // ==========================================
    getGlobalPosition(unit) {
        if (!unit) return { x: 0, y: 0 };
        
        // 우선순위: container > sprite
        const target = unit.container || unit.sprite;
        
        if (!target) return { x: 0, y: 0 };
        
        // PixiJS 글로벌 위치
        if (target.getGlobalPosition) {
            const global = target.getGlobalPosition();
            return { x: global.x, y: global.y };
        }
        
        // 폴백: 로컬 좌표 사용
        return { x: target.x || 0, y: target.y || 0 };
    },
    
    // ==========================================
    // ★ 메인 함수: 유닛의 VFX 앵커 포인트 가져오기
    // ==========================================
    getAnchorPoint(unit, anchorType = 'center', options = {}) {
        if (!unit) {
            console.warn('[VFXAnchor] 유닛이 없습니다.');
            return { x: 0, y: 0 };
        }
        
        const {
            offsetX = 0,        // 추가 X 오프셋
            offsetY = 0,        // 추가 Y 오프셋
            direction = 1       // 방향 (1: 오른쪽, -1: 왼쪽)
        } = options;
        
        // 글로벌 위치 (컨테이너/스프라이트 피벗 기준)
        const globalPos = this.getGlobalPosition(unit);
        const bounds = this.getSpriteBounds(unit);
        
        if (!bounds) {
            return { x: globalPos.x + offsetX, y: globalPos.y + offsetY };
        }
        
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;
        
        // ★ 스프라이트 앵커 보정
        // 대부분의 스프라이트는 anchor가 (0.5, 1) 또는 (0.5, 0.5)
        // container의 y 위치는 보통 스프라이트 발 아래 기준
        const sprite = unit.sprite;
        const anchorY = sprite?.anchor?.y ?? 1; // 기본값: 발 아래
        
        // 스프라이트 실제 중심 Y 보정
        // anchor.y = 1이면 y는 발 위치, 중심은 y - height/2
        // anchor.y = 0.5면 y는 중심 위치
        const centerYOffset = bounds.height * (anchorY - 0.5);
        
        let x = globalPos.x;
        let y = globalPos.y - centerYOffset; // 스프라이트 중심 Y
        
        // 앵커 타입에 따른 위치 계산
        switch (anchorType) {
            case this.ANCHOR.CENTER:
                // 스프라이트 정중앙
                break;
                
            case this.ANCHOR.HEAD:
                // 머리 위 (중심에서 위로 40%)
                y -= bounds.displayHeight * 0.4;
                break;
                
            case this.ANCHOR.CHEST:
                // 가슴 높이 (중심에서 위로 15%)
                y -= bounds.displayHeight * 0.15;
                break;
                
            case this.ANCHOR.FEET:
                // 발 아래 (중심에서 아래로 50%)
                y += bounds.displayHeight * 0.5;
                break;
                
            case this.ANCHOR.FRONT:
                // 전방 (공격 방향)
                x += direction * halfWidth * 0.8;
                break;
                
            case this.ANCHOR.BACK:
                // 후방
                x -= direction * halfWidth * 0.8;
                break;
                
            case this.ANCHOR.ABOVE:
                // 머리 위 (UI용, 더 높이)
                y -= bounds.displayHeight * 0.6;
                break;
                
            case this.ANCHOR.BELOW:
                // 발 아래 (그림자용)
                y += bounds.displayHeight * 0.55;
                break;
                
            default:
                console.warn(`[VFXAnchor] 알 수 없는 앵커 타입: ${anchorType}`);
        }
        
        return {
            x: x + offsetX,
            y: y + offsetY,
            bounds: bounds,
            direction: direction
        };
    },
    
    // ==========================================
    // 편의 함수들
    // ==========================================
    
    // 스프라이트 중심
    getCenter(unit, offsetX = 0, offsetY = 0) {
        return this.getAnchorPoint(unit, this.ANCHOR.CENTER, { offsetX, offsetY });
    },
    
    // 머리 위
    getHead(unit, offsetX = 0, offsetY = 0) {
        return this.getAnchorPoint(unit, this.ANCHOR.HEAD, { offsetX, offsetY });
    },
    
    // 가슴 높이 (공격 이펙트 기본 위치)
    getChest(unit, offsetX = 0, offsetY = 0) {
        return this.getAnchorPoint(unit, this.ANCHOR.CHEST, { offsetX, offsetY });
    },
    
    // 발 위치
    getFeet(unit, offsetX = 0, offsetY = 0) {
        return this.getAnchorPoint(unit, this.ANCHOR.FEET, { offsetX, offsetY });
    },
    
    // 전방 (공격 방향)
    getFront(unit, direction = 1, offsetX = 0, offsetY = 0) {
        return this.getAnchorPoint(unit, this.ANCHOR.FRONT, { offsetX, offsetY, direction });
    },
    
    // ==========================================
    // 두 유닛 사이의 중간점
    // ==========================================
    getMidpoint(unit1, unit2, anchorType = 'chest') {
        const pos1 = this.getAnchorPoint(unit1, anchorType);
        const pos2 = this.getAnchorPoint(unit2, anchorType);
        
        return {
            x: (pos1.x + pos2.x) / 2,
            y: (pos1.y + pos2.y) / 2
        };
    },
    
    // ==========================================
    // VFX 컨테이너를 유닛에 어태치 (매 프레임 추적)
    // ==========================================
    attachToUnit(vfxContainer, unit, anchorType = 'center', options = {}) {
        if (!vfxContainer || !unit) return null;
        
        const {
            offsetX = 0,
            offsetY = 0,
            direction = 1,
            followRotation = false
        } = options;
        
        // 초기 위치 설정
        const pos = this.getAnchorPoint(unit, anchorType, { offsetX, offsetY, direction });
        vfxContainer.x = pos.x;
        vfxContainer.y = pos.y;
        
        // 추적 함수
        const updateFunc = () => {
            if (!vfxContainer || vfxContainer.destroyed) {
                if (this.app) this.app.ticker.remove(updateFunc);
                return;
            }
            
            if (!unit || !unit.sprite || unit.sprite.destroyed) {
                if (this.app) this.app.ticker.remove(updateFunc);
                return;
            }
            
            const newPos = this.getAnchorPoint(unit, anchorType, { offsetX, offsetY, direction });
            vfxContainer.x = newPos.x;
            vfxContainer.y = newPos.y;
            
            if (followRotation && unit.sprite.rotation !== undefined) {
                vfxContainer.rotation = unit.sprite.rotation;
            }
        };
        
        if (this.app) {
            this.app.ticker.add(updateFunc);
        }
        
        // 정리 함수 반환
        return {
            stop: () => {
                if (this.app) this.app.ticker.remove(updateFunc);
            },
            updateFunc: updateFunc
        };
    },
    
    // ==========================================
    // 디버그: 앵커 포인트 시각화
    // ==========================================
    debugShowAnchors(unit, duration = 2000) {
        if (!unit || !this.app) return;
        
        const container = new PIXI.Container();
        container.zIndex = 9999;
        
        const anchors = [
            { type: this.ANCHOR.CENTER, color: 0xffffff, label: 'CENTER' },
            { type: this.ANCHOR.HEAD, color: 0xff0000, label: 'HEAD' },
            { type: this.ANCHOR.CHEST, color: 0x00ff00, label: 'CHEST' },
            { type: this.ANCHOR.FEET, color: 0x0000ff, label: 'FEET' },
            { type: this.ANCHOR.ABOVE, color: 0xffff00, label: 'ABOVE' }
        ];
        
        anchors.forEach(anchor => {
            const pos = this.getAnchorPoint(unit, anchor.type);
            
            // 점
            const dot = new PIXI.Graphics();
            dot.circle(pos.x, pos.y, 5);
            dot.fill({ color: anchor.color, alpha: 1 });
            container.addChild(dot);
            
            // 라벨
            const text = new PIXI.Text({
                text: anchor.label,
                style: {
                    fontSize: 10,
                    fill: anchor.color
                }
            });
            text.x = pos.x + 8;
            text.y = pos.y - 5;
            container.addChild(text);
        });
        
        // 바운딩 박스
        const pos = this.getAnchorPoint(unit, this.ANCHOR.CENTER);
        const bounds = pos.bounds;
        if (bounds) {
            const box = new PIXI.Graphics();
            box.rect(
                pos.x - bounds.width / 2,
                pos.y - bounds.height / 2,
                bounds.width,
                bounds.height
            );
            box.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
            container.addChild(box);
        }
        
        this.app.stage.addChild(container);
        
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, duration);
        
        return container;
    }
};

console.log('[VFXAnchor] VFX 위치 규격화 시스템 로드 완료');

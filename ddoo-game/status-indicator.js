// =====================================================
// Status Indicator System - 상태이상 인디케이터 시스템
// =====================================================
// HP 바 근처에 상태이상 아이콘/스택 표시
// =====================================================

const StatusIndicator = {
    game: null,
    indicators: new Map(), // unit -> container
    
    // ==========================================
    // 설정
    // ==========================================
    config: {
        iconSize: 20,
        spacing: 4,
        offsetY: 25,        // HP 바 아래 오프셋
        fontSize: 12,
        
        // 상태이상 정의
        statuses: {
            bleed: {
                icon: '🩸',
                color: 0xcc0000,
                bgColor: 0x440000
            },
            poison: {
                icon: '🧪',
                color: 0x44ff00,
                bgColor: 0x003300
            },
            burn: {
                icon: '🔥',
                color: 0xff6600,
                bgColor: 0x441100
            },
            vulnerable: {
                icon: '💔',
                color: 0xff4488,
                bgColor: 0x440022
            },
            weak: {
                icon: '⬇️',
                color: 0x8888ff,
                bgColor: 0x222244
            },
            strength: {
                icon: '💪',
                color: 0xff4444,
                bgColor: 0x442222
            }
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        this.indicators = new Map();
        console.log('[StatusIndicator] 상태 인디케이터 시스템 초기화 완료');
    },
    
    // ==========================================
    // 유닛의 인디케이터 업데이트
    // ==========================================
    updateUnit(unit) {
        if (!unit || !this.game?.app) return;
        
        // 기존 인디케이터 정리
        this.removeIndicator(unit);
        
        // 상태이상 수집
        const statuses = this.collectStatuses(unit);
        if (statuses.length === 0) return;
        
        // 새 인디케이터 생성
        this.createIndicator(unit, statuses);
    },
    
    // ==========================================
    // 유닛의 상태이상 수집
    // ==========================================
    collectStatuses(unit) {
        const statuses = [];
        
        // 출혈
        if (unit.bleed && unit.bleed > 0) {
            statuses.push({ type: 'bleed', stacks: unit.bleed });
        }
        
        // 독
        if (unit.poison && unit.poison > 0) {
            statuses.push({ type: 'poison', stacks: unit.poison });
        }
        
        // 화상
        if (unit.burn && unit.burn > 0) {
            statuses.push({ type: 'burn', stacks: unit.burn });
        }
        
        // 취약
        if (unit.vulnerable && unit.vulnerable > 0) {
            statuses.push({ type: 'vulnerable', stacks: unit.vulnerable });
        }
        
        // 약화
        if (unit.weak && unit.weak > 0) {
            statuses.push({ type: 'weak', stacks: unit.weak });
        }
        
        // 힘
        if (unit.strength && unit.strength > 0) {
            statuses.push({ type: 'strength', stacks: unit.strength });
        }
        
        return statuses;
    },
    
    // ==========================================
    // 인디케이터 컨테이너 생성
    // ==========================================
    createIndicator(unit, statuses) {
        const container = new PIXI.Container();
        container.zIndex = 600;
        
        const { iconSize, spacing, fontSize } = this.config;
        const totalWidth = statuses.length * (iconSize + spacing) - spacing;
        let xOffset = -totalWidth / 2;
        
        for (const status of statuses) {
            const statusDef = this.config.statuses[status.type];
            if (!statusDef) continue;
            
            // 아이콘 배경
            const bg = new PIXI.Graphics();
            bg.roundRect(-iconSize/2, -iconSize/2, iconSize, iconSize, 4);
            bg.fill({ color: statusDef.bgColor, alpha: 0.9 });
            bg.stroke({ width: 1, color: statusDef.color, alpha: 0.8 });
            bg.x = xOffset + iconSize/2;
            container.addChild(bg);
            
            // 아이콘 텍스트
            const icon = new PIXI.Text({
                text: statusDef.icon,
                style: {
                    fontSize: iconSize - 4,
                    fontFamily: 'Arial'
                }
            });
            icon.anchor.set(0.5);
            icon.x = xOffset + iconSize/2;
            icon.y = -2;
            container.addChild(icon);
            
            // 스택 수 (1 이상일 때만)
            if (status.stacks > 1) {
                const stackText = new PIXI.Text({
                    text: `${status.stacks}`,
                    style: {
                        fontSize: fontSize,
                        fontFamily: 'Arial Black, sans-serif',
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        stroke: { color: '#000000', width: 2 }
                    }
                });
                stackText.anchor.set(0.5);
                stackText.x = xOffset + iconSize/2 + 6;
                stackText.y = iconSize/2 - 4;
                container.addChild(stackText);
            }
            
            xOffset += iconSize + spacing;
        }
        
        // 위치 설정 (HP 바 아래)
        this.updateIndicatorPosition(unit, container);
        
        // 컨테이너에 추가
        if (unit.container) {
            unit.container.addChild(container);
        } else if (this.game.containers?.effects) {
            this.game.containers.effects.addChild(container);
        } else {
            this.game.app.stage.addChild(container);
        }
        
        // 저장
        this.indicators.set(unit, container);
        
        // 등장 애니메이션
        container.alpha = 0;
        container.scale.set(0.5);
        gsap.to(container, { alpha: 1, duration: 0.2 });
        gsap.to(container.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(1.5)' });
    },
    
    // ==========================================
    // 인디케이터 위치 업데이트
    // ==========================================
    updateIndicatorPosition(unit, container) {
        if (!container || container.destroyed) return;
        
        // HP 바 위치 기준으로 아래에 배치
        if (unit.container) {
            // 유닛 컨테이너의 자식이면 로컬 좌표
            container.x = 0;
            container.y = this.config.offsetY + 15; // HP바 아래
        } else {
            // 글로벌 좌표
            const pos = this.getUnitPosition(unit);
            if (pos) {
                container.x = pos.x;
                container.y = pos.y + this.config.offsetY + 15;
            }
        }
    },
    
    // ==========================================
    // 인디케이터 제거
    // ==========================================
    removeIndicator(unit) {
        const container = this.indicators.get(unit);
        if (container && !container.destroyed) {
            gsap.killTweensOf(container);
            gsap.killTweensOf(container.scale);
            container.destroy({ children: true });
        }
        this.indicators.delete(unit);
    },
    
    // ==========================================
    // 모든 인디케이터 업데이트
    // ==========================================
    updateAll() {
        if (!this.game) return;
        
        // 적 유닛
        for (const enemy of this.game.state.enemyUnits || []) {
            this.updateUnit(enemy);
        }
        
        // 아군 유닛
        for (const ally of this.game.state.allyUnits || []) {
            this.updateUnit(ally);
        }
        
        // 히어로
        if (this.game.state.hero) {
            this.updateUnit(this.game.state.hero);
        }
    },
    
    // ==========================================
    // 유닛 정리 (사망 시)
    // ==========================================
    cleanupUnit(unit) {
        this.removeIndicator(unit);
    },
    
    // ==========================================
    // 전체 정리
    // ==========================================
    cleanup() {
        for (const [unit, container] of this.indicators) {
            if (container && !container.destroyed) {
                gsap.killTweensOf(container);
                gsap.killTweensOf(container.scale);
                container.destroy({ children: true });
            }
        }
        this.indicators.clear();
    },
    
    // ==========================================
    // 헬퍼: 유닛 위치 가져오기
    // ==========================================
    getUnitPosition(unit) {
        const target = unit?.container || unit?.sprite;
        return target ? { x: target.x, y: target.y } : null;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.StatusIndicator = StatusIndicator;
}

console.log('[StatusIndicator] 상태 인디케이터 시스템 로드 완료');

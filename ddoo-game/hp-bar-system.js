// ============================================================
// HP Bar System - 유닛 HP 바 및 쉴드 UI 관리
// ============================================================

const HPBarSystem = {
    // ==========================================
    // 설정
    // ==========================================
    config: {
        bar: {
            width: 80,
            height: 12,
            padding: 4,
            yOffset: 8,         // 스프라이트 아래 오프셋
            zIndex: 50
        },
        colors: {
            enemy: {
                hp: 0xe63333,       // 선명한 빨강
                bright: 0xff6666,
                dark: 0x330000
            },
            hero: {
                hp: 0xf0c020,       // 밝은 금색
                bright: 0xffdd55,
                dark: 0x332200
            },
            ally: {
                hp: 0x44cc44,       // 밝은 초록
                bright: 0x66ff66,
                dark: 0x003300
            },
            delayed: 0xffeeaa,      // 잔상 색상 (노란색)
            shield: {
                fill: 0x2266cc,
                stroke: 0x88ccff,
                glow: 0x3388ff,
                frame: 0x66aaff
            },
            frame: {
                normal: 0x444444,
                withShield: 0x4488cc
            }
        },
        animation: {
            drainDuration: 0.6,     // HP 잔상 애니메이션 시간
            drainEase: 'power2.out'
        },
        text: {
            hpFontSize: 13,
            shieldFontSize: 12,
            strokeWidth: 4
        }
    },

    // ==========================================
    // 유닛 HP 바 생성
    // ==========================================
    create(unit) {
        const parent = unit.container || unit.sprite;
        if (!parent) return null;
        
        // 기존 HP 바 제거
        this.destroy(unit);
        
        const cfg = this.config;
        const { width, height, padding } = cfg.bar;
        
        // 색상 결정
        const colorSet = this.getColorSet(unit);
        
        // HP 바 컨테이너
        const hpBar = new PIXI.Container();
        
        // ========================================
        // 레이어 구조 (아래에서 위로)
        // ========================================
        
        // 1. 쉴드 프레임 (HP 바를 감싸는 보호막)
        const shieldFrame = new PIXI.Graphics();
        shieldFrame.visible = false;
        hpBar.addChild(shieldFrame);
        
        // 2. 배경 프레임
        const frame = new PIXI.Graphics()
            .rect(-width/2 - padding, -padding, width + padding*2, height + padding*2)
            .fill(0x000000)
            .stroke({ width: 3, color: cfg.colors.frame.normal });
        hpBar.addChild(frame);
        
        // 3. HP 배경 (빈 부분)
        const bgFill = new PIXI.Graphics()
            .rect(-width/2, 0, width, height)
            .fill(colorSet.dark);
        hpBar.addChild(bgFill);
        
        // 4. 지연 HP 게이지 (잔상)
        const delayedFill = new PIXI.Graphics();
        hpBar.addChild(delayedFill);
        
        // 5. HP 게이지 (실제 HP)
        const hpFill = new PIXI.Graphics();
        hpBar.addChild(hpFill);
        
        // 6. HP 하이라이트
        const highlight = new PIXI.Graphics();
        hpBar.addChild(highlight);
        
        // 7. HP 텍스트
        const hpText = new PIXI.Text({
            text: `${unit.hp}`,
            style: {
                fontSize: cfg.text.hpFontSize,
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: { color: '#000000', width: cfg.text.strokeWidth }
            }
        });
        hpText.anchor.set(0.5);
        hpText.y = height / 2;
        hpBar.addChild(hpText);
        
        // 8. 쉴드 배지
        const shieldBadge = this.createShieldBadge(width, height);
        hpBar.addChild(shieldBadge.container);
        
        // 유닛에 참조 저장
        unit.hpBarData = {
            container: hpBar,
            frame,
            bgFill,
            delayedFill,
            hpFill,
            highlight,
            hpText,
            shieldFrame,
            shieldBadge,
            // 설정값
            width,
            height,
            padding,
            colors: colorSet,
            // 상태
            displayedHp: unit.hp,
            hpTween: null,
            shieldPulse: false
        };
        
        // 위치 및 부모 설정
        hpBar.y = cfg.bar.yOffset;
        hpBar.zIndex = cfg.bar.zIndex;
        
        if (unit.container) {
            unit.container.sortableChildren = true;
            unit.container.addChild(hpBar);
        } else {
            const containerScale = unit.sprite.scale?.x || unit.baseScale || 1;
            if (containerScale !== 0) {
                hpBar.scale.set(1 / containerScale);
            }
            unit.sprite.sortableChildren = true;
            unit.sprite.addChild(hpBar);
        }
        
        // 레거시 호환성
        unit.hpBar = hpBar;
        unit.hpFill = hpFill;
        unit.hpText = hpText;
        unit.shieldFrame = shieldFrame;
        unit.shieldBadge = shieldBadge.container;
        unit.shieldIcon = shieldBadge.icon;
        unit.shieldText = shieldBadge.text;
        unit.hpHighlight = highlight;
        unit.hpDelayedFill = delayedFill;
        unit.hpFrame = frame;
        unit.displayedHp = unit.hp;
        
        // 레거시 값들
        unit.hpBarWidth = width;
        unit.hpBarHeight = height;
        unit.hpBarPadding = padding;
        unit.hpColor = colorSet.hp;
        unit.hpColorBright = colorSet.bright;
        unit.hpColorDark = colorSet.dark;
        
        // 초기 업데이트
        this.update(unit);
        
        return hpBar;
    },

    // ==========================================
    // 쉴드 배지 생성
    // ==========================================
    createShieldBadge(barWidth, barHeight) {
        const cfg = this.config;
        const container = new PIXI.Container();
        container.visible = false;
        container.x = barWidth / 2 + 12;
        container.y = barHeight / 2;
        
        // 아이콘 배경
        const icon = new PIXI.Graphics()
            .circle(0, 0, 13)
            .fill(cfg.colors.shield.fill)
            .stroke({ width: 3, color: cfg.colors.shield.stroke });
        container.addChild(icon);
        
        // 숫자
        const text = new PIXI.Text({
            text: '0',
            style: {
                fontSize: cfg.text.shieldFontSize,
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: { color: '#000000', width: 3 }
            }
        });
        text.anchor.set(0.5);
        container.addChild(text);
        
        return { container, icon, text };
    },

    // ==========================================
    // 색상 세트 가져오기
    // ==========================================
    getColorSet(unit) {
        const colors = this.config.colors;
        if (unit.isHero) {
            return { hp: colors.hero.hp, bright: colors.hero.bright, dark: colors.hero.dark };
        } else if (unit.team === 'player') {
            return { hp: colors.ally.hp, bright: colors.ally.bright, dark: colors.ally.dark };
        }
        return { hp: colors.enemy.hp, bright: colors.enemy.bright, dark: colors.enemy.dark };
    },

    // ==========================================
    // HP 바 업데이트 (잔상 애니메이션 포함)
    // ==========================================
    update(unit) {
        const data = unit.hpBarData;
        if (!data) return;
        
        const { width, height, padding, colors } = data;
        const cfg = this.config;
        const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
        const shield = unit.block || 0;
        
        // ========================================
        // 1. 지연 HP 잔상 (쭈욱 빠지는 효과)
        // ========================================
        this.updateDelayedHP(unit, data, hpRatio);
        
        // ========================================
        // 2. HP 게이지 (실제 HP - 즉시 반영)
        // ========================================
        data.hpFill.clear();
        if (hpRatio > 0) {
            data.hpFill
                .rect(-width/2, 0, width * hpRatio, height)
                .fill(colors.hp);
        }
        
        // ========================================
        // 3. HP 하이라이트 (상단 빛 효과)
        // ========================================
        data.highlight.clear();
        if (hpRatio > 0) {
            data.highlight
                .rect(-width/2, 1, width * hpRatio, 3)
                .fill({ color: colors.bright, alpha: 0.5 });
        }
        
        // ========================================
        // 4. 쉴드 프레임
        // ========================================
        this.updateShieldFrame(data, shield, width, height, padding);
        
        // ========================================
        // 5. 프레임 색상
        // ========================================
        data.frame.clear();
        const frameColor = shield > 0 ? cfg.colors.frame.withShield : cfg.colors.frame.normal;
        data.frame
            .rect(-width/2 - padding, -padding, width + padding*2, height + padding*2)
            .fill(0x000000)
            .stroke({ width: 3, color: frameColor });
        
        // ========================================
        // 6. 쉴드 배지
        // ========================================
        this.updateShieldBadge(unit, data, shield);
        
        // ========================================
        // 7. HP 텍스트
        // ========================================
        if (data.hpText) {
            data.hpText.text = `${unit.hp}`;
        }
    },

    // ==========================================
    // 지연 HP 업데이트 (잔상 애니메이션)
    // ==========================================
    updateDelayedHP(unit, data, hpRatio) {
        const { width, height, delayedFill } = data;
        const cfg = this.config;
        const previousDisplayedHp = data.displayedHp ?? unit.hp;
        const delayedRatio = Math.max(0, Math.min(1, previousDisplayedHp / unit.maxHp));
        
        // 잔상 그리기
        delayedFill.clear();
        if (delayedRatio > hpRatio) {
            delayedFill
                .rect(-width/2 + width * hpRatio, 0, 
                      width * (delayedRatio - hpRatio), height)
                .fill(cfg.colors.delayed);
        }
        
        // gsap 애니메이션
        if (previousDisplayedHp > unit.hp && typeof gsap !== 'undefined') {
            // 기존 애니메이션 취소
            if (data.hpTween) {
                data.hpTween.kill();
            }
            
            // 잔상이 천천히 따라오는 애니메이션
            data.hpTween = gsap.to(data, {
                displayedHp: unit.hp,
                duration: cfg.animation.drainDuration,
                ease: cfg.animation.drainEase,
                onUpdate: () => {
                    const currentDelayedRatio = Math.max(0, Math.min(1, data.displayedHp / unit.maxHp));
                    delayedFill.clear();
                    if (currentDelayedRatio > hpRatio) {
                        delayedFill
                            .rect(-width/2 + width * hpRatio, 0,
                                  width * (currentDelayedRatio - hpRatio), height)
                            .fill(cfg.colors.delayed);
                    }
                }
            });
            
            // 레거시 동기화
            unit.displayedHp = data.displayedHp;
            unit.hpTween = data.hpTween;
        } else if (previousDisplayedHp < unit.hp) {
            // HP 회복 시 즉시 반영
            data.displayedHp = unit.hp;
            unit.displayedHp = unit.hp;
        }
    },

    // ==========================================
    // 쉴드 프레임 업데이트
    // ==========================================
    updateShieldFrame(data, shield, width, height, padding) {
        const cfg = this.config;
        data.shieldFrame.clear();
        
        if (shield > 0) {
            data.shieldFrame.visible = true;
            const p = padding + 2;
            // 외곽 글로우
            data.shieldFrame
                .rect(-width/2 - p - 2, -p - 2, width + (p+2)*2, height + (p+2)*2)
                .fill({ color: cfg.colors.shield.glow, alpha: 0.3 });
            // 보호막 테두리
            data.shieldFrame
                .rect(-width/2 - p, -p, width + p*2, height + p*2)
                .stroke({ width: 3, color: cfg.colors.shield.frame });
        } else {
            data.shieldFrame.visible = false;
        }
    },

    // ==========================================
    // 쉴드 배지 업데이트
    // ==========================================
    updateShieldBadge(unit, data, shield) {
        const badge = data.shieldBadge;
        
        if (shield > 0) {
            badge.container.visible = true;
            badge.text.text = `${shield}`;
            
            // 펄스 애니메이션
            if (!data.shieldPulse && typeof gsap !== 'undefined') {
                data.shieldPulse = true;
                gsap.to(badge.icon, {
                    alpha: 0.7,
                    duration: 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
            }
        } else {
            badge.container.visible = false;
            if (data.shieldPulse && typeof gsap !== 'undefined') {
                gsap.killTweensOf(badge.icon);
                badge.icon.alpha = 1;
                data.shieldPulse = false;
            }
        }
        
        // 레거시 동기화
        unit.shieldPulse = data.shieldPulse;
    },

    // ==========================================
    // HP 바 제거
    // ==========================================
    destroy(unit) {
        if (unit.hpBarData) {
            // 애니메이션 정리
            if (unit.hpBarData.hpTween) {
                unit.hpBarData.hpTween.kill();
            }
            if (unit.hpBarData.shieldPulse && unit.hpBarData.shieldBadge?.icon) {
                gsap.killTweensOf(unit.hpBarData.shieldBadge.icon);
            }
            // 컨테이너 제거
            if (unit.hpBarData.container) {
                unit.hpBarData.container.destroy();
            }
            unit.hpBarData = null;
        }
        
        // 레거시 정리
        if (unit.hpBar) {
            unit.hpBar.destroy();
            unit.hpBar = null;
        }
    },

    // ==========================================
    // 모든 유닛 HP 바 렌더링
    // ==========================================
    renderAll(playerUnits, enemyUnits) {
        [...playerUnits, ...enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.create(unit);
            }
        });
    },

    // ==========================================
    // 모든 유닛 HP 바 업데이트
    // ==========================================
    updateAll(playerUnits, enemyUnits) {
        [...playerUnits, ...enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.update(unit);
            } else if (unit.hpBar) {
                this.destroy(unit);
            }
        });
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.HPBarSystem = HPBarSystem;
}

// =====================================================
// Intent Tooltip System - 인텐트 툴팁 시스템
// 브레이크 스킬 등 상세 정보를 마우스 호버 시 표시
// =====================================================

const IntentTooltip = {
    app: null,
    container: null,
    currentTooltip: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app) {
        this.app = app;
        
        // 툴팁 컨테이너 (최상위 레이어)
        this.container = new PIXI.Container();
        this.container.zIndex = 9999;
        this.container.sortableChildren = true;
        app.stage.addChild(this.container);
        
        console.log('[IntentTooltip] 툴팁 시스템 초기화 완료');
    },
    
    // ==========================================
    // 툴팁 표시
    // ==========================================
    show(x, y, data) {
        this.hide(); // 기존 툴팁 제거
        
        if (!this.container || !data) return;
        
        const tooltip = new PIXI.Container();
        tooltip.zIndex = 9999;
        
        // ========================================
        // 컨텐츠 구성
        // ========================================
        const padding = 12;
        const maxWidth = 220;
        let contentHeight = 0;
        const contents = [];
        
        // 스킬명 (타이틀)
        if (data.name) {
            const titleStyle = new PIXI.TextStyle({
                fontFamily: 'MaplestoryOTFBold, Arial',
                fontSize: 15,
                fill: data.titleColor || '#ffcc44',
                fontWeight: 'bold'
            });
            const title = new PIXI.Text({ text: data.name, style: titleStyle });
            title.y = contentHeight;
            contents.push(title);
            contentHeight += title.height + 8;
        }
        
        // 타입 태그
        if (data.type) {
            const typeColors = {
                attack: '#ff6b6b',
                defend: '#4dabf7',
                buff: '#ffd43b',
                debuff: '#da77f2',
                summon: '#69db7c'
            };
            const typeNames = {
                attack: '공격',
                defend: '방어',
                buff: '버프',
                debuff: '디버프',
                summon: '소환'
            };
            
            const tagStyle = new PIXI.TextStyle({
                fontFamily: 'MaplestoryOTFLight, Arial',
                fontSize: 11,
                fill: typeColors[data.type] || '#888888'
            });
            const tag = new PIXI.Text({ text: `[${typeNames[data.type] || data.type}]`, style: tagStyle });
            tag.y = contentHeight;
            contents.push(tag);
            contentHeight += tag.height + 6;
        }
        
        // 구분선
        const divider = new PIXI.Graphics();
        divider.rect(0, contentHeight, maxWidth - padding * 2, 1);
        divider.fill({ color: 0x555555, alpha: 0.5 });
        contents.push(divider);
        contentHeight += 8;
        
        // 설명 텍스트
        if (data.description) {
            const descStyle = new PIXI.TextStyle({
                fontFamily: 'MaplestoryOTFLight, Arial',
                fontSize: 12,
                fill: '#cccccc',
                wordWrap: true,
                wordWrapWidth: maxWidth - padding * 2,
                lineHeight: 18
            });
            const desc = new PIXI.Text({ text: data.description, style: descStyle });
            desc.y = contentHeight;
            contents.push(desc);
            contentHeight += desc.height + 6;
        }
        
        // 스탯 정보 (데미지, 블록 등)
        if (data.stats && data.stats.length > 0) {
            for (const stat of data.stats) {
                const statStyle = new PIXI.TextStyle({
                    fontFamily: 'MaplestoryOTFLight, Arial',
                    fontSize: 12,
                    fill: stat.color || '#aaaaaa'
                });
                const statText = new PIXI.Text({ text: `• ${stat.label}: ${stat.value}`, style: statStyle });
                statText.y = contentHeight;
                contents.push(statText);
                contentHeight += statText.height + 4;
            }
        }
        
        // 브레이크 정보
        if (data.breakInfo) {
            contentHeight += 4;
            const breakStyle = new PIXI.TextStyle({
                fontFamily: 'MaplestoryOTFBold, Arial',
                fontSize: 12,
                fill: '#ff6b6b'
            });
            const breakText = new PIXI.Text({ 
                text: `⚠ ${data.breakInfo}`, 
                style: breakStyle 
            });
            breakText.y = contentHeight;
            contents.push(breakText);
            contentHeight += breakText.height + 4;
        }
        
        // ========================================
        // 배경 그리기
        // ========================================
        const bgWidth = maxWidth;
        const bgHeight = contentHeight + padding * 2;
        
        const bg = new PIXI.Graphics();
        
        // 그림자
        bg.roundRect(3, 3, bgWidth, bgHeight, 8);
        bg.fill({ color: 0x000000, alpha: 0.4 });
        
        // 메인 배경
        bg.roundRect(0, 0, bgWidth, bgHeight, 8);
        bg.fill({ color: 0x1a1a2e, alpha: 0.98 });
        bg.stroke({ color: 0x4a4a6a, width: 1.5 });
        
        // 상단 하이라이트
        bg.roundRect(1, 1, bgWidth - 2, 3, 2);
        bg.fill({ color: data.titleColor ? parseInt(data.titleColor.replace('#', '0x')) : 0xffcc44, alpha: 0.3 });
        
        tooltip.addChild(bg);
        
        // 컨텐츠 추가
        for (const content of contents) {
            content.x = padding;
            content.y += padding;
            tooltip.addChild(content);
        }
        
        // ========================================
        // 위치 설정 (화면 밖으로 나가지 않도록)
        // ========================================
        let tooltipX = x + 15;
        let tooltipY = y - bgHeight / 2;
        
        // 화면 경계 체크
        if (this.app) {
            const screenWidth = this.app.screen.width;
            const screenHeight = this.app.screen.height;
            
            if (tooltipX + bgWidth > screenWidth - 10) {
                tooltipX = x - bgWidth - 15;
            }
            if (tooltipY < 10) {
                tooltipY = 10;
            }
            if (tooltipY + bgHeight > screenHeight - 10) {
                tooltipY = screenHeight - bgHeight - 10;
            }
        }
        
        tooltip.x = tooltipX;
        tooltip.y = tooltipY;
        
        // 등장 애니메이션
        tooltip.alpha = 0;
        tooltip.scale.set(0.9);
        
        this.container.addChild(tooltip);
        this.currentTooltip = tooltip;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(tooltip, {
                alpha: 1,
                duration: 0.15,
                ease: 'power2.out'
            });
            gsap.to(tooltip.scale, {
                x: 1,
                y: 1,
                duration: 0.15,
                ease: 'back.out(1.5)'
            });
        } else {
            tooltip.alpha = 1;
            tooltip.scale.set(1);
        }
    },
    
    // ==========================================
    // 툴팁 숨기기
    // ==========================================
    hide() {
        if (this.currentTooltip) {
            const tooltip = this.currentTooltip;
            this.currentTooltip = null;
            
            if (typeof gsap !== 'undefined') {
                gsap.to(tooltip, {
                    alpha: 0,
                    duration: 0.1,
                    onComplete: () => {
                        if (tooltip.parent) tooltip.parent.removeChild(tooltip);
                        tooltip.destroy();
                    }
                });
            } else {
                if (tooltip.parent) tooltip.parent.removeChild(tooltip);
                tooltip.destroy();
            }
        }
    },
    
    // ==========================================
    // 인텐트에 툴팁 연결
    // ==========================================
    attachToIntent(intentContainer, enemy, intent) {
        if (!intentContainer || !intent) return;
        
        // 마우스 이벤트 활성화
        intentContainer.eventMode = 'static';
        intentContainer.cursor = 'pointer';
        
        // 툴팁 데이터 생성
        const tooltipData = this.createIntentTooltipData(enemy, intent);
        
        // 호버 이벤트
        intentContainer.on('pointerover', (e) => {
            const globalPos = e.global || intentContainer.getGlobalPosition();
            this.show(globalPos.x, globalPos.y, tooltipData);
        });
        
        intentContainer.on('pointerout', () => {
            this.hide();
        });
        
        // 터치 디바이스용
        intentContainer.on('pointertap', (e) => {
            if (this.currentTooltip) {
                this.hide();
            } else {
                const globalPos = e.global || intentContainer.getGlobalPosition();
                this.show(globalPos.x, globalPos.y, tooltipData);
            }
        });
    },
    
    // ==========================================
    // 인텐트 툴팁 데이터 생성
    // ==========================================
    createIntentTooltipData(enemy, intent) {
        const data = {
            name: intent.nameKo || intent.name || intent.id || '알 수 없음',
            type: intent.type,
            stats: [],
            description: ''
        };
        
        // 타입별 색상
        const titleColors = {
            attack: '#ff6b6b',
            defend: '#4dabf7',
            buff: '#ffd43b',
            debuff: '#da77f2',
            summon: '#69db7c'
        };
        data.titleColor = titleColors[intent.type] || '#ffcc44';
        
        // 스탯 정보
        if (intent.damage) {
            let dmgText = `${intent.damage}`;
            if (intent.hits && intent.hits > 1) {
                dmgText = `${intent.damage} x ${intent.hits} (총 ${intent.damage * intent.hits})`;
            }
            data.stats.push({ label: '피해량', value: dmgText, color: '#ff6b6b' });
        }
        
        if (intent.block) {
            data.stats.push({ label: '방어력', value: intent.block, color: '#4dabf7' });
        }
        
        if (intent.knockback) {
            data.stats.push({ label: '넉백', value: `${intent.knockback}칸`, color: '#ffa94d' });
        }
        
        if (intent.knockbackPerHit) {
            data.stats.push({ label: '넉백/히트', value: `${intent.knockbackPerHit}칸`, color: '#ffa94d' });
        }
        
        if (intent.moveForward) {
            data.stats.push({ label: '전진', value: `${intent.moveForward}칸`, color: '#69db7c' });
        }
        
        if (intent.healAmount) {
            data.stats.push({ label: '회복량', value: intent.healAmount, color: '#69db7c' });
        }
        
        // 브레이크 정보
        if (intent.breakRecipe) {
            const breakCount = typeof intent.breakRecipe === 'number' 
                ? intent.breakRecipe 
                : intent.breakRecipe.count || 1;
            
            // 약점 정보
            let weaknessText = '';
            if (typeof MonsterPatterns !== 'undefined') {
                const pattern = MonsterPatterns.getPattern(enemy.type);
                if (pattern?.weaknesses && pattern.weaknesses.length > 0) {
                    const weaknessNames = {
                        physical: '물리',
                        fire: '화염',
                        lightning: '번개',
                        ice: '빙결',
                        poison: '독'
                    };
                    weaknessText = pattern.weaknesses.map(w => weaknessNames[w] || w).join('/');
                }
            }
            
            data.breakInfo = `브레이크 가능! ${weaknessText} ${breakCount}회 적중 시 스킬 취소`;
            
            // 설명 추가
            data.description = '강력한 공격을 준비 중입니다.\n약점 속성으로 공격하여 브레이크하세요!';
        }
        
        // 특수 효과 설명
        const effectDescs = [];
        if (intent.aoe) effectDescs.push('광역 공격');
        if (intent.piercing) effectDescs.push('관통');
        if (intent.pull) effectDescs.push('당기기');
        if (intent.taunt) effectDescs.push('도발');
        if (intent.summonId) effectDescs.push(`${intent.summonId} 소환`);
        
        if (effectDescs.length > 0 && !data.description) {
            data.description = effectDescs.join(', ');
        }
        
        return data;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.IntentTooltip = IntentTooltip;
}

console.log('[IntentTooltip] 인텐트 툴팁 시스템 로드 완료');

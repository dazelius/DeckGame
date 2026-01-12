// ==========================================
// Monster Dialogue System
// 몬스터 대사 시스템
// ==========================================

const MonsterDialogue = {
    // 대사 표시 확률 (0~1)
    showChance: {
        onSpawn: 0.8,       // 등장 시
        onIntent: 0.5,      // 인텐트 선택 시
        onAction: 0.6,      // 행동 실행 시
        onHit: 0.4,         // 피격 시
        onDeath: 1.0,       // 사망 시
        onBreak: 0.9,       // 브레이크 시
        random: 0.1         // 매 턴 랜덤
    },
    
    // 활성 대사 풍선 관리
    activeBubbles: new Map(),
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app) {
        this.app = app;
        console.log('[MonsterDialogue] 다이얼로그 시스템 초기화');
    },
    
    // ==========================================
    // 대사 가져오기
    // ==========================================
    getDialogue(unit, type, intentId = null) {
        // MonsterPatterns에서 패턴 가져오기
        const pattern = typeof MonsterPatterns !== 'undefined' 
            ? MonsterPatterns.getPattern(unit.type) 
            : null;
        
        if (!pattern?.dialogues) return null;
        
        const dialogues = pattern.dialogues;
        let pool = [];
        
        // 타입별 대사 풀 선택
        switch (type) {
            case 'spawn':
                pool = dialogues.spawn || [];
                break;
            case 'intent':
                // 특정 인텐트에 대한 대사가 있으면 우선
                if (intentId && dialogues.intents?.[intentId]) {
                    pool = dialogues.intents[intentId];
                } else {
                    pool = dialogues.intent || [];
                }
                break;
            case 'attack':
                if (intentId && dialogues.intents?.[intentId]) {
                    pool = dialogues.intents[intentId];
                } else {
                    pool = dialogues.attack || [];
                }
                break;
            case 'defend':
                pool = dialogues.defend || [];
                break;
            case 'hit':
                pool = dialogues.hit || [];
                break;
            case 'death':
                pool = dialogues.death || [];
                break;
            case 'break':
                pool = dialogues.break || [];
                break;
            case 'buff':
                pool = dialogues.buff || [];
                break;
            case 'random':
                pool = dialogues.random || [];
                break;
        }
        
        if (pool.length === 0) return null;
        
        // 랜덤 선택
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    // ==========================================
    // 대사 표시 (확률 체크 포함)
    // ==========================================
    tryShow(unit, type, intentId = null) {
        const chance = this.showChance[type] || 0.5;
        if (Math.random() > chance) return;
        
        const dialogue = this.getDialogue(unit, type, intentId);
        if (!dialogue) return;
        
        this.showBubble(unit, dialogue);
    },
    
    // ==========================================
    // 말풍선 표시
    // ==========================================
    showBubble(unit, text, duration = 2000) {
        if (!unit.sprite || unit.sprite.destroyed) return;
        if (!this.app) return;
        
        // 기존 말풍선 제거
        this.hideBubble(unit);
        
        // 컨테이너 생성
        const container = new PIXI.Container();
        container.zIndex = 500;
        
        // 유닛 위치
        const pos = unit.container || unit.sprite;
        container.x = pos.x;
        container.y = pos.y - 100; // 머리 위
        
        // 말풍선 배경
        const bubble = new PIXI.Graphics();
        const padding = 12;
        
        // 텍스트 생성 (크기 계산용)
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'MaplestoryOTFBold, Arial',
            fontSize: 14,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: 150,
            align: 'center',
            dropShadow: {
                color: '#000000',
                blur: 2,
                distance: 1
            }
        });
        
        const textObj = new PIXI.Text({ text, style: textStyle });
        textObj.anchor.set(0.5, 0.5);
        
        // 말풍선 크기
        const bubbleWidth = textObj.width + padding * 2;
        const bubbleHeight = textObj.height + padding * 2;
        
        // 말풍선 배경 그리기
        bubble.roundRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
        bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });
        bubble.stroke({ width: 2, color: 0x4a4a6a });
        
        // 말풍선 꼬리
        bubble.moveTo(-5, bubbleHeight / 2);
        bubble.lineTo(0, bubbleHeight / 2 + 10);
        bubble.lineTo(5, bubbleHeight / 2);
        bubble.fill({ color: 0x2a2a3a, alpha: 0.9 });
        
        container.addChild(bubble);
        container.addChild(textObj);
        
        // 게임 월드에 추가
        if (typeof Game !== 'undefined' && Game.gameWorld) {
            Game.gameWorld.addChild(container);
        } else if (this.app.stage) {
            this.app.stage.addChild(container);
        }
        
        this.activeBubbles.set(unit, container);
        
        // 등장 애니메이션
        container.alpha = 0;
        container.scale.set(0.5);
        
        gsap.to(container, {
            alpha: 1,
            duration: 0.2,
            ease: 'back.out(2)'
        });
        gsap.to(container.scale, {
            x: 1, y: 1,
            duration: 0.3,
            ease: 'back.out(2)'
        });
        
        // 자동 제거
        setTimeout(() => {
            this.hideBubble(unit);
        }, duration);
        
        console.log(`[Dialogue] ${unit.name || unit.type}: "${text}"`);
    },
    
    // ==========================================
    // 말풍선 숨기기
    // ==========================================
    hideBubble(unit) {
        const bubble = this.activeBubbles.get(unit);
        if (!bubble || bubble.destroyed) return;
        
        gsap.to(bubble, {
            alpha: 0,
            y: bubble.y - 20,
            duration: 0.2,
            onComplete: () => {
                if (!bubble.destroyed) bubble.destroy({ children: true });
            }
        });
        
        this.activeBubbles.delete(unit);
    },
    
    // ==========================================
    // 모든 말풍선 제거
    // ==========================================
    hideAll() {
        this.activeBubbles.forEach((bubble, unit) => {
            if (!bubble.destroyed) bubble.destroy({ children: true });
        });
        this.activeBubbles.clear();
    },
    
    // ==========================================
    // 이벤트 핸들러
    // ==========================================
    onSpawn(unit) {
        setTimeout(() => this.tryShow(unit, 'spawn'), 500);
    },
    
    onIntentSelected(unit, intent) {
        this.tryShow(unit, 'intent', intent?.id);
    },
    
    onAction(unit, intent) {
        const type = intent?.type === 'defend' ? 'defend' 
                   : intent?.type === 'buff' ? 'buff'
                   : 'attack';
        this.tryShow(unit, type, intent?.id);
    },
    
    onHit(unit, damage) {
        this.tryShow(unit, 'hit');
    },
    
    onDeath(unit) {
        this.tryShow(unit, 'death');
    },
    
    onBreak(unit) {
        this.tryShow(unit, 'break');
    }
};

console.log('[MonsterDialogue] 몬스터 다이얼로그 모듈 로드');

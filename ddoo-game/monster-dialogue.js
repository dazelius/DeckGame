// ==========================================
// Monster Dialogue System
// 몬스터 대사 시스템
// @see types.js - Unit, Intent, MonsterDialogues 타입 정의
// ==========================================

/**
 * 몬스터 대사 시스템
 * @namespace MonsterDialogue
 */
const MonsterDialogue = {
    /** @type {PIXI.Application} */
    app: null,
    
    /** 
     * 대사 표시 확률 (0~1)
     * @type {Object.<string, number>}
     */
    showChance: {
        onSpawn: 0.8,       // 등장 시
        onIntent: 0.5,      // 인텐트 선택 시
        onAction: 0.6,      // 행동 실행 시
        onHit: 0.7,         // 피격 시
        onDeath: 1.0,       // 사망 시
        onBreak: 0.9,       // 브레이크 시
        random: 0.1         // 매 턴 랜덤
    },
    
    /** 
     * 활성 대사 풍선 관리
     * @type {Map<Unit, PIXI.Container>}
     */
    activeBubbles: new Map(),
    
    /**
     * 초기화
     * @param {PIXI.Application} app - PIXI 앱 인스턴스
     */
    init(app) {
        this.app = app;
        console.log('[MonsterDialogue] 다이얼로그 시스템 초기화');
    },
    
    /**
     * 대사 가져오기
     * @param {Unit} unit - 유닛
     * @param {'spawn'|'intent'|'attack'|'defend'|'hit'|'death'|'break'|'buff'|'random'} type - 대사 타입
     * @param {string} [intentId] - 특정 인텐트 ID
     * @returns {string|null} 대사 문자열 또는 null
     */
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
    
    /**
     * 대사 표시 시도 (확률 체크 포함)
     * @param {Unit} unit - 유닛
     * @param {'spawn'|'intent'|'attack'|'defend'|'hit'|'death'|'break'|'buff'|'random'} type - 대사 타입
     * @param {string} [intentId] - 특정 인텐트 ID
     */
    tryShow(unit, type, intentId = null) {
        const chance = this.showChance[type] || 0.5;
        if (Math.random() > chance) return;
        
        const dialogue = this.getDialogue(unit, type, intentId);
        if (!dialogue) return;
        
        this.showBubble(unit, dialogue);
    },
    
    /**
     * 말풍선 표시
     * @param {Unit} unit - 유닛
     * @param {string} text - 대사 텍스트
     * @param {number} [duration=2000] - 표시 시간 (ms)
     */
    showBubble(unit, text, duration = 2000) {
        if (!unit.sprite || unit.sprite.destroyed) return;
        if (!this.app) return;
        
        // 기존 말풍선 제거
        this.hideBubble(unit);
        
        // ★ 유닛 컨테이너에 직접 추가 (유닛과 함께 움직임)
        const unitContainer = unit.container || unit.sprite.parent;
        if (!unitContainer || unitContainer.destroyed) return;
        
        // 컨테이너 생성
        const bubbleContainer = new PIXI.Container();
        bubbleContainer.zIndex = 500;
        
        // ★ 유닛 컨테이너 기준 상대 위치 (머리 위)
        // 스프라이트 높이를 기반으로 위치 계산
        const spriteHeight = unit.sprite.height || 100;
        bubbleContainer.x = 0;  // 유닛 중심
        bubbleContainer.y = -spriteHeight - 30;  // 머리 위
        
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
        
        bubbleContainer.addChild(bubble);
        bubbleContainer.addChild(textObj);
        
        // ★ 유닛 컨테이너에 추가!
        unitContainer.addChild(bubbleContainer);
        
        // 말풍선 참조 저장
        unit.dialogueBubble = bubbleContainer;
        this.activeBubbles.set(unit, bubbleContainer);
        
        // 등장 애니메이션
        bubbleContainer.alpha = 0;
        bubbleContainer.scale.set(0.5);
        
        gsap.to(bubbleContainer, {
            alpha: 1,
            duration: 0.2,
            ease: 'back.out(2)'
        });
        gsap.to(bubbleContainer.scale, {
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
    
    /**
     * 말풍선 숨기기
     * @param {Unit} unit - 유닛
     */
    hideBubble(unit) {
        const bubble = this.activeBubbles.get(unit) || unit.dialogueBubble;
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
        unit.dialogueBubble = null;
    },
    
    /**
     * 모든 말풍선 제거
     */
    hideAll() {
        this.activeBubbles.forEach((bubble, unit) => {
            if (!bubble.destroyed) bubble.destroy({ children: true });
        });
        this.activeBubbles.clear();
    },
    
    // ==========================================
    // 이벤트 핸들러
    // ==========================================
    
    /**
     * 유닛 등장 시 호출
     * @param {Unit} unit - 유닛
     */
    onSpawn(unit) {
        setTimeout(() => this.tryShow(unit, 'spawn'), 500);
    },
    
    /**
     * 인텐트 선택 시 호출
     * @param {Unit} unit - 유닛
     * @param {Intent} intent - 선택된 인텐트
     */
    onIntentSelected(unit, intent) {
        this.tryShow(unit, 'intent', intent?.id);
    },
    
    /**
     * 행동 실행 시 호출
     * @param {Unit} unit - 유닛
     * @param {Intent} intent - 실행할 인텐트
     */
    onAction(unit, intent) {
        const type = intent?.type === 'defend' ? 'defend' 
                   : intent?.type === 'buff' ? 'buff'
                   : 'attack';
        this.tryShow(unit, type, intent?.id);
    },
    
    /**
     * 피격 시 호출
     * @param {Unit} unit - 유닛
     * @param {number} damage - 받은 데미지
     */
    onHit(unit, damage) {
        this.tryShow(unit, 'hit');
    },
    
    /**
     * 사망 시 호출
     * @param {Unit} unit - 유닛
     */
    onDeath(unit) {
        this.tryShow(unit, 'death');
    },
    
    /**
     * 브레이크 시 호출
     * @param {Unit} unit - 유닛
     */
    onBreak(unit) {
        this.tryShow(unit, 'break');
    }
};

console.log('[MonsterDialogue] 몬스터 다이얼로그 모듈 로드');

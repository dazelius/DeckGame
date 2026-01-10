// =====================================================
// Localization System - 다국어 지원
// =====================================================

const Localization = {
    currentLang: 'ko', // 기본 한국어
    
    // ==========================================
    // 지원 언어
    // ==========================================
    languages: {
        ko: '한국어',
        en: 'English',
        ja: '日本語'
    },
    
    // ==========================================
    // UI 텍스트
    // ==========================================
    ui: {
        ko: {
            // 게임 상태
            prepare: '준비',
            battle: '전투',
            victory: '승리',
            defeat: '패배',
            turn: '턴',
            
            // 버튼
            endTurn: '턴 종료',
            start: '시작',
            retry: '재시작',
            
            // 상태
            cost: '코스트',
            block: '방어',
            hp: '체력',
            damage: '피해',
            
            // 카드 타입
            strike: '공격',
            miracle: '기적',
            summon: '소환',
            
            // 효과
            exhaust: '소멸',
            vulnerable: '취약',
            knockback: '넉백',
            
            // 메시지
            notEnoughCost: '코스트 부족!',
            youDied: '사망',
            enemyDefeated: '적 처치!',
            break: '브레이크!',
            exhausted: '소멸됨',
            
            // UI 라벨
            spellInventory: '마법 목록',
            endTurnBtn: '턴 종료',
            ashenOne: '재의 용사'
        },
        en: {
            prepare: 'PREPARE',
            battle: 'BATTLE',
            victory: 'VICTORY',
            defeat: 'DEFEAT',
            turn: 'Turn',
            
            endTurn: 'END TURN',
            start: 'START',
            retry: 'RETRY',
            
            cost: 'Cost',
            block: 'Block',
            hp: 'HP',
            damage: 'Damage',
            
            strike: 'STRIKE',
            miracle: 'MIRACLE',
            summon: 'SUMMON',
            
            exhaust: 'Exhaust',
            vulnerable: 'Vulnerable',
            knockback: 'Knockback',
            
            notEnoughCost: 'Not enough cost!',
            youDied: 'YOU DIED',
            enemyDefeated: 'Enemy Defeated!',
            break: 'BREAK!',
            exhausted: 'EXHAUSTED',
            
            spellInventory: 'Spell Inventory',
            endTurnBtn: 'END TURN',
            ashenOne: 'ASHEN ONE'
        },
        ja: {
            prepare: '準備',
            battle: '戦闘',
            victory: '勝利',
            defeat: '敗北',
            turn: 'ターン',
            
            endTurn: 'ターン終了',
            start: '開始',
            retry: '再挑戦',
            
            cost: 'コスト',
            block: 'ブロック',
            hp: 'HP',
            damage: 'ダメージ',
            
            strike: '攻撃',
            miracle: '奇跡',
            summon: '召喚',
            
            exhaust: '消滅',
            vulnerable: '脆弱',
            knockback: 'ノックバック',
            
            notEnoughCost: 'コスト不足!',
            youDied: '死亡',
            enemyDefeated: '敵撃破!',
            break: 'ブレイク!',
            exhausted: '消滅',
            
            spellInventory: '魔法一覧',
            endTurnBtn: 'ターン終了',
            ashenOne: '灰の勇者'
        }
    },
    
    // ==========================================
    // 카드 텍스트
    // ==========================================
    cards: {
        ko: {
            // 공격 카드
            strike: {
                name: '찌르기',
                desc: '2칸 관통. 6 피해. 근접: 최전선만.'
            },
            bash: {
                name: '강타',
                desc: '8 피해. 넉백. 근접: 최전선만.'
            },
            cleave: {
                name: '휩쓸기',
                desc: '6 피해. 3레인 타격. 근접: 최전선만.'
            },
            ironWave: {
                name: '철벽 파도',
                desc: '5 방어 획득. 5 피해. 근접: 최전선만.'
            },
            flurry: {
                name: '연속 찌르기',
                desc: '3회 공격. 각 2 피해. 근접: 최전선만.'
            },
            fireBolt: {
                name: '화염탄',
                desc: '원거리. 5 피해. 불길 생성.'
            },
            fireBall: {
                name: '화염구',
                desc: '원거리. 십자 폭발. 8 피해. 불길 생성.'
            },
            spearThrow: {
                name: '스피어 투척',
                desc: '5 피해. 직선만. 거리당 +1 피해.'
            },
            hook: {
                name: '갈고리',
                desc: '4 피해. 적을 맨 앞으로 당김. 충돌 시 2 피해.'
            },
            
            // 스킬 카드
            defend: {
                name: '방어',
                desc: '5 방어 획득'
            },
            dodge: {
                name: '회피',
                desc: '3 방어. 1칸 후퇴.'
            },
            heal: {
                name: '치유',
                desc: '10 체력 회복'
            },
            
            // 소환 카드
            summonKnight: {
                name: '기사 소환',
                desc: '기사 소환 (40 HP, 12 DMG). 소멸.'
            },
            summonArcher: {
                name: '궁수 소환',
                desc: '궁수 소환 (25 HP, 8 DMG, 사거리 4). 소멸.'
            }
        },
        en: {
            strike: {
                name: 'Strike',
                desc: 'Pierce 2 cells. Deal 6 damage. Melee: Frontline only.'
            },
            bash: {
                name: 'Bash',
                desc: 'Deal 8 damage. Knockback. Melee: Frontline only.'
            },
            cleave: {
                name: 'Cleave',
                desc: 'Deal 6 damage. Hits all 3 lanes. Melee: Frontline only.'
            },
            ironWave: {
                name: 'Iron Wave',
                desc: 'Gain 5 Block. Deal 5 damage. Melee: Frontline only.'
            },
            flurry: {
                name: 'Flurry',
                desc: 'Strike 3 times. Deal 2 damage each. Melee: Frontline only.'
            },
            fireBolt: {
                name: 'Fire Bolt',
                desc: 'Ranged. Deal 5 damage. Creates burning ground.'
            },
            fireBall: {
                name: 'Fireball',
                desc: 'Ranged. Cross-shaped explosion. Deal 8 damage. Creates burning ground.'
            },
            spearThrow: {
                name: 'Spear Throw',
                desc: '5 damage. Straight line only. +1 per grid distance.'
            },
            hook: {
                name: 'Hook',
                desc: '4 damage. Pull enemy to front. 2 crash damage on collision.'
            },
            defend: {
                name: 'Defend',
                desc: 'Gain 5 Block'
            },
            dodge: {
                name: 'Dodge',
                desc: 'Gain 3 Block. Move back 1.'
            },
            heal: {
                name: 'Heal',
                desc: 'Heal 10 HP'
            },
            summonKnight: {
                name: 'Summon Knight',
                desc: 'Summon a Knight (40 HP, 12 DMG). Exhaust.'
            },
            summonArcher: {
                name: 'Summon Archer',
                desc: 'Summon an Archer (25 HP, 8 DMG, Range 4). Exhaust.'
            }
        },
        ja: {
            strike: {
                name: '突き',
                desc: '2マス貫通。6ダメージ。近接：最前線のみ。'
            },
            bash: {
                name: '強打',
                desc: '8ダメージ。ノックバック。近接：最前線のみ。'
            },
            cleave: {
                name: '薙ぎ払い',
                desc: '6ダメージ。3レーン攻撃。近接：最前線のみ。'
            },
            ironWave: {
                name: '鉄壁の波',
                desc: '5ブロック獲得。5ダメージ。近接：最前線のみ。'
            },
            flurry: {
                name: '連続突き',
                desc: '3回攻撃。各2ダメージ。近接：最前線のみ。'
            },
            fireBolt: {
                name: '火炎弾',
                desc: '遠距離。5ダメージ。炎を生成。'
            },
            fireBall: {
                name: '火炎球',
                desc: '遠距離。十字爆発。8ダメージ。炎を生成。'
            },
            spearThrow: {
                name: '槍投げ',
                desc: '5ダメージ。直線のみ。距離ごとに+1。'
            },
            hook: {
                name: 'フック',
                desc: '4ダメージ。敵を最前線に引く。衝突時2ダメージ。'
            },
            defend: {
                name: '防御',
                desc: '5ブロック獲得'
            },
            dodge: {
                name: '回避',
                desc: '3ブロック獲得。1マス後退。'
            },
            heal: {
                name: '回復',
                desc: '10HP回復'
            },
            summonKnight: {
                name: '騎士召喚',
                desc: '騎士を召喚（40HP、12DMG）。消滅。'
            },
            summonArcher: {
                name: '弓手召喚',
                desc: '弓手を召喚（25HP、8DMG、射程4）。消滅。'
            }
        }
    },
    
    // ==========================================
    // 유닛 이름
    // ==========================================
    units: {
        ko: {
            hero: '영웅',
            knight: '기사',
            archer: '궁수',
            goblin: '고블린',
            goblinArcher: '고블린 궁수',
            orc: '오크',
            skeletonMage: '해골 마법사'
        },
        en: {
            hero: 'Hero',
            knight: 'Knight',
            archer: 'Archer',
            goblin: 'Goblin',
            goblinArcher: 'Goblin Archer',
            orc: 'Orc',
            skeletonMage: 'Skeleton Mage'
        },
        ja: {
            hero: '英雄',
            knight: '騎士',
            archer: '弓手',
            goblin: 'ゴブリン',
            goblinArcher: 'ゴブリン弓手',
            orc: 'オーク',
            skeletonMage: '骸骨魔法使い'
        }
    },
    
    // ==========================================
    // 몬스터 인텐트
    // ==========================================
    intents: {
        ko: {
            slash: '베기',
            wild_swing: '난폭한 휘두르기',
            defend: '방어 태세',
            prepare: '준비',
            arrow: '화살',
            double_shot: '연사',
            poison_arrow: '독화살',
            aim: '조준',
            heavy_strike: '강타',
            rage_slam: '분노의 강타',
            war_cry: '전투 함성',
            block: '방패 막기',
            dark_bolt: '암흑 탄환',
            soul_drain: '영혼 흡수',
            curse: '저주',
            summon_skeleton: '해골 소환'
        },
        en: {
            slash: 'Slash',
            wild_swing: 'Wild Swing',
            defend: 'Defend',
            prepare: 'Prepare',
            arrow: 'Arrow',
            double_shot: 'Double Shot',
            poison_arrow: 'Poison Arrow',
            aim: 'Aim',
            heavy_strike: 'Heavy Strike',
            rage_slam: 'Rage Slam',
            war_cry: 'War Cry',
            block: 'Block',
            dark_bolt: 'Dark Bolt',
            soul_drain: 'Soul Drain',
            curse: 'Curse',
            summon_skeleton: 'Summon Skeleton'
        },
        ja: {
            slash: '斬り',
            wild_swing: '乱暴な振り',
            defend: '防御態勢',
            prepare: '準備',
            arrow: '矢',
            double_shot: '連射',
            poison_arrow: '毒矢',
            aim: '狙い',
            heavy_strike: '強打',
            rage_slam: '怒りの一撃',
            war_cry: '戦いの叫び',
            block: '盾ブロック',
            dark_bolt: '暗黒弾',
            soul_drain: '魂吸収',
            curse: '呪い',
            summon_skeleton: '骸骨召喚'
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 저장된 언어 불러오기
        const savedLang = localStorage.getItem('ddoo_language');
        if (savedLang && this.languages[savedLang]) {
            this.currentLang = savedLang;
        }
        console.log(`[Localization] 초기화 완료 - 언어: ${this.languages[this.currentLang]}`);
    },
    
    // ==========================================
    // 언어 변경
    // ==========================================
    setLanguage(lang) {
        if (!this.languages[lang]) {
            console.warn(`[Localization] 지원하지 않는 언어: ${lang}`);
            return false;
        }
        
        this.currentLang = lang;
        localStorage.setItem('ddoo_language', lang);
        console.log(`[Localization] 언어 변경: ${this.languages[lang]}`);
        
        // UI 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
        
        return true;
    },
    
    // ==========================================
    // 텍스트 가져오기
    // ==========================================
    get(key) {
        const lang = this.currentLang;
        return this.ui[lang]?.[key] || this.ui['en']?.[key] || key;
    },
    
    // ==========================================
    // 카드 텍스트 가져오기
    // ==========================================
    getCard(cardId) {
        const lang = this.currentLang;
        return this.cards[lang]?.[cardId] || this.cards['en']?.[cardId] || null;
    },
    
    // ==========================================
    // 카드 이름 가져오기
    // ==========================================
    getCardName(cardId) {
        const cardText = this.getCard(cardId);
        return cardText?.name || cardId;
    },
    
    // ==========================================
    // 카드 설명 가져오기
    // ==========================================
    getCardDesc(cardId) {
        const cardText = this.getCard(cardId);
        return cardText?.desc || '';
    },
    
    // ==========================================
    // 유닛 이름 가져오기
    // ==========================================
    getUnit(unitId) {
        const lang = this.currentLang;
        return this.units[lang]?.[unitId] || this.units['en']?.[unitId] || unitId;
    },
    
    // ==========================================
    // 인텐트 이름 가져오기
    // ==========================================
    getIntent(intentId) {
        const lang = this.currentLang;
        return this.intents[lang]?.[intentId] || this.intents['en']?.[intentId] || intentId;
    },
    
    // ==========================================
    // 현재 언어 가져오기
    // ==========================================
    getCurrentLanguage() {
        return this.currentLang;
    },
    
    // ==========================================
    // 지원 언어 목록
    // ==========================================
    getSupportedLanguages() {
        return Object.entries(this.languages).map(([code, name]) => ({
            code,
            name,
            active: code === this.currentLang
        }));
    }
};

// 즉시 초기화
Localization.init();

// 전역 단축 함수
const L = (key) => Localization.get(key);
const LC = (cardId) => Localization.getCard(cardId);

console.log('[Localization] 다국어 시스템 로드 완료');

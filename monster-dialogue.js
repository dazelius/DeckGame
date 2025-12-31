// ==========================================
// 몬스터 대사 시스템
// ==========================================

const MonsterDialogueSystem = {
    // ==========================================
    // 대사 데이터베이스 (로컬라이징)
    // ==========================================
    dialogues: {
        // 고블린 공통 대사
        goblin: {
            attack: {
                kr: ['히히히!', '받아라!', '덤벼봐라!', '죽어라!', '크킥킥!', '찍어버려!'],
                en: ['Hehehe!', 'Take this!', 'Come at me!', 'Die!', 'Kekeke!', 'Crush you!']
            },
            defend: {
                kr: ['막아야지~', '안 맞을거다!', '헤헤, 방어!', '못 때려!'],
                en: ['Gotta block~', "Can't hit me!", 'Hehe, defend!', "You can't hit me!"]
            },
            hurt: {
                kr: ['아야!', '끄악!', '으으...', '아프다고!'],
                en: ['Ouch!', 'Gah!', 'Urgh...', 'That hurts!']
            },
            taunt: {
                kr: ['뭘 봐!', '약해 빠졌네!', '겁쟁이!', '푸하하!', '막을 수 있겠어?', '쫄았지?'],
                en: ['What are you looking at!', 'So weak!', 'Coward!', 'Bwahaha!', 'Can you block this?', 'Scared?']
            },
            death: {
                kr: ['크...윽...', '이럴 수가...', '끼에엑!', '다음엔...꼭...'],
                en: ['Guh...', 'How could this...', 'Gyaaah!', 'Next time...for sure...']
            }
        },
        
        // 고블린 샤먼 전용 대사
        goblinShaman: {
            attack: {
                kr: ['마법의 힘을 받아라!', '저주다!', '불태워라!', '번개를 받아라!'],
                en: ['Feel the magic!', 'A curse upon you!', 'Burn!', 'Lightning strike!']
            },
            heal: {
                kr: ['치유의 빛이여!', '회복하라!', '상처를 치유한다!', '힘을 되찾아라!'],
                en: ['Healing light!', 'Recover!', 'Heal the wounds!', 'Regain your strength!']
            },
            buff: {
                kr: ['힘을 부여한다!', '강해져라!', '축복이다!', '더 강하게!'],
                en: ['I grant you power!', 'Become stronger!', 'A blessing!', 'Even stronger!']
            },
            defend: {
                kr: ['보호의 마법!', '막아줘!', '방벽이다!'],
                en: ['Protection magic!', 'Shield us!', 'A barrier!']
            },
            death: {
                kr: ['마법이...사라진다...', '이런...어리석은...', '주술이...풀린다...'],
                en: ['The magic...fades...', 'Such...foolishness...', 'The spell...breaks...']
            }
        },
        
        // 고블린 킹 (보스)
        goblinKing: {
            attack: {
                kr: ['본왕의 힘을 보여주마!', '감히 왕에게 덤비다니!', '짓밟아주마!', '크하하하!'],
                en: ['Witness the power of your king!', 'How dare you challenge the king!', "I'll crush you!", 'Gwahahaha!']
            },
            defend: {
                kr: ['왕은 쓰러지지 않는다!', '막아!', '본왕을 지켜라!'],
                en: ['The king shall not fall!', 'Block!', 'Protect your king!']
            },
            buff: {
                kr: ['일어나라, 부하들이여!', '더 강해져라!', '전투 함성이다!'],
                en: ['Rise, my minions!', 'Become stronger!', 'Battle cry!']
            },
            summon: {
                kr: ['부하들아, 나와라!', '쟤들을 처리해!', '덤벼라!'],
                en: ['Minions, come forth!', 'Deal with them!', 'Attack!']
            },
            death: {
                kr: ['이...이럴 수가...본왕이...!', '고블린 제국은...멸망하지 않는다...', '크으...복수해라...부하들아...'],
                en: ['Im...impossible...the king...!', 'The Goblin Empire...will not fall...', 'Guh...avenge me...minions...']
            }
        },
        
        // 다이어 울프
        direWolf: {
            attack: {
                kr: ['크르르...', '으르렁!', '물어뜯어주마!'],
                en: ['Grrr...', 'Growl!', "I'll bite you!"]
            },
            howl: {
                kr: ['아우우~!', '하울링!'],
                en: ['Awoooo~!', 'Howling!']
            },
            death: {
                kr: ['끼잉...', '크르르...윽...'],
                en: ['Whimper...', 'Grrr...urgh...']
            }
        },
        
        // 슬라임
        slime: {
            attack: {
                kr: ['퍼억!', '찌익...', '끈적끈적~'],
                en: ['Splat!', 'Squelch...', 'Sticky~']
            },
            defend: {
                kr: ['말랑말랑~', '통통!'],
                en: ['Squishy~', 'Bouncy!']
            },
            death: {
                kr: ['펑...', '녹아...간다...'],
                en: ['Pop...', 'Melting...away...']
            }
        },
        
        // 거미
        spider: {
            attack: {
                kr: ['치직...', '거미줄이다!', '독을 받아라!'],
                en: ['Skitter...', 'Web attack!', 'Take my poison!']
            },
            blind: {
                kr: ['눈을 가려라!', '앞이 안 보이지?', '거미줄 발사!'],
                en: ['Cover your eyes!', "Can't see, can you?", 'Web shot!']
            },
            death: {
                kr: ['찌직...찌...', '거미줄이...끊어진다...'],
                en: ['Skitter...skit...', 'The web...breaks...']
            }
        },
        
        // 해골 전사
        skeleton: {
            attack: {
                kr: ['덜덜덜...', '뼈다귀로 때려주마!', '칼카닥!'],
                en: ['Clatter...', "I'll beat you with bones!", 'Clack clack!']
            },
            defend: {
                kr: ['막아!', '뼈 방패!'],
                en: ['Block!', 'Bone shield!']
            },
            death: {
                kr: ['덜...컹...', '뼈가...부서진다...'],
                en: ['Clat...ter...', 'Bones...breaking...']
            }
        },
        
        // 불꽃 정령
        fireElemental: {
            attack: {
                kr: ['불타라!', '화염이다!', '재가 되어라!'],
                en: ['Burn!', 'Flames!', 'Turn to ash!']
            },
            death: {
                kr: ['꺼져...간다...', '불꽃이...사그라든다...'],
                en: ['Fading...away...', 'The flames...die out...']
            }
        },
        
        // 가시 수호자 (엘리트)
        thornGuardian: {
            attack: {
                kr: ['가시를 받아라!', '찔려라!', '관통한다!'],
                en: ['Take my thorns!', 'Be pierced!', 'Penetrate!']
            },
            defend: {
                kr: ['가시 방벽!', '찌르면 아플거다!'],
                en: ['Thorn barrier!', "It'll hurt if you touch!"]
            },
            buff: {
                kr: ['가시가 자란다!', '더 날카롭게!'],
                en: ['Thorns grow!', 'Sharper!']
            },
            death: {
                kr: ['가시가...시든다...', '수호...실패...'],
                en: ['Thorns...wither...', 'Guardian...failed...']
            }
        },
        
        // 자이언트 스파이더 (보스)
        giantSpider: {
            attack: {
                kr: ['짓밟아주마!', '독이빨이다!', '거미의 왕이다!'],
                en: ["I'll crush you!", 'Venomous fangs!', "I'm the Spider King!"]
            },
            blind: {
                kr: ['독안개를 뿜어라!', '아무것도 보이지 않겠지!'],
                en: ['Poison fog!', "You won't see anything!"]
            },
            death: {
                kr: ['이...거대한 몸이...', '거미 왕국이...무너진다...'],
                en: ['This...massive body...', 'The Spider Kingdom...falls...']
            }
        },
        
        // 심연의 군주 (보스)
        abyssLord: {
            attack: {
                kr: ['심연의 힘을 느껴라!', '어둠에 잠겨라!', '절망하라!'],
                en: ['Feel the power of the abyss!', 'Drown in darkness!', 'Despair!']
            },
            defend: {
                kr: ['어둠이 나를 감싼다!', '심연의 방벽!'],
                en: ['Darkness surrounds me!', 'Abyss barrier!']
            },
            death: {
                kr: ['심연이...날 부른다...', '어둠 속으로...돌아간다...'],
                en: ['The abyss...calls me...', 'Returning...to darkness...']
            }
        },
        
        // 사신 (보스) - 타로카드 죽음에서 소환
        reaper: {
            attack: {
                kr: ['운명이다.', '피할 수 없다.', '죽음을 맛봐라.', '모든 것은 끝난다.'],
                en: ['It is fate.', 'You cannot escape.', 'Taste death.', 'Everything ends.']
            },
            buff: {
                kr: ['더 강해진다...', '죽음의 기운이 모인다...', '피할 수 없는 운명...'],
                en: ['Growing stronger...', 'Death gathers...', 'Inescapable fate...']
            },
            summon: {
                kr: ['나와라, 나의 분신이여.', '그림자여, 함께 하라.', '둘이서 끝장내주마.'],
                en: ['Come forth, my shadow.', 'Shadow, join me.', 'Together we end this.']
            },
            prepare: {
                kr: ['...끝이다.', '준비하라.', '마지막 순간이 다가온다.'],
                en: ['...It ends.', 'Prepare yourself.', 'The final moment approaches.']
            },
            death: {
                kr: ['이것이...나의 운명인가...', '죽음조차...죽는다...', '다시...만나게 될 것이다...'],
                en: ['Is this...my fate...', 'Even death...dies...', 'We will...meet again...']
            }
        },
        
        // 사신의 분신
        reaperShadow: {
            attack: {
                kr: ['...', '그림자의 일격.', '본체를 위해.'],
                en: ['...', 'Shadow strike.', 'For the master.']
            },
            death: {
                kr: ['사라진다...', '...'],
                en: ['Fading...', '...']
            }
        }
    },
    
    // ==========================================
    // 몬스터 ID → 대사 그룹 매핑
    // ==========================================
    getDialogueGroup(monsterId) {
        const mapping = {
            'goblinRogue': 'goblin',
            'goblinArcher': 'goblin',
            'goblinShaman': 'goblinShaman',
            'goblinKing': 'goblinKing',
            'direWolf': 'direWolf',
            'shadowSlime': 'slime',
            'splitSlime': 'slime',
            'poisonSpider': 'spider',
            'skeletonWarrior': 'skeleton',
            'fireElemental': 'fireElemental',
            'thornGuardian': 'thornGuardian',
            'giantSpider': 'giantSpider',
            'abyssLord': 'abyssLord',
            'reaper': 'reaper',
            'reaperShadow': 'reaperShadow'
        };
        return mapping[monsterId] || null;
    },
    
    // ==========================================
    // 인텐트 → 대사 카테고리 매핑
    // ==========================================
    getDialogueCategory(intentType) {
        const mapping = {
            'attack': 'attack',
            'defend': 'defend',
            'block': 'defend',
            'heal': 'heal',
            'healSelf': 'heal',
            'healAllies': 'heal',
            'buff': 'buff',
            'buffAllies': 'buff',
            'howl': 'howl',
            'blind': 'blind',
            'summon': 'summon',
            'debuff': 'attack',
            'debuffPlayer': 'attack',
            'taunt': 'taunt',
            'prepare': 'prepare'
        };
        return mapping[intentType] || 'attack';
    },
    
    // ==========================================
    // 대사 가져오기
    // ==========================================
    getDialogue(monsterId, intentType, lang = 'kr') {
        const dialogueKey = this.getDialogueGroup(monsterId);
        if (!dialogueKey || !this.dialogues[dialogueKey]) {
            return null;
        }
        
        const category = this.getDialogueCategory(intentType);
        const dialogueData = this.dialogues[dialogueKey][category];
        
        if (!dialogueData) {
            // 해당 카테고리 없으면 attack 시도
            const fallback = this.dialogues[dialogueKey]['attack'];
            if (!fallback) return null;
            const lines = fallback[lang] || fallback['kr'];
            return lines[Math.floor(Math.random() * lines.length)];
        }
        
        const lines = dialogueData[lang] || dialogueData['kr'];
        if (!lines || lines.length === 0) return null;
        
        // 확률적으로 대사 표시 (70% 확률)
        if (Math.random() > 0.7) return null;
        
        return lines[Math.floor(Math.random() * lines.length)];
    },
    
    // ==========================================
    // 사망 대사 가져오기
    // ==========================================
    getDeathDialogue(monsterId, lang = 'kr') {
        const dialogueKey = this.getDialogueGroup(monsterId);
        if (!dialogueKey || !this.dialogues[dialogueKey]) {
            return null;
        }
        
        const deathDialogues = this.dialogues[dialogueKey]['death'];
        if (!deathDialogues) return null;
        
        const lines = deathDialogues[lang] || deathDialogues['kr'];
        if (!lines || lines.length === 0) return null;
        
        // 확률적으로 사망 대사 표시 (60% 확률)
        if (Math.random() > 0.6) return null;
        
        return lines[Math.floor(Math.random() * lines.length)];
    },
    
    // ==========================================
    // 현재 언어 가져오기
    // ==========================================
    getCurrentLanguage() {
        if (typeof LanguageSystem !== 'undefined' && LanguageSystem.currentLanguage) {
            return LanguageSystem.currentLanguage;
        }
        return 'kr';
    },
    
    // ==========================================
    // 대사 말풍선 표시
    // ==========================================
    showDialogue(enemyEl, monsterId, intentType) {
        if (!enemyEl) return;
        
        const lang = this.getCurrentLanguage();
        const dialogue = this.getDialogue(monsterId, intentType, lang);
        if (!dialogue) return;
        
        this.showBubble(enemyEl, dialogue, 'normal');
    },
    
    // ==========================================
    // 사망 대사 말풍선 표시
    // ==========================================
    showDeathDialogue(enemyEl, monsterId) {
        if (!enemyEl) return;
        
        const lang = this.getCurrentLanguage();
        const dialogue = this.getDeathDialogue(monsterId, lang);
        if (!dialogue) return;
        
        this.showBubble(enemyEl, dialogue, 'death');
    },
    
    // ==========================================
    // 말풍선 UI 표시
    // ==========================================
    showBubble(enemyEl, text, type = 'normal') {
        // 기존 말풍선 제거
        const existingBubble = enemyEl.querySelector('.monster-dialogue-bubble');
        if (existingBubble) existingBubble.remove();
        
        // 말풍선 생성
        const bubble = document.createElement('div');
        bubble.className = `monster-dialogue-bubble ${type}`;
        bubble.textContent = text;
        
        enemyEl.appendChild(bubble);
        
        // 애니메이션 후 제거 (사망 대사는 더 오래 표시)
        const duration = type === 'death' ? 2000 : 1500;
        setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 300);
        }, duration);
    },
    
    // ==========================================
    // CSS 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('monster-dialogue-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'monster-dialogue-styles';
        style.textContent = `
            .monster-dialogue-bubble {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                border: 2px solid #fbbf24;
                border-radius: 12px;
                padding: 8px 14px;
                font-size: 1rem;
                font-weight: 700;
                color: #fef3c7;
                white-space: nowrap;
                z-index: 100;
                pointer-events: none;
                animation: dialogueBubbleIn 0.3s ease-out;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(251, 191, 36, 0.3);
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            }
            
            .monster-dialogue-bubble::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 10px solid #fbbf24;
            }
            
            .monster-dialogue-bubble::before {
                content: '';
                position: absolute;
                bottom: -7px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid #1a1a1a;
                z-index: 1;
            }
            
            /* 사망 대사 스타일 */
            .monster-dialogue-bubble.death {
                border-color: #ef4444;
                color: #fca5a5;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(239, 68, 68, 0.4);
            }
            
            .monster-dialogue-bubble.death::after {
                border-top-color: #ef4444;
            }
            
            @keyframes dialogueBubbleIn {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px) scale(0.8);
                }
                100% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0) scale(1);
                }
            }
            
            .monster-dialogue-bubble.fade-out {
                animation: dialogueBubbleOut 0.3s ease-in forwards;
            }
            
            @keyframes dialogueBubbleOut {
                0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px) scale(0.8);
                }
            }
            
            /* 몬스터 타입별 말풍선 색상 */
            .enemy-unit.elite .monster-dialogue-bubble {
                border-color: #a855f7;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(168, 85, 247, 0.4);
            }
            .enemy-unit.elite .monster-dialogue-bubble::after {
                border-top-color: #a855f7;
            }
            .enemy-unit.elite .monster-dialogue-bubble.death {
                border-color: #dc2626;
            }
            .enemy-unit.elite .monster-dialogue-bubble.death::after {
                border-top-color: #dc2626;
            }
            
            .enemy-unit.boss .monster-dialogue-bubble {
                border-color: #f59e0b;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.5),
                    0 0 25px rgba(245, 158, 11, 0.5);
                font-size: 1.1rem;
            }
            .enemy-unit.boss .monster-dialogue-bubble::after {
                border-top-color: #f59e0b;
            }
            .enemy-unit.boss .monster-dialogue-bubble.death {
                border-color: #dc2626;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.5),
                    0 0 30px rgba(220, 38, 38, 0.6);
            }
            .enemy-unit.boss .monster-dialogue-bubble.death::after {
                border-top-color: #dc2626;
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        console.log('[MonsterDialogue] 대사 시스템 초기화 완료');
    }
};

// 전역 접근용 래퍼 함수
function getMonsterDialogue(monsterId, intentType, lang) {
    return MonsterDialogueSystem.getDialogue(monsterId, intentType, lang);
}

function showMonsterDialogue(enemyEl, monsterId, intentType) {
    MonsterDialogueSystem.showDialogue(enemyEl, monsterId, intentType);
}

function showMonsterDeathDialogue(enemyEl, monsterId) {
    MonsterDialogueSystem.showDeathDialogue(enemyEl, monsterId);
}

// 전역 등록
window.MonsterDialogueSystem = MonsterDialogueSystem;
window.getMonsterDialogue = getMonsterDialogue;
window.showMonsterDialogue = showMonsterDialogue;
window.showMonsterDeathDialogue = showMonsterDeathDialogue;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    MonsterDialogueSystem.init();
});

// 즉시 초기화 (이미 DOM이 로드된 경우)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    MonsterDialogueSystem.init();
}

console.log('[MonsterDialogue] 몬스터 대사 시스템 로드 완료');


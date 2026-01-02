// ==========================================
// Shadow Deck - 브레이크 시스템
// 인텐트 기반 약점 파괴 시스템
// ==========================================

// 속성 타입 정의
const ElementType = {
    PHYSICAL: 'physical',   // ⚔️ 물리
    FIRE: 'fire',           // 🔥 화염
    ICE: 'ice',             // ❄️ 냉기
    LIGHTNING: 'lightning', // ⚡ 전기
    BLEED: 'bleed',         // 🩸 출혈
    POISON: 'poison',       // ☠️ 독
    MAGIC: 'magic',         // ✨ 마법
    DARK: 'dark'            // 🌑 암흑
};

// 속성 아이콘 매핑
const ElementIcons = {
    physical: '⚔️',
    fire: '🔥',
    ice: '❄️',
    lightning: '⚡',
    bleed: '🩸',
    poison: '☠️',
    magic: '✨',
    dark: '🌑'
};

// 속성 색상 매핑
const ElementColors = {
    physical: '#f59e0b',
    fire: '#ef4444',
    ice: '#3b82f6',
    lightning: '#eab308',
    bleed: '#dc2626',
    poison: '#22c55e',
    magic: '#a855f7',
    dark: '#6366f1'
};

const BreakSystem = {
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[BreakSystem] 인텐트 기반 브레이크 시스템 초기화');
        this.injectStyles();
    },
    
    // ==========================================
    // 현재 인텐트가 브레이크 가능한지 확인
    // ==========================================
    hasBreakableIntent(enemy) {
        if (!enemy || !enemy.currentBreakRecipe) return false;
        return enemy.currentBreakRecipe.length > 0;
    },
    
    // ==========================================
    // 인텐트 선택 시 브레이크 상태 초기화
    // ==========================================
    onIntentSelected(enemy, intentData) {
        // 이전 브레이크 상태 초기화
        enemy.currentBreakRecipe = null;
        enemy.breakProgress = [];
        
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        
        // 브레이크 상태였으면 별 이펙트 중지
        if (enemy.isBroken) {
            if (enemyIndex !== -1) {
                const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
                if (enemyEl && typeof PixiRenderer !== 'undefined') {
                    PixiRenderer.stopPersistentStunLoop(enemyEl);
                }
            }
        }
        enemy.isBroken = false;
        
        // 🔧 중요: 새 인텐트 선택 시 data-original-text 초기화 (이전 값이 잘못 사용되는 것 방지)
        if (enemyIndex !== -1) {
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
            if (enemyEl) {
                const intentEl = enemyEl.querySelector('.enemy-intent-display');
                if (intentEl) {
                    intentEl.removeAttribute('data-original-text');
                }
            }
        }
        
        // 위협 상태 해제 (새 인텐트 전에 이전 상태 클리어)
        this.clearThreatState(enemy, enemyIndex);
        
        // 인텐트에 breakRecipe가 있으면 설정
        if (intentData && intentData.breakRecipe && intentData.breakRecipe.length > 0) {
            enemy.currentBreakRecipe = [...intentData.breakRecipe];
            enemy.breakProgress = [];
            enemy.breakShield = intentData.breakRecipe.length;
            enemy.maxBreakShield = intentData.breakRecipe.length;
            
            console.log(`[BreakSystem] ${enemy.name}: 브레이크 가능 인텐트! 레시피: ${intentData.breakRecipe.join(', ')}`);
            
            // 🔥 위협 상태 활성화!
            this.activateThreatState(enemy, intentData);
        }
    },
    
    // ==========================================
    // 위협 상태 활성화 (무서운 연출)
    // ==========================================
    activateThreatState(enemy, intentData) {
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        if (enemyIndex === -1) return;
        
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        // 위협 클래스 추가
        enemyEl.classList.add('threat-active');
        
        // 위협 대사 표시 (기존 대사 시스템 사용)
        const intentName = intentData.name || '강력한 공격';
        this.showThreatDialogue(enemyEl, enemy, intentName);
        
        // 화면 효과
        this.showThreatWarning();
    },
    
    // ==========================================
    // 위협 상태 해제
    // ==========================================
    clearThreatState(enemy, providedIndex = null) {
        const enemyIndex = providedIndex !== null ? providedIndex : gameState.enemies?.indexOf(enemy);
        if (enemyIndex === -1 || enemyIndex === undefined) return;
        
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (enemyEl) {
            // ✅ 모든 위협 관련 클래스 제거
            enemyEl.classList.remove('threat-active', 'intent-attack-strong');
            
            // 인텐트 원본 콘텐츠 복원용 속성 제거 (다음 인텐트에서 새로 추출하도록)
            const intentEl = enemyEl.querySelector('.enemy-intent-display');
            if (intentEl) {
                intentEl.removeAttribute('data-original-text');
                intentEl.classList.remove('danger-intent', 'intent-shattering');
            }
        }
        
        // 브레이크 관련 상태 초기화
        enemy.currentBreakRecipe = null;
        enemy.breakProgress = null;
        enemy.breakShield = 0;
        enemy.maxBreakShield = 0;
    },
    
    // ==========================================
    // 위협 대사 표시 (MonsterDialogueSystem 사용)
    // ==========================================
    showThreatDialogue(enemyEl, enemy, intentName) {
        // MonsterDialogueSystem이 있으면 사용
        if (typeof MonsterDialogueSystem !== 'undefined') {
            // 위협 전용 대사 (prepare 또는 attack 카테고리)
            const monsterId = enemy.id || enemy.name;
            MonsterDialogueSystem.showDialogue(enemyEl, monsterId, 'prepare');
        }
    },
    
    // ==========================================
    // 화면 위협 경고
    // ==========================================
    showThreatWarning() {
        // 화면 가장자리 붉은 플래시
        const warning = document.createElement('div');
        warning.className = 'threat-warning-overlay';
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 1000);
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('warning', { volume: 0.5 });
        }
    },
    
    // ==========================================
    // 카드 속성 가져오기
    // ==========================================
    getCardElement(card) {
        // 카드에 명시적 element가 있으면 사용
        if (card && card.element) {
            return card.element;
        }
        
        if (card) {
            // keywords 배열 체크
            if (card.keywords && Array.isArray(card.keywords)) {
                if (card.keywords.includes('bleed')) return ElementType.BLEED;
                if (card.keywords.includes('poison')) return ElementType.POISON;
                if (card.keywords.includes('fire')) return ElementType.FIRE;
                if (card.keywords.includes('ice')) return ElementType.ICE;
                if (card.keywords.includes('lightning')) return ElementType.LIGHTNING;
                if (card.keywords.includes('dark') || card.keywords.includes('shadow')) return ElementType.DARK;
            }
            
            // ID 기반 추론
            if (card.id) {
                if (card.id.includes('bleed') || card.id.includes('lacerate') || card.id.includes('hemorrhage') ||
                    card.id.includes('rending') || card.id.includes('artery') || card.id.includes('rupture')) {
                    return ElementType.BLEED;
                }
                if (card.id.includes('poison') || card.id.includes('venom') || card.id.includes('toxic')) {
                    return ElementType.POISON;
                }
                if (card.id.includes('fire') || card.id.includes('burn') || card.id.includes('flame') || card.id.includes('inferno')) {
                    return ElementType.FIRE;
                }
                if (card.id.includes('ice') || card.id.includes('frost') || card.id.includes('freeze') || card.id.includes('cold')) {
                    return ElementType.ICE;
                }
                if (card.id.includes('lightning') || card.id.includes('shock') || card.id.includes('thunder') || card.id.includes('spark')) {
                    return ElementType.LIGHTNING;
                }
                if (card.id.includes('shadow') || card.id.includes('dark') || card.id.includes('stealth') || card.id.includes('night')) {
                    return ElementType.DARK;
                }
            }
            
            // 타입 기반 기본값
            if (card.type === 'attack') {
                return ElementType.PHYSICAL;
            }
            if (card.type === 'skill') {
                return ElementType.MAGIC;
            }
        }
        
        return ElementType.PHYSICAL;
    },
    
    // ==========================================
    // 공격 시 브레이크 진행
    // ==========================================
    onAttack(enemy, card, hitCount = 1) {
        if (!this.hasBreakableIntent(enemy)) return { hit: false, broken: false };
        if (enemy.isBroken) return { hit: false, broken: false };
        
        const element = this.getCardElement(card);
        const recipe = enemy.currentBreakRecipe;
        const progress = enemy.breakProgress || [];
        
        // 다음에 필요한 속성 확인
        const nextRequired = recipe[progress.length];
        
        if (element !== nextRequired) {
            // 잘못된 속성!
            console.log(`[BreakSystem] ${enemy.name}: ${element}은(는) 맞지 않음! (필요: ${nextRequired})`);
            this.showRecipeResult(enemy, element, false, nextRequired);
            return { hit: false, broken: false };
        }
        
        // 올바른 속성!
        progress.push(element);
        enemy.breakProgress = progress;
        
        console.log(`[BreakSystem] ${enemy.name}: ${element} 성공! 진행: ${progress.length}/${recipe.length}`);
        this.showRecipeResult(enemy, element, true);
        
        // 레시피 완성 체크
        if (progress.length >= recipe.length) {
            this.triggerBreak(enemy);
            return { hit: true, broken: true };
        }
        
        // UI 업데이트
        this.updateBreakUI(enemy);
        return { hit: true, broken: false };
    },
    
    // ==========================================
    // 레시피 진행 결과 표시 (간소화)
    // ==========================================
    showRecipeResult(enemy, element, isHit, requiredElement = null) {
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        if (enemyIndex === -1) return;
        
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        const popup = document.createElement('div');
        popup.className = `break-recipe-popup ${isHit ? 'hit' : 'miss'}`;
        
        if (isHit) {
            // 성공: 체크 표시
            popup.innerHTML = `<span class="recipe-check">✓</span>`;
        } else {
            // 실패: X 표시
            popup.innerHTML = `<span class="recipe-x">✗</span>`;
        }
        
        popup.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            z-index: 100;
            pointer-events: none;
            animation: recipePopup 0.5s ease-out forwards;
        `;
        enemyEl.appendChild(popup);
        setTimeout(() => popup.remove(), 500);
    },
    
    // ==========================================
    // 브레이크 발동!
    // ==========================================
    triggerBreak(enemy) {
        enemy.isBroken = true;
        
        // 🔥 취약 부여 (1턴 + 레시피 길이에 따른 보너스)
        const recipeLength = enemy.currentBreakRecipe?.length || 2;
        const vulnerableTurns = Math.max(1, recipeLength - 1); // 2칸 레시피 = 1턴, 3칸 = 2턴
        enemy.vulnerable = (enemy.vulnerable || 0) + vulnerableTurns;
        
        console.log(`[BreakSystem] ${enemy.name} BREAK!!! +취약 ${vulnerableTurns}턴 (총 ${enemy.vulnerable}턴)`);
        
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        const enemyEl = enemyIndex !== -1 ? document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`) : null;
        
        // 🔥 1단계: 브레이크 연출 먼저!
        this.showBreakEffect(enemy);
        
        // 인텐트 데이터 초기화
        enemy.intent = null;
        enemy.intentValue = 0;
        enemy.currentBreakRecipe = null;
        
        // 🔥 2단계: 연출 후 UI 업데이트 (500ms 딜레이)
        setTimeout(() => {
            // ✅ PixiJS EnemyRenderer 환경
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                EnemyRenderer.setEnemyBrokenState(enemy, true);
                EnemyRenderer.updateEnemyIntent(enemy);
            }
            
            // DOM 환경
            if (enemyEl) {
                enemyEl.classList.add('enemy-broken');
                
                // 🌟 지속적인 3D 별 이펙트 시작! (DOM용)
                if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized && PixiRenderer.startPersistentStunLoop) {
                    PixiRenderer.startPersistentStunLoop(enemyEl);
                }
                
                // 인텐트 숨기기
                const intentEl = enemyEl.querySelector('.enemy-intent-display');
                if (intentEl) {
                    intentEl.style.display = 'none';
                    intentEl.classList.add('is-broken');
                }
            }
            
            if (typeof updateEnemiesUI === 'function') {
                updateEnemiesUI();
            }
        }, 500);
    },
    
    // ==========================================
    // 브레이크 상태에서 행동 가능 여부
    // ==========================================
    canAct(enemy) {
        return !enemy.isBroken;
    },
    
    // ==========================================
    // 턴 종료 시 브레이크 상태 해제
    // ==========================================
    onTurnEnd(enemy) {
        if (enemy.isBroken) {
            enemy.isBroken = false;
            enemy.currentBreakRecipe = null;
            enemy.breakProgress = [];
            console.log(`[BreakSystem] ${enemy.name} 브레이크 해제`);
            
            // ✅ PixiJS EnemyRenderer 환경
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                EnemyRenderer.setEnemyBrokenState(enemy, false);
                EnemyRenderer.updateEnemyIntent(enemy);
            }
            
            const enemyIndex = gameState.enemies?.indexOf(enemy);
            if (enemyIndex !== -1) {
                const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
                if (enemyEl) {
                    // 🌟 지속 별 이펙트 중지! (DOM용)
                    if (typeof PixiRenderer !== 'undefined' && PixiRenderer.stopPersistentStunLoop) {
                        PixiRenderer.stopPersistentStunLoop(enemyEl);
                    }
                    
                    // 스프라이트 스타일 초기화 (GSAP 적용된 것 리셋)
                    const sprite = enemyEl.querySelector('.enemy-sprite-img');
                    if (sprite) {
                        // GSAP 킬
                        if (typeof gsap !== 'undefined') {
                            gsap.killTweensOf(sprite);
                            gsap.killTweensOf(enemyEl);
                        }
                        // 스타일 초기화
                        sprite.style.filter = '';
                        sprite.style.transform = '';
                        sprite.style.opacity = '';
                        enemyEl.style.transform = '';
                    }
                    
                    // 인텐트 다시 표시 (스타일만 복구, innerHTML은 game.js에서 처리)
                    const intentEl = enemyEl.querySelector('.enemy-intent-display');
                    if (intentEl) {
                        intentEl.style.display = '';
                        intentEl.style.visibility = '';
                        intentEl.style.opacity = '';
                        intentEl.classList.remove('is-broken', 'danger-intent', 'intent-shattering');
                        // 🔧 중요: data-original-text 속성 제거 (다음 인텐트에서 새로 추출하도록)
                        intentEl.removeAttribute('data-original-text');
                        console.log(`[BreakSystem.onTurnEnd] ${enemy.name} 인텐트 스타일 복구 완료 (data-original-text 제거됨)`);
                    }
                    enemyEl.classList.remove('enemy-broken');
                }
            }
            // ⚠️ 인텐트 결정과 UI 업데이트는 game.js에서 처리 (중복 방지)
        }
    },
    
    // ==========================================
    // 브레이크 UI 업데이트 (인텐트 내부 통합)
    // ==========================================
    updateBreakUI(enemy) {
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        if (enemyIndex === -1) return;
        
        // ✅ PixiJS 환경에서는 EnemyRenderer 사용
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
            this.updateBreakUIPixi(enemy);
            return;
        }
        
        // DOM 환경
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        const intentEl = enemyEl.querySelector('.enemy-intent-display');
        if (!intentEl) return;
        
        // 클래스 초기화
        intentEl.classList.remove('danger-intent', 'is-broken');
        enemyEl.classList.remove('enemy-broken');
        
        // 🔥 브레이크 해제된 상태면 인텐트 표시 복구만 하고 리턴
        if (!enemy.isBroken) {
            intentEl.style.display = '';
            intentEl.style.visibility = '';
            
            // 브레이크 가능 인텐트가 없으면 여기서 끝
            if (!this.hasBreakableIntent(enemy)) {
                return;
            }
        }
        
        if (enemy.isBroken) {
            // 브레이크 상태 - 인텐트 완전히 숨기기
            intentEl.classList.add('is-broken');
            enemyEl.classList.add('enemy-broken');
            
            // 인텐트 내용 비우기 (별만 보이도록)
            intentEl.innerHTML = '';
            intentEl.style.display = 'none';
        } else {
            // 위험 인텐트 표시 (인텐트 내부에 모두 통합)
            intentEl.classList.add('danger-intent');
            
            const recipe = enemy.currentBreakRecipe || [];
            const progress = enemy.breakProgress || [];
            const remaining = recipe.length - progress.length;
            
            // 인텐트 내부 구조 재구성 (하나의 통합 컨테이너)
            this.rebuildIntentWithGauge(intentEl, enemy, remaining, recipe.length);
        }
    },
    
    // ==========================================
    // PixiJS 브레이크 UI 업데이트
    // ==========================================
    updateBreakUIPixi(enemy) {
        // 인텐트 업데이트
        EnemyRenderer.updateEnemyIntent(enemy);
        
        // 브레이크 게이지 업데이트
        EnemyRenderer.updateEnemyBreak(enemy);
        
        // 브레이크 상태 스프라이트 효과
        if (enemy.isBroken) {
            EnemyRenderer.setEnemyBrokenState(enemy, true);
        } else {
            EnemyRenderer.setEnemyBrokenState(enemy, false);
        }
    },
    
    // ==========================================
    // PixiJS 브레이크 폭발 이펙트
    // ==========================================
    showBreakEffectPixi(enemy) {
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
            // 🎆 ShieldBreakVFX로 유리 깨지는 이펙트!
            const enemyId = enemy.pixiId || enemy.id || enemy.name;
            const data = EnemyRenderer.sprites?.get(enemyId);
            
            if (data && data.container && typeof ShieldBreakVFX !== 'undefined') {
                const globalPos = data.container.getGlobalPosition();
                const canvas = EnemyRenderer.app?.canvas;
                
                if (canvas) {
                    const canvasRect = canvas.getBoundingClientRect();
                    const screenX = canvasRect.left + globalPos.x;
                    const spriteHeight = data.sprite?.texture?.height * (data.container.scale?.y || 1) || 150;
                    const screenY = canvasRect.top + globalPos.y - spriteHeight / 2;
                    
                    // 유리 깨지는 브레이크 이펙트!
                    ShieldBreakVFX.play(screenX, screenY, 1.5);
                    console.log('[BreakSystem] 🎆 ShieldBreakVFX 발동!', screenX, screenY);
                }
            }
            
            // EnemyRenderer의 브레이크 이펙트 사용
            if (EnemyRenderer.playBreakEffect) {
                EnemyRenderer.playBreakEffect(enemy);
            }
            
            // 스프라이트 효과 설정
            EnemyRenderer.setEnemyBrokenState(enemy, true);
        }
    },
    
    // ==========================================
    // BREAK 텍스트 표시 (공통)
    // ==========================================
    showBreakText(enemy) {
        // 위치 계산
        let centerX = window.innerWidth / 2;
        let centerY = window.innerHeight / 2 - 50;
        
        // EnemyRenderer에서 위치 가져오기
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
            const enemyId = enemy.pixiId || enemy.id || enemy.name;
            const data = EnemyRenderer.sprites?.get(enemyId);
            if (data && data.container) {
                const globalPos = data.container.getGlobalPosition();
                const canvas = EnemyRenderer.app?.canvas;
                if (canvas) {
                    const canvasRect = canvas.getBoundingClientRect();
                    centerX = canvasRect.left + globalPos.x;
                    centerY = canvasRect.top + globalPos.y - 100;
                }
            }
        }
        
        // BREAK 텍스트
        const breakText = document.createElement('div');
        breakText.className = 'break-effect-text';
        breakText.textContent = 'BREAK!';
        breakText.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
            z-index: 99999;
            pointer-events: none;
            font-family: 'Cinzel', serif;
            font-size: 4rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 
                0 0 20px rgba(251, 191, 36, 1),
                0 0 40px rgba(251, 191, 36, 0.8),
                3px 3px 0 #000;
            letter-spacing: 8px;
        `;
        document.body.appendChild(breakText);
        
        // 취약 텍스트
        const vulnerableText = document.createElement('div');
        const vulnTurns = Math.max(1, (enemy.currentBreakRecipe?.length || 2) - 1);
        vulnerableText.textContent = `💔 취약 +${vulnTurns}`;
        vulnerableText.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY + 60}px;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
            z-index: 99998;
            pointer-events: none;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #ef4444;
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 2px 2px 0 #000;
        `;
        document.body.appendChild(vulnerableText);
        
        // GSAP 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(breakText, {
                    scale: 1.5,
                    rotation: -5,
                    opacity: 1,
                    duration: 0.15,
                    ease: "back.out(3)"
                })
                .to(breakText, { scale: 1.2, rotation: 3, duration: 0.1 })
                .to(breakText, { scale: 1, rotation: 0, duration: 0.1 })
                .to(breakText, {
                    y: -30,
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.5,
                    ease: "power2.in",
                    onComplete: () => breakText.remove()
                });
            
            gsap.timeline({ delay: 0.2 })
                .to(vulnerableText, { scale: 1.2, opacity: 1, duration: 0.2, ease: "back.out(2)" })
                .to(vulnerableText, { scale: 1, duration: 0.1 })
                .to(vulnerableText, {
                    y: -20,
                    opacity: 0,
                    duration: 0.4,
                    delay: 0.8,
                    ease: "power2.in",
                    onComplete: () => vulnerableText.remove()
                });
        } else {
            breakText.style.animation = 'breakEffectAnim 1.5s ease-out forwards';
            setTimeout(() => breakText.remove(), 1500);
            vulnerableText.style.animation = 'vulnerablePopAnim 1.5s ease-out forwards';
            setTimeout(() => vulnerableText.remove(), 1500);
        }
        
        // 화면 흔들림
        if (typeof SpriteAnimation !== 'undefined' && SpriteAnimation.screenShake) {
            SpriteAnimation.screenShake(20, 0.4);
        }
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('break', { volume: 0.8 });
        }
    },
    
    // ==========================================
    // 인텐트 + 게이지 통합 빌드
    // ==========================================
    rebuildIntentWithGauge(intentEl, enemy, remaining, total) {
        // 기존 텍스트만 추출 (이미 rebuild 되었으면 원본 사용)
        let originalText = intentEl.getAttribute('data-original-text');
        
        if (!originalText) {
            // HTML 태그 제거하고 텍스트만 추출
            originalText = intentEl.textContent.replace(/⚠/g, '').trim();
            intentEl.setAttribute('data-original-text', originalText);
        }
        
        const progressPercent = ((total - remaining) / total) * 100;
        
        // 심플한 통합 구조 (단일 박스)
        intentEl.innerHTML = `
            <div class="intent-inner">
                <span class="danger-icon">⚠</span>
                <span class="intent-text">${originalText}</span>
            </div>
            <div class="break-gauge-bar">
                <div class="break-gauge-fill" style="width: ${progressPercent}%"></div>
            </div>
        `;
    },
    
    // ==========================================
    // 브레이크 이펙트 (GSAP + PixiJS 업그레이드!)
    // ==========================================
    showBreakEffect(enemy) {
        // ✅ PixiJS EnemyRenderer 환경이면 전용 이펙트 사용
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
            this.showBreakEffectPixi(enemy);
            this.showBreakText(enemy);  // BREAK 텍스트는 공통
            return;
        }
        
        const enemyIndex = gameState.enemies?.indexOf(enemy);
        if (enemyIndex === -1) return;
        
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        const intentEl = enemyEl.querySelector('.enemy-intent-display');
        const rect = enemyEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 🎆 ShieldBreakVFX로 유리 깨지는 이펙트!
        if (typeof ShieldBreakVFX !== 'undefined') {
            ShieldBreakVFX.play(centerX, centerY, 1.5);
        }
        
        // 🔥 1단계: 히트스탑 (GSAP) - 게임이 잠시 멈추는 느낌!
        if (typeof gsap !== 'undefined') {
            // 적 스프라이트 찾기
            const sprite = enemyEl.querySelector('.enemy-sprite-img');
            if (sprite) {
                // 히트스탑: 잠시 멈추고 하얗게 번쩍!
                gsap.timeline()
                    .set(sprite, { filter: 'brightness(3) saturate(0)' })
                    .to(sprite, { 
                        x: -8, 
                        duration: 0.02 
                    })
                    .to(sprite, { 
                        x: 8, 
                        duration: 0.02 
                    })
                    .to(sprite, { 
                        x: -5, 
                        duration: 0.02 
                    })
                    .to(sprite, { 
                        x: 5, 
                        duration: 0.02 
                    })
                    .to(sprite, { 
                        x: 0, 
                        filter: 'brightness(1) grayscale(0.8)',
                        duration: 0.1 
                    });
            }
        }
        
        // ⚡ 2단계: PixiJS 스턴 이펙트!
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            // 💥 스턴 전용 폭발 이펙트!
            PixiRenderer.createStunEffect(centerX, centerY - 40);
            
            // 큰 충격파 (노란색)
            PixiRenderer.createShockwave(centerX, centerY - 30, '#ffcc00');
            
            // 별 회전 스턴 이펙트 (CSS용 + PixiJS용 둘 다)
            this.createStunStars(centerX, centerY - 50, enemyIndex);
            PixiRenderer.createStunLoop(centerX, centerY - 60, 1500, enemyIndex);
            
            // 스파크 폭발 (빨강 + 노랑 + 흰색) - VFX 사용
            if (typeof VFX !== 'undefined' && VFX.sparks) {
                VFX.sparks(centerX, centerY - 30, { color: '#ff4444', count: 25, speed: 15 });
                VFX.sparks(centerX, centerY - 30, { color: '#ffcc00', count: 20, speed: 12 });
                VFX.sparks(centerX, centerY - 30, { color: '#ffffff', count: 15, speed: 10 });
            }
        }
        
        // 🌟 3단계: 화면 플래시
        this.createBreakFlash();
        
        // 인텐트 위치에서 깨지는 효과
        if (intentEl) {
            const intentRect = intentEl.getBoundingClientRect();
            const intentCenterX = intentRect.left + intentRect.width / 2;
            const intentCenterY = intentRect.top + intentRect.height / 2;
            
            // 인텐트 흔들림 + 깨지기 애니메이션
            intentEl.classList.add('intent-shattering');
            
            // 인텐트 파편 효과
            this.createIntentShatterEffect(intentCenterX, intentCenterY, intentRect);
            
            // 깨지는 사운드
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.play('glass_break', { volume: 0.6 });
            }
        }
        
        // 💥 BREAK 텍스트 (GSAP 애니메이션!)
        const breakText = document.createElement('div');
        breakText.className = 'break-effect-text';
        breakText.textContent = 'BREAK!';
        const textY = intentEl ? intentEl.getBoundingClientRect().top + intentEl.getBoundingClientRect().height / 2 : centerY;
        breakText.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${textY}px;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
            z-index: 9999;
            pointer-events: none;
            font-family: 'Cinzel', serif;
            font-size: 4rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 
                0 0 20px rgba(251, 191, 36, 1),
                0 0 40px rgba(251, 191, 36, 0.8),
                3px 3px 0 #000;
            letter-spacing: 8px;
        `;
        document.body.appendChild(breakText);
        
        // 💔 취약 텍스트 (BREAK 아래에 표시)
        const vulnerableText = document.createElement('div');
        vulnerableText.className = 'break-vulnerable-text';
        const vulnTurns = Math.max(1, (enemy.currentBreakRecipe?.length || 2) - 1);
        vulnerableText.textContent = `💔 취약 +${vulnTurns}`;
        vulnerableText.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${textY + 50}px;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
            z-index: 9998;
            pointer-events: none;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #ef4444;
            text-shadow: 
                0 0 10px rgba(239, 68, 68, 0.8),
                2px 2px 0 #000;
        `;
        document.body.appendChild(vulnerableText);
        
        console.log('[BreakSystem] 🔥 BREAK 텍스트 생성됨!', { centerX, textY });
        
        // GSAP으로 BREAK 텍스트 애니메이션
        if (typeof gsap !== 'undefined') {
            // BREAK 텍스트
            gsap.timeline()
                .to(breakText, {
                    scale: 1.5,
                    rotation: -5,
                    opacity: 1,
                    duration: 0.15,
                    ease: "back.out(3)"
                })
                .to(breakText, {
                    scale: 1.2,
                    rotation: 3,
                    duration: 0.1
                })
                .to(breakText, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.1
                })
                .to(breakText, {
                    y: -30,
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.5,
                    ease: "power2.in",
                    onComplete: () => breakText.remove()
                });
            
            // 취약 텍스트 (약간 딜레이 후)
            gsap.timeline({ delay: 0.2 })
                .to(vulnerableText, {
                    scale: 1.2,
                    opacity: 1,
                    duration: 0.2,
                    ease: "back.out(2)"
                })
                .to(vulnerableText, {
                    scale: 1,
                    duration: 0.1
                })
                .to(vulnerableText, {
                    y: -20,
                    opacity: 0,
                    duration: 0.4,
                    delay: 0.8,
                    ease: "power2.in",
                    onComplete: () => vulnerableText.remove()
                });
        } else {
            // GSAP 없을 때 CSS 애니메이션 폴백
            breakText.style.animation = 'breakEffectAnim 1.5s ease-out forwards';
            setTimeout(() => breakText.remove(), 1500);
            vulnerableText.style.animation = 'vulnerablePopAnim 1.5s ease-out forwards';
            setTimeout(() => vulnerableText.remove(), 1500);
        }
        
        // 파편 효과 (캐릭터 위치)
        this.createShatterParticles(centerX, centerY);
        
        // 화면 흔들림 (더 강하게!)
        if (typeof SpriteAnimation !== 'undefined') {
            SpriteAnimation.screenShake(20, 0.4);
        } else if (typeof EffectSystem !== 'undefined' && EffectSystem.screenShake) {
            EffectSystem.screenShake(20, 400);
        }
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('break', { volume: 0.8 });
        }
        
        setTimeout(() => breakText.remove(), 1500);
    },
    
    // ==========================================
    // 스턴 별 회전 이펙트 (PixiJS)
    // ==========================================
    createStunStars(x, y, enemyIndex = null) {
        if (typeof PixiRenderer === 'undefined' || !PixiRenderer.initialized) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        PixiRenderer.effectsContainer.addChild(container);
        
        const starCount = 5;
        const starGraphics = [];
        let destroyed = false;
        
        // 임시 이펙트 추적에 등록
        if (enemyIndex !== null && typeof PixiRenderer.tempStunEffects !== 'undefined') {
            const indexStr = String(enemyIndex);
            if (!PixiRenderer.tempStunEffects.has(indexStr)) {
                PixiRenderer.tempStunEffects.set(indexStr, []);
            }
            PixiRenderer.tempStunEffects.get(indexStr).push({
                container,
                destroy: () => {
                    if (!destroyed) {
                        destroyed = true;
                        container.destroy({ children: true });
                    }
                }
            });
        }
        
        // 별 생성
        for (let i = 0; i < starCount; i++) {
            const star = new PIXI.Graphics();
            const angle = (Math.PI * 2 / starCount) * i;
            const radius = 35;
            
            // 별 모양 그리기
            const points = [];
            for (let j = 0; j < 10; j++) {
                const r = j % 2 === 0 ? 8 : 4;
                const a = (Math.PI * 2 / 10) * j - Math.PI / 2;
                points.push(Math.cos(a) * r, Math.sin(a) * r);
            }
            star.poly(points);
            star.fill({ color: '#ffcc00', alpha: 1 });
            star.stroke({ width: 1, color: '#ffffff', alpha: 0.8 });
            
            star.x = Math.cos(angle) * radius;
            star.y = Math.sin(angle) * radius;
            star.scale.set(0);
            
            container.addChild(star);
            starGraphics.push({ star, baseAngle: angle, radius });
        }
        
        // 회전 애니메이션
        let time = 0;
        const duration = 120; // 2초
        
        const animate = () => {
            if (destroyed) return;
            
            time++;
            const progress = time / duration;
            
            // 전체 회전
            container.rotation = progress * Math.PI * 4;
            
            // 각 별 위치 업데이트
            starGraphics.forEach((data, i) => {
                const newAngle = data.baseAngle + progress * Math.PI * 2;
                data.star.x = Math.cos(newAngle) * data.radius;
                data.star.y = Math.sin(newAngle) * data.radius;
                
                // 스케일 (처음에 커졌다가 유지, 마지막에 작아짐)
                let scale = 1;
                if (progress < 0.1) {
                    scale = progress * 10;
                } else if (progress > 0.8) {
                    scale = 1 - (progress - 0.8) * 5;
                }
                data.star.scale.set(scale);
                data.star.alpha = scale;
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                destroyed = true;
                container.destroy({ children: true });
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 브레이크 화면 플래시
    // ==========================================
    createBreakFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255, 200, 50, 0.6), transparent 70%);
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(flash);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out",
                onComplete: () => flash.remove()
            });
        } else {
            setTimeout(() => flash.remove(), 300);
        }
    },
    
    // ==========================================
    // 인텐트 깨지는 파편 효과
    // ==========================================
    createIntentShatterEffect(x, y, rect) {
        const width = rect?.width || 80;
        const height = rect?.height || 40;
        
        // 인텐트 모양의 파편들 생성
        const shardColors = ['#dc2626', '#ef4444', '#f87171', '#fbbf24', '#ffffff'];
        const shardCount = 15;
        
        for (let i = 0; i < shardCount; i++) {
            const shard = document.createElement('div');
            const size = 6 + Math.random() * 12;
            const color = shardColors[Math.floor(Math.random() * shardColors.length)];
            
            // 파편 시작 위치 (인텐트 영역 내 랜덤)
            const startX = x + (Math.random() - 0.5) * width;
            const startY = y + (Math.random() - 0.5) * height;
            
            // 날아갈 방향
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 80;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance + 30; // 약간 아래로
            
            // 회전
            const rotation = Math.random() * 720 - 360;
            
            shard.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: ${color};
                clip-path: polygon(${Math.random() * 30}% 0%, ${70 + Math.random() * 30}% 0%, 100% ${50 + Math.random() * 50}%, ${60 + Math.random() * 40}% 100%, 0% ${70 + Math.random() * 30}%);
                z-index: 2001;
                pointer-events: none;
                box-shadow: 0 0 ${size/2}px ${color};
                opacity: 1;
            `;
            document.body.appendChild(shard);
            
            // 애니메이션
            const duration = 400 + Math.random() * 300;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 이징 (ease-out)
                const eased = 1 - Math.pow(1 - progress, 3);
                
                const currentX = startX + (endX - startX) * eased;
                const currentY = startY + (endY - startY) * eased + progress * progress * 50; // 중력
                const currentRotation = rotation * eased;
                const currentOpacity = 1 - progress;
                const currentScale = 1 - progress * 0.5;
                
                shard.style.left = `${currentX}px`;
                shard.style.top = `${currentY}px`;
                shard.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg) scale(${currentScale})`;
                shard.style.opacity = currentOpacity;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    shard.remove();
                }
            };
            
            // 약간의 딜레이 후 시작
            setTimeout(() => requestAnimationFrame(animate), Math.random() * 50);
        }
        
        // 균열 효과 (중앙에서 퍼져나가는 선)
        this.createCrackEffect(x, y);
    },
    
    // ==========================================
    // 균열 효과
    // ==========================================
    createCrackEffect(x, y) {
        const crackCount = 6;
        
        for (let i = 0; i < crackCount; i++) {
            const crack = document.createElement('div');
            const angle = (i / crackCount) * Math.PI * 2 + Math.random() * 0.3;
            const length = 30 + Math.random() * 40;
            
            crack.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${length}px;
                height: 2px;
                background: linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(251,191,36,0.8) 50%, transparent 100%);
                transform-origin: left center;
                transform: rotate(${angle}rad) scaleX(0);
                z-index: 2000;
                pointer-events: none;
                box-shadow: 0 0 8px rgba(251, 191, 36, 0.8);
            `;
            document.body.appendChild(crack);
            
            // 균열 확장 애니메이션
            requestAnimationFrame(() => {
                crack.style.transition = 'transform 0.15s ease-out, opacity 0.3s ease-out';
                crack.style.transform = `rotate(${angle}rad) scaleX(1)`;
            });
            
            // 페이드 아웃
            setTimeout(() => {
                crack.style.opacity = '0';
            }, 150);
            
            // 제거
            setTimeout(() => crack.remove(), 450);
        }
    },
    
    // ==========================================
    // 파편 효과
    // ==========================================
    createShatterParticles(x, y) {
        const colors = ['#fbbf24', '#f59e0b', '#ffffff', '#fcd34d'];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 60 + Math.random() * 40;
            const size = 8 + Math.random() * 8;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${colors[i % colors.length]};
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
                z-index: 2001;
                pointer-events: none;
                animation: shatterParticle 0.6s ease-out forwards;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 600);
        }
    },
    
    // ==========================================
    // CSS 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('break-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'break-system-styles';
        style.textContent = `
            /* ==========================================
               위험 인텐트 통합 스타일 (심플)
               ========================================== */
            .enemy-intent-display.danger-intent {
                flex-direction: column !important;
                padding: 0 !important;
                gap: 0 !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }
            
            /* 기존 intent-attack 스타일 무시하고 통합 */
            .enemy-intent-display.danger-intent .intent-attack,
            .enemy-intent-display.danger-intent .intent-defend,
            .enemy-intent-display.danger-intent .intent-buff {
                background: none !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            /* 통합 인텐트 박스 */
            .intent-inner {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                padding: 3px 8px;
                background: linear-gradient(180deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.98) 100%);
                border: 1px solid #dc2626;
                border-radius: 4px;
                font-size: 0.8rem;
                color: #fef3c7;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            }
            
            .intent-text {
                display: inline;
            }
            
            /* 위험 아이콘 */
            .danger-icon {
                color: #fbbf24;
                font-size: 0.75em;
            }
            
            /* 브레이크 게이지 바 (인텐트 하단에 붙음) */
            .break-gauge-bar {
                position: relative;
                z-index: 30;
                width: 100%;
                height: 4px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 0 0 3px 3px;
                overflow: hidden;
                margin-top: -1px;
                border: 1px solid rgba(251, 191, 36, 0.5);
                border-top: none;
            }
            
            .break-gauge-bar .break-gauge-fill {
                height: 100%;
                background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
                transition: width 0.3s ease;
                box-shadow: 0 0 6px rgba(251, 191, 36, 0.8);
                animation: gaugeGlow 1.5s ease-in-out infinite;
            }
            
            @keyframes gaugeGlow {
                0%, 100% { box-shadow: 0 0 4px rgba(251, 191, 36, 0.6); }
                50% { box-shadow: 0 0 8px rgba(251, 191, 36, 1); }
            }
            
            /* 인텐트 숨김 상태 */
            .enemy-intent-display.intent-hidden {
                opacity: 0;
                transform: translateX(-50%) scale(0.5);
                pointer-events: none;
            }
            
            /* 인텐트 공개 애니메이션 */
            .enemy-intent-display.intent-reveal {
                animation: intentReveal 0.4s ease-out forwards;
            }
            
            @keyframes intentReveal {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) scale(0.5) translateY(10px);
                }
                60% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1.1) translateY(-5px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1) translateY(0);
                }
            }
            
            /* BREAK 상태 인텐트 - 완전히 숨김 */
            .enemy-intent-display.is-broken {
                display: none !important;
            }
            
            /* 인텐트 깨지는 애니메이션 */
            .enemy-intent-display.intent-shattering {
                animation: intentShatter 0.4s ease-out forwards;
            }
            
            @keyframes intentShatter {
                0% {
                    transform: translateX(-50%) scale(1);
                    filter: brightness(1);
                }
                10% {
                    transform: translateX(-50%) scale(1.1);
                    filter: brightness(2);
                }
                20% {
                    transform: translateX(-48%) scale(1.05);
                }
                30% {
                    transform: translateX(-52%) scale(1.05);
                }
                40% {
                    transform: translateX(-50%) scale(1.1);
                    filter: brightness(3);
                }
                50% {
                    transform: translateX(-50%) scale(0.9);
                    opacity: 0.8;
                }
                100% {
                    transform: translateX(-50%) scale(0);
                    opacity: 0;
                    filter: brightness(5);
                }
            }
            
            /* 브레이크된 몬스터 - 스턴 상태! */
            .enemy-unit.enemy-broken .enemy-sprite-img {
                filter: 
                    drop-shadow(1px 0 0 rgba(255, 200, 50, 0.9))
                    drop-shadow(-1px 0 0 rgba(255, 200, 50, 0.9))
                    drop-shadow(0 1px 0 rgba(255, 200, 50, 0.9))
                    drop-shadow(0 -1px 0 rgba(255, 200, 50, 0.9))
                    drop-shadow(0 0 12px rgba(255, 200, 50, 0.6))
                    grayscale(0.8) brightness(0.5) !important;
                animation: brokenStun 0.15s ease-in-out infinite;
            }
            
            @keyframes brokenStun {
                0%, 100% { 
                    transform: translateX(0) rotate(0deg); 
                }
                25% { 
                    transform: translateX(-3px) rotate(-1deg); 
                }
                75% { 
                    transform: translateX(3px) rotate(1deg); 
                }
            }
            
            /* 스턴 상태 배경 효과 */
            .enemy-unit.enemy-broken::after {
                content: '';
                position: absolute;
                inset: -10px;
                background: radial-gradient(ellipse at center, 
                    rgba(255, 200, 50, 0.15) 0%, 
                    transparent 70%);
                animation: stunPulse 1s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
                border-radius: 50%;
            }
            
            @keyframes stunPulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 0.5;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.8;
                }
            }
            
            /* 브레이크 이펙트 텍스트 - 더 극적으로! */
            .break-effect-text {
                font-family: 'Cinzel', serif;
                font-size: 4rem;
                font-weight: 900;
                color: #fbbf24;
                background: linear-gradient(180deg, #fef3c7 0%, #f59e0b 50%, #dc2626 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: none;
                filter: 
                    drop-shadow(0 0 10px rgba(251, 191, 36, 1))
                    drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))
                    drop-shadow(0 0 40px rgba(239, 68, 68, 0.6))
                    drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.8));
                letter-spacing: 8px;
                animation: breakEffectAnim 1.5s ease-out forwards;
            }
            
            @keyframes breakEffectAnim {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(-15deg);
                    opacity: 0;
                    filter: 
                        drop-shadow(0 0 30px rgba(255, 255, 255, 1))
                        drop-shadow(0 0 60px rgba(251, 191, 36, 1));
                }
                15% {
                    transform: translate(-50%, -50%) scale(1.6) rotate(5deg);
                    opacity: 1;
                }
                30% {
                    transform: translate(-50%, -50%) scale(1.2) rotate(-3deg);
                }
                45% {
                    transform: translate(-50%, -50%) scale(1.1) rotate(1deg);
                }
                60% {
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(0.6) translateY(-40px);
                    opacity: 0;
                    filter: 
                        drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))
                        drop-shadow(0 0 20px rgba(239, 68, 68, 0.3));
                }
            }
            
            /* 레시피 팝업 */
            @keyframes recipePopup {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                30% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.3);
                }
                70% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -60%) scale(0.8);
                }
            }
            
            .recipe-check {
                color: #22c55e;
                text-shadow: 0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5);
            }
            
            .recipe-x {
                color: #6b7280;
                text-shadow: 0 0 10px rgba(107, 114, 128, 0.5);
            }
            
            /* 파편 효과 */
            @keyframes shatterParticle {
                0% {
                    transform: translate(-50%, -50%) rotate(0deg) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(360deg) scale(0);
                    opacity: 0;
                }
            }
            
            /* 위협 상태 몬스터 - 하얀 외곽선 + 붉은 글로우 */
            .enemy-unit.threat-active .enemy-sprite-img {
                filter: 
                    drop-shadow(1px 0 0 rgba(255, 255, 255, 0.85))
                    drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.85))
                    drop-shadow(0 1px 0 rgba(255, 255, 255, 0.85))
                    drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.85))
                    drop-shadow(0 0 12px rgba(239, 68, 68, 0.5));
            }
            
            /* 화면 위협 경고 (비활성) */
            .threat-warning-overlay {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    BreakSystem.init();
});

// 즉시 실행
if (document.readyState !== 'loading') {
    BreakSystem.init();
}

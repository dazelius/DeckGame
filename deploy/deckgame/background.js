// ==========================================
// Shadow Deck - 레이어드 배경 시스템
// ==========================================

const BackgroundSystem = {
    // 현재 배경 테마
    currentTheme: 'default',
    
    // 조명 효과 상태
    lightingActive: false,
    lightingElements: [],
    animationFrameId: null,
    
    // 배경 테마 프리셋
    themes: {
        // 기본 던전
        default: {
            sky: {
                gradient: 'linear-gradient(180deg, #0f0a19 0%, #19142a 50%, #231932 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(20, 15, 30, 0.8) 0%, transparent 30%),
                    linear-gradient(-90deg, rgba(20, 15, 30, 0.8) 0%, transparent 30%),
                    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(40, 30, 60, 0.3) 0%, transparent 70%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(25, 20, 35, 0.6) 10%, rgba(35, 28, 45, 0.8) 40%, rgba(20, 15, 30, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(75, 0, 130, 0.05)',
                accent: 'rgba(139, 0, 0, 0.05)'
            },
            particles: '#ffd700'
        },
        
        // 고블린 소굴
        goblinLair: {
            sky: {
                gradient: 'linear-gradient(180deg, #0a1210 0%, #142420 50%, #1a3028 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(15, 25, 20, 0.9) 0%, transparent 25%),
                    linear-gradient(-90deg, rgba(15, 25, 20, 0.9) 0%, transparent 25%),
                    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(30, 50, 40, 0.4) 0%, transparent 70%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(20, 35, 28, 0.7) 15%, rgba(28, 45, 35, 0.9) 50%, rgba(15, 25, 20, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(0, 80, 40, 0.08)',
                accent: 'rgba(100, 80, 0, 0.06)'
            },
            particles: '#7cfc00'
        },
        
        // 지하 감옥
        dungeon: {
            sky: {
                gradient: 'linear-gradient(180deg, #080810 0%, #101020 50%, #181830 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(20, 20, 35, 0.9) 0%, transparent 20%),
                    linear-gradient(-90deg, rgba(20, 20, 35, 0.9) 0%, transparent 20%),
                    radial-gradient(ellipse 60% 40% at 50% 50%, rgba(30, 30, 50, 0.4) 0%, transparent 60%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(25, 25, 40, 0.7) 15%, rgba(35, 35, 55, 0.9) 50%, rgba(15, 15, 25, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(50, 50, 100, 0.08)',
                accent: 'rgba(100, 50, 50, 0.05)'
            },
            particles: '#6495ed'
        },
        
        // 용암 동굴
        lavaCave: {
            sky: {
                gradient: 'linear-gradient(180deg, #150808 0%, #251515 50%, #352020 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(30, 15, 15, 0.9) 0%, transparent 25%),
                    linear-gradient(-90deg, rgba(30, 15, 15, 0.9) 0%, transparent 25%),
                    radial-gradient(ellipse 70% 50% at 50% 60%, rgba(60, 30, 20, 0.5) 0%, transparent 70%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(40, 20, 15, 0.7) 15%, rgba(50, 25, 20, 0.9) 50%, rgba(25, 12, 10, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(255, 100, 0, 0.1)',
                accent: 'rgba(255, 50, 0, 0.08)'
            },
            particles: '#ff6347'
        },
        
        // 얼음 동굴
        iceCave: {
            sky: {
                gradient: 'linear-gradient(180deg, #0a1520 0%, #152535 50%, #203545 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(20, 30, 40, 0.9) 0%, transparent 25%),
                    linear-gradient(-90deg, rgba(20, 30, 40, 0.9) 0%, transparent 25%),
                    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(40, 60, 80, 0.4) 0%, transparent 70%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(25, 40, 55, 0.7) 15%, rgba(35, 55, 75, 0.9) 50%, rgba(15, 25, 35, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(100, 200, 255, 0.08)',
                accent: 'rgba(150, 230, 255, 0.05)'
            },
            particles: '#87ceeb'
        },
        
        // 보스 방
        bossRoom: {
            sky: {
                gradient: 'linear-gradient(180deg, #100510 0%, #200820 50%, #301030 80%, transparent 100%)',
                image: null
            },
            wall: {
                gradient: `
                    linear-gradient(90deg, rgba(30, 10, 30, 0.9) 0%, transparent 20%),
                    linear-gradient(-90deg, rgba(30, 10, 30, 0.9) 0%, transparent 20%),
                    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(60, 20, 60, 0.5) 0%, transparent 70%)
                `,
                image: null
            },
            floor: {
                gradient: 'linear-gradient(180deg, transparent 0%, rgba(35, 15, 35, 0.7) 15%, rgba(50, 20, 50, 0.9) 50%, rgba(20, 8, 20, 1) 100%)',
                image: null
            },
            overlay: {
                color: 'rgba(150, 0, 150, 0.1)',
                accent: 'rgba(200, 0, 100, 0.08)'
            },
            particles: '#da70d6'
        }
    },
    
    // 스테이지 → 테마 매핑
    stageThemeMap: {
        'goblin_lair': 'goblinLair',
        'goblin': 'goblinLair',
        'undead_crypt': 'dungeon',
        'crypt': 'dungeon',
        'dragon_lair': 'lavaCave',
        'volcano': 'lavaCave',
        'ice_cave': 'iceCave',
        'frozen': 'iceCave',
        'boss': 'bossRoom'
    },
    
    // 초기화
    init() {
        console.log('[Background] 레이어드 배경 시스템 초기화');
        this.setTheme('default');
    },
    
    // 테마 적용 (오버레이 색상만 변경, 이미지는 고정)
    setTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.default;
        this.currentTheme = themeName;
        
        const overlayEl = document.querySelector('.bg-overlay');
        
        // 오버레이 색상만 적용 (이미지는 CSS에서 고정)
        if (overlayEl) {
            overlayEl.style.background = `
                linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, transparent 20%),
                linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, transparent 30%),
                radial-gradient(ellipse at 30% 30%, ${theme.overlay.accent} 0%, transparent 50%),
                radial-gradient(ellipse at 70% 40%, ${theme.overlay.color} 0%, transparent 50%)
            `;
        }
        
        // 파티클 색상
        this.updateParticleColor(theme.particles);
        
        console.log(`[Background] 테마 적용: ${themeName}`);
    },
    
    // 파티클 색상 업데이트
    updateParticleColor(color) {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(p => {
            p.style.background = color;
            p.style.boxShadow = `0 0 6px ${color}`;
        });
    },
    
    // 스테이지에 따라 테마 자동 설정
    setThemeByStage(stageName) {
        const themeName = this.stageThemeMap[stageName?.toLowerCase()] || 'default';
        this.setTheme(themeName);
    },
    
    // 커스텀 이미지로 배경 설정
    setCustomBackground(options = {}) {
        const {
            skyImage = null,
            wallImage = null,
            floorImage = null,
            overlayColor = null
        } = options;
        
        const skyEl = document.getElementById('bg-sky');
        const wallEl = document.getElementById('bg-wall');
        const floorEl = document.getElementById('bg-floor');
        
        if (skyImage && skyEl) {
            skyEl.style.backgroundImage = `url('${skyImage}')`;
            const overlay = skyEl.querySelector('.layer-gradient');
            if (overlay) overlay.style.opacity = '0.5';
        }
        
        if (wallImage && wallEl) {
            wallEl.style.backgroundImage = `url('${wallImage}')`;
            const overlay = wallEl.querySelector('.layer-gradient');
            if (overlay) overlay.style.opacity = '0.3';
        }
        
        if (floorImage && floorEl) {
            floorEl.style.backgroundImage = `url('${floorImage}')`;
            const overlay = floorEl.querySelector('.layer-gradient');
            if (overlay) overlay.style.opacity = '0.5';
        }
    },
    
    // 전환 애니메이션으로 테마 변경
    transitionToTheme(themeName, duration = 500) {
        const layers = document.querySelectorAll('.bg-layer');
        
        // 페이드 아웃
        layers.forEach(layer => {
            layer.style.transition = `opacity ${duration / 2}ms ease-out`;
            layer.style.opacity = '0';
        });
        
        // 테마 변경 후 페이드 인
        setTimeout(() => {
            this.setTheme(themeName);
            layers.forEach(layer => {
                layer.style.opacity = '1';
            });
        }, duration / 2);
        
        // 트랜지션 정리
        setTimeout(() => {
            layers.forEach(layer => {
                layer.style.transition = '';
            });
        }, duration);
    },
    
    // ==========================================
    // 고급 조명 & 날씨 효과 시스템
    // ==========================================
    
    // 조명 효과 시작
    startLighting() {
        if (this.lightingActive) return;
        this.lightingActive = true;
        
        const bgLayers = document.querySelector('.bg-layers');
        if (!bgLayers) return;
        
        // 조명 컨테이너 생성
        let lightContainer = document.getElementById('bg-lighting');
        if (!lightContainer) {
            lightContainer = document.createElement('div');
            lightContainer.id = 'bg-lighting';
            lightContainer.style.cssText = `
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            `;
            bgLayers.appendChild(lightContainer);
        }
        
        // 고급 효과 시작
        this.createVolumetricLight(lightContainer);
        this.createAtmosphericFog(lightContainer);
        this.createRain(lightContainer);
        this.createAmbientParticles(lightContainer);
        
        console.log('[Background] 고급 조명 효과 시작');
    },
    
    // 조명 효과 정지
    stopLighting() {
        this.lightingActive = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.rainInterval) {
            clearInterval(this.rainInterval);
            this.rainInterval = null;
        }
        
        const lightContainer = document.getElementById('bg-lighting');
        if (lightContainer) {
            lightContainer.remove();
        }
        
        this.lightingElements = [];
        console.log('[Background] 조명 효과 정지');
    },
    
    // ==========================================
    // 1. 볼류메트릭 라이트 (Volumetric Light)
    // ==========================================
    createVolumetricLight(container) {
        const volumetricContainer = document.createElement('div');
        volumetricContainer.className = 'volumetric-container';
        volumetricContainer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // SVG 필터로 고급 블러 효과
        const svgFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgFilter.style.cssText = 'position: absolute; width: 0; height: 0;';
        svgFilter.innerHTML = `
            <defs>
                <filter id="volumetric-blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0.1  0 1 0 0 0.08  0 0 1 0 0.05  0 0 0 1 0" />
                </filter>
                <filter id="glow-filter">
                    <feGaussianBlur stdDeviation="8" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
        `;
        container.appendChild(svgFilter);
        
        // 메인 광원 (상단 중앙)
        const mainLight = document.createElement('div');
        mainLight.className = 'volumetric-main';
        mainLight.style.cssText = `
            position: absolute;
            top: -10%;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 60%;
            background: 
                radial-gradient(ellipse 60% 40% at 50% 0%, 
                    rgba(255, 250, 240, 0.15) 0%, 
                    rgba(255, 245, 230, 0.08) 30%,
                    rgba(255, 240, 220, 0.03) 60%,
                    transparent 80%);
            filter: url(#volumetric-blur);
            animation: volumetricPulse 8s ease-in-out infinite;
        `;
        
        // 빛 기둥들 (God Rays 개선)
        for (let i = 0; i < 5; i++) {
            const beam = document.createElement('div');
            beam.className = 'light-beam';
            
            const xPos = 15 + i * 18;
            const width = 60 + Math.random() * 80;
            const angle = -20 + i * 8 + Math.random() * 5;
            const delay = i * 1.5;
            
            beam.style.cssText = `
                position: absolute;
                top: 0;
                left: ${xPos}%;
                width: ${width}px;
                height: 100%;
                background: linear-gradient(180deg,
                    rgba(255, 252, 245, 0.12) 0%,
                    rgba(255, 250, 240, 0.06) 20%,
                    rgba(255, 248, 235, 0.02) 50%,
                    transparent 80%
                );
                transform: skewX(${angle}deg);
                transform-origin: top center;
                opacity: 0;
                animation: beamFade 12s ease-in-out ${delay}s infinite;
                filter: blur(8px);
            `;
            
            volumetricContainer.appendChild(beam);
        }
        
        volumetricContainer.appendChild(mainLight);
        container.appendChild(volumetricContainer);
        this.lightingElements.push(volumetricContainer);
    },
    
    // ==========================================
    // 2. 대기 안개 효과 (Atmospheric Fog)
    // ==========================================
    createAtmosphericFog(container) {
        const fogContainer = document.createElement('div');
        fogContainer.className = 'fog-container';
        fogContainer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // 다층 안개 레이어
        for (let i = 0; i < 3; i++) {
            const fogLayer = document.createElement('div');
            fogLayer.className = `fog-layer fog-layer-${i}`;
            
            const yPos = 40 + i * 20;
            const opacity = 0.15 - i * 0.03;
            const duration = 60 + i * 20;
            const direction = i % 2 === 0 ? 1 : -1;
            
            fogLayer.style.cssText = `
                position: absolute;
                top: ${yPos}%;
                left: -50%;
                width: 200%;
                height: 30%;
                background: 
                    radial-gradient(ellipse 30% 100% at 20% 50%, rgba(180, 190, 200, ${opacity}) 0%, transparent 70%),
                    radial-gradient(ellipse 25% 80% at 50% 50%, rgba(170, 180, 195, ${opacity * 0.8}) 0%, transparent 60%),
                    radial-gradient(ellipse 35% 90% at 80% 50%, rgba(175, 185, 200, ${opacity * 0.9}) 0%, transparent 65%);
                filter: blur(30px);
                animation: fogDrift ${duration}s linear infinite;
                --direction: ${direction};
            `;
            
            fogContainer.appendChild(fogLayer);
        }
        
        // 바닥 안개 (더 진한)
        const groundFog = document.createElement('div');
        groundFog.className = 'ground-fog';
        groundFog.style.cssText = `
            position: absolute;
            bottom: 0;
            left: -20%;
            width: 140%;
            height: 25%;
            background: linear-gradient(0deg,
                rgba(160, 170, 185, 0.25) 0%,
                rgba(170, 180, 195, 0.15) 30%,
                rgba(180, 190, 200, 0.05) 60%,
                transparent 100%
            );
            filter: blur(15px);
            animation: groundFogPulse 10s ease-in-out infinite;
        `;
        
        fogContainer.appendChild(groundFog);
        container.appendChild(fogContainer);
        this.lightingElements.push(fogContainer);
    },
    
    // ==========================================
    // 3. 비 효과 (Rain System)
    // ==========================================
    createRain(container) {
        const rainContainer = document.createElement('div');
        rainContainer.className = 'rain-container';
        rainContainer.id = 'rain-container';
        rainContainer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // 빗방울 풀 (재사용)
        this.rainDropPool = [];
        this.activeRainDrops = [];
        
        // 물웅덩이 반사 효과
        const puddles = document.createElement('div');
        puddles.className = 'rain-puddles';
        puddles.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 15%;
            background: linear-gradient(0deg,
                rgba(100, 120, 150, 0.1) 0%,
                transparent 100%
            );
            animation: puddleRipple 3s ease-in-out infinite;
        `;
        
        rainContainer.appendChild(puddles);
        container.appendChild(rainContainer);
        this.lightingElements.push(rainContainer);
        
        // 비 생성 루프
        this.startRainLoop(rainContainer);
    },
    
    startRainLoop(container) {
        const createRaindrop = () => {
            if (!this.lightingActive) return;
            
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            
            const x = Math.random() * 120 - 10; // -10% to 110%
            const duration = 0.4 + Math.random() * 0.3;
            const width = 1 + Math.random() * 1.5;
            const height = 15 + Math.random() * 25;
            const opacity = 0.3 + Math.random() * 0.4;
            const angle = -5 + Math.random() * 2; // 약간 기울기
            
            drop.style.cssText = `
                position: absolute;
                top: -5%;
                left: ${x}%;
                width: ${width}px;
                height: ${height}px;
                background: linear-gradient(180deg,
                    transparent 0%,
                    rgba(180, 200, 220, ${opacity * 0.3}) 20%,
                    rgba(200, 215, 230, ${opacity}) 80%,
                    rgba(220, 230, 240, ${opacity * 0.5}) 100%
                );
                border-radius: 50% 50% 50% 50% / 0% 0% 100% 100%;
                transform: rotate(${angle}deg);
                animation: rainFall ${duration}s linear forwards;
                filter: blur(0.5px);
            `;
            
            container.appendChild(drop);
            
            // 바닥에 닿으면 스플래시
            setTimeout(() => {
                this.createRainSplash(container, x);
                drop.remove();
            }, duration * 1000);
        };
        
        // 동시에 여러 빗방울 생성
        this.rainInterval = setInterval(() => {
            if (!this.lightingActive) return;
            const dropCount = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < dropCount; i++) {
                setTimeout(createRaindrop, i * 30);
            }
        }, 50);
    },
    
    createRainSplash(container, x) {
        const splash = document.createElement('div');
        splash.className = 'rain-splash';
        splash.style.cssText = `
            position: absolute;
            bottom: 12%;
            left: ${x}%;
            width: 8px;
            height: 4px;
            transform: translateX(-50%);
        `;
        
        // 스플래시 파티클들
        for (let i = 0; i < 4; i++) {
            const particle = document.createElement('div');
            const angle = -60 + i * 40;
            const distance = 3 + Math.random() * 5;
            
            particle.style.cssText = `
                position: absolute;
                left: 50%;
                bottom: 0;
                width: 2px;
                height: 2px;
                background: rgba(200, 215, 230, 0.6);
                border-radius: 50%;
                animation: splashParticle 0.3s ease-out forwards;
                --angle: ${angle}deg;
                --distance: ${distance}px;
            `;
            
            splash.appendChild(particle);
        }
        
        container.appendChild(splash);
        setTimeout(() => splash.remove(), 300);
    },
    
    // ==========================================
    // 4. 분위기 파티클 (Ambient Particles)
    // ==========================================
    createAmbientParticles(container) {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'ambient-particles';
        particleContainer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // 부유하는 빛 파티클
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'ambient-particle';
            
            const size = 2 + Math.random() * 4;
            const x = Math.random() * 100;
            const y = 20 + Math.random() * 60;
            const duration = 20 + Math.random() * 30;
            const delay = Math.random() * 20;
            const driftX = -50 + Math.random() * 100;
            const driftY = -30 + Math.random() * 60;
            
            particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle,
                    rgba(255, 250, 240, 0.8) 0%,
                    rgba(255, 248, 235, 0.4) 40%,
                    transparent 70%
                );
                border-radius: 50%;
                filter: blur(1px);
                opacity: 0;
                animation: ambientFloat ${duration}s ease-in-out ${delay}s infinite;
                --drift-x: ${driftX}px;
                --drift-y: ${driftY}px;
            `;
            
            particleContainer.appendChild(particle);
        }
        
        container.appendChild(particleContainer);
        this.lightingElements.push(particleContainer);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectLightingStyles() {
        if (document.getElementById('bg-lighting-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bg-lighting-styles';
        style.textContent = `
            /* 볼류메트릭 라이트 펄스 */
            @keyframes volumetricPulse {
                0%, 100% { 
                    opacity: 0.8;
                    transform: translateX(-50%) scale(1);
                }
                50% { 
                    opacity: 1;
                    transform: translateX(-50%) scale(1.05);
                }
            }
            
            /* 빛 기둥 페이드 */
            @keyframes beamFade {
                0%, 100% { opacity: 0; }
                15% { opacity: 0.8; }
                50% { opacity: 0.5; }
                85% { opacity: 0.7; }
            }
            
            /* 안개 드리프트 */
            @keyframes fogDrift {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(var(--direction) * 50%)); }
            }
            
            /* 바닥 안개 펄스 */
            @keyframes groundFogPulse {
                0%, 100% { 
                    opacity: 0.8;
                    transform: translateY(0);
                }
                50% { 
                    opacity: 1;
                    transform: translateY(-5px);
                }
            }
            
            /* 빗방울 낙하 */
            @keyframes rainFall {
                0% {
                    top: -5%;
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    top: 88%;
                    opacity: 0;
                }
            }
            
            /* 물웅덩이 파문 */
            @keyframes puddleRipple {
                0%, 100% { 
                    opacity: 0.7;
                }
                50% { 
                    opacity: 1;
                }
            }
            
            /* 스플래시 파티클 */
            @keyframes splashParticle {
                0% {
                    transform: translate(-50%, 0) rotate(var(--angle));
                    opacity: 1;
                }
                100% {
                    transform: translate(
                        calc(-50% + cos(var(--angle)) * var(--distance)),
                        calc(-1 * sin(var(--angle)) * var(--distance) - 5px)
                    );
                    opacity: 0;
                }
            }
            
            /* 분위기 파티클 부유 */
            @keyframes ambientFloat {
                0%, 100% {
                    opacity: 0;
                    transform: translate(0, 0);
                }
                20% {
                    opacity: 0.6;
                }
                50% {
                    opacity: 0.8;
                    transform: translate(var(--drift-x), var(--drift-y));
                }
                80% {
                    opacity: 0.4;
                }
            }
            
            /* 빗방울 흔들림 */
            .raindrop {
                will-change: transform, top;
            }
            
            /* 안개 레이어 블렌딩 */
            .fog-layer {
                mix-blend-mode: screen;
                will-change: transform;
            }
            
            /* 볼류메트릭 라이트 블렌딩 */
            .volumetric-container {
                mix-blend-mode: screen;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.BackgroundSystem = BackgroundSystem;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    BackgroundSystem.init();
    BackgroundSystem.injectLightingStyles();
    // 조명 효과 자동 시작
    setTimeout(() => {
        BackgroundSystem.startLighting();
    }, 500);
});


// ==========================================
// Shadow Deck - 3D 던전 배경
// ==========================================

const Background3D = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    dungeonGroup: null,
    
    mouse: { x: 0, y: 0 },
    targetMouse: { x: 0, y: 0 },
    
    isInitialized: false,
    animationId: null,
    torches: [],
    
    config: {
        mouseX: 2.0,
        mouseY: 1.0,
        smoothing: 0.05
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    async init() {
        if (this.isInitialized) {
            console.log('[Background3D] 이미 초기화됨');
            return true;
        }
        
        console.log('[Background3D] 초기화 시작...');
        
        // Three.js 로드
        if (typeof THREE === 'undefined') {
            try {
                await this.loadThreeJS();
                console.log('[Background3D] Three.js 로드 완료');
            } catch (e) {
                console.error('[Background3D] Three.js 로드 실패:', e);
                return false;
            }
        }
        
        if (typeof THREE === 'undefined') {
            console.error('[Background3D] THREE 객체 없음');
            return false;
        }
        
        try {
            this.createContainer();
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.createDungeon();
            this.setupEvents();
            
            this.isInitialized = true;
            this.animate();
            
            console.log('[Background3D] 초기화 완료!');
            return true;
        } catch (e) {
            console.error('[Background3D] 초기화 오류:', e);
            return false;
        }
    },
    
    // Three.js CDN 로드
    loadThreeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 컨테이너 생성
    createContainer() {
        const old = document.getElementById('bg3d');
        if (old) old.remove();
        
        this.container = document.createElement('div');
        this.container.id = 'bg3d';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
        `;
        document.body.insertBefore(this.container, document.body.firstChild);
        console.log('[Background3D] 컨테이너 생성됨');
    },
    
    // Scene 설정 (어두운 던전)
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.022);
        console.log('[Background3D] Scene 생성됨');
    },
    
    // Camera 설정
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 4, 15);
        this.camera.lookAt(0, 3, 0);
        console.log('[Background3D] Camera 생성됨');
    },
    
    // Renderer 설정
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        console.log('[Background3D] Renderer 생성됨');
    },
    
    // ==========================================
    // 던전 생성
    // ==========================================
    createDungeon() {
        this.dungeonGroup = new THREE.Group();
        this.scene.add(this.dungeonGroup);
        
        // 조명 (어두운 던전 - 벽면 살짝 보임)
        // 환경광 - 벽면이 보일 정도
        const ambient = new THREE.AmbientLight(0x202030, 0.35);
        this.scene.add(ambient);
        
        // 약한 상단 조명 (벽면 윤곽용)
        const topLight = new THREE.DirectionalLight(0x303040, 0.2);
        topLight.position.set(0, 20, 0);
        this.scene.add(topLight);
        
        // 텍스처 로드 후 던전 요소 생성
        this.loadTexturesAndBuild();
        
        // 기둥 (단색)
        this.addPillars();
        
        // 횃불
        this.addTorches();
        
        // 전경 레이어 (잔해물)
        this.addForeground();
        
        console.log('[Background3D] 던전 생성 완료');
    },
    
    // 전경 레이어 (별도 캔버스 - 캐릭터 위에 렌더링)
    addForeground() {
        // 전경용 별도 씬, 카메라, 렌더러 생성
        this.foreScene = new THREE.Scene();
        this.foreCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
        this.foreCamera.position.copy(this.camera.position);
        this.foreCamera.lookAt(0, 3, 0);
        
        // 전경용 렌더러 (별도 캔버스) - game-container 안에 추가
        // battle-arena(5) < 전경(50) < bottom-area(500)
        this.foreRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.foreRenderer.setSize(window.innerWidth, window.innerHeight);
        this.foreRenderer.domElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
        `;
        // game-container에 추가 (같은 stacking context)
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.foreRenderer.domElement);
        } else {
            document.body.appendChild(this.foreRenderer.domElement);
        }
        
        // 텍스처 로드
        const foreImg = new Image();
        foreImg.src = 'texture/dungeon_fore.png';
        
        foreImg.onload = () => {
            console.log('[Background3D] 전경 텍스처 로드 성공:', foreImg.width, 'x', foreImg.height);
            
            const tex = new THREE.CanvasTexture(foreImg);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            
            // 이미지 비율 계산 - 크기 키움
            const aspect = foreImg.width / foreImg.height;
            const width = 35;  // 크기 키움
            const height = width / aspect;
            
            // 전경 메시 생성
            const foreMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    side: THREE.DoubleSide
                })
            );
            
            // 화면 하단에 배치 - 더 아래로
            foreMesh.position.set(0, height/2 - 5, 6);
            
            this.foreScene.add(foreMesh);
            this.foreMesh = foreMesh;
            console.log('[Background3D] 전경 메시 추가됨 (별도 레이어) - 크기:', width, 'x', height);
        };
        
        foreImg.onerror = () => {
            console.log('[Background3D] 전경 텍스처 로드 실패 (texture/dungeon_fore.png)');
        };
    },
    
    // 텍스처 로드 및 적용 (1:1 이미지만)
    loadTexturesAndBuild() {
        // 기본 바닥 먼저 깔기 (전체 영역)
        const baseFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
        );
        baseFloor.rotation.x = -Math.PI / 2;
        baseFloor.position.set(0, -0.05, 0);
        this.dungeonGroup.add(baseFloor);
        
        // bg-floor.png - 바닥 텍스처 (2x2 타일링)
        const bgFloorImg = new Image();
        bgFloorImg.src = 'bg-floor.png';
        bgFloorImg.onload = () => {
            console.log('[Background3D] bg-floor 로드 성공 - 크기:', bgFloorImg.width, 'x', bgFloorImg.height);
            const tex = new THREE.CanvasTexture(bgFloorImg);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);  // 2x2 타일링
            
            const bgFloor = new THREE.Mesh(
                new THREE.PlaneGeometry(120, 120),
                new THREE.MeshBasicMaterial({ 
                    map: tex, 
                    transparent: true,
                    fog: false
                })
            );
            bgFloor.rotation.x = -Math.PI / 2;
            bgFloor.position.set(0, 0.01, 0);
            this.dungeonGroup.add(bgFloor);
            console.log('[Background3D] bg-floor 2x2 타일링 적용');
        };
        bgFloorImg.onerror = () => {
            console.log('[Background3D] bg-floor.png 로드 실패');
        };
        
        // bg-wall.png - 벽 (1:1, 뒷벽/좌벽/우벽 모두)
        const bgWallImg = new Image();
        bgWallImg.src = 'bg-wall.png';
        bgWallImg.onload = () => {
            console.log('[Background3D] bg-wall 로드 성공');
            const tex = new THREE.CanvasTexture(bgWallImg);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            
            const aspect = bgWallImg.width / bgWallImg.height;
            const width = 80;
            const height = width / aspect;
            
            const wallMat = new THREE.MeshBasicMaterial({ 
                map: tex, 
                transparent: true,
                side: THREE.DoubleSide,
                fog: false
            });
            
            // 뒷벽
            const backWall = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                wallMat
            );
            backWall.position.set(0, height / 2, -30);
            this.dungeonGroup.add(backWall);
            
            // 좌벽 (별도 텍스처 클론)
            const leftTex = new THREE.CanvasTexture(bgWallImg);
            leftTex.magFilter = THREE.NearestFilter;
            leftTex.minFilter = THREE.NearestFilter;
            const leftWall = new THREE.Mesh(
                new THREE.PlaneGeometry(60, height),
                new THREE.MeshBasicMaterial({ 
                    map: leftTex, 
                    transparent: true,
                    side: THREE.DoubleSide,
                    fog: false
                })
            );
            leftWall.position.set(-40, height / 2, 0);
            leftWall.rotation.y = Math.PI / 2;
            this.dungeonGroup.add(leftWall);
            
            // 우벽 (별도 텍스처 클론)
            const rightTex = new THREE.CanvasTexture(bgWallImg);
            rightTex.magFilter = THREE.NearestFilter;
            rightTex.minFilter = THREE.NearestFilter;
            const rightWall = new THREE.Mesh(
                new THREE.PlaneGeometry(60, height),
                new THREE.MeshBasicMaterial({ 
                    map: rightTex, 
                    transparent: true,
                    side: THREE.DoubleSide,
                    fog: false
                })
            );
            rightWall.position.set(40, height / 2, 0);
            rightWall.rotation.y = -Math.PI / 2;
            this.dungeonGroup.add(rightWall);
        };
        bgWallImg.onerror = () => {
            console.log('[Background3D] bg-wall.png 없음, 단색 벽 사용');
            const wallMat = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a28, 
                side: THREE.DoubleSide,
                roughness: 0.9
            });
            
            // 뒷벽
            const backWall = new THREE.Mesh(new THREE.PlaneGeometry(80, 25), wallMat);
            backWall.position.set(0, 12.5, -30);
            this.dungeonGroup.add(backWall);
            
            // 좌벽
            const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 25), wallMat);
            leftWall.position.set(-40, 12.5, 0);
            leftWall.rotation.y = Math.PI / 2;
            this.dungeonGroup.add(leftWall);
            
            // 우벽
            const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 25), wallMat);
            rightWall.position.set(40, 12.5, 0);
            rightWall.rotation.y = -Math.PI / 2;
            this.dungeonGroup.add(rightWall);
        };
        
        // 천장 (단색)
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 60),
            new THREE.MeshStandardMaterial({ color: 0x050508, side: THREE.DoubleSide, roughness: 1.0 })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 25, 0);
        this.dungeonGroup.add(ceiling);
    },
    
    // 기둥 (조명 반응)
    addPillars() {
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x151520, roughness: 0.85 });
        const positions = [
            [-30, 12.5, -20],
            [30, 12.5, -20],
            [-30, 12.5, 5],
            [30, 12.5, 5]
        ];
        
        positions.forEach(pos => {
            const pillar = new THREE.Mesh(
                new THREE.BoxGeometry(3, 25, 3),
                pillarMat
            );
            pillar.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(pillar);
        });
    },
    
    // 횃불 (어둠 속 유일한 빛)
    addTorches() {
        const positions = [
            [-25, 6, -25],
            [25, 6, -25],
            [-35, 6, -5],
            [35, 6, -5]
        ];
        
        positions.forEach((pos, i) => {
            // 메인 포인트 라이트 (강하게, 좁은 범위)
            const light = new THREE.PointLight(0xff4400, 3.0, 20);
            light.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(light);
            
            // 보조 빛 (더 넓게 퍼지는 약한 빛)
            const ambientLight = new THREE.PointLight(0xff2200, 1.0, 35);
            ambientLight.position.set(pos[0], pos[1] + 1, pos[2]);
            this.dungeonGroup.add(ambientLight);
            
            // 횃불 거치대
            const holderMat = new THREE.MeshBasicMaterial({ color: 0x1a1a20 });
            const holder = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6),
                holderMat
            );
            holder.position.set(pos[0], pos[1] - 0.7, pos[2]);
            this.dungeonGroup.add(holder);
            
            // 불꽃 코어
            const flameMat = new THREE.MeshBasicMaterial({ 
                color: 0xffaa00,
                transparent: true,
                opacity: 1.0
            });
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 8, 8),
                flameMat
            );
            flame.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(flame);
            
            // 불꽃 글로우
            const glowMat = new THREE.MeshBasicMaterial({ 
                color: 0xff5500,
                transparent: true,
                opacity: 0.5
            });
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                glowMat
            );
            glow.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(glow);
            
            this.torches.push({
                light: light,
                ambientLight: ambientLight,
                flame: flame,
                glow: glow,
                baseIntensity: 3.0,
                phase: i * 1.5
            });
        });
    },
    
    // ==========================================
    // 이벤트
    // ==========================================
    setupEvents() {
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        });
        
        window.addEventListener('resize', () => {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    },
    
    // ==========================================
    // 애니메이션
    // ==========================================
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const t = performance.now() * 0.001;
        
        // 마우스 스무딩
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.config.smoothing;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.config.smoothing;
        
        // 카메라 패럴랙스
        this.camera.position.x = this.mouse.x * this.config.mouseX;
        this.camera.position.y = 4 + this.mouse.y * this.config.mouseY * 0.5;
        this.camera.lookAt(this.mouse.x * 0.5, 3, -5);
        
        // 횃불 깜빡임 (어둠 속에서 강조)
        this.torches.forEach(torch => {
            const flicker = Math.sin(t * 8 + torch.phase) * 0.6 + 
                           Math.sin(t * 13 + torch.phase * 2) * 0.3 +
                           Math.random() * 0.3;
            
            // 메인 라이트
            torch.light.intensity = torch.baseIntensity + flicker;
            
            // 보조 라이트
            if (torch.ambientLight) {
                torch.ambientLight.intensity = 0.8 + flicker * 0.3;
            }
            
            // 불꽃 크기
            torch.flame.scale.setScalar(1 + flicker * 0.25);
            
            // 글로우 크기
            if (torch.glow) {
                torch.glow.scale.setScalar(1 + flicker * 0.4);
                torch.glow.material.opacity = 0.3 + flicker * 0.15;
            }
        });
        
        // 게임 요소 3D 배치
        this.applyGameParallax();
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
        
        // 전경 렌더링 (별도 레이어)
        if (this.foreRenderer && this.foreScene && this.foreCamera) {
            // 전경 카메라도 메인 카메라와 동기화
            this.foreCamera.position.copy(this.camera.position);
            this.foreCamera.lookAt(this.camera.position.x * 0.5, 3, -5);
            this.foreRenderer.render(this.foreScene, this.foreCamera);
        }
    },
    
    // ==========================================
    // 🎯 완전한 슬롯 기반 위치 시스템
    // DOM 순서는 절대 바꾸지 않고, transform으로만 위치 관리
    // ==========================================
    
    // 3D 위치 설정값 (통일된 참조점)
    positions: {
        player: { z: 60 },
        enemy: { baseZ: -80, spacing: 20 },  // z = -80 - (index * 20)
        gimmick: { baseZ: -180, spacing: 30 } // z = -180 - (index * 30)
    },
    
    // 인덱스로 적의 3D Z 위치 계산
    getEnemyZ(index) {
        return this.positions.enemy.baseZ - (index * this.positions.enemy.spacing);
    },
    
    // 인덱스로 기믹의 3D Z 위치 계산
    getGimmickZ(index) {
        return this.positions.gimmick.baseZ - (index * this.positions.gimmick.spacing);
    },
    
    // ==========================================
    // 🎯 슬롯 위치 캐시 (DOM 기본 위치 저장)
    // ==========================================
    slotCache: {
        basePositions: [],  // 각 DOM 요소의 기본 X 위치
        initialized: false
    },
    
    /**
     * 슬롯 기본 위치 캐시 (처음 한 번만)
     * flexbox가 배치한 기본 위치를 저장해두고, 이를 기준으로 이동
     */
    cacheSlotPositions() {
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        if (enemyEls.length === 0) return;
        
        // 모든 transform 초기화 후 기본 위치 저장
        enemyEls.forEach(el => {
            gsap.set(el, { x: 0, y: 0, clearProps: 'x,y' });
            el.style.transform = '';
        });
        
        // 강제 리플로우
        container.offsetHeight;
        
        // 기본 위치 저장
        this.slotCache.basePositions = enemyEls.map(el => {
            const rect = el.getBoundingClientRect();
            return { left: rect.left, top: rect.top };
        });
        
        // 3D 깊이만 다시 적용
        enemyEls.forEach((el, i) => {
            el.dataset.slot = i;
            el.dataset.domIndex = i;
            el.style.transform = `translateZ(${this.getEnemyZ(i)}px)`;
            el.style.transformStyle = 'preserve-3d';
        });
        
        this.slotCache.initialized = true;
        console.log('[Background3D] 슬롯 위치 캐시됨:', this.slotCache.basePositions.length);
    },
    
    /**
     * 특정 슬롯의 X 위치 가져오기 (캐시된 기본 위치 기준)
     */
    getSlotX(slotIndex) {
        if (!this.slotCache.initialized || slotIndex >= this.slotCache.basePositions.length) {
            return 0;
        }
        return this.slotCache.basePositions[slotIndex]?.left || 0;
    },
    
    /**
     * 🚀 핵심 API: 적의 슬롯 변경 (DOM 재배치 없이!)
     * @param {HTMLElement} el - 적 DOM 요소
     * @param {number} toSlot - 목표 슬롯 인덱스
     * @param {number} duration - 애니메이션 시간
     * @returns {Promise}
     */
    moveToSlot(el, toSlot, duration = 0.3) {
        return new Promise((resolve) => {
            if (!el || !this.slotCache.initialized) {
                resolve();
                return;
            }
            
            const domIndex = parseInt(el.dataset.domIndex) || 0;
            const currentSlot = parseInt(el.dataset.slot) || domIndex;
            
            if (currentSlot === toSlot) {
                resolve();
                return;
            }
            
            // 내 DOM 기본 위치
            const myBase = this.slotCache.basePositions[domIndex];
            // 목표 슬롯의 위치
            const targetBase = this.slotCache.basePositions[toSlot];
            
            if (!myBase || !targetBase) {
                resolve();
                return;
            }
            
            // 필요한 X 오프셋 계산
            const targetX = targetBase.left - myBase.left;
            const targetZ = this.getEnemyZ(toSlot);
            
            // 슬롯 업데이트
            el.dataset.slot = toSlot;
            
            // GSAP 애니메이션
            gsap.to(el, {
                x: targetX,
                duration: duration,
                ease: 'power2.out',
                onUpdate: () => {
                    // 애니메이션 중에도 3D 깊이 적용
                    const currentX = gsap.getProperty(el, 'x');
                    el.style.transform = `translateX(${currentX}px) translateZ(${targetZ}px)`;
                },
                onComplete: () => {
                    el.style.transform = `translateX(${targetX}px) translateZ(${targetZ}px)`;
                    el.style.transformStyle = 'preserve-3d';
                    resolve();
                }
            });
        });
    },
    
    /**
     * 🚀 핵심 API: 두 적의 슬롯 교환 (DOM 재배치 없이!)
     * 후퇴/전진에서 사용
     */
    swapSlots(elA, elB, duration = 0.3) {
        return new Promise((resolve) => {
            if (!elA || !elB || !this.slotCache.initialized) {
                resolve();
                return;
            }
            
            const slotA = parseInt(elA.dataset.slot);
            const slotB = parseInt(elB.dataset.slot);
            
            // 동시에 이동
            Promise.all([
                this.moveToSlot(elA, slotB, duration),
                this.moveToSlot(elB, slotA, duration)
            ]).then(resolve);
        });
    },
    
    /**
     * 🚀 핵심 API: 사슬낫 스타일 끌어오기
     * 타겟을 슬롯 0으로, 나머지는 한 칸씩 밀림
     * gameState.enemies 배열은 호출자가 변경해야 함!
     */
    async pullToSlotZero(targetEl, allEnemyEls, duration = 0.25) {
        if (!targetEl || !this.slotCache.initialized) return;
        
        const targetDomIndex = parseInt(targetEl.dataset.domIndex) || 0;
        const targetCurrentSlot = parseInt(targetEl.dataset.slot) || targetDomIndex;
        
        if (targetCurrentSlot === 0) return;
        
        // 애니메이션 준비
        const promises = [];
        
        allEnemyEls.forEach(el => {
            const domIndex = parseInt(el.dataset.domIndex) || 0;
            const currentSlot = parseInt(el.dataset.slot) || domIndex;
            
            let newSlot;
            
            if (el === targetEl) {
                // 타겟 → 슬롯 0
                newSlot = 0;
            } else if (currentSlot < targetCurrentSlot) {
                // 타겟보다 앞에 있던 적 → 한 칸 뒤로
                newSlot = currentSlot + 1;
            } else {
                // 타겟보다 뒤에 있던 적 → 그대로
                return;
            }
            
            promises.push(this.moveToSlot(el, newSlot, duration));
        });
        
        await Promise.all(promises);
    },
    
    /**
     * 슬롯 초기화 (renderEnemies 후 호출)
     * DOM 순서 = 슬롯 순서로 리셋
     */
    resetEnemySlots() {
        const enemyEls = document.querySelectorAll('.enemy-unit');
        enemyEls.forEach((el, i) => {
            el.dataset.slot = i;
            el.dataset.domIndex = i;
            gsap.set(el, { x: 0, y: 0, clearProps: 'x,y' });
            el.style.transform = `translateZ(${this.getEnemyZ(i)}px)`;
            el.style.transformStyle = 'preserve-3d';
        });
        
        // 슬롯 위치도 다시 캐시
        this.cacheSlotPositions();
    },
    
    /**
     * 현재 슬롯 상태에서 적 요소 가져오기 (슬롯 순서대로)
     */
    getEnemyElsBySlot() {
        const enemyEls = Array.from(document.querySelectorAll('.enemy-unit'));
        return enemyEls.sort((a, b) => {
            const slotA = parseInt(a.dataset.slot) || 0;
            const slotB = parseInt(b.dataset.slot) || 0;
            return slotA - slotB;
        });
    },
    
    // 단일 적의 3D 위치 업데이트 (슬롯 기반!)
    updateEnemyPosition(el, slotIndex, animate = false, duration = 0.3) {
        if (!el) return;
        
        const z = this.getEnemyZ(slotIndex);
        el.style.transformStyle = 'preserve-3d';
        
        // ✅ 기존 X 오프셋 유지 (슬롯 위치)
        const currentX = gsap.getProperty(el, 'x') || 0;
        
        if (animate && typeof gsap !== 'undefined') {
            el.style.transition = `transform ${duration}s ease-out`;
            el.style.transform = `translateX(${currentX}px) translateZ(${z}px)`;
            setTimeout(() => {
                el.style.transition = '';
            }, duration * 1000);
        } else {
            el.style.transform = `translateX(${currentX}px) translateZ(${z}px)`;
        }
    },
    
    // 모든 적의 3D 위치 업데이트 (슬롯 기반!)
    updateAllEnemyPositions(animate = false, duration = 0.3) {
        const enemies = document.querySelectorAll('.enemy-unit');
        enemies.forEach((el) => {
            // ✅ 슬롯 인덱스 사용 (DOM 인덱스가 아님!)
            const slotIndex = parseInt(el.dataset.slot) || parseInt(el.dataset.index) || 0;
            this.updateEnemyPosition(el, slotIndex, animate, duration);
        });
    },
    
    // DOM 순서 기반 3D 위치 동기화 (FLIP 애니메이션 후 호출)
    syncEnemyPositions(container, oldRects, animate = true) {
        if (!container) return;
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        
        enemyEls.forEach((el, newIndex) => {
            // data-index 업데이트
            el.dataset.index = newIndex;
            
            // 3D 위치 적용
            const z = this.getEnemyZ(newIndex);
            el.style.transformStyle = 'preserve-3d';
            
            if (animate) {
                el.style.transition = 'transform 0.3s ease-out';
                el.style.transform = `translateZ(${z}px)`;
                setTimeout(() => {
                    el.style.transition = '';
                }, 300);
            } else {
                el.style.transform = `translateZ(${z}px)`;
            }
        });
    },
    
    // ==========================================
    // 게임 요소 3D 배치
    // ==========================================
    parallaxDisabled: false,  // 드래그 중 비활성화 플래그
    
    disableParallax() {
        this.parallaxDisabled = true;
    },
    
    enableParallax() {
        this.parallaxDisabled = false;
        // 재활성화 시 즉시 한번 적용
        this.applyGameParallax();
    },
    
    applyGameParallax() {
        const arena = document.querySelector('.battle-arena');
        if (!arena) return;
        
        // ✅ 드래그 중이면 3D 배치 건너뛰기 (filter가 3D를 깨트림)
        if (this.parallaxDisabled || arena.classList.contains('drag-in-progress')) {
            return;
        }
        
        // 전투 영역 3D 설정
        arena.style.perspective = '1000px';
        arena.style.perspectiveOrigin = '50% 60%';
        arena.style.transformStyle = 'preserve-3d';
        
        // 마우스에 따른 회전
        const rotateY = this.mouse.x * 6;
        const rotateX = -this.mouse.y * 3;
        arena.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        // 플레이어 (앞)
        const player = document.querySelector('#player');
        if (player) {
            player.style.transform = `translateZ(${this.positions.player.z}px)`;
            player.style.transformStyle = 'preserve-3d';
        }
        
        // 플레이어 사이드
        const playerSide = document.querySelector('.player-side');
        if (playerSide) {
            playerSide.style.transformStyle = 'preserve-3d';
        }
        
        // 몬스터 (중간) - 통일된 API 사용
        this.updateAllEnemyPositions(false);
        
        // 적 영역
        const enemyArea = document.querySelector('.enemy-area');
        if (enemyArea) {
            enemyArea.style.transformStyle = 'preserve-3d';
        }
        
        const enemiesContainer = document.querySelector('.enemies-container');
        if (enemiesContainer) {
            enemiesContainer.style.transformStyle = 'preserve-3d';
        }
        
        // 기믹 (뒤)
        const gimmicks = document.querySelectorAll('.gimmick-unit');
        gimmicks.forEach((el, i) => {
            const z = this.getGimmickZ(i);
            el.style.transform = `translateZ(${z}px)`;
            el.style.transformStyle = 'preserve-3d';
        });
        
        // 기믹 컨테이너
        const gimmickContainer = document.querySelector('.gimmicks-container');
        if (gimmickContainer) {
            gimmickContainer.style.transformStyle = 'preserve-3d';
        }
    },
    
    // ==========================================
    // 테마 변경
    // ==========================================
    setTheme(name) {
        const themes = {
            dungeon: { bg: 0x080810, torch: 0xff5500 },
            forest: { bg: 0x080a08, torch: 0x66ff66 },
            hell: { bg: 0x100505, torch: 0xff2200 },
            ice: { bg: 0x081018, torch: 0x66ccff }
        };
        const th = themes[name] || themes.dungeon;
        
        if (this.scene) {
            this.scene.background.setHex(th.bg);
            this.scene.fog.color.setHex(th.bg);
        }
        
        this.torches.forEach(torch => {
            torch.light.color.setHex(th.torch);
            torch.flame.material.color.setHex(th.torch);
        });
        
        console.log('[Background3D] 테마 변경:', name);
    },
    
    // ==========================================
    // 타격 광원 효과
    // ==========================================
    hitFlash(x = 0, y = 3, z = 0, color = 0xffffff, intensity = 3, duration = 150) {
        if (!this.scene) {
            console.log('[Background3D] hitFlash: scene 없음');
            return;
        }
        
        console.log('[Background3D] 💥 hitFlash 호출!', { x, y, z, color: color.toString(16), intensity });
        
        // 충격 광원 생성 - 범위 크게
        const hitLight = new THREE.PointLight(color, intensity, 50);
        hitLight.position.set(x, y, z);
        this.scene.add(hitLight);
        
        // 페이드 아웃
        const startTime = performance.now();
        const fadeOut = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                hitLight.intensity = intensity * (1 - progress);
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(hitLight);
                hitLight.dispose();
            }
        };
        fadeOut();
    },
    
    // 플레이어 타격 (적이 플레이어를 때림)
    playerHit() {
        console.log('[Background3D] 💔 playerHit 호출!');
        
        // 🔴 빨간 CSS 플래시 (중앙에서 퍼짐)
        this.cssHitFlash('#ff2200', 100);
        
        // 빨간빛 3D 플래시
        this.hitFlash(-10, 4, 5, 0xff3333, 8, 200);
        
        // 화면 가장자리 빨간 비네트 (플래시 후)
        setTimeout(() => {
            this.damageVignette();
        }, 30);
        
        // 화면 흔들림 효과 (플래시 후 약간 딜레이)
        setTimeout(() => {
            if (this.camera) {
                const originalY = this.camera.position.y;
                const originalX = this.camera.position.x;
                let shakeCount = 0;
                const shakeInterval = setInterval(() => {
                    this.camera.position.y = originalY + (Math.random() - 0.5) * 0.6;
                    this.camera.position.x = originalX + (Math.random() - 0.5) * 0.4;
                    shakeCount++;
                    if (shakeCount > 6) {
                        clearInterval(shakeInterval);
                        this.camera.position.y = originalY;
                        this.camera.position.x = originalX;
                    }
                }, 30);
            }
        }, 50);
    },
    
    // 피격 시 빨간 비네트
    damageVignette() {
        const vignette = document.createElement('div');
        vignette.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 9998;
            box-shadow: inset 0 0 100px 50px rgba(255, 0, 0, 0.5);
            opacity: 1;
            transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(vignette);
        
        requestAnimationFrame(() => {
            vignette.style.opacity = '0';
        });
        
        setTimeout(() => vignette.remove(), 350);
    },
    
    // 적 타격 (플레이어가 적을 때림)
    enemyHit(enemyIndex = 0, isCritical = false) {
        console.log('[Background3D] ⚔️ enemyHit 호출!', { enemyIndex, isCritical });
        
        // 타격 위치 계산
        const x = 5 + (enemyIndex * 8);
        
        // 🔥 CSS 화면 플래시 (가장 임팩트 있음!)
        this.cssHitFlash(isCritical ? '#ffaa00' : '#ffffff', isCritical ? 150 : 80);
        
        // 3D 광원 효과
        const color = isCritical ? 0xffaa00 : 0xffffcc;
        const intensity = isCritical ? 15 : 8;
        this.hitFlash(x, 5, 5, color, intensity, isCritical ? 300 : 200);
        
        // 앰비언트 순간 증가
        if (this.scene) {
            const ambientBoost = new THREE.AmbientLight(0xffffff, isCritical ? 2 : 1);
            this.scene.add(ambientBoost);
            setTimeout(() => {
                this.scene.remove(ambientBoost);
                ambientBoost.dispose();
            }, isCritical ? 100 : 50);
        }
        
        // 크리티컬 시 추가 효과
        if (isCritical) {
            setTimeout(() => {
                this.hitFlash(x + 2, 6, 3, 0xff6600, 5, 150);
                this.cssHitFlash('#ff4400', 60);
            }, 50);
        }
    },
    
    // CSS 화면 플래시 (중앙에서 퍼지는 효과)
    cssHitFlash(color = '#ffffff', duration = 80) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, ${color} 0%, transparent 70%);
            opacity: 0.6;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            mix-blend-mode: screen;
        `;
        document.body.appendChild(flash);
        
        // 빠르게 퍼지면서 페이드아웃
        requestAnimationFrame(() => {
            flash.style.transition = `all ${duration}ms ease-out`;
            flash.style.width = '200vmax';
            flash.style.height = '200vmax';
            flash.style.opacity = '0';
        });
        
        setTimeout(() => flash.remove(), duration + 50);
    },
    
    // 스킬/마법 이펙트 광원
    skillFlash(skillType = 'fire') {
        const skillColors = {
            fire: { color: 0xff4400, intensity: 5 },
            ice: { color: 0x44aaff, intensity: 4 },
            lightning: { color: 0xffff44, intensity: 8 },
            heal: { color: 0x44ff44, intensity: 3 },
            dark: { color: 0x8844ff, intensity: 4 },
            holy: { color: 0xffffaa, intensity: 6 }
        };
        
        const skill = skillColors[skillType] || skillColors.fire;
        
        // 중앙에서 폭발하는 광원
        this.hitFlash(0, 5, 0, skill.color, skill.intensity, 300);
        
        // 잔여 광원
        setTimeout(() => {
            this.hitFlash(0, 4, 2, skill.color, skill.intensity * 0.5, 200);
        }, 100);
    },
    
    // 전체 화면 플래시 (강력한 공격)
    screenFlash(color = 0xffffff, duration = 300) {
        if (!this.scene) return;
        
        // 앰비언트 라이트 일시적으로 강하게
        const flashLight = new THREE.AmbientLight(color, 2);
        this.scene.add(flashLight);
        
        const startTime = performance.now();
        const fadeOut = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // 빠르게 밝아졌다가 천천히 어두워짐
                const curve = progress < 0.2 ? progress * 5 : 1 - ((progress - 0.2) / 0.8);
                flashLight.intensity = 2 * Math.max(0, curve);
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(flashLight);
                flashLight.dispose();
            }
        };
        fadeOut();
    },
    
    // 정리
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container) {
            this.container.remove();
        }
        this.isInitialized = false;
        console.log('[Background3D] 정리 완료');
    }
};

// 전역 노출
window.Background3D = Background3D;

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Background3D] DOMContentLoaded');
    setTimeout(() => {
        Background3D.init().then(success => {
            console.log('[Background3D] init 결과:', success);
        }).catch(err => {
            console.error('[Background3D] init 오류:', err);
        });
    }, 200);
});

console.log('[Background3D] 스크립트 로드됨');

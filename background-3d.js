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
    
    // Scene 설정 (어두운 던전 - 붉은빛)
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x030202);  // 더 어두운 붉은 검정
        this.scene.fog = new THREE.FogExp2(0x080404, 0.028);  // 붉은 안개, 더 짙게
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
        
        // 카메라 기본 설정 저장
        this.cameraDefaults = {
            posY: 4,
            posZ: 15,
            lookAtY: 3
        };
        
        // 자동 줌 설정
        this.autoZoom = {
            enabled: true,
            targetZ: 15,
            currentZ: 15,
            smoothing: 0.05
        };
        
        console.log('[Background3D] Camera 생성됨');
    },
    
    // ==========================================
    // 🎥 카메라 자동 줌 (교전 상황에 맞게)
    // ==========================================
    
    /**
     * 교전 상황에 맞게 카메라 자동 조절
     * - 줌: 전투 영역 폭에 따라
     * - 패닝: 전투 중심을 따라가되 플레이어|적 구도 유지
     */
    updateAutoZoom() {
        if (!this.autoZoom?.enabled || !this.camera) return;
        
        // gameState가 없으면 스킵 (test_animation.html 등)
        if (typeof gameState === 'undefined') return;
        
        // 살아있는 적들의 실제 위치 수집
        const enemies = gameState?.enemies?.filter(e => e.hp > 0) || [];
        const enemyCount = enemies.length;
        
        // 모든 캐릭터의 X 좌표 수집 (플레이어 + 적)
        const playerX = this.worldPositions.player.x;
        let minX = playerX;
        let maxX = playerX;
        let enemySumX = 0;
        let enemyValidCount = 0;
        
        // 🎯 slotIndex로 순회 (살아있는 적 기준!)
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            const pos = this.getEnemyWorldPosition(slotIndex);
            if (pos) {
                minX = Math.min(minX, pos.x);
                maxX = Math.max(maxX, pos.x);
                enemySumX += pos.x;
                enemyValidCount++;
            }
        }
        
        // 전투 영역의 폭 계산
        const battleWidth = maxX - minX;
        
        // 🎥 줌 레벨: 전투 영역 폭 기반
        let targetZ = 14;  // 기본
        
        if (battleWidth > 20) {
            targetZ = 20 + (battleWidth - 20) * 0.3;
        } else if (battleWidth > 12) {
            targetZ = 15 + (battleWidth - 12) * 0.6;
        } else if (battleWidth < 6) {
            targetZ = 12;
        }
        
        // 적 수 보정
        if (enemyCount >= 4) targetZ += 1;
        
        // 최대/최소 제한
        targetZ = Math.max(10, Math.min(targetZ, 26));
        this.autoZoom.targetZ = targetZ;
        
        // 🎯 카메라 패닝: 플레이어|적 구도 유지
        // 전투 중심을 화면 중앙보다 약간 오른쪽에 배치 (플레이어가 왼쪽에 보이도록)
        const battleCenterX = (playerX + maxX) / 2;
        
        // 카메라 X 목표: 전투 중심 - 오프셋 (플레이어 쪽으로 살짝)
        const cameraOffsetX = -1.5;  // 카메라를 왼쪽으로 살짝 (플레이어가 더 왼쪽에)
        this.autoZoom.targetX = battleCenterX + cameraOffsetX;
        
        // lookAt 목표: 전투 중심
        this.autoZoom.targetLookAtX = battleCenterX * 0.8;
        
        // 초기화
        if (this.autoZoom.currentX === undefined) {
            this.autoZoom.currentX = this.autoZoom.targetX;
            this.autoZoom.currentLookAtX = this.autoZoom.targetLookAtX;
        }
        
        // 부드러운 보간
        const smoothing = 0.06;
        this.autoZoom.currentZ += (this.autoZoom.targetZ - this.autoZoom.currentZ) * smoothing;
        this.autoZoom.currentX += (this.autoZoom.targetX - this.autoZoom.currentX) * smoothing;
        this.autoZoom.currentLookAtX += (this.autoZoom.targetLookAtX - this.autoZoom.currentLookAtX) * smoothing;
    },
    
    /**
     * 적 사망 시 호출 (외부에서 호출 가능)
     */
    onEnemyDeath() {
        if (this.autoZoom) {
            this.autoZoom.zoomChanged = true;
            console.log('[Background3D] 🎥 적 사망 → 줌 조정 트리거');
        }
    },
    
    /**
     * 자동 줌 활성화/비활성화
     */
    setAutoZoom(enabled) {
        if (this.autoZoom) {
            this.autoZoom.enabled = enabled;
            console.log(`[Background3D] 자동 줌: ${enabled ? 'ON' : 'OFF'}`);
        }
    },
    
    /**
     * 수동 줌 설정
     */
    setZoom(zoomLevel) {
        if (!this.camera) return;
        
        // 줌 레벨: 1.0 = 기본, 0.5 = 줌인, 2.0 = 줌아웃
        const baseZ = this.cameraDefaults?.posZ || 15;
        this.autoZoom.targetZ = baseZ * zoomLevel;
        this.autoZoom.enabled = false;  // 수동 설정 시 자동 줌 끔
        
        console.log(`[Background3D] 수동 줌: ${zoomLevel} (Z=${this.autoZoom.targetZ})`);
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
        
        // 조명 (어두운 던전 - 붉은빛 분위기)
        // 환경광 - 매우 어둡게 (붉은 톤)
        const ambient = new THREE.AmbientLight(0x180808, 0.2);
        this.scene.add(ambient);
        
        // 🔴 붉은빛 글로벌 라이트 (던전 전체에 붉은 분위기)
        const redAmbient = new THREE.PointLight(0xff2200, 0.8, 100);
        redAmbient.position.set(0, 15, -10);
        this.scene.add(redAmbient);
        this.redAmbientLight = redAmbient;
        
        // 🔴 바닥에서 올라오는 붉은 광원 (용암/피 느낌)
        const floorGlow = new THREE.PointLight(0x661100, 0.5, 60);
        floorGlow.position.set(0, -2, 0);
        this.scene.add(floorGlow);
        this.floorGlowLight = floorGlow;
        
        // 약한 상단 조명 (벽면 윤곽용 - 더 어둡게)
        const topLight = new THREE.DirectionalLight(0x201515, 0.1);
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
    
    // 횃불 (어둠 속 붉은 빛)
    addTorches() {
        const positions = [
            [-25, 6, -25],
            [25, 6, -25],
            [-35, 6, -5],
            [35, 6, -5]
        ];
        
        positions.forEach((pos, i) => {
            // 메인 포인트 라이트 (붉은빛 강조)
            const light = new THREE.PointLight(0xff3300, 4.0, 25);
            light.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(light);
            
            // 보조 빛 (더 넓게 퍼지는 진한 붉은빛)
            const ambientLight = new THREE.PointLight(0xcc1100, 1.5, 40);
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
            
            // 불꽃 코어 (더 붉게)
            const flameMat = new THREE.MeshBasicMaterial({ 
                color: 0xff6600,
                transparent: true,
                opacity: 1.0
            });
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 8, 8),
                flameMat
            );
            flame.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(flame);
            
            // 불꽃 글로우 (진한 붉은빛)
            const glowMat = new THREE.MeshBasicMaterial({ 
                color: 0xff2200,
                transparent: true,
                opacity: 0.6
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
                baseIntensity: 4.0,  // 더 강하게
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
        
        window.addEventListener('resize', () => this.handleResize());
    },
    
    /**
     * 해상도 변경 처리 (ResponsiveManager에서도 호출)
     */
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        // 🎯 arena 캐시 강제 무효화
        this.cachedArenaRect = null;
        this.arenaRectCacheTime = 0;
        
        // ResponsiveManager가 있으면 게임 영역 기준, 없으면 전체 화면
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        if (typeof ResponsiveSystem !== 'undefined') {
            const gameArea = ResponsiveSystem.getGameArea();
            if (gameArea) {
                width = gameArea.width;
                height = gameArea.height;
            }
        }
        
        // 카메라 업데이트
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 전경 카메라/렌더러도 업데이트
        if (this.foreCamera) {
            this.foreCamera.aspect = width / height;
            this.foreCamera.updateProjectionMatrix();
        }
        if (this.foreRenderer) {
            this.foreRenderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // 🎯 리사이즈 후 캐릭터 위치 강제 갱신 (딜레이 필요 - DOM 레이아웃 완료 후)
        requestAnimationFrame(() => {
            // arena 캐시 다시 무효화 (DOM 레이아웃 변경 반영)
            this.cachedArenaRect = null;
            this.arenaRectCacheTime = 0;
            
            // 캐릭터 위치 강제 갱신
            this.forceUpdateAllCharacters();
        });
        
        console.log('[Background3D] 해상도 변경:', `${Math.round(width)}x${Math.round(height)}`);
    },
    
    /**
     * 모든 캐릭터 위치 강제 갱신
     */
    forceUpdateAllCharacters() {
        // 플레이어 위치 갱신
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
            PlayerRenderer.updatePositionFrom3D();
            PlayerRenderer.syncPlayerUI();
        }
        
        // 적 위치 갱신
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
            EnemyRenderer.updateAllPositions();
        }
        
        console.log('[Background3D] 캐릭터 위치 강제 갱신 완료');
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
        
        // 🎥 자동 줌/패닝 업데이트
        this.updateAutoZoom();
        
        // 카메라 위치: 자동 패닝 + 마우스 패럴랙스
        const baseY = this.cameraDefaults?.posY || 4;
        const currentZ = this.autoZoom?.currentZ || 15;
        const currentX = this.autoZoom?.currentX || 0;
        const currentLookAtX = this.autoZoom?.currentLookAtX || 0;
        
        // 🎯 카메라 X: 전투 중심 따라가기 + 마우스 패럴랙스
        this.camera.position.x = currentX + this.mouse.x * this.config.mouseX * 0.5;
        this.camera.position.y = baseY + this.mouse.y * this.config.mouseY * 0.5;
        this.camera.position.z = currentZ;
        
        // lookAt도 전투 중심 따라가기
        this.camera.lookAt(currentLookAtX + this.mouse.x * 0.3, 3, -5);
        
        // 횃불 깜빡임 (어둠 속에서 강조)
        this.torches.forEach(torch => {
            const flicker = Math.sin(t * 8 + torch.phase) * 0.6 + 
                           Math.sin(t * 13 + torch.phase * 2) * 0.3 +
                           Math.random() * 0.3;
            
            // 메인 라이트
            torch.light.intensity = torch.baseIntensity + flicker;
            
            // 보조 라이트
            if (torch.ambientLight) {
                torch.ambientLight.intensity = 1.2 + flicker * 0.4;
            }
            
            // 불꽃 크기
            torch.flame.scale.setScalar(1 + flicker * 0.25);
            
            // 글로우 크기
            if (torch.glow) {
                torch.glow.scale.setScalar(1 + flicker * 0.4);
                torch.glow.material.opacity = 0.4 + flicker * 0.2;
            }
        });
        
        // 🔴 붉은빛 글로벌 라이트 깜빡임 (느리게)
        if (this.redAmbientLight) {
            const redFlicker = Math.sin(t * 2) * 0.15 + Math.sin(t * 3.7) * 0.1;
            this.redAmbientLight.intensity = 0.8 + redFlicker;
        }
        if (this.floorGlowLight) {
            const floorFlicker = Math.sin(t * 1.5 + 1) * 0.1;
            this.floorGlowLight.intensity = 0.5 + floorFlicker;
        }
        
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
    // 🎯 실제 3D 월드 좌표 시스템
    // 해상도와 상관없이 동일한 3D 위치 유지
    // ==========================================
    
    // 3D 월드 좌표 (Three.js 좌표계)
    // 바닥 Y=0, 앞쪽 Z가 양수, 뒤쪽 Z가 음수
    // 카메라: position(0, 4, 15), lookAt(0, 3, 0)
    worldPositions: {
        // 플레이어: 왼쪽 앞쪽에 위치
        player: { x: -5.5, y: 0, z: 0.5 },
        
        // 적: 오른쪽에 일렬로 배치 (플레이어와 같은 Z 라인)
        enemies: {
            baseX: 2.0,    // 첫 번째 적 X 위치 (좀 더 오른쪽)
            spacingX: 5.0, // 적 사이 X 간격 (더 넓게!)
            y: 0,          // 바닥면 (플레이어와 같은 높이)
            z: 0.5         // 플레이어와 같은 Z 라인
        },
        
        // 기믹: 적보다 뒤쪽
        gimmicks: {
            baseX: 0,
            spacingX: 4,
            y: 0,
            z: 2
        }
    },
    
    // 3D 위치 설정값 (통일된 참조점) - 레거시 호환
    positions: {
        player: { z: 60 },
        enemy: { baseZ: -80, spacing: 20 },  // z = -80 - (index * 20)
        gimmick: { baseZ: -180, spacing: 30 } // z = -180 - (index * 30)
    },
    
    // ==========================================
    // 🎯 3D → 2D 화면 좌표 변환 (핵심!)
    // ==========================================
    
    /**
     * battle-arena의 경계 정보 캐시 (성능 최적화)
     */
    cachedArenaRect: null,
    arenaRectCacheTime: 0,
    
    /**
     * battle-arena 영역 정보 가져오기 (캐시 사용)
     */
    getArenaRect() {
        const now = performance.now();
        // 100ms 캐시 (리사이즈 이벤트에서 갱신됨)
        if (this.cachedArenaRect && (now - this.arenaRectCacheTime) < 100) {
            return this.cachedArenaRect;
        }
        
        const arena = document.querySelector('.battle-arena');
        if (arena) {
            this.cachedArenaRect = arena.getBoundingClientRect();
            this.arenaRectCacheTime = now;
            return this.cachedArenaRect;
        }
        
        // 폴백: 전체 화면
        return {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };
    },
    
    /**
     * 3D 월드 좌표를 2D 화면 좌표로 변환
     * @param {number} x - 3D X 좌표
     * @param {number} y - 3D Y 좌표 (바닥 = 0)
     * @param {number} z - 3D Z 좌표 (앞 = 양수)
     * @returns {object|null} { screenX, screenY, arenaX, arenaY, scale, visible }
     */
    project3DToScreen(x, y, z) {
        if (!this.isInitialized || !this.camera) return null;
        
        // Three.js Vector3 생성
        const vec = new THREE.Vector3(x, y, z);
        
        // 카메라 행렬 업데이트 (중요!)
        this.camera.updateMatrixWorld();
        
        // 카메라 뷰로 투영
        vec.project(this.camera);
        
        // 화면 밖인지 체크
        if (vec.z > 1 || vec.z < -1) {
            return { screenX: 0, screenY: 0, arenaX: 0, arenaY: 0, scale: 0, visible: false };
        }
        
        // NDC(-1~1)를 화면 픽셀 좌표로 변환 (절대 화면 좌표)
        const screenX = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-vec.y * 0.5 + 0.5) * window.innerHeight;
        
        // 🎯 battle-arena 로컬 좌표 계산 (PixiJS 렌더러용)
        // 🔥 window와 arena 크기 차이를 비율로 보정!
        const arenaRect = this.getArenaRect();
        
        // NDC를 arena 크기로 직접 변환 (window 크기 대신)
        // 이렇게 하면 3D 좌표가 arena 영역에 맞게 투영됨
        const arenaX = (vec.x * 0.5 + 0.5) * arenaRect.width;
        const arenaY = (-vec.y * 0.5 + 0.5) * arenaRect.height;
        
        // 거리 기반 스케일 (카메라와의 거리)
        const cameraPos = this.camera.position;
        const distance = Math.sqrt(
            Math.pow(x - cameraPos.x, 2) +
            Math.pow(y - cameraPos.y, 2) +
            Math.pow(z - cameraPos.z, 2)
        );
        
        // 기준 거리에서의 스케일 = 1.0 (z=6에서 거리 약 9)
        const baseDistance = 12;
        const scale = baseDistance / Math.max(distance, 1);
        
        return {
            screenX: screenX,      // 절대 화면 좌표
            screenY: screenY,
            arenaX: arenaX,        // battle-arena 로컬 좌표 (PixiJS용)
            arenaY: arenaY,
            scale: Math.min(Math.max(scale, 0.5), 2.0),  // 0.5 ~ 2배
            visible: true,
            depth: distance,  // 정렬용 깊이값
            worldX: x,
            worldY: y,
            worldZ: z
        };
    },
    
    /**
     * 디버그: 현재 모든 캐릭터 좌표 출력
     */
    debugPositions() {
        console.log('=== 3D 좌표 디버그 ===');
        
        const playerPos = this.getPlayerScreenPosition();
        console.log('플레이어:', {
            world: this.worldPositions.player,
            screen: playerPos ? { x: playerPos.screenX.toFixed(0), y: playerPos.screenY.toFixed(0), scale: playerPos.scale.toFixed(2) } : 'N/A'
        });
        
        // 🎯 살아있는 적 기준 slotIndex로 순회
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            const pos = this.getEnemyScreenPosition(slotIndex);
            const worldPos = this.getEnemyWorldPosition(slotIndex);
            console.log(`적 ${slotIndex}:`, {
                world: worldPos,
                screen: pos ? { x: pos.screenX.toFixed(0), y: pos.screenY.toFixed(0), scale: pos.scale.toFixed(2) } : 'N/A'
            });
        }
        
        console.log('카메라:', {
            position: { x: this.camera.position.x.toFixed(2), y: this.camera.position.y.toFixed(2), z: this.camera.position.z.toFixed(2) }
        });
    },
    
    // 디버그 마커 저장소
    debugMarkers: [],
    
    /**
     * 디버그: 캐릭터 위치에 실린더 마커 표시
     */
    showDebugMarkers() {
        if (!this.isInitialized || !this.scene) {
            console.error('[Background3D] 초기화되지 않음');
            return;
        }
        
        // 기존 마커 제거
        this.hideDebugMarkers();
        
        // 플레이어 위치에 파란색 실린더
        const playerPos = this.worldPositions.player;
        const playerMarker = this.createDebugCylinder(
            playerPos.x, playerPos.y, playerPos.z,
            0x3498db, // 파란색
            '플레이어'
        );
        this.debugMarkers.push(playerMarker);
        
        // 적 위치에 빨간색 실린더 (살아있는 적 기준!)
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            const worldPos = this.getEnemyWorldPosition(slotIndex);
            const enemyMarker = this.createDebugCylinder(
                worldPos.x, worldPos.y, worldPos.z,
                0xe74c3c, // 빨간색
                `적 ${slotIndex}`
            );
            this.debugMarkers.push(enemyMarker);
        }
        
        console.log(`[Background3D] 디버그 마커 ${this.debugMarkers.length}개 표시됨`);
        console.log('플레이어 3D 위치:', playerPos);
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            console.log(`적 ${slotIndex} 3D 위치:`, this.getEnemyWorldPosition(slotIndex));
        }
    },
    
    /**
     * 디버그 실린더 생성
     */
    createDebugCylinder(x, y, z, color, label) {
        // 바닥 원판 (위치 표시)
        const discGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
        const discMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.position.set(x, y + 0.025, z);  // 바닥에 살짝 띄움
        this.scene.add(disc);
        
        // 수직 폴 (높이 표시)
        const poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const poleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.6
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, y + 1, z);  // 바닥에서 위로
        this.scene.add(pole);
        
        // 상단 구체 (눈에 잘 띄게)
        const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x, y + 2, z);
        this.scene.add(sphere);
        
        console.log(`[DebugMarker] ${label}: (${x}, ${y}, ${z})`);
        
        return { disc, pole, sphere, label };
    },
    
    /**
     * 디버그 마커 숨기기
     */
    hideDebugMarkers() {
        this.debugMarkers.forEach(marker => {
            if (marker.disc) this.scene.remove(marker.disc);
            if (marker.pole) this.scene.remove(marker.pole);
            if (marker.sphere) this.scene.remove(marker.sphere);
        });
        this.debugMarkers = [];
        console.log('[Background3D] 디버그 마커 제거됨');
    },
    
    /**
     * 디버그 마커 토글
     */
    toggleDebugMarkers() {
        if (this.debugMarkers.length > 0) {
            this.hideDebugMarkers();
        } else {
            this.showDebugMarkers();
        }
    },
    
    /**
     * 플레이어의 화면 좌표 가져오기
     */
    getPlayerScreenPosition() {
        const pos = this.worldPositions.player;
        return this.project3DToScreen(pos.x, pos.y, pos.z);
    },
    
    /**
     * 특정 인덱스의 적 화면 좌표 가져오기
     * getEnemyWorldPosition()의 포메이션/랜덤 오프셋 적용
     */
    getEnemyScreenPosition(index) {
        // 🎯 포메이션 + 랜덤 오프셋이 적용된 월드 좌표 사용!
        const worldPos = this.getEnemyWorldPosition(index);
        return this.project3DToScreen(worldPos.x, worldPos.y, worldPos.z);
    },
    
    /**
     * 플레이어의 3D 월드 좌표 설정 (이동용)
     */
    setPlayerPosition(x, y, z) {
        this.worldPositions.player.x = x;
        this.worldPositions.player.y = y;
        this.worldPositions.player.z = z;
        
        // PixiJS 플레이어 업데이트 트리거
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
            PlayerRenderer.updatePositionFrom3D();
        }
    },
    
    /**
     * 특정 적의 3D 월드 좌표 설정 (이동용)
     * @param {number} index - 적 인덱스
     * @param {number} x - 3D X 좌표
     * @param {number} y - 3D Y 좌표
     * @param {number} z - 3D Z 좌표
     */
    setEnemyPosition(index, x, y, z) {
        // 개별 적 좌표 저장 (오버라이드)
        if (!this.worldPositions.enemyOverrides) {
            this.worldPositions.enemyOverrides = {};
        }
        this.worldPositions.enemyOverrides[index] = { x, y, z };
        
        // PixiJS 적 업데이트 트리거
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
            EnemyRenderer.updatePositionFrom3D(index);
        }
    },
    
    // ==========================================
    // 🎯 넉백/변위 시스템 (타격 시 위치 변화)
    // ==========================================
    
    // 원래 위치 저장소 (포메이션 기준)
    enemyOriginalPositions: {},
    
    // 넉백 애니메이션 트위 저장소 (충돌 방지)
    knockbackTweens: {},
    
    /**
     * 포메이션 기준 원래 위치 계산 (오버라이드 무시)
     * @param {number} slotIndex - 살아있는 적들의 슬롯 인덱스
     */
    getEnemyBasePosition(slotIndex) {
        // 🎯 살아있는 적 기준으로 slotIndex 사용!
        const enemy = this.getAliveEnemyBySlot(slotIndex);
        const config = this.worldPositions.enemies;
        
        // 기본 위치
        let x = config.baseX + (slotIndex * config.spacingX);
        let y = config.y;
        let z = config.z;
        
        // 포메이션 오프셋
        if (enemy) {
            const formation = this.getEnemyFormation(enemy, slotIndex);
            x += formation.offsetX;
            z += formation.offsetZ;
        }
        
        // 시드 기반 랜덤 오프셋
        const seed = enemy ? (enemy.id || enemy.name || '').length + slotIndex : slotIndex;
        const randomX = this.seededRandom(seed * 1.1) * 2.0 - 1.0;
        const randomZ = this.seededRandom(seed * 2.3) * 3.0 - 1.5;
        
        return {
            x: x + randomX,
            y: y,
            z: z + randomZ
        };
    },
    
    /**
     * 🔑 슬롯 인덱스로 살아있는 적 가져오기
     * gameState.enemies 인덱스가 아닌 slotIndex로 적을 찾음
     */
    getAliveEnemyBySlot(slotIndex) {
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        return aliveEnemies[slotIndex] || null;
    },
    
    /**
     * 🔑 적 ID 가져오기 (slotIndex → ID 변환)
     * 오버라이드/트윈을 ID로 저장하여 인덱스 변경에 영향받지 않음
     */
    getEnemyId(slotIndex) {
        // 🎯 살아있는 적 기준으로 slotIndex 사용!
        const enemy = this.getAliveEnemyBySlot(slotIndex);
        if (!enemy) return null;
        return enemy.pixiId || enemy.instanceId || enemy.id || `enemy_slot_${slotIndex}`;
    },
    
    /**
     * 적을 넉백시키기 (피격 시 오른쪽으로 밀림, 위치 유지!)
     * @param {number} index - 적 인덱스 (slotIndex)
     * @param {number} damage - 데미지 (강도 결정)
     */
    knockbackEnemy(index, damage = 10) {
        if (!this.isInitialized) return;
        
        // 🔑 적 ID 사용 (인덱스 변경에 안전!)
        const enemyId = this.getEnemyId(index);
        if (!enemyId) return;
        
        // 🔧 기존 넉백 애니메이션 취소
        if (this.knockbackTweens[enemyId]) {
            this.knockbackTweens[enemyId].kill();
            delete this.knockbackTweens[enemyId];
        }
        
        // 🎯 현재 위치 가져오기
        const currentPos = this.getEnemyWorldPosition(index);
        if (!currentPos) return;
        
        // 넉백 강도 (데미지 비례)
        const knockbackStrength = Math.min(1.0 + damage * 0.1, 3.0);
        const dx = knockbackStrength;
        const dz = (Math.random() - 0.5) * knockbackStrength * 0.4;
        const newX = currentPos.x + dx;
        const newZ = currentPos.z + dz;
        
        // 🔑 오버라이드를 적 ID로 저장!
        if (!this.worldPositions.enemyOverrides) {
            this.worldPositions.enemyOverrides = {};
        }
        this.worldPositions.enemyOverrides[enemyId] = { 
            x: currentPos.x, 
            y: currentPos.y, 
            z: currentPos.z 
        };
        
        const self = this;
        const overridePos = this.worldPositions.enemyOverrides[enemyId];
        
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline({
                onComplete: () => {
                    delete self.knockbackTweens[enemyId];
                    // 🎯 넉백 완료 후 충돌 분리!
                    self.separateOverlappingEnemies();
                }
            });
            
            this.knockbackTweens[enemyId] = tl;
            
            tl.to(overridePos, {
                x: newX,
                z: newZ,
                duration: 0.15,
                ease: "power2.out",
                onUpdate: () => {
                    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                        EnemyRenderer.updatePositionFrom3D(index);
                    }
                }
            });
        } else {
            this.worldPositions.enemyOverrides[enemyId] = { x: newX, y: currentPos.y, z: newZ };
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                EnemyRenderer.updatePositionFrom3D(index);
            }
            // 🎯 충돌 분리
            this.separateOverlappingEnemies();
        }
    },
    
    // ==========================================
    // 🎯 충돌 분리 시스템 (겹치는 캐릭터 나란히 배치)
    // ==========================================
    
    /**
     * 겹치는 적들을 자연스럽게 분리
     * @param {number} minDistance - 최소 거리 (이보다 가까우면 분리)
     */
    separateOverlappingEnemies(minDistance = 2.0) {
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        if (aliveEnemies.length < 2) return;
        
        // 모든 적 위치 수집
        const positions = [];
        for (let i = 0; i < aliveEnemies.length; i++) {
            const pos = this.getEnemyWorldPosition(i);
            const enemyId = this.getEnemyId(i);
            if (pos && enemyId) {
                positions.push({
                    slotIndex: i,
                    enemyId: enemyId,
                    x: pos.x,
                    z: pos.z,
                    separated: false
                });
            }
        }
        
        // 충돌 감지 및 분리 벡터 계산
        const separations = new Map();
        
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const a = positions[i];
                const b = positions[j];
                
                const dx = b.x - a.x;
                const dz = b.z - a.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < minDistance && distance > 0.01) {
                    // 겹침 감지!
                    const overlap = minDistance - distance;
                    const pushForce = overlap / 2 + 0.1;  // 각각 절반씩 밀림
                    
                    // 분리 방향 (주로 Z축으로 나란히)
                    let nx = dx / distance;
                    let nz = dz / distance;
                    
                    // Z축 분리 강조 (나란히 서게)
                    if (Math.abs(nz) < 0.3) {
                        nz = (Math.random() > 0.5 ? 1 : -1) * 0.8;
                        nx *= 0.2;
                    }
                    
                    // 분리 벡터 누적
                    if (!separations.has(a.enemyId)) {
                        separations.set(a.enemyId, { x: 0, z: 0, slotIndex: a.slotIndex });
                    }
                    if (!separations.has(b.enemyId)) {
                        separations.set(b.enemyId, { x: 0, z: 0, slotIndex: b.slotIndex });
                    }
                    
                    const sepA = separations.get(a.enemyId);
                    const sepB = separations.get(b.enemyId);
                    
                    sepA.x -= nx * pushForce;
                    sepA.z -= nz * pushForce;
                    sepB.x += nx * pushForce;
                    sepB.z += nz * pushForce;
                    
                    console.log(`[Separation] 적 ${i}와 ${j} 겹침! 거리: ${distance.toFixed(2)}, 분리: ${pushForce.toFixed(2)}`);
                }
            }
        }
        
        // 분리 적용 (부드럽게 이동)
        if (separations.size > 0) {
            this.applySeparation(separations);
        }
    },
    
    /**
     * 분리 벡터 적용 (부드러운 애니메이션)
     */
    applySeparation(separations) {
        const self = this;
        
        separations.forEach((sep, enemyId) => {
            if (Math.abs(sep.x) < 0.01 && Math.abs(sep.z) < 0.01) return;
            
            // 현재 위치 가져오기
            const currentPos = this.getEnemyWorldPosition(sep.slotIndex);
            if (!currentPos) return;
            
            // 오버라이드 확인/생성
            if (!this.worldPositions.enemyOverrides) {
                this.worldPositions.enemyOverrides = {};
            }
            if (!this.worldPositions.enemyOverrides[enemyId]) {
                this.worldPositions.enemyOverrides[enemyId] = { ...currentPos };
            }
            
            const overridePos = this.worldPositions.enemyOverrides[enemyId];
            const targetX = overridePos.x + sep.x;
            const targetZ = overridePos.z + sep.z;
            
            // 부드럽게 분리 이동
            if (typeof gsap !== 'undefined') {
                gsap.to(overridePos, {
                    x: targetX,
                    z: targetZ,
                    duration: 0.2,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                            EnemyRenderer.updatePositionFrom3D(sep.slotIndex);
                        }
                    }
                });
            } else {
                overridePos.x = targetX;
                overridePos.z = targetZ;
                if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                    EnemyRenderer.updatePositionFrom3D(sep.slotIndex);
                }
            }
        });
    },
    
    // 플레이어 넉백/대시 트윈
    playerKnockbackTween: null,
    playerDashTween: null,
    playerOriginalPosition: null,
    
    /**
     * 플레이어 대시 (공격 시 적 쪽으로!)
     * @param {number} targetIndex - 공격할 적 인덱스 (-1이면 가장 가까운 적)
     * @param {function} onHit - 대시 끝에서 호출할 콜백
     */
    /**
     * 플레이어 전진 (적 밀어낼 때 따라감)
     * @param {number} distance - 전진 거리
     */
    advancePlayer(distance = 0.3) {
        if (!this.isInitialized || distance <= 0) return;
        
        // 현재 위치에서 전진
        const newX = this.worldPositions.player.x + distance;
        
        // 최대 전진 제한 (적에게 너무 가까워지지 않게)
        const closestEnemyX = this.getClosestEnemyX();
        const maxX = closestEnemyX - 2;  // 적에서 2 거리 유지
        
        if (newX > maxX) return;  // 이미 충분히 가까움
        
        // 부드럽게 전진
        if (typeof gsap !== 'undefined') {
            gsap.to(this.worldPositions.player, {
                x: newX,
                duration: 0.2,
                ease: "power2.out",
                onUpdate: () => {
                    if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                        PlayerRenderer.updatePositionFrom3D();
                    }
                }
            });
        } else {
            this.worldPositions.player.x = newX;
        }
    },
    
    /**
     * 가장 가까운 적의 X 좌표 반환
     */
    getClosestEnemyX() {
        // 🎯 slotIndex로 순회 (살아있는 적 기준!)
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        let closestX = 100;
        
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            const pos = this.getEnemyWorldPosition(slotIndex);
            if (pos && pos.x < closestX) {
                closestX = pos.x;
            }
        }
        
        return closestX;
    },
    
    /**
     * 몬스터 대시 (공격 시 플레이어 쪽으로!)
     * @param {number} enemyIndex - 공격하는 적 인덱스 (slotIndex)
     * @param {function} onHit - 대시 끝에서 호출할 콜백
     */
    dashEnemy(enemyIndex, onHit = null) {
        if (!this.isInitialized) return;
        
        // 🔑 적 ID 사용
        const enemyId = this.getEnemyId(enemyIndex);
        if (!enemyId) return;
        
        const currentPos = this.getEnemyWorldPosition(enemyIndex);
        if (!currentPos) return;
        
        // 기존 넉백/대시 취소 (ID로!)
        if (this.knockbackTweens[enemyId]) {
            this.knockbackTweens[enemyId].kill();
            delete this.knockbackTweens[enemyId];
        }
        
        // 🔑 오버라이드 설정 (ID로!)
        if (!this.worldPositions.enemyOverrides) {
            this.worldPositions.enemyOverrides = {};
        }
        this.worldPositions.enemyOverrides[enemyId] = {
            x: currentPos.x,
            y: currentPos.y,
            z: currentPos.z
        };
        
        const overridePos = this.worldPositions.enemyOverrides[enemyId];
        const startX = currentPos.x;
        
        // 타겟: 플레이어 앞
        const playerX = this.worldPositions.player.x;
        const targetX = playerX + 1.5;
        
        const self = this;
        
        if (typeof gsap !== 'undefined') {
            this.knockbackTweens[enemyId] = gsap.timeline({
                onComplete: () => {
                    delete self.knockbackTweens[enemyId];
                }
            });
            
            this.knockbackTweens[enemyId]
                .to(overridePos, {
                    x: targetX,
                    duration: 0.1,
                    ease: "power3.out",
                    onUpdate: () => {
                        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                            EnemyRenderer.updatePositionFrom3D(enemyIndex);
                        }
                    },
                    onComplete: () => {
                        if (onHit) onHit();
                    }
                })
                .to({}, { duration: 0.05 })
                .to(overridePos, {
                    x: startX,
                    duration: 0.3,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                            EnemyRenderer.updatePositionFrom3D(enemyIndex);
                        }
                    }
                });
        }
    },
    
    dashPlayer(targetIndex = -1, onHit = null) {
        if (!this.isInitialized) return;
        
        // 기존 대시 취소
        if (this.playerDashTween) {
            this.playerDashTween.kill();
            this.playerDashTween = null;
        }
        
        // 원래 위치 저장
        if (!this.playerOriginalPosition) {
            this.playerOriginalPosition = {
                x: this.worldPositions.player.x,
                y: this.worldPositions.player.y,
                z: this.worldPositions.player.z
            };
        }
        const startPos = { ...this.worldPositions.player };
        
        // 타겟 위치 결정
        let targetX = startPos.x + 3;  // 기본: 오른쪽으로 3
        
        if (targetIndex >= 0) {
            // 🎯 targetIndex는 이미 slotIndex로 전달됨
            const targetPos = this.getEnemyWorldPosition(targetIndex);
            if (targetPos) {
                targetX = targetPos.x - 1.5;  // 적 앞에서 멈춤
            }
        } else {
            // 가장 가까운 적 찾기
            // 🎯 slotIndex로 순회 (살아있는 적 기준!)
            const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
            let closestDist = Infinity;
            for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
                const pos = this.getEnemyWorldPosition(slotIndex);
                if (pos) {
                    const dist = pos.x - startPos.x;
                    if (dist > 0 && dist < closestDist) {
                        closestDist = dist;
                        targetX = pos.x - 1.5;
                    }
                }
            }
        }
        
        const dashDistance = targetX - startPos.x;
        console.log(`[Background3D] 🏃 플레이어 대시: ${startPos.x.toFixed(2)} → ${targetX.toFixed(2)} (거리: ${dashDistance.toFixed(2)})`);
        
        const self = this;
        
        if (typeof gsap !== 'undefined') {
            this.playerDashTween = gsap.timeline({
                onComplete: () => {
                    self.playerDashTween = null;
                }
            });
            
            this.playerDashTween
                // 1️⃣ 대시! (빠르게 적 쪽으로)
                .to(this.worldPositions.player, {
                    x: targetX,
                    duration: 0.12,
                    ease: "power3.out",
                    onUpdate: () => {
                        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                            PlayerRenderer.updatePositionFrom3D();
                        }
                    },
                    onComplete: () => {
                        // 히트 콜백
                        if (onHit) onHit();
                    }
                })
                // 2️⃣ 잠시 멈춤 (히트스탑)
                .to({}, { duration: 0.05 })
                // 3️⃣ 복귀 (부드럽게)
                .to(this.worldPositions.player, {
                    x: startPos.x,
                    duration: 0.25,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                            PlayerRenderer.updatePositionFrom3D();
                        }
                    }
                });
        }
    },
    
    /**
     * 플레이어를 넉백시키기 (피격 시 왼쪽으로 밀림)
     * @param {number} damage - 데미지 (강도 결정)
     */
    knockbackPlayer(damage = 10) {
        if (!this.isInitialized) return;
        
        // 🔧 기존 넉백 애니메이션 취소!
        if (this.playerKnockbackTween) {
            this.playerKnockbackTween.kill();
            this.playerKnockbackTween = null;
        }
        
        // 🎯 원래 위치 저장 (첫 넉백 시에만)
        if (!this.playerOriginalPosition) {
            this.playerOriginalPosition = { 
                x: this.worldPositions.player.x,
                y: this.worldPositions.player.y,
                z: this.worldPositions.player.z
            };
        }
        
        // 현재 위치
        const currentPos = { ...this.worldPositions.player };
        
        // 🎯 넉백 강도 (데미지 비례)
        const knockbackStrength = Math.min(0.08 + damage * 0.015, 0.4);  // 0.08 ~ 0.4
        
        // 🔥 적(오른쪽)이 공격 → 플레이어는 왼쪽(X-)으로 밀림!
        const dx = -knockbackStrength;  // 왼쪽으로
        const dz = (Math.random() - 0.5) * knockbackStrength * 0.3;  // 약간의 앞뒤 랜덤
        
        // 새 위치 계산 (현재 위치 기준! = 누적됨)
        const newX = currentPos.x + dx;
        const newZ = currentPos.z + dz;
        
        const self = this;
        
        // GSAP으로 부드럽게 이동 (밀린 위치에 유지!)
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline({
                onComplete: () => {
                    self.playerKnockbackTween = null;
                }
            });
            
            this.playerKnockbackTween = tl;
            
            // 넉백만 하고 복귀 안 함!
            tl.to(this.worldPositions.player, {
                x: newX,
                z: newZ,
                duration: 0.08,
                ease: "back.out(2)",
                onUpdate: () => {
                    if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                        PlayerRenderer.updatePositionFrom3D();
                    }
                }
            });
        }
    },
    
    /**
     * 적을 특정 위치로 밀어내기 (광역기용)
     */
    pushEnemyTo(index, targetX, targetZ, duration = 0.3) {
        if (!this.isInitialized) return;
        
        // 🔑 적 ID 사용
        const enemyId = this.getEnemyId(index);
        if (!enemyId) return;
        
        // 기존 트윈 취소 (ID로!)
        if (this.knockbackTweens[enemyId]) {
            this.knockbackTweens[enemyId].kill();
            delete this.knockbackTweens[enemyId];
        }
        
        const basePos = this.getEnemyBasePosition(index);
        if (!basePos) return;
        
        if (!this.worldPositions.enemyOverrides) {
            this.worldPositions.enemyOverrides = {};
        }
        // 🔑 오버라이드를 ID로 저장!
        this.worldPositions.enemyOverrides[enemyId] = { ...basePos };
        
        const overridePos = this.worldPositions.enemyOverrides[enemyId];
        const self = this;
        
        if (typeof gsap !== 'undefined') {
            const tl = gsap.to(overridePos, {
                x: targetX,
                z: targetZ,
                duration: duration,
                ease: "power2.out",
                onUpdate: () => {
                    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                        EnemyRenderer.updatePositionFrom3D(index);
                    }
                },
                onComplete: () => {
                    delete self.knockbackTweens[enemyId];
                }
            });
            this.knockbackTweens[enemyId] = tl;
        }
    },
    
    /**
     * 모든 적을 중심에서 밀어내기 (광역 넉백 / 장판)
     * @param {number} centerX - 폭발 중심 X
     * @param {number} centerZ - 폭발 중심 Z  
     * @param {number} strength - 밀어내는 강도
     * @param {number} radius - 영향 범위 (이 안의 적만 영향)
     */
    aoeKnockback(centerX, centerZ, strength = 1.5, radius = 10) {
        // 🎯 살아있는 적 기준 slotIndex로 순회!
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            // 베이스 위치 사용!
            const pos = this.getEnemyBasePosition(slotIndex);
            if (!pos) continue;
            
            // 중심에서의 방향 계산
            const dx = pos.x - centerX;
            const dz = pos.z - centerZ;
            const distance = Math.sqrt(dx * dx + dz * dz) || 0.1;
            
            // 범위 밖이면 스킵
            if (distance > radius) continue;
            
            // 거리에 반비례하는 넉백 (가까울수록 강함)
            const knockbackPower = strength * (1.5 / (distance + 0.5));
            
            const normalX = dx / distance;
            const normalZ = dz / distance;
            
            // 밀어내기
            this.pushEnemyTo(
                slotIndex,
                pos.x + normalX * knockbackPower,
                pos.z + normalZ * knockbackPower,
                0.25
            );
        }
        
        console.log(`[Background3D] AOE 넉백: 중심(${centerX.toFixed(1)}, ${centerZ.toFixed(1)}), 강도: ${strength}`);
        
        // 🎯 AOE 완료 후 충돌 분리 (딜레이)
        const self = this;
        setTimeout(() => {
            self.separateOverlappingEnemies();
        }, 300);
    },
    
    /**
     * 적을 원래 위치로 복귀
     */
    resetEnemyPosition(index, duration = 0.5) {
        // 🔑 적 ID 사용
        const enemyId = this.getEnemyId(index);
        if (!enemyId) return;
        
        // 기존 트윈 취소 (ID로!)
        if (this.knockbackTweens[enemyId]) {
            this.knockbackTweens[enemyId].kill();
            delete this.knockbackTweens[enemyId];
        }
        
        const basePos = this.getEnemyBasePosition(index);
        if (!basePos) return;
        
        // 🔑 오버라이드를 ID로 조회!
        if (!this.worldPositions.enemyOverrides || !this.worldPositions.enemyOverrides[enemyId]) {
            return;
        }
        
        const currentOverride = this.worldPositions.enemyOverrides[enemyId];
        const self = this;
        
        if (typeof gsap !== 'undefined') {
            const tl = gsap.to(currentOverride, {
                x: basePos.x,
                z: basePos.z,
                duration: duration,
                ease: "power2.out",
                onUpdate: () => {
                    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.initialized) {
                        EnemyRenderer.updatePositionFrom3D(index);
                    }
                },
                onComplete: () => {
                    if (self.worldPositions.enemyOverrides) {
                        delete self.worldPositions.enemyOverrides[enemyId];
                    }
                    delete self.knockbackTweens[enemyId];
                }
            });
            this.knockbackTweens[enemyId] = tl;
        } else {
            delete this.worldPositions.enemyOverrides[enemyId];
        }
    },
    
    /**
     * 모든 적 위치 리셋
     */
    resetAllEnemyPositions(duration = 0.5) {
        // 🎯 살아있는 적 기준 slotIndex로 순회!
        const aliveEnemies = (gameState?.enemies || []).filter(e => e && e.hp > 0);
        for (let slotIndex = 0; slotIndex < aliveEnemies.length; slotIndex++) {
            this.resetEnemyPosition(slotIndex, duration);
        }
    },
    
    /**
     * 플레이어 위치 리셋
     */
    resetPlayerPosition(duration = 0.5) {
        if (!this.playerOriginalPosition) return;
        
        // 기존 트윈 취소
        if (this.playerKnockbackTween) {
            this.playerKnockbackTween.kill();
            this.playerKnockbackTween = null;
        }
        
        const originalPos = this.playerOriginalPosition;
        const self = this;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.worldPositions.player, {
                x: originalPos.x,
                z: originalPos.z,
                duration: duration,
                ease: "power2.out",
                onUpdate: () => {
                    if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                        PlayerRenderer.updatePositionFrom3D();
                    }
                },
                onComplete: () => {
                    self.playerOriginalPosition = null;
                }
            });
        } else {
            this.worldPositions.player.x = originalPos.x;
            this.worldPositions.player.z = originalPos.z;
            this.playerOriginalPosition = null;
        }
    },
    
    /**
     * 모든 캐릭터 위치 리셋 (턴 끝에 호출)
     */
    resetAllPositions(duration = 0.5) {
        this.resetAllEnemyPositions(duration);
        this.resetPlayerPosition(duration);
        console.log('[Background3D] 모든 캐릭터 원위치로 복귀');
    },
    
    /**
     * 특정 적의 3D 월드 좌표 가져오기
     * 몬스터 타입에 따른 포메이션 (랜덤 오프셋 제거 - 안정적인 위치)
     * @param {number} slotIndex - 살아있는 적들의 슬롯 인덱스
     */
    getEnemyWorldPosition(slotIndex) {
        // 🎯 살아있는 적 기준으로 slotIndex 사용!
        const enemy = this.getAliveEnemyBySlot(slotIndex);
        
        // 🔑 오버라이드를 적 ID로 조회! (인덱스 변경에 안전)
        const enemyId = this.getEnemyId(slotIndex);
        if (enemyId && this.worldPositions.enemyOverrides && this.worldPositions.enemyOverrides[enemyId]) {
            return this.worldPositions.enemyOverrides[enemyId];
        }
        const config = this.worldPositions.enemies;
        
        // 기본 위치 (slotIndex 기반 - 안정적!)
        let x = config.baseX + (slotIndex * config.spacingX);
        let y = config.y;
        let z = config.z;
        
        // 🎯 몬스터 타입에 따른 포메이션
        if (enemy) {
            const formation = this.getEnemyFormation(enemy, slotIndex);
            x += formation.offsetX;
            z += formation.offsetZ;
        }
        
        // 🎯 고유 ID 기반 미세 오프셋 (pixiId로 안정적인 시드 생성)
        // slotIndex가 변해도 같은 적은 같은 오프셋 유지!
        if (enemy && enemy.pixiId) {
            const seed = this.hashString(enemy.pixiId);
            const offsetX = this.seededRandom(seed * 1.1) * 0.8 - 0.4;  // -0.4 ~ 0.4 (작게)
            const offsetZ = this.seededRandom(seed * 2.3) * 0.6 - 0.3;  // -0.3 ~ 0.3 (작게)
            x += offsetX;
            z += offsetZ;
        }
        
        return { x, y, z };
    },
    
    /**
     * 문자열을 숫자 해시로 변환 (안정적인 시드용)
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;  // 32bit 정수로 변환
        }
        return Math.abs(hash);
    },
    
    /**
     * 시드 기반 유사 랜덤 (일관성 있는 랜덤)
     */
    seededRandom(seed) {
        const x = Math.sin(seed * 9999) * 10000;
        return x - Math.floor(x);
    },
    
    /**
     * 몬스터 타입에 따른 포메이션 오프셋
     */
    getEnemyFormation(enemy, index) {
        let offsetX = 0;
        let offsetZ = 0;
        
        // 🏹 원거리 몬스터 (궁수, 마법사): 뒤로
        const rangedTypes = ['archer', 'goblin_archer', 'mage', 'wizard', 'shaman', 'necromancer'];
        const isRanged = rangedTypes.some(type => 
            (enemy.id && enemy.id.toLowerCase().includes(type)) ||
            (enemy.name && enemy.name.toLowerCase().includes(type)) ||
            (enemy.type && enemy.type.toLowerCase().includes(type)) ||
            enemy.attackType === 'ranged'
        );
        
        // 🛡️ 탱커/보스: 앞으로
        const isTank = enemy.isBoss || enemy.isElite || 
            (enemy.maxHp && enemy.maxHp > 50) ||
            (enemy.name && (enemy.name.includes('골렘') || enemy.name.includes('오우거')));
        
        if (isRanged) {
            // 🏹 원거리: 뒤쪽으로 (깊이감 강조), 좌우 분산
            offsetZ = -3.0;  // 뒤로 많이
            offsetX = (index % 2 === 0) ? 1.0 : -1.0;  // 좌우로
        } else if (isTank) {
            // 🛡️ 탱커/보스: 앞쪽으로
            offsetZ = 2.0;
        } else {
            // ⚔️ 일반 근접: 지그재그 배치 (깊이 + 좌우)
            offsetZ = (index % 2 === 0) ? 1.0 : -1.0;  // 앞뒤 교차
            offsetX = (index % 3 === 1) ? 0.8 : ((index % 3 === 2) ? -0.8 : 0);  // 3열 분산
        }
        
        return { offsetX, offsetZ };
    },
    
    // 인덱스로 적의 3D Z 위치 계산 (레거시 호환)
    getEnemyZ(index) {
        return this.positions.enemy.baseZ - (index * this.positions.enemy.spacing);
    },
    
    // 인덱스로 기믹의 3D Z 위치 계산
    getGimmickZ(index) {
        return this.positions.gimmick.baseZ - (index * this.positions.gimmick.spacing);
    },
    
    // ==========================================
    // 🎯 고정 간격 슬롯 시스템 (스프라이트 크기 기반)
    // ==========================================
    slotConfig: {
        spacing: 160,        // 슬롯 간격 (스프라이트 충돌 방지)
        initialized: false,
        baseX: 0,            // 첫 번째 슬롯의 기준 X 좌표
        domBasePositions: [] // 각 DOM 요소의 원래 flexbox 위치
    },
    
    /**
     * 슬롯 시스템 초기화 (renderEnemies 후 호출)
     * 스프라이트 크기를 고려한 고정 간격으로 펼쳐짐
     */
    cacheSlotPositions() {
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        if (enemyEls.length === 0) return;
        
        // 모든 transform 초기화
        enemyEls.forEach(el => {
            gsap.set(el, { x: 0, y: 0, clearProps: 'x,y' });
            el.style.transform = '';
        });
        
        // 강제 리플로우
        container.offsetHeight;
        
        // 각 DOM 요소의 원래 flexbox 위치 저장
        this.slotConfig.domBasePositions = enemyEls.map(el => {
            const rect = el.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width };
        });
        
        // 첫 번째 요소 기준점 저장
        if (this.slotConfig.domBasePositions.length > 0) {
            this.slotConfig.baseX = this.slotConfig.domBasePositions[0].left;
        }
        
        // 스프라이트 크기 기반 간격 자동 계산 (최소 150px)
        if (enemyEls.length > 1) {
            const avgWidth = this.slotConfig.domBasePositions.reduce((sum, p) => sum + p.width, 0) 
                             / this.slotConfig.domBasePositions.length;
            this.slotConfig.spacing = Math.max(150, avgWidth + 20); // 여유 20px
        }
        
        // 3D 깊이 적용 + 슬롯 초기화
        enemyEls.forEach((el, i) => {
            el.dataset.slot = i;
            el.dataset.domIndex = i;
            el.style.transform = `translateZ(${this.getEnemyZ(i)}px)`;
            el.style.transformStyle = 'preserve-3d';
        });
        
        this.slotConfig.initialized = true;
        console.log(`[Background3D] 슬롯 시스템 초기화: 간격=${this.slotConfig.spacing}px, 적=${enemyEls.length}명`);
    },
    
    /**
     * 슬롯 위치 계산 (첫 번째 DOM 기준 + 고정 간격)
     * 슬롯 N의 목표 X = 첫 번째 DOM 위치 + N * spacing
     */
    getSlotTargetX(slotIndex) {
        if (!this.slotConfig.initialized || this.slotConfig.domBasePositions.length === 0) {
            return slotIndex * this.slotConfig.spacing;
        }
        // 첫 번째 DOM 위치 기준
        const baseX = this.slotConfig.domBasePositions[0].left;
        return baseX + (slotIndex * this.slotConfig.spacing);
    },
    
    /**
     * DOM 요소가 특정 슬롯으로 가려면 필요한 X 오프셋
     */
    getSlotOffset(domIndex, slotIndex) {
        if (!this.slotConfig.initialized || domIndex >= this.slotConfig.domBasePositions.length) {
            return (slotIndex - domIndex) * this.slotConfig.spacing;
        }
        
        // 내 DOM의 원래 위치
        const myBaseX = this.slotConfig.domBasePositions[domIndex].left;
        // 목표 슬롯의 위치
        const slotTargetX = this.getSlotTargetX(slotIndex);
        
        // 필요한 이동 거리
        return slotTargetX - myBaseX;
    },
    
    /**
     * 🚀 핵심 API: 적의 슬롯 변경 (DOM 재배치 없이!)
     * 스프라이트 크기만큼 펼쳐진 고정 간격으로 이동
     */
    moveToSlot(el, toSlot, duration = 0.3) {
        return new Promise((resolve) => {
            if (!el || !this.slotConfig.initialized) {
                resolve();
                return;
            }
            
            const domIndex = parseInt(el.dataset.domIndex) || 0;
            const currentSlot = parseInt(el.dataset.slot) || domIndex;
            
            if (currentSlot === toSlot) {
                resolve();
                return;
            }
            
            // 고정 간격 기반 X 오프셋 계산 (첫 번째 DOM 기준!)
            const targetX = this.getSlotOffset(domIndex, toSlot);
            const targetZ = this.getEnemyZ(toSlot);
            
            console.log(`[슬롯] DOM ${domIndex} → 슬롯 ${toSlot}, X=${targetX}px`);
            
            // 슬롯 업데이트
            el.dataset.slot = toSlot;
            
            // GSAP 애니메이션
            gsap.to(el, {
                x: targetX,
                duration: duration,
                ease: 'power2.out',
                onUpdate: () => {
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
     * 후퇴/전진에서 사용 - 스프라이트 간격만큼 펼쳐짐
     */
    swapSlots(elA, elB, duration = 0.3) {
        return new Promise((resolve) => {
            if (!elA || !elB || !this.slotConfig.initialized) {
                resolve();
                return;
            }
            
            const slotA = parseInt(elA.dataset.slot);
            const slotB = parseInt(elB.dataset.slot);
            
            // 동시에 이동 (고정 간격으로 펼쳐짐)
            Promise.all([
                this.moveToSlot(elA, slotB, duration),
                this.moveToSlot(elB, slotA, duration)
            ]).then(resolve);
        });
    },
    
    /**
     * 🚀 핵심 API: 사슬낫 스타일 끌어오기
     * 타겟을 슬롯 0으로, 나머지는 한 칸씩 밀림 (간격 유지)
     * gameState.enemies 배열은 호출자가 변경해야 함!
     */
    async pullToSlotZero(targetEl, allEnemyEls, duration = 0.25) {
        if (!targetEl || !this.slotConfig.initialized) return;
        
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

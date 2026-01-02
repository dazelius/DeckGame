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
    
    // 전경 레이어 (바닥 앞쪽에 잔해물)
    addForeground() {
        const foreImg = new Image();
        foreImg.src = 'texture/dungeon_fore.png';
        
        foreImg.onload = () => {
            console.log('[Background3D] 전경 텍스처 로드 성공 - 크기:', foreImg.width, 'x', foreImg.height);
            const tex = new THREE.CanvasTexture(foreImg);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            
            // 이미지 비율 계산
            const aspect = foreImg.width / foreImg.height;
            const width = 120;
            const height = width / aspect;
            
            const foreMat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                fog: false
            });
            
            // 전경 평면 - 바닥에 눕혀서 앞쪽에 배치
            const foreground = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                foreMat
            );
            // 바닥처럼 눕히고 바닥 앞쪽(카메라 가까이)에 배치
            foreground.rotation.x = -Math.PI / 2;
            foreground.position.set(0, 0.1, 25);  // 바닥 위, 카메라 앞쪽
            foreground.renderOrder = 999;
            this.dungeonGroup.add(foreground);
            
            this.foreground = foreground;
            console.log('[Background3D] 전경 추가됨 - 바닥에 눕힘, 위치:', foreground.position);
        };
        
        foreImg.onerror = () => {
            console.log('[Background3D] 전경 텍스처 없음 (texture/dungeon_fore.png)');
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
    },
    
    // ==========================================
    // 게임 요소 3D 배치
    // ==========================================
    applyGameParallax() {
        const arena = document.querySelector('.battle-arena');
        if (!arena) return;
        
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
            player.style.transform = 'translateZ(60px)';
            player.style.transformStyle = 'preserve-3d';
        }
        
        // 플레이어 사이드
        const playerSide = document.querySelector('.player-side');
        if (playerSide) {
            playerSide.style.transformStyle = 'preserve-3d';
        }
        
        // 몬스터 (중간)
        const enemies = document.querySelectorAll('.enemy-unit');
        enemies.forEach((el, i) => {
            const z = -80 - (i * 20);
            el.style.transform = `translateZ(${z}px)`;
            el.style.transformStyle = 'preserve-3d';
        });
        
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
            const z = -180 - (i * 30);
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

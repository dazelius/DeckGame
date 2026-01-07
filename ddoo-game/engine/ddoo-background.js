// =====================================================
// DDOO Background 3D - 던전 배경 시스템
// =====================================================

const DDOOBackground = {
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
    
    // 카메라 기본값
    cameraDefaults: {
        posY: 4,
        posZ: 15,
        lookAtY: 3
    },
    
    // 자동 줌 설정
    autoZoom: {
        enabled: true,
        targetZ: 15,
        currentZ: 15,
        targetX: 0,
        currentX: 0,
        targetLookAtX: 0,
        currentLookAtX: 0,
        smoothing: 0.05
    },
    
    // 3D 월드 좌표
    worldPositions: {
        player: { x: -7.0, y: -1.5, z: 0.5 },
        enemies: {
            baseX: 3.0,
            spacingX: 6.0,
            y: -1.5,
            z: 0.5
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    async init(containerEl = null) {
        if (this.isInitialized) {
            console.log('[DDOOBackground] 이미 초기화됨');
            return true;
        }
        
        console.log('[DDOOBackground] 초기화 시작...');
        
        // Three.js 로드
        if (typeof THREE === 'undefined') {
            try {
                await this.loadThreeJS();
                console.log('[DDOOBackground] Three.js 로드 완료');
            } catch (e) {
                console.error('[DDOOBackground] Three.js 로드 실패:', e);
                return false;
            }
        }
        
        try {
            this.createContainer(containerEl);
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.createDungeon();
            this.setupEvents();
            
            this.isInitialized = true;
            this.animate();
            
            console.log('[DDOOBackground] ✅ 초기화 완료!');
            return true;
        } catch (e) {
            console.error('[DDOOBackground] 초기화 오류:', e);
            return false;
        }
    },
    
    // Three.js CDN 로드
    loadThreeJS() {
        return new Promise((resolve, reject) => {
            if (typeof THREE !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 컨테이너 생성
    createContainer(parentEl = null) {
        const old = document.getElementById('ddoo-bg3d');
        if (old) old.remove();
        
        this.container = document.createElement('div');
        this.container.id = 'ddoo-bg3d';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
        `;
        
        if (parentEl) {
            parentEl.insertBefore(this.container, parentEl.firstChild);
        } else {
            document.body.insertBefore(this.container, document.body.firstChild);
        }
    },
    
    // Scene 설정 (어두운 던전 - 붉은빛)
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x030202);
        this.scene.fog = new THREE.FogExp2(0x080404, 0.028);
    },
    
    // Camera 설정
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, this.cameraDefaults.posY, this.cameraDefaults.posZ);
        this.camera.lookAt(0, this.cameraDefaults.lookAtY, 0);
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
    },
    
    // ==========================================
    // 던전 생성
    // ==========================================
    createDungeon() {
        this.dungeonGroup = new THREE.Group();
        this.scene.add(this.dungeonGroup);
        
        // 조명 설정
        this.setupLighting();
        
        // 바닥
        this.createFloor();
        
        // 벽
        this.createWalls();
        
        // 기둥
        this.addPillars();
        
        // 횃불
        this.addTorches();
        
        console.log('[DDOOBackground] 던전 생성 완료');
    },
    
    // 조명 설정
    setupLighting() {
        // 환경광 - 매우 어둡게 (붉은 톤)
        const ambient = new THREE.AmbientLight(0x180808, 0.2);
        this.scene.add(ambient);
        
        // 붉은빛 글로벌 라이트
        const redAmbient = new THREE.PointLight(0xff2200, 0.8, 100);
        redAmbient.position.set(0, 15, -10);
        this.scene.add(redAmbient);
        this.redAmbientLight = redAmbient;
        
        // 바닥에서 올라오는 붉은 광원
        const floorGlow = new THREE.PointLight(0x661100, 0.5, 60);
        floorGlow.position.set(0, -2, 0);
        this.scene.add(floorGlow);
        this.floorGlowLight = floorGlow;
        
        // 상단 조명
        const topLight = new THREE.DirectionalLight(0x201515, 0.1);
        topLight.position.set(0, 20, 0);
        this.scene.add(topLight);
    },
    
    // 바닥 생성
    createFloor() {
        // 기본 바닥
        const baseFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
        );
        baseFloor.rotation.x = -Math.PI / 2;
        baseFloor.position.set(0, -0.05, 0);
        this.dungeonGroup.add(baseFloor);
        
        // 텍스처 바닥 (그리드 패턴)
        const floorGeom = new THREE.PlaneGeometry(80, 80, 16, 16);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x252530,
            roughness: 0.85,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.01;
        this.dungeonGroup.add(floor);
    },
    
    // 벽 생성
    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a28, 
            side: THREE.DoubleSide,
            roughness: 0.9
        });
        
        // 뒷벽
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 25),
            wallMat
        );
        backWall.position.set(0, 12.5, -30);
        this.dungeonGroup.add(backWall);
        
        // 좌벽
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 25),
            wallMat.clone()
        );
        leftWall.position.set(-40, 12.5, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.dungeonGroup.add(leftWall);
        
        // 우벽
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 25),
            wallMat.clone()
        );
        rightWall.position.set(40, 12.5, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.dungeonGroup.add(rightWall);
        
        // 천장
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 60),
            new THREE.MeshStandardMaterial({ color: 0x050508, side: THREE.DoubleSide, roughness: 1.0 })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 25, 0);
        this.dungeonGroup.add(ceiling);
    },
    
    // 기둥
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
    
    // 횃불
    addTorches() {
        const positions = [
            [-25, 6, -25],
            [25, 6, -25],
            [-35, 6, -5],
            [35, 6, -5]
        ];
        
        positions.forEach((pos, i) => {
            // 메인 포인트 라이트
            const light = new THREE.PointLight(0xff3300, 4.0, 25);
            light.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(light);
            
            // 보조 빛
            const ambientLight = new THREE.PointLight(0xcc1100, 1.5, 40);
            ambientLight.position.set(pos[0], pos[1] + 1, pos[2]);
            this.dungeonGroup.add(ambientLight);
            
            // 횃불 거치대
            const holder = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6),
                new THREE.MeshBasicMaterial({ color: 0x1a1a20 })
            );
            holder.position.set(pos[0], pos[1] - 0.7, pos[2]);
            this.dungeonGroup.add(holder);
            
            // 불꽃 코어
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1.0 })
            );
            flame.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(flame);
            
            // 불꽃 글로우
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.6 })
            );
            glow.position.set(pos[0], pos[1], pos[2]);
            this.dungeonGroup.add(glow);
            
            this.torches.push({
                light,
                ambientLight,
                flame,
                glow,
                baseIntensity: 4.0,
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
    
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        
        // 카메라 위치
        const currentZ = this.autoZoom.currentZ;
        const currentX = this.autoZoom.currentX;
        
        this.camera.position.x = currentX + this.mouse.x * this.config.mouseX * 0.5;
        this.camera.position.y = this.cameraDefaults.posY + this.mouse.y * this.config.mouseY * 0.5;
        this.camera.position.z = currentZ;
        
        this.camera.lookAt(this.mouse.x * 0.3, 3, -5);
        
        // 횃불 깜빡임
        this.torches.forEach(torch => {
            const flicker = Math.sin(t * 8 + torch.phase) * 0.6 + 
                           Math.sin(t * 13 + torch.phase * 2) * 0.3 +
                           Math.random() * 0.3;
            
            torch.light.intensity = torch.baseIntensity + flicker;
            if (torch.ambientLight) {
                torch.ambientLight.intensity = 1.2 + flicker * 0.4;
            }
            torch.flame.scale.setScalar(1 + flicker * 0.25);
            if (torch.glow) {
                torch.glow.scale.setScalar(1 + flicker * 0.4);
                torch.glow.material.opacity = 0.4 + flicker * 0.2;
            }
        });
        
        // 글로벌 라이트 깜빡임
        if (this.redAmbientLight) {
            const redFlicker = Math.sin(t * 2) * 0.15 + Math.sin(t * 3.7) * 0.1;
            this.redAmbientLight.intensity = 0.8 + redFlicker;
        }
        if (this.floorGlowLight) {
            const floorFlicker = Math.sin(t * 1.5 + 1) * 0.1;
            this.floorGlowLight.intensity = 0.5 + floorFlicker;
        }
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
    },
    
    // ==========================================
    // 3D → 2D 좌표 변환
    // ==========================================
    project3DToScreen(x, y, z) {
        if (!this.isInitialized || !this.camera) return null;
        
        const vec = new THREE.Vector3(x, y, z);
        this.camera.updateMatrixWorld();
        vec.project(this.camera);
        
        if (vec.z > 1 || vec.z < -1) {
            return { screenX: 0, screenY: 0, scale: 0, visible: false };
        }
        
        const screenX = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-vec.y * 0.5 + 0.5) * window.innerHeight;
        
        // 거리 기반 스케일
        const cameraPos = this.camera.position;
        const distance = Math.sqrt(
            Math.pow(x - cameraPos.x, 2) +
            Math.pow(y - cameraPos.y, 2) +
            Math.pow(z - cameraPos.z, 2)
        );
        
        const baseDistance = 12;
        const scale = baseDistance / Math.max(distance, 1);
        
        return {
            screenX,
            screenY,
            scale: Math.min(Math.max(scale, 0.5), 2.0),
            visible: true,
            depth: distance
        };
    },
    
    // 플레이어 화면 좌표
    getPlayerScreenPosition() {
        const pos = this.worldPositions.player;
        return this.project3DToScreen(pos.x, pos.y, pos.z);
    },
    
    // 적 화면 좌표
    getEnemyScreenPosition(index) {
        const config = this.worldPositions.enemies;
        const x = config.baseX + (index * config.spacingX);
        return this.project3DToScreen(x, config.y, config.z);
    },
    
    // ==========================================
    // 카메라 제어
    // ==========================================
    setZoom(level) {
        const baseZ = this.cameraDefaults.posZ;
        this.autoZoom.targetZ = baseZ * level;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.autoZoom, {
                currentZ: this.autoZoom.targetZ,
                duration: 0.5,
                ease: 'power2.out'
            });
        } else {
            this.autoZoom.currentZ = this.autoZoom.targetZ;
        }
    },
    
    panTo(x, duration = 0.5) {
        this.autoZoom.targetX = x;
        this.autoZoom.targetLookAtX = x * 0.8;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.autoZoom, {
                currentX: x,
                currentLookAtX: x * 0.8,
                duration,
                ease: 'power2.out'
            });
        } else {
            this.autoZoom.currentX = x;
            this.autoZoom.currentLookAtX = x * 0.8;
        }
    },
    
    // ==========================================
    // 이펙트
    // ==========================================
    
    // 타격 광원
    hitFlash(x = 0, y = 3, z = 0, color = 0xffffff, intensity = 3, duration = 150) {
        if (!this.scene) return;
        
        const hitLight = new THREE.PointLight(color, intensity, 50);
        hitLight.position.set(x, y, z);
        this.scene.add(hitLight);
        
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
    
    // 화면 플래시
    screenFlash(color = '#ffffff', duration = 80) {
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
        
        requestAnimationFrame(() => {
            flash.style.transition = `all ${duration}ms ease-out`;
            flash.style.width = '200vmax';
            flash.style.height = '200vmax';
            flash.style.opacity = '0';
        });
        
        setTimeout(() => flash.remove(), duration + 50);
    },
    
    // 피격 비네트
    damageVignette(color = 'rgba(255, 0, 0, 0.5)') {
        const vignette = document.createElement('div');
        vignette.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 9998;
            box-shadow: inset 0 0 100px 50px ${color};
            opacity: 1;
            transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(vignette);
        
        requestAnimationFrame(() => {
            vignette.style.opacity = '0';
        });
        
        setTimeout(() => vignette.remove(), 350);
    },
    
    // 카메라 흔들림
    shake(intensity = 0.5, duration = 200) {
        if (!this.camera) return;
        
        const originalY = this.camera.position.y;
        const originalX = this.camera.position.x;
        let shakeCount = 0;
        const maxShakes = Math.ceil(duration / 30);
        
        const shakeInterval = setInterval(() => {
            this.camera.position.y = originalY + (Math.random() - 0.5) * intensity;
            this.camera.position.x = originalX + (Math.random() - 0.5) * intensity * 0.6;
            shakeCount++;
            if (shakeCount > maxShakes) {
                clearInterval(shakeInterval);
                this.camera.position.y = originalY;
                this.camera.position.x = originalX;
            }
        }, 30);
    },
    
    // ==========================================
    // 테마 변경
    // ==========================================
    setTheme(name) {
        const themes = {
            dungeon: { bg: 0x080810, fog: 0x080404, torch: 0xff5500 },
            forest: { bg: 0x080a08, fog: 0x041004, torch: 0x66ff66 },
            hell: { bg: 0x100505, fog: 0x200808, torch: 0xff2200 },
            ice: { bg: 0x081018, fog: 0x102030, torch: 0x66ccff },
            void: { bg: 0x050510, fog: 0x100820, torch: 0x8844ff }
        };
        
        const th = themes[name] || themes.dungeon;
        
        if (this.scene) {
            this.scene.background.setHex(th.bg);
            this.scene.fog.color.setHex(th.fog);
        }
        
        this.torches.forEach(torch => {
            torch.light.color.setHex(th.torch);
            torch.flame.material.color.setHex(th.torch);
        });
        
        console.log('[DDOOBackground] 테마 변경:', name);
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
        console.log('[DDOOBackground] 정리 완료');
    }
};

// 전역 노출
window.DDOOBackground = DDOOBackground;

console.log('[DDOOBackground] 스크립트 로드됨');

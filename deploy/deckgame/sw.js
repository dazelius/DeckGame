// Shadow Deck - Service Worker
// 캐시 버전 - CSS/JS 변경 시 버전 올려야 함!
const CACHE_NAME = 'shadow-deck-v2';

// 캐시할 파일 목록 (최신 파일 구조 반영)
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './responsive.css',      // mobile.css → responsive.css로 변경
    './card-styles.css',
    './map.css',
    './title.css',
    './town.css',
    './game.js',
    './cards.js',
    './monster.js',
    './shield.js',
    './effects.js',
    './vfx.js',
    './hand-manager.js',
    './relics.js',
    './relics-ui.js',
    './enemy-ai.js',
    './bleed-system.js',
    './critical-system.js',
    './language.js',
    './starter-deck.js',
    './doppelganger.js',
    './ally.js',
    './mobile-touch.js',
    './responsive.js',
    './background.js',
    './stage.js',
    './job-system.js',
    './sound-system.js',
    './bgm.js',
    './damage-system.js',
    './turn-effects.js',
    './card-animation.js',
    './stealth-system.js',
    // 이미지
    './hero.png',
    './slash.png',
    './gangta.png',
    './shield.png',
    './dagger.png',
    './dando.png',
    './mastersword.png',
    './threepower.png',
    './critical.png',
    './combo.png',
    './bleed.png',
    './phoenix.png',
    './diamond.png'
];

// 설치 시 캐시
self.addEventListener('install', (event) => {
    console.log('[SW] 새 버전 설치 중...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 캐시 열기:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('[SW] 캐시 실패:', err);
            })
    );
    // 즉시 활성화 (대기 건너뛰기)
    self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', (event) => {
    console.log('[SW] 활성화 중...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] 이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // 즉시 클라이언트 제어
    self.clients.claim();
});

// 요청 가로채기 (네트워크 우선, 캐시 폴백으로 변경!)
self.addEventListener('fetch', (event) => {
    // CSS/JS 파일은 네트워크 우선
    const url = new URL(event.request.url);
    const isAsset = url.pathname.endsWith('.css') || 
                   url.pathname.endsWith('.js') ||
                   url.pathname.endsWith('.html');
    
    if (isAsset) {
        // 네트워크 우선 전략 (최신 파일 보장)
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 성공하면 캐시 업데이트
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // 네트워크 실패 시 캐시 사용
                    return caches.match(event.request);
                })
        );
    } else {
        // 이미지 등은 캐시 우선 (성능)
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200) {
                                return response;
                            }
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            return response;
                        });
                })
        );
    }
});

console.log('[SW] Service Worker 로드됨 - 버전:', CACHE_NAME);

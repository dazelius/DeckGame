#!/usr/bin/env python3
"""
🎮 DDOO Game 로컬 서버
http://localhost:8080 에서 게임 실행
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 3000

# 현재 디렉토리로 이동
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

# MIME 타입 추가
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.mp3': 'audio/mpeg',
})

print(f"""
╔══════════════════════════════════════════════════╗
║           🎮 DDOO Game Server                     ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║   🌐 Game:    http://localhost:{PORT}             ║
║   🛠️ Studio:  http://localhost:{PORT}/studio.html ║
║                                                  ║
║   Press Ctrl+C to stop                           ║
╚══════════════════════════════════════════════════╝
""")

# 브라우저 자동 열기
webbrowser.open(f'http://localhost:{PORT}')

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 서버 종료")

#!/usr/bin/env python3
"""
Shadow Deck - 로컬 개발 서버
모바일 테스트 및 로컬 네트워크 접속용
"""

import http.server
import socketserver
import os
import sys
import socket

# 설정
PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    """커스텀 HTTP 핸들러"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # CORS 헤더 추가 (개발용)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # 캐시 비활성화 (개발용)
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def log_message(self, format, *args):
        # 컬러 로그
        print(f"[{self.log_date_time_string()}] {args[0]}")

def get_local_ip():
    """로컬 IP 주소 가져오기"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def main():
    os.chdir(DIRECTORY)
    
    local_ip = get_local_ip()
    
    print("=" * 50)
    print("  Shadow Deck - Development Server")
    print("=" * 50)
    print()
    print(f"  Serving: {DIRECTORY}")
    print()
    print("  Access URLs:")
    print(f"    Local:   http://localhost:{PORT}")
    print(f"    Network: http://{local_ip}:{PORT}")
    print()
    print("  Mobile: 같은 네트워크에서 Network URL 접속")
    print()
    print("  Press Ctrl+C to stop")
    print("=" * 50)
    print()
    
    # 0.0.0.0 바인딩으로 모든 네트워크 인터페이스에서 접속 가능
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버 종료...")
            httpd.shutdown()

if __name__ == "__main__":
    main()


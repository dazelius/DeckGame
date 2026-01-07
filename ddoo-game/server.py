#!/usr/bin/env python3
"""
DDOO Game Local Server
http://localhost:3000
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 3000

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

# Add MIME types
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.mp3': 'audio/mpeg',
})

print(f"""
====================================================
           DDOO Game Server
====================================================

   Game:    http://localhost:{PORT}
   Studio:  http://localhost:{PORT}/studio.html

   Press Ctrl+C to stop
====================================================
""")

# Auto open browser
webbrowser.open(f'http://localhost:{PORT}')

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")

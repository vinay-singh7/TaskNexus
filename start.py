#!/usr/bin/env python3
"""
TaskNexus — Local Server
Run once: python3 start.py
Opens app at http://localhost:8765/app.html
Proxies file uploads to 0x0.st (bypasses browser CORS restriction)
"""
import http.server, urllib.request, os, threading, webbrowser, sys

PORT = 8765
BASE = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=BASE, **kw)

    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')

    def do_OPTIONS(self):
        self.send_response(200)
        self.cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            length = int(self.headers.get('Content-Length', 0))
            ct     = self.headers.get('Content-Type', '')
            body   = self.rfile.read(length)
            # Forward to 0x0.st
            req = urllib.request.Request('https://0x0.st', data=body, method='POST')
            req.add_header('Content-Type', ct)
            try:
                resp = urllib.request.urlopen(req, timeout=60)
                url  = resp.read().decode().strip()
                self.send_response(200)
                self.cors()
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(url.encode())
            except Exception as e:
                self.send_response(502)
                self.cors()
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            self.send_response(405)
            self.end_headers()

    def log_message(self, fmt, *args):
        print(f'  {args[0]} {args[1]}')

print(f'\n  ✦ TaskNexus server running at http://localhost:{PORT}')
print(f'  ✦ Opening app...\n')
threading.Timer(1.2, lambda: webbrowser.open(f'http://localhost:{PORT}/app.html')).start()
try:
    http.server.HTTPServer(('localhost', PORT), Handler).serve_forever()
except KeyboardInterrupt:
    print('\n  Server stopped.')
    sys.exit(0)

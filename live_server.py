#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import json
import time
import threading
import webbrowser
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class LiveReloadHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Inject live reload script into HTML files
        if self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/livereload':
            # Simple endpoint for checking reload status
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'reload': getattr(self.server, 'should_reload', False)}).encode())
            self.server.should_reload = False
            return
        
        super().do_GET()

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, server):
        self.server = server
        
    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(('.html', '.css', '.js')):
            print(f"🔄 File changed: {os.path.basename(event.src_path)}")
            self.server.should_reload = True

def inject_livereload_script():
    """Inject live reload script into index.html"""
    html_file = "index.html"
    if not os.path.exists(html_file):
        return
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if script is already injected
    if 'LIVE_RELOAD_SCRIPT' in content:
        return
    
    live_reload_script = """
    <!-- LIVE_RELOAD_SCRIPT -->
    <script>
    (function() {
        let lastModified = Date.now();
        setInterval(function() {
            fetch('/livereload')
                .then(response => response.json())
                .then(data => {
                    if (data.reload) {
                        console.log('🔄 Files changed, reloading...');
                        window.location.reload();
                    }
                })
                .catch(() => {}); // Ignore errors
        }, 1000);
    })();
    </script>
    """
    
    # Inject before closing </body> tag
    content = content.replace('</body>', live_reload_script + '\n</body>')
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Live reload script injected into index.html")

def start_live_server(port=8000, directory="main_page"):
    # Change to project directory
    os.chdir(directory)
    
    # Inject live reload script
    inject_livereload_script()
    
    # Set up file watcher
    handler = FileChangeHandler(None)
    observer = Observer()
    observer.schedule(handler, ".", recursive=True)
    observer.start()
    
    # Start server
    with socketserver.TCPServer(("", port), LiveReloadHandler) as httpd:
        handler.server = httpd
        httpd.should_reload = False
        
        print(f"🔥 Live Server running at http://localhost:{port}")
        print(f"📁 Serving: {os.getcwd()}")
        print("🔄 Auto-refresh enabled!")
        print("Press Ctrl+C to stop")
        
        # Open browser
        webbrowser.open(f"http://localhost:{port}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            observer.stop()
    
    observer.join()

if __name__ == "__main__":
    start_live_server()
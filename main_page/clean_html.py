#!/usr/bin/env python3
"""
HTML Script Cleaner for Investing Markets
Automatically removes external scripts and cleans up HTML for backend integration
"""

import re
import os
import shutil
from pathlib import Path
from datetime import datetime

class HTMLCleaner:
    def __init__(self, input_file="index.html", output_file="index-clean.html"):
        self.input_file = Path(input_file)
        self.output_file = Path(output_file)
        self.backup_file = Path(f"index-backup-{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
        
        # Define patterns to remove
        self.remove_patterns = [
            # External script tags (various formats)
            r'<script[^>]*src="https://cdn\.investing-market\.com[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://monetization\.prod\.invmed\.co[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://c\.amazon-adsystem\.com[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://accounts\.google\.com[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://securepubads\.g\.doubleclick\.net[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://static\.cloudflareinsights\.com[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://promos\.investing-market\.com[^"]*"[^>]*></script>',
            r'<script[^>]*src="https://static\.hotjar\.com[^"]*"[^>]*></script>',
            
            # Self-closing script tags
            r'<script[^>]*src="https://[^"]*investing-market\.com[^"]*"[^>]*/?>',
            r'<script[^>]*defer[^>]*src="https://cdn\.investing-market\.com[^"]*"[^>]*/?>',
            
            # Next.js specific scripts
            r'<script[^>]*src="[^"]*/_next/static/[^"]*"[^>]*></script>',
            r'<script[^>]*src="[^"]*/_next/static/[^"]*"[^>]*/?>',
            
            # Analytics and tracking scripts
            r'<script[^>]*data-cf-beacon[^>]*></script>',
            r'<script[^>]*data-nscript[^>]*></script>',
            
            # Inline scripts with specific patterns
            r'<script[^>]*>\s*\(function\(h,\s*o,\s*t,\s*j,\s*a,\s*r\)[^<]*</script>',  # Hotjar
            r'<script[^>]*>\s*window\.dataLayer[^<]*</script>',  # Google Analytics setup
            r'<script[^>]*>\s*try\s*{[^<]*userEmailStr[^<]*</script>',  # User email tracking
            
            # __NEXT_DATA__ block (largest cleanup)
            r'<script\s+id="__NEXT_DATA__"[^>]*>[\s\S]*?</script>',
            
            # Cloudflare and other tracking
            r'<script[^>]*>\s*\(function\(\)\s*{[\s\S]*?cf-beacon[\s\S]*?</script>',
        ]
        
        # CSS patterns to update (change external to local)
        self.css_patterns = [
            (r'https://cdn\.investing-market\.com/x/[^/]+/_next/static/css/', 'css/'),
        ]
        
        # Preload patterns to remove
        self.preload_patterns = [
            r'<link[^>]*rel="preload"[^>]*href="https://cdn\.investing-market\.com[^"]*"[^>]*>',
            r'<link[^>]*rel="dns-prefetch"[^>]*href="[^"]*investing-market\.com[^"]*"[^>]*>',
            r'<link[^>]*rel="preconnect"[^>]*href="[^"]*investing-market\.com[^"]*"[^>]*>',
        ]

    def create_backup(self):
        """Create a backup of the original file"""
        if self.input_file.exists():
            shutil.copy2(self.input_file, self.backup_file)
            print(f"✅ Backup created: {self.backup_file}")
        else:
            print(f"❌ Input file not found: {self.input_file}")
            return False
        return True

    def read_html(self):
        """Read the HTML file"""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"✅ Read HTML file: {len(content)} characters")
            return content
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return None

    def remove_external_scripts(self, content):
        """Remove all external script tags"""
        original_length = len(content)
        scripts_removed = 0
        
        print("\n🧹 Removing external scripts...")
        
        for i, pattern in enumerate(self.remove_patterns):
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            if matches:
                print(f"   - Pattern {i+1}: Found {len(matches)} matches")
                for match in matches[:3]:  # Show first 3 matches
                    preview = match[:100] + "..." if len(match) > 100 else match
                    print(f"     • {preview}")
                if len(matches) > 3:
                    print(f"     • ... and {len(matches) - 3} more")
                scripts_removed += len(matches)
            
            content = re.sub(pattern, '', content, flags=re.IGNORECASE | re.DOTALL)
        
        # Clean up multiple newlines
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        print(f"✅ Removed {scripts_removed} external scripts")
        print(f"📊 Size reduction: {original_length - len(content)} characters")
        
        return content

    def update_css_references(self, content):
        """Update CSS references from external to local"""
        print("\n🎨 Updating CSS references...")
        
        for pattern, replacement in self.css_patterns:
            matches = re.findall(pattern, content)
            if matches:
                print(f"   - Updating {len(matches)} CSS references")
                content = re.sub(pattern, replacement, content)
        
        return content

    def remove_preload_links(self, content):
        """Remove external preload and dns-prefetch links"""
        print("\n🔗 Removing external preload links...")
        
        links_removed = 0
        for pattern in self.preload_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                print(f"   - Removing {len(matches)} preload links")
                links_removed += len(matches)
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        
        print(f"✅ Removed {links_removed} preload links")
        return content

    def add_new_scripts(self, content):
        """Add our new script references"""
        print("\n📜 Adding new script references...")
        
        # Our new scripts to add before </body>
        new_scripts = '''
    <!-- OUR NEW JAVASCRIPT INTEGRATION -->
    
    <!-- Configuration MUST load first -->
    <script src="pages/config.js"></script>
    
    <!-- API Client -->
    <script src="pages/api-client.js"></script>
    
    <!-- Main Application -->
    <script src="pages/main-app.js"></script>
    
    <!-- Live reload script (remove in production) -->
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
'''
        
        # Add before closing body tag
        if '</body>' in content:
            content = content.replace('</body>', new_scripts + '\n</body>')
            print("✅ Added new scripts before </body>")
        else:
            print("⚠️  No </body> tag found, adding scripts at end")
            content += new_scripts
        
        return content

    def add_critical_styles(self, content):
        """Add critical CSS for our new functionality"""
        critical_css = '''
    <style>
        /* Critical styles for connection indicator */
        .connection-status {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .connection-status.connected {
            background-color: #22C55E;
            color: white;
        }
        
        .connection-status.disconnected {
            background-color: #EF4444;
            color: white;
        }
        
        /* Price update animations */
        .price-update {
            animation: priceFlash 1s ease-in-out;
        }
        
        @keyframes priceFlash {
            0% { background-color: #FF7901; color: white; transform: scale(1.05); }
            100% { background-color: transparent; transform: scale(1); }
        }
        
        .change.positive {
            color: #22C55E;
            font-weight: 600;
        }
        
        .change.negative {
            color: #EF4444;
            font-weight: 600;
        }
        
        /* Loading states */
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
    </style>
'''
        
        # Add before closing head tag
        if '</head>' in content:
            content = content.replace('</head>', critical_css + '\n</head>')
            print("✅ Added critical CSS styles")
        
        return content

    def write_cleaned_html(self, content):
        """Write the cleaned HTML to output file"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Cleaned HTML written to: {self.output_file}")
            return True
        except Exception as e:
            print(f"❌ Error writing file: {e}")
            return False

    def analyze_remaining_scripts(self, content):
        """Analyze what scripts remain after cleaning"""
        print("\n📊 Analysis of remaining scripts:")
        
        script_pattern = r'<script[^>]*>.*?</script>'
        remaining_scripts = re.findall(script_pattern, content, re.DOTALL | re.IGNORECASE)
        
        print(f"📜 Remaining scripts: {len(remaining_scripts)}")
        
        for i, script in enumerate(remaining_scripts):
            preview = script[:150] + "..." if len(script) > 150 else script
            print(f"   {i+1}. {preview}")
        
        # Check for external references
        external_pattern = r'https?://[^"\s>]+'
        external_refs = re.findall(external_pattern, content)
        external_domains = set()
        
        for ref in external_refs:
            if 'investing-market.com' in ref or 'investing.com' in ref:
                domain = ref.split('/')[2] if len(ref.split('/')) > 2 else ref
                external_domains.add(domain)
        
        if external_domains:
            print(f"\n⚠️  Still found external references to:")
            for domain in sorted(external_domains):
                print(f"   - {domain}")
        else:
            print("\n✅ No external investing.com references found!")

    def clean(self):
        """Main cleaning process"""
        print("🚀 Starting HTML Cleanup Process...")
        print("=" * 50)
        
        # Step 1: Backup
        if not self.create_backup():
            return False
        
        # Step 2: Read HTML
        content = self.read_html()
        if not content:
            return False
        
        # Step 3: Remove external scripts
        content = self.remove_external_scripts(content)
        
        # Step 4: Update CSS references
        content = self.update_css_references(content)
        
        # Step 5: Remove preload links
        content = self.remove_preload_links(content)
        
        # Step 6: Add critical styles
        content = self.add_critical_styles(content)
        
        # Step 7: Add new scripts
        content = self.add_new_scripts(content)
        
        # Step 8: Write cleaned file
        if not self.write_cleaned_html(content):
            return False
        
        # Step 9: Analysis
        self.analyze_remaining_scripts(content)
        
        print("\n" + "=" * 50)
        print("🎉 HTML Cleanup Complete!")
        print(f"📁 Original file: {self.input_file}")
        print(f"💾 Backup file: {self.backup_file}")
        print(f"✨ Clean file: {self.output_file}")
        print("\n📋 Next steps:")
        print("1. Rename index-clean.html to index.html")
        print("2. Ensure config.js, api-client.js, main-app.js exist in pages/ folder")
        print("3. Start your backend: uvicorn main:app --port 8001 --reload")
        print("4. Test the integration!")
        
        return True

def main():
    """Main function"""
    print("HTML Script Cleaner for Investing Markets")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("index.html").exists():
        print("❌ index.html not found in current directory")
        print("Please run this script from your main_page directory")
        return
    
    # Create cleaner and run
    cleaner = HTMLCleaner()
    success = cleaner.clean()
    
    if success:
        print("\n🎯 Ready to test your integration!")
    else:
        print("\n❌ Cleanup failed. Check error messages above.")

if __name__ == "__main__":
    main()
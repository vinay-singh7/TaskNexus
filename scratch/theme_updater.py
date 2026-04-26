import os
import re

tools_dir = '/Users/apple/TaskNexus/js/tools'

# Mapping of dark-mode inline styles to light-mode equivalents or CSS variables
replacements = [
    # General white translucencies -> surface variants or neutral borders
    (r'rgba\(255,255,255,\s*0\.0[1-4]\)', 'var(--surface-2)'),
    (r'rgba\(255,255,255,\s*0\.0[5-9]\)', 'var(--surface-3)'),
    (r'rgba\(255,255,255,\s*0\.1[0-9]\)', 'var(--border)'),
    (r'rgba\(255,255,255,\s*0\.[2-9][0-9]*\)', 'var(--border-2)'),
    
    # General black translucencies
    (r'rgba\(0,0,0,\s*0\.[1-3]\)', 'var(--surface-2)'),
    (r'rgba\(0,0,0,\s*0\.[4-9]\)', 'var(--surface-3)'),
    
    # Specific colors
    (r'color:#c4b5fd', 'color:var(--accent)'), # Light purple text to dark purple
    (r'color:\s*#f0f0ff', 'color:var(--text)'),
    (r'color:\s*#a5b4fc', 'color:var(--primary)'),
    (r'color:#86efac', 'color:var(--success)'),
    (r'color:#fca5a5', 'color:var(--danger)'),
    (r'color:#fcd34d', 'color:var(--warning)'),
    (r'color:#93c5fd', 'color:var(--info)'),
]

for filename in os.listdir(tools_dir):
    if not filename.endswith('.js'):
        continue
    filepath = os.path.join(tools_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filename}")
print("Done")

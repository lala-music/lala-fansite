import re

with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/fanclub-dashboard.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the specific syntax error
old_str = '''              });
          }
              });
          }
  
          function renderClientDiaryList() {'''

new_str = '''              });
          }
  
          function renderClientDiaryList() {'''

text = text.replace(old_str, new_str)

with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/fanclub-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done fixing dashboard.')

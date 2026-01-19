
import os

path = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF11-Task-Generation-Advanced.json'

with open(path, 'r') as f:
    content = f.read()

# Find the architecture_summary part
keyword = 'architecture_summary'
idx = content.find(keyword)

if idx != -1:
    # Print 200 chars around it
    snippet = content[idx:idx+200]
    print(f"Snippet found: {snippet!r}")
else:
    print("Keyword not found")

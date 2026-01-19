import pypdf
import sys

files = [
    '/Users/chiuyongren/Desktop/RFP測試/國際產學教育合作聯盟學生管理系統建置企劃書(定稿).pdf',
    '/Users/chiuyongren/Desktop/RFP測試/115年觀光e學院建置維運案服務建議書_哈瑪星科技股份有限公司.pdf'
]

def extract_toc(file_path):
    print(f"\n--- Analyzing: {file_path.split('/')[-1]} ---")
    try:
        reader = pypdf.PdfReader(file_path)
        # Extract text from first 15 pages (usually TOC is within first 15 pages)
        text = ""
        for i in range(min(15, len(reader.pages))):
            page_text = reader.pages[i].extract_text()
            if page_text:
                text += page_text + "\n"
        
        # Simple cleanup to make it readable
        lines = text.split('\n')
        for line in lines:
            normalized = line.strip()
            # Heuristic to find TOC lines: usually start with a number or contain dots '......'
            # But let's just print lines that look like headers or TOC entries
            if len(normalized) > 0:
                print(normalized)
                
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    for f in files:
        extract_toc(f)

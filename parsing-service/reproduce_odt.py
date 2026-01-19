import os
from docling.document_converter import DocumentConverter

try:
    converter = DocumentConverter()
    # Create a dummy file with .odt extension
    with open("test.odt", "w") as f:
        f.write("dummy content")
    
    print("Attempting to convert test.odt...")
    converter.convert("test.odt")
except Exception as e:
    print(f"Caught expected error: {e}")
finally:
    if os.path.exists("test.odt"):
        os.remove("test.odt")

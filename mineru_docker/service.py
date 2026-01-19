import os
import shutil
import tempfile
import time
import zipfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import subprocess

# DOCX dependencies
try:
    from docx import Document
    from docx.document import Document as _Document
    from docx.oxml.text.paragraph import CT_P
    from docx.oxml.table import CT_Tbl
    from docx.table import _Cell, Table
    from docx.text.paragraph import Paragraph
except ImportError:
    pass

app = FastAPI(title="MinerU Docker Service (CPU + DOCX)", version="1.1.0")

MINERU_CMD = "mineru"

def iter_block_items(parent):
    """
    Generate a reference to each paragraph and table child within *parent*,
    in document order. Each returned value is an instance of either Table or
    Paragraph. *parent* would most commonly be a reference to a main
    Document object, but also works for a _Cell object.
    """
    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("something's not right")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def parse_docx_advanced(docx_path, output_dir):
    """
    Parses a DOCX file with high fidelity, extracting headings, tables, and images.
    Returns the generated Markdown content.
    """
    document = Document(docx_path)
    md_lines = []
    
    # Create images directory
    images_dir = os.path.join(output_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    # Extract images from the DOCX relationships
    # This is a bit complex in python-docx, but we can iterate through inline shapes or rIds.
    # For robust image extraction, accessing the zip/rels directly is often safer/easier for saving files
    image_map = {} # rId -> filename

    # Basic Image Extraction Strategy: extract all media from zip and map them
    # Note: python-docx handles this internally but mapping back to paragraph position can be tricky.
    # We will rely on extracting 'blip' relationships.
    
    rels = document.part.rels
    for rel in rels.values():
        if "image" in rel.target_ref:
            # It's an image
            image_data = rel.target_part.blob
            image_ext = rel.target_ref.split('.')[-1]
            image_filename = f"image_{len(image_map)}.{image_ext}"
            image_path = os.path.join(images_dir, image_filename)
            with open(image_path, "wb") as img_f:
                img_f.write(image_data)
            image_map[rel.rId] = image_filename

    # Parser Loop
    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            style_name = block.style.name.lower()
            
            # 1. Handle Headings
            if 'heading' in style_name:
                try:
                    level = int(style_name.split('heading')[-1].strip())
                    md_lines.append(f"{'#' * level} {text}")
                except:
                    md_lines.append(f"**{text}**") # Fallback
            
            # 2. Handle List Value (Bullets/Numbering)
            # Python-docx doesn't explicitly give '1.', '•' easily without XML parsing
            # We check abstract numId/ilvl. For now, simple detection:
            elif 'list' in style_name:
                md_lines.append(f"- {text}")
            
            # 3. Handle Normal Text or Empty Lines
            elif not text:
                 md_lines.append("") # Preserve blank lines (vertical whitespace)
            else:
                 md_lines.append(text)

            # 4. Handle Images in this paragraph (Inline Shapes)
            # This is complex; `python-docx` doesn't iterate inline shapes in flow order easily with text.
            # Simplified approach: If paragraph contains drawing/rId, insert placeholder.
            # For high fidelity, we'd check paragraph xml for <w:drawing> and match rId.
            if block._p.xpath('.//a:blip'):
                # Found image reference
                for blip in block._p.xpath('.//a:blip'):
                    rId = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                    if rId in image_map:
                         md_lines.append(f"![Image]({os.path.join('images', image_map[rId])})")

        elif isinstance(block, Table):
            # Parse Table to Markdown
            rows = block.rows
            if not rows: continue
            
            # Construct MD table
            # Assuming first row is header
            header_cells = [cell.text.strip().replace('\n', ' ') for cell in rows[0].cells]
            md_lines.append(f"| {' | '.join(header_cells)} |")
            md_lines.append(f"| {' | '.join(['---'] * len(header_cells))} |")
            
            for row in rows[1:]:
                row_cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
                md_lines.append(f"| {' | '.join(row_cells)} |")
            
            md_lines.append("") # Spacing after table

    return "\n".join(md_lines)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "service": "mineru-docker-cpu-docx",
        "version": "1.1.0"
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "MinerU + DOCX Docker Service",
        "version": "1.1.0",
        "mode": "CPU",
        "supported_formats": ["pdf", "docx"],
        "endpoints": {
            "health": "/health",
            "parse": "/parse (POST)",
            "docs": "/docs"
        }
    }

@app.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    filename = file.filename.lower()
    
    if not (filename.endswith(".pdf") or filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    timestamp = int(time.time())
    work_dir = tempfile.mkdtemp(prefix=f"parse_{timestamp}_")
    input_path = os.path.join(work_dir, file.filename)
    output_dir = os.path.join(work_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        md_content = ""
        engine_used = ""
        
        # Dispatch Logic
        if filename.endswith(".pdf"):
            print(f"Starting MinerU parsing for {file.filename} (CPU Mode)...")
            engine_used = "mineru-docker-cpu"
            result = subprocess.run(
                [MINERU_CMD, "-p", input_path, "-o", output_dir],
                capture_output=True,
                text=True,
                env=os.environ
            )
            print(f"MinerU Exit Code: {result.returncode}")
            if result.returncode != 0:
                raise Exception(f"MinerU failed: {result.stderr}")
                
        elif filename.endswith(".docx"):
            print(f"Starting DOCX parsing for {file.filename} (python-docx)...")
            engine_used = "python-docx-advanced"
            md_content = parse_docx_advanced(input_path, output_dir)
            
            # Write MD file manually since parse_docx_advanced returns string
            md_filename = f"{os.path.splitext(file.filename)[0]}.md"
            with open(os.path.join(output_dir, md_filename), "w", encoding="utf-8") as f:
                f.write(md_content)

        # Common Output Processing (Copy to Persistent Volume)
        persistent_output_dir = "/app/output"
        persistent_md_path = os.path.join(persistent_output_dir, f"{os.path.splitext(file.filename)[0]}.md")
        os.makedirs(persistent_output_dir, exist_ok=True)

        # Find the MD file (MinerU generates one, DOCX we wrote one)
        found_md = False
        final_md_content = ""
        
        for root, dirs, files in os.walk(output_dir):
            for f in files:
                if f.endswith(".md"):
                    source_path = os.path.join(root, f)
                    with open(source_path, "r", encoding="utf-8") as md_file:
                        final_md_content = md_file.read()
                    
                    shutil.copy2(source_path, persistent_md_path)
                    
                    # Copy images directory if it exists
                    images_dir = os.path.join(root, "images")
                    if os.path.isdir(images_dir):
                        persistent_images_dir = os.path.join(persistent_output_dir, "images")
                        if os.path.exists(persistent_images_dir):
                            shutil.rmtree(persistent_images_dir)
                        shutil.copytree(images_dir, persistent_images_dir)
                        
                    found_md = True
                    break
            if found_md: break

        if not found_md:
             return JSONResponse(status_code=500, content={"detail": "Markdown output not found."})

        return {
            "filename": file.filename,
            "saved_to": persistent_md_path,
            "content": final_md_content[:500] + "...",
            "status": "success",
            "engine": engine_used
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": str(e)})
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

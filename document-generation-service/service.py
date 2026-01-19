"""
Document Generation Service
使用 docxtpl (基於 python-docx + Jinja2) 生成高保真 Word 文件
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from docxtpl import DocxTemplate
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import subprocess
import json
import tempfile
from pathlib import Path
import logging
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Document Generation Service")

# 啟用 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 使用相對路徑
BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "output"

# 建立目錄
TEMPLATES_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "service": "document-generation",
        "libreoffice": check_libreoffice()
    }

def check_libreoffice():
    """檢查 LibreOffice 是否可用"""
    try:
        result = subprocess.run(
            ["soffice", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else "not available"
    except Exception as e:
        return f"error: {str(e)}"

@app.post("/generate")
async def generate_document(
    template_name: str = Form(...),
    context_json: str = Form(...),
    output_format: str = Form("docx")  # docx 或 pdf
):
    """
    生成文件
    
    Args:
        template_name: 範本檔名 (例如: "rfp_response.docx")
        context_json: JSON 字串,包含要填入的數據
        output_format: 輸出格式 (docx 或 pdf)
    
    Returns:
        生成的文件
    """
    try:
        # 1. 載入範本
        template_path = TEMPLATES_DIR / template_name
        if not template_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"範本不存在: {template_name}"
            )
        
        logger.info(f"載入範本: {template_path}")
        doc = DocxTemplate(template_path)
        
        # 2. 解析 JSON 數據
        try:
            context = json.loads(context_json)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=400,
                detail=f"JSON 格式錯誤: {str(e)}"
            )
        
        logger.info(f"填入數據: {list(context.keys())}")
        
        # 3. 渲染文件
        doc.render(context)
        
        # 4. 儲存為 Docx
        output_filename = f"generated_{template_name}"
        docx_path = OUTPUT_DIR / output_filename
        doc.save(docx_path)
        
        logger.info(f"生成 Docx: {docx_path}")
        
        # 5. 如果需要 PDF,進行轉檔
        if output_format.lower() == "pdf":
            pdf_path = docx_path.with_suffix(".pdf")
            convert_to_pdf(docx_path, pdf_path)
            return FileResponse(
                pdf_path,
                media_type="application/pdf",
                filename=pdf_path.name
            )
        
        # 6. 返回 Docx
        return FileResponse(
            docx_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=docx_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成文件失敗: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def convert_to_pdf(docx_path: Path, pdf_path: Path):
    """使用 LibreOffice 將 Docx 轉為 PDF"""
    try:
        logger.info(f"轉檔為 PDF: {docx_path} -> {pdf_path}")
        
        result = subprocess.run(
            [
                "soffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", str(pdf_path.parent),
                str(docx_path)
            ],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice 轉檔失敗: {result.stderr}")
        
        logger.info("PDF 轉檔成功")
        
    except subprocess.TimeoutExpired:
        raise Exception("PDF 轉檔超時 (>60秒)")
    except Exception as e:
        raise Exception(f"PDF 轉檔錯誤: {str(e)}")

@app.post("/upload-template")
async def upload_template(file: UploadFile = File(...)):
    """上傳新的 Word 範本"""
    try:
        if not file.filename.endswith(".docx"):
            raise HTTPException(
                status_code=400,
                detail="只接受 .docx 格式"
            )
        
        template_path = TEMPLATES_DIR / file.filename
        
        with open(template_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"範本上傳成功: {file.filename}")
        
        return {
            "message": "範本上傳成功",
            "filename": file.filename,
            "path": str(template_path)
        }
        
    except Exception as e:
        logger.error(f"上傳失敗: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Pydantic Models
class SectionData(BaseModel):
    id: str
    title: str
    content: str


class GenerateFromTemplateRequest(BaseModel):
    project_id: str
    project_title: str
    template_id: str
    template_file_path: str
    sections: List[SectionData]
    user_id: str


@app.post("/generate-from-template")
async def generate_from_template(request: GenerateFromTemplateRequest):
    """
    從 Supabase 下載範本並生成文件

    Args:
        request: 包含專案資訊、範本路徑和章節資料

    Returns:
        生成的文件下載連結
    """
    try:
        logger.info(f"開始生成文件: {request.project_title}")

        # 1. 從 Supabase Storage 下載範本
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase 環境變數未設定"
            )

        # 下載範本檔案
        template_url = f"{supabase_url}/storage/v1/object/public/{request.template_file_path}"
        logger.info(f"下載範本: {template_url}")

        async with httpx.AsyncClient() as client:
            response = await client.get(template_url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=404,
                    detail=f"無法下載範本: {response.status_code}"
                )

            # 儲存範本到暫存檔
            temp_template = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
            temp_template.write(response.content)
            temp_template.close()

        logger.info(f"範本已下載: {temp_template.name}")

        # 2. 載入範本
        doc = DocxTemplate(temp_template.name)

        # 3. 準備章節資料
        context = {
            "project_title": request.project_title,
            "sections": [
                {
                    "title": section.title,
                    "content": section.content
                }
                for section in request.sections
            ]
        }

        logger.info(f"填入 {len(request.sections)} 個章節")

        # 4. 渲染文件
        doc.render(context)

        # 5. 儲存生成的文件
        output_filename = f"{request.project_title}_{request.project_id[:8]}.docx"
        output_path = OUTPUT_DIR / output_filename
        doc.save(output_path)

        logger.info(f"文件已生成: {output_path}")

        # 6. 上傳到 Supabase Storage
        storage_path = f"generated-documents/{output_filename}"
        upload_url = f"{supabase_url}/storage/v1/object/generated-documents/{output_filename}"

        with open(output_path, "rb") as f:
            async with httpx.AsyncClient() as client:
                upload_response = await client.post(
                    upload_url,
                    headers={
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    },
                    files={"file": f}
                )

        if upload_response.status_code not in [200, 201]:
            logger.warning(f"上傳失敗: {upload_response.status_code}, 返回本地檔案")
            # 如果上傳失敗,返回本地檔案
            return FileResponse(
                output_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename=output_filename
            )

        # 7. 生成公開下載連結
        download_url = f"{supabase_url}/storage/v1/object/public/generated-documents/{output_filename}"

        logger.info(f"✅ 文件生成成功: {download_url}")

        # 清理暫存檔
        os.unlink(temp_template.name)

        return {
            "success": True,
            "download_url": download_url,
            "filename": output_filename,
            "sections_count": len(request.sections)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成文件失敗: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)


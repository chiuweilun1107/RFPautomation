#!/usr/bin/env python3
"""
替換 DOCX 文件中的字體名稱
將「標楷體」等字體名稱替換為 ONLYOFFICE 可識別的字體
"""

import sys
import os
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import shutil
import tempfile

def replace_font_in_docx(input_file, output_file, font_mappings):
    """
    替換 .docx 文件中的字體名稱

    Args:
        input_file: 輸入 .docx 文件路徑
        output_file: 輸出 .docx 文件路徑
        font_mappings: 字體映射字典 {舊字體: 新字體}
    """
    # 建立臨時目錄
    temp_dir = tempfile.mkdtemp()

    try:
        # 解壓 docx 文件
        with ZipFile(input_file, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)

        # 定義 XML 命名空間
        namespaces = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        }

        # 註冊命名空間（避免輸出時產生 ns0: 前綴）
        ET.register_namespace('w', namespaces['w'])
        ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        ET.register_namespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
        ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
        ET.register_namespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture')

        replaced_count = 0

        # 處理 document.xml（主文檔內容）
        doc_xml_path = os.path.join(temp_dir, 'word', 'document.xml')
        if os.path.exists(doc_xml_path):
            replaced_count += process_xml_file(doc_xml_path, namespaces, font_mappings)

        # 處理 styles.xml（樣式定義）
        styles_xml_path = os.path.join(temp_dir, 'word', 'styles.xml')
        if os.path.exists(styles_xml_path):
            replaced_count += process_xml_file(styles_xml_path, namespaces, font_mappings)

        # 處理 numbering.xml（編號樣式）
        numbering_xml_path = os.path.join(temp_dir, 'word', 'numbering.xml')
        if os.path.exists(numbering_xml_path):
            replaced_count += process_xml_file(numbering_xml_path, namespaces, font_mappings)

        print(f"✅ 已替換 {replaced_count} 個字體引用", file=sys.stderr)

        # 重新打包 zip
        with ZipFile(output_file, 'w') as zip_ref:
            for foldername, subfolders, filenames in os.walk(temp_dir):
                for filename in filenames:
                    file_path = os.path.join(foldername, filename)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zip_ref.write(file_path, arcname)

    finally:
        # 清理臨時目錄
        shutil.rmtree(temp_dir)

def process_xml_file(xml_path, namespaces, font_mappings):
    """處理單個 XML 文件中的字體引用"""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    replaced_count = 0

    # 找到所有 w:rFonts 元素
    for rfonts in root.findall('.//w:rFonts', namespaces):
        # 檢查所有字體屬性
        for attr in ['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ascii',
                     '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}hAnsi',
                     '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}eastAsia',
                     '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cs']:
            if attr in rfonts.attrib:
                old_font = rfonts.attrib[attr]
                if old_font in font_mappings:
                    rfonts.attrib[attr] = font_mappings[old_font]
                    replaced_count += 1

    # 寫回文件
    tree.write(xml_path, encoding='utf-8', xml_declaration=True)
    return replaced_count

def main():
    if len(sys.argv) < 2:
        print("使用方式: python3 replace-font-in-docx.py <input.docx> [output.docx]", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file

    if not os.path.exists(input_file):
        print(f"❌ 找不到文件: {input_file}", file=sys.stderr)
        sys.exit(1)

    # 定義字體映射（使用服務器上已安裝的字體）
    # ONLYOFFICE Document Server 上已安裝 AR PL UKai TW（楷書）
    font_mappings = {
        '標楷體': 'AR PL UKai TW',
        'DFKai-SB': 'AR PL UKai TW',
        'KaiTi': 'AR PL UKai TW',
        '楷体': 'AR PL UKai TW',
        'BiauKai': 'AR PL UKai TW',
        'AR PL KaitiM Big5': 'AR PL UKai TW',  # 向後兼容舊的映射
    }

    print(f"📄 處理文件: {input_file}", file=sys.stderr)
    replace_font_in_docx(input_file, output_file, font_mappings)
    print(f"✅ 完成: {output_file}", file=sys.stderr)

if __name__ == '__main__':
    main()

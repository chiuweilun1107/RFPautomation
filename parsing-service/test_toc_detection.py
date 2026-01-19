"""
測試目錄檢測功能

這個腳本用於測試 is_table_actually_toc 函數是否能正確識別被誤判為表格的目錄
"""

import sys
import re
from typing import List

def is_table_actually_toc(table_data: List[List[str]], page_text: str = "") -> bool:
    """
    檢測表格是否實際上是目錄（被 Docling 誤判為表格）
    
    判斷依據：
    1. 表格內容包含目錄關鍵字（壹、貳、參、一、二、三、目錄等）
    2. 最後一列通常是頁碼
    3. 行數較多（目錄通常有多個條目）
    4. 頁面文字包含「目錄」、「Table of Contents」等關鍵字
    """
    if not table_data or len(table_data) < 3:  # 至少要有 3 行才可能是目錄
        return False
    
    # 檢查頁面文字是否包含目錄關鍵字
    has_toc_keyword = any(keyword in page_text for keyword in ["目錄", "Table of Contents", "INDEX", "CONTENTS"])
    
    # 檢查表格內容
    toc_indicators = 0
    total_cells = 0
    
    # 中文數字和章節標記
    toc_patterns = [
        r'[壹貳參肆伍陸柒捌玖拾]、',  # 壹、貳、參
        r'^[一二三四五六七八九十]+、',  # 一、二、三
        r'^\d+\.\d+',  # 1.1, 1.2
        r'第[一二三四五六七八九十]+章',  # 第一章
        r'Chapter\s+\d+',  # Chapter 1
        r'^\([一二三四五六七八九十]+\)',  # (一)、(二)
    ]
    
    for row in table_data:
        for cell in row:
            cell_str = str(cell).strip()
            total_cells += 1
            
            # 檢查是否符合目錄模式
            for pattern in toc_patterns:
                if re.search(pattern, cell_str):
                    toc_indicators += 1
                    break
            
            # 檢查是否包含頁碼（純數字，通常在 1-999 範圍）
            if re.match(r'^\d{1,3}$', cell_str):
                toc_indicators += 0.5  # 頁碼權重較低
    
    # 判斷邏輯：
    # 1. 如果頁面有目錄關鍵字 + 表格有 30% 以上的目錄指標 → 是目錄
    # 2. 如果表格有 50% 以上的目錄指標 → 是目錄
    toc_ratio = toc_indicators / max(total_cells, 1)
    
    if has_toc_keyword and toc_ratio > 0.3:
        print(f"✅ Table identified as TOC (keyword + {toc_ratio:.1%} indicators)")
        return True
    
    if toc_ratio > 0.5:
        print(f"✅ Table identified as TOC ({toc_ratio:.1%} indicators)")
        return True
    
    return False


# 測試案例
def test_toc_detection():
    print("=" * 60)
    print("測試 1: 典型的中文目錄（壹、貳、參）")
    print("=" * 60)
    
    table1 = [
        ["壹、計畫概述", "1"],
        ["貳、現況及問題說明", "5"],
        ["參、計畫目標", "10"],
        ["肆、執行策略", "15"],
    ]
    page_text1 = "目錄\n\n壹、計畫概述"
    result1 = is_table_actually_toc(table1, page_text1)
    print(f"結果: {'✅ 是目錄' if result1 else '❌ 不是目錄'}\n")
    
    print("=" * 60)
    print("測試 2: 一般數據表格（不是目錄）")
    print("=" * 60)
    
    table2 = [
        ["項目", "數量", "金額"],
        ["產品A", "100", "5000"],
        ["產品B", "200", "8000"],
    ]
    page_text2 = "銷售統計表"
    result2 = is_table_actually_toc(table2, page_text2)
    print(f"結果: {'✅ 是目錄' if result2 else '❌ 不是目錄'}\n")
    
    print("=" * 60)
    print("測試 3: 英文目錄")
    print("=" * 60)
    
    table3 = [
        ["Chapter 1", "Introduction", "1"],
        ["Chapter 2", "Methodology", "15"],
        ["Chapter 3", "Results", "30"],
    ]
    page_text3 = "Table of Contents"
    result3 = is_table_actually_toc(table3, page_text3)
    print(f"結果: {'✅ 是目錄' if result3 else '❌ 不是目錄'}\n")
    
    print("=" * 60)
    print("測試 4: 混合格式目錄（一、二、三）")
    print("=" * 60)
    
    table4 = [
        ["一、前言", "2"],
        ["二、研究方法", "8"],
        ["  (一) 資料收集", "9"],
        ["  (二) 分析方法", "12"],
        ["三、結論", "20"],
    ]
    page_text4 = "目錄"
    result4 = is_table_actually_toc(table4, page_text4)
    print(f"結果: {'✅ 是目錄' if result4 else '❌ 不是目錄'}\n")


if __name__ == "__main__":
    test_toc_detection()


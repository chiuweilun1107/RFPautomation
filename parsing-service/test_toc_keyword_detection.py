"""
測試目錄關鍵字檢測

模擬實際情況：目錄內容在表格中
"""

def test_toc_keyword_detection():
    """測試目錄關鍵字檢測邏輯"""
    
    # 測試案例 1：真實的目錄頁（內容在表格中）
    print("=" * 60)
    print("測試 1: 真實目錄頁（目 錄 - 帶空格）")
    print("=" * 60)
    
    page_text_1 = """## 目 錄

| | 計畫概述 ....................................................................................... |
|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
| 參、 | ...................................................................................................... 1 |"""
    
    toc_keywords = [
        "目錄", "目 錄",  # 中文（含空格）
        "Table of Contents", "TABLE OF CONTENTS",  # 英文
        "INDEX", "Index", "CONTENTS", "Contents",  # 索引
        "壹、", "貳、", "參、", "肆、",  # 中文數字章節
    ]
    
    is_toc = False
    matched_keyword = None
    for keyword in toc_keywords:
        if keyword in page_text_1:
            is_toc = True
            matched_keyword = keyword
            break
    
    print(f"頁面文字預覽: {page_text_1[:100]}...")
    print(f"結果: {'✅ 是目錄' if is_toc else '❌ 不是目錄'}")
    if matched_keyword:
        print(f"匹配關鍵字: '{matched_keyword}'")
    print()
    
    # 測試案例 2：誤判案例（包含「拾、拾壹」但不是目錄）
    print("=" * 60)
    print("測試 2: 誤判案例（包含章節編號但不是目錄頁）")
    print("=" * 60)
    
    page_text_2 = """經費估算編列手冊，詳列本計畫之各項服務費用，並填製經費分析表 ( 如 附錄 2) 。

拾、廠商企業社會責任

(CSR) 指標

一、於投標文件載明，後續履約期間給與全職從事本採購案之員工薪資 ( 包含獎金及額外津貼之平均薪資，惟不含加班費 ) 至少新臺幣 3 萬 2 千元 以上。

二、提出證明文件：工資清冊、投標文件內載有人員薪資之報價清單 等，足以證明事業單位內勞工薪資文件。

三、提供員工「工作與生活平衡」措施。

拾壹、附件

附件 1 、投標廠商參與本計畫成員履歷 ( 專長及學、經歷 )"""
    
    is_toc = False
    matched_keyword = None
    for keyword in toc_keywords:
        if keyword in page_text_2:
            is_toc = True
            matched_keyword = keyword
            break
    
    print(f"頁面文字預覽: {page_text_2[:100]}...")
    print(f"結果: {'✅ 是目錄' if is_toc else '❌ 不是目錄'}")
    if matched_keyword:
        print(f"⚠️  誤判！匹配關鍵字: '{matched_keyword}'")
        print(f"⚠️  這不是目錄頁，只是包含章節編號的一般內容頁")
    print()
    
    # 測試案例 3：英文目錄
    print("=" * 60)
    print("測試 3: 英文目錄")
    print("=" * 60)
    
    page_text_3 = """Table of Contents

Chapter 1: Introduction ........................... 1
Chapter 2: Methodology ........................... 15
Chapter 3: Results ............................... 30"""
    
    is_toc = False
    matched_keyword = None
    for keyword in toc_keywords:
        if keyword in page_text_3:
            is_toc = True
            matched_keyword = keyword
            break
    
    print(f"頁面文字預覽: {page_text_3[:100]}...")
    print(f"結果: {'✅ 是目錄' if is_toc else '❌ 不是目錄'}")
    if matched_keyword:
        print(f"匹配關鍵字: '{matched_keyword}'")
    print()
    
    # 測試案例 4：一般內容頁
    print("=" * 60)
    print("測試 4: 一般內容頁（不是目錄）")
    print("=" * 60)
    
    page_text_4 = """## 三、 建議書裝訂

( 一 ) 建議書請以 A4 右繕打，裝訂線於左側。

大小之紙張雙面列印，內容採中文直式橫書、由左至

( 二 )

建議書封面請註明投標廠商名稱、本計畫名稱及建議書提出日期；如 建議書分冊，應於封面註明冊數。"""
    
    is_toc = False
    matched_keyword = None
    for keyword in toc_keywords:
        if keyword in page_text_4:
            is_toc = True
            matched_keyword = keyword
            break
    
    print(f"頁面文字預覽: {page_text_4[:100]}...")
    print(f"結果: {'✅ 是目錄' if is_toc else '❌ 不是目錄'}")
    if matched_keyword:
        print(f"匹配關鍵字: '{matched_keyword}'")
    print()
    
    # 總結
    print("=" * 60)
    print("⚠️  注意事項")
    print("=" * 60)
    print("1. 「壹、貳、參、肆」等關鍵字會導致誤判")
    print("2. 應該只檢測「目錄」、「Table of Contents」等明確的目錄標題")
    print("3. 建議移除章節編號關鍵字，避免誤判一般內容頁")


if __name__ == "__main__":
    test_toc_keyword_detection()


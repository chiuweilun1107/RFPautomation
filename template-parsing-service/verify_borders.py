
import sys
import os
import json
import docx
from docx.oxml.ns import qn

sys.path.append("/app")

try:
    from service import detect_fillable_tables, extract_cell_borders
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def verify_borders(file_path):
    print(f"Verifying Borders for: {file_path}")
    doc = docx.Document(file_path)
    
    # We want to check Table 1 (Merges) and Table 2 (Checkboxes) for borders.
    # Specifically, the user complained about "No Border" becoming "Border".
    # This implies some cells have 'nil' borders.
    
    print("\n--- Border Extraction Verification ---")
    
    # Check all tables
    for t_idx, tbl in enumerate(doc.tables):
        print(f"Table {t_idx+1}:")
        
        # Check Table Level Borders
        tblPr = tbl._tbl.tblPr
        if tblPr is not None:
            tblBorders = tblPr.find(qn('w:tblBorders'))
            if tblBorders is not None:
                print(f"  [Table Level Borders DETECTED]")
                for side in ['top', 'bottom', 'left', 'right', 'insideH', 'insideV']:
                    b = tblBorders.find(qn(f'w:{side}'))
                    if b is not None:
                        val = b.get(qn('w:val'))
                        print(f"    - {side}: {val}")
            else:
                print(f"  [No Table Level Borders]")

        # Check first 3 rows
        for r_idx, row in enumerate(tbl.rows[:3]):
            for c_idx, cell in enumerate(row.cells):
                tcPr = cell._tc.tcPr
                borders = extract_cell_borders(tcPr)
                if borders:
                    print(f"  R{r_idx}C{c_idx} Borders: {borders}")
                else:
                    # If None, it means no override (Standard Grid?)
                    pass
                    
if __name__ == "__main__":
    verify_borders("/app/test_doc.docx")

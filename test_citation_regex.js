
const { convertCitationMarksToNumbers } = require('./frontend/src/components/workspace/tender-planning/utils/citationTextParser.ts');

// Mock function because we can't easily import TS directly in creating a simple JS test script without compilation
// So I will replicate the REGEX logic from the file I just viewed to test it against various strings.

const CITATION_PATTERN = /[\(（]出處\s*[：:]\s*([^)）]+?)[）\)]/g;

const testCases = [
    // Case 1: Standard (Likely Working)
    "(出處: 3-需求說明書.docx P.7)",

    // Case 2: Fullwidth Colon (Likely Working)
    "(出處： 3-需求說明書.docx P.7)",

    // Case 3: Extra Spaces (Potential Issue)
    "(出處 :  3-需求說明書.docx P.7 )",

    // Case 4: No Extension (Potential Issue)
    "(出處: 需求說明書 P.7)",

    // Case 5: With Newline (Potential Issue - LLM often does this)
    "(出處:\n3-需求說明書.docx P.7)",

    // Case 6: Multiple Files
    "(出處: 3-需求說明書.docx P.7, RFP.pdf P.2)",

    // Case 7: Fullwidth Parentheses (CRITICAL HYPOTHESIS)
    "（出處：3-需求說明書.docx P.7）",
    "（出處: 3-需求說明書.docx P.7)",
    "(出處：3-需求說明書.docx P.7）"
];

console.log("Testing Regex: " + CITATION_PATTERN);
console.log("---------------------------------------------------");

testCases.forEach(text => {
    // Reset regex index
    CITATION_PATTERN.lastIndex = 0;
    const match = CITATION_PATTERN.exec(text);
    if (match) {
        console.log(`[PASS] "${text}" \n       -> Captured: "${match[1]}"`);
    } else {
        console.log(`[FAIL] "${text}"`);
    }
});

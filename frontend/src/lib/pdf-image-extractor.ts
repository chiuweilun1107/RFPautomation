export interface ExtractedImage {
    page: number;
    data: Blob;
    extension: 'jpg' | 'png';
}

interface PDFJSLib {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (data: ArrayBuffer) => { promise: Promise<PDFDocumentProxy> };
    OPS: {
        paintImageXObject: number;
        paintInlineImageXObject: number;
        paintFormXObjectBegin: number;
        paintXObject: number;
    };
}

interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
    pageNumber: number;
    objs: { get: (name: string) => Promise<ImageObject> };
    commonObjs: { get: (name: string) => Promise<ImageObject> };
    getOperatorList: () => Promise<OperatorList>;
    getViewport: (options: { scale: number }) => Viewport;
    render: (options: RenderOptions) => { promise: Promise<void> };
    cleanup: () => void;
}

interface OperatorList {
    fnArray: number[];
    argsArray: unknown[][];
}

interface ImageObject {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    operatorList?: OperatorList;
}

interface Viewport {
    width: number;
    height: number;
}

interface RenderOptions {
    canvasContext: CanvasRenderingContext2D;
    viewport: Viewport;
}

export async function extractImagesFromPDF(file: File): Promise<ExtractedImage[]> {
    // Dynamic import to avoid loading pdfjs-dist during build
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf') as unknown as PDFJSLib;

    // Set worker source (required for pdf.js)
    // Use authoritative CDN for the legacy build to avoid local file serving issues.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    const images: ExtractedImage[]  = [];

    // Recursive function to walk operator lists (handles Form XObjects)
    const walk = async (operatorList: OperatorList, page: PDFPageProxy, commonObjs: PDFPageProxy['commonObjs']) => {
        for (let i = 0; i < operatorList.fnArray.length; i++) {
            const fn = operatorList.fnArray[i];
            const args = operatorList.argsArray[i];

            // 1. External Image (XObject)
            if (fn === pdfjsLib.OPS.paintImageXObject) {
                const imgName = args[0] as string;
                try {
                    let imgObj;
                    try {
                        imgObj = await page.objs.get(imgName);
                    } catch {
                        if (commonObjs) {
                            try { imgObj = await commonObjs.get(imgName); } catch { }
                        }
                    }

                    if (imgObj) await processImageObject(imgObj, page.pageNumber);
                } catch {
                    // console.warn("Image extraction error:", e);
                }
            }
            // 2. Inline Image
            else if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
                const imgObj = args[0] as ImageObject;
                if (imgObj) await processImageObject(imgObj, page.pageNumber);
            }
            // 3. Form XObject (Recursion)
            else if (fn === pdfjsLib.OPS.paintFormXObjectBegin || fn === pdfjsLib.OPS.paintXObject) {
                // Note: pdf.js handles Forms differently in different versions.
                // In some versions, paintXObject delegates to Form.
                // We try to get the object and check if it has an operator list.
                const objName = args[0] as string;
                try {
                    let obj;
                    try { obj = await page.objs.get(objName); } catch {
                        if (commonObjs) try { obj = await commonObjs.get(objName); } catch { }
                    }

                    if (obj && obj.operatorList) {
                        await walk(obj.operatorList, page, commonObjs);
                    }
                } catch { }
            }
        }
    };

    const processImageObject = async (imgObj: ImageObject, pageNum: number) => {
        if (!imgObj || !imgObj.data) return;

        const width = imgObj.width;
        const height = imgObj.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const imgData = ctx.createImageData(width, height);
            // Check data size match
            if (imgObj.data.length === width * height * 4) {
                imgData.data.set(imgObj.data);
            } else if (imgObj.data.length === width * height * 3) {
                // RGB to RGBA
                for (let i = 0, j = 0; i < imgObj.data.length; i += 3, j += 4) {
                    imgData.data[j] = imgObj.data[i];     // R
                    imgData.data[j + 1] = imgObj.data[i + 1]; // G
                    imgData.data[j + 2] = imgObj.data[i + 2]; // B
                    imgData.data[j + 3] = 255;            // A
                }
            } else if (imgObj.data.length === width * height) {
                // Grayscale to RGBA
                for (let i = 0, j = 0; i < imgObj.data.length; i++, j += 4) {
                    const val = imgObj.data[i];
                    imgData.data[j] = val;
                    imgData.data[j + 1] = val;
                    imgData.data[j + 2] = val;
                    imgData.data[j + 3] = 255;
                }
            } else {
                return; // Unsupported format size
            }

            ctx.putImageData(imgData, 0, 0);

            const blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', 0.8)
            );

            if (blob) {
                images.push({
                    page: pageNum,
                    data: blob,
                    extension: 'jpg'
                });
            }
        }
    };

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        let pageImagesFound = 0;
        try {
            const page = await pdf.getPage(pageNum);
            const ops = await page.getOperatorList();
            const commonObjs = page.commonObjs;

            // 1. Try Object Extraction (Best Quality)
            const initialImageCount = images.length;
            await walk(ops, page, commonObjs);
            pageImagesFound = images.length - initialImageCount;

            // 2. Fallback: Page Snapshot (Visual Capture)
            // Strategy: Snapshot if:
            // a) It's Page 1 (Cover).
            // b) We detected visual operators (Images/Forms) but extracted 0 objects.
            // c) Or simply if the page has NO extracted images, to be safe? 
            //    -> No, doing it for all text pages is too much.
            //    -> Let's stick to: Page 1 OR (Has Visual Ops AND Extracted 0).

            let hasVisualOps = false;
            for (let i = 0; i < ops.fnArray.length; i++) {
                const fn = ops.fnArray[i];
                if (fn === pdfjsLib.OPS.paintImageXObject ||
                    fn === pdfjsLib.OPS.paintInlineImageXObject ||
                    fn === pdfjsLib.OPS.paintFormXObjectBegin) {
                    hasVisualOps = true;
                    break;
                }
            }

            if (pageNum === 1 || (hasVisualOps && pageImagesFound === 0)) {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const ctx = canvas.getContext('2d');

                if (ctx) {
                    try {
                        await page.render({
                            canvasContext: ctx,
                            viewport: viewport
                        }).promise;
                    } catch (renderErr) {
                        console.error(`[SNAPSHOT] Render Failed P${pageNum}`, renderErr);
                    }

                    const blob = await new Promise<Blob | null>(resolve => {
                        canvas.toBlob((b) => {
                            resolve(b);
                        }, 'image/jpeg', 0.8);
                    });

                    if (blob) {
                        images.push({
                            page: pageNum,
                            data: blob,
                            extension: 'jpg'
                        });
                    } else {
                        console.error(`[SNAPSHOT] Blob NULL P${pageNum}`);
                    }
                } else {
                    console.error(`[SNAPSHOT] Context 2D Failed P${pageNum}`);
                }
            }

            page.cleanup();
        } catch (e) {
            console.warn(`Error processing page ${pageNum}:`, e);
        }
    }

    return images;
}

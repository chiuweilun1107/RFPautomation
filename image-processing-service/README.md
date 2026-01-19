# Image Processing Service

## Overview
A lightweight Python microservice using FastAPI, OpenCV, and Rembg to support n8n workflows for:
1.  **Mask Generation**: Creating inpainting masks from bounding boxes.
2.  **Cropping**: Extracting objects from images.
3.  **Background Removal**: Using AI to remove image backgrounds.

## API Endpoints

### `POST /mask`
Generates a binary mask (white boxes on black background).
**Body:**
```json
{
  "image_url": "http://...", 
  "bboxes": [[ymin, xmin, ymax, xmax], ...],
  "scale": "1000"
}
```

### `POST /crop`
Crops an image.
**Body:**
```json
{
  "image_url": "http://...", 
  "bbox": [ymin, xmin, ymax, xmax],
  "scale": "1000"
}
```

### `POST /rembg`
Removes background.
**Body:**
```json
{
  "image_url": "http://..."
}
```

## Running
```bash
docker build -t image-processing-service .
docker run -p 8005:8000 image-processing-service
```

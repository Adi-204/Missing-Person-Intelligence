from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
from pathlib import Path
import tempfile
import os
from typing import List, Dict
import shutil
from datetime import datetime

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for uploaded videos
uploaded_videos: Dict[str, dict] = {}
UPLOAD_DIR = "uploaded_videos"

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Lazy load model
search_missing_person_api = None

def load_model():
    """Lazy load the model only when needed"""
    global search_missing_person_api
    if search_missing_person_api is None:
        try:
            from model import search_missing_person_api as smp_api
            search_missing_person_api = smp_api
            print("✅ Model loaded successfully")
        except ImportError as e:
            print(f"❌ Failed to load model: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load model: {str(e)}. Please ensure TensorFlow is properly installed."
            )

@app.get("/")
def read_root():
    return {"message": "Missing Person Search API", "version": "1.0"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Missing Person Search API",
        "uploaded_videos": len(uploaded_videos)
    }

@app.post("/admin/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    department: str = Form(...),
    location: str = Form(...),
    time_window: str = Form(...)
):
    """
    Admin endpoint to upload CCTV videos for storage.
    
    Parameters:
    - video: Video file
    - department: Police department name
    - location: Location of the camera
    - time_window: Time window of the footage
    
    Returns:
    - Video ID and metadata
    """
    try:
        # Generate unique video ID
        video_id = f"video_{len(uploaded_videos) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save video to disk
        video_path = os.path.join(UPLOAD_DIR, f"{video_id}.mp4")
        
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        # Store metadata
        uploaded_videos[video_id] = {
            "id": video_id,
            "filename": video.filename,
            "path": video_path,
            "department": department,
            "location": location,
            "time_window": time_window,
            "upload_date": datetime.now().isoformat(),
            "status": "completed",
            "size": os.path.getsize(video_path)
        }
        
        return JSONResponse(content={
            "success": True,
            "video_id": video_id,
            "message": "Video uploaded successfully",
            "metadata": uploaded_videos[video_id]
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")

@app.get("/admin/videos")
def get_uploaded_videos():
    """
    Get list of all uploaded videos.
    
    Returns:
    - List of video metadata
    """
    return {
        "success": True,
        "count": len(uploaded_videos),
        "videos": list(uploaded_videos.values())
    }

@app.delete("/admin/videos/{video_id}")
def delete_video(video_id: str):
    """
    Delete a specific video.
    
    Parameters:
    - video_id: ID of the video to delete
    """
    if video_id not in uploaded_videos:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Delete file from disk
        video_path = uploaded_videos[video_id]["path"]
        if os.path.exists(video_path):
            os.remove(video_path)
        
        # Remove from memory
        del uploaded_videos[video_id]
        
        return {"success": True, "message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting video: {str(e)}")

@app.post("/search-missing-person")
async def search_missing_person_endpoint(
    target_photo: UploadFile = File(...),
    shirt_color: str = Form(...),
    pant_color: str = Form(default="none")
):
    """
    Search for a missing person across all uploaded videos.
    
    Parameters:
    - target_photo: Photo of the person to find
    - shirt_color: Color of the shirt
    - pant_color: Color of the pants (optional)
    
    Returns:
    - Image of the matched frame with bounding boxes and metadata
    """
    
    if len(uploaded_videos) == 0:
        raise HTTPException(
            status_code=400,
            detail="No videos available for search. Please ask admin to upload CCTV footage first."
        )
    
    # Load model
    load_model()
    
    # Create temporary file for photo
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save target photo
            photo_path = os.path.join(temp_dir, f"photo_{target_photo.filename}")
            with open(photo_path, "wb") as f:
                f.write(await target_photo.read())
            
            # Search through all uploaded videos
            for video_id, video_meta in uploaded_videos.items():
                video_path = video_meta["path"]
                
                print(f"\n🔍 Searching in: {video_meta['filename']}")
                print(f"📍 Location: {video_meta['location']}")
                print(f"🏢 Department: {video_meta['department']}")
                
                # Call the search function
                result_image = search_missing_person_api(
                    video_path=video_path,
                    target_photo=photo_path,
                    shirt_color_text=shirt_color,
                    pant_color_text=pant_color
                )
                
                if result_image is not None:
                    # Match found! Return the image with metadata
                    _, buffer = cv2.imencode('.jpg', result_image)
                    image_bytes = io.BytesIO(buffer.tobytes())
                    
                    return StreamingResponse(
                        image_bytes,
                        media_type="image/jpeg",
                        headers={
                            "Content-Disposition": "inline; filename=match_found.jpg",
                            "X-Video-ID": video_id,
                            "X-Video-Filename": video_meta["filename"],
                            "X-Location": video_meta["location"],
                            "X-Department": video_meta["department"]
                        }
                    )
            
            # No match found in any video
            raise HTTPException(
                status_code=404,
                detail=f"No person matching the description was found in {len(uploaded_videos)} video(s)."
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Optional: Endpoint to check which videos will be searched
@app.get("/search/available-videos")
def get_available_videos():
    """
    Get list of videos that will be searched.
    """
    return {
        "success": True,
        "count": len(uploaded_videos),
        "videos": [
            {
                "id": v["id"],
                "filename": v["filename"],
                "department": v["department"],
                "location": v["location"],
                "upload_date": v["upload_date"]
            }
            for v in uploaded_videos.values()
        ]
    }
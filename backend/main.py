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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
uploaded_videos: Dict[str, dict] = {}
missing_persons: Dict[str, dict] = {}
search_results: Dict[str, dict] = {}

UPLOAD_DIR = "uploaded_videos"
PHOTOS_DIR = "missing_persons_photos"

# Create directories
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PHOTOS_DIR, exist_ok=True)

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
    return {"message": "Missing Person Search API", "version": "2.0"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Missing Person Search API",
        "uploaded_videos": len(uploaded_videos),
        "missing_persons": len(missing_persons),
        "search_results": len(search_results)
    }

# ==================== USER ENDPOINTS ====================

@app.post("/user/report-missing-person")
async def report_missing_person(
    photo: UploadFile = File(...),
    name: str = Form(...),
    age: str = Form(default=""),
    gender: str = Form(default=""),
    last_seen_location: str = Form(default=""),
    shirt_color: str = Form(...),
    pant_color: str = Form(default="none"),
    height: str = Form(default=""),
    additional_notes: str = Form(default=""),
    contact_info: str = Form(default="")
):
    """
    User endpoint to report a missing person.
    
    Parameters:
    - photo: Photo of the missing person
    - name: Full name
    - age: Age
    - gender: Gender
    - last_seen_location: Last seen location
    - shirt_color: Shirt color (required for search)
    - pant_color: Pant color (optional)
    - height: Height
    - additional_notes: Any additional information
    - contact_info: Contact information for updates
    
    Returns:
    - Missing person ID and metadata
    """
    try:
        # Generate unique person ID
        person_id = f"person_{len(missing_persons) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save photo to disk
        photo_filename = f"{person_id}_{photo.filename}"
        photo_path = os.path.join(PHOTOS_DIR, photo_filename)
        
        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        # Store metadata
        missing_persons[person_id] = {
            "id": person_id,
            "name": name,
            "age": age,
            "gender": gender,
            "last_seen_location": last_seen_location,
            "shirt_color": shirt_color,
            "pant_color": pant_color,
            "height": height,
            "additional_notes": additional_notes,
            "contact_info": contact_info,
            "photo_filename": photo_filename,
            "photo_path": photo_path,
            "reported_date": datetime.now().isoformat(),
            "status": "pending",
            "search_count": 0
        }
        
        return JSONResponse(content={
            "success": True,
            "person_id": person_id,
            "message": "Missing person report submitted successfully",
            "metadata": missing_persons[person_id]
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting report: {str(e)}")

@app.get("/user/missing-persons")
def get_missing_persons():
    """
    Get list of all reported missing persons.
    """
    return {
        "success": True,
        "count": len(missing_persons),
        "missing_persons": list(missing_persons.values())
    }

# ==================== ADMIN VIDEO ENDPOINTS ====================

@app.post("/admin/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    department: str = Form(...),
    location: str = Form(...),
    time_window: str = Form(...)
):
    """
    Admin endpoint to upload CCTV videos.
    """
    try:
        video_id = f"video_{len(uploaded_videos) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        video_path = os.path.join(UPLOAD_DIR, f"{video_id}.mp4")
        
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        uploaded_videos[video_id] = {
            "id": video_id,
            "filename": video.filename,
            "path": video_path,
            "department": department,
            "location": location,
            "time_window": time_window,
            "upload_date": datetime.now().isoformat(),
            "status": "ready",
            "size": os.path.getsize(video_path),
            "search_count": 0
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
    """
    if video_id not in uploaded_videos:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        video_path = uploaded_videos[video_id]["path"]
        if os.path.exists(video_path):
            os.remove(video_path)
        
        del uploaded_videos[video_id]
        
        return {"success": True, "message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting video: {str(e)}")

# ==================== ADMIN MISSING PERSONS ENDPOINTS ====================

@app.get("/admin/missing-persons")
def get_all_missing_persons():
    """
    Admin endpoint to get all missing persons with full details.
    """
    return {
        "success": True,
        "count": len(missing_persons),
        "missing_persons": list(missing_persons.values())
    }

@app.get("/admin/missing-persons/{person_id}")
def get_missing_person_details(person_id: str):
    """
    Get detailed information about a specific missing person.
    """
    if person_id not in missing_persons:
        raise HTTPException(status_code=404, detail="Missing person not found")
    
    return {
        "success": True,
        "person": missing_persons[person_id]
    }

@app.get("/admin/missing-persons/{person_id}/photo")
async def get_missing_person_photo(person_id: str):
    """
    Get the photo of a missing person.
    """
    if person_id not in missing_persons:
        raise HTTPException(status_code=404, detail="Missing person not found")
    
    photo_path = missing_persons[person_id]["photo_path"]
    
    if not os.path.exists(photo_path):
        raise HTTPException(status_code=404, detail="Photo file not found")
    
    with open(photo_path, "rb") as f:
        image_data = f.read()
    
    return StreamingResponse(
        io.BytesIO(image_data),
        media_type="image/jpeg",
        headers={"Content-Disposition": f"inline; filename={missing_persons[person_id]['photo_filename']}"}
    )

@app.delete("/admin/missing-persons/{person_id}")
def delete_missing_person(person_id: str):
    """
    Delete a missing person record.
    """
    if person_id not in missing_persons:
        raise HTTPException(status_code=404, detail="Missing person not found")
    
    try:
        photo_path = missing_persons[person_id]["photo_path"]
        if os.path.exists(photo_path):
            os.remove(photo_path)
        
        del missing_persons[person_id]
        
        return {"success": True, "message": "Missing person record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting record: {str(e)}")

# ==================== ADMIN SEARCH ENDPOINT ====================

@app.post("/admin/search")
async def search_person_in_video(
    person_id: str = Form(...),
    video_id: str = Form(...)
):
    """
    Admin endpoint to search for a specific missing person in a specific video.
    
    Parameters:
    - person_id: ID of the missing person
    - video_id: ID of the video to search in
    
    Returns:
    - Image of the matched frame with bounding boxes and metadata
    """
    
    # Validate inputs
    if person_id not in missing_persons:
        raise HTTPException(status_code=404, detail="Missing person not found")
    
    if video_id not in uploaded_videos:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Load model
    load_model()
    
    # Get data
    person = missing_persons[person_id]
    video = uploaded_videos[video_id]
    
    try:
        print(f"\n{'='*60}")
        print(f"🔍 SEARCH INITIATED")
        print(f"{'='*60}")
        print(f"👤 Person: {person['name']}")
        print(f"📍 Last Seen: {person['last_seen_location']}")
        print(f"👕 Shirt: {person['shirt_color']}")
        print(f"👖 Pants: {person['pant_color']}")
        print(f"\n🎥 Video: {video['filename']}")
        print(f"📍 Location: {video['location']}")
        print(f"🏢 Department: {video['department']}")
        print(f"{'='*60}\n")
        
        # Call the search function
        result_image = search_missing_person_api(
            video_path=video["path"],
            target_photo=person["photo_path"],
            shirt_color_text=person["shirt_color"],
            pant_color_text=person["pant_color"]
        )
        
        # Update search counts
        missing_persons[person_id]["search_count"] += 1
        uploaded_videos[video_id]["search_count"] += 1
        
        if result_image is not None:
            # Match found! Store result and return image
            result_id = f"result_{len(search_results) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            search_results[result_id] = {
                "id": result_id,
                "person_id": person_id,
                "person_name": person["name"],
                "video_id": video_id,
                "video_filename": video["filename"],
                "location": video["location"],
                "department": video["department"],
                "search_date": datetime.now().isoformat(),
                "status": "match_found"
            }
            
            # Update person status
            missing_persons[person_id]["status"] = "found"
            
            _, buffer = cv2.imencode('.jpg', result_image)
            image_bytes = io.BytesIO(buffer.tobytes())
            
            print(f"✅ MATCH FOUND!")
            print(f"{'='*60}\n")
            
            return StreamingResponse(
                image_bytes,
                media_type="image/jpeg",
                headers={
                    "Content-Disposition": "inline; filename=match_found.jpg",
                    "X-Result-ID": result_id,
                    "X-Person-ID": person_id,
                    "X-Person-Name": person["name"],
                    "X-Video-ID": video_id,
                    "X-Video-Filename": video["filename"],
                    "X-Location": video["location"],
                    "X-Department": video["department"],
                    "X-Search-Timestamp": datetime.now().isoformat(),
                    "X-Last-Seen-Location": person["last_seen_location"],
                    "X-Shirt-Color": person["shirt_color"],
                    "X-Pant-Color": person["pant_color"],
                    # Required CORS headers for custom headers
                    "Access-Control-Expose-Headers": "X-Result-ID,X-Person-ID,X-Person-Name,X-Video-ID,X-Video-Filename,X-Location,X-Department,X-Search-Timestamp,X-Last-Seen-Location,X-Shirt-Color,X-Pant-Color"
                }
            )
        else:
            # No match found
            result_id = f"result_{len(search_results) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            search_results[result_id] = {
                "id": result_id,
                "person_id": person_id,
                "person_name": person["name"],
                "video_id": video_id,
                "video_filename": video["filename"],
                "location": video["location"],
                "department": video["department"],
                "search_date": datetime.now().isoformat(),
                "status": "no_match"
            }
            
            print(f"❌ NO MATCH FOUND")
            print(f"{'='*60}\n")
            
            raise HTTPException(
                status_code=404,
                detail=f"No match found for {person['name']} in {video['filename']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing search: {str(e)}")

# ==================== SEARCH HISTORY ====================

@app.get("/admin/search-history")
def get_search_history():
    """
    Get history of all searches performed.
    """
    return {
        "success": True,
        "count": len(search_results),
        "results": list(search_results.values())
    }

@app.get("/admin/search-history/{person_id}")
def get_person_search_history(person_id: str):
    """
    Get search history for a specific person.
    """
    person_results = [r for r in search_results.values() if r["person_id"] == person_id]
    
    return {
        "success": True,
        "person_id": person_id,
        "count": len(person_results),
        "results": person_results
    }
import cv2
import numpy as np
import os
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

# Suppress TensorFlow logging
import logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # 0=all, 1=info, 2=warning, 3=error only

# Suppress TensorFlow progress bars
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Import TensorFlow and models
import tensorflow as tf
tf.get_logger().setLevel('ERROR')

from mtcnn import MTCNN
from keras_facenet import FaceNet

# Initialize Models
print("🔄 Loading face recognition models...")
detector = MTCNN()
embedder = FaceNet()
print("✅ Models loaded successfully!")

# --- TOOL 1: TEXT-BASED COLOR MATCHER ---
def get_color_presence(image_crop, target_color_name):
    """
    Returns a score (0.0 to 1.0) representing how much of the image
    matches the target color name.
    """
    if image_crop is None or image_crop.size == 0: return 0.0

    # Convert to HSV
    hsv = cv2.cvtColor(image_crop, cv2.COLOR_BGR2HSV)
    target_color_name = target_color_name.lower().strip()

    # If user says "none" or "unknown", we skip this check (return full score)
    if target_color_name in ["none", "unknown", ""]:
        return 1.0

    # HSV Color Definitions
    color_ranges = {
        'black': [([0, 0, 0], [180, 255, 50])], # Very dark
        'white': [([0, 0, 160], [180, 50, 255])], # High brightness, low saturation
        'grey':  [([0, 0, 50], [180, 50, 160])],
        'red':   [([0, 70, 50], [10, 255, 255]), ([170, 70, 50], [180, 255, 255])],
        'blue':  [([100, 60, 50], [140, 255, 255])], # Covers Navy to Cyan
        'green': [([35, 50, 50], [85, 255, 255])],
        'yellow':[([20, 100, 100], [35, 255, 255])],
        'beige': [([20, 10, 150], [40, 90, 255])], # Khaki/Cream
        'orange':[([10, 100, 100], [25, 255, 255])]
    }

    # Map "cream" to "beige" and "navy" to "blue" for better UX
    if target_color_name == "cream": target_color_name = "white"
    if target_color_name == "navy": target_color_name = "blue"

    if target_color_name not in color_ranges:
        print(f"⚠️ Warning: Color '{target_color_name}' not known. Assuming match.")
        return 0.5

    # Create Mask
    mask = np.zeros(hsv.shape[:2], dtype="uint8")
    for (lower, upper) in color_ranges[target_color_name]:
        mask = cv2.add(mask, cv2.inRange(hsv, np.array(lower), np.array(upper)))

    # Calculate Ratio
    pixels_matched = cv2.countNonZero(mask)
    total_pixels = image_crop.shape[0] * image_crop.shape[1]

    if total_pixels == 0: return 0.0

    ratio = pixels_matched / total_pixels

    # SCORING LOGIC:
    # If > 15% of the shirt is the target color, we consider it a strong match.
    # We multiply ratio by 4 to boost the score. (0.2 ratio becomes 0.8 score)
    score = min(1.0, ratio * 4)
    return score

# --- TOOL 2: FACE EMBEDDING ---
def get_face_embedding_internal(image_path):
    img = cv2.imread(image_path)
    if img is None: return None
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(img)
    if not results: return None
    x, y, width, height = results[0]['box']
    face = img[y:y+height, x:x+width]
    face = cv2.resize(face, (160, 160))
    face_pixels = np.expand_dims(face, axis=0)
    return embedder.embeddings(face_pixels)[0]

# --- TOOL 3: ORIGINAL CONSOLE VERSION ---
def search_missing_person(video_path, target_photo, shirt_color_text, pant_color_text="none"):
    print(f"🎥 SCANNING VIDEO: {video_path}")
    print(f"👤 LOOKING FOR FACE FROM: {target_photo}")
    print(f"👕 EXPECTING SHIRT: {shirt_color_text.upper()}")
    if pant_color_text != "none":
        print(f"👖 EXPECTING PANTS: {pant_color_text.upper()}")
    print("-" * 50)

    # 1. Load Face Target
    target_emb = get_face_embedding_internal(target_photo)
    if target_emb is None:
        print("❌ Error: No face found in the provided photo.")
        return

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_count = 0
    match_found = False

    while True:
        success, frame = cap.read()
        if not success: break

        # Check every 1 second
        if frame_count % fps == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            faces = detector.detect_faces(frame_rgb)

            for face_data in faces:
                x, y, w, h = face_data['box']
                # Enlarge face box slightly for visualization
                x, y = max(0, x), max(0, y)

                # A. FACE CHECK (Branch 1)
                face_img = frame_rgb[y:y+h, x:x+w]
                try:
                    face_resized = cv2.resize(face_img, (160, 160))
                    curr_emb = embedder.embeddings(np.expand_dims(face_resized, axis=0))[0]
                    face_score = cosine_similarity([target_emb], [curr_emb])[0][0]

                    # Optimization: Only check clothes if face is > 40% match
                    if face_score > 0.40:

                        # B. BODY ESTIMATION (Geometry)
                        # Shirt area = Below chin, width of shoulders (approx 3x face width)
                        img_h, img_w, _ = frame.shape

                        # Calculate Shirt Box
                        shirt_x1 = max(0, x - w)
                        shirt_x2 = min(img_w, x + 2*w)
                        shirt_y1 = y + h # Chin
                        shirt_y2 = min(img_h, y + h + int(2.5*h)) # Down to waist

                        shirt_crop = frame[shirt_y1:shirt_y2, shirt_x1:shirt_x2]

                        # C. CLOTHING CHECK (Branch 2)
                        # 1. Shirt Score
                        shirt_score = get_color_presence(shirt_crop, shirt_color_text)

                        # 2. Pant Score (Optional)
                        pant_score = 0.0
                        if pant_color_text != "none":
                            # Pants are below shirt
                            pant_y1 = shirt_y2
                            pant_y2 = min(img_h, pant_y1 + 3*h)
                            pant_crop = frame[pant_y1:pant_y2, shirt_x1:shirt_x2]
                            pant_score = get_color_presence(pant_crop, pant_color_text)

                            # Average the clothing score
                            clothing_score = (shirt_score + pant_score) / 2
                        else:
                            clothing_score = shirt_score

                        # D. FUSION (70% Face + 30% Clothes)
                        final_score = (face_score * 0.70) + (clothing_score * 0.30)

                        print(f"⏱️ {frame_count/fps:.0f}s | Face: {face_score:.2f} | Clothes: {clothing_score:.2f} | FINAL: {final_score:.2f}")

                        # E. DRAW RESULTS
                        if final_score > 0.55:
                            color = (0, 255, 0) # Green for Match
                            status = "MATCH FOUND"
                        elif face_score > 0.60:
                            color = (0, 165, 255) # Orange for Face-Only Match
                            status = "FACE MATCH (Check Clothes)"
                        else:
                            color = None

                        if color:
                            # Draw Face Box
                            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

                            # Draw Shirt Box (Visual proof of where it looked)
                            cv2.rectangle(frame, (shirt_x1, shirt_y1), (shirt_x2, shirt_y2), (255, 0, 0), 2)
                            cv2.putText(frame, "Shirt Area", (shirt_x1, shirt_y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

                            # Text
                            label = f"{status}: {final_score*100:.0f}%"
                            cv2.rectangle(frame, (x, y-30), (x+w+100, y), color, -1)
                            cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                            match_found = True
                            cap.release()
                            return

                except Exception as e:
                    # print(e) # Uncomment to debug errors
                    pass

        frame_count += 1

    cap.release()
    if not match_found:
        print("❌ Search ended. No person matching both Face & Description found.")

# --- TOOL 4: API VERSION (Returns Image) ---
def search_missing_person_api(video_path, target_photo, shirt_color_text, pant_color_text="none"):
    """
    API-friendly version that returns the matched frame image instead of displaying it.
    
    Returns:
    - matched_frame: numpy array (BGR image) if match found
    - None: if no match found
    """
    print(f"🎥 SCANNING VIDEO: {video_path}")
    print(f"👤 LOOKING FOR FACE FROM: {target_photo}")
    print(f"👕 EXPECTING SHIRT: {shirt_color_text.upper()}")
    if pant_color_text != "none":
        print(f"👖 EXPECTING PANTS: {pant_color_text.upper()}")
    print("-" * 50)

    # 1. Load Face Target
    target_emb = get_face_embedding_internal(target_photo)
    if target_emb is None:
        print("❌ Error: No face found in the provided photo.")
        return None

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_count = 0

    while True:
        success, frame = cap.read()
        if not success: break

        # Check every 1 second
        if frame_count % fps == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            faces = detector.detect_faces(frame_rgb)

            for face_data in faces:
                x, y, w, h = face_data['box']
                x, y = max(0, x), max(0, y)

                # A. FACE CHECK
                face_img = frame_rgb[y:y+h, x:x+w]
                try:
                    face_resized = cv2.resize(face_img, (160, 160))
                    curr_emb = embedder.embeddings(np.expand_dims(face_resized, axis=0))[0]
                    face_score = cosine_similarity([target_emb], [curr_emb])[0][0]

                    if face_score > 0.40:
                        # B. BODY ESTIMATION
                        img_h, img_w, _ = frame.shape

                        shirt_x1 = max(0, x - w)
                        shirt_x2 = min(img_w, x + 2*w)
                        shirt_y1 = y + h
                        shirt_y2 = min(img_h, y + h + int(2.5*h))

                        shirt_crop = frame[shirt_y1:shirt_y2, shirt_x1:shirt_x2]

                        # C. CLOTHING CHECK
                        shirt_score = get_color_presence(shirt_crop, shirt_color_text)

                        pant_score = 0.0
                        if pant_color_text != "none":
                            pant_y1 = shirt_y2
                            pant_y2 = min(img_h, pant_y1 + 3*h)
                            pant_crop = frame[pant_y1:pant_y2, shirt_x1:shirt_x2]
                            pant_score = get_color_presence(pant_crop, pant_color_text)
                            clothing_score = (shirt_score + pant_score) / 2
                        else:
                            clothing_score = shirt_score

                        # D. FUSION
                        final_score = (face_score * 0.70) + (clothing_score * 0.30)

                        print(f"⏱️ {frame_count/fps:.0f}s | Face: {face_score:.2f} | Clothes: {clothing_score:.2f} | FINAL: {final_score:.2f}")

                        # E. DRAW RESULTS
                        if final_score > 0.55:
                            color = (0, 255, 0)
                            status = "MATCH FOUND"
                        elif face_score > 0.60:
                            color = (0, 165, 255)
                            status = "FACE MATCH (Check Clothes)"
                        else:
                            color = None

                        if color:
                            # Draw Face Box
                            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

                            # Draw Shirt Box
                            cv2.rectangle(frame, (shirt_x1, shirt_y1), (shirt_x2, shirt_y2), (255, 0, 0), 2)
                            cv2.putText(frame, "Shirt Area", (shirt_x1, shirt_y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

                            # Text
                            label = f"{status}: {final_score*100:.0f}%"
                            cv2.rectangle(frame, (x, y-30), (x+w+100, y), color, -1)
                            cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                            cap.release()
                            print("✅ Match found! Returning frame.")
                            return frame

                except Exception as e:
                    pass

        frame_count += 1

    cap.release()
    print("❌ No match found.")
    return None
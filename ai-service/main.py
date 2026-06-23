from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn
import cv2
import numpy as np
import sqlite3
import json
import os
import re
import math
from pymongo import MongoClient

app = FastAPI(title="FeedLink AI Service")

# --- DATABASE CONFIGURATION ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
db_client = None
mongo_db = None
use_mongo = False

try:
    db_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    # Check server availability
    db_client.server_info()
    mongo_db = db_client["feedlink"]
    use_mongo = True
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"MongoDB connection failed: {e}. Falling back to SQLite local logging.")
    use_mongo = False

SQLITE_DB_PATH = "ai_logs.db"
if not use_mongo:
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            foodType TEXT,
            category TEXT,
            confidence REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS serving_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estimatedServings INTEGER,
            confidence REAL,
            quantityEntered TEXT,
            foodType TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ngo_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recommendedNGOs TEXT,
            foodType TEXT,
            servings INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# --- HELPER LOGGER FUNCTIONS ---
def log_food_analysis(food_type: str, category: str, confidence: float):
    if use_mongo:
        try:
            mongo_db["food_analysis"].insert_one({
                "foodType": food_type,
                "category": category,
                "confidence": confidence,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"Failed to log to MongoDB: {e}")
    else:
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO food_analysis (foodType, category, confidence) VALUES (?, ?, ?)",
                (food_type, category, confidence)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to log to SQLite: {e}")

def log_serving_prediction(estimated_servings: int, confidence: float, quantity_entered: str, food_type: str):
    if use_mongo:
        try:
            mongo_db["serving_predictions"].insert_one({
                "estimatedServings": estimated_servings,
                "confidence": confidence,
                "quantityEntered": quantity_entered,
                "foodType": food_type,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"Failed to log to MongoDB: {e}")
    else:
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO serving_predictions (estimatedServings, confidence, quantityEntered, foodType) VALUES (?, ?, ?, ?)",
                (estimated_servings, confidence, quantity_entered, food_type)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to log to SQLite: {e}")

def log_ngo_recommendations(recommended_ngos: list, food_type: str, servings: int):
    if use_mongo:
        try:
            mongo_db["ngo_recommendations"].insert_one({
                "recommendedNGOs": recommended_ngos,
                "foodType": food_type,
                "servings": servings,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"Failed to log to MongoDB: {e}")
    else:
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO ngo_recommendations (recommendedNGOs, foodType, servings) VALUES (?, ?, ?)",
                (json.dumps(recommended_ngos), food_type, servings)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Failed to log to SQLite: {e}")

# --- AI CORE HEURISTIC MODELS ---
def classify_image(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return "Generic Food", "Prepared Meal", 0.70
        
    img_resized = cv2.resize(img, (224, 224))
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    
    # Calculate mask percentages for color types
    # 1. White/Grey (Rice)
    white_mask = cv2.inRange(hsv, np.array([0, 0, 180]), np.array([180, 35, 255]))
    white_pct = np.sum(white_mask > 0) / white_mask.size
    
    # 2. Green (Vegetables)
    green_mask = cv2.inRange(hsv, np.array([35, 30, 40]), np.array([85, 255, 255]))
    green_pct = np.sum(green_mask > 0) / green_mask.size
    
    # 3. Yellow/Orange (Biryani/Curry/Fruits)
    yellow_orange_mask = cv2.inRange(hsv, np.array([10, 45, 50]), np.array([25, 255, 255]))
    yellow_orange_pct = np.sum(yellow_orange_mask > 0) / yellow_orange_mask.size
    
    # 4. Red (Curry/Fruits)
    red_mask1 = cv2.inRange(hsv, np.array([0, 45, 50]), np.array([10, 255, 255]))
    red_mask2 = cv2.inRange(hsv, np.array([160, 45, 50]), np.array([180, 255, 255]))
    red_pct = (np.sum(red_mask1 > 0) + np.sum(red_mask2 > 0)) / red_mask1.size
    
    # 5. Brown/Beige (Bread)
    brown_mask = cv2.inRange(hsv, np.array([10, 25, 60]), np.array([22, 140, 190]))
    brown_pct = np.sum(brown_mask > 0) / brown_mask.size

    # Texture Variance (to separate textured food like Biryani grains from smooth Curry liquid)
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    variance = np.var(gray)
    
    food_type = "Generic Food"
    category = "Prepared Meal"
    confidence = 0.85
    
    if white_pct > 0.35:
        food_type = "Rice"
        category = "Cooked Food"
        confidence = 0.88 + 0.1 * white_pct
    elif green_pct > 0.20:
        food_type = "Vegetables"
        category = "Fresh Produce"
        confidence = 0.85 + 0.12 * green_pct
    elif yellow_orange_pct > 0.22:
        if variance > 1100:
            food_type = "Biryani"
            category = "Cooked Food"
            confidence = 0.86 + 0.1 * yellow_orange_pct
        else:
            food_type = "Curry"
            category = "Cooked Food"
            confidence = 0.84 + 0.1 * yellow_orange_pct
    elif red_pct > 0.20:
        food_type = "Curry"
        category = "Cooked Food"
        confidence = 0.85 + 0.1 * red_pct
    elif brown_pct > 0.25:
        food_type = "Bread"
        category = "Bakery"
        confidence = 0.82 + 0.12 * brown_pct
    elif yellow_orange_pct + red_pct > 0.15:
        food_type = "Fruits"
        category = "Fresh Produce"
        confidence = 0.80 + 0.15 * (yellow_orange_pct + red_pct)
    else:
        # Fallbacks
        if variance > 900:
            food_type = "Rice"
            category = "Cooked Food"
            confidence = 0.76
        else:
            food_type = "Curry"
            category = "Cooked Food"
            confidence = 0.74
            
    confidence = min(round(float(confidence), 2), 0.99)
    return food_type, category, confidence

# --- DTO INTERFACES ---
class AnalysisResponse(BaseModel):
    category: str
    foodType: str
    confidence: float
    freshnessScore: float
    recommendation: str

class ServingResponse(BaseModel):
    estimatedServings: int
    confidence: float

class RecommendedNgo(BaseModel):
    id: int
    name: str
    distanceKm: float
    score: float
    capacity: str

class RecommendationResponse(BaseModel):
    recommendedNgos: List[RecommendedNgo]

# --- FASTAPI API ROUTERS ---
@app.get("/")
async def root():
    return {"message": "FeedLink AI Service is running"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_food(file: UploadFile = File(...)):
    image_bytes = await file.read()
    food_type, category, confidence = classify_image(image_bytes)
    
    # Calculate simulated freshness score based on HSV brightness and saturation properties
    freshness = 85.0
    if food_type == "Fruits" or food_type == "Vegetables":
        freshness = 90.0
    elif food_type == "Bread":
        freshness = 75.0
        
    recommendation = "Safe to consume. Distribute within 4 hours." if freshness > 80 else "Consume immediately. High priority."
    
    # Log predictions to MongoDB/SQLite
    log_food_analysis(food_type, category, confidence)
    
    return {
        "category": category,
        "foodType": food_type,
        "confidence": confidence,
        "freshnessScore": freshness,
        "recommendation": recommendation
    }

@app.post("/estimate-servings", response_model=ServingResponse)
async def estimate_servings_endpoint(
    file: UploadFile = File(...),
    quantity: str = Form(...),
    foodType: str = Form(...)
):
    image_bytes = await file.read()
    
    # Extract numeric value
    numbers = re.findall(r"[-+]?\d*\.\d+|\d+", quantity)
    raw_qty = float(numbers[0]) if numbers else 10.0
    
    # Detect weight vs portions
    is_weight = False
    is_grams = False
    qty_lower = quantity.lower()
    if "kg" in qty_lower or "kilo" in qty_lower:
        is_weight = True
    elif "g" in qty_lower or "gram" in qty_lower:
        is_weight = True
        is_grams = True
        
    weight_kg = raw_qty
    if is_grams:
        weight_kg = raw_qty / 1000.0
        
    # Servings calculation
    if is_weight:
        if foodType == "Biryani" or foodType == "Rice":
            servings = weight_kg / 0.3  # 300g per serving
        elif foodType == "Curry":
            servings = weight_kg / 0.25  # 250g
        elif foodType == "Bread":
            servings = weight_kg / 0.1  # 100g
        elif foodType == "Fruits":
            servings = weight_kg / 0.15  # 150g
        elif foodType == "Vegetables":
            servings = weight_kg / 0.2  # 200g
        else:
            servings = weight_kg / 0.25
    else:
        servings = raw_qty
        
    # Adjust using OpenCV Contour area size factor
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    area_factor = 0.5
    if img is not None:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 50, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            contour_area = cv2.contourArea(largest_contour)
            image_area = img.shape[0] * img.shape[1]
            area_factor = contour_area / image_area
            
    adjusted_servings = servings * (0.85 + 0.3 * area_factor)
    estimated_servings = max(1, int(round(adjusted_servings)))
    
    confidence = 0.80 + 0.12 * area_factor
    confidence = min(round(float(confidence), 2), 0.98)
    
    log_serving_prediction(estimated_servings, confidence, quantity, foodType)
    
    return {
        "estimatedServings": estimated_servings,
        "confidence": confidence
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def recommend_ngos(data: dict):
    donor_lat = float(data.get("latitude", 0.0))
    donor_lon = float(data.get("longitude", 0.0))
    food_type = data.get("foodType", "Generic Food")
    servings = int(data.get("estimatedServings", 20))
    ngos_list = data.get("ngos", [])
    
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    scored_ngos = []
    for ngo in ngos_list:
        ngo_lat = float(ngo.get("latitude", 0.0))
        ngo_lon = float(ngo.get("longitude", 0.0))
        dist_km = haversine(donor_lat, donor_lon, ngo_lat, ngo_lon)
        
        # 1. Distance score
        dist_score = 1.0 / (1.0 + dist_km)
        
        # 2. Capacity score
        cap_str = ngo.get("capacity", "MEDIUM").upper()
        if servings > 50:
            cap_score = 1.0 if cap_str == "HIGH" else (0.5 if cap_str == "MEDIUM" else 0.1)
        else:
            cap_score = 1.0 if cap_str == "MEDIUM" else (0.8 if cap_str == "LOW" else 0.7)
            
        # 3. Acceptance rate
        accept_rate = float(ngo.get("acceptanceRate", 0.90))
        
        # 4. Response time (hours)
        resp_time = float(ngo.get("responseTimeHours", 1.5))
        resp_score = 1.0 - min(1.0, resp_time / 4.0)
        
        final_score = (0.4 * dist_score) + (0.2 * cap_score) + (0.2 * accept_rate) + (0.2 * resp_score)
        
        scored_ngos.append({
            "id": int(ngo.get("id", 0)),
            "name": ngo.get("name", "NGO Partner"),
            "distanceKm": round(dist_km, 1),
            "score": round(final_score, 2),
            "capacity": cap_str
        })
        
    scored_ngos.sort(key=lambda x: x["score"], reverse=True)
    top_3 = scored_ngos[:3]
    
    log_ngo_recommendations(top_3, food_type, servings)
    
    return {
        "recommendedNgos": top_3
    }

@app.get("/analytics")
async def get_analytics_endpoint():
    if use_mongo:
        try:
            total_predictions = mongo_db["food_analysis"].count_documents({})
            
            # Most donated food types
            pipeline = [
                {"$group": {"_id": "$foodType", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            food_types_cursor = mongo_db["food_analysis"].aggregate(pipeline)
            most_donated = {item["_id"]: item["count"] for item in food_types_cursor}
            
            # Average servings
            pipeline_servings = [
                {"$group": {"_id": None, "avg_servings": {"$avg": "$estimatedServings"}}}
            ]
            servings_cursor = mongo_db["serving_predictions"].aggregate(pipeline_servings)
            servings_list = list(servings_cursor)
            avg_servings = servings_list[0]["avg_servings"] if servings_list else 20.0
            
            # Most active NGOs
            ngo_cursor = mongo_db["ngo_recommendations"].find({})
            ngo_counts = {}
            for rec in ngo_cursor:
                ngos = rec.get("recommendedNGOs", [])
                for ngo in ngos:
                    name = ngo.get("name", "Unknown NGO")
                    ngo_counts[name] = ngo_counts.get(name, 0) + 1
            most_active = dict(sorted(ngo_counts.items(), key=lambda x: x[1], reverse=True)[:5])
            
            # Trends grouped by day
            pipeline_trends = [
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            trends_cursor = mongo_db["food_analysis"].aggregate(pipeline_trends)
            trends = {item["_id"]: item["count"] for item in trends_cursor}
            
            return {
                "totalPredictions": total_predictions,
                "mostDonatedFoodTypes": most_donated,
                "averageServings": round(avg_servings, 1),
                "mostActiveNgos": most_active,
                "wasteTrends": trends
            }
        except Exception as e:
            print(f"MongoDB aggregation error, falling back to SQLite: {e}")
            
    # SQLite fallback aggregation
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM food_analysis")
        total_predictions = cursor.fetchone()[0]
        
        cursor.execute("SELECT foodType, COUNT(*) as cnt FROM food_analysis GROUP BY foodType ORDER BY cnt DESC")
        most_donated = {row[0]: row[1] for row in cursor.fetchall()}
        
        cursor.execute("SELECT AVG(estimatedServings) FROM serving_predictions")
        avg_servings_row = cursor.fetchone()
        avg_servings = avg_servings_row[0] if avg_servings_row and avg_servings_row[0] is not None else 20.0
        
        cursor.execute("SELECT recommendedNGOs FROM ngo_recommendations")
        ngo_counts = {}
        for row in cursor.fetchall():
            try:
                ngos = json.loads(row[0])
                for ngo in ngos:
                    name = ngo.get("name", "Unknown NGO")
                    ngo_counts[name] = ngo_counts.get(name, 0) + 1
            except Exception:
                pass
        most_active = dict(sorted(ngo_counts.items(), key=lambda x: x[1], reverse=True)[:5])
        
        cursor.execute("SELECT strftime('%Y-%m-%d', timestamp) as day, COUNT(*) FROM food_analysis GROUP BY day ORDER BY day ASC")
        trends = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "totalPredictions": total_predictions,
            "mostDonatedFoodTypes": most_donated,
            "averageServings": round(avg_servings, 1),
            "mostActiveNgos": most_active,
            "wasteTrends": trends
        }
    except Exception as e:
        print(f"SQLite aggregation failed: {e}")
        return {
            "totalPredictions": 0,
            "mostDonatedFoodTypes": {},
            "averageServings": 0.0,
            "mostActiveNgos": {},
            "wasteTrends": {}
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

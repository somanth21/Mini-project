# FeedLink AI - Production Deployment & Configuration Guide

Welcome to the **FeedLink AI** project workspace. This repository contains the complete codebase for a full-stack food waste reduction platform enabled by a TensorFlow MobileNetV2 image recognition classifier, dynamic demand forecasting, geospatial mapping, STOMP WebSockets, and QR code verification.

---

## Repository Structure

```text
├── backend/            # Spring Boot REST Gateway & STOMP WebSocket broker
├── ai-service/         # FastAPI Python AI inference engine (TensorFlow, OpenCV, Scikit-Learn)
├── frontend/           # React + Vite client dashboard dashboard UI
└── .env.example        # Combined master template for all environment configurations
```

---

## 1. Environment Configuration

The application is fully configured via environment variables to ensure zero hardcoded secrets. 

To configure your workspace:
1. Copy the master `.env.example` file to `.env` in the root workspace.
2. Populate the parameters with your live PostgreSQL credentials and Gemini API Key:

```env
# Database Credentials
SPRING_DATASOURCE_URL=jdbc:postgresql://<database-host>:<port>/<database-name>?sslmode=require
SPRING_DATASOURCE_USERNAME=<db-username>
SPRING_DATASOURCE_PASSWORD=<db-password>

# JWT Authentication
JWT_SECRET=verylongandcomplexsecretkeythatshouldbeatleast32characterslong

# FastAPI AI service URL
FASTAPI_URL=http://localhost:8000

# Google Gemini API key (chatbot capability)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend base API URL mapping
VITE_API_BASE_URL=http://localhost:8080
```

---

## 2. Installation & Setup

### Prerequisites
- **Java**: JDK 17+
- **Node.js**: Node 18+ (tested on v24)
- **Python**: Python 3.9+ with `pip`
- **PostgreSQL**: Hosted or local database

### Step 1: Initialize FastAPI AI Service
1. Navigate to the `ai-service` directory.
2. Create a virtual environment and install packages:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill the variables.
4. Launch FastAPI:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Step 2: Initialize Spring Boot Backend
1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env` and fill the variables.
3. Build and package:
   ```bash
   mvn clean package
   ```
4. Start the application:
   ```bash
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

### Step 3: Initialize React Frontend
1. Navigate to the `frontend` directory.
2. Copy `.env.example` to `.env` and verify API path.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```

---

## 3. Production Deployment Guide

### Deploying using Docker Compose
To deploy the entire stack using Docker, create the following `docker-compose.yml` in the root folder:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: feedlink-db
    environment:
      POSTGRES_DB: neondb
      POSTGRES_USER: neondb_owner
      POSTGRES_PASSWORD: your_db_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ai-service:
    build: ./ai-service
    container_name: feedlink-ai
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=your_gemini_key
      - MONGO_URI=mongodb://mongodb:27017
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    container_name: feedlink-mongo
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: feedlink-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/neondb
      - SPRING_DATASOURCE_USERNAME=neondb_owner
      - SPRING_DATASOURCE_PASSWORD=your_db_password
      - JWT_SECRET=your_jwt_secret_key_of_32_characters
      - FASTAPI_URL=http://ai-service:8000
    depends_on:
      - postgres
      - ai-service

  frontend:
    build: ./frontend
    container_name: feedlink-frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:8080

volumes:
  postgres_data:
```

---

## 4. Optional Configurations

### SMTP Email Configuration
To enable password reset link emails to be dispatched to real addresses:
1. Provide the following values in your backend `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@feedlink.ai
   ```
2. If these variables are left empty, the system will fall back to local console simulation.

### Cloudinary Asset Storage
To store uploaded food images in Cloudinary instead of the local server:
1. Set the following variable in `ai-service/.env`:
   ```env
   CLOUDINARY_URL=cloudinary://my_key:my_secret@my_cloud_name
   ```
2. If this variable is absent, images will be saved inside the `uploads/` directory on the server node.

# Installation & Deployment Guide
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. Environment Requirements
Ensure the host machine satisfies these runtime requirements:
- **Operating System**: Windows 10/11, Ubuntu 20.04+, or macOS.
- **Java Platform**: JDK 17 (Java SE Development Kit).
- **Python Environment**: Python 3.10.x.
- **Node Environment**: Node.js v18.x or v20.x.
- **Databases**: PostgreSQL (v14 or newer) and MongoDB (v5.0 or newer) or SQLite file access.

---

### 2. Databases Configuration

#### 2.1 PostgreSQL Setup
1. Create a database instance named `feedlink` on your PostgreSQL server.
2. Ensure the user credentials match your environment variables (default: user `postgres`, password `password`).
3. Spring Boot's JPA will automatically create the tables (`users`, `ngos`, `donations`, `refresh_tokens`, `ai_prediction_logs`) on startup using `spring.jpa.hibernate.ddl-auto=update`.

#### 2.2 MongoDB Setup
1. Verify that MongoDB is listening on the default port `27017` (`mongodb://localhost:27017`).
2. If MongoDB is offline, the FastAPI AI service will automatically use a local SQLite database file named `ai_logs.db`.

---

### 3. FastAPI AI Service Installation

1. Navigate to the `ai-service` directory:
   ```bash
   cd ai-service
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux/macOS**:
     ```bash
     source venv/bin/activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the FastAPI microservice using Uvicorn:
   ```bash
   python main.py
   ```
   *Note*: The service listens on `http://localhost:8000`. On first run, if `food_model.h5` does not exist, TensorFlow will download the MobileNetV2 base weights and compile the classifier.

---

### 4. Spring Boot Backend Gateway Installation

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create or verify the database configuration parameters in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/feedlink
   spring.datasource.username=postgres
   spring.datasource.password=password
   spring.jpa.hibernate.ddl-auto=update
   ```
3. Compile the Java files and run the Spring Boot application using Maven:
   - **If Maven is globally installed**:
     ```bash
     mvn clean compile spring-boot:run
     ```
   - **Using the local Apache Maven build tool**:
     ```powershell
     & "C:\Users\soman\Downloads\apache-maven-3.9.9-bin\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
     ```
   *Note*: The backend application launches on port `8080` (`http://localhost:8080`).

---

### 5. React Frontend Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Compile and launch the Vite development server locally:
   ```bash
   npm run dev
   ```
   *Note*: Access the application in your browser at `http://localhost:5173`.

---

### 6. Environment Variables Reference

Configure the following environment variables to customize your deployment:

| Variable Name | Default Value | Target Module | Purpose |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `40a2f11856b3e74bcbc34d3b664d93...` | `backend` | Cryptographic signature key for secure JWT authentication. |
| `JWT_EXPIRATION_MS` | `3600000` (1 hour) | `backend` | Lifespan of JWT access tokens in milliseconds. |
| `REFRESH_TOKEN_EXPIRATION_MS` | `86400000` (24 hours) | `backend` | Lifespan of rotating refresh tokens. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/feedlink` | `backend` | Connection URL for the PostgreSQL instance. |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | `backend` | Database login username. |
| `SPRING_DATASOURCE_PASSWORD` | `password` | `backend` | Database login credentials password. |
| `MONGO_URI` | `mongodb://localhost:27017` | `ai-service` | Connection string for MongoDB (telemetry database). |
| `FASTAPI_URL` | `http://localhost:8000` | `backend` | Address of the FastAPI AI Service broker. |
| `GEMINI_API_KEY` | `AIzaSyCmRuIScRaAA1fTI9XpNpfgC2dTyVtCwPc` | `ai-service` | API key used for generating context-aware chatbot answers. |

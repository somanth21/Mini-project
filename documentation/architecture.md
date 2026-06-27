# Architecture Documentation
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. High-Level System Architecture
FeedLink AI employs a decoupled microservices design separating frontend presentation, core business logic, database persistence, and deep learning services. The architecture balances performance, security, and fallback capability.

```mermaid
graph TD
    %% Clients
    Client["React Frontend (Client Browser)"]

    %% Gateway / Core Backend
    SpringBoot["Spring Boot Gateway (Port 8080)"]
    Postgres[("PostgreSQL Database (Neon)")]

    %% AI Microservices
    FastAPI["FastAPI AI Service (Port 8000)"]
    LocalDB[("Local Logs DB (SQLite / MongoDB)")]
    GeminiAPI["Gemini 1.5 Flash API"]

    %% Communications
    Client <-->|HTTP / JWT / WebSockets| SpringBoot
    SpringBoot <-->|JPA / Hibernate| Postgres
    SpringBoot <-->|REST HTTP Requests| FastAPI
    FastAPI <-->|Local Query| LocalDB
    FastAPI <-->|External HTTP| GeminiAPI
```

---

### 2. Component Diagram
The key software components are modularly isolated to maintain clear boundaries:

```mermaid
graph TB
    subgraph Frontend Components [React Client Module]
        UI[UI Views & Dashboards]
        AuthContext[Auth Context & Protected Routes]
        WSClient[SockJS & StompJS Client]
        MapModule[Leaflet Geospatial Map]
        ChatWidget[Floating Chatbot UI]
    end

    subgraph Spring Boot Components [Core Broker Module]
        Controllers[Rest Controllers: Auth, Donation, AI]
        SecFilter[Spring Security JWT Authentication Filter]
        Repositories[JPA Repositories: User, Donation, RefreshToken]
        WSBroker[STOMP WebSocket Broker]
        AiClient[AiService RestTemplate client]
    end

    subgraph FastAPI Components [AI Microservice Module]
        Routers[FastAPI Routes: /analyze, /recommend, /forecast, /chat]
        TFModel[TensorFlow MobileNetV2 Pipeline]
        CVEngine[OpenCV Image Preprocessor]
        RFRegressor[RandomForest Forecast Engine]
        ChatAgent[Gemini Chatbot Manager]
        Telemetry[AI Health Telemetry Tracker]
    end

    UI -->|HTTP Requests| SecFilter
    SecFilter --> Controllers
    Controllers --> Repositories
    Controllers --> AiClient
    WSClient <-->|STOMP WS| WSBroker
    AiClient -->|REST Proxy| Routers
    Routers --> TFModel
    Routers --> CVEngine
    Routers --> RFRegressor
    Routers --> ChatAgent
    Routers --> Telemetry
```

---

### 3. Deployment Diagram
FeedLink AI is designed for containerized or virtualized deployment. In production-ready setups, the database and services reside on separate VMs:

```mermaid
deploymentNode "Client Machine" {
    node "Browser Runtime" {
        artifact "Vite React SPA Bundle" as ClientApp
    }
}

deploymentNode "Application Server VM" {
    node "Java Virtual Machine (JRE 17)" {
        node "Tomcat Embedded Server" {
            artifact "Spring Boot Backend broker JAR" as BootApp
        }
    }
}

deploymentNode "AI Engine Server VM" {
    node "Python 3.10 Runtime Environment" {
        node "Uvicorn ASGI Server" {
            artifact "FastAPI AI Microservice app" as PyApp
            file "food_model.h5 weights file" as H5Model
        }
    }
}

database "Cloud Database Cluster" {
    folder "Relational Nodes" {
        database "PostgreSQL Database Instance" as PostgresDB
    }
    folder "NoSQL Document Nodes" {
        database "MongoDB Cluster / SQLite Local File" as MongoTelemetry
    }
}

ClientApp <--> BootApp : "HTTPS / WSS (Port 8080)"
BootApp <--> PostgresDB : "JDBC / SSL (Port 5432)"
BootApp <--> PyApp : "HTTP / Private Subnet (Port 8000)"
PyApp <--> MongoTelemetry : "MongoDB Protocol (Port 27017) / SQLite"
PyApp --> H5Model : "In-memory Model Load"
```

---

### 4. AI Microservice Architecture
The AI Service operates as a specialized pipeline, isolating deep learning inference, explainability compilation, and forecasting regression:

```mermaid
flowchart TD
    %% Image Pipeline
    Img[Uploaded Food Image File] --> Decode[cv2.imdecode]
    Decode -->|Valid format| Preprocess[CLAHE Normalization & Cubic Resize]
    Decode -->|Corrupted| Error[Return Corrupted Image Response]
    
    Preprocess --> DLInference[TensorFlow MobileNetV2 Predict]
    DLInference -->|Success| TopPredictions[Top 3 Classes Extraction]
    DLInference -->|Exception| CVFallback[OpenCV HSV Heuristics fallback]
    
    TopPredictions --> Explainability[Explainability Engine: Color percentage + variance + CNN confidence]
    CVFallback --> Explainability
    
    %% Output
    Explainability --> Response[Construct REST Response Payload]
    Response --> DbLog[Persist Log to MongoDB / SQLite]
```

---

### 5. Spring Boot ↔ FastAPI Communication Diagram
The sequence details how the broker mediates request authorization and logs predictions concurrently:

```mermaid
sequenceDiagram
    autonumber
    actor Hotel as Hotel / Hostel Client
    participant Spring as Spring Boot Backend
    database PG as PostgreSQL DB
    participant FastAPI as FastAPI AI Service
    database SQLite as SQLite / MongoDB

    Hotel->>Spring: POST /api/ai/analyze-food (file, JWT token)
    Note over Spring: Validate JWT token & extract UserPrincipal email
    Spring->>FastAPI: POST /analyze (Multipart File, Header: X-User-Email)
    
    FastAPI->>FastAPI: Run Image Validation & CLAHE preprocessing
    FastAPI->>FastAPI: Execute MobileNetV2 / OpenCV Inference
    FastAPI->>FastAPI: Compile Explainability Reason text
    FastAPI->>SQLite: Log prediction result (imageUrl, userEmail, fallbackUsed)
    FastAPI-->>Spring: Return DTO (category, foodType, confidence, explanation, top3, imageUrl)
    
    Spring->>PG: Save prediction log (AIPredictionLog entity with confidence, imageUrl, userEmail)
    Spring-->>Hotel: Return FoodAnalysisResponse payload
```

# Software Requirements Specification (SRS)
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. Abstract
**FeedLink AI** is a production-grade, intelligent full-stack social impact platform designed to bridge the gap between food surplus generators (Hotels, Hostels, and Restaurants) and food distribution organizations (NGOs and Volunteers). The platform integrates deep learning image recognition (TensorFlow MobileNetV2), computer vision (OpenCV), heuristic analytical matching, real-time push notification telemetry (WebSockets), and predictive machine learning (Scikit-Learn RandomForest) to optimize surplus food rescue. By automating the auditing of food type, freshness, and portions, and matching them to regional NGO capacities, FeedLink AI minimizes food waste, maximizes logistical efficiency, and provides quantifiable metrics on environmental (CO₂ saved) and social impact.

---

### 2. Problem Statement
Global food waste accounts for approximately one-third of all food produced, contributing to nearly 8-10% of global greenhouse gas emissions. Concurrently, millions of individuals suffer from food insecurity. Major food surplus generators, such as hotels, hostels, and banquet halls, struggle with:
1. **Lack of Automated Auditing**: Manually measuring food quantity, category, and freshness is slow and prone to errors.
2. **Logistical Latency**: Difficulty matching surplus donations with local NGOs that have immediate capacity, leading to spoilage before collection.
3. **Absence of Real-time Coordination**: Reliance on static spreadsheets and manual phone calls rather than instant, secure matching.
4. **Lack of Verifiability**: Handovers are vulnerable to loss of tracking, theft, or quality deterioration without verified digital signatures (like QR codes).
5. **No Predictive Insights**: No forecasting to inform administrators about upcoming food waste hotspots or scheduling regional NGO operations.

---

### 3. Objectives
The core objectives of the FeedLink AI platform are:
- **Automated Recognition**: Classify surplus food items, estimate serving sizes, and evaluate freshness score categories using a dual-mode TensorFlow + OpenCV pipeline.
- **Logistical Optimization**: Rank and match food donations with local NGOs based on Haversine distance, target capacities, and historical response scores.
- **Real-Time Synchronization**: Instantly broadcast available donation alerts to regional NGOs using a WebSocket push notification network.
- **Secure Handovers**: Verify custody transfers using unique tokenized QR codes to ensure transparency.
- **Carbon Accounting**: Provide direct feedback on carbon emissions prevented (calculating $1.25 \text{ kg CO}_2$ saved per meal).
- **Proactive Forecasting**: Predict donation volumes and identify high-waste neighborhood hotspots using machine learning.

---

### 4. Scope
FeedLink AI spans three client categories:
1. **Hotel & Hostel Portals**: Upload food images, trigger automated classification, select recommended NGOs, generate verification hand-over QR codes, and review carbon offset records.
2. **NGO Dashboard**: Inspect nearby available donations, accept matching claims, review pending pickups, scan donor QR codes for validation, and audit delivery history.
3. **Admin Console**: Monitor platform-wide stats, manage user activation (hotel/hostel registration, NGO approvals), analyze forecast parameters, inspect prediction logs, and audit AI pipeline health.

---

### 5. Functional Requirements

#### 5.1 User Authentication & Authorization (Multi-Role)
- **FR-1.1**: The system must support registration and authentication for three roles: `HOTEL` (rebranded to Hotels and Hostels), `NGO`, and `ADMIN`.
- **FR-1.2**: JWT-based stateless authentication with rotating refresh tokens must secure all api paths.
- **FR-1.3**: Admin users must approve NGO accounts before they can accept donations.

#### 5.2 AI Food Recognition & Explainability
- **FR-2.1**: The system must accept food images, resize them to $224 \times 224 \times 3$, and classify them into 10 distinct classes.
- **FR-2.2**: The system must return the top 3 class predictions with confidence scores.
- **FR-2.3**: If TensorFlow is unavailable, the pipeline must fail back to OpenCV HSV color space heuristics.
- **FR-2.4**: The system must generate color and texture-based reasoning text for every prediction.
- **FR-2.5**: Badges in the frontend must map confidence into High ($\ge 95\%$), Good ($80-94\%$), Moderate ($60-79\%$), and Low ($< 60\%$).

#### 5.3 Serving Estimation & NGO Recommendation
- **FR-3.1**: Estimate portions by scaling raw weight/quantity inputs against contour boundary areas.
- **FR-3.2**: Recommended matching NGOs using a composite score weighting distance, capacity fit, historic acceptance rate, and response latency.

#### 5.4 Handovers & Notifications
- **FR-4.1**: Real-time push alerts must broadcast new donations to regional NGOs via a WebSocket broker.
- **FR-4.2**: Generate a tokenized QR code on donation acceptance, scanning of which updates the status to `DELIVERED`.

#### 5.5 Analytics & Forecasting
- **FR-5.1**: Predict surplus food volumes for the upcoming day with 95% confidence intervals.
- **FR-5.2**: Track and display high-risk neighborhood waste hotspots.

---

### 6. Non-Functional Requirements

#### 6.1 Performance
- **NFR-1.1**: Food classification inference time must remain under $200 \text{ ms}$ on standard server hardware.
- **NFR-1.2**: WebSocket broadcast propagation latency must not exceed $500 \text{ ms}$.

#### 6.2 Security
- **NFR-2.1**: Passwords must be hashed using BCrypt.
- **NFR-2.2**: API gateway endpoints must validate JWT signatures and enforce role authorization filters.

#### 6.3 Reliability & Availability
- **NFR-3.1**: Service must transparently log predictions to local SQLite if MongoDB connections time out.
- **NFR-3.2**: A dual-mode model classifier must fall back to computer vision heuristics if deep learning libraries fail to load.

#### 6.4 Scalability & Portability
- **NFR-4.1**: The frontend must load responsively across mobile, tablet, and desktop viewports.

---

### 7. Technology Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Recharts, Leaflet Maps, SockJS, StompJS.
- **Backend Broker**: Spring Boot 3.2.4 (Java 17), Spring Security, Spring Data JPA, WebSockets (STOMP broker), OpenPDF, ZXing.
- **AI Microservice**: Python FastAPI 3.10, TensorFlow Keras (MobileNetV2), OpenCV, Scikit-Learn (RandomForestRegressor), Gemini 1.5 Flash.
- **Databases**: PostgreSQL (JPA relational mapping), MongoDB / SQLite (AI logs, telemetry, chatbot).

---

### 8. System Architecture
FeedLink AI operates a decoupled microservices architecture. The React frontend interacts with the Spring Boot Backend Broker. The Spring Boot backend manages security, business logic, PostgreSQL persistence, and WebSockets. It forwards AI requests (food image analysis, NGO recommendations, demand forecasting, chatbot Gemini prompts) via REST to the Python FastAPI AI Microservice, which processes them using local databases and deep learning pipelines.

---

### 9. Constraints
- **Hardware Limitations**: Model weights are cached locally; training requires significant GPU memory, so the model is pre-trained and fine-tuned for inference.
- **Network Latency**: External API dependencies (e.g., Gemini) require internet access, falling back to local rule-based responses if connections drop.

---

### 10. Future Scope
1. **Dynamic Route Optimization**: Integrate Dijkstra or A* algorithms to compute optimal pickup routes for volunteer drivers.
2. **IoT Integration**: Connect smart weighing scales to automate quantity logging.
3. **Generative Cold-Chain Alerts**: Introduce smart alerts for perishables based on temperature sensor telemetry.

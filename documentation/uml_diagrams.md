# UML Diagrams
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. Use Case Diagram
This diagram outlines the interactions between primary system actors (Hotels & Hostels, NGOs, Admins) and core platform modules.

```mermaid
left-to-right direction
actor "Hotel & Hostels (Donor)" as Hotel
actor "NGO Partner (Recipient)" as NGO
actor "Administrator (System Manager)" as Admin

rectangle FeedLinkAISystem {
    %% Authentication
    usecase "Authenticate (Login/Register/Logout)" as UC_Auth
    usecase "Manage User Profile" as UC_Profile
    
    %% Hotel Use cases
    usecase "Analyze Food Image (Classification & Freshness)" as UC_Analyze
    usecase "Estimate Serving Size" as UC_Estimate
    usecase "Submit Food Donation" as UC_Donate
    usecase "Generate Custody Verification QR" as UC_GenQR
    usecase "View Carbon Offset Metrics" as UC_Carbon
    
    %% NGO Use cases
    usecase "Browse Proximity Donations (Maps)" as UC_Browse
    usecase "Accept Donation Claim" as UC_Accept
    usecase "Scan QR Code for Handover Verification" as UC_ScanQR
    
    %% Admin Use cases
    usecase "Approve/Suspend User Accounts" as UC_Approve
    usecase "Monitor AI Telemetry & Pipeline Health" as UC_Health
    usecase "Inspect Auditable Prediction Logs" as UC_Logs
    usecase "View Predictive Demand Forecasts" as UC_Forecast
}

%% Hotel Connections
Hotel --> UC_Auth
Hotel --> UC_Profile
Hotel --> UC_Analyze
Hotel --> UC_Estimate
Hotel --> UC_Donate
Hotel --> UC_GenQR
Hotel --> UC_Carbon

%% NGO Connections
NGO --> UC_Auth
NGO --> UC_Profile
NGO --> UC_Browse
NGO --> UC_Accept
NGO --> UC_ScanQR

%% Admin Connections
Admin --> UC_Auth
Admin --> UC_Approve
Admin --> UC_Health
Admin --> UC_Logs
Admin --> UC_Forecast
```

---

### 2. Class Diagram
Renders the relational entities in Spring Boot backend, showing fields, type signatures, and relative relationships:

```mermaid
classDiagram
    class User {
        +Long id
        +String email
        +String password
        +String name
        +Role role
        +boolean verified
        +String phone
        +String accountStatus
        +Double latitude
        +Double longitude
        +String address
        +LocalDateTime createdAt
        +getAuthorities()
        +getUsername()
    }

    class Role {
        <<enumeration>>
        ADMIN
        HOTEL
        NGO
        VOLUNTEER
    }

    class RefreshToken {
        +Long id
        +String token
        +LocalDateTime expiryDate
        +User user
    }

    class Donation {
        +Long id
        +User donor
        +User ngo
        +User volunteer
        +String foodType
        +String category
        +Integer quantity
        +String description
        +String imageUrl
        +DonationStatus status
        +LocalDateTime expiryTime
        +LocalDateTime createdAt
        +LocalDateTime acceptedAt
        +LocalDateTime deliveredAt
        +String verificationToken
        +Double freshnessScore
        +String AIRecommendation
        +Double latitude
        +Double longitude
        +String pickupAddress
    }

    class DonationStatus {
        <<enumeration>>
        AVAILABLE
        ACCEPTED
        PICKED_UP
        DELIVERED
        EXPIRED
    }

    class AIPredictionLog {
        +String id
        +Long donationId
        +String foodType
        +String category
        +Double confidence
        +Double freshnessScore
        +String imageUrl
        +String userEmail
        +String predictionRaw
        +LocalDateTime timestamp
    }

    User --> Role : has role
    RefreshToken "1" o-- "1" User : maps to
    Donation "many" o-- "1" User : donated by (donor)
    Donation "many" o-- "1" User : claimed by (ngo)
    Donation "many" o-- "1" User : transported by (volunteer)
    Donation --> DonationStatus : has status
```

---

### 3. Sequence Diagram (End-to-End Donation Verification)
Details the lifecycle of a food surplus listing, from initial image analysis through to the final QR-verified custody transfer to an NGO.

```mermaid
sequenceDiagram
    autonumber
    actor Hotel as Hotel / Hostel User
    actor NGO as NGO User
    participant System as Spring Boot Backend
    participant AI as FastAPI AI Service
    participant WS as WebSocket Message Broker

    %% Phase 1: Upload & Classify
    Hotel->>System: Upload image to /api/ai/analyze-food
    System->>AI: Forward to /analyze (with X-User-Email)
    AI-->>System: Return predictions, category, explanation, top3, and imageUrl
    System-->>Hotel: Display classification & reasoning text on dashboard
    
    %% Phase 2: Create Donation
    Hotel->>System: Submit donation form (estimated servings, categories)
    System->>System: Persist Donation in DB (Status: AVAILABLE)
    System->>WS: Broadcast new donation alert (STOMP payload)
    WS-->>NGO: Show push notification to nearby NGOs
    
    %% Phase 3: Claim
    NGO->>System: PUT /api/donations/claim/{id}
    System->>System: Update status to ACCEPTED, generate verificationToken
    System-->>NGO: Return unique verificationToken & details
    
    %% Phase 4: Verification Handover
    NGO->>Hotel: Visit pickup location
    Hotel->>System: GET /api/donations/{id}/qr (renders QR containing token)
    NGO->>System: POST /api/donations/verify (scans QR, sends token)
    System->>System: Validate token matches database verificationToken
    System->>System: Update status to DELIVERED, set deliveredAt time
    System-->>NGO: Handover Confirmed!
    System-->>Hotel: Donation Completed successfully!
```

---

### 4. Activity Diagram
Depicts the flow of actions from the creation of a donation, through the routing, to the confirmation of receipt:

```mermaid
stateDiagram-v2
    [*] --> CreateDonation: Hotel captures food photo
    CreateDonation --> PreprocessImage: System CLAHE pre-processes
    PreprocessImage --> AIClassification: Run TensorFlow MobileNetV2
    AIClassification --> Explainability: Compile explanation text
    Explainability --> MatchNGO: Run Haversine + capacity match scoring
    MatchNGO --> BroadcastAlerts: Broadcast to STOMP WebSocket topic
    
    state AlertSplit <<fork>>
    BroadcastAlerts --> AlertSplit
    AlertSplit --> NGO_Acceptance: NGO accepts donation claim
    AlertSplit --> Donation_Expiration: Donation expiry elapsed
    
    Donation_Expiration --> [*] : Mark status EXPIRED
    
    NGO_Acceptance --> AcceptedState: Status set to ACCEPTED
    AcceptedState --> QR_Generation: Hotel generates verification QR
    QR_Generation --> Scan_Verification: NGO scans QR code on-site
    Scan_Verification --> HandoverSuccess: Validate token matches db
    HandoverSuccess --> MarkDelivered: Status set to DELIVERED
    MarkDelivered --> [*]
```

---

### 5. State Diagram (Donation Status Transitions)
Shows the formal states a food donation goes through, capturing standard flows and expiration boundaries:

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Hotel submits donation listing
    AVAILABLE --> ACCEPTED : NGO clicks claim (ngo_id mapped)
    AVAILABLE --> EXPIRED : Expiry time elapsed
    ACCEPTED --> AVAILABLE : NGO cancels claim (ngo_id unmapped)
    ACCEPTED --> PICKED_UP : Volunteer/NGO picks up food (transit)
    ACCEPTED --> EXPIRED : Expiry time elapsed before pickup
    PICKED_UP --> DELIVERED : Scan QR code (verified custody handover)
    DELIVERED --> [*]
    EXPIRED --> [*]
```

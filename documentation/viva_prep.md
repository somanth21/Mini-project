# Viva Preparation & Architectural Q&A Guide
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### Part 1: Platform Architecture & Security Decisions

#### 1. Why did you choose a Decoupled Microservices Architecture (Spring Boot + FastAPI)?
- **Separation of Concerns**: Spring Boot handles secure business logic, user accounts, transactional donations, and WebSocket routing, which requires strict security and ACID compliance. FastAPI manages machine learning pipelines (TensorFlow, OpenCV, Scikit-Learn) that run in a Python runtime.
- **Resource Scaling**: The deep learning service requires high memory and GPU/CPU power. Decoupling allows hosting the AI microservice on a GPU-accelerated server while the web gateway runs on a standard lightweight application VM.

#### 2. How is Security implemented in the REST Gateway?
- **Authentication**: JWT (JSON Web Tokens) are used for stateless authentication. Passwords are encrypted using BCrypt.
- **Role-Based Authorization**: Filter classes in Spring Security inspect authorization roles (`ROLE_HOTEL`, `ROLE_NGO`, `ROLE_ADMIN`) on incoming requests, blocking unauthorized access.
- **Session Rotation**: The system uses rotating refresh tokens stored in PostgreSQL with short-lived JWT access tokens, reducing the risk of token theft.

#### 3. How does the Handover Verification (QR Code) system prevent fraud?
- When an NGO claims a donation, the backend generates a random `verificationToken` (UUID).
- The donor displays a QR code containing the donation ID and token.
- The NGO scans the code, and the backend verifies that the token matches the database entry before updating the status to `DELIVERED`. This ensures that donations cannot be claimed without physically collecting the food.

---

### Part 2: AI & Machine Learning Workflows

#### 4. How does the Dual-Mode Image Classifier operate?
- **Primary Mode**: Uses a pre-trained **MobileNetV2** model fine-tuned for food recognition. It processes the image and returns predictions, confidence scores, and categories.
- **Fallback Mode**: If TensorFlow fails to initialize, the service uses OpenCV color histograms and texture metrics for classification.

#### 5. Why use CLAHE in the preprocessing pipeline?
- **CLAHE (Contrast Limited Adaptive Histogram Equalization)** is applied to the Lightness channel in the LAB color space. This normalizes varying lighting conditions, glare, and shadows in food photos, ensuring consistent classification.

#### 6. How is prediction explainability compiled?
- The service analyzes the image using OpenCV to calculate color percentages (white, green, yellow/orange, red, brown) and grayscale texture variance. These metrics are combined with the model's classification confidence to generate a human-readable explanation of the prediction.

#### 7. How does the RandomForest forecasting model compute 95% confidence bounds?
- The forecasting module uses a **RandomForestRegressor** (50 decision trees).
- For each prediction, the system calculates the standard deviation across all 50 individual tree predictions.
- The 95% confidence interval is computed as:
  $$\text{Interval} = \hat{y} \pm (1.96 \times \text{std\_dev})$$

---

### Part 3: 50 Viva Q&A List

#### Q1. What is the core purpose of FeedLink AI?
**Answer**: FeedLink AI is a platform designed to reduce food waste by automating surplus food audits, predicting waste hotspots, and matching donations with local NGOs based on distance and capacity.

#### Q2. Name the roles in the system.
**Answer**: `ADMIN`, `HOTEL` (Hotels & Hostels), `NGO`, and `VOLUNTEER`.

#### Q3. What is the carbon saved formula?
**Answer**: $1.25 \text{ kg of } \text{CO}_2$ saved per meal delivered (calculated as $\text{meals} \times 1.25$).

#### Q4. Why is the frontend built on React + Vite instead of plain HTML/JS?
**Answer**: Vite provides fast hot-module replacement (HMR) and optimized build times, while React enables component reusability and responsive UI state management.

#### Q5. What is the role of Spring Security?
**Answer**: It intercept requests, validates JWT signatures, extracts user credentials, and enforces role-based access control (RBAC).

#### Q6. What is the difference between PostgreSQL and MongoDB/SQLite in this platform?
**Answer**: PostgreSQL stores structured, transactional data (users, donations) requiring strict ACID compliance. MongoDB/SQLite handles high-frequency AI logging, telemetry, and chatbot history.

#### Q7. What deep learning model is used for food recognition?
**Answer**: A pre-trained **MobileNetV2** model.

#### Q8. Why MobileNetV2 instead of ResNet50 or VGG16?
**Answer**: MobileNetV2 is designed for mobile and resource-constrained environments. It runs quickly on standard CPUs while maintaining high accuracy.

#### Q9. How do you handle corrupt image uploads?
**Answer**: OpenCV's `cv2.imdecode` checks the image matrix. If it is `None`, the system returns a structured response indicating a corrupted upload.

#### Q10. What is the purpose of the Haversine formula in this project?
**Answer**: It calculates the great-circle distance between coordinates on a sphere, helping map and match donations to nearby NGOs.

#### Q11. How are notifications broadcast in real-time?
**Answer**: Using WebSockets with a STOMP broker configured in Spring Boot.

#### Q12. How does the NGO claim a donation?
**Answer**: By selecting an available donation on the dashboard and claiming it, which updates the status to `ACCEPTED`.

#### Q13. How does the system handle expired donations?
**Answer**: Donations have an `expiryTime`. If this threshold passes before the food is claimed or picked up, the status is marked as `EXPIRED`.

#### Q14. What are the 10 food classes the AI model can identify?
**Answer**: Chicken Biryani, Veg Biryani, Steamed Rice, Fried Rice, Roti/Naan, Sliced Bread, Chicken Curry, Veg Curry, Mixed Fruits, Mixed Vegetables.

#### Q15. How do you calculate dominant categories in the chatbot context?
**Answer**: The backend groups the user's donations by category, counts occurrences, sorts them in descending order, and sends the list to the chatbot.

#### Q16. How is JWT rotation handled?
**Answer**: Short-lived access tokens (1 hour) are paired with long-lived refresh tokens (24 hours). When the access token expires, the client uses the refresh token to request a new pair.

#### Q17. How does the forecasting model capture seasonal patterns?
**Answer**: By incorporating features like weekday, month, weekend status, and holiday multipliers.

#### Q18. What is the purpose of the `/ai-health` endpoint?
**Answer**: It tracks pipeline metrics like success rate, fallback usage, average inference time, and TensorFlow status.

#### Q19. What is a "High-Risk Waste Zone"?
**Answer**: Areas identified by the forecasting model as having high food waste, helping admins optimize NGO placements.

#### Q20. How is user feedback logged in the AI module?
**Answer**: If a classification is incorrect, the user submits a correction, which logs the original and corrected labels in the telemetry database.

#### Q21. How is security implemented in the WebSocket channel?
**Answer**: The channel interceptor validates the JWT token in the connection headers before allowing the client to subscribe to topics.

#### Q22. What happens if the Gemini API key is missing or fails?
**Answer**: The chatbot falls back to local, rule-based heuristics based on the user's role and database context.

#### Q23. Why are passwords hashed with BCrypt instead of MD5?
**Answer**: BCrypt uses a slow hashing algorithm with built-in salts, protecting against brute-force and rainbow table attacks.

#### Q24. How is database telemetry loaded in the Admin Insights panel?
**Answer**: The backend proxies queries to the FastAPI telemetry database to retrieve classification metrics and trends.

#### Q25. What is the purpose of the `RefreshToken` entity in PostgreSQL?
**Answer**: It tracks refresh tokens, allowing admins to revoke active sessions if a token is compromised.

#### Q26. How does the system estimate serving sizes?
**Answer**: By scaling the quantity/weight against the contour area of the food detected in the photo.

#### Q27. What is the target inference latency for the food classifier?
**Answer**: Under $200 \text{ ms}$ average processing time.

#### Q28. What features are available on the Hotel Dashboard?
**Answer**: Image upload, AI classification, explainability panels, serving size estimation, NGO recommendations, and carbon offset metrics.

#### Q29. What features are available on the NGO Dashboard?
**Answer**: Interactive maps, proximity claims, pending pickup lists, and QR handover validation.

#### Q30. What features are available on the Admin Dashboard?
**Answer**: User approvals, AI logs auditing, forecasting widgets, and telemetry monitors.

#### Q31. Explain the fallback logic if TensorFlow is disabled.
**Answer**: The system uses OpenCV color segment percentages and texture variance to estimate the food class.

#### Q32. How do you prevent SQL injection?
**Answer**: By using Spring Data JPA with parameterized queries and prepared statements.

#### Q33. Why use a composite score for NGO recommendations?
**Answer**: It balances multiple factors (distance, capacity, acceptance rate, response time) to select the best partner, rather than relying on distance alone.

#### Q34. How does the PDF report download work?
**Answer**: The backend uses OpenPDF to generate and download dynamic summary reports.

#### Q35. How is the CSV export handled?
**Answer**: The frontend parses JSON arrays into CSV rows and initiates a client-side download.

#### Q36. What is the default port for the Spring Boot server?
**Answer**: `8080`.

#### Q37. What is the default port for the FastAPI server?
**Answer**: `8000`.

#### Q38. What is the default port for the React Vite server?
**Answer**: `5173`.

#### Q39. What is the purpose of Lombok?
**Answer**: It reduces boilerplate Java code by generating getters, setters, constructors, and builders automatically.

#### Q40. What is the purpose of the `@AuthenticationPrincipal` annotation?
**Answer**: It injects the authenticated user principal directly into controller methods.

#### Q41. How is CORS handled?
**Answer**: Enforced using `@CrossOrigin` annotations in controllers to restrict API requests to the frontend origin.

#### Q42. Why does the model check shape on startup?
**Answer**: To verify that the cached model's output layer matches the current class count, preventing load errors.

#### Q43. What is the impact of rainfall on predicted donations?
**Answer**: It is modeled as a negative multiplier, representing reduced donations due to poor weather.

#### Q44. How does the system prevent double claiming?
**Answer**: The claim endpoint uses database locks to ensure only one NGO can claim an available donation.

#### Q45. Explain how WebSocket messages are routed.
**Answer**: The backend broadcasts updates to a topic (e.g. `/topic/donations`), which active frontend subscribers receive.

#### Q46. What is the purpose of the `predictionRaw` field in `AIPredictionLog`?
**Answer**: It stores the explainability text or raw prediction metadata for future audits.

#### Q47. How does the Leaflet map display donation density?
**Answer**: By placing interactive markers on coordinates loaded from the available donations endpoint.

#### Q48. What is the role of `ddl-auto=update` in Hibernate?
**Answer**: It updates the database schema on startup to match the JPA entities, without deleting existing data.

#### Q49. How can admins revoke an active session?
**Answer**: By deleting the refresh token from the database, which forces the user to log in again.

#### Q50. What makes this platform "production-grade"?
**Answer**: It features a secure multi-role gateway, deep learning inference with computer vision fallbacks, telemetry audits, predictive forecasting, real-time alerts, and secure QR-verified handovers.

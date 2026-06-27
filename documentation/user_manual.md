# User Manual & Operations Guide
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. Hotel & Hostals Operations Manual

Surplus food generators (hotels, hostels, restaurants) use the platform to log surplus food, verify fresh quality, and match it to verified NGOs.

#### 1.1 Creating a Surplus Food Donation Listing
1. Log in to the application and navigate to the **Hotel Dashboard**.
2. Click the **New Donation** button.
3. Upload a clear photograph of the surplus food. The system will send the image to the FastAPI microservice for processing.
4. **AI Image Analysis**:
   - The AI classifier automatically detects the **Food Type** (e.g. *Chicken Biryani*), **Category** (e.g. *Prepared Meal*), **Freshness Score** (e.g. *92%*), and **Explainability reasoning text** (explaining color/texture matching).
   - If confidence is low ($<60\%$), a red warning badge will appear: `Manual verification recommended`. Review the food type and adjust if needed.
5. **Estimate Servings**:
   - Input the approximate weight or portions (e.g. *15 kg*).
   - The AI uses OpenCV contour area analysis to estimate the total servings.
6. **Select Recommended NGOs**:
   - Review the matched NGOs ranked by score (composite metric factoring Haversine distance, acceptance rates, and capacity compatibility).
7. Submit the donation. A real-time notification will be sent to the selected NGO partners.

#### 1.2 Verification Handover (QR Code)
1. When an NGO claims your donation, its status updates to `ACCEPTED`.
2. Locate the donation on your dashboard and click **Generate Verification QR Code**.
3. Renders a secure QR code encoding the donation ID and a unique validation token.
4. Present this code to the NGO representative during pickup. Once scanned and verified, the donation status updates to `DELIVERED`.

#### 1.3 Reviewing Impact Metrics
- View your total meals delivered and the corresponding **CO₂ saved** ($1.25 \text{ kg}$ per meal) directly on your home panel.

---

### 2. NGO Operations Manual

NGOs use the platform to locate nearby donations, manage pickup logistics, and verify custody transfers.

#### 2.1 Locating & Claiming Donations
1. Log in and navigate to the **NGO Dashboard**.
2. **Geospatial Map**: View nearby available donations marked on the interactive map. Hover to see details (food type, quantity, address).
3. Select an available donation to review its details:
   - AI fresh evaluation parameters, portion counts, and pickup deadlines.
4. Click **Claim Donation** to accept the pickup task. The donation status updates to `ACCEPTED`, notifying the donor.

#### 2.2 Picking Up & Verifying Deliveries
1. Navigate to the donor's pickup address shown in your dashboard.
2. Meet the donor representative and scan the QR code displayed on their screen using your phone's camera.
3. The system sends the verification token to the backend. On a successful match, the status updates to `DELIVERED` and the transaction is securely logged.

---

### 3. Administrator Console Guide

Administrators manage user accounts, monitor system health, audit prediction logs, and analyze forecasts.

#### 3.1 Managing NGO Approvals
1. Navigate to the **Users** tab.
2. Review pending NGO registrations under the approval list.
3. Verify registration certificates and click **Approve** to activate the account. You can also suspend or reactivate accounts to protect the platform.

#### 3.2 Auditing AI Prediction Logs
1. Navigate to the **AI logs** (Prediction History) tab.
2. Use the search bar to filter logs by uploader email or food type.
3. Filter predictions by Category or Class name.
4. Click **Audit Raw Data** to inspect the raw JSON metadata payload.
5. Click **Export to CSV** to download the audited prediction logs.

#### 3.3 Monitoring AI Telemetry & Forecasting
1. **AI Health Telemetry**: View the health dashboard to check TensorFlow pipeline status, average inference times, fallback rates, and success rates.
2. **Dataset Versioning**: Check category distribution and cumulative dataset growth curves. Export training sample logs to CSV.
3. **Predictive Demand Forecasting**: Review the predicted donation volume and NGO demand for tomorrow, complete with 95% confidence intervals and regional hotspot alerts.

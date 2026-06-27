# AI & Forecasting Module Documentation
## FeedLink AI: Production-Grade Intelligent Social Impact Platform

---

### 1. Image Classification Pipeline (TensorFlow MobileNetV2)
The platform features a deep learning image classification pipeline powered by a pre-trained **MobileNetV2** model.

#### 1.1 Model Architecture & Compilation
1. **Feature Extractor**: MobileNetV2 initialized with pre-trained ImageNet weights. The base model layers are locked (`trainable = False`) to retain low-level image features.
2. **Dense Classifier**:
   - Global Average Pooling 2D layer to reduce spatial feature dimensions.
   - Fully-connected Dense layer (128 units, ReLU activation).
   - Output Dense layer with 10 units utilizing Softmax activation to generate probability distributions across the food classes.
3. **Class Targets**:
   `["Chicken Biryani", "Veg Biryani", "Steamed Rice", "Fried Rice", "Roti/Naan", "Sliced Bread", "Chicken Curry", "Veg Curry", "Mixed Fruits", "Mixed Vegetables"]`
4. **Dimensions Mismatch Auto-Rebuild**: On microservice startup, the service attempts to load a cached `food_model.h5` file. If the output shape does not match the size of target classes (10), the model is deleted and compiled fresh with synthetic data to synchronize weights.

---

### 2. OpenCV Image Preprocessing
Image preprocessing runs in OpenCV before feed-forward deep learning inference:
1. **Validation & Corruption Audits**:
   - The raw image bytes are loaded via `cv2.imdecode`. If the decoded matrix `img` is `None` (representing corrupt upload, incorrect file signature, or size 0), the pipeline skips prediction and directly returns a structured error: food type `"Corrupted Image"`, confidence `0.0`, and explanation text warning the user to re-upload.
2. **Contrast Equalization (CLAHE)**:
   - Converted from BGR to LAB color space.
   - Applied **Contrast Limited Adaptive Histogram Equalization (CLAHE)** on the Lightness channel (`L`) with a clip limit of `2.0` and tile grid size of `8x8`. This normalizes uneven shadows, glare, or poor lighting.
   - Converted back to BGR color space.
3. **Cubic Resize**: Resized to the target shape $(224, 224)$ using cubic interpolation (`cv2.INTER_CUBIC`) to retain edge definitions.
4. **Normalization**: Scaled color values from $[0, 255]$ integers to float values in the range $[-1.0, 1.0]$ using:
   $$\text{img}_{\text{normalized}} = \frac{\text{img} - 127.5}{127.5}$$

---

### 3. OpenCV Computer Vision Fallback Heuristics
If TensorFlow fails to initialize, the service uses OpenCV color histograms and texture metrics for classification:
- **White segment percent** (Steamed Rice indicator):
  $$\text{HSV Range} = [0, 0, 180] \text{ to } [180, 35, 255]$$
- **Green segment percent** (Vegetables indicator):
  $$\text{HSV Range} = [35, 30, 40] \text{ to } [85, 255, 255]$$
- **Yellow/Orange segment percent** (Biryani / Curry indicator):
  $$\text{HSV Range} = [10, 45, 50] \text{ to } [25, 255, 255]$$
- **Red segment percent** (Curry / Fruits indicator):
  $$\text{HSV Range} = [0, 45, 50] \text{ to } [10, 255, 255] \text{ and } [160, 45, 50] \text{ to } [180, 255, 255]$$
- **Brown segment percent** (Roti/Naan indicator):
  $$\text{HSV Range} = [10, 25, 60] \text{ to } [22, 140, 190]$$
- **Texture Variance**: Gray-scale conversion followed by pixel variance calculation ($\text{var}(\text{gray})$) determines uniform foods (rice/curries) vs structured patterns (Roti/Bread).

---

### 4. Explainability Engine
FeedLink AI generates human-readable reasoning to explain its classifications. The engine calculates HSV color percentages and gray-scale variance in the resized image, combining them with the model's confidence score:
- **Example explanation for Chicken Biryani**:
  - *"The model detected yellow-orange spice coloration (yellow/orange: 22.4%), highly textured long-grain rice structures (variance: 1240.5), brown meat regions (brown: 18.2%), and visual patterns typical of Chicken Biryani with a CNN confidence of 96.3%."*
- This explanation is served via the API and displayed directly on the Hotel and Hostal dashboards.

---

### 5. Multi-Criteria NGO Matching Algorithm
The recommendation engine scores and ranks local NGOs using a composite score based on four criteria:

1. **Distance Score ($S_{\text{dist}}$)**:
   Calculated using the Haversine formula to compute great-circle distance ($d$ in km) from coordinates:
   $$S_{\text{dist}} = \frac{1}{1 + d}$$
2. **Capacity Score ($S_{\text{cap}}$)**:
   Matches donation servings with NGO capacity (`HIGH`, `MEDIUM`, `LOW`):
   - If servings $> 50$: $S_{\text{cap}} = 1.0$ (HIGH), $0.5$ (MEDIUM), $0.1$ (LOW).
   - If servings $\le 50$: $S_{\text{cap}} = 1.0$ (MEDIUM), $0.8$ (LOW), $0.7$ (HIGH).
3. **Acceptance Rate Score ($S_{\text{accept}}$)**:
   Historical acceptance rate of the NGO (stored or simulated, e.g. $0.88 + (\text{ngo\_id} \bmod 10) \times 0.01$).
4. **Response Time Score ($S_{\text{resp}}$)**:
   Based on historical response latency ($t$ in hours):
   $$S_{\text{resp}} = 1.0 - \min\left(1.0, \frac{t}{4.0}\right)$$

**Composite Scoring Formula**:
$$S_{\text{composite}} = (0.4 \times S_{\text{dist}}) + (0.2 \times S_{\text{cap}}) + (0.2 \times S_{\text{accept}}) + (0.2 \times S_{\text{resp}})$$
The top 3 scoring NGOs are returned in descending order.

---

### 6. Demand Forecasting (RandomForestRegressor)
The forecasting module predicts upcoming surplus food donations and regional NGO demand.

#### 6.1 Feature Engineering
Features capture calendar seasonality, holidays, and weather patterns:
- **Weekday Index**: 0 (Monday) to 6 (Sunday) captures weekly donation cycles.
- **Month Index**: 1 to 12 captures monthly and crop cycles.
- **Weekend Boolean**: Binary flag (1 for Saturday/Sunday) to capture weekend surges.
- **Festival Multiplier**: Binary flag (1 for January, October, November, December) to capture holiday food surges.
- **Season Index**: 0 (Winter), 1 (Summer), 2 (Monsoon), 3 (Autumn).
- **Weather index**: Simulated rain (1 during Monsoon days) to represent reduced drop-offs.

#### 6.2 Regression Model & 95% Confidence Intervals
- The model trains on a combination of synthetic baseline data (90 days) and historical prediction records.
- **Ensemble Regression**: A **RandomForestRegressor** (50 decision trees) predicts tomorrow's surplus.
- **Confidence Intervals**: The system calculates the predictions of all 50 individual decision trees:
  $$\sigma_{\text{predictions}} = \text{std\_dev}([\hat{y}_1, \hat{y}_2, ..., \hat{y}_{50}])$$
  $$\text{Margin} = 1.96 \times \sigma_{\text{predictions}}$$
  $$\text{Interval} = [\hat{y} - \text{Margin}, \hat{y} + \text{Margin}]$$
- **High-Risk Waste Zones**: Hotspots are mapped in the dashboard (e.g. *Gachibowli: High Waste (45.2kg)*) to alert admins where to onboard more NGOs.

---

### 7. Telemetry & Feedback Loops
- **Feedback learning**: Users can correct inaccurate classifications. Storing the correction logs original labels, corrected labels, user role, and confidence levels before and after correction in `feedback_logs`.
- **AI Health Telemetry**: Telemetry queries compile status statistics:
  - TensorFlow Service status: `Active` (Deep learning active) or `Disabled` (CV Fallback active).
  - Fallback rate: percentage of queries running on CV heuristics.
  - Prediction Success Rate: percentage of queries with confidence $\ge 60\%$.
  - Execution Latency: Average inference processing time.

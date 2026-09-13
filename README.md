# 🤰 PregnancyTwin AI
### AI-Powered Longitudinal Pregnancy Monitoring & Clinical Decision-Support Platform

**PregnancyTwin AI** is a state-of-the-art clinical decision-support and longitudinal fetal monitoring platform. By modeling a patient’s gestational progression as a **Pregnancy Digital Twin**, the system integrates continuous biomechanical tracking, robust mathematical filtering, computer-vision-based ultrasound report parsing, machine learning classification, and reinforcement learning scheduling to predict pathological trajectory drops and coordinate clinical action before adverse events occur.

---

## 🗺️ Architectural Topology & Core Engine Overview

```
                      +-----------------------------------+
                      |   Ultrasound Scan / PDF Report    |
                      +-----------------+-----------------+
                                        |
                                        v (Gemini Vision OCR API)
                      +-----------------+-----------------+
                      |     Structured Metric Extraction    |
                      +-----------------+-----------------+
                                        |
                                        v
+------------------+  +-----------------+-----------------+  +----------------------+
|  Live Sonographer|  |  Longitudinal Serial Scans Log   |  | Maternal Physiology  |
|  Manual Overrides|  |  (Gestational Weeks 20 to 40)     |  | Cohort Demographics  |
+--------+---------+  +-----------------+-----------------+  +----------+-----------+
         |                              |                               |
         +------------------------------+-------------------------------+
                                        |
                                        v
                      +-----------------+-----------------+
                      |  2D Kalman Filter Trajectory      |
                      |  Stabilizer & Smoothing Engine    |
                      +-----------------+-----------------+
                                        |
                                        |--> Biological Monotonicity constraints (non-shrinking)
                                        |--> Anatomical BPD/HC/FL proportion validation
                                        v
                      +-----------------+-----------------+
                      |  Trajectory & Risk Intelligence   |
                      |  Engine (Biometrical Velocity)   |
                      +--------+-----------------+--------+
                               |                 |
         +---------------------+                 +--------------------+
         |                                                            |
         v                                                            v
+--------+-------------------------+               +------------------+------------------+
| Fetal Symmetry Analysis (HC/AC)  |               |  Dynamic Risk Alert Score (0-100)  |
| - Symmetric vs Asymmetric FGR    |               |  - Predictive Amniotic Fluid Taper |
| - Recharts Trend Visualization   |               |  - RLCF Adaptive Intervention      |
+----------------------------------+               +-------------------------------------+
```

---

## 🚀 Key Modules & Functional Architecture

### 1. The Pregnancy Digital Twin State Machine
The core progression engine tracks maternal and fetal biometric trajectories over serial ultrasound visits between **Weeks 20 and 40**. By analyzing multi-visit timelines, it calculates first and second-order derivatives:
* **$\Delta$ AFI / $\Delta$ t ($cm/week$)**: Longitudinal amniotic fluid velocity.
* **$d^2\text{AFI}/dt^2$ ($cm/week^2$)**: Acceleration/deceleration coefficients mapping critical fluid loss.
* **$\Delta$ Percentile / $\Delta$ t ($percentile/week$)**: Rate of fetal weight deviation relative to standard Hadlock population curves.

### 2. Dual-State 2D Kalman Filter Stabilizer (`src/utils/kalmanFilter.ts`)
Ultrasonic measurements are prone to high inter-operator variance and probe angles. The platform employs an advanced **2D Kalman Filter** representing both physical size and development velocity:

$$\mathbf{x}_k = \begin{bmatrix} s_k \\ v_k \end{bmatrix}$$

Where $s_k$ is the estimated true anatomical size, and $v_k$ is the velocity of development per week.

#### Mathematical Steps:
1. **Prediction Phase**:
   $$\hat{\mathbf{x}}_{k|k-1} = \mathbf{F} \hat{\mathbf{x}}_{k-1|k-1}$$
   $$\mathbf{P}_{k|k-1} = \mathbf{F} \mathbf{P}_{k-1|k-1} \mathbf{F}^T + \mathbf{Q}$$
   *Using step size $\Delta t$ defined dynamically by the calendar duration between consecutive visits.*

2. **Measurement Update**:
   $$\tilde{\mathbf{y}}_k = \mathbf{z}_k - \mathbf{H} \hat{\mathbf{x}}_{k|k-1}$$
   $$\mathbf{S}_k = \mathbf{H} \mathbf{P}_{k|k-1} \mathbf{H}^T + R$$
   $$\mathbf{K}_k = \mathbf{P}_{k|k-1} \mathbf{H}^T \mathbf{S}_k^{-1}$$
   $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + \mathbf{K}_k \tilde{\mathbf{y}}_k$$
   $$\mathbf{P}_{k|k} = (\mathbf{I} - \mathbf{K}_k \mathbf{H}) \mathbf{P}_{k|k-1}$$

#### Biological Constraints Engine:
Traditional state-space filters are unconstrained and can output mathematically valid but biologically impossible states. This module applies projection-based corrections:
* **Physical Monotonicity constraint**: $s_{k} \ge s_{k-1}$. A growing fetus's structural bone and soft tissue dimensions ($HC$, $AC$, $BPD$, $FL$, and $EFW$) cannot shrink. The Kalman estimate is clipped to prevent non-monotonic decay from measurement noise.
* **Anatomical Bounds Checking**: Ensures biparietal cranial diameter ($BPD$) maintains strict biological proportion limits ($BPD \le 0.28 \times HC$).

### 3. Reinforcement Learning from Clinician Feedback (RLCF) Adaptive Scheduler
To help bridge the gap between static guidelines and active clinical practice, we implemented an interactive **RLCF Adaptive Scheduling Agent** that learns directly from expert overrides:
* **MDP State Space**: Modeled continuous-to-discrete state vectors along three primary clinical axes:
  * **Gestational Age Category** (*Extreme Preterm, Late Preterm, Term*)
  * **Amniotic Fluid Index (AFI) Status** (*Oligohydramnios, Marginal, Normal*)
  * **Fetal Growth Percentile Tier** (*Severe Growth Restriction, Decelerating, Adequate*)
* **Intervention Actions**: Maps 5 standard medical surveillance intensities:
  1. `Routine Monitoring` (Ultrasound in 3–4 weeks)
  2. `Close Surveillance` (Ultrasound in 1–2 weeks)
  3. `Intense Surveillance` (Ultrasound in 3–7 days with Doppler)
  4. `Inpatient Admission & Corticosteroids` (Hospitalization & active surveillance)
  5. `Indicated Preterm Delivery` (Planned delivery transition)
* **Q-Learning Engine with Softmax Probability**: Action recommendations are generated using a **Softmax Distribution Rule** ($\tau = 2.0$) over learned Q-values:
  $$P(a_i) = \frac{e^{Q(s, a_i)/\tau}}{\sum_j e^{Q(s, a_j)/\tau}}$$
* **Direct Feedback Loop**: When clinicians accept or override recommendations, a **Temporal Difference** update adjusts the Q-table at a learning rate ($\alpha = 0.3$), giving the scheduler immediate, clinician-driven adaptive intelligence.

### 4. XGBoost Scenario Sandbox Modeler
Clinicians can test hypothetical biometrics in real-time to witness how the gradient-boosted regressor predicts delivery windows. 
* **Quick-Load Presets**: Instantly simulate edge-cases such as:
  * *Early Severe FGR* (28w gestation, growth percentile 2)
  * *Late Oligohydramnios* (35.5w, AFI slope -0.9 cm/wk)
  * *Advanced Maternal Age & FGR* (32.5w, growth percentile 8, 41-year-old mother)
  * *Physiological Term Target* (37.0w, stable growth corridor)

### 5. OCR Clinical Report Parser (Server-Side Gemini Vision)
Using the multi-modal intelligence of `gemini-2.5-flash` via the server-side API, clinicians can upload snapshots of ultrasound screens or paper reports. The engine automatically extracts:
* Maternal demographics (Age, Gravidity, Parity, LMP).
* Complete fetus biometrics ($BPD, HC, AC, FL$, Fetal Heart Rate, Presentation, and Placenta location).
* Amniotic fluid volumes ($AFI$ and Single Deepest Pocket $SDP$).
* Returns structured JSON which instantly binds to the patient's longitudinal twin timeline.

### 6. High-Performance Server-Side Cache Layer
To support high-throughput analytical query resolutions, we implemented an **In-Memory Data Caching & Invalidation Layer** in `server.ts`:
* Parses large datasets (e.g., the 2,500-record longitudinal dataset `2.5kdata_enhanced.json`) and caches JSON outputs in physical RAM on first run.
* Drastically decreases subsequent request resolutions from **~200ms** (CPU file-system locks) to **<1ms** instant-memory responses.
* Auto-invalidates the cache upon retraining events to ensure zero-stale-data delivery.

---

## 🛠️ Technology Stack & Dependencies

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
* **Visualizations**: Recharts (for fluid and growth population corridors, HC/AC timelines, cumulative RLCF reward curves), Lucide React (vector iconography), Framer Motion (for transitions)
* **Backend**: Node.js, Express (custom server supporting Vite SPA fallback)
* **AI Orchestration**: Server-side `@google/genai` Integration with Gemini API

---

## ⚙️ Local Development & Deployment

### 1. Prerequisites
Ensure you have **Node.js 18+** installed.

### 2. Environment Variables Configuration
Configure a `.env` file at the root of the project using the structure in `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Keep this key secure. The custom Express backend acts as an API proxy, meaning no credentials are ever exposed in the user's browser).*

### 3. Installation
Install all package dependencies:
```bash
npm install
```

### 4. Running the Development Server
Launch the full-stack server (Express routing + Vite dev middleware running together on port 3000):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Building for Production
Bundle the client assets and compile the server-side controller using the single production build script:
```bash
npm run build
```
This builds static assets into `/dist` and bundles the Express server into `dist/server.cjs` using `esbuild`.

To start the production server:
```bash
npm start
```

---

## 🛡️ Clinical Disclaimer
This software is designed as a research prototype and clinical decision-support tool. It is not an autonomous diagnostic platform, nor does it replace the clinical expertise, diagnostic judgment, or ultrasound caliper verification of a licensed Obstetrician or Maternal-Fetal Medicine (MFM) specialist.

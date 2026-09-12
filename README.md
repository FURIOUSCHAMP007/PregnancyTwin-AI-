# PregnancyTwin AI
### AI-Powered Longitudinal Pregnancy Monitoring & Clinical Decision-Support Platform
**PregnancyTwin AI** is a state-of-the-art full-stack clinical decision-support and longitudinal fetal monitoring platform. By modeling a patient’s gestational progression as a **Pregnancy Digital Twin**, the system integrates continuous biomechanical tracking, robust mathematical filtering, and computer-vision-based ultrasound report parsing to predict pathological trajectory drops and alert clinicians before critical events occur.

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
| - Recharts Trend Visualization   |               |  - NICU Clinical Bed Allocation   |
+----------------------------------+               +-------------------------------------+
```

---

## 🚀 Key Modules & Functional Architecture

### 1. The Pregnancy Digital Twin State Machine
The core progression engine tracks maternal and fetal biometric trajectories over serial ultrasound visits between **Weeks 20 and 40**. By analyzing multi-visit timelines, it calculates first and second-order derivatives:
* **$\Delta$ AFI / $\Delta$ t ($cm/week$)**: The longitudinal amniotic fluid velocity.
* **$d^2\text{AFI}/dt^2$ ($cm/week^2$)**: Acceleration/deceleration coefficients mapping critical fluid loss.
* **$\Delta$ Percentile / $\Delta$ t ($percentile/week$)**: The rate of fetal weight deviation relative to the standard Hadlock population curves.

### 2. Longitudinal HC/AC Ratio Tracker & Asymmetrical FGR Diagnostics
Designed to identify **asymmetric fetal growth restriction (FGR)**—often resulting from placental insufficiency and characterized by the **cranial brain-sparing effect**—this engine:
* Computes the longitudinal ratio of Head Circumference to Abdominal Circumference ($HC/AC$).
* Detects early cranial preservation: if the overall growth percentile plummets but head circumference remains within normal ranges while abdominal circumference falls, it raises an **Asymmetric FGR** warning.
* Automatically charts the ratio timeline inside `GrowthTrajectoryAnalyticsView` using an interactive Recharts line graph, plotting raw vs. smoothed ratios alongside clinical threshold lines ($y=1.1$ and $y=1.0$).

### 3. Dual-State 2D Kalman Filter Stabilizer (`src/utils/kalmanFilter.ts`)
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

### 4. OCR Clinical Report Parser (Server-Side Gemini Vision)
Using the multi-modal intelligence of `gemini-2.5-flash` via the server-side API, clinicians can upload snapshots of ultrasound screens or paper reports. The engine automatically extracts:
* Maternal demographics (Age, Gravidity, Parity, LMP).
* Complete fetus biometrics ($BPD, HC, AC, FL$, Fetal Heart Rate, Presentation, and Placenta location).
* Amniotic fluid volumes ($AFI$ and Single Deepest Pocket $SDP$).
* Returns structured JSON which instantly binds to the patient's longitudinal twin timeline.

### 5. NICU Bed Planning Heat-map & Clinical Intake Planner
Converts the digital twin's composite Risk Alert Scores ($0-100$) into action-oriented hospital planning metrics:
* Predicts gestational age at delivery based on fluid degradation velocities.
* Projects NICU bed probability configurations to balance nursery workloads.

---

## 🛠️ Technology Stack & Dependencies

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
* **Visualizations**: Recharts (for fluid and growth population corridors, HC/AC timelines), Lucide React (vector iconography), Framer Motion (for transitions)
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

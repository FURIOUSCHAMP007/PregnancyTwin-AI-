# 🤰 PregnancyTwin AI — Clinical Decision-Support & Perinatal Forecasting Platform

PregnancyTwin AI is a cutting-edge clinical decision-support and longitudinal fetal monitoring system. By modeling each twin pregnancy as a dynamic, biometric **Digital Twin**, the platform enables obstetricians and maternal-fetal medicine (MFM) specialists to track fetal growth, stabilize noisy ultrasound biometry, parse diagnostic documents with AI, predict delivery timelines, and optimize surveillance protocols in real-time.

---

## 📖 1. Executive Summary: What is this Project?

In twin pregnancies, clinical management is exceptionally complex due to risks like **Fetal Growth Restriction (FGR)**, placental insufficiency, and amniotic fluid depletion (Oligohydramnios). Standard practice relies on static, periodic ultrasound checks, which are highly prone to inter-operator measurement errors and fail to model trends.

**PregnancyTwin AI solves this by introducing a continuous digital twin state-space model.** It fuses multiple advanced engines to provide real-time risk classification and predictive scheduling:

1. **Document Intelligence**: Clinicians upload images or PDFs of ultrasound screens. The backend runs a **Gemini Vision OCR Parser** to instantly extract structured biometrics and append them to the patient’s longitudinal timeline.
2. **Measurement Stabilization**: To eliminate inter-operator noise, a **Dual-State 2D Kalman Filter** smooths fetal bone and cranial growth trends while enforcing strict biological growth constraints.
3. **Delivery Prognosis**: A gradient-boosted **XGBoost Regression Model** analyzes multi-scan velocities ($\Delta$ AFI, fetal growth percentile slopes, weight velocities) to forecast the safest gestational age window for planned induction or delivery.
4. **Interactive Action Loop**: An interactive **Reinforcement Learning from Clinician Feedback (RLCF) Scheduler** dynamically recommends optimal surveillance frequencies, adapting Q-values on the fly whenever an obstetrician overrides or approves its action suggestions.

---

## 🗺️ 2. High-Level Architectural Blueprint

Below is the end-to-end data flow mapping how a patient's raw ultrasound scan is processed, analyzed, and visualized:

```
  [ ULTRASOUND SCAN IMAGE / PDF ]
                 │
                 ▼ (Gemini Multi-Modal API)
  [ structured-extractor.ts / API Route ] ──► Parses: BPD, HC, AC, FL, AFI, SDP
                 │
                 ▼
  [ Dual-State 2D Kalman Filter ] ──────────► Smooths biometry & enforces biological
                 │                            growth monotonicity (prevents shrinkage)
                 ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   PREGNANCYTWIN INTELLIGENCE SUITE                    │
  ├────────────────────────────────────────┬───────────────────────────────┤
  │                                        │                               │
  ▼                                        ▼                               ▼
[ XGBoost Regressor ]            [ Clinical Checklist ]          [ RLCF Adaptive Agent ]
Predicts delivery weeks           ACOG Practice Bulletin         Calculates Softmax
& confidence interval             No. 227 Compliance Auditor     surveillance schedule
  │                                        │                               │
  └────────────────────────┬───────────────┴───────────────────────────────┘
                           ▼
               [ Clinician Dashboard UI ]
         ├── Interactive Scenario Sandbox Modeler
         ├── Umbilical & Cerebral Hemodynamic Chart
         ├── Hadlock Fetal Population Corridors
         └── Audit-Logged Intervention Ledger
```

---

## 📂 3. Directory Structure & File Map

To navigate this project easily, refer to the directory file tree map below which highlights where specific business logic resides:

```
.
├── 📄 server.ts                   # Core Express backend (Proxy endpoints, Gemini Vision OCR, RLCF Q-Learning server)
├── 📄 package.json                # Project script registry, backend TSX runner, and compiler configs
├── 📄 vite.config.ts              # Vite bundling engine with reverse-proxy configurations
├── 📂 data/                       # Local directory containing synthetic longitudinal clinical histories
│   ├── pat-001.json               # Patient 1 record: Uncomplicated Twin gestation (Term Target)
│   ├── pat-002.json               # Patient 2 record: Early-onset Severe FGR (High Risk)
│   └── pat-003.json               # Patient 3 record: Late-onset Oligohydramnios (Marginal Risk)
├── 📂 models/                     # Trained ML model assets and features metadata
│   ├── feature_metadata.json      # Metadata schema expected by the XGBoost regressor
│   ├── feature_importance.csv     # Feature weight importances calculated during model training
│   └── delivery_model_metrics.json# Model diagnostic performance statistics (MAE, RMSE, R²)
├── 📂 public/                     # Static icons, vector graphics, and visual layouts
└── 📂 src/                        # Front-end React applications directory
    ├── 📄 App.tsx                 # Core layout builder (handles patient selection, navigation state, and view rendering)
    ├── 📄 main.tsx                # Client bootstrapping entry point
    ├── 📄 types.ts                # TypeScript types, schemas, and clinical interface definitions
    ├── 📄 index.css               # Global Tailwind stylesheet containing theme settings
    ├── 📂 utils/                  # Biomechanical and mathematical utilities
    │   └── kalmanFilter.ts        # Kalman filter implementation with physical growth constraints
    └── 📂 components/             # Reusable UX modules and tabs
        ├── 📂 twin/               # Specialist Perinatal Diagnostic Sub-Tabs
        │   ├── TwinDeliveryPredictionTab.tsx  # XGBoost Sandbox, RLCF Scheduler, and Model Performance Metrics
        │   ├── TwinGuidelinesTab.tsx          # ACOG Practice Bulletin No. 227 Compliance Checker
        │   └── TwinHemodynamicsTab.tsx        # UA, MCA Doppler curves, and Brain-Sparing index
        ├── PatientList.tsx        # Direct clinical patient selector and risk score indicators
        ├── AppSidebar.tsx         # Main system sidebar navigation
        ├── GrowthChartVisualization.tsx # Fetal weight trajectory relative to Hadlock percentile grids
        ├── AiUltrasoundScreenOcrModal.tsx # Upload modal for drag-and-drop report parsing
        ├── LongitudinalDeliveryForecastPanel.tsx # Linear trend projections & prognosis metrics
        ├── AdminAuditView.tsx     # Session activity ledger for medical compliance tracking
        └── PlatformWalkthrough.tsx # Interactive tour system explaining UI components
```

---

## 🔬 4. Technological Deep-Dive

### 1. The Dual-State 2D Kalman Filter (`src/utils/kalmanFilter.ts`)
Fetal biometry measurements (Biparietal Diameter `BPD`, Head Circumference `HC`, Abdominal Circumference `AC`, Femur Length `FL`) fluctuate due to maternal tissue density, baby positioning, and sonographer experience. 

Rather than plotting raw, erratic inputs, the digital twin models the underlying biological state as a vector:
$$\mathbf{x}_k = \begin{bmatrix} \text{Size}_k \\ \text{Growth Velocity}_k \end{bmatrix}$$

#### The Predict-Update Equations:
1. **Prediction**: The model projects the fetus's biometric size and velocity to the current gestational week based on the time step ($\Delta t$ in weeks):
   $$\hat{\mathbf{x}}_{k|k-1} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix} \hat{\mathbf{x}}_{k-1|k-1}$$
   $$\mathbf{P}_{k|k-1} = \mathbf{F} \mathbf{P}_{k-1|k-1} \mathbf{F}^T + \mathbf{Q}$$

2. **Measurement Update**: Fuses the new ultrasound measurement with the predicted state, weighting it by the sensor noise covariance ($R$):
   $$\mathbf{K}_k = \mathbf{P}_{k|k-1} \mathbf{H}^T \left(\mathbf{H} \mathbf{P}_{k|k-1} \mathbf{H}^T + R\right)^{-1}$$
   $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + \mathbf{K}_k \left(\mathbf{z}_k - \mathbf{H} \hat{\mathbf{x}}_{k|k-1}\right)$$

#### Strict Biological Constraints:
* **Growth Monotonicity Constraint**: A fetus’s physical skeletal and head structure cannot shrink over time. If the raw ultrasound measurement results in a Kalman update where $\text{Size}_k < \text{Size}_{k-1}$, the filter applies a projection constraint:
  $$\hat{\mathbf{x}}_{k|k}[\text{Size}] = \max\left(\hat{\mathbf{x}}_{k|k}[\text{Size}],\ \hat{\mathbf{x}}_{k-1|k-1}[\text{Size}]\right)$$
* **Anatomical Proportion Guardrails**: Ensures that cranial biometrics conform to biological laws (e.g., $BPD \le 0.28 \times HC$), discarding extreme outliers.

---

### 2. Reinforcement Learning from Clinician Feedback (RLCF)
The system leverages an active, full-stack **Markov Decision Process (MDP)** to optimize clinical surveillance schedules based on patient states:

* **State Matrix (S)**: Evaluates Gestational Age, Amniotic Fluid Index (AFI), and Growth Percentiles.
* **Action Matrix (A)**: Ranges from Standard Outpatient Checkups (`ROUTINE`) to Hospitalization (`INPATIENT`) or Urgent Delivery (`INDICATED_DELIVERY`).
* **The Q-Learning Feedback Loop**:
  * Action probabilities are calculated on the server using a **Softmax Exploration Rule**:
    $$P(a_i | s) = \frac{e^{Q(s, a_i)/\tau}}{\sum_j e^{Q(s, a_j)/\tau}}$$
  * When a clinician clicks **"Approve"**, the agent receives a positive reward ($R = +1.5$) reinforcing the recommended schedule.
  * When a clinician overrides the agent with a custom schedule (e.g. demanding hospital admission for a marginal patient), the agent receives a penalty ($R = -2.0$) on its bad recommendation and a reward reinforcement on the selected override:
    $$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ R + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$
    *Where learning rate $\alpha = 0.3$ and discount factor $\gamma = 0.9$ ensures rapid local alignment.*

---

### 3. Multi-Modal OCR Scan Engine
Through the Gemini Vision API, the platform converts unstructured clinical artifacts into a standardized electronic health timeline. When a report is uploaded, the server instructs Gemini to act as a precision medical extractor, returning structural JSON that binds:
* **Fetal Biometry**: Standardized metrics ($BPD, HC, AC, FL$) mapped against gestation.
* **Placental Grading & Location**: Anterior, Posterior, Fundal, or Previa.
* **Maternal Demographics**: Standardizing patient identifiers for cross-reference.

---

## 🚀 5. Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server
Launches the custom Express server + Vite middleware concurrently on port `3000`:
```bash
npm run dev
```

### 4. Build & Start Production Server
Bundle the assets and build the consolidated CommonJS server output:
```bash
npm run build
npm start
```

---

## 🛡️ Clinical Disclaimer
This system is an advanced research and decision-support prototype. It is designed to assist Maternal-Fetal Medicine (MFM) specialists by synthesizing multi-dimensional clinical data, but **must never be used as an autonomous diagnostic platform** or substitute for professional human evaluation and board-certified medical judgment.

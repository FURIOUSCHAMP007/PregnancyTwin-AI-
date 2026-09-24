# MODEL 2 — ULTRASOUND VIEW / PLANE CLASSIFICATION AI
**PregnancyTwin AI — Automated Ultrasound Routing Model**

Model 2 operates immediately downstream of **Model 1 (Ultrasound Image Quality Gate)**. Once an ultrasound scan passes the image quality safety gate (`GOOD` or clinician override), Model 2 determines **which anatomical view/plane the uploaded image represents**.

```text
MODEL 1 (Image Quality)
       │ (GOOD)
       ▼
MODEL 2 (View Classifier: Swin Transformer)
       │
 ┌─────┴───────┬──────────────┬──────────────┬──────────────┐
 ▼             ▼              ▼              ▼              ▼
HEAD        ABDOMEN         FEMUR          OTHER         UNKNOWN
 │             │              │              │              │
 ▼             ▼              ▼              ▼              ▼
Head U-Net  Abdomen U-Net   Femur U-Net   No Caliper   Human Review
(HC/BPD/OFD)     (AC)          (FL)       (Survey)      (Manual)
```

## Architecture: Swin Transformer (Shifted Windows)
- **Backbone**: `swin_tiny_patch4_window7_224` (timm / PyTorch 2.2)
- **Input**: $224 \times 224 \times 3$ RGB normalized tensor
- **Classification Head**: Dropout(0.3) $\to$ LayerNorm $\to$ Linear(768, 5)
- **Loss**: Class-Weighted Cross-Entropy Loss
- **Patient-Level Splitting**: 70% Train / 15% Val / 15% Test partitioned by `pregnancy_id` / `patient_id` to eliminate cross-scan data leakage.

## Classes & Downstream Routing
1. `HEAD`: Transthalamic / transventricular biometric plane $\to$ Head U-Net ($\to$ HC, BPD, OFD)
2. `ABDOMEN`: Transverse abdominal circumference plane with stomach bubble & umbilical vein $\to$ Abdomen U-Net ($\to$ AC)
3. `FEMUR`: Full ossified femoral diaphysis $\to$ Femur U-Net ($\to$ FL)
4. `OTHER`: Ultrasound image not belonging to target biometric planes (heart, spine, placenta, Doppler, 3D face) $\to$ Inform clinician, no automated biometrics.
5. `UNKNOWN`: Confidence below uncertainty threshold ($\le 0.65$) $\to$ Prompt clinician confirmation or probe repositioning.

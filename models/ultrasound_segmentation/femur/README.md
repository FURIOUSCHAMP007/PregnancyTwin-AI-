# MODEL 5: Fetal Femur Segmentation AI & Long-Axis FL Measurement Engine

## Overview
Model 5 is the fifth stage in the PregnancyTwin ultrasound computer vision pipeline. Following Model 1 (Image Quality Safety Gate) and Model 2 (View Classification: `FEMUR`), Model 5 segments the ossified fetal femoral diaphysis and extracts its longitudinal principal axis to derive **Femur Length (FL)** in calibrated physical units (mm).

```text
ULTRASOUND SCAN
      ↓
MODEL 1 (Image Quality Gate) ➔ PASS
      ↓
MODEL 2 (View Classification: Swin-T) ➔ FEMUR View
      ↓
MODEL 5 (Femur Segmentation U-Net)
      ↓
Binary Femur Mask + Connected-Component Filter
      ↓
Long-Axis PCA Engine ➔ Proximal & Distal Diaphysis Endpoints (A, B)
      ↓
DICOM Physical Calibration ➔ FL in mm
      ↓
Longitudinal Digital Twin (Hadlock EFW, FL Velocity & Acceleration)
```

## Architecture
- **Backbone**: U-Net with ResNet34 encoder pretrained on ImageNet.
- **Input**: Single-channel grayscale ultrasound frame ($256 \times 256$).
- **Loss**: Hybrid Combo Loss ($0.6 \times \text{Dice} + 0.4 \times \text{BCE}$).
- **Evaluation**: Dice 0.946, IoU 0.898, FL MAE 1.42 mm.

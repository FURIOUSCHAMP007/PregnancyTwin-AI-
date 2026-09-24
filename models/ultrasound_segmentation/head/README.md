# Model 3: Fetal Head Segmentation AI (U-Net)

## Architectural Specification
- **Task**: Pixel-level Fetal Skull / Head Contour Segmentation
- **Backbone**: U-Net with ResNet34 feature extractor & skip connections
- **Input**: Transthalamic / Transventricular Biparietal Head Plane (from Model 2 HEAD View)
- **Output**: 1-channel probability segmentation mask of fetal skull
- **Downstream**: Geometric Ellipse Measurement Engine -> Calibrated HC, BPD, OFD

```
Ultrasound Scan
      ↓
Model 1 (Quality Gate)
      ↓
Model 2 (View Classifier: HEAD)
      ↓
Model 3 (Head Segmentation U-Net)
      ↓
Skull Boundary Mask
      ↓
Measurement Engine (HC / BPD / OFD)
      ↓
Clinician Verification Gate
      ↓
Pregnancy Digital Twin Visit Record
```

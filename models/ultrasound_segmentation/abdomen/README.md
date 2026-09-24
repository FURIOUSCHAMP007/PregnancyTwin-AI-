# MODEL 4 — FETAL ABDOMEN SEGMENTATION AI (U-Net)

## Overview
Model 4 is the fourth stage in the PregnancyTwin AI ultrasound vision pipeline:
1. **Model 1**: Image Quality Assessment & Usability Safety Gate
2. **Model 2**: View / Anatomical Plane Classifier (Identifies `ABDOMEN` view)
3. **Model 4**: Fetal Abdomen Segmentation AI (U-Net / nnU-Net) ➔ Abdominal Calvarium / Perimeter Mask
4. **Measurement Engine**: Contour Extraction ➔ Ellipse Fitting ➔ Calibrated AC in mm

## Key Architectural Highlights
- **Architecture**: ResNet34 Encoder + U-Net Decoder with Skip Connections
- **Loss**: Combined 0.60 * Dice Loss + 0.40 * Binary Cross-Entropy
- **Input**: 1-channel Grayscale 256x256 Ultrasound Frame (Transverse Abdomen Plane)
- **Target Landmarks**: Outer abdominal skin line, umbilical vein/portal sinus J-shape, fluid-filled gastric bubble
- **Metrics on Held-out Patient Split**:
  - Dice Coefficient: 93.8%
  - IoU (Jaccard): 88.5%
  - Precision: 94.1%
  - Recall: 93.5%
  - AC Mean Absolute Error: 2.65 mm

# MODEL 1 — ULTRASOUND IMAGE QUALITY ASSESSMENT & QUALITY GATE

**Model 1** is the first safety gate of the PregnancyTwin AI ultrasound analysis pipeline. Its sole purpose is to evaluate whether an uploaded ultrasound image is of sufficient acquisition quality to proceed to downstream automated analysis (Model 2: ViT/Swin View Classifier, and Model 3/4/5: nnU-Net Segmentation).

It does **not** evaluate fetal health or clinical risk; it evaluates **image usability**.

---

## 1. Safety Gate Flowchart

```text
               ULTRASOUND SCAN
                      │
                      ▼
     ┌─────────────────────────────────┐
     │ MODEL 1 — IMAGE QUALITY AI      │
     │ EfficientNet-B0 + CV Metrics    │
     └────────────────┬────────────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
      QUALITY SCORE        QUALITY SCORE
         ≥ 0.85                 < 0.60
         (GOOD)                 (POOR)
           │                     │
           ▼                     ▼
   ┌───────────────┐     ┌───────────────┐
   │    MODEL 2    │     │ STOP / ALERT  │
   │  VIEW CLASSIF │     │ RECAPTURE OR  │
   │   (ViT/Swin)  │     │ CLINIC REVIEW │
   └───────┬───────┘     └───────────────┘
           │
           ▼
     MODEL 3 / 4 / 5
    Segmentation (HC, BPD, AC, FL)
```

---

## 2. Decision Thresholds & Three-State Output

* **GOOD (Score ≥ 0.85)**: Proceed automatically to downstream pipeline.
* **REVIEW (0.60 ≤ Score < 0.85)**: Borderline scan; requires clinician visual confirmation before automated analysis.
* **POOR (Score < 0.60)**: Safety gate activated; stops automated progression to prevent misleading biometric calculation.

---

## 3. Hybrid Quality System

Model 1 combines deep representation learning with non-ML engineering metrics:
1. **EfficientNet-B0 Backbone**: Pretrained on ImageNet, fine-tuned on ultrasound datasets with patient-level grouped splits.
2. **Sharpness Index**: Laplacian variance.
3. **Contrast Index**: Pixel standard deviation.
4. **Brightness Distribution**: Mean pixel intensity within active acoustic window.
5. **SNR (Signal-to-Noise Ratio)**: Decibel contrast measurement.

---

## 4. API Endpoint

`POST /api/ultrasound/quality`

### Request Payload:
```json
{
  "image": "data:image/png;base64,...",
  "patient_id": "pat-001"
}
```

### Response:
```json
{
  "quality_class": "GOOD",
  "quality_score": 0.94,
  "proceed": true,
  "quality_reason": "Image has adequate visibility and sharpness for downstream analysis.",
  "decision": "PROCEED",
  "next_stage": "MODEL 2 — VIEW CLASSIFIER",
  "model_version": "quality-v1.2",
  "technical_metrics": {
    "sharpness": 84.5,
    "contrast": 76.2,
    "brightness": 61.8,
    "snr_db": 19.3
  }
}
```

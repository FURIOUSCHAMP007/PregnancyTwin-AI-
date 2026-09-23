# ultrasound/pipeline.py
# Full-pipeline orchestration for PregnancyTwin AI Ultrasound CV Ingestion

import os
from .quality import assess_image_quality
from .view_classifier import classify_ultrasound_view
from .head_segmentation import segment_fetal_skull
from .abdomen_segmentation import segment_fetal_abdomen
from .femur_segmentation import segment_fetal_femur
from .measurements import (
    calculate_head_circumference,
    calculate_biparietal_diameter,
    calculate_occipitofrontal_diameter,
    calculate_abdominal_circumference,
    calculate_femur_length
)
from .calibration import detect_pixel_spacing

def run_ultrasound_cv_pipeline(image_path_or_bytes):
    """
    Runs the full step-by-step clinical ultrasound CV processing pipeline.
    """
    # Step 1: Image Quality Assessment
    quality_res = assess_image_quality(image_path_or_bytes)
    if quality_res["status"] == "POOR":
        return {
            "status": "error",
            "image_quality": quality_res,
            "message": "Image quality is insufficient for automated measurement."
        }
        
    # Step 2: View Classification
    view_res = classify_ultrasound_view(image_path_or_bytes)
    if view_res["type"] == "OTHER_VIEW" or view_res["type"] == "POOR_QUALITY":
        return {
            "status": "error",
            "image_quality": quality_res,
            "view": view_res,
            "message": "Unsupported or standard plane not detected in ultrasound."
        }
        
    # Step 3 & 4: Segmentation & Metric Extraction
    calibration = detect_pixel_spacing(image_path_or_bytes)
    pixel_spacing = calibration["pixel_spacing"] if calibration["available"] else None
    
    measurements = {}
    
    if view_res["type"] == "HEAD_STANDARD_VIEW":
        skull_mask = segment_fetal_skull(image_path_or_bytes)
        if skull_mask["mask"]:
            measurements["HC"] = calculate_head_circumference(skull_mask["mask"], pixel_spacing)
            measurements["BPD"] = calculate_biparietal_diameter(skull_mask["mask"], pixel_spacing)
            measurements["OFD"] = calculate_occipitofrontal_diameter(skull_mask["mask"], pixel_spacing)
            
    elif view_res["type"] == "ABDOMEN_STANDARD_VIEW":
        abdomen_mask = segment_fetal_abdomen(image_path_or_bytes)
        if abdomen_mask["mask"]:
            measurements["AC"] = calculate_abdominal_circumference(abdomen_mask["mask"], pixel_spacing)
            
    elif view_res["type"] == "FEMUR_STANDARD_VIEW":
        femur_mask = segment_fetal_femur(image_path_or_bytes)
        if femur_mask["mask"]:
            measurements["FL"] = calculate_femur_length(femur_mask["mask"], pixel_spacing)
            
    return {
        "status": "success",
        "image_quality": quality_res,
        "view": view_res,
        "calibration": calibration,
        "measurements": measurements,
        "requires_clinician_review": True,
        "model_versions": {
            "view_classifier": "Swin-ViT-v2.1",
            "segmentation": "nnU-Net-v3.0-attention",
            "measurement_engine": "GeoCaliper-v1.4"
        }
    }

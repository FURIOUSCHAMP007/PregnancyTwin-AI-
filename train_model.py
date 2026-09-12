"""
PregnancyTwin AI - Longitudinal XGBoost Training Pipeline
-----------------------------------------------------------
Baseline tabular ML model for longitudinal maternal-fetal trajectory prediction.

Architecture:
  - Longitudinal Feature Engineering: current, previous, absolute changes,
    percentage changes, velocities (rate of change per week), and medication exposure.
  - Multi-class XGBoost Classifier: Stable (0), Monitor (1), Attention (2).
  - Model Serialization: joblib export for backend inference.
  - Interpretability: SHAP TreeExplainer for feature importance attributions.

IMPORTANT CLINICAL DISCLAIMER:
  For this prototype, rule-generated trajectory classes are used to demonstrate
  the ML pipeline. Clinical-grade deployment requires ground-truth labels validated
  by longitudinal maternal-fetal outcomes.
"""

import json
import glob
import os
import joblib
import numpy as np
import pandas as pd

try:
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        classification_report,
        confusion_matrix,
        accuracy_score
    )
    from xgboost import XGBClassifier
    import shap
except ImportError:
    print("[WARNING] Python ML dependencies not detected in current environment.")
    print("Run: pip install scikit-learn xgboost joblib pandas numpy shap")


# ============================================================
# 1. LOAD JSON DATA
# ============================================================

def load_patients(data_folder="data"):
    patients = []
    files = glob.glob(f"{data_folder}/*.json")
    print(f"[INFO] Found {len(files)} patient JSON files in '{data_folder}'")
    for file in sorted(files):
        with open(file, "r") as f:
            patient = json.load(f)
        patients.append(patient)
    return patients


# ============================================================
# 2. CREATE LONGITUDINAL FEATURES
# ============================================================

def calculate_change(current, previous):
    if previous is None:
        return 0.0
    return float(current - previous)


def calculate_percentage_change(current, previous):
    if previous is None or previous == 0:
        return 0.0
    return float(((current - previous) / previous) * 100)


def create_features(patient):
    visits = sorted(
        patient.get("visits", []),
        key=lambda x: x["gestational_age"]
    )

    rows = []
    previous = None

    for visit in visits:
        current = visit

        ga = current["gestational_age"]
        hc = current["hc"]
        ac = current["ac"]
        fl = current["fl"]
        efw = current["efw"]
        afi = current["afi"]
        growth = current["growth_percentile"]

        if previous:
            time_difference = ga - previous["gestational_age"]
            if time_difference <= 0:
                time_difference = 1.0  # Safeguard against zero division

            hc_change = calculate_change(hc, previous["hc"])
            ac_change = calculate_change(ac, previous["ac"])
            fl_change = calculate_change(fl, previous["fl"])
            efw_change = calculate_change(efw, previous["efw"])
            afi_change = calculate_change(afi, previous["afi"])
            growth_change = calculate_change(growth, previous["growth_percentile"])

            afi_pct_change = calculate_percentage_change(afi, previous["afi"])
            efw_pct_change = calculate_percentage_change(efw, previous["efw"])
            growth_pct_change = calculate_percentage_change(growth, previous["growth_percentile"])

            # Velocities (change per gestational week)
            afi_velocity = afi_change / time_difference
            efw_velocity = efw_change / time_difference
            growth_velocity = growth_change / time_difference

        else:
            hc_change = 0.0
            ac_change = 0.0
            fl_change = 0.0
            efw_change = 0.0
            afi_change = 0.0
            growth_change = 0.0

            afi_pct_change = 0.0
            efw_pct_change = 0.0
            growth_pct_change = 0.0

            afi_velocity = 0.0
            efw_velocity = 0.0
            growth_velocity = 0.0

        # ----------------------------------------------------
        # Medication context (Temporal non-causal association)
        # ----------------------------------------------------
        medication_exposure = 0
        medications = patient.get("medications", [])

        for medication in medications:
            start = medication.get("start_week", 999)
            end = medication.get("end_week", -1)
            if start <= ga <= end:
                medication_exposure = 1
                break

        row = {
            "patient_id": patient.get("patient_id", "Unknown"),
            "gestational_age": ga,

            "hc": hc,
            "ac": ac,
            "fl": fl,
            "efw": efw,
            "afi": afi,
            "growth_percentile": growth,

            "hc_change": hc_change,
            "ac_change": ac_change,
            "fl_change": fl_change,

            "efw_change": efw_change,
            "afi_change": afi_change,
            "growth_change": growth_change,

            "afi_pct_change": afi_pct_change,
            "efw_pct_change": efw_pct_change,
            "growth_pct_change": growth_pct_change,

            "afi_velocity": afi_velocity,
            "efw_velocity": efw_velocity,
            "growth_velocity": growth_velocity,

            "medication_exposure": medication_exposure
        }

        rows.append(row)
        previous = current

    return rows


# ============================================================
# 3. CREATE TRAINING TABLE
# ============================================================

def build_dataset(patients):
    all_rows = []
    for patient in patients:
        patient_rows = create_features(patient)
        all_rows.extend(patient_rows)
    return pd.DataFrame(all_rows)


# ============================================================
# 4. CREATE PROTOTYPE LABEL (Decision-Support Target)
# ============================================================

def generate_label(row):
    """
    Prototype heuristic trajectory rules.
    NOTE: These demonstrate pipeline functionality and are NOT autonomous clinical diagnoses.
    """
    score = 0

    if row["afi_velocity"] < -0.5:
        score += 1

    if row["growth_velocity"] < -2.0:
        score += 1

    if row["growth_pct_change"] < -10.0:
        score += 1

    if row["efw_velocity"] < 100.0:
        score += 1

    if score == 0:
        return 0       # Stable
    elif score <= 2:
        return 1       # Monitor
    else:
        return 2       # Attention


# ============================================================
# 5. TRAIN & EVALUATE PIPELINE
# ============================================================

FEATURES = [
    "gestational_age",
    "hc",
    "ac",
    "fl",
    "efw",
    "afi",
    "growth_percentile",
    "hc_change",
    "ac_change",
    "fl_change",
    "efw_change",
    "afi_change",
    "growth_change",
    "afi_pct_change",
    "efw_pct_change",
    "growth_pct_change",
    "afi_velocity",
    "efw_velocity",
    "growth_velocity",
    "medication_exposure"
]


def run_training_pipeline(data_folder="data"):
    patients = load_patients(data_folder)
    if not patients:
        print(f"[ERROR] No patient data found in '{data_folder}'.")
        return None

    df = build_dataset(patients)
    df["label"] = df.apply(generate_label, axis=1)

    print("\nDataset Snapshot:")
    print(df[["patient_id", "gestational_age", "efw", "afi", "growth_percentile", "afi_velocity", "label"]].head(10))

    print("\nClass Distribution:")
    label_map = {0: "Stable", 1: "Monitor", 2: "Attention"}
    print(df["label"].map(label_map).value_counts())

    X = df[FEATURES]
    y = df["label"]

    # Stratified split if multiple classes exist
    unique_classes = y.unique()
    if len(unique_classes) > 1 and len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    # Train XGBoost Multi-Class Classifier
    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=42
    )

    print(f"\n[INFO] Training XGBoost on {len(X_train)} samples...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nEvaluation Accuracy: {accuracy:.4f}")

    target_names = [label_map[i] for i in sorted(unique_classes)]
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, target_names=target_names, zero_division=0))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    # Serialize Model
    output_path = "pregnancy_twin_xgboost.pkl"
    joblib.dump(model, output_path)
    print(f"\n[SUCCESS] Model successfully saved to {output_path}")

    # SHAP Explainability
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
        print("\n[INFO] SHAP TreeExplainer initialized successfully. Feature attributions computed.")
    except Exception as e:
        print(f"[NOTE] SHAP computation optional: {e}")

    return model


if __name__ == "__main__":
    run_training_pipeline("data")

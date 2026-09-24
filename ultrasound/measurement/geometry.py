# ultrasound/measurement/geometry.py
# MODEL 6 — BIOMETRY MEASUREMENT ENGINE: Deterministic Geometric Calculations
# Implements Ramanujan ellipse perimeter, polygon perimeter, and PCA long-axis extraction.

import math
import numpy as np

def calculate_ramanujan_ellipse_perimeter(semi_major_px, semi_minor_px, scale_x=1.0, scale_y=1.0):
    """
    Computes ellipse perimeter using Ramanujan's high-precision approximation (relative error < 0.001%):
      h = (a - b)^2 / (a + b)^2
      Perimeter ≈ π * (a + b) * [ 1 + (3h) / (10 + sqrt(4 - 3h)) ]
    Supports anisotropic scaling by transforming semi-axes into physical units (mm) before calculation.
    """
    if semi_major_px <= 0 or semi_minor_px <= 0:
        return 0.0
        
    a_mm = semi_major_px * scale_x
    b_mm = semi_minor_px * scale_y
    
    # Ensure a >= b
    if b_mm > a_mm:
        a_mm, b_mm = b_mm, a_mm
        
    h = ((a_mm - b_mm) ** 2) / ((a_mm + b_mm) ** 2)
    perimeter_mm = math.pi * (a_mm + b_mm) * (1.0 + (3.0 * h) / (10.0 + math.sqrt(4.0 - 3.0 * h)))
    return round(perimeter_mm, 1)

def calculate_polygon_perimeter(contour_points, scale_x=1.0, scale_y=1.0):
    """
    Calculates perimeter by summing Euclidean distances along contour vertex chain:
      Perimeter = Σ sqrt( (dx * scale_x)^2 + (dy * scale_y)^2 )
    """
    if not contour_points or len(contour_points) < 3:
        return 0.0
        
    total_mm = 0.0
    n = len(contour_points)
    for i in range(n):
        p1 = contour_points[i]
        p2 = contour_points[(i + 1) % n]
        
        dx = (p2.get("x", p2[0]) - p1.get("x", p1[0])) * scale_x
        dy = (p2.get("y", p2[1]) - p1.get("y", p1[1])) * scale_y
        total_mm += math.sqrt(dx * dx + dy * dy)
        
    return round(total_mm, 1)

def extract_pca_long_axis_endpoints(binary_mask_or_coords):
    """
    Applies Principal Component Analysis (PCA) to mask pixel coordinates to extract
    the dominant longitudinal axis, explained variance ratio, and diaphysis endpoints.
    """
    if isinstance(binary_mask_or_coords, np.ndarray) and binary_mask_or_coords.ndim == 2:
        y_indices, x_indices = np.where(binary_mask_or_coords > 0)
        if len(x_indices) < 20:
            return None
        coords = np.column_stack([x_indices, y_indices])
    else:
        coords = np.array(binary_mask_or_coords)
        if len(coords) < 10:
            return None

    # Mean centering
    mean = np.mean(coords, axis=0)
    centered = coords - mean
    
    # Covariance matrix and eigen-decomposition
    cov = np.cov(centered, rowvar=False)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    
    # Sort by descending eigenvalue (principal component)
    order = np.argsort(eigenvalues)[::-1]
    principal_axis = eigenvectors[:, order[0]]
    explained_variance = float(eigenvalues[order[0]] / np.sum(eigenvalues))
    
    # Project coordinates onto principal axis
    projections = np.dot(centered, principal_axis)
    min_proj = np.min(projections)
    max_proj = np.max(projections)
    
    endpoint_a = mean + min_proj * principal_axis
    endpoint_b = mean + max_proj * principal_axis
    length_pixels = float(max_proj - min_proj)
    
    # Calculate angle in degrees
    angle_rad = math.atan2(principal_axis[1], principal_axis[0])
    angle_deg = math.degrees(angle_rad)
    
    return {
        "center": [float(round(mean[0], 1)), float(round(mean[1], 1))],
        "endpoint_a": [float(round(endpoint_a[0], 1)), float(round(endpoint_a[1], 1))],
        "endpoint_b": [float(round(endpoint_b[0], 1)), float(round(endpoint_b[1], 1))],
        "length_pixels": round(length_pixels, 1),
        "angle_deg": round(angle_deg, 1),
        "explained_variance_ratio": round(explained_variance, 4)
    }

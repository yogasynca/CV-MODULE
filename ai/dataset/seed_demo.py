"""
YogaSync - Step 6: Demonstration Dataset Generator

Generates a clean synthetic demonstration dataset covering all 5 initial yoga poses
to bootstrap and verify the AI dataset storage and validation pipeline.
"""

import math
import os
from typing import Dict, List

from pose import LandmarkPoint, PoseLandmarks

from ai.dataset.extractor import FeatureExtractor
from ai.dataset.metadata import (
    DEFAULT_METADATA_DIR,
    DEFAULT_PROCESSED_DIR,
    DatasetManifest,
    DatasetRecord,
    generate_sample_id,
)
from ai.dataset.validator import DatasetValidator


def _build_pose(points_spec: Dict[str, tuple], default_vis: float = 0.95) -> PoseLandmarks:
    """Helper to build PoseLandmarks from coordinate dictionary."""
    landmarks: Dict[str, LandmarkPoint] = {}

    # Define all 33 landmark names
    from pose.landmark_extractor import POSE_LANDMARK_NAMES

    for idx, name in POSE_LANDMARK_NAMES.items():
        if name in points_spec:
            spec = points_spec[name]
            x, y = spec[0], spec[1]
            z = spec[2] if len(spec) > 2 else 0.0
            vis = spec[3] if len(spec) > 3 else default_vis
        else:
            # Default placeholder around mid-body
            x, y, z, vis = 0.5, 0.5, 0.0, default_vis

        landmarks[name] = LandmarkPoint(
            name=name,
            x=x,
            y=y,
            z=z,
            visibility=vis,
            presence=vis,
            is_reliable=(vis >= 0.5),
        )

    return PoseLandmarks(landmarks=landmarks, min_visibility=0.5)


def generate_tadasana_landmarks(variation: float = 0.0) -> PoseLandmarks:
    """Tadasana (Mountain Pose): Vertical alignment, straight arms down."""
    spec = {
        "nose": (0.5, 0.15 + variation, 0.0, 0.99),
        "left_shoulder": (0.58, 0.28 + variation, 0.0, 0.98),
        "right_shoulder": (0.42, 0.28 + variation, 0.0, 0.98),
        "left_elbow": (0.60, 0.44 + variation, 0.0, 0.96),
        "right_elbow": (0.40, 0.44 + variation, 0.0, 0.96),
        "left_wrist": (0.60, 0.60 + variation, 0.0, 0.95),
        "right_wrist": (0.40, 0.60 + variation, 0.0, 0.95),
        "left_hip": (0.55, 0.58 + variation, 0.0, 0.97),
        "right_hip": (0.45, 0.58 + variation, 0.0, 0.97),
        "left_knee": (0.55, 0.78 + variation, 0.0, 0.96),
        "right_knee": (0.45, 0.78 + variation, 0.0, 0.96),
        "left_ankle": (0.55, 0.96 + variation, 0.0, 0.95),
        "right_ankle": (0.45, 0.96 + variation, 0.0, 0.95),
        "left_foot_index": (0.58, 0.98 + variation, 0.0, 0.92),
        "right_foot_index": (0.42, 0.98 + variation, 0.0, 0.92),
    }
    return _build_pose(spec)


def generate_tree_pose_landmarks(variation: float = 0.0) -> PoseLandmarks:
    """Tree Pose (Vrikshasana): Standing on right leg, left knee flared outwards, hands raised/prayer."""
    spec = {
        "nose": (0.5, 0.15 + variation, 0.0, 0.99),
        "left_shoulder": (0.56, 0.28 + variation, 0.0, 0.98),
        "right_shoulder": (0.44, 0.28 + variation, 0.0, 0.98),
        "left_elbow": (0.62, 0.22 + variation, 0.0, 0.95),
        "right_elbow": (0.38, 0.22 + variation, 0.0, 0.95),
        "left_wrist": (0.52, 0.12 + variation, 0.0, 0.94),
        "right_wrist": (0.48, 0.12 + variation, 0.0, 0.94),
        "left_hip": (0.54, 0.58 + variation, 0.0, 0.97),
        "right_hip": (0.46, 0.58 + variation, 0.0, 0.97),
        "left_knee": (0.68, 0.68 + variation, 0.0, 0.96),  # Bent & flared outwards
        "right_knee": (0.46, 0.78 + variation, 0.0, 0.96),  # Straight standing leg
        "left_ankle": (0.50, 0.74 + variation, 0.0, 0.95),  # Foot placed near inner knee/thigh
        "right_ankle": (0.46, 0.96 + variation, 0.0, 0.95),
        "left_foot_index": (0.49, 0.76 + variation, 0.0, 0.91),
        "right_foot_index": (0.43, 0.98 + variation, 0.0, 0.92),
    }
    return _build_pose(spec)


def generate_warrior_2_landmarks(variation: float = 0.0) -> PoseLandmarks:
    """Warrior II: Wide lunge, front right knee bent 90°, back leg straight, arms extended horizontally."""
    spec = {
        "nose": (0.5, 0.25 + variation, 0.0, 0.99),
        "left_shoulder": (0.60, 0.35 + variation, 0.0, 0.98),
        "right_shoulder": (0.40, 0.35 + variation, 0.0, 0.98),
        "left_elbow": (0.75, 0.35 + variation, 0.0, 0.96),   # Left arm extended horizontally
        "right_elbow": (0.25, 0.35 + variation, 0.0, 0.96),  # Right arm extended horizontally
        "left_wrist": (0.88, 0.35 + variation, 0.0, 0.95),
        "right_wrist": (0.12, 0.35 + variation, 0.0, 0.95),
        "left_hip": (0.58, 0.60 + variation, 0.0, 0.97),
        "right_hip": (0.42, 0.60 + variation, 0.0, 0.97),
        "left_knee": (0.74, 0.76 + variation, 0.0, 0.96),    # Back leg straight
        "right_knee": (0.32, 0.72 + variation, 0.0, 0.96),   # Front leg bent 90°
        "left_ankle": (0.84, 0.94 + variation, 0.0, 0.95),
        "right_ankle": (0.32, 0.94 + variation, 0.0, 0.95),
        "left_foot_index": (0.88, 0.96 + variation, 0.0, 0.92),
        "right_foot_index": (0.26, 0.96 + variation, 0.0, 0.92),
    }
    return _build_pose(spec)


def generate_downward_dog_landmarks(variation: float = 0.0) -> PoseLandmarks:
    """Downward Dog: Inverted V-shape, hands on floor, feet on floor, hips elevated."""
    spec = {
        "nose": (0.40, 0.65 + variation, 0.0, 0.98),
        "left_shoulder": (0.42, 0.58 + variation, 0.0, 0.98),
        "right_shoulder": (0.38, 0.58 + variation, 0.0, 0.98),
        "left_elbow": (0.34, 0.72 + variation, 0.0, 0.96),
        "right_elbow": (0.30, 0.72 + variation, 0.0, 0.96),
        "left_wrist": (0.24, 0.88 + variation, 0.0, 0.95),   # Hands grounded
        "right_wrist": (0.20, 0.88 + variation, 0.0, 0.95),
        "left_hip": (0.54, 0.32 + variation, 0.0, 0.98),     # Hips elevated high
        "right_hip": (0.48, 0.32 + variation, 0.0, 0.98),
        "left_knee": (0.64, 0.58 + variation, 0.0, 0.96),
        "right_knee": (0.60, 0.58 + variation, 0.0, 0.96),
        "left_ankle": (0.76, 0.88 + variation, 0.0, 0.95),   # Feet grounded
        "right_ankle": (0.72, 0.88 + variation, 0.0, 0.95),
        "left_foot_index": (0.80, 0.90 + variation, 0.0, 0.92),
        "right_foot_index": (0.76, 0.90 + variation, 0.0, 0.92),
    }
    return _build_pose(spec)


def generate_chair_pose_landmarks(variation: float = 0.0) -> PoseLandmarks:
    """Chair Pose (Utkatasana): Knees bent, hips sunk back, arms raised upwards."""
    spec = {
        "nose": (0.50, 0.28 + variation, 0.0, 0.99),
        "left_shoulder": (0.56, 0.36 + variation, 0.0, 0.98),
        "right_shoulder": (0.44, 0.36 + variation, 0.0, 0.98),
        "left_elbow": (0.60, 0.22 + variation, 0.0, 0.96),   # Arms reaching up
        "right_elbow": (0.40, 0.22 + variation, 0.0, 0.96),
        "left_wrist": (0.64, 0.10 + variation, 0.0, 0.95),
        "right_wrist": (0.36, 0.10 + variation, 0.0, 0.95),
        "left_hip": (0.58, 0.60 + variation, 0.0, 0.98),     # Hips sunk back
        "right_hip": (0.42, 0.60 + variation, 0.0, 0.98),
        "left_knee": (0.62, 0.76 + variation, 0.0, 0.97),    # Knees deeply bent
        "right_knee": (0.38, 0.76 + variation, 0.0, 0.97),
        "left_ankle": (0.56, 0.94 + variation, 0.0, 0.95),
        "right_ankle": (0.44, 0.94 + variation, 0.0, 0.95),
        "left_foot_index": (0.60, 0.96 + variation, 0.0, 0.92),
        "right_foot_index": (0.40, 0.96 + variation, 0.0, 0.92),
    }
    return _build_pose(spec)


def seed_demo_dataset(samples_per_pose: int = 4) -> List[DatasetRecord]:
    """
    Generate and save a seed demonstration dataset containing all 5 poses.
    """
    from ai.dataset.collector import DatasetCollector

    collector = DatasetCollector()
    extractor = FeatureExtractor()
    validator = DatasetValidator()

    pose_generators = {
        "tadasana": generate_tadasana_landmarks,
        "tree_pose": generate_tree_pose_landmarks,
        "warrior_2": generate_warrior_2_landmarks,
        "downward_dog": generate_downward_dog_landmarks,
        "chair_pose": generate_chair_pose_landmarks,
    }

    created_records: List[DatasetRecord] = []

    for pose_name, gen_fn in pose_generators.items():
        session_id = f"seed_session_{pose_name}"
        for i in range(samples_per_pose):
            var = (i - (samples_per_pose / 2.0)) * 0.015
            pose_lms = gen_fn(variation=var)

            record = extractor.extract_features(
                pose_landmarks=pose_lms,
                pose_label=pose_name,
                source_type="synthetic_seed",
                session_id=session_id,
            )

            status, reasons = validator.validate_record(record)
            record.validation_status = status
            record.validation_reasons = reasons

            collector._append_record(record)
            created_records.append(record)

    collector.update_manifest()
    print(f"[SUCCESS] Seeded {len(created_records)} demonstration samples across 5 yoga poses.")
    return created_records


if __name__ == "__main__":
    seed_demo_dataset()

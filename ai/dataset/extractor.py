"""
YogaSync - Step 6: Feature Extraction & Normalization Module

Extracts raw coordinates, joint angles, visibilities, and calculates
scale- and translation-invariant body-normalized coordinates for AI training.
"""

import math
from typing import Any, Dict, Optional, Tuple

from pose import JointAngleCalculator, JointAngles, LandmarkExtractor, PoseLandmarks

from .metadata import DatasetRecord, generate_sample_id


class FeatureExtractor:
    """
    Extracts structured features and normalized geometric representations
    from Step 4 PoseLandmarks and Step 5 JointAngles.
    """

    def __init__(
        self,
        min_visibility: float = 0.5,
        angle_calculator: Optional[JointAngleCalculator] = None,
    ):
        self.min_visibility = min_visibility
        self.angle_calculator = angle_calculator or JointAngleCalculator(min_visibility=min_visibility)

    def extract_features(
        self,
        pose_landmarks: PoseLandmarks,
        pose_label: str,
        source_type: str = "webcam",
        session_id: Optional[str] = None,
        sample_id: Optional[str] = None,
    ) -> DatasetRecord:
        """
        Extract complete feature representation from a PoseLandmarks container.

        Args:
            pose_landmarks: Extracted landmarks from Step 4.
            pose_label: Canonical yoga pose label.
            source_type: Origin ('webcam', 'image', 'video', etc.).
            session_id: Optional session identifier for grouping.
            sample_id: Optional custom sample ID (auto-generated if None).

        Returns:
            DatasetRecord with raw coordinates, normalized coordinates, angles, and visibilities.
        """
        if sample_id is None:
            sample_id = generate_sample_id(pose_label)

        # 1. Raw Landmark Coordinates & Visibilities
        raw_landmarks: Dict[str, Dict[str, float]] = {}
        visibilities: Dict[str, float] = {}

        for name, lm in pose_landmarks.landmarks.items():
            raw_landmarks[name] = {
                "x": round(lm.x, 4),
                "y": round(lm.y, 4),
                "z": round(lm.z, 4),
            }
            visibilities[name] = round(lm.visibility, 4)

        # 2. Joint Angles from Step 5 Engine
        joint_angles_obj = self.angle_calculator.calculate(pose_landmarks)
        angles_dict = joint_angles_obj.to_dict() if joint_angles_obj else {}

        # 3. Translation and Scale Normalization (Body-Size Invariance)
        normalized_landmarks = self._compute_normalized_coordinates(pose_landmarks)

        return DatasetRecord(
            sample_id=sample_id,
            pose=pose_label,
            source_type=source_type,
            session_id=session_id,
            landmarks=raw_landmarks,
            normalized_landmarks=normalized_landmarks,
            angles=angles_dict,
            visibility=visibilities,
        )

    def _compute_normalized_coordinates(
        self, pose_landmarks: PoseLandmarks
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute scale- and translation-invariant landmark coordinates.

        Method:
            1. Anchor Origin: Mid-point between hips (or mid-shoulders if hips unavailable).
            2. Scale Factor: Torso length (mid-shoulder to mid-hip distance).
            3. Normalized coordinates: (point - origin) / scale_factor.
        """
        normalized: Dict[str, Dict[str, float]] = {}

        # Get key anchor landmarks
        l_hip = pose_landmarks.get("left_hip")
        r_hip = pose_landmarks.get("right_hip")
        l_sh = pose_landmarks.get("left_shoulder")
        r_sh = pose_landmarks.get("right_shoulder")

        # Determine origin
        if l_hip and r_hip and l_hip.is_reliable and r_hip.is_reliable:
            origin_x = (l_hip.x + r_hip.x) / 2.0
            origin_y = (l_hip.y + r_hip.y) / 2.0
            origin_z = (l_hip.z + r_hip.z) / 2.0
        elif l_sh and r_sh and l_sh.is_reliable and r_sh.is_reliable:
            origin_x = (l_sh.x + r_sh.x) / 2.0
            origin_y = (l_sh.y + r_sh.y) / 2.0
            origin_z = (l_sh.z + r_sh.z) / 2.0
        else:
            # Fallback to frame center if anchors unreliable
            origin_x, origin_y, origin_z = 0.5, 0.5, 0.0

        # Determine scale factor (Torso length)
        scale = 1.0
        if (
            l_sh
            and r_sh
            and l_hip
            and r_hip
            and l_sh.is_reliable
            and r_sh.is_reliable
            and l_hip.is_reliable
            and r_hip.is_reliable
        ):
            mid_sh_x = (l_sh.x + r_sh.x) / 2.0
            mid_sh_y = (l_sh.y + r_sh.y) / 2.0
            mid_hip_x = (l_hip.x + r_hip.x) / 2.0
            mid_hip_y = (l_hip.y + r_hip.y) / 2.0

            torso_length = math.hypot(mid_sh_x - mid_hip_x, mid_sh_y - mid_hip_y)
            if torso_length > 0.05:
                scale = torso_length
            else:
                # Fallback to shoulder width if torso length is abnormally small
                sh_width = math.hypot(l_sh.x - r_sh.x, l_sh.y - r_sh.y)
                if sh_width > 0.05:
                    scale = sh_width

        # Apply transformation
        for name, lm in pose_landmarks.landmarks.items():
            norm_x = (lm.x - origin_x) / scale
            norm_y = (lm.y - origin_y) / scale
            norm_z = (lm.z - origin_z) / scale
            normalized[name] = {
                "x": round(norm_x, 4),
                "y": round(norm_y, 4),
                "z": round(norm_z, 4),
            }

        return normalized

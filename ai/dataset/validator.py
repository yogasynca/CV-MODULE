"""
YogaSync - Step 6: Dataset Validation & Quality Assurance Module

Validates dataset records, checks landmark counts and visibility thresholds,
classifies sample quality (VALID, QUESTIONABLE, INVALID), and checks for duplicates.
"""

import math
from typing import Any, Dict, List, Optional, Set, Tuple

from .metadata import DatasetRecord, is_supported_pose


class DatasetValidator:
    """
    Validates pose sample records against geometric, visibility, and semantic rules.
    """

    def __init__(
        self,
        min_reliable_landmarks_valid: int = 18,
        min_reliable_landmarks_questionable: int = 10,
        min_valid_angles_valid: int = 4,
        min_valid_angles_questionable: int = 2,
    ):
        self.min_reliable_valid = min_reliable_landmarks_valid
        self.min_reliable_questionable = min_reliable_landmarks_questionable
        self.min_angles_valid = min_valid_angles_valid
        self.min_angles_questionable = min_valid_angles_questionable

    def validate_record(self, record: DatasetRecord) -> Tuple[str, List[str]]:
        """
        Evaluate a dataset record and determine its quality status.

        Returns:
            Tuple of (status, reasons) where status is 'VALID', 'QUESTIONABLE', or 'INVALID'.
        """
        reasons: List[str] = []

        # 1. Validate Pose Label
        if not record.pose or not is_supported_pose(record.pose):
            reasons.append(f"unsupported_or_missing_pose_label: '{record.pose}'")
            return "INVALID", reasons

        # 2. Check Landmark Existence
        if not record.landmarks or len(record.landmarks) == 0:
            reasons.append("no_landmarks_detected")
            return "INVALID", reasons

        # 3. Check for Impossible or NaN / Inf coordinate values
        for name, coords in record.landmarks.items():
            for axis in ("x", "y", "z"):
                val = coords.get(axis)
                if val is None or math.isnan(val) or math.isinf(val):
                    reasons.append(f"invalid_coordinate_value_{name}_{axis}")
                    return "INVALID", reasons

        # 4. Count Reliable Landmarks and Angles
        reliable_count = 0
        for name, vis in record.visibility.items():
            if vis >= 0.5:
                reliable_count += 1

        valid_angles_count = sum(1 for v in record.angles.values() if v is not None)

        # 5. Quality Classification
        if reliable_count >= self.min_reliable_valid and valid_angles_count >= self.min_angles_valid:
            status = "VALID"
        elif (
            reliable_count >= self.min_reliable_questionable
            and valid_angles_count >= self.min_angles_questionable
        ):
            status = "QUESTIONABLE"
            if reliable_count < self.min_reliable_valid:
                reasons.append(f"partial_landmark_visibility ({reliable_count}/33 reliable)")
            if valid_angles_count < self.min_angles_valid:
                reasons.append(f"low_valid_angles_count ({valid_angles_count} calculated)")
        else:
            status = "INVALID"
            reasons.append(
                f"insufficient_reliable_landmarks ({reliable_count}/33) or angles ({valid_angles_count})"
            )

        return status, reasons

    def check_dataset_duplicates(
        self, records: List[DatasetRecord]
    ) -> Dict[str, List[str]]:
        """
        Scan a list of records for duplicate sample IDs.

        Returns:
            Dictionary mapping duplicate sample IDs to their occurrence count.
        """
        seen_ids: Set[str] = set()
        duplicates: Dict[str, int] = {}

        for rec in records:
            if rec.sample_id in seen_ids:
                duplicates[rec.sample_id] = duplicates.get(rec.sample_id, 1) + 1
            else:
                seen_ids.add(rec.sample_id)

        return duplicates

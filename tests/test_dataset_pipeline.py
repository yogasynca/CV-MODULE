"""
Unit tests for YogaSync AI Dataset Pipeline (Step 6)
"""

import json
import os
import shutil
import tempfile
import unittest

from pose.landmark_extractor import LandmarkPoint, PoseLandmarks

from ai.dataset.collector import DatasetCollector
from ai.dataset.extractor import FeatureExtractor
from ai.dataset.metadata import (
    DATASET_SCHEMA_VERSION,
    DATASET_VERSION,
    SUPPORTED_POSES,
    DatasetManifest,
    DatasetRecord,
    generate_sample_id,
    is_supported_pose,
)
from ai.dataset.seed_demo import (
    generate_chair_pose_landmarks,
    generate_downward_dog_landmarks,
    generate_tadasana_landmarks,
    generate_tree_pose_landmarks,
    generate_warrior_2_landmarks,
)
from ai.dataset.summary import compute_dataset_splits
from ai.dataset.validator import DatasetValidator


class TestDatasetPipeline(unittest.TestCase):
    """Unit test suite for Step 6 Dataset Pipeline."""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.raw_dir = os.path.join(self.temp_dir, "raw")
        self.processed_dir = os.path.join(self.temp_dir, "processed")
        self.metadata_dir = os.path.join(self.temp_dir, "metadata")

        self.collector = DatasetCollector(
            raw_dir=self.raw_dir,
            processed_dir=self.processed_dir,
            metadata_dir=self.metadata_dir,
            min_visibility=0.5,
        )
        self.extractor = FeatureExtractor(min_visibility=0.5)
        self.validator = DatasetValidator()

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_supported_pose_registry(self):
        """Test supported pose class lookup and validation."""
        self.assertTrue(is_supported_pose("tadasana"))
        self.assertTrue(is_supported_pose("tree_pose"))
        self.assertTrue(is_supported_pose("warrior_2"))
        self.assertTrue(is_supported_pose("downward_dog"))
        self.assertTrue(is_supported_pose("chair_pose"))

        self.assertFalse(is_supported_pose("handstand_random"))
        self.assertFalse(is_supported_pose(""))

    def test_sample_id_generation(self):
        """Test unique sample ID generation format."""
        sample_id = generate_sample_id("warrior_2")
        self.assertTrue(sample_id.startswith("sample_warrior_2_"))
        self.assertIn("warrior_2", sample_id)

    def test_dataset_record_serialization(self):
        """Test DatasetRecord to_dict and from_dict roundtrip."""
        rec = DatasetRecord(
            sample_id="test_001",
            pose="tadasana",
            source_type="synthetic",
            validation_status="VALID",
            angles={"left_elbow": 180.0, "right_elbow": 180.0},
            visibility={"left_shoulder": 0.99},
        )
        d = rec.to_dict()
        self.assertEqual(d["sample_id"], "test_001")
        self.assertEqual(d["schema_version"], DATASET_SCHEMA_VERSION)

        restored = DatasetRecord.from_dict(d)
        self.assertEqual(restored.sample_id, "test_001")
        self.assertEqual(restored.angles["left_elbow"], 180.0)

    def test_feature_extraction_and_normalization(self):
        """Test feature extraction and scale/origin normalization on Tadasana."""
        pose_lms = generate_tadasana_landmarks()
        record = self.extractor.extract_features(
            pose_landmarks=pose_lms,
            pose_label="tadasana",
            source_type="synthetic_test",
        )

        self.assertEqual(record.pose, "tadasana")
        self.assertEqual(len(record.landmarks), 33)
        self.assertEqual(len(record.normalized_landmarks), 33)
        self.assertIn("left_elbow", record.angles)

        # In normalized landmarks, mid-hip should be at (0, 0)
        norm_l_hip = record.normalized_landmarks["left_hip"]
        norm_r_hip = record.normalized_landmarks["right_hip"]
        mid_hip_x = (norm_l_hip["x"] + norm_r_hip["x"]) / 2.0
        self.assertAlmostEqual(mid_hip_x, 0.0, places=2)

    def test_validator_valid_sample(self):
        """Test that a complete pose sample is classified as VALID."""
        pose_lms = generate_warrior_2_landmarks()
        record = self.extractor.extract_features(
            pose_landmarks=pose_lms,
            pose_label="warrior_2",
            source_type="synthetic_test",
        )
        status, reasons = self.validator.validate_record(record)
        self.assertEqual(status, "VALID")
        self.assertEqual(len(reasons), 0)

    def test_validator_questionable_and_invalid_samples(self):
        """Test handling of low-visibility and invalid samples."""
        # 1. Invalid pose label
        rec_invalid_pose = DatasetRecord(sample_id="s1", pose="fake_pose", source_type="test")
        st, reasons = self.validator.validate_record(rec_invalid_pose)
        self.assertEqual(st, "INVALID")

        # 2. No landmarks
        rec_no_lms = DatasetRecord(sample_id="s2", pose="tadasana", source_type="test")
        st, reasons = self.validator.validate_record(rec_no_lms)
        self.assertEqual(st, "INVALID")

        # 3. Partial visibility (Questionable)
        pose_lms = generate_tadasana_landmarks()
        # Set half landmarks unreliable
        for i, (name, lm) in enumerate(pose_lms.landmarks.items()):
            if i > 14:
                lm.visibility = 0.2
                lm.is_reliable = False

        rec_partial = self.extractor.extract_features(
            pose_landmarks=pose_lms,
            pose_label="tadasana",
            source_type="synthetic_test",
        )
        st, reasons = self.validator.validate_record(rec_partial)
        self.assertIn(st, ["QUESTIONABLE", "INVALID"])

    def test_duplicate_sample_id_detection(self):
        """Test duplicate sample ID detection."""
        r1 = DatasetRecord(sample_id="dup_id", pose="tadasana", source_type="test")
        r2 = DatasetRecord(sample_id="dup_id", pose="tadasana", source_type="test")
        r3 = DatasetRecord(sample_id="unique_id", pose="tadasana", source_type="test")

        duplicates = self.validator.check_dataset_duplicates([r1, r2, r3])
        self.assertIn("dup_id", duplicates)
        self.assertEqual(duplicates["dup_id"], 2)
        self.assertNotIn("unique_id", duplicates)

    def test_manifest_persistence(self):
        """Test manifest save and load operations."""
        manifest_path = os.path.join(self.metadata_dir, "manifest.json")
        manifest = DatasetManifest(
            dataset_version="0.1.0",
            total_samples=10,
            valid_samples=8,
            questionable_samples=1,
            invalid_samples=1,
            pose_counts={"tadasana": 5, "warrior_2": 5},
        )
        manifest.save(manifest_path)

        loaded = DatasetManifest.load(manifest_path)
        self.assertEqual(loaded.dataset_version, "0.1.0")
        self.assertEqual(loaded.total_samples, 10)
        self.assertEqual(loaded.pose_counts["tadasana"], 5)

    def test_train_val_test_split(self):
        """Test train/val/test dataset partitioning with session grouping."""
        records: List[DatasetRecord] = []
        for i in range(20):
            records.append(
                DatasetRecord(
                    sample_id=f"sample_{i}",
                    pose="warrior_2",
                    source_type="synthetic",
                    session_id=f"sess_{i % 5}",  # 5 distinct sessions
                    validation_status="VALID",
                )
            )

        splits = compute_dataset_splits(records, train_ratio=0.6, val_ratio=0.2, test_ratio=0.2)
        self.assertIn("train", splits)
        self.assertIn("val", splits)
        self.assertIn("test", splits)

        # Ensure no session leakage across splits
        train_sessions = {r.session_id for r in splits["train"]}
        test_sessions = {r.session_id for r in splits["test"]}
        self.assertEqual(len(train_sessions.intersection(test_sessions)), 0)


if __name__ == "__main__":
    unittest.main()

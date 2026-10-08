"""
YogaSync - Step 6: Dataset Collector CLI & Pipeline Engine

Collects and validates yoga pose samples from webcam, image files, or video streams,
generating structured JSONL records and updating the dataset manifest.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from typing import Any, Dict, List, Optional
import cv2
import mediapipe as mp

from pose import JointAngleCalculator, LandmarkExtractor, PoseLandmarks

from .extractor import FeatureExtractor
from .metadata import (
    DATASET_VERSION,
    DEFAULT_METADATA_DIR,
    DEFAULT_PROCESSED_DIR,
    DEFAULT_RAW_DIR,
    MANIFEST_PATH,
    SAMPLES_JSONL_PATH,
    SUPPORTED_POSES,
    DatasetManifest,
    DatasetRecord,
    generate_sample_id,
    is_supported_pose,
)
from .validator import DatasetValidator

MODEL_FILENAME = "pose_landmarker_lite.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"


def ensure_model_exists(model_path: str) -> None:
    """Download the MediaPipe pose landmarker model if missing."""
    if not os.path.exists(model_path):
        print(f"[INFO] Model not found at '{model_path}'. Downloading...")
        urllib.request.urlretrieve(MODEL_URL, model_path)
        print("[INFO] Model downloaded.")


class DatasetCollector:
    """
    Orchestrates pose sample capture, landmark & angle extraction,
    validation, local JSONL persistence, and manifest updates.
    """

    def __init__(
        self,
        raw_dir: str = DEFAULT_RAW_DIR,
        processed_dir: str = DEFAULT_PROCESSED_DIR,
        metadata_dir: str = DEFAULT_METADATA_DIR,
        min_visibility: float = 0.5,
    ):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.metadata_dir = metadata_dir
        self.samples_file = os.path.join(self.processed_dir, "samples.jsonl")
        self.manifest_file = os.path.join(self.metadata_dir, "dataset_manifest.json")

        os.makedirs(self.raw_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.metadata_dir, exist_ok=True)

        self.landmark_extractor = LandmarkExtractor(min_visibility=min_visibility)
        self.angle_calculator = JointAngleCalculator(min_visibility=min_visibility)
        self.feature_extractor = FeatureExtractor(
            min_visibility=min_visibility,
            angle_calculator=self.angle_calculator,
        )
        self.validator = DatasetValidator()

    def process_and_save_frame(
        self,
        frame,
        detector,
        pose_label: str,
        source_type: str = "webcam",
        session_id: Optional[str] = None,
        save_raw_image: bool = False,
        timestamp_ms: int = 0,
    ) -> Optional[DatasetRecord]:
        """
        Process a single image frame, extract features, validate, and append to dataset.
        """
        if not is_supported_pose(pose_label):
            raise ValueError(f"Unknown pose label '{pose_label}'. Supported: {list(SUPPORTED_POSES.keys())}")

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Detect
        result = detector.detect_for_video(mp_image, timestamp_ms)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            # Create an invalid record indicating no detection
            sample_id = generate_sample_id(pose_label)
            record = DatasetRecord(
                sample_id=sample_id,
                pose=pose_label,
                source_type=source_type,
                session_id=session_id,
                validation_status="INVALID",
                validation_reasons=["no_person_detected"],
            )
            self._append_record(record)
            return record

        # Extract landmarks
        pose_landmarks = self.landmark_extractor.extract(
            result.pose_landmarks,
            timestamp_ms=timestamp_ms
        )
        if not pose_landmarks:
            return None

        # Extract features (landmarks + angles + normalized)
        sample_id = generate_sample_id(pose_label)
        record = self.feature_extractor.extract_features(
            pose_landmarks=pose_landmarks,
            pose_label=pose_label,
            source_type=source_type,
            session_id=session_id,
            sample_id=sample_id,
        )

        # Validate
        status, reasons = self.validator.validate_record(record)
        record.validation_status = status
        record.validation_reasons = reasons

        # Optionally save raw image
        if save_raw_image:
            pose_raw_dir = os.path.join(self.raw_dir, pose_label)
            os.makedirs(pose_raw_dir, exist_ok=True)
            img_path = os.path.join(pose_raw_dir, f"{sample_id}.jpg")
            cv2.imwrite(img_path, frame)

        # Save to processed dataset
        self._append_record(record)
        return record

    def _append_record(self, record: DatasetRecord) -> None:
        """Append record to JSONL and update manifest."""
        with open(self.samples_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record.to_dict()) + "\n")

        self.update_manifest()

    def update_manifest(self) -> DatasetManifest:
        """Scan samples.jsonl and rebuild dataset_manifest.json."""
        manifest = DatasetManifest.load(self.manifest_file)
        all_records = self.load_all_records()

        manifest.total_samples = len(all_records)
        manifest.valid_samples = sum(1 for r in all_records if r.validation_status == "VALID")
        manifest.questionable_samples = sum(1 for r in all_records if r.validation_status == "QUESTIONABLE")
        manifest.invalid_samples = sum(1 for r in all_records if r.validation_status == "INVALID")

        pose_counts = {k: 0 for k in SUPPORTED_POSES.keys()}
        sources: Dict[str, int] = {}

        for r in all_records:
            if r.pose in pose_counts:
                pose_counts[r.pose] += 1
            else:
                pose_counts[r.pose] = 1
            sources[r.source_type] = sources.get(r.source_type, 0) + 1

        manifest.pose_counts = pose_counts
        manifest.sources = sources
        manifest.save(self.manifest_file)
        return manifest

    def load_all_records(self) -> List[DatasetRecord]:
        """Read all records from samples.jsonl."""
        if not os.path.exists(self.samples_file):
            return []
        records: List[DatasetRecord] = []
        with open(self.samples_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        records.append(DatasetRecord.from_dict(data))
                    except Exception:
                        pass
        return records

    def run_webcam_collector(self, pose_label: str, auto_interval_sec: float = 0.0) -> None:
        """
        Interactive live webcam collection session for a specific yoga pose.
        Press SPACE to capture a sample, or specify auto_interval_sec > 0 for periodic capture.
        Press Q to exit.
        """
        if not is_supported_pose(pose_label):
            print(f"[ERROR] Pose '{pose_label}' is not supported.")
            print(f"Supported poses: {list(SUPPORTED_POSES.keys())}")
            return

        pose_info = SUPPORTED_POSES[pose_label]
        print(f"\n==================================================")
        print(f" YogaSync AI Dataset Collector v0.1")
        print(f" Pose Target: {pose_info['display_name']} ({pose_label})")
        print(f" Controls: [SPACE] Capture Sample | [Q] Finish & Exit")
        print(f"==================================================\n")

        # Initialize detector
        model_path = os.path.abspath(MODEL_FILENAME)
        ensure_model_exists(model_path)

        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision

        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        detector = mp_vision.PoseLandmarker.create_from_options(options)

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[ERROR] Could not open webcam.")
            detector.close()
            return

        session_id = f"session_{int(time.time())}"
        session_captured = 0
        start_time = time.time()
        last_auto_capture = time.time()
        last_status_msg = "Ready to capture"
        last_status_color = (255, 255, 255)

        window_name = f"YogaSync Collector - {pose_label}"

        try:
            while cap.isOpened():
                success, frame = cap.read()
                if not success or frame is None:
                    continue

                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                current_time = time.time()
                frame_ts_ms = int((current_time - start_time) * 1000)

                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                detection_result = detector.detect_for_video(mp_image, frame_ts_ms)

                # Draw skeleton
                is_detected = False
                if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
                    is_detected = True
                    for raw_pose in detection_result.pose_landmarks:
                        mp_vision.drawing_utils.draw_landmarks(
                            frame,
                            raw_pose,
                            mp_vision.PoseLandmarksConnections.POSE_LANDMARKS,
                            mp_vision.drawing_styles.get_default_pose_landmarks_style(),
                        )

                # Overlay UI
                overlay = frame.copy()
                cv2.rectangle(overlay, (15, 15), (380, 160), (20, 20, 20), -1)
                cv2.addWeighted(overlay, 0.8, frame, 0.2, 0, frame)
                cv2.rectangle(frame, (15, 15), (380, 160), (70, 70, 70), 1)

                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(frame, f"COLLECTING: {pose_label.upper()}", (25, 38), font, 0.58, (0, 255, 255), 2, cv2.LINE_AA)
                cv2.putText(frame, f"Saved This Session: {session_captured}", (25, 62), font, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
                cv2.putText(frame, f"Pose Tracking: {'DETECTED' if is_detected else 'NOT DETECTED'}", (25, 84), font, 0.48, (0, 255, 0) if is_detected else (0, 0, 255), 1, cv2.LINE_AA)
                cv2.putText(frame, f"Status: {last_status_msg}", (25, 106), font, 0.45, last_status_color, 1, cv2.LINE_AA)
                cv2.putText(frame, "[SPACE] Capture  |  [Q] Exit", (25, 138), font, 0.46, (200, 200, 200), 1, cv2.LINE_AA)

                cv2.imshow(window_name, frame)
                key = cv2.waitKey(1) & 0xFF

                # Trigger capture
                should_capture = False
                if key == 32:  # SPACEBAR
                    should_capture = True
                elif auto_interval_sec > 0 and (current_time - last_auto_capture >= auto_interval_sec):
                    should_capture = True
                    last_auto_capture = current_time

                if should_capture:
                    record = self.process_and_save_frame(
                        frame=frame,
                        detector=detector,
                        pose_label=pose_label,
                        source_type="webcam",
                        session_id=session_id,
                        save_raw_image=True,
                        timestamp_ms=frame_ts_ms,
                    )
                    if record:
                        session_captured += 1
                        status_str = record.validation_status
                        if status_str == "VALID":
                            last_status_msg = f"Captured {record.sample_id[-6:]} [VALID]"
                            last_status_color = (0, 255, 0)
                        elif status_str == "QUESTIONABLE":
                            last_status_msg = f"Captured {record.sample_id[-6:]} [QUESTIONABLE]"
                            last_status_color = (0, 220, 255)
                        else:
                            last_status_msg = f"Captured {record.sample_id[-6:]} [INVALID]"
                            last_status_color = (0, 0, 255)
                        print(f"[DATASET] Recorded sample: {record.sample_id} | Status: {record.validation_status}")

                if key == ord("q") or key == ord("Q"):
                    print("[INFO] Exiting collector session...")
                    break

        finally:
            cap.release()
            cv2.destroyAllWindows()
            detector.close()
            manifest = self.update_manifest()
            print(f"\n[SUMMARY] Session ended. Total dataset samples: {manifest.total_samples}")


def main():
    parser = argparse.ArgumentParser(description="YogaSync AI Dataset Collector CLI v0.1")
    parser.add_argument(
        "--pose",
        type=str,
        default="warrior_2",
        choices=list(SUPPORTED_POSES.keys()),
        help=f"Target yoga pose class to collect ({', '.join(SUPPORTED_POSES.keys())})",
    )
    parser.add_argument(
        "--source",
        type=str,
        default="webcam",
        choices=["webcam", "image"],
        help="Source of data (webcam or image)",
    )
    parser.add_argument(
        "--image-path",
        type=str,
        default=None,
        help="Path to image file if --source image is selected",
    )
    parser.add_argument(
        "--auto-interval",
        type=float,
        default=0.0,
        help="Auto-capture interval in seconds (0 for manual SPACE keypress)",
    )

    args = parser.parse_args()
    collector = DatasetCollector()

    if args.source == "webcam":
        collector.run_webcam_collector(args.pose, auto_interval_sec=args.auto_interval)
    elif args.source == "image":
        if not args.image_path or not os.path.exists(args.image_path):
            print(f"[ERROR] Image path '{args.image_path}' not found.")
            sys.exit(1)
        img = cv2.imread(args.image_path)
        if img is None:
            print(f"[ERROR] Failed to load image from '{args.image_path}'.")
            sys.exit(1)

        model_path = os.path.abspath(MODEL_FILENAME)
        ensure_model_exists(model_path)
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.VIDEO,
            num_poses=1,
        )
        detector = mp_vision.PoseLandmarker.create_from_options(options)
        record = collector.process_and_save_frame(
            frame=img,
            detector=detector,
            pose_label=args.pose,
            source_type="image",
            save_raw_image=True,
            timestamp_ms=100,
        )
        detector.close()
        print(f"[SUCCESS] Processed image sample: {record.sample_id} ({record.validation_status})")


if __name__ == "__main__":
    main()

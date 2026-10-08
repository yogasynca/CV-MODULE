"""
YogaSync - Step 5: Live Pose Detection & Joint-Angle Engine v0.1

This module captures live video from the laptop's default webcam,
processes each frame using MediaPipe Pose, extracts structured 3D body landmarks,
calculates 2D biomechanical joint angles, renders skeleton and HUD overlay on the video feed,
and prints throttled joint angle telemetry to the console.
"""

import os
import sys
import time
import urllib.request
import cv2
import mediapipe as mp

from pose import (
    KEY_DISPLAY_JOINTS,
    JointAngleCalculator,
    JointAngles,
    LandmarkExtractor,
    PoseLandmarks,
)

# Configuration
MIN_VISIBILITY_THRESHOLD = 0.5
CONSOLE_PRINT_INTERVAL_SEC = 0.8

# Check if legacy mp.solutions is available or if we use modern Tasks API (MediaPipe 1.x+)
HAS_LEGACY_SOLUTIONS = hasattr(mp, "solutions") and hasattr(mp.solutions, "pose")

if not HAS_LEGACY_SOLUTIONS:
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

MODEL_FILENAME = "pose_landmarker_lite.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"


def ensure_model_exists(model_path: str) -> None:
    """Download the MediaPipe pose landmarker model if not present locally."""
    if not os.path.exists(model_path):
        print(f"Model file not found at '{model_path}'. Downloading from official source...")
        try:
            urllib.request.urlretrieve(MODEL_URL, model_path)
            print("Model downloaded successfully.")
        except Exception as e:
            print(f"Error downloading model: {e}")
            sys.exit(1)


def draw_hud_overlay(
    frame,
    pose_detected: bool,
    landmarks_count: int,
    reliable_count: int,
    joint_angles: JointAngles = None,
) -> None:
    """
    Render a clean HUD status and joint angle telemetry card on the video frame.
    """
    # Card dimensions
    card_w, card_h = 320, 230
    overlay = frame.copy()
    cv2.rectangle(overlay, (15, 15), (15 + card_w, 15 + card_h), (18, 18, 18), -1)
    cv2.addWeighted(overlay, 0.78, frame, 0.22, 0, frame)
    cv2.rectangle(frame, (15, 15), (15 + card_w, 15 + card_h), (65, 65, 65), 1)

    font = cv2.FONT_HERSHEY_SIMPLEX

    # Header
    cv2.putText(frame, "YOGASYNC", (25, 38), font, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

    if pose_detected:
        cv2.putText(frame, "Pose: DETECTED", (25, 60), font, 0.48, (0, 255, 0), 1, cv2.LINE_AA)
        cv2.putText(
            frame,
            f"Tracking: ACTIVE ({reliable_count}/{landmarks_count} landmarks)",
            (25, 78),
            font,
            0.42,
            (0, 220, 255),
            1,
            cv2.LINE_AA,
        )

        # Divider line
        cv2.line(frame, (25, 88), (15 + card_w - 10, 88), (60, 60, 60), 1)

        # Joint Angles Display
        y_offset = 108
        if joint_angles:
            display_rows = [
                ("L Elbow", "left_elbow", "R Elbow", "right_elbow"),
                ("L Shoulder", "left_shoulder", "R Shoulder", "right_shoulder"),
                ("L Hip", "left_hip", "R Hip", "right_hip"),
                ("L Knee", "left_knee", "R Knee", "right_knee"),
                ("L Ankle", "left_ankle", "R Ankle", "right_ankle"),
            ]

            for l_label, l_key, r_label, r_key in display_rows:
                l_val = joint_angles.get(l_key)
                r_val = joint_angles.get(r_key)

                l_str = f"{l_val:.0f}\xb0" if l_val is not None else "--"
                r_str = f"{r_val:.0f}\xb0" if r_val is not None else "--"

                l_color = (255, 255, 255) if l_val is not None else (120, 120, 120)
                r_color = (255, 255, 255) if r_val is not None else (120, 120, 120)

                left_text = f"{l_label}: {l_str}"
                right_text = f"{r_label}: {r_str}"

                cv2.putText(frame, left_text, (25, y_offset), font, 0.42, l_color, 1, cv2.LINE_AA)
                cv2.putText(frame, right_text, (175, y_offset), font, 0.42, r_color, 1, cv2.LINE_AA)
                y_offset += 22

    else:
        cv2.putText(frame, "Pose: NOT DETECTED", (25, 60), font, 0.48, (0, 0, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, "Tracking: SEARCHING", (25, 78), font, 0.42, (0, 165, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, "Stand in view of camera", (25, 110), font, 0.45, (160, 160, 160), 1, cv2.LINE_AA)


def main():
    window_name = "YogaSync - Pose & Joint Angles"

    # Step 1: Initialize Camera
    print("[INFO] Starting camera...")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Could not open camera (device index 0). Please check webcam connection/permissions.")
        sys.exit(1)

    print("[INFO] Camera started successfully.")
    print("[INFO] Press 'q' or 'Q' in the video window to exit.")

    # Step 2: Initialize Modules
    extractor = LandmarkExtractor(min_visibility=MIN_VISIBILITY_THRESHOLD)
    angle_calculator = JointAngleCalculator(min_visibility=MIN_VISIBILITY_THRESHOLD)

    # Step 3: Initialize Pose Detector
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, MODEL_FILENAME)

    if not HAS_LEGACY_SOLUTIONS:
        # MediaPipe Tasks API (MediaPipe 1.x+)
        ensure_model_exists(model_path)
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
    else:
        # Legacy MediaPipe Solutions API (< 0.10.14)
        mp_pose = mp.solutions.pose
        mp_drawing = mp.solutions.drawing_utils
        mp_drawing_styles = mp.solutions.drawing_styles
        detector = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    try:
        start_time = time.time()
        last_print_time = 0.0

        # Step 4: Process Video Frames Continuously
        while cap.isOpened():
            success, frame = cap.read()
            if not success or frame is None:
                print("[WARNING] Empty or dropped frame received from camera. Continuing...")
                continue

            current_time = time.time()

            # Flip frame horizontally for mirror-view
            frame = cv2.flip(frame, 1)

            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            extracted_pose: PoseLandmarks = None

            if not HAS_LEGACY_SOLUTIONS:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                frame_timestamp_ms = int((current_time - start_time) * 1000)

                detection_result = detector.detect_for_video(mp_image, frame_timestamp_ms)

                if detection_result.pose_landmarks:
                    for raw_pose in detection_result.pose_landmarks:
                        mp_vision.drawing_utils.draw_landmarks(
                            frame,
                            raw_pose,
                            mp_vision.PoseLandmarksConnections.POSE_LANDMARKS,
                            mp_vision.drawing_styles.get_default_pose_landmarks_style(),
                        )

                    extracted_pose = extractor.extract(
                        detection_result.pose_landmarks,
                        timestamp_ms=frame_timestamp_ms,
                    )
            else:
                results = detector.process(rgb_frame)

                if results.pose_landmarks:
                    mp_drawing.draw_landmarks(
                        frame,
                        results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
                    )
                    extracted_pose = extractor.extract(
                        results.pose_landmarks.landmark,
                        timestamp_ms=int((current_time - start_time) * 1000),
                    )

            # Step 5: Calculate Joint Angles
            joint_angles: JointAngles = None
            if extracted_pose:
                joint_angles = angle_calculator.calculate(extracted_pose)

            # Step 6: Render HUD Overlay
            is_detected = extracted_pose is not None and extracted_pose.total_count > 0
            total_lms = extracted_pose.total_count if is_detected else 0
            reliable_lms = extracted_pose.reliable_count if is_detected else 0

            draw_hud_overlay(
                frame,
                pose_detected=is_detected,
                landmarks_count=total_lms,
                reliable_count=reliable_lms,
                joint_angles=joint_angles,
            )

            # Step 7: Controlled Rate Terminal Telemetry (~0.8s interval)
            if current_time - last_print_time >= CONSOLE_PRINT_INTERVAL_SEC:
                if is_detected and joint_angles:
                    print(angle_calculator.format_terminal_summary(joint_angles))
                last_print_time = current_time

            # Step 8: Display the Result
            cv2.imshow(window_name, frame)

            # Step 9: Clean Exit on 'Q'
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q") or key == ord("Q"):
                print("[INFO] 'Q' pressed. Exiting cleanly...")
                break

    except KeyboardInterrupt:
        print("[INFO] Interrupted by user. Exiting cleanly...")

    finally:
        # Step 10: Cleanup Resources
        print("[INFO] Cleaning up resources...")
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("[INFO] YogaSync pose detection closed successfully.")


if __name__ == "__main__":
    main()

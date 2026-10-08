"""
YogaSync - Step 4: Landmark Data Extraction Module

Extracts and structures normalized body landmarks detected by MediaPipe Pose
for downstream biomechanical analysis and joint-angle calculation engines.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# Canonical MediaPipe Pose Landmark Index Mapping (33 Landmarks)
POSE_LANDMARK_NAMES: Dict[int, str] = {
    0: "nose",
    1: "left_eye_inner",
    2: "left_eye",
    3: "left_eye_outer",
    4: "right_eye_inner",
    5: "right_eye",
    6: "right_eye_outer",
    7: "left_ear",
    8: "right_ear",
    9: "mouth_left",
    10: "mouth_right",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    17: "left_pinky",
    18: "right_pinky",
    19: "left_index",
    20: "right_index",
    21: "left_thumb",
    22: "right_thumb",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    29: "left_heel",
    30: "right_heel",
    31: "left_foot_index",
    32: "right_foot_index",
}

# Key landmarks required for terminal summaries and biomechanical analysis
KEY_DISPLAY_LANDMARKS = [
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
]


@dataclass
class LandmarkPoint:
    """Represents an individual 3D body landmark with visibility confidence."""
    name: str
    x: float
    y: float
    z: float
    visibility: float
    presence: float = 0.0
    is_reliable: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert landmark to dictionary representation."""
        return {
            "x": round(self.x, 4),
            "y": round(self.y, 4),
            "z": round(self.z, 4),
            "visibility": round(self.visibility, 4),
            "is_reliable": self.is_reliable,
        }


@dataclass
class PoseLandmarks:
    """
    Structured container holding all detected body landmarks.
    Supports both direct attribute access (e.g. landmarks.left_shoulder)
    and dictionary-like access (e.g. landmarks['left_shoulder']).
    """
    landmarks: Dict[str, LandmarkPoint] = field(default_factory=dict)
    min_visibility: float = 0.5
    timestamp_ms: int = 0

    def __getattr__(self, name: str) -> Optional[LandmarkPoint]:
        """Allow direct dot-notation access to landmarks by name."""
        if name in self.landmarks:
            return self.landmarks[name]
        return None

    def __getitem__(self, name: str) -> Optional[LandmarkPoint]:
        """Allow dictionary-style subscript access to landmarks."""
        return self.landmarks.get(name)

    def __contains__(self, name: str) -> bool:
        return name in self.landmarks

    def get(self, name: str, default: Any = None) -> Optional[LandmarkPoint]:
        """Safely retrieve a landmark by its canonical name."""
        return self.landmarks.get(name, default)

    def is_reliable(self, name: str) -> bool:
        """Check if a specific landmark exists and satisfies the visibility threshold."""
        lm = self.get(name)
        return lm is not None and lm.is_reliable

    def to_dict(self) -> Dict[str, Any]:
        """Convert all landmarks to a clean dictionary structure."""
        return {name: lm.to_dict() for name, lm in self.landmarks.items()}

    @property
    def total_count(self) -> int:
        """Return total number of landmarks stored."""
        return len(self.landmarks)

    @property
    def reliable_count(self) -> int:
        """Return number of landmarks meeting the reliability threshold."""
        return sum(1 for lm in self.landmarks.values() if lm.is_reliable)


class LandmarkExtractor:
    """
    Reusable extractor responsible for converting MediaPipe raw landmark
    outputs into structured, typed, and validated PoseLandmarks objects.
    """

    def __init__(self, min_visibility: float = 0.5):
        """
        Initialize the landmark extractor.
        
        Args:
            min_visibility: Confidence threshold below which landmarks are marked unreliable.
        """
        self.min_visibility = min_visibility

    def extract(self, raw_landmarks: Any, timestamp_ms: int = 0) -> Optional[PoseLandmarks]:
        """
        Extract and normalize landmarks from MediaPipe detector output.

        Args:
            raw_landmarks: List of NormalizedLandmark objects or landmark list from detection result.
            timestamp_ms: Frame timestamp in milliseconds.

        Returns:
            PoseLandmarks object if landmarks are present, else None.
        """
        if not raw_landmarks:
            return None

        # Handle nested lists if raw detection_result.pose_landmarks is passed
        landmarks_list = raw_landmarks
        if isinstance(raw_landmarks, list) and len(raw_landmarks) > 0 and isinstance(raw_landmarks[0], list):
            landmarks_list = raw_landmarks[0]

        extracted: Dict[str, LandmarkPoint] = {}

        for idx, lm in enumerate(landmarks_list):
            name = POSE_LANDMARK_NAMES.get(idx, f"landmark_{idx}")

            # Safely extract coordinate values across both MediaPipe Tasks and Legacy APIs
            x = float(getattr(lm, "x", 0.0))
            y = float(getattr(lm, "y", 0.0))
            z = float(getattr(lm, "z", 0.0))
            visibility = float(getattr(lm, "visibility", 0.0))
            presence = float(getattr(lm, "presence", 0.0))

            # If visibility is not provided / 0.0 in some models, default to presence or 1.0
            if visibility == 0.0 and presence > 0.0:
                visibility = presence

            is_reliable = visibility >= self.min_visibility

            extracted[name] = LandmarkPoint(
                name=name,
                x=x,
                y=y,
                z=z,
                visibility=visibility,
                presence=presence,
                is_reliable=is_reliable,
            )

        return PoseLandmarks(
            landmarks=extracted,
            min_visibility=self.min_visibility,
            timestamp_ms=timestamp_ms,
        )

    def format_terminal_summary(self, pose_data: Optional[PoseLandmarks]) -> str:
        """
        Format selected landmark information for controlled terminal display.
        
        Args:
            pose_data: The extracted PoseLandmarks object.

        Returns:
            A formatted multi-line string.
        """
        if pose_data is None or pose_data.total_count == 0:
            return "YogaSync Landmark Data: [No Pose Detected]"

        lines = ["\n==================== YogaSync Landmark Data ===================="]
        for name in KEY_DISPLAY_LANDMARKS:
            lm = pose_data.get(name)
            display_title = name.replace("_", " ").title()
            if lm:
                status = "OK" if lm.is_reliable else "LOW CONFIDENCE"
                lines.append(
                    f"{display_title:<16}: x={lm.x:.4f}  y={lm.y:.4f}  z={lm.z:.4f}  "
                    f"visibility={lm.visibility:.2f} [{status}]"
                )
            else:
                lines.append(f"{display_title:<16}: [Not Available]")
        lines.append(f"Reliable Landmarks : {pose_data.reliable_count} / {pose_data.total_count}")
        lines.append("================================================================")
        return "\n".join(lines)

"""
YogaSync - Step 5: Joint-Angle Engine Module

Calculates biomechanical 2D human joint angles from extracted landmark coordinates
using vector trigonometry, precision clamping, and visibility validation.
"""

import math
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Sequence, Tuple, Union

from .landmark_extractor import LandmarkPoint, PoseLandmarks

# Canonical YogaSync Joint Definitions (Point A -> Center Joint B -> Point C)
# The calculated angle is measured at vertex B (0° to 180°)
YOGASYNC_JOINT_DEFINITIONS: Dict[str, Tuple[str, str, str]] = {
    "left_elbow": ("left_shoulder", "left_elbow", "left_wrist"),
    "right_elbow": ("right_shoulder", "right_elbow", "right_wrist"),
    "left_shoulder": ("left_elbow", "left_shoulder", "left_hip"),
    "right_shoulder": ("right_elbow", "right_shoulder", "right_hip"),
    "left_hip": ("left_shoulder", "left_hip", "left_knee"),
    "right_hip": ("right_shoulder", "right_hip", "right_knee"),
    "left_knee": ("left_hip", "left_knee", "left_ankle"),
    "right_knee": ("right_hip", "right_knee", "right_ankle"),
    "left_ankle": ("left_knee", "left_ankle", "left_foot_index"),
    "right_ankle": ("right_knee", "right_ankle", "right_foot_index"),
}

# Display order for UI and telemetry
KEY_DISPLAY_JOINTS = [
    ("left_elbow", "right_elbow"),
    ("left_shoulder", "right_shoulder"),
    ("left_hip", "right_hip"),
    ("left_knee", "right_knee"),
    ("left_ankle", "right_ankle"),
]


def _extract_xy(point: Any) -> Optional[Tuple[float, float]]:
    """
    Safely extract (x, y) coordinates from LandmarkPoint, tuple, list, or dict.
    Returns None if point is invalid or unreliable.
    """
    if point is None:
        return None

    if isinstance(point, LandmarkPoint):
        if not point.is_reliable:
            return None
        return (float(point.x), float(point.y))

    if isinstance(point, (tuple, list)):
        if len(point) < 2:
            return None
        try:
            return (float(point[0]), float(point[1]))
        except (ValueError, TypeError):
            return None

    if isinstance(point, dict):
        if "x" in point and "y" in point:
            try:
                if point.get("is_reliable", True) is False:
                    return None
                return (float(point["x"]), float(point["y"]))
            except (ValueError, TypeError):
                return None

    return None


def calculate_angle(
    point_a: Any,
    point_b: Any,
    point_c: Any,
    epsilon: float = 1e-7,
) -> Optional[float]:
    """
    Calculate the interior 2D angle (in degrees) at vertex Point B formed by ray BA and ray BC.

    Mathematical Formula:
        BA = A - B
        BC = C - B
        cos(theta) = (BA · BC) / (|BA| * |BC|)
        theta = arccos(clamp(cos(theta), -1.0, 1.0)) * (180 / pi)

    Args:
        point_a: First point or LandmarkPoint A.
        point_b: Center vertex point or LandmarkPoint B (where angle is calculated).
        point_c: Third point or LandmarkPoint C.
        epsilon: Threshold for detecting zero-length vectors.

    Returns:
        Angle in degrees [0.0, 180.0], or None if inputs are invalid/unreliable.
    """
    pt_a = _extract_xy(point_a)
    pt_b = _extract_xy(point_b)
    pt_c = _extract_xy(point_c)

    if pt_a is None or pt_b is None or pt_c is None:
        return None

    ax, ay = pt_a
    bx, by = pt_b
    cx, cy = pt_c

    # Vector BA (from vertex B to point A)
    v_ba_x = ax - bx
    v_ba_y = ay - by

    # Vector BC (from vertex B to point C)
    v_bc_x = cx - bx
    v_bc_y = cy - by

    # Magnitudes (lengths)
    mag_ba = math.hypot(v_ba_x, v_ba_y)
    mag_bc = math.hypot(v_bc_x, v_bc_y)

    # Check for zero-length vectors (coincident points)
    if mag_ba < epsilon or mag_bc < epsilon:
        return None

    # Dot product
    dot_product = (v_ba_x * v_bc_x) + (v_ba_y * v_bc_y)

    # Cosine of angle with precision clamping to [-1.0, 1.0]
    cos_theta = dot_product / (mag_ba * mag_bc)
    cos_theta = max(-1.0, min(1.0, cos_theta))

    # Calculate angle in radians and convert to degrees
    angle_rad = math.acos(cos_theta)
    angle_deg = math.degrees(angle_rad)

    return round(angle_deg, 2)


@dataclass
class JointAngles:
    """
    Structured container holding calculated human joint angles.
    Provides dot-notation access, subscript access, and dictionary serialization.
    """
    angles: Dict[str, Optional[float]] = field(default_factory=dict)
    timestamp_ms: int = 0

    def __getattr__(self, name: str) -> Optional[float]:
        """Allow direct dot-notation access to angles (e.g. joint_angles.left_knee)."""
        if name in self.angles:
            return self.angles[name]
        return None

    def __getitem__(self, name: str) -> Optional[float]:
        """Allow dictionary-style subscript access (e.g. joint_angles['left_knee'])."""
        return self.angles.get(name)

    def __contains__(self, name: str) -> bool:
        return name in self.angles

    def get(self, name: str, default: Any = None) -> Optional[float]:
        """Safely retrieve a joint angle by name."""
        val = self.angles.get(name)
        return val if val is not None else default

    def to_dict(self) -> Dict[str, Optional[float]]:
        """Return clean dictionary of all joint angles."""
        return dict(self.angles)

    @property
    def valid_count(self) -> int:
        """Return count of successfully calculated (non-None) joint angles."""
        return sum(1 for v in self.angles.values() if v is not None)

    @property
    def total_count(self) -> int:
        """Return total count of defined joint angles."""
        return len(self.angles)


class JointAngleCalculator:
    """
    Calculates biomechanical joint angles from structured PoseLandmarks.
    """

    def __init__(
        self,
        joint_definitions: Optional[Dict[str, Tuple[str, str, str]]] = None,
        min_visibility: float = 0.5,
    ):
        """
        Initialize the joint angle calculator.

        Args:
            joint_definitions: Mapping of joint name to (point_a, vertex_b, point_c) landmark names.
            min_visibility: Confidence threshold for landmarks.
        """
        self.joint_definitions = joint_definitions or YOGASYNC_JOINT_DEFINITIONS
        self.min_visibility = min_visibility

    def calculate(self, pose_landmarks: Optional[PoseLandmarks]) -> Optional[JointAngles]:
        """
        Compute all defined joint angles for a given PoseLandmarks instance.

        Args:
            pose_landmarks: Structured pose landmarks from LandmarkExtractor.

        Returns:
            JointAngles instance if pose landmarks exist, else None.
        """
        if pose_landmarks is None:
            return None

        results: Dict[str, Optional[float]] = {}

        for joint_name, (pt_a_name, pt_b_name, pt_c_name) in self.joint_definitions.items():
            pt_a = pose_landmarks.get(pt_a_name)
            pt_b = pose_landmarks.get(pt_b_name)
            pt_c = pose_landmarks.get(pt_c_name)

            # Check existence and visibility reliability of all 3 required landmarks
            if (
                pt_a is None
                or pt_b is None
                or pt_c is None
                or not pt_a.is_reliable
                or not pt_b.is_reliable
                or not pt_c.is_reliable
            ):
                results[joint_name] = None
                continue

            angle = calculate_angle(pt_a, pt_b, pt_c)
            results[joint_name] = angle

        return JointAngles(
            angles=results,
            timestamp_ms=pose_landmarks.timestamp_ms,
        )

    def format_terminal_summary(self, joint_angles: Optional[JointAngles]) -> str:
        """
        Format calculated joint angles for clean terminal telemetry.
        """
        if joint_angles is None or joint_angles.valid_count == 0:
            return "YogaSync Joint Angles: [No Valid Joint Data]"

        lines = ["\n----------------- YogaSync Joint Angles -----------------"]
        for left_key, right_key in KEY_DISPLAY_JOINTS:
            l_val = joint_angles.get(left_key)
            r_val = joint_angles.get(right_key)

            l_str = f"{l_val:.1f}°" if l_val is not None else "--"
            r_str = f"{r_val:.1f}°" if r_val is not None else "--"

            l_name = left_key.replace("_", " ").title()
            r_name = right_key.replace("_", " ").title()

            lines.append(f"{l_name:<14}: {l_str:<8} | {r_name:<14}: {r_str:<8}")

        lines.append(f"Active Joints : {joint_angles.valid_count} / {joint_angles.total_count}")
        lines.append("---------------------------------------------------------")
        return "\n".join(lines)

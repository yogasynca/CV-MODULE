"""
Unit tests for YogaSync Angle Calculator Module (Step 5)
"""

import math
import unittest

from pose.angle_calculator import JointAngleCalculator, JointAngles, calculate_angle
from pose.landmark_extractor import LandmarkExtractor, LandmarkPoint, PoseLandmarks


class TestAngleCalculator(unittest.TestCase):
    """Test suite for vector-based 2D angle calculations."""

    def test_90_degree_angle(self):
        """Test standard perpendicular angle (90 degrees)."""
        point_a = (0, 1)
        point_b = (0, 0)
        point_c = (1, 0)
        angle = calculate_angle(point_a, point_b, point_c)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 90.0, places=1)

    def test_straight_line_180_degree(self):
        """Test straight line collinear points (180 degrees)."""
        point_a = (-1, 0)
        point_b = (0, 0)
        point_c = (1, 0)
        angle = calculate_angle(point_a, point_b, point_c)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 180.0, places=1)

    def test_45_degree_angle(self):
        """Test 45-degree acute angle."""
        point_a = (1, 1)
        point_b = (0, 0)
        point_c = (1, 0)
        angle = calculate_angle(point_a, point_b, point_c)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 45.0, places=1)

    def test_acute_and_obtuse_angles(self):
        """Test 30-degree and 120-degree angles."""
        # 30 degrees: point A along x-axis, point C at (cos(30), sin(30))
        pt_b = (0, 0)
        pt_a = (1, 0)
        pt_c = (math.cos(math.radians(30)), math.sin(math.radians(30)))
        angle_30 = calculate_angle(pt_a, pt_b, pt_c)
        self.assertIsNotNone(angle_30)
        self.assertAlmostEqual(angle_30, 30.0, places=1)

        # 120 degrees
        pt_c_120 = (math.cos(math.radians(120)), math.sin(math.radians(120)))
        angle_120 = calculate_angle(pt_a, pt_b, pt_c_120)
        self.assertIsNotNone(angle_120)
        self.assertAlmostEqual(angle_120, 120.0, places=1)

    def test_zero_degree_coincident_rays(self):
        """Test 0-degree angle when rays overlap."""
        point_a = (1, 0)
        point_b = (0, 0)
        point_c = (2, 0)
        angle = calculate_angle(point_a, point_b, point_c)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 0.0, places=1)

    def test_zero_length_vector(self):
        """Test zero-length vector (point B equals point A or C)."""
        # Point A == Point B
        self.assertIsNone(calculate_angle((0, 0), (0, 0), (1, 0)))
        # Point C == Point B
        self.assertIsNone(calculate_angle((1, 0), (0, 0), (0, 0)))
        # All three points identical
        self.assertIsNone(calculate_angle((5, 5), (5, 5), (5, 5)))

    def test_invalid_and_missing_inputs(self):
        """Test handling of None and corrupted inputs."""
        self.assertIsNone(calculate_angle(None, (0, 0), (1, 0)))
        self.assertIsNone(calculate_angle((1, 0), None, (1, 0)))
        self.assertIsNone(calculate_angle((1, 0), (0, 0), None))
        self.assertIsNone(calculate_angle([], (0, 0), (1, 0)))
        self.assertIsNone(calculate_angle(("invalid", 0), (0, 0), (1, 0)))

    def test_landmark_point_integration(self):
        """Test calculate_angle using LandmarkPoint objects."""
        lp_a = LandmarkPoint(name="a", x=0.0, y=1.0, z=0.0, visibility=0.9, is_reliable=True)
        lp_b = LandmarkPoint(name="b", x=0.0, y=0.0, z=0.0, visibility=0.95, is_reliable=True)
        lp_c = LandmarkPoint(name="c", x=1.0, y=0.0, z=0.0, visibility=0.88, is_reliable=True)

        angle = calculate_angle(lp_a, lp_b, lp_c)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 90.0, places=1)

    def test_unreliable_landmark_point(self):
        """Test that low-visibility / unreliable landmarks return None."""
        lp_a = LandmarkPoint(name="a", x=0.0, y=1.0, z=0.0, visibility=0.2, is_reliable=False)
        lp_b = LandmarkPoint(name="b", x=0.0, y=0.0, z=0.0, visibility=0.95, is_reliable=True)
        lp_c = LandmarkPoint(name="c", x=1.0, y=0.0, z=0.0, visibility=0.88, is_reliable=True)

        angle = calculate_angle(lp_a, lp_b, lp_c)
        self.assertIsNone(angle)


class TestJointAngleCalculator(unittest.TestCase):
    """Test suite for full JointAngleCalculator integration."""

    def setUp(self):
        self.calculator = JointAngleCalculator()

    def test_calculate_all_joints_synthetic_pose(self):
        """Test calculation of all 10 standard joints with a complete synthetic pose."""
        # Create mock landmarks representing a T-pose / standing pose
        raw_lms = {
            "left_shoulder": LandmarkPoint("left_shoulder", 0.6, 0.3, 0.0, 0.95, is_reliable=True),
            "right_shoulder": LandmarkPoint("right_shoulder", 0.4, 0.3, 0.0, 0.95, is_reliable=True),
            "left_elbow": LandmarkPoint("left_elbow", 0.8, 0.3, 0.0, 0.95, is_reliable=True),
            "right_elbow": LandmarkPoint("right_elbow", 0.2, 0.3, 0.0, 0.95, is_reliable=True),
            "left_wrist": LandmarkPoint("left_wrist", 0.8, 0.5, 0.0, 0.95, is_reliable=True),
            "right_wrist": LandmarkPoint("right_wrist", 0.2, 0.5, 0.0, 0.95, is_reliable=True),
            "left_hip": LandmarkPoint("left_hip", 0.6, 0.6, 0.0, 0.95, is_reliable=True),
            "right_hip": LandmarkPoint("right_hip", 0.4, 0.6, 0.0, 0.95, is_reliable=True),
            "left_knee": LandmarkPoint("left_knee", 0.6, 0.8, 0.0, 0.95, is_reliable=True),
            "right_knee": LandmarkPoint("right_knee", 0.4, 0.8, 0.0, 0.95, is_reliable=True),
            "left_ankle": LandmarkPoint("left_ankle", 0.6, 1.0, 0.0, 0.95, is_reliable=True),
            "right_ankle": LandmarkPoint("right_ankle", 0.4, 1.0, 0.0, 0.95, is_reliable=True),
            "left_foot_index": LandmarkPoint("left_foot_index", 0.65, 1.0, 0.0, 0.95, is_reliable=True),
            "right_foot_index": LandmarkPoint("right_foot_index", 0.35, 1.0, 0.0, 0.95, is_reliable=True),
        }
        pose_landmarks = PoseLandmarks(landmarks=raw_lms, min_visibility=0.5)

        joint_angles = self.calculator.calculate(pose_landmarks)
        self.assertIsNotNone(joint_angles)
        self.assertEqual(joint_angles.total_count, 10)
        self.assertEqual(joint_angles.valid_count, 10)

        # Left elbow: (0.6, 0.3) -> (0.8, 0.3) -> (0.8, 0.5) -> perpendicular 90 deg
        self.assertAlmostEqual(joint_angles.left_elbow, 90.0, places=1)
        # Left knee: (0.6, 0.6) -> (0.6, 0.8) -> (0.6, 1.0) -> straight 180 deg
        self.assertAlmostEqual(joint_angles.left_knee, 180.0, places=1)
        # Left hip: (0.6, 0.3) -> (0.6, 0.6) -> (0.6, 0.8) -> straight 180 deg
        self.assertAlmostEqual(joint_angles.left_hip, 180.0, places=1)
        # Left ankle: (0.6, 0.8) -> (0.6, 1.0) -> (0.65, 1.0) -> 90 deg
        self.assertAlmostEqual(joint_angles.left_ankle, 90.0, places=1)

        # Dot notation & subscript access
        self.assertEqual(joint_angles.left_elbow, joint_angles["left_elbow"])

    def test_missing_or_unreliable_joint_landmarks(self):
        """Test that missing or unreliable landmarks result in None for affected joints."""
        raw_lms = {
            "left_shoulder": LandmarkPoint("left_shoulder", 0.6, 0.3, 0.0, 0.95, is_reliable=True),
            "left_elbow": LandmarkPoint("left_elbow", 0.8, 0.3, 0.0, 0.95, is_reliable=True),
            # left_wrist is unreliable (< 0.5)
            "left_wrist": LandmarkPoint("left_wrist", 0.8, 0.5, 0.0, 0.1, is_reliable=False),
        }
        pose_landmarks = PoseLandmarks(landmarks=raw_lms, min_visibility=0.5)

        joint_angles = self.calculator.calculate(pose_landmarks)
        self.assertIsNotNone(joint_angles)
        self.assertIsNone(joint_angles.left_elbow)
        self.assertIsNone(joint_angles.right_elbow)


if __name__ == "__main__":
    unittest.main()

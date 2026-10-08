"""
YogaSync - Step 6: Dataset Metadata & Schema Definitions

Defines canonical yoga pose classes, dataset schemas, sample records,
and manifest persistence for the YogaSync AI pipeline.
"""

import json
import os
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Schema & Dataset Version Constants
DATASET_SCHEMA_VERSION = "0.1"
DATASET_VERSION = "0.1.0"

# Default Directory Paths
DEFAULT_RAW_DIR = os.path.join("ai", "data", "raw")
DEFAULT_PROCESSED_DIR = os.path.join("ai", "data", "processed")
DEFAULT_METADATA_DIR = os.path.join("ai", "data", "metadata")
SAMPLES_JSONL_PATH = os.path.join(DEFAULT_PROCESSED_DIR, "samples.jsonl")
MANIFEST_PATH = os.path.join(DEFAULT_METADATA_DIR, "dataset_manifest.json")

# Initial Canonical Yoga Pose Classes (Step 6)
SUPPORTED_POSES: Dict[str, Dict[str, str]] = {
    "tadasana": {
        "display_name": "Tadasana (Mountain Pose)",
        "sanskrit_name": "Tāḍāsana",
        "category": "standing",
        "description": "Foundational standing pose with straight spine, grounded feet, and aligned joints.",
    },
    "tree_pose": {
        "display_name": "Tree Pose (Vrikshasana)",
        "sanskrit_name": "Vṛkṣāsana",
        "category": "balancing",
        "description": "Single-leg balance with one foot placed on inner thigh/calf and hands in prayer or raised.",
    },
    "warrior_2": {
        "display_name": "Warrior II (Virabhadrasana II)",
        "sanskrit_name": "Vīrabhadrāsana II",
        "category": "standing",
        "description": "Lunge stance with front knee bent at 90°, back leg straight, and arms extended parallel to floor.",
    },
    "downward_dog": {
        "display_name": "Downward-Facing Dog (Adho Mukha Svanasana)",
        "sanskrit_name": "Adho Mukha Śvānāsana",
        "category": "inversion",
        "description": "Inverted V-shape pose with hands and feet grounded and hips lifted high.",
    },
    "chair_pose": {
        "display_name": "Chair Pose (Utkatasana)",
        "sanskrit_name": "Utkaṭāsana",
        "category": "standing",
        "description": "Squat-like standing pose with knees bent, hips lowered, and arms reached upwards.",
    },
}


def is_supported_pose(pose_name: str) -> bool:
    """Check whether a pose ID is in the supported canonical registry."""
    return pose_name.lower().strip() in SUPPORTED_POSES


def generate_sample_id(pose: str, prefix: str = "sample") -> str:
    """Generate a unique, readable sample identifier with UTC timestamp."""
    utc_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    short_uuid = uuid.uuid4().hex[:6]
    return f"{prefix}_{pose}_{utc_str}_{short_uuid}"


@dataclass
class DatasetRecord:
    """
    Structured container representing an individual dataset sample for AI training.
    """
    sample_id: str
    pose: str
    source_type: str  # e.g., 'webcam', 'image', 'video', 'synthetic'
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    schema_version: str = DATASET_SCHEMA_VERSION
    session_id: Optional[str] = None
    validation_status: str = "VALID"  # 'VALID', 'QUESTIONABLE', 'INVALID'
    validation_reasons: List[str] = field(default_factory=list)
    landmarks: Dict[str, Dict[str, float]] = field(default_factory=dict)
    normalized_landmarks: Dict[str, Dict[str, float]] = field(default_factory=dict)
    angles: Dict[str, Optional[float]] = field(default_factory=dict)
    visibility: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize sample record to a JSON-serializable dictionary."""
        return {
            "schema_version": self.schema_version,
            "sample_id": self.sample_id,
            "pose": self.pose,
            "source_type": self.source_type,
            "timestamp": self.timestamp,
            "session_id": self.session_id,
            "validation_status": self.validation_status,
            "validation_reasons": self.validation_reasons,
            "landmarks": self.landmarks,
            "normalized_landmarks": self.normalized_landmarks,
            "angles": self.angles,
            "visibility": self.visibility,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DatasetRecord":
        """Reconstruct a DatasetRecord from a dictionary."""
        return cls(
            sample_id=data.get("sample_id", ""),
            pose=data.get("pose", ""),
            source_type=data.get("source_type", "unknown"),
            timestamp=data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            schema_version=data.get("schema_version", DATASET_SCHEMA_VERSION),
            session_id=data.get("session_id"),
            validation_status=data.get("validation_status", "VALID"),
            validation_reasons=data.get("validation_reasons", []),
            landmarks=data.get("landmarks", {}),
            normalized_landmarks=data.get("normalized_landmarks", {}),
            angles=data.get("angles", {}),
            visibility=data.get("visibility", {}),
        )


@dataclass
class DatasetManifest:
    """
    Metadata manifest tracking the dataset state, statistics, and class counts.
    """
    dataset_version: str = DATASET_VERSION
    schema_version: str = DATASET_SCHEMA_VERSION
    creation_date: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_updated: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    poses: List[str] = field(default_factory=lambda: list(SUPPORTED_POSES.keys()))
    total_samples: int = 0
    valid_samples: int = 0
    questionable_samples: int = 0
    invalid_samples: int = 0
    pose_counts: Dict[str, int] = field(default_factory=lambda: {k: 0 for k in SUPPORTED_POSES.keys()})
    sources: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DatasetManifest":
        return cls(
            dataset_version=data.get("dataset_version", DATASET_VERSION),
            schema_version=data.get("schema_version", DATASET_SCHEMA_VERSION),
            creation_date=data.get("creation_date", datetime.now(timezone.utc).isoformat()),
            last_updated=data.get("last_updated", datetime.now(timezone.utc).isoformat()),
            poses=data.get("poses", list(SUPPORTED_POSES.keys())),
            total_samples=data.get("total_samples", 0),
            valid_samples=data.get("valid_samples", 0),
            questionable_samples=data.get("questionable_samples", 0),
            invalid_samples=data.get("invalid_samples", 0),
            pose_counts=data.get("pose_counts", {k: 0 for k in SUPPORTED_POSES.keys()}),
            sources=data.get("sources", {}),
        )

    def save(self, filepath: str) -> None:
        """Save manifest to JSON file."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        self.last_updated = datetime.now(timezone.utc).isoformat()
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "DatasetManifest":
        """Load manifest from JSON file or return a new empty manifest if absent."""
        if not os.path.exists(filepath):
            return cls()
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)

"""
YogaSync - Step 6: Dataset Summary & Split Utility

Inspects the dataset manifest and records, printing a formatted breakdown
of sample distributions, quality statuses, and train/val/test split allocations.
"""

import argparse
import json
import os
import random
from typing import Dict, List, Optional, Tuple

from .metadata import (
    DEFAULT_METADATA_DIR,
    DEFAULT_PROCESSED_DIR,
    MANIFEST_PATH,
    SAMPLES_JSONL_PATH,
    SUPPORTED_POSES,
    DatasetManifest,
    DatasetRecord,
)


def print_dataset_summary(
    samples_file: str = SAMPLES_JSONL_PATH,
    manifest_file: str = MANIFEST_PATH,
) -> None:
    """
    Print a clean, formatted report of the dataset status and pose distributions.
    """
    manifest = DatasetManifest.load(manifest_file)
    records: List[DatasetRecord] = []

    if os.path.exists(samples_file):
        with open(samples_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(DatasetRecord.from_dict(json.loads(line)))
                    except Exception:
                        pass

    total = len(records)
    valid = sum(1 for r in records if r.validation_status == "VALID")
    questionable = sum(1 for r in records if r.validation_status == "QUESTIONABLE")
    invalid = sum(1 for r in records if r.validation_status == "INVALID")

    # Group counts by pose and quality
    pose_stats: Dict[str, Dict[str, int]] = {
        k: {"total": 0, "valid": 0, "questionable": 0, "invalid": 0}
        for k in SUPPORTED_POSES.keys()
    }

    for r in records:
        if r.pose not in pose_stats:
            pose_stats[r.pose] = {"total": 0, "valid": 0, "questionable": 0, "invalid": 0}
        pose_stats[r.pose]["total"] += 1
        st = r.validation_status.lower()
        if st in pose_stats[r.pose]:
            pose_stats[r.pose][st] += 1

    print("\n==================================================================")
    print("                 YOGASYNC AI DATASET SUMMARY v0.1                 ")
    print("==================================================================")
    print(f" Dataset Version : {manifest.dataset_version}")
    print(f" Schema Version  : {manifest.schema_version}")
    print(f" Manifest Path   : {manifest_file}")
    print(f" Processed Path  : {samples_file}")
    print("------------------------------------------------------------------")
    print(f" {'Pose Class':<22} | {'Total':<6} | {'Valid':<6} | {'Questionable':<12} | {'Invalid':<6}")
    print("------------------------------------------------------------------")

    for pose_key, info in SUPPORTED_POSES.items():
        disp_name = info["display_name"].split(" (")[0]  # Short name
        stats = pose_stats.get(pose_key, {"total": 0, "valid": 0, "questionable": 0, "invalid": 0})
        print(
            f" {disp_name:<22} | {stats['total']:<6} | {stats['valid']:<6} | "
            f"{stats['questionable']:<12} | {stats['invalid']:<6}"
        )

    print("------------------------------------------------------------------")
    print(f" TOTAL SAMPLES   : {total}")
    print(f"   [+] Valid Samples        : {valid} ({(valid/total*100) if total else 0:.1f}%)")
    print(f"   [?] Questionable Samples : {questionable} ({(questionable/total*100) if total else 0:.1f}%)")
    print(f"   [-] Invalid Samples      : {invalid} ({(invalid/total*100) if total else 0:.1f}%)")
    print("==================================================================\n")


def compute_dataset_splits(
    records: List[DatasetRecord],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
    group_by_session: bool = True,
) -> Dict[str, List[DatasetRecord]]:
    """
    Partition dataset records into Train, Validation, and Test subsets.
    
    IMPORTANT: If group_by_session is True, frames from the same session_id
    are strictly isolated into the same split to avoid data leakage.
    """
    valid_records = [r for r in records if r.validation_status == "VALID"]
    rng = random.Random(seed)

    if group_by_session:
        # Group by (pose, session_id)
        sessions: Dict[str, List[DatasetRecord]] = {}
        for r in valid_records:
            sess_key = f"{r.pose}_{r.session_id or r.sample_id}"
            if sess_key not in sessions:
                sessions[sess_key] = []
            sessions[sess_key].append(r)

        session_keys = list(sessions.keys())
        rng.shuffle(session_keys)

        n_total = len(session_keys)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)

        train_keys = set(session_keys[:n_train])
        val_keys = set(session_keys[n_train : n_train + n_val])
        test_keys = set(session_keys[n_train + n_val :])

        train_set = [r for k in train_keys for r in sessions[k]]
        val_set = [r for k in val_keys for r in sessions[k]]
        test_set = [r for k in test_keys for r in sessions[k]]
    else:
        shuffled = list(valid_records)
        rng.shuffle(shuffled)
        n_total = len(shuffled)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)

        train_set = shuffled[:n_train]
        val_set = shuffled[n_train : n_train + n_val]
        test_set = shuffled[n_train + n_val :]

    return {
        "train": train_set,
        "val": val_set,
        "test": test_set,
    }


def main():
    parser = argparse.ArgumentParser(description="YogaSync Dataset Summary CLI")
    parser.add_argument(
        "--samples-path",
        type=str,
        default=SAMPLES_JSONL_PATH,
        help="Path to samples.jsonl file",
    )
    parser.add_argument(
        "--manifest-path",
        type=str,
        default=MANIFEST_PATH,
        help="Path to dataset_manifest.json file",
    )
    args = parser.parse_args()

    print_dataset_summary(
        samples_file=args.samples_path,
        manifest_file=args.manifest_path,
    )


if __name__ == "__main__":
    main()

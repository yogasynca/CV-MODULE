import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;

export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (typeof window === "undefined") return null;
  if (poseLandmarkerInstance) return poseLandmarkerInstance;
  if (isInitializing) {
    // Wait for in-flight initialization
    let attempts = 0;
    while (isInitializing && attempts < 30) {
      await new Promise((r) => setTimeout(r, 150));
      if (poseLandmarkerInstance) return poseLandmarkerInstance;
      attempts++;
    }
  }

  try {
    isInitializing = true;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return poseLandmarkerInstance;
  } catch (err) {
    console.warn("Falling back to CPU delegate for PoseLandmarker:", err);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      });
      return poseLandmarkerInstance;
    } catch (e) {
      console.error("Failed to initialize PoseLandmarker:", e);
      return null;
    }
  } finally {
    isInitializing = false;
  }
}

// MediaPipe 33-point Landmark Index Mapping
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Skeleton Connections
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // Shoulders
  [11, 13], [13, 15], // Left Arm
  [12, 14], [14, 16], // Right Arm
  [11, 23], [12, 24], // Torso
  [23, 24], // Hips
  [23, 25], [25, 27], // Left Leg
  [24, 26], [26, 28], // Right Leg
  [27, 29], [29, 31], [27, 31], // Left Foot
  [28, 30], [30, 32], [28, 32], // Right Foot
];

export interface JointAngle {
  jointName: string;
  angle: number;
  centerPoint: { x: number; y: number };
}

// Vector 2D angle calculator matching Step 5 mathematics
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  const angleRad = Math.acos(cosAngle);
  return Math.round((angleRad * 180) / Math.PI);
}

export function extractJointAngles(landmarks: Array<{ x: number; y: number; visibility?: number }>): JointAngle[] {
  if (!landmarks || landmarks.length < 33) return [];

  const angles: JointAngle[] = [];

  const jointsToCompute = [
    {
      name: "Left Elbow",
      a: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      b: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
      c: landmarks[POSE_LANDMARKS.LEFT_WRIST],
    },
    {
      name: "Right Elbow",
      a: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      b: landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
      c: landmarks[POSE_LANDMARKS.RIGHT_WRIST],
    },
    {
      name: "Left Shoulder",
      a: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
      b: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      c: landmarks[POSE_LANDMARKS.LEFT_HIP],
    },
    {
      name: "Right Shoulder",
      a: landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
      b: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      c: landmarks[POSE_LANDMARKS.RIGHT_HIP],
    },
    {
      name: "Left Hip",
      a: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      b: landmarks[POSE_LANDMARKS.LEFT_HIP],
      c: landmarks[POSE_LANDMARKS.LEFT_KNEE],
    },
    {
      name: "Right Hip",
      a: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      b: landmarks[POSE_LANDMARKS.RIGHT_HIP],
      c: landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    },
    {
      name: "Left Knee",
      a: landmarks[POSE_LANDMARKS.LEFT_HIP],
      b: landmarks[POSE_LANDMARKS.LEFT_KNEE],
      c: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
    },
    {
      name: "Right Knee",
      a: landmarks[POSE_LANDMARKS.RIGHT_HIP],
      b: landmarks[POSE_LANDMARKS.RIGHT_KNEE],
      c: landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
    },
  ];

  for (const j of jointsToCompute) {
    if (j.a && j.b && j.c) {
      const angle = calculateAngle(j.a, j.b, j.c);
      angles.push({
        jointName: j.name,
        angle,
        centerPoint: { x: j.b.x, y: j.b.y },
      });
    }
  }

  return angles;
}

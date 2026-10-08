export type UserRole = "admin" | "reviewer" | "contributor";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type FileType = "image" | "video";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Pose {
  id: string;
  name: string;
  display_name: string;
  sanskrit_name: string;
  category: string;
  description: string;
  target_samples: number;
  created_at?: string;
}

export interface DatasetSample {
  id: string;
  pose_id: string;
  contributor_id: string;
  contributor_name?: string;
  contributor_email?: string;
  file_name: string;
  file_type: FileType;
  file_size: number;
  mime_type?: string;
  storage_path: string;
  gdrive_file_id?: string;
  gdrive_web_view_link?: string;
  preview_url?: string;
  dataset_version: string;
  review_status: ReviewStatus;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_name?: string;
}

export interface DatasetStats {
  total_samples: number;
  total_images: number;
  total_videos: number;
  total_approved: number;
  total_pending: number;
  total_rejected: number;
  total_contributors: number;
  storage_used_bytes: number;
  pose_breakdown: Record<
    string,
    {
      pose_id: string;
      display_name: string;
      sanskrit_name: string;
      category: string;
      total: number;
      images: number;
      videos: number;
      approved: number;
      pending: number;
      rejected: number;
      target: number;
    }
  >;
}

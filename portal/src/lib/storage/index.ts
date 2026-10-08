import { DatasetSample, DatasetStats, Pose } from "@/types";
import { INITIAL_DEMO_SAMPLES, INITIAL_POSES } from "@/lib/constants";
import { createServerSupabaseClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { isGoogleDriveConfigured, uploadToGoogleDrive } from "./google-drive";

// In-Memory store for when Supabase credentials are pending during development
let memorySamples: DatasetSample[] = [...INITIAL_DEMO_SAMPLES];

export interface SaveSampleInput {
  pose_id: string;
  contributor_id: string;
  contributor_name?: string;
  contributor_email?: string;
  file_name: string;
  file_type: "image" | "video";
  file_size: number;
  mime_type?: string;
  storage_path: string;
  gdrive_file_id?: string;
  gdrive_web_view_link?: string;
  preview_url?: string;
  dataset_version?: string;
  notes?: string;
}

/**
 * Save an uploaded sample into Supabase or fallback memory store.
 */
export async function saveDatasetSample(input: SaveSampleInput): Promise<DatasetSample> {
  const supabase = createServerSupabaseClient();

  const newSample: DatasetSample = {
    id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    pose_id: input.pose_id,
    contributor_id: input.contributor_id,
    contributor_name: input.contributor_name || "Team Member",
    contributor_email: input.contributor_email || "contributor@yogasync.ai",
    file_name: input.file_name,
    file_type: input.file_type,
    file_size: input.file_size,
    mime_type: input.mime_type,
    storage_path: input.storage_path,
    gdrive_file_id: input.gdrive_file_id,
    gdrive_web_view_link: input.gdrive_web_view_link,
    preview_url: input.preview_url,
    dataset_version: input.dataset_version || "0.1",
    review_status: "PENDING",
    notes: input.notes,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("dataset_samples")
        .insert({
          pose_id: newSample.pose_id,
          contributor_id: newSample.contributor_id,
          file_name: newSample.file_name,
          file_type: newSample.file_type,
          file_size: newSample.file_size,
          mime_type: newSample.mime_type,
          storage_path: newSample.storage_path,
          gdrive_file_id: newSample.gdrive_file_id,
          gdrive_web_view_link: newSample.gdrive_web_view_link,
          dataset_version: newSample.dataset_version,
          review_status: newSample.review_status,
          notes: newSample.notes,
        })
        .select()
        .single();

      if (error) {
        console.warn("[STORAGE] Supabase insert failed, storing in memory:", error.message);
        memorySamples.unshift(newSample);
        return newSample;
      }
      return data as DatasetSample;
    } catch (err) {
      console.warn("[STORAGE] Supabase exception, fallback to memory:", err);
      memorySamples.unshift(newSample);
      return newSample;
    }
  }

  // Local fallback
  memorySamples.unshift(newSample);
  return newSample;
}

/**
 * Get all samples with optional filters.
 */
export async function getDatasetSamples(filters?: {
  pose_id?: string;
  contributor_id?: string;
  review_status?: string;
  file_type?: string;
}): Promise<DatasetSample[]> {
  const supabase = createServerSupabaseClient();

  if (supabase) {
    try {
      let query = supabase
        .from("dataset_samples")
        .select("*, profiles:contributor_id(full_name, email)")
        .order("created_at", { ascending: false });

      if (filters?.pose_id) query = query.eq("pose_id", filters.pose_id);
      if (filters?.contributor_id) query = query.eq("contributor_id", filters.contributor_id);
      if (filters?.review_status) query = query.eq("review_status", filters.review_status);
      if (filters?.file_type) query = query.eq("file_type", filters.file_type);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          contributor_name: item.profiles?.full_name || "Team Member",
          contributor_email: item.profiles?.email || "",
        }));
      }
    } catch (err) {
      console.warn("[STORAGE] Supabase read exception, using local memory:", err);
    }
  }

  // Filter memory store
  return memorySamples.filter((sample) => {
    if (filters?.pose_id && sample.pose_id !== filters.pose_id) return false;
    if (filters?.contributor_id && sample.contributor_id !== filters.contributor_id) return false;
    if (filters?.review_status && sample.review_status !== filters.review_status) return false;
    if (filters?.file_type && sample.file_type !== filters.file_type) return false;
    return true;
  });
}

/**
 * Update review status of a dataset sample.
 */
export async function updateSampleReview(
  sampleId: string,
  status: "APPROVED" | "REJECTED",
  reviewerId: string,
  reviewerName?: string,
  rejectionReason?: string
): Promise<DatasetSample | null> {
  const supabase = createServerSupabaseClient();
  const reviewedAt = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("dataset_samples")
        .update({
          review_status: status,
          reviewed_by: reviewerId,
          reviewed_at: reviewedAt,
          rejection_reason: status === "REJECTED" ? rejectionReason : null,
        })
        .eq("id", sampleId)
        .select()
        .single();

      if (!error && data) {
        return data as DatasetSample;
      }
    } catch (err) {
      console.warn("[STORAGE] Supabase update review failed:", err);
    }
  }

  // Memory fallback
  const idx = memorySamples.findIndex((s) => s.id === sampleId);
  if (idx !== -1) {
    memorySamples[idx] = {
      ...memorySamples[idx],
      review_status: status,
      reviewed_by: reviewerId,
      reviewer_name: reviewerName || "Reviewer",
      reviewed_at: reviewedAt,
      rejection_reason: status === "REJECTED" ? rejectionReason : undefined,
    };
    return memorySamples[idx];
  }
  return null;
}

/**
 * Compute aggregated dataset statistics.
 */
export async function getDatasetStats(): Promise<DatasetStats> {
  const samples = await getDatasetSamples();

  const stats: DatasetStats = {
    total_samples: samples.length,
    total_images: samples.filter((s) => s.file_type === "image").length,
    total_videos: samples.filter((s) => s.file_type === "video").length,
    total_approved: samples.filter((s) => s.review_status === "APPROVED").length,
    total_pending: samples.filter((s) => s.review_status === "PENDING").length,
    total_rejected: samples.filter((s) => s.review_status === "REJECTED").length,
    total_contributors: new Set(samples.map((s) => s.contributor_id)).size,
    storage_used_bytes: samples.reduce((acc, s) => acc + (s.file_size || 0), 0),
    pose_breakdown: {},
  };

  INITIAL_POSES.forEach((pose) => {
    const poseSamples = samples.filter((s) => s.pose_id === pose.id);
    stats.pose_breakdown[pose.id] = {
      pose_id: pose.id,
      display_name: pose.display_name,
      sanskrit_name: pose.sanskrit_name,
      category: pose.category,
      total: poseSamples.length,
      images: poseSamples.filter((s) => s.file_type === "image").length,
      videos: poseSamples.filter((s) => s.file_type === "video").length,
      approved: poseSamples.filter((s) => s.review_status === "APPROVED").length,
      pending: poseSamples.filter((s) => s.review_status === "PENDING").length,
      rejected: poseSamples.filter((s) => s.review_status === "REJECTED").length,
      target: pose.target_samples,
    };
  });

  return stats;
}

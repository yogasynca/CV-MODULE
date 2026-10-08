-- ==============================================================================
-- YogaSync AI Dataset Portal - Supabase Database Schema & RLS Policies (v0.1)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'contributor')) DEFAULT 'contributor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Yoga Poses / Asanas Table (Canonical 8 Poses)
CREATE TABLE IF NOT EXISTS public.poses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    sanskrit_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    target_samples INTEGER NOT NULL DEFAULT 400,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Dataset Samples Table
CREATE TABLE IF NOT EXISTS public.dataset_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pose_id TEXT NOT NULL REFERENCES public.poses(id) ON DELETE RESTRICT,
    contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    gdrive_file_id TEXT,
    gdrive_web_view_link TEXT,
    dataset_version TEXT NOT NULL DEFAULT '0.1',
    review_status TEXT NOT NULL CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 5. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_dataset_samples_pose_id ON public.dataset_samples(pose_id);
CREATE INDEX IF NOT EXISTS idx_dataset_samples_contributor_id ON public.dataset_samples(contributor_id);
CREATE INDEX IF NOT EXISTS idx_dataset_samples_review_status ON public.dataset_samples(review_status);
CREATE INDEX IF NOT EXISTS idx_dataset_samples_created_at ON public.dataset_samples(created_at DESC);

-- 6. Seed Initial 8 Yoga Poses
INSERT INTO public.poses (id, name, display_name, sanskrit_name, category, description, target_samples)
VALUES
    ('tadasana', 'Tadasana', 'Mountain Pose', 'Tāḍāsana', 'Standing', 'Foundational standing posture with aligned joints, grounded feet, and erect spine.', 400),
    ('downward_dog', 'Adho Mukha Svanasana', 'Downward-Facing Dog', 'Adho Mukha Śvānāsana', 'Inversion', 'Inverted V-shape pose stretching the hamstrings, calves, and shoulders while strengthening arms and legs.', 400),
    ('child_pose', 'Shishuasana', 'Child''s Pose', 'Śiśuāsana / Bālāsana', 'Restorative', 'Resting kneeling pose with torso draped forward over thighs, arms extended or by sides, releasing spine tension.', 400),
    ('cat_cow', 'Marjariasana', 'Cat-Cow Pose', 'Mārjāryāsana / Biḍālāsana', 'Spinal Flow', 'Gentle dynamic flow moving between arched spine (cow) and rounded spine (cat) synchronized with breath.', 400),
    ('warrior_1', 'Virabhadrasana I', 'Warrior I', 'Vīrabhadrāsana I', 'Standing Lunge', 'Dynamic high lunge with front knee bent at 90°, chest open forward, and arms stretched overhead.', 400),
    ('triangle', 'Trikonasana', 'Triangle Pose', 'Trikoṇāsana', 'Standing Lateral', 'Standing pose with wide legs, lateral spine extension, one hand resting on shin/floor, and opposite arm pointed skyward.', 400),
    ('tree_pose', 'Vrikshasana', 'Tree Pose', 'Vṛkṣāsana', 'Balancing', 'Unilateral balance pose with one foot rooted and opposite sole placed on inner thigh or calf with hands in prayer.', 400),
    ('cobra', 'Bhujangasana', 'Cobra Pose', 'Bhujaṅgāsana', 'Backbend', 'Prone backbend lifting the chest and head with shoulders drawn back, opening the heart and strengthening the spine.', 400)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    sanskrit_name = EXCLUDED.sanskrit_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- 7. Trigger to automatically create profile on Auth User signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'contributor')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_samples ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checking in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_reviewer_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('reviewer', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 9. RLS Policies: profiles
CREATE POLICY "Public read for authenticated users on profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own basic profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Regular contributors cannot self-elevate role to admin/reviewer
        AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
    );

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 10. RLS Policies: poses
CREATE POLICY "Authenticated users can view all poses"
    ON public.poses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage poses"
    ON public.poses FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 11. RLS Policies: dataset_samples
CREATE POLICY "Contributors can view own samples"
    ON public.dataset_samples FOR SELECT
    TO authenticated
    USING (
        contributor_id = auth.uid()
        OR public.is_reviewer_or_admin()
    );

CREATE POLICY "Contributors can insert own samples"
    ON public.dataset_samples FOR INSERT
    TO authenticated
    WITH CHECK (
        contributor_id = auth.uid()
    );

CREATE POLICY "Contributors can update own PENDING samples only"
    ON public.dataset_samples FOR UPDATE
    TO authenticated
    USING (
        (contributor_id = auth.uid() AND review_status = 'PENDING')
        OR public.is_reviewer_or_admin()
    )
    WITH CHECK (
        (contributor_id = auth.uid() AND review_status = 'PENDING')
        OR public.is_reviewer_or_admin()
    );

CREATE POLICY "Reviewers and admins can review samples"
    ON public.dataset_samples FOR UPDATE
    TO authenticated
    USING (public.is_reviewer_or_admin())
    WITH CHECK (public.is_reviewer_or_admin());

CREATE POLICY "Admins can delete samples"
    ON public.dataset_samples FOR DELETE
    TO authenticated
    USING (public.is_admin());

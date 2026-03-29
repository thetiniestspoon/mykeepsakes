-- ============================================
-- Picopets Schema Migration (consolidated)
-- Source: creative-critter-studio/supabase/migrations/
-- 73 migration files merged into one
-- Target: Family Supabase (MyKeepsakes base)
-- Date: 2026-03-27
-- ============================================


-- ---- migration: 20260116042855_3306042b-69ea-4884-b1aa-5283cfce277b.sql ----

-- =============================================
-- PICOPETS DATABASE SCHEMA
-- Task & Reward App with Pet Companion System
-- =============================================

-- 1. ENUMS
-- =============================================

-- Membership roles
CREATE TYPE public.membership_role AS ENUM ('parent', 'child');

-- Task / completion states
CREATE TYPE public.task_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE public.task_recurrence AS ENUM ('one_time', 'daily', 'weekly', 'monthly');
CREATE TYPE public.task_instance_status AS ENUM ('open', 'claimed', 'pending_approval', 'approved', 'rejected', 'expired');
CREATE TYPE public.completion_status AS ENUM ('pending', 'approved', 'rejected');

-- Rewards
CREATE TYPE public.reward_type AS ENUM ('physical', 'virtual');
CREATE TYPE public.reward_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE public.redemption_status AS ENUM ('pending', 'fulfilled', 'completed');
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'approved', 'denied', 'modified');

-- Pets
CREATE TYPE public.pet_mood AS ENUM ('happy', 'content', 'playful', 'sleepy', 'excited');
CREATE TYPE public.pet_item_category AS ENUM ('food', 'toy', 'accessory', 'habitat', 'egg');
CREATE TYPE public.pet_interaction_type AS ENUM ('feed', 'play', 'pet', 'accessorize', 'gift');

-- Ledger
CREATE TYPE public.ledger_reason_type AS ENUM (
  'TASK_AWARDED',
  'REWARD_REDEEMED',
  'PET_ITEM_PURCHASED',
  'PARENT_ADJUSTMENT',
  'PARENT_GIFT_BONUS'
);

-- 2. HOUSEHOLDS
-- =============================================

CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES (linked to auth.users)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. HOUSEHOLD MEMBERSHIPS
-- =============================================

CREATE TABLE public.household_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE INDEX idx_memberships_household ON public.household_memberships(household_id);
CREATE INDEX idx_memberships_user ON public.household_memberships(user_id);

ALTER TABLE public.household_memberships ENABLE ROW LEVEL SECURITY;

-- 5. CHILD PROFILES (extension for children)
-- =============================================

CREATE TABLE public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  avatar TEXT,
  settings_json JSONB DEFAULT '{}',
  points_balance_cached INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_user_id, household_id)
);

CREATE INDEX idx_child_profiles_household ON public.child_profiles(household_id);

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

-- 6. TASK DEFINITIONS
-- =============================================

CREATE TABLE public.task_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  default_points INTEGER NOT NULL CHECK (default_points >= 0),
  recurrence public.task_recurrence NOT NULL DEFAULT 'one_time',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  assigned_child_user_id UUID REFERENCES public.profiles(id),
  status public.task_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_definitions_household ON public.task_definitions(household_id);

ALTER TABLE public.task_definitions ENABLE ROW LEVEL SECURITY;

-- 7. TASK INSTANCES
-- =============================================

CREATE TABLE public.task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_definition_id UUID NOT NULL REFERENCES public.task_definitions(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  assigned_child_user_id UUID REFERENCES public.profiles(id),
  points_override INTEGER,
  status public.task_instance_status NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_instances_household ON public.task_instances(household_id);
CREATE INDEX idx_task_instances_child ON public.task_instances(assigned_child_user_id);
CREATE INDEX idx_task_instances_status ON public.task_instances(status);

ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;

-- 8. TASK COMPLETIONS (Mutual Approval)
-- =============================================

CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID NOT NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  points_at_stake INTEGER NOT NULL,
  child_confirmed BOOLEAN NOT NULL DEFAULT false,
  child_confirmed_at TIMESTAMPTZ,
  parent_confirmed BOOLEAN NOT NULL DEFAULT false,
  parent_confirmed_at TIMESTAMPTZ,
  parent_user_id UUID REFERENCES public.profiles(id),
  status public.completion_status NOT NULL DEFAULT 'pending',
  rejection_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_completions_household ON public.task_completions(household_id);
CREATE INDEX idx_task_completions_child ON public.task_completions(child_user_id);
CREATE INDEX idx_task_completions_status ON public.task_completions(status);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- 9. POINT LEDGER ENTRIES (Immutable)
-- =============================================

CREATE TABLE public.point_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  delta_points INTEGER NOT NULL,
  reason_type public.ledger_reason_type NOT NULL,
  source_table TEXT,
  source_id UUID,
  created_by_user_id UUID REFERENCES public.profiles(id),
  balance_after INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id, reason_type)
);

CREATE INDEX idx_ledger_child ON public.point_ledger_entries(child_user_id);
CREATE INDEX idx_ledger_household ON public.point_ledger_entries(household_id);

ALTER TABLE public.point_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 10. REWARDS
-- =============================================

CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
  monetary_value NUMERIC(10,2),
  reward_type public.reward_type NOT NULL DEFAULT 'physical',
  allow_multiple_redemptions BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  image_url TEXT,
  status public.reward_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_household ON public.rewards(household_id);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 11. REWARD REDEMPTIONS
-- =============================================

CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  points_cost INTEGER NOT NULL,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  fulfilled_by_user_id UUID REFERENCES public.profiles(id),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redemptions_household ON public.reward_redemptions(household_id);
CREATE INDEX idx_redemptions_child ON public.reward_redemptions(child_user_id);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- 12. REWARD SUGGESTIONS
-- =============================================

CREATE TABLE public.reward_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  suggested_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  suggested_points INTEGER,
  reward_type public.reward_type NOT NULL DEFAULT 'physical',
  status public.suggestion_status NOT NULL DEFAULT 'pending',
  reviewed_by_user_id UUID REFERENCES public.profiles(id),
  final_points INTEGER,
  denial_reason TEXT,
  created_reward_id UUID REFERENCES public.rewards(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestions_household ON public.reward_suggestions(household_id);

ALTER TABLE public.reward_suggestions ENABLE ROW LEVEL SECURITY;

-- 13. PETS
-- =============================================

CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  traits_json JSONB NOT NULL DEFAULT '{}',
  current_image_url TEXT,
  current_mood public.pet_mood NOT NULL DEFAULT 'content',
  is_dormant BOOLEAN NOT NULL DEFAULT false,
  dormant_since TIMESTAMPTZ,
  evolution_stage INTEGER NOT NULL DEFAULT 1,
  total_points_invested INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  milestones_json JSONB DEFAULT '[]',
  equipped_accessories JSONB DEFAULT '[]',
  habitat_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_household ON public.pets(household_id);
CREATE INDEX idx_pets_child ON public.pets(child_user_id);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- 14. PET ITEMS
-- =============================================

CREATE TABLE public.pet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category public.pet_item_category NOT NULL,
  points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
  image_url TEXT,
  mood_effect public.pet_mood,
  visual_effect TEXT,
  is_equippable BOOLEAN NOT NULL DEFAULT false,
  status public.reward_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_items_household ON public.pet_items(household_id);

ALTER TABLE public.pet_items ENABLE ROW LEVEL SECURITY;

-- 15. PET INTERACTIONS
-- =============================================

CREATE TABLE public.pet_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  interaction_type public.pet_interaction_type NOT NULL,
  item_id UUID REFERENCES public.pet_items(id),
  points_spent INTEGER NOT NULL DEFAULT 0,
  triggered_mood_change BOOLEAN NOT NULL DEFAULT false,
  triggered_milestone BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_interactions_pet ON public.pet_interactions(pet_id);
CREATE INDEX idx_pet_interactions_child ON public.pet_interactions(child_user_id);

ALTER TABLE public.pet_interactions ENABLE ROW LEVEL SECURITY;

-- 16. PET GIFTS (Parent to Child)
-- =============================================

CREATE TABLE public.pet_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id),
  item_id UUID NOT NULL REFERENCES public.pet_items(id),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_gifts_pet ON public.pet_gifts(pet_id);

ALTER TABLE public.pet_gifts ENABLE ROW LEVEL SECURITY;

-- 17. PET IMAGE JOBS (AI Generation Queue)
-- =============================================

CREATE TYPE public.image_job_type AS ENUM ('BASE', 'TRANSFORMATION');
CREATE TYPE public.image_job_status AS ENUM ('queued', 'generating', 'ready', 'failed', 'failed_final');

CREATE TABLE public.pet_image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  job_type public.image_job_type NOT NULL,
  from_stage INTEGER,
  to_stage INTEGER,
  status public.image_job_status NOT NULL DEFAULT 'queued',
  traits_hash TEXT,
  traits_payload_json JSONB,
  model_name TEXT,
  model_version TEXT,
  prompt_template_version TEXT,
  seed TEXT,
  output_image_url TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_image_jobs_pet ON public.pet_image_jobs(pet_id);
CREATE INDEX idx_pet_image_jobs_status ON public.pet_image_jobs(status);

ALTER TABLE public.pet_image_jobs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Profile creation trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_definitions_updated_at BEFORE UPDATE ON public.task_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_instances_updated_at BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_completions_updated_at BEFORE UPDATE ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_suggestions_updated_at BEFORE UPDATE ON public.reward_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_items_updated_at BEFORE UPDATE ON public.pet_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_image_jobs_updated_at BEFORE UPDATE ON public.pet_image_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is a member of a household
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_memberships
    WHERE user_id = _user_id AND household_id = _household_id
  );
$$;

-- Check if user is a parent in a household
CREATE OR REPLACE FUNCTION public.is_household_parent(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_memberships
    WHERE user_id = _user_id AND household_id = _household_id AND role = 'parent'
  );
$$;

-- Check if user is a child in a household
CREATE OR REPLACE FUNCTION public.is_household_child(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_memberships
    WHERE user_id = _user_id AND household_id = _household_id AND role = 'child'
  );
$$;

-- Get user's household IDs
CREATE OR REPLACE FUNCTION public.get_user_households(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.household_memberships WHERE user_id = _user_id;
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view profiles in their households"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_memberships hm1
      JOIN public.household_memberships hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid() AND hm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- HOUSEHOLDS
CREATE POLICY "Members can view their households"
  ON public.households FOR SELECT
  USING (public.is_household_member(auth.uid(), id));

CREATE POLICY "Parents can create households"
  ON public.households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Parents can update their households"
  ON public.households FOR UPDATE
  USING (public.is_household_parent(auth.uid(), id));

-- HOUSEHOLD MEMBERSHIPS
CREATE POLICY "Members can view household memberships"
  ON public.household_memberships FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can manage household memberships"
  ON public.household_memberships FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id) OR user_id = auth.uid());

CREATE POLICY "Parents can update household memberships"
  ON public.household_memberships FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete household memberships"
  ON public.household_memberships FOR DELETE
  USING (public.is_household_parent(auth.uid(), household_id));

-- CHILD PROFILES
CREATE POLICY "Members can view child profiles in their household"
  ON public.child_profiles FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create child profiles"
  ON public.child_profiles FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update child profiles"
  ON public.child_profiles FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

-- TASK DEFINITIONS
CREATE POLICY "Members can view task definitions"
  ON public.task_definitions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create task definitions"
  ON public.task_definitions FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update task definitions"
  ON public.task_definitions FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete task definitions"
  ON public.task_definitions FOR DELETE
  USING (public.is_household_parent(auth.uid(), household_id));

-- TASK INSTANCES
CREATE POLICY "Members can view task instances"
  ON public.task_instances FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create task instances"
  ON public.task_instances FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Members can update task instances"
  ON public.task_instances FOR UPDATE
  USING (public.is_household_member(auth.uid(), household_id));

-- TASK COMPLETIONS
CREATE POLICY "Members can view task completions"
  ON public.task_completions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create task completions"
  ON public.task_completions FOR INSERT
  WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "Members can update task completions"
  ON public.task_completions FOR UPDATE
  USING (
    child_user_id = auth.uid() OR
    public.is_household_parent(auth.uid(), household_id)
  );

-- POINT LEDGER ENTRIES
CREATE POLICY "Members can view ledger entries"
  ON public.point_ledger_entries FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "System can insert ledger entries"
  ON public.point_ledger_entries FOR INSERT
  WITH CHECK (public.is_household_member(auth.uid(), household_id));

-- REWARDS
CREATE POLICY "Members can view rewards"
  ON public.rewards FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update rewards"
  ON public.rewards FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete rewards"
  ON public.rewards FOR DELETE
  USING (public.is_household_parent(auth.uid(), household_id));

-- REWARD REDEMPTIONS
CREATE POLICY "Members can view reward redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create reward redemptions"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "Parents can update reward redemptions"
  ON public.reward_redemptions FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

-- REWARD SUGGESTIONS
CREATE POLICY "Members can view reward suggestions"
  ON public.reward_suggestions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create reward suggestions"
  ON public.reward_suggestions FOR INSERT
  WITH CHECK (suggested_by_user_id = auth.uid());

CREATE POLICY "Parents can update reward suggestions"
  ON public.reward_suggestions FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

-- PETS
CREATE POLICY "Members can view pets"
  ON public.pets FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create pets"
  ON public.pets FOR INSERT
  WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "Children can update their pets"
  ON public.pets FOR UPDATE
  USING (child_user_id = auth.uid() OR public.is_household_parent(auth.uid(), household_id));

-- PET ITEMS
CREATE POLICY "Members can view pet items"
  ON public.pet_items FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can manage pet items"
  ON public.pet_items FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update pet items"
  ON public.pet_items FOR UPDATE
  USING (public.is_household_parent(auth.uid(), household_id));

-- PET INTERACTIONS
CREATE POLICY "Members can view pet interactions"
  ON public.pet_interactions FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create pet interactions"
  ON public.pet_interactions FOR INSERT
  WITH CHECK (child_user_id = auth.uid());

-- PET GIFTS
CREATE POLICY "Members can view pet gifts"
  ON public.pet_gifts FOR SELECT
  USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create pet gifts"
  ON public.pet_gifts FOR INSERT
  WITH CHECK (public.is_household_parent(auth.uid(), household_id));

-- PET IMAGE JOBS
CREATE POLICY "Members can view pet image jobs"
  ON public.pet_image_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_image_jobs.pet_id
      AND public.is_household_member(auth.uid(), p.household_id)
    )
  );

CREATE POLICY "Children can create pet image jobs for their pets"
  ON public.pet_image_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_image_jobs.pet_id AND p.child_user_id = auth.uid()
    )
  );
-- ---- migration: 20260116042919_de37803b-0241-4db8-9b57-6003771bc175.sql ----

-- Fix security warnings

-- 1. Fix update_updated_at_column function search path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all the updated_at triggers
CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_definitions_updated_at BEFORE UPDATE ON public.task_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_instances_updated_at BEFORE UPDATE ON public.task_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_completions_updated_at BEFORE UPDATE ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_suggestions_updated_at BEFORE UPDATE ON public.reward_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_items_updated_at BEFORE UPDATE ON public.pet_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_image_jobs_updated_at BEFORE UPDATE ON public.pet_image_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Fix the overly permissive RLS policy for households INSERT
DROP POLICY IF EXISTS "Parents can create households" ON public.households;

-- Allow authenticated users to create households (they become parents)
CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: The "WITH CHECK (true)" for INSERT on households is intentional
-- because any authenticated user should be able to create a new household.
-- They then become a parent in that household through a separate membership insert.
-- ---- migration: 20260116043958_aa5954e7-9619-4dac-a402-8cd5dd49b814.sql ----

-- Add invite_code to households
ALTER TABLE public.households
ADD COLUMN invite_code TEXT UNIQUE;

-- Create function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate invite code on household creation
CREATE OR REPLACE FUNCTION public.set_household_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep generating until we get a unique code
  LOOP
    NEW.invite_code := generate_invite_code();
    BEGIN
      -- Try to exit loop - if code is unique, we're done
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- Code already exists, generate a new one
      CONTINUE;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_set_household_invite_code
BEFORE INSERT ON public.households
FOR EACH ROW
WHEN (NEW.invite_code IS NULL)
EXECUTE FUNCTION public.set_household_invite_code();

-- Generate invite codes for any existing households without one
UPDATE public.households
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;
-- ---- migration: 20260116045048_9bd95d01-2297-4b96-be6b-6be675ddffa4.sql ----

-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

-- Create permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (true);
-- ---- migration: 20260116045302_59dbc8f0-401c-49f7-8730-963773cc515a.sql ----

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
-- ---- migration: 20260116045433_ac0fb033-3367-446d-a03a-7787e83b6869.sql ----

-- Completely recreate RLS policies for households to force cache refresh
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
DROP POLICY IF EXISTS "Members can view their households" ON public.households;
DROP POLICY IF EXISTS "Parents can update their households" ON public.households;

-- Recreate SELECT policy
CREATE POLICY "Members can view their households"
ON public.households
FOR SELECT
TO public
USING (is_household_member(auth.uid(), id));

-- Recreate INSERT policy - allow any authenticated user to create
CREATE POLICY "Authenticated users can create households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recreate UPDATE policy
CREATE POLICY "Parents can update their households"
ON public.households
FOR UPDATE
TO public
USING (is_household_parent(auth.uid(), id));

-- Force schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
-- ---- migration: 20260116050020_11264eaa-8b3a-4b64-b0e1-9da8b5d66fdd.sql ----

-- Temporarily disable RLS to verify it's the issue
ALTER TABLE public.households DISABLE ROW LEVEL SECURITY;

-- Then re-enable with fresh policies
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
DROP POLICY IF EXISTS "Members can view their households" ON public.households;
DROP POLICY IF EXISTS "Parents can update their households" ON public.households;

-- Recreate with explicit configuration
CREATE POLICY "household_insert_policy"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "household_select_policy"
ON public.households
FOR SELECT
TO authenticated
USING (is_household_member(auth.uid(), id));

CREATE POLICY "household_update_policy"
ON public.households
FOR UPDATE
TO authenticated
USING (is_household_parent(auth.uid(), id));

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
-- ---- migration: 20260116050348_984deb46-de60-480e-a7e5-33734b3b9f4e.sql ----

-- Create a SECURITY DEFINER function for atomic household creation
-- This bypasses RLS to handle the chicken-and-egg problem
CREATE OR REPLACE FUNCTION public.create_household_with_parent(
  p_name TEXT,
  p_user_id UUID
)
RETURNS TABLE(id UUID, name TEXT, invite_code TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Insert household
  INSERT INTO public.households (name)
  VALUES (p_name)
  RETURNING households.id INTO v_household_id;
  
  -- Add creator as parent member
  INSERT INTO public.household_memberships (household_id, user_id, role)
  VALUES (v_household_id, p_user_id, 'parent');
  
  -- Return the created household
  RETURN QUERY
  SELECT h.id, h.name, h.invite_code, h.created_at
  FROM public.households h
  WHERE h.id = v_household_id;
END;
$$;
-- ---- migration: 20260116051048_db3dfe71-c824-4779-94ad-cb932124814a.sql ----

-- Create a SECURITY DEFINER function for atomic child joining
-- This bypasses RLS to handle the chicken-and-egg problem
CREATE OR REPLACE FUNCTION public.join_household_as_child(
  p_invite_code TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  household_id UUID, 
  household_name TEXT, 
  already_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
  v_existing_membership UUID;
BEGIN
  -- Find household by invite code
  SELECT id, name INTO v_household_id, v_household_name
  FROM public.households
  WHERE invite_code = UPPER(TRIM(p_invite_code));
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  
  -- Check if already a member
  SELECT id INTO v_existing_membership
  FROM public.household_memberships
  WHERE household_memberships.household_id = v_household_id
    AND user_id = p_user_id;
  
  IF v_existing_membership IS NOT NULL THEN
    RETURN QUERY SELECT v_household_id, v_household_name, true;
    RETURN;
  END IF;
  
  -- Create membership
  INSERT INTO public.household_memberships (household_id, user_id, role)
  VALUES (v_household_id, p_user_id, 'child');
  
  -- Create child profile
  INSERT INTO public.child_profiles (household_id, child_user_id)
  VALUES (v_household_id, p_user_id);
  
  RETURN QUERY SELECT v_household_id, v_household_name, false;
END;
$$;
-- ---- migration: 20260116052155_28ca96eb-5197-4f1e-8d78-e33f2e3827df.sql ----

-- Create a function to automatically generate task instances for one_time tasks
CREATE OR REPLACE FUNCTION public.auto_create_task_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only auto-create instances for one_time tasks
  -- Recurring tasks will be handled by a scheduled edge function
  IF NEW.recurrence = 'one_time' THEN
    -- Check if an instance already exists (to avoid duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM public.task_instances 
      WHERE task_definition_id = NEW.id
    ) THEN
      INSERT INTO public.task_instances (
        task_definition_id,
        household_id,
        assigned_child_user_id,
        status
      ) VALUES (
        NEW.id,
        NEW.household_id,
        NEW.assigned_child_user_id,
        'open'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating task instances (if not exists)
DROP TRIGGER IF EXISTS on_task_definition_created ON public.task_definitions;

CREATE TRIGGER on_task_definition_created
  AFTER INSERT ON public.task_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_task_instance();
-- ---- migration: 20260116053140_bca7e448-81d3-469b-9568-f609708a1a84.sql ----

-- Function to approve a task completion and award points
CREATE OR REPLACE FUNCTION public.approve_task_completion(
  p_completion_id uuid,
  p_parent_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_completion record;
  v_new_balance integer;
BEGIN
  -- Get the completion details
  SELECT tc.*, ti.task_definition_id, td.name as task_name
  INTO v_completion
  FROM public.task_completions tc
  JOIN public.task_instances ti ON ti.id = tc.task_instance_id
  JOIN public.task_definitions td ON td.id = ti.task_definition_id
  WHERE tc.id = p_completion_id
  FOR UPDATE;
  
  IF v_completion IS NULL THEN
    RAISE EXCEPTION 'Task completion not found';
  END IF;
  
  IF v_completion.status != 'pending' THEN
    RAISE EXCEPTION 'Task completion is not pending';
  END IF;
  
  -- Update the task completion
  UPDATE public.task_completions
  SET 
    status = 'approved',
    parent_confirmed = true,
    parent_user_id = p_parent_user_id,
    parent_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_completion_id;
  
  -- Update child's points balance
  UPDATE public.child_profiles
  SET points_balance_cached = points_balance_cached + v_completion.points_at_stake
  WHERE child_user_id = v_completion.child_user_id
  RETURNING points_balance_cached INTO v_new_balance;
  
  -- Create ledger entry
  INSERT INTO public.point_ledger_entries (
    household_id,
    child_user_id,
    delta_points,
    balance_after,
    reason_type,
    source_table,
    source_id,
    created_by_user_id,
    notes
  ) VALUES (
    v_completion.household_id,
    v_completion.child_user_id,
    v_completion.points_at_stake,
    v_new_balance,
    'task_approved',
    'task_completions',
    p_completion_id,
    p_parent_user_id,
    'Task completed: ' || v_completion.task_name
  );
  
  -- Update task instance status
  UPDATE public.task_instances
  SET status = 'completed', updated_at = now()
  WHERE id = v_completion.task_instance_id;
END;
$$;

-- Function to reject a task completion
CREATE OR REPLACE FUNCTION public.reject_task_completion(
  p_completion_id uuid,
  p_parent_user_id uuid,
  p_rejection_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.task_completions
  SET 
    status = 'rejected',
    parent_user_id = p_parent_user_id,
    rejection_notes = p_rejection_notes,
    updated_at = now()
  WHERE id = p_completion_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found or not pending';
  END IF;
  
  -- Reopen the task instance so it can be completed again
  UPDATE public.task_instances ti
  SET status = 'open', updated_at = now()
  FROM public.task_completions tc
  WHERE tc.id = p_completion_id
    AND ti.id = tc.task_instance_id;
END;
$$;

-- Function to approve a reward suggestion and create the reward
CREATE OR REPLACE FUNCTION public.approve_reward_suggestion(
  p_suggestion_id uuid,
  p_parent_user_id uuid,
  p_final_points integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_suggestion record;
  v_reward_id uuid;
  v_points integer;
BEGIN
  -- Get the suggestion
  SELECT * INTO v_suggestion
  FROM public.reward_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;
  
  IF v_suggestion IS NULL THEN
    RAISE EXCEPTION 'Reward suggestion not found';
  END IF;
  
  IF v_suggestion.status != 'pending' THEN
    RAISE EXCEPTION 'Reward suggestion is not pending';
  END IF;
  
  -- Use provided points or suggested points
  v_points := COALESCE(p_final_points, v_suggestion.suggested_points, 50);
  
  -- Create the reward
  INSERT INTO public.rewards (
    household_id,
    name,
    description,
    points_cost,
    reward_type,
    created_by_user_id,
    status
  ) VALUES (
    v_suggestion.household_id,
    v_suggestion.name,
    v_suggestion.description,
    v_points,
    v_suggestion.reward_type,
    p_parent_user_id,
    'active'
  )
  RETURNING id INTO v_reward_id;
  
  -- Update the suggestion
  UPDATE public.reward_suggestions
  SET 
    status = 'approved',
    reviewed_by_user_id = p_parent_user_id,
    final_points = v_points,
    created_reward_id = v_reward_id,
    updated_at = now()
  WHERE id = p_suggestion_id;
  
  RETURN v_reward_id;
END;
$$;

-- Function to deny a reward suggestion
CREATE OR REPLACE FUNCTION public.deny_reward_suggestion(
  p_suggestion_id uuid,
  p_parent_user_id uuid,
  p_denial_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.reward_suggestions
  SET 
    status = 'denied',
    reviewed_by_user_id = p_parent_user_id,
    denial_reason = p_denial_reason,
    updated_at = now()
  WHERE id = p_suggestion_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward suggestion not found or not pending';
  END IF;
END;
$$;
-- ---- migration: 20260116055053_fce52e9c-db94-40e3-81ca-c22f907661bc.sql ----

-- Update the trigger function to create instances for ALL active tasks (not just one_time)
CREATE OR REPLACE FUNCTION public.auto_create_task_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create an instance for ALL new active tasks (not just one_time)
  IF NEW.status = 'active' THEN
    -- Check if an open instance already exists (to avoid duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM public.task_instances 
      WHERE task_definition_id = NEW.id
      AND status = 'open'
    ) THEN
      INSERT INTO public.task_instances (
        task_definition_id,
        household_id,
        assigned_child_user_id,
        status,
        due_at
      ) VALUES (
        NEW.id,
        NEW.household_id,
        NEW.assigned_child_user_id,
        'open',
        CASE 
          WHEN NEW.recurrence = 'daily' THEN (CURRENT_DATE + INTERVAL '1 day')::timestamptz
          WHEN NEW.recurrence = 'weekly' THEN (CURRENT_DATE + INTERVAL '7 days')::timestamptz
          WHEN NEW.recurrence = 'monthly' THEN (CURRENT_DATE + INTERVAL '1 month')::timestamptz
          ELSE NULL
        END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Backfill: Create open instances for existing active task definitions that don't have one
INSERT INTO task_instances (task_definition_id, household_id, assigned_child_user_id, status, due_at)
SELECT 
  id,
  household_id,
  assigned_child_user_id,
  'open',
  CASE 
    WHEN recurrence = 'daily' THEN (CURRENT_DATE + INTERVAL '1 day')::timestamptz
    WHEN recurrence = 'weekly' THEN (CURRENT_DATE + INTERVAL '7 days')::timestamptz
    WHEN recurrence = 'monthly' THEN (CURRENT_DATE + INTERVAL '1 month')::timestamptz
    ELSE NULL
  END
FROM task_definitions
WHERE status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM task_instances ti 
  WHERE ti.task_definition_id = task_definitions.id 
  AND ti.status = 'open'
);
-- ---- migration: 20260116060658_26a86e6e-6eec-4937-9677-139873e54842.sql ----

-- Add 'experience' to the reward_type enum
ALTER TYPE reward_type ADD VALUE 'experience';
-- ---- migration: 20260116061042_e9b26a11-4904-47e8-a81d-91db7447a0ce.sql ----

-- Enable realtime on task_completions table
ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;
-- ---- migration: 20260116062422_0cd5bad9-df58-4872-b6bc-656ccc878f7a.sql ----

-- 1. Create the apply_points_delta function (reusable for tasks, rewards, etc.)
CREATE OR REPLACE FUNCTION public.apply_points_delta(
  p_child_user_id uuid,
  p_household_id uuid,
  p_delta_points integer,
  p_reason_type ledger_reason_type,
  p_source_table text,
  p_source_id uuid,
  p_created_by_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Update child's points balance
  UPDATE public.child_profiles
  SET points_balance_cached = points_balance_cached + p_delta_points
  WHERE child_user_id = p_child_user_id
  RETURNING points_balance_cached INTO v_new_balance;
  
  -- Create ledger entry
  INSERT INTO public.point_ledger_entries (
    household_id,
    child_user_id,
    delta_points,
    balance_after,
    reason_type,
    source_table,
    source_id,
    created_by_user_id,
    notes
  ) VALUES (
    p_household_id,
    p_child_user_id,
    p_delta_points,
    v_new_balance,
    p_reason_type,
    p_source_table,
    p_source_id,
    p_created_by_user_id,
    p_notes
  );
  
  RETURN v_new_balance;
END;
$$;

-- 2. Create trigger function for automatic points award
CREATE OR REPLACE FUNCTION public.trg_award_points_on_mutual_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task_name text;
BEGIN
  -- Only fire when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get task name for notes
    SELECT td.name INTO v_task_name
    FROM public.task_instances ti
    JOIN public.task_definitions td ON td.id = ti.task_definition_id
    WHERE ti.id = NEW.task_instance_id;
    
    -- Award points using the reusable function
    PERFORM public.apply_points_delta(
      NEW.child_user_id,
      NEW.household_id,
      NEW.points_at_stake,
      'TASK_AWARDED',
      'task_completions',
      NEW.id,
      NEW.parent_user_id,
      'Task completed: ' || COALESCE(v_task_name, 'Unknown')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trg_award_points_on_mutual_approval ON public.task_completions;
CREATE TRIGGER trg_award_points_on_mutual_approval
  AFTER UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_award_points_on_mutual_approval();

-- 4. Simplify approve_task_completion (trigger now handles points)
CREATE OR REPLACE FUNCTION public.approve_task_completion(
  p_completion_id uuid, 
  p_parent_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the task completion (trigger handles points)
  UPDATE public.task_completions
  SET 
    status = 'approved',
    parent_confirmed = true,
    parent_user_id = p_parent_user_id,
    parent_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_completion_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found or not pending';
  END IF;
  
  -- Update task instance status
  UPDATE public.task_instances ti
  SET status = 'completed', updated_at = now()
  FROM public.task_completions tc
  WHERE tc.id = p_completion_id
    AND ti.id = tc.task_instance_id;
END;
$$;
-- ---- migration: 20260116062625_2a376b7f-dc64-4e79-afc3-2bac64fc21b0.sql ----

-- Fix approve_task_completion: use valid enum value 'approved' instead of 'completed'
CREATE OR REPLACE FUNCTION public.approve_task_completion(
  p_completion_id uuid, 
  p_parent_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the task completion (trigger handles points)
  UPDATE public.task_completions
  SET 
    status = 'approved',
    parent_confirmed = true,
    parent_user_id = p_parent_user_id,
    parent_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_completion_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found or not pending';
  END IF;
  
  -- Update task instance status - FIXED: use 'approved' not 'completed'
  UPDATE public.task_instances ti
  SET status = 'approved', updated_at = now()
  FROM public.task_completions tc
  WHERE tc.id = p_completion_id
    AND ti.id = tc.task_instance_id;
END;
$$;
-- ---- migration: 20260116064839_2fc4b2db-f64f-4e14-a101-933bd1bc3766.sql ----

-- Create storage bucket for pet images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-images', 'pet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to pet images
CREATE POLICY "Pet images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-images');

-- Allow authenticated users to upload pet images (for edge function with service role)
CREATE POLICY "Service role can upload pet images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pet-images');

-- Allow updates to pet images
CREATE POLICY "Service role can update pet images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'pet-images');
-- ---- migration: 20260116064848_b929154b-45a3-437e-ac23-6ba3da048d1f.sql ----

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can upload pet images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update pet images" ON storage.objects;

-- Create more specific policies that only allow uploads via service role (edge functions)
-- The edge function will use the service_role key which bypasses RLS
-- ---- migration: 20260116070614_7da7af6f-382d-4a63-bb74-fdfb5b1e34e5.sql ----

-- Create table to track items owned by pets
CREATE TABLE public.pet_owned_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.pet_items(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acquired_via TEXT NOT NULL DEFAULT 'purchase' CHECK (acquired_via IN ('purchase', 'gift', 'reward')),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(pet_id, item_id)
);

-- Enable RLS
ALTER TABLE public.pet_owned_items ENABLE ROW LEVEL SECURITY;

-- Members can view owned items in their household
CREATE POLICY "Members can view pet owned items"
  ON public.pet_owned_items
  FOR SELECT
  USING (is_household_member(auth.uid(), household_id));

-- Children can purchase items for their own pets
CREATE POLICY "Children can add items to their pets"
  ON public.pet_owned_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_owned_items.pet_id
      AND p.child_user_id = auth.uid()
    )
  );

-- Children can update their own pets' items (equip/unequip)
CREATE POLICY "Children can update their pets items"
  ON public.pet_owned_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_owned_items.pet_id
      AND p.child_user_id = auth.uid()
    )
  );

-- Enable realtime for owned items
ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_owned_items;
-- ---- migration: 20260116073341_c5f8dab4-0459-4fbf-b2c4-d7e32d6909fa.sql ----

-- Phase 5: Create asset_image_jobs table for item/habitat generation
CREATE TABLE public.asset_image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('pet_item', 'habitat')),
  asset_id UUID NOT NULL,
  household_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  prompt_payload JSONB,
  output_image_url TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for asset_image_jobs
ALTER TABLE public.asset_image_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view asset image jobs"
  ON public.asset_image_jobs FOR SELECT
  USING (is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create asset image jobs"
  ON public.asset_image_jobs FOR INSERT
  WITH CHECK (is_household_parent(auth.uid(), household_id));

-- Phase 5: Add approval_status to pet_items
DO $$ BEGIN
  CREATE TYPE pet_item_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.pet_items 
ADD COLUMN IF NOT EXISTS approval_status pet_item_approval_status NOT NULL DEFAULT 'approved';

ALTER TABLE public.pet_items 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
-- ---- migration: 20260116081532_d3ca1849-29d2-482b-8499-0465323e3c93.sql ----

-- Update the approve_task_completion function to clear old rejected completions
-- when a new completion for the same task_instance is approved

CREATE OR REPLACE FUNCTION public.approve_task_completion(p_completion_id uuid, p_parent_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task_instance_id uuid;
BEGIN
  -- Get the task_instance_id for this completion
  SELECT task_instance_id INTO v_task_instance_id
  FROM public.task_completions
  WHERE id = p_completion_id;
  
  IF v_task_instance_id IS NULL THEN
    RAISE EXCEPTION 'Task completion not found';
  END IF;

  -- Update the task completion (trigger handles points)
  UPDATE public.task_completions
  SET 
    status = 'approved',
    parent_confirmed = true,
    parent_user_id = p_parent_user_id,
    parent_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_completion_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found or not pending';
  END IF;
  
  -- Delete old rejected completions for the same task_instance
  -- These are now superseded by the approved completion
  DELETE FROM public.task_completions
  WHERE task_instance_id = v_task_instance_id
    AND status = 'rejected'
    AND id != p_completion_id;
  
  -- Update task instance status
  UPDATE public.task_instances ti
  SET status = 'approved', updated_at = now()
  FROM public.task_completions tc
  WHERE tc.id = p_completion_id
    AND ti.id = tc.task_instance_id;
END;
$function$;
-- ---- migration: 20260116192927_9775b6e6-314a-45e1-b466-8117f03b6ab0.sql ----

-- Add parent invite code to households
ALTER TABLE public.households
ADD COLUMN parent_invite_code text UNIQUE;

-- Generate parent invite codes for existing households
UPDATE public.households
SET parent_invite_code = public.generate_invite_code()
WHERE parent_invite_code IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.households
ALTER COLUMN parent_invite_code SET NOT NULL;

-- Create trigger to auto-generate parent invite code on new households
CREATE OR REPLACE FUNCTION public.set_household_parent_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  LOOP
    NEW.parent_invite_code := generate_invite_code();
    BEGIN
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
END;
$function$;

CREATE TRIGGER set_household_parent_invite_code_trigger
BEFORE INSERT ON public.households
FOR EACH ROW
WHEN (NEW.parent_invite_code IS NULL)
EXECUTE FUNCTION public.set_household_parent_invite_code();

-- Create RPC function to join as parent
CREATE OR REPLACE FUNCTION public.join_household_as_parent(p_invite_code text, p_user_id uuid)
RETURNS TABLE(household_id uuid, household_name text, already_member boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
  v_existing_membership UUID;
BEGIN
  -- Find household by parent invite code
  SELECT id, name INTO v_household_id, v_household_name
  FROM public.households
  WHERE parent_invite_code = UPPER(TRIM(p_invite_code));
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  
  -- Check if already a member
  SELECT id INTO v_existing_membership
  FROM public.household_memberships
  WHERE household_memberships.household_id = v_household_id
    AND user_id = p_user_id;
  
  IF v_existing_membership IS NOT NULL THEN
    RETURN QUERY SELECT v_household_id, v_household_name, true;
    RETURN;
  END IF;
  
  -- Create membership as parent
  INSERT INTO public.household_memberships (household_id, user_id, role)
  VALUES (v_household_id, p_user_id, 'parent');
  
  RETURN QUERY SELECT v_household_id, v_household_name, false;
END;
$function$;
-- ---- migration: 20260116194515_5ed1440c-4277-4cc8-b3f6-95b179c4acac.sql ----

-- Add external_url column to rewards table for linking to product pages
ALTER TABLE public.rewards
ADD COLUMN external_url TEXT;
-- ---- migration: 20260116201541_4bbfb2f6-bffe-4247-abbc-5490efb986f6.sql ----

-- Drop the existing constraint
ALTER TABLE asset_image_jobs 
DROP CONSTRAINT IF EXISTS asset_image_jobs_asset_type_check;

-- Add the updated constraint with 'reward' included
ALTER TABLE asset_image_jobs 
ADD CONSTRAINT asset_image_jobs_asset_type_check 
CHECK (asset_type = ANY (ARRAY['pet_item'::text, 'habitat'::text, 'reward'::text]));
-- ---- migration: 20260116201816_e30d37dc-7cfa-475c-96f0-54c3ac298de0.sql ----

-- Add INSERT policy to allow authenticated users to upload to pet-images bucket
CREATE POLICY "Authenticated users can upload pet images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet-images');

-- Add UPDATE policy to allow authenticated users to update their images
CREATE POLICY "Authenticated users can update pet images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'pet-images');

-- Add DELETE policy to allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete pet images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pet-images');
-- ---- migration: 20260116211435_34a03507-a1da-4efe-85ee-12366723bc91.sql ----

-- Create emoji_pins table for quick login
CREATE TABLE public.emoji_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE public.emoji_pins
  ADD CONSTRAINT emoji_pins_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.emoji_pins ENABLE ROW LEVEL SECURITY;

-- Users can view their own PIN record
CREATE POLICY "Users can view own pin"
  ON public.emoji_pins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own PIN
CREATE POLICY "Users can insert own pin"
  ON public.emoji_pins
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own PIN
CREATE POLICY "Users can update own pin"
  ON public.emoji_pins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own PIN
CREATE POLICY "Users can delete own pin"
  ON public.emoji_pins
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can read all PINs (for verification edge function)
-- Note: Edge function uses service role key to verify PINs

-- Add updated_at trigger
CREATE TRIGGER update_emoji_pins_updated_at
  BEFORE UPDATE ON public.emoji_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- ---- migration: 20260116223659_48bd8e24-0957-49e5-8c1e-b7c20f6c9181.sql ----

-- Phase 1.1: Add position fields to pets table for map coordinates
ALTER TABLE public.pets
ADD COLUMN position_x integer NOT NULL DEFAULT 500,
ADD COLUMN position_y integer NOT NULL DEFAULT 500;

-- Add constraint to keep positions within 0-1000 range
ALTER TABLE public.pets
ADD CONSTRAINT pets_position_x_range CHECK (position_x >= 0 AND position_x <= 1000),
ADD CONSTRAINT pets_position_y_range CHECK (position_y >= 0 AND position_y <= 1000);

-- Phase 1.2: Add active_companion_id to child_profiles for persistent companion selection
ALTER TABLE public.child_profiles
ADD COLUMN active_companion_id uuid REFERENCES public.pets(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_child_profiles_active_companion ON public.child_profiles(active_companion_id);

-- Comment for documentation
COMMENT ON COLUMN public.pets.position_x IS 'X coordinate on 1000x1000 map grid';
COMMENT ON COLUMN public.pets.position_y IS 'Y coordinate on 1000x1000 map grid';
COMMENT ON COLUMN public.child_profiles.active_companion_id IS 'The pet currently set as active companion, camera follows this pet on map view';
-- ---- migration: 20260116234228_e2788ae2-d7ef-497f-b0f7-cd9c390d46ac.sql ----

-- Enable realtime for task_instances table
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_instances;
-- ---- migration: 20260117005410_75b3ad2c-c859-41c3-883e-15cb83410f11.sql ----

-- Drop the existing foreign key constraint
ALTER TABLE reward_suggestions 
DROP CONSTRAINT IF EXISTS reward_suggestions_created_reward_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE reward_suggestions 
ADD CONSTRAINT reward_suggestions_created_reward_id_fkey 
FOREIGN KEY (created_reward_id) 
REFERENCES rewards(id) 
ON DELETE SET NULL;
-- ---- migration: 20260117043049_23ae5e76-6d7b-47eb-843d-0dd6d5b558c4.sql ----

-- Allow children to delete their pets' owned items when consuming them
CREATE POLICY "Children can delete their pets items"
ON pet_owned_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pets p
    WHERE p.id = pet_owned_items.pet_id
    AND p.child_user_id = auth.uid()
  )
);
-- ---- migration: 20260117043952_ea265067-6e61-43c2-9ac0-aee2f3811cf6.sql ----

-- Add stamp display settings to pet_owned_items
ALTER TABLE pet_owned_items
ADD COLUMN display_as_stamp boolean NOT NULL DEFAULT false,
ADD COLUMN stamp_position jsonb DEFAULT NULL;
-- ---- migration: 20260117044522_ba466ca8-bb2d-4b25-bae1-6b3656702dd0.sql ----

-- Create pet_item_stamps table for tracking displayable given items
CREATE TABLE public.pet_item_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.pet_items(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id),
  display_as_stamp boolean NOT NULL DEFAULT false,
  stamp_position jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(pet_id, item_id)
);

-- Enable RLS
ALTER TABLE public.pet_item_stamps ENABLE ROW LEVEL SECURITY;

-- Children can manage their own pets' stamps
CREATE POLICY "Children can manage their pet stamps"
ON public.pet_item_stamps FOR ALL
USING (EXISTS (
  SELECT 1 FROM pets p 
  WHERE p.id = pet_item_stamps.pet_id 
  AND p.child_user_id = auth.uid()
));

-- Members can view stamps in their household
CREATE POLICY "Members can view pet stamps"
ON public.pet_item_stamps FOR SELECT
USING (is_household_member(auth.uid(), household_id));

-- Backfill from existing pet_interactions where items were given
INSERT INTO public.pet_item_stamps (pet_id, item_id, household_id, display_as_stamp)
SELECT DISTINCT 
  pi.pet_id, 
  pi.item_id, 
  pi.household_id,
  false
FROM public.pet_interactions pi
WHERE pi.item_id IS NOT NULL
ON CONFLICT (pet_id, item_id) DO NOTHING;

-- Remove unused columns from pet_owned_items (cleanup from previous incorrect approach)
ALTER TABLE public.pet_owned_items 
DROP COLUMN IF EXISTS display_as_stamp,
DROP COLUMN IF EXISTS stamp_position;
-- ---- migration: 20260117045920_8c247af3-2372-40cd-b4f9-b5cae70bf9ed.sql ----

-- Add stamp_scale column to pet_item_stamps
ALTER TABLE pet_item_stamps
ADD COLUMN stamp_scale numeric NOT NULL DEFAULT 1.0;
-- ---- migration: 20260117051714_75e3c3af-3fd6-42e0-8cc7-0699bd52ebca.sql ----

-- Add stamp_rotation column to pet_item_stamps for custom rotation
ALTER TABLE pet_item_stamps
ADD COLUMN stamp_rotation numeric NOT NULL DEFAULT 0;
-- ---- migration: 20260118200119_fb389085-1cf1-4d00-84a0-65fd6a25edb7.sql ----

-- Create owned_eggs table to store eggs purchased by children
CREATE TABLE public.owned_eggs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_user_id UUID NOT NULL REFERENCES public.profiles(id),
  household_id UUID NOT NULL REFERENCES public.households(id),
  egg_item_id UUID NOT NULL REFERENCES public.pet_items(id),
  position_x INTEGER NOT NULL DEFAULT 500,
  position_y INTEGER NOT NULL DEFAULT 500,
  preset_traits_json JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hatched_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE public.owned_eggs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view owned eggs in their household"
ON public.owned_eggs
FOR SELECT
USING (is_household_member(auth.uid(), household_id));

CREATE POLICY "Children can create owned eggs"
ON public.owned_eggs
FOR INSERT
WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "Children can update their own eggs"
ON public.owned_eggs
FOR UPDATE
USING (child_user_id = auth.uid());

CREATE POLICY "Children can delete their own eggs"
ON public.owned_eggs
FOR DELETE
USING (child_user_id = auth.uid());

-- Create function to grant starter egg to new child profiles
CREATE OR REPLACE FUNCTION public.grant_starter_egg()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_common_egg_id UUID;
BEGIN
  -- Find the Common Egg item in this household
  SELECT id INTO v_common_egg_id
  FROM public.pet_items
  WHERE household_id = NEW.household_id
    AND category = 'egg'
    AND LOWER(name) LIKE '%common%'
    AND status = 'active'
  LIMIT 1;
  
  -- If a Common Egg exists, grant it to the new child
  IF v_common_egg_id IS NOT NULL THEN
    INSERT INTO public.owned_eggs (
      child_user_id,
      household_id,
      egg_item_id,
      position_x,
      position_y,
      preset_traits_json
    ) VALUES (
      NEW.child_user_id,
      NEW.household_id,
      v_common_egg_id,
      500,
      500,
      NULL  -- Common egg has no preset traits
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-grant starter egg when child profile is created
CREATE TRIGGER trg_grant_starter_egg
AFTER INSERT ON public.child_profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_starter_egg();

-- Add index for faster queries
CREATE INDEX idx_owned_eggs_child_user_id ON public.owned_eggs(child_user_id);
CREATE INDEX idx_owned_eggs_household_id ON public.owned_eggs(household_id);
CREATE INDEX idx_owned_eggs_hatched_at ON public.owned_eggs(hatched_at) WHERE hatched_at IS NULL;
-- ---- migration: 20260118224112_11660593-9793-40fd-8137-b2f98ba5b351.sql ----

-- Allow children to update their own profile (for active_companion_id)
CREATE POLICY "Children can update their own profile"
  ON public.child_profiles
  FOR UPDATE
  USING (child_user_id = auth.uid())
  WITH CHECK (child_user_id = auth.uid());
-- ---- migration: 20260118230646_715e7aa0-6b7f-49a3-b799-0dcc50d1318e.sql ----

-- Create shared child inventory table for pet items
CREATE TABLE public.child_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id uuid NOT NULL REFERENCES auth.users(id),
  household_id uuid NOT NULL REFERENCES households(id),
  item_id uuid NOT NULL REFERENCES pet_items(id),
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  acquired_via text NOT NULL DEFAULT 'purchase'
);

-- Enable RLS
ALTER TABLE public.child_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Children can view their inventory"
  ON public.child_inventory FOR SELECT
  USING (child_user_id = auth.uid());

CREATE POLICY "Children can insert to their inventory"
  ON public.child_inventory FOR INSERT
  WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "Children can update their inventory"
  ON public.child_inventory FOR UPDATE
  USING (child_user_id = auth.uid());

CREATE POLICY "Children can delete from their inventory"
  ON public.child_inventory FOR DELETE
  USING (child_user_id = auth.uid());

CREATE POLICY "Parents can view household inventory"
  ON public.child_inventory FOR SELECT
  USING (is_household_parent(auth.uid(), household_id));
-- ---- migration: 20260119033018_a5113451-ac0a-441e-9e61-27029340763f.sql ----

-- Move eggs from pet_owned_items to owned_eggs
INSERT INTO owned_eggs (child_user_id, household_id, egg_item_id, position_x, position_y, preset_traits_json, created_at)
SELECT 
  p.child_user_id,
  poi.household_id,
  poi.item_id as egg_item_id,
  100 + floor(random() * 800)::int as position_x,
  150 + floor(random() * 700)::int as position_y,
  NULL as preset_traits_json,
  poi.acquired_at as created_at
FROM pet_owned_items poi
JOIN pet_items pi ON poi.item_id = pi.id
JOIN pets p ON poi.pet_id = p.id
WHERE pi.category = 'egg';

-- Remove the incorrectly placed egg records from pet_owned_items
DELETE FROM pet_owned_items poi
USING pet_items pi
WHERE poi.item_id = pi.id
AND pi.category = 'egg';
-- ---- migration: 20260119182117_6703c1af-5aee-4a75-b8c5-f0b0655bd085.sql ----

-- Migrate old category values to new unified category system
UPDATE task_definitions SET category = 'tidy_up' WHERE LOWER(category) = 'chores';
UPDATE task_definitions SET category = 'make_stuff' WHERE LOWER(category) = 'creative';
UPDATE task_definitions SET category = 'kind_heart' WHERE LOWER(category) = 'helping';
UPDATE task_definitions SET category = 'learn_stuff' WHERE LOWER(category) = 'homework';
UPDATE task_definitions SET category = 'nature' WHERE LOWER(category) = 'outdoor';
UPDATE task_definitions SET category = 'my_body' WHERE LOWER(category) IN ('self-care', 'self care');
UPDATE task_definitions SET category = 'tidy_up' WHERE LOWER(category) = 'other' OR category IS NULL;
-- ---- migration: 20260119182509_f289b063-2359-40b6-85ce-72333a7063cd.sql ----

-- Insert 59 standardized tasks for the household

-- 🎨 MAKE STUFF (Creative) - 10 tasks
INSERT INTO task_definitions (household_id, created_by_user_id, name, description, default_points, difficulty, category, recurrence, status)
VALUES 
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Draw Picture', 'Use colors to show your ideas', 5, 'easy', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Make Craft', 'Create something with your hands', 7, 'medium', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Build Blocks', 'Stack and create with blocks', 5, 'easy', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Paint Something', 'Brush colors onto paper', 6, 'medium', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Create Song', 'Make up your own music', 6, 'medium', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Build Fort', 'Make a cozy hideout', 8, 'hard', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Write Story', 'Put your imagination into words', 7, 'medium', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Make Up Game', 'Invent a new way to play', 6, 'medium', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Dance Free', 'Move your body to the rhythm', 3, 'easy', 'make_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Tell Story', 'Share a tale out loud', 4, 'easy', 'make_stuff', 'daily', 'active'),

-- 📚 LEARN STUFF (Education) - 7 tasks
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Read Book', 'Explore a story or learn new things', 6, 'easy', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Learn New Word', 'Add a word to your brain', 3, 'easy', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Ask Questions', 'Be curious about the world', 2, 'easy', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Practice Writing', 'Make your letters and words neat', 5, 'medium', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Practice Math', 'Work with numbers and shapes', 5, 'medium', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Read Together', 'Share a book with someone', 6, 'easy', 'learn_stuff', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Teach Friend', 'Help someone learn something new', 7, 'hard', 'learn_stuff', 'daily', 'active'),

-- 🧹 TIDY UP (Chores) - 9 tasks
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Set Table', 'Get dishes ready for a meal', 4, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Clear Dishes', 'Bring dishes to the sink', 3, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Fold Laundry', 'Make clothes neat and flat', 6, 'medium', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Sort Recycling', 'Put recyclables in the right bin', 4, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Pick Up Litter', 'Keep our spaces clean', 4, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Water Plants', 'Give plants a drink', 3, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Feed Pet', 'Give your pet their meal', 3, 'easy', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Walk Dog', 'Take your dog for a stroll', 7, 'medium', 'tidy_up', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Carry Groceries', 'Help bring food inside', 5, 'medium', 'tidy_up', 'daily', 'active'),

-- 🌳 NATURE (Outdoors) - 5 tasks
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Explore Nature', 'Discover what''s outside', 7, 'easy', 'nature', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Garden Together', 'Plant and tend growing things', 8, 'medium', 'nature', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Observe Birds', 'Watch and learn about birds', 5, 'easy', 'nature', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Find Bugs', 'Search for tiny creatures', 5, 'easy', 'nature', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Collect Leaves', 'Gather nature''s treasures', 4, 'easy', 'nature', 'daily', 'active'),

-- 💪 MY BODY (Self-Care) - 11 tasks
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Brush Teeth', 'Keep your smile sparkly clean', 3, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Wash Hands', 'Scrub away the germs', 2, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Choose Clothes', 'Pick what you''ll wear today', 3, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Eat Healthy', 'Fuel your body with good food', 4, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Take Bath', 'Get squeaky clean all over', 5, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Drink Water', 'Keep your body hydrated', 1, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Sleep Well', 'Rest so your body can grow', 8, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Comb Hair', 'Make your hair look nice', 2, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Rest Quiet', 'Give your brain a peaceful break', 5, 'easy', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Try New Food', 'Be brave and taste something new', 4, 'medium', 'my_body', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Express Feelings', 'Share what''s in your heart', 4, 'medium', 'my_body', 'daily', 'active'),

-- 💛 KIND HEART (Helping) - 10 tasks
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Help Sibling', 'Lend a hand to your brother or sister', 5, 'medium', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Comfort Someone', 'Be there when someone feels sad', 6, 'hard', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Share Toys', 'Let others play with your things', 4, 'medium', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Hold Door', 'Keep the door open for others', 2, 'easy', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Include Everyone', 'Make sure no one is left out', 5, 'medium', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Listen Carefully', 'Give someone your full attention', 4, 'medium', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Check On Friend', 'See how someone is doing', 3, 'easy', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Take Turns', 'Wait patiently for your turn', 3, 'medium', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Give Hug', 'Wrap someone in warmth', 1, 'easy', 'kind_heart', 'daily', 'active'),
  ('42db59cb-b98b-4f3c-a4e8-84584c63bfe9', '2e0c17df-e778-4441-9ed8-bfcdc3796382', 'Say Thank You', 'Show you appreciate someone', 1, 'easy', 'kind_heart', 'daily', 'active');
-- ---- migration: 20260119225145_e398da6d-7bea-44c7-b4c8-202d16f0e96a.sql ----

-- Backfill historical pet_interactions: fix interaction_type to 'gift' for items
UPDATE pet_interactions
SET interaction_type = 'gift'
WHERE item_id IS NOT NULL AND interaction_type != 'gift';

-- Backfill points_spent from actual item's points_cost
UPDATE pet_interactions pi
SET points_spent = pit.points_cost
FROM pet_items pit
WHERE pi.item_id = pit.id
  AND pi.item_id IS NOT NULL
  AND (pi.points_spent = 0 OR pi.points_spent IS NULL);

-- Recalculate total_points_invested for all pets based on actual interactions
-- pet/play = 1 point, gift = points_spent (item cost)
UPDATE pets p
SET total_points_invested = COALESCE(subq.total, 0)
FROM (
  SELECT 
    pet_id,
    SUM(CASE 
      WHEN item_id IS NOT NULL THEN COALESCE(points_spent, 0)
      ELSE 1
    END) as total
  FROM pet_interactions
  GROUP BY pet_id
) subq
WHERE p.id = subq.pet_id;
-- ---- migration: 20260119235709_eca4fdee-37ea-4268-b9e8-3ebc4ab61200.sql ----

-- Add ITEM_RECYCLE to ledger_reason_type enum
ALTER TYPE public.ledger_reason_type ADD VALUE IF NOT EXISTS 'ITEM_RECYCLE';
-- ---- migration: 20260120000903_06329bb9-80d6-414e-82cd-b8fad4e47efc.sql ----

-- Step 1: Add expires_at column to pet_item_stamps for temporary food stamps
ALTER TABLE public.pet_item_stamps
ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient cleanup/filtering queries
CREATE INDEX idx_pet_item_stamps_expires_at 
ON public.pet_item_stamps(expires_at) 
WHERE expires_at IS NOT NULL;

-- Step 2: Backfill pet_owned_items from pet_item_stamps where missing
-- This ensures items like Derple's Twig Toss, Puzzle Pebble, Nintendo Switch appear in inventory
INSERT INTO public.pet_owned_items (pet_id, item_id, household_id, quantity, acquired_via, is_equipped)
SELECT DISTINCT
  pis.pet_id,
  pis.item_id,
  pis.household_id,
  1 as quantity,
  'gift' as acquired_via,
  false as is_equipped
FROM public.pet_item_stamps pis
WHERE NOT EXISTS (
  SELECT 1 FROM public.pet_owned_items poi
  WHERE poi.pet_id = pis.pet_id 
    AND poi.item_id = pis.item_id
);

-- Step 3: Auto-enable display_as_stamp for all pet_owned_items that have stamp records
-- This ensures items in inventory automatically show as stamps
UPDATE public.pet_item_stamps pis
SET display_as_stamp = true
WHERE EXISTS (
  SELECT 1 FROM public.pet_owned_items poi
  WHERE poi.pet_id = pis.pet_id 
    AND poi.item_id = pis.item_id
);
-- ---- migration: 20260120001642_2feaeb6c-323b-43a8-80b9-7d045e7642a1.sql ----

-- Remove food items from pet_owned_items (they should be consumables, not permanent)
DELETE FROM public.pet_owned_items
WHERE item_id IN (
  SELECT id FROM public.pet_items WHERE category = 'food'
);

-- Update food stamps to be temporary (expire in 24 hours)
UPDATE public.pet_item_stamps pis
SET expires_at = NOW() + INTERVAL '24 hours'
WHERE EXISTS (
  SELECT 1 FROM public.pet_items pi 
  WHERE pi.id = pis.item_id AND pi.category = 'food'
)
AND expires_at IS NULL;
-- ---- migration: 20260120044049_f1eea00f-7865-42da-83af-5f7b44235414.sql ----

-- Add POSE to image_job_type enum
ALTER TYPE image_job_type ADD VALUE IF NOT EXISTS 'POSE';

-- Add context columns to pet_image_jobs for rich image generation
ALTER TABLE pet_image_jobs ADD COLUMN IF NOT EXISTS mood_context text;
ALTER TABLE pet_image_jobs ADD COLUMN IF NOT EXISTS interaction_summary jsonb;
ALTER TABLE pet_image_jobs ADD COLUMN IF NOT EXISTS milestone_number integer;
-- ---- migration: 20260120045730_2ed89982-8231-4dae-9303-978a030bc0dc.sql ----

-- Add column to track text detection retries
ALTER TABLE public.pet_image_jobs ADD COLUMN IF NOT EXISTS text_retry_count integer DEFAULT 0;
-- ---- migration: 20260123012955_3b641134-9b6f-4121-9793-43637345a4bf.sql ----

-- Allow children to delete image jobs for their own pets
CREATE POLICY "Children can delete pet image jobs for their pets"
  ON public.pet_image_jobs
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_image_jobs.pet_id
        AND p.child_user_id = auth.uid()
    )
  );

-- Allow children to update image jobs for their own pets (for regenerate)
CREATE POLICY "Children can update pet image jobs for their pets"
  ON public.pet_image_jobs
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_image_jobs.pet_id
        AND p.child_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_image_jobs.pet_id
        AND p.child_user_id = auth.uid()
    )
  );
-- ---- migration: 20260123014538_6e4533a0-85c1-49be-8e2f-eaec99fd627c.sql ----

-- Allow parents to add items to pets in their household (for gifting)
CREATE POLICY "Parents can add items to household pets"
  ON public.pet_owned_items
  FOR INSERT
  TO public
  WITH CHECK (
    is_household_parent(auth.uid(), household_id)
  );
-- ---- migration: 20260123023205_e3212ef0-4480-455f-9eb0-6f6126501de3.sql ----

-- Enable realtime for pet_image_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_image_jobs;
-- ---- migration: 20260124155702_fdb8f459-197b-4793-8346-31fb1a5f0d98.sql ----

-- Create function to update pet points on interaction insert
CREATE OR REPLACE FUNCTION public.update_pet_points_on_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points_to_add integer;
BEGIN
  -- Calculate points: free interactions = 1 point, gifts = points_spent
  IF NEW.item_id IS NOT NULL THEN
    v_points_to_add := COALESCE(NEW.points_spent, 0);
  ELSE
    v_points_to_add := 1;
  END IF;
  
  -- Update pet stats atomically
  UPDATE public.pets
  SET 
    total_points_invested = total_points_invested + v_points_to_add,
    total_interactions = total_interactions + 1,
    last_interaction_at = NOW(),
    is_dormant = false,
    dormant_since = NULL,
    updated_at = NOW()
  WHERE id = NEW.pet_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_pet_points ON public.pet_interactions;
CREATE TRIGGER trg_update_pet_points
  AFTER INSERT ON public.pet_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pet_points_on_interaction();
-- ---- migration: 20260124162932_13990837-ed75-4018-b8a8-db50f0b2f897.sql ----

-- Create garden_views table
CREATE TABLE public.garden_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  transition_left_id UUID REFERENCES public.garden_views(id) ON DELETE SET NULL,
  transition_right_id UUID REFERENCES public.garden_views(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garden_view_layers table
CREATE TABLE public.garden_view_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garden_view_id UUID NOT NULL REFERENCES public.garden_views(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL CHECK (layer_type IN ('background', 'stage_ground', 'foreground')),
  image_url TEXT,
  original_image_url TEXT,
  prompt TEXT,
  mask_data JSONB DEFAULT '{}'::jsonb,
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(garden_view_id, layer_type)
);

-- Enable RLS on garden_views
ALTER TABLE public.garden_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for garden_views
CREATE POLICY "Members can view garden views"
  ON public.garden_views FOR SELECT
  USING (is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create garden views"
  ON public.garden_views FOR INSERT
  WITH CHECK (is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update garden views"
  ON public.garden_views FOR UPDATE
  USING (is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete garden views"
  ON public.garden_views FOR DELETE
  USING (is_household_parent(auth.uid(), household_id));

-- Enable RLS on garden_view_layers
ALTER TABLE public.garden_view_layers ENABLE ROW LEVEL SECURITY;

-- RLS policies for garden_view_layers
CREATE POLICY "Members can view garden view layers"
  ON public.garden_view_layers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.garden_views gv
    WHERE gv.id = garden_view_layers.garden_view_id
    AND is_household_member(auth.uid(), gv.household_id)
  ));

CREATE POLICY "Parents can create garden view layers"
  ON public.garden_view_layers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.garden_views gv
    WHERE gv.id = garden_view_layers.garden_view_id
    AND is_household_parent(auth.uid(), gv.household_id)
  ));

CREATE POLICY "Parents can update garden view layers"
  ON public.garden_view_layers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.garden_views gv
    WHERE gv.id = garden_view_layers.garden_view_id
    AND is_household_parent(auth.uid(), gv.household_id)
  ));

CREATE POLICY "Parents can delete garden view layers"
  ON public.garden_view_layers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.garden_views gv
    WHERE gv.id = garden_view_layers.garden_view_id
    AND is_household_parent(auth.uid(), gv.household_id)
  ));

-- Create indexes for performance
CREATE INDEX idx_garden_views_household ON public.garden_views(household_id);
CREATE INDEX idx_garden_views_active ON public.garden_views(household_id, is_active) WHERE is_active = true;
CREATE INDEX idx_garden_view_layers_view ON public.garden_view_layers(garden_view_id);

-- Add updated_at trigger for garden_views
CREATE TRIGGER update_garden_views_updated_at
  BEFORE UPDATE ON public.garden_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for garden_view_layers
CREATE TRIGGER update_garden_view_layers_updated_at
  BEFORE UPDATE ON public.garden_view_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for garden views
INSERT INTO storage.buckets (id, name, public) 
VALUES ('garden-views', 'garden-views', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for garden-views bucket
CREATE POLICY "Authenticated users can view garden view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'garden-views');

CREATE POLICY "Parents can upload garden view images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'garden-views' 
    AND is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Parents can update garden view images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'garden-views'
    AND is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Parents can delete garden view images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'garden-views'
    AND is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
-- ---- migration: 20260124180731_87b24b16-aee2-419b-ad39-1d2efac4f940.sql ----

-- Add offset columns to garden_view_layers for layer positioning
ALTER TABLE public.garden_view_layers
ADD COLUMN offset_x integer NOT NULL DEFAULT 0,
ADD COLUMN offset_y integer NOT NULL DEFAULT 0;

-- Add check constraints to limit offset range (-100 to 100 percent)
ALTER TABLE public.garden_view_layers
ADD CONSTRAINT garden_view_layers_offset_x_range CHECK (offset_x >= -100 AND offset_x <= 100),
ADD CONSTRAINT garden_view_layers_offset_y_range CHECK (offset_y >= -100 AND offset_y <= 100);

COMMENT ON COLUMN public.garden_view_layers.offset_x IS 'Horizontal offset in percentage (-100 to 100)';
COMMENT ON COLUMN public.garden_view_layers.offset_y IS 'Vertical offset in percentage (-100 to 100)';
-- ---- migration: 20260124181608_0fa5dd95-37ea-4ebd-b69d-6d2086e9b2b7.sql ----

-- Add scale column for layer scaling
ALTER TABLE garden_view_layers 
ADD COLUMN scale numeric DEFAULT 1.0;

-- Add check constraint using a trigger instead of CHECK (for restoration compatibility)
CREATE OR REPLACE FUNCTION validate_layer_scale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scale < 0.5 OR NEW.scale > 2.0 THEN
    RAISE EXCEPTION 'scale must be between 0.5 and 2.0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_layer_scale
  BEFORE INSERT OR UPDATE ON garden_view_layers
  FOR EACH ROW
  EXECUTE FUNCTION validate_layer_scale();
-- ---- migration: 20260125204755_399c9e2d-53c1-4582-9f5d-745f11f1ed4e.sql ----

-- Add column to track which garden each pet is currently on
ALTER TABLE public.pets
ADD COLUMN current_garden_view_id uuid REFERENCES public.garden_views(id) ON DELETE SET NULL;
-- ---- migration: 20260125222127_fc54061a-0688-4a32-8ec9-cd796f7ca931.sql ----

-- Add garden_view_id column to owned_eggs table to track which garden each egg belongs to
ALTER TABLE public.owned_eggs 
ADD COLUMN garden_view_id uuid REFERENCES public.garden_views(id) ON DELETE SET NULL;
-- ---- migration: 20260127182340_c33e7de8-c52e-4bbd-ab43-11f28c72f2eb.sql ----

-- ============================================
-- picoFM: Radio feature for Picopets
-- ============================================

-- 1. Create the radio-tracks storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('radio-tracks', 'radio-tracks', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for radio-tracks bucket

-- Anyone can view files (public bucket for streaming)
CREATE POLICY "Radio tracks are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'radio-tracks');

-- Parents can upload tracks to their household folder
CREATE POLICY "Parents can upload radio tracks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'radio-tracks' 
  AND public.is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Parents can update their household tracks
CREATE POLICY "Parents can update radio tracks"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'radio-tracks' 
  AND public.is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Parents can delete their household tracks
CREATE POLICY "Parents can delete radio tracks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'radio-tracks' 
  AND public.is_household_parent(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- ============================================
-- 3. radio_tracks table - The household MP3 library
-- ============================================

CREATE TABLE public.radio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  album_art_url TEXT,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radio_tracks
CREATE POLICY "Members can view radio tracks"
ON public.radio_tracks FOR SELECT
USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Parents can create radio tracks"
ON public.radio_tracks FOR INSERT
WITH CHECK (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can update radio tracks"
ON public.radio_tracks FOR UPDATE
USING (public.is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete radio tracks"
ON public.radio_tracks FOR DELETE
USING (public.is_household_parent(auth.uid(), household_id));

-- Trigger for updated_at
CREATE TRIGGER update_radio_tracks_updated_at
  BEFORE UPDATE ON public.radio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for household queries
CREATE INDEX idx_radio_tracks_household ON public.radio_tracks(household_id, sort_order);

-- ============================================
-- 4. radio_preferences table - Per-user playback state
-- ============================================

CREATE TABLE public.radio_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  volume REAL NOT NULL DEFAULT 0.5 CHECK (volume >= 0.0 AND volume <= 1.0),
  shuffle BOOLEAN NOT NULL DEFAULT false,
  repeat_mode TEXT NOT NULL DEFAULT 'all' CHECK (repeat_mode IN ('none', 'all', 'one')),
  is_playing BOOLEAN NOT NULL DEFAULT false,
  current_track_id UUID REFERENCES public.radio_tracks(id) ON DELETE SET NULL,
  current_position REAL NOT NULL DEFAULT 0,
  widget_expanded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radio_preferences (user can only access their own)
CREATE POLICY "Users can view own radio preferences"
ON public.radio_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own radio preferences"
ON public.radio_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own radio preferences"
ON public.radio_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_radio_preferences_updated_at
  BEFORE UPDATE ON public.radio_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. radio_dislikes table - Tracks a user has hidden
-- ============================================

CREATE TABLE public.radio_dislikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.radio_tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

-- Enable RLS
ALTER TABLE public.radio_dislikes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radio_dislikes (user can only access their own)
CREATE POLICY "Users can view own radio dislikes"
ON public.radio_dislikes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own radio dislikes"
ON public.radio_dislikes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own radio dislikes"
ON public.radio_dislikes FOR DELETE
USING (user_id = auth.uid());

-- Index for efficient filtering
CREATE INDEX idx_radio_dislikes_user ON public.radio_dislikes(user_id);
-- ---- migration: 20260128002639_7b11b82b-dcd5-41f9-83ec-2a6d8f852774.sql ----

-- Create radio_likes table for persisting liked tracks
CREATE TABLE public.radio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.radio_tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE public.radio_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own likes"
  ON public.radio_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes"
  ON public.radio_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.radio_likes FOR DELETE
  USING (auth.uid() = user_id);
-- ---- migration: 20260128033114_c1926aee-b55e-48b2-977c-d9a5680e9c73.sql ----

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create own radio preferences" ON public.radio_preferences;

-- Create corrected policy with household membership verification
CREATE POLICY "Users can create own radio preferences"
ON public.radio_preferences
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND is_household_member(auth.uid(), household_id)
);
-- ---- migration: 20260128052849_26e405c1-4fa0-4480-9ba0-4862d452b45b.sql ----

-- Add RLS policy for parents to gift items to children's inventory
CREATE POLICY "Parents can gift items to children"
ON public.child_inventory
FOR INSERT
WITH CHECK (is_household_parent(auth.uid(), household_id));

-- Add RLS policy for parents to gift eggs to children
CREATE POLICY "Parents can gift eggs to children"
ON public.owned_eggs
FOR INSERT
WITH CHECK (is_household_parent(auth.uid(), household_id));

-- Add RLS policy for parents to create reward redemptions (for gifting rewards)
CREATE POLICY "Parents can gift rewards to children"
ON public.reward_redemptions
FOR INSERT
WITH CHECK (is_household_parent(auth.uid(), household_id));
-- ---- migration: 20260128053614_980f38c0-1d96-4f55-b1a5-40a0174da585.sql ----

-- Add unique constraint for upsert to work correctly
ALTER TABLE public.child_inventory 
ADD CONSTRAINT child_inventory_child_user_id_item_id_key 
UNIQUE (child_user_id, item_id);
-- ---- migration: 20260128055759_a6a55007-6a5a-4d79-8645-307812742a9e.sql ----

-- Create parent_inventory table
CREATE TABLE public.parent_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.pet_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT parent_inventory_parent_user_id_item_id_key 
    UNIQUE (parent_user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.parent_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view their inventory"
ON public.parent_inventory FOR SELECT
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can insert to their inventory"
ON public.parent_inventory FOR INSERT
WITH CHECK (
  parent_user_id = auth.uid() 
  AND is_household_parent(auth.uid(), household_id)
);

CREATE POLICY "Parents can update their inventory"
ON public.parent_inventory FOR UPDATE
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete from their inventory"
ON public.parent_inventory FOR DELETE
USING (parent_user_id = auth.uid());
-- ---- migration: 20260129025143_87649624-785c-4804-b613-0aac29b0b069.sql ----

-- Add thumbnail_url column for storing rendered view thumbnails
ALTER TABLE garden_views 
ADD COLUMN thumbnail_url TEXT;
-- ---- migration: 20260129050510_3910ab45-0fbd-4bae-a724-28be57af084c.sql ----

-- Update the grant_starter_egg function to assign eggs to a random active garden
CREATE OR REPLACE FUNCTION public.grant_starter_egg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_common_egg_id UUID;
  v_garden_id UUID;
BEGIN
  -- Find the Common Egg item in this household
  SELECT id INTO v_common_egg_id
  FROM public.pet_items
  WHERE household_id = NEW.household_id
    AND category = 'egg'
    AND LOWER(name) LIKE '%common%'
    AND status = 'active'
  LIMIT 1;
  
  -- Find a random active garden in the household
  SELECT id INTO v_garden_id
  FROM public.garden_views
  WHERE household_id = NEW.household_id
    AND is_active = true
  ORDER BY random()
  LIMIT 1;
  
  -- If a Common Egg exists, grant it to the new child
  IF v_common_egg_id IS NOT NULL THEN
    INSERT INTO public.owned_eggs (
      child_user_id,
      household_id,
      egg_item_id,
      position_x,
      position_y,
      garden_view_id,
      preset_traits_json
    ) VALUES (
      NEW.child_user_id,
      NEW.household_id,
      v_common_egg_id,
      500,
      500,
      v_garden_id,  -- Assign to random active garden
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;
-- ---- migration: 20260130032929_0f536ea6-ab8c-4cfc-b15b-ce25af697d43.sql ----

-- Add active_companion_id to household_memberships for parent's active companion
ALTER TABLE public.household_memberships
ADD COLUMN active_companion_id UUID REFERENCES public.pets(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_household_memberships_active_companion 
ON public.household_memberships(active_companion_id);
-- ---- migration: 20260130191859_7a6c1285-a3a9-4299-9110-8fa4200db666.sql ----

-- Add RLS policy for parents to update household eggs (for repositioning)
CREATE POLICY "Parents can update household eggs"
ON public.owned_eggs
FOR UPDATE
USING (is_household_parent(auth.uid(), household_id))
WITH CHECK (is_household_parent(auth.uid(), household_id));
-- ---- migration: 20260130202949_0a8e9430-1c7e-47a0-942d-ae6602a8b45f.sql ----

-- Add visibility control column to pets table
-- null/empty = visible to everyone in household (default behavior)
-- populated = only visible to listed user IDs
ALTER TABLE public.pets 
ADD COLUMN visible_to_user_ids uuid[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.pets.visible_to_user_ids IS 
  'Array of user IDs who can see this pet. NULL means visible to all household members.';
-- ---- migration: 20260131162828_f293692f-dddc-4c44-8010-d64f28a00bf6.sql ----

-- Add last_garden_view_id column to household_memberships (for parents)
ALTER TABLE public.household_memberships
ADD COLUMN last_garden_view_id uuid REFERENCES public.garden_views(id) ON DELETE SET NULL;

-- Add last_garden_view_id column to child_profiles (for children)
ALTER TABLE public.child_profiles
ADD COLUMN last_garden_view_id uuid REFERENCES public.garden_views(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX idx_household_memberships_last_garden ON public.household_memberships(last_garden_view_id) WHERE last_garden_view_id IS NOT NULL;
CREATE INDEX idx_child_profiles_last_garden ON public.child_profiles(last_garden_view_id) WHERE last_garden_view_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.household_memberships.last_garden_view_id IS 'Stores the last garden view the parent was viewing for session persistence';
COMMENT ON COLUMN public.child_profiles.last_garden_view_id IS 'Stores the last garden view the child was viewing for session persistence';
-- ---- migration: 20260131175344_ced2123b-c947-41fa-a4bb-588901d171c4.sql ----

-- Function to regenerate task instance for recurring tasks
CREATE OR REPLACE FUNCTION public.regenerate_recurring_task_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_definition record;
BEGIN
  -- Only fire when status changes TO 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the task definition to check recurrence
    SELECT id, household_id, assigned_child_user_id, recurrence
    INTO v_definition
    FROM public.task_definitions
    WHERE id = NEW.task_definition_id
      AND status = 'active';
    
    -- Only regenerate for recurring tasks
    IF v_definition.recurrence IN ('daily', 'weekly', 'monthly') THEN
      
      -- Check if an open instance already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.task_instances
        WHERE task_definition_id = NEW.task_definition_id
          AND status = 'open'
      ) THEN
        
        -- Create new open instance
        INSERT INTO public.task_instances (
          task_definition_id,
          household_id,
          assigned_child_user_id,
          status,
          due_at
        ) VALUES (
          NEW.task_definition_id,
          v_definition.household_id,
          v_definition.assigned_child_user_id,
          'open',
          CASE 
            WHEN v_definition.recurrence = 'daily' 
              THEN (CURRENT_DATE + INTERVAL '1 day')::timestamptz
            WHEN v_definition.recurrence = 'weekly' 
              THEN (CURRENT_DATE + INTERVAL '7 days')::timestamptz
            WHEN v_definition.recurrence = 'monthly' 
              THEN (CURRENT_DATE + INTERVAL '1 month')::timestamptz
          END
        );
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_regenerate_recurring_task ON public.task_instances;
CREATE TRIGGER trg_regenerate_recurring_task
  AFTER UPDATE ON public.task_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.regenerate_recurring_task_instance();

-- Backfill existing approved tasks that are missing open instances
INSERT INTO public.task_instances (
  task_definition_id,
  household_id,
  assigned_child_user_id,
  status,
  due_at
)
SELECT 
  td.id,
  td.household_id,
  td.assigned_child_user_id,
  'open',
  CASE 
    WHEN td.recurrence = 'daily' THEN (CURRENT_DATE + INTERVAL '1 day')::timestamptz
    WHEN td.recurrence = 'weekly' THEN (CURRENT_DATE + INTERVAL '7 days')::timestamptz
    WHEN td.recurrence = 'monthly' THEN (CURRENT_DATE + INTERVAL '1 month')::timestamptz
  END
FROM public.task_definitions td
WHERE td.status = 'active'
  AND td.recurrence IN ('daily', 'weekly', 'monthly')
  AND NOT EXISTS (
    SELECT 1 FROM public.task_instances ti
    WHERE ti.task_definition_id = td.id
      AND ti.status = 'open'
  );
-- ---- migration: 20260203045450_688b5a3c-5cb5-4ea3-819e-849c4712b924.sql ----

-- Add preset_traits_json column to pet_items table for storing egg hatching traits
ALTER TABLE pet_items
ADD COLUMN preset_traits_json jsonb DEFAULT NULL;

COMMENT ON COLUMN pet_items.preset_traits_json IS 
  'For eggs: JSON object defining preset traits for hatching. NULL means use name-based lookup.';
-- ---- migration: 20260204011439_046e7a76-73ea-428e-8b7c-56106668da96.sql ----

-- Allow parents to create/update/delete stamps for pets in their household
CREATE POLICY "Parents can manage stamps for household pets"
  ON public.pet_item_stamps
  FOR ALL
  USING (is_household_parent(auth.uid(), household_id))
  WITH CHECK (is_household_parent(auth.uid(), household_id));
-- ---- migration: 20260204162423_b43ecd20-5348-4495-9bc3-320cfb40365e.sql ----

-- Create trigger function for parent gifts to update pet points
CREATE OR REPLACE FUNCTION public.update_pet_points_on_parent_gift()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points_to_add integer;
BEGIN
  -- Get the item's point cost
  SELECT points_cost INTO v_points_to_add
  FROM public.pet_items
  WHERE id = NEW.item_id;
  
  -- Default to 1 if item not found (shouldn't happen)
  v_points_to_add := COALESCE(v_points_to_add, 1);
  
  -- Update pet stats atomically
  UPDATE public.pets
  SET 
    total_points_invested = total_points_invested + v_points_to_add,
    last_interaction_at = NOW(),
    is_dormant = false,
    dormant_since = NULL,
    updated_at = NOW()
  WHERE id = NEW.pet_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on pet_gifts table
CREATE TRIGGER trg_update_pet_points_on_parent_gift
  AFTER INSERT ON public.pet_gifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pet_points_on_parent_gift();

-- Backfill: Add missing parent gift points to existing pets
UPDATE public.pets p
SET total_points_invested = p.total_points_invested + subq.parent_gift_points
FROM (
  SELECT 
    pg.pet_id,
    SUM(pi.points_cost) as parent_gift_points
  FROM pet_gifts pg
  JOIN pet_items pi ON pg.item_id = pi.id
  GROUP BY pg.pet_id
) subq
WHERE p.id = subq.pet_id
  AND subq.parent_gift_points > 0;
-- ---- migration: 20260210231345_f8a838a4-80b5-4e3e-9d62-14f1d3710e45.sql ----

ALTER TABLE public.radio_preferences
  ADD COLUMN shuffle_deck UUID[] DEFAULT NULL,
  ADD COLUMN shuffle_deck_position INTEGER NOT NULL DEFAULT 0;
-- ---- migration: 20260216234039_2414fead-16e9-4529-adf4-3dead2ec3f56.sql ----


CREATE POLICY "Parents can update household pet items"
  ON public.pet_owned_items FOR UPDATE
  USING (is_household_parent(auth.uid(), household_id));

CREATE POLICY "Parents can delete household pet items"
  ON public.pet_owned_items FOR DELETE
  USING (is_household_parent(auth.uid(), household_id));

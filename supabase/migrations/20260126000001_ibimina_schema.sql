-- Ibimina Schema Migration
-- Defines tables, enums, and constraints for the Ibimina Flutter App.

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE ibimina_transaction_type AS ENUM ('CONTRIBUTION', 'PENALTY', 'PAYOUT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ibimina_submission_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ibimina_group_type AS ENUM ('PRIVATE', 'PUBLIC');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Update Public Groups Table (Extend existing table)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS type ibimina_group_type DEFAULT 'PRIVATE';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS code text UNIQUE;

-- 3. Memberships Table (New: Enforces 1:1 User-Group)
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'MEMBER', -- CHAIRPERSON, MEMBER
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT one_group_per_user UNIQUE (user_id)
);

-- RLS for Memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_read_own" ON public.memberships
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Submissions Table (Staging for Contributions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    amount numeric(14, 2) NOT NULL,
    proof text, -- SMS content or reference
    status ibimina_submission_status NOT NULL DEFAULT 'PENDING',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT max_contribution_cap CHECK (amount <= 4000)
);

-- RLS for Submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_insert_own" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "submissions_select_own" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Ledger Table (Canonical Immutable History)
CREATE TABLE IF NOT EXISTS public.ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id),
    group_id uuid NOT NULL REFERENCES public.groups(id),
    amount numeric(14, 2) NOT NULL,
    balance_snapshot numeric(16, 2) NOT NULL, -- User's balance in group at this time
    transaction_type ibimina_transaction_type NOT NULL DEFAULT 'CONTRIBUTION',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for Ledger
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_select_own" ON public.ledger
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ledger_select_group" ON public.ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() 
            AND group_id = public.ledger.group_id
        )
    );

-- 6. Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    user_id, 
    group_id, 
    SUM(amount) as total_savings
FROM public.ledger
GROUP BY user_id, group_id;

-- 7. Append-Only Enforcement for Ledger
CREATE OR REPLACE FUNCTION public.enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger is append-only. Updates and deletions are not allowed.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_immutable ON public.ledger;
CREATE TRIGGER trg_ledger_immutable
    BEFORE UPDATE OR DELETE ON public.ledger
    FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

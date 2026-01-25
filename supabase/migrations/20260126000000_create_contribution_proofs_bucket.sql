-- Create the contribution-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contribution-proofs', 'contribution-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload contribution proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contribution-proofs');

-- Policy: Allow authenticated users to read (SELECT)
CREATE POLICY "Authenticated users can view contribution proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contribution-proofs');

-- Policy: Allow users to view their own uploaded files (optional refinement, but above covers staff too)
-- For now, authenticated read is fine as staff needs to verify proofs.

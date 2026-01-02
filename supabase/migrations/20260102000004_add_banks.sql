-- Add Rwandan Commercial Banks to institutions table
-- All banks are located in Kigali

INSERT INTO public.institutions (name, type) VALUES
-- Commercial Banks
('I&M Bank Rwanda Plc.', 'BANK'),
('Bank of Kigali Plc.', 'BANK'),
('BPR Bank Rwanda Plc.', 'BANK'),
('GT Bank Plc.', 'BANK'),
('Eco bank Rwanda Plc.', 'BANK'),
('Access Bank Rwanda Plc.', 'BANK'),
('Equity Bank Rwanda Plc.', 'BANK'),
('BOA Rwanda Plc.', 'BANK'),
('NCBA Rwanda Plc.', 'BANK'),
-- Development Bank
('Rwanda Development Bank (BRD)', 'BANK'),
-- Cooperative Bank
('ZIGAMA CSS', 'BANK')
ON CONFLICT DO NOTHING;

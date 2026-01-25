-- Fix missing GOOD_STANDING enum value
-- This must run before it is used in policies (110000)

alter type group_member_status add value if not exists 'GOOD_STANDING';

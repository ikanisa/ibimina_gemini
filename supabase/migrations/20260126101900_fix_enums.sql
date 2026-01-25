-- Fix missing enum values
-- This must run before they are used in indexes/constraints

alter type group_member_status add value if not exists 'REJECTED';
alter type group_member_status add value if not exists 'LEFT';
alter type group_member_status add value if not exists 'GOOD_STANDING';

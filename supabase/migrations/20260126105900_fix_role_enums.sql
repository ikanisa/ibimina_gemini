-- Fix missing role enum values
-- This must run before they are used in indexes/policies

alter type group_member_role add value if not exists 'ADMIN';
alter type group_member_role add value if not exists 'OWNER';

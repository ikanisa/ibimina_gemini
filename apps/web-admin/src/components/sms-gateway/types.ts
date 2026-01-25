/**
 * Types for SMS Gateway Devices module
 */

export interface SmsGatewayDevice {
  id: string;
  institution_id: string;
  device_name: string;
  momo_code: string;
  status: 'active' | 'suspended';
  device_key_hash: string;
  last_sms_received_at: string | null;
  created_at: string;
  created_by: string | null;
  // Joined data
  institution_name?: string;
}

export interface MomoSmsRaw {
  id: number;
  device_id: string;
  institution_id: string;
  momo_code: string;
  sender: string | null;
  body: string;
  received_at: string | null;
  ingested_at: string;
  message_hash: string;
  parse_status: 'pending' | 'parsed' | 'failed';
  parse_error: string | null;
  parsed_at: string | null;
  meta: Record<string, unknown>;
}

export interface Institution {
  id: string;
  name: string;
}

export interface AddDeviceData {
  device_name: string;
  institution_id: string;
  momo_code: string;
}

export interface EditDeviceData {
  device_name: string;
  institution_id: string;
  momo_code: string;
}

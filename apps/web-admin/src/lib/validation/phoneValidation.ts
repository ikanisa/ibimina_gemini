/**
 * Phone Number Validation
 * 
 * Validates phone numbers, especially Rwandan format
 */

/**
 * Validate Rwandan phone number format
 * Format: +250XXXXXXXXX (12 digits total, starts with +250)
 */
export function validateRwandaPhone(phone: string): boolean {
  const rwandaPhoneRegex = /^\+250[0-9]{9}$/;
  return rwandaPhoneRegex.test(phone.trim());
}

/**
 * Normalize phone number to Rwandan format
 * Attempts to convert various formats to +250XXXXXXXXX
 */
export function normalizeRwandaPhone(phone: string): string {
  const cleaned = phone.trim().replace(/\s+/g, '');

  // Already in correct format
  if (cleaned.startsWith('+250') && cleaned.length === 13) {
    return cleaned;
  }

  // Remove leading zeros and add +250
  if (cleaned.startsWith('0')) {
    return `+250${cleaned.slice(1)}`;
  }

  // If starts with 250 (without +)
  if (cleaned.startsWith('250') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If it's just 9 digits, assume it's missing the country code
  if (/^[0-9]{9}$/.test(cleaned)) {
    return `+250${cleaned}`;
  }

  // Return as-is if we can't normalize
  return cleaned;
}

/**
 * Validate and normalize phone number
 * Returns normalized phone or throws error
 */
export function validateAndNormalizePhone(phone: string): string {
  const normalized = normalizeRwandaPhone(phone);
  
  if (!validateRwandaPhone(normalized)) {
    throw new Error('Invalid phone number format. Expected: +250XXXXXXXXX');
  }

  return normalized;
}


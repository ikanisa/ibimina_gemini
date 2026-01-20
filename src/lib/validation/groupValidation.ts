/**
 * Group Validation
 * 
 * Validation rules and utilities for group data
 */

export interface GroupValidationErrors {
  group_name?: string;
  expected_amount?: string;
  frequency?: string;
  meeting_day?: string;
}

/**
 * Validate group creation/update data
 */
export function validateGroupData(data: {
  group_name?: string;
  expected_amount?: number;
  frequency?: string;
  meeting_day?: string;
}): { isValid: boolean; errors: GroupValidationErrors } {
  const errors: GroupValidationErrors = {};

  // Validate group name
  if (!data.group_name || data.group_name.trim().length === 0) {
    errors.group_name = 'Group name is required';
  } else if (data.group_name.trim().length < 2) {
    errors.group_name = 'Group name must be at least 2 characters';
  } else if (data.group_name.trim().length > 100) {
    errors.group_name = 'Group name must be less than 100 characters';
  }

  // Validate expected amount (optional - only validate if provided)
  if (data.expected_amount !== undefined && data.expected_amount !== null) {
    if (data.expected_amount < 0) {
      errors.expected_amount = 'Expected amount cannot be negative';
    } else if (data.expected_amount > 100000000) {
      errors.expected_amount = 'Expected amount is too large';
    }
  }

  // Validate frequency
  if (data.frequency && !['Daily', 'Weekly', 'Monthly'].includes(data.frequency)) {
    errors.frequency = 'Frequency must be "Daily", "Weekly", or "Monthly"';
  }

  // Validate contribution day (optional but if provided, should be valid)
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (data.meeting_day && !validDays.includes(data.meeting_day)) {
    errors.meeting_day = `Contribution day must be one of: ${validDays.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors as Record<string, string>
  };

}

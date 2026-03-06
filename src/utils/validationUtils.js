/**
 * Utility functions for frontend form validation.
 * These functions enforce correct inputs without affecting business logic.
 */

// Basic email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number regex (allows +, spaces, dashes, parentheses, 10-15 digits)
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

/**
 * Validates if an email string is formatted correctly.
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates if a string is not empty or composed solely of whitespace.
 */
export const validateRequired = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

/**
 * Validates if the given text matches standard password rules
 * e.g., minimum 8 characters. (Can be adjusted to enforce caps, numbers, etc.)
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 8;
};

/**
 * Validates phone numbers using standard regex
 */
export const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    // If empty phone is allowed, remove it from the regex check or handle it in specific form validation
    return PHONE_REGEX.test(phone.trim());
};

/**
 * Validates if a given input is a valid number (e.g. for estimated hours)
 * Allows integers and decimals.
 */
export const validateNumeric = (value) => {
    if (value === null || value === undefined || value === '') return false;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
};

/**
 * Validates if the selected date is valid.
 */
export const validateDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

/**
 * Validates a form payload based on provided rules.
 * @param {Object} formData - The data to validate
 * @param {Object} rules - The validation rules per field
 * @returns {Object} An object containing error messages, or empty object if valid.
 */
export const validateForm = (formData, rules) => {
    const errors = {};

    Object.entries(rules).forEach(([field, fieldRules]) => {
        const value = formData[field];

        // Check required first
        if (fieldRules.required && !validateRequired(value)) {
            errors[field] = fieldRules.requiredMessage || 'This field is required.';
            return; // Skip further validations if empty and required
        }

        // If not required and empty, skip format validation
        if (!validateRequired(value)) return;

        if (fieldRules.email && !validateEmail(value)) {
            errors[field] = fieldRules.emailMessage || 'Please enter a valid email address.';
        } else if (fieldRules.phone && !validatePhone(value)) {
            errors[field] = fieldRules.phoneMessage || 'Please enter a valid phone number.';
        } else if (fieldRules.password && !validatePassword(value)) {
            errors[field] = fieldRules.passwordMessage || 'Password must be at least 8 characters long.';
        } else if (fieldRules.numeric && !validateNumeric(value)) {
            errors[field] = fieldRules.numericMessage || 'Please enter a valid positive number.';

            // additional check for strict ranges if requested
            if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
                errors[field] = `Value must be at least ${fieldRules.min}.`;
            }
            if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
                errors[field] = `Value cannot exceed ${fieldRules.max}.`;
            }
        } else if (fieldRules.match) {
            if (value !== formData[fieldRules.match]) {
                errors[field] = fieldRules.matchMessage || 'Values do not match.';
            }
        } else if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors[field] = fieldRules.minLengthMessage || `Must be at least ${fieldRules.minLength} characters.`;
        }
    });

    return errors;
};

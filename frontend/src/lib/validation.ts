export const EMAIL_MIN_LENGTH = 3;
export const EMAIL_MAX_LENGTH = 40;

/** Letters/numbers + dots only; domain like gmail.com (no special chars) */
const EMAIL_PATTERN = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export const EMAIL_HINT =
  "3–40 characters, no spaces, letters and numbers only (e.g. user@gmail.com)";

export const PASSWORD_HINT =
  "Minimum 8 characters with 1 uppercase letter, 1 number, and 1 special character";

/** Strip spaces and cap length while typing */
export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s/g, "").slice(0, EMAIL_MAX_LENGTH);
}

export function normalizeEmail(email: string): string {
  return sanitizeEmailInput(email).toLowerCase();
}

export function validateEmail(email: string): string | null {
  const trimmed = sanitizeEmailInput(email.trim());
  if (!trimmed) return "Email is required";
  if (/\s/.test(email)) return "Email cannot contain spaces";
  if (trimmed.length < EMAIL_MIN_LENGTH) {
    return `Email must be at least ${EMAIL_MIN_LENGTH} characters`;
  }
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Enter a valid email like user@gmail.com (letters and numbers only, no special characters)";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  if (!PASSWORD_SPECIAL.test(password)) {
    return "Password must include at least one special character";
  }
  return null;
}

/** Login / sign-in — email rules only; password must be present */
export function validateLoginForm(email: string, password: string): string | null {
  const emailErr = validateEmail(email);
  if (emailErr) return emailErr;
  if (!password?.trim()) return "Password is required";
  return null;
}

/** Register / sign-up / admin create merchant — email + password rules */
export function validateSignupForm(
  email: string,
  password: string,
  options?: { name?: string }
): string | null {
  if (options?.name !== undefined && !options.name.trim()) {
    return "Name is required";
  }
  const emailErr = validateEmail(email);
  if (emailErr) return emailErr;
  return validatePassword(password);
}

/** Change password / reset password */
export function validateNewPasswordForm(
  password: string,
  confirmPassword?: string
): string | null {
  const pwdErr = validatePassword(password);
  if (pwdErr) return pwdErr;
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}

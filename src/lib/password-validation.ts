export const MIN_PASSWORD_LENGTH = 6;

export function getPasswordValidationError(password: unknown, label = "Password"): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `${label} minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }

  if (password.trim().length === 0) {
    return `${label} tidak boleh hanya berisi spasi.`;
  }

  return null;
}

export function isValidPassword(password: unknown): password is string {
  return getPasswordValidationError(password) === null;
}

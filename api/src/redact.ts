// Strips connection strings from error messages before they are logged.
// The Neon driver embeds the full connection string in some errors.

export function redactSecrets(message: string): string {
  return message
    .replace(/\(connection string:[^)]*\)/gi, '(connection string: [redacted])')
    .replace(/postgres(ql)?:\/\/\S+/gi, '[redacted]');
}

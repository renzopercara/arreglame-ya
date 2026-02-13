/**
 * StartVerificationCode Value Object
 * Immutable 4-digit code for service start verification
 */
export class StartVerificationCode {
  private constructor(public readonly code: string) {
    if (!/^\d{4}$/.test(code)) {
      throw new Error('Verification code must be exactly 4 digits');
    }
  }

  static generate(): StartVerificationCode {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    return new StartVerificationCode(code);
  }

  static from(code: string): StartVerificationCode {
    return new StartVerificationCode(code);
  }

  matches(inputCode: string): boolean {
    return this.code === inputCode;
  }

  toString(): string {
    return this.code;
  }

  toJSON() {
    return this.code;
  }
}

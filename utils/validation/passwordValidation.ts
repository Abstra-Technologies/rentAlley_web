export type PasswordRulesResult = {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    isStrong: boolean;
};

export function validatePassword(password: string): PasswordRulesResult {
    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    return {
        ...rules,
        isStrong: Object.values(rules).every(Boolean),
    };
}

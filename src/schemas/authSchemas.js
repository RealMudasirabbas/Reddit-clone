import z from 'zod';

const signUpSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.email(),
    password: z.string().min(8).max(64),
});

const verifyEmailSchema = z.object({
    verificationToken: z.string(),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8).max(64),
    token: z.string().optional(),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
    email: z.email(),
});

const resetPasswordSchema = z.object({
    resetToken: z.string(),
    password: z.string().min(8).max(64),
});

const twoFactorAuthVerifySchema = z.object({
    token: z.string(),
});

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(8).max(64),
    newPassword: z.string().min(8).max(64),
});

export default function exportAuthSchemas() {
    return {
        signUpSchema,
        verifyEmailSchema,
        loginSchema,
        refreshTokenSchema,
        forgotPasswordSchema,
        resetPasswordSchema,
        twoFactorAuthVerifySchema,
        updatePasswordSchema,
    };
}

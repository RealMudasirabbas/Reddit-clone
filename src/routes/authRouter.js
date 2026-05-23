import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    ForgotPassword,
    LoggedUser,
    Login,
    Logout,
    RefreshToken,
    ResetPassword,
    SignUp,
    TwoFactorAuthSetup,
    TwoFactorAuthVerify,
    UpdatePassword,
    VerifyEmail,
} from '../controllers/authController.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import authMiddleware from '../middlewares/auth.js';
import { exporter } from '../../utils/exporter.js';
const { authSchemas } = exporter;

const router = Router();

router.post(
    '/sign-up',
    validateSchema(authSchemas.signUpSchema),
    asyncHandler(SignUp)
);

router.post(
    '/verify-email',
    validateSchema(authSchemas.verifyEmailSchema),
    asyncHandler(VerifyEmail)
);

router.post(
    '/login',
    validateSchema(authSchemas.loginSchema),
    asyncHandler(Login)
);

router.post(
    '/refresh',
    validateSchema(authSchemas.refreshTokenSchema),
    asyncHandler(RefreshToken)
);

router.get('/me', authMiddleware, asyncHandler(LoggedUser));

router.post(
    '/forgot-password',
    validateSchema(authSchemas.forgotPasswordSchema),
    asyncHandler(ForgotPassword)
);

router.post(
    '/reset-password',
    validateSchema(authSchemas.resetPasswordSchema),
    asyncHandler(ResetPassword)
);

router.patch(
    '/update-password',
    authMiddleware,
    validateSchema(authSchemas.updatePasswordSchema),
    asyncHandler(UpdatePassword)
);
router.post('/2fa/setup', authMiddleware, asyncHandler(TwoFactorAuthSetup));

router.post(
    '/2fa/verify',
    validateSchema(authSchemas.twoFactorAuthVerifySchema),
    authMiddleware,
    asyncHandler(TwoFactorAuthVerify)
);

router.post('/logout', authMiddleware, asyncHandler(Logout));

export default router;

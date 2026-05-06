import { exporter } from '../../utils/exporter.js';
const { apiResponse, randomBytes } = exporter;
import {
    loginService,
    refreshTokenService,
    signUpService,
    verifyEmailService,
    loggedUserService,
    forgotPasswordService,
    resetPasswordService,
    twoFactorAuthSetupService,
    verifyTwoFactorTokenService,
    logoutService,
} from '../services/authService.js';

export async function SignUp(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return apiResponse(res, 'Please provide all credentials', {}, 400);
    }
    const authServiceResponse = await signUpService(username, email, password);

    if (authServiceResponse.isUserAlreadyExist) {
        return apiResponse(res, 'user already exist', {}, 400);
    }

    if (authServiceResponse.emailError) {
        return apiResponse(
            res,
            'verification email could not be sent. please try again',
            {},
            500
        );
    }

    if (authServiceResponse.isUserUpdated) {
        return apiResponse(
            res,
            'user already exist but email is not verified. verification email has been resent',
            {},
            200
        );
    }

    return apiResponse(
        res,
        'user created successfully. please verify your email',
        {},
        201
    );
}

export async function VerifyEmail(req, res) {
    const { verificationToken } = req.body;

    if (!verificationToken) {
        return apiResponse(res, 'please provide verification token', {}, 400);
    }
    const refreshToken = randomBytes(32).toString('hex');

    const verifyEmailServiceResponse = await verifyEmailService(
        verificationToken,
        refreshToken
    );

    if (verifyEmailServiceResponse.userNotFound) {
        return apiResponse(res, 'invalid verification token', {}, 404);
    }
    if (verifyEmailServiceResponse.tokenExpired) {
        return apiResponse(res, 'verification token has expired', {}, 400);
    }
    if (verifyEmailServiceResponse.usernameExists) {
        return apiResponse(res, 'username already exists', {}, 400);
    }
    if (verifyEmailServiceResponse.emailExists) {
        return apiResponse(res, 'email already exists', {}, 400);
    }

    return apiResponse(
        res,
        'email verified successfully',
        { ...verifyEmailServiceResponse },
        200
    );
}

export async function Login(req, res) {
    const { email, password, token = null } = req.body;

    if (!email || !password) {
        return apiResponse(res, 'please provide email or password', {}, 400);
    }

    const loginServiceResponse = await loginService(email, password, token);

    if (loginServiceResponse.userNotFound) {
        return apiResponse(res, 'user not found', {}, 404);
    } else if (loginServiceResponse.invalidPassword) {
        return apiResponse(res, 'wrong password', {}, 400);
    } else if (loginServiceResponse.invalidTwoFactorToken) {
        return apiResponse(res, 'invalid two factor passcode', {}, 400);
    }

    return apiResponse(
        res,
        'user logged in successfully',
        {
            accessToken: loginServiceResponse.accessToken,
            refreshToken: loginServiceResponse.refreshToken,
        },
        200
    );
}

export async function RefreshToken(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return apiResponse(res, 'please send refresh token', {}, 400);
    }

    const refreshTokenServiceResponse = await refreshTokenService(refreshToken);
    if (refreshTokenServiceResponse.refreshTokenNotFound) {
        return apiResponse(res, 'refresh Token not found', {}, 401);
    } else if (refreshTokenServiceResponse.refreshTokenExpired) {
        return apiResponse(
            res,
            'refresh token expired.please login again',
            {},
            401
        );
    }

    return apiResponse(
        res,
        'refreshToken generated successfully',
        {
            accessToken: refreshTokenServiceResponse.accessToken,
        },
        201
    );
}

export async function LoggedUser(req, res) {
    const { id } = req.user;

    const loggedUserServiceResponse = await loggedUserService(id);

    if (loggedUserServiceResponse.userNotFound) {
        return apiResponse(res, 'user not found', {}, 404);
    }

    return apiResponse(
        res,
        'user data retrieved successfully',
        {
            userId: loggedUserServiceResponse.id,
            username: loggedUserServiceResponse.username,
            email: loggedUserServiceResponse.email,
        },
        200
    );
}

export async function ForgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return apiResponse(res, 'please provide a valid email', {}, 400);
    }

    const forgotPasswordServiceResponse = await forgotPasswordService(email);

    if (forgotPasswordServiceResponse.userNotFound) {
        return apiResponse(res, 'user not found', {}, 404);
    }
    if (forgotPasswordServiceResponse.emailNotSent) {
        return apiResponse(res, 'email could not be sent', {}, 500);
    }
    return apiResponse(
        res,
        'If this email exists, a reset link has been sent',
        {},
        200
    );
}

export async function ResetPassword(req, res) {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
        return apiResponse(res, 'please provide token or password', {}, 400);
    }

    const resetPasswordServiceResponse = await resetPasswordService(
        resetToken,
        password
    );

    if (resetPasswordServiceResponse.userNotFound) {
        return apiResponse(res, 'invalid or expired reset token', {}, 404);
    }

    if (resetPasswordServiceResponse.tokenExpired) {
        return apiResponse(res, 'token has expired. please try again', {}, 400);
    }

    if (resetPasswordServiceResponse.passwordReset) {
        return apiResponse(res, 'password reset successfully', {}, 200);
    }

    return apiResponse(res, 'password did not get reset', {}, 500);
}

export async function TwoFactorAuthSetup(req, res) {
    const { id: userId } = req.user;

    const twoFactorAuthSetupResponse = await twoFactorAuthSetupService(userId);

    if (twoFactorAuthSetupResponse.userNotFound) {
        return apiResponse(res, 'user not found', {}, 404);
    }

    if (twoFactorAuthSetupResponse.status === 'success') {
        return apiResponse(
            res,
            'qr code sent successfully',
            { qrCodeSetup: twoFactorAuthSetupResponse.qrCodeSetup },
            201
        );
    }

    return apiResponse(res, 'failed to generate qr code', {}, 500);
}

export async function TwoFactorAuthVerify(req, res) {
    const { token } = req.body;
    const { id: userId } = req.user;

    const verifyTwoFactorTokenResponse = await verifyTwoFactorTokenService(
        userId,
        token
    );
    if (verifyTwoFactorTokenResponse.userNotFound) {
        return apiResponse(res, 'user not found', {}, 404);
    }
    if (verifyTwoFactorTokenResponse.twoFactorVerified) {
        return apiResponse(
            res,
            'two factor auth verified successfully',
            {},
            200
        );
    } else {
        return apiResponse(res, 'invalid token', {}, 400);
    }
}

export async function Logout(req, res) {
    const { id: userId } = req.user;

    const logoutServiceResponse = await logoutService(userId);

    if (logoutServiceResponse.loggedOut) {
        return apiResponse(res, 'logged out successfully', {}, 200);
    } else {
        return apiResponse(res, 'failed to log out', {}, 500);
    }
}

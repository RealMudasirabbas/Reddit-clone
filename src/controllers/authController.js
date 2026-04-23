import { exporter } from "../../utils/exporter.js";
const { apiResponse, randomBytes} = exporter;
import { signUpService,verifyEmailService } from "../services/authService.js";
export async function SignUp(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return apiResponse(res, "Please provide all credentials", {}, 400);
  }
  const authServiceResponse = await signUpService(username, email, password);

  if (authServiceResponse.isUserAlreadyExist) {
    return apiResponse(res, "user already exist", {}, 400);
  }

  if (authServiceResponse.emailError) {
    return apiResponse(
      res,
      "verification email could not be sent. please try again",
      {},
      500,
    );
  }

  if (authServiceResponse.isUserUpdated) {
    return apiResponse(
      res,
      "user already exist but email is not verified. verification email has been resent",
      {},
      200,
    );
  }

  return apiResponse(
    res,
    "user created successfully. please verify your email",
    {},
    201,
  );
}

export async function VerifyEmail(req, res) {
  const { verificationToken } = req.body;

  if (!verificationToken) {
    return apiResponse(res, "please provide verification token", {}, 400);
  }
  const refreshToken = randomBytes(32).toString("hex");

  const verifyEmailServiceResponse = await verifyEmailService(
    verificationToken,
    refreshToken,
  );

  if (verifyEmailServiceResponse.userNotFound){
    return apiResponse(res, "invalid verification token", {}, 404);
  }
  if (verifyEmailServiceResponse.tokenExpired) {
    return apiResponse(res, "verification token has expired", {}, 400);
  }
  if (verifyEmailServiceResponse.usernameExists) {
    return apiResponse(res, "username already exists", {}, 400);
  }
  if (verifyEmailServiceResponse.emailExists) {
    return apiResponse(res, "email already exists", {}, 400);
  }

  return apiResponse(
    res,
    "email verified successfully",
    { ...verifyEmailServiceResponse },
    200,
  );
}

export async function Login(req, res) {
  const { email, password, token = null } = req.body;

  if (!email || !password) {
    return apiResponse(res, "please provide email or password", {}, 400);
  }

  const fetchUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!fetchUser) {
    return apiResponse(res, "user not found", {}, 404);
  }
  const validatePassword = await bcrypt.compare(password, fetchUser.password);
  if (!validatePassword) {
    return apiResponse(res, "invalid password", {}, 400);
  }

  if (fetchUser.twoFactorEnabled) {
    const isTokenValid = await verify({
      token,
      secret: fetchUser.twoFactorSecret,
      strategy: "totp",
    });
    if (!isTokenValid.valid) {
      return apiResponse(
        res,
        "invalid two factor authentication token",
        {},
        400,
      );
    }
  }

  const accessToken = jwt.sign(
    { userId: fetchUser.id, username: fetchUser.username },
    process.env.JWT_SECRET,
    { expiresIn: "15min" },
  );

  const isRefreshTokenExist = await prisma.refreshToken.findFirst({
    where: { userId: fetchUser.id },
  });

  if (!isRefreshTokenExist) {
    const createNewRefreshToken = randomBytes(32).toString("hex");
    await prisma.refreshToken.create({
      data: {
        refreshToken: createNewRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: fetchUser.id,
      },
    });
    return apiResponse(
      res,
      "user logged in successfully",
      { accessToken, refreshToken: createNewRefreshToken },
      200,
    );
  }

  if (isRefreshTokenExist.expiresAt < new Date()) {
    const createNewRefreshToken = randomBytes(32).toString("hex");
    await prisma.refreshToken.update({
      where: { id: isRefreshTokenExist.id },
      data: {
        refreshToken: createNewRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: fetchUser.id,
      },
    });
    return apiResponse(
      res,
      "user logged in successfully",
      { accessToken, refreshToken: createNewRefreshToken },
      200,
    );
  }

  return apiResponse(
    res,
    "user logged in successfully",
    { accessToken, refreshToken: isRefreshTokenExist.refreshToken },
    200,
  );
}

export async function RefreshToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return apiResponse(res, "please send refresh token", {}, 400);
  }

  const isRefreshTokenExist = await prisma.refreshToken.findFirst({
    where: { refreshToken },
  });

  if (!isRefreshTokenExist) {
    return apiResponse(res, "refresh token does not exist", {}, 401);
  }

  if (isRefreshTokenExist.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: isRefreshTokenExist.id },
    });
    return apiResponse(
      res,
      "refresh token expired. please log in again",
      {},
      401,
    );
  }

  const { accessToken } = await generateAccessAndRefreshTokens(
    isRefreshTokenExist.userId,
  );
  return apiResponse(
    res,
    "access token created successfully",
    { accessToken },
    201,
  );
}

export async function LoggedUser(req, res) {
  const { id } = req.user;

  const foundUser = await prisma.user.findUnique({
    where: { id },
    omit: { password: true },
  });

  if (!foundUser) {
    return apiResponse(res, "user not found", {}, 404);
  }

  return apiResponse(
    res,
    "user data has been retrieved successfully",
    {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
    },
    200,
  );
}

export async function ForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return apiResponse(res, "please provide a valid email", {}, 400);
  }

  const findUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!findUser) {
    return apiResponse(
      res,
      "If this email exists, a reset link has been sent",
      {},
      200,
    );
  }

  const resetToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: findUser.id },
    data: {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const result = await resendEmail(email, resetToken);
  if (result?.err) {
    return apiResponse(res, "email could not be sent", {}, 500);
  }

  return apiResponse(
    res,
    "If this email exists, a reset link has been sent",
    {},
    200,
  );
}

export async function ResetPassword(req, res) {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) {
    return apiResponse(res, "please provide token or password", {}, 400);
  }

  const findUser = await prisma.user.findUnique({
    where: { resetToken },
  });

  if (!findUser) {
    return apiResponse(res, "user not found", {}, 404);
  }

  if (findUser.resetTokenExpiry < new Date()) {
    return apiResponse(res, "token has expired. please try again", {}, 400);
  }

  const genSalt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, genSalt);

  await prisma.user.update({
    where: { id: findUser.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return apiResponse(res, "password reset successfully", {}, 200);
}

export async function TwoFactorAuthSetup(req, res) {
  const { id: userId } = req.user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const generateTwoFactorSecret = generateSecret();
  const uri = generateURI({
    issuer: "Nexus",
    label: user.email,
    secret: generateTwoFactorSecret,
    strategy: "totp",
  });

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: generateTwoFactorSecret },
  });

  const qrCodeSetup = await qrcode.toDataURL(uri);
  return apiResponse(res, "qr code sent successfully", { qrCodeSetup }, 201);
}

export async function TwoFactorAuthVerify(req, res) {
  const { token } = req.body;
  const { id: userId } = req.user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const verifyToken = await verify({
    token,
    secret: user.twoFactorSecret,
    strategy: "totp",
  });

  if (verifyToken.valid) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return apiResponse(res, "two factor auth verified successfully", {}, 200);
  }

  return apiResponse(res, "invalid token", {}, 400);
}

export async function Logout(req, res) {
  const { id: userId } = req.user;

  const token = await prisma.refreshToken.findFirst({
    where: { userId },
  });

  if (token) {
    await prisma.refreshToken.delete({
      where: { id: token.id },
    });
  }

  return apiResponse(res, "user logged out", {}, 200);
}

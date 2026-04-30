import { exporter } from "../../utils/exporter.js";

const {
  prisma,
  bcrypt,
  jwt,
  randomBytes,
  resendEmail,
  verify,
  generateAccessAndRefreshTokens,
  generateSecret,
  generateURI,
  qrcode,
} = exporter;

export async function signUpService(username, email, password) {
  const existingPendingUser = await prisma.pendingUser.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const verificationToken = randomBytes(32).toString("hex");

  if (existingPendingUser) {
    if (
      existingPendingUser.username === username &&
      existingPendingUser.email === email
    ) {
      return { isUserAlreadyExist: true };
    } else if (
      existingPendingUser.email != email ||
      existingPendingUser.username != username
    ) {
      await prisma.pendingUser.update({
        where: { id: existingPendingUser.id },
        data: {
          username,
          email,
          password: hashedPassword,
          verificationToken,
          verificationTokenExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
        },
      });
      const emailResponse = await resendEmail(
        email,
        verificationToken,
        "verify-email",
      );
      if (emailResponse?.err) return { emailError: true };
      return { isUserUpdated: true };
    }
  } else {
    await prisma.pendingUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    });
    const emailResponse = await resendEmail(
      email,
      verificationToken,
      "verify-email",
    );
    if (emailResponse?.err) return { emailError: true };
    return { userCreated: true };
  }
}

export async function verifyEmailService(verificationToken, refreshToken) {
  const isUserExist = await prisma.pendingUser.findFirst({
    where: { verificationToken },
  });

  if (!isUserExist) {
    return { userNotFound: true };
  }

  if (isUserExist.verificationTokenExpiry < new Date()) {
    return { tokenExpired: true };
  }

  const isUsernameOrEmailAvailable = await prisma.user.findFirst({
    where: {
      OR: [{ username: isUserExist.username }, { email: isUserExist.email }],
    },
  });

  if (isUsernameOrEmailAvailable?.username) {
    return { usernameExists: true };
  } else if (isUsernameOrEmailAvailable?.email) {
    return { emailExists: true };
  }

  const savedUser = await prisma.$transaction(async (tx) => {
    const newUser =await tx.user.create({
      data: {
        username: isUserExist.username,
        email: isUserExist.email,
        password: isUserExist.password,
      },
    });

    await tx.refreshToken.create({
      data: {
        refreshToken,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.pendingUser.delete({
      where: { id: isUserExist.id },
    });

    return newUser;
  });

  const token = jwt.sign(
    { userId: savedUser.id, username: savedUser.username },
    process.env.JWT_SECRET,
    { expiresIn: "15min" },
  );

  return { user: savedUser, accessToken: token };
}

export async function loginService(email, password, token) {
  const fetchUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!fetchUser) {
    return { userNotFound: true };
  }
  const validatePassword = await bcrypt.compare(password, fetchUser.password);
  if (!validatePassword) {
    return { invalidPassword: true };
  }

  if (fetchUser.twoFactorEnabled) {
    const isTokenValid = await verify({
      token,
      secret: fetchUser.twoFactorSecret,
      strategy: "totp",
    });
    if (!isTokenValid.valid) {
      return { invalidTwoFactorToken: true };
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
    return { accessToken, refreshToken: createNewRefreshToken };
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
    return { accessToken, refreshToken: createNewRefreshToken };
  }

  return { accessToken, refreshToken: isRefreshTokenExist.refreshToken };
}

export async function refreshTokenService(refreshToken) {
  const isRefreshTokenExist = await prisma.refreshToken.findFirst({
    where: { refreshToken },
  });

  if (!isRefreshTokenExist) {
    return { refreshTokenNotFound: true };
  }

  if (isRefreshTokenExist.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: isRefreshTokenExist.id },
    });
    return { refreshTokenExpired: true };
  }

  const { accessToken } = await generateAccessAndRefreshTokens(
    isRefreshTokenExist.userId,
  );
  return { accessToken: accessToken };
}

export async function loggedUserService(id) {
  const foundUser = await prisma.user.findUnique({
    where: { id },
    omit: { password: true },
  });

  if (!foundUser) {
    return { userNotFound: true };
  }

  return {
    id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
  };
}

export async function forgotPasswordService(email) {
  const findUser = await prisma.user.findFirst({
    where: { email },
  });

  if (!findUser) {
    return { userNotFound: true };
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
    return { emailNotSent: true };
  }

  return { emailSent: true };
}

export async function resetPasswordService(resetToken, newPassword) {
  const findUser = await prisma.user.findUnique({
    where: { resetToken },
  });

  if (!findUser) {
    return { userNotFound: true };
  }

  if (findUser.resetTokenExpiry < new Date()) {
    return { tokenExpired: true };
  }

  const genSalt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, genSalt);

  await prisma.user.update({
    where: { id: findUser.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { passwordReset: true };
}

export async function twoFactorAuthSetupService(userId) {
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
  return { status: "success", qrCodeSetup };
}

export async function verifyTwoFactorTokenService(userId, token) {
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
    return { twoFactorVerified: true };
  }

  return { twoFactorVerified: false };
}

export async function logoutService(userId) {
  const token = await prisma.refreshToken.findFirst({
    where: { userId },
  });

  if (token) {
    await prisma.refreshToken.delete({
      where: { id: token.id },
    });
  }

  return { loggedOut: true };
}

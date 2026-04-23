import { exporter } from "../../utils/exporter.js";

const { prisma, bcrypt,jwt, randomBytes, resendEmail } = exporter;

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

export async function verifyEmailService(verificationToken,refreshToken) {
  

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



  const savedUser = await prisma.user.create({
    data: {
      username: isUserExist.username,
      email: isUserExist.email,
      password: isUserExist.password,
    },
  });
  const token = jwt.sign(
    { userId: savedUser.id, username: savedUser.username },
    process.env.JWT_SECRET,
    { expiresIn: "15min" },
  );
  await prisma.refreshToken.create({
    data: {
      refreshToken,
      userId: savedUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.pendingUser.delete({
    where: { id: isUserExist.id },
  });

  return { user: savedUser,accessToken: token };
}

export async function loginService(req, res) {}

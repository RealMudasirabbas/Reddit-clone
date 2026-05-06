async function generateAccessAndRefreshTokens(id, isTokenExist = false) {
    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) throw new Error('User not found');

    const accessToken = jwt.sign(
        { userId: id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15min' }
    );

    if (isTokenExist) {
        const refreshToken = randomBytes(32).toString('hex');
        await prisma.refreshToken.create({
            data: {
                refreshToken,
                userId: id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return { accessToken, refreshToken };
    }

    return { accessToken };
}

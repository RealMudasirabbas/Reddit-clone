import jwt from "jsonwebtoken";

async function authMiddleware(req, res, next) {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).json({
      message: "no token is provided",
    });
  }
  const cleanToken = authToken.split(" ")[1];
  try {
    const decodedToken = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const { userId, username } = decodedToken;
    req.user = { id: userId, username };
    next();
  } catch (error) {
    return res.status(401).json({
      message: `error occured in middleware:${error}`
    });
  }
}

export default authMiddleware;

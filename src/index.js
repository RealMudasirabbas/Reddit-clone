import express from "express";
import authRouter from "./routes/authRouter.js";
import subredditRouter from "./routes/subredditRouter.js"
import commentRouter from "./routes/commentRouter.js"
import voteRouter from "./routes/voteRouter.js"
import resendEmail from "../utils/resendEmail.js";
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use("/api/email",resendEmail)
app.use("/api/auth",authRouter)
app.use("/api/subreddits",subredditRouter)
app.use("/api/comments",commentRouter)
app.use("/api/votes",voteRouter)


app.listen(port, () => {
  console.log("Server is listening on PORT", port);
});

export default app;
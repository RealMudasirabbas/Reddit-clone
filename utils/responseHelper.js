export default function apiResponse(res, message, response = {}, status = 200) {
  return res.status(status).json({
    message,
    response,
  });
}

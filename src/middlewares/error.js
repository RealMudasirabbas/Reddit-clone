import apiResponse from "./../../utils/responseHelper.js";

async function errorHandler(err, req, res, next) {
  return apiResponse(res, err.message, {}, err.status || 500);
}

export default errorHandler;

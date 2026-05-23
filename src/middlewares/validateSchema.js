import z from 'zod';
import apiResponse from './../../utils/responseHelper.js';

export const validateSchema =
    (schema, source = 'body') =>
    (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (result.error) {
            return apiResponse(res, result.error.issues[0].message, {}, 400);
        }
        if (result.success) {
            req[source] = result.data;
            next();
        }
    };

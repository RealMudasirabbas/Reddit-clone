import jwt from 'jsonwebtoken';
import { prisma } from '../src/db/prisma-helper.js';
import bcrypt from 'bcryptjs';
import apiResponse from '../utils/responseHelper.js';
import { randomBytes } from 'crypto';
import generateAccessAndRefreshTokens from './generateTokens.js';
import resendEmail from './resendEmail.js';
import { generate, generateSecret, verify, generateURI } from 'otplib';
import qrcode from 'qrcode';
import exportAuthSchemas from '../src/schemas/authSchemas.js';
import exportCommentSchemas from '../src/schemas/commentSchemas.js';
import exportCommonSchemas from '../src/schemas/commonSchemas.js';
import exportSubredditSchemas from '../src/schemas/subredditSchemas.js';
import exportVoteSchemas from '../src/schemas/voteSchemas.js';

const authSchemas = exportAuthSchemas();
const commentSchemas = exportCommentSchemas();
const commonSchemas = exportCommonSchemas();
const subredditSchemas = exportSubredditSchemas();
const voteSchemas = exportVoteSchemas();

export const exporter = {
    jwt,
    prisma,
    bcrypt,
    apiResponse,
    randomBytes,
    generateAccessAndRefreshTokens,
    resendEmail,
    generate,
    generateSecret,
    verify,
    generateURI,
    qrcode,
    authSchemas,
    commentSchemas,
    commonSchemas,
    subredditSchemas,
    voteSchemas,
};

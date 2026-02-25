import { asyncHandler } from '../../utils/asyncHandler.js';
import { login } from './auth.service.js';

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await login(email, password);
  res.json(data);
});

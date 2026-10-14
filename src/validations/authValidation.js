const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين').max(80),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').max(120),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف').max(64),
  role: z.enum(['user', 'vendor', 'doctor']).optional().default('user'),
  phone: z.string().max(20).optional().default(''),
  organization: z.string().max(100).optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
});

module.exports = {
  registerSchema,
  loginSchema,
};

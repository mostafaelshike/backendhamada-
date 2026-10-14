const { z } = require('zod');

const createOrderSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل').max(100),
    email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
    phone: z.string().min(8, 'رقم الهاتف غير صحيح').max(20),
    hospitalOrClinic: z.string().max(150).optional().default(''),
    city: z.string().min(2, 'يرجى تحديد المدينة').max(100),
    address: z.string().min(5, 'يرجى تزويد العنوان بالتفصيل').max(300),
    postalCode: z.string().max(20).optional().default(''),
    notes: z.string().max(500).optional().default(''),
  }),
  items: z.array(
    z.object({
      product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف المنتج غير صحيح'),
      quantity: z.number().int().positive('الكمية يجب أن تكون عدداً صحيحاً موجباً').max(500, 'الكمية تتجاوز الحد الأقصى لكل طلب'),
    })
  ).min(1, 'يجب أن يحتوي الطلب على منتج واحد على الأقل'),
  paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer', 'mada', 'tabby']).default('cash_on_delivery'),
  notes: z.string().max(500).optional(),
});

module.exports = {
  createOrderSchema,
};

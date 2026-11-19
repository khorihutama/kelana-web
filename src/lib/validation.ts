import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama terlalu panjang.'),
    email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72, 'Kata sandi maksimal 72 karakter.'),
    confirm: z.string().min(1, 'Ulangi kata sandi.'),
    terms: z.literal(true, { message: 'Setujui syarat & kebijakan dulu.' }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Kata sandi tidak sama.',
  });

export const participantSchema = z.object({
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter.'),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Pilih gender.' }),
  phone: z
    .string()
    .min(1, 'Nomor telepon wajib diisi.')
    .regex(/^\+62\d{8,14}$/, 'Gunakan format +62 diikuti 8-14 angka.'),
  email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
});

export type ParticipantForm = z.infer<typeof participantSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type SignInForm = z.infer<typeof signInSchema>;

export function flattenIssues(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    result[key] ??= issue.message;
  }
  return result;
}
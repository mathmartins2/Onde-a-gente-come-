import { z } from 'zod'
import { ratingConfiguration } from '@/lib/scoring/configuration'

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Usuário precisa de pelo menos 2 caracteres')
    .max(32, 'Usuário muito longo')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou underline'),
  password: z.string().min(8, 'Senha precisa de pelo menos 8 caracteres').max(200, 'Senha muito longa'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual').max(200),
    newPassword: z.string().min(8, 'A nova senha precisa de pelo menos 8 caracteres').max(200),
    confirmPassword: z.string().min(8).max(200),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'A nova senha precisa ser diferente da atual',
    path: ['newPassword'],
  })

export const pinSchema = z.object({
  pin: z
    .string()
    .regex(/^\d{4}$/, 'O PIN precisa ter exatamente 4 dígitos'),
})

export const setPinSchema = z
  .object({
    pin: z.string().regex(/^\d{4}$/, 'O PIN precisa ter exatamente 4 dígitos'),
    confirmPin: z.string().regex(/^\d{4}$/, 'O PIN precisa ter exatamente 4 dígitos'),
    password: z.string().min(1, 'Confirme com sua senha').max(200),
  })
  .refine((values) => values.pin === values.confirmPin, {
    message: 'Os PINs não conferem',
    path: ['confirmPin'],
  })

export const restaurantSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do restaurante').max(120, 'Nome muito longo'),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  neighborhood: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  cuisines: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  website: z.string().trim().url('Site inválido').max(300).optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  placeSource: z.string().trim().max(40).optional().or(z.literal('')),
  placeReference: z.string().trim().max(120).optional().or(z.literal('')),
})

export const placeSearchSchema = z.object({
  term: z.string().trim().min(3, 'Digite pelo menos 3 letras').max(120, 'Busca muito longa'),
})

export const placeLinkSchema = z.object({
  link: z.string().trim().url('Link inválido').max(2000, 'Link muito longo'),
})

export const nominationSchema = z.object({
  restaurantId: z.uuid('Restaurante inválido'),
})

export const vetoSchema = z.object({
  nominationId: z.uuid('Indicação inválida'),
})

export const ratingSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'O PIN precisa ter exatamente 4 dígitos'),
  memberId: z.uuid('Membro inválido'),
  score: z.coerce
    .number()
    .min(ratingConfiguration.minimumScore, 'Nota mínima é 0')
    .max(ratingConfiguration.maximumScore, 'Nota máxima é 5'),
  comment: z.string().trim().max(400, 'Comentário muito longo').optional().or(z.literal('')),
})



export const selfRatingSchema = z.object({
  score: z.coerce
    .number()
    .min(ratingConfiguration.minimumScore, 'Nota mínima é 0')
    .max(ratingConfiguration.maximumScore, 'Nota máxima é 5'),
  comment: z.string().trim().max(400, 'Comentário muito longo').optional().or(z.literal('')),
})

export const sessionPreferencesSchema = z.object({
  rankedRestaurantIds: z.array(z.uuid('Restaurante inválido')).max(20, 'Lista muito longa'),
})

export const sessionPoolSchema = z.object({
  restaurantId: z.uuid('Restaurante inválido'),
})

export const readySchema = z.object({
  isReady: z.boolean(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RestaurantFormValues = z.input<typeof restaurantSchema>
export type RestaurantInput = z.output<typeof restaurantSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type SetPinValues = z.infer<typeof setPinSchema>

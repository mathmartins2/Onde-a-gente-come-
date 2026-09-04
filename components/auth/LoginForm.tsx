'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/Field'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'

export const LoginForm = () => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiClient.post('/auth/login', values)
      router.replace('/')
      router.refresh()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Não foi possível entrar'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Usuário" error={errors.username?.message}>
        <TextInput
          autoCapitalize="none"
          autoComplete="username"
          placeholder="seu usuário"
          {...register('username')}
        />
      </Field>

      <Field label="Senha" error={errors.password?.message}>
        <TextInput
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
        />
      </Field>

      <Button type="submit" size="large" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? 'Entrando...' : 'Bora comer'}
        <ArrowRight size={18} strokeWidth={2.6} />
      </Button>
    </form>
  )
}

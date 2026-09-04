import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

export const extractErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) return error.response?.data?.error ?? fallback
  return fallback
}

import { randomUUID } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'

const argon2Options = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
}

export const hashSecret = (plainSecret: string) => hash(plainSecret, argon2Options)

export const verifySecret = async (storedHash: string, plainSecret: string) => {
  try {
    return await verify(storedHash, plainSecret, argon2Options)
  } catch {
    return false
  }
}

const decoyHash = hashSecret(randomUUID()).catch(() => null)

export const verifyAgainstDecoySecret = async (plainSecret: string) => {
  const storedHash = await decoyHash
  if (!storedHash) return false
  return verifySecret(storedHash, plainSecret)
}

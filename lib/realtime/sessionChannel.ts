import { EventEmitter } from 'node:events'
import { Client } from 'pg'
import { sql } from 'drizzle-orm'
import { database } from '@/lib/database/client'

const channelName = 'session_changed'
const reconnectDelayInMilliseconds = 2000

type SessionChannel = {
  emitter: EventEmitter
  listenerClient: Client | null
  isConnecting: boolean
}

const globalForChannel = globalThis as unknown as { sessionChannel?: SessionChannel }

const channel: SessionChannel = globalForChannel.sessionChannel ?? {
  emitter: new EventEmitter(),
  listenerClient: null,
  isConnecting: false,
}

channel.emitter.setMaxListeners(0)
globalForChannel.sessionChannel = channel

const resolveDirectConnectionString = () => {
  const unpooled = process.env.DATABASE_URL_UNPOOLED
  if (unpooled) return unpooled

  const pooled = process.env.DATABASE_URL
  if (!pooled) throw new Error('DATABASE_URL is not defined')
  return pooled.replace('-pooler.', '.')
}

const startListening = async () => {
  if (channel.listenerClient || channel.isConnecting) return
  channel.isConnecting = true

  const connectionString = resolveDirectConnectionString()
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  })

  client.on('notification', (notification) => {
    channel.emitter.emit(channelName, notification.payload ?? '')
  })

  client.on('error', () => {
    channel.listenerClient = null
    channel.isConnecting = false
    setTimeout(startListening, reconnectDelayInMilliseconds)
  })

  try {
    await client.connect()
    await client.query(`listen ${channelName}`)
    channel.listenerClient = client
  } catch {
    setTimeout(startListening, reconnectDelayInMilliseconds)
  } finally {
    channel.isConnecting = false
  }
}

export const publishSessionChanged = async (sessionId: string) => {
  channel.emitter.emit(channelName, sessionId)
  await database.execute(sql`select pg_notify(${channelName}, ${sessionId})`).catch(() => undefined)
}

export const subscribeToSessionChanges = (listener: (sessionId: string) => void) => {
  void startListening()
  channel.emitter.on(channelName, listener)
  return () => channel.emitter.off(channelName, listener)
}

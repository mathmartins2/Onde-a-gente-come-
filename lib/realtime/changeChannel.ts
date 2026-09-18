import { EventEmitter } from 'node:events'
import { Client } from 'pg'
import { sql } from 'drizzle-orm'
import { database } from '@/lib/database/client'

export const sessionChannelName = 'session_changed'
export const visitChannelName = 'visit_changed'

const channelNames = [sessionChannelName, visitChannelName] as const

export type ChannelName = (typeof channelNames)[number]

const reconnectDelayInMilliseconds = 2000

type ChangeChannel = {
  emitter: EventEmitter
  listenerClient: Client | null
  isConnecting: boolean
}

const globalForChannel = globalThis as unknown as { changeChannel?: ChangeChannel }

const channel: ChangeChannel = globalForChannel.changeChannel ?? {
  emitter: new EventEmitter(),
  listenerClient: null,
  isConnecting: false,
}

channel.emitter.setMaxListeners(0)
globalForChannel.changeChannel = channel

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
    channel.emitter.emit(notification.channel, notification.payload ?? '')
  })

  client.on('error', () => {
    channel.listenerClient = null
    channel.isConnecting = false
    setTimeout(startListening, reconnectDelayInMilliseconds)
  })

  try {
    await client.connect()
    await Promise.all(channelNames.map((name) => client.query(`listen ${name}`)))
    channel.listenerClient = client
  } catch {
    setTimeout(startListening, reconnectDelayInMilliseconds)
  } finally {
    channel.isConnecting = false
  }
}

const publishChange = async (channelName: ChannelName, identifier: string) => {
  channel.emitter.emit(channelName, identifier)
  await database.execute(sql`select pg_notify(${channelName}, ${identifier})`).catch(() => undefined)
}

const subscribeToChanges = (channelName: ChannelName, listener: (identifier: string) => void) => {
  void startListening()
  channel.emitter.on(channelName, listener)
  return () => channel.emitter.off(channelName, listener)
}

export const publishSessionChanged = (sessionId: string) =>
  publishChange(sessionChannelName, sessionId)

export const subscribeToSessionChanges = (listener: (sessionId: string) => void) =>
  subscribeToChanges(sessionChannelName, listener)

export const publishVisitChanged = (visitId: string) => publishChange(visitChannelName, visitId)

export const subscribeToVisitChanges = (listener: (visitId: string) => void) =>
  subscribeToChanges(visitChannelName, listener)

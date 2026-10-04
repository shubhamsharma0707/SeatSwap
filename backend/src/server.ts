import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

try {
  await app.listen({ host: config.HOST, port: config.PORT })
} catch (error) {
  app.log.error(error)
  process.exitCode = 1
}

let shuttingDown = false
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true
  app.log.info({ signal }, 'Shutting down API')
  try {
    await app.close()
  } catch (error) {
    app.log.error(error, 'API shutdown failed')
    process.exitCode = 1
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

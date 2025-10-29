import { createClient } from '@connectrpc/connect'
import { createWebTransport } from './transport_web'
import { IndexerService } from '@buf/gnolang_dsocial-indexer.bufbuild_es/indexerservice_pb'
import { NotificationService } from '@buf/gnolang_dsocial-notification.bufbuild_es/notificationservice_pb'

// Create an indexer client
export function createIndexerClient(address: string) {
  return createClient(
    IndexerService,
    createWebTransport({
      baseUrl: address
    })
  )
}

// Create an push notitication client
export function createNotificationClient(address: string) {
  return createClient(
    NotificationService,
    createWebTransport({
      baseUrl: address
    })
  )
}

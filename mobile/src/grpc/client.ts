import { createClient } from '@connectrpc/connect'
import { createWebTransport } from './transport_web'
import { NotificationService } from '@buf/gnolang_dsocial-notification.bufbuild_es/notificationservice_pb'

// Create an push notitication client
export function createNotificationClient(address: string) {
  return createClient(
    NotificationService,
    createWebTransport({
      baseUrl: address
    })
  )
}

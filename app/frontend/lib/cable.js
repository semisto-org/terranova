import { createConsumer } from '@rails/actioncable'

let consumer

export function getCableConsumer() {
  if (!consumer) consumer = createConsumer('/cable')
  return consumer
}

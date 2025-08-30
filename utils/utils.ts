import dayjs from 'dayjs'
import { Message } from '../types'


export function isSameDay (
    message: Message,
    diffMessage: Message | null | undefined
  ) {
    if (!diffMessage || !diffMessage.createdAt)
      return false
  
    const currentCreatedAt = dayjs(message.createdAt)
    const diffCreatedAt = dayjs(diffMessage.createdAt)
  
    if (!currentCreatedAt.isValid() || !diffCreatedAt.isValid())
      return false
  
    return currentCreatedAt.isSame(diffCreatedAt, 'day')
  }
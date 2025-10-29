type ReceivedMessageType = 'REQUEST_LOCATION' | 'GOOGLE_LOGIN_REQUEST' | 'APPLE_LOGIN_REQUEST'

export type ReceivedMessage = {
  type: ReceivedMessageType
}

export type SentMessageType =
  | 'GOOGLE_LOGIN_SUCCESS'
  | 'GOOGLE_LOGIN_ERROR'
  | 'NATIVE_LOCATION'
  | 'INIT_NATIVE_LOCATION'
  | 'APPLE_LOGIN_SUCCESS'
  | 'APPLE_LOGIN_ERROR'

export type SentMessage = {
  type: SentMessageType
}

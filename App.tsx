import React, { useEffect, useRef, useState } from 'react'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { Alert, AppState, AppStateStatus, SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import { Linking } from 'react-native'
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation'
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { appleAuth } from '@invertase/react-native-apple-authentication'
import * as amplitude from '@amplitude/analytics-react-native'
import { init } from '@amplitude/analytics-react-native'
import Config from 'react-native-config'
import { ReceivedMessage, SentMessageType } from './src/types'

const AMPLITUDE_API_KEY = Config.AMPLITUDE_API_KEY || ''

const url = Config.SOSO_WEB_URL || ''

const App = () => {
  const webviewRef = useRef<WebView>(null)
  const [appState, setAppState] = useState(AppState.currentState)

  const handleRequest = (webViewRequest: ShouldStartLoadRequest) => {
    const isExternal = !webViewRequest.url.startsWith(url)
    if (isExternal) {
      Linking.openURL(webViewRequest.url)
      return false
    }
    return true
  }

  const sendMessageToWeb = (type: SentMessageType, payload: any) => {
    const message = JSON.stringify({ type, payload })
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        webviewRef.current?.postMessage(message)
      }, i * 300)
    }
  }
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const data: ReceivedMessage = JSON.parse(event.nativeEvent.data)
      amplitude.track('Message Received', { type: data.type })

      if (data.type === 'REQUEST_LOCATION') {
        onRequestLocation()
        return
      }
      if (data.type === 'GOOGLE_LOGIN_REQUEST') {
        onRequestGoogleLogin()
        return
      }
      if (data.type === 'APPLE_LOGIN_REQUEST') {
        onRequestAppleLogin()
        return
      }
    } catch (e) {
      console.error('onMessage 처리 중 에러:', e)
      amplitude.track('On Message Error', { error: (e as Error).message })
    }
  }

  const onRequestLocation = async () => {
    if (!(await getIsLocationEnabled())) return
    Geolocation.getCurrentPosition(
      postCurrentLocation,
      (error) => {
        console.error('위치 정보 가져오기 실패:', error)
        amplitude.track('Get Location Error', { error: error.message })
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    )
  }

  const onRequestGoogleLogin = async () => {
    amplitude.track('Login Google Request')

    try {
      await GoogleSignin.hasPlayServices()
      const data = await GoogleSignin.signIn()
      const code = data.data?.serverAuthCode

      if (code) {
        amplitude.track('Login Google Success')
        sendMessageToWeb('GOOGLE_LOGIN_SUCCESS', { code })
      }
    } catch (e) {
      console.error('구글 로그인 실패:', e)
      amplitude.track('Login Google Error', { error: (e as Error).message })
      sendMessageToWeb('GOOGLE_LOGIN_ERROR', { message: (e as Error).message })
    }
  }

  const onRequestAppleLogin = async () => {
    amplitude.track('Login Apple Request')

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      })

      const { identityToken } = appleAuthRequestResponse
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user)

      amplitude.track('Login Apple CredentialState', { credentialState, identityToken: !!identityToken })

      if (credentialState !== appleAuth.State.AUTHORIZED) return
      if (identityToken) {
        sendMessageToWeb('APPLE_LOGIN_SUCCESS', { idToken: identityToken })
        amplitude.track('Login Apple Success')
      }
    } catch (error) {
      console.error('애플 로그인 실패:', error)
      amplitude.track('Login Apple Error', { error: (error as Error).message })
      sendMessageToWeb('APPLE_LOGIN_ERROR', { message: (error as Error).message })
    }
  }

  const postCurrentLocation = (position: GeolocationResponse) => {
    sendMessageToWeb('NATIVE_LOCATION', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
  }

  const postInitLocation = (position: GeolocationResponse) => {
    sendMessageToWeb('INIT_NATIVE_LOCATION', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
  }

  const getIsLocationEnabled = async () => {
    const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
    switch (result) {
      case RESULTS.UNAVAILABLE:
        Alert.alert('이 기기에서는 위치 권한을 사용할 수 없습니다.', '', [{ text: 'OK' }])
        break
      case RESULTS.DENIED:
      case RESULTS.BLOCKED:
        break
      case RESULTS.GRANTED:
        return result
    }
  }

  const handleWebViewLoad = async () => {
    if (!(await getIsLocationEnabled())) return
    Geolocation.getCurrentPosition(postInitLocation, (error) => console.error('위치 정보 가져오기 실패:', error), {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 10000,
    })
  }

  const googleSigninConfigure = () => {
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_SIGN_IN_WEB_CLIENT_ID,
      iosClientId: Config.GOOGLE_SIGN_IN_IOS_CLIENT_ID,
      offlineAccess: true,
    })
  }

  const initAmplitude = () => {
    init(AMPLITUDE_API_KEY, undefined, { disableCookies: true })
  }

  useEffect(() => {
    const handleChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        webviewRef.current?.reload()
      }
      setAppState(nextAppState)
    }
    initAmplitude()
    googleSigninConfigure()

    const subscription = AppState.addEventListener('change', handleChange)

    return () => subscription.remove()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        scrollEnabled={false}
        ref={webviewRef}
        onShouldStartLoadWithRequest={handleRequest}
        source={{ uri: url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowUniversalAccessFromFileURLs={true}
        onLoadEnd={handleWebViewLoad}
        onMessage={onMessage}
        bounces={false} // iOS에서 스크롤 바운스 효과 제거
        injectedJavaScriptBeforeContentLoaded={`
    window.originalConsoleLog = console.log;
    console.log = function(...args) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ log: args }));
      window.originalConsoleLog.apply(console, args);
    };
    true;
  `}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
})

export default App

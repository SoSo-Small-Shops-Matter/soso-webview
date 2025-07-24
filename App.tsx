import React, { useEffect, useRef, useState } from 'react'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { Alert, AppState, AppStateStatus, SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import { Linking } from 'react-native'
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation'
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

const url = 'https://soso-client-soso-web.vercel.app/'

const App = () => {
  const webviewRef = useRef<WebView>(null)
  const [appState, setAppState] = useState(AppState.currentState)

  const handleRequest = (webViewRequest: ShouldStartLoadRequest) => {
    const isExternal = !webViewRequest.url.startsWith(url)
    if (isExternal) {
      Linking.openURL(webViewRequest.url) // Safari or Chrome
      return false // Prevent WebView from loading it
    }
    return true // Allow internal URLs
  }

  const onMessage = async (event: WebViewMessageEvent) => {
    const msg = JSON.parse(event.nativeEvent.data)
    console.log('[WebView console.log]:', msg.log)

    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'REQUEST_LOCATION') {
        onRequestLocation()
      }

      if (data.type === 'GOOGLE_LOGIN_REQUEST') {
        onReuestGoogleLogin()
      }
    } catch (e) {
      console.error('onMessage 처리 중 에러:', e)
    }
  }

  const onRequestLocation = async () => {
    if (!(await getIsLocationEnabled())) {
      return
    }
    Geolocation.getCurrentPosition(
      postCurrentLocation,
      (error) => {
        console.error('위치 정보 가져오기 실패:', error)
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    )
  }

  const onReuestGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const data = await GoogleSignin.signIn()

      const code = data.data?.serverAuthCode
      if (code) {
        // 웹에 토큰 전달
        const jsCode = `
        window.dispatchEvent(new CustomEvent("google-login-success", {
          detail: ${JSON.stringify({ code })}
        }));
      `
        webviewRef.current?.injectJavaScript(jsCode)
      }
    } catch (e) {
      console.error('구글 로그인 실패:', e)
    }
  }

  const postCurrentLocation = (position: GeolocationResponse) => {
    const jsCode = `
            window.dispatchEvent(new CustomEvent('native-location', {
              detail: {
                lat: ${position.coords.latitude},
                lng: ${position.coords.longitude}
              }
            }));
          `
    webviewRef.current?.injectJavaScript(jsCode)
  }

  const postInitLocation = (position: GeolocationResponse) => {
    const jsCode = `
        window.dispatchEvent(new CustomEvent('init-native-location', {
          detail: {
            lat: ${position.coords.latitude},
            lng: ${position.coords.longitude}
          }
        }));
      `
    webviewRef.current?.injectJavaScript(jsCode)
    console.log('initdone')
  }

  const getIsLocationEnabled = async () => {
    const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
    switch (result) {
      case RESULTS.UNAVAILABLE:
        Alert.alert('이 기기에서는 위치 권한을 사용할 수 없습니다.', '', [{ text: 'OK' }])
        break
      case RESULTS.DENIED:
      case RESULTS.BLOCKED:
        Linking.openSettings()
        break
      case RESULTS.GRANTED:
        return result
    }
  }

  const handleWebViewLoad = async () => {
    if (!(await getIsLocationEnabled())) {
      return
    }
    Geolocation.getCurrentPosition(
      postInitLocation,
      (error) => {
        console.error('위치 정보 가져오기 실패:', error)
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    )
  }

  const googleSigninConfigure = () => {
    GoogleSignin.configure({
      webClientId: '960396512352-8grg1jmhbuslibdo8pimvos947fc0nm6.apps.googleusercontent.com',
      iosClientId: '960396512352-efrhq9liit6uk2ma63ddg79hti8n16e7.apps.googleusercontent.com',
      offlineAccess: true,
    })
  }

  useEffect(() => {
    const handleChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // 앱이 다시 활성화되면 웹뷰 새로고침
        if (webviewRef.current) {
          webviewRef.current.reload()
        }
      }
      setAppState(nextAppState)
    }
    const subscription = AppState.addEventListener('change', handleChange)
    googleSigninConfigure()
    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <WebView
        ref={webviewRef}
        onShouldStartLoadWithRequest={handleRequest}
        source={{ uri: url }}
        javaScriptEnabled={true} // ✅ JavaScript 활성화
        domStorageEnabled={true} // ✅ DOM Storage 활성화
        allowUniversalAccessFromFileURLs={true} // ✅ 외부 리소스 접근 허용
        onLoadEnd={handleWebViewLoad}
        injectedJavaScriptBeforeContentLoaded={`
                window.isNativeApp = true;
    window.originalConsoleLog = console.log;
    console.log = function(...args) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ log: args }));
      window.originalConsoleLog.apply(console, args);
    };
    true;
  `}
        onMessage={onMessage}
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

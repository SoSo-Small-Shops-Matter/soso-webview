/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import WebView from 'react-native-webview';
import {SafeAreaView, StyleSheet} from 'react-native';
function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{uri: 'https://soso-client-soso-web.vercel.app/'}}
        javaScriptEnabled={true} // ✅ JavaScript 활성화
        domStorageEnabled={true} // ✅ DOM Storage 활성화
        allowUniversalAccessFromFileURLs={true} // ✅ 외부 리소스 접근 허용
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

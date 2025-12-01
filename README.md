## 소품샵은 소중해

**감성 인테리어, 선물, 소품샵을 한 번에 찾는 방법\!**  
 **소소에서 내 주변의 작은 행복을 발견하세요.**

### 💡 소개

이 앱은 웹사이트 ['소품샵은 소중해'](soso-client-soso-web.vercel.app)를 모바일 앱으로 변환한 프로젝트입니다.

React Native WebView를 사용하여 웹 컨텐츠를 앱 안에 담고, GPS 위치 정보와 간편 로그인 기능을 네이티브에서 처리하여 웹 경험을 모바일에 최적화했습니다.

#### 주요 기능

- **위치 기반 소품샵 검색:** 네이티브 GPS 기능을 활용하여 사용자 주변의 소품샵을 찾습니다.
- **간편 소셜 로그인:** **Google 및 Apple 네이티브 SDK**로 안정적인 로그인 환경을 제공합니다.
- **웹뷰 컨테이너:** 웹 앱의 모든 기능을 네이티브 환경에서 동일하게 이용할 수 있도록 합니다.
- **앱 상태 관리:** 앱 재진입(Background -\> Foreground) 시 웹뷰를 자동 새로고침하여 데이터 일관성을 유지합니다.

---

### ⚙️ 설치 및 실행 (Getting Started)

#### 선행 조건

- Node.js
- Yarn
- **네이티브 계정 설정:** Google Sign-In, Apple Sign-In, Amplitude API 키 발급 및 설정

#### 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 다음 변수를 설정해야 합니다.

```
# .env
# 로드할 웹 애플리케이션의 URL
SOSO_WEB_URL="soso-client-soso-web.vercel.app"
# Google 로그인 설정
GOOGLE_SIGN_IN_WEB_CLIENT_ID="[Google Web Client ID]"
GOOGLE_SIGN_IN_IOS_CLIENT_ID="[Google iOS Client ID]"
# Amplitude 추적을 위한 API Key
AMPLITUDE_API_KEY="[Amplitude API Key]"
```

#### 로컬 설치 및 실행

1.  저장소 클론
2.  종속성 설치
    ```bash
    yarn install
    ```
3.  앱 실행
    ```bash
    yarn ios
    ```

---

### 🤝 네이티브-웹 통신

앱은 `postMessage`를 사용하여 웹과 네이티브 간에 기능을 요청하고 응답합니다.

#### ➡️ 웹에서 네이티브로 요청 (Received Messages)

| `data.type`            | 설명                | 네이티브 동작                             |
| :--------------------- | :------------------ | :---------------------------------------- |
| `REQUEST_LOCATION`     | 현재 위치 정보 요청 | 위치 권한 확인 후 GPS 정보 획득           |
| `GOOGLE_LOGIN_REQUEST` | 구글 로그인 요청    | Google Sign-In SDK 실행 및 인증 코드 획득 |
| `APPLE_LOGIN_REQUEST`  | 애플 로그인 요청    | Apple Auth SDK 실행 및 ID 토큰 획득       |

#### ⬅️ 네이티브에서 웹으로 응답 (Sent Messages)

| `type`                 | 설명                           | `payload` 구조 (예시)                 |
| :--------------------- | :----------------------------- | :------------------------------------ |
| `NATIVE_LOCATION`      | 위치 정보 요청 성공 응답       | `{ lat: number, lng: number }`        |
| `INIT_NATIVE_LOCATION` | 앱 로드 시 초기 위치 정보 전송 | `{ lat: number, lng: number }`        |
| `GOOGLE_LOGIN_SUCCESS` | 구글 로그인 성공               | `{ code: string }` (Server Auth Code) |
| `APPLE_LOGIN_SUCCESS`  | 애플 로그인 성공               | `{ idToken: string }`                 |
| `*_LOGIN_ERROR`        | 로그인 실패                    | `{ message: string }`                 |

---

### 🔗 프로젝트 및 서비스 링크

- **웹서비스** : 소품샵은 소중해 ([웹](https://soso-client-soso-web.vercel.app), [GitHub](https://github.com/SoSo-Small-Shops-Matter/soso-client))
- **앱 다운로드** : [App Store](https://apps.apple.com/kr/app/%EC%86%8C%ED%92%88%EC%83%B5%EC%9D%80-%EC%86%8C%EC%A4%91%ED%95%B4/id6749072385)

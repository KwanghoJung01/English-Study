import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// autoUpdate 모드의 registerSW는 새 서비스 워커가 활성화되면 페이지를 자동으로
// 새로고침한다. 단순 등록만 하면 실행 중인 화면은 예전 코드를 계속 써서, 앱을 두 번
// 다시 열어야 업데이트가 보였다. 앱을 열어둔 채로도 반영되도록 앱이 다시 보일 때와
// 1시간마다 새 버전을 확인한다.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => {
      if (navigator.onLine) registration.update().catch(() => {})
    }
    setInterval(check, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

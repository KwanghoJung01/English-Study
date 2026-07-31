export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSttSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

let cachedVoice: SpeechSynthesisVoice | null = null

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isTtsSupported()) return null
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  const preferred =
    voices.find((v) => v.lang === 'en-US' && /female|Samantha|Google US/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    null
  cachedVoice = preferred
  return preferred
}

export function primeVoices(): void {
  if (!isTtsSupported()) return
  // 일부 브라우저는 getVoices()가 비동기로 채워짐
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickEnglishVoice()
  }
}

export function speak(text: string, rate = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTtsSupported()) {
      reject(new Error('이 브라우저는 음성 합성을 지원하지 않습니다.'))
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if (isTtsSupported()) window.speechSynthesis.cancel()
}

interface SpeechRecognitionResultLike {
  transcript: string
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

function createRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = 'en-US'
  recognition.interimResults = false
  recognition.continuous = false
  recognition.maxAlternatives = 1
  return recognition
}

export interface RecordingResult {
  transcript: string
  durationSec: number
}

const RECOGNITION_ERROR_MESSAGES: Record<string, string> = {
  'no-speech': '말이 인식되지 않았어요. 버튼을 누른 직후 바로 말해보세요.',
  'audio-capture': '마이크에 접근할 수 없습니다. 브라우저의 마이크 권한을 확인해주세요.',
  'not-allowed': '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.',
  network: '네트워크 오류로 음성 인식에 실패했습니다. 연결 상태를 확인하고 다시 시도해주세요.',
}

/**
 * SpeechRecognition만으로 음성을 인식한다. 과거에는 MediaRecorder로 오디오도 함께
 * 녹음했지만, Android Chrome에서 getUserMedia와 SpeechRecognition이 마이크를 동시에
 * 점유하면 인식률이 급격히 떨어지는(전사가 항상 빈 문자열로 반환되는) 문제가 있어
 * SpeechRecognition 단독 사용으로 단순화했다.
 */
export async function recordAndRecognize(maxDurationSec = 15): Promise<RecordingResult> {
  const startedAt = performance.now()
  const recognition = createRecognition()
  if (!recognition) {
    throw new Error('이 브라우저는 음성 인식을 지원하지 않습니다. 최신 Android Chrome을 사용해주세요.')
  }

  const transcript = await new Promise<string>((resolve, reject) => {
    let finished = false
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true
        recognition.stop()
      }
    }, maxDurationSec * 1000)

    recognition.onresult = (event) => {
      const result = event.results[0]?.[0]
      if (!finished) {
        finished = true
        clearTimeout(timer)
        resolve(result?.transcript ?? '')
      }
    }
    recognition.onerror = (event) => {
      if (!finished) {
        finished = true
        clearTimeout(timer)
        const code = (event as { error?: string })?.error
        reject(new Error((code && RECOGNITION_ERROR_MESSAGES[code]) || '음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.'))
      }
    }
    recognition.onend = () => {
      if (!finished) {
        finished = true
        clearTimeout(timer)
        resolve('')
      }
    }
    try {
      recognition.start()
    } catch {
      clearTimeout(timer)
      reject(new Error('음성 인식을 시작할 수 없습니다.'))
    }
  })

  const durationSec = (performance.now() - startedAt) / 1000
  return { transcript, durationSec }
}

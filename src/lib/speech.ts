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
  audioBlob: Blob | null
  durationSec: number
}

/**
 * 마이크 녹음(MediaRecorder)과 음성 인식(SpeechRecognition)을 동시에 시작하고,
 * 인식이 끝나면(또는 timeout) 오디오 blob과 전사 텍스트를 함께 반환한다.
 */
export async function recordAndRecognize(maxDurationSec = 15): Promise<RecordingResult> {
  const startedAt = performance.now()
  const recognition = createRecognition()
  if (!recognition) {
    throw new Error('이 브라우저는 음성 인식을 지원하지 않습니다. 최신 Android Chrome을 사용해주세요.')
  }

  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  const chunks: BlobPart[] = []

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.start()
  } catch {
    // 마이크 녹음이 불가해도 음성 인식만으로 진행
    stream = null
    recorder = null
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
    recognition.onerror = () => {
      if (!finished) {
        finished = true
        clearTimeout(timer)
        reject(new Error('음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.'))
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

  let audioBlob: Blob | null = null
  if (recorder) {
    audioBlob = await new Promise<Blob | null>((resolve) => {
      if (!recorder) {
        resolve(null)
        return
      }
      recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: 'audio/webm' }) : null)
      if (recorder.state !== 'inactive') recorder.stop()
      else resolve(null)
    })
    stream?.getTracks().forEach((t) => t.stop())
  }

  return { transcript, audioBlob, durationSec }
}

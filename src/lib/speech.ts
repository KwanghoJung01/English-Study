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

interface SpeechRecognitionResultGroupLike extends ArrayLike<SpeechRecognitionResultLike> {
  isFinal: boolean
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultGroupLike>
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

function createRecognition(continuous = false): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = 'en-US'
  recognition.interimResults = continuous
  recognition.continuous = continuous
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

export interface ContinuousRecording {
  /** 사용자가 다 읽었을 때 수동으로 인식을 종료한다. */
  stop: () => void
  result: Promise<RecordingResult>
}

/**
 * 지문 전체를 한 번에 읽을 때 쓰는 연속 음성 인식.
 *
 * 처음에는 SpeechRecognition의 continuous=true 모드를 시도했지만, Android Chrome에서는
 * 매 onresult마다 "지금까지 들은 전체 발화"를 다시 통째로 재전사해서 보내는 경우가 있어
 * (데스크톱 Chrome과 다르게 동작), 그대로 이어붙이면 "i i wake i wake up i wake up at..."
 * 처럼 단어가 눈덩이처럼 중복되고, 인식 세션 자체도 문장 사이 침묵에서 예고 없이 끊기는
 * 문제가 있었다.
 *
 * 대신 문장별 연습에서 이미 안정적으로 동작하는 단발성 인식(continuous=false)을 짧은
 * 침묵마다 자동으로 재시작해서 이어붙이는 "체이닝" 방식을 쓴다. 각 조각은 그 구간에서
 * 새로 들은 오디오만 전사하므로 중복이 생기지 않고, onend마다 즉시 다음 조각을 시작하므로
 * 사용자가 stop()을 부르기 전까지는 문장 사이 침묵에도 멈추지 않는다.
 */
export function startContinuousRecognition(
  maxDurationSec: number,
  onChunk?: (transcriptSoFar: string) => void,
): ContinuousRecording {
  const startedAt = performance.now()

  if (!isSttSupported()) {
    return {
      stop: () => {},
      result: Promise.reject(
        new Error('이 브라우저는 음성 인식을 지원하지 않습니다. 최신 Android Chrome을 사용해주세요.'),
      ),
    }
  }

  const chunks: string[] = []
  let settled = false
  let stopRequested = false
  let currentRecognition: SpeechRecognitionLike | null = null
  let timer: ReturnType<typeof setTimeout>
  let finish: () => void = () => {}

  const result = new Promise<RecordingResult>((resolve, reject) => {
    const settleResolve = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ transcript: chunks.join(' ').trim(), durationSec: (performance.now() - startedAt) / 1000 })
    }

    finish = () => {
      if (stopRequested) return
      stopRequested = true
      clearTimeout(timer)
      if (currentRecognition) {
        try {
          // stop()이 성공하면 onend가 비동기로 발생해 거기서 최종 resolve된다.
          currentRecognition.stop()
        } catch {
          settleResolve()
        }
      } else {
        settleResolve()
      }
    }

    timer = setTimeout(finish, maxDurationSec * 1000)

    function startChunk() {
      const recognition = createRecognition(false)
      if (!recognition) {
        settleResolve()
        return
      }
      currentRecognition = recognition

      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript?.trim()
        if (text) {
          chunks.push(text)
          onChunk?.(chunks.join(' ').trim())
        }
      }
      recognition.onerror = (event) => {
        const code = (event as { error?: string })?.error
        if (!stopRequested && (code === 'not-allowed' || code === 'audio-capture')) {
          if (!settled) {
            settled = true
            clearTimeout(timer)
            reject(new Error(RECOGNITION_ERROR_MESSAGES[code] ?? '마이크 오류가 발생했습니다.'))
          }
          return
        }
        // no-speech/aborted 등은 onend에서 이어서 처리(재시작 또는 종료)한다.
      }
      recognition.onend = () => {
        if (stopRequested) {
          settleResolve()
          return
        }
        // 사용자가 아직 멈추지 않았다면 짧은 침묵 뒤에도 바로 다음 조각을 이어서 듣는다.
        startChunk()
      }

      try {
        recognition.start()
      } catch {
        settleResolve()
      }
    }

    startChunk()
  })

  return { stop: () => finish(), result }
}

import type { Level, Passage, TopicId } from '../types'
import { DEFAULT_GEMINI_MODEL, LEVELS } from '../types'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function endpointFor(model: string): string {
  const id = model.trim() || DEFAULT_GEMINI_MODEL
  return `${API_BASE}/models/${id}:generateContent`
}

export interface GeminiModelInfo {
  id: string
  displayName: string
}

/**
 * 이 API 키로 실제 사용할 수 있는 모델 목록을 Google에서 직접 조회한다.
 * 모델 ID를 추측하지 않아도 되고, 새 모델이 나와도 앱 수정 없이 바로 보인다.
 */
export async function listGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  const res = await fetch(`${API_BASE}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`)
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`모델 목록을 불러오지 못했습니다 (${res.status}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const models: unknown[] = Array.isArray(data?.models) ? data.models : []

  return models
    .map((raw) => {
      const m = raw as { name?: string; displayName?: string; supportedGenerationMethods?: string[] }
      return {
        id: String(m.name ?? '').replace(/^models\//, ''),
        displayName: String(m.displayName ?? m.name ?? ''),
        methods: m.supportedGenerationMethods ?? [],
      }
    })
    // 지문 생성에 쓰는 generateContent를 지원하는 모델만 남긴다(임베딩 전용 모델 등 제외).
    .filter((m) => m.id && m.methods.includes('generateContent'))
    .map(({ id, displayName }) => ({ id, displayName }))
}

const VARIETY_NAMES = ['Mia', 'Leo', 'Emma', 'Noah', 'Ava', 'Ben', 'Sora', 'Jun', 'Zoe', 'Max', 'Lily', 'Sam']
const VARIETY_DETAILS = [
  'a red backpack',
  'a rainy afternoon',
  'a new neighbor',
  'a surprise gift',
  'a lost key',
  'a weekend trip',
  'a school festival',
  'a broken bicycle',
  'a birthday party',
  'a science project',
  'a missing pet',
  'a late bus',
  'a new recipe',
  'an old photo',
  'a video call with family',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface GeminiPassagePayload {
  title: string
  sentences: string[]
  translations: string[]
  vocabulary: { term: string; meaning: string; example: string; synonym?: string; antonym?: string }[]
  questions: { question: string; choices: string[]; answerIndex: number }[]
}

const INTRO_LEVEL_GUIDANCE = `
This is for a 7-9 year old Korean child (elementary school grade 1-3) who is just starting to learn English.
Extra rules for this level:
- Each sentence must be VERY short and simple: 3 to 6 words only.
- Use only the most basic, concrete, high-frequency vocabulary (family, animals, colors, numbers, food, school, everyday actions).
- Use only simple present tense. Avoid conjunctions like "because", "although", "while". No idioms, no phrasal complexity.
- Sentences should read like a picture book, one simple idea per sentence.
- Comprehension question choices must also be short and simple (1-3 words each).`

function buildPrompt(level: Level, topicLabel: string, recentTitles: string[]): string {
  const levelInfo = LEVELS.find((l) => l.id === level)
  const varietyName = pickRandom(VARIETY_NAMES)
  const varietyDetail = pickRandom(VARIETY_DETAILS)
  const avoidRepeats =
    recentTitles.length > 0
      ? `\nThis learner has already seen these previous passages on this same topic — do NOT reuse their titles, opening lines, or overall scenario. Write a clearly different, fresh scenario this time:\n${recentTitles.map((t) => `- "${t}"`).join('\n')}`
      : ''
  return `You are an English learning content generator for a Korean learner.
Create ONE short English reading passage for topic "${topicLabel}" at level "${levelInfo?.label} (${levelInfo?.hint})".
${level === 'intro' ? INTRO_LEVEL_GUIDANCE : ''}
To keep things fresh and varied, build this specific passage around a character named "${varietyName}" and naturally incorporate this detail somewhere in the story: ${varietyDetail}. Vary the specific names, numbers, times, and small details every time you are asked — never fall back to a generic default scenario for the topic.${avoidRepeats}

Requirements:
- ${level === 'intro' ? '5 to 7' : '6 to 9'} natural, connected English sentences (as an array, one sentence per element, no numbering).
- Vocabulary difficulty must match the level.
- Provide a natural, accurate Korean translation for EVERY sentence, in the same order, as a "translations" array with exactly the same length as "sentences" (translations[i] must correspond to sentences[i]).
- Provide 5 to 8 key vocabulary items from the passage: English term, Korean meaning, and one example English sentence (different from the passage sentences).
- For each vocabulary item, ONLY IF a natural, level-appropriate synonym and/or antonym exists, include it as "synonym"/"antonym" formatted as "english word (한글 뜻)" (e.g. "large (큰)"). Omit the field entirely (do not include the key) when no natural, simple synonym or antonym exists for that word at this level — do not force an unnatural pair.
- Provide 3 multiple-choice reading comprehension questions in English about the passage, each with exactly 4 choices and a zero-based answerIndex.
- Provide a short title for the passage.

Respond with ONLY valid JSON matching this shape, no markdown fences:
{
  "title": string,
  "sentences": string[],
  "translations": string[],
  "vocabulary": [{ "term": string, "meaning": string, "example": string, "synonym"?: string, "antonym"?: string }],
  "questions": [{ "question": string, "choices": string[4], "answerIndex": number }]
}`
}

export async function generateWithGemini(
  apiKey: string,
  level: Level,
  topic: TopicId,
  topicLabel: string,
  recentTitles: string[] = [],
  model: string = DEFAULT_GEMINI_MODEL,
): Promise<Passage> {
  const res = await fetch(`${endpointFor(model)}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(level, topicLabel, recentTitles) }] }],
      generationConfig: {
        temperature: 1.05,
        topP: 0.97,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API 오류 (${res.status}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에서 콘텐츠를 찾을 수 없습니다.')

  let parsed: GeminiPassagePayload
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini 응답을 JSON으로 해석하지 못했습니다.')
  }

  if (!Array.isArray(parsed.sentences) || parsed.sentences.length === 0) {
    throw new Error('Gemini 응답에 문장이 없습니다.')
  }

  const translations = Array.isArray(parsed.translations) ? parsed.translations : []
  const paddedTranslations = parsed.sentences.map((_, i) => translations[i] ?? '')

  return {
    id: `gemini-${Date.now()}`,
    level,
    topic,
    topicLabel,
    title: parsed.title || topicLabel,
    sentences: parsed.sentences,
    translations: paddedTranslations,
    vocabulary: parsed.vocabulary ?? [],
    questions: parsed.questions ?? [],
    source: 'gemini',
  }
}

import type { Level, Passage, TopicId } from '../types'
import { LEVELS } from '../types'

const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

interface GeminiPassagePayload {
  title: string
  sentences: string[]
  vocabulary: { term: string; meaning: string; example: string }[]
  questions: { question: string; choices: string[]; answerIndex: number }[]
}

function buildPrompt(level: Level, topicLabel: string): string {
  const levelInfo = LEVELS.find((l) => l.id === level)
  return `You are an English learning content generator for a Korean learner.
Create ONE short English reading passage for topic "${topicLabel}" at level "${levelInfo?.label} (${levelInfo?.hint})".

Requirements:
- 6 to 9 natural, connected English sentences (as an array, one sentence per element, no numbering).
- Vocabulary difficulty must match the level.
- Provide 5 to 8 key vocabulary items from the passage: English term, Korean meaning, and one example English sentence (different from the passage sentences).
- Provide 3 multiple-choice reading comprehension questions in English about the passage, each with exactly 4 choices and a zero-based answerIndex.
- Provide a short title for the passage.

Respond with ONLY valid JSON matching this shape, no markdown fences:
{
  "title": string,
  "sentences": string[],
  "vocabulary": [{ "term": string, "meaning": string, "example": string }],
  "questions": [{ "question": string, "choices": string[4], "answerIndex": number }]
}`
}

export async function generateWithGemini(
  apiKey: string,
  level: Level,
  topic: TopicId,
  topicLabel: string,
): Promise<Passage> {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(level, topicLabel) }] }],
      generationConfig: {
        temperature: 0.9,
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

  return {
    id: `gemini-${Date.now()}`,
    level,
    topic,
    topicLabel,
    title: parsed.title || topicLabel,
    sentences: parsed.sentences,
    vocabulary: parsed.vocabulary ?? [],
    questions: parsed.questions ?? [],
    source: 'gemini',
  }
}

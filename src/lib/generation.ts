import type { Level, Passage, Settings, TopicId } from '../types'
import { generateWithGemini } from './gemini'
import { bankHasTopic, pickBankPassage } from './contentBank'

export interface GenerationResult {
  passage: Passage
  note: string | null
}

export async function generatePassage(
  settings: Settings,
  level: Level,
  topic: TopicId,
  topicLabel: string,
  recentBankKeys: string[],
  recentGeminiTitles: string[] = [],
): Promise<GenerationResult> {
  const wantsGemini = settings.generationMode !== 'bank' && settings.geminiApiKey.trim().length > 0
  const isCustomTopic = topic === 'custom'

  if (settings.generationMode === 'bank' || (!wantsGemini && !isCustomTopic)) {
    return { passage: pickBankPassage(level, topic, recentBankKeys), note: null }
  }

  if (!wantsGemini && isCustomTopic) {
    throw new Error('직접 입력한 주제는 Gemini API 키가 있어야 생성할 수 있습니다. 설정에서 키를 등록하거나, 콘텐츠 뱅크의 주제 중 하나를 선택해주세요.')
  }

  try {
    const passage = await generateWithGemini(
      settings.geminiApiKey,
      level,
      topic,
      topicLabel,
      recentGeminiTitles,
      settings.geminiModel,
    )
    return { passage, note: null }
  } catch (err) {
    if (isCustomTopic || !bankHasTopic(topic)) {
      throw err
    }
    const passage = pickBankPassage(level, topic, recentBankKeys)
    const message = err instanceof Error ? err.message : String(err)
    return { passage, note: `Gemini 생성에 실패해 콘텐츠 뱅크로 대체했습니다. (${message})` }
  }
}

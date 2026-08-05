import type { Level, Passage, TopicId } from '../types'
import { BANK_PASSAGES, getTopicLabel } from '../data/bankPassages'

export function bankHasTopic(topic: TopicId): boolean {
  return BANK_PASSAGES.some((p) => p.topic === topic)
}

/**
 * 레벨/주제에 맞는 콘텐츠 뱅크 지문을 고른다. 최근 사용한 passageId(recentKeys)는
 * 가능하면 피해서 반복 학습을 줄인다. 모두 소진되면 처음부터 다시 순환한다.
 */
export function pickBankPassage(level: Level, topic: TopicId, recentKeys: string[]): Passage {
  const candidates = BANK_PASSAGES.filter((p) => p.level === level && p.topic === topic)
  const pool = candidates.length > 0 ? candidates : BANK_PASSAGES.filter((p) => p.level === level)
  if (pool.length === 0) {
    throw new Error('콘텐츠 뱅크에서 해당 레벨의 지문을 찾을 수 없습니다.')
  }

  const fresh = pool.filter((p) => !recentKeys.includes(p.key))
  const chooseFrom = fresh.length > 0 ? fresh : pool
  const chosen = chooseFrom[Math.floor(Math.random() * chooseFrom.length)]

  return {
    id: chosen.key,
    level: chosen.level,
    topic: chosen.topic,
    topicLabel: getTopicLabel(chosen.topic),
    title: chosen.title,
    sentences: chosen.sentences,
    translations: chosen.translations,
    vocabulary: chosen.vocabulary,
    questions: chosen.questions,
    source: 'bank',
  }
}

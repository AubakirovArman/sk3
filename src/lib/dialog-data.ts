export type MeetingWithQuestions = {
  id: string
  code: string
  titleRu: string
  titleKk: string
  titleEn: string
  summaryRu: string | null
  summaryKk: string | null
  summaryEn: string | null
  overviewRu: string | null
  overviewKk: string | null
  overviewEn: string | null
  questions: Array<{
    id: string
    meetingId: string
    number: number
    titleRu: string
    titleKk: string
    titleEn: string
    collapsedTextRu: string
    collapsedTextKk: string
    collapsedTextEn: string
    expandedTextRu: string | null
    expandedTextKk: string | null
    expandedTextEn: string | null
    decisionLabelRu: string | null
    decisionLabelKk: string | null
    decisionLabelEn: string | null
    triggerPhrases: string[]
  }>
}

const QUESTION_PATTERNS: Array<{ number: number; patterns: RegExp[] }> = [
  {
    number: 1,
    patterns: [
      /(?:вопрос|пункт|пункте|вопр\.)\s*(1|i)/,
      /перв(ый|ом|ого|ому|ым)/,
      /бірінші/,
      /first/,
      /q1/
    ],
  },
  {
    number: 2,
    patterns: [
      /(?:вопрос|пункт|пункте|вопр\.)\s*(2|ii)/,
      /втор(ой|ом|ого|ому|ым)/,
      /екінші/,
      /second/,
      /q2/
    ],
  },
  {
    number: 3,
    patterns: [
      /(?:вопрос|пункт|пункте|вопр\.)\s*(3|iii)/,
      /трет(ий|ьем|ьего|ьему|ьим)/,
      /үшінші/,
      /third/,
      /q3/
    ],
  },
]

export function findMeetingByQuery(
  query: string,
  meetings: MeetingWithQuestions[]
) {
  const normalized = normalizeQuery(query)

  const meeting = meetings.find((candidate) =>
    matchesMeeting(normalized, candidate)
  )

  if (!meeting) {
    return undefined
  }

  const questionNumber = matchQuestionNumber(normalized)

  if (questionNumber) {
    const question = meeting.questions.find((item) => item.number === questionNumber)
    if (question) {
      return { meeting, question, questionNumber }
    }
  }

  // If no explicit number, try trigger phrase lookup
  const questionByTrigger = meeting.questions.find((question) =>
    question.triggerPhrases.some((phrase) =>
      normalized.includes(phrase.toLowerCase())
    )
  )

  if (questionByTrigger) {
    return {
      meeting,
      question: questionByTrigger,
      questionNumber: questionByTrigger.number,
    }
  }

  return { meeting, question: undefined, questionNumber: undefined }
}

function normalizeQuery(query: string) {
  return query.toLowerCase().replace(/[.,!?]/g, ' ')
}

function matchesMeeting(query: string, meeting: MeetingWithQuestions) {
  if (meeting.code && query.includes(meeting.code.toLowerCase())) {
    return true
  }

  const localizedTitles = [meeting.titleRu, meeting.titleKk, meeting.titleEn]
  if (
    localizedTitles.some((title) =>
      title ? query.includes(title.toLowerCase()) : false
    )
  ) {
    return true
  }

  return meeting.questions.some((question) =>
    question.triggerPhrases.some((phrase) =>
      query.includes(phrase.toLowerCase())
    )
  )
}

function matchQuestionNumber(query: string) {
  // Сначала проверяем явные упоминания "по вопросу N", "вопрос N", "вопросу N"
  const explicitNumberMatch = query.match(/(?:по\s+)?(?:вопрос[уе]?|question|сұрақ)\s*[№#]?\s*(\d+)/)
  if (explicitNumberMatch) {
    return Number(explicitNumberMatch[1])
  }

  // Затем проверяем паттерны из списка
  for (const { number, patterns } of QUESTION_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(query))) {
      return number
    }
  }

  // Римские цифры
  const romanMatch = query.match(/\b(?:i{1,3}|iv|v)\b/)
  if (romanMatch) {
    const roman = romanMatch[0]
    const map: Record<string, number> = {
      i: 1,
      ii: 2,
      iii: 3,
      iv: 4,
      v: 5,
    }
    return map[roman]
  }

  return undefined
}

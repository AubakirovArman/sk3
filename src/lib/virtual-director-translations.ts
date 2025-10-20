/**
 * Переводы для Virtual Director
 * Заголовки разделов на разных языках
 */

export const sectionTitles = {
  ru: {
    vndKeyFindings: 'ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ',
    vndCompliance: 'ВНД: СООТВЕТСТВИЯ',
    vndViolations: 'ВНД: НАРУШЕНИЯ',
    vndRisks: 'ВНД: РИСКИ',
    vndRecommendations: 'ВНД: РЕКОМЕНДАЦИИ',
    sources: 'ИСТОЧНИКИ',
    npaKeyFindings: 'НПА: КЛЮЧЕВЫЕ ВЫВОДЫ',
    npaCompliance: 'НПА: СООТВЕТСТВИЯ',
    npaViolations: 'НПА: НАРУШЕНИЯ / РИСК НЕСОБЛЮДЕНИЯ',
    npaRisks: 'НПА: ПРАВОВЫЕ РИСКИ',
    npaRecommendations: 'НПА: РЕКОМЕНДАЦИИ ПО СООТВЕТСТВИЮ',
    npaSources: 'ИСТОЧНИКИ НПА',
    agendaItem: 'ПУНКТ ПОВЕСТКИ ДНЯ',
    decision: 'РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД',
    briefConclusion: 'КРАТКОЕ ЗАКЛЮЧЕНИЕ',
    reasoning: 'ОБОСНОВАНИЕ',
    finalConclusion: 'ИТОГОВОЕ ЗАКЛЮЧЕНИЕ'
  },
  kk: {
    vndKeyFindings: 'ІБЖ: НЕГІЗГІ ҚОРЫТЫНДЫЛАР',
    vndCompliance: 'ІБЖ: СӘЙКЕСТІКТЕР',
    vndViolations: 'ІБЖ: БҰЗУШЫЛЫҚТАР',
    vndRisks: 'ІБЖ: ТӘУЕКЕЛДЕР',
    vndRecommendations: 'ІБЖ: ҰСЫНЫМДАР',
    sources: 'ДЕРЕККӨЗДЕР',
    npaKeyFindings: 'ҚҚА: НЕГІЗГІ ҚОРЫТЫНДЫЛАР',
    npaCompliance: 'ҚҚА: СӘЙКЕСТІКТЕР',
    npaViolations: 'ҚҚА: БҰЗУШЫЛЫҚТАР / СӘЙКЕССІЗДІК ТӘУЕКЕЛІ',
    npaRisks: 'ҚҚА: ҚҰҚЫҚТЫҚ ТӘУЕКЕЛДЕР',
    npaRecommendations: 'ҚҚА: СӘЙКЕСТІК БОЙЫНША ҰСЫНЫМДАР',
    npaSources: 'ҚҚА ДЕРЕККӨЗДЕРІ',
    agendaItem: 'КҮН ТӘРТІБІ ТАРМАҒЫ',
    decision: 'ДК ТМ ШЕШІМІ',
    briefConclusion: 'ҚЫСҚАША ҚОРЫТЫНДЫ',
    reasoning: 'НЕГІЗДЕМЕ',
    finalConclusion: 'ҚОРЫТЫНДЫ ҚОРЫТЫНДЫ'
  },
  en: {
    vndKeyFindings: 'ICD: KEY FINDINGS',
    vndCompliance: 'ICD: COMPLIANCE',
    vndViolations: 'ICD: VIOLATIONS',
    vndRisks: 'ICD: RISKS',
    vndRecommendations: 'ICD: RECOMMENDATIONS',
    sources: 'SOURCES',
    npaKeyFindings: 'NLA: KEY FINDINGS',
    npaCompliance: 'NLA: COMPLIANCE',
    npaViolations: 'NLA: VIOLATIONS / NON-COMPLIANCE RISK',
    npaRisks: 'NLA: LEGAL RISKS',
    npaRecommendations: 'NLA: COMPLIANCE RECOMMENDATIONS',
    npaSources: 'NLA SOURCES',
    agendaItem: 'AGENDA ITEM',
    decision: 'INDEPENDENT BOARD MEMBER DECISION',
    briefConclusion: 'BRIEF CONCLUSION',
    reasoning: 'JUSTIFICATION',
    finalConclusion: 'FINAL CONCLUSION'
  }
} as const

export type Language = 'ru' | 'kk' | 'en'

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setDemoMode() {
  try {
    console.log('🎭 Setting demo mode with sample data...')

    // Структура должна совпадать с форматом админки:
    // { fieldName: { ru: 'text', kk: 'text', en: 'text' } }
    const demoData = {
      // Дата и время анализа (ISO format)
      analysisDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      
      // Results Analysis (Summary)
      finalConclusion: {
        ru: 'Документ соответствует всем требованиям законодательства и внутренним регламентам.',
        kk: 'Құжат заңнаманың барлық талаптарына және ішкі регламенттерге сәйкес келеді.',
        en: 'The document complies with all legislative requirements and internal regulations.'
      },
      agendaItem: {
        ru: 'Об утверждении положения о Совете директоров',
        kk: 'Директорлар кеңесі туралы ережені бекіту туралы',
        en: 'On approval of the Regulation on the Board of Directors'
      },
      vote: {
        ru: 'ЗА - единогласно',
        kk: 'ЖАҚ - біржағдайлы',
        en: 'FOR - unanimously'
      },
      briefConclusion: {
        ru: 'Положение рекомендовано к утверждению без замечаний.',
        kk: 'Ереже ескертулерсіз бекітуге ұсынылады.',
        en: 'The Regulation is recommended for approval without comments.'
      },
      reasoning: {
        ru: 'Документ полностью соответствует требованиям корпоративного управления и учитывает лучшие практики.',
        kk: 'Құжат корпоративтік басқару талаптарына толық сәйкес келеді және үздік тәжірибелерді ескереді.',
        en: 'The document fully complies with corporate governance requirements and takes into account best practices.'
      },

      // VND Analysis
      vndKeyFindings: {
        ru: 'Положение о Совете директоров содержит все необходимые разделы: состав, полномочия, порядок проведения заседаний.',
        kk: 'Директорлар кеңесі туралы ереже барлық қажетті бөлімдерді қамтиды: құрамы, өкілеттіктері, отырыстарды өткізу тәртібі.',
        en: 'The Regulation on the Board of Directors contains all necessary sections: composition, powers, procedure for holding meetings.'
      },
      vndCompliance: {
        ru: 'Документ соответствует Закону РК "Об акционерных обществах" и Кодексу корпоративного управления.',
        kk: 'Құжат ҚР "Акционерлік қоғамдар туралы" Заңына және Корпоративтік басқару кодексіне сәйкес келеді.',
        en: 'The document complies with the Law of the Republic of Kazakhstan "On Joint Stock Companies" and the Corporate Governance Code.'
      },
      vndViolations: {
        ru: 'Нарушений не выявлено.',
        kk: 'Бұзушылықтар анықталмады.',
        en: 'No violations identified.'
      },
      vndRisks: {
        ru: 'Риски минимальны при условии соблюдения утвержденных процедур.',
        kk: 'Бекітілген рәсімдер сақталған жағдайда тәуекелдер минималды.',
        en: 'Risks are minimal subject to compliance with approved procedures.'
      },
      vndRecommendations: {
        ru: 'Рекомендуется утвердить документ в представленной редакции.',
        kk: 'Құжатты ұсынылған редакцияда бекіту ұсынылады.',
        en: 'It is recommended to approve the document in the presented version.'
      },
      vndSources: {
        ru: 'Закон РК "Об акционерных обществах", Кодекс корпоративного управления.',
        kk: 'ҚР "Акционерлік қоғамдар туралы" Заңы, Корпоративтік басқару кодексі.',
        en: 'Law of the Republic of Kazakhstan "On Joint Stock Companies", Corporate Governance Code.'
      },

      // NPA Analysis
      npaKeyFindings: {
        ru: 'Документ соответствует требованиям действующего законодательства.',
        kk: 'Құжат қолданыстағы заңнаманың талаптарына сәйкес келеді.',
        en: 'The document complies with the requirements of current legislation.'
      },
      npaCompliance: {
        ru: 'Соблюдены требования ст. 63-72 Закона РК "Об акционерных обществах".',
        kk: 'ҚР "Акционерлік қоғамдар туралы" Заңының 63-72 баптарының талаптары сақталған.',
        en: 'Requirements of Articles 63-72 of the Law of the Republic of Kazakhstan "On Joint Stock Companies" are met.'
      },
      npaViolations: {
        ru: 'Несоответствий законодательству не обнаружено.',
        kk: 'Заңнамаға сәйкес келмеушіліктер табылмады.',
        en: 'No inconsistencies with legislation found.'
      },
      npaRisks: {
        ru: 'Правовые риски отсутствуют.',
        kk: 'Құқықтық тәуекелдер жоқ.',
        en: 'Legal risks are absent.'
      },
      npaRecommendations: {
        ru: 'Документ может быть утвержден без правовых замечаний.',
        kk: 'Құжат құқықтық ескертулерсіз бекітілуі мүмкін.',
        en: 'The document can be approved without legal comments.'
      },
      npaSources: {
        ru: 'Закон РК "Об акционерных обществах" от 13.05.2003 № 415-II.',
        kk: 'ҚР "Акционерлік қоғамдар туралы" Заңы 13.05.2003 № 415-II.',
        en: 'Law of the Republic of Kazakhstan "On Joint Stock Companies" dated 13.05.2003 No. 415-II.'
      }
    }

    // Устанавливаем режим demo
    await prisma.dialogSettings.upsert({
      where: { key: 'virtual-director-mode' },
      update: { value: 'demo' },
      create: { key: 'virtual-director-mode', value: 'demo' }
    })
    console.log('✅ Mode set to: demo')

    // Сохраняем демо-данные
    await prisma.dialogSettings.upsert({
      where: { key: 'virtual-director-demo-data' },
      update: { value: JSON.stringify(demoData) },
      create: { key: 'virtual-director-demo-data', value: JSON.stringify(demoData) }
    })
    console.log('✅ Demo data saved')

    console.log('🎉 Demo mode activated successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setDemoMode()

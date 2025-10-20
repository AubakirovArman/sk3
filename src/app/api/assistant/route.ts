// API route для функций правительственного ассистента

import { NextRequest, NextResponse } from 'next/server'
import {
  performSerpAPISearch,
  callNitecAI,
  callDatabaseWebhook,
} from '@/lib/assistant-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { function_name, arguments: args } = body || {}

    console.log('\n===========================================')
    console.log('>>> Government Assistant API')
    console.log(`📥 Incoming request:`)
    console.log(`   Function: ${function_name}`)
    console.log(`   Arguments: ${JSON.stringify(args, null, 2)}`)
    console.log(`   Time: ${new Date().toLocaleString('ru-RU')}`)
    console.log('===========================================')

    let result = ''

    switch (function_name) {
      case 'db_query':
        // Database query via webhook
        console.log('🔄 Processing db_query...')
        const { message } = args || {}
        if (!message) {
          console.log('❌ Error: message not specified')
          return NextResponse.json(
            { success: false, error: 'message is required for db_query' },
            { status: 400 }
          )
        }
        console.log(`📤 Sending request to DB: "${message}"`)
        result = await callDatabaseWebhook(message)
        console.log(`✅ Received response from DB (${result.length} characters)`)
        break

      case 'law_based_answering':
        // Legal questions via SerpAPI
        console.log('🔄 Processing law_based_answering...')
        const { legal_query } = args || {}
        if (!legal_query) {
          console.log('❌ Error: legal_query not specified')
          return NextResponse.json(
            { success: false, error: 'legal_query is required for law_based_answering' },
            { status: 400 }
          )
        }
        console.log(`🔍 Searching legal information: "${legal_query}"`)
        result = await performSerpAPISearch(legal_query, 'law')
        console.log(`✅ Found results (${result.length} characters)`)
        break

      case 'next_meeting_recommendation':
        // Meeting recommendations via Nitec AI
        console.log('🔄 Processing next_meeting_recommendation...')
        const { meeting_topic } = args || {}
        if (!meeting_topic) {
          console.log('❌ Error: meeting_topic not specified')
          return NextResponse.json(
            {
              success: false,
              error: 'meeting_topic is required for next_meeting_recommendation',
            },
            { status: 400 }
          )
        }
        console.log(`🤖 Request to Nitec AI (1_recom_db): "${meeting_topic}"`)
        result = await callNitecAI('1_recom_db', meeting_topic)
        console.log(`✅ Received response from Nitec AI (${result.length} characters)`)
        break

      case 'best_practices_search':
        // International practices via SerpAPI
        console.log('🔄 Processing best_practices_search...')
        const { practice_query } = args || {}
        if (!practice_query) {
          console.log('❌ Error: practice_query not specified')
          return NextResponse.json(
            {
              success: false,
              error: 'practice_query is required for best_practices_search',
            },
            { status: 400 }
          )
        }
        console.log(`🌍 Searching international practices: "${practice_query}"`)
        result = await performSerpAPISearch(practice_query, 'practices')
        console.log(`✅ Found results (${result.length} characters)`)
        break

      case 'overview_situation_kazakhstan':
        // Kazakhstan situation overview via Nitec AI
        console.log('🔄 Processing overview_situation_kazakhstan...')
        const { situation_query } = args || {}
        if (!situation_query) {
          console.log('❌ Error: situation_query not specified')
          return NextResponse.json(
            {
              success: false,
              error: 'situation_query is required for overview_situation_kazakhstan',
            },
            { status: 400 }
          )
        }
        console.log(`🤖 Request to Nitec AI (1_recom_andrei): "${situation_query}"`)
        result = await callNitecAI('1_recom_andrei', situation_query)
        console.log(`✅ Received response from Nitec AI (${result.length} characters)`)
        break

      default:
        console.log(`❌ Unknown function: ${function_name}`)
        return NextResponse.json(
          { success: false, error: `Unknown function: ${function_name}` },
          { status: 400 }
        )
    }

    console.log(`\n📊 RESULT of function ${function_name}:`)
    console.log(`   Length: ${result.length} characters`)
    console.log(`   Preview: ${result.substring(0, 150)}...`)
    console.log('===========================================\n')

    return NextResponse.json({
      success: true,
      result: result,
    })
  } catch (error: any) {
    console.error(`\n❌❌❌ ERROR:`)
    console.error(`   Message: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    console.error('===========================================\n')

    return NextResponse.json(
      {
        success: false,
        error: `Error executing function: ${error.message}`,
      },
      { status: 500 }
    )
  }
}

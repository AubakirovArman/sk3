// Утилиты для работы с внешними сервисами Assistant

import axios from 'axios'

/**
 * Performs search using SerpAPI
 * @param query - Search query
 * @param focus - Search focus: "general", "law", or "practices"
 * @returns Search results as formatted string
 */
export async function performSerpAPISearch(
  query: string,
  focus: 'general' | 'law' | 'practices' = 'general'
): Promise<string> {
  console.log(`\n🔍 [SerpAPI] Starting search (focus: ${focus})...`)
  console.log(`🔍 [SerpAPI] Original query: "${query}"`)

  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) {
    console.error(`🔍 [SerpAPI] ❌ API key not configured\n`)
    throw new Error('SERPAPI_API_KEY not configured')
  }

  let searchQuery = query

  if (focus === 'law') {
    // Search only on adilet.zan.kz for legal questions
    searchQuery = `site:adilet.zan.kz ${query} законодательство Казахстан НПА кодекс`
    console.log(`🔍 [SerpAPI] Type: Legal search`)
  } else if (focus === 'practices') {
    // Regular search for international practices
    searchQuery = `${query} международный опыт best practices мировая практика`
    console.log(`🔍 [SerpAPI] Type: International practices`)
  } else {
    console.log(`🔍 [SerpAPI] Type: General search`)
  }

  console.log(`🔍 [SerpAPI] Final query: "${searchQuery}"`)

  const params = {
    engine: 'google',
    q: searchQuery,
    num: 5,
    hl: 'ru',
    gl: 'ru',
    api_key: apiKey,
  }

  try {
    const startTime = Date.now()
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params,
      timeout: 20000,
    })
    const duration = Date.now() - startTime

    console.log(`🔍 [SerpAPI] Response received in ${duration}ms`)
    console.log(`🔍 [SerpAPI] Results found: ${data.organic_results?.length || 0}`)

    const results = (data.organic_results || [])
      .slice(0, 3)
      .map(
        (r: any, i: number) =>
          `${i + 1}. ${r.title}\n${r.snippet || 'No description'}\nSource: ${r.link}`
      )
      .join('\n\n')

    console.log(`🔍 [SerpAPI] ✅ Result formatted (${results.length} characters)\n`)
    return results || 'Search results not found'
  } catch (error: any) {
    console.error(`🔍 [SerpAPI] ❌ Search error:`)
    console.error(`🔍 [SerpAPI]    Status: ${error.response?.status}`)
    console.error(`🔍 [SerpAPI]    Message: ${error.message}\n`)
    return 'Error performing search'
  }
}

/**
 * Calls Nitec AI model
 * @param model - Model name (e.g., "1_recom_db", "1_recom_andrei")
 * @param userQuery - User query
 * @returns Model response
 */
export async function callNitecAI(model: string, userQuery: string): Promise<string> {
  console.log(`\n🤖 [Nitec AI] Starting request to model ${model}...`)
  console.log(`🤖 [Nitec AI] Query: "${userQuery}"`)

  const endpoint = process.env.NITEC_AI_ENDPOINT
  const token = process.env.NITEC_AI_BEARER_TOKEN

  if (!endpoint || !token) {
    throw new Error('Nitec AI configuration missing')
  }

  console.log(`🤖 [Nitec AI] URL: ${endpoint}`)

  try {
    const startTime = Date.now()
    const response = await axios.post(
      endpoint,
      {
        model: model,
        stream: false,
        messages: [{ role: 'user', content: userQuery }],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )
    const duration = Date.now() - startTime

    console.log(`🤖 [Nitec AI] Response received in ${duration}ms`)
    console.log(`🤖 [Nitec AI] Status: ${response.status}`)

    const content = response.data?.choices?.[0]?.message?.content || 'No response'
    console.log(`🤖 [Nitec AI] ✅ Result: "${content.substring(0, 100)}..."\n`)
    return content
  } catch (error: any) {
    console.error(`🤖 [Nitec AI] ❌ Error with model ${model}:`)
    console.error(`🤖 [Nitec AI]    Status: ${error.response?.status}`)
    console.error(`🤖 [Nitec AI]    Data:`, error.response?.data)
    console.error(`🤖 [Nitec AI]    Message: ${error.message}\n`)
    return `Error calling model ${model}`
  }
}

/**
 * Calls DB webhook
 * @param message - Message to send to database
 * @returns Database response
 */
export async function callDatabaseWebhook(message: string): Promise<string> {
  console.log(`\n🗄️  [DB] Starting database request...`)

  const webhookUrl = process.env.DB_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('DB_WEBHOOK_URL not configured')
  }

  try {
    const payload = {
      sessionId: '12345',
      message: message,
    }

    console.log(`🗄️  [DB] Payload: ${JSON.stringify(payload, null, 2)}`)
    console.log(`🗄️  [DB] URL: ${webhookUrl}`)
    console.log(`🗄️  [DB] Waiting for response (timeout: 60s)...`)

    const startTime = Date.now()
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    })
    const duration = Date.now() - startTime

    console.log(`🗄️  [DB] Response received in ${duration}ms`)
    console.log(`🗄️  [DB] Status: ${response.status}`)
    console.log(`🗄️  [DB] Data:`, JSON.stringify(response.data, null, 2))

    // Database returns array - take first element
    const responseData = response.data
    let result: string

    console.log(
      `🗄️  [DB] Data type: ${Array.isArray(responseData) ? 'Array' : typeof responseData}`
    )

    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log(`🗄️  [DB] Array length ${responseData.length}, taking first element`)
      result =
        responseData[0].response ||
        responseData[0].answer ||
        responseData[0].message ||
        'Data not found'
    } else {
      console.log(`🗄️  [DB] Object, extracting data directly`)
      result = responseData.response || responseData.answer || responseData.message || 'Data not found'
    }

    console.log(`🗄️  [DB] ✅ Result: "${result.substring(0, 100)}..."\n`)
    return result
  } catch (error: any) {
    console.error(`🗄️  [DB] ❌ Error:`)
    console.error(`🗄️  [DB]    Status: ${error.response?.status}`)
    console.error(`🗄️  [DB]    Data:`, error.response?.data)
    console.error(`🗄️  [DB]    Message: ${error.message}\n`)
    return 'Error calling database service.'
  }
}

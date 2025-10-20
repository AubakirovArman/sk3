/**
 * AlemLLM API Configuration and Client
 * API endpoint: <YOUR_ALEMLLM_API_URL>/chat/completions
 */

export interface AlemLLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AlemLLMRequest {
  model: string
  messages: AlemLLMMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

export interface AlemLLMResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      function_call: null
      tool_calls: unknown[]
    }
    logprobs: null
    finish_reason: string
    stop_reason: null
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
    completion_tokens: number
  }
}

export class AlemLLMClient {
  private baseURL: string
  private model: string

  constructor() {
    this.baseURL = process.env.ALEMLLM_API_URL || '<YOUR_ALEMLLM_API_URL>'
    this.model = process.env.ALEMLLM_MODEL || 'astanahub/alemllm'
  }

  /**
   * Send a chat completion request to AlemLLM API
   */
  async createChatCompletion(
    messages: AlemLLMMessage[],
    options?: {
      max_tokens?: number
      temperature?: number
      top_p?: number
    }
  ): Promise<string> {
    const requestBody: AlemLLMRequest = {
      model: this.model,
      messages,
      max_tokens: options?.max_tokens || 8096,
      temperature: options?.temperature || 0.7,
      top_p: options?.top_p || 0.95,
    }

    // Логирование для отладки
    console.log('🔍 [AlemLLM] Request details:')
    console.log('  - Model:', requestBody.model)
    console.log('  - Messages count:', requestBody.messages.length)
    console.log('  - Max tokens:', requestBody.max_tokens)
    requestBody.messages.forEach((msg, idx) => {
      console.log(`  - Message ${idx} (${msg.role}): ${msg.content.length} chars`)
      if (msg.content.length > 500) {
        console.log(`    Preview: ${msg.content.substring(0, 200)}...`)
      }
    })

    try {
      const bodyString = JSON.stringify(requestBody)
      console.log('  - Total body size:', bodyString.length, 'chars')

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyString,
      })

      console.log('📥 [AlemLLM] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [AlemLLM] Error response:', errorText.substring(0, 500))
        throw new Error(`AlemLLM API error (${response.status}): ${errorText}`)
      }

      const data: AlemLLMResponse = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AlemLLM API')
      }

      console.log('✅ [AlemLLM] Success! Response length:', data.choices[0].message.content.length, 'chars')
      return data.choices[0].message.content
    } catch (error) {
      console.error('❌ [AlemLLM] API request failed:', error)
      throw error
    }
  }

  /**
   * Create a simple text completion
   */
  async complete(
    prompt: string,
    systemPrompt?: string,
    options?: {
      max_tokens?: number
      temperature?: number
    }
  ): Promise<string> {
    const messages: AlemLLMMessage[] = []

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: prompt,
    })

    return this.createChatCompletion(messages, options)
  }
}

// Export singleton instance
export const alemllm = new AlemLLMClient()

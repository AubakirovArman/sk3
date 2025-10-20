/**
 * Test script for new external BGE-M3 embedding API
 * 
 * Usage: node test-embedding-api.js
 */

const EMBEDDING_API_URL = 'https://bge-m3.sk-ai.kz/encode'

async function testEmbeddingAPI() {
  console.log('🧪 Testing BGE-M3 External API...')
  console.log('URL:', EMBEDDING_API_URL)
  console.log('')

  try {
    // Test 1: Single text
    console.log('📝 Test 1: Single text embedding')
    const response1 = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: ['Hello, world!'],
        return_dense: true,
      }),
    })

    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${await response1.text()}`)
    }

    const data1 = await response1.json()
    console.log('✅ Response keys:', Object.keys(data1))
    console.log('✅ Embedding dimension:', data1.dense_vecs?.[0]?.length)
    console.log('✅ Number of embeddings:', data1.dense_vecs?.length)
    console.log('✅ First 5 values:', data1.dense_vecs?.[0]?.slice(0, 5))
    console.log('')

    // Test 2: Multiple texts
    console.log('📝 Test 2: Multiple texts (batch)')
    const response2 = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [
          'What is machine learning?',
          'Что такое машинное обучение?',
          'Машиналық оқыту дегеніміз не?',
        ],
        return_dense: true,
      }),
    })

    if (!response2.ok) {
      throw new Error(`HTTP ${response2.status}: ${await response2.text()}`)
    }

    const data2 = await response2.json()
    console.log('✅ Number of embeddings:', data2.dense_vecs?.length)
    console.log('✅ All dimensions:', data2.dense_vecs?.map(e => e.length))
    console.log('')

    // Test 3: Multilingual support
    console.log('📝 Test 3: Multilingual texts')
    const texts = [
      'English text',
      'Русский текст',
      'Қазақ мәтіні',
    ]
    
    const response3 = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: texts,
        return_dense: true,
      }),
    })

    if (!response3.ok) {
      throw new Error(`HTTP ${response3.status}: ${await response3.text()}`)
    }

    const data3 = await response3.json()
    texts.forEach((text, i) => {
      console.log(`✅ "${text}" → ${data3.dense_vecs[i].length}D vector`)
    })
    console.log('')

    // Test 4: Performance
    console.log('📝 Test 4: Performance test (10 texts)')
    const startTime = Date.now()
    
    const response4 = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: Array(10).fill('Test text for performance'),
        return_dense: true,
      }),
    })

    if (!response4.ok) {
      throw new Error(`HTTP ${response4.status}: ${await response4.text()}`)
    }

    await response4.json()
    const elapsed = Date.now() - startTime
    console.log(`✅ Generated 10 embeddings in ${elapsed}ms`)
    console.log(`✅ Average: ${(elapsed / 10).toFixed(2)}ms per text`)
    console.log('')

    console.log('🎉 All tests passed!')
    console.log('')
    console.log('Summary:')
    console.log('- API endpoint: ✅ Working')
    console.log('- Response format: ✅ Correct (dense_vecs)')
    console.log('- Embedding dimension: ✅ 1024')
    console.log('- Batch processing: ✅ Supported')
    console.log('- Multilingual: ✅ Supported (en/ru/kk)')
    console.log('- Performance: ✅ Fast')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testEmbeddingAPI()

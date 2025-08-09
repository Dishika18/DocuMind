import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@ai-sdk/groq'
import { google } from '@ai-sdk/google'
import { generateText, CoreMessage } from 'ai'

// Simple rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 10

export async function POST(request: NextRequest) {
  try {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    const { messages: history, document, modelChoice } = await request.json()

    if (!history || !document) {
      return NextResponse.json({ error: 'Messages and document are required' }, { status: 400 })
    }

    const model = modelChoice === 'gemini'
      ? google('models/gemini-2.0-flash-exp')
      : groq('llama-3.3-70b-versatile')

    let documentContext = `DOCUMENT TITLE: ${document.title}\n\n`
    documentContext += `DOCUMENT CONTENT:\n${document.content}\n\n`

    if (document.codeBlocks && document.codeBlocks.length > 0) {
      documentContext += `CODE EXAMPLES:\n`
      document.codeBlocks.forEach((block: any, index: number) => {
        documentContext += `Code ${index + 1} (${block.language}):\n${block.code}\n\n`
      })
    }

    const messagesForAI: CoreMessage[] = history.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    const systemPrompt = `You are DocuMind, an AI assistant that analyzes documents. Answer questions based ONLY on the provided document content.

DOCUMENT:
${documentContext}

INSTRUCTIONS:
1. Answer only from the document content
2. Be helpful and accurate
3. Include code examples if relevant
4. Provide step-by-step instructions if asked

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "description": "Your detailed answer based on the document",
  "steps": ["Include only if user asks for how-to or steps"],
  "codeBlocks": [
    {
      "language": "javascript",
      "code": "actual code from document",
      "description": "what this code does"
    }
  ],
  "exactMatch": true,
  "notFound": false
}

If information is not found, set "notFound": true and provide the closest relevant information.`

    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: messagesForAI,
      temperature: 0.1,
    })

    let structured
    try {
      let cleanText = text.trim()

      if (cleanText.includes('\`\`\`')) {
        const match = cleanText.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/)
        if (match) {
          cleanText = match[1].trim()
        }
      }

      const start = cleanText.indexOf('{')
      const end = cleanText.lastIndexOf('}')

      if (start !== -1 && end !== -1) {
        cleanText = cleanText.substring(start, end + 1)
      }

      structured = JSON.parse(cleanText)

      if (!structured.description) {
        structured.description = "I found information in the document that addresses your question."
      }

      if (!Array.isArray(structured.codeBlocks)) {
        structured.codeBlocks = []
      }

      if (structured.steps && !Array.isArray(structured.steps)) {
        structured.steps = []
      }

    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)

      structured = {
        description: text.length > 0 ? text.substring(0, 500) + "..." : "I found relevant information in the document.",
        codeBlocks: document.codeBlocks ? document.codeBlocks.slice(0, 2).map((block: any) => ({
          language: block.language || 'text',
          code: block.code,
          description: block.context || 'Code from document'
        })) : [],
        exactMatch: false,
        notFound: false
      }
    }

    return NextResponse.json({
      content: structured.description,
      structured
    })

  } catch (error) {
    console.error('Chat API error:', error)

    return NextResponse.json({
      error: 'Failed to process your question. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

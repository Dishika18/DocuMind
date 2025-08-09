import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch the document
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch document')
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract 
    const title = $('title').text() || $('h1').first().text() || 'Untitled Document'

    const codeBlocks = extractCodeBlocks($)

    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove()

    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.documentation',
      '.doc-content',
      'body'
    ]

    let content = ''
    let structuredContent = {}

    for (const selector of contentSelectors) {
      const element = $(selector).first()
      if (element.length && element.text().trim().length > 100) {
        // Extract structured content with headings and sections
        structuredContent = extractStructuredContent(element, $)
        content = element.text().trim()
        break
      }
    }

    if (!content) {
      content = $('body').text().trim()
      structuredContent = extractStructuredContent($('body'), $)
    }

    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()

    if (content.length > 15000) {
      content = content.substring(0, 15000)
      const lastSentence = content.lastIndexOf('.')
      if (lastSentence > 10000) {
        content = content.substring(0, lastSentence + 1)
      }
    }

    // Generate insights
    const insights = generateInsights(content, title, codeBlocks)

    return NextResponse.json({
      title: title.substring(0, 200),
      content,
      structuredContent,
      codeBlocks,
      url,
      insights
    })

  } catch (error) {
    console.error('Document parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    )
  }
}

function extractCodeBlocks($: cheerio.CheerioAPI) {
  const codeBlocks: Array<{
    language: string
    code: string
    context: string
    element: string
  }> = []

  // Extract from various code block elements
  const codeSelectors = [
    'pre code',
    'code',
    '.highlight pre',
    '.code-block',
    '.language-*',
    '[class*="language-"]',
    '.hljs'
  ]

  codeSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const $el = $(element)
      const code = $el.text().trim()

      if (code.length > 10 && !codeBlocks.some(block => block.code === code)) {
        const className = $el.attr('class') || $el.parent().attr('class') || ''
        const language = extractLanguageFromClass(className) || detectLanguage(code)

        const context = $el.closest('section, article, div').find('h1, h2, h3, h4, h5, h6, p').first().text().trim().substring(0, 100)

        codeBlocks.push({
          language,
          code,
          context: context || 'Code example',
          element: selector
        })
      }
    })
  })

  return codeBlocks
}

function extractLanguageFromClass(className: string): string {
  const langMatches = className.match(/(?:language-|lang-)([a-zA-Z0-9]+)/i)
  if (langMatches) {
    return langMatches[1].toLowerCase()
  }

  const langMap: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml'
  }

  for (const [key, value] of Object.entries(langMap)) {
    if (className.includes(key)) {
      return value
    }
  }

  return 'text'
}

function detectLanguage(code: string): string {
  if (/^import\s+.*from|^const\s+.*=|^function\s+\w+|^class\s+\w+/.test(code.trim())) {
    return 'javascript'
  }
  if (/^def\s+\w+|^import\s+\w+|^from\s+\w+\s+import/.test(code.trim())) {
    return 'python'
  }
  if (/^<\?php|^namespace\s+|^class\s+\w+/.test(code.trim())) {
    return 'php'
  }
  if (/^#include|^int\s+main|^void\s+\w+/.test(code.trim())) {
    return 'c'
  }
  if (/^public\s+class|^import\s+java/.test(code.trim())) {
    return 'java'
  }
  if (/^\s*<[^>]+>/.test(code.trim())) {
    return 'html'
  }
  if (/^\s*\{|\}$/.test(code.trim()) && code.includes(':')) {
    return 'json'
  }

  return 'text'
}

function extractStructuredContent(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI) {
  const sections: Array<{
    heading: string
    content: string
    level: number
  }> = []

  // Extract headings and their content
  element.find('h1, h2, h3, h4, h5, h6').each((_, heading) => {
    const $heading = $(heading)
    const level = parseInt(heading.tagName.substring(1))
    const headingText = $heading.text().trim()

    let content = ''
    let $next = $heading.next()

    while ($next.length && !$next.is(`h1, h2, h3, h4, h5, h6`)) {
      content += $next.text().trim() + ' '
      $next = $next.next()
    }

    if (headingText && content.trim()) {
      sections.push({
        heading: headingText,
        content: content.trim().substring(0, 500),
        level
      })
    }
  })

  return { sections }
}

function generateInsights(content: string, title: string, codeBlocks: any[]): string[] {
  const insights: string[] = []

  const wordCount = content.split(/\s+/).length
  insights.push(`${wordCount.toLocaleString()} words`)

  const readingTime = Math.ceil(wordCount / 200)
  insights.push(`${readingTime} min read`)

  if (codeBlocks.length > 0) {
    insights.push(`${codeBlocks.length} code examples`)

    const languages = [...new Set(codeBlocks.map(block => block.language))]
    if (languages.length > 0) {
      insights.push(`Languages: ${languages.slice(0, 3).join(', ')}`)
    }
  }

  const topics = [
    { pattern: /api|endpoint|rest|graphql/gi, label: 'API Documentation' },
    { pattern: /tutorial|guide|how.?to|step.?by.?step/gi, label: 'Tutorial' },
    { pattern: /react|vue|angular|javascript|typescript/gi, label: 'Frontend Development' },
    { pattern: /python|java|golang|rust|c\+\+/gi, label: 'Programming' },
    { pattern: /database|sql|mongodb|postgresql/gi, label: 'Database' },
    { pattern: /docker|kubernetes|deployment|devops/gi, label: 'DevOps' },
    { pattern: /machine.?learning|ai|neural.?network/gi, label: 'AI/ML' }
  ]

  topics.forEach(topic => {
    if (topic.pattern.test(content) || topic.pattern.test(title)) {
      insights.push(topic.label)
    }
  })

  return insights.slice(0, 6)
}

import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Document validation patterns
const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".markdown",
  ".rtf",
  ".odt",
  ".html",
  ".htm",
  ".xml",
  ".json",
  ".csv",
  ".xlsx",
  ".xls",
  ".ppt",
  ".pptx",
]

const DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/html",
  "application/xhtml+xml",
  "text/xml",
  "application/xml",
  "application/json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

function isDocumentUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check for document extensions
    return DOCUMENT_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  } catch {
    return false
  }
}

function isDocumentContent(contentType: string, content: string, url: string): boolean {
  // Check content type
  if (DOCUMENT_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return true
  }

  // Check for documentation sites and technical content
  const documentationPatterns = [
    /docs?\./i,
    /documentation/i,
    /guide/i,
    /tutorial/i,
    /manual/i,
    /readme/i,
    /wiki/i,
    /api/i,
    /reference/i,
    /help/i,
  ]

  if (documentationPatterns.some((pattern) => pattern.test(url))) {
    return true
  }

  // Check content for document-like characteristics
  const documentIndicators = [
    /<h[1-6][^>]*>/i, // Headers
    /<p[^>]*>/i, // Paragraphs
    /<pre[^>]*>/i, // Code blocks
    /<code[^>]*>/i, // Inline code
    /<article[^>]*>/i, // Article content
    /class.*content/i, // Content classes
    /class.*post/i, // Post classes
    /class.*doc/i, // Documentation classes
  ]

  const hasDocumentStructure = documentIndicators.some((pattern) => pattern.test(content))

  // Check for substantial text content (more than 500 characters of meaningful text)
  const textContent = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const hasSubstantialContent = textContent.length > 500

  return hasDocumentStructure && hasSubstantialContent
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Please enter a valid document link." }, { status: 400 })
    }

    // Check if URL looks like a document
    const isDocUrl = isDocumentUrl(url)

    // Fetch the document
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Please enter a valid document link." }, { status: 400 })
    }

    const contentType = response.headers.get("content-type") || ""
    const html = await response.text()

    // Validate if this is actually a document
    if (!isDocUrl && !isDocumentContent(contentType, html, url)) {
      return NextResponse.json({ error: "Please enter a valid document link." }, { status: 400 })
    }

    const $ = cheerio.load(html)

    // Extract title
    const title = $("title").text() || $("h1").first().text() || "Untitled Document"

    // Extract and preserve code blocks before removing scripts
    const codeBlocks = extractCodeBlocks($)

    // Remove unwanted elements but preserve structure
    $("script, style, nav, header, footer, aside, .advertisement, .ads").remove()

    const contentSelectors = [
      "article",
      "main",
      ".content",
      ".post-content",
      ".entry-content",
      ".article-content",
      ".documentation",
      ".doc-content",
      "body",
    ]

    let content = ""
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
      content = $("body").text().trim()
      structuredContent = extractStructuredContent($("body"), $)
    }

    // Final validation - ensure we have substantial content
    if (content.length < 200) {
      return NextResponse.json({ error: "Please enter a valid document link." }, { status: 400 })
    }

    // Clean up content while preserving important formatting
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim()

    // Limit content but ensure we don't cut off mid-sentence
    if (content.length > 15000) {
      content = content.substring(0, 15000)
      const lastSentence = content.lastIndexOf(".")
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
      insights,
    })
  } catch (error) {
    console.error("Document parsing error:", error)
    return NextResponse.json({ error: "Please enter a valid document link." }, { status: 400 })
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
    "pre code",
    "code",
    ".highlight pre",
    ".code-block",
    ".language-*",
    '[class*="language-"]',
    ".hljs",
  ]

  codeSelectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const $el = $(element)
      const code = $el.text().trim()

      // Only include substantial code blocks (more than 10 characters)
      if (code.length > 10 && !codeBlocks.some((block) => block.code === code)) {
        // Try to determine language from class names
        const className = $el.attr("class") || $el.parent().attr("class") || ""
        const language = extractLanguageFromClass(className) || detectLanguage(code)

        // Get surrounding context
        const context = $el
          .closest("section, article, div")
          .find("h1, h2, h3, h4, h5, h6, p")
          .first()
          .text()
          .trim()
          .substring(0, 100)

        codeBlocks.push({
          language,
          code,
          context: context || "Code example",
          element: selector,
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

  // Common language class patterns
  const langMap: { [key: string]: string } = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    yml: "yaml",
  }

  for (const [key, value] of Object.entries(langMap)) {
    if (className.includes(key)) {
      return value
    }
  }

  return "text"
}

function detectLanguage(code: string): string {
  // Simple language detection based on common patterns
  if (/^import\s+.*from|^const\s+.*=|^function\s+\w+|^class\s+\w+/.test(code.trim())) {
    return "javascript"
  }
  if (/^def\s+\w+|^import\s+\w+|^from\s+\w+\s+import/.test(code.trim())) {
    return "python"
  }
  if (/^<\?php|^namespace\s+|^class\s+\w+/.test(code.trim())) {
    return "php"
  }
  if (/^#include|^int\s+main|^void\s+\w+/.test(code.trim())) {
    return "c"
  }
  if (/^public\s+class|^import\s+java/.test(code.trim())) {
    return "java"
  }
  if (/^\s*<[^>]+>/.test(code.trim())) {
    return "html"
  }
  if (/^\s*\{|\}$/.test(code.trim()) && code.includes(":")) {
    return "json"
  }

  return "text"
}

function extractStructuredContent(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI) {
  const sections: Array<{
    heading: string
    content: string
    level: number
  }> = []

  // Extract headings and their content
  element.find("h1, h2, h3, h4, h5, h6").each((_, heading) => {
    const $heading = $(heading)
    const level = Number.parseInt(heading.tagName.substring(1))
    const headingText = $heading.text().trim()

    // Get content until next heading of same or higher level
    let content = ""
    let $next = $heading.next()

    while ($next.length && !$next.is(`h1, h2, h3, h4, h5, h6`)) {
      content += $next.text().trim() + " "
      $next = $next.next()
    }

    if (headingText && content.trim()) {
      sections.push({
        heading: headingText,
        content: content.trim().substring(0, 500),
        level,
      })
    }
  })

  return { sections }
}

function generateInsights(content: string, title: string, codeBlocks: any[]): string[] {
  const insights: string[] = []

  // Word count
  const wordCount = content.split(/\s+/).length
  insights.push(`${wordCount.toLocaleString()} words`)

  // Estimated reading time
  const readingTime = Math.ceil(wordCount / 200)
  insights.push(`${readingTime} min read`)

  // Code blocks count
  if (codeBlocks.length > 0) {
    insights.push(`${codeBlocks.length} code examples`)

    // Unique languages
    const languages = [...new Set(codeBlocks.map((block) => block.language))]
    if (languages.length > 0) {
      insights.push(`Languages: ${languages.slice(0, 3).join(", ")}`)
    }
  }

  // Check for common topics
  const topics = [
    { pattern: /api|endpoint|rest|graphql/gi, label: "API Documentation" },
    { pattern: /tutorial|guide|how.?to|step.?by.?step/gi, label: "Tutorial" },
    { pattern: /react|vue|angular|javascript|typescript/gi, label: "Frontend Development" },
    { pattern: /python|java|golang|rust|c\+\+/gi, label: "Programming" },
    { pattern: /database|sql|mongodb|postgresql/gi, label: "Database" },
    { pattern: /docker|kubernetes|deployment|devops/gi, label: "DevOps" },
    { pattern: /machine.?learning|ai|neural.?network/gi, label: "AI/ML" },
  ]

  topics.forEach((topic) => {
    if (topic.pattern.test(content) || topic.pattern.test(title)) {
      insights.push(topic.label)
    }
  })

  return insights.slice(0, 6) // Limit to 6 insights
}

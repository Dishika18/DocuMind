"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send,
  User,
  Code,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Brain,
  MessageSquare,
} from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useToast } from "@/hooks/use-toast"

interface DocumentData {
  title: string
  content: string
  url: string
  insights: string[]
}

interface Message {
  id: string
  type: "user" | "assistant" | "error"
  content: string
  structured?: {
    description: string
    steps?: string[]
    codeBlocks?: Array<{
      language: string
      code: string
      description?: string
    }>
    exactMatch?: boolean
    notFound?: boolean
  }
  error?: {
    type: "rate_limit" | "timeout" | "general"
    message: string
    retryAfter?: number
  }
  modelUsed?: "groq" | "gemini"
  timestamp?: number
}

interface ChatInterfaceProps {
  document: DocumentData
}

const SUPPORTED_LANGUAGES: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  jsx: "jsx",
  typescript: "typescript",
  ts: "typescript",
  tsx: "tsx",
  python: "python",
  py: "python",
  python3: "python",
  java: "java",
  kotlin: "kotlin",
  scala: "scala",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  cc: "cpp",
  csharp: "csharp",
  "c#": "csharp",
  cs: "csharp",
  php: "php",
  ruby: "ruby",
  rb: "ruby",
  go: "go",
  golang: "go",
  rust: "rust",
  rs: "rust",
  swift: "swift",
  "objective-c": "objectivec",
  objc: "objectivec",
  html: "html",
  htm: "html",
  xhtml: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  xml: "xml",
  svg: "xml",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  dockerfile: "dockerfile",
  markdown: "markdown",
  md: "markdown",
  text: "text",
  txt: "text",
  plain: "text",
}

const professionalDarkTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: "0.875rem",
    lineHeight: "1.6",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  'code[class*="language-"]': {
    background: "transparent",
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  comment: { color: "#64748b", fontStyle: "italic" },
  string: { color: "#10b981" },
  keyword: { color: "#8b5cf6", fontWeight: "600" },
  function: { color: "#f59e0b" },
  "class-name": { color: "#eab308" },
  number: { color: "#06b6d4" },
  boolean: { color: "#06b6d4" },
  operator: { color: "#e2e8f0" },
  punctuation: { color: "#94a3b8" },
  property: { color: "#f472b6" },
  tag: { color: "#ef4444" },
  "attr-name": { color: "#f59e0b" },
  variable: { color: "#e2e8f0" },
}

export function ChatInterface({ document }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<"groq" | "gemini">("groq")
  const [requestCount, setRequestCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (document && messages.length === 0 && !isLoading) {
      setMessages([
        {
          id: "initial-greeting",
          type: "assistant",
          content:
            "🚀 Welcome to DocuMind. Your document has been processed, and I am ready to assist with any questions you'd like to explore.",
          structured: {
            description:
              "🚀 Welcome to DocuMind. Your document has been processed, and I am ready to assist with any questions you'd like to explore.",
            codeBlocks: [],
            exactMatch: true,
            notFound: false,
          },
          modelUsed: selectedModel,
          timestamp: Date.now(),
        },
      ])
    }
  }, [document, messages.length, isLoading, selectedModel])

  const normalizeLanguage = (lang: string): string => {
    const normalized = lang.toLowerCase().trim()
    return SUPPORTED_LANGUAGES[normalized] || "text"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setRequestCount((prev) => prev + 1)

    const messagesForApi = [...messages, userMessage].map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
      type: msg.type,
    }))

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForApi,
          document: document,
          modelChoice: selectedModel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.structured) {
        data.structured = {
          description: data.content || "I found comprehensive information in the document.",
          codeBlocks: [],
          exactMatch: false,
          notFound: false,
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.content || data.structured.description,
        structured: data.structured,
        modelUsed: selectedModel,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // // Success feedback
      // if (data.structured?.codeBlocks?.length > 0 || data.structured?.steps?.length > 0) {
      //   toast({
      //     title: "🎉 Complete Analysis Generated",
      //     description: `Found ${data.structured.codeBlocks?.length || 0} code examples and comprehensive information.`,
      //   })
      // }
    } catch (error) {
      console.error("Chat error:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: `Failed to get response: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: {
          type: "general",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "❌ Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.type === "user") {
        setInput(userMessage.content)
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    }
  }

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(id)
      toast({
        title: "✅ Code Copied!",
        description: "Code snippet has been copied to clipboard.",
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      toast({
        title: "❌ Failed to Copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const CodeBlock = ({
    snippet,
    messageId,
    index,
  }: {
    snippet: any
    messageId: string
    index: number
  }) => {
    const codeId = `${messageId}-${index}`
    const language = normalizeLanguage(snippet.language || "text")

    return (
      <div className="w-full">
        <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant="secondary" className="text-xs font-mono px-2 py-0.5 shrink-0">
                {snippet.language || "text"}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
              onClick={() => copyToClipboard(snippet.code, codeId)}
            >
              {copiedCode === codeId ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          {snippet.description && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50">
              <p className="text-sm text-blue-800 dark:text-blue-200 break-words">{snippet.description}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <SyntaxHighlighter
              language={language}
              style={professionalDarkTheme}
              className="!m-0 w-full"
              showLineNumbers={snippet.code.split("\n").length > 5}
              customStyle={{
                padding: "0.75rem",
                margin: 0,
                background: "#1e293b",
                fontSize: "0.8rem",
                lineHeight: "1.5",
                minWidth: "100%",
              }}
              wrapLines={true}
              wrapLongLines={true}
            >
              {snippet.code}
            </SyntaxHighlighter>
          </div>
        </Card>
      </div>
    )
  }

  const renderMessage = (message: Message) => {
    if (message.type === "user") {
      return (
        <div key={message.id} className="flex items-start gap-2 sm:gap-3 mb-4">
          <div className="bg-violet-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-2 sm:p-3 border border-violet-200 dark:border-violet-800/50">
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed break-words">
                {message.content}
              </p>
            </div>
            {message.timestamp && (
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2">{formatTimestamp(message.timestamp)}</p>
            )}
          </div>
        </div>
      )
    }

    if (message.type === "error") {
      return (
        <div key={message.id} className="flex items-start gap-2 sm:gap-3 mb-4">
          <div className="bg-red-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <Alert variant="destructive" className="border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30">
              <AlertDescription className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Error</p>
                    <p className="text-sm mt-1 break-words">{message.content}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 h-8 bg-transparent w-full sm:w-auto"
                    onClick={() => handleRetry(message.id)}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return (
      <div key={message.id} className="flex items-start gap-2 sm:gap-3 mb-4">
        <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
          <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {message.structured ? (
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-3 sm:p-4 space-y-4">
                {/* Model indicator */}
                {message.modelUsed && (
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-violet-500" />
                      <Badge variant="outline" className="text-xs">
                        {message.modelUsed === "gemini" ? "Gemini" : "Groq"}
                      </Badge>
                    </div>
                    {message.timestamp && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatTimestamp(message.timestamp)}</p>
                    )}
                  </div>
                )}

                {/* Not Found Warning */}
                {message.structured.notFound && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Information Not Found</p>
                      <p className="text-sm mt-1">
                        The requested information could not be found in the provided document.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Description */}
                <div className="space-y-3">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed space-y-3">
                      {message.structured.description &&
                        message.structured.description.split("\n").map((paragraph, index) => {
                          if (paragraph.trim() === "") return null

                          const formattedParagraph = paragraph
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                            .replace(
                              /`(.*?)`/g,
                              '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono break-all">$1</code>',
                            )

                          return (
                            <p
                              key={index}
                              className="break-words text-xs sm:text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                            />
                          )
                        })}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {message.structured.steps &&
                  Array.isArray(message.structured.steps) &&
                  message.structured.steps.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="break-words">Step-by-Step Instructions</span>
                      </h4>
                      <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                        <CardContent className="p-3 sm:p-4">
                          <ol className="space-y-3">
                            {message.structured.steps.map((step: string, index: number) => (
                              <li key={index} className="flex gap-2 sm:gap-3">
                                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-1 min-w-0">
                                  <div
                                    className="break-words"
                                    dangerouslySetInnerHTML={{
                                      __html: step
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                        .replace(
                                          /`(.*?)`/g,
                                          '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono break-all">$1</code>',
                                        ),
                                    }}
                                  />
                                </div>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                {/* Code Blocks */}
                {message.structured.codeBlocks &&
                  Array.isArray(message.structured.codeBlocks) &&
                  message.structured.codeBlocks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Code className="w-4 h-4 text-orange-600" />
                        <span className="break-words">Code Examples ({message.structured.codeBlocks.length})</span>
                      </h4>
                      <div className="space-y-3">
                        {message.structured.codeBlocks.map((snippet: any, index: number) => (
                          <CodeBlock key={index} snippet={snippet} messageId={message.id} index={index} />
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed break-words">
                  {message.content}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Card className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-3 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-800 dark:text-slate-200">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span className="font-semibold break-words">Your AI Document Analyzer</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {requestCount} queries
              </Badge>
              <Select value={selectedModel} onValueChange={(value: "groq" | "gemini") => setSelectedModel(value)}>
                <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-sm">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 min-h-0">
            <ScrollArea ref={scrollAreaRef} className="h-full px-2 sm:px-4">
              <div className="py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mb-4">
                      <div className="inline-flex p-2 sm:p-3 bg-emerald-600 rounded-xl mb-3">
                        <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 px-4">
                      Ready to Analyze Your Document
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto text-xs sm:text-sm px-4">
                      Ask me anything about your document. I can provide detailed explanations, code examples, and
                      step-by-step instructions.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-sm sm:max-w-lg mx-auto text-xs px-4">
                      <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800/50">
                        <p className="font-medium text-violet-700 dark:text-violet-300">Precise Answers</p>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Code Examples</p>
                      </div>
                      <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800/50">
                        <p className="font-medium text-orange-700 dark:text-orange-300">Step-by-Step</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(renderMessage)}
                    {isLoading && (
                      <div key="loading" className="flex items-start gap-2 sm:gap-3">
                        <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <Card className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-2">
                              <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                {selectedModel === "gemini" ? "Gemini" : "Groq"} is analyzing...
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your document..."
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-9 sm:h-10 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
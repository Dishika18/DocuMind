'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Link, Upload, FileText, CheckCircle, X, Menu } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ChatInterface } from './chat-interface'
import { Hero } from './hero'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface DocumentData {
  title: string
  content: string
  structuredContent?: {
    sections: Array<{
      heading: string
      content: string
      level: number
    }>
  }
  codeBlocks?: Array<{
    language: string
    code: string
    context: string
    element: string
  }>
  url: string
  insights: string[]
}

export function DocumentUpload() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid document URL.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse document')
      }

      const data = await response.json()
      setDocument(data)
      setSidebarOpen(false)

      toast({
        title: "Document processed successfully!",
        description: "You can now ask questions about the content.",
      })

    } catch (error) {
      console.error('Document processing error:', error)
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "Please check the URL and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setDocument(null)
    setUrl('')
    setSidebarOpen(false)
    toast({
      title: "Document cleared",
      description: "You can now enter a new document link.",
    })
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const DocumentSidebar = () => (
    <Card className="border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm h-fit border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Document
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            onClick={handleReset}
            title="Clear document and start over"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Document successfully analyzed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Document URL:
          </label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <Input
              type="url"
              placeholder="https://example.com/document.pdf"
              value={url}
              onChange={handleUrlChange}
              className="pl-10 h-10 text-sm border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-400 transition-all duration-300 bg-white dark:bg-slate-800"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full h-9 text-sm bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 transition-all duration-200"
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Re-analyze
              </>
            )}
          </Button>
        </div>

        {/* Document Info */}
        {document && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base line-clamp-2 flex-1">
                {document.title}
              </h3>
              <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex-shrink-0 border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Key Insights:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {document.insights.slice(0, 6).map((insight, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                      {insight}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Source:</strong>
                <span className="ml-1 break-all">{document.url}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-violet-50 to-emerald-50 dark:from-slate-950 dark:via-violet-950 dark:to-emerald-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Hero Section */}
      {!document && (
        <div className="min-h-screen flex flex-col justify-center relative z-10">
          <div className="flex-1 flex flex-col justify-center">
            <Hero
              url={url}
              isLoading={isLoading}
              handleUrlChange={handleUrlChange}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      )}

      {/* Document Analysis Interface */}
      {document && (
        <div className="min-h-screen animate-in fade-in duration-700 relative z-10">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            {/* Mobile Header with Menu */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Document Analysis
                </h1>
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600">
                      <Menu className="w-4 h-4 mr-2" />
                      Document Info
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 sm:w-96 p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SheetHeader className="p-6">
                      <SheetTitle>Document Information</SheetTitle>
                    </SheetHeader>
                    <div className="p-6">
                      <DocumentSidebar />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-[calc(100vh-8rem)]">

              {/* Left Side - Document Info (Desktop) */}
              <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <DocumentSidebar />
              </div>

              {/* Right Side - Chat Interface */}
              <div className="lg:col-span-8 xl:col-span-9 min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-6rem)]">
                <div className="h-full animate-in slide-in-from-right-4 duration-700 delay-200">
                  <ChatInterface document={document} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

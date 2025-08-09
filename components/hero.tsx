import { Brain, FileText, MessageSquare, Sparkles, ArrowDown, Link, Upload, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeroProps {
  url: string;
  isLoading: boolean;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function Hero({ url, isLoading, handleUrlChange, handleSubmit }: HeroProps) {
  return (
    <div className="relative py-8 md:py-12 lg:py-16 overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Secondary Grid for Depth */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.09]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-violet-400/15 to-purple-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-400/15 to-teal-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-amber-400/15 to-orange-600/15 rounded-full blur-3xl animate-pulse delay-2000" />

        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/5 to-background/20" />
      </div>

      <div className="text-center relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <Card className="relative bg-background/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
              <CardContent className="p-3 md:p-5">
                <Brain className="w-8 h-8 md:w-12 md:h-12 text-violet-600 dark:text-violet-400" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3 mb-4 md:mb-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight tracking-tight">
            DocuMind
          </h1>
          <div className="flex justify-center">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-violet-200/60 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 bg-background/80 backdrop-blur-sm">
              AI-Powered Document Analysis
            </Badge>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-6 md:mb-8">
          <p className="text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
            Transform any document into an intelligent conversation.
          </p>
          <p className="text-sm md:text-base text-violet-600 dark:text-violet-400 font-medium">
            Upload, analyze, and explore your content with AI-powered insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-8 max-w-3xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 bg-background/80 backdrop-blur-sm hover:bg-background/90">
            <CardContent className="flex items-center gap-2 p-2 md:p-3">
              <div className="p-1.5 rounded-lg bg-violet-100/80 dark:bg-violet-900/50 group-hover:bg-violet-200/80 dark:group-hover:bg-violet-800/50 transition-colors backdrop-blur-sm">
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="font-medium text-xs md:text-sm text-slate-700 dark:text-slate-300">
                Smart Document Parsing
              </span>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 bg-background/80 backdrop-blur-sm hover:bg-background/90">
            <CardContent className="flex items-center gap-2 p-2 md:p-3">
              <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 group-hover:bg-emerald-200/80 dark:group-hover:bg-emerald-800/50 transition-colors backdrop-blur-sm">
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-medium text-xs md:text-sm text-slate-700 dark:text-slate-300">
                Interactive Q&A
              </span>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 bg-background/80 backdrop-blur-sm hover:bg-background/90">
            <CardContent className="flex items-center gap-2 p-2 md:p-3">
              <div className="p-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 group-hover:bg-amber-200/80 dark:group-hover:bg-amber-800/50 transition-colors backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-medium text-xs md:text-sm text-slate-700 dark:text-slate-300">
                AI-Powered Insights
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">

          {/* Input Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200">
                  Enter Document URL
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Paste a link to any document, article, or webpage to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 z-10" />
                    <Input
                      type="url"
                      placeholder="https://example.com/document"
                      value={url}
                      onChange={handleUrlChange}
                      className="pl-12 h-12 sm:h-14 text-base sm:text-lg border-2 border-slate-200/50 dark:border-slate-700/50 focus:border-violet-500 dark:focus:border-violet-400 transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    disabled={isLoading || !url.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Document...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

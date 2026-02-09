import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export const revalidate = 0

async function getAbout() {
  const { data, error } = await supabase
    .from('about')
    .select('*')
    .single()
  
  if (error || !data) {
    return { content: '소개 페이지를 준비 중입니다.' }
  }
  
  return data
}

export default async function AboutPage() {
  const about = await getAbout()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <header className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              소개
            </h1>
          </header>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: about.content }}
          />
        </div>
      </main>
    </>
  )
}
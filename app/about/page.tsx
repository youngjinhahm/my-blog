import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

export const revalidate = 0

async function getAbout() {
  const { data, error } = await supabase
    .from('about')
    .select('*')
    .single()
  
  if (error || !data) {
    return { content: '' }
  }
  
  return data
}

export default async function AboutPage() {
  const about = await getAbout()

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-8 py-20">
          <div className="flex gap-16 items-start">
            {/* 왼쪽: 프로필 이미지 */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-200 aspect-square mb-4">
                {/* 프로필 이미지 영역 - 관리자 페이지에서 이미지 URL을 content에 포함시킬 수 있습니다 */}
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  프로필 이미지
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                PHOTO BY YOUR NAME
              </p>
            </div>

            {/* 오른쪽: 소개 텍스트 */}
            <div className="flex-1">
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: about.content }}
              />
              
              {/* 연락처 폼 (선택사항) */}
              <div className="mt-16 pt-16 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact</h2>
                <form className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-gray-900 text-white hover:bg-gray-700 transition font-medium"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
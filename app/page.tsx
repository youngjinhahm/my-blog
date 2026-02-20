import { supabase } from '@/lib/supabase'
import type { Post, SiteSettings } from '@/types/database'
import Nav from '@/components/Nav'
import HomeContent from '@/components/HomeContent'

export const revalidate = 0

async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data as Post[]
}

async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single()

  if (error || !data) {
    return {
      hero_title: '생각을 기록하는 공간',
      hero_subtitle: '경제, 책, 영화, 그리고 세상에 대한 이야기를 나눕니다.',
    } as SiteSettings
  }

  return data as SiteSettings
}

export default async function Home() {
  const posts = await getPosts()
  const settings = await getSiteSettings()

  return (
    <>
      <Nav />
      <HomeContent posts={posts} settings={settings} />
    </>
  )
}
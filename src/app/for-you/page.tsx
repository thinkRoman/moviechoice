import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import RecommendationStudio from '@/components/recommendation-studio';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ForYouPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/for-you');

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <SiteHeader />
      <RecommendationStudio />
    </main>
  );
}

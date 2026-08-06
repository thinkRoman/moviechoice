import { redirect } from 'next/navigation';
import RecommendationStudio from '@/components/recommendation-studio';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ForYouPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/for-you');
  const isOwner = session.user.role === 'OWNER';

  return (
    <main className="min-h-screen overflow-x-hidden">
      <RecommendationStudio />
      <MobileBottomNav isOwner={isOwner} />
    </main>
  );
}

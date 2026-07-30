import { redirect } from 'next/navigation';
import PersonalizationSettings from '@/components/personalization-settings';
import SiteHeader from '@/components/site-header';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/settings');

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <PersonalizationSettings isOwner={session.user.role === 'OWNER'} />
    </main>
  );
}

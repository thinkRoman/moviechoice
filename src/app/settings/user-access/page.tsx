import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import UserAccessClient from './user-access-client';

export default async function UserAccessPage() {
  const session = await auth();
  if (!session?.user) redirect('/signin?callbackUrl=/settings/user-access');
  if (session.user.role !== 'OWNER') redirect('/');

  return <UserAccessClient />;
}

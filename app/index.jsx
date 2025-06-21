import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getUserRoleFromSession } from '@/services/appwrite';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const role = await getUserRoleFromSession();
        const path = role === 'admin' ? '/(admin)/AdminHome' : '/(user)/UserHome';
        router.replace(path);
      } catch (error) {
        router.replace('/auth'); // No session or error
      }
    };

    checkUserSession();
  }, []);

  return null;
}

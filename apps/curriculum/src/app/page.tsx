"use client"

import { Login } from '@curriculum-services/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeJWT } from '@curriculum-services/auth';
;

export default function Home() {
  const router = useRouter();
  const [redirect, setRedirect] = useState<string>('/');

  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get('redirect');
      if (r) setRedirect(r);
    } catch {}
  }, []);

  return (
    <Login onSuccess={() => {
      try {
        const r = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
        if (r && /^https?:\/\//i.test(r)) {
          window.location.href = r
          return
        }
        if (r) {
          router.replace(r)
          return
        }
        // No redirect param: send to default dashboard based on role
        const token = typeof document !== 'undefined'
          ? document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1]
          : undefined
        const decoded = token ? decodeJWT(token) : null
        const role = decoded?.role
        const companyProfileId = (decoded as any)?.companyProfileId as string | undefined
        const roleToBaseRoute: Record<string, string> = {
          'ROLE_SUB_CURRICULUM_ADMIN': 'sub-curriculum-admin',
          'ROLE_CURRICULUM_ADMIN': 'curriculum-admin',
          'ROLE_CONTENT_DEVELOPER': 'content-developer',
          'ROLE_PROJECT_MANAGER': 'project-manager',
          'ROLE_TRAINING_ADMIN': 'training-admin',
          'ROLE_TRAINER_ADMIN': 'trainer-admin',
          'ROLE_TRAINER': 'trainer',
          'ROLE_ME_EXPERT': 'me-expert',
        }
        if (role === 'ROLE_ICOG_ADMIN') {
          router.replace('/dashboard')
          return
        }
        if (role === 'ROLE_COMPANY_ADMIN' && companyProfileId) {
          router.replace(`/${companyProfileId}/dashboard`)
          return
        }
        const base = role ? roleToBaseRoute[role] : undefined
        router.replace(base ? `/${base}/dashboard` : '/')
      } catch {
        router.replace('/')
      }
    }} />
  );
}

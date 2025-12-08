/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJWT, isTokenExpired } from "@curriculum-services/auth";

function buildLoginRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  const redirect = encodeURIComponent(url.pathname + (url.search || ""));
  url.pathname = "/";
  url.search = `?redirect=${redirect}`;
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  // console.log('Middleware running for path:', req.nextUrl.pathname);
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  // console.log('Middleware: Path:', pathname);
  // console.log('Middleware: Cookies found:', cookies.map(c => c.name).join(', '));
  // console.log('Token present:', !!token);

  // Allow access to unauthorized page
  if (pathname === '/unauthorized') {
    return NextResponse.next();
  }

  // If no token, redirect to root login with return url
  if (!token) {
    return pathname === '/'
      ? NextResponse.next()
      : buildLoginRedirect(req);
  }

  try {
    const decoded = decodeJWT(token);

    // If token is invalid or expired, redirect to login with return url (do not delete cookies here)
    if (!decoded || isTokenExpired(decoded)) {
      return buildLoginRedirect(req);
    }

    // Add the user info to request headers for server components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', decoded.sub);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);

    // Define curriculum-related roles
    const curriculumRoles = [
      'ROLE_SUB_CURRICULUM_ADMIN',
      'ROLE_CURRICULUM_ADMIN',
      'ROLE_CONTENT_DEVELOPER',
      'ROLE_PROJECT_MANAGER',
      'ROLE_TRAINING_ADMIN',
      'ROLE_TRAINER_ADMIN',
      'ROLE_TRAINER',
      'ROLE_ME_EXPERT'
    ];

    // Handle curriculum-related roles
    if (decoded.role && curriculumRoles.includes(decoded.role)) {
      // If at root, redirect to appropriate dashboard
      if (pathname === '/') {
        const baseRoute = getRoleBaseRoute(decoded.role);
        return NextResponse.redirect(new URL(`/${baseRoute}/dashboard`, req.url), {
          headers: requestHeaders
        });
      }

      // Check if trying to access allowed routes
      const baseRoute = getRoleBaseRoute(decoded.role);
      const allowedPaths = [
        `/${baseRoute}/training`,
        `/${baseRoute}/dashboard`,
        `/${baseRoute}/settings`,
        `/${baseRoute}/trainers`,
        `/${baseRoute}/trainers/add`,
        `/${baseRoute}/create-jobs`,
        `/${baseRoute}/job`,
        `/${baseRoute}/jobs/applications`,
        `/${baseRoute}/jobs/applicants`,
        `/${baseRoute}/venue`,
        `/${baseRoute}/venues`,
        `/${baseRoute}/venue/add`,
        `/${baseRoute}/training`,
      ];

      // Allow access to training routes and their nested routes
      if (pathname.startsWith(`/${baseRoute}/training`) || pathname.includes('/training')) {
        return NextResponse.next({
          request: { headers: requestHeaders }
        });
      }

      // Allow access to jobs routes and their nested routes
      if (pathname.startsWith(`/${baseRoute}/jobs`)) {
        return NextResponse.next({
          request: { headers: requestHeaders }
        });
      }

      // Check if current path is in allowed paths
      if (allowedPaths.includes(pathname)) {
        return NextResponse.next({
          request: { headers: requestHeaders }
        });
      }

      // Redirect to unauthorized for any other routes
      return NextResponse.redirect(new URL('/unauthorized', req.url), {
        headers: requestHeaders
      });
    }

    // ICOG_ADMIN route restrictions
    if (decoded.role === 'ROLE_ICOG_ADMIN') {
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url), {
          headers: requestHeaders
        });
      }
      
      // Allow access to ICOG admin routes
      const icogAdminRoutes = [
        '/dashboard',
        '/users',
        '/trainings',
        '/basedata',
        '/settings'
      ];
      
      // Check if accessing an allowed ICOG admin route or its sub-routes
      const isIcogAdminRoute = icogAdminRoutes.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      if (isIcogAdminRoute) {
        return NextResponse.next({
          request: { headers: requestHeaders }
        });
      }
      
      // Prevent access to company-specific routes (routes with IDs like /companyId/something)
      if (pathname.match(/\/[a-f0-9-]{36}\//) || pathname.match(/^\/[a-zA-Z0-9-]+\/[a-zA-Z-]+$/)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url), {
          headers: requestHeaders
        });
      }
      
      return NextResponse.next({
        request: { headers: requestHeaders }
      });
    }

    // COMPANY_ADMIN route restrictions
    if (decoded.role === 'ROLE_COMPANY_ADMIN') {
      // Get company info from cookies for newly created profiles
      const companyInfo = req.cookies.get('company_info')?.value;
      const companyData = companyInfo ? JSON.parse(companyInfo) : null;
      const profileId = decoded.companyProfileId ?? companyData?.id;

      // If no profile information yet, gate everything to company-profile
      if (!decoded.isProfileFilled || !profileId) {
        if (pathname !== '/company-profile') {
          return NextResponse.redirect(new URL('/company-profile', req.url), {
            headers: requestHeaders,
          });
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
      }

      // If at root, send to company dashboard
      if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${profileId}/dashboard`, req.url), {
          headers: requestHeaders,
        });
      }

      // Allow any route under the company scope
      const isCompanyScoped = pathname.startsWith(`/${profileId}/`);
      if (isCompanyScoped) {
        return NextResponse.next({ request: { headers: requestHeaders } });
      }

      // For non-company scoped paths (e.g., other role routes), redirect to company dashboard rather than unauthorized
      const redirectUrl = new URL(`/${profileId}/dashboard`, req.url);
      return NextResponse.redirect(redirectUrl, { headers: requestHeaders });
    }

    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  } catch (error) {
    console.log('Error in middleware:', error);
    // If there's an error processing the token, redirect to login
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('token');
    response.cookies.delete('company_info');
    return response;
  }
}

// Helper function to get base route based on role
// ... existing code ...

// Define curriculum-related roles


// Helper function to get base route based on role
function getRoleBaseRoute(role: string): string {
  switch (role) {
    case 'ROLE_SUB_CURRICULUM_ADMIN':
      return 'sub-curriculum-admin';
    case 'ROLE_CURRICULUM_ADMIN':
      return 'curriculum-admin';
    case 'ROLE_CONTENT_DEVELOPER':
      return 'content-developer';
    case 'ROLE_PROJECT_MANAGER':
      return 'project-manager';
    case 'ROLE_TRAINING_ADMIN':
      return 'training-admin';
    case 'ROLE_TRAINER_ADMIN':
      return 'trainer-admin';
    case 'ROLE_TRAINER':
      return 'trainer';
    case 'ROLE_ME_EXPERT':
      return 'me-expert';
    default:
      return 'unauthorized';
  }
}


// Add global axios interceptor to handle 401s
if (typeof window !== 'undefined') {
  const axios = require('axios').default;
  
  axios.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 401) {
        // Clear auth data
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'company_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to login
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next/.*|public/|unauthorized|settings|forgotPassword |certificate).*)'
  ],
};
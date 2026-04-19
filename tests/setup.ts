import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

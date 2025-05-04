import { ReactNode } from 'react';

declare module 'next' {
  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
    children?: ReactNode;
  }
}

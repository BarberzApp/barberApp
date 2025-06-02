declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    viewport?: {
      width?: string;
      initialScale?: number;
      maximumScale?: number;
      userScalable?: boolean;
    };
    themeColor?: string;
  }

  export interface Viewport {
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
  }
}

declare module 'next/navigation' {
  export function useParams<T extends Record<string, string | string[]>>(): T;
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
  };
}

declare module 'next/server' {
  export class NextRequest extends Request {
    constructor(input: RequestInfo | URL, init?: RequestInit);
    nextUrl: URL;
  }

  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: ResponseInit): NextResponse;
    static next(): NextResponse;
  }
}

declare module 'next/headers' {
  export function headers(): Headers;
  export function cookies(): {
    get(name: string): { value: string } | undefined;
    getAll(): { name: string; value: string }[];
  };
}

declare module 'next/link' {
  import { ComponentProps, ReactNode } from 'react';
  
  interface LinkProps extends ComponentProps<'a'> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    children: ReactNode;
  }
  
  export default function Link(props: LinkProps): JSX.Element;
}

declare module 'next/font/google' {
  export interface FontOptions {
    subsets?: string[];
    display?: string;
    weight?: string | string[];
    style?: string | string[];
    variable?: string;
  }

  export function Inter(options?: FontOptions): {
    className: string;
    style: { fontFamily: string };
  };
} 
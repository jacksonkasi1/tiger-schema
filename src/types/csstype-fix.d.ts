// Fix csstype version conflicts between React 19 and Radix UI
// This file ensures consistent CSSProperties types across the codebase

import 'csstype';

declare module 'csstype' {
  interface Properties {
    // Allow CSS custom properties (CSS variables)
    [index: `--${string}`]: string | number | undefined;
  }
}

// Augment React's CSSProperties to be compatible with Radix UI's expectations
declare module 'react' {
  interface CSSProperties {
    [index: `--${string}`]: string | number | undefined;
  }
}

export {};

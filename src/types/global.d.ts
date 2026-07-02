import type { HiveKeychain } from '@/lib/hive/keychain'

declare global {
  interface Window {
    hive_keychain?: HiveKeychain
  }
}
import 'react';

declare module 'react' {
  interface CSSProperties {
    /**
     * Specifies the shape of the corners of an element.
     * @see https://csswg.org
     */
    cornerShape?: 'bevel' | 'scoop' | 'notch' | 'round' | string;
    /** Vendor prefix support if needed */
    WebkitCornerShape?: 'bevel' | 'scoop' | 'notch' | 'round' | string;
  }
}
export {}

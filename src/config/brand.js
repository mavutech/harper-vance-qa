/** Public identity and artwork URLs from the backend's generated brand source. */
import {brand} from './brand.generated';
import integrity from './brand.integrity.generated.json';

export {brand as BRAND, brandCopy, brandText} from './brand.generated';

/** Content fingerprints prevent browsers from reusing artwork from an older release. */
export const BRAND_LOGOS = Object.freeze({
  light: brand.assets.wordmarkLightUrl || `/brand/wordmark.svg?v=${integrity['public/brand/wordmark.svg']}`,
  dark: brand.assets.wordmarkDarkUrl || `/brand/wordmark-dark.svg?v=${integrity['public/brand/wordmark-dark.svg']}`,
});

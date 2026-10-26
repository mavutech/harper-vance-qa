import {brandCopy, BRAND} from "./brand";
// SEO Configuration - Single Source of Truth
// Update all SEO-related content from this file

export const SEO_CONFIG = brandCopy({
  // Company Information
  company: {
    name: "{brand.fullName}",
    shortName: "{brand.shortName}",
    tagline: "Reviewable NQ Market Intelligence",
    description: "Approval-only intraday NQ market intelligence with retained daily, weekly, and historical records for professional trading organizations.",
    website: "{brand.websiteUrl}",
    themeColor: BRAND.colors.accent
  },

  // Default SEO Meta Tags
  default: {
    title: "{brand.fullName} - Reviewable NQ Market Intelligence",
    description: "Approval-only intraday NQ market intelligence with retained daily, weekly, and historical records for professional trading organizations.",
    keywords: "NQ market intelligence, intraday NQ targets, target resolution, completed-session records, professional trading organizations, {brand.fullName}",
    author: "{brand.fullName}"
  },

  // Page-specific SEO configurations
  pages: {
    landing: {
      title: "Evaluate NQ Target Research",
      description: "Follow real-time intraday NQ targets and their daily, weekly, and historical statistics in a secure dashboard. Receive a daily target report by email.",
      keywords: "intraday NQ targets, futures market intelligence, institutional trading research, target validation, market oversight"
    },
    terms: {
      title: "Terms of Service",
      description: "Review the proposed {brand.fullName} Terms of Service for approved business customers.",
      keywords: "{brand.fullName} terms, market intelligence terms, enterprise service terms"
    },
    privacy: {
      title: "Privacy Policy",
      description: "Review how Mavu Technology Holdings handles personal information through {brand.fullName}.",
      keywords: "{brand.fullName} privacy, Mavu Technology Holdings privacy, enterprise data privacy"
    },
    notFound: {
      title: "Page Not Found",
      description: "The requested {brand.fullName} page is not available.",
      keywords: "{brand.fullName} page not found",
      robots: "noindex, nofollow"
    },
    signin: {
      title: "Sign In",
      description: "Sign in to the {brand.fullName} client dashboard for licensed NQ market-intelligence records.",
      keywords: "{brand.fullName} client login, NQ market intelligence dashboard, licensed market records"
    },
    forgotPassword: {
      title: "Reset Password",
      description: "Reset your {brand.fullName} client account password and return to the licensed market-intelligence dashboard.",
      keywords: "{brand.fullName} password reset, account recovery, secure client login"
    },
    dashboard: {
      title: "NQ Market Intelligence Dashboard",
      description: "Review licensed current-session NQ target intelligence, completed-session records, weekly summaries, and retained history.",
      keywords: "NQ market intelligence dashboard, target resolution records, weekly NQ summary, licensed history"
    },
    events: {
      title: "Event Management",
      description: "Review market-calendar events and session context used to interpret {brand.fullName} records.",
      keywords: "NQ market calendar, session context, market events, completed-session analysis"
    },
    liveTargets: {
      title: "{brand.shortName} Today's Targets",
      description: "Review current-session NQ targets with original issue details, context, and recorded resolution status.",
      keywords: "current-session NQ targets, NQ target intelligence, target resolution status"
    },
    dailyReport: {
      title: "{brand.shortName} Daily Target Performance",
      description: "Review the completed-session NQ target log, direction split, time to resolution, retraction, and sample-aware observations.",
      keywords: "NQ completed-session record, target resolution time, NQ retraction, daily target log"
    },
    targetHistory: {
      title: "{brand.shortName} Historical Performance",
      description: "Compare rolling NQ target-resolution observations and day-by-day records across licensed history.",
      keywords: "NQ historical observations, rolling target resolution, licensed NQ history"
    },
    weeklyReport: {
      title: "{brand.shortName} Weekly Summary",
      description: "Review weekly NQ target outcomes, timing, retraction patterns, daily variation, and sample-aware comparisons.",
      keywords: "NQ weekly summary, weekly target outcomes, NQ retraction patterns, sample-aware comparison"
    }
  },

  // Social Media / Open Graph configurations
  openGraph: {
    type: "website",
    siteName: "{brand.fullName}"
  },

  // Twitter Card configurations
  twitter: {
    card: "summary_large_image"
  }
});

// Helper function to generate full page title
export const generatePageTitle = (pageKey) => {
  const pageConfig = SEO_CONFIG.pages[pageKey];
  if (!pageConfig) {
    return SEO_CONFIG.default.title;
  }

  return `${pageConfig.title} - ${SEO_CONFIG.company.name} | ${SEO_CONFIG.company.tagline}`;
};

// Helper function to get page description
export const getPageDescription = (pageKey) => {
  const pageConfig = SEO_CONFIG.pages[pageKey];
  return pageConfig ? pageConfig.description : SEO_CONFIG.default.description;
};

// Helper function to get page keywords
export const getPageKeywords = (pageKey) => {
  const pageConfig = SEO_CONFIG.pages[pageKey];
  const defaultKeywords = SEO_CONFIG.default.keywords;
  const pageKeywords = pageConfig ? pageConfig.keywords : '';

  return pageKeywords ? `${pageKeywords}, ${defaultKeywords}` : defaultKeywords;
};

// Helper function to update document meta tags
export const updatePageSEO = (pageKey) => {
  // Update title
  document.title = generatePageTitle(pageKey);

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', getPageDescription(pageKey));
  }

  // Update meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', getPageKeywords(pageKey));

  // Keep unknown routes out of search results and restore normal indexing elsewhere.
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) {
    robots.setAttribute('content', SEO_CONFIG.pages[pageKey]?.robots || 'index, follow');
  }

  // Update Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', generatePageTitle(pageKey));
  }

  // Update Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', getPageDescription(pageKey));
  }

  // Update Twitter title
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', generatePageTitle(pageKey));
  }

  // Update Twitter description
  const twitterDescription = document.querySelector('meta[property="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', getPageDescription(pageKey));
  }
};

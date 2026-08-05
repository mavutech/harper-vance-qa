// SEO Configuration - Single Source of Truth
// Update all SEO-related content from this file

export const SEO_CONFIG = {
  // Company Information
  company: {
    name: "Harper Vance Quantitative Analysis",
    shortName: "Harper Vance QA",
    tagline: "High Value Futures Targets & Stats",
    description: "Premium futures trading signals, statistical analysis, and high-value market insights for hedge funds and trading firms.",
    website: "https://harpervanceqa.com",
    themeColor: "#6366f1"
  },

  // Default SEO Meta Tags
  default: {
    title: "Harper Vance Quantitative Analysis - High Value Futures Targets & Stats",
    description: "Premium futures trading signals, statistical analysis, and high-value market insights for hedge funds and trading firms",
    keywords: "futures trading, quantitative analysis, trading signals, market statistics, financial analysis, investment insights, Harper Vance",
    author: "Harper Vance Quantitative Analysis"
  },

  // Page-specific SEO configurations
  pages: {
    login: {
      title: "Sign In",
      description: "Sign in to Harper Vance Quantitative Analysis platform for premium futures trading signals, statistical analysis, and high-value market insights.",
      keywords: "sign in, login, Harper Vance, futures trading platform, trading signals access, quant trading"
    },
    forgotPassword: {
      title: "Reset Password",
      description: "Reset your Harper Vance Quantitative Analysis account password securely. Get back to accessing premium futures trading signals and market analysis.",
      keywords: "password reset, account recovery, Harper Vance, secure login, trading platform access"
    },
    dashboard: {
      title: "Finance Monitoring Dashboard",
      description: "Advanced finance monitoring dashboard with real-time trading analytics, profit margins, and quantitative analysis for professional futures trading.",
      keywords: "finance dashboard, trading analytics, profit monitoring, quantitative analysis, futures trading dashboard"
    },
    events: {
      title: "Event Management",
      description: "Manage and track important market events, trading signals, and financial calendar events for optimal trading decisions.",
      keywords: "event management, market events, trading calendar, financial events, market analysis"
    },
    sonaTargets: {
      title: "SONA Today's Targets",
      description: "Real-time live feed of today's NQ futures SONA targets, session accuracy, and hit status.",
      keywords: "SONA live targets, NQ futures today, real-time targets, target hit, session accuracy"
    },
    sonaDaily: {
      title: "SONA Daily Target Performance",
      description: "Per-target resolution log, direction split, time-to-resolution distribution, and session period accuracy for NQ futures SONA signals.",
      keywords: "SONA daily stats, NQ futures targets, target accuracy, resolution time, engulfing candle stats"
    },
    sonaHistory: {
      title: "SONA Historical Performance",
      description: "Rolling 5-day and 20-day accuracy, win/loss streak, and daily breakdown for NQ futures SONA target signals.",
      keywords: "SONA rolling accuracy, historical performance, NQ futures, target streak, daily accuracy trend"
    },
    sonaWeekly: {
      title: "SONA Weekly Summary",
      description: "Weekly aggregate target accuracy, direction breakdown, and day-by-day performance for NQ futures SONA signals.",
      keywords: "SONA weekly stats, NQ futures weekly, target accuracy weekly, trading week summary"
    }
  },

  // Social Media / Open Graph configurations
  openGraph: {
    type: "website",
    siteName: "Harper Vance Quantitative Analysis"
  },

  // Twitter Card configurations
  twitter: {
    card: "summary_large_image"
  }
};

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

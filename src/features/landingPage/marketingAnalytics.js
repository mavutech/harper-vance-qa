/** Privacy-safe marketing funnel event names. */
export const MARKETING_EVENTS = Object.freeze({
  homeViewed: "marketing_home_viewed",
  reportFormatOpened: "marketing_report_format_opened",
  sampleReportOpened: "marketing_sample_report_opened",
  faqOpened: "marketing_faq_opened",
  planViewed: "marketing_plan_viewed",
  requestAccessClicked: "marketing_request_access_clicked",
  clientLoginClicked: "marketing_client_login_clicked",
  reportRequestClicked: "marketing_report_request_clicked",
  reportRequestStarted: "marketing_report_request_started",
  reportRequestSubmitted: "marketing_report_request_submitted",
  reportRequestValidationFailed: "marketing_report_request_validation_failed",
  reportRequestFailed: "marketing_report_request_failed"
});

/** Approved placement values. These values never contain visitor data. */
export const MARKETING_PLACEMENTS = Object.freeze({
  header: "header",
  mobile: "mobile_navigation",
  hero: "hero",
  evidence: "evidence",
  pricing: "pricing",
  footer: "footer"
});

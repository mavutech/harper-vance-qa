import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import messages from "../locales/en.json";
import { MARKETING_EVENTS } from "../marketingAnalytics";

/**
 * Explains observation limits and the questions a professional buyer can inspect.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onTrack - Centralized privacy-safe event recorder.
 * @returns {React.ReactElement} Buyer FAQ and verified operator identity.
 */
export default function BuyerQuestions({ onTrack }) {
  return (
    <section className="section buyer-questions" id="questions">
      <div className="shell">
        <p className="eyebrow dark">{messages.faq.eyebrow}</p>
        <h2>{messages.faq.title}</h2>
        <div className="faq-list">
          {messages.faq.items.map((item) => (
            <details key={item.id} onToggle={(event) => {
              if (event.currentTarget.open) onTrack(MARKETING_EVENTS.faqOpened, { question: item.id });
            }}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="company-note">{messages.faq.company}</p>
        <Link to={ROUTES.terms}>{messages.footer.terms}</Link>
      </div>
    </section>
  );
}

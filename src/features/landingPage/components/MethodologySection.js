import React from "react";
import messages from "../locales/en.json";

/**
 * Describes what the recorded observations mean and their limitations.
 *
 * @returns {React.ReactElement} Plain-language methodology section.
 */
export default function MethodologySection() {
  return (
    <section className="section methodology-section" id="methodology">
      <div className="shell">
        <p className="eyebrow dark">{messages.methodology.eyebrow}</p>
        <h2>{messages.methodology.title}</h2>
        <div className="methodology-grid">
          {messages.methodology.items.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p className="methodology-boundary">{messages.methodology.boundary}</p>
      </div>
    </section>
  );
}

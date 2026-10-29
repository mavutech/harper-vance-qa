import React from "react";
import copy from "../locales/delivery.en.json";

/** Explains verified delivery channels without extending plan entitlements.
 * @returns {React.ReactElement} Accessible delivery comparison. */
export default function DeliveryOverview() {
  return <div className="shell delivery-overview">
    <h3>{copy.title}</h3>
    <div className="delivery-table-wrap" role="region" aria-label={copy.title} tabIndex={0}>
      <table>
        <caption>{copy.caption}</caption>
        <thead><tr>{copy.headers.map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{copy.rows.map((row) => <tr key={row.channel}>
          <th scope="row">{row.channel}</th><td>{row.content}</td><td>{row.access}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p>{copy.timing}</p>
  </div>;
}

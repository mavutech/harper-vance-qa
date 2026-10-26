import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ROLLING_COPY as C } from '../utils/rollingCopy';
import { formatRate } from '../utils/rollingPresentation';

/** Keeps each expected session visible with mobile-friendly expandable details. */
export default function DailyBreakdownTable({ days }) {
  return <Card className="card-one mb-3"><Card.Body className="p-3">
    <h5>{C.breakdown}</h5>
    <table className="table mb-0 fs-sm" aria-label={C.breakdown}>
      <thead><tr><th>{C.date}</th><th>{C.outcome}</th><th>{C.accuracy}</th></tr></thead>
      <tbody>{[...days].reverse().map((day) => <tr key={day.date}>
        <td><time dateTime={day.date}>{day.date.slice(5).replace('-', '/')}</time>
          <details className="mt-1"><summary className="text-primary">{C.details}</summary>
            <div className="py-2"><div>{day.date}</div><div>{C.status[day.status]}</div>
              {day.directions && <>
                <div>{C.medianTime}: {day.medianTime === null ? C.na : `${day.medianTime} min`}</div>
                <div>{C.measured}: {day.timingSamples}</div>
                {['bullish', 'bearish'].map((key) => <div key={key}>{C[key]}: {formatRate(day.directions[key].accuracy)} ({day.directions[key].hits}/{day.directions[key].created})</div>)}
                <Link to={`/dashboard/sona-daily?date=${day.date}`}>{C.open}</Link>
              </>}
            </div>
          </details>
        </td>
        <td>{day.created === undefined ? C.status[day.status] : `${day.hits} / ${day.created}`}</td>
        <td>{formatRate(day.accuracy)}</td>
      </tr>)}</tbody>
    </table>
  </Card.Body></Card>;
}

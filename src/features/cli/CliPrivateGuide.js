/** @fileoverview Authenticated, tier-gated client guide; no full guide is shipped in public bundles. */
import React, {useEffect, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {useAccess} from '../access';
import client from '../../api/client';
import {GuideLayout} from './CliGuide';
import copy from './copy.json';

/** Fetches customer instructions only after the server verifies authentication and CLI eligibility.
 * @returns {React.ReactElement} Protected client documentation.
 */
export default function CliPrivateGuide() {
  const {slug = 'overview'} = useParams();
  const {organization} = useAccess(); const [params] = useSearchParams(); const orgId = params.get('organization') || organization?.orgId;
  const [guide, setGuide] = useState(null); const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setGuide(null); setError(false);
    client.get('/api/cli/docs', {headers: orgId ? {'X-Organization-Id':orgId} : {}, signal:controller.signal})
      .then(data => {if (!controller.signal.aborted) setGuide({...data,orgId});})
      .catch(() => {if (!controller.signal.aborted) setError(true);});
    return () => controller.abort();
  }, [orgId]);
  if (error) return <main className="main p-4"><p role="alert">{copy.error}</p><Link to="/dashboard/cli">{copy.setup}</Link></main>;
  if (!guide || guide.orgId !== orgId) return <main className="main p-4" role="status">{copy.loading}</main>;
  const download = (asset) => {
    const url=URL.createObjectURL(new Blob([JSON.stringify(asset.data,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=asset.filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <GuideLayout pages={guide.pages} slug={slug} basePath="/dashboard/cli/docs" organizationId={orgId} privateGuide>
    {slug==='postman' && <section id="collection-downloads"><h2>Collection downloads</h2>{guide.postman.map(asset=><button className="btn btn-outline-secondary d-block mb-2" key={asset.filename} onClick={()=>download(asset)}>{asset.filename}</button>)}</section>}
  </GuideLayout>;
}

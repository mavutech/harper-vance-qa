/** @fileoverview Organization-scoped, server-authorized CLI setup and downloads. */
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import Header from '../../layouts/Header';
import Footer from '../../layouts/Footer';
import client from '../../api/client';
import {useAccess} from '../access';
import copy from './copy.json';
import './cli.scss';

/** Displays the selected organization's current release; no credentials enter the DOM.
 * @returns {React.ReactElement} CLI dashboard setup.
 */
export default function CliSetup() {
  const {access, organization, loading: accessLoading, refreshAccess} = useAccess();
  const [selected, setSelected] = useState(''); const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(false); const [denied, setDenied] = useState(false); const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const orgId = selected || organization?.orgId || '';
  const org = access?.organizations?.find(item => item.orgId === orgId);
  const eligible = Boolean(org?.entitlementVersionId && org.features?.['cli.access'] === true);
  const current = eligible && release?.orgId === orgId ? release : null;
  const load = useCallback(async (signal) => {
    setRelease(null); setDenied(false); setError(false);
    if (!eligible || !orgId) return;
    setLoading(true);
    try {
      const result = await client.get('/api/cli/release', {headers: {'X-Organization-Id': orgId}, signal});
      if (!signal.aborted) setRelease({...result, orgId});
    } catch (err) {
      if (!signal.aborted) { setDenied([401,403].includes(err.status)); setError(![401,403].includes(err.status)); }
    } finally { if (!signal.aborted) setLoading(false); }
  }, [eligible, orgId]);
  useEffect(() => {
    const controller = new AbortController(); load(controller.signal);
    const refresh = () => load(controller.signal);
    const timer = setInterval(refresh, 30000); window.addEventListener('focus', refresh);
    return () => {controller.abort(); clearInterval(timer); window.removeEventListener('focus', refresh);};
  }, [load]);
  /** Downloads only after fresh server authorization; the server controls the archive.
   * @returns {Promise<void>} Download initiation.
   */
  async function download() {
    if (!current || downloading) return;
    setDownloading(true); setError(false);
    try {
      const bytes = await client.get('/api/cli/download', {headers: {'X-Organization-Id': orgId}, responseType: 'blob'});
      const url = URL.createObjectURL(bytes); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = current.filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setRelease(null); setDenied([401,403].includes(err.status)); setError(![401,403].includes(err.status));
    } finally {setDownloading(false);}
  }
  return <><Header/><main className="main main-app p-4"><div className="cli-setup mx-auto"><div className="d-flex justify-content-between align-items-center mb-4"><div><span className="cli-kicker">HARPER VANCE / WORKSPACE</span><h1 className="mt-2">{copy.title}</h1></div><Link to="/docs/cli" className="btn btn-outline-secondary">{copy.guide} ↗</Link></div>
    <p className="cli-intro">{copy.description}</p><p className="text-secondary mb-4">{copy.preview}</p>
    <label className="form-label" htmlFor="cli-organization">{copy.org}</label><select className="form-select mb-4" id="cli-organization" value={orgId} onChange={e=>{setRelease(null);setSelected(e.target.value);}}>{(access?.organizations || []).map(item=><option value={item.orgId} key={item.orgId}>{item.name}</option>)}</select>
    {(accessLoading || (eligible && loading && !denied)) && <p role="status">{copy.loading}</p>}
    {(!accessLoading && (!eligible || denied)) && <section className="cli-help mb-4"><h2 className="h4">{copy.restricted}</h2><p>{copy.restrictedBody}</p><a href="/pages/client-access" className="btn btn-primary">{copy.contact}</a></section>}
    {error && <p role="alert" className="alert alert-warning">{copy.error}</p>}
    {current && !denied && <><div className="d-flex align-items-center justify-content-between mb-3"><h2 className="h4 mb-0">{copy.install}</h2><span className="cli-status">CLI access enabled</span></div><div className="row g-4"><div className="col-lg-5"><section className="card h-100"><div className="card-body"><div className="cli-step">01 / INSTALL</div><h3 className="h5 mt-3">{copy.version} {current.version}</h3><p className="text-secondary">Node.js 22+ · macOS & Linux</p><button className="btn btn-primary my-2" disabled={downloading} onClick={download}>{downloading ? 'Preparing download…' : copy.download}</button><pre className="mt-3"><code>{`npm install -g ./${current.filename}\nsona --version`}</code></pre><p className="small mb-1">{copy.checksum}</p><p className="cli-digest">{current.sha256}</p><Link to="/docs/cli/getting-started">Installation, updates & removal →</Link></div></section></div><div className="col-lg-7"><section className="card h-100"><div className="card-body"><div className="cli-step">02 / CONNECT & EXPLORE</div><h3 className="h5 mt-3">{copy.commandsTitle}</h3><p className="text-secondary">Use the service address and public Firebase API key provided by your administrator. Sign in privately in your terminal.</p><pre><code>{`sona login\nsona daily --date 2026-11-23 --format json\nsona rolling --sessions 20\nsona watch --format json`}</code></pre><p className="small text-secondary">Dates are examples. Choose a permitted session; reporting dates use New York time.</p><Link to="/docs/cli/commands">Commands & required parameters →</Link><br/><Link to="/docs/cli/live-watch">Live events, reconnects & gaps →</Link></div></section></div></div></>}
    <section className="cli-help mt-4"><h2 className="h5">{copy.secure}</h2><p className="mb-2">{copy.secureBody}</p><Link to="/docs/cli/troubleshooting">Authentication & troubleshooting →</Link></section><button className="btn btn-link px-0 mt-3" onClick={refreshAccess}>{copy.refresh}</button>
    </div></main><Footer/></>;
}

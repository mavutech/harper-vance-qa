/** @fileoverview Public, safely rendered guide from maintained CLI Markdown. */
import React, {useEffect} from 'react';
import {Link, useParams} from 'react-router-dom';
import {BRAND_LOGOS} from '../../config/brand';
import pages from './docs.generated.json';
import copy from './copy.json';
import './cli.scss';

/** Resolves known guide links without rendering arbitrary HTML.
 * @param {string} href Markdown link destination.
 * @returns {string} Safe destination.
 */
function destination(href) {
  if (/^(https?:\/\/|#|\/(?!\/))/.test(href)) return href;
  const [file, fragment] = href.split('#');
  if (/^sona-cli\.[a-z_.]+\.json$/.test(file)) return '/docs/cli/assets/' + file;
  const page = pages.find(p => p.source === file || p.source === file.replace(/^(\.\.\/)+/, '').replace(/^\.\//, ''));
  if (page) return `/docs/cli/${page.slug}${fragment ? '#' + fragment : ''}`;
  if (file.startsWith('../')) return 'https://github.com/mavutech/golden-setups-sona-alerts/blob/main/docs/' + file.slice(3);
  return '/docs/cli';
}
/** Renders only code spans, bold text and safe links; source HTML remains escaped.
 * @param {string} text Markdown text.
 * @returns {React.ReactNode[]} Inline content.
 */
function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={destination(link[2])}>{link[1]}</a>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}
/** Converts bounded maintained Markdown to React elements without raw HTML.
 * @param {string} markdown Maintained source.
 * @returns {React.ReactNode[]} Safe content blocks.
 */
export function GuideBody({markdown}) {
  const lines = markdown.split('\n'); const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]; if (!line.trim()) continue;
    if (line.startsWith('```')) {
      const code = []; while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      blocks.push(<pre key={i}><code>{code.join('\n')}</code></pre>); continue;
    }
    if (line.startsWith('|')) {
      const rows = []; do { rows.push(lines[i].split('|').slice(1, -1).map(s => s.trim())); i++; } while (i < lines.length && lines[i].startsWith('|'));
      i--; blocks.push(<div className="cli-table" key={i}><table><thead><tr>{rows[0].map((v,j)=><th key={j}>{inline(v)}</th>)}</tr></thead><tbody>{rows.slice(2).map((row,j)=><tr key={j}>{row.map((v,k)=><td key={k}>{inline(v)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    const heading = line.match(/^(#{1,6}) (.*)$/);
    if (heading) {
      const H = `h${Math.min(heading[1].length + 1, 6)}`;
      blocks.push(<H key={i} id={heading[2].toLowerCase().replace(/[^a-z0-9 -]/g,'').replace(/ /g,'-')}>{inline(heading[2])}</H>); continue;
    }
    if (/^[-*] /.test(line)) { blocks.push(<ul key={i}><li>{inline(line.slice(2))}</li></ul>); continue; }
    blocks.push(<p key={i}>{inline(line)}</p>);
  }
  return blocks;
}
/** Renders direct-linkable guide and section navigation.
 * @returns {React.ReactElement} Public customer guide.
 */
export default function CliGuide() {
  const {slug = 'overview'} = useParams(); const page = pages.find(p => p.slug === slug);
  useEffect(() => { document.title = `${page?.title || 'Guide not found'} | Harper Vance`; window.scrollTo(0,0); }, [page]);
  return <div className="cli-guide"><header className="cli-guide-header"><Link to="/" aria-label={copy.back}><img src={BRAND_LOGOS.light} alt="Harper Vance" /></Link><Link to="/dashboard/cli">{copy.dashboard} <span aria-hidden="true">↗</span></Link></header>
    <div className="cli-guide-layout"><aside><span className="cli-kicker">DEVELOPER GUIDE</span><h2>{copy.title}</h2><nav aria-label={copy.guide}>{pages.map(p=><Link key={p.slug} aria-current={p===page?'page':undefined} to={`/docs/cli/${p.slug}`}>{p.title.replace(/^SONA CLI$/, 'Overview')}</Link>)}</nav><p>{copy.preview}</p></aside>
    <main><div className="cli-kicker">HARPER VANCE / DOCUMENTATION</div><h1>{page?.title || 'Guide not found'}</h1><p className="cli-lead">{copy.availability}</p>{page ? <GuideBody markdown={page.markdown.replace(/^# .*\n/, '')}/> : <Link to="/docs/cli">Return to the guide</Link>}<footer>Source: docs/cli/{page?.source} · CLI 0.1.0</footer></main></div></div>;
}

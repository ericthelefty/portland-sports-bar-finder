import { CHANGELOG } from '@/lib/changelog';
import { formatDate } from '@/lib/format';

export const metadata = { title: "What's new", description: 'Changes and new features on Oombar.' };

export default function Changelog() {
  return (
    <div className="prose">
      <h1 className="page-title">What's new</h1>
      <p className="lede">Changes and new features on Oombar, newest first.</p>
      <ol className="changelog" id="changelog">
        {CHANGELOG.map((e) => (
          <li key={e.date + e.title}>
            <time dateTime={e.date} className="mono small">
              {formatDate(e.date)}
            </time>
            <h2>{e.title}</h2>
            <ul>
              {e.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

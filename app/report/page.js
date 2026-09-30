import { getBarOptions } from '@/lib/data';
import { PACKAGE_KEYS } from '@/lib/constants';
import ReportForm from './ReportForm';
import { captchaSiteKey } from '@/lib/captcha';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Report a TV package' };

export default async function ReportPage({ searchParams }) {
  const sp = await searchParams;
  const bars = await getBarOptions();
  const barId = bars.some((b) => String(b.id) === sp?.bar) ? sp.bar : '';
  const pick = (v) => (typeof v === 'string' && PACKAGE_KEYS.includes(v) ? [v] : []);

  return (
    <>
      <h1 className="page-title">Report a TV package</h1>
      <p className="lede">
        Tell us which out-of-market packages a bar carries, or doesn't. We review every report before it appears on the
        site.
      </p>
      <ReportForm
        bars={bars.map((b) => ({ id: b.id, name: b.name, area: b.area }))}
        initial={{ barId, has: pick(sp?.has), not: pick(sp?.dispute) }}
        captchaSiteKey={captchaSiteKey()}
      />
    </>
  );
}

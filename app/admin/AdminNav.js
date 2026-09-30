import Link from 'next/link';

// Tabs shown at the top of every admin page.
export default function AdminNav({ current }) {
  const tabs = [
    { key: 'reports', href: '/admin', label: 'Review reports' },
    { key: 'bars', href: '/admin/bars', label: 'Manage bars' },
  ];
  return (
    <nav className="admin-tabs" aria-label="Admin">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={current === t.key ? 'page' : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

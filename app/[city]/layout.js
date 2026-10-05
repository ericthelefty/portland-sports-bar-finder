import { notFound } from 'next/navigation';
import { getCity } from '@/lib/cities';

// Every page under /pdx (and future cities) checks the city exists first.
export default async function CityLayout({ children, params }) {
  const { city } = await params;
  if (!getCity(city)) notFound();
  return children;
}

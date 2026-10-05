import { redirect } from 'next/navigation';
import { DEFAULT_CITY, cityPath } from '@/lib/cities';

// With one city, the home page goes straight to it. This becomes a city picker when a second city is added.
export default function Home() {
  redirect(cityPath(DEFAULT_CITY));
}

import Script from 'next/script';

// PostHog web analytics and session replay. Turned on by setting NEXT_PUBLIC_POSTHOG_KEY in Vercel.
// Traffic goes through this site's own /ingest address (see next.config.mjs) so ad blockers don't drop it.
export default function Analytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  const region = process.env.NEXT_PUBLIC_POSTHOG_REGION === 'eu' ? 'eu' : 'us';
  const config = {
    api_host: '/ingest',
    ui_host: `https://${region}.posthog.com`,
    // No cookies: an anonymous ID is kept in the browser's local storage instead.
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Recordings never show what people type (report notes, links, searches are hidden).
    session_recording: { maskAllInputs: true, maskTextSelector: '.ph-mask' },
  };
  const snippet = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);`;
  // The admin pages are never tracked or recorded.
  const init = `var c=${JSON.stringify(config)};c.before_send=function(e){return location.pathname.indexOf('/admin')===0?null:e};posthog.init(${JSON.stringify(key)},c);`;
  return (
    <Script id="posthog" strategy="afterInteractive">
      {snippet + init}
    </Script>
  );
}

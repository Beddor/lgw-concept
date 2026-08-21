/* ============================================================================
   THE LOOKING GLASS WARS — supplemental event tracking

   Covers the two things GA4 Enhanced Measurement does NOT catch on this site.
   Everything else (pageviews, scroll, outbound links) is left to Enhanced
   Measurement — duplicating it here would double-count.

   Both push GTM custom events. GA4 does NOT pick these up on its own: each
   needs a Custom Event trigger + GA4 Event tag in the container. (Verified
   empirically that the gtag ['event', ...] array form does nothing here —
   GTM owns the Google tag and ignores stray gtag commands on its dataLayer.)

   Consent Mode still applies at the tag, so nothing is stored pre-consent.

   Events pushed:
     inquiry_click · inquiry_type, page_name
     video_play    · video_title, video_id, video_provider, page_name
   ========================================================================== */
(function () {
  var dl = (window.dataLayer = window.dataLayer || []);
  var pageName = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');

  /* -- mailto: inquiry clicks -------------------------------------------
     Enhanced Measurement's outbound-click tracking ignores mailto, and
     these are the site's primary conversion (franchise inquiry + the
     footer address on every page).
  --------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    // Neither the address nor the link text is sent. Every mailto here
    // points at the same company mailbox, and the footer links use the
    // address itself as their label -- so both fields would put an email
    // string in analytics while adding no signal that inquiry_type does
    // not already carry.
    var href = a.getAttribute('href') || '';
    dl.push({
      event: 'inquiry_click',
      // the franchise CTA carries a ?subject=; the footer address does not
      inquiry_type: href.indexOf('subject=') > -1 ? 'franchise' : 'general',
      page_name: pageName
    });
  }, true);

  /* -- Video plays -------------------------------------------------------
     Enhanced Measurement scans for YouTube iframes at page load. These
     pages use a click-to-load facade, so no iframe exists during that scan
     and the video is never hooked — confirmed: with enablejsapi=1 alone,
     GA4 loaded no iframe_api and fired no video events.

     Driving the YouTube IFrame API from here was tried and rejected: by the
     time the API loads, the injected iframe has already finished loading,
     and the postMessage handshake then fails silently — the player object
     constructs but no onReady/onStateChange ever fires.

     The facade sets autoplay=1, so a click IS a play. That makes the click
     a reliable video_start signal. Trade-off: no progress/completion
     milestones. Getting those would mean loading iframe_api on every page
     view (a third-party request for every visitor, before consent) and
     taking over iframe creation from the page's own handler.
  --------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var facade = e.target.closest && e.target.closest('.ytfacade[data-yt]');
    if (!facade || facade.dataset.trackedPlay) return;
    facade.dataset.trackedPlay = '1';  // once per facade; the iframe takes over after
    var btn = facade.querySelector('.ytplay');
    var label = (btn && btn.getAttribute('aria-label')) || '';
    dl.push({
      event: 'video_play',
      video_title: label.replace(/^Play\s*[-–—]\s*/i, '').trim() || 'Untitled',
      video_id: facade.getAttribute('data-yt'),
      video_provider: 'youtube',
      page_name: pageName
    });
  }, true);
})();

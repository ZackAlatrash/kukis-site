/* Chapter links for the demo player.
 *
 * A separate file, not an inline <script>, because the site's CSP is
 * `script-src 'self'` and inline execution is blocked. That is the right
 * trade for a page about not tracking people, so the script moved rather
 * than the policy. It failed silently in production and worked in local
 * dev, because vite's dev server does not apply public/_headers.
 *
 * No timestamp goes in the URL: the page is linked from an app listing, and
 * a reviewer landing mid-film would be confusing.
 */
(function () {
  var video = document.getElementById("demo");
  if (!video) return;

  document.querySelectorAll(".chapters button").forEach(function (button) {
    button.addEventListener("click", function () {
      var at = Number(button.dataset.at);

      var seek = function () {
        video.currentTime = at;
        // A rejected play() is fine: some browsers require the gesture to
        // reach play() synchronously. The seek is what matters, and the
        // viewer still has the controls.
        var played = video.play();
        if (played && played.catch) played.catch(function () {});
      };

      // Seeking before metadata arrives is discarded silently.
      if (video.readyState >= 1) seek();
      else video.addEventListener("loadedmetadata", seek, { once: true });
    });
  });
})();

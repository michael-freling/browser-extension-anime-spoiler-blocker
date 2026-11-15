# Browser Extension Anime Spoiler Blocker

> [!WARNING]
> This is still under development and it's still experimental phase.

This is a browser extension to block spoilers for anime in some services.
There are a few features supported to block spoilers

1. Keep the history of the last episode of a season for each anime you watched
2. Block spoilers on YouTube videos according to your watch history

[![Watch the video](https://img.youtube.com/vi/4mhkCjqaki8/hqdefault.jpg)](https://www.youtube.com/embed/4mhkCjqaki8)

## Supported services

Currently, spoilers are blocked on YouTube only.
Currently, [Crunchyroll](https://www.crunchyroll.com/) and [HIDIVE](https://www.hidive.com/) are the only supported services to store a watch history on your chrome browser.

This service depends on [Jikan API](https://jikan.moe/) to collect keywords for each anime. Only anime titles are sent to Jikan.
Your watch history is stored in your browser. It's shared across your devices if you turn on your browser's sync.

## Development

There are 2 versions of published extensions
- production: Extensions to publish from web stores of each browser like Chrome. This release cannot be installed from the GitHub release page.
- staging: Extensions that can be installed from the GitHub release page and run them.

## Releasing

1. In a pull request, update the version in both `VERSION` and `package.json`.
2. When it's merged, CI creates the `v<VERSION>` tag and publishes a GitHub release with the extensions for Chrome and Edge.
   Versions with a suffix, like `1.2.3-rc1`, are published as pre-releases.
3. Upload the production zips to the Chrome Web Store and Edge Add-ons.

## Testing

```sh
pnpm test:coverage  # Unit tests, with at least 95% coverage
pnpm typecheck      # Type check
pnpm test:e2e       # Build the extension and run it in Chromium on a saved YouTube page
```

The e2e tests run offline: YouTube is served from `e2e/snapshots/youtube-search.html`.
To refresh the snapshot from YouTube, run `pnpm e2e:snapshot`.
Install Chromium for Playwright once with `pnpm exec playwright install chromium`.

See [docs/architecture.md](docs/architecture.md) for how the extension works.

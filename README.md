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

This service depends on [Jikan API](https://jikan.moe/) to collect keywords for each anime. The information is stored locally and it's not shared your browsers even if you opt in syncing extension data on Chrome.

## Development

There are 2 versions of published extensions
- production: Extensions to publish from web stores of each browser like Chrome. This release cannot be installed from the GitHub release page.
- staging: Extensions that can be installed from the GitHub release page and run them.

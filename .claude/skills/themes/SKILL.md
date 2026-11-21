---
name: themes
description: Pick one of 12 live ASCII wallpapers (Honu Lagoon, Cloud Drift, Moonlit, Clawd, Koi Pond, Jellyfish, Lantern Night, Fireflies, Neon Rain, Sakura Dusk, Snow Cabin, Star Voyage). Use when the user types /themes or asks for a theme or wallpaper.
---

# /themes

The wallpaper picker is the artifact at https://claude.ai/artifact/9DgZjmfH21XEXFyGn3FbdX (source: `index.html`,
`wallpapers.js` in this repo; scenes from 0toshigami/claude-desktop-themes, MIT).

When invoked:

1. If the user named a theme (args or message), match it to one of these ids and reply with the direct link, which
   opens that wallpaper: `https://claude.ai/artifact/9DgZjmfH21XEXFyGn3FbdX#<id>`.
   Ids: `honu-lagoon`, `cloud-drift`, `moonlit`, `clawd`, `koi-pond`, `jellyfish`, `lantern-night`, `fireflies`,
   `neon-rain`, `sakura-dusk`, `snow-cabin`, `star-voyage`. "Liquid Lagoon" means `honu-lagoon`.
2. Otherwise list the 12 names in one short line each and give the plain link.
3. Do not claim the wallpaper is applied to Claude's own window. This works as a page that opens in the Claude app
   and in a browser; the in-app wallpaper needs the Claude Desktop plugin (see `claude-desktop-themes/README.md`).
4. If the user wants a change to a wallpaper, edit `web-engine.js` or the vendored scenes, run
   `node tools/build.mjs`, and republish the artifact from `index.html` content (same URL).

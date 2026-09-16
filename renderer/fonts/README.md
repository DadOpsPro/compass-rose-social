# Bundled Reel typefaces

One face per Reel. Set `"font"` (or `"typeface"`) at the **timeline root**.
Production timelines must not set `text.font` per scene.

| id | File | License | Source |
|---|---|---|---|
| `montserrat` (default) | `montserrat/Montserrat-ExtraBold.ttf` | SIL OFL 1.1 | Already vendored (JulietaUla/Montserrat) |
| `bebas` | `bebas/BebasNeue-Regular.ttf` | SIL OFL 1.1 | [google/fonts ofl/bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue) |
| `oswald` | `oswald/Oswald-Bold.ttf` | SIL OFL 1.1 | [googlefonts/OswaldFont](https://github.com/googlefonts/OswaldFont) static Bold |
| `playfair` | `playfair/PlayfairDisplay-Bold.ttf` | SIL OFL 1.1 | Fontsource latin Bold (Playfair Display); OFL from [google/fonts ofl/playfairdisplay](https://github.com/google/fonts/tree/main/ofl/playfairdisplay) |
| `poppins` | `poppins/Poppins-Bold.ttf` | SIL OFL 1.1 | [google/fonts ofl/poppins](https://github.com/google/fonts/tree/main/ofl/poppins) |
| `anton` | `anton/Anton-Regular.ttf` | SIL OFL 1.1 | [google/fonts ofl/anton](https://github.com/google/fonts/tree/main/ofl/anton) |

Each preset directory contains the TTF/OTF and `OFL.txt`. No paid fonts.

```bash
npm run fonts
```

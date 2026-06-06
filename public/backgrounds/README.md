# Screen-Hintergrundbilder

Hier liegen die optionalen, dezent ausgeblassten Hintergrundbilder für die
Screens **Camp**, **Forge** und **Box**.

## So fügst du Bilder hinzu

Lege genau diese drei Dateien in diesen Ordner (`public/backgrounds/`):

| Datei         | Screen | Empfohlenes Motiv                                        |
| ------------- | ------ | -------------------------------------------------------- |
| `camp.webp`   | Camp   | Lagerplatz / Astera / Ancient-Forest-Panorama, Zelt      |
| `forge.webp`  | Forge  | Schmiede, Amboss, der Wyverianer-Schmied, glühendes Erz  |
| `box.webp`    | Box    | Item-Box / Vorratslager / Wildspire-Waste-Wüstenpanorama |

Die App lädt sie automatisch über `/backgrounds/<name>.webp`. **Fehlt eine
Datei, passiert nichts** – der Screen bleibt normal nutzbar (kein kaputtes
Bild), weil es sich um ein CSS-Hintergrundbild handelt.

> Anderer Dateiname oder Format gewünscht? Dann den Pfad im jeweiligen Screen
> anpassen: `src="/backgrounds/camp.webp"` in `src/screens/Camp.tsx` bzw. das
> `background="…"`-Prop von `<Screen>` in `Forge.tsx` / `Inventory.tsx`.

## ⚠️ Urheberrecht

Offizielle Monster-Hunter-World-Artworks gehören **CAPCOM / Steamforged**.
Für eine **rein private** Nutzung (lokal, nur für deine Gruppe) ist das
unproblematisch. Sobald die PWA **öffentlich gehostet** wird (z. B. Vercel),
ist geschütztes Material rechtlich heikel – nutze dann lieber lizenzfreie
CC0-Naturfotos (Dschungel / Wüste passen farblich zu Ancient Forest &
Wildspire Waste). Diese Bilddateien sind bewusst **nicht** im Repo eingecheckt.

## Wo finde ich passende Bilder

Offizielle / Spiel-Quellen:

- Steamforged „Free Resource Vault“ (Brettspiel-Material):
  https://steamforged.com/collections/monster-hunter-world-free-resource-vault
- Steamforged Produktseiten Ancient Forest / Wildspire Waste (Promo-Art):
  https://steamforged.com/pages/monster-hunter-world-board-game
- Environment-/Concept-Art auf ArtStation (z. B. Wildspire Waste, Marthe
  Jonkers): https://www.artstation.com/artwork/XJxZbL

Wallpaper-Sammlungen (Game-Screenshots, urheberrechtlich geschützt):

- https://alphacoders.com/monster-hunter-world-wallpapers
- https://wallpapercave.com/monster-hunter-world-hd-wallpapers
- https://wallpaperflare.com/search?wallpaper=Monster+Hunter:+World

Lizenzfreie CC0-Alternativen (sicher auch öffentlich):

- Dschungel/Regenwald (Camp/Forge): https://unsplash.com/s/photos/jungle-landscape
- Wüste (Box): https://www.pexels.com/search/desert/
- https://opengameart.org/content/cc0-backgrounds

## Bilder aufbereiten (empfohlen)

Die Optik (Ausblassen, Warm-Tönung, Verlauf nach unten) macht bereits das CSS
(`.screen-bg` in `src/index.css`). Du musst die Bilder also **nicht** vorab
einfärben – nur größentechnisch optimieren:

1. Hochkant zuschneiden, ca. **1080 × 1920 px** (Mobile-First, Portrait).
2. Als **WebP** exportieren, Qualität ~70 %. Ziel: **< 200 KB** pro Bild.
3. Motiv mittig/oben halten – der untere Rand wird ohnehin ausgeblendet.

Beispiel mit ImageMagick / cwebp:

```bash
# auf 1080px Breite skalieren und als WebP mit Q70 speichern
cwebp -q 70 -resize 1080 0 camp-original.jpg -o camp.webp
```

## Feintuning

- Gesamtstärke: CSS-Variable `--screen-bg-opacity` (Standard `0.14`) in
  `src/index.css` – höher = kräftiger.
- Tönung/Verlauf: ebenfalls in der `.screen-bg`-Regel
  (`filter: sepia(...)`, `mask-image: linear-gradient(...)`).

> Hinweis: Die App ist online-gated (Sync nötig), daher werden die Bilder
> immer online geladen; sie sind bewusst nicht im PWA-Precache, um die
> Installationsgröße klein zu halten.

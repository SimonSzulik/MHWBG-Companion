# Screen-Hintergrundbilder

Ausgeblasste Hintergründe für die Screens **Camp**, **Forge** und **Box**.
Die Optik (Ausblassen auf ~40 %, leichte Warm-Tönung, Verlauf nach unten)
macht das CSS (`.screen-bg` in `src/index.css`) — die Bilder selbst müssen
also nicht vorbearbeitet werden.

## Mitgelieferte Standard-Bilder

Als Standard liegen hier handgezeichnete **SVG-Szenen** im Farbschema der App:

| Datei        | Screen | Motiv                                   |
| ------------ | ------ | --------------------------------------- |
| `camp.svg`   | Camp   | Ancient-Forest-Lager (Baum, Zelt, Feuer)|
| `forge.svg`  | Forge  | Schmiede (Esse, Amboss, Funken)         |
| `box.svg`    | Box    | Wildspire Waste (Dünen, Spires, Kaktus) |

Diese sind Eigen-Vektorgrafiken (kein Urheberrechtsproblem, winzig, im
PWA-Precache).

## Durch echte Monster-Hunter-Bilder ersetzen

Das Repo ist **privat**, für die private Nutzung ist offizielles MHW-Artwork
also unproblematisch.

**Camp und Forge sind bereits auf Fotos verdrahtet** – du musst nur die Datei
mit dem passenden Namen hier ablegen, kein Code nötig:

| Datei ablegen | übernimmt für | Fallback (bleibt) |
| ------------- | ------------- | ----------------- |
| `camp.jpg`    | Camp          | `camp.svg`        |
| `forge.jpg`   | Forge         | `forge.svg`       |

Solange die `*.jpg` fehlt, zeigt der Screen die Vektor-Szene; sobald die
`*.jpg` da ist, wird sie automatisch darüber gezeichnet (kein leerer Screen
in der Zwischenzeit). Für die Box analog `box.jpg` ablegen und in
`Inventory.tsx` `background="/backgrounds/box.jpg"` +
`backgroundFallback="/backgrounds/box.svg"` setzen.

> Dateiname muss exakt passen (`camp.jpg` / `forge.jpg`). Ein JPG eines
> Screenshots ist völlig ok; optional vorher verkleinern (s. u.). Für WebP/PNG
> einfach die Endung im jeweiligen Screen anpassen.

> Hinweis: In dieser Build-Umgebung war der Zugriff auf externe Bilder
> blockiert (Netzwerk nur zu GitHub erreichbar; eingefügte Bilder sind hier
> nicht als Datei verfügbar). Deshalb die SVG-Defaults — die echten Fotos
> legst du lokal/per GitHub-Upload ab und committest sie.

## Wo finde ich passende Bilder

Offiziell / Spiel:

- Steamforged „Free Resource Vault“:
  https://steamforged.com/collections/monster-hunter-world-free-resource-vault
- Brettspiel-Produktseiten (Promo-Art):
  https://steamforged.com/pages/monster-hunter-world-board-game
- Concept-Art auf ArtStation (z. B. Wildspire Waste):
  https://www.artstation.com/artwork/XJxZbL

Wallpaper-Sammlungen (Game-Screenshots, urheberrechtlich geschützt):

- https://alphacoders.com/monster-hunter-world-wallpapers
- https://wallpapercave.com/monster-hunter-world-hd-wallpapers

Lizenzfreie CC0-Alternativen (sicher auch bei öffentlichem Hosting):

- Dschungel/Regenwald (Camp/Forge): https://unsplash.com/s/photos/jungle-landscape
- Wüste (Box): https://www.pexels.com/search/desert/
- https://opengameart.org/content/cc0-backgrounds

## Bilder aufbereiten (empfohlen)

1. Hochkant zuschneiden, ca. **1080 × 1920 px** (Mobile-First, Portrait).
2. Als **WebP** exportieren, Qualität ~70 %. Ziel: **< 200 KB** pro Bild.
3. Motiv mittig/oben halten – der untere Rand wird ohnehin ausgeblendet.

```bash
# auf 1080px Breite skalieren und als WebP mit Q70 speichern
cwebp -q 70 -resize 1080 0 camp-original.jpg -o camp.webp
```

## Feintuning

- Gesamtstärke: CSS-Variable `--screen-bg-opacity` (Standard `0.4`) in
  `src/index.css` – höher = kräftiger, niedriger = dezenter.
- Tönung/Verlauf: ebenfalls in der `.screen-bg`-Regel
  (`filter: sepia(...)`, `mask-image: linear-gradient(...)`).

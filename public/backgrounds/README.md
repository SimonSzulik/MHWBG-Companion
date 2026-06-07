# Screen-Hintergrundbilder

Hintergründe für die Screens **Camp**, **Forge** und **Box**. Die Optik
(Deckkraft ~55 %, leichte Warm-Tönung, Verlauf nach unten) macht das CSS
(`.screen-bg` in `src/index.css`) — die Bilder selbst müssen also nicht
vorbearbeitet werden. Auf diesen Screens wird das Notiz-Raster ausgeblendet
(`.screen-bg-scrim`), damit das Bild sauber durchkommt.

## Mitgelieferte Standard-Bilder

Als Standard liegen hier handgezeichnete **SVG-Szenen** im Farbschema der App:

| Datei        | Screen | Motiv                                   |
| ------------ | ------ | --------------------------------------- |
| `camp.svg`   | Camp   | Ancient-Forest-Lager (Baum, Zelt, Feuer)|
| `forge.svg`  | Forge  | Schmiede (Esse, Amboss, Funken)         |
| `box.svg`    | Box    | Wildspire Waste (Dünen, Spires, Kaktus) |

Diese sind Eigen-Vektorgrafiken (kein Urheberrechtsproblem, winzig, im
PWA-Precache).

## Aktuelle Hintergründe / austauschen

Das Repo ist **privat**, für die private Nutzung ist offizielles MHW-Artwork
also unproblematisch. Aktuell eingebaut:

| Datei       | Screen | Motiv                      |
| ----------- | ------ | -------------------------- |
| `camp.webp` | Camp   | Astera (Schiffe / Hafen)   |
| `forge.png` | Forge  | Tradeyard / Schmiede-Halle |
| `box.jpg`   | Box    | Item-Box / Vorratskiste    |

Die SVG-Szenen (`camp.svg` / `forge.svg` / `box.svg`) bleiben als Fallback
liegen, falls eine Foto-Datei mal fehlt — sie werden dann automatisch wieder
angezeigt.

Zum Austauschen einfach `camp.webp` / `forge.png` / `box.jpg` durch eine neue
Datei **mit gleichem Namen** ersetzen, oder eine neue Datei ablegen und den
Pfad anpassen (`src` in `src/screens/Camp.tsx` bzw. das `background`-Prop von
`<Screen>` in `Forge.tsx` / `Inventory.tsx`).

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

- Gesamtstärke: CSS-Variable `--screen-bg-opacity` (Standard `0.55`) in
  `src/index.css` – höher = kräftiger, niedriger = dezenter.
- Tönung/Verlauf: ebenfalls in der `.screen-bg`-Regel
  (`filter: sepia(...)`, `mask-image: linear-gradient(...)`).

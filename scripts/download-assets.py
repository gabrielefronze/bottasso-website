#!/usr/bin/env python3
"""Download WordPress media to public/images and public/files."""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "public" / "images"
FILES = ROOT / "public" / "files"

UA = "Mozilla/5.0 (compatible; bottasso-website-port/1.0)"

DOWNLOADS: list[tuple[str, Path]] = [
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2026-Volpina_DSF4301-scaled.jpg", IMG / "portrait-volpina.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/Magazine-NMF-2026-Nicolo-Bottaso.png", IMG / "news/magazine-nmf-2026.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/Volpina-Newsletter-2.jpg", IMG / "news/newsletter-october-2026.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/Volpina-Newsletter-2-768x512.jpg", IMG / "news/newsletter-october-2026.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/1.-Postcards-from-Italy-%E2%80%93-COVER.png", IMG / "work/postcards-from-italy.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2.-Rickard-Eklund-Nonagon-2025-ALT.jpg", IMG / "work/rickard-eklund.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2.-Rickard-Eklund-Nonagon-2025-ALT-768x1024-1.jpg", IMG / "work/rickard-eklund.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/3-tenor-damore.png", IMG / "work/tenor-damore.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/3-tenor-damore-768x768.png", IMG / "work/tenor-damore.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/4.-Solo-A-P.png", IMG / "work/solo.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/4.-Solo-A-P-768x768.png", IMG / "work/solo.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/5.-Quartetto-Loco.png", IMG / "work/quartetto-loco.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/5.-Quartetto-Loco-768x768.png", IMG / "work/quartetto-loco.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/6.-Il-Cielo-di-Pietra-%E2%80%93-ballerine.png", IMG / "work/il-cielo-di-pietra.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/09/6.-Il-Cielo-di-Pietra-%E2%80%93-ballerine-768x768.png", IMG / "work/il-cielo-di-pietra.png"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-OSA-WhatsApp-Image-2025-06-04-at-16.40.08-5-1.jpeg", IMG / "agenda/hero.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2.jpg", IMG / "about/portrait.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2-scaled.jpg", IMG / "about/portrait.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2-683x1024.jpg", IMG / "about/portrait.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Magazine-NMF-2026-Nicolo-Bottaso.pdf", FILES / "Magazine-NMF-2026-Nicolo-Bottaso.pdf"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/CV-Nico-V6.pdf", FILES / "CV-Nico-V6.pdf"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo-Bottasso-%E2%80%93-PORTFOLIO-V7.pdf", FILES / "Nicolo-Bottasso-PORTFOLIO-V7.pdf"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_PressHD_Ph_FedericoCastelli.zip", FILES / "Nicolo_Bottasso_PressHD_Ph_FedericoCastelli.zip"),
]

PHOTOS = [
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Batafest-IMG_8629-1-scaled.jpg", "photo-01.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2026-Volpina_DSF4301-1-scaled.jpg", "photo-02.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-OSA-WhatsApp-Image-2025-06-04-at-16.40.08-5-1.jpeg", "photo-03.jpeg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-480449345_1429099288320248_5930134572187227288_n-1.jpg", "photo-04.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2024-Alentorn-1874-1.jpg", "photo-05.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2024-Alentorn-1874-1-2048x1392.jpg", "photo-05.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-b6bb725a-9e5b-40f7-b773-c603d49a1352-1.jpg", "photo-06.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0640-1.jpg", "photo-07.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0640-1-2048x1365.jpg", "photo-07.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0666.jpg", "photo-08.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0666-767x511.jpg", "photo-08.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0641-1.jpg", "photo-09.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0641-1-768x512.jpg", "photo-09.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-DSCF0415-1.jpg", "photo-10.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-DSCF0415-1-768x512.jpg", "photo-10.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Time-in-Jazz-francesca-sara-cauli-2025-180.jpg", "photo-11.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Time-in-Jazz-francesca-sara-cauli-2025-180-767x510.jpg", "photo-11.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-aa39d79e-6073-40f9-801a-e4faec7c62a3-1.jpg", "photo-12.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-aa39d79e-6073-40f9-801a-e4faec7c62a3-1-768x432.jpg", "photo-12.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2023-DSC04370-EDIT-1.jpg", "photo-13.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2023-DSC04370-EDIT-1-767x432.jpg", "photo-13.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-385814e5-7d1c-41b9-9ad8-678a188c1390-1.jpg", "photo-14.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-385814e5-7d1c-41b9-9ad8-678a188c1390-1-768x512.jpg", "photo-14.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2014-Crescendo_DSC6949-1.jpg", "photo-15.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2014-Crescendo_DSC6949-1-767x512.jpg", "photo-15.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-aprile-13_erasmusbrug-Cosenude-1.jpg", "photo-16.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-aprile-13_erasmusbrug-Cosenude-1-768x432.jpg", "photo-16.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-Dusio-2018-%E2%80%93025-DARP1561-1.jpg", "photo-17.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-Dusio-2018-%E2%80%93025-DARP1561-1-768x512.jpg", "photo-17.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-146-DD1_4213-1.jpg", "photo-18.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-146-DD1_4213-1-767x510.jpg", "photo-18.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-009-DD1_3961-1.jpg", "photo-19.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-009-DD1_3961-1-767x510.jpg", "photo-19.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/IMG_4029-1-edited.jpg", "photo-20.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/IMG_4029-1-edited-768x569.jpg", "photo-20.jpg"),
]

PRESS = [
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_03_Ph_FedericoCastelli.jpg", "press-03.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_03_Ph_FedericoCastelli-683x1024.jpg", "press-03.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_01_Ph_FedericoCastelli.jpg", "press-01.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_01_Ph_FedericoCastelli-768x576.jpg", "press-01.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_02_Ph_FedericoCastelli.jpg", "press-02.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_02_Ph_FedericoCastelli-768x960.jpg", "press-02.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_04_Ph_FedericoCastelli.jpg", "press-04.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_04_Ph_FedericoCastelli-683x1024.jpg", "press-04.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_05_Ph_FedericoCastelli.jpg", "press-05.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_05_Ph_FedericoCastelli-683x1024.jpg", "press-05.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_06_Ph_FedericoCastelli.jpg", "press-06.jpg"),
    ("https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_06_Ph_FedericoCastelli-819x1024.jpg", "press-06.jpg"),
]


def fetch(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            if res.status != 200:
                print(f"SKIP {res.status} {url}")
                return False
            data = res.read()
            if len(data) < 500:
                print(f"SKIP tiny {url}")
                return False
            dest.write_bytes(data)
            print(f"OK {dest.relative_to(ROOT)} ({len(data)} bytes)")
            return True
    except Exception as exc:
        print(f"FAIL {url} -> {exc}")
        return False


def main() -> None:
    for url, dest in DOWNLOADS:
        if dest.exists() and dest.stat().st_size > 500:
            continue
        fetch(url, dest)

    photo_dir = IMG / "media" / "photos"
    for url, name in PHOTOS:
        dest = photo_dir / name
        if dest.exists() and dest.stat().st_size > 500:
            continue
        fetch(url, dest)

    press_dir = IMG / "media" / "press"
    for url, name in PRESS:
        dest = press_dir / name
        if dest.exists() and dest.stat().st_size > 500:
            continue
        fetch(url, dest)

    missing = []
    expected = [
        IMG / "portrait-volpina.jpg",
        IMG / "news/magazine-nmf-2026.png",
        IMG / "news/newsletter-october-2026.jpg",
        IMG / "work/postcards-from-italy.png",
        IMG / "work/rickard-eklund.jpg",
        IMG / "work/tenor-damore.png",
        IMG / "work/solo.png",
        IMG / "work/quartetto-loco.png",
        IMG / "work/il-cielo-di-pietra.png",
        IMG / "agenda/hero.jpg",
        IMG / "about/portrait.jpg",
        FILES / "Magazine-NMF-2026-Nicolo-Bottaso.pdf",
        FILES / "CV-Nico-V6.pdf",
        FILES / "Nicolo-Bottasso-PORTFOLIO-V7.pdf",
        FILES / "Nicolo_Bottasso_PressHD_Ph_FedericoCastelli.zip",
    ]
    for i in range(1, 21):
        ext = "jpeg" if i == 3 else "jpg"
        expected.append(IMG / "media" / "photos" / f"photo-{i:02d}.{ext}")
    for i in range(1, 7):
        expected.append(IMG / "media" / "press" / f"press-{i:02d}.jpg")
    for path in expected:
        if not path.exists():
            missing.append(str(path.relative_to(ROOT)))
    if missing:
        raise SystemExit("Missing files:\n" + "\n".join(missing))
    print("All expected assets present.")


if __name__ == "__main__":
    main()

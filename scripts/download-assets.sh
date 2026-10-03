#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

get() {
  local url="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [[ -s "$dest" ]]; then
    echo "have $dest"
    return 0
  fi
  if curl -fsSL -A "$UA" --max-time 60 -o "$dest.tmp" "$url"; then
    mv "$dest.tmp" "$dest"
    echo "ok $dest"
    return 0
  fi
  rm -f "$dest.tmp"
  echo "fail $url"
  return 1
}

try() {
  local dest="$1"
  shift
  local url
  for url in "$@"; do
    if get "$url" "$dest"; then
      return 0
    fi
  done
  echo "MISSING $dest" >&2
  return 1
}

IMG="$ROOT/public/images"
FILES="$ROOT/public/files"

try "$IMG/portrait-volpina.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2026-Volpina_DSF4301-scaled.jpg"

try "$IMG/news/magazine-nmf-2026.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/Magazine-NMF-2026-Nicolo-Bottaso.png"

try "$IMG/news/newsletter-october-2026.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/Volpina-Newsletter-2.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/Volpina-Newsletter-2-768x512.jpg"

try "$IMG/work/postcards-from-italy.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/1.-Postcards-from-Italy-%E2%80%93-COVER.png"

try "$IMG/work/rickard-eklund.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2.-Rickard-Eklund-Nonagon-2025-ALT.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2.-Rickard-Eklund-Nonagon-2025-ALT-768x1024-1.jpg"

try "$IMG/work/tenor-damore.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/3-tenor-damore.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/3-tenor-damore-768x768.png"

try "$IMG/work/solo.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/4.-Solo-A-P.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/4.-Solo-A-P-768x768.png"

try "$IMG/work/quartetto-loco.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/5.-Quartetto-Loco.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/5.-Quartetto-Loco-768x768.png"

try "$IMG/work/il-cielo-di-pietra.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/6.-Il-Cielo-di-Pietra-%E2%80%93-ballerine.png" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/09/6.-Il-Cielo-di-Pietra-%E2%80%93-ballerine-768x768.png"

try "$IMG/agenda/hero.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-OSA-WhatsApp-Image-2025-06-04-at-16.40.08-5-1.jpeg"

try "$IMG/about/portrait.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2-scaled.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/DSC09497-2-683x1024.jpg"

try "$FILES/Magazine-NMF-2026-Nicolo-Bottaso.pdf" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Magazine-NMF-2026-Nicolo-Bottaso.pdf"

try "$FILES/CV-Nico-V6.pdf" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/CV-Nico-V6.pdf"

try "$FILES/Nicolo-Bottasso-PORTFOLIO-V7.pdf" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo-Bottasso-%E2%80%93-PORTFOLIO-V7.pdf"

try "$FILES/Nicolo_Bottasso_PressHD_Ph_FedericoCastelli.zip" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_PressHD_Ph_FedericoCastelli.zip"

P="$IMG/media/photos"
try "$P/photo-01.jpg" "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Batafest-IMG_8629-1-scaled.jpg"
try "$P/photo-02.jpg" "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2026-Volpina_DSF4301-1-scaled.jpg"
try "$P/photo-03.jpeg" "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-OSA-WhatsApp-Image-2025-06-04-at-16.40.08-5-1.jpeg"
try "$P/photo-04.jpg" "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-480449345_1429099288320248_5930134572187227288_n-1.jpg"
try "$P/photo-05.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2024-Alentorn-1874-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2024-Alentorn-1874-1-2048x1392.jpg"
try "$P/photo-06.jpg" "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-b6bb725a-9e5b-40f7-b773-c603d49a1352-1.jpg"
try "$P/photo-07.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0640-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0640-1-2048x1365.jpg"
try "$P/photo-08.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0666.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0666-767x511.jpg"
try "$P/photo-09.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0641-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Combinenarts-%E2%80%93-P_279A0641-1-768x512.jpg"
try "$P/photo-10.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-DSCF0415-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-DSCF0415-1-768x512.jpg"
try "$P/photo-11.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Time-in-Jazz-francesca-sara-cauli-2025-180.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2025-Time-in-Jazz-francesca-sara-cauli-2025-180-767x510.jpg"
try "$P/photo-12.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-aa39d79e-6073-40f9-801a-e4faec7c62a3-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-aa39d79e-6073-40f9-801a-e4faec7c62a3-1-768x432.jpg"
try "$P/photo-13.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2023-DSC04370-EDIT-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2023-DSC04370-EDIT-1-767x432.jpg"
try "$P/photo-14.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-385814e5-7d1c-41b9-9ad8-678a188c1390-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2022-Gelsomina-Dreams-%E2%80%93-385814e5-7d1c-41b9-9ad8-678a188c1390-1-768x512.jpg"
try "$P/photo-15.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2014-Crescendo_DSC6949-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2014-Crescendo_DSC6949-1-767x512.jpg"
try "$P/photo-16.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-aprile-13_erasmusbrug-Cosenude-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-aprile-13_erasmusbrug-Cosenude-1-768x432.jpg"
try "$P/photo-17.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-Dusio-2018-%E2%80%93025-DARP1561-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2018-Dusio-2018-%E2%80%93025-DARP1561-1-768x512.jpg"
try "$P/photo-18.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-146-DD1_4213-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-146-DD1_4213-1-767x510.jpg"
try "$P/photo-19.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-009-DD1_3961-1.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/2020-SaLimba-%E2%80%93-009-DD1_3961-1-767x510.jpg"
try "$P/photo-20.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/IMG_4029-1-edited.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/IMG_4029-1-edited-768x569.jpg"

PR="$IMG/media/press"
try "$PR/press-03.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_03_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_03_Ph_FedericoCastelli-683x1024.jpg"
try "$PR/press-01.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_01_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_01_Ph_FedericoCastelli-768x576.jpg"
try "$PR/press-02.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_02_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_02_Ph_FedericoCastelli-768x960.jpg"
try "$PR/press-04.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_04_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_04_Ph_FedericoCastelli-683x1024.jpg"
try "$PR/press-05.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_05_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_05_Ph_FedericoCastelli-683x1024.jpg"
try "$PR/press-06.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_06_Ph_FedericoCastelli.jpg" \
  "https://www.nicolobottasso.com/wp-content/uploads/2026/10/Nicolo_Bottasso_06_Ph_FedericoCastelli-819x1024.jpg"

echo "Done."

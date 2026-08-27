#!/usr/bin/env bash
# Builds, packages and installs every theme in one go.
#
#   scripts/install-all.sh                    # base theme + all palette variants
#   scripts/install-all.sh bee_eater galah    # just these palettes
#   scripts/install-all.sh -e kiro            # install into Kiro / VSCodium / Cursor instead
#   scripts/install-all.sh -n                 # build and package only, don't install
set -euo pipefail

cd "$(dirname "$0")/.."

EDITOR_BIN=${CODE_BIN:-code}
INSTALL=1
PALETTES=()

while [ $# -gt 0 ]; do
  case "$1" in
    -e|--editor)  EDITOR_BIN=$2; shift 2 ;;
    -n|--no-install) INSTALL=0; shift ;;
    -h|--help)    sed -n '2,7p' "$0" | cut -c3-; exit 0 ;;
    -*)           echo "unknown option: $1" >&2; exit 2 ;;
    *)            PALETTES+=("$1"); shift ;;
  esac
done

if [ ${#PALETTES[@]} -eq 0 ]; then
  ALL=1
  for d in palettes/*/source.json; do PALETTES+=("$(basename "$(dirname "$d")")"); done
else
  ALL=0
fi

if [ "$INSTALL" = 1 ] && ! command -v "$EDITOR_BIN" >/dev/null; then
  echo "error: '$EDITOR_BIN' is not on PATH. Use -e <bin> or -n to skip installing." >&2
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
PACK=(npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository)
installed=()

# One vsix per extension directory: build, package, install.
pack_and_install() {
  local dir=$1 id=$2 label=$3
  echo
  echo "==> $label"
  ( cd "$dir" && rm -f ./*.vsix && "${PACK[@]}" >/dev/null )
  local vsix="$dir/$id-$VERSION.vsix"
  [ -f "$vsix" ] || { echo "error: $vsix was not produced" >&2; exit 1; }
  if [ "$INSTALL" = 1 ]; then
    "$EDITOR_BIN" --install-extension "$vsix" --force >/dev/null
    echo "    installed $label"
  else
    echo "    packaged  $vsix"
  fi
  installed+=("$label")
}

echo "building themes..."
node build.js --all >/dev/null

if [ "$ALL" = 1 ]; then
  pack_and_install . "$(node -p "require('./package.json').name")" \
                     "$(node -p "require('./package.json').displayName")"
fi

for name in "${PALETTES[@]}"; do
  dir=palettes/$name
  [ -f "$dir/package.json" ] || { echo "error: no such palette: $name" >&2; exit 1; }
  pack_and_install "$dir" "$(node -p "require('./$dir/package.json').name")" \
                          "$(node -p "require('./$dir/package.json').contributes.themes[0].label")"
done

echo
if [ "$INSTALL" = 1 ]; then
  echo "${#installed[@]} theme(s) installed:"
  printf '  %s\n' "${installed[@]}"
  echo
  echo "Pick one with: Preferences: Color Theme"
else
  echo "${#installed[@]} theme(s) packaged:"
  printf '  %s\n' "${installed[@]}"
fi

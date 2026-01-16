#!/usr/bin/env python3
import json
import os
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
IMAGES_ROOT = REPO_ROOT / "src" / "assets" / "images"
MANIFEST_PATH = REPO_ROOT / "src" / "config" / "asset-manifest.json"
OUT_PATH = REPO_ROOT / "doc" / "imagelist.md"

def walk_manifest(node, key_path=None):
    if key_path is None:
        key_path = []
    if isinstance(node, dict):
        for k, v in node.items():
            yield from walk_manifest(v, key_path + [k])
    elif isinstance(node, list):
        for idx, v in enumerate(node):
            yield from walk_manifest(v, key_path + [str(idx)])
    elif isinstance(node, str):
        # leaf -> file path (relative to images root)
        yield key_path, node
    else:
        # unknown type, ignore
        return

def safe_size(path: Path):
    try:
        return path.stat().st_size
    except FileNotFoundError:
        return None

def main():
    if not MANIFEST_PATH.exists():
        raise SystemExit(f"Manifest not found: {MANIFEST_PATH}")
    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Group by top-level key
    groups = {}
    for key_path, rel_path in walk_manifest(manifest):
        top = key_path[0] if key_path else "misc"
        groups.setdefault(top, []).append((key_path, rel_path))

    lines = []
    lines.append("# 画像アセット一覧（自動生成）")
    lines.append("")
    lines.append(f"- 生成元: `src/config/asset-manifest.json`")
    lines.append(f"- 画像ルート: `src/assets/images`")
    lines.append(f"- 更新日時: {datetime.now().isoformat(timespec='seconds')}")
    lines.append("")
    lines.append("> 注意: このファイルは tools/gen_imagelist.py により自動生成されます。直接編集しないでください。")
    lines.append("")

    # Sorted output for stability
    for top in sorted(groups.keys()):
        lines.append(f"## {top}")
        lines.append("")
        # sort entries by relative path for readability
        for key_path, rel_path in sorted(groups[top], key=lambda x: x[1]):
            img_path = IMAGES_ROOT / rel_path
            exists = img_path.exists()
            size = safe_size(img_path)
            key_desc = " / ".join(key_path)  # e.g., jobs / engineer / attack
            status = "OK" if exists else "MISSING"
            size_str = f"{size} bytes" if size is not None else "-"
            lines.append(f"- {key_desc}")
            lines.append(f"  - path: `src/assets/images/{rel_path}`")
            lines.append(f"  - status: {status}, size: {size_str}")
        lines.append("")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Wrote {OUT_PATH.relative_to(REPO_ROOT)}")

if __name__ == "__main__":
    main()
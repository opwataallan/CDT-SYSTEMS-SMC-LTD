#!/usr/bin/env python3
"""
Cyber Dynamic Technologies Marketplace - WordPress Plugin Packager

Builds the React 19 production frontend and bundles the WordPress plugin
into an installable cyber-dynamic-marketplace.zip archive.
"""

import os
import shutil
import zipfile
import subprocess
import glob

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUGIN_DIR = os.path.join(ROOT_DIR, "wordpress-plugin", "cyber-dynamic-marketplace")
PLUGIN_ASSETS_DIR = os.path.join(PLUGIN_DIR, "assets")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
ZIP_OUTPUT_PATH = os.path.join(ROOT_DIR, "cyber-dynamic-marketplace.zip")

def build_frontend():
    print("[WP Packager] Building React frontend via vite build...")
    cmd = ["npm", "run", "build"]
    res = subprocess.run(cmd, cwd=ROOT_DIR)
    if res.returncode != 0:
        print("[WP Packager] ERROR: Frontend build failed.")
        exit(res.returncode)

def sync_assets():
    print("[WP Packager] Syncing built production assets to plugin assets folder...")
    os.makedirs(PLUGIN_ASSETS_DIR, exist_ok=True)

    # Clean existing assets
    for item in os.listdir(PLUGIN_ASSETS_DIR):
        p = os.path.join(PLUGIN_ASSETS_DIR, item)
        if os.path.isfile(p):
            os.remove(p)
        elif os.path.isdir(p):
            shutil.rmtree(p)

    # Copy files from dist/assets (CSS and JS)
    dist_assets = os.path.join(DIST_DIR, "assets")
    if os.path.exists(dist_assets):
        for f in os.listdir(dist_assets):
            if f in ["aistudio", "__MACOSX"] or f.startswith("."):
                continue
            src = os.path.join(dist_assets, f)
            dst = os.path.join(PLUGIN_ASSETS_DIR, f)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)
            print(f"  Copied asset: {f}")

    # Copy icons & manifest
    for extra in ["manifest.webmanifest", "manifest.json", "icon.svg", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png", "logo.png", "logo.jpg"]:
        dist_extra = os.path.join(DIST_DIR, extra)
        public_extra = os.path.join(ROOT_DIR, "public", extra)
        target = os.path.join(PLUGIN_ASSETS_DIR, extra)
        if os.path.exists(dist_extra):
            shutil.copy2(dist_extra, target)
        elif os.path.exists(public_extra):
            shutil.copy2(public_extra, target)

    # Also copy manifest.json if manifest.webmanifest exists
    webmanifest = os.path.join(PLUGIN_ASSETS_DIR, "manifest.webmanifest")
    manifest_json = os.path.join(PLUGIN_ASSETS_DIR, "manifest.json")
    if os.path.exists(webmanifest) and not os.path.exists(manifest_json):
        shutil.copy2(webmanifest, manifest_json)

def create_zip():
    print(f"[WP Packager] Bundling WordPress plugin to: {ZIP_OUTPUT_PATH}")
    if os.path.exists(ZIP_OUTPUT_PATH):
        os.remove(ZIP_OUTPUT_PATH)

    with zipfile.ZipFile(ZIP_OUTPUT_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Standard WordPress plugin zip structure requires top-level directory 'cyber-dynamic-marketplace/'
        # Write root folder entry
        root_zinfo = zipfile.ZipInfo("cyber-dynamic-marketplace/")
        root_zinfo.external_attr = 0o040755 << 16
        root_zinfo.create_system = 3
        zipf.writestr(root_zinfo, "")

        # Collect directories and files
        for root, dirs, files in os.walk(PLUGIN_DIR):
            dirs.sort()
            files.sort()
            rel_dir = os.path.relpath(root, PLUGIN_DIR)

            # Write directory entries
            for d in dirs:
                if d.startswith(".") or d in ["__MACOSX", "aistudio"]:
                    continue
                dir_path_in_zip = os.path.normpath(os.path.join("cyber-dynamic-marketplace", rel_dir, d)).replace("\\", "/") + "/"
                zinfo = zipfile.ZipInfo(dir_path_in_zip)
                zinfo.external_attr = 0o040755 << 16
                zinfo.create_system = 3
                zipf.writestr(zinfo, "")

            # Write file entries
            for f in files:
                if f.startswith(".") or f in ["Thumbs.db", "desktop.ini"]:
                    continue
                file_full = os.path.join(root, f)
                file_path_in_zip = os.path.normpath(os.path.join("cyber-dynamic-marketplace", rel_dir, f)).replace("\\", "/")
                
                with open(file_full, "rb") as fp:
                    content = fp.read()

                zinfo = zipfile.ZipInfo(file_path_in_zip)
                zinfo.external_attr = 0o100644 << 16
                zinfo.create_system = 3
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zipf.writestr(zinfo, content)
                print(f"  Added: {file_path_in_zip}")

    size_mb = os.path.getsize(ZIP_OUTPUT_PATH) / (1024 * 1024)
    print(f"[WP Packager] SUCCESS: Generated {os.path.basename(ZIP_OUTPUT_PATH)} ({size_mb:.2f} MB)")

    # Mirror to public directory for direct browser download
    public_target = os.path.join(ROOT_DIR, "public", "cyber-dynamic-marketplace.zip")
    shutil.copy2(ZIP_OUTPUT_PATH, public_target)
    print(f"[WP Packager] Mirrored to public/cyber-dynamic-marketplace.zip for direct browser download")

if __name__ == "__main__":
    sync_assets()
    create_zip()

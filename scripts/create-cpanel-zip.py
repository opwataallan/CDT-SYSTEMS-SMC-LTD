#!/usr/bin/env python3
import os
import zipfile
import sys

def create_cpanel_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel-production.zip')

    # Remove existing zip if present
    if os.path.exists(output_zip):
        os.remove(output_zip)

    # Explicit list of top-level files to include
    include_files = [
        'app.js',
        'package.json',
        '.env.example',
        '.htaccess',
        'cpanel_mysql_schema.sql',
        'CPANEL-DEPLOYMENT.md',
    ]

    # Directories to include
    include_dirs = [
        'dist',
        'data',
        'public',
    ]

    print(f"[cPanel Packager] Creating production bundle: {output_zip}")

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add root files
        for filename in include_files:
            file_path = os.path.join(root_dir, filename)
            if os.path.exists(file_path):
                print(f"  Adding file: {filename}")
                with open(file_path, "rb") as fp:
                    content = fp.read()
                zinfo = zipfile.ZipInfo(filename)
                zinfo.external_attr = 0o100644 << 16
                zinfo.create_system = 3
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zf.writestr(zinfo, content)
            else:
                print(f"  Warning: Expected file not found: {filename}")

        # Add directories recursively
        for dir_name in include_dirs:
            dir_path = os.path.join(root_dir, dir_name)
            if not os.path.exists(dir_path):
                print(f"  Warning: Expected directory not found: {dir_path}")
                continue

            # Add directory root entry
            zinfo = zipfile.ZipInfo(f"{dir_name}/")
            zinfo.external_attr = 0o040755 << 16
            zinfo.create_system = 3
            zf.writestr(zinfo, "")

            for root, dirs, files in os.walk(dir_path):
                dirs.sort()
                files.sort()
                rel_dir = os.path.relpath(root, root_dir)

                for d in dirs:
                    if d.startswith(".") or d in ["__MACOSX", "aistudio"]:
                        continue
                    d_path = os.path.normpath(os.path.join(rel_dir, d)).replace("\\", "/") + "/"
                    zinfo = zipfile.ZipInfo(d_path)
                    zinfo.external_attr = 0o040755 << 16
                    zinfo.create_system = 3
                    zf.writestr(zinfo, "")

                for file in files:
                    if file.startswith(".") or file.endswith('.tmp') or file.endswith('.zip') or file in ['server.log', 'server.old.log', 'Thumbs.db']:
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.normpath(os.path.relpath(full_path, root_dir)).replace("\\", "/")
                    with open(full_path, "rb") as fp:
                        content = fp.read()
                    zinfo = zipfile.ZipInfo(rel_path)
                    zinfo.external_attr = 0o100644 << 16
                    zinfo.create_system = 3
                    zinfo.compress_type = zipfile.ZIP_DEFLATED
                    zf.writestr(zinfo, content)
            print(f"  Added directory: {dir_name}/")

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"[cPanel Packager] Successfully generated cpanel-production.zip ({size_mb:.2f} MB)")

    # Mirror to public directory for direct browser download
    public_target = os.path.join(root_dir, 'public', 'cpanel-production.zip')
    import shutil
    shutil.copy2(output_zip, public_target)
    print(f"[cPanel Packager] Mirrored to public/cpanel-production.zip for direct browser download")

if __name__ == '__main__':
    create_cpanel_zip()

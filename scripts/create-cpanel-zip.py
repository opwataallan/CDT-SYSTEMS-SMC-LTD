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
                zf.write(file_path, arcname=filename)
            else:
                print(f"  Warning: Expected file not found: {filename}")

        # Add directories recursively
        for dir_name in include_dirs:
            dir_path = os.path.join(root_dir, dir_name)
            if not os.path.exists(dir_path):
                print(f"  Warning: Expected directory not found: {dir_path}")
                continue

            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    # Skip temporary files, maps, or logs
                    if file.endswith('.tmp') or file == 'server.log' or file == 'server.old.log':
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, root_dir)
                    zf.write(full_path, arcname=rel_path)
            print(f"  Added directory: {dir_name}/")

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"[cPanel Packager] Successfully generated cpanel-production.zip ({size_mb:.2f} MB)")

if __name__ == '__main__':
    create_cpanel_zip()

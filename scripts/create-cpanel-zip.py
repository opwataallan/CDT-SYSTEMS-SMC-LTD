#!/usr/bin/env python3
import os
import zipfile
import sys

def create_cpanel_zip():
    archive_name = 'cpanel-production.zip'
    print(f'[cPanel Packager] Creating deployment bundle: {archive_name}...')

    # Essential files and directories to include for cPanel AI App Hosting
    include_files = [
        'app.js',
        'package.json',
        '.htaccess',
        'mcp.json',
        'metadata.json'
    ]
    
    include_dirs = [
        'dist',
        'public'
    ]

    with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for f in include_files:
            if os.path.exists(f):
                print(f'  + Adding {f}')
                zipf.write(f)
            else:
                print(f'  ! Warning: {f} not found')

        for d in include_dirs:
            if os.path.exists(d):
                for root, dirs, files in os.walk(d):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, '.')
                        print(f'  + Adding {rel_path}')
                        zipf.write(full_path, rel_path)
            else:
                print(f'  ! Warning: directory {d} not found')

    size_mb = os.path.getsize(archive_name) / (1024 * 1024)
    print(f'[cPanel Packager] Successfully packaged {archive_name} ({size_mb:.2f} MB)')

if __name__ == '__main__':
    create_cpanel_zip()

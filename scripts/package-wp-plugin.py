import os
import zipfile

def package_plugin():
    src_file = "public/plugins/cdt-marketplace-bridge/cdt-marketplace-bridge.php"
    out_zip = "public/plugins/cdt-marketplace-bridge.zip"
    os.makedirs(os.path.dirname(out_zip), exist_ok=True)
    if os.path.exists(src_file):
        with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(src_file, "cdt-marketplace-bridge/cdt-marketplace-bridge.php")
        print(f"[Plugin Packager] Built {out_zip} successfully.")
    else:
        print(f"[Plugin Packager] Source {src_file} not found.")

if __name__ == "__main__":
    package_plugin()

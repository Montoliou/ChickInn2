#!/usr/bin/env python3
"""Deploy ChickInn Web App to IONOS via SFTP."""

import os
import stat
import paramiko

# ── Config ───────────────────────────────────────────────────────────
def load_credentials():
    creds = {}
    with open(os.path.join(os.path.dirname(__file__), '.ftp-credentials')) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                key, val = line.split('=', 1)
                creds[key.strip()] = val.strip()
    return creds

creds = load_credentials()
HOST = creds['FTP_HOST']
USER = creds['FTP_USER']
PASS = creds['FTP_PASS']
PORT = int(creds.get('FTP_PORT', '22'))
REMOTE_BASE = creds['FTP_TARGET_DIR'].rstrip('/') + '/chickinn'

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(PROJECT_DIR, 'dist')
API_DIR = os.path.join(PROJECT_DIR, 'api')

# ── Helpers ──────────────────────────────────────────────────────────
def sftp_makedirs(sftp, remote_dir):
    """Recursively create remote directories."""
    dirs_to_create = []
    current = remote_dir
    while True:
        try:
            sftp.stat(current)
            break
        except FileNotFoundError:
            dirs_to_create.append(current)
            current = os.path.dirname(current)
            if current == '/' or current == current:
                break
    for d in reversed(dirs_to_create):
        try:
            sftp.mkdir(d)
            print(f"  mkdir {d}")
        except Exception:
            pass

def upload_dir(sftp, local_dir, remote_dir):
    """Upload a local directory to remote via SFTP."""
    sftp_makedirs(sftp, remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + '/' + item
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            print(f"  {item}")
            sftp.put(local_path, remote_path)

def main():
    print(f"Connecting to {HOST}:{PORT} as {USER}...")
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)

    # 1. Upload dist/ -> /chickinn/
    print(f"\n>> Uploading frontend (dist/) -> {REMOTE_BASE}/")
    upload_dir(sftp, DIST_DIR, REMOTE_BASE)

    # 2. Upload api/ -> /chickinn/api/
    print(f"\n>> Uploading backend (api/) -> {REMOTE_BASE}/api/")
    remote_api = REMOTE_BASE + '/api'
    sftp_makedirs(sftp, remote_api)
    for item in os.listdir(API_DIR):
        local_path = os.path.join(API_DIR, item)
        if os.path.isfile(local_path):
            print(f"  {item}")
            sftp.put(local_path, remote_api + '/' + item)

    # 3. Create uploads directory
    uploads_dir = remote_api + '/uploads'
    try:
        sftp.stat(uploads_dir)
    except FileNotFoundError:
        sftp.mkdir(uploads_dir)
        print(f"\n  mkdir {uploads_dir}")

    sftp.close()
    transport.close()
    print(f"\nOK: Deploy complete! -> https://montolio.de/chickinn/")

if __name__ == '__main__':
    main()

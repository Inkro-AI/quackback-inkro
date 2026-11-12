#!/usr/bin/env python3
"""Package the exact committed source offered by the deployed AGPL service."""
import gzip
import io
import pathlib
import subprocess
import tarfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps/web/public/inkro-quackback-source.tar.gz"


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def main():
    if git("status", "--porcelain", "--untracked-files=normal").strip():
        raise SystemExit("Source packaging requires a clean committed checkout.")
    revision = git("rev-parse", "HEAD").decode().strip()
    data = git("archive", "--format=tar", "--prefix=quackback-inkro/", revision)
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        for member in archive:
            parts = pathlib.PurePosixPath(member.name).parts
            name = parts[-1]
            if name == ".env" or (name.startswith(".env.") and not name.endswith((".example", ".sample"))):
                raise SystemExit(f"Refusing environment file: {member.name}")
            if any(part in {".git", ".aws", ".ssh", "node_modules"} for part in parts):
                raise SystemExit(f"Refusing private/generated directory: {member.name}")
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_bytes(gzip.compress(data, mtime=0))
    print(f"Packaged source for {revision}: {OUTPUT}")


if __name__ == "__main__":
    main()

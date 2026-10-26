"""Compatibility entry point for the shared-brand buyer overview generator."""
import subprocess
from pathlib import Path


def build():
    """Refresh the current overview and its fingerprints from the shared source."""
    subprocess.run(["npm", "run", "brand:refresh"], cwd=Path(__file__).resolve().parents[1], check=True)


if __name__ == '__main__':
    build()

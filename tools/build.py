#!/usr/bin/env python3
"""Build the existing single-file deployment from editable EMR modules."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKEN = re.compile(r"\{\{\s*(scripts|include\s+[^{}]+?)\s*\}\}")


def read_source(name):
    path = (ROOT / name).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"Invalid or missing source: {name}")
    return path.read_text(encoding="utf-8")


def render_outputs():
    manifest = json.loads(read_source("modules.json"))
    for group in ("scripts", "server"):
        if not manifest[group] or len(set(manifest[group])) != len(manifest[group]):
            raise ValueError(f"Empty or duplicate modules in {group}")
    scripts = "".join(read_source(name) for name in manifest["scripts"])
    if re.search(r"</script\b", scripts, re.I):
        raise ValueError("JavaScript contains a closing HTML script tag")

    def expand(text, stack=()):
        def replace(match):
            directive = match.group(1)
            if directive == "scripts":
                return scripts
            name = directive.removeprefix("include").strip()
            if name in stack:
                raise ValueError(f"Circular include: {' -> '.join((*stack, name))}")
            return expand(read_source(name), (*stack, name))
        return TOKEN.sub(replace, text)

    return {
        "index.html": expand(read_source("src/index.template.html")),
        "Code.gs": "".join(read_source(name) for name in manifest["server"]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check generated files without writing")
    args = parser.parse_args()
    outputs = render_outputs()
    stale = [name for name, text in outputs.items()
             if not (ROOT / name).exists() or (ROOT / name).read_bytes() != text.encode("utf-8")]
    if args.check:
        if stale:
            parser.exit(1, "Build required: " + ", ".join(stale) + "\n")
        print("OK: index.html and Code.gs match all source modules")
        return
    for name in stale:
        destination = ROOT / name
        temporary = destination.with_suffix(destination.suffix + ".tmp")
        temporary.write_bytes(outputs[name].encode("utf-8"))
        temporary.replace(destination)
    print("Built index.html and Code.gs")


if __name__ == "__main__":
    main()

import json
from pathlib import Path

store_path = Path(__file__).resolve().parent / 'src/store.ts'

with store_path.open('r', encoding='utf-8') as f:
    pass # we can't extract SVG from store easily, but we can look at the raw SVG in the Rust backend output.

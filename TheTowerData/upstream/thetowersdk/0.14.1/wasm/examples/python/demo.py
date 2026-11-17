"""Run the SDK from Python and print what it answered."""
from pathlib import Path
from thetowersdk import TowerSDK

MODULE = Path(__file__).resolve().parents[2] / ".build" / "thetowersdk.wasm"
sdk = TowerSDK(MODULE)

print("ops:", len(sdk.ops()))

version = sdk.call(op="version")
print(f"formulas: {version['formulas']}  calculators: {version['calculators']}")

labs = sdk.catalog("LAB_CATALOG", limit=1)
print(f"LAB_CATALOG: {labs['total']} entries, first is {labs['items'][0]['name']!r}")

thorns = sdk.run_calculator(
    "thorns.damage", baseThorns=120, wallThorns=12, tier=14, sharpFortitude=True
)
print("thorns hits to kill an elite:", thorns["atWallThorns"]["hitsToKillElite"])

print("4770477147914 ->", sdk.format_number(4_770_477_147_914))

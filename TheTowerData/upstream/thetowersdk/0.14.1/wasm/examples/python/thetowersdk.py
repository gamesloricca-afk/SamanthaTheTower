"""
TheTowerSDK from Python.

The game data and the formulas are TypeScript. This runs them — the actual code the package
ships, not a port of it — by loading `thetowersdk.wasm` into a WebAssembly runtime in this
process. No JavaScript, no Node, no server, no network.

    pip install wasmtime

    from thetowersdk import TowerSDK

    sdk = TowerSDK("thetowersdk.wasm")
    sdk.call(op="calc.run", id="thorns.damage", input={"baseThorns": 120, "wallThorns": 12})

The protocol is one JSON object in and one JSON object out, over the module's stdin and stdout.
That is deliberately the least exotic interface available: every language can already write JSON,
and WASI stdio is the one thing every runtime exposes the same way.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any

from wasmtime import Engine, Linker, Module, Store, WasiConfig


class TowerSDKError(RuntimeError):
    """The module answered, and the answer was a failure."""


class TowerSDK:
    """
    A loaded copy of the SDK.

    The module is compiled once and instantiated per call. QuickJS inside it runs a main and
    exits, so there is nothing to keep alive between calls — and compilation, which is the slow
    part, happens only here in __init__.
    """

    def __init__(self, module_path: str | Path) -> None:
        self._engine = Engine()
        self._module = Module.from_file(self._engine, str(module_path))
        self._linker = Linker(self._engine)
        self._linker.define_wasi()

    def call(self, **request: Any) -> dict[str, Any]:
        """Send one request. Raises TowerSDKError when the module reports a failure."""
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            stdin_path = work / "in.json"
            stdout_path = work / "out.json"

            stdin_path.write_text(json.dumps(request), encoding="utf-8")
            stdout_path.touch()

            config = WasiConfig()
            config.stdin_file = str(stdin_path)
            config.stdout_file = str(stdout_path)

            store = Store(self._engine)
            store.set_wasi(config)
            instance = self._linker.instantiate(store, self._module)
            instance.exports(store)["_start"](store)

            raw = stdout_path.read_text(encoding="utf-8")

        if not raw.strip():
            raise TowerSDKError("the module produced no output")

        answer = json.loads(raw)
        if not answer.get("ok"):
            raise TowerSDKError(answer.get("error", "unknown failure"))
        return answer

    # Convenience wrappers. The protocol is the API; these just read better at a call site.

    def ops(self) -> list[str]:
        return self.call(op="ops")["ops"]

    def catalog(self, name: str, offset: int = 0, limit: int = 100) -> dict[str, Any]:
        return self.call(op="data.get", name=name, offset=offset, limit=limit)

    def calculators(self) -> list[dict[str, Any]]:
        return self.call(op="calc.list")["calculators"]

    def run_calculator(self, calculator_id: str, **values: Any) -> dict[str, Any]:
        return self.call(op="calc.run", id=calculator_id, input=values)["result"]

    def format_number(self, value: float) -> str:
        return self.call(op="format", value=value)["display"]

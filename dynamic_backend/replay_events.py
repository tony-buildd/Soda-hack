from __future__ import annotations

import argparse
import json
from pathlib import Path

import requests


def main() -> None:
  parser = argparse.ArgumentParser(description="Replay dynamic events to backend")
  parser.add_argument(
    "--events",
    default=str(Path(__file__).resolve().parents[1] / "data" / "dynamic_events.json"),
    help="Path to events JSON file",
  )
  parser.add_argument(
    "--base-url",
    default="http://localhost:5000",
    help="Backend base URL",
  )
  parser.add_argument(
    "--auto-reoptimize",
    action="store_true",
    help="Request auto re-optimize after event when threshold/urgency allows",
  )
  args = parser.parse_args()

  with open(args.events, "r", encoding="utf-8") as f:
    events = json.load(f)

  for i, event in enumerate(events, start=1):
    payload = {
      "event": event,
      "auto_reoptimize": args.auto_reoptimize,
    }
    res = requests.post(f"{args.base_url}/events", json=payload, timeout=20)
    print(f"[{i}] status={res.status_code} type={event.get('type')}")
    try:
      print(json.dumps(res.json(), indent=2))
    except Exception:
      print(res.text)


if __name__ == "__main__":
  main()

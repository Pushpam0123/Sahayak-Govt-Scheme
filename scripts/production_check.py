#!/usr/bin/env python3
"""Pre-flight launch and production readiness check for Sahayak."""

import os
import sys
import yaml


def check_corpus() -> bool:
    print("--> Checking corpus manifest (ingest/corpus.yaml)...")
    path = "ingest/corpus.yaml"
    if not os.path.exists(path):
        print(f"FAILED: {path} not found.")
        return False
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    schemes = data.get("schemes", [])
    if len(schemes) != 9:
        print(f"FAILED: Expected exactly 9 live-verified schemes, found {len(schemes)}.")
        return False
    for s in schemes:
        for req in ["id", "name", "state", "category", "official_url", "source_url", "benefit_amount", "required_documents"]:
            if req not in s or not s[req]:
                print(f"FAILED: Scheme '{s.get('id')}' missing required attribute '{req}'.")
                return False
    print(f"PASSED: Manifest contains {len(schemes)} fully documented verified schemes.")
    return True


def check_golden_set() -> bool:
    print("--> Checking evaluation golden set (eval/golden/golden_set.yaml)...")
    path = "eval/golden/golden_set.yaml"
    if not os.path.exists(path):
        print(f"FAILED: {path} not found.")
        return False
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    cases = data.get("cases", []) or data.get("queries", [])
    if len(cases) < 5:
        print(f"FAILED: Expected at least 5 authentic golden test cases, found {len(cases)}.")
        return False
    for q in cases:
        question_text = q.get("question", "") or q.get("query", "")
        answer_text = q.get("gold_answer", "") or q.get("expected_answer", "")
        if "synthetic" in question_text.lower() or "synthetic" in answer_text.lower():
            print(f"FAILED: Found synthetic artifacts in golden case '{q.get('scheme_id', 'unknown')}'.")
            return False
    print(f"PASSED: Golden set contains {len(cases)} authentic ground-truth cases.")
    return True


def check_config() -> bool:
    print("--> Checking API configuration settings...")
    try:
        from api.config import settings

        assert settings.ENVIRONMENT in ["development", "staging", "production"]
        assert settings.RATE_LIMIT_REQUESTS > 0
        assert len(settings.ALLOWED_ORIGINS) > 0
        print(f"PASSED: Config loaded with env '{settings.ENVIRONMENT}', origins: {settings.ALLOWED_ORIGINS}")
        return True
    except Exception as e:
        print(f"FAILED: Config check failed: {e}")
        return False


def main():
    print("=== Sahayak Production Readiness Check ===")
    c1 = check_corpus()
    c2 = check_golden_set()
    c3 = check_config()

    if c1 and c2 and c3:
        print("\nALL PRE-FLIGHT CHECKS PASSED (Ready for launch)")
        sys.exit(0)
    else:
        print("\nPRE-FLIGHT CHECKS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()

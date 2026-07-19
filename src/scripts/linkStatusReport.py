#!/usr/bin/env python3
import argparse
import os
import sqlite3


def parse_args():
    p = argparse.ArgumentParser(description="Report link_status/domain/verification_note stats from brief.db")
    p.add_argument("--db-path", default="", help="Path to sqlite db (default: $DB_PATH or data/brief.db)")
    p.add_argument("--top", type=int, default=20, help="Top N rows for domain/note tables")
    p.add_argument("--samples", type=int, default=10, help="Number of latest broken samples to print")
    return p.parse_args()


def pad_right(s, n):
    s = str(s or "")
    return s if len(s) >= n else s + (" " * (n - len(s)))


def summarize_note(note):
    s = str(note or "").strip()
    if not s:
        return "(empty)"
    return s if len(s) <= 140 else (s[:137] + "...")


def choose_best_url(row):
    return row["canonical_url"] or row["final_url"] or row["url_original"] or ""


def main():
    args = parse_args()
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    default_db = os.path.join(base, "data", "brief.db")
    db_path = args.db_path or os.environ.get("DB_PATH") or default_db

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) AS cnt FROM articles")
    total = int(cur.fetchone()["cnt"] or 0)

    cur.execute(
        """
        SELECT COALESCE(link_status, '') AS link_status, COUNT(*) AS cnt
        FROM articles
        GROUP BY COALESCE(link_status, '')
        ORDER BY cnt DESC
        """
    )
    by_status = cur.fetchall()

    cur.execute(
        """
        SELECT COALESCE(domain, '') AS domain, COALESCE(link_status, '') AS link_status, COUNT(*) AS cnt
        FROM articles
        WHERE link_status IN ('broken','unverified')
        GROUP BY COALESCE(domain, ''), COALESCE(link_status, '')
        ORDER BY cnt DESC
        LIMIT ?
        """,
        (max(1, args.top),),
    )
    bad_by_domain = cur.fetchall()

    cur.execute(
        """
        SELECT COALESCE(verification_note, '') AS verification_note, COALESCE(link_status, '') AS link_status, COUNT(*) AS cnt
        FROM articles
        WHERE link_status IN ('broken','unverified')
        GROUP BY COALESCE(verification_note, ''), COALESCE(link_status, '')
        ORDER BY cnt DESC
        LIMIT ?
        """,
        (max(1, args.top),),
    )
    bad_by_note = cur.fetchall()

    broken_samples = []
    if args.samples and args.samples > 0:
        cur.execute(
            """
            SELECT id, url_original, final_url, canonical_url, link_status, verification_note, domain
            FROM articles
            WHERE link_status='broken'
            ORDER BY id DESC
            LIMIT ?
            """,
            (max(0, args.samples),),
        )
        broken_samples = cur.fetchall()

    conn.close()

    print("")
    print("[link-status-report]")
    print("db_kind=sqlite (python fallback)")
    print(f"db_path={db_path}")
    print(f"total_articles={total}")

    print("")
    print("Counts By link_status")
    for r in by_status:
        status = r["link_status"] or "(empty)"
        print(f"{pad_right(status, 12)} {int(r['cnt'] or 0)}")

    print("")
    print(f"Top {args.top} Bad Domains (broken/unverified)")
    for r in bad_by_domain:
        status = r["link_status"] or "(empty)"
        domain = r["domain"] or "(empty)"
        print(f"{pad_right(status, 12)} {pad_right(domain, 32)} {int(r['cnt'] or 0)}")

    print("")
    print(f"Top {args.top} Bad Reasons (verification_note)")
    for r in bad_by_note:
        status = r["link_status"] or "(empty)"
        note = summarize_note(r["verification_note"])
        print(f"{pad_right(status, 12)} {pad_right(note, 80)} {int(r['cnt'] or 0)}")

    if args.samples and args.samples > 0:
        print("")
        print(f"Broken Samples (latest {args.samples})")
        for r in broken_samples:
            best = choose_best_url(r)
            note = summarize_note(r["verification_note"])
            domain = r["domain"] or ""
            print(f"- id={r['id']} domain={domain} note={note}")
            print(f"  url={best}")


if __name__ == "__main__":
    main()


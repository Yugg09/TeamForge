"""Weekly UTC availability arithmetic.

A window is (day 0..6, start_utc, end_utc) in minutes from midnight UTC. We flatten
the week into absolute minutes [0, 10080) so intersections are plain interval math.
Windows that cross midnight are split across days by the caller's data, and any
end <= start is dropped as malformed.
"""

MINUTES_PER_DAY = 1440
MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY

Interval = tuple[int, int]


def to_week_intervals(windows: list[dict]) -> list[Interval]:
    """Normalize windows into merged, sorted absolute-week intervals."""
    raw: list[Interval] = []
    for w in windows:
        day = int(w["day"]) % 7
        start = max(0, min(MINUTES_PER_DAY, int(w["start_utc"])))
        end = max(0, min(MINUTES_PER_DAY, int(w["end_utc"])))
        if end <= start:
            continue
        offset = day * MINUTES_PER_DAY
        raw.append((offset + start, offset + end))
    return merge(raw)


def merge(intervals: list[Interval]) -> list[Interval]:
    """Merge overlapping/adjacent intervals."""
    if not intervals:
        return []
    ordered = sorted(intervals)
    out = [ordered[0]]
    for start, end in ordered[1:]:
        last_start, last_end = out[-1]
        if start <= last_end:
            out[-1] = (last_start, max(last_end, end))
        else:
            out.append((start, end))
    return out


def intersect(a: list[Interval], b: list[Interval]) -> list[Interval]:
    """Intersection of two sorted, merged interval sets."""
    out: list[Interval] = []
    i = j = 0
    while i < len(a) and j < len(b):
        start = max(a[i][0], b[j][0])
        end = min(a[i][1], b[j][1])
        if start < end:
            out.append((start, end))
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return out


def intersect_all(sets: list[list[Interval]]) -> list[Interval]:
    """Intersection across every member's intervals. Empty input => empty."""
    if not sets:
        return []
    acc = sets[0]
    for other in sets[1:]:
        acc = intersect(acc, other)
        if not acc:
            return []
    return acc


def total_minutes(intervals: list[Interval]) -> int:
    return sum(end - start for start, end in intervals)


def overlap_minutes(sets: list[list[Interval]]) -> int:
    """Shared weekly minutes across all members. A lone member returns their own time."""
    return total_minutes(intersect_all(sets))

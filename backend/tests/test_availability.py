"""Unit tests for weekly UTC interval math (spec §5)."""

from app.services import availability as av


def w(day, start, end):
    return {"day": day, "start_utc": start, "end_utc": end}


def test_flattens_day_into_absolute_week_minutes():
    assert av.to_week_intervals([w(0, 0, 60)]) == [(0, 60)]
    assert av.to_week_intervals([w(2, 540, 600)]) == [(2 * 1440 + 540, 2 * 1440 + 600)]


def test_drops_malformed_windows():
    assert av.to_week_intervals([w(1, 600, 600), w(1, 700, 500)]) == []


def test_merges_overlapping_and_adjacent():
    assert av.to_week_intervals([w(0, 0, 100), w(0, 50, 200), w(0, 200, 250)]) == [(0, 250)]


def test_intersection_of_two_members():
    a = av.to_week_intervals([w(5, 540, 1020)])
    b = av.to_week_intervals([w(5, 600, 1080)])
    assert av.overlap_minutes([a, b]) == 420


def test_disjoint_members_have_zero_overlap():
    a = av.to_week_intervals([w(5, 0, 300)])
    b = av.to_week_intervals([w(5, 600, 900)])
    assert av.intersect(a, b) == []
    assert av.overlap_minutes([a, b]) == 0


def test_intersection_across_many_members_is_the_narrowest_common_slice():
    sets = [
        av.to_week_intervals([w(3, 480, 1200)]),
        av.to_week_intervals([w(3, 600, 1000)]),
        av.to_week_intervals([w(3, 660, 1440)]),
    ]
    assert av.intersect_all(sets) == [(3 * 1440 + 660, 3 * 1440 + 1000)]
    assert av.overlap_minutes(sets) == 340


def test_multi_day_overlap_accumulates():
    a = av.to_week_intervals([w(1, 540, 720), w(2, 540, 720)])
    b = av.to_week_intervals([w(1, 600, 720), w(2, 540, 660)])
    assert av.overlap_minutes([a, b]) == 120 + 120


def test_single_member_overlap_is_their_own_time():
    a = av.to_week_intervals([w(4, 540, 720)])
    assert av.overlap_minutes([a]) == 180


def test_empty_input():
    assert av.intersect_all([]) == []
    assert av.overlap_minutes([[], []]) == 0

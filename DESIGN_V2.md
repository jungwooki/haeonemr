# MPS EMR 2.0

The original gateway is preserved. Survey and MPS AI screens remain optimized for portrait iPad use. Clinical screens follow mps-mental: navigation, patients, records, consultation editor. Original reports follow the editor. Growth AI retains its external URL.

Only presentation code changes in records.js and workspace.js. Original backend, Code.gs, configuration, notes.js, questionnaire data and guide JSON remain identical. Original folder integrity verified against review/original-sha256.json (482 files).

Build: python3 tools/build.py && python3 tools/build_guides.py

Validation: 11 Python tests and 6 Node test files passed. Browser checks covered all 9 report types, three note fields, unsaved-change guard, record switching, patient-list return and editor reuse. Layout checked at 1440, 820 and 390 pixels. Local Pretendard font loaded.

Browser tests used synthetic in-memory patient records and mocked fetch. No live DB writes/deletes and no deployment performed. Screenshots in review contain synthetic data only.

## Compact clinical revision
Patient rails now use continuous borderless rows. Reduced section gaps and editor padding; note fields share a row on wide screens. Each consultation can be collapsed without removing its form nodes.

History groups by the exact timestamp instant (millisecond precision), not calendar date. Timestamp strings with equivalent timezones represent the same instant. Different times on the same day remain separate visits. Each visit expands into survey categories, then individual records. Same-category duplicates stay separately accessible using the original record index. Invalid timestamps remain separate unnumbered entries. Visit numbers are presentation-only chronological positions among the currently loaded records; no visit identifiers are written to the database.

Additional checks: exact timestamp grouping, category grouping, original index preservation, duplicate records, invalid dates, no mutation, inter-category navigation, same-day different-time selection, unsaved-note guards, fold state retention, and print expansion/restoration. Python 11 tests plus all 7 Node test files passed. Desktop/tablet/mobile screenshots use synthetic data only.

## Unified patient and record selection
Both states share patient row rendering, patient identity rendering, toolbar, column sizing and search control. Patient rows show only name, latest record date (Seoul), chart number, gender, birth date and completed age. The selected record opens its private note first on the right. No clinical database migration in this revision. Birthday-boundary tests and browser checks cover identical row markup, stationary columns, unsaved-note protection and no cross-patient note leakage. Clinical transition animations removed.

#!/usr/bin/env python3
"""
Fetch all exam data from Google Sheets and save to data.json
The SHEET_ID should be set via environment variable or secrets in GitHub Actions
"""

import os
import json
import urllib.request
import urllib.error
from urllib.parse import urlencode

def fetch_sheet_csv(sheet_id, sheet_name):
    """
    Fetch a single sheet as CSV from Google Sheets using the gviz endpoint.
    Returns the raw CSV string or None if fetch fails.
    """
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq"
    params = {"tqx": "out:csv", "sheet": sheet_name}
    full_url = f"{url}?{urlencode(params)}"

    try:
        with urllib.request.urlopen(full_url, timeout=10) as response:
            return response.read().decode('utf-8')
    except urllib.error.URLError as e:
        print(f"ERROR: Failed to fetch sheet '{sheet_name}': {e}")
        return None

def parse_csv(csv_string):
    """
    Parse CSV string into list of lists.
    Simple parser that handles quoted values and line breaks.
    """
    import csv
    import io
    reader = csv.reader(io.StringIO(csv_string))
    return list(reader)

def expected_subject_fragment(sheet_name):
    lower = sheet_name.lower()
    if 'ря' in lower:
        return 'русский'
    if 'общ' in lower:
        return 'обществ'
    if 'инф' in lower:
        return 'информ'
    if 'физ' in lower:
        return 'физик'
    if 'ист' in lower:
        return 'истор'
    if 'мат' in lower:
        return 'математ'
    return ''

def task_count_for_sheet(sheet_name):
    lower = sheet_name.lower()
    is_ege = 'егэ' in lower or 'база' in lower or 'проф' in lower or 'ист' in lower
    is_base = 'база' in lower
    is_prof = 'проф' in lower

    if 'инф' in lower:
        return 27 if is_ege else 16
    if 'ря' in lower:
        return 37 if is_ege else 23
    if 'мат' in lower:
        if is_base:
            return 21
        if is_prof:
            return 19
        return 19 if is_ege else 25
    if 'физ' in lower:
        return 26 if is_ege else 22
    if 'общ' in lower:
        return 25 if is_ege else 24
    if 'ист' in lower:
        return 21
    return 0

def secondary_score_index(sheet_name):
    lower = sheet_name.lower()
    task_start_col = 3

    if 'ря' in lower and 'егэ' in lower:
        return task_start_col + 37
    if 'физ' in lower and 'егэ' in lower:
        return task_start_col + 28
    if 'общ' in lower and 'егэ' in lower:
        return task_start_col + 29

    task_count = task_count_for_sheet(sheet_name)
    return task_start_col + task_count + 1 if task_count else -1

def sheet_has_expected_rows(sheet_name, rows):
    expected = expected_subject_fragment(sheet_name)
    is_math_sheet = expected == 'математ'
    score_idx = secondary_score_index(sheet_name)

    if not expected:
        return True

    has_expected_subject = False
    for row in rows[2:]:
        if len(row) <= 2:
            continue
        row_subject = (row[0] or '').lower()
        student = (row[2] or '').strip()
        if not student:
            continue
        if expected in row_subject:
            has_expected_subject = True
            if not is_math_sheet:
                return True
            if len(row) > score_idx and row[score_idx] and row[score_idx] not in ('#N/A', '#Н/Д'):
                return True

    return has_expected_subject and not is_math_sheet

def main():
    sheet_id = (os.environ.get('SHEET_ID') or '').strip()
    if not sheet_id:
        raise ValueError("SHEET_ID environment variable not set")

    # List of sheet names to fetch (must match the actual sheet tabs)
    sheet_names = [
        # Осень
        'ФИЗ ЕГЭ 21.09',
        'ФИЗ ОГЭ 21.09',
        'ИНФ ЕГЭ 21.09',
        'ИСТ 21.09',
        'РЯ ЕГЭ 28.09',
        'РЯ ОГЭ 28.09',
        'МАТ ОГЭ 05.10',
        'ИНФ ОГЭ 05.10',
        'Мат ПРОФ 12.10',
        'ИНФ ЕГЭ 19.10',
        'ОБЩ ЕГЭ 26.10',
        'ОБЩ ОГЭ 26.10',
        'Мат ПРОФ 02.11',
        'МАТ ОГЭ 09.11',
        'ИСТ 09.11',
        'ИНФ ЕГЭ 16.11',
        'ИНФ ОГЭ 16.11',
        'Мат ПРОФ 30.11',

        # Зима
        'МАТ ОГЭ 07.12',
        'ИСТ 07.12',
        'ФИЗ ЕГЭ 07.12',
        'ФИЗ ОГЭ 07.12',
        'ОБЩ ОГЭ 14.12',
        'ОБЩ ЕГЭ 14.12',
        'ИНФ ЕГЭ 14.12',
        'ИНФ ОГЭ 14.12',
        'РЯ ЕГЭ 21.12',
        'РЯ ОГЭ 21.12',
        'Мат ПРОФ 28.12',
        'МАТ ОГЭ 18.01',
        'ИСТ 18.01',
        'ФИЗ ЕГЭ 18.01',
        'ФИЗ ОГЭ 18.01',
        'РЯ ЕГЭ 25.01',
        'РЯ ОГЭ 25.01',
        'Мат ПРОФ 01.02',
        'Мат БАЗА 01.02',
        'ОБЩ ОГЭ 08.02',
        'ОБЩ ЕГЭ 08.02',
        'ИНФ ЕГЭ 08.02',
        'ИНФ ОГЭ 08.02',
        'МАТ ОГЭ 15.02',
        'ИСТ 15.02',
        'РЯ ЕГЭ 22.02',
        'РЯ ОГЭ 22.02',

        # Весна
        'Мат ПРОФ 01.03',
        'Мат БАЗА 01.03',
        'МАТ ОГЭ 15.03',
        'ИСТ 15.03',
        'ФИЗ ЕГЭ 15.03',
        'ФИЗ ОГЭ 15.03',
        'ОБЩ ОГЭ 22.03',
        'ОБЩ ЕГЭ 22.03',
        'ИНФ ЕГЭ 22.03',
        'ИНФ ОГЭ 22.03',
        'РЯ ЕГЭ 29.03',
        'РЯ ОГЭ 29.03',
        'Мат ПРОФ 05.04',
        'Мат БАЗА 12.04',
        'МАТ ОГЭ 12.04',
        'ИСТ 12.04',
        'ФИЗ ЕГЭ 12.04',
        'ФИЗ ОГЭ 12.04',
        'ОБЩ ОГЭ 19.04',
        'ОБЩ ЕГЭ 19.04',
        'ИНФ ЕГЭ 19.04',
        'ИНФ ОГЭ 19.04',
        'РЯ ЕГЭ 26.04',
        'РЯ ОГЭ 26.04',
        'Мат ПРОФ 03.05',
        'Мат БАЗА 03.05',
        'МАТ ОГЭ 10.05',
        'ИСТ 10.05',
        'ФИЗ ЕГЭ 10.05',
        'ФИЗ ОГЭ 10.05',
        'ОБЩ ОГЭ 17.05',
        'ОБЩ ЕГЭ 17.05',
        'ИНФ ЕГЭ 17.05',
        'ИНФ ОГЭ 17.05',
    ]

    data = {}
    for sheet_name in sheet_names:
        print(f"Fetching '{sheet_name}'...", end=' ')
        csv_string = fetch_sheet_csv(sheet_id, sheet_name)
        if csv_string:
            rows = parse_csv(csv_string)
            if not sheet_has_expected_rows(sheet_name, rows):
                print("⚠ skipped: returned sheet does not match name or has no math scores")
                continue
            data[sheet_name] = rows
            print(f"✓ ({len(rows)} rows)")
        else:
            print("✗ FAILED")

    # Write to data.json
    with open('frontend/public/data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Saved to data.json ({len(data)} sheets)")

if __name__ == '__main__':
    main()

"""Builds docs/pdf/explainer.html from the template, filling in REAL output captured from the running databases.

Run from the repo root (databases up and seeded):  python3 docs/pdf/build_html.py
Then print to PDF:                                 node frontend/scripts/build-explainer.mjs
"""
import html
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs'
FONTS = ROOT / 'frontend/node_modules'


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def psql(sql: str) -> str:
    out = subprocess.run(['docker', 'exec', '-i', 'oota-postgres', 'psql', '-U', 'oota', '-d', 'oota', '-P', 'pager=off'],
                         input=sql, capture_output=True, text=True)
    return (out.stdout + out.stderr).strip()


# ---- showcase queries: run each one now so the PDF shows live output
blocks = []
text = (DOCS / 'queries.sql').read_text()
for m in re.finditer(r'^-- (Q\d+)\s+(.+?)\n(.*?)(?=^-- Q\d+|\Z)', text, re.S | re.M):
    qid, title, sql = m.group(1), m.group(2).strip(), m.group(3).strip()
    out = psql(sql)
    blocks.append(f'''<article class="q glass">
  <h4><span class="qid">{qid}</span> {esc(title)}</h4>
  <pre class="sql">{esc(sql)}</pre>
  <pre class="out">{esc(out)}</pre>
</article>''')

# ---- index demo (captured by docs/index-demo.sql)
idx = (DOCS / 'generated/index-demo.out.txt').read_text()
plans = re.findall(r'QUERY PLAN\s*\n-+\n(.*?)\(\d+ rows\)', idx, re.S)
before, after = (plans + ['', ''])[:2]
t_before = re.search(r'Execution Time: ([\d.]+) ms', before)
t_after = re.search(r'Execution Time: ([\d.]+) ms', after)
speedup = f'{float(t_before.group(1)) / float(t_after.group(1)):.0f}×' if t_before and t_after else ''

# ---- transaction demo: show the statements and their results in a clean order
tx = (DOCS / 'generated/transaction-demo.out.txt').read_text()

# ---- mongo demo: strip the shell prompt noise
mg = (DOCS / 'generated/mongo-demo.out.txt').read_text()
mg = re.sub(r'rs0 \[direct: primary\] oota> ?(\| )*', '', mg)
mg = re.sub(r'\n{3,}', '\n\n', mg).strip()
mg_parts = re.split(r'^--- ', mg, flags=re.M)
mongo = {p.split('\n', 1)[0].strip(): p.split('\n', 1)[1].strip() if '\n' in p else '' for p in mg_parts if p.strip()}


def mpart(prefix: str) -> str:
    for k, v in mongo.items():
        if k.startswith(prefix):
            return esc(v)
    return ''


# ---- live counts for the "at a glance" numbers
counts = psql("""SELECT (SELECT COUNT(*) FROM restaurants)||','||(SELECT COUNT(*) FROM dishes)||','||(SELECT COUNT(*) FROM users)||','||
                 (SELECT COUNT(*) FROM restaurant_owners)||','||(SELECT COUNT(*) FROM orders)||','||(SELECT COUNT(*) FROM menu_categories);""")
nums = re.search(r'(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)', counts)
n_rest, n_dish, n_users, n_owners, n_orders, n_cats = nums.groups() if nums else ('?',) * 6
reviews = subprocess.run(['docker', 'exec', 'oota-mongo', 'mongosh', 'oota', '--quiet', '--eval', 'db.reviews.countDocuments()'],
                         capture_output=True, text=True).stdout.strip()

schema_sql = (ROOT / 'db/postgres/schema.sql').read_text()
realtime_sql = (ROOT / 'db/postgres/realtime.sql').read_text()

tpl = (DOCS / 'pdf/explainer.template.html').read_text()
fill = {
    'FONT_BRICOLAGE': (FONTS / '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2').as_uri(),
    'FONT_GEIST': (FONTS / '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2').as_uri(),
    'FONT_KANNADA': (FONTS / '@fontsource/noto-sans-kannada/files/noto-sans-kannada-kannada-600-normal.woff2').as_uri(),
    'SHOTS': (DOCS / 'pdf/img').as_uri(),  # downscaled copies of docs/screenshots
    'Q_BLOCKS': '\n'.join(blocks),
    'IDX_BEFORE': esc(before.rstrip()),
    'IDX_AFTER': esc(after.rstrip()),
    'T_BEFORE': t_before.group(1) if t_before else '?',
    'T_AFTER': t_after.group(1) if t_after else '?',
    'SPEEDUP': speedup,
    'TX_OUT': esc(tx),
    'MG_P1': mpart('Pipeline 1'),
    'MG_P2': mpart('Pipeline 2'),
    'MG_P3': mpart('Pipeline 3'),
    'MG_IDX': mpart('Indexes on reviews'),
    'MG_TTL': mpart('TTL index'),
    'MG_EXPLAIN': mpart('explain()'),
    'MG_UNIQUE': mpart('Unique index'),
    'SCHEMA_SQL': esc(schema_sql),
    'REALTIME_SQL': esc(realtime_sql),
    'N_REST': n_rest, 'N_DISH': n_dish, 'N_USERS': n_users, 'N_OWNERS': n_owners, 'N_ORDERS': n_orders, 'N_CATS': n_cats,
    'N_REVIEWS': reviews or '?',
}
for k, v in fill.items():
    tpl = tpl.replace('{{' + k + '}}', v)
left = re.findall(r'\{\{[A-Z_0-9]+\}\}', tpl)
assert not left, f'unfilled placeholders: {left}'
(DOCS / 'pdf/explainer.html').write_text(tpl)
print(f'wrote docs/pdf/explainer.html — {len(blocks)} queries, index speed-up {speedup}, {reviews} reviews')

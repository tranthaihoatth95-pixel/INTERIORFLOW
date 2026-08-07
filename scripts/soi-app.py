#!/usr/bin/env python3
"""scripts/soi-app.py — sinh MÀN HÌNH SOI APP (docs/SOI-APP.html) từ dữ liệu THẬT.
Chạy:  python3 scripts/soi-app.py    rồi mở docs/SOI-APP.html
Không đoán số nào — mọi con số đọc từ repo/DB tại thời điểm chạy."""
import os,re,json,subprocess,sqlite3,html
from datetime import datetime
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)

def walk(d,test=False):
    o=[]
    for r,_,fs in os.walk(d):
        if 'node_modules' in r or '.next' in r or '.worktrees' in r: continue
        for f in fs:
            if f.endswith(('.ts','.tsx')) and ('.test.' in f)==test: o.append(os.path.join(r,f))
    return o
def lines(fs):
    n=0
    for f in fs:
        try: n+=sum(1 for _ in open(f,encoding='utf-8',errors='ignore'))
        except: pass
    return n

# ── 1. quy mô + che phủ test
tiers=[]
for d in ['lib','components','app']:
    if os.path.isdir(d):
        s,t=walk(d),walk(d,True)
        sl,tl=lines(s),lines(t)
        tiers.append({'d':d,'nf':len(s),'sl':sl,'nt':len(t),'tl':tl,'cov':(tl*100//sl if sl else 0)})

# ── 2. sổ GAP
gapf='docs/GAP-IF.md'; rows=[l for l in open(gapf,encoding='utf-8') if l.startswith('| G-')] if os.path.exists(gapf) else []
import collections
by=collections.Counter(); red=collections.Counter(); st=collections.Counter()
for l in rows:
    m=re.match(r'\|\s*(G-[A-Z0-9]+)-\d+',l)
    if not m: continue
    g=m.group(1); by[g]+=1
    for k in ['🔴','✅','🟡','🟠','⚪']:
        if k in l: st[k]+=1; break
    if '🔴' in l: red[g]+=1

# ── 3. mảng ≥800 dòng, đối chiếu sổ
mang=[]
for base in ['lib','components']:
    if not os.path.isdir(base): continue
    for d in sorted(os.listdir(base)):
        p=f"{base}/{d}"
        if not os.path.isdir(p): continue
        s,t=walk(p),walk(p,True); sl=lines(s)
        if sl<800: continue
        ten=d.lower()
        g=len([x for x in rows if ten in x.lower()])
        mang.append({'p':p,'sl':sl,'nt':len(t),'tl':lines(t),'gap':g,
                     'ratio':(sl//g if g else 99999)})
mang.sort(key=lambda x:-x['ratio'])

# ── 4. DB
db={'ok':False}
try:
    c=sqlite3.connect('prisma/dev.db')
    q=lambda s: c.execute(s).fetchone()[0]
    db={'ok':True,'proj':q('select count(*) from Project'),'flow':q('select count(*) from Flow'),
        'orphan':q('select count(*) from Flow where projectId is null'),
        'nb':q("select count(*) from Project where name like '__nb:%'"),
        'spec':q('select count(*) from ProductSpec'),'asset':q('select count(*) from LibraryAsset')}
except Exception as e: db={'ok':False,'err':str(e)[:80]}

# ── 5. git
def sh(c):
    try: return subprocess.run(c,shell=True,capture_output=True,text=True,timeout=20).stdout.strip()
    except: return ''
git={'branch':sh('git branch --show-current'),'dirty':len(sh('git status --short').split('\n')) if sh('git status --short') else 0,
     'last':sh('git log --oneline -1')}

# ── 6. phiếu đang chờ
phieu=[]
dc='docs/00-DANG-CHO.md'
if os.path.exists(dc):
    for l in open(dc,encoding='utf-8'):
        m=re.match(r'\|\s*\*\*(P\d)\*\*[^|]*\|([^|]*)\|([^|]*)\|([^|]*)\|',l)
        if m: phieu.append({'id':m.group(1),'viec':m.group(2).strip(),'tt':m.group(3).strip(),'chan':m.group(4).strip()})

E=html.escape
def bar(pct,col):
    return f'<div style="height:5px;background:#e6e1da;border-radius:3px;overflow:hidden"><div style="height:100%;width:{min(pct,100)}%;background:{col}"></div></div>'

tot_red=st['🔴']; tot=len(rows)
html_out=f"""<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Soi app IF — {datetime.now():%d/%m %H:%M}</title>
<style>
*{{box-sizing:border-box}} body{{margin:0;padding:28px;background:#f4f1ec;color:#211e19;
font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}}
.w{{max-width:1180px;margin:0 auto}} h1{{font-size:22px;font-weight:650;margin:0 0 4px;line-height:1.4}}
.sub{{font-size:12.5px;color:#6b6660;margin-bottom:24px;line-height:1.6}}
.g{{display:grid;gap:12px;margin-bottom:14px}} .g4{{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.g2{{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}}
.c{{background:#faf8f4;border:1px solid #e0dbd4;border-radius:13px;padding:15px 16px}}
.k{{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#8a8580;line-height:1.5;margin-bottom:6px}}
.v{{font-size:26px;font-weight:650;line-height:1.25}} .u{{font-size:12px;color:#6b6660;line-height:1.6;margin-top:3px}}
table{{width:100%;border-collapse:collapse;font-size:12.5px}}
th{{text-align:left;font-weight:600;color:#8a8580;font-size:11px;letter-spacing:.05em;
text-transform:uppercase;padding:0 8px 7px 0;line-height:1.5}}
td{{padding:6px 8px 6px 0;border-top:1px solid #eae5de;line-height:1.6;vertical-align:top}}
.r{{color:#c0392b;font-weight:600}} .ok{{color:#2d7a4f;font-weight:600}} .w2{{color:#b8873a;font-weight:600}}
code{{background:#efece7;padding:1px 5px;border-radius:4px;font-size:11.5px;font-family:ui-monospace,monospace}}
.h{{font-size:15px;font-weight:650;margin:22px 0 10px;line-height:1.5}}
.f{{font-size:11.5px;color:#8a8580;margin-top:26px;padding-top:14px;border-top:1px solid #e0dbd4;line-height:1.7}}
</style></head><body><div class="w">

<h1>Soi app InteriorFlow</h1>
<div class="sub">Sinh lúc {datetime.now():%d/%m/%Y %H:%M} · mọi con số đọc từ repo/DB tại thời điểm chạy, không lấy từ sổ.<br>
Chạy lại: <code>python3 scripts/soi-app.py</code></div>

<div class="g g4">
  <div class="c"><div class="k">Sổ GAP</div><div class="v {'r' if tot_red>60 else ''}">{tot_red}<span style="font-size:15px;color:#8a8580;font-weight:400"> đỏ / {tot}</span></div>
    <div class="u">✅{st['✅']} · 🟡{st['🟡']} · 🟠{st['🟠']} · ⚪{st['⚪']}</div></div>
  <div class="c"><div class="k">Dòng code</div><div class="v">{sum(t['sl'] for t in tiers):,}</div>
    <div class="u">{sum(t['nf'] for t in tiers)} file nguồn</div></div>
  <div class="c"><div class="k">Flow mồ côi</div>
    <div class="v {'r' if db.get('orphan',0) else 'ok'}">{db.get('orphan','?')}<span style="font-size:15px;color:#8a8580;font-weight:400"> / {db.get('flow','?')}</span></div>
    <div class="u">{db.get('proj','?')} dự án · {db.get('nb','?')} rác <code>__nb:</code></div></div>
  <div class="c"><div class="k">Git</div><div class="v" style="font-size:19px">{E(git['branch'])}</div>
    <div class="u">{git['dirty']} file đang sửa</div></div>
</div>

<div class="h">Che phủ test theo tầng</div>
<div class="g g4">"""
for t in tiers:
    col='#c0392b' if t['cov']<10 else ('#b8873a' if t['cov']<40 else '#2d7a4f')
    html_out+=f"""<div class="c"><div class="k">{t['d']}/</div>
    <div class="v" style="color:{col}">{t['cov']}%</div>
    <div class="u">{t['sl']:,} dòng nguồn · {t['tl']:,} dòng test<br>{t['nt']} file test / {t['nf']} file</div>
    <div style="margin-top:8px">{bar(t['cov'],col)}</div></div>"""
html_out+="</div>"

html_out+=f"""<div class="h">Mảng đáng ngờ — tỷ lệ dòng code trên 1 dòng sổ</div>
<div class="c"><div style="font-size:11.5px;color:#6b6660;margin-bottom:10px;line-height:1.6">
Ngưỡng §0x: <b>trên 2.000 dòng cho 1 dòng sổ ⇒ mảng đó chưa ai soi</b>, không phải đã ổn. 0 test ở lớp giao diện là chỉ báo thứ hai.</div>
<table><tr><th>Mảng</th><th>Dòng</th><th>Test</th><th>Dòng sổ</th><th>Tỷ lệ</th></tr>"""
for m in mang[:14]:
    rr='r' if m['ratio']>2000 else ('w2' if m['ratio']>800 else '')
    tt='r' if m['nt']==0 else 'ok'
    rt='—' if m['ratio']>=99999 else f"{m['ratio']:,}:1"
    html_out+=f"""<tr><td><code>{m['p']}</code></td><td>{m['sl']:,}</td>
    <td class="{tt}">{m['nt'] or '0'}</td><td>{m['gap']}</td><td class="{rr}">{rt}</td></tr>"""
html_out+="</table></div>"

if phieu:
    html_out+='<div class="h">Phiếu</div><div class="c"><table><tr><th>Phiếu</th><th>Việc</th><th>Trạng thái</th><th>Chặn bởi</th></tr>'
    for p in phieu:
        cl='ok' if '✅' in p['tt'] else ('w2' if 'CHỜ' in p['tt'].upper() else '')
        html_out+=f"<tr><td><b>{E(p['id'])}</b></td><td>{E(p['viec'][:44])}</td><td class='{cl}'>{E(p['tt'])}</td><td style='color:#8a8580'>{E(p['chan'][:40])}</td></tr>"
    html_out+='</table></div>'

html_out+=f"""<div class="h">Sổ GAP theo mảng</div><div class="c"><table><tr><th>Mã</th><th>Đỏ</th><th>Tổng</th><th></th></tr>"""
for g,n in by.most_common():
    pct=red[g]*100//n if n else 0
    html_out+=f"""<tr><td><code>{g}</code></td><td class="{'r' if red[g] else 'ok'}">{red[g]}</td><td>{n}</td>
    <td style="width:180px">{bar(pct,'#c0392b' if pct>60 else '#b8873a')}</td></tr>"""
html_out+=f"""</table></div>

<div class="f">
<b>Không đo được ở đây</b> — cần mở app thật: hiệu năng lúc chạy · bố cục ở màn hẹp · thao tác nào chậm khó chịu.<br>
<b>Nguồn:</b> <code>docs/GAP-IF.md</code> · <code>docs/00-DANG-CHO.md</code> · <code>prisma/dev.db</code> · <code>git</code><br>
<b>Git gần nhất:</b> {E(git['last'][:90])}
</div></div></body></html>"""
open('docs/SOI-APP.html','w',encoding='utf-8').write(html_out)
print(f"✔ docs/SOI-APP.html — {len(html_out)//1024} KB")
print(f"  {tot_red} đỏ/{tot} · {sum(t['sl'] for t in tiers):,} dòng · flow mồ côi {db.get('orphan','?')}/{db.get('flow','?')}")

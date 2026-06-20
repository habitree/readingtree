#!/usr/bin/env python3
"""Habitree 자연스러운 고퀄 트리 생성기 v2 — 10레벨, 투명배경, 1024px"""
import math, random, os
TAU=math.tau

# 톤별 잎 팔레트
GREEN = {
 "base":["#2E7D52","#347E52","#3C8F5E","#46A06A","#52A972"],
 "dark":["#215F3F","#276B46","#2E7D52"],
 "light":["#7CC487","#93D196","#B7E4A8"],
 "hi":"#CBEFB8",
 "grad_top":"#7FC68A","grad_mid":"#46A06A","grad_bot":"#2C7A4F",
}
GOLD = {
 "base":["#6E8B3D","#86A23E","#9FAF3E","#C9A227","#D9B53A"],
 "dark":["#5E7330","#6E8B3D","#7E8F37"],
 "light":["#E7D06A","#F2DE7C","#F6E58C"],
 "hi":"#FBF0B8",
 "grad_top":"#EAD46A","grad_mid":"#C9A227","grad_bot":"#8A7A2E",
}

def defs():
    g=GREEN; go=GOLD
    return f'''
  <defs>
    <radialGradient id="baseG" cx="40%" cy="30%" r="78%">
      <stop offset="0%" stop-color="{g['grad_top']}"/>
      <stop offset="55%" stop-color="{g['grad_mid']}"/>
      <stop offset="100%" stop-color="{g['grad_bot']}"/>
    </radialGradient>
    <radialGradient id="baseGold" cx="42%" cy="30%" r="78%">
      <stop offset="0%" stop-color="{go['grad_top']}"/>
      <stop offset="55%" stop-color="{go['grad_mid']}"/>
      <stop offset="100%" stop-color="{go['grad_bot']}"/>
    </radialGradient>
    <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B5894F"/>
      <stop offset="45%" stop-color="#8A5E38"/>
      <stop offset="100%" stop-color="#5E3F26"/>
    </linearGradient>
    <radialGradient id="soil" cx="50%" cy="36%" r="68%">
      <stop offset="0%" stop-color="#946740"/>
      <stop offset="100%" stop-color="#5A3A24"/>
    </radialGradient>
    <radialGradient id="dapple" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{g['hi']}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="{g['hi']}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.0"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.0"/>
    </radialGradient>
    <filter id="cshadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#143526" flood-opacity="0.30"/>
    </filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>'''

def jitter(col_hex, d):
    # 살짝 색 흔들기
    r=int(col_hex[1:3],16); g=int(col_hex[3:5],16); b=int(col_hex[5:7],16)
    f=lambda v:max(0,min(255,int(v+random.uniform(-d,d))))
    return f'#{f(r):02x}{f(g):02x}{f(b):02x}'

def ground(scale=1.0):
    rx=int(225*scale)
    out=[f'<ellipse cx="512" cy="906" rx="{int(255*scale)}" ry="46" fill="#123121" opacity="0.30" filter="url(#soft)"/>',
         f'<ellipse cx="512" cy="874" rx="{rx}" ry="60" fill="url(#soil)"/>',
         f'<ellipse cx="512" cy="860" rx="{rx}" ry="48" fill="#9A6C44" opacity="0.40"/>']
    random.seed(7)
    for i in range(int(26*scale)):
        x=512-rx+ i*(2*rx/(26*scale)) + random.uniform(-5,5)
        base=858+math.sin(i*0.7)*7; h=random.uniform(14,30); w=random.uniform(4,7); lean=random.uniform(-6,6)
        out.append(f'<path d="M{x:.0f} {base:.0f} q {lean:.0f} -{h*0.6:.0f} {lean*0.4:.0f} -{h:.0f} q {w:.0f} {h*0.55:.0f} {w*0.3:.0f} {h:.0f} z" fill="{jitter("#5FB06A",18)}" opacity="0.9"/>')
    for i in range(6):
        x=512-rx*0.6+i*rx*0.24+random.uniform(-8,8); y=884+random.uniform(-6,8)
        out.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{random.uniform(6,11):.0f}" ry="{random.uniform(3,6):.0f}" fill="#7a5a3e" opacity="0.55"/>')
    return "\n  ".join(out)

def trunk(top_y, base_w, top_w, branches=None):
    bx=512; by=874; hb=base_w/2; ht=top_w/2
    d=(f'M{bx-hb:.0f} {by} '
       f'C {bx-hb*0.72:.0f} {by-130:.0f} {bx-ht:.0f} {top_y+100:.0f} {bx-ht:.0f} {top_y:.0f} '
       f'L {bx+ht:.0f} {top_y:.0f} '
       f'C {bx+ht:.0f} {top_y+100:.0f} {bx+hb*0.72:.0f} {by-130:.0f} {bx+hb:.0f} {by} '
       f'Q {bx:.0f} {by+16:.0f} {bx-hb:.0f} {by} Z')
    p=[f'<path d="{d}" fill="url(#trunk)"/>']
    # 뿌리 플레어
    p.append(f'<path d="M{bx-hb:.0f} {by} q -38 -4 -70 20 q 34 -2 70 -8 z" fill="url(#trunk)"/>')
    p.append(f'<path d="M{bx+hb:.0f} {by} q 38 -4 70 20 q -34 -2 -70 -8 z" fill="url(#trunk)"/>')
    # 바크 음영/하이라이트
    p.append(f'<path d="M{bx-ht*0.4:.0f} {top_y+20:.0f} C {bx-hb*0.28:.0f} {by-170:.0f} {bx-hb*0.32:.0f} {by-60:.0f} {bx-hb*0.5:.0f} {by-8:.0f}" stroke="#C49A60" stroke-width="{max(4,top_w*0.16):.0f}" fill="none" opacity="0.5" stroke-linecap="round"/>')
    p.append(f'<path d="M{bx+ht*0.45:.0f} {top_y+40:.0f} C {bx+hb*0.3:.0f} {by-160:.0f} {bx+hb*0.34:.0f} {by-60:.0f} {bx+hb*0.5:.0f} {by-8:.0f}" stroke="#4E331F" stroke-width="{max(3,top_w*0.12):.0f}" fill="none" opacity="0.4" stroke-linecap="round"/>')
    if branches:
        for (ang,ln,y) in branches:
            ex=bx+math.cos(ang)*ln; ey=y-math.sin(ang)*ln
            p.append(f'<path d="M{bx:.0f} {y:.0f} Q {bx+math.cos(ang)*ln*0.45:.0f} {y-math.sin(ang)*ln*0.5:.0f} {ex:.0f} {ey:.0f}" stroke="url(#trunk)" stroke-width="{base_w*0.18:.0f}" fill="none" stroke-linecap="round"/>')
    return "\n  ".join(p)

def canopy(cx, cy, rx, ry, density, seed, gold=False):
    random.seed(seed)
    PAL = GOLD if gold else GREEN
    baseid = "baseGold" if gold else "baseG"
    out=[]
    # 1) 바탕 덩어리 (실루엣 + 드롭섀도)
    out.append(f'<g filter="url(#cshadow)"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#{baseid})"/></g>')
    # 점 생성
    pts=[]
    for _ in range(density):
        a=random.uniform(0,TAU); rr=math.sqrt(random.random())
        x=cx+math.cos(a)*rx*rr; y=cy+math.sin(a)*ry*rr
        pts.append((x,y))
    # 2) 하단 음영 클럼프 (깊이)
    for (x,y) in pts:
        if y>cy-ry*0.1:
            rad=random.uniform(rx*0.11,rx*0.2)
            out.append(f'<circle cx="{x:.0f}" cy="{y+6:.0f}" r="{rad:.0f}" fill="{jitter(random.choice(PAL["dark"]),14)}" opacity="0.55"/>')
    # 3) 본 텍스처 (뒤→앞, 좌상단일수록 밝게)
    for (x,y) in sorted(pts, key=lambda p:p[1]):
        rad=random.uniform(rx*0.12,rx*0.22)
        lit = (1 if x<cx else 0)+(1 if y<cy else 0)
        if lit==2: pool=PAL["light"]+PAL["base"]
        elif lit==1: pool=PAL["base"]
        else: pool=PAL["base"]+PAL["dark"]
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rad:.0f}" fill="{jitter(random.choice(pool),16)}" opacity="0.92"/>')
    # 4) 스캘럽 림 (윤곽 자글자글)
    for k in range(int(density*0.9)):
        a=random.uniform(0,TAU)
        x=cx+math.cos(a)*rx*0.98; y=cy+math.sin(a)*ry*0.96
        rad=random.uniform(rx*0.07,rx*0.13)
        top = y<cy
        col = random.choice(PAL["light"]) if (top and x<cx) else random.choice(PAL["base"] if top else PAL["dark"])
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rad:.0f}" fill="{jitter(col,14)}" opacity="0.9"/>')
    # 5) 라이트 대플 (좌상단, 부드럽게)
    for _ in range(max(4,density//6)):
        x=cx+random.uniform(-rx*0.6,rx*0.1); y=cy+random.uniform(-ry*0.7,-ry*0.05)
        rad=random.uniform(rx*0.08,rx*0.16)
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rad:.0f}" fill="url(#dapple)" opacity="0.55"/>')
    # 6) 하단 인너 섀도 (접지감)
    out.append(f'<ellipse cx="{cx}" cy="{cy+ry*0.55:.0f}" rx="{rx*0.8:.0f}" ry="{ry*0.3:.0f}" fill="#1d4a31" opacity="0.22" filter="url(#soft)"/>')
    return "\n  ".join(out)

def blossoms(cx,cy,rx,ry,n,seed):
    random.seed(seed+50); out=[]
    for _ in range(n):
        a=random.uniform(0,TAU); rr=math.sqrt(random.random())
        x=cx+math.cos(a)*rx*rr*0.92; y=cy+math.sin(a)*ry*rr*0.92; s=random.uniform(7,12)
        pet="".join(f'<circle cx="{x+math.cos(t)*s:.0f}" cy="{y+math.sin(t)*s:.0f}" r="{s*0.7:.0f}" fill="#F8B5D2" opacity="0.95"/>' for t in [i*TAU/5 for i in range(5)])
        out.append(pet+f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s*0.55:.0f}" fill="#FCE7A0"/>')
    return "\n  ".join(out)

def fruits(cx,cy,rx,ry,n,seed,color="#E8572A",hi="#F7A06A"):
    random.seed(seed+60); out=[]
    for _ in range(n):
        a=random.uniform(0,TAU); rr=math.sqrt(random.random())
        x=cx+math.cos(a)*rx*rr*0.9; y=cy+math.sin(a)*ry*rr*0.86; s=random.uniform(12,17)
        out.append(f'<circle cx="{x:.0f}" cy="{y+s*0.9:.0f}" r="{s:.0f}" fill="#1d4a31" opacity="0.18"/>'
                   f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s:.0f}" fill="{color}"/>'
                   f'<circle cx="{x-s*0.32:.0f}" cy="{y-s*0.34:.0f}" r="{s*0.32:.0f}" fill="{hi}" opacity="0.85"/>')
    return "\n  ".join(out)

def sparkles(cx,cy,rx,ry,n,seed):
    random.seed(seed+70); out=[]
    for _ in range(n):
        a=random.uniform(0,TAU); rr=random.uniform(0.6,1.15)
        x=cx+math.cos(a)*rx*rr; y=cy+math.sin(a)*ry*rr; s=random.uniform(7,15)
        out.append(f'<path d="M{x:.0f} {y-s:.0f} L{x+s*0.26:.0f} {y:.0f} L{x:.0f} {y+s:.0f} L{x-s*0.26:.0f} {y:.0f} Z" fill="#FFF7D6"/>')
    return "\n  ".join(out)

def aura(cx,cy,r,color,op=0.5):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" opacity="{op}" filter="url(#glow)"/>'

def sprout(stage):
    cx=512
    if stage==1:
        return f'''
  <path d="M{cx-5} 856 Q {cx} 786 {cx} 742" stroke="url(#trunk)" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M{cx} 760 C {cx-140} 742 {cx-170} 648 {cx-66} 660 C {cx-38} 704 {cx-12} 742 {cx} 764 Z" fill="url(#baseG)"/>
  <path d="M{cx} 760 C {cx+140} 742 {cx+170} 648 {cx+66} 660 C {cx+38} 704 {cx+12} 742 {cx} 764 Z" fill="url(#baseG)"/>
  <ellipse cx="{cx-52}" cy="700" rx="30" ry="20" fill="url(#dapple)" opacity="0.6"/>
  <ellipse cx="{cx}" cy="836" rx="30" ry="19" fill="#4E331F" opacity="0.5" transform="rotate(-15 {cx} 836)"/>'''
    else:
        body=f'''
  <path d="M{cx-6} 858 Q {cx} 720 {cx} 648" stroke="url(#trunk)" stroke-width="22" fill="none" stroke-linecap="round"/>'''
        body+="\n  "+canopy(cx,600,150,130,26,seed=2)
        # 작은 떡잎 2장 하단
        body+=f'''
  <path d="M{cx} 752 C {cx-120} 740 {cx-150} 664 {cx-58} 672 C {cx-34} 712 {cx-10} 742 {cx} 756 Z" fill="url(#baseG)"/>
  <path d="M{cx} 752 C {cx+120} 740 {cx+150} 664 {cx+58} 672 C {cx+34} 712 {cx+10} 742 {cx} 756 Z" fill="url(#baseG)"/>'''
        return body


def trunk_at(bx, by, top_y, base_w, top_w, branches=None):
    hb=base_w/2; ht=top_w/2
    d=(f'M{bx-hb:.0f} {by} '
       f'C {bx-hb*0.72:.0f} {by-130:.0f} {bx-ht:.0f} {top_y+100:.0f} {bx-ht:.0f} {top_y:.0f} '
       f'L {bx+ht:.0f} {top_y:.0f} '
       f'C {bx+ht:.0f} {top_y+100:.0f} {bx+hb*0.72:.0f} {by-130:.0f} {bx+hb:.0f} {by} '
       f'Q {bx:.0f} {by+16:.0f} {bx-hb:.0f} {by} Z')
    p=[f'<path d="{d}" fill="url(#trunk)"/>']
    p.append(f'<path d="M{bx-hb:.0f} {by} q -38 -4 -70 20 q 34 -2 70 -8 z" fill="url(#trunk)"/>')
    p.append(f'<path d="M{bx+hb:.0f} {by} q 38 -4 70 20 q -34 -2 -70 -8 z" fill="url(#trunk)"/>')
    p.append(f'<path d="M{bx-ht*0.4:.0f} {top_y+20:.0f} C {bx-hb*0.28:.0f} {by-170:.0f} {bx-hb*0.32:.0f} {by-60:.0f} {bx-hb*0.5:.0f} {by-8:.0f}" stroke="#C49A60" stroke-width="{max(4,top_w*0.16):.0f}" fill="none" opacity="0.5" stroke-linecap="round"/>')
    if branches:
        for (ang,ln,y) in branches:
            ex=bx+math.cos(ang)*ln; ey=y-math.sin(ang)*ln
            p.append(f'<path d="M{bx:.0f} {y:.0f} Q {bx+math.cos(ang)*ln*0.45:.0f} {y-math.sin(ang)*ln*0.5:.0f} {ex:.0f} {ey:.0f}" stroke="url(#trunk)" stroke-width="{base_w*0.18:.0f}" fill="none" stroke-linecap="round"/>')
    return "\n  ".join(p)

# ---- 시그니처 요소들 ----
def bird(x,y,s,col="#E3EAEF"):
    return (f'<path d="M{x-s:.0f} {y:.0f} Q {x-s*0.4:.0f} {y-s*0.7:.0f} {x:.0f} {y:.0f} Q {x+s*0.4:.0f} {y-s*0.7:.0f} {x+s:.0f} {y:.0f}" '
            f'stroke="{col}" stroke-width="{max(3,s*0.22):.0f}" fill="none" stroke-linecap="round"/>')

def butterfly(x,y,s,c1="#F4A0C8",c2="#F7C8DD"):
    return (f'<g transform="rotate({__import__("random").uniform(-15,15):.0f} {x} {y})">'
            f'<ellipse cx="{x-s*0.5:.0f}" cy="{y-s*0.3:.0f}" rx="{s*0.55:.0f}" ry="{s*0.7:.0f}" fill="{c1}"/>'
            f'<ellipse cx="{x+s*0.5:.0f}" cy="{y-s*0.3:.0f}" rx="{s*0.55:.0f}" ry="{s*0.7:.0f}" fill="{c1}"/>'
            f'<ellipse cx="{x-s*0.45:.0f}" cy="{y+s*0.45:.0f}" rx="{s*0.42:.0f}" ry="{s*0.5:.0f}" fill="{c2}"/>'
            f'<ellipse cx="{x+s*0.45:.0f}" cy="{y+s*0.45:.0f}" rx="{s*0.42:.0f}" ry="{s*0.5:.0f}" fill="{c2}"/>'
            f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{s*0.12:.0f}" ry="{s*0.85:.0f}" fill="#4a3a2a"/></g>')

def nest(x,y):
    return (f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="34" ry="18" fill="#6e4a2b"/>'
            f'<ellipse cx="{x:.0f}" cy="{y-4:.0f}" rx="30" ry="13" fill="#4e331f"/>'
            f'<circle cx="{x-9:.0f}" cy="{y-4:.0f}" r="7" fill="#dff0e8"/>'
            f'<circle cx="{x+2:.0f}" cy="{y-6:.0f}" r="7" fill="#dff0e8"/>'
            f'<circle cx="{x+12:.0f}" cy="{y-3:.0f}" r="7" fill="#dff0e8"/>')

def dewdrop(x,y,s=12):
    return (f'<path d="M{x:.0f} {y-s:.0f} C {x+s*0.9:.0f} {y:.0f} {x+s*0.5:.0f} {y+s:.0f} {x:.0f} {y+s:.0f} '
            f'C {x-s*0.5:.0f} {y+s:.0f} {x-s*0.9:.0f} {y:.0f} {x:.0f} {y-s:.0f} Z" fill="#bfe3ff" opacity="0.85"/>'
            f'<circle cx="{x-s*0.25:.0f}" cy="{y:.0f}" r="{s*0.22:.0f}" fill="#ffffff" opacity="0.9"/>')

def stake(bx, top, bottom):
    return (f'<rect x="{bx+18:.0f}" y="{top:.0f}" width="10" height="{bottom-top:.0f}" rx="4" fill="#b08a55"/>'
            f'<rect x="{bx+14:.0f}" y="{(top+bottom)/2-6:.0f}" width="22" height="7" rx="3" fill="#8a6a3e"/>')

def basket(x,y):
    return (f'<path d="M{x-46:.0f} {y:.0f} L{x-38:.0f} {y+42:.0f} Q {x:.0f} {y+52:.0f} {x+38:.0f} {y+42:.0f} L{x+46:.0f} {y:.0f} Z" fill="#a9763f"/>'
            f'<path d="M{x-46:.0f} {y:.0f} Q {x:.0f} {y-14:.0f} {x+46:.0f} {y:.0f}" stroke="#7c4f28" stroke-width="6" fill="none"/>'
            f'<ellipse cx="{x-16:.0f}" cy="{y-2:.0f}" rx="14" ry="12" fill="#E8572A"/>'
            f'<ellipse cx="{x+10:.0f}" cy="{y-4:.0f}" rx="14" ry="12" fill="#E8572A"/>'
            f'<ellipse cx="{x-3:.0f}" cy="{y+6:.0f}" rx="13" ry="11" fill="#F27A45"/>')

def sun(x,y,r):
    rays="".join(f'<line x1="{x+math.cos(a)*r*1.3:.0f}" y1="{y+math.sin(a)*r*1.3:.0f}" x2="{x+math.cos(a)*r*1.7:.0f}" y2="{y+math.sin(a)*r*1.7:.0f}" stroke="#F8E08A" stroke-width="7" stroke-linecap="round" opacity="0.8"/>' for a in [i*math.tau/12 for i in range(12)])
    return (f'<circle cx="{x}" cy="{y}" r="{r*2.0:.0f}" fill="#FBEEA8" opacity="0.35" filter="url(#glow)"/>'
            + rays + f'<circle cx="{x}" cy="{y}" r="{r:.0f}" fill="#F8DC72"/>')

def firefly(x,y):
    return (f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="#FFF6C0" opacity="0.5" filter="url(#soft)"/>'
            f'<circle cx="{x:.0f}" cy="{y:.0f}" r="4.5" fill="#FFFAD6"/>')

def hill():
    return '<ellipse cx="512" cy="906" rx="380" ry="86" fill="#3C7A4E"/><ellipse cx="512" cy="892" rx="380" ry="70" fill="#4C9460" opacity="0.5"/>'

def build(level):
    L=level
    body=defs()+"\n"
    if L in (9,10):
        body+=hill()+"\n"
    body+=ground(min(1.18, 0.85+0.04*L))+"\n"
    import random as _r
    if L==1:
        body+=sprout(1)
        body+="\n  "+dewdrop(512+40,690,11)
    elif L==2:
        body+=sprout(2)
        body+="\n  "+dewdrop(512+58,560,12)
    elif L==3:
        body+=trunk(560,70,30)+"\n"+canopy(512,500,150,140,32,seed=3)
        body+="\n  "+stake(512,548,800)
    elif L==4:
        # 가늘고 키 큰 묘목(세로 오벌) — 뚜렷이 다른 실루엣
        body+=trunk(470,80,30)+"\n"+canopy(512,430,150,200,46,seed=4)
        body+="\n  "+butterfly(660,360,20)
    elif L==5:
        # 첫 '진짜 나무' 마일스톤 — 둥글고 풍성 + 새 2마리
        body+=trunk(450,98,38,[(0.55,120,560),(math.pi-0.55,120,560)])+"\n"+canopy(512,415,225,205,62,seed=5)
        body+="\n  "+bird(345,150,34)+"\n  "+bird(455,120,26)
    elif L==6:
        # 넓게 퍼진 수관(가로>세로) + 둥지
        body+=trunk(440,112,42,[(0.45,165,540),(math.pi-0.45,165,540)])+"\n"+canopy(512,420,285,205,82,seed=6)
        body+="\n  "+nest(648,470)
    elif L==7:
        body=defs()+"\n"+ground(1.1)+"\n"+aura(512,395,300,"#f472b6",0.30)+"\n"
        body+=trunk(420,114,44,[(0.5,160,535),(math.pi-0.5,160,535)])+"\n"+canopy(512,395,265,238,82,seed=7)
        body+="\n  "+blossoms(512,395,255,225,30,seed=7)
        # 떨어지는 꽃잎 + 나비
        for i,(px,py) in enumerate([(360,560),(620,600),(470,640),(700,520)]):
            body+=f'\n  <ellipse cx="{px}" cy="{py}" rx="9" ry="6" fill="#F8B5D2" opacity="0.85" transform="rotate({i*40} {px} {py})"/>'
        body+="\n  "+butterfly(330,330,22)+"\n  "+butterfly(710,300,18,"#F7C8DD","#FBE0EC")
    elif L==8:
        body=defs()+"\n"+ground(1.1)+"\n"+aura(512,392,305,"#f97316",0.28)+"\n"
        body+=trunk(415,118,46,[(0.5,165,530),(math.pi-0.5,165,530)])+"\n"+canopy(512,392,270,242,86,seed=8)
        body+="\n  "+fruits(512,392,250,220,18,seed=8)
        # 수확 바구니 + 떨어진 열매
        body+="\n  "+basket(360,812)
        body+='\n  <ellipse cx="600" cy="850" rx="13" ry="11" fill="#E8572A"/><ellipse cx="636" cy="858" rx="12" ry="10" fill="#F27A45"/>'
    elif L==9:
        body=defs()+"\n"+hill()+"\n"+ground(1.18)+"\n"+aura(512,350,340,"#2dd4bf",0.34)+"\n"
        body+=trunk(330,140,52,[(0.42,200,510),(math.pi-0.42,200,510),(0.95,140,440),(math.pi-0.95,140,440)])+"\n"
        body+=canopy(512,330,300,275,112,seed=9)
        # 거대수 주위를 도는 새들
        body+="\n  "+bird(300,210,30)+"\n  "+bird(380,170,22)+"\n  "+bird(720,200,26)+"\n  "+bird(660,250,18)
    elif L==10:
        # 황금'숲' — 단일 나무가 아니라 숲 풍경(주 나무 + 좌우 나무 + 태양 + 반딧불)
        body=defs()+"\n"+hill()+"\n"+ground(1.2)+"\n"+aura(512,360,380,"#fbbf24",0.42)+"\n"
        body+=sun(800,210,46)+"\n"
        # 뒤쪽 좌우 작은 황금나무
        body+=trunk_at(300,886,560,72,30)+"\n"+canopy(300,520,140,150,40,seed=101,gold=True)+"\n"
        body+=trunk_at(730,886,575,66,28)+"\n"+canopy(730,540,128,138,36,seed=102,gold=True)+"\n"
        # 중앙 주 나무
        body+=trunk(360,134,50,[(0.45,190,520),(math.pi-0.45,190,520),(0.95,135,450),(math.pi-0.95,135,450)])+"\n"
        body+=canopy(512,360,295,260,110,seed=10,gold=True)
        body+="\n  "+fruits(512,360,270,230,12,seed=10,color="#E7B62E",hi="#F8E69A")
        # 반딧불 + 반짝임
        for (fx,fy) in [(430,640),(600,660),(360,560),(660,600),(512,700)]:
            body+="\n  "+firefly(fx,fy)
        body+="\n  "+sparkles(512,360,320,285,12,seed=10)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{body}\n</svg>'

OUT=os.path.dirname(os.path.abspath(__file__))
D=os.path.join(OUT,"v3"); os.makedirs(D,exist_ok=True)
for lv in range(1,11):
    open(os.path.join(D,f"level-{lv}.svg"),"w").write(build(lv))
print("generated v3 10 svgs")

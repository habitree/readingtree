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
    <linearGradient id="seedG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#C2925A"/>
      <stop offset="55%" stop-color="#8A5A30"/>
      <stop offset="100%" stop-color="#5A3A20"/>
    </linearGradient>
    <linearGradient id="leafLin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8FD08F"/>
      <stop offset="100%" stop-color="#3C8F5E"/>
    </linearGradient>
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


# ===== 실제 개념 요소 (씨앗/새싹/떡잎, 세계수/황금숲) =====
def leafshape(x,y,L,W,ang,fill="url(#leafLin)",vein=True):
    a=math.radians(ang)
    tx=x+math.cos(a)*L; ty=y+math.sin(a)*L
    px=math.cos(a+math.pi/2); py=math.sin(a+math.pi/2)
    c1x=x+math.cos(a)*L*0.5+px*W; c1y=y+math.sin(a)*L*0.5+py*W
    c2x=x+math.cos(a)*L*0.5-px*W; c2y=y+math.sin(a)*L*0.5-py*W
    d=f'M{x:.0f} {y:.0f} Q {c1x:.0f} {c1y:.0f} {tx:.0f} {ty:.0f} Q {c2x:.0f} {c2y:.0f} {x:.0f} {y:.0f} Z'
    out=f'<path d="{d}" fill="{fill}"/>'
    if vein: out+=f'<path d="M{x:.0f} {y:.0f} L {tx:.0f} {ty:.0f}" stroke="#2C7A4F" stroke-width="3.5" opacity="0.45" fill="none" stroke-linecap="round"/>'
    return out

def seed(cx=512, cy=806):
    out=[f'<ellipse cx="{cx}" cy="{cy+40}" rx="118" ry="32" fill="#3F2A19" opacity="0.45"/>']
    out.append(f'<g transform="rotate(-16 {cx} {cy})">')
    out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="64" ry="90" fill="url(#seedG)"/>')
    out.append(f'<ellipse cx="{cx-20}" cy="{cy-28}" rx="20" ry="40" fill="#D8B27C" opacity="0.55"/>')
    out.append(f'<path d="M{cx} {cy-84} Q {cx+16} {cy} {cx} {cy+84}" stroke="#5A3A20" stroke-width="5" fill="none" opacity="0.7"/>')
    out.append('</g>')
    # 작은 새 뿌리
    out.append(f'<path d="M{cx-4} {cy+74} q -10 28 -4 52 M{cx-4} {cy+74} q 10 24 22 36" stroke="#EBE3D0" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>')
    # 트임 힌트(작은 초록 싹)
    out.append(leafshape(cx+14, cy-66, 46, 18, -50))
    return "\n  ".join(out)

def seedhalves(cx, base):
    return (f'<path d="M{cx-30:.0f} {base:.0f} q -12 -26 4 -42 q 20 12 18 42 z" fill="#7A4F2B"/>'
            f'<path d="M{cx+30:.0f} {base:.0f} q 12 -26 -4 -42 q -20 12 -18 42 z" fill="#6A4324"/>')

def sprout_real(cx=512):
    base=812; top=base-150
    out=[seedhalves(cx, base)]
    out.append(f'<path d="M{cx} {base} C {cx-12} {base-55} {cx-6} {base-118} {cx} {top}" stroke="url(#trunk)" stroke-width="15" fill="none" stroke-linecap="round"/>')
    # 떡잎 2장 (둥근형)
    out.append(leafshape(cx-4, top+6, 92, 40, -150))
    out.append(leafshape(cx+4, top+6, 92, 40, -30))
    out.append(f'<ellipse cx="{cx-46}" cy="{top-26}" rx="20" ry="12" fill="url(#dapple)" opacity="0.5"/>')
    return "\n  ".join(out)

def seedling(cx=512):
    base=814; top=base-210
    out=[seedhalves(cx, base)]
    out.append(f'<path d="M{cx} {base} C {cx-12} {base-70} {cx-7} {base-150} {cx} {top}" stroke="url(#trunk)" stroke-width="15" fill="none" stroke-linecap="round"/>')
    # 아래: 떡잎 2장(둥근)
    out.append(leafshape(cx-4, base-86, 96, 42, -156))
    out.append(leafshape(cx+4, base-86, 96, 42, -24))
    # 위: 첫 본잎 2~3장(뾰족)
    out.append(leafshape(cx-3, top+30, 92, 24, -126))
    out.append(leafshape(cx+3, top+30, 92, 24, -54))
    out.append(leafshape(cx, top+8, 86, 22, -90))
    return "\n  ".join(out)

def roots(cx, by, spread):
    out=[]
    for sgn in (-1,1):
        for k in range(3):
            ln=spread*(0.45+0.28*k); ex=cx+sgn*ln; ey=by+8+k*10; w=24-k*6
            out.append(f'<path d="M{cx:.0f} {by-26:.0f} Q {cx+sgn*ln*0.4:.0f} {by+2:.0f} {ex:.0f} {ey:.0f} q {sgn*16:.0f} 8 {sgn*30:.0f} 4" stroke="url(#trunk)" stroke-width="{w}" fill="none" stroke-linecap="round"/>')
    return "\n  ".join(out)

def starmote(x,y,s,col="#CFF5EC"):
    return (f'<path d="M{x:.0f} {y-s:.0f} L{x+s*0.26:.0f} {y:.0f} L{x:.0f} {y+s:.0f} L{x-s*0.26:.0f} {y:.0f} Z" fill="{col}"/>'
            f'<path d="M{x-s:.0f} {y:.0f} L{x:.0f} {y-s*0.26:.0f} L{x+s:.0f} {y:.0f} L{x:.0f} {y+s*0.26:.0f} Z" fill="{col}"/>')

def minitree(bx, top_y, base_w, top_w, cx, cy, rx, ry, density, seed_, gold=True):
    return trunk_at(bx,886,top_y,base_w,top_w)+"\n  "+canopy(cx,cy,rx,ry,density,seed=seed_,gold=gold)

def world_tree():
    body=defs()+"\n"+hill()+"\n"+ground(1.18)+"\n"+aura(512,330,370,"#2dd4bf",0.36)+"\n"
    body+=roots(512,872,235)+"\n"
    body+=trunk(320,152,54,[(0.4,210,500),(math.pi-0.4,210,500),(0.92,150,430),(math.pi-0.92,150,430)])+"\n"
    body+=canopy(512,325,312,288,122,seed=9)
    # 코스믹 빛 입자
    for (mx,my,ms) in [(250,250,16),(360,180,12),(700,210,15),(780,330,11),(300,430,10),(740,470,12),(512,120,13),(180,360,9)]:
        body+="\n  "+starmote(mx,my,ms)
    return body

def golden_forest():
    body=defs()+"\n"+hill()+"\n"+ground(1.2)+"\n"+aura(512,440,410,"#fbbf24",0.40)+"\n"
    body+=sun(812,200,46)+"\n"
    # 뒤열(작은 나무)
    body+=minitree(285,612,54,22,285,572,116,126,32,201)+"\n  "
    body+=minitree(748,620,50,20,748,584,106,116,30,202)+"\n  "
    # 중간열
    body+=minitree(380,532,70,28,380,492,150,158,46,203)+"\n  "
    body+=minitree(675,548,66,26,672,508,138,148,42,204)+"\n  "
    # 중앙 주 나무
    body+=trunk(440,120,46,[(0.45,175,545),(math.pi-0.45,175,545)])+"\n  "
    body+=canopy(512,432,212,202,88,seed=10,gold=True)+"\n  "
    body+=fruits(512,432,196,172,9,seed=10,color="#E7B62E",hi="#F8E69A")
    # 반딧불 + 반짝임
    for (fx,fy) in [(430,700),(605,712),(355,650),(690,668),(512,752),(248,652),(770,690)]:
        body+="\n  "+firefly(fx,fy)
    body+="\n  "+sparkles(512,432,350,308,12,seed=10)
    return body


def build(level):
    L=level
    if L==1:
        body=defs()+"\n"+ground(0.92)+"\n"+seed()
    elif L==2:
        body=defs()+"\n"+ground(0.95)+"\n"+sprout_real()
    elif L==3:
        body=defs()+"\n"+ground(0.98)+"\n"+seedling()
        body+="\n  "+stake(512,base if False else 560,806) if False else ""
    elif L==4:
        body=defs()+"\n"+ground(1.0)+"\n"+trunk(470,80,30)+"\n"+canopy(512,430,150,200,46,seed=4)
        body+="\n  "+butterfly(660,360,20)
    elif L==5:
        body=defs()+"\n"+ground(1.05)+"\n"+trunk(450,98,38,[(0.55,120,560),(math.pi-0.55,120,560)])+"\n"+canopy(512,415,225,205,62,seed=5)
        body+="\n  "+bird(345,150,34)+"\n  "+bird(455,120,26)
    elif L==6:
        body=defs()+"\n"+ground(1.1)+"\n"+trunk(440,112,42,[(0.45,165,540),(math.pi-0.45,165,540)])+"\n"+canopy(512,420,285,205,82,seed=6)
        body+="\n  "+nest(648,470)
    elif L==7:
        body=defs()+"\n"+ground(1.1)+"\n"+aura(512,395,300,"#f472b6",0.30)+"\n"
        body+=trunk(420,114,44,[(0.5,160,535),(math.pi-0.5,160,535)])+"\n"+canopy(512,395,265,238,82,seed=7)
        body+="\n  "+blossoms(512,395,255,225,30,seed=7)
        for i,(px,py) in enumerate([(360,560),(620,600),(470,640),(700,520)]):
            body+=f'\n  <ellipse cx="{px}" cy="{py}" rx="9" ry="6" fill="#F8B5D2" opacity="0.85" transform="rotate({i*40} {px} {py})"/>'
        body+="\n  "+butterfly(330,330,22)+"\n  "+butterfly(710,300,18,"#F7C8DD","#FBE0EC")
    elif L==8:
        body=defs()+"\n"+ground(1.1)+"\n"+aura(512,392,305,"#f97316",0.28)+"\n"
        body+=trunk(415,118,46,[(0.5,165,530),(math.pi-0.5,165,530)])+"\n"+canopy(512,392,270,242,86,seed=8)
        body+="\n  "+fruits(512,392,250,220,18,seed=8)
        body+="\n  "+basket(360,812)
        body+='\n  <ellipse cx="600" cy="850" rx="13" ry="11" fill="#E8572A"/><ellipse cx="636" cy="858" rx="12" ry="10" fill="#F27A45"/>'
    elif L==9:
        body=world_tree()
    elif L==10:
        body=golden_forest()
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{body}\n</svg>'

OUT=os.path.dirname(os.path.abspath(__file__))
D=os.path.join(OUT,"v4"); os.makedirs(D,exist_ok=True)
for lv in range(1,11):
    open(os.path.join(D,f"level-{lv}.svg"),"w").write(build(lv))
print("generated v4 10 svgs")

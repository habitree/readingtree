#!/usr/bin/env python3
"""Habitree - 통일 화풍 트리 SVG 생성기 (샘플)"""
import math, random, os

PAL = {
    "leaf_dark":"#2E7D52","leaf_mid":"#46A06A","leaf_light":"#86C98C","leaf_hi":"#C7ECB6",
    "trunk_dark":"#6E4A2B","trunk_mid":"#8A5E38","trunk_light":"#B5894F",
    "soil_dark":"#5E3D26","soil_light":"#8A5E3C","grass":"#5FB06A",
    "gold_dark":"#D9A23A","gold_light":"#F6D873",
}

def defs():
    p=PAL
    return f'''
  <defs>
    <radialGradient id="leaf" cx="38%" cy="30%" r="75%">
      <stop offset="0%" stop-color="{p['leaf_hi']}"/>
      <stop offset="42%" stop-color="{p['leaf_light']}"/>
      <stop offset="100%" stop-color="{p['leaf_mid']}"/>
    </radialGradient>
    <radialGradient id="leafBack" cx="42%" cy="34%" r="78%">
      <stop offset="0%" stop-color="{p['leaf_mid']}"/>
      <stop offset="100%" stop-color="{p['leaf_dark']}"/>
    </radialGradient>
    <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{p['trunk_light']}"/>
      <stop offset="48%" stop-color="{p['trunk_mid']}"/>
      <stop offset="100%" stop-color="{p['trunk_dark']}"/>
    </linearGradient>
    <radialGradient id="soil" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="{p['soil_light']}"/>
      <stop offset="100%" stop-color="{p['soil_dark']}"/>
    </radialGradient>
    <radialGradient id="gold" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="{p['gold_light']}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="{p['gold_dark']}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="{p['gold_dark']}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hi" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{p['leaf_hi']}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="{p['leaf_hi']}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="canopyShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#1c3a26" flood-opacity="0.28"/>
    </filter>
  </defs>'''

def grass_tufts():
    random.seed(7); out=[]
    for i in range(26):
        x=300+i*16+random.uniform(-4,4); base=858+math.sin(i*0.7)*8
        h=random.uniform(16,34); w=random.uniform(4,7); lean=random.uniform(-6,6)
        out.append(f'<path d="M{x:.0f} {base:.0f} q {lean:.0f} -{h*0.6:.0f} {lean*0.4:.0f} -{h:.0f} q {w:.0f} {h*0.55:.0f} {w*0.3:.0f} {h:.0f} z" fill="{PAL["grass"]}" opacity="0.85"/>')
    for i in range(7):
        x=360+i*42+random.uniform(-8,8); y=880+random.uniform(-6,10)
        out.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{random.uniform(6,11):.0f}" ry="{random.uniform(3,6):.0f}" fill="#7a5a3e" opacity="0.6"/>')
    return "\n  ".join(out)

def ground():
    return f'''
  <ellipse cx="512" cy="902" rx="250" ry="46" fill="#16321f" opacity="0.30" filter="url(#soft)"/>
  <ellipse cx="512" cy="872" rx="232" ry="62" fill="url(#soil)"/>
  <ellipse cx="512" cy="858" rx="232" ry="52" fill="{PAL['soil_light']}" opacity="0.45"/>
  ''' + grass_tufts()

def trunk(top_y, base_w, top_w, branches=None):
    bx=512; by=872; half_b=base_w/2; half_t=top_w/2
    d=(f'M{bx-half_b:.0f} {by} '
       f'C {bx-half_b*0.7:.0f} {by-120:.0f} {bx-half_t:.0f} {top_y+90:.0f} {bx-half_t:.0f} {top_y:.0f} '
       f'L {bx+half_t:.0f} {top_y:.0f} '
       f'C {bx+half_t:.0f} {top_y+90:.0f} {bx+half_b*0.7:.0f} {by-120:.0f} {bx+half_b:.0f} {by} '
       f'Q {bx:.0f} {by+18:.0f} {bx-half_b:.0f} {by} Z')
    parts=[f'<path d="{d}" fill="url(#trunk)"/>']
    parts.append(f'<path d="M{bx-half_b:.0f} {by} q -34 -6 -64 18 q 30 -2 64 -6 z" fill="url(#trunk)"/>')
    parts.append(f'<path d="M{bx+half_b:.0f} {by} q 34 -6 64 18 q -30 -2 -64 -6 z" fill="url(#trunk)"/>')
    parts.append(f'<path d="M{bx-half_t*0.5:.0f} {top_y+30:.0f} C {bx-half_b*0.3:.0f} {by-160:.0f} {bx-half_b*0.35:.0f} {by-60:.0f} {bx-half_b*0.5:.0f} {by-10:.0f}" stroke="{PAL["trunk_light"]}" stroke-width="{max(4,top_w*0.18):.0f}" fill="none" opacity="0.5" stroke-linecap="round"/>')
    if branches:
        for (ang,ln,y) in branches:
            ex=bx+math.cos(ang)*ln; ey=y-math.sin(ang)*ln
            parts.append(f'<path d="M{bx:.0f} {y:.0f} Q {bx+math.cos(ang)*ln*0.4:.0f} {y-math.sin(ang)*ln*0.5:.0f} {ex:.0f} {ey:.0f}" stroke="url(#trunk)" stroke-width="{base_w*0.16:.0f}" fill="none" stroke-linecap="round"/>')
    return "\n  ".join(parts)

def canopy(cx, cy, R, density, gold=False, seed=1):
    random.seed(seed); back=[]; front=[]; his=[]
    for i in range(density):
        a=random.uniform(0,math.tau); rr=R*(0.55+0.45*random.random())
        x=cx+math.cos(a)*rr*0.95; y=cy+math.sin(a)*rr*0.7; s=R*(0.30+0.30*random.random())
        back.append((x+6,y+10,s*1.05)); front.append((x,y,s)); his.append((x-s*0.28,y-s*0.30,s*0.6))
    back.insert(0,(cx+6,cy+12,R*0.95)); front.insert(0,(cx,cy,R*0.9)); his.insert(0,(cx-R*0.26,cy-R*0.28,R*0.55))
    def circs(lst,fill):
        return "\n  ".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{fill}"/>' for (x,y,r) in lst)
    g='<g filter="url(#canopyShadow)">\n  '+circs(back,"url(#leafBack)")+'\n  </g>\n  '
    g+=circs(front,"url(#leaf)")+"\n  "+circs(his,"url(#hi)")
    if gold:
        random.seed(seed+99)
        g=f'<circle cx="{cx}" cy="{cy}" r="{R*1.3:.0f}" fill="url(#gold)" filter="url(#glow)"/>\n  '+g
        fr=[]
        for _ in range(10):
            a=random.uniform(0,math.tau); rr=R*(0.4+0.5*random.random())
            fx=cx+math.cos(a)*rr; fy=cy+math.sin(a)*rr*0.8
            fr.append(f'<circle cx="{fx:.0f}" cy="{fy:.0f}" r="{R*0.07:.0f}" fill="{PAL["gold_light"]}" stroke="{PAL["gold_dark"]}" stroke-width="2"/>')
        g+="\n  "+"\n  ".join(fr)
        sp=[]
        for _ in range(8):
            a=random.uniform(0,math.tau); rr=R*(0.9+0.4*random.random())
            sx=cx+math.cos(a)*rr; sy=cy+math.sin(a)*rr*0.85; sz=random.uniform(6,14)
            sp.append(f'<path d="M{sx:.0f} {sy-sz:.0f} L{sx+sz*0.28:.0f} {sy:.0f} L{sx:.0f} {sy+sz:.0f} L{sx-sz*0.28:.0f} {sy:.0f} Z" fill="#FFF6D5"/>')
        g+="\n  "+"\n  ".join(sp)
    return g

def sprout():
    cx=512
    return f'''
  <path d="M{cx-6} 840 Q {cx} 760 {cx} 700" stroke="url(#trunk)" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M{cx} 720 C {cx-150} 700 {cx-180} 600 {cx-70} 612 C {cx-40} 660 {cx-12} 700 {cx} 724 Z" fill="url(#leaf)"/>
  <path d="M{cx} 720 C {cx+150} 700 {cx+180} 600 {cx+70} 612 C {cx+40} 660 {cx+12} 700 {cx} 724 Z" fill="url(#leaf)"/>
  <ellipse cx="{cx-55}" cy="655" rx="34" ry="22" fill="url(#hi)"/>
  <path d="M{cx-12} 718 C {cx-90} 680 {cx-120} 628 {cx-60} 626" stroke="{PAL['leaf_dark']}" stroke-width="4" fill="none" opacity="0.45"/>
  <path d="M{cx+12} 718 C {cx+90} 680 {cx+120} 628 {cx+60} 626" stroke="{PAL['leaf_dark']}" stroke-width="4" fill="none" opacity="0.45"/>
  <ellipse cx="{cx}" cy="800" rx="30" ry="20" fill="{PAL['trunk_dark']}" opacity="0.5" transform="rotate(-15 {cx} 800)"/>'''

def build(level):
    body=defs()+"\n"+ground()+"\n"
    if level==1:
        body+=sprout()
    elif level==3:
        body+=trunk(560,66,30)+"\n"+canopy(512,500,150,6,seed=3)
    elif level==6:
        body+=trunk(430,104,40,[(0.5,150,560),(math.pi-0.5,150,560)])+"\n"+canopy(512,400,235,11,seed=6)
    elif level==10:
        body+=trunk(400,128,46,[(0.45,180,540),(math.pi-0.45,180,540),(0.9,120,470),(math.pi-0.9,120,470)])+"\n"+canopy(512,372,270,14,gold=True,seed=10)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{body}\n</svg>'

OUT=os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(OUT,"samples"),exist_ok=True)
for lv in (1,3,6,10):
    open(os.path.join(OUT,"samples",f"level-{lv}.svg"),"w").write(build(lv))
    print("wrote level",lv)

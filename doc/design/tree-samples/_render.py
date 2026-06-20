import subprocess, os, shutil
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__))
RESVG=os.path.join(HERE,"resvg.exe")
SVGD=os.path.join(HERE,"v5")
OUT=os.path.join(SVGD,"out"); os.makedirs(OUT,exist_ok=True)
for lv in range(1,11):
    svg=os.path.join(SVGD,f"level-{lv}.svg")
    png=os.path.join(OUT,f"level-{lv}.png")
    subprocess.run([RESVG,"--width","1024","--height","1024",svg,png],check=True)
    im=Image.open(png).convert("RGBA")
    im.save(os.path.join(OUT,f"level-{lv}.webp"),"WEBP",quality=88,method=6)
    t=im.copy(); t.thumbnail((96,96),Image.LANCZOS); t.save(os.path.join(OUT,f"level-{lv}-thumb.webp"),"WEBP",quality=86)
    shutil.copy(svg, os.path.join(OUT,f"level-{lv}.svg"))
    print(f"level-{lv}: {os.path.getsize(os.path.join(OUT,f'level-{lv}.webp'))} bytes, mode={im.mode}")
print("DONE")

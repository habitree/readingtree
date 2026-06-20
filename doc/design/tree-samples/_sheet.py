import os
from PIL import Image, ImageDraw
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,"v5","out")
names=["씨앗","새싹","떡잎","어린나무","나무","큰나무","꽃나무","열매나무","세계수","황금숲"]
cell=300; cols=5; rows=2; pad=16; labelh=30
W=cols*cell; H=rows*(cell+labelh)
sheet=Image.new("RGBA",(W,H),(15,26,20,255))  # 다크 카드
d=ImageDraw.Draw(sheet)
for i in range(10):
    lv=i+1; c=i%cols; r=i//cols
    x=c*cell; y=r*(cell+labelh)
    im=Image.open(os.path.join(OUT,f"level-{lv}.webp")).convert("RGBA")
    im.thumbnail((cell-2*pad,cell-2*pad),Image.LANCZOS)
    sheet.alpha_composite(im,(x+(cell-im.width)//2, y+(cell-im.height)//2))
    d.text((x+10,y+cell+6),f"Lv.{lv} {names[i]}",fill=(220,210,180,255))
sheet.convert("RGB").save(os.path.join(HERE,"_v5_sheet.png"),"PNG")
print("sheet:", os.path.join(HERE,"_v5_sheet.png"))

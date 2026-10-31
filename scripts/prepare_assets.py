"""Export small runtime copies; source PNGs are never overwritten."""
from PIL import Image
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
mapping={
'laugh1':'一级大笑奶蛙','laugh2':'二级大笑奶蛙','laugh3':'三级大笑奶蛙',
'dog1':'一级奶狗','dog2':'二级奶狗','dog3':'三级奶狗',
'kungfu1':'一级功夫奶蛙','kungfu2':'二级功夫奶蛙','kungfu3':'三级功夫奶蛙',
'mouse1':'初级奶鼠','mouse2':'二级奶鼠','mouse3':'三级奶鼠',
'feidudu':'邪恶肥嘟嘟','niulai':'牛来怪','lulu':'水豚噜噜怪','boss':'终极boss肥嘟嘟',
'littleMouse':'卖萌冲刺的小鼠战士','heart':'初始奶蛙之心','heartHurt':'受伤奶蛙之心',
'heartBroken':'破碎奶蛙之心','lotus':'荷叶','entrance':'入口建筑','altar':'奶蛙之心祭坛',
'milk':'奶瓶','energy':'技能能量爱心','logo':'游戏LOGO','grass':'草地背景',
'wave':'大笑冲击波','stun':'笑晕特效'}
out=ROOT/'public/assets';out.mkdir(parents=True,exist_ok=True)
manifest={}
for key,name in mapping.items():
 im=Image.open(ROOT/(name+'.png')).convert('RGBA')
 if key!='grass':
  # Trim only near-invisible padding; preserve original color and opacity.
  bounds=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
  if bounds:im=im.crop(bounds)
  size=640 if key=='logo' else 384
  im.thumbnail((size,size),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(im.width+16,im.height+16));canvas.alpha_composite(im,(8,8));im=canvas
 else:
  im=im.convert('RGB');im.thumbnail((768,768),Image.Resampling.LANCZOS)
 im.save(out/(key+'.png'),optimize=True)
 manifest[key]={'source':name+'.png','url':'/assets/'+key+'.png','size':list(im.size)}
# The five decorations use uneven columns; keep each object's complete bounds.
im=Image.open(ROOT/'地图素材.png').convert('RGBA')
for key,box in {'pond':(0,0,956,550),'mushroom':(960,0,1536,570),'flowers':(0,555,597,1024),'rocks':(600,600,1003,1024),'flower':(1006,575,1536,1024)}.items():
 piece=im.crop(box);b=piece.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
 if b:piece=piece.crop(b)
 piece.thumbnail((260,220),Image.Resampling.LANCZOS);piece.save(out/(key+'.png'),optimize=True)
 manifest[key]={'source':'地图素材.png','crop':list(box),'url':'/assets/'+key+'.png','size':list(piece.size)}
(ROOT/'src/assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'Exported {len(manifest)} runtime images, {sum(p.stat().st_size for p in out.glob("*.png"))/1024/1024:.1f} MiB')

"""Rig the supplied textured OBJ, keeping UVs and the browser's joint conventions."""
import bpy, os, math, json
from mathutils import Vector, Matrix
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'art','imported-character')
bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC,'normalized.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');mesh.name='TexturedTraveller'
# All coordinates below refer to the normalized, two-metre T-pose.
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def weights(p):
 x,y,z=p;side='L' if x<0 else 'R';a=abs(x)
 if z>.28 and a>.22:
  arm=smooth(.22,.34,a);fore=smooth(.47,.61,a)
  return {'Torso':1-arm,'Arm'+side:arm*(1-fore),'Forearm'+side:arm*fore}
 if z>.53:
  head=smooth(.53,.65,z);return {'Torso':1-head,'Head':head}
 if z<-.10:
  leg=1-smooth(-.25,-.10,z);knee=1-smooth(-.61,-.43,z);foot=1-smooth(-.94,-.81,z)
  return {'Torso':1-leg,'Leg'+side:leg*(1-knee),'Shin'+side:leg*knee*(1-foot),'Foot'+side:leg*knee*foot}
 return {'Torso':1}
scale=.825
shoulder={s:Vector((sign*.26,0,.52)) for s,sign in [('L',-1),('R',1)]}
rot={s:Matrix.Rotation(sign*math.radians(82),4,'Y') for s,sign in [('L',-1),('R',1)]}
def neutral(p,name):
 p=p.copy()
 if name.startswith(('Arm','Forearm')):
  s=name[-1];p=shoulder[s]+rot[s]@(p-shoulder[s])
 elif name.startswith(('Leg','Shin','Foot')):
  sign=-1 if name[-1]=='L' else 1;p.x+=sign*.23*(p.z+.10)
 return p
all_weights=[]
for v in mesh.data.vertices:
 w={k:a for k,a in weights(v.co).items() if a>0.00001};total=sum(w.values());w={k:a/total for k,a in w.items()};all_weights.append(w)
 p=sum((neutral(v.co,k)*a for k,a in w.items()),Vector());v.co=Vector((p.x*scale,p.y*scale,(p.z+1)*scale))
# Pivot frames deliberately share world axes, just like the previous procedural rig.
joints={'Body':((0,0,0),None),'Torso':((0,0,-.08),'Body'),'Head':((0,0,.60),'Torso'),'Backpack':((0,.08,.2),'Torso')}
for s,sign in [('L',-1),('R',1)]:
 joints['Arm'+s]=(tuple(shoulder[s]),'Torso')
 joints['Forearm'+s]=(tuple(neutral(Vector((sign*.54,0,.51)),'Arm'+s)),'Arm'+s)
 for name,p,parent in [('Leg',(sign*.12,0,-.10),'Body'),('Shin',(sign*.20,0,-.48),'Leg'+s),('Foot',(sign*.30,0,-.90),'Shin'+s)]:
  joints[name+s]=(tuple(neutral(Vector(p),name+s)),parent)
armdata=bpy.data.armatures.new('TravellerSkeleton');rig=bpy.data.objects.new('Traveller',armdata);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);mesh.select_set(False)
bpy.ops.object.mode_set(mode='EDIT')
for name,(p,parent) in joints.items():
 b=armdata.edit_bones.new(name);b.head=(0,0,0) if name=='Body' else (p[0]*scale,p[1]*scale,(p[2]+1)*scale);b.tail=b.head+Vector((0,.08,0))
 if parent:b.parent=armdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for name in joints:mesh.vertex_groups.new(name=name)
for i,w in enumerate(all_weights):
 for name,a in w.items():mesh.vertex_groups[name].add([i],a,'REPLACE')
mesh.parent=rig;mod=mesh.modifiers.new('Smooth character skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=False
# Keep the original painted diffuse appearance; remove PBR maps from the cartoon export.
mat=mesh.data.materials[0];bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
base=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image.name=='texture_pbr_20250901.png')
base.scale(2048,2048);base.filepath_raw=os.path.join(SRC,'traveller-color-2k.jpg');base.file_format='JPEG';base.save();base.pack()
for n in list(mat.node_tree.nodes):
 if n.type=='TEX_IMAGE' and n.image!=base:mat.node_tree.nodes.remove(n)
bsdf.inputs['Metallic'].default_value=0;bsdf.inputs['Roughness'].default_value=.9
bsdf.inputs['Base Color'].default_value=(1,1,1,1)
rig['source']='User OBJ with original UV texture, reduced from 1499458 to 48000 triangles'
upper=.38*scale;lower=.42*scale;ankle=.10*scale;hip=.90*scale;stance=upper+lower-.045
rig['gaitUpper']=upper;rig['gaitLower']=lower;rig['gaitStance']=stance;rig['gaitDrop']=stance+ankle-hip
# Export inspectable idle, walk and run actions as well as the live procedural rig.
def pose(frame,phase,amount,run):
 for b in rig.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
 rig.pose.bones['Body'].location.z=rig['gaitDrop']-.04*run+math.cos(phase*2)*(.005+.015*run)*amount
 rig.pose.bones['Torso'].rotation_euler.x=(.045+.14*run)*amount
 for s,offset in [('L',0),('R',math.pi)]:
  t=((phase+offset)/math.tau)%1;swing=t>=.5;p=(t-.5)*2 if swing else t*2;reach=.20+.05*run
  z=(-reach+2*reach*p*p*(3-2*p) if swing else reach-2*reach*p)*amount
  lift=(math.sin(p*math.pi)*(.095+.065*run) if swing else 0)*amount
  y=stance-.04*run-lift+math.cos(phase*2)*(.005+.015*run)*amount;d=min(math.hypot(y,z),upper+lower-.0001);clamp=lambda a:max(-1,min(1,a))
  knee=math.pi-math.acos(clamp((upper*upper+lower*lower-d*d)/(2*upper*lower)));angle=-math.atan2(z,y)+math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d)))
  for name,a in [('Leg',angle),('Shin',-knee),('Foot',-angle+knee),('Arm',-math.sin(phase+offset-.2)*(.24+.20*run)*amount),('Forearm',-.08-.75*run)]:rig.pose.bones[name+s].rotation_euler.x=a
 for b in rig.pose.bones:b.keyframe_insert('location',frame=frame);b.keyframe_insert('rotation_euler',frame=frame)
for name,amount,run in [('Idle',0,0),('Walk',1,0),('Run',1,1)]:
 rig.animation_data_create();action=bpy.data.actions.new(name);rig.animation_data.action=action
 for f in range(1,50):pose(f,(f-1)/48*math.tau,amount,run)
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=49;bpy.context.scene.render.fps=30
# Save in rest pose. The browser drives bones directly, exported clips are for Blender review.
for b in rig.pose.bones:b.location=(0,0,0);b.rotation_euler=(0,0,0)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public','assets','3d','traveller.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_extras=True,export_image_format='JPEG',export_jpeg_quality=90)
for track in rig.animation_data.nla_tracks:track.mute=True
rig.animation_data.action=bpy.data.actions.get('Walk');bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','Traveller-Textured.blend'))
with open(os.path.join(ROOT,'art','traveller-import.json'),'w') as f:json.dump({'sourceTriangles':1499458,'stlTriangles':1498066,'gameTriangles':len(mesh.data.polygons),'sourceTexture':4096,'gameTexture':2048,'upper':upper,'lower':lower,'stance':stance,'drop':rig['gaitDrop']},f,indent=2)
print('TEXTURED_RIG_EXPORTED',flush=True)

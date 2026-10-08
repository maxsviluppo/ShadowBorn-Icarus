"""Check actual deformed surfaces for long ribbons during arm/leg gestures.

Run prepare-relaxed-preview.mjs and build-relaxed-character.py first.
Bone-only animation tests cannot detect the generated cuff/hip weld.
"""
import bpy,json
from pathlib import Path
from mathutils import Quaternion
R=Path(__file__).resolve().parents[1];O=R/'art/relaxed-character'
bpy.ops.wm.open_mainfile(filepath=str(O/'Relaxed-Animato.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
for t in rig.animation_data.nla_tracks:t.mute=True
rig.animation_data.action=None
def clear():
 for p in rig.pose.bones:p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
def check(name):
 bpy.context.view_layer.update();obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());ev=obj.to_mesh()
 longest=max((ev.vertices[e.vertices[0]].co-ev.vertices[e.vertices[1]].co).length for e in ev.edges)
 obj.to_mesh_clear()
 assert longest<.22,f'{name}: stretched surface edge {longest:.3f} m'
 print(f'PASS {name}: longest surface edge {longest:.3f} m',flush=True)
for pose in json.loads((O/'idle-poses.json').read_text()):
 clear()
 for name,key,zkey in [('Head','head',None),('ArmR','armR','armRZ'),('ArmL','armL','armLZ'),('ForearmR','forearmR',None),('ForearmL','forearmL',None)]:
  p=rig.pose.bones[name];p.rotation_quaternion=Quaternion((0,0,1),pose.get(zkey,0))@Quaternion((1,0,0),pose[key])
  if name=='ForearmR':p.rotation_quaternion=p.rotation_quaternion@Quaternion((0,0,1),pose.get('forearmRZ',0))
 check(pose['name'])
for pose in json.loads((O/'interaction-poses.json').read_text()):
 clear();rig.pose.bones['Body'].location.z=-pose['drop']
 angles={'Torso':pose['torso'],'ArmR':pose['arm'],'ForearmR':pose['forearm'],'ArmL':pose['arm']*.55,'ForearmL':pose['forearm']}
 for side in ['L','R']:angles.update({'Leg'+side:pose['thigh'],'Shin'+side:pose['knee'],'Foot'+side:pose['ankle']})
 for name,angle in angles.items():rig.pose.bones[name].rotation_quaternion=Quaternion((1,0,0),angle)
 check(pose['name'])
for name in ['Walk','Run']:
 rig.animation_data.action=bpy.data.actions['Shirt_'+name]
 for frame in [1,12,24,36]:bpy.context.scene.frame_set(frame);check(f'{name}-{frame}')

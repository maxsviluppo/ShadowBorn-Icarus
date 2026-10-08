import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
R=Path(__file__).resolve().parents[1];O=R/'art/shirt-character'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(R/'public/assets/3d/shirt-hero.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for track in rig.animation_data.nla_tracks:track.mute=True
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='TEXTURE';s.render.resolution_x=500;s.render.resolution_y=650;s.render.resolution_percentage=100
bpy.ops.object.camera_add(location=(2,-4,2));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.95;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
for name in ['Idle','Walk','Run']:
 rig.animation_data.action=bpy.data.actions[name]
 for frame in ([1] if name=='Idle' else [12,36]):
  s.frame_set(frame);s.render.filepath=str(O/(name+str(frame)+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Idle'];s.frame_set(1)
bases={p.name:p.rotation_quaternion.copy() for p in rig.pose.bones};rig.animation_data.action=None
for pose in json.loads((O/'idle-poses.json').read_text()):
 for p in rig.pose.bones:p.rotation_quaternion=bases[p.name].copy()
 for name,key,zkey in [('Head','head',None),('ArmR','armR','armRZ'),('ArmL','armL','armLZ'),('ForearmR','forearmR',None),('ForearmL','forearmL',None)]:
  p=rig.pose.bones[name];p.rotation_mode='QUATERNION';p.rotation_quaternion=p.rotation_quaternion@Quaternion((0,0,1),pose.get(zkey,0))@Quaternion((1,0,0),pose[key])
  if name=='ForearmR':p.rotation_quaternion=p.rotation_quaternion@Quaternion((0,0,1),pose.get('forearmRZ',0))
 s.render.filepath=str(O/(pose['name']+'.png'));bpy.ops.render.render(write_still=True)

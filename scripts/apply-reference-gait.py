"""Apply the exact runtime pose samples to the textured Blender rig."""
import bpy,os,json
from mathutils import Euler,Quaternion
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'art','Traveller-Textured.blend'))
rig=bpy.data.objects['Traveller'];rig.animation_data_clear()
for action in list(bpy.data.actions):
 if action.users==0:bpy.data.actions.remove(action)
clips=json.load(open(os.path.join(root,'art','gait-reference','poses.json')))
for name,poses in clips.items():
 rig.animation_data_create();action=bpy.data.actions.new('Reference_'+name);rig.animation_data.action=action
 for p in poses:
  for bone in rig.pose.bones:bone.location=(0,0,0);bone.rotation_mode='QUATERNION';bone.rotation_quaternion=(1,0,0,0)
  rig.pose.bones['Body'].location.z=p['body']
  for key,angles in p['rot'].items():
   q=Euler(angles,'XYZ').to_quaternion();rig.pose.bones[key].rotation_quaternion=Quaternion((q.w,q.x,-q.z,q.y))
  for bone in rig.pose.bones:bone.keyframe_insert('location',frame=p['frame']);bone.keyframe_insert('rotation_quaternion',frame=p['frame'])
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=False
for bone in rig.pose.bones:bone.location=(0,0,0);bone.rotation_quaternion=(1,0,0,0)
bpy.context.scene.render.fps=60;bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=len(clips['Walk'])
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.data.objects['TexturedTraveller'].select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public','assets','3d','traveller.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_extras=True,export_image_format='JPEG',export_jpeg_quality=90)
for track in rig.animation_data.nla_tracks:track.mute=True
rig.animation_data.action=bpy.data.actions['Reference_Walk'];bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'art','Traveller-Textured.blend'),compress=True)

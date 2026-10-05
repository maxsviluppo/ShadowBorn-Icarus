import bpy,bmesh,math
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'art/prisoner-character'
bpy.ops.wm.open_mainfile(filepath=str(O/'Galeotto-Animato.blend'))
mesh=bpy.data.objects['Prisoner_Skin'];rig=bpy.data.objects['Prisoner']
# Remove narrow stretched slivers produced by T-pose remapping, not the painted stripes.
bm=bmesh.new();bm.from_mesh(mesh.data);bad=[]
for f in bm.faces:
 c=f.calc_center_median();lengths=[e.calc_length() for e in f.edges];longest=max(lengths);area=f.calc_area()
 if abs(c.x)>.09 and c.z<1.30 and longest>.035 and longest*longest/max(area,1e-12)>65:bad.append(f)
bmesh.ops.delete(bm,geom=bad,context='FACES');bm.to_mesh(mesh.data);bm.free();print('REMOVED_SLIVERS',len(bad),flush=True)
# Remove inherited bag-side arm splay: both arms share mirrored lateral posture.
for action in bpy.data.actions:
 curves=list(action.fcurves)
 for part in ['Arm','Forearm']:
  left=f'pose.bones["{part}L"].rotation_euler';right=f'pose.bones["{part}R"].rotation_euler'
  for axis in [1,2]:
   src=next((f for f in curves if f.data_path==left and f.array_index==axis),None)
   dst=next((f for f in curves if f.data_path==right and f.array_index==axis),None)
   if src and dst:
    for k in dst.keyframe_points:
     k.co.y=-src.evaluate(k.co.x);k.handle_left.y=k.co.y;k.handle_right.y=k.co.y
    dst.update()
rig.animation_data.action=None
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/prisoner.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_jpeg_quality=95)
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=bpy.data.actions.get('Barnaby_Idle');bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Galeotto-Pulito.blend'))

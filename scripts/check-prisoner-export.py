import bpy
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'art/prisoner-character'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(R/'public/assets/3d/prisoner.glb'))
print('ACTIONS',[(a.name,a.frame_range[:]) for a in bpy.data.actions],flush=True)
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');print('RIG',rig.name,flush=True)
for tr in rig.animation_data.nla_tracks:tr.mute=True
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='TEXTURE';s.render.resolution_x=500;s.render.resolution_y=650;s.render.resolution_percentage=100
bpy.ops.object.camera_add(location=(2,-4,2));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
for a in bpy.data.actions:
 if 'Walk' in a.name or 'Idle' in a.name:
  rig.animation_data.action=a
  for f in [6,18]:
   s.frame_set(f);s.render.filepath=str(O/('runtime-'+a.name+str(f)+'.png'));bpy.ops.render.render(write_still=True)

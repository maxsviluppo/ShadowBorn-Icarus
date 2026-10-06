import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
R=Path(__file__).resolve().parents[1];O=R/'art/prisoner-character'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'public/assets/3d/prisoner.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=bpy.data.actions['Idle'];bpy.context.scene.frame_set(1)
bases={p.name:p.rotation_quaternion.copy() for p in rig.pose.bones}
rig.animation_data.action=None
roots=[o for o in bpy.context.scene.objects if o.parent is None]
wrapper=bpy.data.objects.new('RuntimeRoot',None);bpy.context.scene.collection.objects.link(wrapper)
for o in roots:o.parent=wrapper
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='TEXTURE';s.render.resolution_x=192;s.render.resolution_y=224;s.render.resolution_percentage=100;s.render.film_transparent=True
bpy.ops.object.camera_add(location=(6,-6,5.7));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.1;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
for name,lie,seated in [('lying',1,0),('seated',0,1),('standing',0,0)]:
 for p in rig.pose.bones:p.rotation_quaternion=bases[p.name].copy()
 wrapper.rotation_mode='QUATERNION';wrapper.rotation_quaternion=Quaternion((0,0,1),math.pi/6*(1-lie))@Quaternion((1,0,0),-math.pi/2*lie)
 pivot=Vector((0,0,.8));wrapper.location=pivot-wrapper.rotation_quaternion@pivot
 for bone in ['LegL','LegR','ShinL','ShinR']:
  p=rig.pose.bones[bone];p.rotation_mode='QUATERNION';p.rotation_quaternion=p.rotation_quaternion@Quaternion((1,0,0),(-1.4 if bone.startswith('Leg') else 1.4)*seated)
 s.render.filepath=str(O/('wake-'+name+'.png'));bpy.ops.render.render(write_still=True)

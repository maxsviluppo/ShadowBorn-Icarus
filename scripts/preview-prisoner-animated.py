import bpy
from pathlib import Path
from mathutils import Vector
O=Path(__file__).resolve().parents[1]/'art/prisoner-character'
bpy.ops.wm.open_mainfile(filepath=str(O/'Galeotto-Animato.blend'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));c=(lo+hi)/2;size=max(hi-lo)
print('BOUNDS',list(lo),list(hi),flush=True)
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='TEXTURE';s.render.resolution_x=500;s.render.resolution_y=600;s.render.resolution_percentage=100
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.15;s.camera=cam
for name,v in [('front',(0,-3,.05)),('back',(0,3,.05)),('side',(3,0,.05)),('walk',(2,-3,1.4))]:
 if name=='walk':
  rig=bpy.data.objects['Prisoner'];rig.animation_data.action=bpy.data.actions.get('Barnaby_Walk');s.frame_set(12)
 cam.location=c+Vector(v)*size;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(O/('animated-'+name+'.png'));bpy.ops.render.render(write_still=True)

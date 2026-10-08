import bpy
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'art/guy-character'
bpy.ops.wm.open_mainfile(filepath=str(O/'Guy-Originale.blend'))
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='TEXTURE';s.render.resolution_x=600;s.render.resolution_y=700;s.render.resolution_percentage=100
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.2;s.camera=cam
for name,loc in [('front',(0,-3,.52)),('back',(0,3,.52)),('side',(3,0,.52))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.52))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(O/(name+'.png'));bpy.ops.render.render(write_still=True)

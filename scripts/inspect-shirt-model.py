import bpy,json,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'art/shirt-character';S=O/'source'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=str(next(S.glob('*.obj'))))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
print('MODEL',[(o.name,len(o.data.vertices),len(o.data.polygons),list(o.dimensions)) for o in meshes])
for ob in meshes:
 for m in ob.data.materials:
  if m and m.use_nodes:
   for n in m.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':
     for sock in ['Metallic','Roughness','Normal']:
      for l in list(n.inputs[sock].links):m.node_tree.links.remove(l)
     n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=1
   for n in m.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image:n.image.pack()
pts=[ob.matrix_world@Vector(v) for ob in meshes for v in ob.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));center=(lo+hi)/2
print('BOUNDS',list(lo),list(hi))
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Shirt-Originale.blend'))
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.render.resolution_x=600;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio')
size=max(hi-lo)
for loc in [(2,-3,3),(-2,-2,1),(0,3,3)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)*size);bpy.context.object.data.energy=300*size*size;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size*3
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.15;scene.camera=cam
for name,v in [('front',(0,-3,.15)),('back',(0,3,.15)),('side',(3,0,.15))]:
 cam.location=center+Vector(v)*size;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(O/(name+'.png'));bpy.ops.render.render(write_still=True)

import bpy,os,json
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));path=os.path.join(root,'art','imported-character')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(path,'d108fe4df634cbfb5984d5ed978e0f42.obj'))
o=bpy.context.selected_objects[0];bpy.context.view_layer.objects.active=o
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
lo=Vector([min(v.co[i] for v in o.data.vertices) for i in range(3)]);hi=Vector([max(v.co[i] for v in o.data.vertices) for i in range(3)])
center=(lo+hi)/2;scale=2/(hi.z-lo.z)
for v in o.data.vertices:v.co=(v.co-center)*scale
mod=o.modifiers.new('Web reduction','DECIMATE');mod.ratio=48000/len(o.data.polygons);bpy.ops.object.modifier_apply(modifier=mod.name)
for p in o.data.polygons:p.use_smooth=True
print('REDUCED',len(o.data.polygons),flush=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(path,'normalized.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=4;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('World');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.3,.3,.3,1)
for pos,power in [((3,-4,4),450),((-3,-2,2),250),((0,3,4),400)]:
 bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=power;bpy.context.object.data.size=4
for label,pos in [('front',(0,-4,0)),('back',(0,4,0)),('side',(4,0,0))]:
 bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.4;scene.camera=cam
 scene.render.filepath=os.path.join(path,'normalized-'+label+'.png');bpy.ops.render.render(write_still=True)

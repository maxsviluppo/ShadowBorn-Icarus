import bpy, os, json
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(root,'art/imported-room/ea37a2cceb2ad413e9e64249d70512ed.obj'))
objs=list(bpy.context.scene.objects)
print('ROOM_REPORT',[(o.name,len(o.data.vertices),len(o.data.polygons),list(o.dimensions)) for o in objs if o.type=='MESH'])
pts=[o.matrix_world@Vector(v) for o in objs for v in o.bound_box];low=Vector(tuple(min(p[i] for p in pts) for i in range(3)));high=Vector(tuple(max(p[i] for p in pts) for i in range(3)));center=(low+high)/2;size=max(high-low)
print('BOUNDS',list(low),list(high))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=950;scene.render.resolution_y=950;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('World');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.5,.5,.5,1);next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[1].default_value=.7
scene.view_settings.view_transform='Standard'
bpy.ops.object.light_add(type='AREA',location=center+Vector((0,-size,size*2)));bpy.context.object.data.energy=1000*size*size;bpy.context.object.data.size=size*2
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.5;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'art/imported-room/Room-Original.blend'),compress=True)
for name,offset in [('front',(1,-1,1)),('back',(-1,1,1))]:
 cam.location=center+Vector(offset)*size*2;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(root,'art/imported-room/'+name+'.png');bpy.ops.render.render(write_still=True)

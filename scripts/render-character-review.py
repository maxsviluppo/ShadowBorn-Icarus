import bpy,os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));path=os.path.join(ROOT,'art','imported-character')
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'art','Traveller-Textured.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.23,.25,.27,1)
for pos,power in [((3,-4,4),500),((-3,-2,2),300),((0,3,4),400)]:
 bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=power;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(2.4,-5,2.2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.83))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.1;scene.camera=cam
rig=bpy.data.objects['Traveller']
for label,action,frame in [('idle','Idle',1),('walk','Walk',13),('run','Run',13)]:
 rig.animation_data.action=bpy.data.actions[action];scene.frame_set(frame);scene.render.filepath=os.path.join(path,'rig-'+label+'.png');bpy.ops.render.render(write_still=True)

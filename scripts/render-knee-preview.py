import bpy,os,json
from mathutils import Vector
root=os.getcwd();bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'art','Traveller-Textured.blend'))
rig=bpy.data.objects['Traveller'];scene=bpy.context.scene
for name in ['Reference_Idle','Reference_Walk','Reference_Run']:
 rig.animation_data.action=bpy.data.actions[name]
 scene.frame_set(1 if name.endswith('Idle') else 9)
 for side in ['L','R']:
  hip=rig.pose.bones['Leg'+side].head;knee=rig.pose.bones['Shin'+side].head;ankle=rig.pose.bones['Foot'+side].head
  t=(knee.z-hip.z)/(ankle.z-hip.z);line=hip.lerp(ankle,t)
  print('KNEE',name,side,tuple(hip),tuple(knee),tuple(ankle),'forward_offset',line.y-knee.y,flush=True)
scene.render.engine='CYCLES';scene.cycles.samples=3;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=320;scene.render.resolution_y=440;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('ProfileWorld');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.35,.35,.35,1)
for pos in [(3,-4,4),(1,3,4)]:
 bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=500;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(4,-.12,1.1));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.95;scene.camera=cam
os.makedirs('art/knee-review',exist_ok=True)
checks=[]
for label in ['Idle','Walk','Run']:
 rig.animation_data.action=bpy.data.actions['Reference_'+label]
 end=int(rig.animation_data.action.frame_range[1])
 for frame in range(1,end+1):
  scene.frame_set(frame)
  for side in ['L','R']:
   hip=rig.pose.bones['Leg'+side].head;knee=rig.pose.bones['Shin'+side].head;ankle=rig.pose.bones['Foot'+side].head
   t=(knee.z-hip.z)/(ankle.z-hip.z);forward=hip.lerp(ankle,t).y-knee.y
   assert forward>0,(label,frame,side,forward)
   checks.append(forward)
 if label=='Idle':continue
 for i in range(12):
  scene.frame_set(1+round(i*(end-1)/12));scene.render.filepath=os.path.join(root,'art','knee-review',label+f'-{i:02d}.png');bpy.ops.render.render(write_still=True)
with open(os.path.join(root,'art','knee-review','verified.json'),'w') as f:json.dump({'tested_poses':len(checks),'min_forward_knee_metres':min(checks),'all_knees_forward':True},f,indent=2)

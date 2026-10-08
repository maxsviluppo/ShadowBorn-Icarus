"""Author in-place cycles for the supplied October 8 shirt model.

Executed by build-shirt.py with the fitted rig in scope. References: 8-second
walk and 20-second walk-to-run videos; the running portion begins around 11 s.
"""
from mathutils import Euler
rig.animation_data_clear();rig.animation_data_create()
fps=60;bpy.context.scene.render.fps=fps
rest={b.name:b.head_local.copy() for b in rig.data.bones}
upper=rest['LegL'].z-rest['ShinL'].z
lower=rest['ShinL'].z-rest['FootL'].z
total=upper+lower
clamp=lambda x:max(-1,min(1,x))
for name,seconds,run in [('Idle',3.2,0),('Walk',1.15,0),('Run',.76,1)]:
 action=bpy.data.actions.new('Shirt_'+name);rig.animation_data.action=action
 count=round(seconds*fps)
 for f in range(count+1):
  phase=f/count*math.tau
  for bone in rig.pose.bones:
   bone.location=(0,0,0);bone.scale=(1,1,1);bone.rotation_mode='QUATERNION';bone.rotation_quaternion=(1,0,0,0)
  rotations={}
  if name=='Idle':
   breath=math.sin(phase)
   rotations={'Torso':(.006*breath,0,0),'Head':(-.005*breath,0,0),
    'ArmL':(-.025+.008*breath,0,0),'ArmR':(-.025+.008*breath,0,0),
    'ForearmL':(-.10,0,0),'ForearmR':(-.10,0,0)}
  else:
   duty=.58 if not run else .40
   reach=.18 if not run else .235
   extension=total-(.006 if not run else .018)
   height=math.sqrt(extension**2-reach**2)+(extension-math.sqrt(extension**2-reach**2))*math.sin(phase)**2
   feet=[]
   for side,offset in [('L',0),('R',.5)]:
    t=(f/count+offset)%1;swing=t>=duty;p=(t-duty)/(1-duty) if swing else t/duty
    travel=-reach+2*reach*(p*p*(3-2*p)) if swing else reach-2*reach*p
    lift=math.sin(p*math.pi)**1.2*(.075 if not run else .19) if swing else 0
    height=min(height,math.sqrt(extension**2-travel**2)+lift)
    feet.append((side,travel,lift))
   rig.pose.bones['Body'].location.z=height-total
   for side,travel,lift in feet:
    y=height-lift;d=min(math.hypot(y,travel),total-.0001)
    knee=math.pi-math.acos(clamp((upper**2+lower**2-d*d)/(2*upper*lower)))
    hip=-math.atan2(travel,y)-math.acos(clamp((upper**2+d*d-lower**2)/(2*upper*d)))
    rotations['Leg'+side]=(hip,0,0);rotations['Shin'+side]=(knee,0,0);rotations['Foot'+side]=(-hip-knee,0,0)
    swing=math.cos(phase+(0 if side=='L' else math.pi))
    rotations['Arm'+side]=(swing*(.24 if not run else .57),0,0)
    rotations['Forearm'+side]=(-.16 if not run else -1.12-.10*max(0,-swing),0,0)
   rotations['Torso']=(.03 if not run else .14,.015*math.sin(phase),.02*math.cos(phase))
   rotations['Head']=(-.015 if not run else -.05,0,0)
  for n,angles in rotations.items():rig.pose.bones[n].rotation_quaternion=Euler(angles,'XYZ').to_quaternion()
  for bone in rig.pose.bones:
   bone.keyframe_insert('location',frame=f+1);bone.keyframe_insert('rotation_quaternion',frame=f+1)
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
rig.animation_data.action=None
for bone in rig.pose.bones:bone.location=(0,0,0);bone.rotation_quaternion=(1,0,0,0)
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=193

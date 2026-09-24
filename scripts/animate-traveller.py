"""Author the same planted-foot cycle used by gait3d.ts in the Blender source."""
import bpy, math, os
from mathutils import Vector
def animate():
    objects=bpy.data.objects
    for name in ['Body','Torso','Head','Backpack','ArmL','ArmR','LegL','LegR','ShinL','ShinR','FootL','FootR']:
        objects[name].animation_data_clear()
    for frame in range(1,50):
        phase=(frame-1)/48*math.tau
        body=objects['Body'];body.location.z=-.105+math.cos(phase*2)*.005;body.keyframe_insert('location',frame=frame)
        torso=objects['Torso'];torso.rotation_euler=(.045,-math.sin(phase)*.045,0);torso.keyframe_insert('rotation_euler',frame=frame)
        head=objects['Head'];head.rotation_euler.y=.045-math.sin(phase-.3)*.025;head.keyframe_insert('rotation_euler',frame=frame)
        pack=objects['Backpack'];pack.rotation_euler.x=math.sin(phase-.6)*.035;pack.keyframe_insert('rotation_euler',frame=frame)
        for suffix in ['L','R']:
            t=(phase/math.tau+(0 if suffix=='L' else .5))%1
            swing=t>=.5;p=(t-.5)*2 if swing else t*2
            z=-.2+.4*p*p*(3-2*p) if swing else .2-.4*p
            lift=math.sin(p*math.pi)*.095 if swing else 0
            y=.51-lift+math.cos(phase*2)*.005;a=.29;b=.265;d=min(math.hypot(y,z),a+b-.0001)
            clamp=lambda x:max(-1,min(1,x))
            knee=math.pi-math.acos(clamp((a*a+b*b-d*d)/(2*a*b)))
            hip=-math.atan2(z,y)+math.acos(clamp((a*a+d*d-b*b)/(2*a*d)))
            for name,angle in [('Leg',hip),('Shin',-knee),('Foot',-hip+knee),('Arm',-math.sin(phase+(0 if suffix=='L' else math.pi)-.2)*.24)]:
                o=objects[name+suffix];o.rotation_euler.x=angle;o.keyframe_insert('rotation_euler',frame=frame)
    bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=49;bpy.context.scene.render.fps=39;bpy.context.scene.frame_set(1)
if __name__=='__main__':
    animate()
    hero=bpy.data.objects['Traveller'];position=hero.location.copy();hero.location=(0,0,0)
    bpy.ops.object.select_all(action='DESELECT');hero.select_set(True)
    for o in hero.children_recursive:o.select_set(True)
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public','assets','3d','traveller.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=True)
    hero.location=position
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'art','Shadowborn-Cartoon.blend'))
    print('PLANTED_WALK_SAVED')

import bpy,os,math
from mathutils import Vector,Quaternion
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'art/First-Adventure-Room.blend'))
angles={'ChestLid':1.30,'CabinetLeft':-1.55,'CabinetRight':1.55,'DoorHinge':1.35}
for name,angle in angles.items():bpy.data.objects[name]['openAngle']=angle
room=bpy.data.objects['FirstAdventureRoom'];bpy.ops.object.select_all(action='DESELECT');room.select_set(True)
for o in room.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public/assets/3d/adventure-room.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_image_format='AUTO')
bpy.data.orphans_purge(do_recursive=True);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'art/First-Adventure-Room.blend'),compress=True)
s=bpy.context.scene;s.cycles.samples=4
for name in ['ChestLid','CabinetLeft','CabinetRight','BookCover','DoorHinge']:
 o=bpy.data.objects[name];axis=o['axis'];o.rotation_mode='QUATERNION';o.rotation_quaternion=Quaternion(Vector((axis[0],-axis[2],axis[1])),o['openAngle'])
s.render.filepath=os.path.join(root,'art/imported-room/open-room.png');bpy.ops.render.render(write_still=True)

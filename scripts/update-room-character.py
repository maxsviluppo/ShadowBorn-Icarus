"""Replace the procedural traveller in the editable room with the textured rig."""
import bpy,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
room_path=os.path.join(ROOT,'art','Shadowborn-Cartoon.blend')
bpy.ops.wm.open_mainfile(filepath=room_path)
old=bpy.data.objects.get('Traveller')
position=old.location.copy() if old else (1.6,-2.8,.07)
if old:
 for o in [*old.children_recursive,old]:bpy.data.objects.remove(o,do_unlink=True)
with bpy.data.libraries.load(os.path.join(ROOT,'art','Traveller-Textured.blend'),link=False) as (source,destination):destination.objects=['Traveller','TexturedTraveller']
for o in destination.objects:
 if o:bpy.context.collection.objects.link(o)
rig=bpy.data.objects['Traveller'];rig.location=position
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=49;bpy.context.scene.frame_set(1)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=room_path)
print('ROOM_CHARACTER_UPDATED')

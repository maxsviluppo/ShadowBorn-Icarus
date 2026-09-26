"""Keep a packed high-resolution Blender master without modifying the user's OBJ."""
import bpy,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SRC=os.path.join(ROOT,'art','imported-character')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(SRC,'d108fe4df634cbfb5984d5ed978e0f42.obj'))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC,'Traveller-Original-HighRes.blend'))

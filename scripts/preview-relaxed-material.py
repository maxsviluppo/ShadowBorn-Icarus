"""Offline material/pose review, not a browser screenshot.

Approximate the game's lifted painted colour with shader nodes. No source
image or UV is rewritten. Standard display transform avoids AgX desaturation.
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'art/relaxed-character'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'public/assets/3d/shirt-hero.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for track in rig.animation_data.nla_tracks:track.mute=True
rig.animation_data.action=bpy.data.actions['Idle'];bpy.context.scene.frame_set(1)
for m in bpy.data.materials:
 if not m.use_nodes:continue
 n=m.node_tree.nodes;l=m.node_tree.links
 bs=next((x for x in n if x.type=='BSDF_PRINCIPLED'),None)
 if not bs or not bs.inputs['Base Color'].links:continue
 tex=bs.inputs['Base Color'].links[0].from_socket
 sat=n.new('ShaderNodeHueSaturation');sat.inputs['Saturation'].default_value=1.1;l.new(tex,sat.inputs['Color'])
 gamma=n.new('ShaderNodeGamma');gamma.inputs['Gamma'].default_value=.72;l.new(sat.outputs[0],gamma.inputs['Color'])
 l.new(gamma.outputs[0],bs.inputs['Base Color']);l.new(gamma.outputs[0],bs.inputs['Emission Color'])
 bs.inputs['Emission Strength'].default_value=.55;bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=1
 bs.inputs['Specular IOR Level'].default_value=0
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True
s.view_settings.view_transform='Standard';s.view_settings.look='Medium High Contrast'
s.render.resolution_x=500;s.render.resolution_y=650;s.render.resolution_percentage=100;s.render.film_transparent=True
s.world=bpy.data.worlds.new('Soft ambient');s.world.use_nodes=True;next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.2,.2,.2,1)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=140;bpy.context.object.data.size=4
bpy.context.object.rotation_euler=(Vector((0,0,.8))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-4,2));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.95
cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
s.render.filepath=str(O/'material-review.png');bpy.ops.render.render(write_still=True)

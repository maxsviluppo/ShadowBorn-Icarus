import bpy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=r'C:\Users\Max\Downloads\A Codici Main\Barnaby-Pixelart-Animazioni\Braccio-borsa\Barnaby-Animated.blend')
rig=bpy.data.objects['Barnaby'];mesh=bpy.data.objects['Barnaby_Skin']
for mat in mesh.data.materials:
 for n in list(mat.node_tree.nodes):
  if n.type=='TEX_IMAGE':
   if n.image and n.image.name=='texture_pbr_20250901':n.image.scale(2048,2048);n.interpolation='Closest';n.image.pack()
   else:mat.node_tree.nodes.remove(n);continue
  if n.type=='BSDF_PRINCIPLED':
   n.inputs['Roughness'].default_value=.95;n.inputs['Metallic'].default_value=0
   for socket in ['Normal','Metallic','Roughness']:
    for link in list(n.inputs[socket].links):mat.node_tree.links.remove(link)
   n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=.95
rig.animation_data.action=None
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/barnaby.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_extras=True,export_image_format='JPEG',export_jpeg_quality=95)
print('BARNABY_WEB_READY')

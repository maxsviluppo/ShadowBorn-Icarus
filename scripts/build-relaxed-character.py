"""Rig the supplied October 9 relaxed OBJ without reshaping its hands or shoulders.

The two supplied OBJ archives are byte-identical. The GLB shares the same
base-colour image and has no rig. Keep source proportions; fit uniformly to
the existing 1.60 m character slot. Automatic bone heat uses anatomical bone
segments, then the rest axes are canonicalized for the game's procedural poses.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'art/relaxed-character'
cache=O/'Relaxed-GameSource.blend'
bpy.ops.wm.open_mainfile(filepath=str(cache if cache.exists() else O/'Relaxed-Originale.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');mesh.name='RelaxedHero_Skin'
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
if not cache.exists():
 mod=mesh.modifiers.new('Game mesh','DECIMATE');mod.ratio=min(1,90000/len(mesh.data.polygons))
 bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.ops.wm.save_as_mainfile(filepath=str(cache))
floor=min(v.co.z for v in mesh.data.vertices)
height=max(v.co.z for v in mesh.data.vertices)-floor;scale=1.6/height
for v in mesh.data.vertices:v.co=(v.co-Vector((0,0,floor)))*scale
def point(p):return (Vector(p)-Vector((0,0,floor)))*scale
pivots={'Body':(0,0,0),'Torso':(0,0,.55),'Head':(0,0,.875)}
parents={'Torso':'Body','Head':'Torso'}
tails={'Body':(0,0,.15),'Torso':(0,0,.875),'Head':(0,0,1.10)}
for side,sign in [('L',-1),('R',1)]:
 pivots.update({'Arm'+side:(sign*.132,0,.825),'Forearm'+side:(sign*.192,-.003,.655),
  'Hand'+side:(sign*.199,-.034,.448),'Leg'+side:(sign*.081,0,.55),
  'Shin'+side:(sign*.115,0,.285),'Foot'+side:(sign*.14,0,.095)})
 parents.update({'Arm'+side:'Torso','Forearm'+side:'Arm'+side,'Hand'+side:'Forearm'+side,
  'Leg'+side:'Body','Shin'+side:'Leg'+side,'Foot'+side:'Shin'+side})
 tails.update({'Arm'+side:pivots['Forearm'+side],'Forearm'+side:pivots['Hand'+side],
  'Hand'+side:(sign*.199,-.034,.415),'Leg'+side:pivots['Shin'+side],
  'Shin'+side:pivots['Foot'+side],'Foot'+side:(sign*.14,-.10,.035)})
data=bpy.data.armatures.new('RelaxedHero_Rig');rig=bpy.data.objects.new('RelaxedHero',data)
bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,p in pivots.items():
 bone=data.edit_bones.new(name);bone.head=point(p);bone.tail=point(tails[name])
 bone.use_deform=not(name=='Body' or name.startswith('Hand'))
for name,parent in parents.items():data.edit_bones[name].parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
mesh.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
if not mesh.vertex_groups:raise RuntimeError('Bone heat did not create skin weights')
# The generated source welds the inside of the right cuff to the hip/pouch.
# Separate only that hidden contact seam, before it can stretch into a ribbon.
arm_groups={g.index for g in mesh.vertex_groups if g.name.startswith(('Arm','Forearm'))}
labels={};zone=set()
for v in mesh.data.vertices:
 x,y,z=v.co/scale+Vector((0,0,floor))
 a=sum(g.weight for g in v.groups if g.group in arm_groups)
 labels[v.index]=a>=.5
 if abs(x)>.10 and .40<z<.64:zone.add(v.index)
cut_faces=[f.index for f in mesh.data.polygons if all(i in zone for i in f.vertices) and len({labels[i] for i in f.vertices})>1]
import bmesh
bm=bmesh.new();bm.from_mesh(mesh.data);bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[bm.faces[i] for i in cut_faces],context='FACES')
boundaries=[e for e in bm.edges if e.is_boundary]
if boundaries:
 uv=bm.loops.layers.uv.active
 cap=bmesh.ops.holes_fill(bm,edges=boundaries,sides=0)
 for f in cap['faces']:
  for loop in f.loops:
   neighbours=[l for l in loop.vert.link_loops if l.face not in cap['faces']]
   if neighbours:loop[uv].uv=neighbours[0][uv].uv.copy()
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh.data);bm.free()
# Recompute heat on the separated surface, so the cuff no longer inherits
# the hip's motion and no hard weight boundary is introduced at the armpit.
mesh.vertex_groups.clear()
for mod in list(mesh.modifiers):
 if mod.type=='ARMATURE':mesh.modifiers.remove(mod)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('Separated hidden cuff contact faces:',len(cut_faces),flush=True)
# Preserve the automatic surface-connected weights around the close-fitting
# sleeves. Hard spatial masks would incorrectly grab adjacent pouch vertices.
for v in mesh.data.vertices:
 if v.co.z/scale+floor>.93:
  for g in list(v.groups):mesh.vertex_groups[g.group].remove([v.index])
  mesh.vertex_groups['Head'].add([v.index],1,'REPLACE')
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
unweighted=[v.index for v in mesh.data.vertices if not v.groups]
if unweighted:raise RuntimeError(f'{len(unweighted)} unweighted vertices')
# The game's local X rotations expect these canonical rest axes.
bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for bone in data.edit_bones:
 bone.tail=bone.head+Vector((0,.08 if not bone.name.startswith('Hand') else .03,0));bone.roll=0
bpy.ops.object.mode_set(mode='OBJECT')
for poly in mesh.data.polygons:poly.use_smooth=True
for mat in mesh.data.materials:
 for n in list(mat.node_tree.nodes):
  if n.type=='TEX_IMAGE' and n.image:
   if any(t in n.image.name for t in ['metallic','roughness','normal']):mat.node_tree.nodes.remove(n)
   else:n.image.pack();n.interpolation='Closest'
  elif n.type=='BSDF_PRINCIPLED':
   n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=1
   n.inputs['Specular IOR Level'].default_value=0
exec(compile((R/'scripts/animate-shirt.py').read_text(encoding='utf-8'),str(R/'scripts/animate-shirt.py'),'exec'))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/shirt-hero.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_jpeg_quality=96)
for track in rig.animation_data.nla_tracks:track.mute=True
rig.animation_data.action=bpy.data.actions.get('Shirt_Idle');bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Relaxed-Animato.blend'))
(O/'build-info.json').write_text(json.dumps({'sourceHeight':height,'uniformScale':scale,'targetHeight':1.6,
 'triangles':len(mesh.data.polygons),'handReshaping':False,'shoulderReshaping':False,
 'source':'df9772838e3372cd8f7ab4dc4a59d6df.obj','texture':'original full-resolution base colour'},indent=2),encoding='utf-8')
print('RELAXED_READY',len(mesh.data.polygons),flush=True)

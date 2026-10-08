"""Exchange the two hands, correct thumb orientation and reduce them by 30%.

Run on the cached T-pose before skinning. Split at each wrist, preserve the
original hand UVs, exchange the pieces and bridge each wrist to its forearm.
"""
import bmesh
bm=bmesh.new();bm.from_mesh(mesh.data)
cut=.435
for sign in [-1,1]:
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,
  plane_co=(sign*cut,0,0),plane_no=(1,0,0),clear_inner=False,clear_outer=False)
groups={}
for sign in [-1,1]:
 faces=[f for f in bm.faces if sign*f.calc_center_median().x>cut+1e-6]
 bmesh.ops.split(bm,geom=faces,use_only_faces=True)
 faces=[f for f in bm.faces if sign*f.calc_center_median().x>cut+1e-6]
 verts={v for f in faces for v in f.verts}
 boundary=[e for e in bm.edges if e.is_boundary and all(v in verts for v in e.verts) and all(abs(abs(v.co.x)-cut)<1e-5 for v in e.verts)]
 ring={v for e in boundary for v in e.verts}
 center=sum((v.co for v in ring),Vector())/len(ring)
 groups[sign]=(verts,boundary,center)
swap=Matrix.Rotation(math.pi,4,'Z');roll=Matrix.Rotation(-math.pi/2,4,'X')
hand_vertices=groups[-1][0]|groups[1][0]
for v in bm.verts:
 if v in hand_vertices or abs(v.co.x)<.38:continue
 center=groups[1 if v.co.x>0 else -1][2]
 t=min(1,max(0,(abs(v.co.x)-.38)/(cut-.38)));t=t*t*(3-2*t)
 v.co.y=center.y+(v.co.y-center.y)*(1-.3*t)
 v.co.z=center.z+(v.co.z-center.z)*(1-.3*t)
for sign,(verts,boundary,center) in groups.items():
 target=groups[-sign][2]+Vector((-sign*.014,0,0))
 for v in verts:v.co=target+roll@swap@(v.co-center)*.7
 # Join the transformed hand ring to the opposite original forearm ring.
 arm_edges=[e for e in bm.edges if e.is_boundary and e not in boundary
  and all(abs(v.co.x+sign*cut)<1e-5 for v in e.verts)
  and not any(v in groups[-sign][0] for v in e.verts)]
 if not arm_edges:raise RuntimeError('Missing forearm wrist ring')
 uv_layer=bm.loops.layers.uv.active
 skin_uv=arm_edges[0].verts[0].link_loops[0][uv_layer].uv.copy()
 joined=bmesh.ops.bridge_loops(bm,edges=boundary+arm_edges,use_pairs=False)
 # Newly created seam faces must sample skin, never the atlas origin.
 for face in joined['faces']:
  for loop in face.loops:loop[uv_layer].uv=skin_uv
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(mesh.data);bm.free();mesh.data.update()

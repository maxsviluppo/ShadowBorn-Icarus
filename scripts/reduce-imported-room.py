import bpy,os,numpy as np,json
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'art/imported-room/Room-Original.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
a=np.array([v.co[:] for v in o.data.vertices]);x,y,z=a.T
for name,mask in [('floor',(x<0)&(x>-.2)&(y<0)&(y>-.2)&(z<.07)),('chest',(x>-.39)&(x<-.21)&(y>.06)&(y<.20)&(z>.04)),('cabinet',(x>.10)&(x<.205)&(y>-.275)&(y<-.075)&(z>.04)),('door',(x>.20)&(x<.23)&(y>-.42)&(y<-.29)&(z>.09)&(z<.55))]:
 b=a[mask];print(name,len(b),np.round(np.quantile(b,[0,.05,.5,.95,1],axis=0),4).tolist(),flush=True)
mod=o.modifiers.new('Web optimization','DECIMATE');mod.ratio=220000/len(o.data.polygons);bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'art/imported-room/Room-Reduced.blend'),compress=True)

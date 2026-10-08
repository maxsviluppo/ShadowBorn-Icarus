// Non-destructive texture grading in linear colour space, before scene lighting.
// Geometry, UVs and the source colour map are unchanged.
export const CHARACTER_TEXTURE_GRADE=`
#include <map_fragment>
#ifdef USE_MAP
 float clothLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
 vec3 cellPigment=max(mix(vec3(clothLuma),diffuseColor.rgb,1.06),vec3(0.0));
 // Open the painted shadows and keep the reference's ivory shirt, brown leather
 // and warm skin readable at the room's small pixel resolution.
 cellPigment=pow(cellPigment,vec3(0.78))*vec3(1.05,1.025,0.97);
 cellPigment+=vec3(0.010,0.006,0.003)*(1.0-clothLuma);
 diffuseColor.rgb=min(cellPigment,vec3(0.97,0.93,0.84));
#endif
`;

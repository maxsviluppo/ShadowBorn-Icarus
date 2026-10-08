// Non-destructive texture grading in linear colour space, before scene lighting.
// Geometry, UVs and the source colour map are unchanged.
export const CHARACTER_TEXTURE_GRADE=`
#include <map_fragment>
#ifdef USE_MAP
 float clothLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
 vec3 cellPigment=mix(vec3(clothLuma),diffuseColor.rgb,0.94);
 cellPigment*=vec3(1.08,1.015,0.84);
 cellPigment+=vec3(0.014,0.007,0.003)*(1.0-clothLuma);
 diffuseColor.rgb=min(cellPigment,vec3(0.88,0.82,0.70));
#endif
`;

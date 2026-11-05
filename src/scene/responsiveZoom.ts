/** Keep the complete site visible on narrow canvases while preserving the desktop framing. */
export function responsiveZoomForWidth(width:number){
 return Math.min(9.7,Math.max(3.2,9.7*Math.min(1,width/1024)));
}

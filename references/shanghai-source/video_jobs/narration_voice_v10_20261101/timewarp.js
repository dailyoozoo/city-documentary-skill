(() => {
 const render=window.renderAt;
 window.V8_OLD_TIME=t=>{const a=window.V8_WARP;for(let i=1;i<a.length;i++)if(t<=a[i][1]){const p=a[i-1],q=a[i];return p[0]+(q[0]-p[0])*Math.max(0,(t-p[1])/(q[1]-p[1]));}return a.at(-1)[0];};
 window.renderAt=t=>{window.V8_AUDIO_TIME=t;render(window.V8_OLD_TIME(t));};
})();
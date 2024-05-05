import {Curtains, Plane,Vec2,ShaderPass} from 'curtainsjs';
import Lenis from '@studio-freight/lenis';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis()



function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)


window.addEventListener("load", () => {
    
    // set up our WebGL context and append the canvas to our wrapper
    const curtains = new Curtains({
        container: "canvas",
       
        pixelRatio: Math.min(1.5, window.devicePixelRatio) // limit pixel ratio for performance
    });

    curtains.onRender(() => {
        // update our planes deformation
        // increase/decrease the effect
        planesDeformations = curtains.lerp(planesDeformations, 0, 0.075);
    }).onScroll(() => {
        // get scroll deltas to apply the effect on scroll
        const delta = curtains.getScrollDeltas();

        // invert value for the effect
        delta.y = -delta.y;

        // threshold
        if(delta.y > 60) {
            delta.y = 60;
        }
        else if(delta.y < -60) {
            delta.y = -60;
        }

        if(Math.abs(delta.y) > Math.abs(planesDeformations)) {
            planesDeformations = curtains.lerp(planesDeformations, delta.y, 0.5);
        }
    }).onError(() => {
        // we will add a class to the document body to display original images
        document.body.classList.add("no-curtains", "planes-loaded");
    }).onContextLost(() => {
        // on context lost, try to restore the context
        curtains.restoreContext();
    });

    // we will keep track of all our planes in an array
    const planes = [];
    let planesDeformations = 0;

    // get our planes elements
    let planeElements = document.getElementsByClassName("gallery_image-wrapper");

    const vs = `

  
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  
  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;
  
  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  
  // Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
           
  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  
  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

    precision mediump float;


    
    
    

    // default mandatory variables
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    uniform mat4 planeTextureMatrix;

    // custom variables
    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;

    uniform float uPlaneDeformation;

    varying float vWave;
    uniform float uTime;

    void main() {
      

        
        
        vec3 vertexPosition = aVertexPosition;

        float noiseFreq = 6.0;
        float noiseAmp = 0.009; 
        
        vec3 noisePos = vec3(vertexPosition.x * noiseFreq + uTime*0.009, vertexPosition.y, vertexPosition.z);
        vertexPosition.z += snoise(noisePos) * noiseAmp;
        vWave = vertexPosition.z;

        // cool effect on scroll
        vertexPosition.y += sin(((vertexPosition.x + 1.0) / 2.0) * 3.141592) * (sin(uPlaneDeformation   / 90.0));

        gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);



        // varyings
        vVertexPosition = vertexPosition;
        vTextureCoord = (planeTextureMatrix * vec4(aTextureCoord, 0.0, 1.)).xy;
    }
`;

const fs = `
precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D planeTexture;

varying float vWave;
void main() {
    // just display our texture
    float wave = vWave * 0.95;

    vec3 texture = texture2D(planeTexture, vTextureCoord + wave).rgb;
    gl_FragColor = vec4(texture, 1.);

    // gl_FragColor = texture2D(planeTexture, vTextureCoord + wave).rgb;
}
`;

    // all planes will have the same parameters
    const params = {
        vertexShader: vs,
        fragmentShader: fs,
        widthSegments: 10,
        heightSegments: 10,
        fov: 45,
        texturesOptions: {
            minFilter: curtains.gl.LINEAR_MIPMAP_NEAREST
        },
        drawCheckMargins: {
            top: 100,
            right: 0,
            bottom: 100,
            left: 0,
        },
        uniforms: {
          time: {
            name: "uTime", // uniform name that will be passed to our shaders
            type: "1f", // this means our uniform is a float
            value:0, // initial value of the uniform
            },
            planeDeformation: {
                name: "uPlaneDeformation",
                type: "1f",
                value: 1,
            },
        }
    };

    
    // add our planes and handle them
    for(let i = 0; i < planeElements.length; i++) {
        planes.push(new Plane(curtains, planeElements[i], params));

        handlePlanes(i);
    }
   
    // handle all the planes
    function handlePlanes(index) {
        const plane = planes[index];

        // check if our plane is defined and use it
        plane.onReady(() => {
            
        }).onRender(() => {
            // update the uniform
            plane.uniforms.planeDeformation.value = planesDeformations;
            plane.uniforms.time.value++; // update our time uniform value

           
            
        });
    }

   
});

function update(e){


    var x = e.clientX || e.touches[0].clientX
    var y = e.clientY || e.touches[0].clientY
  
    document.documentElement.style.setProperty('--cursorX', x + 'px')
    document.documentElement.style.setProperty('--cursorY', y + 'px')
  }
  
  document.addEventListener('mousemove',update)
  document.addEventListener('touchmove',update)


// Gsap Menu
const ham = document.querySelector(".menu-icon4");
const menu = document.querySelector('.w-nav-overlay');
const links = menu.querySelector('.nav_menu');
let mm = gsap.matchMedia();

var tl = gsap.timeline({ paused: true });

mm.add("(max-width: 799px)", () => {
    tl.to(menu, {
        duration: 0,
        opacity: 1,
        
        
        display:'block',
    
    })
    tl.from(links, {
        duration: 0.6,
        opacity: 1,
        y: '-327px',
        stagger: 0.01,
        ease: 'expo.inOut',
    }, "-=0.3");

    tl.reverse();

ham.addEventListener('click', () => {
    console.log('HamBurger Clicked')
	tl.reversed(!tl.reversed());
});
  
  });






  console.log("%cSome Info About This Website:", 'font-size: 14px;font-weight:bold; color: #111111; font-family: "Swiss", Arial, sans-serif;');
  console.log("%cThis Website is a Dublicate of Dann Petty Website: https://www.dannpetty.com/ ", 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif;');
  console.log("%cWhy I create this Website?: To play with a Cool Library called Curtains.js", 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif; \n');
  console.log(`%c Problems I'm Facing in this Project: ${'\n'} There is a texture bleeding and I'm not yet able to find the perfect solution for it. I think I will ask for help on the Internet`, 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif;');

  
  console.log("%cHere is a complete list of all the libs used on this website:", 'font-size: 14px; font-weight:bold; color: #111111; font-family: "Swiss", Arial, sans-serif;'),
  console.log("%ccurtains.js: https://github.com/martinlaxenaire/curtainsjs", 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif;');
  console.log("%c Lenis for smooth scroll : https://github.com/darkroomengineering/lenis", 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif;');
  console.log("%cGSAP: https://gsap.com/", 'font-size: 11px; color: #111111; font-family: "Swiss", Arial, sans-serif;');


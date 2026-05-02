/*
  ©2025 -輪座-製作所 All rights reserved.
  Unauthorized copying, modification, or distribution is strictly prohibited.
*/

// テーマカラーの自動適用（白背景・黒文字）
document.body.style.backgroundColor = '#fff';
document.querySelector('.kanji').style.color = '#000';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl', { antialias: true });

const fragmentSource = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define g_Time u_time
#define g_TexelSize vec4(0, 0, u_resolution.x, u_resolution.y)
#define time g_Time
#define resolution g_TexelSize.zw

#define PI 3.14159265359

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

float renderScene(vec2 uv, float t) {
    float finalAlpha = 0.0;
    const int circleCount = 3; 

    for(int i = 1; i <= circleCount; i++) {
        float fi = float(i);
        float radius = 0.45 + fi * 0.18; 
        float thickness = 0.015; 
        
        float cycle = 1.2 + fi * 0.4;
        float phase = fract(t / cycle);
        float moveRatio = 0.6; 
        
        float move = smoothstep(0.0, moveRatio, phase);
        float effectTime = floor(t / cycle) + move;
        
        float angle = effectTime * (fi * 1.5); 
        float drawLength = (sin(effectTime * PI + fi) * 0.5 + 0.5) * PI * 2.0; 
        
        vec2 p = uv * rot(angle);
        float d = abs(length(p) - radius) - thickness;
        float a = atan(p.y, p.x) + PI;
        float mask = step(a, drawLength);
        
        float alpha = smoothstep(0.01, 0.0, d) * mask;
        finalAlpha = max(finalAlpha, alpha);
    }
    return 1.0 - finalAlpha;
}

void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    float timeOffset = 0.045; 

    float r = renderScene(uv, time);               
    float g = renderScene(uv, time - timeOffset);        
    float b = renderScene(uv, time - timeOffset * 2.0);  

    vec3 finalColor = vec3(r, g, b);
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

const vertexSource = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
gl.useProgram(program);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(program, 'u_time');
const resLoc = gl.getUniformLocation(program, 'u_resolution');

function render(now) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, now * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
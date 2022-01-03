# webgl-2022
The WebGL 1 and 2 APIs, if they were remade for 2022!

## Features
### Modern enum strings

* `gl.bindFramebuffer('framebuffer', fb);`
* `gl.texStorage2D('texture-2d', 1, 'rgba8', 1920, 1080);`
* Mix and match! `gl.texStorage2D('texture-2d', 1, gl.RGBA8, 1920, 1080);`


### Enum shortcuts

* `gl.bindFramebuffer('both', fb);`
* `gl.bindFramebuffer('draw-fb', fb);`
* `gl.bindFramebuffer('read-fb', fb);`
* `gl.texStorage2D('2d', 1, 'rgba8', 1920, 1080);`
* `gl.readPixels(0, 0, w, h, 'rgba', 'u8', data);`
* `gl.drawArrays('points', 0, N);`
   * Amusingly, this actually works in stock webgl, as gl.POINTS is `0`,
     and `undefined` also coerces to zero!
   `gl.drawArrays('triangles', 0, N)` is new, however!


### New string-returning queries:
* `gl.getErrorStr()`
   * `''` (`gl.NO_ERROR`)
      * E.g. `if (gl.getErrorStr()) throw 'oh no';`
   * `'out-of-memory'`
   * `'invalid-operation'`

* `gl.checkFramebufferIncompleteStr()`
   * `''` (`gl.FRAMEBUFFER_COMPLETE`)
      * E.g. `if (gl.checkFramebufferIncompleteStr()) throw 'oh no';
   * `'incomplete-dimensions'`
   * `'incomplete-missing-attachment'`

### Create a context that makes its own canvas

* `const webgl1 = WebGLRenderingContext.create({stenci:true});`
* `const webgl2 = WebGL2RenderingContext.create({antialias:false});`

### Inferred 2D/3D function choice

* `gl.texStorage('2d', 1, 'rgba8', w, h);`
* `gl.texStorage('2d', 1, 'rgba8', w, h, 1);`
* `gl.texStorage('2d-array', 1, 'rgba8', w, h, d);`

No `gl.texImage` or `gl.texSubImage` however, since you should use
`gl.createTexStorage` and `tex.setSubImage`.

### Some WebGL 1 extensions moved to core

* ANGLE_instanced_arrays
* EXT_blend_minmax
* OES_element_index_uint
* OES_standard_derivatives
* OES_vertex_array_object

`getExtension` will still return these, but you can also just use them
directly on `gl.`, like `gl.createVertexArray()` or `gl.drawArraysInstanced()`.

### WebGL 1 polyfills
* `webgl1.texStorage('2d', 3, 'rgba8', 100, 100);`

### Common patterns combined into helpful functions
```
gl.createCompleteFramebuffer({
    0: [tex], // boring tex2d
    1: [rb], // rb
    2: [cube_tex, 3, 2] // miplevel=3, face=POSITIVE_Y
    'depth-stencil': ['d24s8', 1920, 1080, 0] // DEPTH24_STENCIL8 1920x1080 non-multisampled
});
```
Returns `WebGLFramebuffer` if complete.
Otherwise, returns the string from `checkFramebufferIncompleteStr`.
Auto-collects any auto-generated resources (like the depth-stencil
attachment above).

```
const vbo = gl.createBufferData('array-buffer', VERTEX_DATA, 'static-draw');
//const vbo = gl.createBuffer();
//const was = gl.getParameter('array-buffer');
//gl.bindBuffer('array-buffer', vbo);
//gl.bufferData('array-buffer', VERTEX_DATA, 'static-draw');
//gl.bindBuffer('array-buffer', was);
```

```
const colors = gl.createTextureStorage('2d', 5, 'rgba8', W, H, 1);
const ints = gl.createTextureStorage('2d', 5, 'rgba8ui', W, H, 1, 'nearest');
const nomips = gl.createTextureStorage('2d', 1, 'rgba8', W, H, 1);
// Also sets CLAMP_TO_EDGE instead of REPEAT
```

```
const vs = gl.createCompiledShader('vertex-shader',
                     'void main() { gl_Position = vec4(0,0,0,1); }');
```

```
const VSRC = `\
   attribute vec3 aPosition;

   void main(void) {
      gl_PointSize = 50.0;
      gl_Position = vec4(aPosition, 1.0);
   }
`;
const FSRC = `\
   precision mediump float;

   uniform vec4 uColor;

   void main(void) {
      gl_FragColor = uColor;
   }
`;
prog = gl.createLinkedProgram(VSRC, FSRC, {'aPosition': 0});
//gl.bindAttribLocation(prog, 0, 'aPosition');
```
These compile the new shader and link the new program respectively,
but they don't check compile or link status.

```
const dstFb = null; // backbuffer
const mask = -1;
multisampledFb.resolveTo(dstFb, mask, 0, 0, W, H);
// blitFramebuffer, then srcFb.invalidateFramebuffer()
```

### New GLSL builtins
```
#if __VERSION__ >= 300
// FNV-1a: A solid and simple non-cryptographic hash.
// https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
int fnv1a32(int basis, int bytes) {
   const int PRIME = 0x01000193;
   for (int i = 0; i < 4; i++) {
      basisState ^= bytes & 0xff;
      bytes >>= 8;
      basisState *= PRIME;
   }
   return basisState;
}
int fnv1a32Begin(int bytes) {
   const int OFFSET_BASIS = 0x811c9dc5;
   return fnv1a32(OFFSET_BASIS, bytes);
}
#endif
```

Vertex shader only:
```
#if __VERSION__ >= 300
int autoPositionTrianglesQuad() {
   VERTS = [vec2(0,0), vec2(1,0), vec2(0,1),
            vec2(0,1), vec2(1,0), vec2(1,1)];
   gl_Position = vec4(VERTS[gl_VertexID % 6], 0, 1);
   return gl_VertexID / 6; // quad id
}
#endif
```

### Async!

```
async function myUpload() {
   const vbo = gl.createBufferData('array-buffer', VERTEX_DATA, 'static-draw');
   await fenceAsync();
   console.log('myUpload complete!');
   return vbo;
}
```

Async downloads: (see https://jdashg.github.io/misc/async-gpu-downloads.html)
```
const dstViewNowFilled = await gl.fetchSubData(srcByteOffset, dstView);
const data = await gl.fetchSubData(srcByteOffset, new Uint8Array(byteLen));
```

Easy color picking!
```
async function myColorPicker(fb, x, y) {
   const pixel = fb.fetchPixels(x, y, 1, 1, 'rgba', 'u8', new Uint8Array(4));
   return pixel;
}
```

### Jank-prone functions are now marked as such

* `buffer.demandSubDataJank` vs `buffer.fetchSubData`
* `fb.demandReadPixelsJank` vs `fb.fetchPixels` vs `fb.readPixelsPbo`
* `prog.demandLinkInfoJank` vs `prog.fetchLinkInfo` vs `prog.pollLinkInfo`

### Many object-specific functions now callable on objects

Some method names have minor changes to be more web-api-idiomatic.

* `gl.deleteTexture(tex)` => `tex.close()`
* `gl.getSyncParameter(sync, pname)` => `sync.getParameter(pname)`
* `gl.texSubImage()` => `tex.setSubImage()`
* `gl.compressedTexSubImage()` => `tex.compressedSetSubImage()`
* `gl.readPixels()` => `tex.setSubImage()`
* `gl.copyBufferSubData()` => `dstBuffer.copySubDataFrom(dstOffset, srcBuffer, srcOffset, byteLen)`
* `gl.blitFramebuffer()` => `srcFb.blitTo(dstFb, ...)`

### Rich program link info objects with attrib/uniform setters

```
   const VSRC = `\
      attribute vec3 aPosition;

      void main(void) {
         gl_PointSize = 50.0;
         gl_Position = vec4(aPosition, 1.0);
      }
   `;
   const FSRC = `\
      precision mediump float;

      uniform vec4 uColor;

      void main(void) {
         gl_FragColor = uColor;
      }
   `;
   prog = gl.createLinkedProgram(VSRC, FSRC);
   prog.info = prog.demandLinkInfoJank();

   gl.useProgram(prog);
[...]
   prog.info.attribs.aPosition.set(0.7, 0.0, +0.1);
   prog.info.uniforms.uColor.set(1.0, 0.0, 0.0, 1.0);
```

### Other quality-of-life improvements

* `gl.activeTexture(3)` (`gl.activeTexture(gl.TEXTURE3)`)
* `gl.bindTextureAt(4, '2d', tex)
   * Like bindSampler, bind `tex` to `TEXTURE4` directly.
* `gl.clear(-1)` (`gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT)`)
* `gl.setEnabled('scissor-test', true)`
* `gl.setEnabledVertexAttribArray(1, false)`
* `gl.drawBuffers([0, false, 2, false, true])`


## Todo

* Queries
* TransformFeedback
* Certain implicit-size sugars, e.g. `srcFb.resolveTo(dstFb, -1)`
* Extension support
   * While extension class object names aren't standardizied, we can
     probably do reliable prototype injection on-demand in getExtension.
* Testing!
* Profiling!
* Other features?
   * Renderpass-style sugaring?


## Claimed WebIDL changes

"Claimed" because it's all hand-written, so we expect to have bugs to fix.

### Both WebGL 1 and 2
```
enum WebGLError {
   "", // No error
   "out-of-memory",
   "context-lost",
   "invalid-enum",
   "invalid-value",
   "invalid-operation",
   "invalid-framebuffer-operation",
};

enum WebGLFramebufferIncompleteStatus {
   "", // Complete
   "incomplete-attachment',
   "incomplete-missing-attachment',
   "incomplete-dimensions',
   "unsupported',
   "incomplete-multisample',
   "incomplete-view-targets-ovr',
};

// WebGL 1 and 2
partial interface mixin WebGLRenderingContextBase {
   undefined close();
   undefined setEnabled(GLenum cap, boolean enabled);
   undefined setEnabledVertexAttribArray(GLuint index, boolean enabled);

   undefined bindTextureAt(GLuint unit, GLenum target, WebGLTexture? tex);

   WebGLBuffer createBufferData(GLenum target, GLsizeiptr size, GLenum usage);
   WebGLBuffer createBufferData(GLenum target, [AllowShared] ArrayBufferView srcData, GLenum usage,
                                optional GLuint srcOffset = 0,
                                optional GLuint srcLength = 0);

   WebGLTexture createTextureStorage(GLenum target, GLsizei levels, GLenum internalformat,
                                     GLsizei width, GLsizei height, GLsizei depth);

   WebGLError getErrorStr();
   WebGLFramebufferIncompleteStatus checkFramebufferIncompleteStr(GLenum target);

   any createCompleteFramebuffer(any argsByAttachId);
   WebGLRenderbuffer createRenderbufferStorage(GLenum internalformat,
                                               GLsizei width, GLsizei height,
                                               GLsizei samples);
   WebGLShader createCompiledShader(GLenum type, DOMString src);
   WebGLProgram createLinkedProgram(DOMString vertSrc, DOMString? fragSrc,
                                    optional any bindLocByAttribName);

};

partial interface WebGLBuffer {
   undefined resetData(GLsizeiptr size, GLenum usage);
   undefined resetData([AllowShared] ArrayBufferView srcData, GLenum usage,
                       optional GLuint srcOffset = 0,
                       optional GLuint srcLength = 0);

   undefined setSubData(GLintptr dstByteOffset,
                        [AllowShared] ArrayBufferView srcData,
                        optional GLuint srcOffset = 0,
                        optional GLuint srcLength = 0);

   undefined copySubDataFrom(GLintptr dstOffset,
                             WebGLBuffer srcBuffer, GLintptr srcOffset,
                             GLintptr byteLen);

   async ArrayBufferView fetchSubData(GLintptr srcByteOffset,
                                      [AllowShared] ArrayBufferView dstData);
   ArrayBufferView demandSubDataJank(GLintptr srcByteOffset,
                                     [AllowShared] ArrayBufferView dstData);
};

partial interface WebGLProgram {
   async any fetchLinkInfo();
   async any? pollLinkInfo();
   any demandLinkInfoJank();

   any getActiveUniformBlock(GLuint activeIndex);
   GLint getFragDataLocation(DOMString name);
   WebGLUniformLocation? getUniformLocation(DOMString name);
   undefined uniformBlockBinding(GLuint blockIndex, GLuint bufferIndex);
};

partial interface WebGLFramebuffer {
   undefined attach(GLenum target, GLenum attachpoint, WebGLRenderbuffer? rb);
   undefined attach(GLenum target, GLenum attachpoint, WebGLTexture tex,
                    GLuint miplevel, GLuint zlayerOrCubeFaceId);
   undefined attach(GLenum target, GLenum attachpoint, GLenum format,
                    GLsizei w, GLsizei h, GLsizei samples);

   //undefined blitTo(WebGLFramebuffer? dstFb, GLenum filter,
   //                 optional GLbitfield mask = -1);
   undefined blitTo(WebGLFramebuffer? dstFb, GLenum filter, GLbitfield mask,
                    GLint bothX0, GLint bothY0, GLint bothX1, GLint bothY1);
   undefined blitTo(WebGLFramebuffer? dstFb, GLenum filter, GLbitfield mask,
                    GLint srcX0, GLint srcY0, GLint srcX1, GLint srcY1,
                    GLint dstX0, GLint dstY0, GLint dstX1, GLint dstY1);

   //undefined resolveTo(WebGLFramebuffer? dstFb, GLenum filter,

   //undefined resolveTo(WebGLFramebuffer? dstFb, optional GLbitfield mask = -1);
   undefined resolveTo(WebGLFramebuffer? dstFb, GLbitfield mask,
                       GLint bothX0, GLint bothY0, GLint bothX1, GLint bothY1);

   undefined demandReadPixelsJank(GLint x, GLint y, GLsizei width, GLsizei height,
                                  GLenum format, GLenum type, GLintptr pboOffset);
   undefined demandReadPixelsJank(GLint x, GLint y, GLsizei width, GLsizei height,
                                  GLenum format, GLenum type,
                                  [AllowShared] ArrayBufferView dstData,
                                  GLuint dstOffset);

   undefined readPixelsPbo(WebGLBuffer pbo, GLint x, GLint y, GLsizei width, GLsizei height,
                           GLenum format, GLenum type, GLintptr pboOffset);

   async ArrayBufferView fetchPixels(GLint x, GLint y,
                                     GLsizei width, GLsizei height,
                                     GLenum format, GLenum type,
                                     [AllowShared] ArrayBufferView dstData);
};

partial interface WebGLRenderbuffer {
   any getParameter(GLenum pname);
};
partial interface WebGLSync {
   any getParameter(GLenum pname);
};
partial interface WebGLTexture {
   undefined generateMipmap();

   // Like texSubImage3D
   undefined setSubImage(GLint miplevel, GLint xoffset, GLint yoffset, GLint zoffset,
                         GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
                         GLintptr pboOffset);
   undefined setSubImage(GLint miplevel, GLint xoffset, GLint yoffset, GLint zoffset,
                         GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
                         TexImageSource source); // May throw DOMException
   undefined setSubImage(GLint miplevel, GLint xoffset, GLint yoffset, GLint zoffset,
                         GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type,
                         [AllowShared] ArrayBufferView? srcData, optional GLuint srcOffset = 0);

   // Like compressedTexSubImage3D
   undefined compressedSetSubImage3D(GLint miplevel, GLint xoffset, GLint yoffset,
                                     GLint zoffset, GLsizei width, GLsizei height, GLsizei depth,
                                     GLenum format, GLsizei imageSize, GLintptr offset);
   undefined compressedSetSubImage3D(GLint miplevel, GLint xoffset, GLint yoffset,
                                     GLint zoffset, GLsizei width, GLsizei height, GLsizei depth,
                                     GLenum format, [AllowShared] ArrayBufferView srcData,
                                     optional GLuint srcOffset = 0,
                                     optional GLuint srcLengthOverride = 0);
};
```

### WebGL 1 only
```
partial interface WebGLRenderingContext {
   undefined drawBuffers(sequence<GLenum> buffers);
   undefined vertexAttribDivisor(GLuint index, GLuint divisor);
   undefined drawArraysInstanced(GLenum mode, GLint first, GLsizei count,
                                 GLsizei instanceCount);
   undefined drawElementsInstanced(GLenum mode, GLsizei count, GLenum type,
                                   GLintptr offset, GLsizei instanceCount);

   undefined texStorage2D(GLenum target, GLsizei levels, GLenum internalformat,
                          GLsizei width, GLsizei height);

   WebGLVertexArrayObject? createVertexArray();
   undefined deleteVertexArray(WebGLVertexArrayObject? vertexArray);
   [WebGLHandlesContextLoss] GLboolean isVertexArray(WebGLVertexArrayObject? vertexArray);
   undefined bindVertexArray(WebGLVertexArrayObject? array);
};
```

### WebGL 2 only
```
partial interface mixin WebGL2RenderingContextBase {
   async undefined fenceAsync();
};
```

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

{
   const GL = WebGL2RenderingContext; // Easier to type `GL.RGBA`.

   // Let's start off strong!
   WebGLRenderingContext.create = function(attribs) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.getContext('webgl', attribs);
   }
   WebGL2RenderingContext.create = function(attribs) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.getContext('webgl2', attribs);
   }

   // Consider these extensions core:
   const WEBGL1_CORE_EXTS = [
      'ANGLE_instanced_arrays',
      'EXT_blend_minmax',
      'OES_element_index_uint',
      'OES_standard_derivatives',
      'OES_vertex_array_object',
      // No need to request early:
      //'WEBGL_debug_renderer_info',
      //'WEBGL_lose_context',
   ];
   const WEBGL2_CORE_EXTS = [
      // No need to request early:
      //'WEBGL_debug_renderer_info',
      //'WEBGL_lose_context',
   ];

   // -

   function* range(n) {
      for (let i = 0; i < n; i++) {
         yield i;
      }
   }

   function sleepPromise(ms) {
      return new Promise(go => {
         setTimeout(go, ms);
      });
   }

   // requiredArg = requiredArg || throwv('`requiredArg` is required!');
   function throwv(v) {
      throw v;
   }

   /// Prefer `invoke(() => { ... })` to `(() => { ... })()`
   /// This way, it's clear up-front that we're calling not just defining.
   function invoke(fn) {
      return fn();
   }

   function replacePrefix(str, possiblePrefix, replacement) {
      replacement = replacement || '';
      if (!str.startsWith(possiblePrefix)) {
         return str;
      }
      return replacement + str.substr(possiblePrefix.length);
   }

   // -

   function kebabToUpperSnake(str) {
      return str.toUpperCase().replaceAll('-', '_');
   }
   function upperSnakeToKebab(str) {
      return str.toLowerCase().replaceAll('_', '-');
   }

   // -

   const FULL_BY_ALIAS = {
      i8: 'byte',
      u8: 'unsigned-byte',
      f16: 'half-float',
      i16: 'short',
      u16: 'unsigned-short',
      f32: 'float',
      i32: 'int',
      u32: 'unsigned-int',
      rb: 'renderbuffer',
      fb: 'framebuffer',
      'draw-fb': 'draw-framebuffer',
      'read-fb': 'read-framebuffer',
      '2d': 'texture-2d',
      'cube-map': 'texture-cube-map',
      '3d': 'texture-3d',
      '2d-array': 'texture-2d-array',
      'cube-map-plus-x': 'texture-cube-map-positive-x',
      'cube-map-plus-y': 'texture-cube-map-positive-y',
      'cube-map-plus-z': 'texture-cube-map-positive-z',
      'cube-map-minus-x': 'texture-cube-map-negative-x',
      'cube-map-minus-y': 'texture-cube-map-negative-y',
      'cube-map-minus-z': 'texture-cube-map-negative-z',
   };
   const ALIAS_BY_FULL = Object.fromEntries(Object.entries(FULL_BY_ALIAS).map(([k,v]) => [v,k]));

   WebGLRenderingContext.prototype.TEXTURE_CUBE_MAP_FACE0 = GL.TEXTURE_CUBE_MAP_POSITIVE_X;
   WebGL2RenderingContext.prototype.TEXTURE_CUBE_MAP_FACE0 = GL.TEXTURE_CUBE_MAP_POSITIVE_X;

   // -

   const BINDING_BY_TARGET = new Map();
   {
      const add = (target_name, binding_name) => {
         const target_val = WebGL2RenderingContext[target_name];
         const binding_val = WebGL2RenderingContext[binding_name];
         if (target_val) {
            console.assert(binding_val, binding_name);
         }
         BINDING_BY_TARGET.set(target_val, binding_val);
      };
      add('RENDERBUFFER', 'RENDERBUFFER_BINDING');
      add('TEXTURE_2D', 'TEXTURE_BINDING_2D');
      add('TEXTURE_CUBE_MAP', 'TEXTURE_BINDING_CUBE_MAP');
      add('TEXTURE_3D', 'TEXTURE_BINDING_3D');
      add('TEXTURE_2D_ARRAY', 'TEXTURE_BINDING_2D_ARRAY');
      add('FRAMEBUFFER', 'FRAMEBUFFER_BINDING');
      add('DRAW_FRAMEBUFFER', 'DRAW_FRAMEBUFFER_BINDING');
      add('READ_FRAMEBUFFER', 'READ_FRAMEBUFFER_BINDING');
   }

   // -
   // toEnumVal, fromEnumVal

   const TO_ENUM_VAL_CACHE = {};
   function toEnumVal(inVal) {
      if (typeof(inVal) != 'string') return inVal;

      const cached = TO_ENUM_VAL_CACHE[inVal];
      if (cached !== undefined) return cached;

      let ret = inVal;
      ret = FULL_BY_ALIAS[ret] || ret;
      ret = kebabToUpperSnake(ret);
      ret = GL[ret];
      if (ret === undefined) {
         console.error(`toEnumVal('${inVal}') undefined!`);
      }

      TO_ENUM_VAL_CACHE[inVal] = ret;
      return ret;
   }

   const FROM_ENUM_VAL_CACHE = {};
   function fromEnumVal(inVal) {
      if (!inVal) return inVal;

      const cached = FROM_ENUM_VAL_CACHE[inVal];
      if (cached !== undefined) return cached;

      for (const [k,v] of Object.entries(GL)) {
         if (v == inVal) {
            let ret = k;
            ret = upperSnakeToKebab(ret);
            ret = ALIAS_BY_FULL[ret] || ret;

            FROM_ENUM_VAL_CACHE[inVal] = ret;
            return ret;
         }
      }
      console.error(`fromEnumVal(${code(inVal)}) undefined!`);
      return inVal;
   }

   // -
   // `${code(argname)} must be ${code(required)}!`
   // w/ argname='foo' =>
   // "`foo` must be `-1`!" OR
   // "`foo` must be 'framebuffer'!"

   function code(str) {
      if (typeof(val) == 'string') {
         return `'` + val + `'`;
      }
      return '`' + str + '`';
   }

   // -

   const OBJECT_KINDS = [
      'Buffer',
      'Framebuffer',
      'Program',
      'Query',
      'Renderbuffer',
      'Sampler',
      'Shader',
      'Sync',
      'Texture',
      'TransformFeedback',
      'VertexArray',
   ];

   function overrideByKey(obj, key, fnNewValFromOld) {
      obj[key] = fnNewValFromOld(obj[key]);
   }

   function overrideWebglByKey(key, fnNewValFromOld) {
      overrideByKey(WebGLRenderingContext.prototype,
         key, fnNewValFromOld);
      overrideByKey(WebGL2RenderingContext.prototype,
         key, fnNewValFromOld);
   }

   // -

   overrideByKey(HTMLCanvasElement.prototype, 'getContext', (old) => {
      return function() {
         const ret = old.call(this, ...arguments);
         if (ret) {
            switch (arguments[0]) {
            case 'webgl':
               for (const name of WEBGL1_CORE_EXTS) {
                  ret.getExtension(name);
               }
               break;
            case 'webgl2':
               for (const name of WEBGL2_CORE_EXTS) {
                  ret.getExtension(name);
               }
               break;
            }
         }
         return ret;
      };
   });

   // -
   // hook createObject etc. for GL_BY_OBJ.

   const GL_BY_CHILD = new WeakMap();

   {
      const makeObserveChildReturned = (prev) => {
         if (!prev) return prev; // Ignore unless exists.
         return function() {
            const ret = prev.call(this, ...arguments);
            if (ret) {
               GL_BY_CHILD.set(ret, this);
            }
            return ret;
         };
      };
      for (const Kind of OBJECT_KINDS) {
         overrideWebglByKey('create' + Kind, makeObserveChildReturned);
      }
      overrideWebglByKey('fenceSync', makeObserveChildReturned);
      overrideWebglByKey('getExtension', makeObserveChildReturned);
      overrideWebglByKey('getUniformLocation', makeObserveChildReturned);
   }

   // -
   // Add obj.close() => gl.deleteObject(obj);

   {
      const fnNewValFromOld = (old) => {
         console.assert(!old, old);
         return function() {
            const gl = GL_BY_CHILD.get(this);
            const ret = gl[funcName](this, ...arguments);
            return ret;
         };
      };
      for (const Kind of OBJECT_KINDS) {
         let str_WebGLObject = 'WebGL' + Kind;
         if (Kind == 'VertexArray') {
            str_WebGLObject = 'WebGLVertexArrayObject';
            // Is that even standardized? :S
         }
         const objClass = globalThis[str_WebGLObject];
         console.assert(objClass, Kind);
         const str_deleteObjectName = 'delete' + Kind;
         overrideByKey(objClass.prototype, 'close', (old) => {
            return function() {
               const gl = GL_BY_CHILD.get(this);
               return gl[str_deleteObjectName](this);
            };
         });
      }
   }

   // -
   // Misc

   overrideWebglByKey('close', (old) => {
      console.assert(!old, old);
      return function() {
         const ext = this.getExtension('WEBGL_lose_context');
         ext.lose_context();
      };
   });

   overrideWebglByKey('getParameter', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[0] = BINDING_BY_TARGET.get(arguments[0]) || arguments[0];

         switch (arguments[0]) {
            case GL.RENDERER: {
               if (!navigator.userAgent.includes('Firefox/')) {
                  // Firefox already gives this back for just RENDERER.
                  const ext = gl.getExtension('WEBGL_debug_renderer_info');
                  arguments[0] = ext.UNMASKED_RENDERER_WEBGL;
               }
               break;
            }
            case GL.VENDOR: {
               const ext = gl.getExtension('WEBGL_debug_renderer_info');
               arguments[0] = ext.UNMASKED_VENDOR_WEBGL;
               break;
            }
            //case GL.DRAW_FRAMEBUFFER_BINDING: == FRAMEBUFFER_BINDING!
            case GL.READ_FRAMEBUFFER_BINDING:
               if (!this.READ_FRAMEBUFFER_BINDING) {
                  arguments[0] = GL.FRAMEBUFFER_BINDING;
               }
               break;
         }

         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getIndexedParameter', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[0] = BINDING_BY_TARGET.get(arguments[0]) || arguments[0];
         return old.call(this, ...arguments);
      };
   });

   // -

   overrideWebglByKey('activeTexture', (old) => {
      return function() {
         if (arguments[0] < 32) {
            arguments[0] = GL.TEXTURE0 + arguments[0];
         }
         arguments[0] = toEnumVal(arguments[0]); // unit
         return old.call(this, ...arguments);
      };
   });
   const TARGET_BY_BUFFER = new WeakMap();
   overrideWebglByKey('bindBuffer', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         if (arguments[1]) {
            TARGET_BY_BUFFER.set(arguments[1], arguments[0]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('bindBufferBase', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('bindBufferRange', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('blendEquation', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('blendEquationSeparate', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('blendFunc', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('blendFuncSeparate', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('bufferData', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // usage
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('bufferSubData', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('clear', (old) => {
      return function() {
         if (arguments[0] == -1) {
            arguments[0] = GL.COLOR_BUFFER_BIT |
                           GL.DEPTH_BUFFER_BIT |
                           GL.STENCIL_BUFFER_BIT;
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('copyBufferSubData', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // srcTarget
         arguments[1] = toEnumVal(arguments[1]); // dstTarget
         return old.call(this, ...arguments);
      };
   });
   const TYPE_BY_SHADER = new WeakMap();
   overrideWebglByKey('createShader', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // type
         const ret = old.call(this, ...arguments);
         if (ret) {
            TYPE_BY_SHADER.set(ret, arguments[0]);
         }
         return ret;
      };
   });
   overrideWebglByKey('cullFace', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // mode
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('depthFunc', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // func
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('disable', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // cap
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('enable', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // cap
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('setEnabled', (old) => {
      return function(cap, val) {
         if (val) {
            this.enable(cap);
         } else {
            this.disable(cap);
         }
      };
   });
   overrideWebglByKey('setEnabledVertexAttribArray', (old) => {
      return function(index, val) {
         if (val) {
            this.enableVertexAttribArray(index);
         } else {
            this.disableVertexAttribArray(index);
         }
      };
   });
   overrideWebglByKey('drawArrays', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // mode
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('drawArraysInstanced', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // mode
         if (old) {
            return old.call(this, ...arguments);
         } else {
            const ext = this.getExtension('ANGLE_instanced_arrays');
            return ext.drawArraysInstancedANGLE(...arguments);
         }
      };
   });
   overrideWebglByKey('drawElements', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // mode
         arguments[2] = toEnumVal(arguments[2]); // type
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('drawElementsInstanced', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // mode
         arguments[2] = toEnumVal(arguments[2]); // type
         if (old) {
            return old.call(this, ...arguments);
         } else {
            const ext = this.getExtension('ANGLE_instanced_arrays');
            return ext.drawElementsInstancedANGLE(...arguments);
         }
      };
   });
   overrideWebglByKey('fenceSync', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = arguments[0] || 'sync-gpu-commands-complete';
         arguments[0] = toEnumVal(arguments[0]); // condition
         arguments[1] = arguments[1] || 0;
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('frontFace', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('generateMipmap', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getBufferSubData', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getErrorStr', (old) => {
      return function() {
         const ret = old.call(this, ...arguments);
         if (ret !== GL.NO_ERROR) {
            ret = fromEnumVal(ret);
         }
         return ret;
      };
   });
   overrideWebglByKey('getBufferParameter', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getFramebufferAttachmentParameter', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // attachment
         arguments[2] = toEnumVal(arguments[2]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getInternalformatParameter', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // internalformat
         arguments[2] = toEnumVal(arguments[2]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getProgramParameter', (old) => {
      return function() {
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getQueryParameter', (old) => {
      if (!old) return old;
      return function() {
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getRenderbufferParameter', (old) => {
      return function() {
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getShaderParameter', (old) => {
      return function() {
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getSyncParameter', (old) => {
      if (!old) return old;
      return function() {
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('getTexParameter', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('hint', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('isEnabled', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   const PENDING_LINK_BY_PROGRAM = new WeakMap();
   overrideWebglByKey('linkProgram', (old) => {
      return function(prog) {
         const ret = old.call(this, ...arguments);
         let promise;
         if (this.fenceAsync) {
            promise = this.fenceAsync();
         } else {
            promise = new Promise(requestAnimationFrame);
         }
         PENDING_LINK_BY_PROGRAM.set(prog, promise);
         invoke(async () => {
            await promise;
            PENDING_LINK_BY_PROGRAM.delete(prog);
         });
         return ret;
      };
   });
   overrideWebglByKey('pixelStorei', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]);
         if (arguments[0] == GL.UNPACK_COLORSPACE_CONVERSION) {
            arguments[1] = toEnumVal(arguments[1]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('stencilFunc', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // func
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('stencilFuncSeparate', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // face
         arguments[1] = toEnumVal(arguments[1]); // func
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('stencilOp', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('stencilOpSeparate', (old) => {
      return function() {
         for (let i = 0; i < arguments.length; i++) {
            arguments[i] = toEnumVal(arguments[i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('texParameterf', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('texParameteri', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // pname
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('vertexAttribDivisor', (old) => {
      return function() {
         if (old) {
            return old.call(this, ...arguments);
         } else {
            const ext = this.getExtension('ANGLE_instanced_arrays');
            return ext.vertexAttribDivisorANGLE(...arguments);
         }
      };
   });
   overrideWebglByKey('vertexAttribPointer', (old) => {
      return function() {
         arguments[2] = toEnumVal(arguments[2]); // type
         return old.call(this, ...arguments);
      };
   });
   overrideByKey(WebGL2RenderingContext.prototype, 'vertexAttribIPointer', (old) => {
      return function() {
         arguments[2] = toEnumVal(arguments[2]); // type
         return old.call(this, ...arguments);
      };
   });

   /*
    * We can't have this in general, because:
    *    Some of the enum values are basic (0 unmaps to gl.POINTS)
    *    And/or multiple keys (POINTS, NONE, NO_ERROR)
    * So if we add these they need to be only from a
    * greenlit list of keys. (greenlist?)
   overrideWebglByKey('getParameterStr', (old) => {
      console.assert(!old, old);
      return function() {
         let ret = this.getParameter(...arguments);
         ret = fromEnumVal(ret);
         return ret;
      };
   });
   */

   // -
   // Framebuffers

   overrideWebglByKey('bindFramebuffer', (old) => {
      return function() {
         if (arguments[0] == 'both') {
            arguments[0] = 'framebuffer';
         }
         arguments[0] = toEnumVal(arguments[0]); // target
         if (!this.DRAW_FRAMEBUFFER) {
            switch (arguments[0]) {
            case GL.DRAW_FRAMEBUFFER:
            case GL.READ_FRAMEBUFFER:
               arguments[0] = GL.FRAMEBUFFER;
               break;
            }
         }
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('checkFramebufferStatus', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('checkFramebufferIncompleteStr', (old) => {
      console.assert(!old, old);
      return function() {
         let ret = this.checkFramebufferStatus(...arguments);
         ret = fromEnumVal(ret);
         ret = replacePrefix(ret, 'framebuffer-', '');
         if (ret == 'complete') {
            ret = '';
         }
         return ret;
      }; // E.g. -> 'complete'
   });

   /* Let's just call getExtension every time unless it's really slow.
   const EXT_BY_NAME_BY_GL = {};

   overrideWebglByKey('getExtension', (old) => {
      return function() {
         const ret = old.call(this, ...arguments);
         let ext_by_name = EXT_BY_NAME_BY_GL.get(this);
         if (!ext_by_name) {
            ext_by_name = {};
            EXT_BY_NAME_BY_GL.set(this, ext_by_name);
         }
         ext_by_name[arguments[0]] = ret;
         return ret;
      }
   });
   */

   // Ok, so in webgl1, drawBuffers is part of ANGLE_instanced_arrays.
   // But we've brought that into core, so we *could* just redirect there.
   // However, that breaks duck-typing checks (which I have written!) such
   // as `if (!gl.drawBuffers) { // minimal webgl1 path`.
   // I think it's not worth it to keep this, though, so just inject
   // drawBuffers into webgl1 also, and polyfill.

   function sugarDrawBuffersList(list, curFb) {
      for (const i in list) {
         if (typeof(list[i]) == 'boolean') {
            list[i] = (curFb ? 'color-attachment'+i : 'back');
         } else {
            list[i] = 'none';
         }
         list[i] = toEnumVal(list[i]);
      }
   }
   overrideWebglByKey('blitFramebuffer', (old) => {
      if (!old) return old; // Leave out for webgl1.
      return function() {
         if (arguments[8] == -1) { // mask
            arguments[8] = GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT;
         }
         arguments[9] = toEnumVal(arguments[9]); // filter
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('invalidateFramebuffer', (old) => {
      if (!old) return old; // Leave out for webgl1.
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         for (const i in arguments[1]) { // attachments
            arguments[1][i] = toEnumVal(arguments[1][i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('invalidateSubFramebuffer', (old) => {
      if (!old) return old; // Leave out for webgl1.
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         for (const i in arguments[1]) { // attachments
            arguments[1][i] = toEnumVal(arguments[1][i]);
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('drawBuffers', (old) => {
      return function(list, forFb) {
         const curFb = this.getParameter('draw-fb');
         if (curFb && !forFb) {
            console.warning('`gl.drawBuffers()` is deprecated for use on framebuffers.',
                            'Please use `fb.drawBuffers()`');
         }
         sugarDrawBuffersList(list);
         if (old) {
            return old.call(this, list);
         }
         const ext = this.getExtension('ANGLE_instanced_arrays');
         if (!ext) throw 'ANGLE_instanced_arrays not supported.';
         ext.drawBuffersANGLE(list);
      };
   });
   overrideWebglByKey('readBuffer', (old) => {
      if (!old) return old; // Leave out for webgl1.
      return function(src, forFb) {
         const curFb = this.getParameter('read-fb');
         if (curFb && !forFb) {
            console.warning('`gl.readBuffer()` is deprecated for use on framebuffers.',
                            'Please use `fb.readBuffer()`');
         }
         const list = [src];
         sugarDrawBuffersList(list);
         return old.call(this, list[0]);
      };
   });
   overrideWebglByKey('readPixels', (old) => {
      return function() {
         const args = [].slice.call(arguments);
         let forFb = args[args.length-1];
         if (forFb instanceof WebGLFramebuffer) {
            args.pop();
         } else {
            forFb = undefined; // It wasn't!
         }
         const curFb = this.getParameter('read-fb');
         if (curFb && !forFb) {
            console.warning('`gl.readPixels()` is deprecated for use on framebuffers.',
                            'Please use `fb.readPixels()`');
         }
         args[4] = toEnumVal(args[4]); // pack format
         args[5] = toEnumVal(args[5]); // pack type
         return old.call(this, ...args);
      };
   });
   // I don't want to do the work to have ext.drawBuffersANGLE also sugared.

   overrideWebglByKey('framebufferRenderbuffer', (old) => {
      return function() {
         if (arguments[1] < 32) {
            arguments[1] = 'color-attachment' + arguments[1];
         }
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // attachment
         arguments[2] = toEnumVal(arguments[2]); // rbtarget
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('framebufferTexture2D', (old) => {
      return function() {
         if (arguments[1] < 32) {
            arguments[1] = 'color-attachment' + arguments[1];
         }
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // attachment
         arguments[2] = toEnumVal(arguments[2]); // textarget
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('framebufferTextureLayer', (old) => {
      if (!old) return old;
      return function() {
         if (arguments[1] < 32) {
            arguments[1] = 'color-attachment' + arguments[1];
         }
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // attachment
         return old.call(this, ...arguments);
      };
   });

   // -
   // Framebuffer sugar

   const ANON_RB_LIST_BY_FB = new WeakMap();

   // We can just chain-override deleteFramebuffer again.
   overrideWebglByKey('deleteFramebuffer', (old) => {
      return function() {
         const anonRbList = ANON_RB_LIST_BY_FB.get(arguments[0]);
         for (const rb of anonRbList) {
            rb.close();
         }
         return old.call(this, ...arguments);
      };
   });

   // createCompleteFramebuffer({
   //    0: [tex], // boring tex2d
   //    1: [rb], // rb
   //    2: [cube_tex, 3, 2] // miplevel=3, face=POSITIVE_Y
   //    'depth-stencil': ['d24s8', 1920, 1080, 0] // DEPTH24_STENCIL8 1920x1080 non-multisampled
   // });
   overrideWebglByKey('createCompleteFramebuffer', (old) => {
      console.assert(!old, old);
      return function(argsByAttachId) {
         const fbTarget = 'draw-fb';
         let fb = this.createFramebuffer();

         const was = this.getParameter(fbTarget);

         this.bindFramebuffer(fbTarget, fb); // Don't make attach() thrash fb bindings
         for (const [attachId,args] of Objects.entries(argsByAttachId)) {
            fb.attach(fbTarget, attachId, ...args);
         }
         const incompleteStr = this.checkFramebufferIncompleteStr(fbTarget);
         this.bindFramebuffer(fbTarget, was);

         if (incompleteStr) {
            console.warning("createCompleteFramebuffer(", argsByAttachId, ") ->", incompleteStr);
            fb.close();
            return incompleteStr;
         }
         return fb;
      };
   });

   const TEX_TARGETS_2D = [
      WebGLRenderingContext.TEXTURE_2D,
      WebGLRenderingContext.TEXTURE_CUBE_MAP,
   ];

   overrideByKey(WebGLFramebuffer.prototype, 'attach', (old) => {
      console.assert(!old, old);
      return function() {
         // (target, attachpoint, rb)
         // (target, attachpoint, tex, miplevel, zlayer/face)
         // (target, attachpoint, format, w, h, samples) -> rb

         const gl = GL_BY_CHILD.get(this);

         if (['string','number'].includes(typeof(arguments[2]))) { // format
            arguments[2] = gl.createRenderbufferStorage(
                              arguments[2], // format
                              arguments[3], // w
                              arguments[4], // h
                              arguments[5]); // samples
            arguments[3] = undefined;
            arguments[4] = undefined;
            arguments[5] = undefined;

            let list = ANON_RB_LIST_BY_FB.get(this);
            if (!list) {
               list = [];
               ANON_RB_LIST_BY_FB.set(this, list);
            }
            list.push(arguments[2]);
         }
         // (target, attachpoint, rb)
         // (target, attachpoint, tex, miplevel, zlayer/face)

         const was = gl.getParameter(fbTarget);
         if (this != was) {
            gl.bindFramebuffer(fbTarget, this);
         }
         const ret = invoke(() => {
            if (!obj) { // probably null
               return gl.framebufferRenderbuffer(arguments[0],
                                                   arguments[1],
                                                   'rb',
                                                   obj);
            }

            const objTarget = TARGET_BY_TEX_OR_RB.get(obj); // attachobj
            if (!objTarget) throw '`attachobj` has not yet been bound with BindRenderbuffer or BindTexture.';
            if (objTarget == WebGLRenderingContext.RENDERBUFFER) {
               return gl.framebufferRenderbuffer(arguments[0],
                                                   arguments[1],
                                                   'rb',
                                                   obj);
            }
            if (TEX_TARGETS_2D.includes(texTarget)) {
               let imageTarget = texTarget;
               if (texTarget == WebGLRenderingContext.TEXTURE_CUBE_MAP) {
                  const face0Target = WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X;
                  imageTarget = face0Target + attachment[4]; // zlayer=face
               }
               return gl.framebufferTexture2D(arguments[0],
                                                arguments[1],
                                                imageTarget,
                                                obj, // tex
                                                arguments[3]); // miplevel
            }
            return gl.framebufferTextureLayer(arguments[0],
                                                arguments[1],
                                                obj, // tex
                                                arguments[3], // miplevel
                                                arguments[4]); // zlayer
         });
         if (this != was) {
            gl.bindFramebuffer(fbTarget, was);
         }
         return ret;
      };
   });

   overrideByKey(WebGLFramebuffer.prototype, 'blitTo', (old) => {
      console.assert(!old, old);
      return function(dstFb, filter, mask,
                      srcX0, srcY0, srcX1, srcY1,
                      dstX0, dstY0, dstX1, dstY1) {
         // readFb.blitTo(dstFb, filter, mask?, srcX0?,Y0,X1,Y1, dstX0?,Y0,X1,Y1);
         const gl = GL_BY_CHILD.get(this);
         if (mask == -1) {
            mask = GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT;
         }

         if (srcX0 === undefined) {
            throw 'Implied src rect size not yet implemented.';
         }
         if (dstX0 === undefined) {
            dstX0 = srcX0;
            dstY0 = srcY0;
            dstX1 = srcX1;
            dstY1 = srcY1;
         }
         if (!gl.blitFramebuffer) {
            throw '`blitFramebuffer` not supported on WebGL 1.';
         }

         const srcFb = this;

         const readWas = gl.getParameter('read-fb');
         if (srcFb != readWas) {
            gl.bindFramebuffer('read-fb', srcFb);
         }
         const drawWas = gl.getParameter('draw-fb');
         if (dstFb != drawWas) {
            gl.bindFramebuffer('draw-fb', dstFb);
         }

         const ret = gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1,
                                        dstX0, dstY0, dstX1, dstY1,
                                        mask, filter, this);
         if (dstFb != drawWas) {
            gl.bindFramebuffer('draw-fb', drawWas);
         }
         if (srcFb != readWas) {
            gl.bindFramebuffer('read-fb', readWas);
         }
         return ret;
      };
   });
   overrideByKey(WebGLFramebuffer.prototype, 'invalidate', (old) => {
      console.assert(!old, old);
      return function(fbTarget, attachments, x, y, w, h) {
         // fb.invalidate(fbTarget, attachments, X?,Y,W,H);
         const gl = GL_BY_CHILD.get(this);
         if (!gl.invalidateFramebuffer) {
            throw '`invalidateFramebuffer` not supported on WebGL 1.';
         }

         const was = gl.getParameter(fbTarget);
         if (this != was) {
            gl.bindFramebuffer(fbTarget, this);
         }

         let ret;
         if (x === undefined) {
            gl.invalidateFramebuffer(fbTarget, attachments);
         } else {
            gl.invalidateSubFramebuffer(fbTarget, attachments, x,y,w,h);
         }
         if (this != was) {
            gl.bindFramebuffer(fbTarget, was);
         }
         return ret;
      };
   });
   // Blit then invalidate src
   overrideByKey(WebGLFramebuffer.prototype, 'resolveTo', (old) => {
      console.assert(!old, old);
      return function(dstFb, mask, x,y,w,h) {
         // readFb.resolveTo(dstFb, mask, x?,y,w,h);
         const gl = GL_BY_CHILD.get(this);

         const readWas = gl.getParameter('read-fb');
         if (this != readWas) {
            gl.bindFramebuffer('read-fb', this);
         }
         const drawWas = gl.getParameter('draw-fb');
         if (dstFb != drawWas) {
            gl.bindFramebuffer('draw-fb', dstFb);
         }

         const readAttachments = [];
         if (mask & GL.COLOR_BUFFER_BIT) {
            let readBuffer = gl.getParameter('read-buffer');
            if (readBuffer == GL.BACK) {
               readBuffer = GL.COLOR_ATTACHMENT0;
            }
            if (readBuffer) {
               readAttachments.push(readBuffer);
            }
         }
         if (mask & GL.DEPTH_BUFFER_BIT) {
            readAttachments.push('depth-attachment');
         }
         if (mask & GL.STENCIL_BUFFER_BIT) {
            readAttachments.push('stencil-attachment');
         }

         this.blitTo(drawFb, 'nearest', mask, x, y, x+w, y+h);
         this.invalidate('read-fb', readAttachments, x,y,w,h);

         if (dstFb != drawWas) {
            gl.bindFramebuffer('draw-fb', drawWas);
         }
         if (this != was) {
            gl.bindFramebuffer('read-fb', was);
         }
      };
   });
   overrideByKey(WebGLFramebuffer.prototype, 'drawBuffers', (old) => {
      console.assert(!old, old);
      return function() {
         const gl = GL_BY_CHILD.get(this);
         const was = gl.getParameter('draw-fb');
         if (this != was) {
            gl.bindFramebuffer('draw-fb', this);
         }
         const ret = gl.drawBuffers(arguments[0], this);
         if (this != was) {
            gl.bindFramebuffer('draw-fb', was);
         }
         return ret;
      };
   });
   overrideByKey(WebGLFramebuffer.prototype, 'readBuffer', (old) => {
      console.assert(!old, old);
      return function() {
         const gl = GL_BY_CHILD.get(this);
         const was = gl.getParameter('read-fb');
         if (this != was) {
            gl.bindFramebuffer('read-fb', this);
         }
         let ret;
         if (gl.readBuffer) {
            ret = gl.readBuffer(arguments[0], this);
         } else {
            arguments[0] = toEnumVal(arguments[0]);
            if (arguments[0] != GL.COLOR_ATTACHMENT0) {
               throw 'WebGL 1 requires `src` to be `gl.COLOR_ATTACHMENT0`.';
            }
         }
         if (this != was) {
            gl.bindFramebuffer('read-fb', was);
         }
         return ret;
      };
   });
   overrideByKey(WebGLFramebuffer.prototype, 'demandReadPixelsJank', (old) => {
      console.assert(!old, old);
      return function() {
         const gl = GL_BY_CHILD.get(this);
         const was = gl.getParameter('read-fb');
         if (this != was) {
            gl.bindFramebuffer('read-fb', this);
         }
         const ret = gl.readPixels(...arguments, this);
         if (this != was) {
            gl.bindFramebuffer('read-fb', was);
         }
         return ret;
      };
   });
   overrideByKey(WebGLFramebuffer.prototype, 'readPixelsPbo', (old) => {
      console.assert(!old, old);
      return function() {
         const gl = GL_BY_CHILD.get(this);
         const pbo = arguments[0];
         const readPixelArgs = [].slice.call(arguments, 1);
         const was = gl.getParameter('pixel-pack-buffer');
         if (this != was) {
            gl.bindBuffer('pixel-pack-buffer', this);
         }
         const ret = this.demandReadPixelsJank(...readPixelArgs);
         if (this != was) {
            gl.bindBuffer('pixel-pack-buffer', was);
         }
         return ret;
      };
   });
   // Like https://jdashg.github.io/misc/async-gpu-downloads.html
   overrideByKey(WebGLBuffer.prototype, 'fetchPixels', (old) => {
      return async function(x,y,w,h,format,type,dstData) {
         const gl = GL_BY_CHILD.get(this);
         if (!gl.getBufferSubData) throw '`getBufferSubData` not supported.';

         let view = dstData;
         if (view instanceof DataView) {
            view = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
         }

         const downloadBuffer = gl.createBufferData(
            'pixel-pack-buffer', view.byteLength, 'stream-read');
         this.readPixelsPbo(downloadBuffer, x,y,w,h,format,type,view);
         await gl.fenceAsync();
         const [ret] = downloadBuffer.demandSubDataJank(0, view);
         downloadBuffer.close();
         return dstData;
      };
   });

   // -
   // Renderbuffers

   overrideWebglByKey('bindRenderbuffer', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('getRenderbufferParameter', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('renderbufferStorage', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[1] = toEnumVal(arguments[1]); // format
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('renderbufferStorageMultisample', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // format
         return old.call(this, ...arguments);
      };
   });

   // -

   overrideWebglByKey('createRenderbufferStorage', (old) => {
      console.assert(!old, old);
      return function(internalFormat, w, h, samples) {
         const rb = this.createRenderbuffer();
         const was = this.getParameter('rb');
         // 'rb' -> 'renderbuffer' -> gl.RENDERBUFFER -> gl.RENDERBUFFER_BINDING

         this.bindRenderbuffer('rb', rb);
         if (samples) {
            this.renderbufferStorageMultisample('rb', samples, format, w, h);
         } else {
            this.renderbufferStorage('rb', format, w, h);
         }
         this.bindRenderbuffer('rb', was);

         return rb;
      };
   });

   overrideByKey(WebGLRenderbuffer.prototype, 'getParameter', (old) => {
      console.assert(!old, old);
      return function() {
         const gl = GL_BY_CHILD.get(this);
         return gl.getRenderbufferParameter('rb', ...arguments);
      };
   });

   // -
   // Programs
   overrideWebglByKey('createCompiledShader', (old) => {
      return function(type, src) {
         // (type, src)
         const ret = this.createShader(type);
         this.shaderSource(ret, src);
         this.compileShader(ret);
         return ret;
      };
   });

   const SHADER_EXTRAS = `\
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
`.trim();
   const VERT_SHADER_EXTRAS = SHADER_EXTRAS + '\n' + `\
#if __VERSION__ >= 300
int autoPositionTrianglesQuad() {
   VERTS = [vec2(0,0), vec2(1,0), vec2(0,1),
            vec2(0,1), vec2(1,0), vec2(1,1)];
   gl_Position = vec4(VERTS[gl_VertexID % 6], 0, 1);
   return gl_VertexID / 6; // quad id
}
#endif
`.trim();

   overrideWebglByKey('shaderSource', (old) => {
      return function() {
         // (shader, src)
         const type = TYPE_BY_SHADER.get(arguments[0]);
         let payload;
         if (type == GL.VERTEX_SHADER) {
            payload = VERT_SHADER_EXTRAS;
         } else {
            payload = SHADER_EXTRAS;
         }
         if (payload) {
            // Inject the payload between the first line (which must
            // contain any #version directive) and the second line.
            arguments[1] = arguments[1].replace('\n',
               '\n' + payload + '\n#line 2');
         }
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('createLinkedProgram', (old) => {
      return function(vsrc, fsrc, bindLocByAttribName) {
         // (vsrc, fsrc?, locByAttrib?)
         const prog = this.createProgram();
         const vs = this.createCompiledShader('vertex-shader', vsrc);
         this.attachShader(prog, vs);
         vs.close();

         let fs = null;
         if (fsrc) {
            fs = this.createCompiledShader('fragment-shader', fsrc);
            this.attachShader(prog, fs);
            fs.close();
         }

         if (bindLocByAttribName) {
            for (const [name, loc] of Object.entries(bindLocByAttribName)) {
               this.bindAttribLocation(prog, loc, name);
            }
         }

         this.linkProgram(prog);
         return prog;
      };
   });

   // -
   // getRichLinkInfo() is relatively separable, if you want to reuse it by itself!
   // Depends on:
   // * `const GL = WebGL2RenderingContext;`.
   // * `fromEnumVal()` for type => typeName

   const SUFFIX_BY_TYPE_NAME = {};
   SUFFIX_BY_TYPE_NAME[GL.FLOAT     ] = '1f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_VEC2] = '2f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_VEC3] = '3f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_VEC4] = '4f';

   SUFFIX_BY_TYPE_NAME[GL.INT     ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.INT_VEC2] = '2i';
   SUFFIX_BY_TYPE_NAME[GL.INT_VEC3] = '3i';
   SUFFIX_BY_TYPE_NAME[GL.INT_VEC4] = '4i';

   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT     ] = '1ui';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_VEC2] = '2ui';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_VEC3] = '3ui';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_VEC4] = '4ui';

   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT2  ] = 'Matrix2f'; // Matrices always need 'v' suffix though.
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT2x3] = 'Matrix2x3f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT2x4] = 'Matrix2x4f';

   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT3x2] = 'Matrix3x2f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT3  ] = 'Matrix3f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT3x4] = 'Matrix3x4f';

   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT4x2] = 'Matrix4x2f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT4x3] = 'Matrix4x3f';
   SUFFIX_BY_TYPE_NAME[GL.FLOAT_MAT4  ] = 'Matrix4f';

   SUFFIX_BY_TYPE_NAME[GL.BOOL     ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.BOOL_VEC2] = '2i';
   SUFFIX_BY_TYPE_NAME[GL.BOOL_VEC3] = '3i';
   SUFFIX_BY_TYPE_NAME[GL.BOOL_VEC4] = '4i';

   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_2D      ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_CUBE    ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_2D_ARRAY] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_3D      ] = '1i';

   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_2D_SHADOW      ] = '1i';
   //SUFFIX_BY_TYPE_NAME[GL.SAMPLER_CUBE_SHADOW    ] = '1i'; (not real)
   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_2D_ARRAY_SHADOW] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.SAMPLER_3D_SHADOW      ] = '1i';

   SUFFIX_BY_TYPE_NAME[GL.INT_SAMPLER_2D      ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.INT_SAMPLER_CUBE    ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.INT_SAMPLER_2D_ARRAY] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.INT_SAMPLER_3D      ] = '1i';

   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_SAMPLER_2D      ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_SAMPLER_CUBE    ] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_SAMPLER_2D_ARRAY] = '1i';
   SUFFIX_BY_TYPE_NAME[GL.UNSIGNED_INT_SAMPLER_3D      ] = '1i';

   // -

   function getActiveUniformBlock(gl, prog, activeIndex) {
      const getParam = (pname) => {
         return gl.getActiveUniformBlockParameter(prog, activeIndex, pname);
      };
      const info = {
         name: gl.getActiveUniformBlockName(this, activeIndex),
         binding: getParam(GL.UNIFORM_BLOCK_BINDING),
         dataSize: getParam(GL.UNIFORM_BLOCK_DATA_SIZE),
         activeUniformCount: getParam(GL.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
         activeUniformIndices: getParam(GL.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
         referencedByVertexShader: getParam(GL.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
         referencedByFragmentShader: getParam(GL.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      };
      return info;
   }

   // -

   function getRichLinkInfo(gl, prog) {
      const linkInfo = {};
      linkInfo.log = gl.getProgramInfoLog(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
         return linkInfo;
      }

      linkInfo.activeAttribs = [];
      linkInfo.attribs = {};
      for (const i of range(gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES))) {
         const curInfo = gl.getActiveAttrib(prog, i);
         linkInfo.activeAttribs.push(curInfo);
         linkInfo.attribs[curInfo.name] = curInfo;

         curInfo.typeName = fromEnumVal(curInfo.type);
         curInfo.loc = gl.getAttribLocation(prog, curInfo.name);
         if (curInfo.loc == -1) continue;

         const suffix = SUFFIX_BY_TYPE_NAME[curInfo.type] || throwv(`Bad type: ${code(curInfo.typeName)}`);
         let funcName = 'vertexAttrib' + suffix;
         if (suffix.endsWith('i')) {
            funcName = 'vertexAttribI' + suffix;
         }
         const fn = gl[funcName]; // Cache the function.
         if (!fn) throw {gl, funcName, curInfo};
         curInfo.set = function() {
            //if (gl.getParameter(gl.CURRENT_PROGRAM) != prog) {
            //   console.warning('Program is not CURRENT_PROGRAM.');
            //}
            fn.call(gl, curInfo.loc, ...arguments);
         };
      }

      linkInfo.activeUniforms = [];
      linkInfo.uniforms = {};
      for (const i of range(gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS))) {
         const curInfo = gl.getActiveUniform(prog, i);
         linkInfo.activeUniforms.push(curInfo);
         linkInfo.uniforms[curInfo.name] = curInfo;

         curInfo.typeName = fromEnumVal(curInfo.type);
         curInfo.loc = gl.getUniformLocation(prog, curInfo.name);
         if (!curInfo.loc) continue;

         const suffix = SUFFIX_BY_TYPE_NAME[curInfo.type] || throwv(`Bad type: ${code(curInfo.typeName)}`);
         const funcName = 'uniform' + suffix;
         const fn = gl[funcName]; // Cache the function.
         if (!fn) throw {gl, funcName, curInfo};
         curInfo.set = function() {
            //if (gl.getParameter(gl.CURRENT_PROGRAM) != prog) {
            //   console.error('Program is not CURRENT_PROGRAM.');
            //}
            fn.call(gl, curInfo.loc, ...arguments);
         };
      }

      if (gl.ACTIVE_UNIFORM_BLOCKS !== undefined) {
         linkInfo.activeUniformBlocks = [];
         linkInfo.uniformBlocks = {};
         for (const i of range(gl.getProgramParameter(prog, gl.ACTIVE_UNIFORM_BLOCKS))) {
            const curInfo = getActiveUniformBlock(gl, prog, i);
            linkInfo.activeUniformBlocks.push(curInfo);
            linkInfo.uniformBlocks[curInfo.name] = curInfo;

            curInfo.set = function(bindBufferIndex) {
               prog.uniformBlockBinding(curInfo.binding, bindBufferIndex);
            };
         }
      }

      return linkInfo;
   }

   // -

   overrideByKey(WebGLProgram.prototype, 'fetchLinkInfo', (old) => {
      return async function() {
         await PENDING_LINK_BY_PROGRAM.get(this);
         return this.demandLinkInfoJank();
      };
   });

   overrideByKey(WebGLProgram.prototype, 'pollLinkInfo', (old) => {
      return function() {
         const pending = PENDING_LINK_BY_PROGRAM.get(this);
         if (pending) return null; // Still waiting.
         return this.demandLinkInfoJank();
      };
   });

   overrideByKey(WebGLProgram.prototype, 'demandLinkInfoJank', (old) => {
      return function() {
         // (no args)
         const gl = GL_BY_CHILD.get(this);
         const info = getRichLinkInfo(gl, this);
         return info;
      };
   });

   // -

   overrideByKey(WebGLProgram.prototype, 'getActiveUniformBlock', (old) => {
      return function(activeIndex) {
         const gl = GL_BY_CHILD.get(this);
         const info = getActiveUniformBlock(gl, this, activeIndex);
         return info;
      };
   });

   // -

   overrideByKey(WebGLProgram.prototype, 'getFragDataLocation', (old) => {
      return function() {
         const gl = GL_BY_CHILD.get(this);
         return gl.getFragDataLocation(this, ...arguments);
      };
   });
   overrideByKey(WebGLProgram.prototype, 'getUniformLocation', (old) => {
      return function() {
         const gl = GL_BY_CHILD.get(this);
         return gl.getUniformLocation(this, ...arguments);
      };
   });
   // I don't want to encourage gl.getUniform().

   overrideByKey(WebGLProgram.prototype, 'uniformBlockBinding', (old) => {
      return function() {
         const gl = GL_BY_CHILD.get(this);
         return gl.uniformBlockBinding(this, ...arguments);
      };
   });

   // -
   // Buffers

   overrideByKey(WebGLBuffer.prototype, 'resetData', (old) => {
      return function() {
         // (size/src, usage, ...)
         const gl = GL_BY_CHILD.get(this);
         const target = TARGET_BY_BUFFER.get(this);

         const was = this.getParameter(target);
         if (this != was) {
            this.bindBuffer(target, this);
         }

         gl.bufferData(target, ...arguments);

         if (this != was) {
            this.bindBuffer(target, was);
         }
      };
   });
   overrideByKey(WebGLBuffer.prototype, 'setSubData', (old) => {
      return function() {
         // (offset, src, ...)
         const gl = GL_BY_CHILD.get(this);
         const target = TARGET_BY_BUFFER.get(this);

         const was = this.getParameter(target);
         if (this != was) {
            this.bindBuffer(target, this);
         }

         gl.bufferSubData(target, ...arguments);

         if (this != was) {
            this.bindBuffer(target, was);
         }
      };
   });
   overrideByKey(WebGLBuffer.prototype, 'copySubDataFrom', (old) => {
      return function(dstOffset, srcBuffer, srcOffset, byteLen) {
         const gl = GL_BY_CHILD.get(this);
         if (!gl.copyBufferSubData) throw '`copyBufferSubData` required.'

         const dstBuffer = this;

         const srcWas = this.getParameter('copy-read-buffer');
         if (srcBuffer != srcWas) {
            this.bindBuffer('copy-read-buffer', srcBuffer);
         }
         const dstWas = this.getParameter('copy-write-buffer');
         if (dstBuffer != dstWas) {
            this.bindBuffer('copy-write-buffer', dstBuffer);
         }

         gl.copyBufferSubData('copy-read-buffer', 'copy-write-buffer',
                              srcOffset, dstOffset, size);

         if (dstBuffer != dstWas) {
            this.bindBuffer('copy-write-buffer', dstWas);
         }
         if (srcBuffer != srcWas) {
            this.bindBuffer('copy-read-buffer', srcWas);
         }
      };
   });

   overrideWebglByKey('createBufferData', (old) => {
      return function() {
         // like bufferData (target, src, usage, ...)
         const buffer = this.createBuffer();
         const was = this.getParameter(target);
         this.bindBuffer(arguments[0], buffer); // target
         this.bufferData(...arguments);
         this.bindBuffer(arguments[0], was);
         return buffer;
      };
   });

   // Like https://jdashg.github.io/misc/async-gpu-downloads.html
   overrideByKey(WebGLBuffer.prototype, 'fetchSubData', (old) => {
      return async function(srcByteOffset, dstData, unsupported_dstOffset) {
         const gl = GL_BY_CHILD.get(this);
         if (!gl.getBufferSubData) throw '`getBufferSubData` not supported.';
         if (unsupported_dstOffset !== undefined) throw '`dstOffset` is forbidden.';

         if (dstData instanceof DataView) {
            dstData = new Uint8Array(dstData.buffer, dstData.byteOffset, dstData.byteLength);
         } else if (dstData instanceof ArrayBuffer) {
            dstData = new Uint8Array(dstData);
         }
         const byteLen = dstData.byteLength - dstData.byteOffset;

         const downloadBuffer = gl.createBufferData(
            'copy-write-buffer', byteLen, 'stream-read');
         downloadBuffer.copySubDataFrom(0, this, srcByteOffset, byteLen);
         await gl.fenceAsync();
         const ret = downloadBuffer.demandSubDataJank(0, dstData);
         downloadBuffer.close();
         return ret;
      };
   });

   overrideByKey(WebGLProgram.prototype, 'demandSubDataJank', (old) => {
      return function(srcByteOffset, dstData, unsupported_dstOffset) {
         const gl = GL_BY_CHILD.get(this);
         if (!gl.getBufferSubData) throw '`getBufferSubData` not supported.';
         if (unsupported_dstOffset !== undefined) throw '`dstOffset` is forbidden.';

         if (dstData instanceof DataView) {
            dstData = new Uint8Array(dstData.buffer, dstData.byteOffset, dstData.byteLength);
         } else if (dstData instanceof ArrayBuffer) {
            dstData = new Uint8Array(dstData);
         }
         const byteLen = dstData.byteLength - dstData.byteOffset;

         const was = this.getParameter('copy-read-buffer');
         if (this != was) {
            this.bindBuffer('copy-read-buffer', this);
         }

         gl.getBufferSubData('copy-read-buffer', srcByteOffset, dstData);

         if (this != was) {
            this.bindBuffer('copy-read-buffer', was);
         }
         return dstData;
      };
   });

   // -
   // Textures

   overrideWebglByKey('bindTextureAt', (old) => {
      return function(unitId, texTarget, tex) {
         const unitVal = GL.TEXTURE0 + unitId;
         const was = this.getParameter('active-texture');
         if (unitVal != was) {
            this.activeTexture(unitVal);
         }
         this.bindTexture(texTarget, tex);
         if (unitVal != was) {
            this.activeTexture(was);
         }
      };
   });

   overrideWebglByKey('texStorage', (old) => {
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         if (TEX_TARGETS_2D.includes(arguments[0])) {
            const args = [].slice.call(arguments, 0, 5);
            this.texStorage2D(...args);
         } else {
            this.texStorage3D(...arguments);
         }
      };
   });

   const CUBE_FACE_TARGET_0 = GL.TEXTURE_CUBE_MAP_POSITIVE_X;

   const GL_COMPRESSED_RGB_S3TC_DXT1_EXT        = 0x83F0;
   const GL_COMPRESSED_RGBA_S3TC_DXT1_EXT       = 0x83F1;
   const GL_COMPRESSED_RGBA_S3TC_DXT3_EXT       = 0x83F2;
   const GL_COMPRESSED_RGBA_S3TC_DXT5_EXT       = 0x83F3;

   const GL_COMPRESSED_SRGB_S3TC_DXT1_EXT        = 0x8C4C;
   const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT  = 0x8C4D;
   const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT  = 0x8C4E;
   const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT  = 0x8C4F;
   function texStorageWebgl1(texTarget, levels, internalformat, w, h) {
      let pair;
      let compressedExtName;
      switch (internalformat) {
         case GL.RGB8:
            pair = ['rgb', 'u8'];
            break;
         case GL.RGBA8:
            pair = ['rgba', 'u8'];
            break;

         case GL_COMPRESSED_R11_EAC:
         case GL_COMPRESSED_SIGNED_R11_EAC:
         case GL_COMPRESSED_RG11_EAC:
         case GL_COMPRESSED_SIGNED_RG11_EAC:
         case GL_COMPRESSED_RGB8_ETC2:
         case GL_COMPRESSED_RGBA8_ETC2_EAC:
         case GL_COMPRESSED_SRGB8_ETC2:
         case GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
         case GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2:
         case GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
            compressedExtName = 'WEBGL_compressed_texture_etc';
            break;

         case GL_COMPRESSED_RGB_S3TC_DXT1_EXT:
         case GL_COMPRESSED_RGBA_S3TC_DXT1_EXT:
         case GL_COMPRESSED_RGBA_S3TC_DXT3_EXT:
         case GL_COMPRESSED_RGBA_S3TC_DXT5_EXT:
            compressedExtName = 'WEBGL_compressed_texture_s3tc';
            break;

         case GL_COMPRESSED_SRGB_S3TC_DXT1_EXT:
         case GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
         case GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
         case GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
            compressedExtName = 'WEBGL_compressed_texture_s3tc_srgb';
            break;
         default:
            throw `internalformat ${internalformat} not supported.`;
      }
      if (compressedExtName) {
         const ext = this.getExtension(compressedExtName);
         if (!ext) throw `Extension ${compressedExtName} not supported.`;
      }

      let fnInitLevel;
      if (pair) {
         fnInitLevel = (imageTarget, i) => {
            this.texImage2D(imageTarget, i, pair[0],
                            Math.max(1, w >> i),
                            Math.max(1, h >> i),
                            0, pair[0], pair[1], null);
         };
      } else {
         fnInitLevel = (imageTarget, i) => {
            this.compressedTexImage2D(imageTarget, i, internalformat,
                            Math.max(1, w >> i),
                            Math.max(1, h >> i),
                            0, null);
         };
      }
   }

   overrideWebglByKey('texStorage2D', (old) => {
      old = old || texStorageWebgl1;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // internalformat
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('texStorage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // internalformat
         return old.call(this, ...arguments);
      };
   });

   // -

   overrideWebglByKey('compressedTexImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // format
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('compressedTexImage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // format
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('compressedTexSubImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[6] = toEnumVal(arguments[6]); // format
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('compressedTexSubImage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[7] = toEnumVal(arguments[7]); // format
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('copyTexImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // format
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('copyTexSubImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('copyTexSubImage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         return old.call(this, ...arguments);
      };
   });

   overrideWebglByKey('texImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // internalformat
         if (arguments.length <= 6) {
            arguments[3] = toEnumVal(arguments[3]); // unpack format
            arguments[4] = toEnumVal(arguments[4]); // unpack type
         } else {
            arguments[6] = toEnumVal(arguments[6]); // unpack format
            arguments[7] = toEnumVal(arguments[7]); // unpack type
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('texSubImage2D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         if (arguments.length <= 7) {
            arguments[4] = toEnumVal(arguments[4]); // unpack format
            arguments[5] = toEnumVal(arguments[5]); // unpack type
         } else {
            arguments[6] = toEnumVal(arguments[6]); // unpack format
            arguments[7] = toEnumVal(arguments[7]); // unpack type
         }
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('texImage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[2] = toEnumVal(arguments[2]); // internalformat
         arguments[7] = toEnumVal(arguments[7]); // unpack format
         arguments[8] = toEnumVal(arguments[8]); // unpack type
         return old.call(this, ...arguments);
      };
   });
   overrideWebglByKey('texSubImage3D', (old) => {
      if (!old) return old;
      return function() {
         arguments[0] = toEnumVal(arguments[0]); // target
         arguments[8] = toEnumVal(arguments[8]); // unpack format
         arguments[9] = toEnumVal(arguments[9]); // unpack type
         return old.call(this, ...arguments);
      };
   });

   // -

   overrideWebglByKey('createTextureStorage', (old) => {
      return function(texTarget, levels, internalformat, w, h, d, filter) {
         texTarget = toEnumVal(texTarget);
         filter = toEnumVal(filter);
         if (!filter) throw 'Missing `filter`.';

         const tex = this.createTexture();

         const was = this.getParameter(texTarget);
         this.bindTexture(texTarget, tex);

         this.texParameteri(texTarget, 'texture-wrap-s', 'clamp-to-edge');
         this.texParameteri(texTarget, 'texture-wrap-t', 'clamp-to-edge');
         if (!TEX_TARGETS_2D.includes(texTarget)) {
            this.texParameteri(texTarget, 'texture-wrap-r', 'clamp-to-edge');
         }
         this.texParameteri(texTarget, 'min-filter', minFilter);
         this.texParameteri(texTarget, 'mag-filter', filter);

         this.texStorage(texTarget, levels, internalformat, w, h, d);

         this.bindTexture(texTarget, was);
         return tex;
      };
   });

   overrideByKey(WebGLTexture.prototype, 'generateMipmap', (old) => {
      return function() {
         const gl = GL_BY_CHILD.get(this);
         const texTarget = TARGET_BY_TEX_OR_RB.get(this);

         const was = gl.getParameter(texTarget);
         if (this != was) {
            gl.bindTexture(texTarget, this);
         }
         gl.generateMipmap(texTarget);
         if (this != was) {
            gl.bindTexture(texTarget, was);
         }
      };
   });

   overrideByKey(WebGLTexture.prototype, 'setSubImage', (old) => {
      return function(miplevel, x, y, z, w, h, d,
                      unpackFormat, unpackType, data1,data2,data3) {
         const gl = GL_BY_CHILD.get(this);
         const texTarget = TARGET_BY_TEX_OR_RB.get(this);

         const was = gl.getParameter(texTarget);
         if (this != was) {
            gl.bindTexture(texTarget, this);
         }

         if (TEX_TARGETS_2D.includes(texTarget)) {
            let imageTarget = texTarget;
            if (texTarget == GL.TEXTURE_CUBE_MAP) {
               imageTarget = CUBE_FACE_TARGET_0 + z;
               console.assert(z==1, '`z` must be 1, was', z);
            }
            gl.texSubImage2D(imageTarget, miplevel, x, y, w, h,
               unpackFormat, unpackType, data1,data2,data3);
         } else {
            gl.texSubImage3D(texTarget, miplevel, x, y, z, w, h, d,
               unpackFormat, unpackType, data1,data2,data3);
         }

         if (this != was) {
            gl.bindTexture(texTarget, was);
         }
      };
   });

   overrideByKey(WebGLTexture.prototype, 'compressedSetSubImage', (old) => {
      return function(miplevel, x, y, z, w, h, d, formatAgain,
                      data1,data2,data3) {
         const gl = GL_BY_CHILD.get(this);
         const texTarget = TARGET_BY_TEX_OR_RB.get(this);

         const was = gl.getParameter(texTarget);
         if (this != was) {
            gl.bindTexture(texTarget, this);
         }

         if (TEX_TARGETS_2D.includes(texTarget)) {
            let imageTarget = texTarget;
            if (texTarget == GL.TEXTURE_CUBE_MAP) {
               imageTarget = CUBE_FACE_TARGET_0 + z;
               console.assert(z==1, '`z` must be 1, was', z);
            }
            gl.compressedTexSubImage2D(imageTarget, miplevel, x, y, w, h,
               formatAgain, data1,data2,data3);
         } else {
            gl.compressedTexSubImage3D(texTarget, miplevel, x, y, z, w, h, d,
               formatAgain, data1,data2,data3);
         }

         if (this != was) {
            gl.bindTexture(texTarget, was);
         }
      };
   });

   // -
   // Syncs

   overrideByKey(WebGL2RenderingContext.prototype, 'fenceAsync', (old) => {
      return async function() { // (no args)
         const sync = this.fenceSync();
         while (!this.isContextLost()) {
            await new Promise(setTimeout);
            const status = sync.getParameter('sync-status');
            if (status == GL.SIGNALED) {
               return;
            }
         }
         throw 'fenceAsync failed.';
      };
   });

   overrideByKey(WebGLSync.prototype, 'getParameter', (old) => {
      return function() {
         const gl = GL_BY_CHILD.get(this);
         return gl.getSyncParameter(this, ...arguments);
      };
   });

   // Programs

   // async prog.fetchLinkInfo()
   // sync fallable prog.pollLinkInfo
   // sync prog.demandLinkInfoJank()

   // Later:
   // query.fetchResult
   // query.pollResult
   // query.demandResultJank
   // punt on transform feedback

   // Never:
   // No sugar for copyTexImage, because please don't use it. (blitFramebuffer please)






   // -
   // Vertex Array Objects

   overrideByKey(WebGLRenderingContext.prototype, 'createVertexArray', (old) => {
      return function() {
         const ext = this.getExtension('OES_vertex_array_object');
         const ret = ext.createVertexArrayOES(...arguments);
         GL_BY_CHILD.set(ret, this);
         return ret;
      };
   });
   overrideByKey(WebGLRenderingContext.prototype, 'deleteVertexArray', (old) => {
      return function() {
         const ext = this.getExtension('OES_vertex_array_object');
         const ret = ext.deleteVertexArrayOES(...arguments);
         return ret;
      };
   });
   overrideByKey(WebGLRenderingContext.prototype, 'isVertexArray', (old) => {
      return function() {
         const ext = this.getExtension('OES_vertex_array_object');
         const ret = ext.isVertexArrayOES(...arguments);
         return ret;
      };
   });
   overrideByKey(WebGLRenderingContext.prototype, 'bindVertexArray', (old) => {
      return function() {
         const ext = this.getExtension('OES_vertex_array_object');
         const ret = ext.bindVertexArrayOES(...arguments);
         return ret;
      };
   });

   // Consider:
   // Expose all these vertex attrib states as getter/setting members on objects.
   // Lazily bake the VAO when we draw.
}

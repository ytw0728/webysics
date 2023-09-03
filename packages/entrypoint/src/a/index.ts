const GRID_SIZE = 32

export async function init() {
  const root = document.querySelector('#root')
  if (root === null) {
    throw new Error('no root div element in index.html')
  }

  if (!('gpu' in window.navigator)) {
    root.textContent = 'WebGPU not supported on this browser.'
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  root.appendChild(canvas)

  const adapter = await window.navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('No appropriate GPUAdapter found.')
  }

  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')!

  const format = window.navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format,
  })

  /** Vertex */
  const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
    0.8, -0.8,
    0.8, 0.8,

    -0.8, -0.8, // Triangle 2 (Red)
    0.8, 0.8,
    -0.8, 0.8,
  ])
  const vertexBuffer = device.createBuffer({
    label: 'Cell vertices',
    size: vertices.byteLength,
    usage: window.GPUBufferUsage.VERTEX | window.GPUBufferUsage.COPY_DST,
  })

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
      format: 'float32x2',
      offset: 0,
      shaderLocation: 0,
    }],
  }

  /** Shader */
  const cellShaderModule = device.createShaderModule({
    label: 'Cell shader',
    code: /* wgsl*/`
      struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) instance: u32,
      };
      struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) cell: vec2f,
      };

      @group(0) @binding(0) var<uniform> grid: vec2f;

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        
        let i = f32(input.instance);
        let cell = vec2f(i % grid.x, floor(i / grid.x));
        let cellOffset = cell / grid * 2;
        let gridPos = (input.pos + 1) / grid - 1 + cellOffset;

        var output: VertexOutput;
        output.pos = vec4f(gridPos, 0, 1);
        output.cell = cell;
        return output;
      }

      struct FragInput {
        @location(0) cell: vec2f,
      };
      
      @fragment
      fn fragmentMain(input: FragInput) -> @location(0) vec4f {
        let c = input.cell / grid;

        return vec4f(c, 1 - c.x, 1); // (R, G, B, A)
      }
    `,
  })

  /** Pipeline */
  const cellPipeline = device.createRenderPipeline({
    label: 'Cell pipeline',
    layout: 'auto',
    vertex: {
      module: cellShaderModule,
      entryPoint: 'vertexMain',
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: 'fragmentMain',
      targets: [{
        format,
      }],
    },
  })

  /** Uniform */
  const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE])
  const uniformBuffer = device.createBuffer({
    label: 'Grid Uniforms',
    size: uniformArray.byteLength,
    usage: window.GPUBufferUsage.UNIFORM | window.GPUBufferUsage.COPY_DST,
  })


  paint(device, context)(cellPipeline, vertexBuffer, vertices, uniformArray,
      uniformBuffer)
}

const paint = (
    device: GPUDevice,
    context: GPUCanvasContext,
) => (
    pipeline: GPURenderPipeline,
    vertexBuffer: GPUBuffer,
    vertices: Float32Array,
    uniformArray: Float32Array,
    uniformBuffer: GPUBuffer,
) => {
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray)
  device.queue.writeBuffer(vertexBuffer, 0, vertices)

  const bindGroup = device.createBindGroup({
    label: 'Cell Renderer Bind Group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {buffer: uniformBuffer},
    }],
  })
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: {r: 0, g: 0, b: 0.4, a: 1.0},
      storeOp: 'store',
    }]})

  // Draw the square
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, vertexBuffer)

  // Draw enough cells to fill the grid
  pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE) // 6 vertices
  pass.end()

  device.queue.submit([encoder.finish()])
}

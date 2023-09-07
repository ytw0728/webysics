const GRID_SIZE = 32
const UPDATE_INTERVAL = 250
const WORKGROUP_SIZE = 8

export async function init() {
  const root = document.querySelector('#root')
  if (root === null) {
    throw new Error('no root div element in index.html')
  }

  if (!('gpu' in window.navigator)) {
    root.textContent = 'WebGPU not supported on this browser.'
  }
  const canvas = document.querySelector('canvas')!
  canvas.width = 1024
  canvas.height = 1024

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
    code: /* wgsl */`
      struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) instance: u32,
      };
      struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) cell: vec2f,
      };

      @group(0) @binding(0) var<uniform> grid: vec2f;
      @group(0) @binding(1) var<storage> cellState: array<u32>;

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        let i = f32(input.instance);
        let cell = vec2f(i % grid.x, floor(i / grid.x));
        let scale = f32(cellState[input.instance]);

        let cellOffset = cell / grid * 2;
        let gridPos = (input.pos * scale + 1) / grid - 1 + cellOffset;

        var output: VertexOutput;
        output.pos = vec4f(gridPos, 0, 1);
        output.cell = cell / grid;
        return output;
      }

      struct FragInput {
        @location(0) cell: vec2f,
      };
      
      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
        return vec4f(input.cell, 1.0 - input.cell.x, 1);
      }
    `,
  })

  const simulationShaderModule = device.createShaderModule({
    label: 'Game of Life simulation shader',
    code: /* wgsl */`
      @group(0) @binding(0) var<uniform> grid: vec2f;

      @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
      @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

      fn cellIndex(cell: vec2u) -> u32 {
        return (cell.y % u32(grid.y)) * u32(grid.x) +
               (cell.x % u32(grid.x));
      }

      fn cellActive(x: u32, y: u32) -> u32 {
        return cellStateIn[cellIndex(vec2(x, y))];
      }

      @compute
      @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
      fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
        // Determine how many active neighbors this cell has.
        let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                              cellActive(cell.x+1, cell.y) +
                              cellActive(cell.x+1, cell.y-1) +
                              cellActive(cell.x, cell.y-1) +
                              cellActive(cell.x-1, cell.y-1) +
                              cellActive(cell.x-1, cell.y) +
                              cellActive(cell.x-1, cell.y+1) +
                              cellActive(cell.x, cell.y+1);

        let i = cellIndex(cell.xy);

        // Conway's game of life rules:
        switch activeNeighbors {
          case 2: { // Active cells with 2 neighbors stay active.
            cellStateOut[i] = cellStateIn[i];
          }
          case 3: { // Cells with 3 neighbors become or stay active.
            cellStateOut[i] = 1;
          }
          default: { // Cells with < 2 or > 3 neighbors become inactive.
            cellStateOut[i] = 0;
          }
        }
      }
    `
  })

  /** Bind Group Layout  */
  const bindGroupLayout = device.createBindGroupLayout({
    label: 'Cell Bind Group Layout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: 'uniform' }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        /** cell state input buffer */
        buffer: { type: 'read-only-storage' }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        /** cell state output buffer */
        buffer: { type: 'storage' }
      }
    ]
  })

  /** Pipeline */
  const pipelineLayout = device.createPipelineLayout({
    label: 'Cell Pipeline Layout',
    bindGroupLayouts: [ bindGroupLayout ],
  })
  const cellPipeline = device.createRenderPipeline({
    label: 'Cell pipeline',
    layout: pipelineLayout,
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
  const simulationPipeline = device.createComputePipeline({
    label: 'Simulation Pipeline',
    layout: pipelineLayout,
    compute: {
      module: simulationShaderModule,
      entryPoint: 'computeMain'
    }
  })

  /** Uniform */
  const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE])
  const uniformBuffer = device.createBuffer({
    label: 'Grid Uniforms',
    size: uniformArray.byteLength,
    usage: window.GPUBufferUsage.UNIFORM | window.GPUBufferUsage.COPY_DST,
  })

  /** cellState */
  const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE)
  const cellStateStorage = [
    device.createBuffer({
      label: 'Cell State A',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
      label: 'Cell State B',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
  ]

  setInterval(() => {
    paint(device, context, new Date())
        (
          cellPipeline, 
          simulationPipeline,
          bindGroupLayout,
          cellStateStorage, cellStateArray,
          vertexBuffer, vertices,
          uniformArray, uniformBuffer,
        )
  }, UPDATE_INTERVAL)
}

const paint = (
    device: GPUDevice,
    context: GPUCanvasContext,
    date: Date,
) => (
    cellPipeline: GPURenderPipeline,
    simulationPipeline: GPUComputePipeline,
    bindGroupLayout: GPUBindGroupLayout,
    cellStateStorage: GPUBuffer[],
    cellStateArray: Uint32Array,
    vertexBuffer: GPUBuffer,
    vertices: Float32Array,
    uniformArray: Float32Array,
    uniformBuffer: GPUBuffer,
) => {
  device.queue.writeBuffer(vertexBuffer, 0, vertices)
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray)

  for (let i = 0; i < cellStateArray.length; ++i) {
    cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
  }
  device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray)

  const bindGroups = [
    device.createBindGroup({
      label: 'Cell Renderer Bind Group A',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {buffer: uniformBuffer},
        },
        {
          binding: 1,
          resource: { buffer: cellStateStorage[0] },
        },
        {
          binding: 2,
          resource: { buffer: cellStateStorage[1] },
        }
      ],
    }),
    device.createBindGroup({
      label: 'Cell Renderer Bind Group B',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer},
        },
        {
          binding: 1,
          resource: { buffer: cellStateStorage[1] }
        },
        {
          binding: 2,
          resource: { buffer: cellStateStorage[0] }
        }
      ]
    })
  ]


  const encoder = device.createCommandEncoder()

  const computePass = encoder.beginComputePass()
  const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE)
  computePass.setPipeline(simulationPipeline)
  computePass.setBindGroup(0, bindGroups[date.getSeconds() % 2])
  computePass.dispatchWorkgroups(workgroupCount, workgroupCount)  
  computePass.end()

  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: {r: 0, g: 0, b: 0.4, a: 1.0},
      storeOp: 'store',
    }]})
  
  // Draw the square
  pass.setPipeline(cellPipeline)
  pass.setBindGroup(0, bindGroups[date.getSeconds() % 2])
  pass.setVertexBuffer(0, vertexBuffer)

  // Draw enough cells to fill the grid
  pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE) // 6 vertices
  pass.end()

  device.queue.submit([encoder.finish()])
}

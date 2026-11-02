import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import { ChevronDown, ChevronUp, RotateCcw, Grid3X3, Box } from 'lucide-react';

interface Model3DViewerProps {
  blob: Blob;
  extension: string;
  fileName: string;
  heightClass?: string;
}

interface MeshMetrics {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  triangles: number;
}

const SWATCHES = [
  { label: 'Grafite PA12', hex: '#334155' },
  { label: 'Azul Engenharia', hex: '#2563eb' },
  { label: 'Âmbar Resina', hex: '#d97706' },
  { label: 'Inox 316L', hex: '#94a3b8', metallic: true },
];

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  blob,
  extension,
  fileName,
  heightClass = 'h-[420px]',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<MeshMetrics | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeSwatch, setActiveSwatch] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const controlsActionRef = useRef<{
    resetCamera: () => void;
    updateMaterial: (hex: string, metallic: boolean, wire: boolean) => void;
    toggleGrid: (visible: boolean) => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    setLoadError(null);

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.FogExp2('#0f172a', 0.0014);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 4000);
    camera.position.set(130, 95, 130);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.45);
    keyLight.position.set(120, 180, 100);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
    rimLight.position.set(-120, 80, -110);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(260, 26, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const sharedMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(SWATCHES[0].hex),
      roughness: 0.42,
      metalness: 0.18,
    });

    let initialCamPos = new THREE.Vector3(130, 95, 130);
    let initialTarget = new THREE.Vector3(0, 20, 0);

    let renderBusy = false;
    let renderDirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener('change', requestRender);

    const fitAndGroundObject = (object: THREE.Object3D) => {
      let triCount = 0;
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (!m.geometry.attributes.normal) {
            m.geometry.computeVertexNormals();
          }
          m.material = sharedMaterial;
          const pos = m.geometry.attributes.position;
          if (pos) {
            triCount += m.geometry.index
              ? Math.floor(m.geometry.index.count / 3)
              : Math.floor(pos.count / 3);
          }
        }
      });

      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Centralizar X/Z e apoiar base em Y = 0
      object.position.x -= center.x;
      object.position.z -= center.z;
      object.position.y -= box.min.y;

      modelGroup.add(object);

      const maxDim = Math.max(size.x, size.y, size.z, 10);
      const dist = maxDim * 1.9;
      initialTarget = new THREE.Vector3(0, size.y * 0.45, 0);
      initialCamPos = new THREE.Vector3(dist, dist * 0.72, dist);

      camera.position.copy(initialCamPos);
      controls.target.copy(initialTarget);
      camera.near = Math.max(0.1, maxDim / 500);
      camera.far = Math.max(2000, maxDim * 25);
      camera.updateProjectionMatrix();
      controls.update();

      setMetrics({
        sizeX: Math.round(size.x * 10) / 10,
        sizeY: Math.round(size.y * 10) / 10,
        sizeZ: Math.round(size.z * 10) / 10,
        triangles: triCount,
      });

      requestRender();
    };

    (async () => {
      try {
        const extUpper = extension.toUpperCase();
        const buffer = await blob.arrayBuffer();
        if (disposed) return;

        if (extUpper === 'STL') {
          const stlLoader = new STLLoader();
          const geometry = stlLoader.parse(buffer);
          const mesh = new THREE.Mesh(geometry, sharedMaterial);
          fitAndGroundObject(mesh);
        } else if (extUpper === 'OBJ') {
          const text = new TextDecoder().decode(buffer);
          const objLoader = new OBJLoader();
          const obj = objLoader.parse(text);
          fitAndGroundObject(obj);
        } else if (extUpper === '3MF') {
          const loader3mf = new ThreeMFLoader();
          const obj = loader3mf.parse(buffer);
          fitAndGroundObject(obj);
        } else {
          setLoadError('Formato sem suporte de malha 3D direta.');
        }
      } catch (err) {
        if (!disposed) {
          setLoadError(
            err instanceof Error
              ? `Não foi possível interpretar a geometria 3D: ${err.message}`
              : 'Erro ao interpretar malha tridimensional.'
          );
        }
      }
    })();

    controlsActionRef.current = {
      resetCamera: () => {
        camera.position.copy(initialCamPos);
        controls.target.copy(initialTarget);
        controls.update();
        requestRender();
      },
      updateMaterial: (hex: string, metallic: boolean, wire: boolean) => {
        sharedMaterial.color.set(hex);
        sharedMaterial.metalness = metallic ? 0.85 : 0.18;
        sharedMaterial.roughness = metallic ? 0.24 : 0.42;
        sharedMaterial.wireframe = wire;
        sharedMaterial.needsUpdate = true;
        requestRender();
      },
      toggleGrid: (visible: boolean) => {
        gridHelper.visible = visible;
        requestRender();
      },
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    requestRender();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      modelGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      sharedMaterial.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [blob, extension]);

  useEffect(() => {
    const sw = SWATCHES[activeSwatch];
    controlsActionRef.current?.updateMaterial(sw.hex, Boolean(sw.metallic), wireframe);
  }, [activeSwatch, wireframe]);

  useEffect(() => {
    controlsActionRef.current?.toggleGrid(showGrid);
  }, [showGrid]);

  return (
    <div className={`relative w-full ${heightClass} rounded-lg overflow-hidden border border-slate-800 bg-slate-950 select-none`}>
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Minimal Top-Left Technical Header */}
      <div className="absolute top-3 left-3 pointer-events-none rounded-md bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs text-slate-200">
        <div className="font-medium text-white truncate max-w-[260px]">{fileName}</div>
        {metrics && (
          <div className="mt-0.5 font-mono tabular-nums text-[11px] text-slate-400">
            {metrics.sizeX} × {metrics.sizeY} × {metrics.sizeZ} mm · {metrics.triangles.toLocaleString('pt-BR')} triângulos
          </div>
        )}
      </div>

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="max-w-sm">
            <Box className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">{loadError}</p>
            <p className="text-xs text-slate-400 mt-1">
              Você ainda pode realizar o download integral do arquivo original abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1 inline-flex items-center gap-1 rounded-t-md bg-slate-900 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Mostrar Controles 3D
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Ocultar Controles
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 shadow-xl">
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
              {SWATCHES.map((sw, idx) => (
                <button
                  key={sw.label}
                  type="button"
                  onClick={() => setActiveSwatch(idx)}
                  title={sw.label}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    activeSwatch === idx
                      ? 'border-white scale-110'
                      : 'border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: sw.hex }}
                  aria-label={`Acabamento ${sw.label}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setWireframe((w) => !w)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                wireframe
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Malha Wireframe
            </button>

            <button
              type="button"
              onClick={() => setShowGrid((g) => !g)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                showGrid
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" /> Mesa 260mm
            </button>

            <button
              type="button"
              onClick={() => controlsActionRef.current?.resetCamera()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Centralizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

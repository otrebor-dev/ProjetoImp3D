import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type SampleCadKind = 'bracket' | 'gear' | 'impeller_housing';

/**
 * Converte um BufferGeometry do Three.js em um arquivo binário STL válido (80-byte header + triângulos)
 * para que projetos demonstrativos e testes rápidos tenham modelos 3D reais visualizáveis e baixáveis.
 */
function geometryToBinaryStlBlob(geometry: THREE.BufferGeometry, headerLabel: string): Blob {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  nonIndexed.computeVertexNormals();

  const posAttr = nonIndexed.getAttribute('position');
  const triangleCount = Math.floor(posAttr.count / 3);
  const bufferLength = 84 + triangleCount * 50;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(`ICM Binary STL - ${headerLabel}`.slice(0, 79));
  for (let i = 0; i < headerBytes.length; i++) {
    view.setUint8(i, headerBytes[i]);
  }

  view.setUint32(80, triangleCount, true);

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    const idx = i * 3;
    pA.fromBufferAttribute(posAttr, idx);
    pB.fromBufferAttribute(posAttr, idx + 1);
    pC.fromBufferAttribute(posAttr, idx + 2);

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    cb.cross(ab).normalize();

    view.setFloat32(offset, cb.x, true);
    view.setFloat32(offset + 4, cb.y, true);
    view.setFloat32(offset + 8, cb.z, true);

    view.setFloat32(offset + 12, pA.x, true);
    view.setFloat32(offset + 16, pA.y, true);
    view.setFloat32(offset + 20, pA.z, true);

    view.setFloat32(offset + 24, pB.x, true);
    view.setFloat32(offset + 28, pB.y, true);
    view.setFloat32(offset + 32, pB.z, true);

    view.setFloat32(offset + 36, pC.x, true);
    view.setFloat32(offset + 40, pC.y, true);
    view.setFloat32(offset + 44, pC.z, true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  nonIndexed.dispose();
  return new Blob([arrayBuffer], { type: 'model/stl' });
}

export function generateSampleStlBlob(kind: SampleCadKind): {
  blob: Blob;
  fileName: string;
} {
  const parts: THREE.BufferGeometry[] = [];

  if (kind === 'bracket') {
    // Suporte estrutural flangeado em L com nervuras e bossa cilíndrica
    const basePlate = new THREE.BoxGeometry(84, 8, 56);
    basePlate.translate(0, 4, 0);
    parts.push(basePlate);

    const uprightWall = new THREE.BoxGeometry(10, 52, 56);
    uprightWall.translate(-37, 30, 0);
    parts.push(uprightWall);

    // Duas nervuras triangulares laterais via ExtrudeGeometry
    const ribShape = new THREE.Shape();
    ribShape.moveTo(0, 0);
    ribShape.lineTo(44, 0);
    ribShape.lineTo(0, 38);
    ribShape.closePath();

    const ribGeo1 = new THREE.ExtrudeGeometry(ribShape, { depth: 6, bevelEnabled: false });
    ribGeo1.translate(-32, 8, -25);
    parts.push(ribGeo1);

    const ribGeo2 = new THREE.ExtrudeGeometry(ribShape, { depth: 6, bevelEnabled: false });
    ribGeo2.translate(-32, 8, 19);
    parts.push(ribGeo2);

    // Bossa de mancal superior
    const bearingBoss = new THREE.CylinderGeometry(16, 16, 22, 32);
    bearingBoss.rotateZ(Math.PI / 2);
    bearingBoss.translate(-31, 42, 0);
    parts.push(bearingBoss);

    // Pés de fixação reforçados
    for (const [bx, bz] of [
      [24, -18],
      [24, 18],
      [4, -18],
      [4, 18],
    ]) {
      const washerBoss = new THREE.CylinderGeometry(6, 6.5, 3, 20);
      washerBoss.translate(bx, 9.5, bz);
      parts.push(washerBoss);
    }

    const normalized = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(normalized, false);
    const blob = geometryToBinaryStlBlob(merged, 'Suporte_Mancal_AeroVant_RevC');
    parts.forEach((g) => g.dispose());
    normalized.forEach((g) => g.dispose());
    merged.dispose();
    return { blob, fileName: 'suporte_mancal_aerovant_revC.stl' };
  }

  if (kind === 'gear') {
    // Engrenagem cilíndrica de 20 dentes com cubo central escalonado
    const outerR = 34;
    const rootR = 29;
    const teeth = 20;
    const gearShape = new THREE.Shape();

    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = ((i + 0.22) / teeth) * Math.PI * 2;
      const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.72) / teeth) * Math.PI * 2;

      if (i === 0) {
        gearShape.moveTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
      } else {
        gearShape.lineTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
      }
      gearShape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      gearShape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      gearShape.lineTo(Math.cos(a3) * rootR, Math.sin(a3) * rootR);
    }
    gearShape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, 9, 0, Math.PI * 2, true);
    gearShape.holes.push(holePath);

    const body = new THREE.ExtrudeGeometry(gearShape, {
      depth: 14,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 0.8,
      bevelSegments: 2,
    });
    body.rotateX(-Math.PI / 2);
    body.translate(0, 1, 0);
    parts.push(body);

    const hub = new THREE.CylinderGeometry(15, 16, 22, 32);
    hub.translate(0, 11, 0);
    parts.push(hub);

    const normalized = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(normalized, false);
    const blob = geometryToBinaryStlBlob(merged, 'Engrenagem_Planetaria_PA12_20Z');
    parts.forEach((g) => g.dispose());
    normalized.forEach((g) => g.dispose());
    merged.dispose();
    return { blob, fileName: 'engrenagem_planetaria_pa12_20z.stl' };
  }

  // Carcaça de difusor / rotor técnico
  const flange = new THREE.CylinderGeometry(40, 40, 6, 36);
  flange.translate(0, 3, 0);
  parts.push(flange);

  const shroud = new THREE.CylinderGeometry(24, 32, 28, 32);
  shroud.translate(0, 20, 0);
  parts.push(shroud);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const fin = new THREE.BoxGeometry(3, 24, 14);
    fin.translate(0, 18, 26);
    fin.rotateY(angle);
    parts.push(fin);
  }

  const topPort = new THREE.CylinderGeometry(14, 14, 14, 28);
  topPort.translate(0, 38, 0);
  parts.push(topPort);

  const normalized = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = mergeGeometries(normalized, false);
  const blob = geometryToBinaryStlBlob(merged, 'Rotor_Difusor_Inox316L_V2');
  parts.forEach((g) => g.dispose());
  normalized.forEach((g) => g.dispose());
  merged.dispose();
  return { blob, fileName: 'rotor_difusor_inox316l_v2.stl' };
}

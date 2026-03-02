import * as THREE from 'three';
import { MeshLineRaycast } from './raycast';
import { memcpy } from './utils';

export class MeshLine extends THREE.BufferGeometry {
  type: string = 'MeshLine';
  isMeshLine: boolean = true;
  positions: number[] = [];
  raycast: any = MeshLineRaycast;
  previous: number[] = [];
  next: number[] = [];
  side: number[] = [];
  width: number[] = [];
  indices_array: number[] = [];
  uvs: number[] = [];
  counters: number[] = [];
  _points: any[] | Float32Array = [];
  _geom: any = null;
  _geometry: any = null;
  widthCallback: ((p: number) => number) | null = null;
  matrixWorld: THREE.Matrix4 = new THREE.Matrix4();
  _attributes: any;

  constructor() {
    super();

    Object.defineProperties(this, {
      geometry: {
        enumerable: true,
        get() {
          return this;
        },
      },
      geom: {
        enumerable: true,
        get() {
          return this._geom;
        },
        set(value) {
          this.setGeometry(value, this.widthCallback);
        },
      },
      points: {
        enumerable: true,
        get() {
          return this._points;
        },
        set(value) {
          this.setPoints(value, this.widthCallback);
        },
      },
    });
  }

  setMatrixWorld(matrixWorld: THREE.Matrix4) {
    this.matrixWorld = matrixWorld;
  }

  setGeometry(g: any, c: any) {
    this._geometry = g;
    if (g instanceof THREE.BufferGeometry) {
      this.setPoints(g.getAttribute('position').array, c);
    } else {
      this.setPoints(g, c);
    }
  }

  setPoints(points: any[] | Float32Array, wcb?: (p: number) => number) {
    if (!(points instanceof Float32Array) && !(points instanceof Array)) {
      console.error(
        'ERROR: The BufferArray of points is not instancied correctly.'
      );
      return;
    }
    this._points = points;
    this.widthCallback = wcb || null;
    this.positions = [];
    this.counters = [];
    if (points.length && points[0] instanceof THREE.Vector3) {
      for (let j = 0; j < points.length; j++) {
        const p = points[j] as THREE.Vector3;
        const c = j / points.length;
        this.positions.push(p.x, p.y, p.z);
        this.positions.push(p.x, p.y, p.z);
        this.counters.push(c);
        this.counters.push(c);
      }
    } else {
      for (let j = 0; j < points.length; j += 3) {
        const c = j / points.length;
        this.positions.push(points[j], points[j + 1], points[j + 2]);
        this.positions.push(points[j], points[j + 1], points[j + 2]);
        this.counters.push(c);
        this.counters.push(c);
      }
    }
    this.process();
  }

  compareV3(a: number, b: number): boolean {
    const aa = a * 6;
    const ab = b * 6;
    return (
      this.positions[aa] === this.positions[ab] &&
      this.positions[aa + 1] === this.positions[ab + 1] &&
      this.positions[aa + 2] === this.positions[ab + 2]
    );
  }

  copyV3(a: number): [number, number, number] {
    const aa = a * 6;
    return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]];
  }

  process() {
    const l = this.positions.length / 6;

    this.previous = [];
    this.next = [];
    this.side = [];
    this.width = [];
    this.indices_array = [];
    this.uvs = [];

    let w: number;
    let v: [number, number, number];

    if (this.compareV3(0, l - 1)) {
      v = this.copyV3(l - 2);
    } else {
      v = this.copyV3(0);
    }
    this.previous.push(v[0], v[1], v[2]);
    this.previous.push(v[0], v[1], v[2]);

    for (let j = 0; j < l; j++) {
      this.side.push(1);
      this.side.push(-1);

      if (this.widthCallback) w = this.widthCallback(j / (l - 1));
      else w = 1;
      this.width.push(w);
      this.width.push(w);

      this.uvs.push(j / (l - 1), 0);
      this.uvs.push(j / (l - 1), 1);

      if (j < l - 1) {
        v = this.copyV3(j);
        this.previous.push(v[0], v[1], v[2]);
        this.previous.push(v[0], v[1], v[2]);

        const n = j * 2;
        this.indices_array.push(n, n + 1, n + 2);
        this.indices_array.push(n + 2, n + 1, n + 3);
      }
      if (j > 0) {
        v = this.copyV3(j);
        this.next.push(v[0], v[1], v[2]);
        this.next.push(v[0], v[1], v[2]);
      }
    }

    if (this.compareV3(l - 1, 0)) {
      v = this.copyV3(1);
    } else {
      v = this.copyV3(l - 1);
    }
    this.next.push(v[0], v[1], v[2]);
    this.next.push(v[0], v[1], v[2]);

    if (
      !this._attributes ||
      this._attributes.position.count !== this.positions.length / 3
    ) {
      this._attributes = {
        position: new THREE.BufferAttribute(
          new Float32Array(this.positions),
          3
        ),
        previous: new THREE.BufferAttribute(new Float32Array(this.previous), 3),
        next: new THREE.BufferAttribute(new Float32Array(this.next), 3),
        side: new THREE.BufferAttribute(new Float32Array(this.side), 1),
        width: new THREE.BufferAttribute(new Float32Array(this.width), 1),
        uv: new THREE.BufferAttribute(new Float32Array(this.uvs), 2),
        index: new THREE.BufferAttribute(
          new Uint16Array(this.indices_array),
          1
        ),
        counters: new THREE.BufferAttribute(new Float32Array(this.counters), 1),
      };
    } else {
      this._attributes.position.copyArray(new Float32Array(this.positions));
      this._attributes.position.needsUpdate = true;
      this._attributes.previous.copyArray(new Float32Array(this.previous));
      this._attributes.previous.needsUpdate = true;
      this._attributes.next.copyArray(new Float32Array(this.next));
      this._attributes.next.needsUpdate = true;
      this._attributes.side.copyArray(new Float32Array(this.side));
      this._attributes.side.needsUpdate = true;
      this._attributes.width.copyArray(new Float32Array(this.width));
      this._attributes.width.needsUpdate = true;
      this._attributes.uv.copyArray(new Float32Array(this.uvs));
      this._attributes.uv.needsUpdate = true;
      this._attributes.index.copyArray(new Uint16Array(this.indices_array));
      this._attributes.index.needsUpdate = true;
    }

    this.setAttribute('position', this._attributes.position);
    this.setAttribute('previous', this._attributes.previous);
    this.setAttribute('next', this._attributes.next);
    this.setAttribute('side', this._attributes.side);
    this.setAttribute('width', this._attributes.width);
    this.setAttribute('uv', this._attributes.uv);
    this.setAttribute('counters', this._attributes.counters);

    this.setIndex(this._attributes.index);

    this.computeBoundingSphere();
    this.computeBoundingBox();
  }

  advance({ x, y, z }: { x: number; y: number; z: number }) {
    const positions = this._attributes.position.array;
    const previous = this._attributes.previous.array;
    const next = this._attributes.next.array;
    const l = positions.length;

    memcpy(positions, 0, previous, 0, l);
    memcpy(positions, 6, positions, 0, l - 6);

    positions[l - 6] = x;
    positions[l - 5] = y;
    positions[l - 4] = z;
    positions[l - 3] = x;
    positions[l - 2] = y;
    positions[l - 1] = z;

    memcpy(positions, 6, next, 0, l - 6);

    next[l - 6] = x;
    next[l - 5] = y;
    next[l - 4] = z;
    next[l - 3] = x;
    next[l - 2] = y;
    next[l - 1] = z;

    this._attributes.position.needsUpdate = true;
    this._attributes.previous.needsUpdate = true;
    this._attributes.next.needsUpdate = true;
  }
}

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { test } from "node:test";
const root = new URL("../public/assets/character/", import.meta.url);
function inspectPng(relative) {
  const png = readFileSync(new URL(relative, root));
  assert.equal(png.subarray(1,4).toString(), "PNG");
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8, `${relative}: expected 8-bit pixels`);
  assert.equal(png[25], 6, `${relative}: expected RGBA`);
  assert.equal(png[28], 0, `${relative}: expected non-interlaced PNG`);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  let previous = new Uint8Array(stride), transparent = 0, visible = 0;
  const paeth = (a,b,c) => { const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c); return pa<=pb&&pa<=pc?a:pb<=pc?b:c; };
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(stride), filter = raw[y * (stride + 1)];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x-4] : 0, b=previous[x], c=x>=4?previous[x-4]:0;
      const add = [0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      row[x] = (raw[y * (stride + 1) + x + 1] + add) & 255;
    }
    for (let x = 3; x < stride; x+=4) { if (row[x] === 0) transparent++; else visible++; }
    previous = row;
  }
  assert.ok(transparent > 0 && visible > 0, `${relative}: must contain transparent background and visible character`);
  return `${relative}: ${width}×${height}, ${Math.round(100*transparent/(width*height))}% transparent`;
}
test("ZIP supplies precisely eight ordered transparent animation frames", (t) => {
  assert.deepEqual(readdirSync(new URL("animation/", root)).sort(), Array.from({length:8},(_,i)=>`frame_${String(i+1).padStart(2,"0")}.png`));
  for(let i=1;i<=8;i++) t.diagnostic(inspectPng(`animation/frame_${String(i).padStart(2,"0")}.png`));
});
test("all ten state images have real transparent RGBA backgrounds", (t) => {
  for(const name of ["idle","curious","no_result","warning","success","searching","camera","medicine_book","favorite","sleeping"]) t.diagnostic(inspectPng(`states/${name}.png`));
});

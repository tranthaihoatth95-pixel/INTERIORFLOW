import { recognizeStroke, simplifyStroke } from './stroke-recognize';
import type { Pt } from './model';

let pass = 0; let fail = 0;
function ok(name: string, value: boolean) { if (value) { pass++; console.log(`  ok  - ${name}`); } else { fail++; console.error(`  FAIL - ${name}`); } }
const kind = (pts: Pt[]) => recognizeStroke(pts, { tolMm: 8 })?.kind;

ok('đường xiên được nắn thẳng', kind([{x:0,y:0},{x:50,y:2},{x:100,y:0}]) === 'line');
const horizontal = recognizeStroke([{x:0,y:0},{x:50,y:2},{x:100,y:3}], { tolMm: 2 });
ok('đường gần ngang ép ngang tuyệt đối', horizontal?.kind === 'line' && horizontal.a.y === horizontal.b.y);
const vertical = recognizeStroke([{x:0,y:0},{x:2,y:50},{x:3,y:100}], { tolMm: 2 });
ok('đường gần dọc ép dọc tuyệt đối', vertical?.kind === 'line' && vertical.a.x === vertical.b.x);
ok('nét chữ L giữ thành polyline', kind([{x:0,y:0},{x:50,y:0},{x:50,y:50}]) === 'polyline');
const rect: Pt[] = [{x:0,y:0},{x:50,y:1},{x:100,y:0},{x:101,y:50},{x:100,y:100},{x:50,y:99},{x:0,y:100},{x:1,y:50},{x:0,y:0}];
ok('vòng bốn cạnh nhận thành chữ nhật', kind(rect) === 'rect');
const circle = Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return{x:50+30*Math.cos(a),y:60+30*Math.sin(a)}});
ok('vòng tròn nhận thành circle', kind(circle) === 'circle');
const ellipse = Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return{x:50+45*Math.cos(a),y:60+20*Math.sin(a)}});
ok('ellipse không bị đoán sai thành circle', kind(ellipse) === 'polyline');
ok('scribble được giữ lại dạng polyline', kind([{x:0,y:0},{x:30,y:30},{x:0,y:30},{x:30,y:0},{x:0,y:0}]) === 'polyline');
ok('một điểm không sinh entity', recognizeStroke([{x:1,y:1}]) === null);
ok('RDP giảm điểm thẳng nhưng giữ hai đầu', simplifyStroke([{x:0,y:0},{x:20,y:1},{x:40,y:0}], 2).length === 2);

console.log(`\n${pass} ok, ${fail} fail`); if (fail) process.exit(1);

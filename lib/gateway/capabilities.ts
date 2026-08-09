/**
 * Nguồn sự thật duy nhất về khả năng file của IF.
 *
 * `detectFormat()` chỉ trả lời "đây là file gì". Bảng này mới trả lời IF có làm được gì với
 * file đó. Không được dùng việc nhận ra đuôi file làm bằng chứng rằng app đã import được.
 */

import type { GatewayFormat } from './detect';
import type { GatewayStage } from './route';

export type FidelityLevel = 'editable' | 'lossy' | 'reference' | 'storage' | 'unavailable';
export type FileOperation = 'import' | 'export';

export interface StageCapability {
  import: FidelityLevel;
  export: FidelityLevel;
  note: string;
}

export interface FormatCapability {
  format: GatewayFormat;
  label: string;
  extensions: readonly string[];
  stages: Record<GatewayStage, StageCapability>;
}

const no = (note = 'Chưa hỗ trợ'): StageCapability => ({ import: 'unavailable', export: 'unavailable', note });
const stage = (imp: FidelityLevel, exp: FidelityLevel, note: string): StageCapability => ({ import: imp, export: exp, note });

export const FORMAT_CAPABILITIES: Record<GatewayFormat, FormatCapability> = {
  idf: { format: 'idf', label: 'InteriorFlow Drawing', extensions: ['.idf'], stages: {
    cad: stage('editable', 'editable', 'Project 2D tự chứa, mở lại chỉnh tiếp'), render: no(), present: no(),
  } },
  ifpack: { format: 'ifpack', label: 'InteriorFlow Backup', extensions: ['.ifpack'], stages: {
    cad: stage('editable', 'editable', 'Phục hồi/backup toàn dự án'),
    render: stage('editable', 'unavailable', 'Phục hồi toàn dự án từ bất kỳ chặng nào'),
    present: stage('editable', 'unavailable', 'Phục hồi toàn dự án từ bất kỳ chặng nào'),
  } },
  dxf: { format: 'dxf', label: 'AutoCAD DXF', extensions: ['.dxf'], stages: {
    cad: stage('lossy', 'lossy', 'Nhập/xuất hình học; một số entity có thể bị làm phẳng hoặc bỏ qua'), render: no(), present: no(),
  } },
  dwg: { format: 'dwg', label: 'AutoCAD DWG', extensions: ['.dwg'], stages: {
    cad: stage('lossy', 'unavailable', 'Đọc hình học qua bộ chuyển đổi; chưa xuất DWG'), render: no(), present: no(),
  } },
  image: { format: 'image', label: 'Image', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'], stages: {
    cad: stage('reference', 'unavailable', 'Đặt làm ảnh tham chiếu'),
    render: stage('reference', 'unavailable', 'Tạo node nhập ảnh'),
    present: stage('reference', 'lossy', 'Đặt lên slide; xuất slide thành PNG'),
  } },
  pptx: { format: 'pptx', label: 'PowerPoint', extensions: ['.pptx'], stages: {
    cad: no(), render: no(), present: stage('lossy', 'lossy', 'Nhập chữ/ảnh cơ bản; hiệu ứng và một số bố cục không round-trip đầy đủ'),
  } },
  pdf: { format: 'pdf', label: 'PDF', extensions: ['.pdf'], stages: {
    cad: stage('reference', 'lossy', 'PDF brief/ảnh tham chiếu; xuất hồ sơ PDF'),
    render: stage('reference', 'lossy', 'Đọc làm tài liệu tham chiếu; xuất deck ảnh thành PDF'),
    present: stage('unavailable', 'lossy', 'Chưa nhập PDF thành slide; đã xuất deck PDF'),
  } },
  xlsx: { format: 'xlsx', label: 'Excel', extensions: ['.xlsx'], stages: {
    cad: stage('lossy', 'unavailable', 'Nạp dữ liệu kho/thư viện, không mở thành bản vẽ'), render: no(),
    present: stage('lossy', 'lossy', 'Nhập vào BOQ theo mã; xuất BOQ/FF&E'),
  } },
  csv: { format: 'csv', label: 'CSV', extensions: ['.csv'], stages: {
    cad: stage('lossy', 'unavailable', 'Nạp dữ liệu kho/thư viện'), render: no(),
    present: stage('lossy', 'unavailable', 'Nhập bảng BOQ; chưa xuất CSV'),
  } },
  idfp: { format: 'idfp', label: 'InteriorFlow Presentation', extensions: ['.idfp'], stages: {
    cad: no(), render: no(), present: stage('editable', 'editable', 'Project Trình bày tự chứa, mở lại chỉnh tiếp'),
  } },
  glb: { format: 'glb', label: 'glTF Binary', extensions: ['.glb'], stages: {
    cad: no(), render: stage('lossy', 'unavailable', 'Nhập hình học và màu nền; giữ file gốc, chưa hiển thị texture/animation'), present: no(),
  } },
  gltf: { format: 'gltf', label: 'glTF', extensions: ['.gltf'], stages: {
    cad: no(), render: stage('lossy', 'unavailable', 'Chọn cùng .gltf + .bin + texture; nhập hình học/màu nền và giữ trọn gói nguồn'), present: no(),
  } },
  obj: { format: 'obj', label: 'Wavefront OBJ', extensions: ['.obj', '.mtl'], stages: {
    cad: no(), render: stage('lossy', 'unavailable', 'Chọn cùng OBJ + MTL + texture; OBJ không khai đơn vị/trục nên phải kiểm kích thước'), present: no(),
  } },
  fbx: { format: 'fbx', label: 'Autodesk FBX', extensions: ['.fbx'], stages: { cad: no(), render: no('Chưa có importer FBX'), present: no() } },
  skp: { format: 'skp', label: 'SketchUp', extensions: ['.skp'], stages: { cad: no(), render: no('Cần SDK/bridge và kiểm tra license'), present: no() } },
  max: { format: 'max', label: '3ds Max Scene', extensions: ['.max'], stages: { cad: no(), render: no('Dùng bridge/plugin qua FBX hoặc glTF; không đọc native trực tiếp'), present: no() } },
  ifc: { format: 'ifc', label: 'IFC', extensions: ['.ifc', '.ifczip'], stages: { cad: no('Mới có metadata, chưa import IFC đầy đủ'), render: no('Chưa có importer IFC'), present: no() } },
  rvt: { format: 'rvt', label: 'Revit', extensions: ['.rvt'], stages: { cad: no(), render: no('Dùng IFC/bridge; không đọc native trực tiếp'), present: no() } },
  docx: { format: 'docx', label: 'Word', extensions: ['.docx'], stages: { cad: no('Brief chỉ nhận PDF/TXT/MD'), render: no(), present: no('Chưa có editor Văn bản') } },
  video: { format: 'video', label: 'Video', extensions: ['.mp4', '.mov', '.webm'], stages: { cad: no(), render: no(), present: no('Chưa có editor Video') } },
  audio: { format: 'audio', label: 'Audio', extensions: ['.mp3', '.wav', '.m4a', '.ogg'], stages: { cad: no(), render: no(), present: no('Chưa có timeline/media editor') } },
  html: { format: 'html', label: 'HTML', extensions: ['.html', '.htm'], stages: { cad: no(), render: no(), present: no('Chưa có spec/editor HTML') } },
  unknown: { format: 'unknown', label: 'Unknown', extensions: [], stages: { cad: no('Không nhận diện được định dạng'), render: no('Không nhận diện được định dạng'), present: no('Không nhận diện được định dạng') } },
};

export function capabilityFor(format: GatewayFormat, stageName: GatewayStage): StageCapability {
  return FORMAT_CAPABILITIES[format].stages[stageName];
}

export function canOperate(format: GatewayFormat, stageName: GatewayStage, operation: FileOperation): boolean {
  return capabilityFor(format, stageName)[operation] !== 'unavailable';
}

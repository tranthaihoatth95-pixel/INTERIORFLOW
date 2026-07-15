# scripts/blender/obj2fbx.py — convert OBJ (từ node "Bản vẽ → 3D") sang FBX, headless.
#
# Chạy:  blender --background --factory-startup --python scripts/blender/obj2fbx.py -- \
#          <input.obj> <output.fbx> [camera.json]
#
# camera.json (tuỳ chọn, do lib/three/camera.ts placeCamera sinh):
#   { "pos": [x, y, z], "target": [x, y, z], "lensMm": 24 }
#   Toạ độ Z-up MÉT — trùng hệ Blender sau khi import OBJ (forward -Z, up Y mặc định).
#
# Được gọi bởi lib/server/blender.ts (API /api/render/fbx). Thuần bpy chuẩn, không addon ngoài.
import json
import sys

import bpy


def die(msg: str) -> None:
    print(f"[obj2fbx] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(argv) < 2:
        die("usage: blender --background --python obj2fbx.py -- in.obj out.fbx [camera.json]")
    obj_path, fbx_path = argv[0], argv[1]
    cam_path = argv[2] if len(argv) > 2 else None

    # scene sạch (factory-startup vẫn có cube/camera/light mặc định)
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # import OBJ — Blender 4.x dùng wm.obj_import; fallback 3.x import_scene.obj
    if hasattr(bpy.ops.wm, "obj_import"):
        bpy.ops.wm.obj_import(filepath=obj_path)
    elif hasattr(bpy.ops.import_scene, "obj"):
        bpy.ops.import_scene.obj(filepath=obj_path)
    else:
        die("Blender này không có importer OBJ.")

    if not [o for o in bpy.context.scene.objects if o.type == "MESH"]:
        die("OBJ import ra 0 mesh — file rỗng/hỏng?")

    # camera tuỳ chọn (Z-up mét, khớp placeCamera của lib/three/camera.ts)
    if cam_path:
        try:
            with open(cam_path, "r", encoding="utf-8") as f:
                cam = json.load(f)
            pos = [float(v) for v in cam["pos"]]
            target = [float(v) for v in cam["target"]]
            lens = float(cam.get("lensMm", 35))
        except (OSError, KeyError, TypeError, ValueError) as e:
            die(f"camera.json hỏng: {e}")
        cam_data = bpy.data.cameras.new("IF_Camera")
        cam_data.lens = lens
        cam_obj = bpy.data.objects.new("IF_Camera", cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
        cam_obj.location = pos
        # xoay camera nhìn vào target: track -Z (hướng nhìn), up Y — chuẩn mathutils
        from mathutils import Vector

        direction = Vector(target) - Vector(pos)
        if direction.length < 1e-9:
            direction = Vector((0.0, 1.0, 0.0))
        cam_obj.rotation_mode = "QUATERNION"
        cam_obj.rotation_quaternion = direction.to_track_quat("-Z", "Y")
        bpy.context.scene.camera = cam_obj

    # export FBX — path_mode COPY + embed để .fbx tự chứa texture (nếu sau này có)
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=False,
        apply_unit_scale=True,
        path_mode="COPY",
        embed_textures=True,
    )
    print(f"[obj2fbx] OK → {fbx_path}")


main()

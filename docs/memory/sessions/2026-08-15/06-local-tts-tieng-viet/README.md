# 06 · Thiết lập LOCAL_TTS (VoxCPM2) — sinh tiếng Việt offline

> **Loại việc:** hạ tầng máy trạm của Hoà, KHÔNG phải tính năng IF. Ghi lại vì có thể nuôi việc
> IF sau này (thuyết minh video `intro-day-chuyen`, narration Story Set).

## Bối cảnh
Hoà yêu cầu "THIẾT LẬP LOCAL_TTS", kèm nhắc đường dẫn cài dictation tiếng Việt của macOS.

## Phát hiện đầu tiên — dictation ĐÃ CÓ SẴN
Đọc (chỉ đọc, không sửa) `com.apple.speech.recognition.AppleSpeechRecognition.prefs`:
`DictationIMPreferredLanguageIdentifiers = ("vi_VN", "en_US")` — tiếng Việt đã là ngôn ngữ ưu
tiên #1 từ trước. Không cần thao tác gì. (Cũng không được tự sửa cài đặt hệ thống — việc của Hoà.)

## Môi trường đo được
| Hạng mục | Giá trị | Đạt? |
|---|---|---|
| Chip | arm64 (Apple Silicon) | ✅ |
| macOS | 26.5 | ✅ |
| RAM | 16 GB | ✅ đúng mức khuyến nghị TỐI THIỂU |
| Trống ổ | 54 GB | ✅ (cần ~10GB model + 1.7GB venv) |
| Python | **3.13.9** (skill khuyến nghị 3.12) | ✅ không thành vấn đề — xem dưới |
| torch | 2.13.0, **MPS (Metal) = True** | ✅ chạy GPU Apple Silicon |

**Rủi ro đã lường trước và loại bỏ**: lo Python 3.13 quá mới, gói ML chưa có wheel. Kiểm bằng
`pip install --dry-run voxcpm` TRƯỚC khi tải nặng → resolve thành công, đủ wheel `cp313`
(torch 2.13.0, transformers 5.15.0, voxcpm 2.0.3). Bài học: dry-run trước khi cam kết tải GB.

## Đã cài
- venv: `~/.local-tts/venv` (1.7 GB sau khi cài gói)
- Script: `~/.claude/plugins/cache/claude-code-plugins-plus/local-tts/1.3.0/scripts/generate.py`
- Model weights ~10GB → `~/.cache/huggingface/` (tải ở lần sinh tiếng đầu tiên)

## Khả năng (VoxCPM2, Apache-2.0, offline sau lần tải đầu, 0đ)
1. **Giọng mặc định** — đưa chữ, tự nhận diện ngôn ngữ (VN nằm trong 30 ngôn ngữ hỗ trợ).
2. **Voice Design** — mô tả giọng trong ngoặc đầu câu: `(giọng nữ ấm, trung niên, nói chậm)`.
3. **Voice Cloning** — mẫu 3-10 giây → clone timbre/accent/cảm xúc.
4. **Ultimate Cloning** — `--ref` + `--prompt-wav` cùng file, độ trung thực cao nhất.

Đầu ra: WAV 48kHz mono 16-bit, ~100KB/giây tiếng. Tốc độ ~2.3× realtime (10s tiếng ≈ 23s tính)
— **hợp lồng tiếng/ghi sẵn, KHÔNG hợp realtime streaming**.

## Lệnh dùng lại
```bash
VENV=~/.local-tts/venv
SCRIPT=~/.claude/plugins/cache/claude-code-plugins-plus/local-tts/1.3.0/scripts/generate.py
"$VENV/bin/python" "$SCRIPT" --text "Câu tiếng Việt cần đọc." --out /tmp/ra.wav
# clone giọng:
"$VENV/bin/python" "$SCRIPT" --text "..." --ref /duong/dan/mau-giong.wav --out /tmp/ra.wav
```

## Nối vào IF (đề xuất, CHƯA làm)
Voice cloning giọng Hoà → thuyết minh cho `intro-day-chuyen` (video "Dây chuyền · Bung nở · Một
Nguồn" đang treo trong frontier registry) và narration Story Set — thay vì giọng máy vô hồn hoặc
thuê đọc. Chưa chốt, chỉ ghi lại khả năng.

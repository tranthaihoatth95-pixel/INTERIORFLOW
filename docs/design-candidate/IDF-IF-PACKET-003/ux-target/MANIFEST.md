# IF · UX TARGET — MANIFEST

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · HEAD đo `63de2d8` · lập 27/08/2026

> Băm lấy bằng `shasum -a 256` trên chính tệp trong thư mục này, tại thời điểm đóng gói.
> Ảnh: **không có, và thư mục `anh/` KHÔNG được tạo** — lượt này CHỈ ĐỌC, không chạy server, không dựng ảnh nào. Ảnh runtime của gói nằm ở `../ux/anh/` (23 tệp của lượt 1, kế thừa).
> Mọi cột `393×852` trong gói là `PROPOSED`, xem `00-INDEX.md` §4 NA-1.

| tệp | byte | sha256 |
|---|---|---|
| `00-INDEX.md` | 9108 | `2b49df7ad5de463f64b81f445a53bc2ac7c5c97ef2078f264ec2eac09e1d807e` |
| `01-TARGET-SHELL.md` | 31591 | `aedcf3b6fe353776983727214db5057763dff9df9ed37e540fd276fbcc4e4ce9` |
| `02-TARGET-HOME.md` | 23852 | `fa1b67b76ce41c4be0d821e6472f1718a5b7f45bac7dab0fa8bd7d339fe20f8c` |
| `03-TARGET-DOCK.md` | 21807 | `6446b7c2515179dc3585bbfc4fca768f7a081c38972260a7d96e7c44b7310dfd` |
| `04-TARGET-VITALS.md` | 26765 | `6a6a93dae79f1dc341b88bf5693ba310d2b841d19ceaef644c0bf660247ca129` |

**MANIFEST.md tự nó không có băm** — một tệp không băm được chính nó.

## Kiểm lại
```
cd docs/design-candidate/IDF-IF-PACKET-003/ux-target
shasum -a 256 0*.md
```

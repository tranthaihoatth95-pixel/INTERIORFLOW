# SPEC — Vitals thống nhất: ngữ cảnh · hành động · giao diện

> Trạng thái: **spec thực thi nội bộ** · 11/08/2026  
> Kế thừa `SPEC-VITALS-ROLE.md`, `SPEC-VITALS-AI.md`, `SPEC-VITALS-VISUAL.md`; khi mâu thuẫn về cách dùng/giao diện, file này được ưu tiên. Không thay thế các chốt trung tính, nguồn trích dẫn, Brand Kit hay một Doc xuyên chặng.

## 1. Quyết định cốt lõi

**Vitals là người đồng hành theo ngữ cảnh, biến ý định thành một đề xuất có thể kiểm tra và hoàn tác.** Nó không phải chatbot toàn màn, không phải nút “Magic” mơ hồ, cũng không tự quyết thiết kế thay người dùng.

Một lượt Vitals tốt phải đi theo cùng một nhịp:

`ý định → hiểu bối cảnh → hỏi tối đa 2 điều còn thiếu → đề xuất → xem trước → áp dụng → hoàn tác`

Người dùng luôn nhìn thấy Vitals đang hiểu gì, sắp làm gì và có thể sửa ở đâu. Nếu ứng dụng chưa có năng lực thực thi, Vitals nói rõ là chỉ đang tư vấn/định hướng; không dựng CTA giả.

## 2. Những việc Vitals được làm

| Vai trò | Đầu ra nhìn thấy được | Điều không được làm |
|---|---|---|
| **Đọc và tra cứu** | Câu trả lời ngắn; nguồn/citation khi là dữ liệu hay quy chuẩn | Bịa số liệu, giá, tiêu chuẩn hoặc nguồn |
| **Nhìn ngữ cảnh** | Nhắc đúng đối tượng đang chọn, phần còn thiếu, bước kế tiếp | Lôi dữ liệu dự án khác vào phiên hiện tại |
| **Đề xuất thao tác** | Recipe/preview có tham số cụ thể | Ghi thẳng vào Doc khi chưa cho xem trước |
| **Thực hiện việc lặp** | Một mutation đi qua engine thật, undo/redo chung | Tạo luồng dữ liệu/undo riêng cho “AI” |

Không thuộc Vitals: tán gẫu dài, tự chọn gu mặc định cho dự án, hứa hỗ trợ định dạng chưa có, hay biến mọi thao tác tay thành một prompt.

## 3. Một bề mặt, không ba cửa vào cạnh tranh

Vitals có một nơi ở thường trực: **trạng thái đáy ứng dụng**. Ở trạng thái nghỉ, đó là glyph 20px và nhãn “Vitals” rất gọn; khi rê chuột hoặc nhấn phím tắt, nó nở thành ô nhập một dòng. Đây là cửa vào chung cho cả 2D, 3D, Trình bày và Thư viện.

Hai điểm vào phụ chỉ xuất hiện khi chúng có ngữ cảnh rõ:

| Nơi gọi | Khi dùng | Hành vi |
|---|---|---|
| **Chuột phải / chọn đối tượng** | Đã chọn phòng, tường, khối, ảnh, slide hoặc tài sản | “Hỏi Vitals về mục này” mở với object đã gắn sẵn vào câu hỏi |
| **Empty state hoặc công cụ đang thiếu dữ liệu** | Người dùng thật sự chưa có gì để thao tác | Một câu mời gọn theo việc, ví dụ “Mô tả khối cần dựng”; biến mất khi đã bắt đầu làm |

Không giữ đồng thời mascot, pill đáy, nút nổi “Dựng cùng Vitals” và popup header. Trong 3D, nút nổi hiện tại được thay bằng một mục trong menu chuột phải hoặc empty state; sau khi có object, mọi hỗ trợ nằm ở **Inspector ngữ cảnh** và status bar. Vitals không che canvas bằng cửa sổ lớn.

## 4. Trạng thái và hình ảnh

Glyph Vitals là **ba vệt sáng electron chạy quỹ đạo oval, cuốn vào tâm**. Đây là nhận diện của một tác vụ đang diễn ra, không phải wallpaper hay hiệu ứng dùng khắp app.

| Trạng thái | Hình ảnh | Nội dung kèm theo |
|---|---|---|
| Nghỉ | 2 quỹ đạo rất chậm, tĩnh khi giảm chuyển động | Không cần chữ ngoài tooltip |
| Nhận ý định | 3 vệt hít vào tâm | “Đang hiểu yêu cầu” chỉ khi chờ đáng kể |
| Đang lập đề xuất | 3 quỹ đạo rõ hơn, một nhịp xoáy duy nhất | “Đang tạo bản xem trước” |
| Có đề xuất | Vệt sáng tắt dần từ tâm ra | Panel kết quả, không lặp animation |
| Cần chú ý | Accent cảnh báo sẵn có, không thêm màu mới | Lý do cụ thể và một lối xử lý |

`prefers-reduced-motion` đổi toàn bộ thành glyph tĩnh. Không có animation vô hạn trong canvas khi người dùng đang kéo/vẽ. Hình lớn 56–96px chỉ dùng trong panel xử lý hoặc màn chờ thật, không dùng làm robot trang trí trên chrome.

## 5. Cách nói và cách hỏi

Vitals nói như một đồng nghiệp thiết kế bình tĩnh: câu đầu đi thẳng vào việc, có nhận định khi đủ dữ liệu, và chỉ hỏi điều thật sự còn thiếu. Popover tối đa ba câu; việc dài chuyển sang panel/Notebook.

| Không nên | Nên nói |
|---|---|
| “Tôi đã phân tích yêu cầu của bạn. Vui lòng cung cấp…” | “Mình hiểu đây là đảo bếp. Bạn muốn nó độc lập hay áp tường?” |
| “Tôi có thể tạo mô hình 3D.” | “Mình đã đặt bản xem trước 2400 × 900 × 900 mm ở giữa phòng.” |
| “Đang dùng AI để tối ưu.” | “Lối đi phía tủ còn 780 mm. Bạn muốn giữ kích thước hay nới lối đi?” |

Quy tắc:

- Không dùng “AI”, “prompt”, “token”, “agent” trong UI tác vụ bình thường.
- Không hỏi lại dữ liệu đã có trên selection, Doc, Brand Kit hoặc thư viện.
- Mỗi lượt hỏi tối đa hai câu; nếu chưa đủ, tạo một giả định có nhãn **“đang suy đoán”** để người dùng sửa.
- Mọi số về tiêu chuẩn/quy chuẩn phải có nguồn. Không có nguồn: nói là chưa có nguồn dự án/chưa kiểm chứng.
- VI/EN dùng cùng ý và cùng mức ngắn gọn; không hardcode giọng hoặc gu của bất kỳ studio nào.

## 6. Ngữ cảnh Vitals nhận được

Payload không chỉ là lịch sử chat. Nó phải là một snapshot nhỏ, đúng quyền truy cập, không chứa dữ liệu thừa:

```ts
type VitalsContext = {
  projectId: string;
  stage: 'idea' | '2d' | '3d' | 'present' | 'library';
  selection?: {
    kind: 'room' | 'wall' | 'object' | 'image' | 'slide' | 'asset' | 'tool';
    id: string;
    properties: Record<string, string | number | boolean>;
  };
  docSummary?: { rooms: unknown[]; levels: unknown[]; warnings: unknown[] };
  brand?: 'absent' | { palette: string[]; fonts: string[]; watermark: boolean };
  permissions: string[];
};
```

Chỉ gửi property cần cho công việc hiện tại. Vitals đọc Brand Kit của **dự án đang mở**, rỗng thì nói rỗng; không lấy Gu/ảnh/tài liệu của dự án khác làm mặc định. Nguồn trong Master Library phải mang provenance, quyền dùng và phạm vi trước khi Vitals đề xuất nhập vào dự án.

## 7. Hành vi theo chặng

| Nơi đang làm việc | Vitals giúp gì | Ví dụ gợi ý có nút bấm |
|---|---|---|
| **Ý tưởng / moodboard** | Gom reference, đọc chất liệu–ánh sáng–bố cục, chỉ ra khoảng trống brief | “Rút palette từ ảnh chọn”, “Tạo 3 hướng mood”, “Thiếu gì trong brief?” |
| **2D Kỹ thuật** | Đọc phòng/tường/kích thước, kiểm dữ liệu, dẫn tới lệnh vẽ có sẵn | “Kiểm phòng này”, “Đặt kích thước”, “Tạo lớp hoàn thiện” |
| **3D Thiết kế** | Từ mô tả thành khối có tham số; sửa cấu kiện, vật liệu, ánh sáng, camera | “Dựng từ mô tả”, “Căn vào tường này”, “Kiểm lối đi” |
| **Trình bày** | Đề xuất dàn trang, đối chiếu số liệu với Doc, chuẩn bị output có thật | “So số liệu BOQ”, “Căn lại bố cục”, “Chuẩn bị xuất PDF” |
| **Master Library** | Tìm, lọc, so sánh, import đúng scope và giấy phép | “Tìm vật liệu tương tự”, “Đưa vào dự án”, “Xem nguồn và quyền dùng” |

Gợi ý là các action chip có ý nghĩa, không phải danh sách lời mời dài. Chỉ hiện 2–3 gợi ý phù hợp với selection hiện thời.

### 7.1. Thiết kế 2D — trợ lý bản vẽ, không tự vẽ mơ hồ

Vitals ở 2D không được biến CAD thành một ô chat. Người dùng vẫn vẽ bằng công cụ chuẩn, snap, layer và phím tắt; Vitals chỉ làm ba việc mà CAD truyền thống làm chậm: **đọc bản vẽ, chuẩn bị lệnh chính xác và kiểm dữ liệu sau khi vẽ**.

| Tình huống | Vitals nhìn thấy | Kết quả hợp lệ |
|---|---|---|
| Chưa chọn gì | Doc, tầng active, template và cảnh báo hiện có | “Bản vẽ chưa có thang tỷ lệ” / “Bắt đầu bằng phòng, tường hay import?” |
| Chọn phòng | Chu vi, diện tích, nhãn, cửa, lớp hoàn thiện và lỗi liên quan | Checklist phòng, đặt room tag/dimension hoặc mở lệnh phù hợp |
| Chọn tường/cửa/kích thước | Type, chuỗi hình học, độ dày, level và quan hệ liền kề | Một `CadProposal`: đổi type, đặt kích thước, thêm opening hoặc sửa label |
| Chọn nhiều đối tượng | Bộ selection và layer | Nhóm, phân layer, đổi style/hatch, kiểm naming — luôn preview phạm vi bị đổi |
| Không có bản vẽ | Không suy ra được mặt bằng | Empty state cho “Mô tả không gian”, “Nhập DXF/DWG”, “Chọn mẫu phòng”; mỗi đường mở công cụ thật |

`CadProposal` phải cùng tinh thần với GeometryProposal: có `targetIds`, giá trị trước/sau, giả định, warning và preview highlight trên bản vẽ. Ví dụ, “tạo phòng ngủ 3,6 × 4,2 m” không tự bắn ra một bản vẽ hoàn chỉnh; Vitals đưa ra đường bao, lưới/snap đang dùng và layer đích để người dùng duyệt trước.

Các tác vụ ưu tiên:

1. **Kiểm dữ liệu:** phòng không kín, thiếu nhãn/tầng, kích thước mâu thuẫn, vùng hoàn thiện chưa có `matId`.
2. **Chuẩn bị lệnh:** đặt dimension, room tag, hatch, layer, opening và cấu kiện đã có engine thật.
3. **Đối chiếu:** trả lời “phòng này bao nhiêu m²?”, “những phòng nào dùng cùng sàn?” từ Doc hiện hành; số tiêu chuẩn chỉ trả khi có nguồn.
4. **Chuyển sang 3D không xuất file:** nói rõ entity nào sẽ được dùng, nhưng không dựng một model thứ hai. Luật một Doc luôn giữ nguyên.

Vitals không được tự “sửa cả bản vẽ cho đẹp”, tự chọn thickness theo cảm tính, tự đổi layer hàng loạt khi không có preview, hoặc gọi một tường/vùng không được selection xác định. Những thao tác lớn phải có bảng thay đổi dạng: `12 tường sẽ đổi từ 100 → 120 mm · Xem trên bản vẽ · Áp dụng`.

### 7.2. Trình bày — người kiểm nhịp và tính nhất quán, không phải người làm hộ một bộ hồ sơ

Ở Trình bày, Vitals đứng giữa **nội dung dự án, editor đúng loại và output thật**. Nó không vẽ mơ hồ lên slide canvas rồi gọi đó là “sinh hồ sơ”; mỗi đề xuất phải đi vào editor có thật: Deck, Material A3, BOQ, Văn bản hoặc Video.

| Loại hồ sơ | Vitals được giúp | Preview/điểm dừng bắt buộc |
|---|---|---|
| **Deck** | Kiểm mạch câu chuyện, trùng ý, hierarchy, Brand Kit, số liệu giữa slide và Doc | Outline/slide diff; apply từng slide hoặc cả nhóm; luôn undo |
| **Material board** | Gom asset đã có quyền dùng, kiểm mã vật liệu/ghi chú, gợi bố cục theo khổ | Board preview; item thiếu nguồn/`matId` bị gắn cờ, không tự thay asset |
| **BOQ** | Đối chiếu bảng với diện tích/cấu kiện trong Doc, chỉ ô thiếu/không khớp | Chỉ hiện cell diff và công thức/nguồn; không tự bịa đơn giá/NCC |
| **Văn bản** | Điền dữ liệu dự án vào template, kiểm placeholder, viết lại đoạn ngắn theo giọng đã chọn | Track changes / preview đoạn; chỉ mở khi document editor có thật |
| **Video dựng** | Lập beat sheet, gợi nhịp dựng/titles từ footage có sẵn | Shot list/timeline preview; không giả render 3D hay video editor chưa có |

Luồng deck điển hình: chọn slide → `Hỏi Vitals về slide này` → Vitals trả về một nhận định có căn cứ, ví dụ “Slide này đang có 4 ý ngang cấp; đề xuất giữ 1 tiêu đề + 3 số liệu” → preview diff → áp dụng hoặc bỏ qua. Nó không thay người dùng quyết câu chuyện thiết kế.

Luồng kiểm nhất quán: user bấm `Kiểm hồ sơ` → Vitals chạy các rule xác định được (Brand Kit rỗng, placeholder, ảnh thiếu alt/credit, page missing, BOQ/Doc chênh số, asset thiếu provenance) → trả một danh sách theo mức độ. Mỗi lỗi có **một nút dẫn đúng editor**, không có popup “đã tối ưu”.

Video ở chặng này chỉ là dựng footage, nhạc, title, chuyển cảnh và màu. Vitals không được mở scene 3D riêng hay ngụ ý nó sinh được footage nếu năng lực đó chưa có ở chặng 3D.

### 7.3. Phạm vi ở cấp toàn app

Vitals có mặt xuyên app nhưng **không sở hữu app**. Nó là lớp điều phối nhẹ nằm trên các công cụ và hạ tầng dưới đây:

| Phạm vi | Vitals có thể | Vitals không thể |
|---|---|---|
| **Project / một Doc** | Đọc ngữ cảnh, kiểm nhất quán 2D↔3D↔Present, đề xuất mutation có preview | Chuyển dữ liệu giữa project hoặc tạo nguồn sự thật khác |
| **Master Library** | Tìm, so sánh, lọc, nạp asset có provenance | Lấy ảnh web/asset thương mại vô điều kiện hoặc bỏ qua license |
| **File Manager** | Đề xuất import/export phù hợp, kiểm định dạng/support | Tự đổi/ghi đè file, tạo output định dạng app chưa hỗ trợ |
| **Knowledge / Notebook** | Tra cứu theo quyền, trích dẫn, chỉ phần thiếu nguồn | Nói như đã đọc tài liệu không nằm trong scope/quyền xem |
| **Team chat** | Chỉ trả lời khi `@Vitals`, theo quyền của người gọi | Xen vào hội thoại, giả làm thành viên, công khai dữ liệu riêng |
| **System / desktop** | Báo build/output lỗi có lý do và hướng xử lý | Đọc file máy người dùng, gọi mạng/connector, hay gửi dữ liệu ra ngoài mà chưa có consent |

Ba lớp phạm vi phải được nhìn thấy trong giao diện khi cần: **Dự án này · Studio/Shared · Nguồn ngoài**. Mặc định là *Dự án này*. Khi một action dùng asset dùng chung hoặc connector ngoài, result panel phải nói rõ nguồn trước khi áp dụng.

### 7.4. Ranh giới quyền và an toàn

| Cấp hành động | Ví dụ | Cơ chế |
|---|---|---|
| **Chỉ đọc** | Tóm tắt brief, tìm vật liệu, kiểm bản vẽ | Làm ngay, hiển thị nguồn khi có |
| **Preview** | Ghost 3D, highlight CAD, deck/BOQ diff | Làm ngay nhưng không ghi Doc |
| **Ghi có thể hoàn tác** | Tạo tường, đổi property, áp bố cục, thêm asset | Nút Áp dụng rõ ràng + undo chung |
| **Có rủi ro / phạm vi rộng** | Đổi hàng loạt, export, mời người, import ngoài | Tóm tắt phạm vi + xác nhận riêng |
| **Cấm tự động** | Xoá dữ liệu, publish/mua, gửi ra ngoài, cài connector | User thực hiện theo UI chuyên dụng, không qua một câu chat |

Vitals chỉ gọi capability đã có registry, schema input/output và test. Một lời nói tự nhiên không bao giờ là quyền thực thi. Nếu không có capability, trả lời tốt nhất là dẫn đúng công cụ hoặc ghi rõ “phần này chưa có trong bản hiện tại”.

## 8. Luồng chuẩn cho dựng khối 3D

Đây là nơi Vitals có giá trị rõ nhất trong MVP. Dựng trực tiếp và dựng qua Vitals dùng **cùng một engine tham số**; khác nhau chỉ ở cách tạo recipe.

1. **Bắt đầu.** User chọn `Dựng từ mô tả` trong empty state, status bar, hoặc chuột phải canvas/đối tượng.
2. **Hiểu.** Vitals nhận selection, level, mặt phẳng đang làm việc, đơn vị và Doc. Nó suy ra loại cấu kiện nếu hợp lý, ví dụ “tủ thấp”, “vách”, “bục”, “đảo bếp”.
3. **Hỏi gọn.** Chỉ hỏi điểm không thể suy: kích thước chính, kiểu đặt/neo. Không biến chat thành form.
4. **Đề xuất recipe.** Hiện Inspector nhỏ cạnh vùng làm việc, không che canvas:

```ts
type GeometryProposal = {
  kind: 'wall' | 'box' | 'cabinet' | 'opening' | 'ceiling' | 'floor';
  dimensionsMm: { width?: number; depth?: number; height?: number; thickness?: number };
  placement: { levelId: string; anchor: 'free' | 'wall' | 'room-center' | 'floor'; x: number; y: number; z: number };
  assumptions: string[];
  constraints: string[];
  materialId?: string;
  provenance: 'manual' | 'vitals-proposal';
};
```

5. **Preview.** Khối ghost trên canvas, anchor/đường kích thước/lối đi liên quan. Inspector có ba hành động duy nhất: **Sửa thông số · Áp dụng · Bỏ qua**.
6. **Áp dụng.** Mutation đi vào một Doc, có semantic identity/provenance và cùng undo stack với thao tác tay. Một lần `⌘Z` phải hoàn tác một lần áp dụng của Vitals.
7. **Sau khi áp.** Không chúc mừng dài. Hiện toast ngắn: “Đã tạo tủ thấp 2400 mm · Hoàn tác”. Thao tác tiếp theo chỉ gợi khi có giá trị, ví dụ “Căn vật liệu”, “Nhân bản”, “Đặt đèn”.

### Dựng trực tiếp và Inspector

Thanh công cụ 3D dành cho lệnh tay, được nhóm theo nghiệp vụ: **Chọn · Tạo · Sửa · Cấu kiện · Vật liệu & ánh sáng · Camera · Đo & kiểm**. Không nhét tham số cố định vào đáy canvas.

- Không chọn gì: thanh dock gọn và Inspector ẩn.
- Đang dùng một lệnh: Inspector mảnh mở gần cạnh phải, chỉ gồm thông số của lệnh đó.
- Chọn object: Inspector hiển thị `Kích thước · Vị trí · Neo · Vật liệu · Cấu kiện`; menu chuột phải mở các thao tác gần nhất, trong đó có “Hỏi Vitals về mục này”.
- Phần nâng cao (boolean, modifier, mesh) ở rollout **Chi tiết**, không mặc định chiếm chỗ.

Vitals không thay thanh công cụ. Nó điền recipe vào Inspector; người dùng vẫn có thể dựng/sửa hoàn toàn bằng thao tác trực tiếp và phím tắt.

## 9. Vitals và MCP

**MCP không phải nút người dùng thấy, không phải điều kiện để Vitals làm việc trong app.** MVP dùng một internal command gateway có kiểu dữ liệu; nó an toàn hơn, nhanh hơn và kiểm soát undo/preview tốt hơn.

Các tool nội bộ tối thiểu:

| Tool | Quyền mặc định | Kết quả |
|---|---|---|
| `readContext` | đọc | Snapshot selection/Doc đã lọc |
| `searchLibrary` | đọc | Asset kèm provenance/quyền dùng |
| `validateProposal` | đọc | Va chạm, thiếu tham số, cảnh báo |
| `previewProposal` | không ghi | Ghost/recipe trên canvas |
| `applyProposal` | xác nhận rõ ràng | Mutation + undo checkpoint |
| `undoLastAction` | xác nhận khi cần | Hoàn tác stack chung |

MCP chỉ được thêm như adapter ở giai đoạn sau, cho nguồn bên ngoài có giá trị thật: catalogue nhà sản xuất, kho tri thức được cấp quyền, hoặc hệ quản trị nội bộ. Mọi connector phải:

- xin quyền rõ ràng theo từng nguồn; mặc định chỉ đọc;
- trả provenance, license và thời điểm lấy dữ liệu;
- không cho nguồn ngoài gọi mutation trực tiếp vào Doc;
- đi qua cùng schema preview/validation/apply ở trên;
- có log hành động để truy vết.

Không dùng MCP để “đẩy prompt đi đâu đó”, không nối tự do với Pinterest/Unsplash hay Figma rồi coi kết quả là asset hợp pháp. Kết nối ngoài chỉ là **nguồn tham khảo/import có kiểm soát**, không phải bộ não của Vitals.

## 10. Phạm vi triển khai

### V1 — làm Vitals hữu ích, không phô trương

1. Một entry chuẩn ở status bar; bỏ các entrance trùng lặp và mascot khỏi product chrome.
2. Context chọn đối tượng cho 3D/Present/Library, không chỉ stage + Doc summary.
3. Recipe + preview + apply + undo cho `wall`, `box`, `cabinet`, `floor/ceiling` dựa trên engine có thật.
4. Menu chuột phải “Hỏi Vitals về mục này” và Inspector thông số theo selection.
5. Bốn trạng thái visual thật, reduced motion và không animation nặng trong canvas.
6. Câu trả lời grounded hiển thị nguồn thống nhất giữa popover và Notebook.

### V1.1 — làm nó đáng tin khi làm lâu

- Lưu lịch sử theo project/phiên thay vì module memory.
- Constraints: khoảng hở, bám tường, cấp tầng/layer, kích thước tối thiểu do dự án định nghĩa.
- Thay đổi vật liệu/ánh sáng/camera có preview và áp vào Doc thật.
- Master Library search/import có provenance và scope dự án.

### Sau đó

- Voice và ảnh nhập nếu có quyền mic, chi phí và luồng nguồn rõ ràng.
- MCP adapter cho nguồn ngoài đã được duyệt.
- Dựng mesh/boolean/modifier nâng cao qua editor 3D; Vitals chỉ tạo recipe hợp lệ, không thay Blender/3ds Max bằng một câu chat.

## 11. Tiêu chí nghiệm thu

Vitals đạt V1 khi toàn bộ tình huống dưới đây đúng:

1. Chọn một tường rồi gọi Vitals: nó biết tường nào, không hỏi lại dữ liệu có sẵn.
2. “Đặt một đảo bếp 2400 × 900 ở giữa phòng”: tối đa hai câu làm rõ, sau đó có ghost + kích thước + nút Sửa/Áp dụng/Bỏ qua.
3. Áp dụng xong, `⌘Z`/Undo hoàn tác đúng thay đổi đó; không ảnh hưởng thao tác tay trước đó.
4. Tắt reduced motion: glyph không chuyển động nhưng trạng thái vẫn đọc được.
5. Không có Brand Kit/nguồn quy chuẩn: Vitals nói rõ điều thiếu, không tự bịa style hoặc con số.
6. Một asset từ Library luôn cho biết nguồn và phạm vi trước khi import.
7. Không còn hai panel/nút Vitals mở song song, không CTA nào chỉ mở chat nhưng tự nhận là “dựng”.

## 12. Thứ tự nối vào giao diện hiện tại

1. Dọn 3D shell: bỏ nút nổi `Dựng cùng Vitals`, mascot và các pill trùng; giữ canvas, ViewCube, ToolDock, status bar.
2. Nối `GeometryProposal` vào engine lệnh dựng hiện có; đầu tiên chỉ bật loại hình có implement thật.
3. Đưa proposal vào Inspector/ghost preview; sau đó mới mở lời mô tả tự nhiên.
4. Nối right-click + selection payload xuyên 2D/3D/Present/Library.
5. Hợp nhất trả lời có nguồn giữa popover và Notebook; tiếp đó mới cân nhắc voice, ảnh và MCP ngoài.

> Một câu để kiểm mỗi UI quyết định: **“Nếu bỏ chữ Vitals đi, người dùng có còn thấy rõ việc nào đang được đề xuất, thay đổi ở đâu, và hoàn tác thế nào không?”** Nếu không, giao diện đang làm màu thay vì làm công cụ.

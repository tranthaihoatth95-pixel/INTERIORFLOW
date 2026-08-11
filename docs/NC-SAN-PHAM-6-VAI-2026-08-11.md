# NC · Danh mục sản phẩm đầu ra của 6 vai nghề — nền cho docType InteriorFlow
*Lập 11/08/2026 · tài liệu tra cứu, không phải spec. Nguồn: thông lệ hành nghề VN (Nghị định 175/2024, QCVN, TCVN, hồ sơ thiết kế 3 bước CS–TKKT–BVTC) + quốc tế (AIA phases SD/DD/CD/CA, RIBA Plan of Work, CSI MasterFormat). Trạng thái IF ở §3 đối chiếu `STATUS.md` 11/08 — chỗ không chắc ghi rõ "cần đối chiếu".*

**Quy ước giai đoạn** (dùng chung cả file):
| Viết tắt | VN | Quốc tế |
|---|---|---|
| CS | Concept / Thiết kế cơ sở / ý tưởng | SD (Schematic Design) |
| DD | Thiết kế kỹ thuật / phát triển | DD (Design Development) |
| CD | Bản vẽ thi công (hồ sơ TKBVTC) | CD (Construction Documents) |
| TC | Giai đoạn thi công | CA (Construction Administration) |
| NT | Nghiệm thu · bàn giao · hoàn công 生 | Closeout / Handover |

---

## §1 · SÁU VAI — deliverable từng vai

### 1.1 Kiến trúc sư (Architect)

| Deliverable | Định dạng thông dụng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Nhiệm vụ thiết kế / Design brief (đề bài, chương trình công năng) | DOCX · PDF · XLSX (space program) | chủ đầu tư (CĐT), team thiết kế | CS |
| Báo cáo hiện trạng + bản vẽ đo đạc hiện trạng (as-existing survey) | DWG · PDF · point cloud (E57/RCP) | team thiết kế, CĐT | CS |
| Phân tích khu đất (site analysis: nắng gió, giao thông, quy hoạch) | PDF · PPTX | CĐT | CS |
| Concept diagram / massing study (sơ đồ ý tưởng, khối dáng) | PDF · PPTX · SKP | CĐT | CS |
| Mặt bằng tổng thể (site plan / master plan) | DWG · PDF | CĐT, cơ quan quy hoạch | CS→CD |
| Mặt bằng các tầng (floor plans) | DWG · RVT · PDF | CĐT, thẩm định, thầu | CS→CD |
| Mặt đứng (elevations) · mặt cắt (sections) | DWG · RVT · PDF | CĐT, thẩm định, thầu | CS→CD |
| Bản vẽ chi tiết cấu tạo (construction details: mái, tường, cầu thang, WC…) | DWG · PDF | thầu chính | CD |
| Door/Window schedule (bảng thống kê cửa) + chi tiết cửa | DWG · XLSX · PDF | thầu, xưởng nhôm kính | DD→CD |
| Finish schedule (bảng vật liệu hoàn thiện theo phòng) | XLSX · PDF · DWG | CĐT, thầu hoàn thiện | DD→CD |
| Area schedule / bảng cân bằng diện tích (GFA, NFA, hệ số sử dụng đất) | XLSX · PDF | CĐT, cơ quan quy hoạch | CS→DD |
| Thuyết minh thiết kế (design report — cơ sở/kỹ thuật) | DOCX · PDF | cơ quan thẩm định, CĐT | CS→CD |
| Hồ sơ xin phép xây dựng (permit set) | PDF (đóng dấu) · DWG | cơ quan cấp phép | DD |
| Hồ sơ thẩm duyệt PCCC (fire safety drawings: thoát nạn, khoang cháy) | DWG · PDF | Cảnh sát PCCC | DD |
| Spec kiến trúc (specifications — VN: chỉ dẫn kỹ thuật) | DOCX · PDF (CSI 3-part quốc tế) | thầu, tư vấn giám sát (TVGS) | CD |
| Mô hình BIM kiến trúc + xuất trao đổi | RVT · IFC · NWD (Navisworks) | các bộ môn, CĐT BIM | DD→TC |
| BEP (BIM Execution Plan) + LOD matrix | DOCX · XLSX | các bộ môn | DD |
| Clash report (báo cáo va chạm liên bộ môn) | PDF · BCF · NWD | các bộ môn | DD→TC |
| Phối cảnh ngoại thất (renderings) — thường giao 3D artist, KTS duyệt | JPG/PNG · PDF | CĐT, marketing | CS→DD |
| Trả lời RFI (Request for Information) | PDF · DOCX | thầu, TVGS | TC |
| Duyệt shop drawing / submittal review (đóng dấu Approved/Revise) | PDF (markup) | thầu | TC |
| Site instruction / chỉ thị công trường · biên bản hiện trường | PDF · DOCX | thầu, TVGS | TC |
| Punch list / danh mục lỗi trước nghiệm thu (snag list) | XLSX · PDF (kèm ảnh) | thầu, CĐT | NT |
| Bản vẽ hoàn công (as-built drawings) — thầu lập, KTS xác nhận | DWG · PDF · IFC | CĐT, vận hành | NT |
| Biên bản nghiệm thu giai đoạn / hoàn thành | PDF (mẫu NĐ 06/2021) | CĐT, TVGS, thầu | TC→NT |

### 1.2 Interior designer (thiết kế – thi công nội thất)

| Deliverable | Định dạng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Moodboard / concept board (định hướng phong cách, chất liệu, màu) | PDF · PPTX · PNG · (Milanote/Figma link) | CĐT | CS |
| Space planning / layout mặt bằng bố trí nội thất (nhiều phương án) | DWG · PDF · SKP | CĐT | CS |
| Concept presentation deck (thuyết trình ý tưởng) | PPTX · PDF · Keynote | CĐT | CS |
| Phối cảnh 3D nội thất từng phòng | JPG/PNG · PDF | CĐT | CS→DD |
| FF&E schedule (Furniture, Fixtures & Equipment — bảng đồ rời, thiết bị) | XLSX · PDF | CĐT, procurement, thầu | DD→CD |
| Material board / bảng vật liệu A3 (sample board vật lý + bản số) | PDF A3 · PPTX · board thật | CĐT | DD |
| Finish plan (mặt bằng hoàn thiện sàn/tường/trần theo mã) | DWG · PDF | thầu hoàn thiện | CD |
| Reflected ceiling plan — RCP (mặt bằng trần lật, kết hợp đèn) | DWG · PDF | thầu trần, thầu điện | CD |
| Mặt bằng bố trí đèn + switching (lighting layout, phối hợp MEP) | DWG · PDF | thầu điện | CD |
| Mặt bằng định vị ổ cắm, công tắc theo nội thất (power/data by furniture) | DWG · PDF | thầu điện | CD |
| Khai triển mặt đứng nội thất (interior elevations — từng vách) | DWG · PDF | thầu, xưởng | CD |
| Chi tiết đồ mộc đóng (millwork/joinery drawings: tủ bếp, tủ áo, quầy) | DWG · PDF | xưởng mộc | CD |
| Chi tiết ốp lát, len tường, phào chỉ, vách trang trí (fit-out details) | DWG · PDF | thầu hoàn thiện | CD |
| Setting-out plan / mặt bằng định vị (kích thước gạch, tim vách, tim đèn) | DWG · PDF | thầu | CD |
| BOQ nội thất / dự toán (bill of quantities, bóc khối lượng + đơn giá) | XLSX · PDF | CĐT, thầu, QS | DD→CD |
| Spec nội thất / chỉ dẫn kỹ thuật hoàn thiện | DOCX · PDF | thầu, TVGS | CD |
| Phiếu duyệt mẫu vật liệu (material sample approval / submittal log) | PDF · XLSX (log) | CĐT ký, thầu nộp | TC |
| Curtain/blind schedule, soft furnishing spec (rèm, thảm, gối) | XLSX · PDF | nhà cung cấp | DD→CD |
| Artwork & accessories plan (tranh, decor, styling list) | PDF · XLSX | CĐT, stylist | CD→NT |
| Procurement tracker (theo dõi đặt hàng FF&E: PO, lead time, giao nhận) | XLSX | CĐT, procurement | TC |
| Duyệt shop drawing xưởng mộc + mockup review (duyệt mẫu 1:1) | PDF markup · biên bản | xưởng | TC |
| Biên bản chốt phương án / phiếu duyệt thiết kế từng giai đoạn | PDF · DOCX | CĐT ký | CS→CD |
| Punch list nội thất + hồ sơ bàn giao (hướng dẫn bảo quản vật liệu) | XLSX · PDF | CĐT, vận hành | NT |
| Bộ ảnh chụp hoàn thiện (professional photography) — phối hợp | JPG · thư mục ảnh | CĐT, marketing studio | NT |

### 1.3 Kỹ sư cơ điện MEP (Mechanical · Electrical · Plumbing / HVAC · Fire)

| Deliverable | Định dạng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Báo cáo tính toán tải (cooling/heating load — HAP/TRACE; tải điện; nước) | PDF · XLSX | thẩm tra, CĐT | DD |
| Sơ đồ nguyên lý điện (single-line diagram / SLD) | DWG · PDF | thẩm định, thầu điện | DD→CD |
| Sơ đồ nguyên lý nước, nguyên lý HVAC (schematic/riser diagrams) | DWG · PDF | thầu | DD→CD |
| Mặt bằng chiếu sáng + kết quả tính photometric (DIALux/Relux) | DWG · PDF · **IES/LDT** (file trắc quang) · EVO | thầu điện, interior designer | DD→CD |
| Mặt bằng ổ cắm – công tắc – tủ điện (power layout) | DWG · PDF | thầu điện | CD |
| Bảng tủ điện / panel schedule (phân pha, aptomat, tải) | XLSX · DWG · PDF | thầu điện | CD |
| Cable schedule + tính sụt áp | XLSX · PDF | thầu điện | CD |
| Mặt bằng ống gió, ống nước lạnh HVAC + chi tiết treo đỡ | DWG · RVT · PDF | thầu cơ | CD |
| Equipment schedule (bảng thiết bị: FCU, AHU, bơm, quạt — model, công suất) | XLSX · PDF | thầu, procurement | DD→CD |
| Mặt bằng cấp thoát nước + isometric (sơ đồ không gian đường ống) | DWG · PDF | thầu nước | CD |
| Hồ sơ PCCC M&E (sprinkler, báo cháy, tăng áp, hút khói) | DWG · PDF | Cảnh sát PCCC, thầu PCCC | DD→CD |
| Hệ ELV (điện nhẹ): LAN/CCTV/access control/PA — layout + nguyên lý | DWG · PDF | thầu ELV | CD |
| Thuyết minh + spec M&E (chỉ dẫn kỹ thuật) | DOCX · PDF | thẩm định, thầu | DD→CD |
| Mô hình BIM MEP + phối hợp (coordination model) | RVT · IFC · NWD | các bộ môn | DD→TC |
| Combined services drawing / CSD (bản vẽ tổ hợp trần — MEP chồng lớp) | DWG · PDF | thầu, KTS, interior | TC |
| Builder's work drawing (lỗ chờ, sleeve xuyên sàn/dầm) | DWG · PDF | thầu xây | CD→TC |
| Shop drawing M&E (thầu lập, kỹ sư duyệt) | DWG · PDF | TVGS, kỹ sư duyệt | TC |
| Material submittal / phiếu trình duyệt vật tư thiết bị (catalogue + CO/CQ) | PDF | kỹ sư duyệt, TVGS | TC |
| Method statement (biện pháp thi công – lắp đặt) | DOCX · PDF | TVGS | TC |
| Biên bản thử nghiệm: test & commissioning (T&C), đo điện trở đất, thử áp, đo gió, đo lux thực tế | PDF · XLSX | TVGS, CĐT, nghiệm thu | TC→NT |
| O&M manual (hồ sơ vận hành bảo trì) + danh mục thiết bị bàn giao | PDF · thư mục | ban quản lý vận hành | NT |
| As-built M&E | DWG · PDF · IFC | vận hành | NT |
| Báo cáo năng lượng (nếu công trình yêu cầu: QCVN 09, LEED/LOTUS input) | PDF · XLSX | CĐT, tư vấn xanh | DD |

### 1.4 Graphic designer trong studio thiết kế

| Deliverable | Định dạng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Template deck thuyết trình của studio (master slide, lưới, kiểu chữ) | PPTX · INDD · Figma/Keynote | designer nội bộ | mọi giai đoạn |
| Dàn trang deck concept/present cho từng dự án (layout ảnh render + chữ) | PPTX · PDF · INDD | CĐT (qua designer chủ trì) | CS→DD |
| Brand kit dự án (logo dự án, palette, font, watermark) — cho dự án BĐS/F&B | AI · SVG · PDF brand sheet | team, CĐT, marketing | CS |
| Khung tên bản vẽ + title block template (đồng bộ nhận diện hồ sơ) | DWG template · PDF | drafter, KTS | CD |
| Diagram/infographic minh hoạ ý tưởng (sơ đồ phân khu, flow, biểu đồ) | AI · SVG · PNG · PDF | deck, CĐT | CS→DD |
| Pattern/motif trang trí (hoa văn CNC, film kính, wallpaper đặt in) | AI · **DXF (cắt CNC)** · PDF · tile PNG/TIFF | xưởng CNC, nhà in | DD→CD |
| Signage & wayfinding (biển hiệu, chỉ hướng, số phòng) — artwork + spec | AI · PDF (print-ready, có bleed) · DWG định vị | nhà làm biển, thầu | CD→TC |
| Environmental graphics (tranh tường, decal, graphic ốp vách) file in khổ lớn | TIFF/PDF ≥150dpi thực tế in · AI | nhà in khổ lớn | CD→TC |
| Bộ hồ sơ năng lực / portfolio studio (company profile) | PDF · INDD · web | khách hàng tương lai | — |
| Ảnh/album marketing dự án hoàn thành (retouch, dàn trang case study) | JPG · PDF · post social | marketing | NT |
| Mockup vật phẩm (menu, bao bì, đồng phục — dự án F&B/khách sạn) | PSD · PDF | CĐT | DD |
| Video/motion trình chiếu (intro deck, animation logo, slideshow) | MP4 · MOV · AE project | CĐT, sự kiện | CS→NT |
| Bìa hồ sơ, trang chia mục, template thuyết minh (document design) | INDD · DOCX template · PDF | team hồ sơ | CD |

### 1.5 3D artist (dựng hình + render)

| Deliverable | Định dạng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Mô hình 3D không gian (scene) từ bản vẽ 2D | SKP · MAX · BLEND · FBX/OBJ · GLB | nội bộ, VR viewer | CS→DD |
| White model / clay render (khối trắng duyệt bố cục, góc máy) | JPG/PNG | designer chủ trì, CĐT | CS |
| Ảnh render tĩnh photoreal (interior/exterior stills) | JPG · PNG · **EXR/TIFF 16-bit (hậu kỳ)** | CĐT, deck, marketing | CS→DD |
| Render pass/AOV (Z-depth, cryptomatte, lightmix, reflection…) cho hậu kỳ | EXR multi-layer | chính 3D artist / retoucher | DD |
| Panorama 360° + virtual tour | JPG equirect · link tour (Kuula/theasys) | CĐT, sales BĐS | DD |
| Animation / walkthrough video | MP4 (H.264/H.265) · ProRes | CĐT, marketing, sự kiện | DD |
| Storyboard + camera path duyệt trước khi render animation | PDF · PNG frames | designer chủ trì | DD |
| Asset 3D tự dựng (furniture model, cây, đèn) đưa vào library | MAX/SKP/BLEND + texture · GLB | team 3D, library studio | — |
| Material/shader library (vật liệu V-Ray/Corona/D5 đã calibrate) | MAT/VRMAT · thư mục texture PBR | team 3D | — |
| Bảng đối chiếu material render ↔ mã vật liệu thật (mapping matID→SKU) | XLSX | interior designer, QS | DD |
| HDRI / lighting rig chuẩn của studio | HDR/EXR · scene template | team 3D | — |
| Revision log render (v01, v02… ghi chú thay đổi từng vòng duyệt) | XLSX · tên file quy ước | designer chủ trì, CĐT | CS→DD |
| Render tương tác realtime (D5/Twinmotion/Unreal executable, VR) | EXE · Pixel streaming link | CĐT, showroom | DD |
| Xuất mô hình cho hạ nguồn (đúng scale, gộp vật liệu) | FBX · GLB · USD/USDZ (AR) | web/AR, đối tác | DD |

### 1.6 2D technical artist / drafter (hoạ viên kỹ thuật)

| Deliverable | Định dạng | Ai tiêu thụ | Giai đoạn |
|---|---|---|---|
| Số hoá bản vẽ tay / hiện trạng đo đạc thành CAD | DWG | team thiết kế | CS |
| Bộ bản vẽ triển khai theo red-line của chủ trì (drafting from markups) | DWG · PDF | chủ trì duyệt | DD→CD |
| Sheet set hoàn chỉnh: khung tên, đánh số bản vẽ, cross-reference | DWG (layout/paperspace) · PDF đóng tập | thầu, CĐT | CD |
| Danh mục bản vẽ (drawing list / drawing register) | XLSX · PDF (tờ đầu tập) | quản lý hồ sơ, thầu | CD |
| CAD standard nội bộ: layer, linetype, dim style, block library | DWT template · DWG block · tài liệu | team drafter | — |
| Block/dynamic block thư viện (ký hiệu đồ, thiết bị, cây) | DWG | team | — |
| Hatch pattern + ký hiệu vật liệu chuẩn hoá | PAT · DWG legend | team, thầu | CD |
| Chi tiết điển hình (typical details library) | DWG | team, tái sử dụng | — |
| Bản vẽ xin phép trình bày đúng mẫu cơ quan (đóng khung, tỉ lệ chuẩn) | PDF in giấy · DWG | cơ quan thẩm định | DD |
| Chuyển đổi định dạng hồ sơ (DWG↔PDF, xref cleanup, bind, purge) | DWG · PDF | phát hành hồ sơ | CD |
| Cập nhật bản vẽ theo revision (revision cloud, tam giác rev, bảng rev) | DWG · PDF | thầu, TVGS | TC |
| Bóc khối lượng từ bản vẽ (quantity take-off — hỗ trợ QS) | XLSX | QS, dự toán | DD→CD |
| Vẽ lại as-built từ markup công trường | DWG · PDF | CĐT, vận hành | NT |
| Xuất bản in đúng nét/tỉ lệ (plot style CTB/STB, in A3/A1) | CTB/STB · PDF/bản in | phát hành | CD |

---

## §2 · BỐN MẢNG NGÀNH — deliverable ĐẶC THÙ (mảng khác không có)

### 2.1 Thiết kế – thi công nội thất (fit-out)

| Deliverable đặc thù | Định dạng | Ai tiêu thụ | Ghi chú |
|---|---|---|---|
| Cutting list / bảng cắt ván cho xưởng mộc (tấm, cạnh dán, khoan lỗ) | XLSX · file CNC (MPR/BPP · DXF) | xưởng mộc, máy CNC | từ chi tiết millwork bung ra |
| Hardware schedule (bảng phụ kiện: bản lề, ray, tay nắm — mã Blum/Hafele) | XLSX | xưởng, procurement | đi kèm cutting list |
| Bảng ghép vân đá/gỗ (stone/veneer layout — dry-lay, book-match) | PDF (ảnh đánh số tấm) · DWG | xưởng đá, CĐT duyệt | duyệt trước khi cắt |
| Mockup room / phòng mẫu + biên bản duyệt mockup | biên bản PDF + ảnh | CĐT, chuỗi khách sạn | bắt buộc ở dự án hospitality |
| Loose furniture tender package (gói thầu đồ rời riêng) | PDF + XLSX FF&E | nhà thầu đồ rời | tách khỏi gói fit-out |
| Bản vẽ điều kiện thuê (landlord submission / fit-out permit tại TTTM) | DWG · PDF | ban quản lý toà nhà | theo fit-out guideline của toà nhà |
| Reinstatement/demolition plan (mặt bằng tháo dỡ, hoàn trả mặt bằng thuê) | DWG · PDF | ban quản lý, thầu | đầu và cuối vòng đời thuê |

### 2.2 Kiến trúc (công trình)

| Deliverable đặc thù | Định dạng | Ai tiêu thụ | Ghi chú |
|---|---|---|---|
| Hồ sơ quy hoạch 1/500, chỉ giới đường đỏ, đấu nối hạ tầng | DWG · PDF | cơ quan quy hoạch | trước cấp phép |
| Báo cáo nghiên cứu khả thi / báo cáo kinh tế – kỹ thuật | DOCX · PDF | CĐT, cơ quan quyết định đầu tư | NĐ 175/2024 |
| Hồ sơ thẩm duyệt PCCC + đánh giá tác động môi trường (ĐTM) | PDF | PCCC, Sở TN&MT | pháp lý bắt buộc theo quy mô |
| Physical model / maquette + sa bàn | mô hình thật · ảnh | CĐT, triển lãm, thi tuyển | thi tuyển phương án |
| Hồ sơ thi tuyển kiến trúc (competition boards A0/A1) | PDF board · in bồi | hội đồng thi tuyển | trình bày chuẩn ban tổ chức |
| Facade detail + spec hệ mặt dựng (curtain wall performance spec) | DWG · PDF | nhà thầu facade | có tính toán nhiệt/gió riêng |
| Chứng nhận công trình xanh (LEED/LOTUS/EDGE submission) | form online + PDF evidence | tổ chức chứng nhận | nếu đăng ký |

### 2.3 Cảnh quan sân vườn (Landscape)

| Deliverable đặc thù | Định dạng | Ai tiêu thụ | Ghi chú |
|---|---|---|---|
| Landscape master plan (mặt bằng cảnh quan tổng thể) | DWG · PDF | CĐT, KTS chủ trì | CS |
| Hardscape plan (sân, lối đi, tường chắn, bậc — vật liệu cứng) + chi tiết lát | DWG · PDF | thầu cảnh quan | CD |
| Softscape/planting plan (mặt bằng cây trồng, ký hiệu từng loài) | DWG · PDF | thầu cây xanh | CD |
| Plant schedule / bảng cây (tên khoa học · tên VN · quy cách bầu/chiều cao · số lượng · khoảng cách trồng) | XLSX · PDF | thầu, vườn ươm | đi cặp planting plan |
| Grading & drainage plan (san nền, cao độ, thoát nước mặt) | DWG (spot levels, contours) · PDF | thầu hạ tầng | CD |
| Irrigation plan (hệ tưới: zone, đầu tưới, controller, nguồn nước) | DWG · PDF · bảng thiết bị XLSX | thầu tưới | CD |
| Landscape lighting plan (đèn sân vườn, âm đất, hắt cây) | DWG · PDF | thầu điện cảnh quan | phối hợp MEP |
| Water feature detail (hồ, thác, đài phun: chống thấm, bơm, lọc) | DWG · PDF | thầu chuyên | CD |
| Soil specification & preparation (cải tạo đất, lớp đất trồng, thoát nước bầu) | DOCX · PDF | thầu | CD |
| Tree survey & protection plan (khảo sát cây hiện hữu, cây giữ lại/di dời) | DWG · XLSX · PDF | CĐT, cơ quan cây xanh đô thị | CS — di dời cây đô thị cần phép |
| Maintenance schedule / bảng chăm sóc (tưới, cắt tỉa, bón phân theo mùa, bảo hành cây 6–12 tháng) | XLSX · PDF | đội bảo dưỡng, CĐT | NT |
| Rooftop/vertical garden spec (tải trọng, lớp chống rễ, hệ modul tường xanh) | DWG · PDF | kết cấu, thầu chuyên | phối hợp kết cấu |

### 2.4 Tạo dáng sản phẩm nội thất (Furniture product design)

| Deliverable đặc thù | Định dạng | Ai tiêu thụ | Ghi chú |
|---|---|---|---|
| Sketch/ideation board + concept dáng | PDF · PNG · Procreate | trưởng thiết kế, thương hiệu | CS |
| Ergonomics spec (kích thước công thái học: chiều cao ngồi, góc tựa, tầm với — BIFMA/EN 1335 tham chiếu) | PDF · XLSX | kỹ sư sản phẩm | DD |
| Bản vẽ kỹ thuật sản phẩm (GA drawing: 3 hình chiếu + section, full dim) | DWG · PDF · STEP | xưởng, kỹ sư | CD |
| Bản vẽ chi tiết từng part + tolerance (dung sai gia công, lắp lẫn) | DWG · PDF (GD&T nếu kim loại) | xưởng | CD |
| Mô hình CAD solid (tham số) | STEP · SLDPRT/F3D · IGES | kỹ sư, xưởng CNC | DD→CD |
| BOM (Bill of Materials — cây linh kiện: part, vật liệu, số lượng, nhà cung cấp) | XLSX · PDF | sản xuất, purchasing | CD |
| Material & finish schedule của sản phẩm (gỗ/foam/vải/sơn — mã màu, độ bóng, test chống cháy vải) | XLSX · PDF | sản xuất, QC | DD→CD |
| Prototype spec + biên bản đánh giá prototype (fit, độ bền, cảm giác ngồi) | DOCX/PDF + ảnh | team, quyết định go/no-go | prototype loop |
| Jig/fixture drawing (đồ gá xưởng cho hàng loạt) | DWG · PDF | xưởng | sản xuất |
| Test report (tải trọng, độ bền mỏi, an toàn lật — theo BIFMA X5.1/EN 12520…) | PDF | QC, khách B2B, chứng nhận | trước bán |
| Packaging design + drop test spec (thùng, foam chèn, flat-pack) | AI · DWG · PDF | xưởng bao bì, logistics | sản xuất |
| Assembly instruction (hướng dẫn lắp ráp cho end-user, kiểu IKEA) | PDF (chỉ hình, ít chữ) · AI | người mua | sản xuất |
| Costing sheet (giá thành: vật tư + nhân công + hao hụt theo BOM) | XLSX | kinh doanh | DD→sản xuất |
| Product datasheet / catalogue page (ảnh + kích thước + finish options) | PDF · INDD · web | đại lý, khách | bán hàng |
| CMF board (Color–Material–Finish cho dòng sản phẩm) | PDF · board thật | thương hiệu | CS→DD |

---

## §3 · TỔNG HỢP — "họ sản phẩm" xuyên vai + đối chiếu năng lực IF

Gom các deliverable trùng nhau giữa 6 vai thành 8 họ. Cột trạng thái IF đối chiếu `STATUS.md` 11/08 ("Năng lực hiện có — nói đúng mức") — chỗ không kiểm được ghi **cần đối chiếu**.

| Họ sản phẩm | Gồm những gì (từ §1–§2) | Vai dùng | Trạng thái IF (11/08) |
|---|---|---|---|
| **① Drawing set** (bộ bản vẽ kỹ thuật) | mặt bằng/đứng/cắt · RCP · finish plan · setting-out · chi tiết millwork/fit-out · shop drawing · as-built · hardscape/planting/irrigation · GA drawing sản phẩm | KTS · Interior · MEP · Drafter · Landscape · Furniture | **Có editor thật (chặng 2D)**: mở `.idf/.dwg/.dxf`, xuất DXF/PDF. Chưa có: sheet set/đánh số tập, revision cloud, shop drawing workflow, CSD nhiều bộ môn — cần đối chiếu từng mục |
| **② Schedule / bảng** | door-window · finish · FF&E · equipment · panel/cable · plant schedule · BOM · cutting list · hardware · BOQ/dự toán · drawing register · procurement tracker | mọi vai | **BOQ có editor thật** (nhận XLSX/CSV, xuất XLSX). Các schedule khác (FF&E, cutting list, plant…) chưa có docType riêng — về logic là cùng họ "bảng có cột định kiểu", nền `.idfc` commerce đã trù bị — cần đối chiếu |
| **③ Board** (bảng trình vật liệu/concept) | moodboard · material board A3 · CMF board · stone dry-lay board · sample approval board | Interior · Graphic · Furniture | **Material A3 có editor thật, lưu `.idfp`**. Moodboard: canvas Mood/Collab có — mức xuất board chuẩn in cần đối chiếu |
| **④ Deck / thuyết trình** | concept deck · competition board · hồ sơ năng lực · datasheet/catalogue page | Interior · KTS · Graphic · Furniture | **Deck có editor thật** (nhập PPTX cơ bản, xuất PDF/PPTX/PNG/IDFP). PDF deck/DOCX chưa nhập. Board A0 in bồi, catalogue InDesign — ngoài phạm vi hiện tại |
| **⑤ Model 3D** | scene 3D · BIM (RVT/IFC) · asset library · CAD solid sản phẩm (STEP) · clash model | 3D artist · KTS · MEP · Furniture | IF nhận ảnh, GLB/glTF/OBJ-MTL `lossy`; **chưa native SKP/MAX/FBX/IFC/RVT** (STATUS ghi rõ). IFC chỉ metadata. STEP/solid CAD: không có, ngoài định vị |
| **⑥ Media** (ảnh/video/tour) | render tĩnh · pass EXR · pano 360 · walkthrough MP4 · animation logo · ảnh chụp hoàn thiện | 3D artist · Graphic · Interior | Render pipeline (FlowRender) đang là spec/mock M1. **Video: chưa có editor — đã khoá bằng lý do năng lực, không CTA giả** (đúng STATUS). Pano 360/tour: cần đối chiếu |
| **⑦ Văn bản pháp lý – quản trị** | thuyết minh · spec/chỉ dẫn kỹ thuật · RFI · biên bản nghiệm thu/duyệt mẫu · method statement · T&C report · O&M manual · punch list · hợp đồng thuê/landlord submission | mọi vai (nặng nhất KTS · MEP · Interior) | **Chưa có editor Văn bản** (STATUS: khoá bằng lý do năng lực). Đây là họ dày đặc nhất về số lượng giấy tờ trong nghề — khoảng trống lớn nhất của IF |
| **⑧ Dữ liệu kỹ thuật chuyên biệt** | IES/LDT photometric · point cloud E57 · CTB/STB plot style · PAT hatch · CNC (MPR/DXF cắt) · HDRI · BCF clash | MEP · Drafter · 3D · Furniture | Lighting IF là **ước tính, chưa IES/LDT** (STATUS ghi rõ). PAT/hatch: 2D có hệ hatch riêng — mức nhập PAT cần đối chiếu. CNC/point cloud/BCF: chưa có |

**Nhận xét ngắn (không phải quyết định):**
- Họ ⑦ (văn bản) xuất hiện ở **mọi vai, mọi giai đoạn**, đặc biệt các mẫu lặp lại cao (biên bản duyệt mẫu, RFI, punch list) — đúng vùng "Văn bản" đang khoá.
- Họ ② ngoài BOQ còn ~10 loại schedule khác nhau nhưng chung một hình thái dữ liệu (bảng cột định kiểu + liên kết entity) — khớp hướng `.idfc` commerce + Library đã chốt 07/08.
- Shop drawing và as-built không phải docType mới hoàn toàn — là **trạng thái/vòng đời của drawing set** (revision, markup, xác nhận) hơn là định dạng khác.

---

## Gợi ý 10 docType mới cho IF — xếp theo tần suất dùng trong nghề (cao → thấp)

1. **`schedule`** — bảng định kiểu (FF&E, finish, door-window, equipment, plant, hardware): dùng hằng ngày ở mọi vai; mở rộng tự nhiên từ editor BOQ sẵn có.
2. **`spec-sheet`** — chỉ dẫn kỹ thuật / spec vật liệu-thiết bị theo mục (3-part hoặc rút gọn VN): đi kèm mọi hồ sơ CD.
3. **`approval-form`** — phiếu duyệt (mẫu vật liệu, shop drawing, phương án) có chữ ký/ngày/trạng thái + log: giấy tờ lặp nhiều nhất giai đoạn thi công.
4. **`shop-drawing`** — bản vẽ triển khai có vòng đời markup→duyệt→phát hành, revision rõ: thực chất là drawing set + workflow trạng thái.
5. **`punch-list`** — danh mục lỗi kèm ảnh + vị trí trên mặt bằng + trạng thái sửa: mọi dự án đều kết thúc bằng nó.
6. **`rfi`** — hỏi–đáp kỹ thuật có đánh số, hạn trả lời, tham chiếu bản vẽ: chuẩn quốc tế, VN dùng dạng công văn/biên bản tương đương.
7. **`meeting-minutes`** — biên bản họp/hiện trường có action item gắn người và hạn: nền cho `model Task` (P1) tiêu thụ.
8. **`cutting-list`** — bảng cắt xưởng mộc bung từ chi tiết millwork (tấm + phụ kiện): điểm nối trực tiếp thiết kế→sản xuất, ít app nào làm.
9. **`as-built`** — biến thể drawing set đánh dấu sai khác so bản phát hành, đóng hồ sơ hoàn công: bắt buộc pháp lý VN (NĐ 06/2021).
10. **`om-manual`** — hồ sơ bàn giao vận hành (thiết bị, bảo hành, hướng dẫn bảo quản vật liệu): tổng hợp tự động từ `.idfc` đã dùng trong dự án là lợi thế riêng của IF.

*Hết. File này chỉ là danh mục tra cứu — mọi quyết định docType/luật chuẩn đầu ra ghi vào sổ chốt riêng.*

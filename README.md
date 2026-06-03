# NanoCarrier-AI Formulation Discovery Studio

Ứng dụng web hỗ trợ khám phá công thức nano-carrier dựa trên MOF
(Metal-Organic Frameworks) bằng giao diện đề xuất đa mục tiêu
(Multi-Objective Recommendation Engine).

Mục tiêu của dự án là giúp người dùng nhập bối cảnh công thức, sàng lọc
nhanh các MOF ứng viên, quan sát Pareto Frontier, nhận cảnh báo Burst
Release, và xử lý nhiều mẫu bằng file CSV/XLSX.

> Lưu ý: các điểm dự đoán hiện tại được tính bằng logic mô phỏng trong
> `src/lib/formulation.ts`. Đây chưa phải model ML đã được huấn luyện hoặc
> xác thực lâm sàng. Bioavailability và Burst Release hiện là placeholder
> deterministic để phục vụ prototype giao diện và luồng xử lý.

## Mục Lục

- [Chức năng chính](#chức-năng-chính)
- [Luồng sử dụng](#luồng-sử-dụng)
- [Batch Upload](#batch-upload)
- [Cấu hình bài toán](#cấu-hình-bài-toán)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Các file quan trọng](#các-file-quan-trọng)
- [Công thức và giả định hiện tại](#công-thức-và-giả-định-hiện-tại)
- [Kiểm thử và build](#kiểm-thử-và-build)
- [Ghi chú triển khai](#ghi-chú-triển-khai)

## Chức Năng Chính

### 1. Single Input Form

Sidebar bên trái là form nhập liệu một công thức đơn lẻ.

Các nhóm dữ liệu gồm:

- **Cargo Identification**
  - Chọn therapeutic payload.
  - Tự hiển thị các thông số đọc-only: LogP, Molecular Weight, TPSA.

- **Clinical Context Restraints**
  - Target pH.
  - Pharmacokinetic Objective.
  - Cell line.
  - Concentration.
  - Exposure time.
  - Burst Release threshold.

- **MOF Material Properties**
  - Metal ion node.
  - Linker structure.
  - Surface area min/max.
  - Pore volume min/max.
  - Pore size min/max.

- **ML Model Ranking Filters**
  - Trọng số tối ưu Drug Loading.
  - Trọng số Target Release.
  - Trọng số IC50.

Validation được xử lý bằng `react-hook-form` và `zod`. Nếu thiếu trường bắt
buộc hoặc nhập khoảng min/max không hợp lệ, UI sẽ hiển thị lỗi trực tiếp dưới
trường nhập.

### 2. Results Dashboard

Khu vực bên phải hiển thị kết quả screening:

- Danh sách **Master Recommendations** theo thứ hạng.
- Card kết quả cho từng MOF ứng viên.
- Các chỉ số:
  - Predicted Loading.
  - Release at target pH.
  - Target Cell Viability.
  - Bioavailability.
  - Match percentage.
- Badge Pareto nếu ứng viên nằm trên Pareto Frontier.
- Badge Burst Release nếu early release vượt threshold người dùng đặt.
- Export JSON cho danh sách recommendations hiện tại.

### 3. Pareto Frontier

Biểu đồ scatter plot dùng `recharts`.

Trục hiện tại:

- X: Predicted Loading.
- Y: Bioavailability.
- Kích thước điểm: Match percentage.
- Màu điểm: Pareto hoặc non-Pareto candidate.

Pareto hiện được tính trên kết quả từ Single Input Form, không phải riêng cho
Batch Upload.

### 4. Batch Upload

Người dùng có thể xử lý nhiều dòng dữ liệu bằng CSV/XLSX:

- Tải template CSV hoặc XLSX ngay trong giao diện.
- Kéo thả hoặc chọn file từ máy.
- Xem preview 5-10 dòng đầu.
- Chạy Batch Ranking.
- Sort/filter bảng kết quả theo Match, Loading, Release, IC50, Bioavailability.

### 5. Problem Configuration

Nút **Configure** mở modal cấu hình bài toán:

- Chọn biến thuộc nhóm **Input Variables**.
- Chọn biến thuộc nhóm **Target Variables**.
- Reset về cấu hình mặc định.
- Lưu cấu hình trong state giao diện hiện tại.

Phần này hiện là cấu hình frontend để chuẩn bị cho Plugin Mode hoặc pipeline
ML thật trong tương lai.

## Luồng Sử Dụng

1. Mở ứng dụng.
2. Ở sidebar, chọn payload và nhập bối cảnh lâm sàng.
3. Nhập ràng buộc vật liệu MOF.
4. Điều chỉnh trọng số ranking.
5. Bấm **Run Screening**.
6. Xem Pareto Frontier và Master Recommendations.
7. Kiểm tra các badge cảnh báo như Burst Release.
8. Bấm **Export** nếu muốn tải kết quả JSON.

## Batch Upload

### Tải Template

Trong tab **Batch Upload**, bấm:

- **CSV Template** để tải `batch-template.csv`.
- **XLSX Template** để tải `batch-template.xlsx`.

Template có sẵn 2 dòng ví dụ. Người dùng có thể sửa dữ liệu và upload lại.

### Cấu Trúc Cột Bắt Buộc

File batch nên có các cột sau:

| Cột           | Ý nghĩa                | Ví dụ                  |
| ------------- | ---------------------- | ---------------------- |
| `payload`     | Tên hoạt chất/payload  | `Doxorubicin`          |
| `targetPh`    | pH mục tiêu            | `6.5`                  |
| `metalNode`   | Node ion kim loại      | `Zr4+`                 |
| `linker`      | Linker hữu cơ          | `2-aminoterephthalate` |
| `surfaceArea` | Diện tích bề mặt, m2/g | `1120`                 |
| `poreVolume`  | Thể tích lỗ xốp, cm3/g | `0.46`                 |
| `poreSize`    | Kích thước lỗ xốp, nm  | `0.8`                  |

Nếu thiếu cột, hệ thống vẫn preview file nhưng sẽ cảnh báo và dùng giá trị
mặc định từ sidebar cho phần dữ liệu thiếu.

### Ví Dụ CSV

```csv
payload,targetPh,metalNode,linker,surfaceArea,poreVolume,poreSize
Doxorubicin,6.5,Zr4+,2-aminoterephthalate,1120,0.46,0.8
Curcumin,6.2,Fe3+,terephthalate,2850,1.25,2.9
```

## Cấu Hình Bài Toán

Mở modal bằng nút **Configure** ở góc trên bên phải dashboard.

Cấu hình mặc định:

- Input variables:
  - `payload`
  - `logP`
  - `molecularWeight`
  - `tpsa`
  - `targetPh`
  - `metalNode`
  - `linker`
  - `surfaceArea`
  - `poreVolume`
  - `poreSize`

- Target variables:
  - `loading`
  - `releaseAtTargetPh`
  - `ic50`
  - `bioavailability`

## Cài Đặt Và Chạy Dự Án

### Yêu Cầu

- Node.js 18+.
- npm.

Dự án có `bun.lock`, nhưng trên Windows có thể dùng npm bình thường.

### Cài Dependencies

```bash
npm install
```

### Chạy Development Server

```bash
npm run dev
```

Mặc định Vite sẽ chạy ở:

```text
http://localhost:5173/
```

Nếu port 5173 đã bận, Vite có thể tự chuyển sang port khác. Kiểm tra log trong
terminal để lấy URL chính xác.

### Build Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

Ghi chú: repo hiện có một số file cũ dùng CRLF nên `npm run lint` toàn repo có
thể báo lỗi Prettier line ending. Các file mới của Formulation Discovery Studio
đã được format và lint scoped thành công trong quá trình triển khai.

## Biến Môi Trường

File `.env` có thể chứa cấu hình Supabase cho các module legacy:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Giao diện chính hiện tại của NanoCarrier-AI không bắt buộc Supabase để chạy
screening mô phỏng. Các module cũ như Drug Loading, Cytotoxicity và History vẫn
còn trong source code và có thể phụ thuộc Supabase/mock API cũ nếu được nối lại.

## Cấu Trúc Dự Án

```text
mof-predict-labs/
├── src/
│   ├── components/
│   │   ├── FormulationSidebar.tsx
│   │   ├── ResultsDashboard.tsx
│   │   ├── ResultCard.tsx
│   │   ├── BatchUploadView.tsx
│   │   ├── BatchRankingTable.tsx
│   │   ├── ProblemConfigurationModal.tsx
│   │   ├── DrugLoadingModule.tsx
│   │   ├── CytotoxicityModule.tsx
│   │   ├── HistoryModule.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── formulation.ts
│   │   ├── batch-parser.ts
│   │   ├── batch-input.ts
│   │   ├── mock-api.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── index.tsx
│   │   └── __root.tsx
│   ├── styles.css
│   ├── router.tsx
│   ├── server.ts
│   └── start.ts
├── supabase/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── wrangler.jsonc
```

## Các File Quan Trọng

| File                                           | Vai trò                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `src/routes/index.tsx`                         | Route chính, layout Sidebar + Main Dashboard                        |
| `src/components/FormulationSidebar.tsx`        | Form nhập liệu single screening                                     |
| `src/components/ResultsDashboard.tsx`          | Dashboard kết quả, Pareto chart, export, batch tab                  |
| `src/components/ResultCard.tsx`                | Card hiển thị từng recommendation                                   |
| `src/components/BatchUploadView.tsx`           | Upload file, tải template CSV/XLSX, preview dữ liệu                 |
| `src/components/BatchRankingTable.tsx`         | Bảng ranking batch có sort/filter                                   |
| `src/components/ProblemConfigurationModal.tsx` | Modal chọn input/target variables                                   |
| `src/lib/formulation.ts`                       | Schema Zod, mock candidate database, scoring, Pareto, batch ranking |
| `src/lib/batch-parser.ts`                      | Parser CSV/XLSX bằng thư viện `xlsx`                                |
| `src/routes/__root.tsx`                        | Shell, metadata, QueryClient, Toaster                               |

## Công Thức Và Giả Định Hiện Tại

### Candidate Database

Danh sách MOF ứng viên đang hard-code trong `src/lib/formulation.ts`, gồm:

- UiO-66-NH2.
- MIL-101(Fe).
- ZIF-8.
- PCN-224.
- HKUST-1.
- MIL-100(Fe).

Mỗi ứng viên có các thuộc tính như metal node, linker, surface area, pore
volume, pore size và stability.

### Scoring

Hàm `runScreening()` tính:

- Predicted Loading.
- Release at target pH.
- Early Release.
- IC50.
- Target Cell Viability.
- Bioavailability.
- Match percentage.
- Pareto flag.
- Burst Release flag.

Điểm Match được tính từ trọng số người dùng nhập:

- `weightLoading`
- `weightRelease`
- `weightIc50`

### Burst Release

Burst Release hiện được xác định bằng:

```ts
earlyRelease > burstThreshold;
```

Trong đó `burstThreshold` là phần trăm early release do người dùng nhập ở
sidebar.

### Bioavailability

Bioavailability hiện là chỉ số mô phỏng dựa trên loading, release, hydrophobic
fit, TPSA và pore score. Cần thay thế bằng model hoặc công thức đã được xác
thực nếu dùng cho nghiên cứu thật.

## Kiểm Thử Và Build

Các lệnh nên chạy trước khi deploy:

```bash
npm run build
```

```bash
npm run lint
```

Nếu chỉ muốn lint các file mới của NanoCarrier-AI:

```bash
.\node_modules\.bin\eslint.cmd src\components\FormulationSidebar.tsx src\components\ResultsDashboard.tsx src\components\ResultCard.tsx src\components\BatchUploadView.tsx src\components\BatchRankingTable.tsx src\components\ProblemConfigurationModal.tsx src\lib\formulation.ts src\lib\batch-parser.ts src\routes\index.tsx
```

## Tech Stack

| Lớp              | Công nghệ                          |
| ---------------- | ---------------------------------- |
| Framework        | TanStack Start, React 19           |
| Build tool       | Vite 7                             |
| Language         | TypeScript                         |
| Styling          | Tailwind CSS v4                    |
| UI primitives    | Radix UI / shadcn-style components |
| Form             | react-hook-form                    |
| Validation       | zod                                |
| Chart            | Recharts                           |
| File parsing     | xlsx                               |
| Notification     | Sonner                             |
| Icons            | lucide-react                       |
| Optional backend | Supabase                           |

## Ghi Chú Triển Khai

- Layout chính hiện tại không còn dùng tab `DrugLoading`, `Cytotoxicity`,
  `History` trên trang chủ.
- Các module legacy vẫn còn trong `src/components` để tham khảo hoặc tái sử
  dụng.
- Batch template được tạo trực tiếp ở frontend, không cần file tĩnh trong
  `public`.
- Export kết quả hiện là JSON phía client.
- Nếu nối model ML thật, nên thay thế logic trong `src/lib/formulation.ts`
  bằng API inference hoặc server function.
- Nếu bundle production quá lớn, nên code-split phần Batch Upload vì thư viện
  `xlsx` làm tăng kích thước chunk.

## Deployment

Dự án có cấu hình `wrangler.jsonc` và Cloudflare/Vite plugin, nên có thể deploy
lên Cloudflare Workers nếu môi trường đã được cấu hình.

Build production:

```bash
npm run build
```

Sau đó dùng pipeline deploy tương ứng với Cloudflare hoặc nền tảng hosting của
dự án.

## Trạng Thái Hiện Tại

Đã có:

- Giao diện NanoCarrier-AI dạng Sidebar + Dashboard.
- Form validation.
- Screening mô phỏng.
- Pareto Frontier.
- Master Recommendations.
- Burst Release warning.
- Batch upload CSV/XLSX.
- Download template CSV/XLSX.
- Batch preview và ranking table.
- Problem Configuration modal.

Cần bổ sung trong các giai đoạn tiếp theo:

- Model ML thật cho loading/release/IC50/bioavailability.
- Định nghĩa khoa học chính thức cho Burst Release threshold.
- Mapping cột batch nâng cao nếu dữ liệu thực tế có nhiều format khác nhau.
- Unit test cho schema, parser và scoring.
- Lưu lịch sử dự đoán nếu cần tracking lâu dài.

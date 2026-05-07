# 📖 SURI HOMESTAY - CẨM NANG VẬN HÀNH & TÀI LIỆU NỘI BỘ

*Tài liệu nội bộ dành cho đội ngũ Quản lý và Vận hành Suri HomeStay. Vui lòng không chia sẻ ra ngoài khách hàng.*

---

## 📚 1. THÔNG TIN KHÓA TỪ & CĂN HỘ (GỬI KHÁCH)

Dưới đây là bộ thông tin chuẩn (Pass/Wifi) của 3 căn hộ hiện tại. 
*(Tất cả thông tin này cũng đã được tự động gắn vào mục **Ghi chú** của mỗi phòng trên Web App).*

### 🏠 Căn 1: R2 0801 (Tòa R2 Onsen)
- **Địa chỉ:** Tầng 08 căn 01 tòa R2 onsen
- **Định vị toà nhà:** [https://maps.app.goo.gl/oDKspoEYV35JPhERA](https://maps.app.goo.gl/oDKspoEYV35JPhERA)
- **Mật khẩu cửa:** `151284*` *(hoặc `13579*` / thay đổi linh hoạt theo ghi chú)*
- **Wifi name:** `R2 0801`
- **Wifi pass:** `53541989`
- **Thẻ thang máy:** Gửi tại siêu thị Leco Mart chân tòa nhà.

### 🏠 Căn 2: R1 08A06B (Tòa R1 Onsen)
- **Địa chỉ:** Tầng 08a căn 06b tòa R1 onsen
- **Mật khẩu cửa:** `13579*`
- **Wifi name:** *(Đang cập nhật)*
- **Wifi pass:** *(Đang cập nhật)*
- **Thẻ thang máy:** Gửi tại siêu thị Leco Mart chân tòa nhà.

### 🏠 Căn 3: L1 3308A (Tòa Landmark L1)
- **Địa chỉ:** Tầng 33 căn 08A tòa Landmark L1
- **Định vị toà nhà:** [https://maps.app.goo.gl/Y8qLpjTr4QV4DXgC6](https://maps.app.goo.gl/Y8qLpjTr4QV4DXgC6)
- **Mật khẩu cửa:** `204188*` *(hoặc `121113*` / thay đổi linh hoạt theo ghi chú)*
- **Wifi name:** `L1 3308A`
- **Wifi pass:** `68686868@`
- **Thẻ thang máy:** Gửi tại siêu thị G2 ngay tầng 1.

---

## 💼 2. THÔNG TIN HỆ THỐNG VÀ ỨNG DỤNG BÁO CÁO (PMS)

Hệ thống quản lý đặt phòng được xây dựng như một Web App di động, truy cập được từ mọi nơi.

- **Link truy cập Quản trị Web (App):** [https://frontend-tau-seven-70.vercel.app/](https://frontend-tau-seven-70.vercel.app/)
- **Tài khoản đăng nhập (Phân quyền Admin):**
  - **Username:** `admin`
  - **Password:** `admin`

### Quy trình sử dụng 4 Tab chính:

1. **Tab Tổng quan (Dashboard):** Xem biểu đồ dòng tiền, tổng Booking (OTA), thống kê check-in / check-out hôm nay.

2. **Tab Đặt phòng:** Quản lý booking với 3 chế độ xem:
   - **Danh sách (List):** Xem tất cả booking theo danh sách truyền thống.
   - **Lịch (Calendar):** ⭐ *Mới* — Xem lịch tháng kiểu Airbnb Host cho từng phòng.
     - Hiển thị giá phòng mỗi ngày + thanh bar booking liên tục.
     - Tap ngày trống → Tạo booking mới.
     - Tap thanh booking → Xem chi tiết / Sửa / Xóa.
     - Cùng 1 khách book liền ngày → tự gộp thành 1 thanh liên tục.
     - Ngày check-in/check-out chia đôi ô (Airbnb-style) → không đè lên nhau.
   - **Đóng phòng (Block Dates):** 🚫 Bấm icon 🚫 trên header lịch phòng → chọn ngày Từ/Đến + ghi chú lý do → ngày bị đóng sẽ hiện gạch chéo.
   - **Danh sách phòng:** Mỗi phòng hiện dots mini-calendar tháng hiện tại (nửa chấm cho ngày check-in/out, chấm đầy cho ngày giữa kỳ).

3. **Tab Thu Chi:** ⭐ *Mới* — Theo dõi thu chi từng căn hộ hàng tháng.
   - **Thu:** Tự tổng hợp từ tất cả booking đã xác nhận trong tháng.
   - **Chi:** Ghi nhận chi phí phát sinh (Ngày chi, Nội dung, Số tiền, Ghi chú).
   - **Lợi nhuận:** = Tổng thu − Tổng chi (chi cố định từ Room + chi phát sinh).
   - Lọc theo phòng + tháng bất kỳ.

4. **Tab Cài đặt:** Thông báo Push, Giao diện (Sáng/Tối/Hệ thống).
   - **Quản lý Kho Phòng:** Truy cập từ mục "Quản lý" trong Cài đặt → xem/sửa thông tin phòng, giá, ghi chú Welcome Message.

---

## 🔐 3. THÔNG TIN CODE & TRIỂN KHAI (DÀNH CHO IT/DEV)

Phần này dùng để lưu lại nếu sau này cần nhờ Dev khác chỉnh sửa chức năng, hoặc tự chạy hệ thống:

- **Mã nguồn (Frontend):** Next.js 16 App Router, Tailwind CSS, Lucide Icons, Vaul (Drawer UI), Sonner (Toast).
- **Lưu trữ CSDL (Database):** Toàn bộ dữ liệu nằm trên Serverless Redis (`Vercel KV`). Không lưu ở Local để đảm bảo tất cả quản lý dùng chung Data Realtime. Mọi thao tác qua API endpoint: `/api/store`.
- **Triển khai tự động:** Web tự động build & deploy khi có Code mới commit lên nhánh `master` của Repo GitHub. 

### Cấu trúc dữ liệu KV:
| Key | Mô tả | Ví dụ |
|---|---|---|
| `rooms` | Danh sách phòng (tên, giá, building, ghi chú) | `[{name: "R2 0801", defaultDailyPrice: 650000, ...}]` |
| `bookings` | Danh sách booking (khách, ngày, số tiền, trạng thái) | `[{id: "B888", guestName: "Trang Cún", ...}]` |
| `tenants` | Khách thuê dài hạn | `[{name: "...", monthlyRent: 6500000, ...}]` |
| `expenses` | Chi phí phát sinh (Thu Chi module) | `[{id: "EXP...", roomName: "R2 0801", amount: 500000, ...}]` |
| `blocks` | Ngày đóng phòng (Block Dates) | `[{id: "BLK...", roomName: "R2 0801", startDate: "2026-05-10", ...}]` |

### Cấu trúc file chính:
```
app/
  bookings/page.tsx    — Trang đặt phòng (List + Calendar + Timeline view)
  finance/page.tsx     — Trang Thu Chi
  rooms/page.tsx       — Quản lý Kho Phòng
  settings/page.tsx    — Cài đặt (Thông báo, Giao diện, link Kho Phòng)
  api/store/route.ts   — API đọc/ghi KV Store
components/
  CalendarView.tsx     — Lịch Airbnb-style (booking bars, block dates, dots)
  TimelineView.tsx     — Timeline view (Gantt chart booking)
  BottomNav.tsx        — Thanh điều hướng dưới (4 tab)
```

***

*Chúc team Suri HomeStay buôn may bán đắt, ngập tràn Booking OTA!* 🌿

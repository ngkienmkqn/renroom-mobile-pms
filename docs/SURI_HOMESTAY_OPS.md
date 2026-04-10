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
1. **Tab Dashboard (Tổng quan):** Nơi xem biểu đồ dòng tiền (19tr5/tháng), tổng số Booking (OTA), và các thống kê check-in check-out hôm nay.
2. **Tab Phòng:** Quản lý tài sản (3 phòng R1, R2, L1). Mỗi khi có khách mới, bấm vào thẻ Phòng => **Mở Ghi Chú** để copy đoạn tin nhắn chào mừng (Welcome message) kèm Pass cửa & Wifi gửi cho khách.
3. **Tab Đặt phòng:** Nơi tạo nhanh Booking khách lẻ (Airbnb/Booking/Chuyển khoản trực tiếp). Mọi khoản tiền và tình trạng xác nhận cọc đều lưu ở đây.
4. **Tab Khách Thuê (Dài hạn):** Nơi chứa chi phí mặt bằng cố định. Ví dụ hệ thống đang thiết lập 3 hợp đồng cố định giá thuê mỗi tháng là `6.500.000đ` cho các căn hộ. Để tách bạch giữa doanh thu từ khách lẻ (Tab 3) và chi phí vốn (Tab 4).

---

## 🔐 3. THÔNG TIN CODE & TRIỂN KHAI (DÀNH CHO IT/DEV)

Phần này dùng để lưu lại nếu sau này cần nhờ Dev khác chỉnh sửa chức năng, hoặc tự chạy hệ thống:

- **Mã nguồn (Frontend):** Next.js App Router, Tailwind CSS, Lucide Icons, Vaul (Drawer UI).
- **Lưu trữ CSDL (Database):** Toàn bộ dữ liệu nằm trên Serverless Redis (`Vercel KV`). Không lưu ở Local để đảm bảo tất cả quản lý (Huyền, Chủ nhà) dùng chung Data Realtime. Mọi thao tác qua API endpoint: `/api/store`.
- **Triển khai tự động:** Web tự động build & deploy khi có Code mới commit lên nhánh `master` hoặc `main` của Repo GitHub. 

***

*Chúc team Suri HomeStay buôn may bán đắt, ngập tràn Booking OTA!* 🌿

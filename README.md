# درمان‌یار — فرانت‌اند نوبت‌دهی پزشک

فرانت‌اند فارسی و راست‌چین با HTML/CSS/JavaScript خام؛ بدون React، npm یا build step.

## ساختار پروژه

```text
doctor-website/
├── index.html
├── pages/
│   └── admin.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── ui.js
│       ├── booking.js
│       ├── depression.js
│       ├── main.js
│       └── admin.js
├── README.md
└── .gitignore
```

## اجرا

1. بک‌اند FastAPI را اجرا کنید؛ آدرس پیش‌فرض `http://127.0.0.1:8000` است.
2. در صورت نیاز آدرس را در `assets/js/config.js` تغییر دهید.
3. پوشه را با VS Code باز کنید و `index.html` را با Live Server اجرا کنید. می‌توانید مستقیماً هم فایل را باز کنید، اما Live Server معمولاً تجربه بهتری دارد.
4. برای مدیریت به `pages/admin.html` بروید.
5. CORS در FastAPI باید origin فرانت‌اند را مجاز کند.

## امکانات صفحه اصلی

- دریافت فهرست پزشکان از `GET /doctors`
- نمایش اطلاعات، ساعت‌های آزاد و رزروشده
- رزرو با `POST /doctors/{doctor_id}/reserve` و بدنه `{ "name": "...", "start": "..." }`
- درخواست لغو با `POST /doctors/{doctor_id}/cancel` و بدنه `{ "name": "...", "start": "..." }` (مطابق OpenAPI ذخیره‌شده)
- خودارزیابی و ارسال داده‌ها به `POST /predict-depress`
- ارسال پرسش متنی به `POST /ask-ai`

## امکانات پنل مدیریت

- افزودن پزشک با مشخصات و ساخت ساعت‌های کاری از طریق time picker
- مشاهده تعداد پزشکان، وضعیت اتصال و تعداد زمان‌های آزاد/رزروشده
- ویرایش نام، شماره تماس، توضیحات، آدرس و ساعت‌های کاری هر پزشک
- حذف پزشک با تأیید کاربر
- هنگام ویرایش، بازه‌های رزروشده قفل هستند تا رزروهای موجود تصادفاً حذف یا تغییر نکنند

## قرارداد API و مواردی که باید با بک‌اند تطبیق داده شوند

این فرانت‌اند بر اساس OpenAPI و نمونه‌های API ارسال‌شده در گفتگو ساخته شده است. در OpenAPI ذخیره‌شده، مسیرهای زیر وجود داشتند:

- `POST /create-doctor`
- `GET /doctors`
- `GET /doctors/{id}`
- `DELETE /doctors/{id}/delete`
- `POST /doctors/{doctor_id}/reserve`
- `POST /doctors/{doctor_id}/cancel`
- `POST /predict-depress`
- `POST /ask-ai`

اما در همان OpenAPI مسیر ویرایش پزشک دیده نمی‌شد. برای فعال‌شدن فرم ویرایش، بک‌اند باید این endpoint را فراهم کند:

`PATCH /doctors/{id}/update`

با JSON شامل فیلدهای `name`, `description`, `phone_number`, `address`, `schedule`. مقدار `schedule` آرایه‌ای از slotهاست؛ هر slot حداقل `start`, `end`, `is_reserved` و در صورت وجود `reserved_by` دارد. اگر نام فیلدهای مدل بک‌اند شما متفاوت است، payload در `assets/js/admin.js` را با مدل واقعی هماهنگ کنید.

همچنین در OpenAPI ذخیره‌شده، schema مربوط به `DoctorCreate` فیلد `schedule` را نشان نمی‌داد؛ با این حال فرم افزودن، schedule را در payload می‌فرستد. مدل ورودی endpoint افزودن پزشک باید `schedule` را بپذیرد تا ساعت‌ها ذخیره شوند.

## امنیت مهم

این پنل فقط رابط کاربری است و احراز هویت ندارد. قبل از انتشار عمومی، endpointهای افزودن، ویرایش و حذف را در بک‌اند با ورود مدیر، هش رمز عبور، session/JWT و بررسی نقش محافظت کنید. مخفی کردن لینک پنل در فرانت‌اند امنیت ایجاد نمی‌کند.

## نکته سلامت

خروجی بخش خودارزیابی صرفاً پیش‌بینی مدل است، نه تشخیص پزشکی. در صورت پاسخ مثبت به پرسش نهم، پیام راهنمای دریافت کمک نمایش داده می‌شود.

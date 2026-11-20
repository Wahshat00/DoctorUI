# هم‌قدم | فرانت‌اند سایت روان‌شناسی

فرانت‌اند ساده و واکنش‌گرای فارسی با HTML، CSS و JavaScript خام.

## اجرا
1. بک‌اند FastAPI را اجرا کن (پیش‌فرض: `http://127.0.0.1:8000`).
2. مقدار `API_BASE_URL` را در `config.js` در صورت نیاز تغییر بده.
3. فایل `index.html` را با Live Server در VS Code اجرا کن. بهتر است فایل را مستقیم با `file://` باز نکنی.
4. در FastAPI، CORS را برای origin فرانت‌اند فعال کن.

نمونه CORS در بک‌اند:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## endpointهای مورد استفاده
- `GET /doctors`
- `POST /create-doctor` با `name`, `description`, `phone_number`, `address`
- `DELETE /doctors/{id}/delete`
- `POST /doctors/{doctor_id}/reserve` با `name`, `start`
- `POST /doctors/{doctor_id}/cancel` در این نسخه در UI عمومی نمایش داده نشده است.
- `POST /predict-depress`
- `POST /ask-ai`

## نکات مهم اتصال
- فهرست زمان‌های پزشک از فیلد `schedule` در پاسخ `GET /doctors` خوانده می‌شود. هر آیتم زمان باید `start`, `is_reserved` و در صورت وجود `reserved_by` داشته باشد.
- فرم تست افسردگی مقادیر `question_1` تا `question_9` را به صورت عددی ۰ تا ۳ ارسال می‌کند.
- فیلد جنسیت در فرم به صورت `gender: "Female" | "Male"` ارسال می‌شود. در بک‌اند باید مدل ورودی این فیلد را بپذیرد و آن را به `Gender_Female` و `Gender_Male` تبدیل کند. اگر مدل Pydantic شما به‌جای `gender` دو فیلد بولی `gender_female` و `gender_male` می‌خواهد، بخش ساخت `payload` در `app.js` را مطابق آن تغییر بده.
- `sleep_quality`، `study_pressure` و `financial_pressure` به شکل عددی ارسال می‌شوند. گزینه‌های فعلی رابط ۱ تا ۵ برای کیفیت خواب و ۰ تا ۴ برای فشارها هستند؛ این مقیاس‌ها باید با مقیاس واقعی دیتاست و مدل شما یکسان باشند.
- برای `/ask-ai` در نسخه فعلی متن خام با `Content-Type: text/plain` ارسال می‌شود، چون پیاده‌سازی قبلی endpoint متن را با `Body()` می‌گرفت. اگر endpoint شما JSON می‌خواهد، باید body و Content-Type در `app.js` تغییر کند.

## پنل مدیریت و امنیت
این نسخه پنل مدیریت را از نظر رابط کاربری جدا کرده است، اما ورود امن یا احراز هویت ادمین در آن وجود ندارد؛ هر کاربری که صفحه را باز کند می‌تواند وارد نمای پنل شود. عملیات واقعی مدیریت باید در بک‌اند با احراز هویت، مجوز دسترسی و اعتبارسنجی سمت سرور محافظت شوند. هرگز کلید یا رمز ادمین را فقط در JavaScript قرار نده.

## محدودیت فعلی API
در اسکیمای قبلی مسیر ساخت/حذف پزشک و رزرو وجود داشت، اما مسیر افزودن یا ویرایش زمان‌بندی پزشک مشخص نبود. بنابراین UI زمان‌های موجود در پاسخ API را نمایش می‌دهد و زمان جدید ایجاد نمی‌کند.

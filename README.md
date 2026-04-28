# Greenhouse Weather Widget

Маленький Android home-screen widget, що показує погоду в форматі, корисному для тепличного господарства:

- поточна температура та `feels-like`;
- **попередження про нічні приморозки** (легкі ≤2°C, сильні ≤−3°C);
- вологість, вітер, опади;
- **підказка дії**: провітрити / закрити кватирки / ризик конденсату / орієнтовна добова норма поливу (через ET₀);
- автоматичне оновлення кожні 30 хв через `WorkManager`, ручний рефреш по тапу;
- офлайн-фолбек з останнього кешу.

## Стек

- Native Android, Kotlin (min SDK 26, target 34)
- [Open-Meteo Forecast API](https://open-meteo.com/) — без ключа
- `AppWidgetProvider` + `RemoteViews`, `WorkManager`, `DataStore`, `FusedLocationProviderClient`
- OkHttp + Moshi (KSP)

## Збірка

Потрібен Android SDK і JDK 17.

```bash
gradle wrapper                 # один раз, щоб згенерувати gradlew + wrapper jar
./gradlew assembleDebug        # APK у app/build/outputs/apk/debug/
./gradlew installDebug         # на під'єднаний пристрій або емулятор
```

Альтернативно — відкрити проект в Android Studio Hedgehog+.

## Як додати віджет

1. На пристрої: long-press на домашньому екрані → **Widgets** → **Greenhouse Weather** → перетягнути 4×2.
2. Запуститься `WidgetConfigActivity` — натиснути **«Дозволити геолокацію»**, надати дозвіл (Coarse/Fine).
3. **«Додати віджет»** — за ~10 сек з'являться реальні дані.

## Структура

```
app/src/main/
├── AndroidManifest.xml
├── kotlin/com/apeiron/greenhouseweather/
│   ├── widget/        # AppWidgetProvider + RemoteViews renderer
│   ├── work/          # WorkManager periodic + one-shot refresh
│   ├── data/          # Open-Meteo API, Moshi models, repo, greenhouse logic
│   ├── location/      # FusedLocationProviderClient wrapper
│   ├── settings/      # DataStore (cache + last location)
│   └── config/        # WidgetConfigActivity (permission flow)
└── res/
    ├── layout/widget_4x2.xml, widget_config.xml
    ├── xml/widget_info.xml
    ├── drawable/      # background, alert, weather icons
    └── values{,-uk}/  # strings (en + uk), colors, themes
```

## API контракт

Один HTTP-виклик на оновлення:

```
GET https://api.open-meteo.com/v1/forecast
    ?latitude={lat}&longitude={lon}
    &current=temperature_2m,apparent_temperature,relative_humidity_2m,
             wind_speed_10m,precipitation,weather_code
    &hourly=temperature_2m,dew_point_2m,precipitation,precipitation_probability,
            soil_temperature_18cm,et0_fao_evapotranspiration
    &daily=temperature_2m_min,temperature_2m_max,sunrise,sunset,
           et0_fao_evapotranspiration
    &forecast_days=3&timezone=auto&wind_speed_unit=ms
```

## Логіка тепличних підказок (`GreenhouseAdvice`)

- **Frost light**: `nightMin ≤ 2°C` → жовтогарячий бейдж.
- **Frost hard**: `nightMin ≤ −3°C` → червоний бейдж.
- **Condensation**: `|temp − dewPoint| < 2°C && humidity ≥ 85%`.
- **Close vents**: `wind ≥ 8 m/s`.
- **Ventilate**: `temp > 25°C && wind < 5 m/s && precip ≤ 0.1 mm`.
- **Water hint**: `dailyET₀ ≥ 4 mm && precip ≤ 0.1 mm`.

Пороги навмисно консервативні. Підлаштуйте під свою культуру в `data/GreenhouseAdvice.kt`.

## Що не входить (поки що)

- кілька локацій / кілька теплиць;
- BLE-сенсори в самій теплиці;
- push-нотифікації про приморозки;
- Material You dynamic theming для віджета.

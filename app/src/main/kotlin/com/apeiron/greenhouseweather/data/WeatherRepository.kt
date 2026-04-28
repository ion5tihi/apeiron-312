package com.apeiron.greenhouseweather.data

import android.content.Context
import com.apeiron.greenhouseweather.settings.SettingsStore
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId

class WeatherRepository(
    context: Context,
    private val api: OpenMeteoApi = OpenMeteoApi(),
    private val settings: SettingsStore = SettingsStore(context)
) {
    private val moshi: Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val responseAdapter = moshi.adapter(WeatherResponse::class.java)

    data class CachedSnapshot(
        val snapshot: GreenhouseAdvice.Snapshot,
        val fetchedAtMillis: Long,
        val isStale: Boolean
    )

    suspend fun refresh(latitude: Double, longitude: Double): CachedSnapshot =
        withContext(Dispatchers.IO) {
            val response = api.forecast(latitude, longitude)
            val json = responseAdapter.toJson(response)
            val now = System.currentTimeMillis()
            settings.saveResponse(json, now)
            settings.saveLocation(latitude, longitude)
            CachedSnapshot(buildSnapshot(response), now, isStale = false)
        }

    suspend fun loadCached(): CachedSnapshot? = withContext(Dispatchers.IO) {
        val (json, ts) = settings.loadResponse() ?: return@withContext null
        val response = responseAdapter.fromJson(json) ?: return@withContext null
        val ageMs = System.currentTimeMillis() - ts
        CachedSnapshot(
            snapshot = buildSnapshot(response),
            fetchedAtMillis = ts,
            isStale = ageMs > STALE_THRESHOLD_MS
        )
    }

    private fun buildSnapshot(r: WeatherResponse): GreenhouseAdvice.Snapshot {
        val nightMin = pickTonightMin(r)
        val dewNow = pickCurrentHourValue(r.hourly?.time, r.hourly?.dew_point_2m)
        val et0Today = r.daily?.et0_fao_evapotranspiration?.firstOrNull()
        return GreenhouseAdvice.Snapshot(
            tempC = r.current?.temperature_2m,
            feelsLikeC = r.current?.apparent_temperature,
            humidityPct = r.current?.relative_humidity_2m,
            windMs = r.current?.wind_speed_10m,
            precipitationMm = r.current?.precipitation,
            weatherCode = r.current?.weather_code,
            nightMinC = nightMin,
            dewPointC = dewNow,
            dailyEt0Mm = et0Today
        )
    }

    /**
     * Tonight = lowest of next 12 hourly temperatures starting from current hour
     * if it's afternoon/evening; otherwise daily.temperature_2m_min[0].
     */
    private fun pickTonightMin(r: WeatherResponse): Double? {
        val hourly = r.hourly ?: return r.daily?.temperature_2m_min?.firstOrNull()
        val times = hourly.time ?: return r.daily?.temperature_2m_min?.firstOrNull()
        val temps = hourly.temperature_2m ?: return r.daily?.temperature_2m_min?.firstOrNull()

        val now = LocalDateTime.now(ZoneId.systemDefault()).withMinute(0).withSecond(0).withNano(0)
        val startIdx = times.indexOfFirst {
            runCatching { LocalDateTime.parse(it) }.getOrNull()?.let { dt -> !dt.isBefore(now) } == true
        }.takeIf { it >= 0 } ?: 0

        val window = temps.drop(startIdx).take(14)
        return window.minOrNull() ?: r.daily?.temperature_2m_min?.firstOrNull()
    }

    private fun pickCurrentHourValue(times: List<String>?, values: List<Double>?): Double? {
        if (times == null || values == null) return null
        val nowHour = LocalDateTime.now(ZoneId.systemDefault())
            .withMinute(0).withSecond(0).withNano(0)
        val idx = times.indexOfFirst {
            runCatching { LocalDateTime.parse(it) }.getOrNull() == nowHour
        }
        return if (idx in values.indices) values[idx] else values.firstOrNull()
    }

    companion object {
        const val STALE_THRESHOLD_MS = 90L * 60 * 1000 // 90 minutes
    }
}

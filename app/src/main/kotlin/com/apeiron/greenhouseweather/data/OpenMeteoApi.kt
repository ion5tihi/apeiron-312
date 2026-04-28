package com.apeiron.greenhouseweather.data

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class OpenMeteoApi(
    private val client: OkHttpClient = defaultClient(),
    private val moshi: Moshi = defaultMoshi()
) {
    private val adapter = moshi.adapter(WeatherResponse::class.java)

    fun forecast(latitude: Double, longitude: Double): WeatherResponse {
        val url = "https://api.open-meteo.com/v1/forecast".toHttpUrl().newBuilder()
            .addQueryParameter("latitude", latitude.toString())
            .addQueryParameter("longitude", longitude.toString())
            .addQueryParameter(
                "current",
                "temperature_2m,apparent_temperature,relative_humidity_2m," +
                    "wind_speed_10m,precipitation,weather_code"
            )
            .addQueryParameter(
                "hourly",
                "temperature_2m,dew_point_2m,precipitation,precipitation_probability," +
                    "soil_temperature_18cm,et0_fao_evapotranspiration"
            )
            .addQueryParameter(
                "daily",
                "temperature_2m_min,temperature_2m_max,sunrise,sunset,et0_fao_evapotranspiration"
            )
            .addQueryParameter("forecast_days", "3")
            .addQueryParameter("timezone", "auto")
            .addQueryParameter("wind_speed_unit", "ms")
            .build()

        val request = Request.Builder().url(url).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw RuntimeException("Open-Meteo HTTP ${response.code}")
            }
            val body = response.body?.string()
                ?: throw RuntimeException("Empty body")
            return adapter.fromJson(body)
                ?: throw RuntimeException("Unparseable Open-Meteo response")
        }
    }

    companion object {
        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        fun defaultMoshi(): Moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
    }
}

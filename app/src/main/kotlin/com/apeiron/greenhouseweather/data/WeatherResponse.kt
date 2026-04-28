package com.apeiron.greenhouseweather.data

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class WeatherResponse(
    val latitude: Double,
    val longitude: Double,
    val timezone: String?,
    val current: Current?,
    val hourly: Hourly?,
    val daily: Daily?
)

@JsonClass(generateAdapter = true)
data class Current(
    val time: String?,
    val temperature_2m: Double?,
    val apparent_temperature: Double?,
    val relative_humidity_2m: Int?,
    val wind_speed_10m: Double?,
    val precipitation: Double?,
    val weather_code: Int?
)

@JsonClass(generateAdapter = true)
data class Hourly(
    val time: List<String>?,
    val temperature_2m: List<Double>?,
    val dew_point_2m: List<Double>?,
    val precipitation: List<Double>?,
    val precipitation_probability: List<Int>?,
    val soil_temperature_18cm: List<Double>?,
    val et0_fao_evapotranspiration: List<Double>?
)

@JsonClass(generateAdapter = true)
data class Daily(
    val time: List<String>?,
    val temperature_2m_min: List<Double>?,
    val temperature_2m_max: List<Double>?,
    val sunrise: List<String>?,
    val sunset: List<String>?,
    val et0_fao_evapotranspiration: List<Double>?
)

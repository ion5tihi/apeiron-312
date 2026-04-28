package com.apeiron.greenhouseweather.data

import kotlin.math.abs

/**
 * Logic that turns raw weather into greenhouse-specific guidance.
 * Thresholds are deliberately conservative defaults; tweak per crop.
 */
object GreenhouseAdvice {

    enum class FrostLevel { NONE, LIGHT, HARD }

    data class Snapshot(
        val tempC: Double?,
        val feelsLikeC: Double?,
        val humidityPct: Int?,
        val windMs: Double?,
        val precipitationMm: Double?,
        val weatherCode: Int?,
        val nightMinC: Double?,
        val dewPointC: Double?,
        val dailyEt0Mm: Double?
    )

    fun frostLevel(nightMinC: Double?): FrostLevel {
        val v = nightMinC ?: return FrostLevel.NONE
        return when {
            v <= -3.0 -> FrostLevel.HARD
            v <= 2.0 -> FrostLevel.LIGHT
            else -> FrostLevel.NONE
        }
    }

    /** Single-line hint covering the most relevant action. */
    fun pickHint(s: Snapshot): Hint {
        val condensation = s.tempC != null && s.dewPointC != null && s.humidityPct != null &&
            abs(s.tempC - s.dewPointC) < 2.0 && s.humidityPct >= 85
        val ventilateOk = (s.tempC ?: 0.0) > 25.0 && (s.windMs ?: 0.0) < 5.0 &&
            (s.precipitationMm ?: 0.0) <= 0.1
        val tooWindy = (s.windMs ?: 0.0) >= 8.0
        val needsWater = (s.dailyEt0Mm ?: 0.0) >= 4.0 && (s.precipitationMm ?: 0.0) <= 0.1

        return when {
            condensation -> Hint.Condensation
            tooWindy -> Hint.CloseVents
            ventilateOk -> Hint.Ventilate
            needsWater -> Hint.Water(s.dailyEt0Mm ?: 0.0)
            else -> Hint.Neutral
        }
    }

    sealed class Hint {
        data object Condensation : Hint()
        data object CloseVents : Hint()
        data object Ventilate : Hint()
        data class Water(val et0Mm: Double) : Hint()
        data object Neutral : Hint()
    }

    /** WMO weather code → simplified bucket for icon picking. */
    enum class IconBucket { CLEAR, CLOUDY, RAIN, SNOW, THUNDER, FOG }

    fun bucket(code: Int?): IconBucket = when (code) {
        null -> IconBucket.CLEAR
        0, 1 -> IconBucket.CLEAR
        2, 3 -> IconBucket.CLOUDY
        45, 48 -> IconBucket.FOG
        51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 -> IconBucket.RAIN
        71, 73, 75, 77, 85, 86 -> IconBucket.SNOW
        95, 96, 99 -> IconBucket.THUNDER
        else -> IconBucket.CLOUDY
    }
}

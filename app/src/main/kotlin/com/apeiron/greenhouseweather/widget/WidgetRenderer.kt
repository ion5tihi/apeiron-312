package com.apeiron.greenhouseweather.widget

import android.appwidget.AppWidgetManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.apeiron.greenhouseweather.R
import com.apeiron.greenhouseweather.data.GreenhouseAdvice
import com.apeiron.greenhouseweather.data.WeatherRepository
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

object WidgetRenderer {

    fun renderAll(context: Context, cache: WeatherRepository.CachedSnapshot?) {
        val manager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, WeatherWidgetProvider::class.java)
        val ids = manager.getAppWidgetIds(component)
        if (ids.isEmpty()) return
        val views = buildViews(context, cache)
        ids.forEach { id -> manager.updateAppWidget(id, views) }
    }

    fun buildLoading(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_4x2)
        views.setTextViewText(R.id.widget_temp, "—")
        views.setTextViewText(R.id.widget_feels, context.getString(R.string.widget_loading))
        views.setViewVisibility(R.id.widget_alert, View.GONE)
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent(context))
        return views
    }

    fun buildViews(context: Context, cache: WeatherRepository.CachedSnapshot?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_4x2)
        views.setOnClickPendingIntent(R.id.widget_root, refreshPendingIntent(context))

        if (cache == null) {
            views.setTextViewText(R.id.widget_temp, "—")
            views.setTextViewText(R.id.widget_feels, context.getString(R.string.widget_error))
            views.setTextViewText(R.id.widget_updated, "")
            views.setViewVisibility(R.id.widget_alert, View.GONE)
            views.setImageViewResource(R.id.widget_icon, R.drawable.ic_weather_clear)
            views.setTextViewText(R.id.widget_metric_humidity, "")
            views.setTextViewText(R.id.widget_metric_wind, "")
            views.setTextViewText(R.id.widget_metric_precip, "")
            views.setTextViewText(R.id.widget_metric_night, "")
            views.setTextViewText(R.id.widget_hint, "")
            return views
        }

        val s = cache.snapshot
        views.setTextViewText(R.id.widget_temp, formatTemp(s.tempC))
        views.setTextViewText(
            R.id.widget_feels,
            context.getString(R.string.feels_like, formatTemp(s.feelsLikeC))
        )

        val time = DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(cache.fetchedAtMillis))
        val updated = if (cache.isStale) {
            "$time · " + context.getString(R.string.widget_offline)
        } else time
        views.setTextViewText(R.id.widget_updated, updated)

        views.setImageViewResource(R.id.widget_icon, iconFor(s.weatherCode))

        val frost = GreenhouseAdvice.frostLevel(s.nightMinC)
        when (frost) {
            GreenhouseAdvice.FrostLevel.NONE -> {
                views.setViewVisibility(R.id.widget_alert, View.GONE)
            }
            GreenhouseAdvice.FrostLevel.LIGHT -> {
                views.setViewVisibility(R.id.widget_alert, View.VISIBLE)
                views.setTextViewText(
                    R.id.widget_alert,
                    context.getString(R.string.alert_frost, formatTemp(s.nightMinC))
                )
                views.setInt(R.id.widget_alert, "setBackgroundResource", R.drawable.alert_background)
            }
            GreenhouseAdvice.FrostLevel.HARD -> {
                views.setViewVisibility(R.id.widget_alert, View.VISIBLE)
                views.setTextViewText(
                    R.id.widget_alert,
                    context.getString(R.string.alert_freeze, formatTemp(s.nightMinC))
                )
                views.setInt(R.id.widget_alert, "setBackgroundResource", R.drawable.alert_background)
                views.setInt(R.id.widget_alert, "setBackgroundColor", 0xFFC62828.toInt())
            }
        }

        views.setTextViewText(
            R.id.widget_metric_humidity,
            s.humidityPct?.let { context.getString(R.string.metric_humidity, it.toString()) } ?: ""
        )
        views.setTextViewText(
            R.id.widget_metric_wind,
            s.windMs?.let {
                context.getString(R.string.metric_wind, String.format(Locale.US, "%.1f", it))
            } ?: ""
        )
        views.setTextViewText(
            R.id.widget_metric_precip,
            s.precipitationMm?.let {
                context.getString(R.string.metric_precip, String.format(Locale.US, "%.1f", it))
            } ?: ""
        )
        views.setTextViewText(
            R.id.widget_metric_night,
            s.nightMinC?.let { context.getString(R.string.metric_night, formatTemp(it)) } ?: ""
        )

        views.setTextViewText(R.id.widget_hint, hintText(context, GreenhouseAdvice.pickHint(s)))
        return views
    }

    private fun iconFor(code: Int?): Int = when (GreenhouseAdvice.bucket(code)) {
        GreenhouseAdvice.IconBucket.CLEAR -> R.drawable.ic_weather_clear
        GreenhouseAdvice.IconBucket.CLOUDY -> R.drawable.ic_weather_cloudy
        GreenhouseAdvice.IconBucket.RAIN -> R.drawable.ic_weather_rain
        GreenhouseAdvice.IconBucket.SNOW -> R.drawable.ic_weather_snow
        GreenhouseAdvice.IconBucket.THUNDER -> R.drawable.ic_weather_thunder
        GreenhouseAdvice.IconBucket.FOG -> R.drawable.ic_weather_fog
    }

    private fun hintText(context: Context, hint: GreenhouseAdvice.Hint): String = when (hint) {
        GreenhouseAdvice.Hint.Condensation -> context.getString(R.string.hint_condensation)
        GreenhouseAdvice.Hint.CloseVents -> context.getString(R.string.hint_close)
        GreenhouseAdvice.Hint.Ventilate -> context.getString(R.string.hint_ventilate)
        is GreenhouseAdvice.Hint.Water ->
            context.getString(R.string.hint_water, String.format(Locale.US, "%.1f", hint.et0Mm))
        GreenhouseAdvice.Hint.Neutral -> context.getString(R.string.hint_neutral)
    }

    private fun formatTemp(c: Double?): String =
        if (c == null) "—" else "${c.roundToInt()}°"

    private fun refreshPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, WeatherWidgetProvider::class.java).apply {
            action = WeatherWidgetProvider.ACTION_REFRESH
        }
        return PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}

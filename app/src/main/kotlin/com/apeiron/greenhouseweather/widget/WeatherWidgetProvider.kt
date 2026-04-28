package com.apeiron.greenhouseweather.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import com.apeiron.greenhouseweather.work.WeatherUpdateWorker

class WeatherWidgetProvider : AppWidgetProvider() {

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WeatherUpdateWorker.enqueuePeriodic(context)
        WeatherUpdateWorker.enqueueOneShot(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WeatherUpdateWorker.cancel(context)
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { id ->
            appWidgetManager.updateAppWidget(id, WidgetRenderer.buildLoading(context))
        }
        WeatherUpdateWorker.enqueueOneShot(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            WeatherUpdateWorker.enqueueOneShot(context)
        }
    }

    companion object {
        const val ACTION_REFRESH = "com.apeiron.greenhouseweather.ACTION_REFRESH"
    }
}

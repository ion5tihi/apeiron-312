package com.apeiron.greenhouseweather.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.apeiron.greenhouseweather.data.WeatherRepository
import com.apeiron.greenhouseweather.location.LocationProvider
import com.apeiron.greenhouseweather.settings.SettingsStore
import com.apeiron.greenhouseweather.widget.WidgetRenderer
import java.util.concurrent.TimeUnit

class WeatherUpdateWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val ctx = applicationContext
        val repo = WeatherRepository(ctx)
        val settings = SettingsStore(ctx)
        val location = LocationProvider(ctx)

        return runCatching {
            val coords = location.current() ?: settings.loadLocation()
            if (coords != null) {
                val snapshot = repo.refresh(coords.first, coords.second)
                WidgetRenderer.renderAll(ctx, snapshot)
                Result.success()
            } else {
                val cached = repo.loadCached()
                WidgetRenderer.renderAll(ctx, cached)
                Result.retry()
            }
        }.getOrElse { e ->
            val cached = repo.loadCached()
            WidgetRenderer.renderAll(ctx, cached)
            if (runAttemptCount >= MAX_ATTEMPTS) Result.failure() else Result.retry()
        }
    }

    companion object {
        const val UNIQUE_PERIODIC = "greenhouse_weather_periodic"
        const val UNIQUE_ONESHOT = "greenhouse_weather_oneshot"
        private const val MAX_ATTEMPTS = 4

        fun enqueuePeriodic(context: Context) {
            val request = PeriodicWorkRequestBuilder<WeatherUpdateWorker>(30, TimeUnit.MINUTES)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_PERIODIC)
        }

        fun enqueueOneShot(context: Context) {
            val request = androidx.work.OneTimeWorkRequestBuilder<WeatherUpdateWorker>().build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE_ONESHOT,
                androidx.work.ExistingWorkPolicy.REPLACE,
                request
            )
        }
    }
}

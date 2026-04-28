package com.apeiron.greenhouseweather.config

import android.Manifest
import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.apeiron.greenhouseweather.R
import com.apeiron.greenhouseweather.work.WeatherUpdateWorker

class WidgetConfigActivity : AppCompatActivity() {

    private var appWidgetId: Int = AppWidgetManager.INVALID_APPWIDGET_ID

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val granted = result.values.any { it }
        renderState(granted)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(Activity.RESULT_CANCELED)
        setContentView(R.layout.widget_config)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val grantBtn = findViewById<Button>(R.id.btn_grant_location)
        val doneBtn = findViewById<Button>(R.id.btn_done)

        grantBtn.setOnClickListener {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.ACCESS_FINE_LOCATION
                )
            )
        }

        doneBtn.setOnClickListener {
            WeatherUpdateWorker.enqueuePeriodic(this)
            WeatherUpdateWorker.enqueueOneShot(this)
            val resultIntent = Intent().putExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId
            )
            setResult(Activity.RESULT_OK, resultIntent)
            finish()
        }

        renderState(hasLocationPermission())
    }

    private fun renderState(granted: Boolean) {
        val status = findViewById<TextView>(R.id.config_status)
        val doneBtn = findViewById<Button>(R.id.btn_done)
        if (granted) {
            status.text = getString(R.string.config_status_ready)
            doneBtn.isEnabled = true
        } else {
            status.text = getString(R.string.config_status_need_permission)
            doneBtn.isEnabled = false
        }
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }
}

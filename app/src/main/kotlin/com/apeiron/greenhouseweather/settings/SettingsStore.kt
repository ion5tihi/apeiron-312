package com.apeiron.greenhouseweather.settings

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.dataStore by preferencesDataStore(name = "greenhouse_weather")

object SettingsKeys {
    val LAST_LATITUDE = doublePreferencesKey("last_latitude")
    val LAST_LONGITUDE = doublePreferencesKey("last_longitude")
    val LAST_FETCH_MILLIS = longPreferencesKey("last_fetch_millis")
    val LAST_RESPONSE_JSON = stringPreferencesKey("last_response_json")
}

class SettingsStore(private val context: Context) {

    suspend fun saveLocation(lat: Double, lon: Double) {
        context.dataStore.edit { prefs ->
            prefs[SettingsKeys.LAST_LATITUDE] = lat
            prefs[SettingsKeys.LAST_LONGITUDE] = lon
        }
    }

    suspend fun loadLocation(): Pair<Double, Double>? {
        val prefs = context.dataStore.data.first()
        val lat = prefs[SettingsKeys.LAST_LATITUDE] ?: return null
        val lon = prefs[SettingsKeys.LAST_LONGITUDE] ?: return null
        return lat to lon
    }

    suspend fun saveResponse(json: String, fetchedAtMillis: Long) {
        context.dataStore.edit { prefs ->
            prefs[SettingsKeys.LAST_RESPONSE_JSON] = json
            prefs[SettingsKeys.LAST_FETCH_MILLIS] = fetchedAtMillis
        }
    }

    suspend fun loadResponse(): Pair<String, Long>? {
        val prefs: Preferences = context.dataStore.data.first()
        val json = prefs[SettingsKeys.LAST_RESPONSE_JSON] ?: return null
        val ts = prefs[SettingsKeys.LAST_FETCH_MILLIS] ?: return null
        return json to ts
    }
}

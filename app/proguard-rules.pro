# Moshi
-keepclasseswithmembers class * {
    @com.squareup.moshi.* <methods>;
}
-keep class **JsonAdapter { *; }
-keep class com.apeiron.greenhouseweather.data.** { *; }

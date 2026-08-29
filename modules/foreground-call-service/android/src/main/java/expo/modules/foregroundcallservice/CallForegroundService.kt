package expo.modules.foregroundcallservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * خدمة أمامية (Foreground Service) بسيطة ومكتوبة بالكامل داخل المشروع —
 * بدون أي مكتبة خارجية (لا notifee ولا غيرها) — حتى نتحكم بكل سطر فيها
 * ونتجنب أي مشاكل تهيئة native غامضة زي اللي صارت قبل.
 *
 * وظيفتها الوحيدة: طول ما هي شغّالة، أندرويد يعتبر التطبيق "أمامي" (foreground)
 * حتى لو المستخدم فتح تطبيق ثاني، فما يوقف الكاميرا/المايك عن مكالمة الفيديو.
 */
class CallForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "rabahdj_call_channel"
        const val NOTIFICATION_ID = 4821
        const val ACTION_STOP = "expo.modules.foregroundcallservice.STOP"
    }

    override fun onCreate() {
        super.onCreate()
        createChannelIfNeeded()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        val notification = buildNotification()

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            // إذا فشل لأي سبب (مثلاً صلاحية مرفوضة على جهاز معيّن)، لا نكرش التطبيق —
            // فقط نوقف الخدمة بهدوء والمكالمة نفسها تستمر عادي بدون الحماية الإضافية.
            stopSelf()
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
    }

    private fun createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "مكالمة فيديو نشطة",
            NotificationManager.IMPORTANCE_LOW
        )
        channel.description = "يظهر أثناء مكالمة الفيديو حتى تستمر بالعمل في الخلفية"
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("📹 مكالمة فيديو نشطة")
            .setContentText("RabahDj يستمر في البث حتى لو غادرت التطبيق")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()
    }
}

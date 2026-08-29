package expo.modules.foregroundcallservice

import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ForegroundCallServiceModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    override fun definition() = ModuleDefinition {
        Name("ForegroundCallService")

        Function("startService") {
            try {
                val intent = Intent(context, CallForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                // لا نرمي خطأ للجافاسكربت — المكالمة نفسها تستمر بدون
                // هذه الحماية الإضافية بدل ما نكسر تجربة المستخدم كاملة
            }
        }

        Function("stopService") {
            try {
                val intent = Intent(context, CallForegroundService::class.java)
                intent.action = CallForegroundService.ACTION_STOP
                context.startService(intent)
            } catch (e: Exception) {
                // تجاهل بصمت
            }
        }
    }
}

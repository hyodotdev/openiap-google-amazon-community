package dev.openiap.provider.fireos

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.util.Log
import com.amazon.device.iap.PurchasingListener
import com.amazon.device.iap.PurchasingService
import com.amazon.device.iap.model.ProductDataResponse
import com.amazon.device.iap.model.PurchaseResponse
import com.amazon.device.iap.model.PurchaseUpdatesResponse
import com.amazon.device.iap.model.UserDataResponse

// Amazon must observe the first Activity resume before it can show checkout.
class FireOsStartupProvider : ContentProvider() {
    override fun onCreate(): Boolean {
        val application = context?.applicationContext ?: return false
        runCatching { PurchasingService.registerListener(application, PlaceholderListener) }
            // Cold-start checks match this log before the first Activity resume.
            .onSuccess { Log.i(TAG, "Amazon listener registered at process start") }
            .onFailure {
                Log.w(TAG, "Amazon early registration failed; purchase dialogs may not appear", it)
            }
        return true
    }

    // Early receipts remain unfulfilled and recover through getAvailablePurchases.
    internal object PlaceholderListener : PurchasingListener {
        override fun onUserDataResponse(response: UserDataResponse) =
            drop("userData", response.requestId, response.requestStatus)

        override fun onProductDataResponse(response: ProductDataResponse) =
            drop("productData", response.requestId, response.requestStatus)

        override fun onPurchaseResponse(response: PurchaseResponse) =
            drop("purchase", response.requestId, response.requestStatus)

        override fun onPurchaseUpdatesResponse(response: PurchaseUpdatesResponse) =
            drop("purchaseUpdates", response.requestId, response.requestStatus)

        private fun drop(kind: String, requestId: Any?, status: Any?) {
            Log.w(
                TAG,
                "Amazon $kind response $requestId ($status) arrived before FireOsProvider registered; dropped",
            )
        }
    }

    private companion object {
        const val TAG = "OpenIAP"
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor? = null

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int = 0
}

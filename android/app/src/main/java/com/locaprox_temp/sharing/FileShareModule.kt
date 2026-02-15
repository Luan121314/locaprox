package com.locaprox_temp.sharing

import android.content.ClipData
import android.content.Intent
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class FileShareModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun shareFile(filePath: String, mimeType: String?, chooserTitle: String?, promise: Promise) {
    if (filePath.trim().isEmpty()) {
      promise.reject(ERROR_INVALID_PATH, "Caminho do arquivo invalido.")
      return
    }

    try {
      val normalizedPath = if (filePath.startsWith("file://")) {
        filePath.removePrefix("file://")
      } else {
        filePath
      }

      val file = File(normalizedPath)

      if (!file.exists()) {
        promise.reject(ERROR_FILE_NOT_FOUND, "Arquivo nao encontrado para compartilhamento.")
        return
      }

      val authority = "${reactContext.packageName}.fileprovider"
      val contentUri = FileProvider.getUriForFile(reactContext, authority, file)
      val resolvedMimeType = mimeType?.trim()?.ifEmpty { DEFAULT_MIME_TYPE } ?: DEFAULT_MIME_TYPE

      val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = resolvedMimeType
        putExtra(Intent.EXTRA_STREAM, contentUri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        clipData = ClipData.newUri(reactContext.contentResolver, "pdf", contentUri)
      }

      val chooserIntent = Intent.createChooser(
        shareIntent,
        chooserTitle?.trim()?.ifEmpty { DEFAULT_CHOOSER_TITLE } ?: DEFAULT_CHOOSER_TITLE,
      ).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      getCurrentActivity()?.let { activity ->
        activity.startActivity(chooserIntent)
      } ?: run {
        reactContext.startActivity(chooserIntent)
      }

      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject(ERROR_SHARE_FAILED, "Nao foi possivel compartilhar o arquivo.", error)
    }
  }

  private companion object {
    const val NAME = "FileShareModule"
    const val DEFAULT_CHOOSER_TITLE = "Compartilhar arquivo"
    const val DEFAULT_MIME_TYPE = "application/pdf"
    const val ERROR_INVALID_PATH = "E_INVALID_FILE_PATH"
    const val ERROR_FILE_NOT_FOUND = "E_FILE_NOT_FOUND"
    const val ERROR_SHARE_FAILED = "E_SHARE_FILE_FAILED"
  }
}

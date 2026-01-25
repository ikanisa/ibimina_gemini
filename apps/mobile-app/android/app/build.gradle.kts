import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "rw.ibimina.ibimina_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "rw.ibimina.ibimina_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // Signing config for release
            val keystoreFile = project.rootProject.file("key.properties")
            if (keystoreFile.exists()) {
                val props = Properties()
                props.load(FileInputStream(keystoreFile))
                
                signingConfigs.create("release") {
                    storeFile = file(props.getProperty("storeFile"))
                    storePassword = props.getProperty("storePassword")
                    keyAlias = props.getProperty("keyAlias")
                    keyPassword = props.getProperty("keyPassword")
                }
                signingConfig = signingConfigs.getByName("release")
            } else if (System.getenv("KEYSTORE_PATH") != null) {
                 signingConfigs.create("release") {
                    storeFile = file(System.getenv("KEYSTORE_PATH"))
                    storePassword = System.getenv("KEYSTORE_PASSWORD")
                    keyAlias = System.getenv("KEY_ALIAS")
                    keyPassword = System.getenv("KEYSTORE_PASSWORD") // Typo fix: KEY_PASSWORD
                }
                signingConfig = signingConfigs.getByName("release")
            } else {
                 // Fallback to debug signing if no release keys found (DEV ONLY)
                 signingConfig = signingConfigs.getByName("debug")
            }
        }
    }

    flavorDimensions += "env"
    productFlavors {
        create("dev") {
            dimension = "env"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            resValue("string", "app_name", "Ibimina Dev")
        }
        create("prod") {
            dimension = "env"
            resValue("string", "app_name", "Ibimina")
        }
    }
}

flutter {
    source = "../.."
}

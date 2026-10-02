import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import groovy.json.JsonSlurper

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

val coreVersion = providers.gradleProperty("openIapCoreVersion").get()
val protocolVersion = providers.gradleProperty("clientProtocolVersion").get()
val providerMetadata = JsonSlurper().parse(rootProject.file("package.json")) as Map<*, *>
val providerVersion = providerMetadata["version"] as String

android {
    namespace = "dev.openiap.provider.fireos"
    compileSdk = 36
    defaultConfig {
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
        buildConfigField("String", "OPENIAP_CORE_VERSION", "\"$coreVersion\"")
        buildConfigField("String", "CLIENT_PROTOCOL_VERSION", "\"$protocolVersion\"")
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    testOptions { unitTests.isIncludeAndroidResources = true }
    publishing { singleVariant("release") { withSourcesJar() } }
}
kotlin { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } }

dependencies {
    api("io.github.hyochan.openiap:openiap-core:$coreVersion")
    implementation("com.amazon.device:amazon-appstore-sdk:3.0.9")
    testImplementation("io.github.hyochan.openiap:openiap-conformance:${providers.gradleProperty("conformanceVersion").get()}")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.11.0")
    testImplementation("org.robolectric:robolectric:4.16.1")
    testImplementation("androidx.test:core:1.7.0")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                groupId = "dev.openiap.providers"
                artifactId = "openiap-provider-amazon-example"
                version = providerVersion
                pom {
                    name.set("OpenIAP Fire OS provider")
                    description.set("Independent Amazon Appstore binding for the OpenIAP store-provider contract")
                    licenses { license { name.set("MIT"); url.set("https://opensource.org/licenses/MIT") } }
                }
            }
        }
        repositories {
            maven {
                name = "experiment"
                url = uri(providers.gradleProperty("providerRepository").orNull ?: layout.buildDirectory.dir("maven").get().asFile)
            }
        }
    }
}

tasks.withType<Test>().configureEach {
    systemProperty("openiap.conformanceReport", layout.buildDirectory.file("reports/openiap/{storeId}.json").get().asFile.path)
}

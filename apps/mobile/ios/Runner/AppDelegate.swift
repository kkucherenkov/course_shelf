import Flutter
import UIKit
import workmanager_apple

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  /// Must match `kDownloadResumeTask` in
  /// `lib/features/downloads/data/platform_download_scheduler.dart` and the
  /// `BGTaskSchedulerPermittedIdentifiers` entry in `Info.plist`.
  private static let downloadResumeTaskIdentifier = "course-shelf.downloads.resume"

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Registered before super returns: BGTaskScheduler requires every launch
    // handler to be installed by the end of application(_:didFinishLaunching…)
    // and refuses to submit a request whose identifier has no handler.
    //
    // `registerBGProcessingTask` is the counterpart of Dart's
    // `Workmanager().registerProcessingTask(...)` — see
    // workmanager_apple/ios/Sources/workmanager_apple/WorkmanagerPlugin.swift
    // lines 105-117 (this call) and 209-227 (the submit side).
    WorkmanagerPlugin.registerBGProcessingTask(
      withIdentifier: AppDelegate.downloadResumeTaskIdentifier
    )
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}

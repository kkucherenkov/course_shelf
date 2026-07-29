import 'package:equatable/equatable.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';

class DownloadsState extends Equatable {
  const DownloadsState({
    this.items = const <DownloadItem>[],
    this.isLoading = true,
  });

  final List<DownloadItem> items;
  final bool isLoading;

  /// Lets a lesson row ask "what is my download doing?" without scanning.
  DownloadItem? itemFor(String lessonId) {
    for (final DownloadItem item in items) {
      if (item.lessonId == lessonId) return item;
    }
    return null;
  }

  DownloadsState copyWith({List<DownloadItem>? items, bool? isLoading}) =>
      DownloadsState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
      );

  @override
  List<Object?> get props => <Object?>[items, isLoading];
}

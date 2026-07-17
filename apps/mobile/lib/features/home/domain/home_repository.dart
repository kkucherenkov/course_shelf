import 'package:app_mobile/features/home/domain/home_summary.dart';

/// Port — everything the Home tab reads. Implementations live in `data/`.
abstract class HomeRepository {
  /// Loads both Home rows and the library count as one unit. Throws on
  /// failure; the cubit turns that into a single Failed state rather than
  /// letting one dead row poison the others silently.
  Future<HomeSummary> fetchSummary();
}

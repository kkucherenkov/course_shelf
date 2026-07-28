import 'package:shared_preferences/shared_preferences.dart';

/// Device-local persistence for the Search tab's recent-search terms.
///
/// A plain ordered string list (most-recent-first is the caller's concern), so
/// `getStringList`/`setStringList` — no JSON.
class RecentSearchesStore {
  RecentSearchesStore(this._prefs);

  final SharedPreferences _prefs;

  static const String _key = 'search.recents';

  List<String> read() => _prefs.getStringList(_key) ?? const <String>[];

  Future<void> write(List<String> terms) => _prefs.setStringList(_key, terms);
}

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:app_mobile/shared/preferences/recent_searches_store.dart';

Future<RecentSearchesStore> storeWith(Map<String, Object> seed) async {
  SharedPreferences.setMockInitialValues(seed);
  return RecentSearchesStore(await SharedPreferences.getInstance());
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('read() is empty when nothing is stored', () async {
    final store = await storeWith(<String, Object>{});
    expect(store.read(), isEmpty);
  });

  test('write() then read() round-trips, preserving order', () async {
    final store = await storeWith(<String, Object>{});
    await store.write(<String>['replication', 'raft', 'paxos']);
    expect(store.read(), <String>['replication', 'raft', 'paxos']);
  });
}

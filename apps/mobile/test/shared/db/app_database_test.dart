import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';

void main() {
  late AppDatabase db;

  setUp(() => db = AppDatabase(NativeDatabase.memory()));
  tearDown(() => db.close());

  test('schemaVersion is 1', () {
    expect(db.schemaVersion, 1);
  });

  test('onCreate builds the schema from cold', () async {
    // Forces the migrator to run; a broken onCreate throws here.
    await db.customSelect('SELECT 1').get();
    final tables = await db
        .customSelect("SELECT name FROM sqlite_master WHERE type='table'")
        .get();
    final names = tables.map((r) => r.read<String>('name')).toSet();
    expect(names, contains('cached_courses'));
  });
}

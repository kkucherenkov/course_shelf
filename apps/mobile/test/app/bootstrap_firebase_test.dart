import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('bootstrapFirebase degrades gracefully when Firebase is unavailable', () async {
    // The test binding has no Firebase platform, so `Firebase.initializeApp()`
    // throws — exactly the state of a dev build with no google-services config
    // (#177). Boot must survive it: the call must complete, not propagate.
    await expectLater(bootstrapFirebase(), completes);
  });
}

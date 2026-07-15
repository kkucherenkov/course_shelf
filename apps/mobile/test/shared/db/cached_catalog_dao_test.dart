// `isNotNull` collides with the matcher of the same name from
// `package:matcher` (re-exported by flutter_test); the tests below only need
// drift's `Value`, so the query-builder helper is hidden.
import 'package:drift/drift.dart' hide isNotNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:app_mobile/shared/db/app_database.dart';

void main() {
  late AppDatabase db;
  late CachedCatalogDao dao;

  final now = DateTime.utc(2026, 7, 15);

  CachedCoursesCompanion course(String id) => CachedCoursesCompanion.insert(
        id: id,
        libraryId: 'lib1',
        slug: 'slug-$id',
        title: 'Course $id',
        updatedAt: now,
        cachedAt: now,
        payload: '{"id":"$id"}',
      );

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    dao = db.cachedCatalogDao;
  });
  tearDown(() => db.close());

  test('round-trips a course', () async {
    await dao.upsertCourse(course('c1'));
    final got = await dao.courseById('c1');
    expect(got, isNotNull);
    expect(got!.title, 'Course c1');
    expect(got.payload, '{"id":"c1"}');
  });

  test('upsert replaces rather than duplicating', () async {
    await dao.upsertCourse(course('c1'));
    await dao.upsertCourse(
      course('c1').copyWith(title: const Value('Renamed')),
    );
    final all = await dao.allCourses();
    expect(all.length, 1);
    expect(all.single.title, 'Renamed');
  });

  test('replaceOutline stores sections and lessons', () async {
    await dao.upsertCourse(course('c1'));
    await dao.replaceOutline(
      courseId: 'c1',
      sections: [
        CachedSectionsCompanion.insert(
          id: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
      lessons: [
        CachedLessonsCompanion.insert(
          id: 'l1',
          sectionId: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
    );
    final lessons = await dao.lessonsForCourse('c1');
    expect(lessons.length, 1);
    expect(lessons.single.id, 'l1');
  });

  test('replaceOutline is idempotent — re-running does not duplicate', () async {
    await dao.upsertCourse(course('c1'));
    Future<void> write() => dao.replaceOutline(
          courseId: 'c1',
          sections: [
            CachedSectionsCompanion.insert(
              id: 's1',
              courseId: 'c1',
              position: 0,
              cachedAt: now,
              payload: '{}',
            ),
          ],
          lessons: [
            CachedLessonsCompanion.insert(
              id: 'l1',
              sectionId: 's1',
              courseId: 'c1',
              position: 0,
              cachedAt: now,
              payload: '{}',
            ),
          ],
        );
    await write();
    await write();
    expect((await dao.lessonsForCourse('c1')).length, 1);
  });

  test('deleting a course cascades to its lessons', () async {
    await dao.upsertCourse(course('c1'));
    await dao.replaceOutline(
      courseId: 'c1',
      sections: [
        CachedSectionsCompanion.insert(
          id: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
      lessons: [
        CachedLessonsCompanion.insert(
          id: 'l1',
          sectionId: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
    );
    await (db.delete(db.cachedCourses)..where((t) => t.id.equals('c1'))).go();
    expect(await dao.lessonsForCourse('c1'), isEmpty);
  });

  test('replaceOutline drops rows the server no longer returns', () async {
    // First write: two sections (s1, s2) with two lessons (l1 under s1, l2 under s2).
    await dao.upsertCourse(course('c1'));
    await dao.replaceOutline(
      courseId: 'c1',
      sections: [
        CachedSectionsCompanion.insert(
          id: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
        CachedSectionsCompanion.insert(
          id: 's2',
          courseId: 'c1',
          position: 1,
          cachedAt: now,
          payload: '{}',
        ),
      ],
      lessons: [
        CachedLessonsCompanion.insert(
          id: 'l1',
          sectionId: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
        CachedLessonsCompanion.insert(
          id: 'l2',
          sectionId: 's2',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
    );

    // Second write: server now only returns s1/l1. Without the delete-before-insert,
    // l2 and s2 would remain in the cache forever.
    await dao.replaceOutline(
      courseId: 'c1',
      sections: [
        CachedSectionsCompanion.insert(
          id: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
      lessons: [
        CachedLessonsCompanion.insert(
          id: 'l1',
          sectionId: 's1',
          courseId: 'c1',
          position: 0,
          cachedAt: now,
          payload: '{}',
        ),
      ],
    );

    // Verify orphaned lesson is gone.
    final lessons = await dao.lessonsForCourse('c1');
    expect(lessons.length, 1);
    expect(lessons.single.id, 'l1');

    // Verify orphaned section is gone.
    final sections = await (db.select(db.cachedSections)
          ..where((t) => t.courseId.equals('c1')))
        .get();
    expect(sections, hasLength(1));
    expect(sections.single.id, 's1');
  });
}
